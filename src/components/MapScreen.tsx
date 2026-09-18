import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Store, UserLocation, CustomerStatus } from '../types';
import { StatusGlyph, IconPhoneCall, IconNavigation, IconVisitCheck, IconGpsRadar } from './TechnicalIcons';
import { formatDistance, toPersianDigits } from '../services/storage';

interface MapScreenProps {
  stores: Store[];
  userLocation: UserLocation;
  selectedStore: Store | null;
  onSelectStore: (store: Store | null) => void;
  onOpenDossier: (store: Store) => void;
  onRecordVisit: (store: Store) => void;
  onNavigateToStore: (store: Store) => void;
}

export const MapScreen: React.FC<MapScreenProps> = ({
  stores,
  userLocation,
  selectedStore,
  onSelectStore,
  onOpenDossier,
  onRecordVisit,
  onNavigateToStore,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  const [activeFilter, setActiveFilter] = useState<'all' | CustomerStatus | 'followup' | 'unvisited'>('all');
  const [showRoute, setShowRoute] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Filter stores based on active tab and search query
  const filteredStores = stores.filter((s) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = s.name.toLowerCase().includes(q);
      const matchArea = s.area.toLowerCase().includes(q);
      const matchCategory = s.category.toLowerCase().includes(q);
      const matchBrand = s.brands.some((b) => b.toLowerCase().includes(q));
      if (!matchName && !matchArea && !matchCategory && !matchBrand) return false;
    }

    if (activeFilter === 'all') return true;
    if (activeFilter === 'unvisited') return (s.visit_count || 0) === 0;
    if (activeFilter === 'followup') return s.last_visit_result === 'needs_followup';
    return s.customer_status === activeFilter;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [userLocation.latitude, userLocation.longitude],
        zoom: 16,
        zoomControl: false,
        attributionControl: false,
      });

      // Warm technical tile layer (CartoDB Positron - light, legible, technical)
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 19,
        subdomains: 'abcd',
      }).addTo(map);

      // Create LayerGroup for markers
      const markersLayer = L.layerGroup().addTo(map);
      markersLayerRef.current = markersLayer;
      mapInstanceRef.current = map;

      // Close bottom sheet when clicking anywhere on map canvas
      map.on('click', () => {
        onSelectStore(null);
      });
    }

    return () => {
      // Don't fully destroy to maintain cache between tabs, but cleanup if component unmounts
    };
  }, []);

  // Update User Beacon Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // User position beacon icon (pulsing radar)
    const userBeaconIcon = L.divIcon({
      className: 'user-beacon-marker',
      html: `
        <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center;">
          <div style="position: absolute; width: 26px; height: 26px; border-radius: 50%; background: rgba(18, 60, 58, 0.25); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
          <div style="width: 14px; height: 14px; border-radius: 50%; background: #123C3A; border: 2.5px solid #FAF9F5; box-shadow: 0 0 8px rgba(18, 60, 58, 0.6); display: flex; align-items: center; justify-content: center;">
            <div style="width: 4px; height: 4px; border-radius: 50%; background: #C96F3B;"></div>
          </div>
        </div>
      `,
      iconSize: [26, 26],
      iconAnchor: [13, 13],
    });

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.latitude, userLocation.longitude]);
    } else {
      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: userBeaconIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }
  }, [userLocation]);

  // Update Store Markers & Route Lines
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Custom automotive marker generator
    filteredStores.forEach((store) => {
      const isSelected = selectedStore?.id === store.id;

      // Determine marker color and symbol based on store status
      let borderColor = '#202426';
      let bgColor = '#FAF9F5';
      let textColor = '#171A1B';
      let badgeLabel = '';

      if (store.customer_status === 'customer') {
        borderColor = '#2E6B50';
        bgColor = isSelected ? '#2E6B50' : '#EBF5F0';
        textColor = isSelected ? '#FFFFFF' : '#2E6B50';
        badgeLabel = 'مشتری';
      } else if (store.customer_status === 'potential') {
        borderColor = '#C96F3B';
        bgColor = isSelected ? '#C96F3B' : '#FBF0E9';
        textColor = isSelected ? '#FFFFFF' : '#C96F3B';
        badgeLabel = 'بالقوه';
      } else if (store.customer_status === 'new') {
        borderColor = '#C28A32';
        bgColor = isSelected ? '#C28A32' : '#FBF5EB';
        textColor = isSelected ? '#FFFFFF' : '#C28A32';
        badgeLabel = 'جدید';
      } else {
        borderColor = '#6E7472';
        bgColor = isSelected ? '#202426' : '#FAF9F5';
        textColor = isSelected ? '#FFFFFF' : '#6E7472';
        badgeLabel = 'ثبت';
      }

      // If needs follow-up, add emergency ring
      const hasFollowup = store.last_visit_result === 'needs_followup';

      const customIcon = L.divIcon({
        className: 'field-store-marker',
        html: `
          <div style="
            position: relative;
            transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
            transition: transform 0.15s ease-out;
            cursor: pointer;
          ">
            <div style="
              display: flex;
              align-items: center;
              gap: 4px;
              padding: 3px 6px;
              background: ${bgColor};
              color: ${textColor};
              border: 1.5px solid ${borderColor};
              border-radius: 4px;
              box-shadow: 0 2px 6px rgba(0,0,0,0.18);
              font-family: 'Vazirmatn', sans-serif;
              font-size: 11px;
              font-weight: 700;
              white-space: nowrap;
            ">
              <span style="display:inline-block; width: 6px; height: 6px; border-radius: 50%; background: ${borderColor};"></span>
              <span>${store.name.split(' ')[0]}</span>
              <span style="font-size: 9px; opacity: 0.8; font-family: 'JetBrains Mono', monospace;">${store.distance ? `${store.distance}m` : ''}</span>
            </div>
            ${
              hasFollowup
                ? `<div style="position: absolute; -top: 4px; -right: 4px; width: 8px; height: 8px; border-radius: 50%; background: #B94A48; border: 1.5px solid #FFFFFF;"></div>`
                : ''
            }
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 13],
      });

      const marker = L.marker([store.latitude, store.longitude], {
        icon: customIcon,
      });

      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelectStore(store);
      });

      markersLayer.addLayer(marker);
    });

    // Update Route Line (connect user to closest stores)
    if (routeLineRef.current) {
      map.removeLayer(routeLineRef.current);
      routeLineRef.current = null;
    }

    if (showRoute) {
      // Pick top 3 nearest stores
      const routePoints: [number, number][] = [
        [userLocation.latitude, userLocation.longitude],
        ...[...stores]
          .sort((a, b) => (a.distance || 0) - (b.distance || 0))
          .slice(0, 3)
          .map((s) => [s.latitude, s.longitude] as [number, number]),
      ];

      routeLineRef.current = L.polyline(routePoints, {
        color: '#C96F3B',
        weight: 3,
        dashArray: '6, 6',
        opacity: 0.85,
      }).addTo(map);
    }
  }, [filteredStores, selectedStore, showRoute, userLocation]);

  // Center on User GPS
  const handleRecenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([userLocation.latitude, userLocation.longitude], 16, {
        animate: true,
      });
    }
  };

  // Zoom In / Out
  const handleZoom = (delta: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setZoom(mapInstanceRef.current.getZoom() + delta);
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-105px)] overflow-hidden bg-[#E7E4DC]">
      {/* 1. Top Search & Filter Bar Overlay */}
      <div className="absolute top-2 inset-x-2 z-[500] max-w-lg mx-auto space-y-1.5">
        {/* Search input in map */}
        <div className="flex items-center bg-[#FAF9F5] border border-[#202426] rounded shadow-md px-2.5 py-1.5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#6E7472" strokeWidth="2.5" className="ml-2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="فیلتر فروشگاه‌ها روی نقشه..."
            className="w-full text-xs bg-transparent text-[#171A1B] focus:outline-none placeholder-[#8A908E]"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-xs text-[#6E7472] px-1">
              ✕
            </button>
          )}
        </div>

        {/* Quick Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 px-0.5">
          {[
            { id: 'all', label: 'همه' },
            { id: 'customer', label: 'مشتری' },
            { id: 'potential', label: 'بالقوه' },
            { id: 'followup', label: 'نیازمند پیگیری' },
            { id: 'new', label: 'جدید' },
            { id: 'unvisited', label: 'بازدیدنشده' },
          ].map((chip) => {
            const isActive = activeFilter === chip.id;
            return (
              <button
                key={chip.id}
                onClick={() => setActiveFilter(chip.id as any)}
                className={`px-2.5 py-1 rounded text-[11px] font-semibold whitespace-nowrap shadow-xs border transition-all ${
                  isActive
                    ? 'bg-[#123C3A] text-white border-[#123C3A]'
                    : 'bg-[#FAF9F5]/90 backdrop-blur text-[#202426] border-[#D5D0C3] hover:bg-[#FAF9F5]'
                }`}
              >
                {chip.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Map Viewport Canvas */}
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* 3. Automotive Map Controls (Right Side) */}
      <div className="absolute left-3 bottom-24 z-[500] flex flex-col gap-1.5">
        {/* GPS Re-center */}
        <button
          onClick={handleRecenter}
          title="موقعیت من"
          className="w-9 h-9 bg-[#FAF9F5] border border-[#202426] rounded shadow-md flex items-center justify-center text-[#123C3A] active:bg-[#EBE8DF]"
        >
          <IconGpsRadar size={18} />
        </button>

        {/* Toggle Route */}
        <button
          onClick={() => setShowRoute(!showRoute)}
          title="مسیر پیشنهادی ویزیت"
          className={`w-9 h-9 border rounded shadow-md flex items-center justify-center transition-colors ${
            showRoute
              ? 'bg-[#C96F3B] text-white border-[#87431B]'
              : 'bg-[#FAF9F5] text-[#202426] border-[#202426]'
          }`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <circle cx="6" cy="19" r="3" />
            <circle cx="18" cy="5" r="3" />
            <path d="M12 19h4.5a3.5 3.5 0 0 0 0-7h-9a3.5 3.5 0 0 1 0-7H12" />
          </svg>
        </button>

        {/* Zoom In */}
        <button
          onClick={() => handleZoom(1)}
          className="w-9 h-8 bg-[#FAF9F5] border border-[#202426] rounded-t shadow-md flex items-center justify-center text-sm font-bold text-[#202426] active:bg-[#EBE8DF]"
        >
          +
        </button>
        {/* Zoom Out */}
        <button
          onClick={() => handleZoom(-1)}
          className="w-9 h-8 bg-[#FAF9F5] border-x border-b border-[#202426] rounded-b shadow-md flex items-center justify-center text-sm font-bold text-[#202426] active:bg-[#EBE8DF]"
        >
          −
        </button>
      </div>

      {/* 4. Selected Store Bottom Sheet (Prompt: Open bottom sheet instead of navigating immediately) */}
      {selectedStore && (
        <div className="absolute bottom-2 inset-x-2 z-[600] max-w-lg mx-auto bg-[#FAF9F5] border-2 border-[#123C3A] rounded shadow-xl p-3 animate-in slide-in-from-bottom duration-200">
          {/* Header */}
          <div className="flex items-start justify-between gap-2 border-b border-[#E6E2D8] pb-2">
            <div className="flex items-start gap-2 min-w-0">
              <div className="pt-0.5">
                <StatusGlyph status={selectedStore.customer_status} size={16} />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-[#171A1B] truncate">{selectedStore.name}</h3>
                  <span className="text-[10px] font-bold text-[#123C3A] bg-[#EBE8DF] px-1.5 py-0.2 rounded font-technical-mono">
                    {formatDistance(selectedStore.distance || 0)}
                  </span>
                </div>
                <p className="text-[11px] text-[#6E7472] truncate mt-0.5">
                  {selectedStore.category} • {selectedStore.owner}
                </p>
                <p className="text-[10px] text-[#8A908E] truncate">
                  آخرین ویزیت: {selectedStore.last_visit_date || 'ثبت نشده'}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectStore(null)}
              className="p-1 text-[#6E7472] hover:text-[#171A1B] rounded hover:bg-[#EBE8DF]"
            >
              ✕
            </button>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-4 gap-1.5 mt-2.5">
            <a
              href={`tel:${selectedStore.mobile || selectedStore.phone}`}
              className="flex items-center justify-center gap-1 py-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-xs font-semibold text-[#171A1B]"
            >
              <IconPhoneCall size={14} className="text-[#123C3A]" />
              <span>تماس</span>
            </a>

            <button
              onClick={() => onNavigateToStore(selectedStore)}
              className="flex items-center justify-center gap-1 py-2 bg-[#FAF9F5] hover:bg-[#EBE8DF] border border-[#C4BFB2] rounded text-xs font-semibold text-[#171A1B]"
            >
              <IconNavigation size={14} className="text-[#C96F3B]" />
              <span>مسیریابی</span>
            </button>

            <button
              onClick={() => onRecordVisit(selectedStore)}
              className="flex items-center justify-center gap-1 py-2 bg-[#123C3A] hover:bg-[#1A4B49] border border-[#0E2E2C] rounded text-xs font-semibold text-[#FAF9F5]"
            >
              <IconVisitCheck size={14} />
              <span>ثبت ویزیت</span>
            </button>

            <button
              onClick={() => onOpenDossier(selectedStore)}
              className="flex items-center justify-center gap-1 py-2 bg-[#C96F3B] hover:bg-[#B05B29] rounded text-xs font-semibold text-white"
            >
              <span>پرونده</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
