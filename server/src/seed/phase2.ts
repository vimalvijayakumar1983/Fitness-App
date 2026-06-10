import { db } from '../db';

/**
 * Seeds the Phase 2 catalog — condition-reversal programs and coaching-
 * marketplace coaches — only when each table is empty, so admin edits are
 * never overwritten. Gives the app and back office rich, world-class content
 * out of the box.
 */
const now = () => new Date().toISOString();
const count = (t: string) => (db.prepare(`SELECT COUNT(*) n FROM ${t}`).get() as any).n as number;

type Module = { week: number; title: string; focus: string; tasks: string[] };

interface SeedProgram {
  id: string;
  name: string;
  condition: string;
  tagline: string;
  description: string;
  durationWeeks: number;
  color: string;
  outcomes: string[];
  modules: Module[];
}

/** Build a repeating weekly arc so a program always has a full schedule. */
function buildModules(weeks: number, arc: Omit<Module, 'week'>[]): Module[] {
  const out: Module[] = [];
  for (let w = 1; w <= weeks; w++) out.push({ week: w, ...arc[(w - 1) % arc.length] });
  return out;
}

const PROGRAMS: SeedProgram[] = [
  {
    id: 'prog_diabetes_reversal',
    name: 'Type 2 Diabetes Reversal',
    condition: 'diabetes',
    tagline: 'Lower HbA1c and reduce medication — guided, evidence-based, 12 weeks.',
    description:
      'A clinically-informed program to improve insulin sensitivity through low-glycaemic nutrition, daily movement, sleep and stress work, and structured glucose tracking. Designed to help many people reduce or come off medication under their doctor’s supervision.',
    durationWeeks: 12,
    color: '#23A455',
    outcomes: [
      'Lower fasting glucose & HbA1c',
      'Reduce or eliminate medication (with your doctor)',
      'Sustained 5–10% weight loss',
      'More stable daily energy',
    ],
    modules: buildModules(12, [
      { title: 'Baseline & glucose basics', focus: 'Understand your numbers', tasks: ['Log fasting glucose each morning', 'Complete the health assessment', 'Cut sugary drinks', 'Walk 15 min after dinner'] },
      { title: 'Plate method & fibre', focus: 'Low-glycaemic eating', tasks: ['Half-plate non-starchy veg at lunch & dinner', 'Swap refined carbs for whole grains', 'Hit 25g+ fibre', 'Log every meal'] },
      { title: 'Movement that lowers glucose', focus: 'Insulin sensitivity', tasks: ['10-min walk after each meal', '2 strength sessions', 'Hit step goal 5 days', 'Stretch before bed'] },
      { title: 'Sleep & stress', focus: 'The hidden glucose drivers', tasks: ['7+ hours sleep, 5 nights', 'Daily 5-min breathing', 'No screens 30 min before bed', 'Review weekly glucose trend'] },
    ]),
  },
  {
    id: 'prog_weight_reversal',
    name: 'Obesity & Weight Reversal',
    condition: 'obesity',
    tagline: 'Lose fat sustainably and keep it off — 16-week metabolic reset.',
    description:
      'A structured 16-week program combining a moderate calorie deficit, high-protein nutrition, progressive strength training, and habit coaching to drive sustainable fat loss while protecting muscle and metabolism.',
    durationWeeks: 16,
    color: '#F2784B',
    outcomes: [
      'Sustainable 8–15% body-weight loss',
      'Preserve lean muscle',
      'Build lasting nutrition habits',
      'Improve mobility & confidence',
    ],
    modules: buildModules(16, [
      { title: 'Set the foundation', focus: 'Deficit & protein', tasks: ['Set calorie & protein targets', 'Log weight daily', 'Hit protein goal', 'Walk 7,000 steps'] },
      { title: 'Strength base', focus: 'Protect muscle', tasks: ['3 full-body strength sessions', 'Protein at every meal', 'Meal-prep 2 days', 'Sleep 7+ hrs'] },
      { title: 'Dial in nutrition', focus: 'Whole foods', tasks: ['Cook 5 meals at home', 'Veg with every meal', 'Limit liquid calories', 'Hydrate 2.5L'] },
      { title: 'Progress & adjust', focus: 'Keep momentum', tasks: ['Add load or reps', 'Review weekly weight trend', '8,000+ steps', 'Plan next week’s meals'] },
    ]),
  },
  {
    id: 'prog_metabolic_reset',
    name: 'Metabolic Health Reset',
    condition: 'metabolic',
    tagline: 'Fix the root drivers of metabolic syndrome in 8 weeks.',
    description:
      'A focused 8-week reset targeting the five markers of metabolic syndrome — waist, blood pressure, triglycerides, HDL and glucose — through nutrition, movement, sleep and stress optimisation.',
    durationWeeks: 8,
    color: '#8B5CF6',
    outcomes: [
      'Smaller waist circumference',
      'Better blood pressure & lipids',
      'Improved insulin sensitivity',
      'Higher daily energy',
    ],
    modules: buildModules(8, [
      { title: 'Measure what matters', focus: 'Baseline markers', tasks: ['Record waist & blood pressure', 'Upload recent labs', 'Cut added sugar', 'Walk daily'] },
      { title: 'Mediterranean shift', focus: 'Anti-inflammatory food', tasks: ['Olive oil & nuts daily', 'Fatty fish 2×', 'Whole-food carbs only', 'Log meals'] },
      { title: 'Move & lift', focus: 'Burn & build', tasks: ['150 min cardio this week', '2 strength sessions', '8,000 steps', 'Mobility 3×'] },
      { title: 'Recover', focus: 'Sleep & stress', tasks: ['Consistent sleep/wake time', 'Daily mindfulness', 'Alcohol-free 5 days', 'Re-measure markers'] },
    ]),
  },
  {
    id: 'prog_hypertension',
    name: 'Blood Pressure Control',
    condition: 'hypertension',
    tagline: 'Bring blood pressure into range with the DASH approach — 10 weeks.',
    description:
      'A 10-week program built on the DASH dietary pattern, sodium reduction, movement and stress regulation to help lower blood pressure naturally alongside medical care.',
    durationWeeks: 10,
    color: '#3B82F6',
    outcomes: [
      'Lower systolic & diastolic BP',
      'Reduce sodium intake',
      'Improve cardiovascular fitness',
      'Lower resting heart rate',
    ],
    modules: buildModules(10, [
      { title: 'Know your pressure', focus: 'Track & assess', tasks: ['Measure BP morning & evening', 'Log sodium intake', 'Cut processed foods', 'Walk 20 min'] },
      { title: 'DASH plate', focus: 'Potassium & fibre', tasks: ['5 servings fruit & veg', 'Low-sodium swaps', 'Limit salt to 1,500mg', 'Log meals'] },
      { title: 'Cardio base', focus: 'Heart fitness', tasks: ['150 min moderate cardio', 'Daily step goal', '2 mobility sessions', 'Sleep 7+ hrs'] },
      { title: 'Calm the system', focus: 'Stress & recovery', tasks: ['Daily breathing practice', 'Alcohol & caffeine review', 'Consistent sleep', 'Review weekly BP trend'] },
    ]),
  },
];

