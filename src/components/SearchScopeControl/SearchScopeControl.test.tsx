import { act, fireEvent, render, screen } from '@testing-library/react';
import { SearchAreaMap } from '../SearchAreaMap';
import { SearchScopeControl } from './SearchScopeControl';

jest.mock('../SearchAreaMap', () => ({
  SearchAreaMap: jest.fn(() => null),
}));

describe('SearchScopeControl', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it('changes the radius input', async () => {
    const onRadiusChange = jest.fn();

    render(
      <SearchScopeControl
        mode="radius"
        radiusMiles="50"
        region={null}
        sameCountryOnly={true}
        onModeChange={jest.fn()}
        onLocationSelect={jest.fn()}
        onRadiusChange={onRadiusChange}
        onSameCountryOnlyChange={jest.fn()}
      />,
    );

    const radiusInput = screen.getByRole('spinbutton', { name: 'Radius' });
    fireEvent.change(radiusInput, { target: { value: '100' } });

    expect(onRadiusChange).toHaveBeenCalledWith('100');
  });

  it('debounces radius updates passed to the map by 120ms', () => {
    jest.useFakeTimers();
    const searchAreaMap = SearchAreaMap as jest.Mock;
    const onRadiusChange = jest.fn();
    const props = {
      latitude: 47.6,
      longitude: -122.3,
      mode: 'radius' as const,
      region: null,
      sameCountryOnly: true,
      onLocationSelect: jest.fn(),
      onModeChange: jest.fn(),
      onRadiusChange,
      onSameCountryOnlyChange: jest.fn(),
    };
    const { rerender } = render(
      <SearchScopeControl {...props} radiusMiles="50" />,
    );

    fireEvent.change(screen.getByRole('spinbutton', { name: 'Radius' }), {
      target: { value: '100' },
    });
    rerender(<SearchScopeControl {...props} radiusMiles="100" />);

    expect(
      searchAreaMap.mock.calls[searchAreaMap.mock.calls.length - 1][0],
    ).toEqual(expect.objectContaining({ radiusMiles: 50 }));
    act(() => jest.advanceTimersByTime(119));
    expect(
      searchAreaMap.mock.calls[searchAreaMap.mock.calls.length - 1][0],
    ).toEqual(expect.objectContaining({ radiusMiles: 50 }));
    act(() => jest.advanceTimersByTime(1));
    expect(
      searchAreaMap.mock.calls[searchAreaMap.mock.calls.length - 1][0],
    ).toEqual(expect.objectContaining({ radiusMiles: 100 }));
  });

  it('shows state and region scope choices for a PNW city', () => {
    render(
      <SearchScopeControl
        mode="radius"
        radiusMiles="50"
        region={{
          id: 'pnw',
          name: 'Pacific Northwest',
          states: ['Alaska', 'Washington', 'Oregon'],
        }}
        sameCountryOnly={true}
        stateName="Washington"
        onModeChange={jest.fn()}
        onLocationSelect={jest.fn()}
        onRadiusChange={jest.fn()}
        onSameCountryOnlyChange={jest.fn()}
      />,
    );

    expect(screen.getByRole('button', { name: 'Entire state' })).toBeEnabled();
    expect(
      screen.getByRole('button', { name: 'Pacific Northwest' }),
    ).toBeInTheDocument();
  });

  it('changes the same-country setting', () => {
    const onSameCountryOnlyChange = jest.fn();

    render(
      <SearchScopeControl
        mode="radius"
        radiusMiles="50"
        region={null}
        sameCountryOnly={true}
        onModeChange={jest.fn()}
        onLocationSelect={jest.fn()}
        onRadiusChange={jest.fn()}
        onSameCountryOnlyChange={onSameCountryOnlyChange}
      />,
    );

    const checkbox = screen.getByRole('checkbox', { name: 'Same country' });
    expect(checkbox).toBeChecked();
    fireEvent.click(checkbox);

    expect(onSameCountryOnlyChange).toHaveBeenCalledWith(false);
  });
});
