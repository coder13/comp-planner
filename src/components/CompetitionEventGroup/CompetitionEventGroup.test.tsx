import { render, screen } from '@testing-library/react';
import { CompetitionEventGroup } from './CompetitionEventGroup';

describe('CompetitionEventGroup', () => {
  it('groups events under their latest competition', () => {
    render(
      <CompetitionEventGroup
        asOfDate="2026-08-24"
        group={{
          competitionId: 'SeattleSummerOpen2026',
          competitionName: 'Seattle Summer Open 2026',
          competitionUrl: 'https://example.com/competition',
          lastHeldDate: '2026-08-01',
          lastDistanceMiles: 8.4,
          events: [
            {
              id: '333',
              label: '3×3×3 Cube',
              lastHeldDate: '2026-08-01',
              lastCompetitionName: 'Seattle Summer Open 2026',
              lastCompetitionUrl: 'https://example.com/competition',
              lastDistanceMiles: 8.4,
              heldInLast12Months: 7,
              totalCompetitionCount: 9,
            },
            {
              id: 'pyram',
              label: 'Pyraminx',
              lastHeldDate: '2026-08-01',
              lastCompetitionName: 'Seattle Summer Open 2026',
              lastCompetitionUrl: 'https://example.com/competition',
              lastDistanceMiles: 8.4,
              heldInLast12Months: 3,
              totalCompetitionCount: 4,
            },
          ],
        }}
      />,
    );

    expect(
      screen.getByRole('link', { name: /Seattle Summer Open 2026/ }),
    ).toHaveAttribute('href', 'https://example.com/competition');
    expect(screen.getByText('3×3×3 Cube')).toBeInTheDocument();
    expect(screen.getByText('Pyraminx')).toBeInTheDocument();
    expect(screen.getByText('3 weeks ago')).toBeInTheDocument();
    expect(screen.queryByText('2 events')).not.toBeInTheDocument();
    expect(screen.queryByText(/Last held/)).not.toBeInTheDocument();
    expect(
      screen.queryByText('Held in the last 12 months'),
    ).not.toBeInTheDocument();
  });
});
