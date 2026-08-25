import { useEffect, useRef } from 'react';
import circle from '@turf/circle';
import { featureCollection } from '@turf/helpers';
import intersect from '@turf/intersect';
import * as L from 'leaflet';
import type { Feature, MultiPolygon, Polygon } from 'geojson';

interface SearchAreaMapProps {
  clipToCountry?: boolean;
  countryCode?: string;
  latitude: number;
  longitude: number;
  onLocationSelect?: (latitude: number, longitude: number) => void;
  radiusMiles?: number;
  stateName?: string;
}

const METERS_PER_MILE = 1609.344;
const MILES_PER_LATITUDE_DEGREE = 69;
const STATE_BOUNDARIES_URL =
  'https://raw.githubusercontent.com/PublicaMundi/MappingAPI/master/data/geojson/us-states.json';
const COUNTRY_BOUNDARIES_URL =
  'https://raw.githubusercontent.com/johan/world.geo.json/master/countries';

const COUNTRY_ISO3_CODES: Record<string, string> = {
  AD: 'AND',
  AE: 'ARE',
  AF: 'AFG',
  AL: 'ALB',
  AM: 'ARM',
  AR: 'ARG',
  AT: 'AUT',
  AU: 'AUS',
  AZ: 'AZE',
  BA: 'BIH',
  BD: 'BGD',
  BE: 'BEL',
  BG: 'BGR',
  BH: 'BHR',
  BO: 'BOL',
  BR: 'BRA',
  BY: 'BLR',
  CA: 'CAN',
  CD: 'COD',
  CF: 'CAF',
  CG: 'COG',
  CH: 'CHE',
  CI: 'CIV',
  CL: 'CHL',
  CM: 'CMR',
  CN: 'CHN',
  CO: 'COL',
  CR: 'CRI',
  CU: 'CUB',
  CV: 'CPV',
  CY: 'CYP',
  CZ: 'CZE',
  DE: 'DEU',
  DJ: 'DJI',
  DK: 'DNK',
  DO: 'DOM',
  DZ: 'DZA',
  EC: 'ECU',
  EE: 'EST',
  EG: 'EGY',
  ES: 'ESP',
  ET: 'ETH',
  FI: 'FIN',
  FJ: 'FJI',
  FR: 'FRA',
  GB: 'GBR',
  GE: 'GEO',
  GH: 'GHA',
  GR: 'GRC',
  GT: 'GTM',
  HK: 'HKG',
  HN: 'HND',
  HR: 'HRV',
  HU: 'HUN',
  ID: 'IDN',
  IE: 'IRL',
  IL: 'ISR',
  IN: 'IND',
  IQ: 'IRQ',
  IR: 'IRN',
  IS: 'ISL',
  IT: 'ITA',
  JM: 'JAM',
  JO: 'JOR',
  JP: 'JPN',
  KE: 'KEN',
  KG: 'KGZ',
  KH: 'KHM',
  KP: 'PRK',
  KR: 'KOR',
  KW: 'KWT',
  KZ: 'KAZ',
  LA: 'LAO',
  LB: 'LBN',
  LI: 'LIE',
  LK: 'LKA',
  LT: 'LTU',
  LU: 'LUX',
  LV: 'LVA',
  MA: 'MAR',
  MC: 'MCO',
  MD: 'MDA',
  ME: 'MNE',
  MG: 'MDG',
  MK: 'MKD',
  MN: 'MNG',
  MO: 'MAC',
  MT: 'MLT',
  MU: 'MUS',
  MV: 'MDV',
  MW: 'MWI',
  MX: 'MEX',
  MY: 'MYS',
  MZ: 'MOZ',
  NA: 'NAM',
  NG: 'NGA',
  NI: 'NIC',
  NL: 'NLD',
  NO: 'NOR',
  NP: 'NPL',
  NZ: 'NZL',
  OM: 'OMN',
  PA: 'PAN',
  PE: 'PER',
  PH: 'PHL',
  PK: 'PAK',
  PL: 'POL',
  PR: 'PRI',
  PT: 'PRT',
  PY: 'PRY',
  QA: 'QAT',
  RO: 'ROU',
  RS: 'SRB',
  RU: 'RUS',
  SA: 'SAU',
  SE: 'SWE',
  SG: 'SGP',
  SI: 'SVN',
  SK: 'SVK',
  SM: 'SMR',
  SN: 'SEN',
  SV: 'SLV',
  TH: 'THA',
  TJ: 'TJK',
  TM: 'TKM',
  TN: 'TUN',
  TR: 'TUR',
  TW: 'TWN',
  TZ: 'TZA',
  UA: 'UKR',
  UG: 'UGA',
  US: 'USA',
  UY: 'URY',
  UZ: 'UZB',
  VA: 'VAT',
  VE: 'VEN',
  VN: 'VNM',
  ZA: 'ZAF',
  ZM: 'ZMB',
  ZW: 'ZWE',
};

