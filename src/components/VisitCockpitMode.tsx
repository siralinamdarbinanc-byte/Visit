import React, { useState } from 'react';
import { Store, UserLocation } from '../types';
import { StatusGlyph, IconPhoneCall, IconNavigation, IconVisitCheck, IconCompass, IconGpsRadar } from './TechnicalIcons';
import { formatDistance, toPersianDigits } from '../services/storage';

interface VisitCockpitModeProps {
  stores: Store[];
  userLocation: UserLocation;
  onExitCockpit: () => void;
  onRecordVisit: (store: Store) => void;
  onNavigate: (store: Store) => void;
  onSelectStore: (store: Store) => void;
}

export const VisitCockpitMode: React.FC<VisitCockpitModeProps> = ({
  stores,
  userLocation,
  onExitCockpit,
  onRecordVisit,
  onNavigate,
  onSelectStore,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'unvisited' | 'followup'>('all');

  // Strictly sort by proximity
  const sortedStores = [...stores]
    .filter((s) => {
      if (filterMode === 'unvisited') return (s.visit_count || 0) === 0;
      if (filterMode === 'followup') return s.last_visit_result === 'needs_followup';
      return true;
    })
    .sort((a, b) => (a.distance || 0) - (b.distance || 0));

  const targetStore = sortedStores[0];

  return (
    <div className="min-h-screen bg-[#171A1B] text-[#FAF9F5] pb-20 select-none">
      {/* 1. Cockpit Instrument Top HUD */}
      <div className="bg-[#123C3A] border-b-2 border-[#C96F3B] p-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#C96F3B] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-[#C96F3B]"></span>
            </span>
            <div>
              <h1 className="text-sm font-bold tracking-tight text-white flex items-center gap-1.5">
                <span>کابین هدایت میدانی ویزیت</span>
                <span className="bg-[#C96F3B] text-[9px] px-1 rounded font-mono font-bold">COCKPIT</span>
              </h1>
              <p className="text-[11px] text-[#A5ABA8] font-technical-mono">
                {userLocation.latitude.toFixed(4)}°N, {userLocation.longitude.toFixed(4)}°E • سرعت: {toPersianDigits(userLocation.speed || 0)} km/h
              </p>
            </div>
          </div>

          <button
            onClick={onExitCockpit}
            className="px-2.5 py-1 bg-[#202426] hover:bg-[#2F3438] border border-[#6E7472] rounded text-xs font-semibold text-[#E7E4DC]"
          >
            خروج از کابین ✕
          </button>
        </div>

        {/* Proximity Filter Tabs */}
        <div className="flex items-center gap-1 mt-2.5">
          {[
            { id: 'all', label: 'همه به ترتیب فاصله' },
            { id: 'unvisited', label: 'فقط ویزیت‌نشده‌ها' },
            { id: 'followup', label: 'نیازمند پیگیری' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterMode(tab.id as any)}
              className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                filterMode === tab.id
                  ? 'bg-[#C96F3B] text-white'
                  : 'bg-[#202426] text-[#A5ABA8] hover:bg-[#2B3033]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto p-3 space-y-3">
        {/* 2. Target 01 Hero Instrument Box */}
        {targetStore && (
          <div className="bg-[#202426] border-2 border-[#C96F3B] rounded-lg p-3 shadow-lg relative overflow-hidden">
            {/* Top target label */}
            <div className="flex items-center justify-between text-[11px] pb-2 border-b border-[#353A3D]">
              <div className="flex items-center gap-1.5">
                <span className="bg-[#C96F3B] text-white text-[10px] font-bold px-1.5 py-0.2 rounded font-mono">
                  هدف بعدی ۰۱
                </span>
                <span className="text-[#A5ABA8]">نزدیک‌ترین فروشگاه به شما</span>
              </div>
              <span className="text-emerald-400 font-mono text-xs font-bold">
                {formatDistance(targetStore.distance || 0)}
              </span>
            </div>

            {/* Target Store Details */}
            <div className="mt-2.5 flex items-start justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-white">{targetStore.name}</h2>
                <p className="text-xs text-[#C4BFB2] mt-0.5">
                  مدیریت: <span className="font-semibold text-white">{targetStore.owner}</span>
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] text-[#A5ABA8]">
                  <span>{targetStore.category}</span>
                  <span>•</span>
                  <span>{targetStore.area}</span>
                </div>
                <div className="text-[10px] text-[#8A908E] mt-1">
                  آخرین ویزیت: {targetStore.last_visit_date || 'تاکنون ویزیت نشده'}
                </div>
              </div>

              <div className="pt-1">
                <StatusGlyph status={targetStore.customer_status} size={20} />
              </div>
            </div>

            {/* Tactical High-Contrast Buttons */}
            <div className="grid grid-cols-3 gap-2 mt-3 pt-2.5 border-t border-[#353A3D]">
              <a
                href={`tel:${targetStore.mobile || targetStore.phone}`}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-[#2B3033] hover:bg-[#383E42] rounded text-xs font-bold text-white border border-[#484F54]"
              >
                <IconPhoneCall size={15} />
                <span>تماس فوری</span>
              </a>

              <button
                onClick={() => onNavigate(targetStore)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-[#2B3033] hover:bg-[#383E42] rounded text-xs font-bold text-[#C96F3B] border border-[#484F54]"
              >
                <IconNavigation size={15} />
                <span>مسیریابی</span>
              </button>

              <button
                onClick={() => onRecordVisit(targetStore)}
                className="flex items-center justify-center gap-1.5 py-2.5 bg-[#C96F3B] hover:bg-[#B05B29] rounded text-xs font-bold text-white shadow-md active:scale-95"
              >
                <IconVisitCheck size={15} />
                <span>ثبت ویزیت</span>
              </button>
            </div>
          </div>
        )}

        {/* 3. Sequential Queue (02, 03, 04, ...) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#A5ABA8] px-1">
            <span>صف ویزیت‌های پی‌درپی بعدی</span>
            <span className="font-mono">{toPersianDigits(sortedStores.length)} فروشگاه در محدوده</span>
          </div>

          <div className="space-y-1.5">
            {sortedStores.slice(1).map((store, index) => {
              const itemNumber = (index + 2).toString().padStart(2, '0');
              return (
                <div
                  key={store.id}
                  className="bg-[#202426] border border-[#353A3D] hover:border-[#6E7472] rounded p-2.5 flex items-center justify-between gap-2 transition-colors"
                >
                  {/* Left: Index + Details */}
                  <div
                    onClick={() => onSelectStore(store)}
                    className="flex items-start gap-2.5 flex-1 cursor-pointer min-w-0"
                  >
                    <span className="text-xs font-mono font-bold text-[#C96F3B] bg-[#171A1B] px-1.5 py-0.5 rounded border border-[#353A3D]">
                      {itemNumber}
                    </span>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{store.name}</span>
                        <StatusGlyph status={store.customer_status} size={12} />
                      </div>
                      <div className="text-[11px] text-[#A5ABA8] truncate mt-0.5">
                        {store.category} • {store.owner}
                      </div>
                      <div className="text-[10px] text-[#6E7472] mt-0.5">
                        آخرین ویزیت: {store.last_visit_date || 'ویزیت نشده'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Distance & Instant Action */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-xs font-bold text-[#FAF9F5] font-technical-mono px-1.5 py-0.5 bg-[#171A1B] rounded border border-[#353A3D]">
                      {formatDistance(store.distance || 0)}
                    </span>

                    <div className="flex items-center gap-1">
                      <a
                        href={`tel:${store.mobile || store.phone}`}
                        className="p-1.5 bg-[#2B3033] hover:bg-[#383E42] rounded text-[#C4BFB2]"
                        title="تماس"
                      >
                        <IconPhoneCall size={13} />
                      </a>
                      <button
                        onClick={() => onNavigate(store)}
                        className="p-1.5 bg-[#2B3033] hover:bg-[#383E42] rounded text-[#C96F3B]"
                        title="مسیریابی"
                      >
                        <IconNavigation size={13} />
                      </button>
                      <button
                        onClick={() => onRecordVisit(store)}
                        className="px-2 py-1 bg-[#123C3A] hover:bg-[#1A4B49] rounded text-[11px] font-bold text-white"
                      >
                        ویزیت
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
