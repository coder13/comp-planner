import { render, screen } from '@testing-library/react';
import { UpcomingCompetitionList } from './UpcomingCompetitionList';

describe('UpcomingCompetitionList', () => {
  it('shows future competition details and events', () => {
    render(
      <UpcomingCompetitionList
        competitions={[
          {
            id: 'SeattleFallOpen2026',
            name: 'Seattle Fall Open 2026',
            startDate: '2026-09-12',
            endDate: '2026-09-13',
            city: 'Seattle, Washington',
            url: 'https://example.com/competition',
            eventIds: ['333', 'pyram'],
            distanceMiles: 8.4,
          },
        ]}
      />,
    );

    expect(
      screen.getByRole('heading', { name: 'Upcoming competitions' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /Seattle Fall Open 2026/ }),
    ).toHaveAttribute('href', 'https://example.com/competition');
    expect(screen.getByText('Sep 12, 2026 – Sep 13, 2026')).toBeInTheDocument();
    expect(screen.getByText('8.4 mi away · 2 events')).toBeInTheDocument();
    expect(screen.getByText('3×3×3 Cube, Pyraminx')).toBeInTheDocument();
  });
});
