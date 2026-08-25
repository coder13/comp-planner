import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import { CityPicker } from './components/CityPicker';
import { CompetitionEventGroup } from './components/CompetitionEventGroup';
import { EventSummaryRow } from './components/EventSummaryRow';
import { CompetitionPlan } from './components/CompetitionPlan';
import { CompetitionSearch } from './components/CompetitionSearch';
import { SearchScopeControl } from './components/SearchScopeControl';
import { UpcomingCompetitionList } from './components/UpcomingCompetitionList';
import { UpcomingCompetitionToggle } from './components/UpcomingCompetitionToggle';
import { WcaAuthButton } from './components/WcaAuthButton';
import { WcaCompetitionPicker } from './components/WcaCompetitionPicker';
import {
  fetchCompetitions,
  fetchMyCompetitions,
  geocodeCities,
  reverseGeocodeLocation,
  searchCompetitions,
} from './lib/api';
import {
  formatCompetitionDate,
  getDateString,
  getEventSummaries,
  getSearchCountryCodes,
  getSearchDateRange,
  getRegionForState,
  getSearchScopeLabel,
  SearchScope,
  SearchScopeMode,
} from './lib/planner';
import {
  CityLocation,
  EventSummaryResults,
  WcaCompetition,
  WcaUser,
} from './lib/types';
import {
  clearWcaAccessToken,
  consumeWcaCallback,
  getWcaAccessToken,
  isWcaAuthConfigured,
  startWcaLogin,
} from './lib/wcaAuth';

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
  const [competitionQuery, setCompetitionQuery] = useState('');
  const [competitionOptions, setCompetitionOptions] = useState<
    WcaCompetition[]
  >([]);
  const [asOfDate, setAsOfDate] = useState(DEFAULT_DATE);
  const [includeUpcoming, setIncludeUpcoming] = useState(false);
  const [sameCountryOnly, setSameCountryOnly] = useState(true);
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
  const [isFindingCompetition, setIsFindingCompetition] = useState(false);
  const [isFindingLocation, setIsFindingLocation] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [wcaUser, setWcaUser] = useState<WcaUser | null>(null);
  const [wcaCompetitions, setWcaCompetitions] = useState<WcaCompetition[]>([]);
  const [selectedWcaCompetition, setSelectedWcaCompetition] =
    useState<WcaCompetition | null>(null);
  const [isWcaLoading, setIsWcaLoading] = useState(false);
  const [wcaAuthError, setWcaAuthError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const cityLookupControllerRef = useRef<AbortController | null>(null);
  const competitionLookupControllerRef = useRef<AbortController | null>(null);
  const locationLookupControllerRef = useRef<AbortController | null>(null);
  const wcaControllerRef = useRef<AbortController | null>(null);

  const loadResults = useCallback(
    async (
      city: CityLocation,
      date: string,
      scope: SearchScope,
      shouldIncludeUpcoming: boolean,
      shouldSearchSameCountryOnly: boolean,
    ) => {
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
      const { endDate, startDate } = getSearchDateRange(
        date,
        shouldIncludeUpcoming,
      );

      setSelectedCity(city);
      setCityOptions([]);
      setSummaryResults(null);
      setError(null);
      setIsFindingCity(false);
      setIsLoading(true);

      try {
        const countryCodes = getSearchCountryCodes(
          city.countryCode,
          shouldSearchSameCountryOnly,
        );
        if (countryCodes.length === 0) {
          setSummaryResults(null);
          setError('The selected city does not include a country code.');
          return;
        }

        const countryCompetitions = await Promise.all(
          countryCodes.map((countryCode) =>
            fetchCompetitions({
              countryCode,
              endDate,
              signal: controller.signal,
              startDate,
            }),
          ),
        );
        const competitions = Array.from(
          new Map(
            countryCompetitions
              .flat()
              .map((competition) => [competition.id, competition]),
          ).values(),
        );
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
    const cityController = new AbortController();
    cityLookupControllerRef.current = cityController;
    const loadDefaultCity = async () => {
      setIsFindingCity(true);

      try {
        const [city] = await geocodeCities(
          DEFAULT_CITY_QUERY,
          cityController.signal,
        );
        if (isActive && city) {
          await loadResults(
            city,
            DEFAULT_DATE,
            {
              mode: 'radius',
              radiusMiles: DEFAULT_RADIUS_MILES,
            },
            false,
            true,
          );
        }
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === 'AbortError'
        ) {
          return;
        }

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
      cityController.abort();
      competitionLookupControllerRef.current?.abort();
      locationLookupControllerRef.current?.abort();
      controllerRef.current?.abort();
    };
  }, [loadResults]);

  useEffect(() => {
    let isActive = true;
    const controller = new AbortController();
    wcaControllerRef.current = controller;

    const loadWcaAccount = async () => {
      let accessToken: string | null = null;

      try {
        accessToken = consumeWcaCallback() ?? getWcaAccessToken();
      } catch (caughtError) {
        if (isActive) {
          setWcaAuthError(
            caughtError instanceof Error
              ? caughtError.message
              : 'The WCA login could not be verified.',
          );
        }
        clearWcaAccessToken();
        return;
      }

      if (!accessToken) {
        return;
      }

      setIsWcaLoading(true);
      setWcaAuthError(null);

      try {
        const response = await fetchMyCompetitions(
          accessToken,
          controller.signal,
        );
        if (isActive) {
          setWcaUser(response.user);
          setWcaCompetitions(response.competitions);
        }
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === 'AbortError'
        ) {
          return;
        }

        if (isActive) {
          clearWcaAccessToken();
          setWcaUser(null);
          setWcaCompetitions([]);
          setWcaAuthError(
            'The WCA account could not load. Please sign in again.',
          );
        }
      } finally {
        if (isActive) {
          setIsWcaLoading(false);
        }
      }
    };

    void loadWcaAccount();
    return () => {
      isActive = false;
      controller.abort();
    };
  }, []);

  const handleCityQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    setCityOptions([]);
    setCompetitionQuery('');
    setCompetitionOptions([]);
    setError(null);

    if (
      selectedCity &&
      nextQuery.trim() !== selectedCity.cityName &&
      nextQuery.trim() !== selectedCity.displayName
    ) {
      locationLookupControllerRef.current?.abort();
      controllerRef.current?.abort();
      setSelectedCity(null);
      setSelectedWcaCompetition(null);
      setSummaryResults(null);
      setIsFindingLocation(false);
      setIsLoading(false);
    }
  };

  const handleCompetitionQueryChange = (nextQuery: string) => {
    setCompetitionQuery(nextQuery);
    setCompetitionOptions([]);
    setError(null);

    if (
      selectedWcaCompetition &&
      nextQuery.trim() !== selectedWcaCompetition.name
    ) {
      competitionLookupControllerRef.current?.abort();
      setSelectedWcaCompetition(null);
      setSummaryResults(null);
    }
  };

  const lookupCities = async (nextQuery: string) => {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      setError('Enter a city to search.');
      return;
    }

    cityLookupControllerRef.current?.abort();
    const cityController = new AbortController();
    cityLookupControllerRef.current = cityController;
    controllerRef.current?.abort();
    setIsLoading(false);
    setIsFindingCity(true);
    setCityOptions([]);
    setError(null);

    try {
      const cities = await geocodeCities(trimmedQuery, cityController.signal);
      if (cities.length === 0) {
        setError('No city matched that search. Try a city and country name.');
        return;
      }

      if (cities.length === 1) {
        handleCitySelect(cities[0]);
        return;
      }

      setCityOptions(cities);
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === 'AbortError'
      ) {
        return;
      }

      setError('The city search could not load. Try again.');
    } finally {
      if (!cityController.signal.aborted) {
        setIsFindingCity(false);
      }
    }
  };

  const handleCityLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void lookupCities(query);
  };

  const lookupCompetitions = async (
    nextQuery: string,
    showEmptyError = false,
  ) => {
    const trimmedQuery = nextQuery.trim();

    if (!trimmedQuery) {
      setCompetitionOptions([]);
      return;
    }

    competitionLookupControllerRef.current?.abort();
    const competitionController = new AbortController();
    competitionLookupControllerRef.current = competitionController;
    setIsFindingCompetition(true);

    try {
      const competitions = await searchCompetitions(
        trimmedQuery,
        competitionController.signal,
      );

      if (!competitionController.signal.aborted) {
        setCompetitionOptions(competitions);
        if (showEmptyError && competitions.length === 0) {
          setError('No competition matched that search. Try a different name.');
        }
      }
    } catch (caughtError) {
      if (
        caughtError instanceof DOMException &&
        caughtError.name === 'AbortError'
      ) {
        return;
      }

      setError('The competition search could not load. Try again.');
    } finally {
      if (!competitionController.signal.aborted) {
        setIsFindingCompetition(false);
      }
    }
  };

  const handleCompetitionLookup = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void lookupCompetitions(competitionQuery, true);
  };

  const handleCitySelect = (city: CityLocation) => {
    cityLookupControllerRef.current?.abort();
    competitionLookupControllerRef.current?.abort();
    locationLookupControllerRef.current?.abort();
    controllerRef.current?.abort();
    setQuery(city.cityName);
    setCompetitionQuery('');
    setCompetitionOptions([]);
    setSelectedWcaCompetition(null);
    setSelectedCity(city);
    setCityOptions([]);
    setSummaryResults(null);
    setError(null);
    setIsFindingCity(false);
    setIsFindingLocation(false);
    setIsLoading(false);
  };

  const handleMapLocationSelect = useCallback(
    async (latitude: number, longitude: number) => {
      locationLookupControllerRef.current?.abort();
      controllerRef.current?.abort();
      const locationController = new AbortController();
      locationLookupControllerRef.current = locationController;
      const coordinateLabel = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;

      setScopeMode('radius');
      setQuery(coordinateLabel);
      setCompetitionQuery('');
      setCompetitionOptions([]);
      setSelectedWcaCompetition(null);
      setCityOptions([]);
      setSummaryResults(null);
      setError(null);
      setIsFindingLocation(true);
      setIsLoading(false);
      setSelectedCity({
        cityName: 'Selected location',
        countryCode: '',
        countryName: '',
        displayName: coordinateLabel,
        latitude,
        longitude,
      });

      try {
        const location = await reverseGeocodeLocation(
          latitude,
          longitude,
          locationController.signal,
        );

        if (!locationController.signal.aborted && location) {
          setQuery(location.displayName);
          setSelectedCity({ ...location, latitude, longitude });
        }
      } catch (caughtError) {
        if (
          caughtError instanceof DOMException &&
          caughtError.name === 'AbortError'
        ) {
          return;
        }

        setError(
          'The map location could not be identified. Choose another point.',
        );
      } finally {
        if (!locationController.signal.aborted) {
          setIsFindingLocation(false);
        }
      }
    },
    [],
  );

  const handleWcaLogin = () => {
    try {
      startWcaLogin();
    } catch (caughtError) {
      setWcaAuthError(
        caughtError instanceof Error
          ? caughtError.message
          : 'The WCA login could not start.',
      );
    }
  };

  const handleWcaLogout = () => {
    wcaControllerRef.current?.abort();
    clearWcaAccessToken();
    setWcaUser(null);
    setWcaCompetitions([]);
    setCompetitionQuery('');
    setCompetitionOptions([]);
    setSelectedWcaCompetition(null);
    setWcaAuthError(null);
  };

  const handleCompetitionSelect = (competition: WcaCompetition) => {
    competitionLookupControllerRef.current?.abort();
    setCompetitionQuery(competition.name);
    setCompetitionOptions([]);
    setSelectedWcaCompetition(competition);

    if (
      competition.latitude_degrees === null ||
      competition.longitude_degrees === null
    ) {
      setError(
        'This competition does not have location data for a history search.',
      );
      return;
    }

    const radius = Number(radiusMiles);
    const cityName = competition.city.split(',')[0]?.trim() || competition.city;
    const city: CityLocation = {
      cityName,
      countryCode: competition.country_iso2,
      countryName: '',
      displayName: competition.city,
      latitude: competition.latitude_degrees,
      longitude: competition.longitude_degrees,
      stateName: competition.city.split(',')[1]?.trim(),
    };

    setQuery(cityName);
    setAsOfDate(competition.start_date);
    setScopeMode('radius');
    setError(null);
    void loadResults(
      city,
      competition.start_date,
      {
        mode: 'radius',
        radiusMiles:
          Number.isFinite(radius) && radius > 0 ? radius : DEFAULT_RADIUS_MILES,
      },
      includeUpcoming,
      sameCountryOnly,
    );
  };

  const handleWcaCompetitionSelect = (competitionId: string) => {
    const competition = wcaCompetitions.find(
      (candidate) => candidate.id === competitionId,
    );

    if (competition) {
      handleCompetitionSelect(competition);
    }
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
      includeUpcoming,
      sameCountryOnly,
    );
  };

  const isBusy = isFindingCity || isFindingLocation || isLoading;
  const selectedRegion = getRegionForState(selectedCity?.stateName);
  const maxHeldInLast12Months = summaryResults
    ? Math.max(
        ...summaryResults.events.map((event) => event.heldInLast12Months),
        0,
      )
    : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <a className="focus-ring inline-flex items-center" href="/">
            <span className="text-base font-semibold text-gray-900">
              Comp Planner
            </span>
          </a>
          <WcaAuthButton
            isConfigured={isWcaAuthConfigured}
            isLoading={isWcaLoading}
            user={wcaUser}
            onLogin={handleWcaLogin}
            onLogout={handleWcaLogout}
          />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
        <section
          className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          aria-labelledby="location-heading">
          <h2
            id="location-heading"
            className="text-base font-semibold text-gray-900">
            Choose a city or competition
          </h2>

          <div className="mt-3 grid gap-4 sm:grid-cols-[minmax(0,1.2fr)_minmax(240px,0.8fr)] sm:items-start">
            <CityPicker
              cities={cityOptions}
              isBusy={isFindingCity}
              onLookup={(nextQuery) => void lookupCities(nextQuery)}
              onQueryChange={handleCityQueryChange}
              onSelectCity={handleCitySelect}
              onSubmit={handleCityLookup}
              query={query}
            />

            {wcaUser ? (
              <WcaCompetitionPicker
                competitions={wcaCompetitions}
                isLoading={isWcaLoading}
                selectedCompetitionId={selectedWcaCompetition?.id ?? null}
                onSelect={handleWcaCompetitionSelect}
              />
            ) : (
              <CompetitionSearch
                competitions={competitionOptions}
                isBusy={isFindingCompetition}
                onLookup={(nextQuery) => void lookupCompetitions(nextQuery)}
                onQueryChange={handleCompetitionQueryChange}
                onSelectCompetition={handleCompetitionSelect}
                onSubmit={handleCompetitionLookup}
                query={competitionQuery}
              />
            )}
          </div>

          {wcaUser && wcaAuthError && (
            <p className="mt-2 text-sm text-red-700">{wcaAuthError}</p>
          )}
        </section>

        <section className="mt-3 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-[minmax(140px,0.32fr)_minmax(0,1fr)] sm:items-start">
            <div className="space-y-3">
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
              <UpcomingCompetitionToggle
                checked={includeUpcoming}
                onChange={setIncludeUpcoming}
              />
            </div>

            <SearchScopeControl
              clipToCountry={sameCountryOnly}
              countryCode={selectedCity?.countryCode}
              latitude={selectedCity?.latitude}
              mode={scopeMode}
              longitude={selectedCity?.longitude}
              onLocationSelect={handleMapLocationSelect}
              radiusMiles={radiusMiles}
              region={selectedRegion}
              sameCountryOnly={sameCountryOnly}
              stateName={selectedCity?.stateName}
              onModeChange={setScopeMode}
              onRadiusChange={setRadiusMiles}
              onSameCountryOnlyChange={setSameCountryOnly}
            />
          </div>

          <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
            <button
              className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isBusy || !selectedCity}
              onClick={handleSearch}>
              {isLoading ? 'Loading…' : 'Search'}
            </button>
          </div>
        </section>

        {!wcaUser && wcaAuthError && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {wcaAuthError}
          </div>
        )}

        {error && (
          <div className="mt-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {(isLoading || isFindingLocation) && (
          <div className="mt-3 flex items-center gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600 shadow-sm">
            <span className="size-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-600" />
            {isFindingLocation
              ? 'Looking up the selected map location…'
              : 'Loading competitions from the WCA data set…'}
          </div>
        )}

        {selectedCity && summaryResults && !isLoading && (
          <section aria-label="Search results">
            <div className="mt-5 flex flex-col gap-2 border-b border-gray-200 pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="mt-1 text-sm text-gray-500">
                  As of {formatCompetitionDate(searchedDate)} ·{' '}
                  {getSearchScopeLabel(searchedScope)}
                </p>
              </div>
              <div className="text-sm text-gray-500">
                {selectedCity.countryCode || 'All countries'} data
              </div>
            </div>

            {selectedWcaCompetition && (
              <CompetitionPlan
                asOfDate={searchedDate}
                competition={selectedWcaCompetition}
                eventSummaries={summaryResults.events}
              />
            )}

            {summaryResults.upcomingCompetitions.length > 0 && (
              <UpcomingCompetitionList
                competitions={summaryResults.upcomingCompetitions}
              />
            )}

            <section
              className="mt-4 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm"
              aria-label="Event results">
              <div className="flex justify-end border-b border-gray-200 px-4 py-3">
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
                    ? 'sm:grid-cols-[minmax(0,0.85fr)_minmax(180px,1.2fr)_minmax(110px,0.5fr)_minmax(130px,0.5fr)]'
                    : 'sm:grid-cols-[minmax(0,0.85fr)_minmax(130px,0.5fr)]'
                }`}
                role="row">
                <span role="columnheader">Event</span>
                {viewMode === 'event' && (
                  <span role="columnheader">Last held</span>
                )}
                {viewMode === 'event' && <span role="columnheader">Age</span>}
                <span role="columnheader" className="text-right">
                  Times held in last year
                </span>
              </div>

              {summaryResults.events.length > 0 ? (
                viewMode === 'event' ? (
                  summaryResults.events.map((event) => (
                    <EventSummaryRow
                      asOfDate={searchedDate}
                      event={event}
                      key={event.id}
                      maxHeldInLast12Months={maxHeldInLast12Months}
                    />
                  ))
                ) : (
                  summaryResults.eventGroups.map((group) => (
                    <CompetitionEventGroup
                      asOfDate={searchedDate}
                      group={group}
                      key={group.competitionId}
                      maxHeldInLast12Months={maxHeldInLast12Months}
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
