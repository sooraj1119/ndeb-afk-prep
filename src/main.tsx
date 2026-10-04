import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ErrorBoundary } from './ErrorBoundary'
import "./index.css"

import { Preferences } from '@capacitor/preferences';
import { Capacitor } from '@capacitor/core';
import { initializeRevenueCat } from './lib/revenuecat';

const PREMIUM_KEY = 'ndeb_prep_is_premium';

/** Resolves after `ms` milliseconds — used to cap the RC network wait. */
const timeout = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));

async function bootstrap() {
  // Always render React first so the splash screen shows immediately.
  // RevenueCat and Preferences are initialised in the background so a
  // slow network never causes a white screen.
  ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );

  if (!Capacitor.isNativePlatform()) return;

  // Step 1: Warm the localStorage cache from native Preferences.
  // This runs quickly (IPC, no network) so it finishes long before
  // the user dismisses the splash screen.
  try {
    const { value } = await Preferences.get({ key: PREMIUM_KEY });
    if (value !== null) {
      localStorage.setItem(PREMIUM_KEY, value);
      // Tell the already-mounted hook about the updated value
      window.dispatchEvent(new Event('premium_status_changed'));
    }
  } catch (_) {
    // Fall through — localStorage value is used as-is
  }

  // Step 2: Initialise RevenueCat, capped at 2.5 s so a dead network
  // never hangs the background init. The CustomerInfo listener and
  // visibilitychange handler in usePremiumStatus will pick up the real
  // value as soon as connectivity returns.
  try {
    await Promise.race([
      initializeRevenueCat(),
      timeout(2500),
    ]);
  } catch (e) {
    console.error('RevenueCat bootstrap error:', e);
  }
}

bootstrap();
