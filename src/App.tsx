import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { CityPicker } from './components/CityPicker';
import { CompetitionEventGroup } from './components/CompetitionEventGroup';
import { EventSummaryRow } from './components/EventSummaryRow';
import { ExternalLinkIcon } from './components/Icons';
import { SearchScopeControl } from './components/SearchScopeControl';
import { fetchCompetitions, geocodeCities } from './lib/api';
import {
  formatCompetitionDate,
  getDateString,
  getEventSummaries,
  getSearchDateRange,
  getRegionForState,
  getSearchScopeLabel,
  LOOKBACK_MONTHS,
  SearchScope,
  SearchScopeMode,
} from './lib/planner';
import { CityLocation, EventSummaryResults } from './lib/types';

const DEFAULT_CITY_QUERY = 'Seattle, Washington';
const DEFAULT_RADIUS_MILES = 50;
const DEFAULT_DATE = getDateString();
type ViewMode = 'event' | 'competition';

const getScopeForCity = (
  mode: SearchScopeMode,
  city: CityLocation,
  radiusMiles: number,
): SearchScope => {
  if (mode === 'state' && city.stateName) {
    return { mode, stateName: city.stateName };
  }

  if (mode === 'region') {
    const region = getRegionForState(city.stateName);
    if (region) {
      return { mode, region };
    }
  }

  return { mode: 'radius', radiusMiles };
};

