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
  DayPlan,
  emptyAppData,
  ExerciseDef,
  ExerciseEntry,
  Food,
  MealEntry,
  MoodEntry,
  Profile,
  SleepEntry,
} from '@/models/types';
import { loadAppData, saveAppData } from '@/services/storage';
import { getHealthProvider } from '@/services/health/healthService';
import { fetchCmsContent, CmsContent } from '@/services/api';
import { makeId, todayISO } from '@/utils/date';

interface DataContextValue {
  data: AppData;
  loading: boolean;
  /** Admin-managed content fetched from the backend (merged over bundled data). */
  cms: CmsContent;

  addMeal: (meal: Omit<MealEntry, 'id' | 'loggedAt'>) => void;
  addExercise: (exercise: Omit<ExerciseEntry, 'id' | 'loggedAt'>) => void;
  addMood: (mood: Omit<MoodEntry, 'id' | 'loggedAt'>) => void;
  addSleep: (sleep: Omit<SleepEntry, 'id' | 'loggedAt'>) => void;
  addWater: (ml: number, date?: string) => void;

  updateProfile: (patch: Partial<Profile>) => void;
  toggleFavoriteFood: (foodId: string) => void;

  /** Create or edit a food (stored as a custom food; overrides bundled by id). */
  upsertCustomFood: (food: Food) => void;
  deleteCustomFood: (foodId: string) => void;
  upsertCustomExercise: (exercise: ExerciseDef) => void;
  deleteCustomExercise: (exerciseId: string) => void;
  setPlan: (plan: DayPlan | null) => void;

  removeEntry: (
    kind: 'meals' | 'exercises' | 'moods' | 'sleep' | 'water',
    id: string,
  ) => void;

  /** Pulls today's exercise & sleep from the configured health provider. */
  syncHealthData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<AppData>(emptyAppData);
  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<CmsContent>({ foods: [], exercises: [], recipes: [] });

  // Pull admin-managed content from the backend (best-effort; offline-safe).
  useEffect(() => {
    fetchCmsContent().then(setCms).catch(() => {});
  }, []);

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

  const addWater = useCallback((ml: number, date: string = todayISO()) => {
    setData((prev) => ({
      ...prev,
      water: [
        { id: makeId(), date, loggedAt: new Date().toISOString(), ml },
        ...prev.water,
      ],
    }));
  }, []);

  const updateProfile = useCallback((patch: Partial<Profile>) => {
    setData((prev) => ({ ...prev, profile: { ...prev.profile, ...patch } }));
  }, []);

  const toggleFavoriteFood = useCallback((foodId: string) => {
    setData((prev) => ({
      ...prev,
      favoriteFoodIds: prev.favoriteFoodIds.includes(foodId)
        ? prev.favoriteFoodIds.filter((id) => id !== foodId)
        : [foodId, ...prev.favoriteFoodIds],
    }));
  }, []);

  const upsertCustomFood = useCallback((food: Food) => {
    setData((prev) => {
      const exists = prev.customFoods.some((f) => f.id === food.id);
      return {
        ...prev,
        customFoods: exists
          ? prev.customFoods.map((f) => (f.id === food.id ? food : f))
          : [food, ...prev.customFoods],
      };
    });
  }, []);

  const deleteCustomFood = useCallback((foodId: string) => {
    setData((prev) => ({
      ...prev,
      customFoods: prev.customFoods.filter((f) => f.id !== foodId),
      favoriteFoodIds: prev.favoriteFoodIds.filter((id) => id !== foodId),
    }));
  }, []);

  const upsertCustomExercise = useCallback((exercise: ExerciseDef) => {
    setData((prev) => {
      const exists = prev.customExercises.some((e) => e.id === exercise.id);
      return {
        ...prev,
        customExercises: exists
          ? prev.customExercises.map((e) => (e.id === exercise.id ? exercise : e))
          : [exercise, ...prev.customExercises],
      };
    });
  }, []);

  const deleteCustomExercise = useCallback((exerciseId: string) => {
    setData((prev) => ({
      ...prev,
      customExercises: prev.customExercises.filter((e) => e.id !== exerciseId),
    }));
  }, []);

  const setPlan = useCallback((plan: DayPlan | null) => {
    setData((prev) => ({ ...prev, plan }));
  }, []);

  const removeEntry = useCallback(
    (kind: 'meals' | 'exercises' | 'moods' | 'sleep' | 'water', id: string) => {
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
      cms,
      addMeal,
      addExercise,
      addMood,
      addSleep,
      addWater,
      updateProfile,
      toggleFavoriteFood,
      upsertCustomFood,
      deleteCustomFood,
      upsertCustomExercise,
      deleteCustomExercise,
      setPlan,
      removeEntry,
      syncHealthData,
    }),
    [
      data,
      loading,
      cms,
      addMeal,
      addExercise,
      addMood,
      addSleep,
      addWater,
      updateProfile,
      toggleFavoriteFood,
      upsertCustomFood,
      deleteCustomFood,
      upsertCustomExercise,
      deleteCustomExercise,
      setPlan,
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
