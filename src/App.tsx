import React, { useState, useEffect, useCallback } from 'react';
import {
  Store,
  Visit,
  FollowUp,
  SyncQueueItem,
  ConnectionState,
  UserLocation,
  NavigationTab,
  StorePhoto,
} from './types';
import { FieldStorageService } from './services/storage';
import { useGeolocation } from './hooks/useGeolocation';
import { toast } from './hooks/useToast';

// Core Components
import { HeaderNav } from './components/HeaderNav';
import { BottomNav } from './components/BottomNav';
import { HomeScreen } from './components/HomeScreen';
import { MapScreen } from './components/MapScreen';
import { StoreListScreen } from './components/StoreListScreen';
import { StoreProfileDossier } from './components/StoreProfileDossier';
import { VisitCockpitMode } from './components/VisitCockpitMode';
import { FollowUpScreen } from './components/FollowUpScreen';
import { ReportsScreen } from './components/ReportsScreen';
import { SyncCenterScreen } from './components/SyncCenterScreen';
import { MoreMenuScreen } from './components/MoreMenuScreen';
import { ToastContainer } from './components/ToastContainer';

// Modals
import { QuickStoreRegistrationModal } from './components/QuickStoreRegistrationModal';
import { VisitRecordModal } from './components/VisitRecordModal';
import { StoreEditModal } from './components/StoreEditModal';
import { PhotoCaptureModal } from './components/PhotoCaptureModal';

type AppActiveTab = NavigationTab | 'cockpit' | 'reports' | 'sync';

