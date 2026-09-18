import { UserLocation, GPSStatus } from '../types';

export interface GeolocationState {
  location: UserLocation;
  status: GPSStatus;
  errorMessage?: string;
  isWatching: boolean;
}

// Fallback initial location (Tehran Automotive Market - Mellat Street)
export const DEFAULT_FALLBACK_LOCATION: UserLocation = {
  latitude: 35.6888,
  longitude: 51.4235,
  accuracy: 15,
  areaName: 'تهران، خیابان ملت (چراغ‌برق)',
  heading: null,
  speed: null,
  gpsStatus: 'searching',
};

type GeolocationCallback = (state: GeolocationState) => void;

class GeolocationService {
  private watchId: number | null = null;
  private listeners: Set<GeolocationCallback> = new Set();
  private lastUpdateTimestamp = 0;
  private minIntervalMs = 2000; // Throttle updates to at most once per 2 seconds

  private currentState: GeolocationState = {
    location: { ...DEFAULT_FALLBACK_LOCATION },
    status: 'searching',
    isWatching: false,
  };

  constructor() {
    // Check permission if browser supports Permissions API
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions.query({ name: 'geolocation' as PermissionName }).then((perm) => {
        if (perm.state === 'denied') {
          this.updateState({
            status: 'denied',
            errorMessage: 'دسترسی موقعیت مکانی (GPS) توسط کاربر مسدود شده است.',
          });
        }
        perm.onchange = () => {
          if (perm.state === 'denied') {
            this.updateState({
              status: 'denied',
              errorMessage: 'دسترسی به موقعیت مکانی مسدود شد.',
            });
            this.stopWatching();
          } else if (perm.state === 'granted') {
            this.startWatching();
          }
        };
      }).catch(() => {
        // Permissions API not fully supported, ignore
      });
    }
  }

  public subscribe(callback: GeolocationCallback): () => void {
    this.listeners.add(callback);
    callback(this.currentState);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.currentState));
  }

  private updateState(partial: Partial<GeolocationState>) {
    this.currentState = { ...this.currentState, ...partial };
    this.notify();
  }

  public startWatching() {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      this.updateState({
        status: 'unavailable',
        errorMessage: 'دستگاه یا مرورگر شما از قابلیت مکان‌یابی GPS پشتیبانی نمی‌کند.',
        isWatching: false,
      });
      return;
    }

    if (this.watchId !== null) {
      return; // Already watching
    }

    this.updateState({ status: 'searching', isWatching: true });

    const options: PositionOptions = {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 5000,
    };

    this.watchId = navigator.geolocation.watchPosition(
      (pos) => this.handleSuccess(pos),
      (err) => this.handleError(err),
      options
    );
  }

  public stopWatching() {
    if (this.watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.updateState({ isWatching: false });
  }

  public requestSingleUpdate(): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        reject(new Error('موقعیت‌یاب در دسترس نیست'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          this.handleSuccess(pos);
          resolve(this.currentState.location);
        },
        (err) => {
          this.handleError(err);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    });
  }

  private handleSuccess(pos: GeolocationPosition) {
    const now = Date.now();
    // Throttle excessive continuous updates
    if (now - this.lastUpdateTimestamp < this.minIntervalMs) {
      return;
    }
    this.lastUpdateTimestamp = now;

    const coords = pos.coords;
    const speedKmh = coords.speed !== null && coords.speed !== undefined ? Math.round(coords.speed * 3.6) : null;

    const newLocation: UserLocation = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      accuracy: Math.round(coords.accuracy),
      areaName: this.currentState.location.areaName, // Keep current area or update
      heading: coords.heading,
      speed: speedKmh,
      timestamp: pos.timestamp,
      gpsStatus: 'active',
    };

    this.updateState({
      location: newLocation,
      status: 'active',
      errorMessage: undefined,
    });
  }

  private handleError(err: GeolocationPositionError) {
    let status: GPSStatus = 'unavailable';
    let errorMessage = 'خطا در دریافت موقعیت مکانی GPS';

    switch (err.code) {
      case err.PERMISSION_DENIED:
        status = 'denied';
        errorMessage = 'مجوز دسترسی به GPS داده نشده است. لطفاً از تنظیمات مرورگر اجازه دهید.';
        break;
      case err.POSITION_UNAVAILABLE:
        status = 'unavailable';
        errorMessage = 'سیگنال ماهواره‌ای GPS در دسترس نیست (محیط مسقف یا خاموش بودن موقعیت‌یاب).';
        break;
      case err.TIMEOUT:
        status = 'timeout';
        errorMessage = 'مهلت زمانی دریافت سیگنال GPS به پایان رسید. تلاش مجدد...';
        break;
    }

    this.updateState({
      status,
      errorMessage,
    });
  }

  public getState(): GeolocationState {
    return this.currentState;
  }
}

export const geolocationService = new GeolocationService();
