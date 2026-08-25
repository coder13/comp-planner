import type { Meta, StoryObj } from '@storybook/react';
import { fn } from '@storybook/test';
import { WcaAuthButton } from './WcaAuthButton';

const meta = {
  title: 'Components/WcaAuthButton',
  component: WcaAuthButton,
  args: {
    isConfigured: true,
    isLoading: false,
    user: null,
    onLogin: fn(),
    onLogout: fn(),
  },
  decorators: [
    (Story) => (
      <div className="flex justify-end rounded-lg border border-gray-200 bg-white p-4">
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
} satisfies Meta<typeof WcaAuthButton>;

export default meta;

type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {};

export const SignedIn: Story = {
  args: {
    user: {
      id: 1,
      name: 'WCA User',
      wca_id: '2020USER01',
    },
  },
};
