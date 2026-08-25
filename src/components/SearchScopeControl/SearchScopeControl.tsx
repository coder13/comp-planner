import { useEffect, useState } from 'react';
import { CompassIcon } from '../Icons';
import { SearchRegion, SearchScopeMode } from '../../lib/planner';
import { SearchAreaMap } from '../SearchAreaMap';

interface SearchScopeControlProps {
  clipToCountry: boolean;
  countryCode?: string;
  mode: SearchScopeMode;
  latitude?: number;
  longitude?: number;
  radiusMiles: string;
  region: SearchRegion | null;
  sameCountryOnly: boolean;
  stateName?: string;
  onModeChange: (mode: SearchScopeMode) => void;
  onLocationSelect: (latitude: number, longitude: number) => void;
  onRadiusChange: (radiusMiles: string) => void;
  onSameCountryOnlyChange: (sameCountryOnly: boolean) => void;
}

const MIN_RADIUS_MILES = 1;
const MAX_RADIUS_MILES = 1000;
const RADIUS_MAP_DEBOUNCE_MS = 120;

const getMapRadius = (radiusMiles: string) => {
  const numericRadius = Number(radiusMiles);
  return Number.isFinite(numericRadius) && numericRadius > 0
    ? numericRadius
    : 50;
};

export function SearchScopeControl({
  clipToCountry,
  countryCode,
  mode,
  latitude,
  longitude,
  radiusMiles,
  region,
  sameCountryOnly,
  stateName,
  onModeChange,
  onLocationSelect,
  onRadiusChange,
  onSameCountryOnlyChange,
}: SearchScopeControlProps) {
  const [mapRadius, setMapRadius] = useState(() => getMapRadius(radiusMiles));

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setMapRadius(getMapRadius(radiusMiles));
    }, RADIUS_MAP_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [radiusMiles]);

  return (
    <section aria-label="Search area">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
          <span className="flex size-7 items-center justify-center rounded-md bg-blue-50 text-blue-600">
            <CompassIcon className="size-4" />
          </span>
          Search area
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="inline-flex items-center gap-2 text-sm text-gray-700">
            <input
              className="size-4 accent-blue-600"
              type="checkbox"
              checked={sameCountryOnly}
              onChange={(event) =>
                onSameCountryOnlyChange(event.target.checked)
              }
              aria-label="Same country"
            />
            Same country
          </label>
          <div
            className="inline-flex rounded-md border border-gray-300 bg-gray-50 p-0.5"
            role="group"
            aria-label="Search area type">
            <button
              className={`focus-ring rounded px-2.5 py-1 text-xs transition ${
                mode === 'radius'
                  ? 'bg-blue-600 font-medium text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
              aria-pressed={mode === 'radius'}
              onClick={() => onModeChange('radius')}>
              Radius
            </button>
            <button
              className={`focus-ring rounded px-2.5 py-1 text-xs transition disabled:cursor-not-allowed disabled:opacity-40 ${
                mode === 'state'
                  ? 'bg-blue-600 font-medium text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              type="button"
              aria-pressed={mode === 'state'}
              disabled={!stateName}
              onClick={() => onModeChange('state')}>
              Entire state
            </button>
            {region && (
              <button
                className={`focus-ring rounded px-2.5 py-1 text-xs transition ${
                  mode === 'region'
                    ? 'bg-blue-600 font-medium text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                type="button"
                aria-pressed={mode === 'region'}
                onClick={() => onModeChange('region')}>
                {region.name}
              </button>
            )}
          </div>
        </div>
      </div>

      {mode === 'radius' ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-end gap-2">
            <label
              className="block w-full max-w-56 text-sm font-medium text-gray-700"
              htmlFor="radius-miles">
              Radius
              <input
                id="radius-miles"
                className="focus-ring mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                type="number"
                min={MIN_RADIUS_MILES}
                max={MAX_RADIUS_MILES}
                step="1"
                value={radiusMiles}
                onChange={(event) => onRadiusChange(event.target.value)}
              />
            </label>
            <span className="mb-2 text-sm text-gray-500">miles</span>
          </div>
          {latitude !== undefined && longitude !== undefined && (
            <SearchAreaMap
              clipToCountry={clipToCountry}
              countryCode={countryCode}
              latitude={latitude}
              longitude={longitude}
              onLocationSelect={onLocationSelect}
              radiusMiles={mapRadius}
            />
          )}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">
            {mode === 'state' ? (
              <>
                Search all competitions in <strong>{stateName}</strong>.
              </>
            ) : (
              <>
                Search all competitions across the{' '}
                <strong>{region?.name}</strong> ({region?.states.join(', ')}).
              </>
            )}
          </div>
          {mode === 'state' &&
            latitude !== undefined &&
            longitude !== undefined && (
              <SearchAreaMap
                latitude={latitude}
                longitude={longitude}
                onLocationSelect={onLocationSelect}
                stateName={stateName}
              />
            )}
        </div>
      )}
    </section>
  );
}
