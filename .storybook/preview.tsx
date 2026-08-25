import type { Preview } from '@storybook/react';
import '@cubing/icons';
import 'leaflet/dist/leaflet.css';
import '../src/index.css';

const preview: Preview = {
  decorators: [
    (Story) => (
      <div className="min-h-screen bg-paper p-6 text-ink sm:p-10">
        <Story />
      </div>
    ),
  ],
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    layout: 'padded',
  },
};

export default preview;
