import { fn } from '@storybook/test';
import type { Meta, StoryObj } from '@storybook/react';
import { CityPicker } from './CityPicker';

const meta = {
  title: 'Components/CityPicker',
  component: CityPicker,
  args: {
    cities: [],
    isBusy: false,
    onQueryChange: fn(),
    onSelectCity: fn(),
    onSubmit: fn(),
    query: 'Seattle, Washington',
  },
  parameters: {
    backgrounds: { default: 'dark' },
  },
  tags: ['autodocs'],
} satisfies Meta<typeof CityPicker>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const ChoosingACity: Story = {
  args: {
    cities: [
      {
        cityName: 'Seattle',
        countryCode: 'US',
        countryName: 'United States',
        displayName: 'Seattle, King County, Washington, United States',
        latitude: 47.6038,
        longitude: -122.3301,
      },
      {
        cityName: 'Seattle',
        countryCode: 'CA',
        countryName: 'Canada',
        displayName: 'Seattle, British Columbia, Canada',
        latitude: 49.1,
        longitude: -123.1,
      },
    ],
  },
};

export const Loading: Story = {
  args: {
    isBusy: true,
  },
};
