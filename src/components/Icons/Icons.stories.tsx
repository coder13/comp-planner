import type { Meta, StoryObj } from '@storybook/react';
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

const meta = {
  title: 'Components/Icons',
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <div className="flex flex-wrap gap-5 rounded-2xl bg-white p-6 text-ink">
      <ArrowUpRightIcon />
      <CalendarIcon />
      <ChevronDownIcon />
      <CompassIcon />
      <ExternalLinkIcon />
      <MapPinIcon />
      <SearchIcon />
      <SparkIcon />
    </div>
  ),
};
