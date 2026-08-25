import { render } from '@testing-library/react';
import {
  ArrowUpRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  CompassIcon,
  ExternalLinkIcon,
  MapPinIcon,
  SearchIcon,
  SparkIcon,
} from './Icons';

describe('Icons', () => {
  it('renders the shared icon set', () => {
    const { container } = render(
      <div>
        <ArrowUpRightIcon />
        <CalendarIcon />
        <ChevronDownIcon />
        <CompassIcon />
        <ExternalLinkIcon />
        <MapPinIcon />
        <SearchIcon />
        <SparkIcon />
      </div>,
    );

    expect(container.querySelectorAll('svg')).toHaveLength(8);
  });
});
