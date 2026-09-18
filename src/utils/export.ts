import { db } from '../db/database';
import { Store, Visit, FollowUp, ProductItem, SyncQueueItem } from '../types';
import { getPersianFullDateTime } from './persian';

export interface BackupV2Payload {
  version: 2;
  app: 'Visit Field Sales CRM';
  exported_at: string;
  device_id?: string;
  metadata: {
    stores_count: number;
    visits_count: number;
    followups_count: number;
    products_count: number;
    sync_queue_count: number;
    brands_count: number;
    categories_count: number;
  };
  brands: string[];
  categories: string[];
  stores: Store[];
  visits: Visit[];
  followups: FollowUp[];
  products: ProductItem[];
  syncQueue: SyncQueueItem[];
}

/**
 * Formats a date into a clean filename-friendly string: YYYY-MM-DD-HH-mm
 * Example: visit-backup-2026-09-18-03-45.json
 */
export function getBackupFileName(date: Date = new Date()): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `visit-backup-${year}-${month}-${day}-${hours}-${minutes}.json`;
}

/**
 * Extracts all unique brands and categories across stores and products
 */
function extractDistinctBrandsAndCategories(stores: Store[], products: ProductItem[]): { brands: string[]; categories: string[] } {
  const brandSet = new Set<string>();
  const catSet = new Set<string>();

  stores.forEach((s) => {
    if (s.category) catSet.add(s.category);
    if (Array.isArray(s.brands)) {
      s.brands.forEach((b) => {
        if (b && b.trim()) brandSet.add(b.trim());
      });
    }
  });

  products.forEach((p) => {
    if (p.category) catSet.add(p.category);
    if (p.brand && p.brand.trim()) brandSet.add(p.brand.trim());
  });

  return {
    brands: Array.from(brandSet).sort(),
    categories: Array.from(catSet).sort(),
  };
}

/**
 * Reads all actual data directly from Dexie/IndexedDB and packages it into JSON
 */
export async function createFullDatabaseBackup(): Promise<{ backup: BackupV2Payload; jsonString: string; filename: string }> {
  // Read all tables directly from IndexedDB
  const stores = await db.stores.toArray();
  const visits = await db.visits.toArray();
  const followups = await db.followups.toArray();
  const products = await db.products.toArray();
  const syncQueue = await db.syncQueue.toArray();
  const deviceSetting = await db.settings.get('device_id');

  const { brands, categories } = extractDistinctBrandsAndCategories(stores, products);

  const backup: BackupV2Payload = {
    version: 2,
    app: 'Visit Field Sales CRM',
    exported_at: new Date().toISOString(),
    device_id: deviceSetting?.value || undefined,
    metadata: {
      stores_count: stores.length,
      visits_count: visits.length,
      followups_count: followups.length,
      products_count: products.length,
      sync_queue_count: syncQueue.length,
      brands_count: brands.length,
      categories_count: categories.length,
    },
    brands,
    categories,
    stores,
    visits,
    followups,
    products,
    syncQueue,
  };

  const jsonString = JSON.stringify(backup, null, 2);
  const filename = getBackupFileName();

  return { backup, jsonString, filename };
}

/**
 * Reliable file download / save implementation for Mobile Chrome, Android PWA, and desktop browsers.
 * 1. Attaches anchor to document body before click
 * 2. Uses proper UTF-8 charset blob
 * 3. Gracefully falls back to navigator.share if download attribute is blocked in standalone PWA
 */
export async function downloadFileReliably(
  content: string,
  filename: string,
  mimeType = 'application/json;charset=utf-8'
): Promise<{ method: 'download' | 'share'; filename: string }> {
  const blob = new Blob([content], { type: mimeType });
  const nav = typeof navigator !== 'undefined' ? (navigator as any) : null;

  try {
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.style.display = 'none';
    link.href = objectUrl;
    link.download = filename;
    link.setAttribute('download', filename);
    link.target = '_blank';
    link.rel = 'noopener';

    // Must be in DOM for some Android browsers and WebViews
    document.body.appendChild(link);
    link.click();

    // Delay cleanup to allow browser download manager to grab stream
    setTimeout(() => {
      try {
        if (document.body.contains(link)) {
          document.body.removeChild(link);
        }
        URL.revokeObjectURL(objectUrl);
      } catch (e) {
        console.warn('Cleanup error:', e);
      }
    }, 2500);

    return { method: 'download', filename };
  } catch (downloadErr) {
    console.warn('Standard anchor download failed:', downloadErr);

    // Fallback: If Web Share API level 2 is available with file support (Android Chrome)
    if (nav && typeof nav.share === 'function' && typeof File !== 'undefined') {
      try {
        const file = new File([blob], filename, { type: mimeType.split(';')[0] });
        if (!nav.canShare || nav.canShare({ files: [file] })) {
          await nav.share({
            files: [file],
            title: filename,
            text: `پشتیبان پایگاه داده نرم‌افزار ویزیت (${filename})`,
          });
          return { method: 'share', filename };
        }
      } catch (shareErr: any) {
        if (shareErr.name === 'AbortError') {
          return { method: 'share', filename };
        }
        console.warn('navigator.share fallback failed:', shareErr);
      }
    }

    throw downloadErr;
  }
}

