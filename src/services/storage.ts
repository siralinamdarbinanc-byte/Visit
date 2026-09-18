import { Store, Visit, FollowUp, SyncQueueItem, ConnectionState, UserLocation, StoreCategory, CustomerStatus } from '../types';
import { db } from '../db/database';
import { ensureDatabaseSeeded, seedInitialData } from '../db/seed';
import { syncService } from './sync';
import {
  normalizePersianText,
  normalizePhoneNumber,
  toPersianDigits,
  formatDistance,
  getPersianDateString,
  getPersianTimeString,
  getPersianFullDateTime,
} from '../utils/persian';
import { exportAllDataJSON, exportStoresCSV, exportVisitsCSV, importBackupJSON } from '../utils/export';

// Re-export helper utilities for existing components
export { toPersianDigits, formatDistance, getPersianDateString, getPersianTimeString, getPersianFullDateTime };

// Calculate distance in meters between two lat/lng pairs using Haversine formula
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  matchedStore?: Store;
  reason?: string;
}

/**
 * FieldStorageService provides complete CRUD and querying over IndexedDB (Dexie)
 * with syncQueue generation and in-memory cache for instant UI rendering.
 */
export class FieldStorageService {
  private static cachedStores: Store[] = [];
  private static cachedVisits: Visit[] = [];
  private static cachedFollowUps: FollowUp[] = [];
  private static isInitialized = false;

  private static userLocation: UserLocation = {
    latitude: 35.6892,
    longitude: 51.4258,
    accuracy: 12,
    timestamp: Date.now(),
    areaName: 'تهران، منطقه ۱۲، راسته چراغ‌برق (خیابان ملت)',
  };
  private static connectionState: ConnectionState = typeof navigator !== 'undefined' && navigator.onLine ? 'online' : 'offline';

  public static getUserLocation(): UserLocation {
    return this.userLocation;
  }

  public static setUserLocation(loc: UserLocation): void {
    this.userLocation = loc;
  }

  public static getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  public static setConnectionState(state: ConnectionState): void {
    this.connectionState = state;
  }

  /**
   * Initializes the database, seeds initial market stores if empty, and hydrates cache.
   */
  public static async init(): Promise<void> {
    await ensureDatabaseSeeded();
    await this.refreshCache();
    this.isInitialized = true;
  }

  /**
   * Refreshes in-memory cache from IndexedDB
   */
  public static async refreshCache(): Promise<void> {
    this.cachedStores = await db.stores.toArray();
    this.cachedVisits = await db.visits.reverse().sortBy('created_at');
    this.cachedFollowUps = await db.followups.reverse().sortBy('created_at');
  }

  // ================= STORES CRUD =================

  /**
   * Get stores with real-time distance calculations from current user GPS
   */
  public static getStores(currentLoc?: UserLocation): Store[] {
    const stores = [...this.cachedStores];
    if (!currentLoc) return stores;

    return stores.map((s) => ({
      ...s,
      distance: calculateDistance(currentLoc.latitude, currentLoc.longitude, s.latitude, s.longitude),
    }));
  }

  public static async getStoresAsync(currentLoc?: UserLocation): Promise<Store[]> {
    if (!this.isInitialized) {
      await this.init();
    }
    return this.getStores(currentLoc);
  }

  public static getStoreById(id: string): Store | undefined {
    return this.cachedStores.find((s) => s.id === id);
  }

  public static async getStoreByIdAsync(id: string): Promise<Store | undefined> {
    return await db.stores.get(id);
  }

