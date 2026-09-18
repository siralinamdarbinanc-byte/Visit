import React, { useState } from 'react';
import { SyncQueueItem, ConnectionState } from '../types';
import { IconSync } from './TechnicalIcons';
import { toPersianDigits, FieldStorageService } from '../services/storage';

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
  const stats = FieldStorageService.getSyncStats();
  const history = FieldStorageService.getSyncHistory();

  const handleSyncNow = async () => {
    if (connectionState === 'offline') {
      alert('دستگاه در حالت آفلاین است. ابتدا اتصال شبکه را برقرار کنید.');
      return;
    }

    setIsSyncing(true);
    try {
      // Simulate network transmission delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await FieldStorageService.performManualSync();
      onSyncComplete();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="pb-20 px-3 pt-3 max-w-lg mx-auto space-y-3 font-sans select-none">
      {/* Top Header */}
      <div>
        <h1 className="text-sm font-bold text-[#171A1B] flex items-center gap-1.5">
          <span>مرکز مدیریت همگام‌سازی و آفلاین</span>
          <span className="text-[10px] bg-[#123C3A] text-white px-1.5 py-0.2 rounded font-mono">
            SYNC MON v1.0
          </span>
        </h1>
        <p className="text-[11px] text-[#6E7472]">پایشگر تبادل بسته‌های اطلاعاتی با سرور ابری D1</p>
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
              {connectionState === 'online' ? 'اتصال برقرار (ONLINE)' : 'حالت میدانی آفلاین (OFFLINE)'}
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
            <span className="block text-[10px] text-[#8E9491]">دریافت شده</span>
            <span className="text-base font-bold text-sky-400">
              {toPersianDigits(stats.downloaded)}
            </span>
          </div>

          <div className="p-2 bg-[#202426] rounded border border-[#2F3438]">
            <span className="block text-[10px] text-[#8E9491]">آخرین تبادل</span>
            <span className="text-[11px] font-bold text-white mt-1 block">
              {stats.lastSync}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="col-span-2 py-2.5 bg-[#C96F3B] hover:bg-[#B05B29] text-white rounded font-bold text-xs shadow flex items-center justify-center gap-1.5 disabled:opacity-50 active:scale-98 transition-all font-sans"
          >
            <IconSync size={14} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'در حال ارسال بسته‌ها...' : 'همگام‌سازی الآن'}</span>
          </button>

          <button
            onClick={handleSyncNow}
            disabled={isSyncing}
            className="py-2.5 bg-[#202426] hover:bg-[#2F3438] text-white border border-[#484F54] rounded font-semibold text-xs font-sans"
          >
            دریافت اطلاعات
          </button>
        </div>
      </div>

      {/* 2. Pending Changes Queue Detailed List */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-2">
        <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-1.5 text-xs font-bold text-[#171A1B]">
          <span>صف محلی تغییرات معلق ({toPersianDigits(syncQueue.length)})</span>
          <span className="text-[10px] text-[#6E7472]">ذخیره پایدار در IndexedDB</span>
        </div>

        {syncQueue.length === 0 ? (
          <div className="p-4 text-center text-xs text-[#6E7472] bg-[#F3F1EA] rounded border border-[#E6E2D8]">
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
                  <span className="px-1.5 py-0.2 bg-[#123C3A] text-white rounded text-[10px] font-bold">
                    {item.operation}
                  </span>
                  <span className="font-bold text-[#171A1B] font-sans">
                    {item.entity === 'STORE'
                      ? `فروشگاه: ${item.payload?.name || item.entity_id}`
                      : item.entity === 'VISIT'
                      ? `ویزیت: ${item.payload?.store_name || item.entity_id}`
                      : `پیگیری: ${item.payload?.store_name || item.entity_id}`}
                  </span>
                </div>
                <span className="text-[10px] text-[#6E7472]">{item.created_at}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Sync History Log */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-2">
        <span className="block text-xs font-bold text-[#171A1B] border-b border-[#E6E2D8] pb-1.5">
          تاریخچه عملیات تبادل داده
        </span>

        <div className="space-y-1.5 text-xs">
          {history.map((h, i) => (
            <div key={i} className="flex items-start justify-between gap-2 p-1.5 bg-[#F3F1EA] rounded border border-[#E6E2D8]">
              <div className="flex items-start gap-1.5">
                <span className="text-emerald-700 font-bold">●</span>
                <span className="text-[#171A1B] text-[11px]">{h.text}</span>
              </div>
              <span className="font-technical-mono text-[10px] text-[#6E7472] shrink-0">
                {h.time}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