/**
 * Complete Export Runner: Fetches actual data, formats filename, triggers download, returns counts.
 */
export async function runCompleteBackupExport(): Promise<{
  success: boolean;
  filename: string;
  storesCount: number;
  visitsCount: number;
  followupsCount: number;
  productsCount: number;
  method: 'download' | 'share';
}> {
  const { jsonString, filename, backup } = await createFullDatabaseBackup();
  const { method } = await downloadFileReliably(jsonString, filename, 'application/json;charset=utf-8');

  return {
    success: true,
    filename,
    storesCount: backup.stores.length,
    visitsCount: backup.visits.length,
    followupsCount: backup.followups.length,
    productsCount: backup.products.length,
    method,
  };
}

export interface ImportValidationResult {
  isValid: boolean;
  error?: string;
  data?: any;
  stats?: {
    version: number;
    storesCount: number;
    visitsCount: number;
    followupsCount: number;
    productsCount: number;
    exportedAt?: string;
  };
}

/**
 * Validates a candidate backup JSON structure before touching the database
 */
export function validateBackupJSON(rawJson: string): ImportValidationResult {
  try {
    const data = JSON.parse(rawJson);

    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'محتوای فایل ارائه‌شده یک ساختار JSON معتبر نیست.' };
    }

    // Must have stores array
    if (!data.stores || !Array.isArray(data.stores)) {
      return { isValid: false, error: 'فایل پشتیبان معتبر نیست؛ آرایه فروشگاه‌ها (stores) در فایل یافت نشد.' };
    }

    // Basic store object integrity check
    if (data.stores.length > 0) {
      const sample = data.stores[0];
      if (!sample || typeof sample !== 'object' || !sample.name || sample.latitude === undefined) {
        return {
          isValid: false,
          error: 'ساختار رکوردهای فروشگاه در این فایل با الگوی سامانه تطابق ندارد (نام یا مختصات ناقص است).',
        };
      }
    }

    return {
      isValid: true,
      data,
      stats: {
        version: data.version || 1,
        storesCount: data.stores.length,
        visitsCount: Array.isArray(data.visits) ? data.visits.length : 0,
        followupsCount: Array.isArray(data.followups) ? data.followups.length : 0,
        productsCount: Array.isArray(data.products) ? data.products.length : 0,
        exportedAt: data.exported_at,
      },
    };
  } catch (parseErr: any) {
    return {
      isValid: false,
      error: `خطا در تجزیه متن JSON: ${parseErr?.message || 'فرمت غیرمجاز'}`,
    };
  }
}

/**
 * Restores the validated backup payload into Dexie/IndexedDB with transaction safety.
 * Preserves products and syncQueue if present in payload or retains existing ones.
 */
export async function restoreValidatedBackup(data: any): Promise<{
  success: boolean;
  storesCount: number;
  visitsCount: number;
  followupsCount: number;
  productsCount: number;
}> {
  const stores: Store[] = Array.isArray(data.stores) ? data.stores : [];
  const visits: Visit[] = Array.isArray(data.visits) ? data.visits : [];
  const followups: FollowUp[] = Array.isArray(data.followups) ? data.followups : [];
  const products: ProductItem[] = Array.isArray(data.products) ? data.products : [];
  const syncQueue: SyncQueueItem[] = Array.isArray(data.syncQueue) ? data.syncQueue : [];

  await db.transaction('rw', [db.stores, db.visits, db.followups, db.products, db.syncQueue, db.syncHistory], async () => {
    // 1. Clear current main tables
    await db.stores.clear();
    await db.visits.clear();
    await db.followups.clear();

    // 2. Restore stores, visits, followups
    if (stores.length > 0) {
      await db.stores.bulkAdd(stores);
    }
    if (visits.length > 0) {
      await db.visits.bulkAdd(visits);
    }
    if (followups.length > 0) {
      await db.followups.bulkAdd(followups);
    }

    // 3. Products
    if (products.length > 0) {
      await db.products.clear();
      await db.products.bulkAdd(products);
    }

    // 4. Sync queue if provided
    if (syncQueue.length > 0) {
      await db.syncQueue.clear();
      await db.syncQueue.bulkAdd(syncQueue);
    }

    // 5. Append syncHistory record
    await db.syncHistory.add({
      id: 'restore_' + Date.now(),
      time: getPersianFullDateTime(),
      text: `فایل پشتیبان کامل بازیابی شد (${stores.length} فروشگاه، ${visits.length} ویزیت).`,
      type: 'success',
      item_count: stores.length,
    });
  });

  return {
    success: true,
    storesCount: stores.length,
    visitsCount: visits.length,
    followupsCount: followups.length,
    productsCount: products.length,
  };
}

