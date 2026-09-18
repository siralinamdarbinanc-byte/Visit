import React, { useState } from 'react';
import { FieldStorageService, toPersianDigits } from '../services/storage';

interface MoreMenuScreenProps {
  onNavigateTo: (target: string, payload?: any) => void;
  onRefreshData: () => void;
}

export const MoreMenuScreen: React.FC<MoreMenuScreenProps> = ({
  onNavigateTo,
  onRefreshData,
}) => {
  // Accordion section states
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    stores: true,
    visits: false,
    reports: false,
    sync: false,
    settings: false,
  });

  const toggle = (sec: string) => {
    setOpenSections((prev) => ({ ...prev, [sec]: !prev[sec] }));
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const jsonStr = FieldStorageService.exportAllDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `field_command_backup_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export CSV for Excel
  const handleExportCSV = () => {
    const csvContent = '\uFEFF' + FieldStorageService.exportStoresCSV();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `stores_export_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import Backup
  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      if (FieldStorageService.importBackup(content)) {
        alert('پشتیبان با موفقیت بازیابی شد.');
        onRefreshData();
      } else {
        alert('فایل پشتیبان نامعتبر است.');
      }
    };
    reader.readAsText(file);
  };

  // Reset to default sample data
  const handleResetSample = () => {
    if (confirm('آیا از بازنشانی کلیه اطلاعات به مقادیر اولیه اطمینان دارید؟')) {
      FieldStorageService.resetToDefault();
      onRefreshData();
      alert('داده‌های نمونه اولیه بازنشانی شد.');
    }
  };

  return (
    <div className="pb-20 px-3 pt-3 max-w-lg mx-auto space-y-3 font-sans select-none">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold text-[#171A1B] flex items-center gap-1.5">
          <span>منوی سلسله‌مراتبی و تنظیمات سیستم</span>
          <span className="text-[10px] bg-[#123C3A] text-white px-1.5 py-0.2 rounded font-mono">
            MENU // 05
          </span>
        </h1>
        <p className="text-[11px] text-[#6E7472]">دسترسی ساختاریافته به کلیه بخش‌ها و ابزارهای پشتیبان‌گیری</p>
      </div>

      {/* Accordion Categories */}
      <div className="space-y-2">
        {/* 1. فروشگاه‌ها */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggle('stores')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              فروشگاه‌ها
            </span>
            <span>{openSections.stores ? '▲' : '▼'}</span>
          </button>

          {openSections.stores && (
            <div className="p-1.5 divide-y divide-[#E6E2D8] text-xs">
              <button
                onClick={() => onNavigateTo('stores', { filter: 'all' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>همه فروشگاه‌ها</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('home')}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>نزدیک من (شعاع محلی)</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('stores', { sort: 'unvisited' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>فروشگاه‌های بازدیدنشده</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('stores', { status: 'customer' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>مشتریان دائم</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('stores', { status: 'potential' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>مشتریان بالقوه</span>
                <span>←</span>
              </button>
            </div>
          )}
        </div>

        {/* 2. بازدیدها */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggle('visits')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              بازدیدها و پیگیری‌ها
            </span>
            <span>{openSections.visits ? '▲' : '▼'}</span>
          </button>

          {openSections.visits && (
            <div className="p-1.5 divide-y divide-[#E6E2D8] text-xs">
              <button
                onClick={() => onNavigateTo('visits', { tab: 'today' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>ویزیت و پیگیری‌های امروز</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('visits', { tab: 'upcoming' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>پیگیری‌های آتی</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('visits', { tab: 'overdue' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>پیگیری‌های معوق (نیازمند اقدام)</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('cockpit')}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#C96F3B] font-bold"
              >
                <span>ورود به کابین هدایت میدانی ویزیت</span>
                <span>←</span>
              </button>
            </div>
          )}
        </div>

        {/* 3. گزارش‌ها */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggle('reports')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              گزارش‌های هوشمند میدانی
            </span>
            <span>{openSections.reports ? '▲' : '▼'}</span>
          </button>

          {openSections.reports && (
            <div className="p-1.5 divide-y divide-[#E6E2D8] text-xs">
              <button
                onClick={() => onNavigateTo('reports', { tab: 'overview' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>گزارش کلی و شاخص‌های عملیات</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('reports', { tab: 'areas' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>پوشش مناطق و راسته‌های بازار</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('reports', { tab: 'brands' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>تحلیل تقاضای برندها</span>
                <span>←</span>
              </button>
              <button
                onClick={() => onNavigateTo('reports', { tab: 'categories' })}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>توزیع اصناف و قطعات</span>
                <span>←</span>
              </button>
            </div>
          )}
        </div>

        {/* 4. همگام‌سازی */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggle('sync')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              همگام‌سازی و پایگاه ابری
            </span>
            <span>{openSections.sync ? '▲' : '▼'}</span>
          </button>

          {openSections.sync && (
            <div className="p-1.5 divide-y divide-[#E6E2D8] text-xs">
              <button
                onClick={() => onNavigateTo('sync')}
                className="w-full py-2 px-3 text-right hover:bg-[#F3F1EA] rounded flex items-center justify-between text-[#171A1B]"
              >
                <span>صفحه مانیتورینگ همگام‌سازی</span>
                <span>←</span>
              </button>
            </div>
          )}
        </div>

        {/* 5. تنظیمات و پشتیبان‌گیری داده‌ها */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggle('settings')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#C96F3B] rounded-xs" />
              پشتیبان‌گیری و خروجی اکسل (مالکیت داده)
            </span>
            <span>{openSections.settings ? '▲' : '▼'}</span>
          </button>

          {openSections.settings && (
            <div className="p-3 space-y-3 text-xs border-t border-[#D5D0C3]">
              <p className="text-[11px] text-[#6E7472]">
                شما مالک ۱۰۰٪ اطلاعات ثبت شده هستید و می‌توانید در هر لحظه نسخه پشتیبان یا خروجی فایل اکسل تهیه فرمایید.
              </p>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleExportCSV}
                  className="py-2 px-3 bg-[#123C3A] hover:bg-[#1A4B49] text-white rounded font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <span>📊 خروجی فایل اکسل (CSV)</span>
                </button>

                <button
                  onClick={handleExportJSON}
                  className="py-2 px-3 bg-[#202426] hover:bg-[#2F3438] text-white rounded font-semibold text-xs flex items-center justify-center gap-1"
                >
                  <span>💾 خروجی کامل JSON</span>
                </button>
              </div>

              {/* Import Backup File */}
              <div className="pt-2 border-t border-[#E6E2D8]">
                <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                  بازیابی فایل پشتیبان (Import):
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportJSON}
                  className="block w-full text-[11px] text-[#6E7472] file:mr-2 file:py-1 file:px-2 file:rounded file:border file:border-[#D5D0C3] file:text-xs file:bg-[#EBE8DF]"
                />
              </div>

              {/* Reset to Sample Data */}
              <div className="pt-2 border-t border-[#E6E2D8]">
                <button
                  onClick={handleResetSample}
                  className="text-[11px] text-[#B94A48] hover:underline"
                >
                  بازنشانی به اطلاعات نمونه اولیه (چراغ‌برق و خیابان ملت)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
