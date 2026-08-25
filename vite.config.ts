import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    define: {
      __COMP_PLANNER_WCA_API_ORIGIN__: JSON.stringify(
        env.VITE_WCA_API_ORIGIN || '',
      ),
      __COMP_PLANNER_WCA_CLIENT_ID__: JSON.stringify(
        env.VITE_WCA_CLIENT_ID || '',
      ),
      __COMP_PLANNER_IS_DEV__: JSON.stringify(mode === 'development'),
      __COMP_PLANNER_WCA_OAUTH_ORIGIN__: JSON.stringify(
        env.VITE_WCA_OAUTH_ORIGIN || '',
      ),
    },
    plugins: [react()],
    server: {
      allowedHosts: true,
    },
  };
});
