import { UserLocation, GPSStatus } from '../types';

export interface GeolocationState {
  location: UserLocation;
  status: GPSStatus;
  errorMessage?: string;
  errorCode?: number;
  isWatching: boolean;
}

export const INITIAL_EMPTY_LOCATION: UserLocation = {
  latitude: 0,
  longitude: 0,
  accuracy: 0,
  areaName: 'در انتظار دریافت موقعیت واقعی GPS...',
  heading: null,
  speed: null,
  gpsStatus: 'searching',
  isRealGPS: false,
};

type GeolocationCallback = (state: GeolocationState) => void;

class GeolocationService {
  private watchId: number | null = null;
  private listeners: Set<GeolocationCallback> = new Set();
  private lastUpdateTimestamp = 0;
  private minIntervalMs = 1500; // Throttle excessive updates to at most once per 1.5 seconds

  private currentState: GeolocationState = {
    location: { ...INITIAL_EMPTY_LOCATION },
    status: 'searching',
    isWatching: false,
  };

  constructor() {
    // Check permission if browser supports Permissions API
    if (typeof navigator !== 'undefined' && 'permissions' in navigator) {
      navigator.permissions
        .query({ name: 'geolocation' as PermissionName })
        .then((perm) => {
          if (perm.state === 'denied') {
            this.updateState({
              status: 'denied',
              errorMessage: 'دسترسی به موقعیت مکانی (GPS) در مرورگر مسدود شده است [کد خطا: PERMISSION_DENIED].',
              errorCode: 1,
            });
          }
          perm.onchange = () => {
            if (perm.state === 'denied') {
              this.updateState({
                status: 'denied',
                errorMessage: 'دسترسی به موقعیت مکانی مسدود شد.',
                errorCode: 1,
              });
              this.stopWatching();
            } else if (perm.state === 'granted') {
              this.startWatching();
            }
          };
        })
        .catch(() => {
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
        errorMessage: 'دستگاه یا مرورگر شما از حسگر مکان‌یابی GPS پشتیبانی نمی‌کند.',
        errorCode: 2,
        isWatching: false,
      });
      return;
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      this.updateState({
        status: 'denied',
        errorMessage: 'مرورگر دسترسی به GPS را در محیط غیر امن (بدون پروتکل HTTPS) مسدود کرده است. لطفاً از آدرس HTTPS استفاده فرمایید.',
        errorCode: 1,
        isWatching: false,
      });
      return;
    }

    if (this.watchId !== null) {
      return; // Already watching
    }

    this.updateState({ status: 'searching', isWatching: true, errorMessage: undefined, errorCode: undefined });

    // Step 1: Immediate single position attempt with graceful fallback (high -> low accuracy)
    const requestImmediate = (highAcc: boolean) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => this.handleSuccess(pos),
        (err) => {
          if (highAcc && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
            // High accuracy failed or timed out on this device/environment; immediately fallback to network/low accuracy
            requestImmediate(false);
            return;
          }
          this.handleError(err);
        },
        {
          enableHighAccuracy: highAcc,
          timeout: highAcc ? 8000 : 15000,
          maximumAge: highAcc ? 5000 : 30000,
        }
      );
    };

    requestImmediate(true);

    // Step 2: Continuous watchPosition with graceful fallback if high accuracy times out
    const startWatchInternal = (highAcc: boolean) => {
      if (this.watchId !== null) {
        navigator.geolocation.clearWatch(this.watchId);
        this.watchId = null;
      }

      this.watchId = navigator.geolocation.watchPosition(
        (pos) => this.handleSuccess(pos),
        (err) => {
          if (highAcc && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
            // Fall back continuous watcher to standard accuracy
            startWatchInternal(false);
            return;
          }
          this.handleError(err);
        },
        {
          enableHighAccuracy: highAcc,
          timeout: highAcc ? 15000 : 25000,
          maximumAge: highAcc ? 5000 : 20000,
        }
      );
    };

    startWatchInternal(true);
  }

  public stopWatching() {
    if (this.watchId !== null && typeof navigator !== 'undefined') {
      navigator.geolocation.clearWatch(this.watchId);
      this.watchId = null;
    }
    this.updateState({ isWatching: false });
  }

  public requestSingleUpdate(enableHighAccuracy = true): Promise<UserLocation> {
    return new Promise((resolve, reject) => {
      if (typeof navigator === 'undefined' || !navigator.geolocation) {
        const msg = 'موقعیت‌یاب GPS در دستگاه یا مرورگر شما در دسترس نیست.';
        this.updateState({ status: 'unavailable', errorMessage: msg, errorCode: 2 });
        reject(new Error(msg));
        return;
      }

      if (typeof window !== 'undefined' && window.isSecureContext === false) {
        const msg = 'مرورگر دسترسی به GPS را به دلیل ناامن بودن پروتکل مسدود کرده است (HTTPS الزامی است).';
        this.updateState({ status: 'denied', errorMessage: msg, errorCode: 1 });
        reject(new Error(msg));
        return;
      }

      this.updateState({ status: 'searching' });

      const attempt = (highAcc: boolean) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            this.handleSuccess(pos);
            resolve(this.currentState.location);
          },
          (err) => {
            if (highAcc && (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE)) {
              attempt(false);
              return;
            }
            this.handleError(err);
            reject(new Error(this.currentState.errorMessage || err.message));
          },
          {
            enableHighAccuracy: highAcc,
            timeout: highAcc ? 8000 : 15000,
            maximumAge: highAcc ? 0 : 20000,
          }
        );
      };

      attempt(enableHighAccuracy);
    });
  }

  private handleSuccess(pos: GeolocationPosition) {
    const now = Date.now();
    // Throttle excessive continuous updates unless first update
    if (this.lastUpdateTimestamp !== 0 && now - this.lastUpdateTimestamp < this.minIntervalMs) {
      return;
    }
    this.lastUpdateTimestamp = now;

    const coords = pos.coords;
    const speedKmh = coords.speed !== null && coords.speed !== undefined ? Math.round(coords.speed * 3.6) : null;
    const lat = coords.latitude;
    const lng = coords.longitude;

    // Approximate regional Persian area if near Tehran automotive market, or format coordinates
    let areaName = 'موقعیت زنده میدانی';
    if (lat >= 35.68 && lat <= 35.70 && lng >= 51.41 && lng <= 51.43) {
      areaName = 'تهران، راسته خیابان ملت (چراغ‌برق)';
    } else {
      areaName = `مختصات: ${lat.toFixed(4)}°N, ${lng.toFixed(4)}°E`;
    }

    const newLocation: UserLocation = {
      latitude: lat,
      longitude: lng,
      accuracy: Math.round(coords.accuracy),
      areaName,
      heading: coords.heading,
      speed: speedKmh,
      timestamp: pos.timestamp,
      gpsStatus: 'active',
      isRealGPS: true,
      errorCode: undefined,
      errorMessage: undefined,
    };

    this.updateState({
      location: newLocation,
      status: 'active',
      errorMessage: undefined,
      errorCode: undefined,
    });
  }

  private handleError(err: GeolocationPositionError) {
    let status: GPSStatus = 'unavailable';
    let errorMessage = '';

    switch (err.code) {
      case err.PERMISSION_DENIED: // Code 1
        status = 'denied';
        errorMessage = `دسترسی به GPS مسدود شد [کد خطا ۱: ${err.message || 'Permission Denied'}]. لطفاً در تنظیمات نوار آدرس مرورگر دسترسی Location را مجاز (Allow) کنید.`;
        break;
      case err.POSITION_UNAVAILABLE: // Code 2
        status = 'unavailable';
        errorMessage = `سیگنال موقعیت مکانی در دسترس نیست [کد خطا ۲: ${err.message || 'Position Unavailable'}]. لطفاً از روشن بودن GPS دستگاه اطمینان حاصل فرمایید.`;
        break;
      case err.TIMEOUT: // Code 3
        status = 'timeout';
        errorMessage = `مهلت دریافت سیگنال ماهواره GPS به پایان رسید [کد خطا ۳: ${err.message || 'Timeout'}].`;
        break;
      default:
        status = 'unavailable';
        errorMessage = `خطای موقعیت مکانی [کد ${err.code}: ${err.message || 'Unknown'}]`;
        break;
    }

    if (typeof window !== 'undefined' && window.isSecureContext === false) {
      errorMessage = `مرورگر دسترسی به GPS را به دلیل ناامن بودن پروتکل مسدود کرده است (HTTPS مورد نیاز است).`;
    }

    const newLocation: UserLocation = {
      ...this.currentState.location,
      gpsStatus: status,
      isRealGPS: false,
      errorCode: err.code,
      errorMessage,
    };

    this.updateState({
      location: newLocation,
      status,
      errorMessage,
      errorCode: err.code,
    });
  }

  public getState(): GeolocationState {
    return this.currentState;
  }
}

export const geolocationService = new GeolocationService();