export default function App() {
  // Application State
  const [activeTab, setActiveTab] = useState<AppActiveTab>('home');
  const [connectionState, setConnectionState] = useState<ConnectionState>(FieldStorageService.getConnectionState());
  const [stores, setStores] = useState<Store[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [followups, setFollowups] = useState<FollowUp[]>([]);
  const [syncQueue, setSyncQueue] = useState<SyncQueueItem[]>([]);

  // Navigation & Modal Overlays
  const [selectedStore, setSelectedStore] = useState<Store | null>(null);
  const [visitingStore, setVisitingStore] = useState<Store | null>(null);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [photoStoreId, setPhotoStoreId] = useState<string | null>(null);
  const [isAddStoreOpen, setIsAddStoreOpen] = useState(false);
  const [mapTargetStore, setMapTargetStore] = useState<Store | null>(null);

  // Live Geolocation
  const {
    location: currentGpsLocation,
    status: _gpsStatus,
    errorMessage: _gpsErrorMessage,
    errorCode: _gpsErrorCode,
    refreshLocation: refreshGpsLocation,
  } = useGeolocation();

  const [userLocation, setUserLocation] = useState<UserLocation>(currentGpsLocation);

  // Sync / Refresh Data
  const refreshData = useCallback(() => {
    const loc = FieldStorageService.getUserLocation();
    setUserLocation(loc);
    setStores(FieldStorageService.getStores(loc));
    setVisits(FieldStorageService.getVisits());
    setFollowups(FieldStorageService.getFollowUps());
    setSyncQueue(FieldStorageService.getSyncQueue());
    setConnectionState(FieldStorageService.getConnectionState());
  }, []);

  // Initialize DB and subscribe to storage updates
  useEffect(() => {
    let isMounted = true;
    const initApp = async () => {
      try {
        await FieldStorageService.init();
        if (isMounted) {
          refreshData();
        }
      } catch (err) {
        console.error('FieldStorageService init error:', err);
      }
    };
    initApp();

    const unsubscribe = FieldStorageService.subscribe(() => {
      if (isMounted) {
        refreshData();
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [refreshData]);

  // Synchronize live GPS with Storage and distance calculations
  useEffect(() => {
    if (currentGpsLocation) {
      FieldStorageService.setUserLocation(currentGpsLocation);
      setUserLocation(currentGpsLocation);
      setStores(FieldStorageService.getStores(currentGpsLocation));
    }
  }, [currentGpsLocation]);

  // Toggle connection state (online/offline)
  const handleToggleConnection = () => {
    const nextState = connectionState === 'online' ? 'offline' : 'online';
    FieldStorageService.setConnectionState(nextState);
    setConnectionState(nextState);
  };

  // Quick Action: Navigate to store on map
  const handleNavigateToStore = (store: Store) => {
    setMapTargetStore(store);
    setActiveTab('map');
  };

  // Add new store
  const handleSaveNewStore = async (storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const created = await FieldStorageService.saveStoreAsync(storeData);
      setIsAddStoreOpen(false);
      refreshData();
      setSelectedStore(created);
      toast.success(`فروشگاه «${created.name}» با موفقیت ثبت شد.`);
    } catch (err: any) {
      console.error('Failed to create store:', err);
      toast.error(`خطا در ثبت فروشگاه در پایگاه داده: ${err?.message || 'خطای پایگاه داده'}`);
    }
  };

  // Edit and update store
  const handleSaveEditedStore = async (updatedStore: Store) => {
    try {
      const saved = await FieldStorageService.saveStoreAsync(updatedStore);
      setEditingStore(null);
      refreshData();
      setSelectedStore(saved);
      toast.success('مشخصات فروشگاه با موفقیت به‌روزرسانی شد.');
    } catch (err: any) {
      console.error('Failed to update store:', err);
      toast.error(`خطا در به‌روزرسانی فروشگاه: ${err?.message || 'خطای پایگاه داده'}`);
    }
  };

  // Delete store
  const handleDeleteStore = async (storeId: string) => {
    try {
      await FieldStorageService.deleteStoreAsync(storeId);
      setEditingStore(null);
      setSelectedStore(null);
      refreshData();
      toast.info('فروشگاه و کلیه سوابق ویزیت آن از پایگاه محلی حذف شد.');
    } catch (err: any) {
      console.error('Failed to delete store:', err);
      toast.error(`خطا در حذف فروشگاه: ${err?.message || 'خطای پایگاه داده'}`);
    }
  };

  // Attach real photo to store
  const handleSavePhoto = async (photo: { url: string; caption?: string; type: StorePhoto['type'] }) => {
    if (!photoStoreId) return;
    try {
      await FieldStorageService.addPhotoToStoreAsync(photoStoreId, photo.url, photo.caption, photo.type);
      toast.success('تصویر با موفقیت در پرونده فروشگاه الصاق شد.');
      setPhotoStoreId(null);
      refreshData();
      const updated = FieldStorageService.getStores().find((s) => s.id === photoStoreId);
      if (updated) setSelectedStore(updated);
    } catch (err: any) {
      console.error('Failed to add photo:', err);
      toast.error('خطا در الصاق تصویر');
    }
  };

  // Remove photo from store
  const handleRemovePhoto = (storeId: string, photoId: string) => {
    FieldStorageService.removePhotoFromStore(storeId, photoId);
    refreshData();
    const updated = FieldStorageService.getStores().find((s) => s.id === storeId);
    if (updated) setSelectedStore(updated);
    toast.info('تصویر با موفقیت حذف گردید.');
  };

  // Record visit
  const handleSaveVisit = async (visitData: any) => {
    try {
      await FieldStorageService.addVisitAsync(visitData);
      setVisitingStore(null);
      refreshData();
      toast.success('گزارش ویزیت با موفقیت در پایگاه محلی ثبت شد.');
    } catch (err: any) {
      console.error('Failed to save visit:', err);
      toast.error(`خطا در ثبت ویزیت: ${err?.message || 'خطای پایگاه داده'}`);
    }
  };

  // Update follow-up status
  const handleUpdateFollowupStatus = async (id: string, status: FollowUp['status']) => {
    try {
      await FieldStorageService.updateFollowUpStatusAsync(id, status);
      refreshData();
    } catch (err: any) {
      console.error('Failed to update followup:', err);
    }
  };

  // Counts
  const pendingFollowupsCount = followups.filter(
    (f) => f.status === 'pending' || f.status === 'overdue'
  ).length;

  const unvisitedStoresCount = stores.filter((s) => (s.visit_count || 0) === 0).length;

  return (
    <div className="min-h-screen bg-[#F3F1EA] text-[#202426] flex flex-col font-sans selection:bg-[#C96F3B]/30">
      {/* Real In-App Toasts Container */}
      <ToastContainer />

      {/* 1. Header Navigation Telemetry Strip */}
      <HeaderNav
        location={userLocation}
        connectionState={connectionState}
        pendingSyncCount={syncQueue.length}
        onToggleConnection={handleToggleConnection}
        onOpenSyncCenter={() => setActiveTab('sync')}
        onOpenVisitCockpit={() => setActiveTab('cockpit')}
        isVisitCockpitActive={activeTab === 'cockpit'}
        onRefreshGPS={refreshGpsLocation}
      />

      {/* 2. Main Content Area */}
      <main className="flex-1 w-full relative">
        {/* Selected Store Profile Dossier View takes precedence if opened */}
        {selectedStore ? (
          <StoreProfileDossier
            store={selectedStore}
            visits={visits}
            followups={followups}
            onBack={() => setSelectedStore(null)}
            onRecordVisit={(st: Store) => setVisitingStore(st)}
            onNavigate={(st: Store) => {
              setSelectedStore(null);
              handleNavigateToStore(st);
            }}
            onEditStore={(st: Store) => setEditingStore(st)}
            onAddPhoto={(storeId: string) => setPhotoStoreId(storeId)}
            onRemovePhoto={handleRemovePhoto}
          />
        ) : activeTab === 'cockpit' ? (
          <VisitCockpitMode
            stores={stores}
            userLocation={userLocation}
            onExitCockpit={() => setActiveTab('home')}
            onRecordVisit={(st: Store) => setVisitingStore(st)}
            onNavigate={handleNavigateToStore}
            onSelectStore={(st: Store) => setSelectedStore(st)}
          />
        ) : (
          <>
            {/* Primary Tab Screens */}
            {activeTab === 'home' && (
              <HomeScreen
                stores={stores}
                todayVisitsCount={visits.length}
                todayFollowupsCount={pendingFollowupsCount}
                unvisitedStoresCount={unvisitedStoresCount}
                location={userLocation}
                onOpenAddStore={() => setIsAddStoreOpen(true)}
                onSelectStore={(st: Store) => setSelectedStore(st)}
                onOpenVisitCockpit={() => setActiveTab('cockpit')}
                onOpenFollowups={() => setActiveTab('visits')}
                onOpenMapNearby={() => setActiveTab('map')}
                onRecordVisitForStore={(st: Store) => setVisitingStore(st)}
                onSearchSubmit={() => setActiveTab('stores')}
              />
            )}

            {activeTab === 'map' && (
              <MapScreen
                stores={stores}
                userLocation={userLocation}
                selectedStore={mapTargetStore}
                onSelectStore={(st: Store | null) => setMapTargetStore(st)}
                onOpenDossier={(st: Store) => setSelectedStore(st)}
                onRecordVisit={(st: Store) => setVisitingStore(st)}
                onNavigateToStore={handleNavigateToStore}
              />
            )}

            {activeTab === 'stores' && (
              <StoreListScreen
                stores={stores}
                onSelectStore={(st: Store) => setSelectedStore(st)}
                onRecordVisit={(st: Store) => setVisitingStore(st)}
                onNavigateToStore={handleNavigateToStore}
                onOpenAddStore={() => setIsAddStoreOpen(true)}
              />
            )}

            {activeTab === 'visits' && (
              <FollowUpScreen
                followups={followups}
                stores={stores}
                onUpdateStatus={handleUpdateFollowupStatus}
                onNavigateToStore={handleNavigateToStore}
                onRecordVisitForStore={(st: Store) => setVisitingStore(st)}
                onSelectStore={(st: Store) => setSelectedStore(st)}
              />
            )}

            {activeTab === 'reports' && (
              <ReportsScreen
                stores={stores}
                visits={visits}
                followups={followups}
                onSelectCategoryFilter={() => setActiveTab('stores')}
                onSelectAreaFilter={() => setActiveTab('stores')}
                onOpenStoreList={() => setActiveTab('stores')}
                onOpenFollowups={() => setActiveTab('visits')}
              />
            )}

            {activeTab === 'sync' && (
              <SyncCenterScreen
                connectionState={connectionState}
                onToggleConnection={handleToggleConnection}
                syncQueue={syncQueue}
                onSyncComplete={refreshData}
              />
            )}

            {activeTab === 'more' && (
              <MoreMenuScreen
                onNavigateTo={(target: string) => {
                  if (
                    target === 'home' ||
                    target === 'map' ||
                    target === 'stores' ||
                    target === 'visits' ||
                    target === 'cockpit' ||
                    target === 'reports' ||
                    target === 'sync' ||
                    target === 'more'
                  ) {
                    setActiveTab(target as AppActiveTab);
                  }
                }}
                onRefreshData={refreshData}
              />
            )}
          </>
        )}
      </main>

      {/* 3. Bottom Industrial Navigation Bar (hidden in cockpit mode or when in full dossier) */}
      {!selectedStore && activeTab !== 'cockpit' && (
        <BottomNav
          activeTab={
            ['home', 'map', 'stores', 'visits', 'more'].includes(activeTab)
              ? (activeTab as NavigationTab)
              : 'home'
          }
          onChangeTab={(tab: NavigationTab) => {
            setSelectedStore(null);
            setActiveTab(tab);
          }}
          pendingFollowupCount={pendingFollowupsCount}
          unvisitedCount={unvisitedStoresCount}
        />
      )}

      {/* 4. Overlays & Quick Modals */}
      {isAddStoreOpen && (
        <QuickStoreRegistrationModal
          userLocation={userLocation}
          onClose={() => setIsAddStoreOpen(false)}
          onSave={handleSaveNewStore}
        />
      )}

      {visitingStore && (
        <VisitRecordModal
          store={visitingStore}
          userLocation={userLocation}
          onClose={() => setVisitingStore(null)}
          onSaveVisit={handleSaveVisit}
        />
      )}

      {editingStore && (
        <StoreEditModal
          store={editingStore}
          userLocation={userLocation}
          onClose={() => setEditingStore(null)}
          onSave={handleSaveEditedStore}
          onDelete={handleDeleteStore}
        />
      )}

      {photoStoreId && (
        <PhotoCaptureModal
          title="پیوست تصویر به پرونده فروشگاه"
          onClose={() => setPhotoStoreId(null)}
          onSavePhoto={handleSavePhoto}
        />
      )}
    </div>
  );
}
