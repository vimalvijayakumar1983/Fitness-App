import { ExerciseDef } from '@/models/types';
import { mergeById } from '@/utils/merge';

/**
 * Offline exercise catalog: gym/strength movements grouped by muscle, plus
 * bodyweight, cardio, sports, and flexibility. `met` (metabolic equivalent)
 * drives calorie estimates: kcal/min = met * 3.5 * weightKg / 200.
 * Users extend/override this with custom exercises.
 */
export const EXERCISES: ExerciseDef[] = [
  // ── Chest ──────────────────────────────────────────────────────────
  { id: 'x_bench_press', name: 'Barbell bench press', category: 'strength', muscle: 'chest', equipment: 'Barbell', met: 6 },
  { id: 'x_incline_bench', name: 'Incline bench press', category: 'strength', muscle: 'chest', equipment: 'Barbell', met: 6 },
  { id: 'x_decline_bench', name: 'Decline bench press', category: 'strength', muscle: 'chest', equipment: 'Barbell', met: 6 },
  { id: 'x_db_press', name: 'Dumbbell chest press', category: 'strength', muscle: 'chest', equipment: 'Dumbbell', met: 5 },
  { id: 'x_incline_db_press', name: 'Incline dumbbell press', category: 'strength', muscle: 'chest', equipment: 'Dumbbell', met: 5 },
  { id: 'x_chest_fly', name: 'Dumbbell chest fly', category: 'strength', muscle: 'chest', equipment: 'Dumbbell', met: 4 },
  { id: 'x_cable_crossover', name: 'Cable crossover', category: 'strength', muscle: 'chest', equipment: 'Cable', met: 4 },
  { id: 'x_pec_deck', name: 'Pec deck machine', category: 'strength', muscle: 'chest', equipment: 'Machine', met: 4 },
  { id: 'x_push_up', name: 'Push-up', category: 'bodyweight', muscle: 'chest', equipment: 'Bodyweight', met: 5 },

  // ── Back ───────────────────────────────────────────────────────────
  { id: 'x_deadlift', name: 'Deadlift', category: 'strength', muscle: 'back', equipment: 'Barbell', met: 6 },
  { id: 'x_barbell_row', name: 'Barbell row', category: 'strength', muscle: 'back', equipment: 'Barbell', met: 5 },
  { id: 'x_pull_up', name: 'Pull-up', category: 'bodyweight', muscle: 'back', equipment: 'Bodyweight', met: 6 },
  { id: 'x_chin_up', name: 'Chin-up', category: 'bodyweight', muscle: 'back', equipment: 'Bodyweight', met: 6 },
  { id: 'x_lat_pulldown', name: 'Lat pulldown', category: 'strength', muscle: 'back', equipment: 'Cable', met: 5 },
  { id: 'x_seated_row', name: 'Seated cable row', category: 'strength', muscle: 'back', equipment: 'Cable', met: 5 },
  { id: 'x_tbar_row', name: 'T-bar row', category: 'strength', muscle: 'back', equipment: 'Barbell', met: 5 },
  { id: 'x_db_row', name: 'Dumbbell row', category: 'strength', muscle: 'back', equipment: 'Dumbbell', met: 5 },
  { id: 'x_face_pull', name: 'Face pull', category: 'strength', muscle: 'back', equipment: 'Cable', met: 4 },
  { id: 'x_hyperextension', name: 'Back extension', category: 'strength', muscle: 'back', equipment: 'Bodyweight', met: 4 },
  { id: 'x_shrug', name: 'Dumbbell shrug', category: 'strength', muscle: 'back', equipment: 'Dumbbell', met: 4 },

  // ── Shoulders ──────────────────────────────────────────────────────
  { id: 'x_ohp', name: 'Overhead press', category: 'strength', muscle: 'shoulders', equipment: 'Barbell', met: 5 },
  { id: 'x_db_shoulder_press', name: 'Dumbbell shoulder press', category: 'strength', muscle: 'shoulders', equipment: 'Dumbbell', met: 5 },
  { id: 'x_arnold_press', name: 'Arnold press', category: 'strength', muscle: 'shoulders', equipment: 'Dumbbell', met: 5 },
  { id: 'x_lateral_raise', name: 'Lateral raise', category: 'strength', muscle: 'shoulders', equipment: 'Dumbbell', met: 4 },
  { id: 'x_front_raise', name: 'Front raise', category: 'strength', muscle: 'shoulders', equipment: 'Dumbbell', met: 4 },
  { id: 'x_rear_delt_fly', name: 'Rear delt fly', category: 'strength', muscle: 'shoulders', equipment: 'Dumbbell', met: 4 },
  { id: 'x_upright_row', name: 'Upright row', category: 'strength', muscle: 'shoulders', equipment: 'Barbell', met: 4 },

  // ── Arms ───────────────────────────────────────────────────────────
  { id: 'x_barbell_curl', name: 'Barbell curl', category: 'strength', muscle: 'arms', equipment: 'Barbell', met: 4 },
  { id: 'x_db_curl', name: 'Dumbbell curl', category: 'strength', muscle: 'arms', equipment: 'Dumbbell', met: 4 },
  { id: 'x_hammer_curl', name: 'Hammer curl', category: 'strength', muscle: 'arms', equipment: 'Dumbbell', met: 4 },
  { id: 'x_preacher_curl', name: 'Preacher curl', category: 'strength', muscle: 'arms', equipment: 'Barbell', met: 4 },
  { id: 'x_cable_curl', name: 'Cable curl', category: 'strength', muscle: 'arms', equipment: 'Cable', met: 4 },
  { id: 'x_tricep_pushdown', name: 'Tricep pushdown', category: 'strength', muscle: 'arms', equipment: 'Cable', met: 4 },
  { id: 'x_skull_crusher', name: 'Skull crusher', category: 'strength', muscle: 'arms', equipment: 'Barbell', met: 4 },
  { id: 'x_overhead_tricep', name: 'Overhead tricep extension', category: 'strength', muscle: 'arms', equipment: 'Dumbbell', met: 4 },
  { id: 'x_close_grip_bench', name: 'Close-grip bench press', category: 'strength', muscle: 'arms', equipment: 'Barbell', met: 5 },
  { id: 'x_tricep_dips', name: 'Tricep dips', category: 'bodyweight', muscle: 'arms', equipment: 'Bodyweight', met: 5 },

  // ── Legs ───────────────────────────────────────────────────────────
  { id: 'x_back_squat', name: 'Back squat', category: 'strength', muscle: 'legs', equipment: 'Barbell', met: 6 },
  { id: 'x_front_squat', name: 'Front squat', category: 'strength', muscle: 'legs', equipment: 'Barbell', met: 6 },
  { id: 'x_goblet_squat', name: 'Goblet squat', category: 'strength', muscle: 'legs', equipment: 'Dumbbell', met: 5 },
  { id: 'x_leg_press', name: 'Leg press', category: 'strength', muscle: 'legs', equipment: 'Machine', met: 5 },
  { id: 'x_rdl', name: 'Romanian deadlift', category: 'strength', muscle: 'legs', equipment: 'Barbell', met: 6 },
  { id: 'x_lunge', name: 'Walking lunge', category: 'strength', muscle: 'legs', equipment: 'Dumbbell', met: 5 },
  { id: 'x_bulgarian_split', name: 'Bulgarian split squat', category: 'strength', muscle: 'legs', equipment: 'Dumbbell', met: 5 },
  { id: 'x_leg_extension', name: 'Leg extension', category: 'strength', muscle: 'legs', equipment: 'Machine', met: 4 },
  { id: 'x_leg_curl', name: 'Leg curl', category: 'strength', muscle: 'legs', equipment: 'Machine', met: 4 },
  { id: 'x_calf_raise', name: 'Calf raise', category: 'strength', muscle: 'legs', equipment: 'Machine', met: 4 },
  { id: 'x_hack_squat', name: 'Hack squat', category: 'strength', muscle: 'legs', equipment: 'Machine', met: 5 },
  { id: 'x_step_up', name: 'Step-up', category: 'strength', muscle: 'legs', equipment: 'Dumbbell', met: 5 },
  { id: 'x_bw_squat', name: 'Bodyweight squat', category: 'bodyweight', muscle: 'legs', equipment: 'Bodyweight', met: 5 },
  { id: 'x_pistol_squat', name: 'Pistol squat', category: 'bodyweight', muscle: 'legs', equipment: 'Bodyweight', met: 6 },
  { id: 'x_wall_sit', name: 'Wall sit', category: 'bodyweight', muscle: 'legs', equipment: 'Bodyweight', met: 4 },

  // ── Glutes ─────────────────────────────────────────────────────────
  { id: 'x_hip_thrust', name: 'Hip thrust', category: 'strength', muscle: 'glutes', equipment: 'Barbell', met: 5 },
  { id: 'x_glute_bridge', name: 'Glute bridge', category: 'bodyweight', muscle: 'glutes', equipment: 'Bodyweight', met: 4 },
  { id: 'x_cable_kickback', name: 'Cable glute kickback', category: 'strength', muscle: 'glutes', equipment: 'Cable', met: 4 },
  { id: 'x_sumo_deadlift', name: 'Sumo deadlift', category: 'strength', muscle: 'glutes', equipment: 'Barbell', met: 6 },

  // ── Core ───────────────────────────────────────────────────────────
  { id: 'x_plank', name: 'Plank', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 4 },
  { id: 'x_crunch', name: 'Crunch', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 4 },
  { id: 'x_sit_up', name: 'Sit-up', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 4 },
  { id: 'x_leg_raise', name: 'Hanging leg raise', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 5 },
  { id: 'x_russian_twist', name: 'Russian twist', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 4 },
  { id: 'x_cable_crunch', name: 'Cable crunch', category: 'strength', muscle: 'core', equipment: 'Cable', met: 4 },
  { id: 'x_bicycle_crunch', name: 'Bicycle crunch', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 5 },
  { id: 'x_mountain_climber', name: 'Mountain climbers', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 8 },
  { id: 'x_ab_wheel', name: 'Ab wheel rollout', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 5 },
  { id: 'x_side_plank', name: 'Side plank', category: 'bodyweight', muscle: 'core', equipment: 'Bodyweight', met: 4 },

  // ── Full body / Olympic ────────────────────────────────────────────
  { id: 'x_clean_press', name: 'Clean and press', category: 'strength', muscle: 'full_body', equipment: 'Barbell', met: 7 },
  { id: 'x_power_clean', name: 'Power clean', category: 'strength', muscle: 'full_body', equipment: 'Barbell', met: 7 },
  { id: 'x_snatch', name: 'Snatch', category: 'strength', muscle: 'full_body', equipment: 'Barbell', met: 7 },
  { id: 'x_thruster', name: 'Thruster', category: 'strength', muscle: 'full_body', equipment: 'Barbell', met: 7 },
  { id: 'x_kb_swing', name: 'Kettlebell swing', category: 'strength', muscle: 'full_body', equipment: 'Kettlebell', met: 7 },
  { id: 'x_burpee', name: 'Burpee', category: 'bodyweight', muscle: 'full_body', equipment: 'Bodyweight', met: 8 },
  { id: 'x_jumping_jack', name: 'Jumping jacks', category: 'bodyweight', muscle: 'full_body', equipment: 'Bodyweight', met: 8 },
  { id: 'x_inchworm', name: 'Inchworm', category: 'bodyweight', muscle: 'full_body', equipment: 'Bodyweight', met: 5 },

  // ── Cardio ─────────────────────────────────────────────────────────
  { id: 'x_walking', name: 'Walking', category: 'cardio', muscle: 'cardio', met: 3.5 },
  { id: 'x_brisk_walk', name: 'Brisk walking', category: 'cardio', muscle: 'cardio', met: 4.3 },
  { id: 'x_jogging', name: 'Jogging', category: 'cardio', muscle: 'cardio', met: 7 },
  { id: 'x_running', name: 'Running', category: 'cardio', muscle: 'cardio', met: 9.8 },
  { id: 'x_sprinting', name: 'Sprinting', category: 'cardio', muscle: 'cardio', met: 12 },
  { id: 'x_cycling', name: 'Cycling, moderate', category: 'cardio', muscle: 'cardio', met: 7.5 },
  { id: 'x_spin', name: 'Spin class', category: 'cardio', muscle: 'cardio', met: 8.5 },
  { id: 'x_stationary_bike', name: 'Stationary bike', category: 'cardio', muscle: 'cardio', met: 7 },
  { id: 'x_rowing', name: 'Rowing machine', category: 'cardio', muscle: 'cardio', met: 7 },
  { id: 'x_elliptical', name: 'Elliptical trainer', category: 'cardio', muscle: 'cardio', met: 5 },
  { id: 'x_stair_climber', name: 'Stair climber', category: 'cardio', muscle: 'cardio', met: 9 },
  { id: 'x_jump_rope', name: 'Jump rope', category: 'cardio', muscle: 'cardio', met: 11 },
  { id: 'x_swimming', name: 'Swimming', category: 'cardio', muscle: 'cardio', met: 8 },
  { id: 'x_hiking', name: 'Hiking', category: 'cardio', muscle: 'cardio', met: 6 },
  { id: 'x_hiit', name: 'HIIT', category: 'cardio', muscle: 'cardio', met: 9 },

  // ── Sports ─────────────────────────────────────────────────────────
  { id: 'x_basketball', name: 'Basketball', category: 'sports', muscle: 'full_body', met: 6.5 },
  { id: 'x_soccer', name: 'Soccer', category: 'sports', muscle: 'full_body', met: 7 },
  { id: 'x_tennis', name: 'Tennis', category: 'sports', muscle: 'full_body', met: 7.3 },
  { id: 'x_badminton', name: 'Badminton', category: 'sports', muscle: 'full_body', met: 5.5 },
  { id: 'x_table_tennis', name: 'Table tennis', category: 'sports', muscle: 'full_body', met: 4 },
  { id: 'x_volleyball', name: 'Volleyball', category: 'sports', muscle: 'full_body', met: 4 },
  { id: 'x_cricket', name: 'Cricket', category: 'sports', muscle: 'full_body', met: 5 },
  { id: 'x_golf', name: 'Golf', category: 'sports', muscle: 'full_body', met: 4.8 },
  { id: 'x_boxing', name: 'Boxing', category: 'sports', muscle: 'full_body', met: 9 },
  { id: 'x_martial_arts', name: 'Martial arts', category: 'sports', muscle: 'full_body', met: 10 },
  { id: 'x_dancing', name: 'Dancing', category: 'sports', muscle: 'full_body', met: 5 },
  { id: 'x_rock_climbing', name: 'Rock climbing', category: 'sports', muscle: 'full_body', met: 8 },
  { id: 'x_skiing', name: 'Skiing', category: 'sports', muscle: 'full_body', met: 7 },
  { id: 'x_skating', name: 'Skating', category: 'sports', muscle: 'full_body', met: 7 },
  { id: 'x_surfing', name: 'Surfing', category: 'sports', muscle: 'full_body', met: 5 },

  // ── Flexibility / mobility ─────────────────────────────────────────
  { id: 'x_yoga', name: 'Yoga', category: 'flexibility', muscle: 'full_body', met: 2.5 },
  { id: 'x_pilates', name: 'Pilates', category: 'flexibility', muscle: 'core', met: 3 },
  { id: 'x_stretching', name: 'Stretching', category: 'flexibility', muscle: 'full_body', met: 2.3 },
  { id: 'x_tai_chi', name: 'Tai chi', category: 'flexibility', muscle: 'full_body', met: 3 },
  { id: 'x_foam_rolling', name: 'Foam rolling', category: 'flexibility', muscle: 'full_body', met: 2.5 },
];

