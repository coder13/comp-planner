import { fetchMyCompetitions, geocodeCities } from './api';

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

describe('fetchMyCompetitions', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('loads and de-duplicates authenticated upcoming competitions', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        me: { id: 1, name: 'WCA User', wca_id: '2020USER01' },
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
