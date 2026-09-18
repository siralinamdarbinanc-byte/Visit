import React, { useState, useRef } from 'react';
import { StorePhoto } from '../types';
import { getPersianDateString } from '../utils/persian';

interface PhotoCaptureModalProps {
  title?: string;
  onClose: () => void;
  onSavePhoto: (photo: { url: string; caption?: string; type: StorePhoto['type'] }) => void;
}

const PHOTO_TYPES: Array<{ id: StorePhoto['type']; label: string }> = [
  { id: 'storefront', label: 'نمای بیرونی و تابلو' },
  { id: 'business_card', label: 'کارت ویزیت / فاکتور' },
  { id: 'shelf', label: 'ویترین و قفسه قطعات' },
  { id: 'sign', label: 'پروانه کسب یا سند' },
  { id: 'other', label: 'سایر موارد' },
];

export const PhotoCaptureModal: React.FC<PhotoCaptureModalProps> = ({
  title = 'ثبت و پیوست تصویر',
  onClose,
  onSavePhoto,
}) => {
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [type, setType] = useState<StorePhoto['type']>('storefront');
  const [isProcessing, setIsProcessing] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const result = event.target?.result as string;
      // Optional: resize image on a canvas to prevent huge base64 memory bloat (max 1200px)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1200;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        setPhotoDataUrl(compressedDataUrl);
        setIsProcessing(false);
      };
      img.onerror = () => {
        setPhotoDataUrl(result);
        setIsProcessing(false);
      };
      img.src = result;
    };

    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!photoDataUrl) return;
    onSavePhoto({
      url: photoDataUrl,
      caption: caption.trim() || undefined,
      type,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 flex items-end sm:items-center justify-center p-0 sm:p-4 backdrop-blur-xs select-none">
      <div className="bg-[#FAF9F5] border-t-2 sm:border-2 border-[#123C3A] rounded-t-xl sm:rounded-lg w-full max-w-md overflow-hidden shadow-2xl animate-in slide-in-from-bottom duration-200">
        {/* Hidden File Inputs for real browser Camera / Gallery */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Header */}
        <div className="bg-[#123C3A] text-white p-3 border-b border-[#202426] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[#C96F3B] font-bold text-base">📷</span>
            <h3 className="text-xs font-bold">{title}</h3>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-white text-base">
            ✕
          </button>
        </div>

        <div className="p-3.5 space-y-3">
          {/* Photo Preview or Capture Buttons */}
          {photoDataUrl ? (
            <div className="space-y-2">
              <div className="relative rounded border border-[#202426] overflow-hidden bg-black max-h-60 flex items-center justify-center">
                <img src={photoDataUrl} alt="پروانه/تابلو" className="max-h-60 object-contain w-full" />
                <button
                  type="button"
                  onClick={() => setPhotoDataUrl(null)}
                  className="absolute top-2 right-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 text-xs shadow-md"
                  title="حذف و تصویر مجدد"
                >
                  ✕ حذف
                </button>
              </div>

              {/* Photo Type Selector */}
              <div>
                <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                  نوع تصویر:
                </label>
                <div className="grid grid-cols-2 gap-1">
                  {PHOTO_TYPES.map((pt) => (
                    <button
                      key={pt.id}
                      type="button"
                      onClick={() => setType(pt.id)}
                      className={`p-1.5 rounded text-[10px] font-semibold text-right border transition-all ${
                        type === pt.id
                          ? 'bg-[#123C3A] text-white border-[#123C3A]'
                          : 'bg-[#F3F1EA] text-[#171A1B] border-[#D5D0C3]'
                      }`}
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Caption */}
              <div>
                <label className="block text-[11px] font-bold text-[#171A1B] mb-1">
                  توضیح یا یادداشت تصویر (اختیاری):
                </label>
                <input
                  type="text"
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="مثال: تابلوی سردر مغازه در پاساژ کاشانی..."
                  className="w-full bg-[#F3F1EA] border border-[#202426] rounded p-2 text-xs text-[#171A1B] focus:border-[#C96F3B] focus:outline-none"
                />
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-center py-2">
              <p className="text-xs text-[#6E7472]">
                می‌توانید مستقیماً با دوربین گوشی عکس بگیرید یا عکسی از گالری دستگاه انتخاب نمایید:
              </p>

              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  disabled={isProcessing}
                  className="p-4 bg-[#123C3A] hover:bg-[#1A4B49] text-white rounded border border-[#0E2E2C] flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span className="text-2xl">📸</span>
                  <span className="text-xs font-bold">عکاسی با دوربین</span>
                  <span className="text-[9px] text-[#C4BFB2]">ثبت لحظه‌ای در محل مغازه</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  disabled={isProcessing}
                  className="p-4 bg-[#FAF9F5] hover:bg-[#EBE8DF] text-[#171A1B] border-2 border-[#123C3A] rounded flex flex-col items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <span className="text-2xl">🖼️</span>
                  <span className="text-xs font-bold">انتخاب از گالری</span>
                  <span className="text-[9px] text-[#6E7472]">فایل ذخیره شده در گوشی</span>
                </button>
              </div>

              {isProcessing && (
                <div className="p-2 text-xs text-[#C96F3B] font-bold">
                  در حال بارگذاری و بهینه‌سازی تصویر...
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#EBE8DF] border-t border-[#D5D0C3] flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 bg-[#FAF9F5] border border-[#C4BFB2] rounded text-xs font-semibold text-[#6E7472]"
          >
            انصراف
          </button>

          {photoDataUrl && (
            <button
              type="button"
              onClick={handleSave}
              className="flex-1 py-2.5 bg-[#C96F3B] hover:bg-[#B05B29] text-white rounded text-xs font-bold shadow-md active:scale-98 transition-transform"
            >
              ✓ پیوست قطعی تصویر
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
