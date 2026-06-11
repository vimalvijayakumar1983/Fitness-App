import { describe, it, expect } from 'vitest';
import { computeWeekReview } from '../weekReview';
import { emptyAppData, type AppData } from '@/models/types';

const iso = (daysAgo: number) => new Date(Date.now() - daysAgo * 864e5).toISOString();
const date = (daysAgo: number) => iso(daysAgo).slice(0, 10);

describe('computeWeekReview', () => {
  it('produces metrics and at least one insight on empty data', () => {
    const r = computeWeekReview(emptyAppData);
    expect(r.metrics.length).toBeGreaterThan(0);
    expect(r.insights.length).toBeGreaterThan(0);
    expect(r.rangeLabel).toMatch(/–/);
  });

  it('counts meals logged this week vs last', () => {
    const data: AppData = {
      ...emptyAppData,
      meals: [
        { id: 'a', date: date(1), loggedAt: iso(1), type: 'lunch', items: [{ name: 'x', calories: 100 }] },
        { id: 'b', date: date(2), loggedAt: iso(2), type: 'lunch', items: [{ name: 'y', calories: 100 }] },
      ],
    };
    const r = computeWeekReview(data);
    const meals = r.metrics.find((m) => m.key === 'meals');
    expect(meals?.value).toBe('2/7');
  });

  it('reports glucose time-in-range when readings exist', () => {
    const data: AppData = {
      ...emptyAppData,
      glucose: [
        { id: '1', date: date(1), loggedAt: iso(1), mgDl: 100, tag: 'fasting', source: 'manual' }, // in range
        { id: '2', date: date(2), loggedAt: iso(2), mgDl: 250, tag: 'post_meal', source: 'manual' }, // high
      ],
    };
    const r = computeWeekReview(data);
    const tir = r.metrics.find((m) => m.key === 'tir');
    expect(tir?.value).toBe('50%');
  });
});
