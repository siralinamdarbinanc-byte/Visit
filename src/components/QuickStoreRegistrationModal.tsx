import React, { useState, useEffect } from 'react';
import { Store, StoreCategory, CustomerStatus, UserLocation, StorePhoto } from '../types';
import { IconGpsRadar } from './TechnicalIcons';
import { FieldStorageService, DuplicateCheckResult, toPersianDigits } from '../services/storage';
import { geolocationService } from '../services/geolocation';
import { PhotoCaptureModal } from './PhotoCaptureModal';
import { toast } from '../hooks/useToast';

interface QuickStoreRegistrationModalProps {
  userLocation: UserLocation;
  onClose: () => void;
  onSave: (newStore: Omit<Store, 'id' | 'created_at' | 'updated_at'>) => Promise<void> | void;
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
  const [address, setAddress] = useState(userLocation.isRealGPS ? userLocation.areaName : 'خیابان ملت، پاساژ کاشانی');
  const [area, setArea] = useState(userLocation.isRealGPS && userLocation.areaName.includes('،') ? userLocation.areaName.split('،')[1]?.trim() || 'مرکز بازار' : 'مرکز بازار');
  const [lat, setLat] = useState(userLocation.latitude || 35.6892);
  const [lng, setLng] = useState(userLocation.longitude || 51.4258);
  const [gpsAccuracy, setGpsAccuracy] = useState<number>(userLocation.accuracy || 0);
  const [isRealGPSFix, setIsRealGPSFix] = useState<boolean>(Boolean(userLocation.isRealGPS));
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>('potential');
  const [notes, setNotes] = useState('');

