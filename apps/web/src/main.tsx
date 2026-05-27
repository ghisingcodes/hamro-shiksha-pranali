import React from 'react';
import ReactDOM from 'react-dom/client';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient';
import App from './app/app';
import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import { DatesProvider } from '@mantine/dates';

const theme = createTheme({
  primaryColor: 'blue',
  defaultRadius: 'md',
  components: {
    Button: { defaultProps: { radius: 'md' } },
    Paper: { defaultProps: { radius: 'md', bg: '#ffffff' } },
  },
  other: {
    bodyBg: '#f8fafc',
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MantineProvider defaultColorScheme="auto" theme={theme} defaultColorScheme="light">
      <DatesProvider settings={{ locale: 'en', firstDayOfWeek: 0 }}>
        <Notifications />
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </DatesProvider>
    </MantineProvider>
  </React.StrictMode>
);