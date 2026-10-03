/* eslint-disable no-empty */
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { setIsPremium } from './storage';

const RC_APPLE_API_KEY  = "test_MjHrqQSKbVtxlQruiZRbXVwXyta"; // ?? Replace with appl_ key before App Store release
const RC_GOOGLE_API_KEY = "goog_TfLGwDtMnsNJMIhfJggjkOrlqJe";
const ENTITLEMENT_ID    = 'ndeb_prep_pro';

const IS_DEV = import.meta.env.DEV;

let rcReadyPromise: Promise<void> | null = null;

export const initializeRevenueCat = async (): Promise<void> => {
  if (Capacitor.getPlatform() === 'web') {
    console.warn('RevenueCat: Web platform - RC disabled.');
    return;
  }

  if (rcReadyPromise) return rcReadyPromise;

  rcReadyPromise = (async () => {
    try {
      await Purchases.setLogLevel({ level: IS_DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.WARN });
    
      if (Capacitor.getPlatform() === 'ios') {
        await Purchases.configure({ apiKey: RC_APPLE_API_KEY });
      } else if (Capacitor.getPlatform() === 'android') {
        await Purchases.configure({ apiKey: RC_GOOGLE_API_KEY });
      }
    
      await Purchases.addCustomerInfoUpdateListener((customerInfo) => {
        const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
        setIsPremium(isPro);
      });
    } catch (e) {
      rcReadyPromise = null; // Allow retry on next call
      throw e;
    }
  })();

  await rcReadyPromise;
  await syncPremiumStatus();
};

const ensureConfigured = async () => {
  if (Capacitor.getPlatform() === 'web') return;
  if (!rcReadyPromise) {
    await initializeRevenueCat();
  } else {
    await rcReadyPromise;
  }
};

export const syncPremiumStatus = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') return localStorage.getItem('ndeb_prep_is_premium') === 'true';

  try {
    await ensureConfigured();
    const { customerInfo } = await Purchases.getCustomerInfo();
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);
    return isPro;
  } catch (error) {
    console.error('RC syncPremiumStatus error - keeping cached value:', error);
    return localStorage.getItem('ndeb_prep_is_premium') === 'true';
  }
};

export const getOfferings = async () => {
  if (Capacitor.getPlatform() === 'web') {
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
    await ensureConfigured();
    return await Purchases.getOfferings();
  } catch (error) {
    console.error('Error fetching offerings:', error);
    return null;
  }
};

export const purchasePackage = async (rcPackage: any): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    if (IS_DEV) { setIsPremium(true); return true; }
    return false;
  }

  try {
    await ensureConfigured();
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
  if (Capacitor.getPlatform() === 'web') return localStorage.getItem('ndeb_prep_is_premium') === 'true';

  try {
    await ensureConfigured();
    const { customerInfo } = await Purchases.restorePurchases();
    const isPro = ENTITLEMENT_ID in customerInfo.entitlements.active;
    setIsPremium(isPro);
    return isPro;
  } catch (error) {
    console.error('Error restoring purchases:', error);
    return false;
  }
};
