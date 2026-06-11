/**
 * Purchases service — WEB / default (no-op).
 *
 * In-app purchases only exist in the native iOS/Android builds; this variant is
 * picked by Metro on web. The native implementation lives in
 * `purchases.native.ts` (RevenueCat). On web, subscriptions go through Stripe
 * (see PaywallModal / services/api), so these are safe no-ops.
 */
export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  message?: string;
}

/** Whether native in-app purchase is available & configured. */
export const iapAvailable = false;

export async function initPurchases(_appUserId: string): Promise<void> {
  /* no-op on web */
}

export async function purchaseTier(_tier: 'premium' | 'coached', _interval: 'month' | 'year'): Promise<PurchaseResult> {
  return { success: false, message: 'In-app purchase is available in the mobile app.' };
}

export async function restorePurchases(): Promise<boolean> {
  return false;
}
