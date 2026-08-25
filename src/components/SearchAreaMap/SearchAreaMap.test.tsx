import { render, screen, waitFor } from '@testing-library/react';
import { SearchAreaMap } from './SearchAreaMap';

jest.mock('leaflet', () => {
  const circle = {
    addTo: jest.fn().mockReturnThis(),
    getBounds: jest.fn(),
  };
  const map = {
    fitBounds: jest.fn(),
    remove: jest.fn(),
    setView: jest.fn().mockReturnThis(),
  };

  return {
    circle: jest.fn(() => circle),
    circleMarker: jest.fn(() => ({ addTo: jest.fn().mockReturnThis() })),
    geoJSON: jest.fn(() => ({
      addTo: jest.fn().mockReturnThis(),
      getBounds: jest.fn(),
    })),
    map: jest.fn(() => map),
    tileLayer: jest.fn(() => ({ addTo: jest.fn().mockReturnThis() })),
  };
});

describe('SearchAreaMap', () => {
  const originalFetch = globalThis.fetch;

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it('describes the selected radius', () => {
    render(
      <SearchAreaMap latitude={47.6} longitude={-122.3} radiusMiles={50} />,
    );

    expect(
      screen.getByRole('img', { name: 'Map showing a 50-mile search radius' }),
    ).toBeInTheDocument();
  });

  it('describes a state boundary map', () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        features: [
          {
            properties: { name: 'Washington' },
            geometry: { type: 'Polygon', coordinates: [] },
          },
        ],
      }),
      ok: true,
    }) as typeof fetch;

    render(
      <SearchAreaMap
        latitude={47.6}
        longitude={-122.3}
        stateName="Washington"
      />,
    );

    expect(
      screen.getByRole('img', {
        name: 'Map showing the Washington state boundary',
      }),
    ).toBeInTheDocument();
    return waitFor(() => expect(globalThis.fetch).toHaveBeenCalledTimes(1));
  });
});
