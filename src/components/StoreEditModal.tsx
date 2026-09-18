import React, { useState } from 'react';
import { Store, StoreCategory, CustomerStatus, UserLocation } from '../types';
import { FieldStorageService, DuplicateCheckResult, toPersianDigits } from '../services/storage';
import { geolocationService } from '../services/geolocation';
import { toast } from '../hooks/useToast';
import { isValidIranianMobile } from '../utils/persian';

interface StoreEditModalProps {
  store: Store;
  userLocation: UserLocation;
  onClose: () => void;
  onSave: (updatedStore: Store) => Promise<void> | void;
  onDelete?: (storeId: string) => Promise<void> | void;
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

export const StoreEditModal: React.FC<StoreEditModalProps> = ({
  store,
  userLocation,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState(store.name);
  const [owner, setOwner] = useState(store.owner);
  const [mobile, setMobile] = useState(store.mobile);
  const [phone, setPhone] = useState(store.phone);
  const [address, setAddress] = useState(store.address);
  const [area, setArea] = useState(store.area);
  const [lat, setLat] = useState(store.latitude);
  const [lng, setLng] = useState(store.longitude);
  const [category, setCategory] = useState<StoreCategory>(store.category);
  const [subcategory, setSubcategory] = useState(store.subcategory || '');
  const [customerStatus, setCustomerStatus] = useState<CustomerStatus>(store.customer_status);
  const [notes, setNotes] = useState(store.notes || '');

  // Brands and products as editable tags
  const [brands, setBrands] = useState<string[]>(store.brands || []);
  const [brandInput, setBrandInput] = useState('');
  const [products, setProducts] = useState<string[]>(store.products || []);
  const [productInput, setProductInput] = useState('');

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<DuplicateCheckResult | null>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleAddBrand = () => {
    const val = brandInput.trim();
    if (val && !brands.includes(val)) {
      setBrands([...brands, val]);
      setBrandInput('');
    }
  };

  const handleRemoveBrand = (item: string) => {
    setBrands(brands.filter((b) => b !== item));
  };

  const handleAddProduct = () => {
    const val = productInput.trim();
    if (val && !products.includes(val)) {
      setProducts([...products, val]);
      setProductInput('');
    }
  };

  const handleRemoveProduct = (item: string) => {
    setProducts(products.filter((p) => p !== item));
  };

  const handleUseCurrentGPS = async () => {
    setIsLocating(true);
    try {
      const freshLoc = await geolocationService.requestSingleUpdate(true);
      setLat(freshLoc.latitude);
      setLng(freshLoc.longitude);
      toast.success(`مختصات با GPS زنده به‌روزرسانی شد (دقت: ${toPersianDigits(freshLoc.accuracy)}m).`);
    } catch (err: any) {
      if (userLocation.latitude !== 0 && userLocation.longitude !== 0) {
        setLat(userLocation.latitude);
        setLng(userLocation.longitude);
        toast.info('مختصات با آخرین موقعیت ثبت‌شده GPS جایگزین شد.');
      } else {
        toast.error(`خطای دریافت GPS: ${err?.message || 'سنسور در دسترس نیست'}`);
      }
    } finally {
      setIsLocating(false);
    }
  };

  const handleFormSubmit = async (forceSave = false) => {
    if (!name.trim() || isSaving) {
      if (!name.trim()) toast.error('وارد کردن نام فروشگاه الزامی است.');
      return;
    }

    if (!forceSave) {
      // Check for duplicates
      const dupResult = await FieldStorageService.checkDuplicateStore(
        {
          name: name.trim(),
          mobile: mobile.trim(),
          phone: phone.trim(),
          area: area.trim(),
          latitude: Number(lat) || 0,
          longitude: Number(lng) || 0,
        },
        store.id
      );

      if (dupResult.isDuplicate) {
        setDuplicateWarning(dupResult);
        return;
      }
    }

    const updated: Store = {
      ...store,
      name: name.trim(),
      owner: owner.trim() || 'نامشخص',
      mobile: mobile.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area: area.trim(),
      latitude: Number(lat) || 0,
      longitude: Number(lng) || 0,
      category,
      subcategory: subcategory.trim() || undefined,
      customer_status: customerStatus,
      notes: notes.trim(),
      brands,
      products,
    };

    setIsSaving(true);
    try {
      await onSave(updated);
      onClose();
    } catch (err: any) {
      console.error('Error updating store:', err);
      toast.error(`خطا در به‌روزرسانی: ${err?.message || 'خطای IndexedDB'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStore = async () => {
    if (onDelete) {
      setIsSaving(true);
      try {
        await onDelete(store.id);
        onClose();
      } catch (err: any) {
        toast.error(`خطا در حذف فروشگاه: ${err?.message}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs select-none">
      <div className="bg-[#FAF9F5] border-t-2 sm:border-2 border-[#123C3A] rounded-t-xl sm:rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Header */}
        <div className="bg-[#123C3A] text-white p-3 border-b border-[#202426] flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <span className="text-[#C96F3B] font-bold text-base">✎</span>
            <h2 className="text-xs sm:text-sm font-bold">ویرایش مشخصات پرونده فروشگاه</h2>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-white text-base">
            ✕
          </button>
        </div>

        {/* Duplicate Warning Dialog */}
        {duplicateWarning && (
          <div className="p-3 bg-amber-50 border-b-2 border-[#C96F3B] text-amber-900 text-xs space-y-2">
            <div className="font-bold flex items-center gap-1.5 text-[#C96F3B]">
              <span>⚠ هشدار تشابه مشخصات فروشگاه:</span>
            </div>
            <p>{duplicateWarning.reason}</p>
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => handleFormSubmit(true)}
                className="px-3 py-1.5 bg-[#C96F3B] text-white rounded font-bold text-xs"
              >
                ادامه و ذخیره به هر حال
              </button>
              <button
                type="button"
                onClick={() => setDuplicateWarning(null)}
                className="px-3 py-1.5 bg-white border border-amber-400 rounded text-xs text-amber-900"
              >
                بازگشت و اصلاح
              </button>
            </div>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 space-y-3 font-sans text-xs">
          {/* 1. Name & Owner */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                نام فروشگاه <span className="text-rose-600">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                نام صاحب یا مدیر فروشگاه
              </label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                className="w-full bg-[#F3F1EA] border border-[#D5D0C3] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none"
              />
            </div>
          </div>

          {/* 2. Mobile & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                شماره همراه (مدیر)
              </label>
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
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                تلفن ثابت فروشگاه
              </label>
              <input
                type="tel"
                dir="ltr"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="02133912345"
                className="w-full bg-[#F3F1EA] border border-[#D5D0C3] rounded p-2 text-xs font-mono text-left focus:border-[#C96F3B] focus:outline-none"
              />
            </div>
          </div>

          {/* 3. Category & Subcategory */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                صنف اصلی
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as StoreCategory)}
                className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                زیررسته تخصصی
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="مثال: لنت ترمز و کلاچ"
                className="w-full bg-[#F3F1EA] border border-[#D5D0C3] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none"
              />
            </div>
          </div>

          {/* 4. Area & Address */}
          <div className="space-y-2">
            <div>
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                منطقه / محله
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                آدرس کامل
              </label>
              <textarea
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* 5. GPS Coordinates */}
          <div className="bg-[#EBE8DF] p-2.5 rounded border border-[#D5D0C3] flex items-center justify-between">
            <div>
              <span className="block text-[11px] font-bold text-[#171A1B]">مختصات جغرافیایی نقشه:</span>
              <span className="font-mono text-[10px] text-[#6E7472]">
                {lat.toFixed(5)}°N, {lng.toFixed(5)}°E
              </span>
            </div>
            <button
              type="button"
              onClick={handleUseCurrentGPS}
              className="px-2.5 py-1 bg-[#FAF9F5] border border-[#202426] rounded text-[10px] font-bold text-[#123C3A] hover:bg-white"
            >
              به‌روزرسانی با GPS فعلی
            </button>
          </div>

          {/* 6. Customer Status */}
          <div>
            <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
              وضعیت ارتباط با مشتری:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1">
              {[
                { id: 'customer', label: 'مشتری دائم' },
                { id: 'potential', label: 'مشتری بالقوه' },
                { id: 'new', label: 'جدید' },
                { id: 'unspecified', label: 'نامشخص' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setCustomerStatus(st.id as CustomerStatus)}
                  className={`p-1.5 rounded text-[11px] font-semibold text-center border transition-all ${
                    customerStatus === st.id
                      ? 'bg-[#123C3A] text-white border-[#123C3A]'
                      : 'bg-[#F3F1EA] text-[#171A1B] border-[#D5D0C3]'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* 7. Brands Tag Management */}
          <div>
            <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
              برندهای تحت پوشش:
            </label>
            <div className="flex gap-1.5 mb-1.5">
              <input
                type="text"
                value={brandInput}
                onChange={(e) => setBrandInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBrand())}
                placeholder="افزودن برند (مانند ایساکو، بوش، کروز)..."
                className="flex-1 bg-[#F3F1EA] border border-[#202426] rounded px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddBrand}
                className="px-2.5 py-1 bg-[#123C3A] text-white rounded text-xs font-bold"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {brands.map((b) => (
                <span
                  key={b}
                  className="px-2 py-0.5 bg-[#EBE8DF] border border-[#D5D0C3] rounded text-[11px] text-[#171A1B] flex items-center gap-1"
                >
                  <span>{b}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveBrand(b)}
                    className="text-[#6E7472] hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 8. Products Tag Management */}
          <div>
            <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
              اقلام و قطعات اصلی:
            </label>
            <div className="flex gap-1.5 mb-1.5">
              <input
                type="text"
                value={productInput}
                onChange={(e) => setProductInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddProduct())}
                placeholder="افزودن قطعه (مانند لنت، شمع، واشر)..."
                className="flex-1 bg-[#F3F1EA] border border-[#202426] rounded px-2 py-1 text-xs"
              />
              <button
                type="button"
                onClick={handleAddProduct}
                className="px-2.5 py-1 bg-[#123C3A] text-white rounded text-xs font-bold"
              >
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {products.map((p) => (
                <span
                  key={p}
                  className="px-2 py-0.5 bg-[#EBE8DF] border border-[#D5D0C3] rounded text-[11px] text-[#171A1B] flex items-center gap-1"
                >
                  <span>{p}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveProduct(p)}
                    className="text-[#6E7472] hover:text-rose-600"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* 9. Notes */}
          <div>
            <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
              یادداشت‌ها و شرایط ویژه:
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs focus:border-[#C96F3B] focus:outline-none resize-none"
            />
          </div>

          {/* 10. Delete Section */}
          {onDelete && (
            <div className="pt-2 border-t border-[#D5D0C3]">
              {isConfirmingDelete ? (
                <div className="p-2.5 bg-rose-50 border border-rose-300 rounded space-y-2 text-rose-900">
                  <p className="text-[11px] font-bold">
                    آیا از حذف این فروشگاه و کلیه سوابق ویزیت و پیگیری‌های آن اطمینان دارید؟
                  </p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleDeleteStore}
                      className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded font-bold text-xs"
                    >
                      بله، حذف قطعی
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsConfirmingDelete(false)}
                      className="px-3 py-1 bg-white border border-rose-300 rounded text-xs text-rose-800"
                    >
                      انصراف
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsConfirmingDelete(true)}
                  className="text-rose-600 hover:underline text-[11px] font-bold"
                >
                  حذف این فروشگاه از سیستم...
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#EBE8DF] border-t border-[#D5D0C3] flex items-center justify-between gap-2 sticky bottom-0 z-10">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-[#FAF9F5] border border-[#C4BFB2] rounded text-xs font-semibold text-[#6E7472]"
          >
            انصراف
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={() => handleFormSubmit(false)}
            className="flex-1 py-2.5 bg-[#C96F3B] hover:bg-[#B05B29] disabled:opacity-50 text-white rounded text-xs font-bold shadow-md active:scale-98 transition-transform flex items-center justify-center gap-1.5"
          >
            {isSaving ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin"></span>
                <span>در حال ذخیره تغییرات...</span>
              </>
            ) : (
              '✓ ذخیره تغییرات پرونده'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
