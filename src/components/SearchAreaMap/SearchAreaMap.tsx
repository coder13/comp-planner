import { useEffect, useRef } from 'react';
import * as L from 'leaflet';

interface SearchAreaMapProps {
  latitude: number;
  longitude: number;
  radiusMiles: number;
}

const METERS_PER_MILE = 1609.344;

export function SearchAreaMap({
  latitude,
  longitude,
  radiusMiles,
}: SearchAreaMapProps) {
  const mapElementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapElementRef.current) {
      return;
    }

    const center: L.LatLngExpression = [latitude, longitude];
    const map = L.map(mapElementRef.current, {
      attributionControl: true,
      zoomControl: true,
    }).setView(center, 8);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(map);

    const circle = L.circle(center, {
      color: '#2563eb',
      fillColor: '#60a5fa',
      fillOpacity: 0.16,
      radius: radiusMiles * METERS_PER_MILE,
      weight: 2,
    });
    circle.addTo(map);

    L.circleMarker(center, {
      color: '#1d4ed8',
      fillColor: '#2563eb',
      fillOpacity: 1,
      radius: 6,
      weight: 2,
    }).addTo(map);

    map.fitBounds(circle.getBounds(), {
      padding: [24, 24],
    });

    return () => {
      map.remove();
    };
  }, [latitude, longitude, radiusMiles]);

  return (
    <div
      ref={mapElementRef}
      className="h-64 w-full overflow-hidden rounded-md border border-gray-200 bg-blue-50"
      role="img"
      aria-label={`Map showing a ${radiusMiles}-mile search radius`}
    />
  );
}
