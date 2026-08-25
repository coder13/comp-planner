import type { Meta, StoryObj } from '@storybook/react';
import { CompetitionPlan } from './CompetitionPlan';

const meta = {
  title: 'Components/CompetitionPlan',
  component: CompetitionPlan,
  args: {
    asOfDate: '2026-08-24',
    competition: {
      id: 'SeattleSummerOpen2026',
      name: 'Seattle Summer Open 2026',
      start_date: '2026-08-01',
      end_date: '2026-08-01',
      city: 'Seattle, Washington',
      venue: 'Seattle Center',
      country_iso2: 'US',
      event_ids: ['333', '222'],
      cancelled_at: null,
      latitude_degrees: 47.6,
      longitude_degrees: -122.3,
      url: 'https://example.com/competition',
      website: 'https://example.com/competition',
    },
    eventSummaries: [
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
        id: '222',
        label: '2×2×2 Cube',
        lastHeldDate: '2026-07-12',
        lastCompetitionName: 'Seattle Summer Open 2026',
        lastCompetitionUrl: 'https://example.com/competition',
        lastDistanceMiles: 3,
        heldInLast12Months: 3,
        totalCompetitionCount: 5,
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
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof CompetitionPlan>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
