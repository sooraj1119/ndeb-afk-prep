/* eslint-disable no-empty */
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { setIsPremium } from './storage';

const RC_APPLE_API_KEY = "test_MjHrqQSKbVtxlQruiZRbXVwXyta";
const RC_GOOGLE_API_KEY = "goog_TfLGwDtMnsNJMIhfJggjkOrlqJe";
const ENTITLEMENT_ID = 'ndeb_prep_pro';

let _rcReady = false;

/**
 * Initialize RevenueCat and register a listener so the cached premium
 * status is ALWAYS overwritten with whatever RC says.
 * Call this once on app startup (before React renders if possible).
 */
export const initializeRevenueCat = async (): Promise<void> => {
  if (Capacitor.getPlatform() === 'web') {
    console.warn('RevenueCat: Web platform — RC disabled. Local cache is used as-is.');
    return;
  }

  await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });

  if (Capacitor.getPlatform() === 'ios') {
    await Purchases.configure({ apiKey: RC_APPLE_API_KEY });
  } else if (Capacitor.getPlatform() === 'android') {
    await Purchases.configure({ apiKey: RC_GOOGLE_API_KEY });
  }

  _rcReady = true;

  // Register a persistent listener so any entitlement change
  // (expiry, renewal, refund, new purchase) is reflected immediately.
  await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);          // update cache + fire event
  });

  // Do an immediate authoritative fetch on startup.
  // This overwrites the stale localStorage cache with the real RC value.
  await syncPremiumStatus();
};

/**
 * Fetch the latest CustomerInfo directly from RevenueCat servers
 * and write the result to the local cache.
 * Returns the current premium status.
 */
export const syncPremiumStatus = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    // Web: no RC. Return whatever is in localStorage (manual override for dev).
    const cached = localStorage.getItem('ndeb_prep_is_premium') === 'true';
    return cached;
  }

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);   // write authoritative value → cache
    return isPro;
  } catch (error) {
    console.error('RC syncPremiumStatus error — keeping cached value:', error);
    // Return the cached value as a graceful degradation only.
    // We do NOT grant premium on failure; we keep whatever was last confirmed.
    return localStorage.getItem('ndeb_prep_is_premium') === 'true';
  }
};

export const getOfferings = async () => {
  if (Capacitor.getPlatform() === 'web') {
    return {
      current: {
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: { title: 'Pro Monthly (Web Sandbox)', description: 'Unlock all topics and analytics.', priceString: '$7.99', price: 7.99 }
          },
          {
            identifier: '$rc_annual',
            packageType: 'ANNUAL',
            product: { title: 'Pro Annual (Web Sandbox)', description: 'Save 50% with an annual plan.', priceString: '$69.30', price: 69.30 }
          }
        ]
      }
    };
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const purchasePackage = async (rcPackage: any): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    setIsPremium(true);
    return true;
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
    // RC is the authority: set exactly what RC says — never assume true.
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);
    return isPro;
  } catch (error: any) {
    if (error.code !== 'USER_CANCELLED') {
      console.error('Purchase error:', error);
    }
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    // On web, restore = re-sync from cache (no real restore possible).
    return localStorage.getItem('ndeb_prep_is_premium') === 'true';
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);   // write RC truth → cache
    return isPro;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return false;
  }
};
