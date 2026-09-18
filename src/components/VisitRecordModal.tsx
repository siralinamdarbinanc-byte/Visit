import React, { useState } from 'react';
import { Store, VisitResult, UserLocation } from '../types';
import { IconVisitCheck, IconGpsRadar } from './TechnicalIcons';
import { toPersianDigits, FieldStorageService } from '../services/storage';

interface VisitRecordModalProps {
  store: Store;
  userLocation: UserLocation;
  onClose: () => void;
  onSaveVisit: (visitData: {
    store_id: string;
    store_name: string;
    date: string;
    time: string;
    result: VisitResult;
    note: string;
    next_followup?: string;
    latitude: number;
    longitude: number;
    photo_url?: string;
  }) => void;
}

const VISIT_RESULTS: Array<{ id: VisitResult; label: string; color: string; border: string }> = [
  { id: 'purchased', label: 'خرید کرد (سفارش قطعی)', color: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-500' },
  { id: 'interested', label: 'علاقه‌مند (نیاز به نمونه/قیمت)', color: 'bg-amber-50 text-amber-800', border: 'border-amber-500' },
  { id: 'needs_followup', label: 'نیاز به پیگیری مجدد', color: 'bg-orange-50 text-orange-800', border: 'border-orange-500' },
  { id: 'no_cooperation', label: 'عدم همکاری فعلی', color: 'bg-stone-100 text-stone-700', border: 'border-stone-400' },
  { id: 'closed', label: 'فروشگاه بسته بود', color: 'bg-rose-50 text-rose-800', border: 'border-rose-400' },
  { id: 'manager_absent', label: 'مدیر یا تصمیم‌گیرنده حضور نداشت', color: 'bg-amber-50 text-amber-800', border: 'border-amber-400' },
  { id: 'other', label: 'سایر موارد', color: 'bg-slate-50 text-slate-700', border: 'border-slate-400' },
];

export const VisitRecordModal: React.FC<VisitRecordModalProps> = ({
  store,
  userLocation,
  onClose,
  onSaveVisit,
}) => {
  const [result, setResult] = useState<VisitResult>('interested');
  const [note, setNote] = useState('');
  const [needsFollowupDate, setNeedsFollowupDate] = useState(false);
  const [nextFollowup, setNextFollowup] = useState('۱۴۰۳/۰۷/۰۱');
  const [photoUrl, setPhotoUrl] = useState('');

  const now = new Date();
  const currentDate = FieldStorageService.getPersianDateString(now);
  const currentTime = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });

  const handleSave = () => {
    onSaveVisit({
      store_id: store.id,
      store_name: store.name,
      date: currentDate,
      time: currentTime,
      result,
      note: note.trim(),
      next_followup: needsFollowupDate || result === 'needs_followup' ? nextFollowup : undefined,
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      photo_url: photoUrl || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
      <div className="bg-[#FAF9F5] border-t-2 sm:border-2 border-[#123C3A] rounded-t-xl sm:rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="bg-[#123C3A] text-white p-3 border-b border-[#202426] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <IconVisitCheck size={18} className="text-[#C96F3B]" />
            <div>
              <h2 className="text-sm font-bold">ثبت نتیجه ویزیت حضوری</h2>
              <p className="text-[11px] text-[#A5ABA8]">فروشگاه: {store.name} ({store.owner})</p>
            </div>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-white text-base">
            ✕
          </button>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Telemetry Bar (GPS + Timestamp) */}
          <div className="bg-[#EBE8DF] border border-[#D5D0C3] rounded p-2 flex items-center justify-between text-[11px] font-technical-mono">
            <div className="flex items-center gap-1.5 text-[#123C3A]">
              <IconGpsRadar size={14} />
              <span>موقعیت تایید شده ویزیتور</span>
            </div>
            <div className="text-[#6E7472]">
              <span>{currentDate}</span> • <span>ساعت {currentTime}</span>
            </div>
          </div>

          {/* 1. Visit Result Picker */}
          <div>
            <label className="block text-xs font-bold text-[#171A1B] mb-1.5">
              نتیجه اصلی مراجعه و مذاکره حضوری:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {VISIT_RESULTS.map((item) => {
                const isSelected = result === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setResult(item.id);
                      if (item.id === 'needs_followup') {
                        setNeedsFollowupDate(true);
                      }
                    }}
                    className={`p-2 rounded text-right border text-xs transition-all flex items-center justify-between ${
                      isSelected
                        ? `${item.color} ${item.border} font-bold shadow-xs ring-1 ring-[#123C3A]`
                        : 'bg-[#F3F1EA] text-[#202426] border-[#D5D0C3] hover:bg-[#EBE8DF]'
                    }`}
                  >
                    <span>{item.label}</span>
                    {isSelected && <span className="font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Note */}
          <div>
            <label className="block text-xs font-bold text-[#171A1B] mb-1">
              یادداشت و جزئیات مذاکره:
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="اجناس مورد نیاز، برندهای استعلام شده، شرایط پرداخت پیشنهادی، علت عدم همکاری یا نتیجه توافق..."
              className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none resize-none"
            />
          </div>

          {/* 3. Follow-up Date */}
          <div className="bg-[#EBE8DF] p-2.5 rounded border border-[#D5D0C3] space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-[#171A1B] flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={needsFollowupDate || result === 'needs_followup'}
                  onChange={(e) => setNeedsFollowupDate(e.target.checked)}
                  className="rounded text-[#123C3A] focus:ring-0"
                />
                <span>تنظیم یادآوری و پیگیری بعدی برای این فروشگاه</span>
              </label>
            </div>

            {(needsFollowupDate || result === 'needs_followup') && (
              <div className="pt-1 flex items-center gap-2">
                <span className="text-[11px] text-[#6E7472]">موعد پیگیری:</span>
                <input
                  type="text"
                  value={nextFollowup}
                  onChange={(e) => setNextFollowup(e.target.value)}
                  placeholder="۱۴۰۳/۰۶/۳۰"
                  className="bg-[#FAF9F5] border border-[#202426] rounded px-2 py-1 text-xs font-mono text-center focus:border-[#C96F3B] focus:outline-none"
                />
                <div className="flex gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setNextFollowup('۳ روز دیگر')}
                    className="px-1.5 py-0.5 bg-[#FAF9F5] rounded border border-[#C4BFB2]"
                  >
                    ۳ روز
                  </button>
                  <button
                    type="button"
                    onClick={() => setNextFollowup('هفته آینده')}
                    className="px-1.5 py-0.5 bg-[#FAF9F5] rounded border border-[#C4BFB2]"
                  >
                    ۱ هفته
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* 4. Optional Photo Attachment */}
          <div>
            <label className="block text-xs font-bold text-[#171A1B] mb-1">
              تصویر یا سند پیوست (اختیاری):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="آدرس اینترنتی عکس یا شبیه‌ساز دوربین..."
                className="flex-1 bg-[#F3F1EA] border border-[#D5D0C3] rounded p-1.5 text-xs focus:border-[#C96F3B] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setPhotoUrl('https://images.unsplash.com/photo-1486006920555-c77dce18193b?w=600&auto=format&fit=crop&q=80')}
                className="px-2.5 py-1.5 bg-[#FAF9F5] border border-[#202426] rounded text-xs font-semibold text-[#171A1B] hover:bg-[#EBE8DF]"
              >
                نمونه تابلو
              </button>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-3 bg-[#EBE8DF] border-t border-[#D5D0C3] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-[#FAF9F5] border border-[#C4BFB2] rounded text-xs font-semibold text-[#6E7472]"
          >
            انصراف
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 bg-[#C96F3B] hover:bg-[#B05B29] text-white rounded text-xs font-bold shadow-md active:scale-95 transition-transform flex items-center justify-center gap-1.5"
          >
            <IconVisitCheck size={16} />
            <span>ثبت نهایی ویزیت در پرونده فروشگاه</span>
          </button>
        </div>
      </div>
    </div>
  );
};
