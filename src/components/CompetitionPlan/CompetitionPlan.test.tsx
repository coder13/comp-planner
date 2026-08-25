import { render, screen } from '@testing-library/react';
import { CompetitionPlan } from './CompetitionPlan';

describe('CompetitionPlan', () => {
  it('shows selected events and suggests other nearby events', () => {
    render(
      <CompetitionPlan
        asOfDate="2026-08-24"
        competition={{
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
        }}
        eventSummaries={[
          {
            id: '333',
            label: '3×3×3 Cube',
            lastHeldDate: '2026-08-01',
            lastCompetitionName: 'Seattle Summer Open 2026',
            lastCompetitionUrl: 'https://example.com/competition',
            lastDistanceMiles: 3,
            heldInLast12Months: 4,
            totalCompetitionCount: 6,
          },
          {
            id: 'pyram',
            label: 'Pyraminx',
            lastHeldDate: '2025-08-01',
            lastCompetitionName: 'Seattle Fall Open 2025',
            lastCompetitionUrl: 'https://example.com/older-competition',
            lastDistanceMiles: 8,
            heldInLast12Months: 0,
            totalCompetitionCount: 2,
          },
        ]}
      />,
    );

    expect(screen.getByText('Events in this competition')).toBeInTheDocument();
    expect(screen.getByText('3×3×3 Cube')).toBeInTheDocument();
    expect(screen.getByText('Suggested events')).toBeInTheDocument();
    expect(screen.getByText('Pyraminx')).toBeInTheDocument();
    expect(
      screen.getByText(/held 0 times in the last year/),
    ).toBeInTheDocument();
  });
});
