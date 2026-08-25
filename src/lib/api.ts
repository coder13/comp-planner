import { CityLocation, WcaCompetition, WcaUser } from './types';
import { WCA_API_ORIGIN } from './runtimeConfig';
const PHOTON_ORIGIN = 'https://photon.komoot.io';
const COMPETITIONS_PER_PAGE = 25;
const COMPETITION_PAGE_BATCH_SIZE = 5;
const MAX_COMPETITION_PAGES = 60;
export const WCA_COMPETITION_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000;
export type CompetitionCacheMode = 'cache-first' | 'network-only';
const COMPETITION_CACHE_STORAGE_PREFIX = 'comp-planner:wca-competitions:v1:';
const COMPETITION_SEARCH_CACHE_STORAGE_PREFIX =
  'comp-planner:wca-competition-search:v1:';

interface CompetitionCacheEntry {
  competitions: WcaCompetition[];
  expiresAt: number;
}

const competitionMemoryCache = new Map<string, WcaCompetition[]>();
const competitionInFlight = new Map<string, Promise<WcaCompetition[]>>();
const competitionSearchMemoryCache = new Map<string, WcaCompetition[]>();
const competitionSearchInFlight = new Map<string, Promise<WcaCompetition[]>>();

interface PhotonResult {
  geometry: {
    coordinates: [number, number];
  };
  properties: {
    city?: string;
    country?: string;
    countrycode?: string;
    housenumber?: string;
    name?: string;
    state?: string;
    street?: string;
    town?: string;
    type?: string;
    village?: string;
  };
}

const requestJson = async <T>(
  url: string,
  signal?: AbortSignal,
  accessToken?: string,
): Promise<T> => {
  const response = await fetch(url, {
    headers: {
      Accept: 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    signal,
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
};

const toCityLocation = (result: PhotonResult): CityLocation => {
  const { properties } = result;
  const cityName = properties.city ?? properties.name ?? 'Unknown city';
  const displayName = [cityName, properties.state, properties.country]
    .filter(Boolean)
    .join(', ');

  return {
    cityName,
    countryCode: properties.countrycode?.toUpperCase() ?? '',
    countryName: properties.country ?? '',
    displayName,
    latitude: result.geometry.coordinates[1],
    longitude: result.geometry.coordinates[0],
    stateName: properties.state,
  };
};

const normalizeCityIdentity = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase()
    .replace(/\s+/g, ' ');

export const parseCoordinates = (value: string) => {
  const match = value
    .trim()
    .match(/^(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)$/);

  if (!match) {
    return null;
  }

  const latitude = Number(match[1]);
  const longitude = Number(match[2]);

  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return null;
  }

  return { latitude, longitude };
};

export const geocodeCities = async (query: string, signal?: AbortSignal) => {
  const params = new URLSearchParams({
    limit: '5',
    q: query,
  });

  const response = await requestJson<{ features: PhotonResult[] }>(
    `${PHOTON_ORIGIN}/api/?${params.toString()}`,
    signal,
  );

  const cityResults = response.features.filter(
    (result) => result.properties.type === 'city' || result.properties.city,
  );
  const results = cityResults.length > 0 ? cityResults : response.features;

  const seenCities = new Set<string>();

  return results
    .map(toCityLocation)
    .filter(
      (city) =>
        Number.isFinite(city.latitude) && Number.isFinite(city.longitude),
    )
    .filter((city) => {
      const identity = normalizeCityIdentity(city.displayName);
      if (seenCities.has(identity)) {
        return false;
      }

      seenCities.add(identity);
      return true;
    });
};

export const reverseGeocodeLocation = async (
  latitude: number,
  longitude: number,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams({
    lat: String(latitude),
    lon: String(longitude),
  });
  const response = await requestJson<{ features: PhotonResult[] }>(
    `${PHOTON_ORIGIN}/reverse?${params.toString()}`,
    signal,
  );
  const result = response.features[0];

  if (!result) {
    return null;
  }

  const { properties } = result;
  const cityName =
    properties.city ??
    properties.town ??
    properties.village ??
    properties.name ??
    'Selected location';
  const address = [properties.housenumber, properties.street]
    .filter(Boolean)
    .join(' ');
  const displayName = [address, cityName, properties.state, properties.country]
    .filter(Boolean)
    .join(', ');

  return {
    cityName,
    countryCode: properties.countrycode?.toUpperCase() ?? '',
    countryName: properties.country ?? '',
    displayName,
    ...(address ? { address } : {}),
    latitude: result.geometry.coordinates[1],
    longitude: result.geometry.coordinates[0],
    stateName: properties.state,
  } satisfies CityLocation;
};

interface WcaCompetitionPayload {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city: string;
  venue?: string | null;
  venue_address?: string | null;
  country_iso2?: string | null;
  event_ids?: string[] | null;
  cancelled_at?: string | null;
  latitude_degrees?: number | null;
  longitude_degrees?: number | null;
  url?: string | null;
  website?: string | null;
}

const normalizeCompetition = ({
  cancelled_at,
  city,
  country_iso2,
  end_date,
  event_ids,
  id,
  latitude_degrees,
  longitude_degrees,
  name,
  start_date,
  url,
  venue,
  venue_address,
  website,
}: WcaCompetitionPayload): WcaCompetition => ({
  id,
  name,
  start_date,
  end_date,
  city,
  venue: venue ?? '',
  venue_address: venue_address ?? undefined,
  country_iso2: country_iso2 ?? '',
  event_ids: event_ids ?? [],
  cancelled_at: cancelled_at ?? null,
  latitude_degrees: latitude_degrees ?? null,
  longitude_degrees: longitude_degrees ?? null,
  url: url || `https://www.worldcubeassociation.org/competitions/${id}`,
  website: website || url || '',
});

const getCompetitionCacheKey = (
  countryCode: string,
  startDate: string,
  endDate: string,
) => `${countryCode.toUpperCase() || 'ALL'}:${startDate}:${endDate}`;

const getStoredCompetitions = (cacheKey: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawEntry = window.localStorage.getItem(
      `${COMPETITION_CACHE_STORAGE_PREFIX}${cacheKey}`,
    );
    if (!rawEntry) {
      return null;
    }

    const entry = JSON.parse(rawEntry) as CompetitionCacheEntry;
    if (entry.expiresAt <= Date.now()) {
      window.localStorage.removeItem(
        `${COMPETITION_CACHE_STORAGE_PREFIX}${cacheKey}`,
      );
      return null;
    }

    return entry.competitions;
  } catch {
    return null;
  }
};

const storeCompetitions = (
  cacheKey: string,
  competitions: WcaCompetition[],
) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const entry: CompetitionCacheEntry = {
      competitions,
      expiresAt: Date.now() + WCA_COMPETITION_CACHE_TTL_MS,
    };
    window.localStorage.setItem(
      `${COMPETITION_CACHE_STORAGE_PREFIX}${cacheKey}`,
      JSON.stringify(entry),
    );
  } catch {
    // Caching is an optimization. A full or blocked storage area must not
    // prevent the live WCA request from succeeding.
  }
};

