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
  const [userLocation, setUserLocation] = useState<UserLocation>(FieldStorageService.getUserLocation());
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

  // Initial Data Load & Watch GPS
  useEffect(() => {
    refreshData();

    // Check GPS updates every 15 seconds
    const interval = setInterval(() => {
      const loc = FieldStorageService.getUserLocation();
      setUserLocation(loc);
      setStores(FieldStorageService.getStores(loc));
    }, 15000);

    return () => clearInterval(interval);
  }, [refreshData]);

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
  const handleSaveNewStore = (storeData: Omit<Store, 'id' | 'created_at' | 'updated_at'>) => {
    const created = FieldStorageService.addStore(storeData);
    setIsAddStoreOpen(false);
    refreshData();
    setSelectedStore(created);
    toast.success(`فروشگاه «${created.name}» با موفقیت ثبت شد.`);
  };

  // Edit and update store
  const handleSaveEditedStore = (updatedStore: Store) => {
    FieldStorageService.saveStore(updatedStore);
    setEditingStore(null);
    refreshData();
    setSelectedStore(updatedStore);
    toast.success('مشخصات فروشگاه با موفقیت به‌روزرسانی شد.');
  };

  // Delete store
  const handleDeleteStore = (storeId: string) => {
    FieldStorageService.deleteStore(storeId);
    setEditingStore(null);
    setSelectedStore(null);
    refreshData();
    toast.info('فروشگاه و کلیه سوابق ویزیت آن از پایگاه محلی حذف شد.');
  };

  // Attach real photo to store
  const handleSavePhoto = (photo: { url: string; caption?: string; type: StorePhoto['type'] }) => {
    if (!photoStoreId) return;
    FieldStorageService.addPhotoToStoreAsync(photoStoreId, photo.url, photo.caption, photo.type);
    toast.success('تصویر با موفقیت در پرونده فروشگاه الصاق شد.');
    setPhotoStoreId(null);
    refreshData();
    const updated = FieldStorageService.getStores().find((s) => s.id === photoStoreId);
    if (updated) setSelectedStore(updated);
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
  const handleSaveVisit = (visitData: any) => {
    FieldStorageService.addVisit(visitData);
    setVisitingStore(null);
    refreshData();
    toast.success('گزارش ویزیت با موفقیت در پایگاه محلی ثبت شد.');
  };

  // Update follow-up status
  const handleUpdateFollowupStatus = (id: string, status: FollowUp['status']) => {
    FieldStorageService.updateFollowUpStatus(id, status);
    refreshData();
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