function App() {
  const [query, setQuery] = useState(DEFAULT_CITY_QUERY);
  const [asOfDate, setAsOfDate] = useState(DEFAULT_DATE);
  const [radiusMiles, setRadiusMiles] = useState(String(DEFAULT_RADIUS_MILES));
  const [scopeMode, setScopeMode] = useState<SearchScopeMode>('radius');
  const [selectedCity, setSelectedCity] = useState<CityLocation | null>(null);
  const [cityOptions, setCityOptions] = useState<CityLocation[]>([]);
  const [summaryResults, setSummaryResults] =
    useState<EventSummaryResults | null>(null);
  const [searchedDate, setSearchedDate] = useState(DEFAULT_DATE);
  const [searchedScope, setSearchedScope] = useState<SearchScope>({
    mode: 'radius',
    radiusMiles: DEFAULT_RADIUS_MILES,
  });
  const [viewMode, setViewMode] = useState<ViewMode>('event');
  const [isFindingCity, setIsFindingCity] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const loadResults = useCallback(
    async (city: CityLocation, date: string, scope: SearchScope) => {
      if (
        !date ||
        (scope.mode === 'radius' &&
          (!Number.isFinite(scope.radiusMiles) || scope.radiusMiles <= 0))
      ) {
        setError('Enter a date and a radius greater than zero.');
        return;
      }

      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      const { endDate, startDate } = getSearchDateRange(date);

      setSelectedCity(city);
      setCityOptions([]);
      setSummaryResults(null);
      setError(null);
      setIsFindingCity(false);
      setIsLoading(true);

      try {
        const competitions = await fetchCompetitions({
          countryCode: city.countryCode,
          endDate,
          signal: controller.signal,
          startDate,
        });
        const results = getEventSummaries(competitions, city, date, scope);

        if (!controller.signal.aborted) {
          setSummaryResults(results);
          setSearchedDate(date);
          setSearchedScope(scope);
        }
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === 'AbortError'
        ) {
          return;
        }

        setSummaryResults(null);
        setError('The competition data could not load. Try the search again.');
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    },
    [],
  );

  useEffect(() => {
    let isActive = true;
    const loadDefaultCity = async () => {
      setIsFindingCity(true);

      try {
        const [city] = await geocodeCities(DEFAULT_CITY_QUERY);
        if (isActive && city) {
          await loadResults(city, DEFAULT_DATE, {
            mode: 'radius',
            radiusMiles: DEFAULT_RADIUS_MILES,
          });
        }
      } catch {
        if (isActive) {
          setIsFindingCity(false);
          setError(
            'The default city could not load. Search for a city to begin.',
          );
        }
      }
    };

    void loadDefaultCity();
    return () => {
      isActive = false;
      controllerRef.current?.abort();
    };
  }, [loadResults]);

  const handleCityQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setCityOptions([]);
    setError(null);

    if (
      selectedCity &&
      nextQuery.trim() !== selectedCity.cityName &&
      nextQuery.trim() !== selectedCity.displayName
    ) {
      controllerRef.current?.abort();
      setSelectedCity(null);
      setSummaryResults(null);
      setIsLoading(false);
    }
  };

  const handleCityLookup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedQuery = query.trim();

    if (!trimmedQuery) {
      setError('Enter a city to search.');
      return;
    }

    controllerRef.current?.abort();
    setIsLoading(false);
    setIsFindingCity(true);
    setCityOptions([]);
    setError(null);

    try {
      const cities = await geocodeCities(trimmedQuery);
      if (cities.length === 0) {
        setError('No city matched that search. Try a city and country name.');
        return;
      }

      if (cities.length === 1) {
        handleCitySelect(cities[0]);
        return;
      }

      setCityOptions(cities);
    } catch {
      setError('The city search could not load. Try again.');
    } finally {
      setIsFindingCity(false);
    }
  };

  const handleCitySelect = (city: CityLocation) => {
    controllerRef.current?.abort();
    setQuery(city.cityName);
    setSelectedCity(city);
    setCityOptions([]);
    setSummaryResults(null);
    setError(null);
    setIsFindingCity(false);
    setIsLoading(false);
  };

  const handleSearch = () => {
    if (!selectedCity) {
      setError('Choose a city before searching.');
      return;
    }

    const radius = Number(radiusMiles);
    if (
      !asOfDate ||
      (scopeMode === 'radius' && (!Number.isFinite(radius) || radius <= 0))
    ) {
      setError('Enter a date and a radius greater than zero.');
      return;
    }

    void loadResults(
      selectedCity,
      asOfDate,
      getScopeForCity(scopeMode, selectedCity, radius),
    );
  };

  const isBusy = isFindingCity || isLoading;
  const selectedRegion = getRegionForState(selectedCity?.stateName);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a className="focus-ring inline-flex items-center gap-2" href="/">
            <span className="flex size-7 items-center justify-center rounded-md bg-blue-600 text-xs font-bold text-white">
              CP
            </span>
            <span className="text-base font-semibold text-gray-900">
              Comp Planner
            </span>
          </a>
          <a
            className="focus-ring hidden items-center gap-1.5 text-sm text-blue-600 hover:underline sm:inline-flex"
            href="https://www.worldcubeassociation.org/competitions"
            target="_blank"
            rel="noreferrer">
            WCA competitions
            <ExternalLinkIcon className="size-3.5" />
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
        <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <CityPicker
            cities={cityOptions}
            isBusy={isFindingCity}
            onQueryChange={handleCityQueryChange}
            onSelectCity={handleCitySelect}
            onSubmit={handleCityLookup}
            query={query}
          />

          <div className="mt-3 grid gap-4 border-t border-gray-100 pt-3 sm:grid-cols-[minmax(140px,0.4fr)_minmax(0,1.6fr)] sm:items-start">
            <label
              className="block text-sm font-medium text-gray-700"
              htmlFor="as-of-date">
              As of date
              <input
                id="as-of-date"
                className="focus-ring mt-1 h-10 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900"
                type="date"
                value={asOfDate}
                onChange={(event) => setAsOfDate(event.target.value)}
              />
            </label>
            <SearchScopeControl
              latitude={selectedCity?.latitude}
              mode={scopeMode}
              longitude={selectedCity?.longitude}
              radiusMiles={radiusMiles}
              region={selectedRegion}
              stateName={selectedCity?.stateName}
              onModeChange={setScopeMode}
              onRadiusChange={setRadiusMiles}
            />
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-sm font-medium text-gray-700">3. Search</span>
            <button
              className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isBusy || !selectedCity}
              onClick={handleSearch}>
              {isLoading ? 'Loading…' : 'Search'}
            </button>
          </div>
        </section>

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="mt-3 flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
            <span className="size-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            Loading competitions from the WCA data set…
          </div>
        )}

        {selectedCity && summaryResults && !isLoading && (
          <section aria-labelledby="results-heading">
            <div className="mt-5 flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2
                  id="results-heading"
                  className="text-xl font-semibold text-gray-900">
                  Events around {selectedCity.cityName}
                </h2>
                <p className="mt-1 text-sm text-gray-500">
                  As of {formatCompetitionDate(searchedDate)} ·{' '}
                  {getSearchScopeLabel(searchedScope)} · least recent first
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {selectedCity.countryCode || 'All countries'} data
              </div>
            </div>

            <section
              className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              aria-label="Event results">
              <div className="flex flex-col gap-3 border-b border-gray-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  <h3 className="text-base font-semibold text-gray-900">
                    {viewMode === 'event'
                      ? 'Nearby events'
                      : 'Events grouped by competition'}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {LOOKBACK_MONTHS}-month history
                  </p>
                </div>
                <div
                  className="inline-flex w-fit rounded-md border border-gray-300 bg-gray-50 p-0.5"
                  role="group"
                  aria-label="Group results">
                  <button
                    className={`focus-ring rounded px-2.5 py-1 text-xs ${
                      viewMode === 'event'
                        ? 'bg-blue-600 font-medium text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    type="button"
                    aria-pressed={viewMode === 'event'}
                    onClick={() => setViewMode('event')}>
                    By event
                  </button>
                  <button
                    className={`focus-ring rounded px-2.5 py-1 text-xs ${
                      viewMode === 'competition'
                        ? 'bg-blue-600 font-medium text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    type="button"
                    aria-pressed={viewMode === 'competition'}
                    onClick={() => setViewMode('competition')}>
                    By competition
                  </button>
                </div>
              </div>

              <div
                className={`grid gap-4 border-b border-gray-200 bg-gray-50 px-5 py-2 text-xs font-medium text-gray-500 sm:px-6 ${
                  viewMode === 'event'
                    ? 'sm:grid-cols-[minmax(0,1.1fr)_minmax(180px,1.4fr)_minmax(130px,0.5fr)]'
                    : 'sm:grid-cols-[minmax(0,1fr)_minmax(130px,0.5fr)]'
                }`}
                role="row">
                <span role="columnheader">Event</span>
                {viewMode === 'event' && (
                  <span role="columnheader">Last held</span>
                )}
                <span role="columnheader" className="text-right">
                  Held in the last 12 months
                </span>
              </div>

              {summaryResults.events.length > 0 ? (
                viewMode === 'event' ? (
                  summaryResults.events.map((event) => (
                    <EventSummaryRow
                      asOfDate={searchedDate}
                      event={event}
                      key={event.id}
                    />
                  ))
                ) : (
                  summaryResults.eventGroups.map((group) => (
                    <CompetitionEventGroup
                      asOfDate={searchedDate}
                      group={group}
                      key={group.competitionId}
                    />
                  ))
                )
              ) : (
                <div className="px-4 py-8 text-center">
                  <p className="text-base font-semibold text-gray-900">
                    No events found in this area.
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchedScope.mode === 'radius'
                      ? 'Increase the radius or choose another city.'
                      : 'Choose another city or date.'}
                  </p>
                </div>
              )}
            </section>
          </section>
        )}

        {!selectedCity && !isFindingCity && !error && (
          <div className="py-8 text-center text-sm text-gray-500">
            Search for a city to see its event history.
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
