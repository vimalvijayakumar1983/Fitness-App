import { Platform } from 'react-native';
import {
  initialize,
  requestPermission,
  readRecords,
  getSdkStatus,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';
import type { ExerciseEntry, SleepEntry } from '@/models/types';
import type { HealthProvider, HealthPermissions } from './healthService';

/**
 * Real Android Health Connect reader. Requires a dev/EAS build (the native
 * module isn't in Expo Go). Reads exercise sessions, steps, heart rate and
 * sleep, mapping them into the app's entry shapes. iOS uses HealthKit instead,
 * so this provider reports unavailable there.
 */
const range = (startISO: string, endISO: string) => ({
  timeRangeFilter: {
    operator: 'between' as const,
    startTime: new Date(`${startISO}T00:00:00.000Z`).toISOString(),
    endTime: new Date(`${endISO}T23:59:59.999Z`).toISOString(),
  },
});

class HealthConnectProvider implements HealthProvider {
  readonly name = 'Health Connect';
  private ready = false;

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    try {
      return (await getSdkStatus()) === SdkAvailabilityStatus.SDK_AVAILABLE;
    } catch {
      return false;
    }
  }

  private async ensure(): Promise<boolean> {
    if (this.ready) return true;
    try {
      this.ready = await initialize();
      return this.ready;
    } catch {
      return false;
    }
  }

  async requestPermissions(): Promise<HealthPermissions> {
    const ok = await this.ensure();
    if (!ok) return { steps: false, workouts: false, heartRate: false, sleep: false };
    try {
      await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'ExerciseSession' },
        { accessType: 'read', recordType: 'HeartRate' },
        { accessType: 'read', recordType: 'SleepSession' },
        { accessType: 'read', recordType: 'ActiveCaloriesBurned' },
      ]);
    } catch {
      /* user declined some */
    }
    return { steps: true, workouts: true, heartRate: true, sleep: true };
  }

  async getExercises(startISO: string, endISO: string): Promise<ExerciseEntry[]> {
    if (!(await this.ensure())) return [];
    const out: ExerciseEntry[] = [];
    try {
      const filter = range(startISO, endISO);
      const [sessions, steps, calories, heart] = await Promise.all([
        readRecords('ExerciseSession', filter).catch(() => ({ records: [] as any[] })),
        readRecords('Steps', filter).catch(() => ({ records: [] as any[] })),
        readRecords('ActiveCaloriesBurned', filter).catch(() => ({ records: [] as any[] })),
        readRecords('HeartRate', filter).catch(() => ({ records: [] as any[] })),
      ]);

      const totalSteps = (steps.records as any[]).reduce((a, r) => a + (r.count ?? 0), 0);
      const totalCals = (calories.records as any[]).reduce((a, r) => a + (r.energy?.inKilocalories ?? 0), 0);
      const hrSamples = (heart.records as any[]).flatMap((r) => (r.samples ?? []).map((s: any) => s.beatsPerMinute));
      const avgHr = hrSamples.length ? Math.round(hrSamples.reduce((a: number, b: number) => a + b, 0) / hrSamples.length) : undefined;

      for (const s of sessions.records as any[]) {
        const mins = Math.max(0, Math.round((Date.parse(s.endTime) - Date.parse(s.startTime)) / 60000));
        out.push({
          id: s.metadata?.id || `hc-ex-${s.startTime}`,
          date: String(s.startTime).slice(0, 10),
          loggedAt: new Date().toISOString(),
          activity: s.title || 'Workout',
          durationMinutes: mins,
          caloriesBurned: totalCals ? Math.round(totalCals) : undefined,
          avgHeartRate: avgHr,
          source: 'google_fit',
        });
      }

      // If there were steps but no logged session, surface a daily steps entry.
      if (totalSteps > 0 && out.length === 0) {
        out.push({
          id: `hc-steps-${startISO}`,
          date: startISO,
          loggedAt: new Date().toISOString(),
          activity: 'Walking',
          durationMinutes: 0,
          steps: totalSteps,
          avgHeartRate: avgHr,
          source: 'google_fit',
        });
      } else if (out.length > 0 && totalSteps > 0) {
        out[0].steps = totalSteps;
      }
    } catch {
      /* read failed */
    }
    return out;
  }

  async getSleep(startISO: string, endISO: string): Promise<SleepEntry[]> {
    if (!(await this.ensure())) return [];
    try {
      const { records } = await readRecords('SleepSession', range(startISO, endISO));
      return (records as any[]).map((s) => {
        const mins = Math.max(0, Math.round((Date.parse(s.endTime) - Date.parse(s.startTime)) / 60000));
        return {
          id: s.metadata?.id || `hc-sleep-${s.startTime}`,
          date: String(s.endTime).slice(0, 10),
          loggedAt: new Date().toISOString(),
          bedtime: s.startTime,
          wakeTime: s.endTime,
          durationMinutes: mins,
          quality: (mins >= 420 && mins <= 540 ? 4 : 3) as 1 | 2 | 3 | 4 | 5,
          source: 'google_fit',
        };
      });
    } catch {
      return [];
    }
  }
}

export function makeHealthConnectProvider(): HealthProvider | null {
  if (Platform.OS !== 'android') return null;
  return new HealthConnectProvider();
}