interface SeedCoach {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  bio: string;
  rating: number;
  reviews: number;
  priceMonthUsd: number;
  languages: string[];
}

const COACHES: SeedCoach[] = [
  {
    id: 'coach_amani',
    name: 'Dr. Amani Saleh',
    title: 'Endocrinologist & Diabetes Specialist',
    specialties: ['Diabetes reversal', 'Metabolic health', 'Insulin resistance'],
    bio: 'Board-certified endocrinologist with 12 years helping patients reverse type 2 diabetes through lifestyle medicine.',
    rating: 4.9, reviews: 184, priceMonthUsd: 149, languages: ['English', 'Arabic'],
  },
  {
    id: 'coach_omar',
    name: 'Omar Haddad',
    title: 'Strength & Body Recomposition Coach',
    specialties: ['Fat loss', 'Strength training', 'Habit change'],
    bio: 'Helped 500+ clients lose fat and build strength sustainably. Specialises in busy professionals.',
    rating: 4.8, reviews: 312, priceMonthUsd: 89, languages: ['English', 'Arabic'],
  },
  {
    id: 'coach_priya',
    name: 'Priya Nair, RD',
    title: 'Registered Dietitian',
    specialties: ['Nutrition', 'PCOS', 'Plant-based', 'Gut health'],
    bio: 'Registered dietitian focused on evidence-based, culturally-tailored nutrition plans for the Middle East and South Asia.',
    rating: 4.9, reviews: 221, priceMonthUsd: 99, languages: ['English', 'Hindi', 'Malayalam'],
  },
  {
    id: 'coach_sara',
    name: 'Sara Lindqvist',
    title: 'Behavioural Health & Longevity Coach',
    specialties: ['Sleep', 'Stress', 'Longevity', 'Healthy ageing'],
    bio: 'Combines behavioural science and longevity research to build durable habits for sleep, stress and healthspan.',
    rating: 4.7, reviews: 96, priceMonthUsd: 119, languages: ['English', 'Swedish'],
  },
  {
    id: 'coach_marco',
    name: 'Marco Rossi',
    title: 'Cardiac Rehab & Hypertension Coach',
    specialties: ['Blood pressure', 'Cardiovascular fitness', 'DASH diet'],
    bio: 'Clinical exercise physiologist specialising in safe, effective programs for heart health and blood pressure.',
    rating: 4.8, reviews: 73, priceMonthUsd: 109, languages: ['English', 'Italian'],
  },
];

