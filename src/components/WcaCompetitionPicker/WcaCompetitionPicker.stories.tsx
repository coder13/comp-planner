import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { WcaCompetitionPicker } from './WcaCompetitionPicker';

const meta = {
  title: 'Components/WcaCompetitionPicker',
  component: WcaCompetitionPicker,
  args: {
    competitions: [
      {
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
    ],
    isLoading: false,
    selectedCompetitionId: null,
    onSelect: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl rounded-lg border border-gray-200 bg-white p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof WcaCompetitionPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Empty: Story = {
  args: {
    competitions: [],
  },
};
