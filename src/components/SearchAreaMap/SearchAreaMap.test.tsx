import { render, screen, waitFor } from '@testing-library/react';
import * as Leaflet from 'leaflet';
import { SearchAreaMap } from './SearchAreaMap';

jest.mock('leaflet', () => {
  const circle = {
    addTo: jest.fn().mockReturnThis(),
    bringToFront: jest.fn().mockReturnThis(),
    getBounds: jest.fn(),
  };
  const map = {
    fitBounds: jest.fn(),
    off: jest.fn(),
    on: jest.fn(),
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
    jest.clearAllMocks();
  });

  it('describes the selected radius', () => {
    render(
      <SearchAreaMap latitude={47.6} longitude={-122.3} radiusMiles={50} />,
    );

    expect(
      screen.getByRole('img', { name: 'Map showing a 50-mile search radius' }),
    ).toBeInTheDocument();

    const map = (Leaflet.map as jest.Mock).mock.results.slice(-1)[0]?.value as {
      fitBounds: jest.Mock;
    };
    expect(map.fitBounds).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ animate: false }),
    );
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

  it('reports a clicked search center', () => {
    const onLocationSelect = jest.fn();

    render(
      <SearchAreaMap
        latitude={47.6}
        longitude={-122.3}
        onLocationSelect={onLocationSelect}
        radiusMiles={50}
      />,
    );

    const map = (Leaflet.map as jest.Mock).mock.results.slice(-1)[0]?.value as {
      on: jest.Mock;
    };
    const clickHandler = map.on.mock.calls.find(
      ([eventName]) => eventName === 'click',
    )?.[1] as (event: { latlng: { lat: number; lng: number } }) => void;
    clickHandler({ latlng: { lat: 48.1, lng: -123.1 } });

    expect(onLocationSelect).toHaveBeenCalledWith(48.1, -123.1);
  });

  it('clips the radius to the selected country boundary', async () => {
    globalThis.fetch = jest.fn().mockResolvedValue({
      json: async () => ({
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-123, 47],
                  [-121, 47],
                  [-121, 48],
                  [-123, 48],
                  [-123, 47],
                ],
              ],
            },
            properties: {},
          },
        ],
      }),
      ok: true,
    }) as typeof fetch;

    render(
      <SearchAreaMap
        clipToCountry={true}
        countryCode="US"
        latitude={47.6}
        longitude={-122.3}
        radiusMiles={50}
      />,
    );

    await waitFor(() => {
      expect(Leaflet.geoJSON).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'Feature' }),
        expect.objectContaining({ style: expect.any(Object) }),
      );
    });
    expect(
      (Leaflet.circle as jest.Mock).mock.results[0]?.value.bringToFront,
    ).toHaveBeenCalled();
  });
});
