import React from 'react';

export interface PlanMeal {
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  title: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  recipeId?: string;
}

interface Recipe {
  id: string;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

const SLOTS: PlanMeal['slot'][] = ['breakfast', 'lunch', 'dinner', 'snack'];
const num = (s: string) => Math.max(0, Number(s) || 0);

/** Editable list of plan meals; can autofill a row from a CMS recipe. */
export function MealsEditor({ meals, recipes, onChange }: { meals: PlanMeal[]; recipes: Recipe[]; onChange: (m: PlanMeal[]) => void }) {
  const update = (i: number, patch: Partial<PlanMeal>) =>
    onChange(meals.map((m, idx) => (idx === i ? { ...m, ...patch } : m)));

  const fromRecipe = (i: number, recipeId: string) => {
    const r = recipes.find((x) => x.id === recipeId);
    if (!r) return update(i, { recipeId: undefined });
    update(i, { recipeId: r.id, title: r.name, calories: r.calories, protein: r.protein, carbs: r.carbs, fat: r.fat });
  };

  const add = () => onChange([...meals, { slot: 'breakfast', title: '', calories: 0, protein: 0, carbs: 0, fat: 0 }]);
  const remove = (i: number) => onChange(meals.filter((_, idx) => idx !== i));

  return (
    <div>
      <table className="meals-table">
        <thead>
          <tr><th>Slot</th><th>From recipe</th><th>Title</th><th>Kcal</th><th>P</th><th>C</th><th>F</th><th></th></tr>
        </thead>
        <tbody>
          {meals.map((m, i) => (
            <tr key={i}>
              <td>
                <select value={m.slot} onChange={(e) => update(i, { slot: e.target.value as PlanMeal['slot'] })}>
                  {SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td>
                <select value={m.recipeId ?? ''} onChange={(e) => fromRecipe(i, e.target.value)}>
                  <option value="">— custom —</option>
                  {recipes.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </td>
              <td><input value={m.title} onChange={(e) => update(i, { title: e.target.value })} placeholder="Meal name" /></td>
              <td><input className="mini" type="number" value={m.calories} onChange={(e) => update(i, { calories: num(e.target.value) })} /></td>
              <td><input className="mini" type="number" value={m.protein} onChange={(e) => update(i, { protein: num(e.target.value) })} /></td>
              <td><input className="mini" type="number" value={m.carbs} onChange={(e) => update(i, { carbs: num(e.target.value) })} /></td>
              <td><input className="mini" type="number" value={m.fat} onChange={(e) => update(i, { fat: num(e.target.value) })} /></td>
              <td><button className="link danger" type="button" onClick={() => remove(i)}>✕</button></td>
            </tr>
          ))}
          {meals.length === 0 ? <tr><td colSpan={8} className="muted">No meals yet — add one below.</td></tr> : null}
        </tbody>
      </table>
      <button type="button" className="ghost" onClick={add} style={{ marginTop: 10 }}>+ Add meal</button>
    </div>
  );
}

export function planTotals(meals: PlanMeal[]) {
  return meals.reduce(
    (a, m) => ({ calories: a.calories + m.calories, protein: a.protein + m.protein, carbs: a.carbs + m.carbs, fat: a.fat + m.fat }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 },
  );
}
