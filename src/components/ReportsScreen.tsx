import React, { useState } from 'react';
import { Store, Visit, FollowUp } from '../types';
import { toPersianDigits } from '../services/storage';

interface ReportsScreenProps {
  stores: Store[];
  visits: Visit[];
  followups: FollowUp[];
  onSelectCategoryFilter: (category: string) => void;
  onSelectAreaFilter: (area: string) => void;
  onOpenStoreList: () => void;
  onOpenFollowups: () => void;
}

export const ReportsScreen: React.FC<ReportsScreenProps> = ({
  stores,
  visits,
  followups,
  onSelectCategoryFilter,
  onSelectAreaFilter,
  onOpenStoreList,
  onOpenFollowups,
}) => {
  const [activeReportTab, setActiveReportTab] = useState<'overview' | 'areas' | 'brands' | 'categories'>('overview');

  // Calculations
  const totalStores = stores.length;
  const visitedStoresCount = stores.filter((s) => (s.visit_count || 0) > 0).length;
  const unvisitedStoresCount = totalStores - visitedStoresCount;
  const customersCount = stores.filter((s) => s.customer_status === 'customer').length;
  const potentialCount = stores.filter((s) => s.customer_status === 'potential').length;
  const overdueFollowupsCount = followups.filter((f) => f.status === 'overdue').length;

  // Area coverage calculation
  const areaStats: Record<string, { total: number; visited: number }> = {};
  stores.forEach((s) => {
    if (!areaStats[s.area]) {
      areaStats[s.area] = { total: 0, visited: 0 };
    }
    areaStats[s.area].total++;
    if ((s.visit_count || 0) > 0) {
      areaStats[s.area].visited++;
    }
  });

  // Brands frequency
  const brandStats: Record<string, number> = {};
  stores.forEach((s) => {
    s.brands.forEach((b) => {
      brandStats[b] = (brandStats[b] || 0) + 1;
    });
  });
  const sortedBrands = Object.entries(brandStats).sort((a, b) => b[1] - a[1]);

  // Categories frequency
  const categoryStats: Record<string, number> = {};
  stores.forEach((s) => {
    categoryStats[s.category] = (categoryStats[s.category] || 0) + 1;
  });
  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

  // Visit outcome distribution
  const outcomeStats: Record<string, number> = {};
  visits.forEach((v) => {
    outcomeStats[v.result] = (outcomeStats[v.result] || 0) + 1;
  });

  return (
    <div className="pb-20 px-3 pt-3 max-w-lg mx-auto space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold text-[#171A1B] flex items-center gap-1.5">
          <span>اطلاعات میدانی و گزارشات هوشمند</span>
          <span className="text-[10px] bg-[#C96F3B] text-white px-1.5 py-0.2 rounded font-mono font-bold">
            FIELD INTEL
          </span>
        </h1>
        <p className="text-[11px] text-[#6E7472]">پوشش جغرافیایی، فراوانی ویزیت و رفتار بازار</p>
      </div>

      {/* Sub-report selector tabs */}
      <div className="flex items-center gap-1 bg-[#EBE8DF] p-1 rounded border border-[#D5D0C3] text-xs font-semibold">
        {[
          { id: 'overview', label: 'گزارش کلی' },
          { id: 'areas', label: 'پوشش مناطق' },
          { id: 'brands', label: 'تحلیل برندها' },
          { id: 'categories', label: 'اصناف قطعات' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveReportTab(tab.id as any)}
            className={`flex-1 py-1.5 rounded text-[11px] text-center transition-colors ${
              activeReportTab === tab.id
                ? 'bg-[#123C3A] text-white'
                : 'text-[#202426] hover:bg-[#FAF9F5]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW INTEL */}
      {activeReportTab === 'overview' && (
        <div className="space-y-2.5">
          {/* Compact Telemetry Module (Clickable to jump to filtered views) */}
          <div className="bg-[#FAF9F5] border border-[#202426] rounded p-3 space-y-2.5">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-1.5 text-xs font-bold text-[#171A1B]">
              <span>خلاصه شاخص‌های عملیات میدانی</span>
              <span className="text-[10px] text-[#6E7472] font-technical-mono">به‌روزرسانی پیوسته</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <button
                onClick={onOpenStoreList}
                className="p-2 bg-[#F3F1EA] hover:bg-[#EBE8DF] rounded border border-[#D5D0C3] text-right"
              >
                <span className="block text-[10px] text-[#6E7472]">کل فروشگاه‌ها</span>
                <span className="text-base font-bold text-[#123C3A] font-technical-mono">
                  {toPersianDigits(totalStores)}
                </span>
              </button>

              <button
                onClick={onOpenStoreList}
                className="p-2 bg-[#F3F1EA] hover:bg-[#EBE8DF] rounded border border-[#D5D0C3] text-right"
              >
                <span className="block text-[10px] text-[#6E7472]">مشتری ثبت‌شده</span>
                <span className="text-base font-bold text-[#2E6B50] font-technical-mono">
                  {toPersianDigits(customersCount)}
                </span>
              </button>

              <button
                onClick={onOpenStoreList}
                className="p-2 bg-[#F3F1EA] hover:bg-[#EBE8DF] rounded border border-[#D5D0C3] text-right"
              >
                <span className="block text-[10px] text-[#6E7472]">بازدیدنشده</span>
                <span className="text-base font-bold text-[#C96F3B] font-technical-mono">
                  {toPersianDigits(unvisitedStoresCount)}
                </span>
              </button>

              <button
                onClick={onOpenFollowups}
                className="p-2 bg-[#F3F1EA] hover:bg-[#EBE8DF] rounded border border-[#D5D0C3] text-right"
              >
                <span className="block text-[10px] text-[#6E7472]">پیگیری معوق</span>
                <span className="text-base font-bold text-[#B94A48] font-technical-mono">
                  {toPersianDigits(overdueFollowupsCount)}
                </span>
              </button>
            </div>
          </div>

          {/* Quick Data Export Bar */}
          <div className="bg-[#FAF9F5] border border-[#202426] rounded p-3 space-y-2">
            <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-1.5 text-xs font-bold text-[#171A1B]">
              <span>خروجی گرفتن و گزارش‌گیری داده‌ها</span>
              <span className="text-[10px] text-[#2E6B50] font-bold">CSV / JSON آفلاین</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={async () => {
                  const { exportStoresToCSV } = await import('../utils/export');
                  exportStoresToCSV(stores);
                }}
                className="p-2 bg-[#EBE8DF] hover:bg-[#D5D0C3] border border-[#C4BFB2] rounded text-right font-semibold text-[#123C3A] flex items-center justify-between"
              >
                <span>اکسل فروشگاه‌ها (CSV)</span>
                <span className="text-sm">📥</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  const { exportVisitsToCSV } = await import('../utils/export');
                  exportVisitsToCSV(visits);
                }}
                className="p-2 bg-[#EBE8DF] hover:bg-[#D5D0C3] border border-[#C4BFB2] rounded text-right font-semibold text-[#123C3A] flex items-center justify-between"
              >
                <span>اکسل ویزیت‌ها (CSV)</span>
                <span className="text-sm">📥</span>
              </button>
            </div>
          </div>

          {/* Visit Outcomes Breakdown */}
          <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-2">
            <span className="text-xs font-bold text-[#171A1B] block">
              نتایج آخرین مذاکرات حضوری ({toPersianDigits(visits.length)} ویزیت ثبت شده)
            </span>

            <div className="space-y-1.5 text-xs">
              {[
                { label: 'سفارش قطعی و خرید', count: outcomeStats['purchased'] || 0, color: 'bg-emerald-600' },
                { label: 'علاقه‌مند به استعلام قیمت', count: outcomeStats['interested'] || 0, color: 'bg-amber-600' },
                { label: 'نیاز به پیگیری مجدد', count: outcomeStats['needs_followup'] || 0, color: 'bg-orange-600' },
                { label: 'عدم حضور مدیر یا تعطیلی', count: (outcomeStats['manager_absent'] || 0) + (outcomeStats['closed'] || 0), color: 'bg-stone-500' },
              ].map((row) => {
                const pct = visits.length > 0 ? Math.round((row.count / visits.length) * 100) : 0;
                return (
                  <div key={row.label} className="space-y-0.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#171A1B]">{row.label}</span>
                      <span className="font-mono text-[#6E7472]">
                        {toPersianDigits(row.count)} مورد ({toPersianDigits(pct)}%)
                      </span>
                    </div>
                    <div className="w-full bg-[#EBE8DF] h-2 rounded overflow-hidden">
                      <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. AREAS COVERAGE */}
      {activeReportTab === 'areas' && (
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-3">
          <div className="flex items-center justify-between border-b border-[#E6E2D8] pb-1.5 text-xs font-bold text-[#171A1B]">
            <span>درصد پوشش ویزیت در هر راسته / منطقه بازار</span>
            <span className="text-[10px] text-[#6E7472]">هدف‌گذاری میدانی</span>
          </div>

          <div className="space-y-3">
            {Object.entries(areaStats).map(([areaName, stats]) => {
              const coveragePct = Math.round((stats.visited / stats.total) * 100);
              return (
                <div
                  key={areaName}
                  onClick={() => onSelectAreaFilter(areaName)}
                  className="p-2 rounded bg-[#F3F1EA] hover:bg-[#EBE8DF] cursor-pointer transition-colors border border-[#E6E2D8]"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold text-[#171A1B]">{areaName}</span>
                    <span className="font-mono font-bold text-[#123C3A]">
                      {toPersianDigits(coveragePct)}% پوشش ({toPersianDigits(stats.visited)} از {toPersianDigits(stats.total)})
                    </span>
                  </div>

                  {/* Technical Ascii / Block meter representation */}
                  <div className="w-full bg-[#E0DDD5] h-2.5 rounded overflow-hidden flex">
                    <div
                      className="bg-[#123C3A] h-full transition-all"
                      style={{ width: `${coveragePct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. BRANDS ANALYSIS */}
      {activeReportTab === 'brands' && (
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-3">
          <div className="border-b border-[#E6E2D8] pb-1.5 text-xs font-bold text-[#171A1B]">
            برندهای دارای بالاترین تقاضا و موجودی در فروشگاه‌ها
          </div>

          <div className="space-y-2">
            {sortedBrands.map(([brandName, count]) => {
              const pct = Math.round((count / totalStores) * 100);
              return (
                <div key={brandName} className="flex items-center justify-between text-xs p-1.5 bg-[#F3F1EA] rounded border border-[#E6E2D8]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-[#C96F3B]" />
                    <span className="font-bold text-[#171A1B]">{brandName}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="text-[#6E7472]">{toPersianDigits(count)} فروشگاه</span>
                    <span className="font-bold text-[#123C3A]">({toPersianDigits(pct)}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. CATEGORIES BREAKDOWN */}
      {activeReportTab === 'categories' && (
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-3 space-y-3">
          <div className="border-b border-[#E6E2D8] pb-1.5 text-xs font-bold text-[#171A1B]">
            توزیع اصناف قطعات و رسته فعالیت
          </div>

          <div className="space-y-2">
            {sortedCategories.map(([catName, count]) => (
              <div
                key={catName}
                onClick={() => onSelectCategoryFilter(catName)}
                className="flex items-center justify-between text-xs p-2 bg-[#F3F1EA] hover:bg-[#EBE8DF] cursor-pointer rounded border border-[#E6E2D8]"
              >
                <span className="font-bold text-[#171A1B]">{catName}</span>
                <span className="font-mono font-bold text-[#123C3A] bg-[#EBE8DF] px-2 py-0.5 rounded">
                  {toPersianDigits(count)} فروشگاه
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
