import React, { useState } from 'react';
import { Store, StoreCategory, CustomerStatus, UserLocation } from '../types';
import { IconGpsRadar } from './TechnicalIcons';

interface QuickStoreRegistrationModalProps {
  userLocation: UserLocation;
  onClose: () => void;
  onSave: (newStore: Omit<Store, 'id' | 'created_at' | 'updated_at'>) => void;
}

const CATEGORIES: StoreCategory[] = [
  'قطعات یدکی',
  'لوازم برقی',
  'قطعات موتوری',
  'جلوبندی و تعلیق',
  'قطعات بدنه',
  'فروشگاه لوازم خودرو',
  'تعمیرگاه تخصصی',
  'تعویض روغنی و روانکار',
];

export const QuickStoreRegistrationModal: React.FC<QuickStoreRegistrationModalProps> = ({
  userLocation,
  onClose,
  onSave,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [name, setName] = useState('');
  const [category, setCategory] = useState<StoreCategory>('قطعات یدکی');
  const [owner, setOwner] = useState('');
  const [mobile, setMobile] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState(userLocation.areaName);
  const [area, setArea] = useState(userLocation.areaName.split('،')[1]?.trim() || 'مرکز بازار');
  const [lat, setLat] = useState(userLocation.latitude);
  const [lng, setLng] = useState(userLocation.longitude);
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>('potential');
  const [notes, setNotes] = useState('');

  const handleNextStep = () => {
    if (currentStep === 1 && !name.trim()) return;
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as any);
    } else {
      handleFinalSave();
    }
  };

  const handleFinalSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      owner: owner.trim() || 'نامشخص',
      mobile: mobile.trim() || '۰۹۱۲',
      phone: phone.trim() || '۰۲۱',
      address: address.trim() || 'خیابان ملت، پلاک نامشخص',
      area: area.trim() || 'بازار',
      latitude: lat,
      longitude: lng,
      customer_status: customerStatus,
      brands: ['ایساکو', 'عظام'],
      products: ['لنت ترمز', 'شمع موتور'],
      notes: notes.trim(),
      photos: [],
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs">
      <div className="bg-[#FAF9F5] border-t-2 sm:border-2 border-[#123C3A] rounded-t-xl sm:rounded-lg w-full max-w-lg overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header with 4-step progress strip */}
        <div className="bg-[#123C3A] text-white p-3 border-b border-[#202426]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C96F3B]" />
              <h2 className="text-sm font-bold">ثبت سریع فروشگاه در محل (میدانی)</h2>
            </div>
            <button onClick={onClose} className="text-stone-300 hover:text-white text-base">
              ✕
            </button>
          </div>

          {/* Stepper indicator bar */}
          <div className="grid grid-cols-4 gap-1.5 mt-2.5">
            {[1, 2, 3, 4].map((step) => (
              <div
                key={step}
                className={`h-1.5 rounded-full transition-colors ${
                  step <= currentStep ? 'bg-[#C96F3B]' : 'bg-[#1A4B49]'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[#C4BFB2] mt-1">
            <span>مرحله ۱: هویت</span>
            <span>مرحله ۲: تماس و GPS</span>
            <span>مرحله ۳: وضعیت</span>
            <span>مرحله ۴: ثبت نهایی</span>
          </div>
        </div>

        {/* Content Body based on current step */}
        <div className="p-4 space-y-3">
          {/* STEP 1: نام فروشگاه و دسته‌بندی */}
          {currentStep === 1 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="block text-xs font-bold text-[#171A1B] mb-1">
                  نام فروشگاه <span className="text-[#B94A48]">*</span>
                </label>
                <input
                  type="text"
                  autoFocus
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: بازرگانی یدک گستر، قطعات پارس، فروشگاه برادران..."
                  className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2.5 text-xs text-[#171A1B] focus:border-[#C96F3B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A1B] mb-1">صنف و رسته کاری:</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-44 overflow-y-auto">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`p-2 rounded text-[11px] font-semibold text-right border transition-colors ${
                        category === cat
                          ? 'bg-[#123C3A] text-white border-[#123C3A]'
                          : 'bg-[#F3F1EA] text-[#202426] border-[#D5D0C3] hover:bg-[#EBE8DF]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs text-[#6E7472] mb-1">نام صاحب یا مدیر فروشگاه (اختیاری):</label>
                <input
                  type="text"
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="مثال: حاج داوود رستمی"
                  className="w-full bg-[#F3F1EA] border border-[#D5D0C3] rounded p-2 text-xs text-[#171A1B] focus:border-[#C96F3B] focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* STEP 2: شماره تماس و GPS خودکار */}
          {currentStep === 2 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              {/* GPS Auto Captured Widget */}
              <div className="bg-[#EBE8DF] border border-[#202426] rounded p-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-[#123C3A] text-white rounded">
                    <IconGpsRadar size={16} />
                  </div>
                  <div>
                    <span className="block text-xs font-bold text-[#171A1B]">موقعیت GPS ثبت شد</span>
                    <span className="block text-[10px] text-[#6E7472] font-technical-mono">
                      {lat.toFixed(5)}°N, {lng.toFixed(5)}°E (خطا: {userLocation.accuracy}m)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLat(userLocation.latitude);
                    setLng(userLocation.longitude);
                  }}
                  className="px-2 py-1 bg-[#FAF9F5] border border-[#C4BFB2] rounded text-[10px] font-semibold text-[#123C3A]"
                >
                  بازخوانی
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A1B] mb-1">شماره همراه مدیر فروشگاه:</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value)}
                  placeholder="09121234567"
                  className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs font-mono text-left focus:border-[#C96F3B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6E7472] mb-1">منطقه / محله:</label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="مثال: چراغ‌برق، خیابان ملت، پاساژ کاشانی"
                  className="w-full bg-[#F3F1EA] border border-[#D5D0C3] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6E7472] mb-1">آدرس دقیق مغازه:</label>
                <textarea
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="خیابان، پلاک، طبقه یا نام پاساژ..."
                  className="w-full bg-[#F3F1EA] border border-[#D5D0C3] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none resize-none"
                />
              </div>
            </div>
          )}

          {/* STEP 3: وضعیت مشتری */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-[#171A1B]">
                وضعیت همکاری فعلی با این فروشگاه:
              </label>

              <div className="space-y-2">
                {[
                  { id: 'potential', title: 'مشتری بالقوه (توصیه شده)', desc: 'فروشگاه فعال که تمایل به بررسی اجناس و خرید دارد' },
                  { id: 'customer', title: 'مشتری دائم / فعال', desc: 'قبلاً از ما خرید داشته یا در این ویزیت خرید قطعی دارد' },
                  { id: 'new', title: 'فروشگاه جدید (تازه شناسایی شده)', desc: 'صرفاً مغازه شناسایی و ثبت موقعیت اولیه شده است' },
                  { id: 'unspecified', title: 'نامشخص', desc: 'نیاز به ارزیابی در مراجعات بعدی' },
                ].map((item) => {
                  const isSelected = customerStatus === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setCustomerStatus(item.id as CustomerStatus)}
                      className={`w-full p-2.5 rounded border text-right transition-all ${
                        isSelected
                          ? 'bg-[#123C3A] text-white border-[#123C3A] shadow-xs'
                          : 'bg-[#F3F1EA] text-[#202426] border-[#D5D0C3] hover:bg-[#EBE8DF]'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs">{item.title}</span>
                        {isSelected && <span>✓</span>}
                      </div>
                      <span className={`block text-[10px] mt-0.5 ${isSelected ? 'text-[#C4BFB2]' : 'text-[#6E7472]'}`}>
                        {item.desc}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: یادداشت کوتاه و اتمام */}
          {currentStep === 4 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-[#EBE8DF] p-2.5 rounded border border-[#D5D0C3] text-xs">
                <div className="font-bold text-[#171A1B]">{name}</div>
                <div className="text-[11px] text-[#6E7472] mt-0.5">
                  {category} • {area}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A1B] mb-1">
                  یادداشت کوتاه بازاریاب در محل:
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات کلیدی، تمایل خرید، قطعات درخواستی، روزهای حضور مدیر..."
                  className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none resize-none"
                />
              </div>

              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-[11px] text-emerald-800">
                ✓ آماده ذخیره سریع. اطلاعات تکمیلی (برندها، چک‌ها و عکس‌ها) در پرونده قابل ویرایش است.
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-3 bg-[#EBE8DF] border-t border-[#D5D0C3] flex items-center justify-between gap-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep((prev) => (prev - 1) as any)}
              className="px-3 py-2 bg-[#FAF9F5] border border-[#C4BFB2] rounded text-xs font-semibold text-[#171A1B]"
            >
              مرحله قبل
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 bg-[#FAF9F5] border border-[#C4BFB2] rounded text-xs font-semibold text-[#6E7472]"
            >
              انصراف
            </button>
          )}

          <button
            type="button"
            onClick={handleNextStep}
            disabled={currentStep === 1 && !name.trim()}
            className={`flex-1 py-2.5 px-4 rounded text-xs font-bold transition-colors ${
              currentStep === 4
                ? 'bg-[#C96F3B] hover:bg-[#B05B29] text-white shadow-md'
                : 'bg-[#123C3A] hover:bg-[#1A4B49] text-white'
            } disabled:opacity-50`}
          >
            {currentStep === 4 ? '✓ ذخیره قطعی فروشگاه (در صف همگام‌سازی)' : 'مرحله بعد ←'}
          </button>
        </div>
      </div>
    </div>
  );
};
