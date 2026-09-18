import React, { useState } from 'react';
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
  onRefreshGPS?: () => Promise<UserLocation> | void;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({
  location,
  connectionState,
  pendingSyncCount,
  onToggleConnection,
  onOpenSyncCenter,
  onOpenVisitCockpit,
  isVisitCockpitActive,
  onRefreshGPS,
}) => {
  const [showGpsDiag, setShowGpsDiag] = useState(false);
  const [isRetryingGPS, setIsRetryingGPS] = useState(false);

  const handleRetryGPS = async () => {
    if (!onRefreshGPS) return;
    setIsRetryingGPS(true);
    try {
      await onRefreshGPS();
    } catch {
      // Handled in location state
    } finally {
      setIsRetryingGPS(false);
    }
  };

  const isReal = Boolean(location.isRealGPS);
  const status = location.gpsStatus || 'searching';

  return (
    <header className="sticky top-0 z-30 bg-[#123C3A] text-[#FAF9F5] border-b border-[#202426] shadow-sm">
      {/* Top Technical Metadata Strip */}
      <div className="flex items-center justify-between px-3 py-1.5 text-[11px] bg-[#0E2E2C] border-b border-[#1A4B49]/50 font-technical-mono">
        <div className="flex items-center gap-2">
          {/* GPS telemetry beacon button */}
          <button
            onClick={() => setShowGpsDiag(!showGpsDiag)}
            title="مشاهده وضعیت دقیق ماهواره GPS و عیب‌یابی"
            className="flex items-center gap-1.5 text-[#E0DDD5] hover:bg-[#154643] px-1.5 py-0.5 rounded transition-colors"
          >
            {isReal && status === 'active' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2E6B50] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#2E6B50]"></span>
              </span>
            ) : status === 'searching' ? (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400"></span>
              </span>
            ) : (
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
            )}

            {isReal && status === 'active' ? (
              <>
                <span className="text-[10px] tracking-wide text-emerald-400 font-semibold">GPS فعال</span>
                <span className="text-[#9BA19F]">({toPersianDigits(location.accuracy)}m)</span>
              </>
            ) : status === 'searching' ? (
              <span className="text-[10px] tracking-wide text-amber-300 font-semibold animate-pulse">
                در حال دریافت GPS...
              </span>
            ) : status === 'denied' ? (
              <span className="text-[10px] tracking-wide text-rose-300 font-semibold">
                GPS مسدود است ⚠
              </span>
            ) : status === 'timeout' ? (
              <span className="text-[10px] tracking-wide text-amber-300 font-semibold">
                پایان مهلت GPS ⚠
              </span>
            ) : (
              <span className="text-[10px] tracking-wide text-rose-300 font-semibold">
                سیگنال GPS ناموجود ⚠
              </span>
            )}
          </button>

          <span className="text-[#6E7472]">|</span>

          {/* Lat/Long Telemetry */}
          {isReal && location.latitude !== 0 ? (
            <span className="text-[#C4BFB2] text-[10px] hidden sm:inline-block dir-ltr font-technical-mono">
              {location.latitude.toFixed(5)}°N, {location.longitude.toFixed(5)}°E
            </span>
          ) : (
            <span className="text-[#88908D] text-[10px] hidden sm:inline-block">
              {status === 'searching' ? 'در انتظار ماهواره...' : 'مختصات ثبت نشده'}
            </span>
          )}
        </div>

        {/* Sync & Connectivity State Indicator */}
        <div className="flex items-center gap-2">
          {/* Clickable Connection Switch */}
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

      {/* GPS Diagnostics Flyout / Modal */}
      {showGpsDiag && (
        <div className="bg-[#172625] border-b border-[#2E6B50] p-3 text-xs text-[#FAF9F5] shadow-lg animate-fadeIn">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 font-bold mb-1 text-sm">
                <span className="text-[#C96F3B]">🛰 عیب‌یابی موقعیت مکانی زنده (GPS):</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isReal && status === 'active'
                      ? 'bg-emerald-900 text-emerald-300 border border-emerald-500/50'
                      : status === 'searching'
                      ? 'bg-amber-900 text-amber-300 border border-amber-500/50'
                      : 'bg-rose-900 text-rose-200 border border-rose-500/50'
                  }`}
                >
                  {isReal && status === 'active'
                    ? 'متصل به ماهواره'
                    : status === 'searching'
                    ? 'در حال جستجو...'
                    : `خطا (${location.errorCode || 'نامشخص'})`}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-[#C4BFB2] mt-2">
                <div>
                  <span className="text-[#88908D]">منبع داده: </span>
                  <span className="font-semibold text-white">
                    {isReal ? 'سخت‌افزار GPS / سنسور دستگاه (WGS84)' : 'سیگنال در دسترس نیست'}
                  </span>
                </div>
                <div>
                  <span className="text-[#88908D]">مختصات: </span>
                  <span className="font-mono text-white dir-ltr inline-block">
                    {isReal && location.latitude !== 0
                      ? `${location.latitude.toFixed(6)}°N, ${location.longitude.toFixed(6)}°E`
                      : 'ثبت نشده'}
                  </span>
                </div>
                <div>
                  <span className="text-[#88908D]">خطای شعاعی (Accuracy): </span>
                  <span className="font-semibold text-white">
                    {isReal ? `${toPersianDigits(location.accuracy)} متر` : 'نامشخص'}
                  </span>
                </div>
                <div>
                  <span className="text-[#88908D]">محدوده برآوردی: </span>
                  <span className="text-white">{location.areaName}</span>
                </div>
              </div>

              {location.errorMessage && (
                <div className="mt-2 p-2 bg-rose-950/80 border border-rose-600/60 rounded text-[11px] text-rose-200 leading-relaxed">
                  <span className="font-bold">پیام خطای سنسور / مرورگر: </span>
                  <span>{location.errorMessage}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2 items-end shrink-0">
              <button
                onClick={() => setShowGpsDiag(false)}
                className="text-[#9BA19F] hover:text-white text-xs px-2 py-0.5 rounded hover:bg-[#203D3B]"
              >
                بستن ✕
              </button>
              {onRefreshGPS && (
                <button
                  onClick={handleRetryGPS}
                  disabled={isRetryingGPS}
                  className="px-2.5 py-1 bg-[#2E6B50] hover:bg-[#3B8062] disabled:opacity-50 text-white rounded font-medium text-[11px] flex items-center gap-1 transition-colors"
                >
                  <IconGpsRadar size={12} className={isRetryingGPS ? 'animate-spin' : ''} />
                  <span>{isRetryingGPS ? 'در حال اتصال...' : 'تلاش مجدد GPS'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