  // GPS acquiring state
  const [isLocating, setIsLocating] = useState(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(userLocation.errorMessage || null);
  const [manualCoords, setManualCoords] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Auto request real GPS if current is not real
  useEffect(() => {
    if (!userLocation.isRealGPS) {
      handleAcquireGPS(false);
    }
  }, []);

  const handleAcquireGPS = async (showToast = true) => {
    setIsLocating(true);
    setGpsErrorMsg(null);
    try {
      const freshLoc = await geolocationService.requestSingleUpdate(true);
      setLat(freshLoc.latitude);
      setLng(freshLoc.longitude);
      setGpsAccuracy(freshLoc.accuracy);
      setIsRealGPSFix(true);
      if (freshLoc.areaName && !address.trim()) {
        setAddress(freshLoc.areaName);
      }
      if (showToast) {
        toast.success(`مختصات واقعی GPS با دقت ${toPersianDigits(freshLoc.accuracy)} متر دریافت و ثبت شد.`);
      }
    } catch (err: any) {
      const msg = err?.message || 'عدم دریافت سیگنال GPS';
      setGpsErrorMsg(msg);
      if (showToast) {
        toast.error(`خطای GPS: ${msg}`);
      }
    } finally {
      setIsLocating(false);
    }
  };

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

  const handleFinalSave = async () => {
    if (!name.trim() || isSaving) return;

    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        category,
        owner: owner.trim() || 'نامشخص',
        mobile: mobile.trim() || 'نامشخص',
        phone: phone.trim() || '',
        address: address.trim() || 'خیابان ملت، راسته قطعات',
        area: area.trim() || 'مرکز بازار',
        latitude: Number(lat) || 0,
        longitude: Number(lng) || 0,
        customer_status: customerStatus,
        brands,
        products: category === 'جلوبندی و تعلیق' ? ['سیبک', 'طبق', 'کمک‌فنر'] : ['لنت ترمز', 'شمع موتور', 'تسمه تایم'],
        notes: notes.trim(),
        photos,
      });
    } catch (err: any) {
      console.error('Failed to save store in modal:', err);
      toast.error(`خطا در ذخیره فروشگاه: ${err?.message || 'خطای ذخیره‌سازی'}`);
    } finally {
      setIsSaving(false);
    }
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
              {/* GPS Live Captured Widget */}
              <div className={`border rounded p-2.5 transition-colors ${
                isRealGPSFix
                  ? 'bg-emerald-50/90 border-emerald-400 text-emerald-950'
                  : gpsErrorMsg
                  ? 'bg-rose-50 border-rose-300 text-rose-950'
                  : 'bg-[#EBE8DF] border-[#202426] text-[#171A1B]'
              }`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`p-1.5 rounded text-white ${
                      isRealGPSFix ? 'bg-emerald-700' : gpsErrorMsg ? 'bg-rose-700' : 'bg-[#123C3A]'
                    }`}>
                      <IconGpsRadar size={16} className={isLocating ? 'animate-spin' : ''} />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="block text-xs font-bold">موقعیت مکانی فروشگاه (GPS)</span>
                        {isRealGPSFix ? (
                          <span className="bg-emerald-700 text-white text-[9px] px-1 rounded font-mono">
                            ماهواره زنده
                          </span>
                        ) : (
                          <span className="bg-stone-600 text-white text-[9px] px-1 rounded font-mono">
                            {isLocating ? 'در حال اتصال...' : 'بدون سیگنال زنده'}
                          </span>
                        )}
                      </div>
                      <span className="block text-[10px] font-mono dir-ltr text-stone-700 text-right mt-0.5">
                        {lat !== 0 && lng !== 0
                          ? `${lat.toFixed(5)}°N, ${lng.toFixed(5)}°E ${gpsAccuracy > 0 ? `(دقت: ${toPersianDigits(gpsAccuracy)}m)` : ''}`
                          : 'مختصاتی دریافت نشده است'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={isLocating}
                      onClick={() => handleAcquireGPS(true)}
                      className="px-2 py-1 bg-[#123C3A] hover:bg-[#1A4B49] text-white rounded text-[10px] font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <IconGpsRadar size={12} className={isLocating ? 'animate-spin' : ''} />
                      <span>{isLocating ? 'دریافت...' : 'دریافت زنده GPS'}</span>
                    </button>
                  </div>
                </div>

                {/* Real GPS Error Warning with code and instructions */}
                {gpsErrorMsg && (
                  <div className="mt-2 p-2 bg-rose-100 border border-rose-300 rounded text-[11px] text-rose-800 leading-relaxed">
                    <div className="font-bold flex items-center gap-1">
                      <span>⚠ خطای سنسور / مرورگر در دریافت GPS:</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[10px]">{gpsErrorMsg}</div>
                    <div className="mt-1 text-[10px] text-rose-700">
                      می‌توانید مختصات را به صورت دستی وارد کنید یا در محیط باز اقدام به فشردن «دریافت زنده GPS» نمایید.
                    </div>
                  </div>
                )}

                {/* Toggle Manual Coordinates */}
                <div className="mt-2 pt-2 border-t border-stone-300/60 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setManualCoords(!manualCoords)}
                    className="text-[10px] text-[#123C3A] hover:underline font-semibold"
                  >
                    {manualCoords ? 'بستن ویرایش دستی مختصات' : 'ویرایش دستی مختصات (Lat/Lng) ✎'}
                  </button>
                  {isRealGPSFix && (
                    <span className="text-[10px] text-emerald-800 font-semibold">
                      ✓ مختصات با سنسور واقعی دستگاه هماهنگ است
                    </span>
                  )}
                </div>

                {manualCoords && (
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-stone-200">
                    <div>
                      <label className="block text-[10px] text-stone-600 mb-0.5">عرض جغرافیایی (Latitude):</label>
                      <input
                        type="number"
                        step="0.000001"
                        dir="ltr"
                        value={lat}
                        onChange={(e) => setLat(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-stone-400 rounded p-1 text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-stone-600 mb-0.5">طول جغرافیایی (Longitude):</label>
                      <input
                        type="number"
                        step="0.000001"
                        dir="ltr"
                        value={lng}
                        onChange={(e) => setLng(parseFloat(e.target.value) || 0)}
                        className="w-full bg-white border border-stone-400 rounded p-1 text-xs font-mono"
                      />
                    </div>
                  </div>
                )}
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
            disabled={(currentStep === 1 && !name.trim()) || isSaving}
            className={`flex-1 py-2.5 px-4 rounded text-xs font-bold transition-colors ${
              currentStep === 4
                ? 'bg-[#C96F3B] hover:bg-[#B05B29] text-white shadow-md'
                : 'bg-[#123C3A] hover:bg-[#1A4B49] text-white'
            } disabled:opacity-50 flex items-center justify-center gap-1.5`}
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>در حال ذخیره در دیتابیس محلی...</span>
              </>
            ) : currentStep === 4 ? (
              '✓ ثبت قطعی فروشگاه'
            ) : (
              'مرحله بعد ←'
            )}
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