interface StateBoundaryFeature {
  properties?: {
    name?: string;
  };
}

interface StateBoundaryCollection {
  features: StateBoundaryFeature[];
}

type CountryBoundary = Feature<Polygon | MultiPolygon>;
type CountryBoundaryPayload =
  | CountryBoundary
  | {
      type: 'FeatureCollection';
      features: CountryBoundary[];
    };

let stateBoundariesRequest: Promise<StateBoundaryCollection | null> | null =
  null;
const countryBoundaryRequests = new Map<
  string,
  Promise<CountryBoundary | null>
>();

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

const loadCountryBoundary = (countryCode: string) => {
  const iso3Code = COUNTRY_ISO3_CODES[countryCode.toUpperCase()];
  if (!iso3Code) {
    return Promise.resolve(null);
  }

  const existingRequest = countryBoundaryRequests.get(iso3Code);
  if (existingRequest) {
    return existingRequest;
  }

  const request = fetch(`${COUNTRY_BOUNDARIES_URL}/${iso3Code}.geo.json`)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Country boundary request failed: ${response.status}`);
      }

      return response.json() as Promise<CountryBoundaryPayload>;
    })
    .then((payload) =>
      payload.type === 'FeatureCollection'
        ? (payload.features[0] ?? null)
        : payload,
    )
    .catch(() => null);

  countryBoundaryRequests.set(iso3Code, request);
  return request;
};

export function SearchAreaMap({
  clipToCountry = false,
  countryCode,
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
    }).setView(center, 8, { animate: false });

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
    let circle: L.Circle | null = null;
    let radiusOutline: L.Circle | null = null;

    const addUnclippedCircle = () => {
      if (circle || radiusMiles === undefined) {
        return;
      }

      circle = L.circle(center, {
        ...radiusStyle,
        radius: radiusMiles * METERS_PER_MILE,
      }).addTo(map);
    };

    const addRadiusOutline = () => {
      if (radiusOutline || radiusMiles === undefined) {
        return;
      }

      radiusOutline = L.circle(center, {
        ...radiusStyle,
        fillOpacity: 0,
      }).addTo(map);
    };

    if (!clipToCountry || !countryCode || radiusMiles === undefined) {
      addUnclippedCircle();
    } else {
      addRadiusOutline();
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

    if (clipToCountry && countryCode && radiusMiles !== undefined) {
      void loadCountryBoundary(countryCode).then((boundary) => {
        if (!isActive) {
          return;
        }

        if (!boundary) {
          addUnclippedCircle();
          return;
        }

        const radiusFeature = circlePolygon([longitude, latitude], radiusMiles);
        const clippedFeature = intersect(
          featureCollection([radiusFeature, boundary]),
        );

        if (!clippedFeature) {
          addUnclippedCircle();
          return;
        }

        L.geoJSON(clippedFeature, {
          style: {
            ...radiusStyle,
            color: 'transparent',
            weight: 0,
          },
        }).addTo(map);
      });
    }

    return () => {
      isActive = false;
      if (onLocationSelect) {
        map.off('click', handleMapClick);
      }
      map.remove();
    };
  }, [
    clipToCountry,
    countryCode,
    latitude,
    longitude,
    onLocationSelect,
    radiusMiles,
    stateName,
  ]);

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

const circlePolygon = (center: [number, number], radiusMiles: number) =>
  circle(center, radiusMiles, {
    steps: 64,
    units: 'miles',
  });