// ================= COMPATIBILITY EXPORTS =================

export async function exportAllDataJSON(): Promise<string> {
  const { jsonString } = await createFullDatabaseBackup();
  return jsonString;
}

export async function importBackupJSON(jsonString: string): Promise<{ success: boolean; count?: number; error?: string }> {
  const validation = validateBackupJSON(jsonString);
  if (!validation.isValid) {
    return { success: false, error: validation.error };
  }
  try {
    const result = await restoreValidatedBackup(validation.data);
    return { success: true, count: result.storesCount };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطای پایگاه داده در ذخیره اطلاعات' };
  }
}

/**
 * Exports stores as a CSV string with Persian column headers and UTF-8 BOM
 */
export async function exportStoresCSV(): Promise<string> {
  const stores = await db.stores.toArray();
  return generateStoresCSVString(stores);
}

export function generateStoresCSVString(stores: Store[]): string {
  const headers = [
    'شناسه',
    'نام فروشگاه',
    'مدیر/مالک',
    'شماره همراه',
    'تلفن ثابت',
    'رسته صنفی',
    'زیررسته',
    'منطقه/راسته',
    'آدرس دقیق',
    'عرض جغرافیایی',
    'طول جغرافیایی',
    'وضعیت مشتری',
    'برندها',
    'اقلام و قطعات',
    'تعداد ویزیت',
    'آخرین ویزیت',
    'نتیجه آخرین ویزیت',
    'یادداشت‌ها',
    'تاریخ ثبت',
  ];

  const rows = stores.map((s) => [
    `"${s.id}"`,
    `"${(s.name || '').replace(/"/g, '""')}"`,
    `"${(s.owner || '').replace(/"/g, '""')}"`,
    `"${s.mobile || ''}"`,
    `"${s.phone || ''}"`,
    `"${s.category || ''}"`,
    `"${s.subcategory || ''}"`,
    `"${(s.area || '').replace(/"/g, '""')}"`,
    `"${(s.address || '').replace(/"/g, '""')}"`,
    s.latitude,
    s.longitude,
    `"${s.customer_status}"`,
    `"${(s.brands || []).join('، ')}"`,
    `"${(s.products || []).join('، ')}"`,
    s.visit_count || 0,
    `"${s.last_visit_date || ''}"`,
    `"${s.last_visit_result || ''}"`,
    `"${(s.notes || '').replace(/"/g, '""')}"`,
    `"${s.created_at || ''}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function exportStoresToCSV(storesList?: Store[]): void {
  const doExport = async () => {
    const list = storesList || (await db.stores.toArray());
    const csvContent = '\uFEFF' + generateStoresCSVString(list);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const filename = `stores_export_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;
    await downloadFileReliably(csvContent, filename, 'text/csv;charset=utf-8;');
  };
  doExport().catch(console.error);
}

export async function exportVisitsCSV(): Promise<string> {
  const visits = await db.visits.toArray();
  return generateVisitsCSVString(visits);
}

export function generateVisitsCSVString(visits: Visit[]): string {
  const headers = [
    'شناسه',
    'شناسه فروشگاه',
    'نام فروشگاه',
    'تاریخ',
    'ساعت',
    'نتیجه ویزیت',
    'یادداشت مذاکره',
    'پیگیری بعدی',
    'عرض جغرافیایی',
    'طول جغرافیایی',
    'تاریخ ثبت',
  ];

  const rows = visits.map((v) => [
    `"${v.id}"`,
    `"${v.store_id}"`,
    `"${(v.store_name || '').replace(/"/g, '""')}"`,
    `"${v.date}"`,
    `"${v.time}"`,
    `"${v.result}"`,
    `"${(v.note || '').replace(/"/g, '""')}"`,
    `"${v.next_followup || ''}"`,
    v.latitude,
    v.longitude,
    `"${v.created_at}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
}

export function exportVisitsToCSV(visitsList?: Visit[]): void {
  const doExport = async () => {
    const list = visitsList || (await db.visits.toArray());
    const csvContent = '\uFEFF' + generateVisitsCSVString(list);
    const pad = (n: number) => n.toString().padStart(2, '0');
    const now = new Date();
    const filename = `visits_export_${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}.csv`;
    await downloadFileReliably(csvContent, filename, 'text/csv;charset=utf-8;');
  };
  doExport().catch(console.error);
}
