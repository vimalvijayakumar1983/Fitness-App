import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Notifications wrapper. Local scheduled reminders work fully on device; remote
 * push uses an Expo push token registered to the backend. Everything no-ops on
 * web so the web build is unaffected.
 */

export interface ReminderPrefs {
  dailyLog: boolean;
  /** "HH:MM" 24h local time for the daily reminder. */
  dailyTime: string;
  glucose: boolean;
  weeklyReview: boolean;
}

export const DEFAULT_REMINDERS: ReminderPrefs = {
  dailyLog: true,
  dailyTime: '20:00',
  glucose: false,
  weeklyReview: true,
};

const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Show notifications while the app is foregrounded too.
if (isNative) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function ensurePermission(): Promise<boolean> {
  if (!isNative) return false;
  try {
    const current = await Notifications.getPermissionsAsync();
    if (current.granted) return true;
    const req = await Notifications.requestPermissionsAsync();
    return req.granted;
  } catch {
    return false;
  }
}

/** Registers for remote push and returns the Expo push token (native only). */
export async function registerForPush(): Promise<string | null> {
  if (!isNative) return null;
  if (!(await ensurePermission())) return null;
  try {
    const res = await Notifications.getExpoPushTokenAsync();
    return res.data ?? null;
  } catch {
    return null; // needs an EAS projectId in a real build; degrade gracefully
  }
}

function parseTime(t: string): { hour: number; minute: number } {
  const [h, m] = t.split(':');
  return { hour: Math.min(23, Number(h) || 20), minute: Math.min(59, Number(m) || 0) };
}

/** Cancels and re-schedules all local reminders from the user's preferences. */
export async function syncReminders(prefs: ReminderPrefs): Promise<void> {
  if (!isNative) return;
  if (!(await ensurePermission())) return;
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    const { hour, minute } = parseTime(prefs.dailyTime);

    // Legacy calendar-trigger shape (expo-notifications SDK 51).
    const daily = (h: number, m: number) => ({ hour: h, minute: m, repeats: true }) as any;
    const weekly = (weekday: number, h: number, m: number) => ({ weekday, hour: h, minute: m, repeats: true }) as any;

    if (prefs.dailyLog) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Al Zaabi Health', body: "Don't forget to log today — meals, movement and how you feel." },
        trigger: daily(hour, minute),
      });
    }
    if (prefs.glucose) {
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Fasting glucose 🩸', body: 'Log your fasting glucose to track your trend.' },
        trigger: daily(7, 30),
      });
    }
    if (prefs.weeklyReview) {
      // Sunday morning weekly review (weekday: 1 = Sunday).
      await Notifications.scheduleNotificationAsync({
        content: { title: 'Your week in review 📈', body: 'See your trends, wins and insights from the past week.' },
        trigger: weekly(1, 9, 0),
      });
    }
  } catch {
    /* scheduling unsupported in this environment */
  }
}

export const pushSupported = isNative;
