import { db, getOrCreateDeviceId } from '../db/database';
import { SyncQueueItem, SyncHistoryItem, SyncStats, Store, Visit, FollowUp } from '../types';
import { getPersianFullDateTime, getPersianDateString, getPersianTimeString } from '../utils/persian';

export type { SyncStats };

export interface SyncPushResult {
  success: boolean;
  syncedIds: string[];
  failedIds: string[];
  error?: string;
}

export interface SyncPullResult {
  success: boolean;
  stores?: Store[];
  visits?: Visit[];
  followups?: FollowUp[];
  timestamp?: string;
  error?: string;
}

class SyncService {
  /**
   * Enqueues an operation into IndexedDB syncQueue
   */
  public async enqueue(
    operation: 'CREATE' | 'UPDATE' | 'DELETE',
    entity: 'STORE' | 'VISIT' | 'FOLLOW_UP',
    entity_id: string,
    payload: any
  ): Promise<void> {
    const device_id = await getOrCreateDeviceId();
    const now = new Date().toISOString();

    const queueItem: SyncQueueItem = {
      id: `sync_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      operation,
      entity,
      entity_id,
      payload,
      created_at: now,
      updated_at: now,
      retry_count: 0,
      device_id,
      synced: false,
    };

    await db.syncQueue.put(queueItem);
  }

  /**
   * Retrieves current sync statistics strictly from real IndexedDB data
   */
  public async getSyncStats(): Promise<SyncStats> {
    const allQueue = await db.syncQueue.toArray();
    const pending = allQueue.filter((q) => !q.synced);
    const failed = pending.filter((q) => (q.retry_count || 0) > 0);

    const lastSyncSetting = await db.settings.get('last_successful_sync');
    const uploadedSetting = await db.settings.get('total_items_uploaded');
    const downloadedSetting = await db.settings.get('total_items_downloaded');
    const lastErrorSetting = await db.settings.get('last_sync_error');

    return {
      pendingCount: pending.length,
      failedCount: failed.length,
      uploaded: uploadedSetting?.value || 0,
      downloaded: downloadedSetting?.value || 0,
      lastSync: lastSyncSetting?.value || 'تاکنون همگام نشده',
      lastError: lastErrorSetting?.value,
    };
  }

  /**
   * Retrieves real sync history from IndexedDB
   */
  public async getHistory(): Promise<SyncHistoryItem[]> {
    return await db.syncHistory.orderBy('id').reverse().limit(30).toArray();
  }

  /**
   * Adds an entry to the sync history log
   */
  public async logHistory(text: string, type: 'info' | 'success' | 'warning' | 'error', count?: number): Promise<void> {
    const item: SyncHistoryItem = {
      id: 'hist_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      time: getPersianFullDateTime(),
      text,
      type,
      item_count: count,
    };
    await db.syncHistory.add(item);
  }

  /**
   * Executes sync against Cloudflare Worker D1 backend if configured, or validates local queue.
   */
  public async performSync(): Promise<{
    success: boolean;
    message: string;
    syncedCount: number;
    pendingRemaining: number;
    error?: string;
  }> {
    const customEndpoint = typeof window !== 'undefined' ? (localStorage.getItem('field_command_d1_endpoint') || '').trim() : '';
    const apiUrl = customEndpoint || (typeof window !== 'undefined' ? (import.meta.env?.VITE_CF_D1_API_URL || '') : '');
    const pendingItems = await db.syncQueue.filter((q) => !q.synced).toArray();

    if (!apiUrl) {
      // Backend not yet deployed - provide truthful, transparent message
      const msg = `آدرس سرور ابری D1 هنوز در تنظیمات (.env) متصل نشده است. کلیه ${pendingItems.length} تغییر در صف محلی IndexedDB به صورت امن و پایدار نگهداری می‌شود.`;
      await this.logHistory(msg, 'warning', pendingItems.length);
      await db.settings.put({ key: 'last_sync_error', value: 'سرور ابری D1 پیکربندی نشده است.' });
      return { success: false, message: msg, syncedCount: 0, pendingRemaining: pendingItems.length, error: 'سرور ابری D1 پیکربندی نشده است' };
    }

    try {
      // Real API call to Cloudflare Worker
      const response = await fetch(`${apiUrl}/api/sync/push`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: pendingItems }),
      });

      if (!response.ok) {
        throw new Error(`خطای سرور: ${response.status} ${response.statusText}`);
      }

      const result: SyncPushResult = await response.json();
      if (result.success && result.syncedIds.length > 0) {
        // Mark items as synced or remove from queue
        await db.syncQueue.bulkDelete(result.syncedIds);

        const currentUploaded = (await db.settings.get('total_items_uploaded'))?.value || 0;
        await db.settings.put({
          key: 'total_items_uploaded',
          value: currentUploaded + result.syncedIds.length,
        });
        await db.settings.put({
          key: 'last_successful_sync',
          value: getPersianFullDateTime(),
        });
        await db.settings.delete('last_sync_error');

        const successMsg = `تعداد ${result.syncedIds.length} بسته با موفقیت به سرور ابری D1 ارسال شد.`;
        await this.logHistory(successMsg, 'success', result.syncedIds.length);

        const remaining = await db.syncQueue.filter((q) => !q.synced).count();
        return { success: true, message: successMsg, syncedCount: result.syncedIds.length, pendingRemaining: remaining };
      } else {
        throw new Error(result.error || 'پاسخ نامعتبر از سرور D1');
      }
    } catch (err: any) {
      // Increment retry count on pending items
      for (const item of pendingItems) {
        await db.syncQueue.update(item.id, {
          retry_count: (item.retry_count || 0) + 1,
          last_error: err?.message || 'خطای شبکه',
          updated_at: new Date().toISOString(),
        });
      }

      const errMsg = `خطا در همگام‌سازی با D1: ${err?.message || 'عدم دسترسی به سرور'}`;
      await db.settings.put({ key: 'last_sync_error', value: errMsg });
      await this.logHistory(errMsg, 'error', pendingItems.length);
      return { success: false, message: errMsg, syncedCount: 0, pendingRemaining: pendingItems.length, error: errMsg };
    }
  }

  /**
   * Retries failed items
   */
  public async retryFailedItems(): Promise<{ success: boolean; message: string; syncedCount: number }> {
    const failedItems = await db.syncQueue.filter((q) => (q.retry_count || 0) > 0).toArray();
    for (const item of failedItems) {
      await db.syncQueue.update(item.id, { retry_count: 0, last_error: undefined });
    }
    const syncRes = await this.performSync();
    return { success: syncRes.success, message: syncRes.message, syncedCount: failedItems.length };
  }

  /**
   * Clears the pending queue (requires explicit confirmation)
   */
  public async clearQueue(): Promise<void> {
    await db.syncQueue.clear();
    await this.logHistory('صف تغییرات محلی توسط کاربر پاکسازی شد.', 'warning');
  }
}

export const syncService = new SyncService();
