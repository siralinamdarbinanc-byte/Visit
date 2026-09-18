export type CustomerStatus = 'customer' | 'potential' | 'new' | 'unspecified';

export type VisitResult = 
  | 'purchased'          // خرید کرد
  | 'interested'         // علاقه‌مند
  | 'needs_followup'     // نیاز به پیگیری
  | 'no_cooperation'     // عدم همکاری
  | 'closed'             // بسته بود
  | 'manager_absent'     // مدیر حضور نداشت
  | 'other';             // سایر

export type StoreCategory = 
  | 'قطعات یدکی'
  | 'لوازم برقی'
  | 'قطعات موتوری'
  | 'جلوبندی و تعلیق'
  | 'قطعات بدنه'
  | 'فروشگاه لوازم خودرو'
  | 'تعمیرگاه تخصصی'
  | 'تعویض روغنی و روانکار';

export interface StorePhoto {
  id: string;
  type: 'storefront' | 'sign' | 'business_card' | 'shelf' | 'other';
  url: string;
  caption?: string;
  created_at: string;
}

export interface Store {
  id: string;
  name: string;
  owner: string;
  mobile: string;
  phone: string;
  address: string;
  area: string;
  latitude: number;
  longitude: number;
  category: StoreCategory;
  subcategory?: string;
  brands: string[];
  products: string[];
  customer_status: CustomerStatus;
  notes: string;
  photos: StorePhoto[];
  created_at: string;
  updated_at: string;
  distance?: number; // calculated in meters from current user position
  last_visit_date?: string;
  last_visit_result?: VisitResult;
  visit_count?: number;
}

export interface Visit {
  id: string;
  store_id: string;
  store_name: string;
  date: string; // ISO date string or Persian formatted
  time: string; // e.g. "11:45"
  result: VisitResult;
  note: string;
  next_followup?: string;
  latitude: number;
  longitude: number;
  photo_url?: string;
  created_at: string;
}

export interface FollowUp {
  id: string;
  store_id: string;
  store_name: string;
  phone: string;
  area: string;
  date: string; // YYYY-MM-DD
  note: string;
  status: 'pending' | 'completed' | 'overdue' | 'postponed';
  last_visit_date?: string;
  created_at: string;
}

export interface ProductItem {
  id: string;
  name: string;
  category: string;
  brand: string;
  code?: string;
}

export interface SyncQueueItem {
  id: string;
  operation: 'CREATE' | 'UPDATE' | 'DELETE';
  entity: 'STORE' | 'VISIT' | 'FOLLOW_UP';
  entity_id: string;
  payload: any;
  created_at: string;
  updated_at?: string;
  retry_count: number;
  last_error?: string;
  device_id: string;
  synced: boolean;
}

export interface SyncHistoryItem {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'success' | 'warning' | 'error';
  item_count?: number;
}

export interface SyncStats {
  pendingCount: number;
  failedCount: number;
  uploaded: number;
  downloaded: number;
  lastSync: string;
  lastError?: string;
}

export type GPSStatus = 'searching' | 'active' | 'denied' | 'unavailable' | 'timeout';

export interface ToastMessage {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
  duration?: number;
}

export type ConnectionState = 'online' | 'offline' | 'syncing' | 'synced';

export interface UserLocation {
  latitude: number;
  longitude: number;
  accuracy: number;
  areaName: string;
  heading?: number | null;
  speed?: number | null;
  timestamp?: number;
  gpsStatus?: GPSStatus;
}

export type NavigationTab = 'home' | 'map' | 'stores' | 'visits' | 'more';

export interface NavigationPayload {
  filter?: string;
  status?: string;
  sort?: string;
  tab?: string;
  category?: string;
  area?: string;
  search?: string;
  storeId?: string;
}
