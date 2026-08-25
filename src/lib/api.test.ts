import { geocodeCities } from './api';

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
