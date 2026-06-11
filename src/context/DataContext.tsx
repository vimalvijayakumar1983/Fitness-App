import { Platform } from 'react-native';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
  WeightEntry,
  HealthAssessment,
  LabReport,
  GlucoseReading,
  FamilyMember,
  ReminderPrefs,
} from '@/models/types';
import { loadAppData, saveAppData } from '@/services/storage';
import { getHealthProvider } from '@/services/health/healthService';
import { api, fetchCmsContent, CmsContent, AssignedPlan, Subscription } from '@/services/api';
import { syncReminders, registerForPush } from '@/services/notifications';
import { initPurchases } from '@/services/purchases';
import { useAuth } from '@/context/AuthContext';
import { makeId, todayISO } from '@/utils/date';

interface DataContextValue {
  data: AppData;
  loading: boolean;
  /** Admin-managed content fetched from the backend (merged over bundled data). */
  cms: CmsContent;
  /** True while a cloud sync push/pull is in flight (signed-in users). */
  syncing: boolean;
  /** A plan the coach assigned to this customer from the back office, if any. */
  assignedPlan: AssignedPlan | null;
  /** Subscription/entitlement for the signed-in user. */
  subscription: Subscription | null;
  isPremium: boolean;
  refreshSubscription: () => void;

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
  addWeight: (weightKg: number, bodyFatPct?: number) => void;
  setAssessment: (a: HealthAssessment) => void;
  addLab: (report: Omit<LabReport, 'id' | 'createdAt'>) => void;
  /** Add one glucose reading. */
  addGlucose: (reading: Omit<GlucoseReading, 'id' | 'loggedAt'>) => void;
  /** Add many readings at once (e.g. a CGM sync). */
  addGlucoseBatch: (readings: Omit<GlucoseReading, 'id'>[]) => void;
  upsertFamilyMember: (member: FamilyMember) => void;
  removeFamilyMember: (id: string) => void;
  setReminders: (prefs: ReminderPrefs) => void;

  removeEntry: (
    kind: 'meals' | 'exercises' | 'moods' | 'sleep' | 'water' | 'weights' | 'labs' | 'glucose',
    id: string,
  ) => void;

  /** Pulls today's exercise & sleep from the configured health provider. */
  syncHealthData: () => Promise<void>;
}