const withAbort = <T>(promise: Promise<T>, signal?: AbortSignal) => {
  if (!signal) {
    return promise;
  }

  if (signal.aborted) {
    return Promise.reject(
      new DOMException('The request was aborted.', 'AbortError'),
    );
  }

  return new Promise<T>((resolve, reject) => {
    const onAbort = () => {
      reject(new DOMException('The request was aborted.', 'AbortError'));
    };

    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error: unknown) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
};

const fetchCompetitionsFromApi = async ({
  endDate,
  signal,
  startDate,
  countryCode,
}: {
  endDate: string;
  signal?: AbortSignal;
  startDate: string;
  countryCode: string;
}) => {
  const competitions: WcaCompetition[] = [];

  const fetchPage = async (page: number) => {
    const params = new URLSearchParams({
      end: endDate,
      page: String(page),
      per_page: String(COMPETITIONS_PER_PAGE),
      start: startDate,
    });

    if (countryCode) {
      params.set('country_iso2', countryCode);
    }

    return requestJson<WcaCompetition[]>(
      `${WCA_API_ORIGIN}/competitions?${params.toString()}`,
      signal,
    );
  };

  for (
    let firstPage = 1;
    firstPage <= MAX_COMPETITION_PAGES;
    firstPage += COMPETITION_PAGE_BATCH_SIZE
  ) {
    const pageResults = await Promise.all(
      Array.from({ length: COMPETITION_PAGE_BATCH_SIZE }, (_, index) =>
        fetchPage(firstPage + index),
      ),
    );

    pageResults.forEach((results) => {
      competitions.push(...results.map(normalizeCompetition));
    });

    if (pageResults.some((results) => results.length < COMPETITIONS_PER_PAGE)) {
      break;
    }
  }

  return competitions;
};

export const fetchCompetitions = async ({
  cacheMode = 'cache-first',
  endDate,
  signal,
  startDate,
  countryCode,
}: {
  cacheMode?: CompetitionCacheMode;
  endDate: string;
  signal?: AbortSignal;
  startDate: string;
  countryCode: string;
}) => {
  const cacheKey = getCompetitionCacheKey(countryCode, startDate, endDate);
  if (cacheMode === 'cache-first') {
    const memoryCached = competitionMemoryCache.get(cacheKey);
    if (memoryCached) {
      return withAbort(Promise.resolve(memoryCached), signal);
    }

    const storedCompetitions = getStoredCompetitions(cacheKey);
    if (storedCompetitions) {
      competitionMemoryCache.set(cacheKey, storedCompetitions);
      return withAbort(Promise.resolve(storedCompetitions), signal);
    }
  }

  const existingRequest = competitionInFlight.get(cacheKey);
  if (existingRequest) {
    return withAbort(existingRequest, signal);
  }

  const request = fetchCompetitionsFromApi({
    countryCode,
    endDate,
    signal,
    startDate,
  })
    .then((competitions) => {
      competitionMemoryCache.set(cacheKey, competitions);
      storeCompetitions(cacheKey, competitions);
      return competitions;
    })
    .finally(() => {
      competitionInFlight.delete(cacheKey);
    });

  competitionInFlight.set(cacheKey, request);
  return withAbort(request, signal);
};

const getCompetitionSearchCacheKey = (query: string) =>
  query.trim().toLocaleLowerCase();

const getStoredCompetitionSearch = (cacheKey: string) => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const rawEntry = window.localStorage.getItem(
      `${COMPETITION_SEARCH_CACHE_STORAGE_PREFIX}${encodeURIComponent(cacheKey)}`,
    );
    if (!rawEntry) {
      return null;
    }

    const entry = JSON.parse(rawEntry) as CompetitionCacheEntry;
    if (entry.expiresAt <= Date.now()) {
      window.localStorage.removeItem(
        `${COMPETITION_SEARCH_CACHE_STORAGE_PREFIX}${encodeURIComponent(cacheKey)}`,
      );
      return null;
    }

    return entry.competitions;
  } catch {
    return null;
  }
};

