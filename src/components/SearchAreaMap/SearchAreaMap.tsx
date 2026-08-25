import { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface SearchAreaMapProps {
  latitude: number;
  longitude: number;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  radiusMiles?: number;
  stateName?: string;
}

const METERS_PER_MILE = 1609.344;
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

let stateBoundariesRequest: Promise<StateBoundaryCollection | null> | null =
  null;

const loadStateBoundaries = () => {
  if (!stateBoundariesRequest) {
    stateBoundariesRequest = fetch(STATE_BOUNDARIES_URL)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`State boundary request failed: ${response.status}`);
        }

        return response.json() as Promise<StateBoundaryCollection>;
      })
      .catch(() => null);
  }

  return stateBoundariesRequest;
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
    if (!mapElementRef.current) {
      return;
    }

    let isActive = true;
    const center: L.LatLngExpression = [latitude, longitude];
    const map = L.map(mapElementRef.current, {
      attributionControl: true,
      zoomControl: true,
    }).setView(center, 8);

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

    const circle =
      radiusMiles === undefined
        ? null
        : L.circle(center, {
            color: '#2563eb',
            fillColor: '#60a5fa',
            fillOpacity: 0.16,
            radius: radiusMiles * METERS_PER_MILE,
            weight: 2,
          }).addTo(map);

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
          padding: [24, 24],
        });
      });
    } else if (circle) {
      map.fitBounds(circle.getBounds(), {
        padding: [24, 24],
      });
    }

    return () => {
      isActive = false;
      if (onLocationSelect) {
        map.off('click', handleMapClick);
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
      className={`h-64 w-full overflow-hidden rounded-md border border-gray-200 bg-blue-50 ${
        onLocationSelect ? 'cursor-crosshair' : ''
      }`}
      role="img"
      aria-label={ariaLabel}
    />
  );
}
