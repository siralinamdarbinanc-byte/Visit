import React, { useState } from 'react';
import { FollowUp, Store } from '../types';
import { IconPhoneCall, IconNavigation, IconVisitCheck } from './TechnicalIcons';
import { toPersianDigits } from '../services/storage';

interface FollowUpScreenProps {
  followups: FollowUp[];
  stores: Store[];
  onUpdateStatus: (id: string, status: FollowUp['status']) => void;
  onNavigateToStore: (store: Store) => void;
  onRecordVisitForStore: (store: Store) => void;
  onSelectStore: (store: Store) => void;
}

export const FollowUpScreen: React.FC<FollowUpScreenProps> = ({
  followups,
  stores,
  onUpdateStatus,
  onNavigateToStore,
  onRecordVisitForStore,
  onSelectStore,
}) => {
  const [activeTab, setActiveTab] = useState<'today' | 'upcoming' | 'overdue' | 'completed'>('today');

  const getFilteredFollowups = () => {
    switch (activeTab) {
      case 'today':
        return followups.filter((f) => f.status === 'pending' && f.date.includes('امروز'));
      case 'upcoming':
        return followups.filter((f) => f.status === 'pending' && !f.date.includes('امروز'));
      case 'overdue':
        return followups.filter((f) => f.status === 'overdue' || f.date.includes('معوق'));
      case 'completed':
        return followups.filter((f) => f.status === 'completed');
    }
  };

  const filteredItems = getFilteredFollowups();

  const countByTab = {
    today: followups.filter((f) => f.status === 'pending' && f.date.includes('امروز')).length,
    upcoming: followups.filter((f) => f.status === 'pending' && !f.date.includes('امروز')).length,
    overdue: followups.filter((f) => f.status === 'overdue' || f.date.includes('معوق')).length,
    completed: followups.filter((f) => f.status === 'completed').length,
  };

  return (
    <div className="pb-20 px-3 pt-3 max-w-lg mx-auto space-y-3">
      {/* Header */}
      <div>
        <h1 className="text-sm font-bold text-[#171A1B] flex items-center gap-1.5">
          <span>پیگیری‌ها و تعهدات میدانی</span>
          <span className="text-xs bg-[#EBE8DF] text-[#123C3A] font-mono px-1.5 py-0.2 rounded font-bold">
            {toPersianDigits(followups.length)} مورد
          </span>
        </h1>
        <p className="text-[11px] text-[#6E7472]">مراجعات مجدد، پیش‌فاکتورها و وصول سفارشات</p>
      </div>

      {/* Tabs (امروز / آتی / معوق / تکمیل شده) */}
      <div className="grid grid-cols-4 gap-1 bg-[#EBE8DF] p-1 rounded border border-[#D5D0C3] text-xs font-semibold">
        {[
          { id: 'today', label: 'امروز', count: countByTab.today },
          { id: 'upcoming', label: 'آتی', count: countByTab.upcoming },
          { id: 'overdue', label: 'معوق', count: countByTab.overdue, alert: countByTab.overdue > 0 },
          { id: 'completed', label: 'تکمیل', count: countByTab.completed },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-1.5 px-1 rounded flex items-center justify-center gap-1 text-[11px] transition-colors ${
                isActive
                  ? 'bg-[#123C3A] text-white shadow-xs'
                  : 'text-[#202426] hover:bg-[#FAF9F5]'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] font-mono px-1 rounded ${
                  isActive
                    ? 'bg-[#C96F3B] text-white'
                    : tab.alert
                    ? 'bg-[#B94A48] text-white'
                    : 'bg-[#D5D0C3] text-[#171A1B]'
                }`}
              >
                {toPersianDigits(tab.count)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Follow-up Items List */}
      <div className="space-y-2">
        {filteredItems.length === 0 ? (
          <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded p-8 text-center text-xs text-[#8A908E]">
            موردی در این دسته وجود ندارد.
          </div>
        ) : (
          filteredItems.map((item) => {
            const store = stores.find((s) => s.id === item.store_id);
            const isOverdue = item.status === 'overdue' || item.date.includes('معوق');

            return (
              <div
                key={item.id}
                className={`bg-[#FAF9F5] rounded border p-3 space-y-2 transition-all ${
                  isOverdue
                    ? 'border-[#B94A48] bg-[#FDF9F9]'
                    : item.status === 'completed'
                    ? 'border-[#2E6B50]/40 opacity-75'
                    : 'border-[#202426]'
                }`}
              >
                {/* Top Info Strip */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3
                        onClick={() => store && onSelectStore(store)}
                        className="text-xs font-bold text-[#171A1B] cursor-pointer hover:text-[#C96F3B] underline decoration-dotted"
                      >
                        {item.store_name}
                      </h3>
                      {isOverdue && (
                        <span className="text-[9px] px-1.5 py-0.2 bg-[#B94A48]/15 text-[#B94A48] font-bold rounded">
                          نیازمند اقدام فوری
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-[#6E7472] mt-0.5">
                      منطقه: {item.area} • آخرین ویزیت: {item.last_visit_date || 'نامشخص'}
                    </p>
                  </div>

                  <span className="text-[10px] font-mono font-bold bg-[#EBE8DF] text-[#123C3A] px-1.5 py-0.5 rounded border border-[#D5D0C3]">
                    {item.date}
                  </span>
                </div>

                {/* Follow-up Reason Note */}
                <div className="bg-[#F3F1EA] p-2 rounded border border-[#E6E2D8] text-xs text-[#171A1B] leading-relaxed">
                  {item.note}
                </div>

                {/* Tactical Actions (تماس، ثبت نتیجه، تعویق، تکمیل، مسیریابی) */}
                <div className="grid grid-cols-5 gap-1 pt-1 text-[11px] font-semibold">
                  <a
                    href={`tel:${item.phone}`}
                    className="flex items-center justify-center gap-0.5 py-1.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-[#171A1B]"
                  >
                    <IconPhoneCall size={12} />
                    <span>تماس</span>
                  </a>

                  {store && (
                    <button
                      onClick={() => onNavigateToStore(store)}
                      className="flex items-center justify-center gap-0.5 py-1.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-[#C96F3B]"
                    >
                      <IconNavigation size={12} />
                      <span>مسیر</span>
                    </button>
                  )}

                  {store && (
                    <button
                      onClick={() => onRecordVisitForStore(store)}
                      className="flex items-center justify-center gap-0.5 py-1.5 bg-[#123C3A] hover:bg-[#1A4B49] text-white rounded"
                    >
                      <IconVisitCheck size={12} />
                      <span>ویزیت</span>
                    </button>
                  )}

                  <button
                    onClick={() => onUpdateStatus(item.id, 'postponed')}
                    className="py-1.5 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-[#6E7472]"
                  >
                    تعویق
                  </button>

                  <button
                    onClick={() =>
                      onUpdateStatus(
                        item.id,
                        item.status === 'completed' ? 'pending' : 'completed'
                      )
                    }
                    className={`py-1.5 rounded text-white ${
                      item.status === 'completed' ? 'bg-[#6E7472]' : 'bg-[#2E6B50]'
                    }`}
                  >
                    {item.status === 'completed' ? 'بازگشت' : 'تکمیل ✓'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
