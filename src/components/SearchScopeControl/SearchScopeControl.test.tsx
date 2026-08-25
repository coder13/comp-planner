import { fireEvent, render, screen } from '@testing-library/react';
import { SearchScopeControl } from './SearchScopeControl';

describe('SearchScopeControl', () => {
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
