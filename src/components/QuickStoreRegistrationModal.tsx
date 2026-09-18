import React, { useState } from 'react';
import { Store, StoreCategory, CustomerStatus, UserLocation, StorePhoto } from '../types';
import { IconGpsRadar } from './TechnicalIcons';
import { FieldStorageService, DuplicateCheckResult } from '../services/storage';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { toast } from '../hooks/useToast';

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

const POPULAR_BRANDS = ['ایساکو', 'سایپا یدک', 'عظام', 'کروز', 'امیرنیا', 'سرکان', 'بوش', 'والئو'];

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
  const [address, setAddress] = useState(userLocation.areaName || 'خیابان ملت، پاساژ کاشانی');
  const [area, setArea] = useState(userLocation.areaName ? userLocation.areaName.split('،')[1]?.trim() || 'مرکز بازار' : 'مرکز بازار');
  const [lat, setLat] = useState(userLocation.latitude);
  const [lng, setLng] = useState(userLocation.longitude);
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>('potential');
  const [notes, setNotes] = useState('');

  // Brands
  const [brands, setBrands] = useState<string[]>(['ایساکو', 'عظام']);
  const [brandInput, setBrandInput] = useState('');

  // Photos
  const [photos, setPhotos] = useState<StorePhoto[]>([]);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);

  const toggleBrand = (b: string) => {
    if (brands.includes(b)) {
      setBrands(brands.filter((item) => item !== b));
    } else {
      setBrands([...brands, b]);
    }
  };

  const handleAddCustomBrand = () => {
    const val = brandInput.trim();
    if (val && !brands.includes(val)) {
      setBrands([...brands, val]);
      setBrandInput('');
    }
  };

  const handleAddPhoto = (photo: { url: string; caption?: string; type: StorePhoto['type'] }) => {
    const newP: StorePhoto = {
      id: `p-${Date.now()}`,
      url: photo.url,
      caption: photo.caption,
      type: photo.type,
      created_at: new Date().toLocaleDateString('fa-IR'),
    };
    setPhotos([...photos, newP]);
    toast.success('تصویر جدید با موفقیت پیوست شد.');
  };

  const handleNextStep = async () => {
    if (currentStep === 1 && !name.trim()) {
      toast.error('وارد کردن نام فروشگاه الزامی است.');
      return;
    }

    if (currentStep === 2) {
      // Check for duplicates before moving forward
      const dup = await FieldStorageService.checkDuplicateStore({
        name: name.trim(),
        mobile: mobile.trim(),
        phone: phone.trim(),
        area: area.trim(),
        latitude: lat,
        longitude: lng,
      });

      if (dup.isDuplicate) {
        setDuplicateWarning(dup);
        return;
      }
    }

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
      mobile: mobile.trim() || 'نامشخص',
      phone: phone.trim() || '',
      address: address.trim() || 'خیابان ملت، راسته قطعات',
      area: area.trim() || 'مرکز بازار',
      latitude: lat,
      longitude: lng,
      customer_status: customerStatus,
      brands,
      products: category === 'جلوبندی و تعلیق' ? ['سیبک', 'طبق', 'کمک‌فنر'] : ['لنت ترمز', 'شمع موتور', 'تسمه تایم'],
      notes: notes.trim(),
      photos,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs select-none">
      <div className="bg-[#FAF9F5] border-t-2 sm:border-2 border-[#123C3A] rounded-t-xl sm:rounded-lg w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header with 4-step progress strip */}
        <div className="bg-[#123C3A] text-white p-3 border-b border-[#202426] sticky top-0 z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#C96F3B]" />
              <h2 className="text-xs sm:text-sm font-bold">ثبت سریع فروشگاه جدید در محل (میدانی)</h2>
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
          <div className="flex justify-between text-[10px] text-[#C4BFB2] mt-1 font-sans">
            <span>۱: هویت صنف</span>
            <span>۲: تماس و GPS</span>
            <span>۳: وضعیت و برندها</span>
            <span>۴: عکس و اتمام</span>
          </div>
        </div>

        {/* Duplicate Warning Dialog */}
        {duplicateWarning && (
          <div className="p-3 bg-amber-50 border-b-2 border-[#C96F3B] text-amber-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-[#C96F3B]">
              <span>⚠ توجه: احتمال تکراری بودن این فروشگاه وجود دارد!</span>
            </div>
            <p className="leading-relaxed">{duplicateWarning.reason}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setDuplicateWarning(null);
                  setCurrentStep((prev) => (prev + 1) as any);
                }}
                className="px-3 py-1.5 bg-[#C96F3B] text-white rounded font-bold text-xs"
              >
                تایید تشابه و ادامه ثبت
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-3 py-1.5 bg-white border border-amber-400 rounded text-xs text-amber-900"
              >
                اصلاح اطلاعات
              </button>
            </div>
          </div>
        )}

        {/* Content Body based on current step */}
        <div className="p-4 space-y-3 font-sans text-xs">
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
                    <span className="block text-xs font-bold text-[#171A1B]">موقعیت GPS لحظه‌ای فروشگاه</span>
                    <span className="block text-[10px] text-[#6E7472] font-mono">
                      {lat.toFixed(5)}°N, {lng.toFixed(5)}°E (خطا: {userLocation.accuracy}m)
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLat(userLocation.latitude);
                    setLng(userLocation.longitude);
                    toast.info('مختصات با GPS فعلی تطبیق داده شد.');
                  }}
                  className="px-2 py-1 bg-[#FAF9F5] border border-[#C4BFB2] rounded text-[10px] font-semibold text-[#123C3A]"
                >
                  تطبیق مجدد
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
                <label className="block text-xs font-bold text-[#171A1B] mb-1">تلفن ثابت مغازه:</label>
                <input
                  type="tel"
                  dir="ltr"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="02133912345"
                  className="w-full bg-[#F3F1EA] border border-[#D5D0C3] rounded p-2 text-xs font-mono text-left focus:border-[#C96F3B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs text-[#6E7472] mb-1">منطقه / راسته بازار:</label>
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

          {/* STEP 3: وضعیت مشتری و برندها */}
          {currentStep === 3 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-[#171A1B]">
                وضعیت همکاری اولیه با این فروشگاه:
              </label>

              <div className="space-y-1.5">
                {[
                  { id: 'potential', title: 'مشتری بالقوه (توصیه شده)', desc: 'فروشگاه فعال که تمایل به بررسی اجناس و همکاری دارد' },
                  { id: 'customer', title: 'مشتری دائم / فعال', desc: 'قبلاً همکاری داشته یا در این بازدید خرید قطعی دارد' },
                  { id: 'new', title: 'فروشگاه جدید (تازه شناسایی شده)', desc: 'صرفاً مغازه شناسایی و موقعیت ثبت شده است' },
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

              {/* Brands Selection */}
              <div className="pt-2 border-t border-[#D5D0C3]">
                <label className="block text-xs font-bold text-[#171A1B] mb-1.5">
                  برندهای تحت فعالیت فروشگاه:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {POPULAR_BRANDS.map((b) => {
                    const active = brands.includes(b);
                    return (
                      <button
                        key={b}
                        type="button"
                        onClick={() => toggleBrand(b)}
                        className={`px-2 py-1 rounded text-[11px] border font-semibold ${
                          active
                            ? 'bg-[#123C3A] text-white border-[#123C3A]'
                            : 'bg-[#EBE8DF] text-[#171A1B] border-[#D5D0C3]'
                        }`}
                      >
                        {active ? '✓ ' : '+ '}{b}
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={brandInput}
                    onChange={(e) => setBrandInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomBrand())}
                    placeholder="سایر برندها..."
                    className="flex-1 bg-[#F3F1EA] border border-[#202426] rounded px-2 py-1 text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomBrand}
                    className="px-2.5 py-1 bg-[#123C3A] text-white rounded text-xs font-bold"
                  >
                    افزودن
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: عکس و یادداشت و اتمام */}
          {currentStep === 4 && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <div className="bg-[#EBE8DF] p-2.5 rounded border border-[#D5D0C3] text-xs">
                <div className="font-bold text-[#171A1B]">{name}</div>
                <div className="text-[11px] text-[#6E7472] mt-0.5">
                  {category} • {area} • {brands.join('، ')}
                </div>
              </div>

              {/* Photos Capture Section */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-[#171A1B]">
                    عکس تابلو، ویترین یا کارت ویزیت ({photos.length}):
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(true)}
                    className="px-2 py-1 bg-[#123C3A] text-white rounded text-[10px] font-bold flex items-center gap-1"
                  >
                    <span>📸</span>
                    <span>عکاسی با دوربین / گالری</span>
                  </button>
                </div>

                {photos.length > 0 ? (
                  <div className="grid grid-cols-3 gap-1.5">
                    {photos.map((p) => (
                      <div key={p.id} className="relative rounded border border-[#C4BFB2] overflow-hidden h-16 bg-black">
                        <img src={p.url} alt="عکس فروشگاه" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setPhotos(photos.filter((item) => item.id !== p.id))}
                          className="absolute top-0.5 right-0.5 bg-rose-600 text-white rounded-full w-4 h-4 text-[9px] flex items-center justify-center shadow"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[10px] text-[#8E9491] bg-[#F3F1EA] p-2 rounded border border-[#E6E2D8]">
                    تصویری پیوست نشده است. می‌توانید بدون عکس ذخیره کنید یا با زدن دکمه بالا عکس بگیرید.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#171A1B] mb-1">
                  یادداشت اولیه بازاریاب در محل:
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="نکات کلیدی، روزهای حضور مدیر، تمایل همکاری..."
                  className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none resize-none"
                />
              </div>

              <div className="p-2 bg-emerald-50 border border-emerald-300 rounded text-[11px] text-emerald-800">
                ✓ آماده ذخیره سریع در دیتابیس محلی دستگاه و قرارگیری در صف همگام‌سازی ابری.
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation Buttons */}
        <div className="p-3 bg-[#EBE8DF] border-t border-[#D5D0C3] flex items-center justify-between gap-2 sticky bottom-0 z-10">
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
            {currentStep === 4 ? '✓ ثبت قطعی فروشگاه' : 'مرحله بعد ←'}
          </button>
        </div>
      </div>

      {/* Photo Capture Modal */}
      {showPhotoModal && (
        <PhotoCaptureModal
          title="عکاسی و پیوست تصویر مغازه"
          onClose={() => setShowPhotoModal(false)}
          onSavePhoto={handleAddPhoto}
        />
      )}
    </div>
  );
};
