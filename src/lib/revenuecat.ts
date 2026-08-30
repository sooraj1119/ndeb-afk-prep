import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { Capacitor } from '@capacitor/core';
import { setIsPremium } from './storage';

// Replace these with your actual Public App API Keys from RevenueCat dashboard
const RC_APPLE_API_KEY = "test_MjHrqQSKbVtxlQruiZRbXVwXyta";
const RC_GOOGLE_API_KEY = "goog_TfLGwDtMnsNJMIhfJggjkOrlqJe";

// The entitlement identifier you configure in RevenueCat (e.g., 'pro')
const ENTITLEMENT_ID = 'pro';

export const initializeRevenueCat = async () => {
  if (Capacitor.getPlatform() === 'web') {
    console.warn("RevenueCat: Web platform detected. Using sandbox mode.");
    return;
  }

  try {
    await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    
    if (Capacitor.getPlatform() === 'ios') {
      await Purchases.configure({ apiKey: RC_APPLE_API_KEY });
    } else if (Capacitor.getPlatform() === 'android') {
      await Purchases.configure({ apiKey: RC_GOOGLE_API_KEY });
    }
    
    // Sync the initial customer info on boot
    await syncPremiumStatus();
  } catch (error) {
    console.error("RevenueCat Initialization Error:", error);
  }
};

export const syncPremiumStatus = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    return false; // Rely on local storage in pure web mode
  }
  
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    setIsPremium(isPro);
    return isPro;
  } catch (error) {
    console.error("Error fetching customer info:", error);
    return false;
  }
};

export const getOfferings = async () => {
  if (Capacitor.getPlatform() === 'web') {
    // Return mock offerings for web testing
    return {
      current: {
        availablePackages: [
          {
            identifier: '$rc_monthly',
            packageType: 'MONTHLY',
            product: {
              title: 'Pro Monthly (Web Sandbox)',
              description: 'Unlock all topics and analytics.',
              priceString: '$19.99',
              price: 19.99
            }
          },
          {
            identifier: '$rc_annual',
            packageType: 'ANNUAL',
            product: {
              title: 'Pro Annual (Web Sandbox)',
              description: 'Save 50% with an annual plan.',
              priceString: '$99.99',
              price: 99.99
            }
          }
        ]
      }
    };
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error("Error fetching offerings:", error);
    return null;
  }
};

export const purchasePackage = async (rcPackage: any): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    console.log("Simulating web purchase:", rcPackage);
    setIsPremium(true);
    return true;
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: rcPackage });
    const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    setIsPremium(isPro);
    return isPro;
  } catch (error: any) {
    if (error.code === 'USER_CANCELLED') {
      console.log("User cancelled the purchase");
    } else {
      console.error("Purchase error:", error);
    }
    return false;
  }
};

export const restorePurchases = async (): Promise<boolean> => {
  if (Capacitor.getPlatform() === 'web') {
    console.log("Simulating restore on web.");
    setIsPremium(true);
    return true;
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    const isPro = typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== "undefined";
    setIsPremium(isPro);
    return isPro;
  } catch (error) {
    console.error("Error restoring purchases:", error);
    return false;
  }
};