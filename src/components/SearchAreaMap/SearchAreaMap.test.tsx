import { render, screen } from '@testing-library/react';
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
    map: jest.fn(() => map),
    tileLayer: jest.fn(() => ({ addTo: jest.fn().mockReturnThis() })),
  };
});

describe('SearchAreaMap', () => {
  it('describes the selected radius', () => {
    render(
      <SearchAreaMap latitude={47.6} longitude={-122.3} radiusMiles={50} />,
    );

    expect(
      screen.getByRole('img', { name: 'Map showing a 50-mile search radius' }),
    ).toBeInTheDocument();
  });
});
