import React, { useState } from 'react';
import { Store, UserLocation } from '../types';
import { StatusGlyph, IconPhoneCall, IconNavigation, IconVisitCheck, IconStorefront, IconGpsRadar } from './TechnicalIcons';
import { formatDistance, toPersianDigits } from '../services/storage';

interface HomeScreenProps {
  stores: Store[];
  todayVisitsCount: number;
  todayFollowupsCount: number;
  unvisitedStoresCount: number;
  location: UserLocation;
  onOpenAddStore: () => void;
  onSelectStore: (store: Store) => void;
  onOpenVisitCockpit: () => void;
  onOpenFollowups: () => void;
  onOpenMapNearby: () => void;
  onRecordVisitForStore: (store: Store) => void;
  onSearchSubmit: (query: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  stores,
  todayVisitsCount,
  todayFollowupsCount,
  unvisitedStoresCount,
  location,
  onOpenAddStore,
  onSelectStore,
  onOpenVisitCockpit,
  onOpenFollowups,
  onOpenMapNearby,
  onRecordVisitForStore,
  onSearchSubmit,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Sort stores strictly by proximity for the "نزدیک من" section
  const nearbyStores = [...stores]
    .sort((a, b) => (a.distance || 0) - (b.distance || 0))
    .slice(0, 6);

  const nearestStore = nearbyStores[0];

  const handleSearchKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery);
    }
  };

  return (
    <div className="pb-20 space-y-3 px-3 pt-3 max-w-lg mx-auto">
      {/* 1. Field Search Bar (Prominent, High-Contrast) */}
      <div className="relative">
        <div className="relative flex items-center bg-[#FAF9F5] border-2 border-[#123C3A] rounded shadow-sm focus-within:border-[#C96F3B] transition-colors">
          <div className="pr-3 pl-2 text-[#6E7472]">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKey}
            placeholder="جستجوی فروشگاه، صاحب، برند، قطعه..."
            className="w-full py-2.5 pl-3 text-xs sm:text-sm bg-transparent placeholder-[#8A908E] text-[#171A1B] focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery('');
                onSearchSubmit('');
              }}
              className="px-2.5 text-[#6E7472] hover:text-[#171A1B]"
            >
              ✕
            </button>
          )}
          <button
            onClick={() => onSearchSubmit(searchQuery)}
            className="bg-[#123C3A] text-[#FAF9F5] px-3.5 py-2.5 text-xs font-semibold hover:bg-[#1A4B49] border-r border-[#123C3A]"
          >
            جستجو
          </button>
        </div>
      </div>

      {/* 2. Immediate Field Actions (Tactile, 4 Operations Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
        <button
          onClick={onOpenAddStore}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#123C3A] hover:bg-[#1A4B49] text-[#FAF9F5] rounded border border-[#0E2E2C] text-xs font-bold shadow-xs active:scale-[0.98] transition-transform"
        >
          <span className="text-base text-[#C96F3B] font-black">+</span>
          <span>ثبت فروشگاه</span>
        </button>

        <button
          onClick={onOpenMapNearby}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] text-[#171A1B] rounded border border-[#C4BFB2] text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform"
        >
          <IconNavigation size={14} className="text-[#C96F3B]" />
          <span>فروشگاه‌های نزدیک</span>
        </button>

        <button
          onClick={onOpenVisitCockpit}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] text-[#171A1B] rounded border border-[#C4BFB2] text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform"
        >
          <IconGpsRadar size={14} className="text-[#123C3A]" />
          <span>شروع بازدید</span>
        </button>

        <button
          onClick={onOpenFollowups}
          className="flex items-center justify-center gap-1.5 py-2.5 px-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] text-[#171A1B] rounded border border-[#C4BFB2] text-xs font-semibold shadow-xs active:scale-[0.98] transition-transform"
        >
          <IconVisitCheck size={14} className="text-[#2E6B50]" />
          <span>پیگیری‌ها ({toPersianDigits(todayFollowupsCount)})</span>
        </button>
      </div>

      {/* 3. Compact Technical Field Telemetry Strip (NOT 4 giant cards) */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-2.5">
        <div className="flex items-center justify-between pb-1.5 border-b border-[#E6E2D8] text-[11px] font-semibold text-[#6E7472]">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 bg-[#C96F3B] rounded-full inline-block"></span>
            وضعیت میدانی امروز
          </span>
          <span className="font-technical-mono text-[10px] text-[#8A908E]">
            {location.areaName.split('،')[1] || location.areaName}
          </span>
        </div>

        <div className="grid grid-cols-4 divide-x divide-x-reverse divide-[#E6E2D8] pt-2 text-center">
          <div className="px-1">
            <span className="block text-[10px] text-[#6E7472] leading-tight">بازدید امروز</span>
            <span className="text-sm font-bold text-[#123C3A] font-technical-mono">
              {toPersianDigits(todayVisitsCount)}
            </span>
          </div>

          <div className="px-1">
            <span className="block text-[10px] text-[#6E7472] leading-tight">پیگیری امروز</span>
            <span className="text-sm font-bold text-[#C96F3B] font-technical-mono">
              {toPersianDigits(todayFollowupsCount)}
            </span>
          </div>

          <div className="px-1">
            <span className="block text-[10px] text-[#6E7472] leading-tight">نزدیک‌ترین</span>
            <span className="text-sm font-bold text-[#202426] font-technical-mono">
              {nearestStore ? formatDistance(nearestStore.distance || 0) : '—'}
            </span>
          </div>

          <div className="px-1">
            <span className="block text-[10px] text-[#6E7472] leading-tight">بازدیدنشده</span>
            <span className="text-sm font-bold text-[#6E7472] font-technical-mono">
              {toPersianDigits(unvisitedStoresCount)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. "نزدیک من" (Compact proximity list for field immediate action) */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-[#EBE8DF] border-b border-[#D5D0C3]">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
            <h2 className="text-xs font-bold text-[#171A1B]">فروشگاه‌های نزدیک من</h2>
            <span className="text-[10px] bg-[#D5D0C3] text-[#202426] px-1.5 py-0.2 rounded font-technical-mono">
              شعاع ۵۰۰ متر
            </span>
          </div>
          <button
            onClick={onOpenMapNearby}
            className="text-[11px] text-[#123C3A] font-semibold hover:text-[#C96F3B] flex items-center gap-0.5"
          >
            <span>نمایش در نقشه</span>
            <span>←</span>
          </button>
        </div>

        {/* Compact List Rows with Dividers */}
        <div className="divide-y divide-[#EBE8DF]">
          {nearbyStores.map((store, index) => (
            <div
              key={store.id}
              className="p-2.5 hover:bg-[#F3F1EA] transition-colors flex items-center justify-between gap-2"
            >
              {/* Left Column: Proximity index + Status + Name & Category */}
              <div
                onClick={() => onSelectStore(store)}
                className="flex items-start gap-2 flex-1 cursor-pointer min-w-0"
              >
                {/* Visual Status Glyph */}
                <div className="pt-0.5">
                  <StatusGlyph status={store.customer_status} size={14} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#171A1B] truncate">{store.name}</span>
                    {store.customer_status === 'customer' && (
                      <span className="text-[9px] px-1 py-0.2 bg-[#2E6B50]/15 text-[#2E6B50] font-semibold rounded">
                        مشتری
                      </span>
                    )}
                    {store.customer_status === 'potential' && (
                      <span className="text-[9px] px-1 py-0.2 bg-[#C96F3B]/15 text-[#C96F3B] font-semibold rounded">
                        بالقوه
                      </span>
                    )}
                    {store.customer_status === 'new' && (
                      <span className="text-[9px] px-1 py-0.2 bg-[#C28A32]/15 text-[#C28A32] font-semibold rounded">
                        جدید
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#6E7472]">
                    <span className="truncate">{store.category}</span>
                    <span>•</span>
                    <span className="truncate">{store.area}</span>
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8A908E]">
                    <span>آخرین ویزیت: {store.last_visit_date || 'ثبت نشده'}</span>
                  </div>
                </div>
              </div>

              {/* Right Column: Distance + Quick Actions */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                {/* Distance Badge */}
                <span className="text-[11px] font-bold text-[#123C3A] font-technical-mono px-1.5 py-0.5 bg-[#EBE8DF] rounded border border-[#D5D0C3]">
                  {formatDistance(store.distance || 0)}
                </span>

                {/* Quick Action Buttons */}
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${store.mobile || store.phone}`}
                    title="تماس فوری"
                    className="p-1.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-[#202426] hover:text-[#123C3A] transition-colors"
                  >
                    <IconPhoneCall size={13} />
                  </a>
                  <button
                    onClick={() => onRecordVisitForStore(store)}
                    title="ثبت ویزیت حضوری"
                    className="p-1.5 bg-[#123C3A] hover:bg-[#1A4B49] border border-[#0E2E2C] rounded text-[#FAF9F5] transition-colors"
                  >
                    <IconVisitCheck size={13} />
                  </button>
                  <button
                    onClick={() => onSelectStore(store)}
                    title="پرونده فروشگاه"
                    className="px-2 py-1 bg-[#C96F3B] hover:bg-[#B05B29] rounded text-white text-[10px] font-semibold transition-colors"
                  >
                    پرونده
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
