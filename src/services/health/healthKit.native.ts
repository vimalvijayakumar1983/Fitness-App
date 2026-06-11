import { Platform } from 'react-native';
import AppleHealthKit, { HealthInputOptions, HealthKitPermissions } from 'react-native-health';
import type { ExerciseEntry, SleepEntry } from '@/models/types';
import type { HealthProvider, HealthPermissions } from './healthService';

/**
 * Real iOS Apple HealthKit reader (react-native-health). Requires a dev/EAS
 * build with the HealthKit entitlement (not Expo Go). Reads workouts, steps,
 * heart rate and sleep, mapping them to the app's entry shapes. On Android the
 * Health Connect provider is used instead, so this reports unavailable there.
 */
const P = AppleHealthKit.Constants.Permissions;

const PERMS: HealthKitPermissions = {
  permissions: {
    read: [P.Steps, P.StepCount, P.Workout, P.SleepAnalysis, P.HeartRate, P.ActiveEnergyBurned],
    write: [],
  },
};

const promisify = <T>(fn: (cb: (err: any, res: T) => void) => void): Promise<T> =>
  new Promise((resolve, reject) => fn((err, res) => (err ? reject(err) : resolve(res))));

class HealthKitProvider implements HealthProvider {
  readonly name = 'Apple Health';
  private ready = false;

  async isAvailable(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
      return await promisify<boolean>((cb) => AppleHealthKit.isAvailable((err, ok) => cb(err, ok)));
    } catch {
      return false;
    }
  }

  private async ensure(): Promise<boolean> {
    if (this.ready) return true;
    try {
      await promisify<void>((cb) => AppleHealthKit.initHealthKit(PERMS, (err) => cb(err, undefined as any)));
      this.ready = true;
    } catch {
      this.ready = false;
    }
    return this.ready;
  }

  async requestPermissions(): Promise<HealthPermissions> {
    const ok = await this.ensure();
    return { steps: ok, workouts: ok, heartRate: ok, sleep: ok };
  }

  async getExercises(startISO: string, endISO: string): Promise<ExerciseEntry[]> {
    if (!(await this.ensure())) return [];
    const opts: HealthInputOptions = {
      startDate: new Date(`${startISO}T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${endISO}T23:59:59.999Z`).toISOString(),
    };
    const out: ExerciseEntry[] = [];
    try {
      const [workouts, steps, heart] = await Promise.all([
        promisify<any[]>((cb) => AppleHealthKit.getAnchoredWorkouts(opts as any, (err, r: any) => cb(err, r?.data ?? r ?? []))).catch(() => []),
        promisify<any[]>((cb) => AppleHealthKit.getDailyStepCountSamples(opts as any, (err, r) => cb(err, r ?? []))).catch(() => []),
        promisify<any[]>((cb) => AppleHealthKit.getHeartRateSamples(opts as any, (err, r) => cb(err, r ?? []))).catch(() => []),
      ]);

      const totalSteps = (steps as any[]).reduce((a, s) => a + (s.value ?? 0), 0);
      const hr = (heart as any[]).map((h) => h.value).filter((v) => typeof v === 'number');
      const avgHr = hr.length ? Math.round(hr.reduce((a: number, b: number) => a + b, 0) / hr.length) : undefined;

      for (const w of workouts as any[]) {
        const start = w.start || w.startDate;
        const end = w.end || w.endDate;
        const mins = start && end ? Math.max(0, Math.round((Date.parse(end) - Date.parse(start)) / 60000)) : 0;
        out.push({
          id: w.id || `hk-ex-${start}`,
          date: String(start).slice(0, 10),
          loggedAt: new Date().toISOString(),
          activity: w.activityName || 'Workout',
          durationMinutes: mins,
          caloriesBurned: w.calories ? Math.round(w.calories) : undefined,
          avgHeartRate: avgHr,
          source: 'apple_health',
        });
      }

      if (totalSteps > 0 && out.length === 0) {
        out.push({
          id: `hk-steps-${startISO}`,
          date: startISO,
          loggedAt: new Date().toISOString(),
          activity: 'Walking',
          durationMinutes: 0,
          steps: Math.round(totalSteps),
          avgHeartRate: avgHr,
          source: 'apple_health',
        });
      } else if (out.length > 0 && totalSteps > 0) {
        out[0].steps = Math.round(totalSteps);
      }
    } catch {
      /* read failed */
    }
    return out;
  }

  async getSleep(startISO: string, endISO: string): Promise<SleepEntry[]> {
    if (!(await this.ensure())) return [];
    const opts: HealthInputOptions = {
      startDate: new Date(`${startISO}T00:00:00.000Z`).toISOString(),
      endDate: new Date(`${endISO}T23:59:59.999Z`).toISOString(),
    };
    try {
      const samples = await promisify<any[]>((cb) => AppleHealthKit.getSleepSamples(opts as any, (err, r) => cb(err, r ?? [])));
      // Count only asleep segments; collapse into one night for the range.
      const asleep = (samples as any[]).filter((s) => /asleep/i.test(String(s.value)));
      const segs = asleep.length ? asleep : (samples as any[]);
      if (!segs.length) return [];
      const mins = segs.reduce((a, s) => a + Math.max(0, (Date.parse(s.endDate) - Date.parse(s.startDate)) / 60000), 0);
      const bedtime = segs.reduce((min, s) => (Date.parse(s.startDate) < Date.parse(min) ? s.startDate : min), segs[0].startDate);
      const wake = segs.reduce((max, s) => (Date.parse(s.endDate) > Date.parse(max) ? s.endDate : max), segs[0].endDate);
      const total = Math.round(mins);
      return [{
        id: `hk-sleep-${startISO}`,
        date: String(wake).slice(0, 10),
        loggedAt: new Date().toISOString(),
        bedtime, wakeTime: wake,
        durationMinutes: total,
        quality: (total >= 420 && total <= 540 ? 4 : 3) as 1 | 2 | 3 | 4 | 5,
        source: 'apple_health',
      }];
    } catch {
      return [];
    }
  }
}

export function makeHealthKitProvider(): HealthProvider | null {
  if (Platform.OS !== 'ios') return null;
  return new HealthKitProvider();
}
