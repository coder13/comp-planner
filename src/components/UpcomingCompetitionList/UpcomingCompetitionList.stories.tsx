import type { Meta, StoryObj } from '@storybook/react';
import { UpcomingCompetitionList } from './UpcomingCompetitionList';

const meta = {
  title: 'Components/UpcomingCompetitionList',
  component: UpcomingCompetitionList,
  args: {
    competitions: [
      {
        id: 'SeattleFallOpen2026',
        name: 'Seattle Fall Open 2026',
        startDate: '2026-09-12',
        endDate: '2026-09-13',
        city: 'Seattle, Washington',
        url: 'https://www.worldcubeassociation.org/competitions/SeattleFallOpen2026',
        eventIds: ['333', '222', 'pyram'],
        distanceMiles: 8.4,
      },
      {
        id: 'TacomaWinterOpen2027',
        name: 'Tacoma Winter Open 2027',
        startDate: '2027-01-09',
        endDate: '2027-01-10',
        city: 'Tacoma, Washington',
        url: 'https://www.worldcubeassociation.org/competitions/TacomaWinterOpen2027',
        eventIds: [],
        distanceMiles: 31,
      },
    ],
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof UpcomingCompetitionList>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
