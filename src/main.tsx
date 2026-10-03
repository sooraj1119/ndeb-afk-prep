import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import "./index.css"

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';

async function bootstrap() {
  // On native (Android/iOS): restore premium status from native Preferences BEFORE React renders.
  // This guarantees usePremiumStatus() initialises correctly even after a WebView reload.
  if (Capacitor.isNativePlatform()) {
    try {
      const { value } = await Preferences.get({ key: 'ndeb_prep_is_premium' });
      if (value !== null) {
        localStorage.setItem('ndeb_prep_is_premium', value);
      }
    } catch (_) {
      // Fall through – localStorage value (if any) is used as-is
    }
  }

  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap()
