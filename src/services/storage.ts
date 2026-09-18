import { Store, Visit, FollowUp, SyncQueueItem, ConnectionState, UserLocation, StoreCategory, CustomerStatus } from '../types';
import { INITIAL_STORES, INITIAL_VISITS, INITIAL_FOLLOWUPS, INITIAL_USER_LOCATION } from '../data/mockStores';

const STORAGE_KEYS = {
  STORES: 'field_command_stores_v1',
  VISITS: 'field_command_visits_v1',
  FOLLOWUPS: 'field_command_followups_v1',
  SYNC_QUEUE: 'field_command_sync_queue_v1',
  SYNC_HISTORY: 'field_command_sync_history_v1',
  SYNC_STATS: 'field_command_sync_stats_v1',
  USER_LOCATION: 'field_command_user_loc_v1',
  CONNECTION_STATE: 'field_command_conn_state_v1',
};

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

// Format meters to human readable Persian string
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${meters} متر`;
  }
  const km = (meters / 1000).toFixed(1);
  return `${km} کیلومتر`;
}

// Convert English numbers to Persian digits
export function toPersianDigits(num: string | number): string {
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return String(num).replace(/[0-9]/g, (w) => persianDigits[+w]);
}

export class FieldStorageService {
  // --- Stores ---
  static getStores(currentLoc?: UserLocation): Store[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STORES);
      let stores: Store[] = data ? JSON.parse(data) : INITIAL_STORES;
      const loc = currentLoc || this.getUserLocation();

      // Calculate distance for all stores from current location
      stores = stores.map((s) => ({
        ...s,
        distance: calculateDistance(loc.latitude, loc.longitude, s.latitude, s.longitude),
      }));

      return stores;
    } catch {
      return INITIAL_STORES;
    }
  }

  static getStoreById(id: string): Store | undefined {
    const stores = this.getStores();
    return stores.find((s) => s.id === id);
  }

  static addStore(storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>): Store {
    return this.saveStore(storeData);
  }

  static addPhotoToStore(storeId: string, url: string, caption?: string): void {
    const stores = this.getStores();
    const store = stores.find((s) => s.id === storeId);
    if (store) {
      if (!store.photos) store.photos = [];
      store.photos.push({
        id: `photo-${Date.now()}`,
        type: 'storefront',
        url,
        caption,
        created_at: this.getPersianDateString(new Date()),
      });
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
      this.enqueueSync('UPDATE', 'STORE', storeId, store);
    }
  }

  static saveStore(storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'> & { id?: string }): Store {
    const stores = this.getStores();
    const now = new Date();
    const jalaliDate = this.getPersianDateString(now);

    let savedStore: Store;
    if (storeData.id) {
      // Edit
      savedStore = {
        ...storeData,
        id: storeData.id,
        created_at: stores.find((s) => s.id === storeData.id)?.created_at || jalaliDate,
        updated_at: jalaliDate,
      } as Store;
      const index = stores.findIndex((s) => s.id === storeData.id);
      if (index !== -1) {
        stores[index] = savedStore;
      }
      this.enqueueSync('UPDATE', 'STORE', savedStore.id, savedStore);
    } else {
      // Create new
      const newId = `store-${Date.now()}`;
      savedStore = {
        ...storeData,
        id: newId,
        photos: storeData.photos || [],
        created_at: jalaliDate,
        updated_at: jalaliDate,
        visit_count: 0,
      } as Store;
      stores.unshift(savedStore);
      this.enqueueSync('CREATE', 'STORE', newId, savedStore);
    }

    localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    return savedStore;
  }

  // --- Visits ---
  static getVisits(): Visit[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.VISITS);
      return data ? JSON.parse(data) : INITIAL_VISITS;
    } catch {
      return INITIAL_VISITS;
    }
  }

  static addVisit(visitData: Omit<Visit, 'id' | 'created_at'>): Visit {
    const visits = this.getVisits();
    const now = new Date();
    const newId = `v-${Date.now()}`;
    const newVisit: Visit = {
      ...visitData,
      id: newId,
      created_at: now.toISOString(),
    };
    visits.unshift(newVisit);
    localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(visits));

    // Also update the store's last visit date and result
    const stores = this.getStores();
    const store = stores.find((s) => s.id === visitData.store_id);
    if (store) {
      store.last_visit_date = visitData.date;
      store.last_visit_result = visitData.result;
      store.visit_count = (store.visit_count || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(stores));
    }

    // If follow-up specified, auto create follow-up item
    if (visitData.next_followup) {
      this.addFollowUp({
        store_id: visitData.store_id,
        store_name: visitData.store_name,
        phone: store?.mobile || '',
        area: store?.area || 'نامشخص',
        date: visitData.next_followup,
        note: `پیگیری پیرامون نتیجه ویزیت: ${visitData.note || 'جلسه حضوری'}`,
        status: 'pending',
        last_visit_date: visitData.date,
      });
    }

    this.enqueueSync('CREATE', 'VISIT', newId, newVisit);
    return newVisit;
  }

  // --- Follow-ups ---
  static getFollowUps(): FollowUp[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.FOLLOWUPS);
      return data ? JSON.parse(data) : INITIAL_FOLLOWUPS;
    } catch {
      return INITIAL_FOLLOWUPS;
    }
  }

  static addFollowUp(item: Omit<FollowUp, 'id' | 'created_at'>): FollowUp {
    const items = this.getFollowUps();
    const newId = `f-${Date.now()}`;
    const newItem: FollowUp = {
      ...item,
      id: newId,
      created_at: new Date().toISOString(),
    };
    items.unshift(newItem);
    localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(items));
    this.enqueueSync('CREATE', 'FOLLOW_UP', newId, newItem);
    return newItem;
  }

  static updateFollowUpStatus(id: string, status: 'pending' | 'completed' | 'postponed' | 'overdue'): void {
    const items = this.getFollowUps();
    const item = items.find((f) => f.id === id);
    if (item) {
      item.status = status;
      localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(items));
      this.enqueueSync('UPDATE', 'FOLLOW_UP', id, item);
    }
  }

  // --- User Location & Compass ---
  static getUserLocation(): UserLocation {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_LOCATION);
      return data ? JSON.parse(data) : INITIAL_USER_LOCATION;
    } catch {
      return INITIAL_USER_LOCATION;
    }
  }

  static setUserLocation(loc: UserLocation): void {
    localStorage.setItem(STORAGE_KEYS.USER_LOCATION, JSON.stringify(loc));
  }

  static simulateDriveMovement(): UserLocation {
    const current = this.getUserLocation();
    // Simulate slight movement heading along Ekbatan / Mellat street
    const deltaLat = (Math.random() - 0.5) * 0.0008;
    const deltaLng = (Math.random() - 0.5) * 0.0008;
    const updated: UserLocation = {
      ...current,
      latitude: current.latitude + deltaLat,
      longitude: current.longitude + deltaLng,
      speed: Math.floor(15 + Math.random() * 25),
      heading: ((current.heading || 0) + 15) % 360,
    };
    this.setUserLocation(updated);
    return updated;
  }

  // --- Connection & Offline Mode ---
  static getConnectionState(): ConnectionState {
    try {
      const state = localStorage.getItem(STORAGE_KEYS.CONNECTION_STATE);
      return (state as ConnectionState) || 'online';
    } catch {
      return 'online';
    }
  }

  static setConnectionState(state: ConnectionState): void {
    localStorage.setItem(STORAGE_KEYS.CONNECTION_STATE, state);
  }

  // --- Sync Queue & Cloud Engine ---
  static getSyncQueue(): SyncQueueItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_QUEUE);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  static enqueueSync(operation: SyncQueueItem['operation'], entity: SyncQueueItem['entity'], entity_id: string, payload: any): void {
    const queue = this.getSyncQueue();
    const queueItem: SyncQueueItem = {
      id: `sq-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      operation,
      entity,
      entity_id,
      payload,
      created_at: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      synced: false,
    };
    queue.push(queueItem);
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify(queue));
  }

  static getSyncStats(): { uploaded: number; downloaded: number; lastSync: string } {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_STATS);
      return data ? JSON.parse(data) : { uploaded: 124, downloaded: 87, lastSync: 'امروز ۱۴:۳۲' };
    } catch {
      return { uploaded: 124, downloaded: 87, lastSync: 'امروز ۱۴:۳۲' };
    }
  }

  static getSyncHistory(): Array<{ time: string; text: string; count: number; success: boolean }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SYNC_HISTORY);
      return data ? JSON.parse(data) : [
        { time: '۱۴:۳۲', text: 'همگام‌سازی کامل با پایگاه ابری با موفقیت انجام شد', count: 12, success: true },
        { time: '۱۳:۵۰', text: 'ارسال ۷ تغییر محلی و دریافت ۳ به‌روزرسانی سرور', count: 7, success: true },
        { time: '۱۱:۱۵', text: 'اتصال مجدد بعد از قطع پوشش دکل مخابراتی', count: 4, success: true }
      ];
    } catch {
      return [];
    }
  }

  static async performManualSync(): Promise<{ syncedCount: number }> {
    const queue = this.getSyncQueue();
    const count = queue.length;
    const nowPersianTime = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

    // Clear queue
    localStorage.setItem(STORAGE_KEYS.SYNC_QUEUE, JSON.stringify([]));

    // Update stats
    const stats = this.getSyncStats();
    const newStats = {
      uploaded: stats.uploaded + count,
      downloaded: stats.downloaded + Math.floor(Math.random() * 5),
      lastSync: `امروز ${nowPersianTime}`,
    };
    localStorage.setItem(STORAGE_KEYS.SYNC_STATS, JSON.stringify(newStats));

    // Add to history
    const history = this.getSyncHistory();
    history.unshift({
      time: nowPersianTime,
      text: count > 0 ? `ارسال ${count} رکورد به سرور و اتمام پردازش صف` : 'بررسی اتصال و تایید انطباق داده‌ها',
      count,
      success: true,
    });
    localStorage.setItem(STORAGE_KEYS.SYNC_HISTORY, JSON.stringify(history.slice(0, 20)));

    return { syncedCount: count };
  }

  // --- Export & Backup ---
  static exportAllDataJSON(): string {
    const data = {
      version: '1.0.0',
      exported_at: new Date().toISOString(),
      stores: this.getStores(),
      visits: this.getVisits(),
      followups: this.getFollowUps(),
      syncQueue: this.getSyncQueue(),
    };
    return JSON.stringify(data, null, 2);
  }

  static exportStoresCSV(): string {
    const stores = this.getStores();
    const headers = ['شناسه', 'نام فروشگاه', 'صاحب فروشگاه', 'موبایل', 'تلفن', 'منطقه', 'آدرس', 'دسته‌بندی', 'وضعیت مشتری', 'تعداد ویزیت', 'آخرین ویزیت'];
    const rows = stores.map((s) => [
      s.id,
      `"${s.name}"`,
      `"${s.owner}"`,
      s.mobile,
      s.phone,
      `"${s.area}"`,
      `"${s.address.replace(/"/g, '""')}"`,
      `"${s.category}"`,
      s.customer_status,
      s.visit_count || 0,
      s.last_visit_date || 'ندارد',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  static importBackup(jsonString: string): boolean {
    try {
      const data = JSON.parse(jsonString);
      if (data.stores && Array.isArray(data.stores)) {
        localStorage.setItem(STORAGE_KEYS.STORES, JSON.stringify(data.stores));
      }
      if (data.visits && Array.isArray(data.visits)) {
        localStorage.setItem(STORAGE_KEYS.VISITS, JSON.stringify(data.visits));
      }
      if (data.followups && Array.isArray(data.followups)) {
        localStorage.setItem(STORAGE_KEYS.FOLLOWUPS, JSON.stringify(data.followups));
      }
      return true;
    } catch {
      return false;
    }
  }

  static resetToDefault(): void {
    localStorage.removeItem(STORAGE_KEYS.STORES);
    localStorage.removeItem(STORAGE_KEYS.VISITS);
    localStorage.removeItem(STORAGE_KEYS.FOLLOWUPS);
    localStorage.removeItem(STORAGE_KEYS.SYNC_QUEUE);
  }

  // Helper for Persian date string
  static getPersianDateString(date: Date): string {
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }
}
