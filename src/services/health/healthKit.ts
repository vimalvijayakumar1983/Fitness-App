import type { HealthProvider } from './healthService';

/**
 * Web / default stub — Apple HealthKit is iOS-only. Metro picks the `.native.ts`
 * variant on device; this keeps the web bundle free of the native module.
 */
export function makeHealthKitProvider(): HealthProvider | null {
  return null;
}
