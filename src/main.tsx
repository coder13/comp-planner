import { StrictMode } from 'react';
import '@cubing/icons';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import 'leaflet/dist/leaflet.css';
import App from './App';
import './index.css';
import {
  QUERY_CACHE_MAX_AGE_MS,
  queryClient,
  queryPersister,
} from './lib/queryClient';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        buster: '1',
        maxAge: QUERY_CACHE_MAX_AGE_MS,
        persister: queryPersister,
      }}>
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);
