import Dexie, { type Table } from 'dexie';
import { Store, Visit, FollowUp, ProductItem, SyncQueueItem, SyncHistoryItem } from '../types';

export interface AppSetting {
  key: string;
  value: any;
}

export class FieldVisitDatabase extends Dexie {
  stores!: Table<Store, string>;
  visits!: Table<Visit, string>;
  followups!: Table<FollowUp, string>;
  products!: Table<ProductItem, string>;
  syncQueue!: Table<SyncQueueItem, string>;
  syncHistory!: Table<SyncHistoryItem, string>;
  settings!: Table<AppSetting, string>;

  constructor() {
    super('FieldVisitDB');

    // Define database schema with proper indexes
    this.version(1).stores({
      stores: 'id, name, owner, mobile, phone, category, area, customer_status, updated_at, created_at, last_visit_date',
      visits: 'id, store_id, date, result, created_at',
      followups: 'id, store_id, date, status, created_at',
      products: 'id, name, category, brand',
      syncQueue: 'id, operation, entity, entity_id, synced, created_at',
      syncHistory: 'id, time, type',
      settings: 'key',
    });
  }
}

export const db = new FieldVisitDatabase();

/**
 * Generates a unique, persistent client device ID
 */
export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await db.settings.get('device_id');
  if (existing?.value) {
    return existing.value;
  }
  const newId = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36);
  await db.settings.put({ key: 'device_id', value: newId });
  return newId;
}
