import React, { useState, useMemo } from 'react';
import { Store, CustomerStatus, StoreCategory } from '../types';
import { StatusGlyph, IconPhoneCall, IconNavigation, IconVisitCheck } from './TechnicalIcons';
import { formatDistance, toPersianDigits } from '../services/storage';

interface StoreListScreenProps {
  stores: Store[];
  onSelectStore: (store: Store) => void;
  onRecordVisit: (store: Store) => void;
  onNavigateToStore: (store: Store) => void;
  onOpenAddStore: () => void;
}

type SortOption = 'nearest' | 'last_visit' | 'unvisited' | 'followup' | 'newest';

export const StoreListScreen: React.FC<StoreListScreenProps> = ({
  stores,
  onSelectStore,
  onRecordVisit,
  onNavigateToStore,
  onOpenAddStore,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSort, setSelectedSort] = useState<SortOption>('nearest');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterArea, setFilterArea] = useState<string>('all');
  const [isFilterPanelOpen, setIsFilterPanelOpen] = useState(false);

  // Extract unique areas and categories
  const areas = useMemo(() => Array.from(new Set(stores.map((s) => s.area))), [stores]);
  const categories = useMemo(() => Array.from(new Set(stores.map((s) => s.category))), [stores]);

  // Filter & Sort
  const processedStores = useMemo(() => {
    let result = [...stores];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.owner.toLowerCase().includes(q) ||
          s.mobile.includes(q) ||
          s.phone.includes(q) ||
          s.address.toLowerCase().includes(q) ||
          s.area.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.brands.some((b) => b.toLowerCase().includes(q)) ||
          s.products.some((p) => p.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (filterCategory !== 'all') {
      result = result.filter((s) => s.category === filterCategory);
    }

    // Customer Status Filter
    if (filterStatus !== 'all') {
      result = result.filter((s) => s.customer_status === filterStatus);
    }

    // Area Filter
    if (filterArea !== 'all') {
      result = result.filter((s) => s.area === filterArea);
    }

    // Sort
    switch (selectedSort) {
      case 'nearest':
        result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
        break;
      case 'unvisited':
        result.sort((a, b) => (a.visit_count || 0) - (b.visit_count || 0));
        break;
      case 'followup':
        result.sort((a, b) => {
          const aNeed = a.last_visit_result === 'needs_followup' ? 1 : 0;
          const bNeed = b.last_visit_result === 'needs_followup' ? 1 : 0;
          return bNeed - aNeed;
        });
        break;
      case 'newest':
        result.sort((a, b) => b.id.localeCompare(a.id));
        break;
      case 'last_visit':
        result.sort((a, b) => (b.last_visit_date || '').localeCompare(a.last_visit_date || ''));
        break;
    }

    return result;
  }, [stores, searchQuery, selectedSort, filterCategory, filterStatus, filterArea]);

  const activeFiltersCount =
    (filterCategory !== 'all' ? 1 : 0) +
    (filterStatus !== 'all' ? 1 : 0) +
    (filterArea !== 'all' ? 1 : 0);

  return (
    <div className="pb-20 px-3 pt-3 max-w-lg mx-auto space-y-2.5">
      {/* Header with Store Count and Add Store Button */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-bold text-[#171A1B] flex items-center gap-1.5">
            <span>فهرست فروشگاه‌ها</span>
            <span className="text-xs font-mono font-bold bg-[#EBE8DF] text-[#123C3A] px-1.5 py-0.2 rounded">
              {toPersianDigits(processedStores.length)} فروشگاه
            </span>
          </h1>
          <p className="text-[11px] text-[#6E7472]">مدیریت پرونده‌های میدانی و قطعه‌فروشان</p>
        </div>

        <button
          onClick={onOpenAddStore}
          className="flex items-center gap-1 px-3 py-1.5 bg-[#123C3A] hover:bg-[#1A4B49] text-[#FAF9F5] text-xs font-semibold rounded border border-[#0E2E2C] shadow-xs active:scale-95 transition-transform"
        >
          <span className="text-[#C96F3B] font-bold text-sm">+</span>
          <span>ثبت فروشگاه</span>
        </button>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="flex items-center bg-[#FAF9F5] border border-[#202426] rounded px-2.5 py-1.5 shadow-xs focus-within:border-[#C96F3B]">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E7472" strokeWidth="2.5" className="ml-2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام، صنف، قطعه یا برند..."
            className="w-full text-xs bg-transparent text-[#171A1B] focus:outline-none placeholder-[#8A908E]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-[#6E7472] px-1">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Sort & Filter Controls Bar */}
      <div className="flex items-center justify-between gap-1.5 text-xs">
        {/* Sort selector */}
        <div className="flex items-center gap-1 bg-[#FAF9F5] border border-[#D5D0C3] rounded px-2 py-1">
          <span className="text-[10px] text-[#6E7472]">مرتب‌سازی:</span>
          <select
            value={selectedSort}
            onChange={(e) => setSelectedSort(e.target.value as SortOption)}
            className="bg-transparent text-xs font-semibold text-[#171A1B] focus:outline-none cursor-pointer"
          >
            <option value="nearest">نزدیک‌ترین</option>
            <option value="last_visit">آخرین بازدید</option>
            <option value="unvisited">بازدیدنشده</option>
            <option value="followup">نیازمند پیگیری</option>
            <option value="newest">جدیدترین</option>
          </select>
        </div>

        {/* Filter Toggle Button */}
        <button
          onClick={() => setIsFilterPanelOpen(!isFilterPanelOpen)}
          className={`flex items-center gap-1 px-2.5 py-1 rounded border text-xs font-semibold transition-colors ${
            activeFiltersCount > 0
              ? 'bg-[#123C3A] text-white border-[#123C3A]'
              : 'bg-[#FAF9F5] text-[#202426] border-[#D5D0C3] hover:bg-[#EBE8DF]'
          }`}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span>فیلترها</span>
          {activeFiltersCount > 0 && (
            <span className="bg-[#C96F3B] text-white px-1 text-[10px] rounded-full">
              {toPersianDigits(activeFiltersCount)}
            </span>
          )}
        </button>
      </div>

      {/* Expandable Filter Panel */}
      {isFilterPanelOpen && (
        <div className="bg-[#FAF9F5] border border-[#202426] rounded p-2.5 text-xs space-y-2 shadow-sm animate-in fade-in duration-150">
          <div className="flex items-center justify-between pb-1 border-b border-[#E6E2D8]">
            <span className="font-bold text-[#171A1B]">فیلترهای پیشرفته</span>
            <button
              onClick={() => {
                setFilterCategory('all');
                setFilterStatus('all');
                setFilterArea('all');
              }}
              className="text-[11px] text-[#B94A48] hover:underline"
            >
              پاک‌سازی فیلترها
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Category Filter */}
            <div>
              <label className="block text-[10px] text-[#6E7472] mb-0.5">دسته‌بندی صنف:</label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="w-full bg-[#EBE8DF] border border-[#D5D0C3] rounded p-1 text-xs"
              >
                <option value="all">همه دسته‌ها</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-[10px] text-[#6E7472] mb-0.5">وضعیت مشتری:</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#EBE8DF] border border-[#D5D0C3] rounded p-1 text-xs"
              >
                <option value="all">همه وضعیت‌ها</option>
                <option value="customer">مشتری دائم</option>
                <option value="potential">مشتری بالقوه</option>
                <option value="new">فروشگاه جدید</option>
                <option value="unspecified">نامشخص</option>
              </select>
            </div>

            {/* Area Filter */}
            <div>
              <label className="block text-[10px] text-[#6E7472] mb-0.5">منطقه / راسته بازار:</label>
              <select
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
                className="w-full bg-[#EBE8DF] border border-[#D5D0C3] rounded p-1 text-xs"
              >
                <option value="all">همه منطقه‌ها</option>
                {areas.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 2. Compact Store Rows List with Technical Dividers (Anti-Card) */}
      <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden divide-y divide-[#E6E2D8]">
        {processedStores.length === 0 ? (
          <div className="py-8 text-center text-[#6E7472] text-xs">
            فروشگاهی با این مشخصات یافت نشد.
          </div>
        ) : (
          processedStores.map((store) => (
            <div
              key={store.id}
              className="p-2.5 hover:bg-[#F3F1EA] transition-colors flex items-center justify-between gap-2"
            >
              {/* Left Details */}
              <div
                onClick={() => onSelectStore(store)}
                className="flex items-start gap-2 flex-1 cursor-pointer min-w-0"
              >
                <div className="pt-0.5">
                  <StatusGlyph status={store.customer_status} size={15} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-[#171A1B] truncate">{store.name}</span>
                    {store.last_visit_result === 'needs_followup' && (
                      <span className="text-[9px] bg-[#B94A48]/15 text-[#B94A48] px-1 py-0.2 rounded font-semibold">
                        پیگیری
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#6E7472]">
                    <span className="truncate">{store.category}</span>
                    <span>•</span>
                    <span className="truncate">{store.area}</span>
                  </div>

                  {store.brands && store.brands.length > 0 && (
                    <div className="flex items-center gap-1 mt-0.5 overflow-hidden">
                      {store.brands.slice(0, 3).map((brand) => (
                        <span
                          key={brand}
                          className="text-[9px] bg-[#EBE8DF] text-[#202426] px-1 py-0.2 rounded font-mono truncate"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-2 mt-0.5 text-[10px] text-[#8A908E]">
                    <span>آخرین ویزیت: {store.last_visit_date || 'ثبت نشده'}</span>
                    <span>•</span>
                    <span>ویزیت: {toPersianDigits(store.visit_count || 0)}</span>
                  </div>
                </div>
              </div>

              {/* Right Details: Distance & Quick Actions */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <span className="text-[11px] font-bold text-[#123C3A] font-technical-mono px-1.5 py-0.5 bg-[#EBE8DF] rounded border border-[#D5D0C3]">
                  {formatDistance(store.distance || 0)}
                </span>

                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${store.mobile || store.phone}`}
                    title="تماس"
                    className="p-1.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-[#202426] hover:text-[#123C3A]"
                  >
                    <IconPhoneCall size={13} />
                  </a>
                  <button
                    onClick={() => onNavigateToStore(store)}
                    title="مسیریابی"
                    className="p-1.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-[#C96F3B] hover:text-[#B05B29]"
                  >
                    <IconNavigation size={13} />
                  </button>
                  <button
                    onClick={() => onRecordVisit(store)}
                    title="ثبت ویزیت"
                    className="p-1.5 bg-[#123C3A] hover:bg-[#1A4B49] rounded text-white"
                  >
                    <IconVisitCheck size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
