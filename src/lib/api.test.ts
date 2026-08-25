import {
  fetchCompetitions,
  fetchMyCompetitions,
  geocodeCities,
  parseCoordinates,
  reverseGeocodeLocation,
  searchCompetitions,
} from './api';

const photonFeature = (city: string, longitude: number, latitude: number) => ({
  geometry: { coordinates: [longitude, latitude] as [number, number] },
  properties: {
    city,
    country: 'United States',
    countrycode: 'us',
    state: 'Washington',
    type: 'city',
  },
});

describe('geocodeCities', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('removes duplicate place features while keeping nearby cities', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        features: [
          photonFeature('Seattle', -122.3321, 47.6062),
          photonFeature('Seattle', -122.3352, 47.608),
          photonFeature('SeaTac', -122.3054, 47.4485),
        ],
      }),
      ok: true,
      status: 200,
    }) as typeof fetch;

    const cities = await geocodeCities('Seattle');

    expect(cities.map((city) => city.cityName)).toEqual(['Seattle', 'SeaTac']);
  });
});

describe('parseCoordinates', () => {
  it('accepts valid latitude and longitude pairs', () => {
    expect(parseCoordinates(' 47.47935, -122.58725 ')).toEqual({
      latitude: 47.47935,
      longitude: -122.58725,
    });
  });

  it('rejects malformed and out-of-range pairs', () => {
    expect(parseCoordinates('Seattle, Washington')).toBeNull();
    expect(parseCoordinates('91, -122')).toBeNull();
    expect(parseCoordinates('47, -181')).toBeNull();
  });
});

describe('fetchMyCompetitions', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads and de-duplicates authenticated upcoming competitions', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        user: { id: 1, name: 'WCA User', wca_id: '2020USER01' },
        ongoing_competitions: [
          {
            id: 'SeattleSummerOpen2026',
            name: 'Seattle Summer Open 2026',
            start_date: '2026-08-01',
            end_date: '2026-08-01',
            city: 'Seattle, Washington',
            country_iso2: 'US',
            event_ids: ['333'],
          },
        ],
        upcoming_competitions: [
          {
            id: 'SeattleSummerOpen2026',
            name: 'Seattle Summer Open 2026',
            start_date: '2026-08-01',
            end_date: '2026-08-01',
            city: 'Seattle, Washington',
            country_iso2: 'US',
            event_ids: ['333'],
          },
          {
            id: 'TacomaWinterOpen2027',
            name: 'Tacoma Winter Open 2027',
            start_date: '2027-01-01',
            end_date: '2027-01-01',
            city: 'Tacoma, Washington',
            country_iso2: 'US',
            event_ids: ['222'],
          },
        ],
      }),
      ok: true,
    }) as typeof fetch;

    const response = await fetchMyCompetitions('test-token');

    expect(response.user.name).toBe('WCA User');
    expect(response.competitions.map((competition) => competition.id)).toEqual([
      'SeattleSummerOpen2026',
      'TacomaWinterOpen2027',
    ]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/me?'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: 'Bearer test-token',
        }),
      }),
    );
  });
});

describe('fetchCompetitions', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('sets the page size used by its pagination loop', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => [],
      ok: true,
      status: 200,
    }) as typeof fetch;

    await fetchCompetitions({
      countryCode: 'US',
      endDate: '2026-08-24',
      startDate: '2025-08-24',
    });

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('per_page=25'),
      expect.anything(),
    );
  });
});

describe('reverseGeocodeLocation', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('turns a map point into a searchable location', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        features: [
          {
            geometry: { coordinates: [-122.3321, 47.6062] },
            properties: {
              city: 'Seattle',
              country: 'United States',
              countrycode: 'us',
              housenumber: '1',
              state: 'Washington',
              street: 'Test Street',
            },
          },
        ],
      }),
      ok: true,
      status: 200,
    }) as typeof fetch;

    const location = await reverseGeocodeLocation(47.6062, -122.3321);

    expect(location).toEqual({
      address: '1 Test Street',
      cityName: 'Seattle',
      countryCode: 'US',
      countryName: 'United States',
      displayName: '1 Test Street, Seattle, Washington, United States',
      latitude: 47.6062,
      longitude: -122.3321,
      stateName: 'Washington',
    });
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/reverse?lat=47.6062&lon=-122.3321'),
      expect.anything(),
    );
  });
});

describe('searchCompetitions', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads and caches public competition search results', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => [
        {
          id: 'SeattleSummerOpen2026',
          name: 'Seattle Summer Open 2026',
          start_date: '2026-08-01',
          end_date: '2026-08-01',
          city: 'Seattle, Washington',
          country_iso2: 'US',
          event_ids: ['333'],
        },
      ],
      ok: true,
    }) as typeof fetch;

    const firstResponse = await searchCompetitions('Seattle public cache test');
    const secondResponse = await searchCompetitions(
      '  Seattle public cache test  ',
    );

    expect(firstResponse[0].name).toBe('Seattle Summer Open 2026');
    expect(secondResponse).toEqual(firstResponse);
    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/competitions?q=Seattle+public+cache+test'),
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/json',
        }),
      }),
    );
  });
});
