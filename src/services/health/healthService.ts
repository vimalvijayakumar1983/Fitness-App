import { Platform } from 'react-native';
import type { ExerciseEntry, SleepEntry } from '@/models/types';

/**
 * Health-platform integration layer.
 *
 * This is the single seam between the app and device health data. The rest of
 * the app talks to `healthService` and never to Apple HealthKit / Google Fit
 * directly, so we can swap real native modules in without touching the UI.
 *
 * Real wiring (next step):
 *  - iOS:     `react-native-health` (HealthKit) — requires a dev/EAS build.
 *  - Android: `react-native-health-connect` (Health Connect / Google Fit).
 *
 * Until those native modules are added, this provides a mock implementation so
 * the exercise & sleep screens are fully functional in Expo Go and on web.
 */

export interface HealthPermissions {
  steps: boolean;
  workouts: boolean;
  heartRate: boolean;
  sleep: boolean;
}

export interface HealthProvider {
  /** Whether this provider can run on the current device. */
  isAvailable(): Promise<boolean>;
  /** Prompts the user for the permissions we need. */
  requestPermissions(): Promise<HealthPermissions>;
  /** Pulls exercise/workout sessions for a date range. */
  getExercises(startISO: string, endISO: string): Promise<ExerciseEntry[]>;
  /** Pulls sleep sessions for a date range. */
  getSleep(startISO: string, endISO: string): Promise<SleepEntry[]>;
  /** Human-readable provider name for the UI. */
  readonly name: string;
}

/** The provider we'd select based on platform once native modules are wired. */
export function activeProviderName(): string {
  if (Platform.OS === 'ios') return 'Apple Health';
  if (Platform.OS === 'android') return 'Health Connect';
  return 'Mock Health (web/dev)';
}

/**
 * Mock provider — returns plausible smartwatch-style data so the UI works
 * end-to-end before native HealthKit / Health Connect modules are installed.
 */
class MockHealthProvider implements HealthProvider {
  readonly name = activeProviderName();

  async isAvailable(): Promise<boolean> {
    return true;
  }

  async requestPermissions(): Promise<HealthPermissions> {
    return { steps: true, workouts: true, heartRate: true, sleep: true };
  }

  async getExercises(startISO: string): Promise<ExerciseEntry[]> {
    const now = new Date().toISOString();
    return [
      {
        id: `mock-ex-${startISO}`,
        date: startISO,
        loggedAt: now,
        activity: 'Walking',
        durationMinutes: 38,
        caloriesBurned: 210,
        steps: 7421,
        avgHeartRate: 102,
        source: 'apple_health',
      },
    ];
  }

  async getSleep(startISO: string): Promise<SleepEntry[]> {
    const now = new Date().toISOString();
    return [
      {
        id: `mock-sleep-${startISO}`,
        date: startISO,
        loggedAt: now,
        bedtime: `${startISO}T23:10:00.000Z`,
        wakeTime: `${startISO}T07:05:00.000Z`,
        durationMinutes: 7 * 60 + 25,
        quality: 4,
        source: 'apple_health',
      },
    ];
  }
}

let provider: HealthProvider = new MockHealthProvider();

// On Android, prefer the real Health Connect reader when the native module is
// present (dev/EAS build). Falls back to the mock in Expo Go / web / iOS.
try {
  // Metro resolves healthConnect.native.ts on device, the web stub otherwise.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { makeHealthConnectProvider } = require('./healthConnect');
  const hc = makeHealthConnectProvider?.();
  if (hc) provider = hc;
} catch {
  /* native module unavailable — keep the mock provider */
}

/** Allows real providers to be injected once native modules are added. */
export function setHealthProvider(next: HealthProvider): void {
  provider = next;
}

export function getHealthProvider(): HealthProvider {
  return provider;
}
