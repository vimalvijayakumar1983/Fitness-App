import type { HealthProvider } from './healthService';

/**
 * Web / default stub — Health Connect is Android-only. Metro picks the
 * `.native.ts` variant on device; this keeps the web bundle free of the native
 * module.
 */
export function makeHealthConnectProvider(): HealthProvider | null {
  return null;
}
