import React, { useState, useEffect, useRef } from 'react';
import { SyncQueueItem, ConnectionState } from '../types';
import { IconSync } from './TechnicalIcons';
import { toPersianDigits, FieldStorageService } from '../services/storage';
import { syncService, SyncStats } from '../services/sync';
import { db } from '../db/database';
import { toast } from '../hooks/useToast';
import { PWAInstallButton } from './PWAInstallButton';
import { exportAllDataJSON, exportStoresCSV, exportVisitsCSV, importBackupJSON } from '../utils/export';

interface SyncCenterScreenProps {
  connectionState: ConnectionState;
  onToggleConnection: () => void;
  syncQueue: SyncQueueItem[];
  onSyncComplete: () => void;
}

export const SyncCenterScreen: React.FC<SyncCenterScreenProps> = ({
  connectionState,
  onToggleConnection,
  syncQueue,
  onSyncComplete,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [stats, setStats] = useState<SyncStats>({
    pendingCount: 0,
    failedCount: 0,
    uploaded: 0,
    downloaded: 0,
    lastSync: 'هنوز انجام نشده',
  });
  const [history, setHistory] = useState<Array<{ time: string; text: string; success?: boolean }>>([]);
  const [d1Endpoint, setD1Endpoint] = useState(localStorage.getItem('field_command_d1_endpoint') || '');
  const [showConfig, setShowConfig] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadData = async () => {
    const s = await syncService.getSyncStats();
    setStats(s);

    const hist = await db.syncHistory.reverse().limit(15).toArray();
    setHistory(
      hist.map((h) => ({
        time: h.time,
        text: h.text,
        success: h.type !== 'error',
      }))
    );
  };

  useEffect(() => {
    loadData();
  }, [syncQueue]);

  const handleSyncNow = async () => {
    if (connectionState === 'offline') {
      toast.warning('دستگاه در وضعیت آفلاین است. ابتدا اتصال را برقرار کنید.');
      return;
    }

    setIsSyncing(true);
    try {
      const result = await syncService.performSync();
      if (result.success) {
        toast.success(`همگام‌سازی تکمیل شد (${toPersianDigits(result.syncedCount)} رکورد ارسال گردید).`);
      } else {
        toast.warning(result.error || 'خطا در برقراری ارتباط با سرویس D1');
      }
      await loadData();
      onSyncComplete();
    } catch (err: any) {
      toast.error('خطای غیرمنتظره در همگام‌سازی: ' + (err?.message || 'نامشخص'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleRetryFailed = async () => {
    setIsSyncing(true);
    try {
      const res = await syncService.retryFailedItems();
      toast.info(`تلاش مجدد برای ${toPersianDigits(res.syncedCount)} رکورد معلق آغاز شد.`);
      await loadData();
      onSyncComplete();
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearQueue = async () => {
    if (window.confirm('آیا از پاکسازی صف تغییرات محلی اطمینان دارید؟ تغییرات ارسال نشده از بین خواهند رفت.')) {
      await syncService.clearQueue();
      await loadData();
      onSyncComplete();
      toast.info('صف همگام‌سازی با موفقیت خالی شد.');
    }
  };

  const handleSaveEndpoint = () => {
    localStorage.setItem('field_command_d1_endpoint', d1Endpoint.trim());
    toast.success('آدرس سرویس Cloudflare D1 ذخیره شد.');
    setShowConfig(false);
  };

  // Export handlers
  const handleDownloadJSON = async () => {
    const jsonStr = await exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visit-field-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('فایل پشتیبان کامل JSON دانلود شد.');
  };

  const handleDownloadStoresCSV = async () => {
    const csvStr = await exportStoresCSV();
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stores-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('فایل اکسل (CSV) فروشگاه‌ها دانلود شد.');
  };

  const handleDownloadVisitsCSV = async () => {
    const csvStr = await exportVisitsCSV();
    const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `visits-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('فایل اکسل (CSV) سوابق ویزیت دانلود شد.');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result as string;
      const res = await importBackupJSON(content);
      if (res.success) {
        toast.success(`فایل پشتیبان بازیابی شد (${toPersianDigits(res.count || 0)} فروشگاه جایگزین شدند).`);
        await FieldStorageService.refreshCache();
        await loadData();
        onSyncComplete();
      } else {
        toast.error(res.error || 'خطا در بازیابی پشتیبان');
      }
    };
    reader.readAsText(file);
  };

  const handleResetToMarketDefault = async () => {
    if (window.confirm('آیا مایل به بازنشانی پایگاه داده به اطلاعات استاندارد بازار (چراغ برق، ملت، اکباتان) هستید؟')) {
      await FieldStorageService.resetToDefaultAsync();
      await loadData();
      onSyncComplete();
      toast.success('پایگاه داده به اطلاعات پیش‌فرض راسته بازار قطعات تهران بازنشانی شد.');
    }
  };

  return (
    <div className="pb-24 px-3 pt-3 max-w-lg mx-auto space-y-3 font-sans select-none">
      {/* Hidden File Input for JSON Restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[#171A1B] flex items-center gap-1.5">
            <span>مرکز مدیریت همگام‌سازی و پایگاه داده</span>
            <span className="text-[10px] bg-[#123C3A] text-white px-1.5 py-0.5 rounded font-mono">
              OFFLINE-FIRST
            </span>
          </h1>
          <p className="text-[11px] text-[#6E7472]">مدیریت صف تغییرات، پایگاه داده محلی IndexedDB و سرور ابری D1</p>
        </div>
      </div>

      {/* PWA App Install Banner / Card */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded-lg p-2.5 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="text-base">📱</span>
            <span className="text-xs font-bold text-[#171A1B]">وضعیت وب‌اپلیکیشن (PWA)</span>
          </div>
          <span className="text-[10px] text-[#6E7472]">کارکرد ۱۰۰٪ مستقل و آفلاین</span>
        </div>
        <PWAInstallButton />
      </div>

      {/* 1. Technical System Monitor Hardware-Feel Box */}
      <div className="bg-[#171A1B] text-[#E7E4DC] border-2 border-[#202426] rounded-lg p-3 space-y-3 shadow-md">
        {/* Status Line */}
        <div className="flex items-center justify-between border-b border-[#2F3438] pb-2 font-technical-mono">
          <div className="flex items-center gap-2">
            <span
              className={`h-2.5 w-2.5 rounded-full ${
                connectionState === 'online'
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                  : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'
              }`}
            />
            <span className="text-xs font-bold uppercase text-white">
              {connectionState === 'online' ? 'اتصال شبکه برقرار (ONLINE)' : 'حالت میدانی آفلاین (OFFLINE)'}
            </span>
          </div>

          <button
            onClick={onToggleConnection}
            className="px-2 py-0.5 bg-[#2F3438] hover:bg-[#3D4348] text-[11px] text-[#FAF9F5] rounded border border-[#484F54] font-sans"
          >
            {connectionState === 'online' ? 'تغییر به آفلاین' : 'تغییر به آنلاین'}
          </button>
        </div>

        {/* 4 Technical Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center font-technical-mono">
          <div className="p-2 bg-[#202426] rounded border border-[#2F3438]">
            <span className="block text-[10px] text-[#8E9491]">تغییرات در صف</span>
            <span className="text-base font-bold text-[#C96F3B]">
              {toPersianDigits(syncQueue.length)}
            </span>
          </div>

          <div className="p-2 bg-[#202426] rounded border border-[#2F3438]">
            <span className="block text-[10px] text-[#8E9491]">ارسال شده</span>
            <span className="text-base font-bold text-emerald-400">
              {toPersianDigits(stats.uploaded)}
            </span>
          </div>

          <div className="p-2 bg-[#202426] rounded border border-[#2F3438]">
            <span className="block text-[10px] text-[#8E9491]">خطاها</span>
            <span className={`text-base font-bold ${stats.failedCount > 0 ? 'text-rose-400' : 'text-stone-400'}`}>
              {toPersianDigits(stats.failedCount)}
            </span>
          </div>

          <div className="p-2 bg-[#202426] rounded border border-[#2F3438]">
            <span className="block text-[10px] text-[#8E9491]">آخرین تبادل</span>
            <span className="text-[10px] font-bold text-white mt-1 block truncate">
              {stats.lastSync}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing || connectionState === 'offline'}
            className="col-span-2 py-2.5 bg-[#C96F3B] hover:bg-[#B05B29] text-white rounded font-bold text-xs shadow flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98 transition-all font-sans"
          >
            <IconSync size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'در حال ارسال بسته‌ها...' : 'همگام‌سازی فوری'}</span>
          </button>

          <button
            onClick={() => setShowConfig(!showConfig)}
            className="py-2.5 bg-[#202426] hover:bg-[#2F3438] text-white border border-[#484F54] rounded font-semibold text-xs font-sans flex items-center justify-center gap-1"
          >
            <span>⚙ تنظیم D1</span>
          </button>
        </div>

        {/* Cloudflare D1 Backend Configuration Details */}
        {showConfig && (
          <div className="p-3 bg-[#202426] rounded border border-[#3A4045] space-y-2 text-xs">
            <span className="font-bold text-[#E7E4DC] block">تنظیم آدرس اندپوئینت Cloudflare D1:</span>
            <input
              type="text"
              dir="ltr"
              value={d1Endpoint}
              onChange={(e) => setD1Endpoint(e.target.value)}
              placeholder="https://visit-api.workers.dev/api/sync"
              className="w-full bg-[#171A1B] text-white font-mono p-2 rounded border border-[#484F54] text-xs focus:border-[#C96F3B] focus:outline-none"
            />
            <p className="text-[10px] text-[#8E9491]">
              در صورت خالی بودن، سامانه در حالت شبیه‌سازی صف محلی امن عمل می‌کند. با تنظیم آدرس، کلیه تغییرات صف به Worker و پایگاه ابری D1 فرستاده می‌شوند.
            </p>
            <button
              onClick={handleSaveEndpoint}
              className="px-3 py-1 bg-[#123C3A] hover:bg-[#1A4B49] text-white font-bold rounded text-xs"
            >
              ذخیره تنظیمات
            </button>
          </div>
        )}
      </div>

      {/* 2. Pending Changes Queue Detailed List */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-1.5 text-xs font-bold text-[#171A1B]">
          <span>صف محلی تغییرات معلق ({toPersianDigits(syncQueue.length)})</span>
          <div className="flex items-center gap-2">
            {stats.failedCount > 0 && (
              <button
                onClick={handleRetryFailed}
                className="text-[10px] text-amber-700 bg-amber-100 hover:bg-amber-200 px-2 py-0.5 rounded font-bold"
              >
                تلاش مجدد خطادارها
              </button>
            )}
            {syncQueue.length > 0 && (
              <button
                onClick={handleClearQueue}
                className="text-[10px] text-rose-600 hover:text-rose-800"
              >
                پاکسازی صف
              </button>
            )}
          </div>
        </div>

        {syncQueue.length === 0 ? (
          <div className="p-3 text-center text-xs text-[#6E7472] bg-[#F3F1EA] rounded border border-[#E6E2D8]">
            ✓ تمامی اطلاعات میدانی با سرور مرکزی تطبیق یافته و صف خالی است.
          </div>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto font-technical-mono text-xs">
            {syncQueue.map((item) => (
              <div
                key={item.id}
                className="p-2 bg-[#F3F1EA] border border-[#E6E2D8] rounded flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      item.operation === 'CREATE'
                        ? 'bg-emerald-800 text-white'
                        : item.operation === 'UPDATE'
                        ? 'bg-amber-800 text-white'
                        : 'bg-rose-800 text-white'
                    }`}
                  >
                    {item.operation}
                  </span>
                  <span className="font-bold text-[#171A1B] font-sans text-xs">
                    {item.entity === 'STORE'
                      ? `فروشگاه: ${item.payload?.name || item.entity_id}`
                      : item.entity === 'VISIT'
                      ? `ویزیت: ${item.payload?.store_name || item.entity_id}`
                      : `پیگیری: ${item.payload?.store_name || item.entity_id}`}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[10px] text-[#6E7472]">
                  {item.retry_count && item.retry_count > 0 ? (
                    <span className="text-amber-700 font-bold">
                      تلاش {toPersianDigits(item.retry_count)}
                    </span>
                  ) : null}
                  <span>{item.created_at}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Export / Backup / Restore Center */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-2.5">
        <div className="border-b border-[#E6E2D8] pb-1.5 flex items-center justify-between">
          <span className="text-xs font-bold text-[#171A1B]">پشتیبان‌گیری و خروجی داده‌ها</span>
          <span className="text-[10px] text-[#6E7472]">فرمت‌های استاندارد JSON و CSV</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <button
            onClick={handleDownloadJSON}
            className="p-2.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#202426] rounded text-right flex flex-col gap-0.5 shadow-2xs"
          >
            <span className="font-bold text-[#123C3A]">💾 پشتیبان کامل (JSON)</span>
            <span className="text-[10px] text-[#6E7472]">تمامی فروشگاه‌ها، ویزیت‌ها و پیگیری‌ها</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C96F3B] rounded text-right flex flex-col gap-0.5 shadow-2xs"
          >
            <span className="font-bold text-[#C96F3B]">📥 بازیابی پشتیبان (Restore)</span>
            <span className="text-[10px] text-[#6E7472]">بارگذاری فایل پشتیبان JSON</span>
          </button>

          <button
            onClick={handleDownloadStoresCSV}
            className="p-2.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#D5D0C3] rounded text-right flex flex-col gap-0.5 shadow-2xs"
          >
            <span className="font-bold text-[#171A1B]">📊 خروجی اکسل فروشگاه‌ها</span>
            <span className="text-[10px] text-[#6E7472]">فایل CSV سازگار با مایکروسافت اکسل</span>
          </button>

          <button
            onClick={handleDownloadVisitsCSV}
            className="p-2.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#D5D0C3] rounded text-right flex flex-col gap-0.5 shadow-2xs"
          >
            <span className="font-bold text-[#171A1B]">📋 خروجی اکسل ویزیت‌ها</span>
            <span className="text-[10px] text-[#6E7472]">فایل CSV لاگ‌های مذاکره و فروش</span>
          </button>
        </div>

        <div className="pt-2 border-t border-[#E6E2D8] flex justify-end">
          <button
            onClick={handleResetToMarketDefault}
            className="text-[11px] text-[#6E7472] hover:text-[#123C3A] underline"
          >
            بازنشانی داده‌ها به اطلاعات اولیه بازار تهران (چراغ برق)
          </button>
        </div>
      </div>

      {/* 4. Sync History Log */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-2">
        <span className="block text-xs font-bold text-[#171A1B] border-b border-[#E6E2D8] pb-1.5">
          تاریخچه رویدادهای همگام‌سازی (IndexedDB Log)
        </span>

        <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto">
          {history.length === 0 ? (
            <div className="text-center py-2 text-[11px] text-[#8E9491]">
              تاریخچه‌ای ثبت نشده است.
            </div>
          ) : (
            history.map((h, i) => (
              <div key={i} className="flex items-start justify-between gap-2 p-1.5 bg-[#F3F1EA] rounded border border-[#E6E2D8]">
                <div className="flex items-start gap-1.5">
                  <span className={h.success ? 'text-emerald-700 font-bold' : 'text-rose-600 font-bold'}>
                    ●
                  </span>
                  <span className="text-[#171A1B] text-[11px]">{h.text}</span>
                </div>
                <span className="font-technical-mono text-[10px] text-[#6E7472] shrink-0">
                  {h.time}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