export const MUSCLE_LABELS: Record<string, string> = {
  all: 'All',
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  glutes: 'Glutes',
  core: 'Core',
  full_body: 'Full body',
  cardio: 'Cardio',
};

export const CATEGORY_LABELS: Record<string, string> = {
  all: 'All',
  strength: 'Gym / Strength',
  bodyweight: 'Bodyweight',
  cardio: 'Cardio',
  sports: 'Sports',
  flexibility: 'Flexibility',
};

/**
 * Effective exercise list = bundled, with admin CMS exercises layered on, then
 * the user's own custom exercises (which win on id collisions).
 */
export function mergeExercises(custom: ExerciseDef[] = [], cms: ExerciseDef[] = []): ExerciseDef[] {
  // Backend is authoritative when populated; bundled list is the offline fallback.
  const base = cms.length ? cms : EXERCISES;
  return mergeById(base, [custom]);
}

/** Estimate calories burned for a session. */
export function estimateCalories(met: number, minutes: number, weightKg: number): number {
  return Math.round((met * 3.5 * weightKg) / 200 * minutes);
}

/** Search + filter the exercise catalog. */
export function searchExercises(
  query: string,
  list: ExerciseDef[] = EXERCISES,
  opts: { category?: string; muscle?: string } = {},
  limit = 60,
): ExerciseDef[] {
  const q = query.trim().toLowerCase();
  let out = list.filter((e) => {
    if (opts.category && opts.category !== 'all' && e.category !== opts.category) return false;
    if (opts.muscle && opts.muscle !== 'all' && e.muscle !== opts.muscle) return false;
    return true;
  });
  if (q) out = out.filter((e) => e.name.toLowerCase().includes(q) || (e.equipment ?? '').toLowerCase().includes(q));
  return out.slice(0, limit);
}
