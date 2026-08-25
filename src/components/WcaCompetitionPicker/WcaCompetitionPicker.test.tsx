import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WcaCompetitionPicker } from './WcaCompetitionPicker';

const competitions = [
  {
    id: 'SeattleSummerOpen2026',
    name: 'Seattle Summer Open 2026',
    start_date: '2026-08-01',
    end_date: '2026-08-01',
    city: 'Seattle, Washington',
    venue: 'Seattle Center',
    country_iso2: 'US',
    event_ids: ['333'],
    cancelled_at: null,
    latitude_degrees: 47.6,
    longitude_degrees: -122.3,
    url: 'https://example.com/competition',
    website: 'https://example.com/competition',
  },
];

describe('WcaCompetitionPicker', () => {
  it('selects a competition', async () => {
    const onSelect = jest.fn();
    const user = userEvent.setup();

    render(
      <WcaCompetitionPicker
        competitions={competitions}
        isLoading={false}
        selectedCompetitionId={null}
        onSelect={onSelect}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText('My upcoming competitions'),
      'SeattleSummerOpen2026',
    );
    expect(onSelect).toHaveBeenCalledWith('SeattleSummerOpen2026');
  });

  it('disables the input when no competitions are available', () => {
    render(
      <WcaCompetitionPicker
        competitions={[]}
        isLoading={false}
        selectedCompetitionId={null}
        onSelect={jest.fn()}
      />,
    );

    expect(screen.getByLabelText('My upcoming competitions')).toBeDisabled();
  });
});
