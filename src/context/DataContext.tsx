import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  AppData,
  emptyAppData,
  ExerciseEntry,
  MealEntry,
  MoodEntry,
  SleepEntry,
} from '@/models/types';
import { loadAppData, saveAppData } from '@/services/storage';
import { getHealthProvider } from '@/services/health/healthService';
import { makeId, todayISO } from '@/utils/date';

interface DataContextValue {
  data: AppData;
  loading: boolean;

  addMeal: (meal: Omit<MealEntry, 'id' | 'loggedAt'>) => void;
  addExercise: (exercise: Omit<ExerciseEntry, 'id' | 'loggedAt'>) => void;
  addMood: (mood: Omit<MoodEntry, 'id' | 'loggedAt'>) => void;
  addSleep: (sleep: Omit<SleepEntry, 'id' | 'loggedAt'>) => void;

  removeEntry: (
    kind: 'meals' | 'exercises' | 'moods' | 'sleep',
    id: string,
  ) => void;

  /** Pulls today's exercise & sleep from the configured health provider. */
  syncHealthData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyAppData);
  const [loading, setLoading] = useState(true);

  // Load persisted data once on mount.
  useEffect(() => {
    let mounted = true;
    loadAppData().then((loaded) => {
      if (mounted) {
        setData(loaded);
        setLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Persist whenever data changes (after initial load).
  useEffect(() => {
    if (!loading) void saveAppData(data);
  }, [data, loading]);

  const addMeal = useCallback((meal: Omit<MealEntry, 'id' | 'loggedAt'>) => {
    setData((prev) => ({
      ...prev,
      meals: [
        { ...meal, id: makeId(), loggedAt: new Date().toISOString() },
        ...prev.meals,
      ],
    }));
  }, []);

  const addExercise = useCallback(
    (exercise: Omit<ExerciseEntry, 'id' | 'loggedAt'>) => {
      setData((prev) => ({
        ...prev,
        exercises: [
          { ...exercise, id: makeId(), loggedAt: new Date().toISOString() },
          ...prev.exercises,
        ],
      }));
    },
    [],
  );

  const addMood = useCallback((mood: Omit<MoodEntry, 'id' | 'loggedAt'>) => {
    setData((prev) => ({
      ...prev,
      moods: [
        { ...mood, id: makeId(), loggedAt: new Date().toISOString() },
        ...prev.moods,
      ],
    }));
  }, []);

  const addSleep = useCallback((sleep: Omit<SleepEntry, 'id' | 'loggedAt'>) => {
    setData((prev) => ({
      ...prev,
      sleep: [
        { ...sleep, id: makeId(), loggedAt: new Date().toISOString() },
        ...prev.sleep,
      ],
    }));
  }, []);

  const removeEntry = useCallback(
    (kind: 'meals' | 'exercises' | 'moods' | 'sleep', id: string) => {
      setData((prev) => ({
        ...prev,
        [kind]: prev[kind].filter((entry) => entry.id !== id),
      }));
    },
    [],
  );

  const syncHealthData = useCallback(async () => {
    const provider = getHealthProvider();
    if (!(await provider.isAvailable())) return;
    await provider.requestPermissions();

    const today = todayISO();
    const [exercises, sleep] = await Promise.all([
      provider.getExercises(today, today),
      provider.getSleep(today, today),
    ]);

    setData((prev) => {
      // De-dupe by id so repeated syncs don't pile up.
      const existingExerciseIds = new Set(prev.exercises.map((e) => e.id));
      const existingSleepIds = new Set(prev.sleep.map((s) => s.id));
      return {
        ...prev,
        exercises: [
          ...exercises.filter((e) => !existingExerciseIds.has(e.id)),
          ...prev.exercises,
        ],
        sleep: [
          ...sleep.filter((s) => !existingSleepIds.has(s.id)),
          ...prev.sleep,
        ],
      };
    });
  }, []);

  const value = useMemo<DataContextValue>(
    () => ({
      data,
      loading,
      addMeal,
      addExercise,
      addMood,
      addSleep,
      removeEntry,
      syncHealthData,
    }),
    [
      data,
      loading,
      addMeal,
      addExercise,
      addMood,
      addSleep,
      removeEntry,
      syncHealthData,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData(): DataContextValue {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within a DataProvider');
  return ctx;
}