const storeCompetitionSearch = (
  cacheKey: string,
  competitions: WcaCompetition[],
) => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const entry: CompetitionCacheEntry = {
      competitions,
      expiresAt: Date.now() + WCA_COMPETITION_CACHE_TTL_MS,
    };
    window.localStorage.setItem(
      `${COMPETITION_SEARCH_CACHE_STORAGE_PREFIX}${encodeURIComponent(cacheKey)}`,
      JSON.stringify(entry),
    );
  } catch {
    // Caching is an optimization. A full or blocked storage area must not
    // prevent the live WCA request from succeeding.
  }
};

export const searchCompetitions = async (
  query: string,
  signal?: AbortSignal,
  cacheMode: CompetitionCacheMode = 'cache-first',
) => {
  const cacheKey = getCompetitionSearchCacheKey(query);
  if (!cacheKey) {
    return [];
  }

  if (cacheMode === 'cache-first') {
    const memoryCached = competitionSearchMemoryCache.get(cacheKey);
    if (memoryCached) {
      return withAbort(Promise.resolve(memoryCached), signal);
    }

    const storedCompetitions = getStoredCompetitionSearch(cacheKey);
    if (storedCompetitions) {
      competitionSearchMemoryCache.set(cacheKey, storedCompetitions);
      return withAbort(Promise.resolve(storedCompetitions), signal);
    }
  }

  const existingRequest = competitionSearchInFlight.get(cacheKey);
  if (existingRequest) {
    return withAbort(existingRequest, signal);
  }

  const params = new URLSearchParams({ q: query.trim() });
  const request = requestJson<WcaCompetitionPayload[]>(
    `${WCA_API_ORIGIN}/competitions?${params.toString()}`,
    signal,
  )
    .then((competitions) => competitions.map(normalizeCompetition))
    .then((competitions) => {
      competitionSearchMemoryCache.set(cacheKey, competitions);
      storeCompetitionSearch(cacheKey, competitions);
      return competitions;
    })
    .finally(() => {
      competitionSearchInFlight.delete(cacheKey);
    });

  competitionSearchInFlight.set(cacheKey, request);
  return withAbort(request, signal);
};

interface WcaMeResponse {
  user?: WcaUser;
  // Keep accepting the legacy response shape for compatibility.
  me?: WcaUser;
  upcoming_competitions?: WcaCompetitionPayload[];
  ongoing_competitions?: WcaCompetitionPayload[];
}

export const fetchMyCompetitions = async (
  accessToken: string,
  signal?: AbortSignal,
) => {
  const params = new URLSearchParams({
    ongoing_competitions: 'true',
    upcoming_competitions: 'true',
  });
  const response = await requestJson<WcaMeResponse>(
    `${WCA_API_ORIGIN}/me?${params.toString()}`,
    signal,
    accessToken,
  );
  const seenIds = new Set<string>();
  const competitions = [
    ...(response.ongoing_competitions ?? []),
    ...(response.upcoming_competitions ?? []),
  ]
    .map(normalizeCompetition)
    .filter((competition) => {
      if (seenIds.has(competition.id)) {
        return false;
      }

      seenIds.add(competition.id);
      return true;
    })
    .sort((first, second) => first.start_date.localeCompare(second.start_date));

  const user = response.user ?? response.me;
  if (!user) {
    throw new Error('The WCA account response did not include a user.');
  }

  return { competitions, user };
};
