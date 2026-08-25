import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import {
  fetchQueryWithOfflineFallback,
  queryKeys,
} from '../../lib/queryClient';

interface SearchAreaMapProps {
  latitude: number;
  longitude: number;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  radiusMiles?: number;
  stateName?: string;
}

const METERS_PER_MILE = 1609.344;
const MILES_PER_LATITUDE_DEGREE = 69;
const RADIUS_OUTLINE_PANE = 'search-radius-outline';
const STATE_BOUNDARIES_URL =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';

interface StateBoundaryFeature {
  properties?: {
    name?: string;
  };
}

interface StateBoundaryCollection {
  features: StateBoundaryFeature[];
}

const loadStateBoundaries = () => {
  return fetchQueryWithOfflineFallback({
    queryKey: queryKeys.stateBoundaries(),
    queryFn: async ({ signal }) => {
      const response = await fetch(STATE_BOUNDARIES_URL, { signal });
      if (!response.ok) {
        throw new Error(`State boundary request failed: ${response.status}`);
      }

      return (await response.json()) as StateBoundaryCollection;
    },
    staleTime: 30 * 24 * 60 * 60 * 1000,
  }).catch(() => null);
};

export function SearchAreaMap({
  latitude,
  longitude,
  onLocationSelect,
  radiusMiles,
  stateName,
}: SearchAreaMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isActive = true;
    if (!mapElementRef.current) {
      return;
    }

    const center: L.LatLngExpression = [latitude, longitude];
    const map = L.map(mapElementRef.current, {
      attributionControl: true,
      zoomControl: true,
    }).setView(center, 8, { animate: false });
    map.createPane(RADIUS_OUTLINE_PANE).style.zIndex = '650';

    const handleMapClick = (event: L.LeafletMouseEvent) => {
      onLocationSelect?.(event.latlng.lat, event.latlng.lng);
    };

    if (onLocationSelect) {
      map.on('click', handleMapClick);
    }

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const radiusStyle = {
      color: '#2563eb',
      fillColor: '#60a5fa',
      fillOpacity: 0.16,
      weight: 2,
    };
    const latitudeDelta =
      radiusMiles === undefined ? 0 : radiusMiles / MILES_PER_LATITUDE_DEGREE;
    const longitudeScale = Math.max(Math.cos((latitude * Math.PI) / 180), 0.01);
    const longitudeDelta =
      radiusMiles === undefined
        ? 0
        : radiusMiles / (MILES_PER_LATITUDE_DEGREE * longitudeScale);
    const radiusBounds: L.LatLngBoundsExpression | null =
      radiusMiles === undefined
        ? null
        : [
            [latitude - latitudeDelta, longitude - longitudeDelta],
            [latitude + latitudeDelta, longitude + longitudeDelta],
          ];

    if (radiusMiles !== undefined) {
      L.circle(center, {
        ...radiusStyle,
        pane: RADIUS_OUTLINE_PANE,
        radius: radiusMiles * METERS_PER_MILE,
      }).addTo(map);
    }

    L.circleMarker(center, {
      color: '#1d4ed8',
      fillColor: '#2563eb',
      fillOpacity: 1,
      radius: 6,
      weight: 2,
    }).addTo(map);

    if (stateName) {
      void loadStateBoundaries().then((boundaries) => {
        if (!isActive || !boundaries) {
          return;
        }

        const normalizedStateName = stateName.toLocaleLowerCase();
        const feature = boundaries.features.find(
          (candidate) =>
            candidate.properties?.name?.toLocaleLowerCase() ===
            normalizedStateName,
        );

        if (!feature) {
          return;
        }

        const boundary = L.geoJSON(
          feature as unknown as Parameters<typeof L.geoJSON>[0],
          {
            style: {
              color: '#1d4ed8',
              fillColor: '#60a5fa',
              fillOpacity: 0.18,
              weight: 2,
            },
          },
        ).addTo(map);

        map.fitBounds(boundary.getBounds(), {
          animate: false,
          padding: [24, 24],
        });
      });
    } else if (radiusBounds) {
      map.fitBounds(radiusBounds, {
        animate: false,
        padding: [24, 24],
      });
    }

    return () => {
      isActive = false;
      if (onLocationSelect) {
        map.off('click');
      }
      map.remove();
    };
  }, [latitude, longitude, onLocationSelect, radiusMiles, stateName]);

  const clickHint = onLocationSelect ? '. Click to choose a search center' : '';
  const ariaLabel = stateName
    ? `Map showing the ${stateName} state boundary${clickHint}`
    : `Map showing a ${radiusMiles}-mile search radius${clickHint}`;

  return (
    <div
      ref={mapElementRef}
      className={`h-96 w-full overflow-hidden rounded-md border border-gray-200 bg-blue-50 ${
        onLocationSelect ? 'cursor-crosshair' : ''
      }`}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
