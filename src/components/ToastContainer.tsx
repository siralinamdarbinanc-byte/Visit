import React from 'react';
import { useToast } from '../hooks/useToast';

export const ToastContainer: React.FC = () => {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none flex flex-col items-center gap-2 font-sans select-none">
      {toasts.map((t) => {
        let borderColor = 'border-[#123C3A]';
        let bgBadge = 'bg-[#123C3A]';
        let icon = 'ℹ';

        if (t.type === 'success') {
          borderColor = 'border-emerald-600';
          bgBadge = 'bg-emerald-700';
          icon = '✓';
        } else if (t.type === 'error') {
          borderColor = 'border-rose-600';
          bgBadge = 'bg-rose-700';
          icon = '✕';
        } else if (t.type === 'warning') {
          borderColor = 'border-[#C96F3B]';
          bgBadge = 'bg-[#C96F3B]';
          icon = '⚠';
        }

        return (
          <div
            key={t.id}
            className={`pointer-events-auto w-full max-w-sm bg-[#171A1B] text-[#FAF9F5] border-2 ${borderColor} rounded-lg shadow-xl p-3 flex items-start justify-between gap-2.5 animate-in fade-in slide-in-from-top duration-200`}
            role="alert"
          >
            <div className="flex items-start gap-2">
              <span className={`w-5 h-5 rounded-full ${bgBadge} text-white flex items-center justify-center text-xs font-bold shrink-0 mt-0.5`}>
                {icon}
              </span>
              <div>
                {t.title && (
                  <h4 className="text-xs font-bold text-white mb-0.5">{t.title}</h4>
                )}
                <p className="text-[11px] text-[#D5D0C3] leading-relaxed">{t.message}</p>
              </div>
            </div>

            <button
              onClick={() => dismiss(t.id)}
              className="text-[#8E9491] hover:text-white p-1 text-xs shrink-0"
              aria-label="بستن"
            >
              ✕
            </button>
          </div>
        );
      })}
    </div>
  );
};
