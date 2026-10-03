import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import "./index.css"

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { initializeRevenueCat } from './lib/revenuecat';

const PREMIUM_KEY = 'ndeb_prep_is_premium';

async function bootstrap() {
  if (Capacitor.isNativePlatform()) {
    // Step 1: Warm the localStorage cache from native Preferences so the
    // very first React render shows the correct cached premium state
    // (avoids a free-user flash before RC responds).
    try {
      const { value } = await Preferences.get({ key: PREMIUM_KEY });
      if (value !== null) {
        localStorage.setItem(PREMIUM_KEY, value);
      }
    } catch (_) {
      // Fall through — use whatever is already in localStorage
    }

    // Step 2: Initialise RevenueCat.
    // This configures RC, registers the CustomerInfo listener, and immediately
    // fetches the authoritative status from RC servers, overwriting the cache.
    // Wrapped in try/catch so a network error never blocks the app from launching.
    try {
      await initializeRevenueCat();
    } catch (e) {
      console.error('RevenueCat bootstrap error:', e);
    }
  }

  // Step 3: Render React. By this point the cache already has the RC-confirmed
  // value (or the Preferences-backed warm value if RC timed out).
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}

bootstrap();
