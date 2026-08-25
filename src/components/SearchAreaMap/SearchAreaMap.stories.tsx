import type { Meta, StoryObj } from '@storybook/react';
import { SearchAreaMap } from './SearchAreaMap';

const meta = {
  title: 'Components/SearchAreaMap',
  component: SearchAreaMap,
  args: {
    latitude: 47.6062,
    longitude: -122.3321,
    radiusMiles: 50,
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SearchAreaMap>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Seattle: Story = {};

export const WideRadius: Story = {
  args: {
    radiusMiles: 100,
  },
};
