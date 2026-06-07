import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppData, emptyAppData } from '@/models/types';

const STORAGE_KEY = 'fitnessapp:data:v1';

/**
 * Thin persistence layer over AsyncStorage. The whole app dataset is small
 * enough to load/save as a single JSON blob for now; if it grows we can move
 * to SQLite (expo-sqlite) behind this same interface.
 */
export async function loadAppData(): Promise<AppData> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyAppData;
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge with defaults so older saves missing a key don't crash.
    return { ...emptyAppData, ...parsed };
  } catch (err) {
    console.warn('Failed to load app data, starting fresh.', err);
    return emptyAppData;
  }
}

export async function saveAppData(data: AppData): Promise<void> {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.warn('Failed to save app data.', err);
  }
}

export async function clearAppData(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
