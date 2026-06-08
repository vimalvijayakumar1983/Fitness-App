import React, { useEffect, useState } from 'react';
import { api } from './api';
import { MealsEditor, PlanMeal, planTotals } from './MealsEditor';

interface Template {
  id: string;
  name: string;
  description?: string;
  segmentId?: string | null;
  meals: PlanMeal[];
}
interface Segment { id: string; name: string }
interface Recipe { id: string; name: string; calories: number; protein: number; carbs: number; fat: number }

export function PlansView() {
  const [rows, setRows] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [editing, setEditing] = useState<Template | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [t, s, r] = await Promise.all([
        api.listTemplates<Template>(),
        api.list<Segment>('segments'),
        api.list<Recipe>('recipes'),
      ]);
      setRows(t); setSegments(s); setRecipes(r); setErr('');
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => { if (confirm('Delete this template?')) { await api.deleteTemplate(id); load(); } };

  const blank: Template = { id: '', name: '', description: '', segmentId: null, meals: [] };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Plan Templates <span className="count">{rows.length}</span></h2>
        <button onClick={() => setEditing(blank)}>+ New Template</button>
      </div>
      {err ? <div className="err">{err}</div> : null}
      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">No templates yet. Build one — then assign it to customers from the Customers tab.</p>
      ) : (
        <table>
          <thead><tr><th>Name</th><th>Meals</th><th>Calories</th><th>Segment</th><th></th></tr></thead>
          <tbody>
            {rows.map((t) => {
              const tot = planTotals(t.meals);
              return (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>{t.meals.length}</td>
                  <td>{tot.calories} kcal</td>
                  <td>{segments.find((s) => s.id === t.segmentId)?.name ?? '—'}</td>
                  <td className="row-actions">
                    <button className="link" onClick={() => setEditing(t)}>Edit</button>
                    <button className="link danger" onClick={() => del(t.id)}>Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      {editing !== undefined ? (
        <TemplateEditor
          initial={editing}
          segments={segments}
          recipes={recipes}
          onClose={() => setEditing(undefined)}
          onSaved={() => { setEditing(undefined); load(); }}
        />
      ) : null}
    </div>
  );
}

function TemplateEditor({ initial, segments, recipes, onClose, onSaved }: {
  initial: Template; segments: Segment[]; recipes: Recipe[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(initial.name);
  const [description, setDescription] = useState(initial.description ?? '');
  const [segmentId, setSegmentId] = useState(initial.segmentId ?? '');
  const [meals, setMeals] = useState<PlanMeal[]>(initial.meals);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const tot = planTotals(meals);

  const save = async () => {
    setErr(''); setBusy(true);
    try {
      const body = { name, description: description || undefined, segmentId: segmentId || undefined, meals };
      if (initial.id) await api.updateTemplate(initial.id, body);
      else await api.createTemplate(body);
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card wide" onClick={(e) => e.stopPropagation()}>
        <h3>{initial.id ? 'Edit' : 'New'} Plan Template</h3>
        <div className="form-grid">
          <label className="full"><span>Name</span><input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Lean 1800" /></label>
          <label className="full"><span>Description</span><input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short note" /></label>
          <label><span>Segment</span>
            <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
              <option value="">— none —</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
        <h4 style={{ margin: '16px 0 8px' }}>Meals · {tot.calories} kcal · P{tot.protein} C{tot.carbs} F{tot.fat}</h4>
        <MealsEditor meals={meals} recipes={recipes} onChange={setMeals} />
        {err ? <div className="err">{err}</div> : null}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={save} disabled={busy || !name}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
