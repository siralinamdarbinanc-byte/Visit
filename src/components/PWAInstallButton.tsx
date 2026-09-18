import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { toast } from '../hooks/useToast';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, installPWA } = usePWAInstall();
  const [showIOSModal, setShowIOSModal] = useState(false);

  if (isInstalled) {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-[#123C3A]/20 border border-[#123C3A] rounded text-[10px] text-[#123C3A] font-bold">
        <span>✓</span>
        <span>وب‌اپلیکیشن نصب شده (PWA Standalone)</span>
      </div>
    );
  }

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await installPWA();
      if (success) {
        toast.success('اپلیکیشن با موفقیت روی دستگاه شما نصب شد.');
      }
    } else if (isIOS) {
      setShowIOSModal(true);
    } else {
      toast.info('برای نصب، از منوی مرورگر گزینه «Add to Home screen» یا «Install App» را انتخاب فرمایید.');
    }
  };

  return (
    <>
      <button
        onClick={handleInstallClick}
        className="w-full py-2 px-3 bg-[#123C3A] hover:bg-[#1A4B49] text-white border border-[#202426] rounded text-xs font-bold flex items-center justify-center gap-2 shadow-sm active:scale-[0.98] transition-all"
      >
        <span className="text-[#C96F3B] text-sm font-black">⬇</span>
        <span>نصب نرم‌افزار روی صفحه گوشی (PWA آفلاین)</span>
      </button>

      {/* iOS instructions modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-end sm:items-center justify-center p-3 backdrop-blur-xs">
          <div className="bg-[#FAF9F5] border-2 border-[#123C3A] rounded-lg p-4 max-w-sm w-full space-y-3 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#D5D0C3] pb-2">
              <h3 className="text-xs font-bold text-[#171A1B]">راهنمای نصب روی آیفون (iOS)</h3>
              <button onClick={() => setShowIOSModal(false)} className="text-sm text-[#6E7472]">✕</button>
            </div>
            <ol className="text-xs text-[#202426] space-y-2 list-decimal list-inside leading-relaxed">
              <li>دکمه <span className="font-bold text-[#123C3A]">اشتراک‌گذاری (Share ⎘)</span> در نوار پایین مرورگر Safari را لمس کنید.</li>
              <li>صفحه را به پایین اسکرول کرده و گزینه <span className="font-bold text-[#C96F3B]">«Add to Home Screen» (افزودن به صفحه اصلی)</span> را انتخاب کنید.</li>
              <li>در بالای صفحه روی <span className="font-bold text-[#123C3A]">«Add»</span> کلیک نمایید.</li>
            </ol>
            <button
              onClick={() => setShowIOSModal(false)}
              className="w-full py-2 bg-[#123C3A] text-white rounded text-xs font-bold mt-2"
            >
              متوجه شدم
            </button>
          </div>
        </div>
      )}
    </>
  );
};
