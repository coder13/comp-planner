import type { Meta, StoryObj } from '@storybook/react';
import { EventSummaryRow } from './EventSummaryRow';

const meta = {
  title: 'Components/EventSummaryRow',
  component: EventSummaryRow,
  args: {
    asOfDate: '2026-08-24',
    event: {
      id: '333',
      label: '3×3×3 Cube',
      lastHeldDate: '2026-08-01',
      lastCompetitionName: 'Seattle Summer Open 2026',
      lastCompetitionUrl:
        'https://www.worldcubeassociation.org/competitions/SeattleSummerOpen2026',
      lastDistanceMiles: 8.4,
      heldInSearchWindow: 7,
      totalCompetitionCount: 9,
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-5xl overflow-hidden rounded-2xl border border-line-light bg-white shadow-card">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof EventSummaryRow>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const NoRecentCompetition: Story = {
  args: {
    event: {
      ...meta.args.event,
      label: 'Square-1',
      lastHeldDate: '2024-11-12',
      lastCompetitionName: 'Northwest Cube Classic 2024',
      lastCompetitionUrl:
        'https://www.worldcubeassociation.org/competitions/NorthwestCubeClassic2024',
      lastDistanceMiles: 8.4,
      heldInSearchWindow: 0,
      totalCompetitionCount: 1,
    },
  },
};
