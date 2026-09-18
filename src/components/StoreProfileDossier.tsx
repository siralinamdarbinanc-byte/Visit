import React, { useState } from 'react';
import { Store, Visit, FollowUp } from '../types';
import { StatusGlyph, IconPhoneCall, IconNavigation, IconVisitCheck } from './TechnicalIcons';
import { formatDistance, toPersianDigits } from '../services/storage';

interface StoreProfileDossierProps {
  store: Store;
  visits: Visit[];
  followups: FollowUp[];
  onBack: () => void;
  onRecordVisit: (store: Store) => void;
  onNavigate: (store: Store) => void;
  onEditStore: (store: Store) => void;
  onAddPhoto: (storeId: string) => void;
}

export const StoreProfileDossier: React.FC<StoreProfileDossierProps> = ({
  store,
  visits,
  followups,
  onBack,
  onRecordVisit,
  onNavigate,
  onEditStore,
  onAddPhoto,
}) => {
  // Accordion open states (single-hand mobile navigation, default first 2 open)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    storeInfo: true,
    contactInfo: true,
    brands: false,
    products: false,
    customerStatus: false,
    visits: true,
    followups: false,
    notes: false,
    photos: false,
  });

  const toggleSection = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const storeVisits = visits.filter((v) => v.store_id === store.id);
  const storeFollowups = followups.filter((f) => f.store_id === store.id);

  // Persian status labels
  const getStatusLabel = () => {
    switch (store.customer_status) {
      case 'customer':
        return 'مشتری دائم';
      case 'potential':
        return 'مشتری بالقوه';
      case 'new':
        return 'فروشگاه جدید';
      default:
        return 'نامشخص';
    }
  };

  const getResultLabel = (res?: string) => {
    switch (res) {
      case 'purchased':
        return { text: 'خرید کرد', color: 'text-emerald-700 bg-emerald-100 border-emerald-300' };
      case 'interested':
        return { text: 'علاقه‌مند', color: 'text-amber-700 bg-amber-100 border-amber-300' };
      case 'needs_followup':
        return { text: 'نیاز به پیگیری', color: 'text-rose-700 bg-rose-100 border-rose-300' };
      case 'no_cooperation':
        return { text: 'عدم همکاری', color: 'text-stone-700 bg-stone-200 border-stone-300' };
      case 'closed':
        return { text: 'بسته بود', color: 'text-stone-600 bg-stone-100 border-stone-300' };
      case 'manager_absent':
        return { text: 'مدیر حضور نداشت', color: 'text-orange-700 bg-orange-100 border-orange-300' };
      default:
        return { text: 'سایر', color: 'text-stone-600 bg-stone-100 border-stone-300' };
    }
  };

  return (
    <div className="pb-20 max-w-lg mx-auto bg-[#F3F1EA] min-h-screen">
      {/* Top Dossier Navigation Bar */}
      <div className="sticky top-0 z-20 bg-[#123C3A] text-white px-3 py-2.5 flex items-center justify-between border-b border-[#202426]">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs text-[#E7E4DC] hover:text-white"
        >
          <span>→</span>
          <span>بازگشت به فهرست</span>
        </button>
        <span className="text-[10px] font-mono tracking-widest text-[#C96F3B] uppercase font-bold">
          CONTACT DOSSIER // {store.id}
        </span>
      </div>

      {/* Header (Contact Dossier Card) */}
      <div className="p-3 bg-[#FAF9F5] border-b border-[#D5D0C3]">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-2">
            <div className="pt-1">
              <StatusGlyph status={store.customer_status} size={18} />
            </div>
            <div>
              <h1 className="text-base font-bold text-[#171A1B]">{store.name}</h1>
              <p className="text-xs text-[#6E7472] mt-0.5">
                مدیریت: <span className="font-semibold text-[#171A1B]">{store.owner}</span>
              </p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-[#6E7472]">
                <span className="px-1.5 py-0.5 bg-[#EBE8DF] text-[#123C3A] font-semibold rounded border border-[#D5D0C3]">
                  {getStatusLabel()}
                </span>
                <span>•</span>
                <span>{store.area}</span>
              </div>
            </div>
          </div>

          <div className="text-left font-technical-mono">
            <span className="block text-xs font-bold text-[#123C3A] px-2 py-0.5 bg-[#EBE8DF] rounded border border-[#D5D0C3]">
              {formatDistance(store.distance || 0)}
            </span>
            <span className="block text-[9px] text-[#8A908E] mt-1 text-right">
              {toPersianDigits(store.visit_count || 0)} ویزیت
            </span>
          </div>
        </div>

        {/* 4 Quick Primary Action Buttons */}
        <div className="grid grid-cols-4 gap-1.5 mt-3 pt-3 border-t border-[#E6E2D8]">
          <a
            href={`tel:${store.mobile || store.phone}`}
            className="flex items-center justify-center gap-1 py-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-xs font-semibold text-[#171A1B]"
          >
            <IconPhoneCall size={14} className="text-[#123C3A]" />
            <span>تماس</span>
          </a>

          <button
            onClick={() => onNavigate(store)}
            className="flex items-center justify-center gap-1 py-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-xs font-semibold text-[#171A1B]"
          >
            <IconNavigation size={14} className="text-[#C96F3B]" />
            <span>مسیریابی</span>
          </button>

          <button
            onClick={() => onEditStore(store)}
            className="flex items-center justify-center gap-1 py-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-xs font-semibold text-[#171A1B]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            <span>ویرایش</span>
          </button>

          <button
            onClick={() => onRecordVisit(store)}
            className="flex items-center justify-center gap-1 py-2 bg-[#123C3A] hover:bg-[#1A4B49] rounded text-xs font-semibold text-[#FAF9F5]"
          >
            <IconVisitCheck size={14} />
            <span>ثبت ویزیت</span>
          </button>
        </div>
      </div>

      {/* Accordions / Expandable Dossier Sections */}
      <div className="p-3 space-y-2">
        {/* 1. اطلاعات فروشگاه */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggleSection('storeInfo')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              اطلاعات فروشگاه و موقعیت
            </span>
            <span>{openSections.storeInfo ? '▲' : '▼'}</span>
          </button>

          {openSections.storeInfo && (
            <div className="p-2.5 text-xs space-y-2 border-t border-[#D5D0C3]">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-[#6E7472] block">صنف و دسته‌بندی:</span>
                  <span className="font-semibold text-[#171A1B]">{store.category}</span>
                </div>
                <div>
                  <span className="text-[#6E7472] block">زیردسته:</span>
                  <span className="font-semibold text-[#171A1B]">{store.subcategory || 'عمومی'}</span>
                </div>
              </div>

              <div>
                <span className="text-[#6E7472] block text-[11px]">آدرس کامل:</span>
                <p className="text-xs text-[#171A1B] mt-0.5 leading-relaxed bg-[#F3F1EA] p-2 rounded border border-[#E6E2D8]">
                  {store.address}
                </p>
              </div>

              <div className="flex items-center justify-between pt-1 text-[10px] text-[#8A908E] font-technical-mono">
                <span>مختصات: {store.latitude.toFixed(5)}, {store.longitude.toFixed(5)}</span>
                <span>ثبت: {store.created_at}</span>
              </div>
            </div>
          )}
        </div>

        {/* 2. اطلاعات تماس */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggleSection('contactInfo')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              اطلاعات تماس و ارتباط
            </span>
            <span>{openSections.contactInfo ? '▲' : '▼'}</span>
          </button>

          {openSections.contactInfo && (
            <div className="p-2.5 text-xs space-y-2 border-t border-[#D5D0C3]">
              <div className="flex items-center justify-between bg-[#F3F1EA] p-2 rounded border border-[#E6E2D8]">
                <div>
                  <span className="text-[10px] text-[#6E7472] block">شماره همراه (مدیر):</span>
                  <span className="font-mono text-xs font-bold text-[#171A1B]">{store.mobile}</span>
                </div>
                <div className="flex items-center gap-1">
                  <a
                    href={`tel:${store.mobile}`}
                    className="px-2.5 py-1 bg-[#123C3A] text-white rounded text-[11px] font-semibold"
                  >
                    تماس
                  </a>
                  <a
                    href={`sms:${store.mobile}`}
                    className="px-2.5 py-1 bg-[#FAF9F5] border border-[#C4BFB2] text-[#202426] rounded text-[11px]"
                  >
                    پیامک
                  </a>
                </div>
              </div>

              {store.phone && (
                <div className="flex items-center justify-between bg-[#F3F1EA] p-2 rounded border border-[#E6E2D8]">
                  <div>
                    <span className="text-[10px] text-[#6E7472] block">تلفن ثابت فروشگاه:</span>
                    <span className="font-mono text-xs text-[#171A1B]">{store.phone}</span>
                  </div>
                  <a
                    href={`tel:${store.phone}`}
                    className="px-2.5 py-1 bg-[#FAF9F5] border border-[#C4BFB2] text-[#202426] rounded text-[11px]"
                  >
                    تماس
                  </a>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 3. برندها */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggleSection('brands')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              برندهای فعال و مورد تقاضا ({toPersianDigits(store.brands.length)})
            </span>
            <span>{openSections.brands ? '▲' : '▼'}</span>
          </button>

          {openSections.brands && (
            <div className="p-2.5 text-xs border-t border-[#D5D0C3]">
              <div className="flex flex-wrap gap-1.5">
                {store.brands.map((brand) => (
                  <span
                    key={brand}
                    className="px-2 py-1 bg-[#EBE8DF] text-[#123C3A] font-bold text-xs rounded border border-[#D5D0C3]"
                  >
                    {brand}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 4. قطعات اصلی و مورد علاقه */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggleSection('products')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              قطعات مورد علاقه و پرمصرف
            </span>
            <span>{openSections.products ? '▲' : '▼'}</span>
          </button>

          {openSections.products && (
            <div className="p-2.5 text-xs border-t border-[#D5D0C3]">
              <div className="flex flex-wrap gap-1.5">
                {store.products.map((prod) => (
                  <span
                    key={prod}
                    className="px-2 py-1 bg-[#FAF9F5] text-[#202426] text-xs rounded border border-[#C4BFB2]"
                  >
                    ⚙ {prod}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 5. تاریخچه ویزیت‌ها (Timeline) */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggleSection('visits')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#C96F3B] rounded-xs" />
              تاریخچه ویزیت‌های میدانی ({toPersianDigits(storeVisits.length)})
            </span>
            <span>{openSections.visits ? '▲' : '▼'}</span>
          </button>

          {openSections.visits && (
            <div className="p-2.5 text-xs border-t border-[#D5D0C3] space-y-2">
              {storeVisits.length === 0 ? (
                <div className="text-center py-4 text-[#8A908E]">
                  هنوز هیچ ویزیت حضوری برای این فروشگاه ثبت نشده است.
                </div>
              ) : (
                <div className="relative border-r-2 border-[#123C3A]/30 mr-2 pr-3 space-y-3">
                  {storeVisits.map((visit) => {
                    const badge = getResultLabel(visit.result);
                    return (
                      <div key={visit.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -right-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#123C3A] border-2 border-white" />

                        <div className="bg-[#F3F1EA] p-2 rounded border border-[#E6E2D8]">
                          <div className="flex items-center justify-between">
                            <span className={`text-[10px] px-1.5 py-0.2 rounded border font-semibold ${badge.color}`}>
                              {badge.text}
                            </span>
                            <span className="text-[10px] text-[#6E7472] font-technical-mono">
                              {visit.date} - ساعت {visit.time}
                            </span>
                          </div>

                          <p className="text-xs text-[#171A1B] mt-1.5 leading-relaxed">
                            {visit.note || 'توضیحی ثبت نشده'}
                          </p>

                          {visit.next_followup && (
                            <div className="mt-1 text-[10px] text-[#C96F3B] font-semibold">
                              پیگیری بعدی: {visit.next_followup}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <button
                onClick={() => onRecordVisit(store)}
                className="w-full py-2 bg-[#123C3A] hover:bg-[#1A4B49] text-white rounded text-xs font-bold mt-2"
              >
                + ثبت ویزیت جدید
              </button>
            </div>
          )}
        </div>

        {/* 6. یادداشت‌های ویزیتور */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggleSection('notes')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              یادداشت‌های میدانی و نکات ویژه
            </span>
            <span>{openSections.notes ? '▲' : '▼'}</span>
          </button>

          {openSections.notes && (
            <div className="p-2.5 text-xs border-t border-[#D5D0C3]">
              <p className="bg-[#F3F1EA] p-2.5 rounded border border-[#E6E2D8] text-xs leading-relaxed text-[#171A1B]">
                {store.notes || 'یادداشتی ثبت نشده است.'}
              </p>
            </div>
          )}
        </div>

        {/* 7. تصاویر و اسناد */}
        <div className="bg-[#FAF9F5] border border-[#D5D0C3] rounded overflow-hidden">
          <button
            onClick={() => toggleSection('photos')}
            className="w-full flex items-center justify-between p-2.5 bg-[#EBE8DF] text-xs font-bold text-[#171A1B] text-right"
          >
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-3 bg-[#123C3A] rounded-xs" />
              تصاویر تابلو و ویترین ({toPersianDigits(store.photos?.length || 0)})
            </span>
            <span>{openSections.photos ? '▲' : '▼'}</span>
          </button>

          {openSections.photos && (
            <div className="p-2.5 text-xs border-t border-[#D5D0C3] space-y-2">
              <div className="grid grid-cols-2 gap-2">
                {store.photos && store.photos.length > 0 ? (
                  store.photos.map((photo) => (
                    <div key={photo.id} className="relative rounded border border-[#C4BFB2] overflow-hidden bg-black/5">
                      <img
                        src={photo.url}
                        alt={photo.caption || 'عکس فروشگاه'}
                        className="w-full h-24 object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {photo.caption && (
                        <div className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] p-1 truncate">
                          {photo.caption}
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-4 text-[#8A908E]">
                    عکسی بارگذاری نشده است.
                  </div>
                )}
              </div>

              <button
                onClick={() => onAddPhoto(store.id)}
                className="w-full py-1.5 bg-[#FAF9F5] border border-[#202426] hover:bg-[#EBE8DF] text-[#171A1B] rounded text-xs font-semibold"
              >
                + افزودن تصویر تابلو / کارت ویزیت
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
