import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { SearchScopeControl } from './SearchScopeControl';

const meta = {
  title: 'Components/SearchScopeControl',
  component: SearchScopeControl,
  args: {
    mode: 'radius',
    radiusMiles: '50',
    region: {
      id: 'pnw',
      name: 'Pacific Northwest',
      states: ['Alaska', 'Washington', 'Oregon'],
    },
    stateName: 'Washington',
    latitude: 47.6062,
    longitude: -122.3321,
    sameCountryOnly: true,
    onModeChange: fn(),
    onRadiusChange: fn(),
    onSameCountryOnlyChange: fn(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof SearchScopeControl>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Radius: Story = {};

export const State: Story = {
  args: {
    mode: 'state',
  },
};

export const Region: Story = {
  args: {
    mode: 'region',
  },
};
