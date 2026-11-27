import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext.js';
import { ToastProvider } from './context/ToastContext.js';
import { ErrorBoundary } from './components/common/ErrorBoundary.js';
import { App } from './App.js';
import { initAutoCloudSync } from './data/cloudSync.js';
import { sanitizeStorage } from './lib/dataSanitizer.js';
import { ensureDemoDataInitialized } from './data/seedDemoData.js';
import './index.css';

// Universal pre-boot data sanitization to prevent any schema corruption crashes
try {
  sanitizeStorage();
} catch (e) {
  console.warn('[Bootstrap] sanitizeStorage error:', e);
}

// Ensure rich, realistic demo data is initialized for review & testing
try {
  ensureDemoDataInitialized();
} catch (e) {
  console.warn('[Bootstrap] ensureDemoDataInitialized error:', e);
}

// Initialize background real-time cloud database synchronization with 30s interval
try {
  initAutoCloudSync(30000);
} catch (e) {
  console.warn('[Bootstrap] initAutoCloudSync error:', e);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
