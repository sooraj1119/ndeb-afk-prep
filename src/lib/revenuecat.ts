/* eslint-disable no-empty */
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { setIsPremium } from './storage';

const RC_APPLE_API_KEY  = "test_MjHrqQSKbVtxlQruiZRbXVwXyta"; // ⚠️ Replace with appl_ key before App Store release
const RC_GOOGLE_API_KEY = "goog_TfLGwDtMnsNJMIhfJggjkOrlqJe";
const ENTITLEMENT_ID    = 'ndeb_prep_pro';

const IS_DEV = import.meta.env.DEV;

/**
 * Configure RevenueCat, register the real-time CustomerInfo listener,
 * and immediately fetch the authoritative premium status from RC servers.
 * Call once in main.tsx AFTER React has rendered (to avoid blocking startup).
 */
export const initializeRevenueCat = async (): Promise<void> => {
  if (Capacitor.getPlatform() === 'web') {
    console.warn('RevenueCat: Web platform — RC disabled. Local cache used as-is.');
    return;
  }

  // Use DEBUG in dev builds only; WARN in production to avoid log spam
  await Purchases.setLogLevel({ level: IS_DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN });

  if (Capacitor.getPlatform() === 'ios') {
    await Purchases.configure({ apiKey: RC_APPLE_API_KEY });
  } else if (Capacitor.getPlatform() === 'android') {
    await Purchases.configure({ apiKey: RC_GOOGLE_API_KEY });
  }

  // Real-time listener: fires on expiry, renewal, refund, or new purchase
  await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);
  });

  // Immediate authoritative fetch — overwrites any stale localStorage cache
  await syncPremiumStatus();
};

/**
 * Fetch the latest CustomerInfo from RC and write it to the local cache.
 * On network error: keeps cached value. Never grants premium on failure.
 */
export const syncPremiumStatus = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    return localStorage.getItem('ndeb_prep_is_premium') === 'true';
  }

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);
    return isPro;
  } catch (error) {
    console.error('RC syncPremiumStatus error — keeping cached value:', error);
    return localStorage.getItem('ndeb_prep_is_premium') === 'true';
  }
};

export const getOfferings = async () => {
  if (Capacitor.getPlatform() === 'web') {
    // Mock offerings — DEV only. On prod native builds this path is never reached.
    if (!IS_DEV) return null;
    return {
      current: {
        availablePackages: [
          { identifier: '$rc_monthly', packageType: 'MONTHLY',
            product: { title: 'Pro Monthly (Dev Sandbox)', description: 'Unlock all topics and analytics.', priceString: '$7.99', price: 7.99 } },
          { identifier: '$rc_annual', packageType: 'ANNUAL',
            product: { title: 'Pro Annual (Dev Sandbox)', description: 'Save 50% with annual.', priceString: '$69.30', price: 69.30 } },
        ]
      }
    };
  }

  try {
    return await Purchases.getOfferings();
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const purchasePackage = async (rcPackage: any): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    // Grant premium in dev only — never on a deployed web build
    if (IS_DEV) { setIsPremium(true); return true; }
    console.warn('Purchases not supported on web in production.');
    return false;
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);
    return isPro;
  } catch (error: any) {
    if (error.code !== 'USER_CANCELLED') console.error('Purchase error:', error);
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    return localStorage.getItem('ndeb_prep_is_premium') === 'true';
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);
    return isPro;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return false;
  }
};
