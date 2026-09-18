import React, { useState } from 'react';
import { toPersianDigits } from '../services/storage';

export interface ImportPreviewStats {
  version: number;
  storesCount: number;
  visitsCount: number;
  followupsCount: number;
  productsCount: number;
  exportedAt?: string;
}

interface BackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  stats: ImportPreviewStats;
  currentStoresCount: number;
  onConfirm: () => Promise<void>;
}

export const BackupRestoreModal: React.FC<BackupRestoreModalProps> = ({
  isOpen,
  onClose,
  fileName,
  stats,
  currentStoresCount,
  onConfirm,
}) => {
  const [isRestoring, setIsRestoring] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setIsRestoring(true);
    try {
      await onConfirm();
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-[#FAF9F5] border-2 border-[#B94A48] rounded-lg max-w-md w-full p-4 space-y-3.5 shadow-2xl text-right font-sans">
        {/* Header Alert */}
        <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-2">
          <div className="flex items-center gap-2">
            <span className="text-xl text-[#B94A48]">⚠️</span>
            <h3 className="font-bold text-sm text-[#171A1B]">
              تأیید بازنویسی و بازیابی پایگاه داده (Restore)
            </h3>
          </div>
          <span className="text-[10px] bg-[#B94A48] text-white px-2 py-0.5 rounded font-mono font-bold">
            OVERWRITE WARNING
          </span>
        </div>

        {/* Warning Callout */}
        <div className="p-3 bg-amber-50 border border-amber-300 rounded text-xs text-amber-900 space-y-1">
          <p className="font-bold">هشدار مهم پیش از بازیابی:</p>
          <p className="text-[11px] leading-relaxed text-amber-800">
            با بازیابی این فایل، کلیه رکوردهای فعلی پایگاه داده محلی (شامل {toPersianDigits(currentStoresCount)} فروشگاه ثبت‌شده) با اطلاعات موجود در فایل پشتیبان جایگزین خواهند شد.
          </p>
        </div>

        {/* File Statistics Card */}
        <div className="bg-[#F3F1EA] border border-[#D5D0C3] rounded p-3 space-y-2 text-xs">
          <div className="flex justify-between border-b border-[#E6E2D8] pb-1">
            <span className="text-[#6E7472]">نام فایل انتخاب‌شده:</span>
            <span className="font-mono text-[#171A1B] text-[11px] truncate max-w-[200px]" dir="ltr">
              {fileName}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-center pt-1 font-technical-mono">
            <div className="p-1.5 bg-[#FAF9F5] rounded border border-[#E6E2D8]">
              <span className="block text-[10px] text-[#6E7472]">فروشگاه‌ها</span>
              <span className="text-sm font-bold text-[#123C3A]">
                {toPersianDigits(stats.storesCount)} رکورد
              </span>
            </div>

            <div className="p-1.5 bg-[#FAF9F5] rounded border border-[#E6E2D8]">
              <span className="block text-[10px] text-[#6E7472]">سوابق ویزیت</span>
              <span className="text-sm font-bold text-[#2E6B50]">
                {toPersianDigits(stats.visitsCount)} رکورد
              </span>
            </div>

            <div className="p-1.5 bg-[#FAF9F5] rounded border border-[#E6E2D8]">
              <span className="block text-[10px] text-[#6E7472]">پیگیری‌ها</span>
              <span className="text-sm font-bold text-[#C96F3B]">
                {toPersianDigits(stats.followupsCount)} رکورد
              </span>
            </div>

            <div className="p-1.5 bg-[#FAF9F5] rounded border border-[#E6E2D8]">
              <span className="block text-[10px] text-[#6E7472]">اقلام و محصولات</span>
              <span className="text-sm font-bold text-[#171A1B]">
                {toPersianDigits(stats.productsCount)} قلم
              </span>
            </div>
          </div>

          {stats.exportedAt && (
            <div className="text-[10px] text-[#8E9491] text-left font-technical-mono pt-1" dir="ltr">
              Exported: {stats.exportedAt.slice(0, 19).replace('T', ' ')} (v{stats.version})
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            disabled={isRestoring}
            onClick={onClose}
            className="py-2 px-3 bg-[#EBE8DF] hover:bg-[#D5D0C3] text-[#171A1B] text-xs font-semibold rounded border border-[#C4BFB2] transition-colors"
          >
            انصراف
          </button>

          <button
            type="button"
            disabled={isRestoring}
            onClick={handleConfirm}
            className="py-2 px-3 bg-[#B94A48] hover:bg-[#A33D3B] text-white text-xs font-bold rounded shadow flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>در حال بازیابی...</span>
              </>
            ) : (
              <span>تأیید و جایگزینی داده‌ها</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
