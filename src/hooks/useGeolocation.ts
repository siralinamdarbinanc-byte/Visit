import { useState, useEffect } from 'react';
import { geolocationService, GeolocationState } from '../services/geolocation';

export function useGeolocation() {
  const [geoState, setGeoState] = useState<GeolocationState>(geolocationService.getState());

  useEffect(() => {
    // Start watching when hook mounts
    geolocationService.startWatching();

    const unsubscribe = geolocationService.subscribe((state) => {
      setGeoState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const refreshLocation = () => {
    return geolocationService.requestSingleUpdate();
  };

  return {
    ...geoState,
    refreshLocation,
  };
}
