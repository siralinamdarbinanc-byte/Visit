import React from 'react';
import { CustomerStatus } from '../types';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  className?: string;
  size?: number;
}

// Custom Abstract Geometric Logo: LOCATION + ROUTE + AUTOMOTIVE + BUSINESS
export const FieldCommandLogo: React.FC<{ size?: number; className?: string }> = ({ size = 28, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    {/* Geometric outer precision frame */}
    <rect x="2" y="2" width="28" height="28" rx="4" stroke="#123C3A" strokeWidth="2" fill="#FAF9F5" />
    
    {/* Route waypoint diagonal vector */}
    <path d="M6 24L14 16L18 20L26 8" stroke="#C96F3B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    
    {/* Precision GPS node / automotive bore circle */}
    <circle cx="26" cy="8" r="3.5" fill="#123C3A" stroke="#FAF9F5" strokeWidth="1.5" />
    <circle cx="14" cy="16" r="2.5" fill="#C96F3B" />
    <circle cx="6" cy="24" r="2" fill="#202426" />
    
    {/* Industrial alignment reticle marks */}
    <line x1="16" y1="2" x2="16" y2="5" stroke="#202426" strokeWidth="1.5" />
    <line x1="16" y1="27" x2="16" y2="30" stroke="#202426" strokeWidth="1.5" />
    <line x1="2" y1="16" x2="5" y2="16" stroke="#202426" strokeWidth="1.5" />
    <line x1="27" y1="16" x2="30" y2="16" stroke="#202426" strokeWidth="1.5" />
  </svg>
);

// Custom status badge glyph (not emoji, technical geometric indicator)
export const StatusGlyph: React.FC<{ status: CustomerStatus; size?: number }> = ({ status, size = 12 }) => {
  switch (status) {
    case 'customer':
      // Solid Deep Green Hexagon
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
          <polygon points="8,1 15,4.5 15,11.5 8,15 1,11.5 1,4.5" fill="#2E6B50" stroke="#123C3A" strokeWidth="1" />
          <circle cx="8" cy="8" r="2" fill="#FAF9F5" />
        </svg>
      );
    case 'potential':
      // Copper diamond
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="8" y="1" width="10" height="10" transform="rotate(45 8 1)" fill="#C96F3B" stroke="#87431B" strokeWidth="1" />
        </svg>
      );
    case 'new':
      // Amber triangle / delta
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
          <polygon points="8,2 15,14 1,14" fill="#C28A32" stroke="#7A5317" strokeWidth="1" />
        </svg>
      );
    default:
      // Graphite square
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className="shrink-0">
          <rect x="3" y="3" width="10" height="10" fill="#6E7472" stroke="#202426" strokeWidth="1" />
        </svg>
      );
  }
};

// Coherent technical SVG icons:
export const IconNavigation: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="3 11 22 2 13 21 11 13 3 11" />
  </svg>
);

export const IconPhoneCall: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

export const IconStorefront: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 9l2-5h14l2 5" />
    <path d="M21 9v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9" />
    <path d="M9 21V12h6v9" />
    <path d="M3 9h18" />
  </svg>
);

export const IconGpsRadar: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="3" x2="12" y2="1" />
    <line x1="12" y1="23" x2="12" y2="21" />
    <line x1="3" y1="12" x2="1" y2="12" />
    <line x1="23" y1="12" x2="21" y2="12" />
  </svg>
);

export const IconCompass: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="#C96F3B" stroke="#123C3A" />
  </svg>
);

export const IconRouteCockpit: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="6" cy="19" r="3" />
    <circle cx="18" cy="5" r="3" />
    <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12" />
  </svg>
);

export const IconVisitCheck: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
  </svg>
);

export const IconSync: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.2" />
  </svg>
);

export const IconEnginePart: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

export const IconDossier: React.FC<IconProps> = ({ size = 18, className = '' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);
