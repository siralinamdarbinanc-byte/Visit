import React from 'react';
import { NavigationTab } from '../types';
import { IconStorefront, IconRouteCockpit, IconVisitCheck } from './TechnicalIcons';

interface BottomNavProps {
  activeTab: NavigationTab;
  onChangeTab: (tab: NavigationTab) => void;
  unvisitedCount?: number;
  pendingFollowupCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  unvisitedCount = 0,
  pendingFollowupCount = 0,
}) => {
  const tabs = [
    {
      id: 'home' as NavigationTab,
      label: 'خانه',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '1.75'}>
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
    },
    {
      id: 'map' as NavigationTab,
      label: 'نقشه',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '1.75'}>
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
          <line x1="8" y1="2" x2="8" y2="18" />
          <line x1="16" y1="6" x2="16" y2="22" />
        </svg>
      ),
    },
    {
      id: 'stores' as NavigationTab,
      label: 'فروشگاه‌ها',
      badge: unvisitedCount > 0 ? unvisitedCount : undefined,
      icon: (active: boolean) => <IconStorefront size={20} className={active ? 'stroke-[2.5]' : 'stroke-[1.75]'} />,
    },
    {
      id: 'visits' as NavigationTab,
      label: 'بازدیدها',
      badge: pendingFollowupCount > 0 ? pendingFollowupCount : undefined,
      icon: (active: boolean) => <IconVisitCheck size={20} className={active ? 'stroke-[2.5]' : 'stroke-[1.75]'} />,
    },
    {
      id: 'more' as NavigationTab,
      label: 'بیشتر',
      icon: (active: boolean) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? '2.5' : '1.75'}>
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="fixed bottom-0 inset-x-0 z-40 bg-[#171A1B] text-[#C4BFB2] border-t-2 border-[#202426] shadow-[0_-4px_12px_rgba(0,0,0,0.25)] select-none">
      <div className="grid grid-cols-5 h-[58px] max-w-lg mx-auto">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center pt-1 pb-1 transition-all group ${
                isActive
                  ? 'bg-[#123C3A] text-[#FAF9F5]'
                  : 'hover:bg-[#202426] hover:text-[#FAF9F5]'
              }`}
            >
              {/* Physical instrument top indicator notch */}
              {isActive && (
                <div className="absolute top-0 inset-x-2 h-[3px] bg-[#C96F3B] shadow-[0_1px_4px_rgba(201,111,59,0.7)]" />
              )}

              {/* Icon Container with Badge */}
              <div className="relative mt-0.5">
                {tab.icon(isActive)}
                {tab.badge !== undefined && (
                  <span className="absolute -top-1 -right-2 min-w-[15px] h-[15px] px-1 bg-[#C96F3B] text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-[#171A1B]">
                    {tab.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span
                className={`text-[11px] mt-0.5 tracking-tight font-medium ${
                  isActive ? 'text-[#FAF9F5] font-bold' : 'text-[#8E9491]'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
