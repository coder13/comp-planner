import { QueryClient } from '@tanstack/react-query';
import type { QueryFunction, QueryKey } from '@tanstack/react-query';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { del, get, set } from 'idb-keyval';

export const QUERY_CACHE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;
export const PAST_COMPETITION_STALE_TIME_MS = 30 * 24 * 60 * 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: QUERY_CACHE_MAX_AGE_MS,
      networkMode: 'offlineFirst',
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 24 * 60 * 60 * 1000,
    },
  },
});

const indexedDbStorage = {
  getItem: async (key: string) => (await get<string>(key)) ?? null,
  removeItem: async (key: string) => {
    await del(key);
  },
  setItem: async (key: string, value: string) => {
    await set(key, value);
  },
};

export const queryPersister = createAsyncStoragePersister({
  key: 'comp-planner:react-query:v1',
  storage: indexedDbStorage,
  throttleTime: 1000,
});

export const fetchQueryWithOfflineFallback = async <T>({
  queryFn,
  queryKey,
  staleTime,
}: {
  queryFn: QueryFunction<T>;
  queryKey: QueryKey;
  staleTime?: number;
}) => {
  try {
    return await queryClient.fetchQuery<T>({
      queryFn,
      queryKey,
      staleTime,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error;
    }

    const cachedData = queryClient.getQueryData<T>(queryKey);
    if (cachedData !== undefined) {
      return cachedData;
    }

    throw error;
  }
};

export const queryKeys = {
  citySearch: (query: string) => ['city-search', query] as const,
  competitionHistory: (
    countryCode: string,
    startDate: string,
    endDate: string,
  ) => ['competition-history', countryCode, startDate, endDate] as const,
  competitionSearch: (query: string) => ['competition-search', query] as const,
  reverseGeocode: (latitude: number, longitude: number) =>
    ['reverse-geocode', latitude.toFixed(5), longitude.toFixed(5)] as const,
  countryBoundary: (iso3Code: string) =>
    ['country-boundary', iso3Code] as const,
  stateBoundaries: () => ['state-boundaries'] as const,
  wcaMe: () => ['wca-me'] as const,
};
