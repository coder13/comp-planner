import { fireEvent, render, screen } from '@testing-library/react';
import { UpcomingCompetitionToggle } from './UpcomingCompetitionToggle';

describe('UpcomingCompetitionToggle', () => {
  it('reports the new toggle state', () => {
    const onChange = jest.fn();

    render(<UpcomingCompetitionToggle checked={false} onChange={onChange} />);

    fireEvent.click(
      screen.getByRole('checkbox', {
        name: 'Include upcoming competitions',
      }),
    );

    expect(onChange).toHaveBeenCalledWith(true);
  });
});
