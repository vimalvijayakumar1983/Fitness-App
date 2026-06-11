/**
 * Purchases service — NATIVE (iOS/Android) via RevenueCat.
 *
 * Apple/Google require their in-app purchase for digital subscriptions, so the
 * mobile app uses RevenueCat instead of Stripe. Configure with your RevenueCat
 * public SDK keys:
 *   EXPO_PUBLIC_RC_IOS_KEY, EXPO_PUBLIC_RC_ANDROID_KEY
 *
 * Set up an Offering in the RevenueCat dashboard whose packages are identified
 * as `premium_month`, `premium_year`, `coached_month`, `coached_year`. The
 * RevenueCat → server webhook (POST /api/billing/revenuecat) grants the
 * entitlement so the backend reflects the purchase.
 */
import { Platform } from 'react-native';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  message?: string;
}

const IOS_KEY = process.env.EXPO_PUBLIC_RC_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY;
const apiKey = Platform.OS === 'ios' ? IOS_KEY : ANDROID_KEY;

export const iapAvailable = !!apiKey;

let configured = false;
export async function initPurchases(appUserId: string): Promise<void> {
  if (!apiKey || configured) return;
  try {
    Purchases.configure({ apiKey, appUserID: appUserId });
    configured = true;
  } catch {
    /* configuration failed — paywall falls back to a message */
  }
}

/** Finds the package matching `${tier}_${interval}` in the current offering. */
function findPackage(pkgs: PurchasesPackage[], tier: string, interval: string): PurchasesPackage | undefined {
  const id = `${tier}_${interval}`;
  return (
    pkgs.find((p) => p.identifier === id) ||
    pkgs.find((p) => p.product.identifier.includes(tier) && p.product.identifier.includes(interval))
  );
}

export async function purchaseTier(tier: 'premium' | 'coached', interval: 'month' | 'year'): Promise<PurchaseResult> {
  if (!iapAvailable) return { success: false, message: 'In-app purchase is not configured.' };
  try {
    if (!configured) Purchases.configure({ apiKey: apiKey! });
    const offerings = await Purchases.getOfferings();
    const pkgs = offerings.current?.availablePackages ?? [];
    const pkg = findPackage(pkgs, tier, interval);
    if (!pkg) return { success: false, message: 'This plan is not available right now.' };

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const active = Object.keys(customerInfo.entitlements.active);
    return { success: active.length > 0 };
  } catch (e: any) {
    if (e?.userCancelled) return { success: false, cancelled: true };
    return { success: false, message: e?.message || 'Purchase failed.' };
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!iapAvailable) return false;
  try {
    const info = await Purchases.restorePurchases();
    return Object.keys(info.entitlements.active).length > 0;
  } catch {
    return false;
  }
}