  /**
   * Duplicate Store Detection
   * Checks phone, mobile, similar name, or nearby location (within 20m)
   */
  public static async checkDuplicateStore(
    candidate: Partial<Store>,
    currentStoreId?: string
  ): Promise<DuplicateCheckResult> {
    const all = await db.stores.toArray();
    const otherStores = currentStoreId ? all.filter((s) => s.id !== currentStoreId) : all;

    const candMobile = normalizePhoneNumber(candidate.mobile || '');
    const candPhone = normalizePhoneNumber(candidate.phone || '');
    const candNameNorm = normalizePersianText(candidate.name || '');

    for (const store of otherStores) {
      // 1. Mobile match
      if (candMobile && candMobile.length >= 10 && normalizePhoneNumber(store.mobile) === candMobile) {
        return {
          isDuplicate: true,
          matchedStore: store,
          reason: `شماره همراه وارد شده قبلاً برای فروشگاه «${store.name}» ثبت شده است.`,
        };
      }

      // 2. Phone match
      if (candPhone && candPhone.length >= 8 && normalizePhoneNumber(store.phone) === candPhone) {
        return {
          isDuplicate: true,
          matchedStore: store,
          reason: `شماره تلفن ثابت وارد شده قبلاً برای فروشگاه «${store.name}» ثبت شده است.`,
        };
      }

      // 3. Exact or very close name match in the same area
      const storeNameNorm = normalizePersianText(store.name);
      if (candNameNorm && storeNameNorm === candNameNorm && normalizePersianText(store.area) === normalizePersianText(candidate.area || '')) {
        return {
          isDuplicate: true,
          matchedStore: store,
          reason: `فروشگاهی با همین نام در منطقه «${store.area}» ثبت شده است.`,
        };
      }

      // 4. Very close geographic proximity (under 20 meters)
      if (
        candidate.latitude &&
        candidate.longitude &&
        calculateDistance(candidate.latitude, candidate.longitude, store.latitude, store.longitude) < 20
      ) {
        return {
          isDuplicate: true,
          matchedStore: store,
          reason: `یک فروشگاه دیگر («${store.name}») در فاصله کمتر از ۲۰ متری این مختصات قرار دارد.`,
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Save or Update a store in IndexedDB and enqueue sync
   */
  public static async saveStoreAsync(
    storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Promise<Store> {
    const now = new Date();
    const jalaliDate = getPersianDateString(now);

    let savedStore: Store;
    const isEdit = Boolean(storeData.id);

    if (isEdit && storeData.id) {
      const existing = await db.stores.get(storeData.id);
      savedStore = {
        ...storeData,
        id: storeData.id,
        created_at: existing?.created_at || jalaliDate,
        updated_at: jalaliDate,
        visit_count: existing?.visit_count || 0,
        last_visit_date: existing?.last_visit_date,
        last_visit_result: existing?.last_visit_result,
        photos: storeData.photos || existing?.photos || [],
      } as Store;

      await db.stores.put(savedStore);
      await syncService.enqueue('UPDATE', 'STORE', savedStore.id, savedStore);
    } else {
      const newId = `store-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
      savedStore = {
        ...storeData,
        id: newId,
        photos: storeData.photos || [],
        created_at: jalaliDate,
        updated_at: jalaliDate,
        visit_count: 0,
      } as Store;

      await db.stores.add(savedStore);
      await syncService.enqueue('CREATE', 'STORE', newId, savedStore);
    }

    await this.refreshCache();
    return savedStore;
  }

  /**
   * Sync-compatible wrapper for saveStore
   */
  public static saveStore(
    storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'> & { id?: string }
  ): Store {
    // Optimistic cache update immediately
    const jalaliDate = getPersianDateString(new Date());
    const newId = storeData.id || `store-${Date.now()}`;
    const optimistic: Store = {
      ...storeData,
      id: newId,
      created_at: jalaliDate,
      updated_at: jalaliDate,
      photos: storeData.photos || [],
      visit_count: 0,
    } as Store;

    // Trigger async persistence
    this.saveStoreAsync(storeData).catch(console.error);

    return optimistic;
  }

  public static addStore(storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Store {
    return this.saveStore(storeData);
  }

  /**
   * Delete a store and its related visits/followups
   */
  public static async deleteStoreAsync(id: string): Promise<void> {
    await db.transaction('rw', [db.stores, db.visits, db.followups, db.syncQueue], async () => {
      await db.stores.delete(id);
      await db.visits.where('store_id').equals(id).delete();
      await db.followups.where('store_id').equals(id).delete();
    });
    await syncService.enqueue('DELETE', 'STORE', id, { id });
    await this.refreshCache();
  }

  public static deleteStore(id: string): void {
    this.deleteStoreAsync(id).catch(console.error);
  }

  /**
   * Add photo to a store
   */
  public static async addPhotoToStoreAsync(
    storeId: string,
    url: string,
    caption?: string,
    type: 'storefront' | 'sign' | 'business_card' | 'shelf' | 'other' = 'storefront'
  ): Promise<void> {
    const store = await db.stores.get(storeId);
    if (!store) return;

    if (!store.photos) store.photos = [];
    store.photos.push({
      id: `photo-${Date.now()}`,
      type,
      url,
      caption,
      created_at: getPersianDateString(),
    });

    await db.stores.put(store);
    await syncService.enqueue('UPDATE', 'STORE', storeId, store);
    await this.refreshCache();
  }

  public static addPhotoToStore(storeId: string, url: string, caption?: string): void {
    this.addPhotoToStoreAsync(storeId, url, caption).catch(console.error);
  }

  public static async removePhotoFromStoreAsync(storeId: string, photoId: string): Promise<void> {
    const store = await db.stores.get(storeId);
    if (!store || !store.photos) return;

    store.photos = store.photos.filter((p) => p.id !== photoId);
    await db.stores.put(store);
    await syncService.enqueue('UPDATE', 'STORE', storeId, store);
    await this.refreshCache();
  }

  public static removePhotoFromStore(storeId: string, photoId: string): void {
    this.removePhotoFromStoreAsync(storeId, photoId).catch(console.error);
  }

  // ================= VISITS CRUD =================

  public static getVisits(): Visit[] {
    return [...this.cachedVisits];
  }

  public static async getVisitsAsync(): Promise<Visit[]> {
    return await db.visits.reverse().sortBy('created_at');
  }

  public static async addVisitAsync(visitData: Omit<Visit, 'id' | 'created_at'>): Promise<Visit> {
    const newId = `v-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newVisit: Visit = {
      ...visitData,
      id: newId,
      created_at: new Date().toISOString(),
    };

    await db.visits.add(newVisit);

    // Update store stats
    const store = await db.stores.get(visitData.store_id);
    if (store) {
      store.last_visit_date = visitData.date;
      store.last_visit_result = visitData.result;
      store.visit_count = (store.visit_count || 0) + 1;
      await db.stores.put(store);
      await syncService.enqueue('UPDATE', 'STORE', store.id, store);
    }

    // Auto create follow-up if date specified
    if (visitData.next_followup) {
      await this.addFollowUpAsync({
        store_id: visitData.store_id,
        store_name: visitData.store_name,
        phone: store?.mobile || store?.phone || '',
        area: store?.area || 'مرکز بازار',
        date: visitData.next_followup,
        note: `پیگیری پیرامون نتیجه ویزیت: ${visitData.note || 'مذاکره حضوری'}`,
        status: 'pending',
        last_visit_date: visitData.date,
      });
    }

    await syncService.enqueue('CREATE', 'VISIT', newId, newVisit);
    await this.refreshCache();
    return newVisit;
  }

  public static addVisit(visitData: Omit<Visit, 'id' | 'created_at'>): Visit {
    const newId = `v-${Date.now()}`;
    const optimistic: Visit = {
      ...visitData,
      id: newId,
      created_at: new Date().toISOString(),
    };
    this.addVisitAsync(visitData).catch(console.error);
    return optimistic;
  }

  // ================= FOLLOW-UPS CRUD =================

  public static getFollowUps(): FollowUp[] {
    return [...this.cachedFollowUps];
  }

  public static async getFollowUpsAsync(): Promise<FollowUp[]> {
    return await db.followups.reverse().sortBy('created_at');
  }

  public static async addFollowUpAsync(item: Omit<FollowUp, 'id' | 'created_at'>): Promise<FollowUp> {
    const newId = `f-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newItem: FollowUp = {
      ...item,
      id: newId,
      created_at: new Date().toISOString(),
    };

    await db.followups.add(newItem);
    await syncService.enqueue('CREATE', 'FOLLOW_UP', newId, newItem);
    await this.refreshCache();
    return newItem;
  }

  public static addFollowUp(item: Omit<FollowUp, 'id' | 'created_at'>): FollowUp {
    const newId = `f-${Date.now()}`;
    const optimistic: FollowUp = {
      ...item,
      id: newId,
      created_at: new Date().toISOString(),
    };
    this.addFollowUpAsync(item).catch(console.error);
    return optimistic;
  }

  public static async updateFollowUpStatusAsync(
    id: string,
    status: 'pending' | 'completed' | 'postponed' | 'overdue'
  ): Promise<void> {
    const item = await db.followups.get(id);
    if (item) {
      item.status = status;
      await db.followups.put(item);
      await syncService.enqueue('UPDATE', 'FOLLOW_UP', id, item);
      await this.refreshCache();
    }
  }

  public static updateFollowUpStatus(id: string, status: 'pending' | 'completed' | 'postponed' | 'overdue'): void {
    this.updateFollowUpStatusAsync(id, status).catch(console.error);
  }

  public static async deleteFollowUpAsync(id: string): Promise<void> {
    await db.followups.delete(id);
    await syncService.enqueue('DELETE', 'FOLLOW_UP', id, { id });
    await this.refreshCache();
  }

  // ================= SYNC ARCHITECTURE =================

  public static async getSyncQueueAsync(): Promise<SyncQueueItem[]> {
    return await db.syncQueue.toArray();
  }

  public static getSyncQueue(): SyncQueueItem[] {
    // Read from IndexedDB asynchronously or return empty
    return [];
  }

  public static async getSyncStatsAsync() {
    return await syncService.getSyncStats();
  }

  public static async performManualSyncAsync() {
    return await syncService.performSync();
  }

  public static async retryFailedSyncAsync() {
    return await syncService.retryFailedItems();
  }

  public static async clearSyncQueueAsync() {
    return await syncService.clearQueue();
  }

  // ================= BACKUP & EXPORT =================

  public static async exportAllDataJSONAsync(): Promise<string> {
    return await exportAllDataJSON();
  }

  public static exportAllDataJSON(): string {
    return JSON.stringify({
      version: 1,
      exported_at: new Date().toISOString(),
      app: 'Visit Field Sales CRM',
      stores: this.cachedStores,
      visits: this.cachedVisits,
      followups: this.cachedFollowUps,
    }, null, 2);
  }

  public static async exportStoresCSVAsync(): Promise<string> {
    return await exportStoresCSV();
  }

  public static exportStoresCSV(): string {
    const headers = ['شناسه', 'نام فروشگاه', 'مدیر', 'همراه', 'تلفن', 'صنف', 'منطقه', 'آدرس', 'وضعیت', 'برندها'];
    const rows = this.cachedStores.map((s) => [
      `"${s.id}"`,
      `"${s.name}"`,
      `"${s.owner}"`,
      `"${s.mobile}"`,
      `"${s.phone}"`,
      `"${s.category}"`,
      `"${s.area}"`,
      `"${s.address}"`,
      `"${s.customer_status}"`,
      `"${(s.brands || []).join('، ')}"`,
    ]);
    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  }

  public static async exportVisitsCSVAsync(): Promise<string> {
    return await exportVisitsCSV();
  }

  public static async importBackupAsync(jsonString: string): Promise<{ success: boolean; count?: number; error?: string }> {
    const result = await importBackupJSON(jsonString);
    if (result.success) {
      await this.refreshCache();
    }
    return result;
  }

  public static importBackup(jsonString: string): boolean {
    this.importBackupAsync(jsonString).catch(console.error);
    return true;
  }

  public static async resetToDefaultAsync(): Promise<void> {
    await seedInitialData();
    await this.refreshCache();
  }

  public static resetToDefault(): void {
    this.resetToDefaultAsync().catch(console.error);
  }
}
