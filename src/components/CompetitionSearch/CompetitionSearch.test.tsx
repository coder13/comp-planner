import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { CompetitionSearch } from './CompetitionSearch';

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

function CompetitionSearchHarness({ onLookup }: { onLookup: jest.Mock }) {
  const [query, setQuery] = useState('');

  return (
    <CompetitionSearch
      competitions={[]}
      isBusy={false}
      onLookup={onLookup}
      onQueryChange={setQuery}
      onSelectCompetition={jest.fn()}
      onSubmit={jest.fn()}
      query={query}
    />
  );
}

describe('CompetitionSearch', () => {
  it('selects a searched competition', async () => {
    const onSelectCompetition = jest.fn();
    const user = userEvent.setup();

    render(
      <CompetitionSearch
        competitions={competitions}
        isBusy={false}
        onLookup={jest.fn()}
        onQueryChange={jest.fn()}
        onSelectCompetition={onSelectCompetition}
        onSubmit={jest.fn()}
        query="Seattle"
      />,
    );

    await user.click(
      screen.getByRole('option', { name: /Seattle Summer Open 2026/ }),
    );

    expect(onSelectCompetition).toHaveBeenCalledWith(competitions[0]);
  });

  it('debounces autocomplete lookups', async () => {
    jest.useFakeTimers();
    const onLookup = jest.fn();
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<CompetitionSearchHarness onLookup={onLookup} />);

    await user.type(screen.getByLabelText('Pick a competition'), 'Seattle');
    expect(onLookup).not.toHaveBeenCalled();

    jest.advanceTimersByTime(320);
    expect(onLookup).toHaveBeenCalledWith('Seattle');
    jest.useRealTimers();
  });
});
