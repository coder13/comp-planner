import { render, screen } from '@testing-library/react';
import { EventSummaryRow } from './EventSummaryRow';

describe('EventSummaryRow', () => {
  it('shows the last competition and the recent count', () => {
    render(
      <EventSummaryRow
        asOfDate="2026-08-24"
        event={{
          id: '333',
          label: '3×3×3 Cube',
          lastHeldDate: '2026-08-01',
          lastCompetitionName: 'Seattle Summer Open 2026',
          lastCompetitionUrl: 'https://example.com/competition',
          lastDistanceMiles: 8.4,
          heldInLast12Months: 7,
          totalCompetitionCount: 9,
        }}
      />,
    );

    expect(screen.getByText('3×3×3 Cube')).toBeInTheDocument();
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('3×3×3 Cube').closest('article')).toHaveStyle(
      'background-color: rgba(224, 102, 102, 0.5)',
    );
    expect(
      screen.queryByText('Held 7 times in the last year'),
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/search history/)).not.toBeInTheDocument();
    expect(screen.getByText('3 weeks ago')).toBeInTheDocument();
    expect(screen.getByText('Aug 1, 2026')).toBeInTheDocument();
    expect(
      screen.getByLabelText('7 times held in the last year'),
    ).toBeInTheDocument();
    expect(screen.queryByText('8.4 mi away')).not.toBeInTheDocument();
  });
});
