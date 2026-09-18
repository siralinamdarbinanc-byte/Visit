import React from 'react';
import { UserLocation, ConnectionState } from '../types';
import { FieldCommandLogo, IconGpsRadar, IconSync } from './TechnicalIcons';
import { toPersianDigits } from '../services/storage';

interface HeaderNavProps {
  location: UserLocation;
  connectionState: ConnectionState;
  pendingSyncCount: number;
  onToggleConnection: () => void;
  onOpenSyncCenter: () => void;
  onOpenVisitCockpit: () => void;
  isVisitCockpitActive?: boolean;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  location,
  connectionState,
  pendingSyncCount,
  onToggleConnection,
  onOpenSyncCenter,
  onOpenVisitCockpit,
  isVisitCockpitActive,
}) => {
  return (
    <header className="sticky top-0 z-30 bg-[#123C3A] text-[#FAF9F5] border-b border-[#202426] shadow-sm">
      {/* Top Technical Metadata Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] bg-[#0E2E2C] border-b border-[#1A4B49]/50 font-technical-mono">
        <div className="flex items-center gap-2">
          {/* GPS telemetry beacon */}
          <span className="flex items-center gap-1 text-[#E0DDD5]">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E6B50] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E6B50]"></span>
            </span>
            <span className="text-[10px] tracking-wide text-emerald-400 font-semibold">GPS فعال</span>
            <span className="text-[#9BA19F]">({toPersianDigits(location.accuracy)}m)</span>
          </span>
          <span className="text-[#6E7472]">|</span>
          {/* Lat/Long Telemetry */}
          <span className="text-[#C4BFB2] text-[10px] hidden sm:inline-block dir-ltr font-technical-mono">
            {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E
          </span>
        </div>

        {/* Sync & Connectivity State Indicator */}
        <div className="flex items-center gap-2">
          {/* Clickable Connection Switch to simulate Offline mode */}
          <button
            onClick={onToggleConnection}
            title="کلیک جهت شبیه‌سازی قطع یا وصل اینترنت"
            className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] border transition-colors ${
              connectionState === 'online'
                ? 'bg-[#123C3A] border-emerald-500/40 text-emerald-300 hover:bg-emerald-950'
                : 'bg-[#3A1E1E] border-rose-500/40 text-rose-300 hover:bg-rose-950'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                connectionState === 'online' ? 'bg-emerald-400' : 'bg-rose-400'
              }`}
            />
            <span>{connectionState === 'online' ? 'برخط (آنلاین)' : 'آفلاین میدانی'}</span>
          </button>

          {/* Sync Queue Badge Button */}
          <button
            onClick={onOpenSyncCenter}
            className="flex items-center gap-1 px-1.5 py-0.5 bg-[#174341] hover:bg-[#1D514E] text-[#E7E4DC] rounded border border-[#2A6562] text-[10px] transition-colors"
          >
            <IconSync size={11} className={pendingSyncCount > 0 ? 'text-[#C96F3B]' : 'text-emerald-400'} />
            <span>صف: {toPersianDigits(pendingSyncCount)}</span>
          </button>
        </div>
      </div>

      {/* Main Bar */}
      <div className="flex items-center justify-between px-3 py-2">
        <div className="flex items-center gap-2">
          <FieldCommandLogo size={28} />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold tracking-tight text-[#FAF9F5]">فرمان میدانی</h1>
              <span className="text-[9px] px-1 py-0.2 bg-[#C96F3B] text-white font-mono rounded font-semibold">
                FC-NAV
              </span>
            </div>
            <p className="text-[11px] text-[#A5ABA8] truncate max-w-[200px] sm:max-w-xs flex items-center gap-1">
              <span className="text-[#C96F3B]">●</span>
              <span>{location.areaName}</span>
            </p>
          </div>
        </div>

        {/* Cockpit Mode Toggle Button */}
        <button
          onClick={onOpenVisitCockpit}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded border text-xs font-semibold transition-all ${
            isVisitCockpitActive
              ? 'bg-[#C96F3B] text-white border-[#A85828] shadow-inner'
              : 'bg-[#FAF9F5] text-[#123C3A] border-[#FAF9F5] hover:bg-[#EBE8DF]'
          }`}
        >
          <IconGpsRadar size={14} className={isVisitCockpitActive ? 'animate-spin' : ''} />
          <span>{isVisitCockpitActive ? 'کابین ویزیت فعال' : 'حالت ویزیت'}</span>
        </button>
      </div>
    </header>
  );
};
