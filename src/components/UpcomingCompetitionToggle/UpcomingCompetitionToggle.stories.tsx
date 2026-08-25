import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { UpcomingCompetitionToggle } from './UpcomingCompetitionToggle';

const meta = {
  title: 'Components/UpcomingCompetitionToggle',
  component: UpcomingCompetitionToggle,
  args: {
    checked: true,
    onChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof UpcomingCompetitionToggle>;

export default meta;

type Story = StoryObj<typeof meta>;

export const On: Story = {};

export const Off: Story = {
  args: {
    checked: false,
  },
};
