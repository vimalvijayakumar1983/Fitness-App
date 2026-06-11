import { describe, it, expect } from 'vitest';
import { biologicalAge, computeProjection, avgFastingGlucose, lifeFactors } from '../longevity';
import { emptyAppData, type AppData, type HealthAssessment, type Profile } from '@/models/types';

const profile = (over: Partial<Profile> = {}): Profile => ({
  ...emptyAppData.profile, age: 40, heightCm: 175, weightKg: 70, sex: 'male', ...over,
});
const data = (over: Partial<AppData> = {}): AppData => ({ ...emptyAppData, ...over });

const healthy: HealthAssessment = {
  completedAt: new Date().toISOString(), smokes: false, familyDiabetes: false, familyHeart: false,
  activityDaysPerWeek: 5, sleepQuality: 5, stressLevel: 1, dietQuality: 5, alcoholPerWeek: 0,
};
const unhealthy: HealthAssessment = {
  completedAt: new Date().toISOString(), smokes: true, familyDiabetes: true, familyHeart: true,
  waistCm: 110, activityDaysPerWeek: 0, sleepQuality: 1, stressLevel: 5, dietQuality: 1, alcoholPerWeek: 20,
};

describe('biologicalAge', () => {
  it('healthy habits keep biological age at or below chronological age', () => {
    const bio = biologicalAge(profile(), healthy, data());
    expect(bio.chronoAge).toBe(40);
    expect(bio.bioAge).toBeLessThanOrEqual(bio.chronoAge);
    expect(bio.longevityScore).toBeGreaterThanOrEqual(80);
    expect(bio.category).toBe('Excellent');
  });

  it('poor habits raise biological age and lower the score', () => {
    const bio = biologicalAge(profile({ weightKg: 105 }), unhealthy, data());
    expect(bio.bioAge).toBeGreaterThan(bio.chronoAge);
    expect(bio.longevityScore).toBeLessThan(60);
  });

  it('never returns a biological age below 18 or a score outside 0..100', () => {
    const bio = biologicalAge(profile({ age: 18 }), healthy, data());
    expect(bio.bioAge).toBeGreaterThanOrEqual(18);
    expect(bio.longevityScore).toBeGreaterThanOrEqual(0);
    expect(bio.longevityScore).toBeLessThanOrEqual(100);
  });

  it('smoking is flagged as a major risk factor', () => {
    const factors = lifeFactors(profile(), unhealthy, data());
    const smoking = factors.find((f) => f.label === 'Smoking');
    expect(smoking).toBeDefined();
    expect(smoking!.years).toBeGreaterThan(0);
  });
});

describe('computeProjection', () => {
  it('shows recoverable years when habits are poor', () => {
    const proj = computeProjection(profile({ weightKg: 100 }), unhealthy, data());
    expect(proj.yearsToGain).toBeGreaterThan(0);
    expect(proj.levers.length).toBeGreaterThan(0);
    expect(proj.trajectory.length).toBe(5); // 0,5,10,15,20
  });

  it('offers little to gain when already optimal', () => {
    const proj = computeProjection(profile(), healthy, data());
    expect(proj.yearsToGain).toBeLessThanOrEqual(1);
  });
});

describe('avgFastingGlucose', () => {
  it('returns null with no readings', () => {
    expect(avgFastingGlucose([])).toBeNull();
  });
  it('averages fasting readings when present', () => {
    const now = new Date().toISOString();
    const avg = avgFastingGlucose([
      { id: '1', date: '2026-01-01', loggedAt: now, mgDl: 100, tag: 'fasting', source: 'manual' },
      { id: '2', date: '2026-01-02', loggedAt: now, mgDl: 120, tag: 'fasting', source: 'manual' },
    ]);
    expect(avg).toBe(110);
  });
});