const DataContext = createContext<DataContextValue | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const [data, setData] = useState<AppData>(emptyAppData);
  const [loading, setLoading] = useState(true);
  const [cms, setCms] = useState<CmsContent>({ foods: [], exercises: [], recipes: [] });
  const [syncing, setSyncing] = useState(false);
  const [assignedPlan, setAssignedPlan] = useState<AssignedPlan | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const skipPush = useRef(false);
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pull admin-managed content from the backend (best-effort; offline-safe).
  useEffect(() => {
    fetchCmsContent().then(setCms).catch(() => {});
  }, []);

  const refreshSubscription = useCallback(() => {
    if (!token) {
      setSubscription(null);
      return;
    }
    api.getSubscription().then(setSubscription).catch(() => {});
  }, [token]);

  // Pull the coach-assigned plan and subscription when signed in.
  useEffect(() => {
    if (!token) {
      setAssignedPlan(null);
      setSubscription(null);
      return;
    }
    api.getMyPlan().then((r) => setAssignedPlan(r.plan)).catch(() => {});
    api.getSubscription().then(setSubscription).catch(() => {});
  }, [token]);

  // On sign-in: pull the cloud copy of app-owned data (or seed it from local).
  useEffect(() => {
    if (!token || loading) return;
    let cancelled = false;
    setSyncing(true);
    api
      .getSync()
      .then(async (res) => {
        if (cancelled) return;
        if (res.data) {
          skipPush.current = true;
          setData({ ...emptyAppData, ...(res.data as AppData) });
        } else {
          await api.putSync(data); // first device — seed server with local data
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setSyncing(false);
      });
    return () => {
      cancelled = true;
    };
    // Only re-run when auth changes, not on every data edit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, loading]);

  // Push local changes to the cloud (debounced) while signed in.
  useEffect(() => {
    if (!token || loading) return;
    if (skipPush.current) {
      skipPush.current = false;
      return;
    }
    if (pushTimer.current) clearTimeout(pushTimer.current);
    pushTimer.current = setTimeout(() => {
      setSyncing(true);
      api.putSync(data).catch(() => {}).finally(() => setSyncing(false));
    }, 900);
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current);
    };
  }, [data, token, loading]);

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

  // Schedule local reminders once after load (native only; no-op on web).
  const remindersSynced = useRef(false);
  useEffect(() => {
    if (loading || remindersSynced.current) return;
    remindersSynced.current = true;
    if (data.reminders) void syncReminders(data.reminders);
  }, [loading, data.reminders]);

  // Register for remote push + init in-app purchases when signed in (native).
  useEffect(() => {
    if (!token || !user) return;
    registerForPush().then((pt) => {
      if (pt) api.registerPushToken(pt, Platform.OS).catch(() => {});
    });
    initPurchases(user.id).catch(() => {});
  }, [token, user]);

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

  const addWeight = useCallback((weightKg: number, bodyFatPct?: number) => {
    setData((prev) => ({
      ...prev,
      weights: [
        { id: makeId(), date: todayISO(), loggedAt: new Date().toISOString(), weightKg, bodyFatPct },
        ...prev.weights,
      ],
      profile: { ...prev.profile, weightKg },
    }));
  }, []);

  const setAssessment = useCallback((a: HealthAssessment) => {
    setData((prev) => ({ ...prev, assessment: a }));
  }, []);

  const addLab = useCallback((report: Omit<LabReport, 'id' | 'createdAt'>) => {
    setData((prev) => ({
      ...prev,
      labs: [{ ...report, id: makeId(), createdAt: new Date().toISOString() }, ...prev.labs],
    }));
  }, []);

  const addGlucose = useCallback((reading: Omit<GlucoseReading, 'id' | 'loggedAt'>) => {
    setData((prev) => ({
      ...prev,
      glucose: [{ ...reading, id: makeId(), loggedAt: new Date().toISOString() }, ...prev.glucose],
    }));
  }, []);

  const addGlucoseBatch = useCallback((readings: Omit<GlucoseReading, 'id'>[]) => {
    setData((prev) => ({
      ...prev,
      glucose: [...readings.map((r) => ({ ...r, id: makeId() })), ...prev.glucose],
    }));
  }, []);

  const upsertFamilyMember = useCallback((member: FamilyMember) => {
    setData((prev) => {
      const exists = prev.family.some((m) => m.id === member.id);
      return {
        ...prev,
        family: exists ? prev.family.map((m) => (m.id === member.id ? member : m)) : [member, ...prev.family],
      };
    });
  }, []);

  const removeFamilyMember = useCallback((id: string) => {
    setData((prev) => ({ ...prev, family: prev.family.filter((m) => m.id !== id) }));
  }, []);

  const setReminders = useCallback((prefs: ReminderPrefs) => {
    setData((prev) => ({ ...prev, reminders: prefs }));
    void syncReminders(prefs);
  }, []);

  const removeEntry = useCallback(
    (kind: 'meals' | 'exercises' | 'moods' | 'sleep' | 'water' | 'weights' | 'labs' | 'glucose', id: string) => {
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
      syncing,
      assignedPlan,
      subscription,
      isPremium: !!subscription?.isPremium,
      refreshSubscription,
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
      addWeight,
      setAssessment,
      addLab,
      addGlucose,
      addGlucoseBatch,
      upsertFamilyMember,
      removeFamilyMember,
      setReminders,
      removeEntry,
      syncHealthData,
    }),
    [
      data,
      loading,
      cms,
      syncing,
      assignedPlan,
      subscription,
      refreshSubscription,
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
      addWeight,
      setAssessment,
      addLab,
      addGlucose,
      addGlucoseBatch,
      upsertFamilyMember,
      removeFamilyMember,
      setReminders,
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
