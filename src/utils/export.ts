import { Store, Visit, FollowUp } from '../types';
import { db } from '../db/database';
import { getPersianDateString } from './persian';

export interface BackupPayload {
  version: number;
  exported_at: string;
  app: string;
  stores: Store[];
  visits: Visit[];
  followups: FollowUp[];
}

/**
 * Exports all IndexedDB data as a structured JSON backup string
 */
export async function exportAllDataJSON(): Promise<string> {
  const stores = await db.stores.toArray();
  const visits = await db.visits.toArray();
  const followups = await db.followups.toArray();

  const backup: BackupPayload = {
    version: 1,
    exported_at: new Date().toISOString(),
    app: 'Visit Field Sales CRM',
    stores,
    visits,
    followups,
  };

  return JSON.stringify(backup, null, 2);
}

/**
 * Exports stores as a CSV string with Persian column headers and UTF-8 BOM
 */
export async function exportStoresCSV(): Promise<string> {
  const stores = await db.stores.toArray();
  return generateStoresCSVString(stores);
}

function generateStoresCSVString(stores: Store[]): string {
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

/**
 * Downloads stores list as CSV file directly to user device
 */
export function exportStoresToCSV(storesList?: Store[]): void {
  const doExport = async () => {
    const list = storesList || (await db.stores.toArray());
    const csvContent = '\uFEFF' + generateStoresCSVString(list);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stores_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  doExport().catch(console.error);
}

/**
 * Exports visits as a CSV string
 */
export async function exportVisitsCSV(): Promise<string> {
  const visits = await db.visits.toArray();
  return generateVisitsCSVString(visits);
}

function generateVisitsCSVString(visits: Visit[]): string {
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

/**
 * Downloads visits list as CSV file directly to user device
 */
export function exportVisitsToCSV(visitsList?: Visit[]): void {
  const doExport = async () => {
    const list = visitsList || (await db.visits.toArray());
    const csvContent = '\uFEFF' + generateVisitsCSVString(list);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visits_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  doExport().catch(console.error);
}

/**
 * Validates and imports a JSON backup into IndexedDB
 */
export async function importBackupJSON(jsonString: string): Promise<{ success: boolean; count?: number; error?: string }> {
  try {
    const data = JSON.parse(jsonString);
    if (!data.stores || !Array.isArray(data.stores)) {
      return { success: false, error: 'ساختار فایل پشتیبان نامعتبر است (لیست فروشگاه‌ها یافت نشد).' };
    }

    await db.transaction('rw', [db.stores, db.visits, db.followups, db.syncHistory], async () => {
      await db.stores.clear();
      await db.visits.clear();
      await db.followups.clear();

      await db.stores.bulkAdd(data.stores);
      if (Array.isArray(data.visits) && data.visits.length > 0) {
        await db.visits.bulkAdd(data.visits);
      }
      if (Array.isArray(data.followups) && data.followups.length > 0) {
        await db.followups.bulkAdd(data.followups);
      }

      await db.syncHistory.add({
        id: 'restore_' + Date.now(),
        time: getPersianDateString(),
        text: `فایل پشتیبان بازیابی شد (${data.stores.length} فروشگاه).`,
        type: 'info',
        item_count: data.stores.length,
      });
    });

    return { success: true, count: data.stores.length };
  } catch (err: any) {
    return { success: false, error: err?.message || 'خطا در خواندن فایل پشتیبان' };
  }
}
