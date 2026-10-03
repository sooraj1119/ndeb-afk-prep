// Patch to prevent Google Translate from crashing React
if (typeof Node === 'function' && Node.prototype) {
  const originalRemoveChild = Node.prototype.removeChild;
  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode !== this) {
      if (console) console.warn('Prevented React Google Translate crash (removeChild)');
      return child;
    }
    return originalRemoveChild.call(this, child) as T;
  };
  const originalInsertBefore = Node.prototype.insertBefore;
  Node.prototype.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
    if (referenceNode && referenceNode.parentNode !== this) {
      if (console) console.warn('Prevented React Google Translate crash (insertBefore)');
      return newNode;
    }
    return originalInsertBefore.call(this, newNode, referenceNode) as T;
  };
}
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
      // Fall through � localStorage value (if any) is used as-is
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

