import { render, screen } from '@testing-library/react';
import { CityPicker } from './CityPicker';

describe('CityPicker', () => {
  it('renders the city search form', () => {
    render(
      <CityPicker
        cities={[]}
        isBusy={false}
        onQueryChange={jest.fn()}
        onSelectCity={jest.fn()}
        onSubmit={jest.fn()}
        query="Seattle, Washington"
      />,
    );

    expect(screen.getByLabelText('1. Pick a city')).toHaveValue(
      'Seattle, Washington',
    );
    expect(screen.getByRole('button', { name: 'Find city' })).toBeEnabled();
  });

  it('shows city choices when the geocoder returns more than one match', () => {
    render(
      <CityPicker
        cities={[
          {
            cityName: 'Seattle',
            countryCode: 'US',
            countryName: 'United States',
            displayName: 'Seattle, Washington, United States',
            latitude: 47.6,
            longitude: -122.3,
          },
        ]}
        isBusy={false}
        onQueryChange={jest.fn()}
        onSelectCity={jest.fn()}
        onSubmit={jest.fn()}
        query="Seattle"
      />,
    );

    expect(screen.getByText('Choose a city')).toBeInTheDocument();
    expect(screen.getByRole('listbox')).toHaveClass('absolute');
    expect(screen.getByRole('option', { name: /Seattle/ })).toBeInTheDocument();
  });
});
