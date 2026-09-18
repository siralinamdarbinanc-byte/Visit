import { db } from './database';
import { INITIAL_STORES, INITIAL_VISITS, INITIAL_FOLLOWUPS, INITIAL_PRODUCTS } from '../data/mockStores';
import { Store, Visit, FollowUp, ProductItem } from '../types';

/**
 * Checks if the database is initialized, and seeds initial automotive market records if empty.
 */
export async function ensureDatabaseSeeded(): Promise<void> {
  const storeCount = await db.stores.count();
  if (storeCount === 0) {
    await seedInitialData();
  }
}

export async function seedInitialData(): Promise<void> {
  await db.transaction('rw', [db.stores, db.visits, db.followups, db.products, db.syncHistory, db.settings], async () => {
    await db.stores.clear();
    await db.visits.clear();
    await db.followups.clear();
    await db.products.clear();
    await db.syncHistory.clear();

    await db.stores.bulkAdd(INITIAL_STORES);
    await db.visits.bulkAdd(INITIAL_VISITS);
    await db.followups.bulkAdd(INITIAL_FOLLOWUPS);
    await db.products.bulkAdd(INITIAL_PRODUCTS);

    await db.syncHistory.add({
      id: 'init-sync',
      time: 'راه‌اندازی اولیه',
      text: 'پایگاه داده آفلاین محلی (IndexedDB) با داده‌های اولیه بازار چراغ‌برق راه‌اندازی شد.',
      type: 'info',
      item_count: INITIAL_STORES.length,
    });

    await db.settings.put({
      key: 'seeded_at',
      value: new Date().toISOString(),
    });
  });
}
