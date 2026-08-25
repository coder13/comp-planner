import type { Meta, StoryObj } from '@storybook/react';
import { CompetitionEventGroup } from './CompetitionEventGroup';

const meta = {
  title: 'Components/CompetitionEventGroup',
  component: CompetitionEventGroup,
  args: {
    asOfDate: '2026-08-24',
    group: {
      competitionId: 'SeattleSummerOpen2026',
      competitionName: 'Seattle Summer Open 2026',
      competitionUrl:
        'https://www.worldcubeassociation.org/competitions/SeattleSummerOpen2026',
      lastHeldDate: '2026-08-01',
      lastDistanceMiles: 8.4,
      events: [
        {
          id: '333',
          label: '3×3×3 Cube',
          lastHeldDate: '2026-08-01',
          lastCompetitionName: 'Seattle Summer Open 2026',
          lastCompetitionUrl:
            'https://www.worldcubeassociation.org/competitions/SeattleSummerOpen2026',
          lastDistanceMiles: 8.4,
          heldInLast12Months: 7,
          totalCompetitionCount: 9,
        },
        {
          id: 'pyram',
          label: 'Pyraminx',
          lastHeldDate: '2026-08-01',
          lastCompetitionName: 'Seattle Summer Open 2026',
          lastCompetitionUrl:
            'https://www.worldcubeassociation.org/competitions/SeattleSummerOpen2026',
          lastDistanceMiles: 8.4,
          heldInLast12Months: 3,
          totalCompetitionCount: 4,
        },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl overflow-hidden rounded-2xl border border-line-light bg-white shadow-card">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof CompetitionEventGroup>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