export function seedPhase2(): void {
  const t = now();

  if (count('programs') === 0) {
    const ins = db.prepare(
      `INSERT INTO programs (id,slug,name,condition,tagline,description,duration_weeks,image_url,color,outcomes,modules,active,created_at,updated_at)
       VALUES (@id,@slug,@name,@condition,@tagline,@description,@duration_weeks,NULL,@color,@outcomes,@modules,1,@t,@t)`,
    );
    db.transaction(() =>
      PROGRAMS.forEach((p) =>
        ins.run({
          id: p.id,
          slug: p.id.replace(/^prog_/, '').replace(/_/g, '-'),
          name: p.name, condition: p.condition, tagline: p.tagline, description: p.description,
          duration_weeks: p.durationWeeks, color: p.color,
          outcomes: JSON.stringify(p.outcomes), modules: JSON.stringify(p.modules), t,
        }),
      ),
    )();
  }

  if (count('coaches') === 0) {
    const ins = db.prepare(
      `INSERT INTO coaches (id,name,title,specialties,bio,photo_url,rating,reviews,price_month_usd,languages,active,created_at,updated_at)
       VALUES (@id,@name,@title,@specialties,@bio,NULL,@rating,@reviews,@price,@languages,1,@t,@t)`,
    );
    db.transaction(() =>
      COACHES.forEach((c) =>
        ins.run({
          id: c.id, name: c.name, title: c.title,
          specialties: JSON.stringify(c.specialties), bio: c.bio,
          rating: c.rating, reviews: c.reviews, price: c.priceMonthUsd,
          languages: JSON.stringify(c.languages), t,
        }),
      ),
    )();
  }

  if (count('companies') === 0) {
    db.prepare(
      `INSERT INTO companies (id,name,join_code,seats,contact_email,plan,created_at,updated_at)
       VALUES (?,?,?,?,?,?,?,?)`,
    ).run('co_demo', 'Al Zaabi Group (Demo)', 'WELLAZ', 250, 'wellness@alzaabi.example', 'premium', t, t);
  }
}
