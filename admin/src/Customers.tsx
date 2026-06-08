import React, { useEffect, useState } from 'react';
import { api } from './api';
import { MealsEditor, PlanMeal, planTotals } from './MealsEditor';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  role: string;
  segmentId: string | null;
  hasPlan: boolean;
}
interface Segment { id: string; name: string }
interface Template { id: string; name: string; meals: PlanMeal[] }
interface Recipe { id: string; name: string; calories: number; protein: number; carbs: number; fat: number }

export function CustomersView() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [assigning, setAssigning] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, t, r] = await Promise.all([
        api.listCustomers<Customer>(),
        api.list<Segment>('segments'),
        api.listTemplates<Template>(),
        api.list<Recipe>('recipes'),
      ]);
      setRows(c); setSegments(s); setTemplates(t); setRecipes(r); setErr('');
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const changeSegment = async (id: string, segmentId: string) => {
    await api.setSegment(id, segmentId || null);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, segmentId: segmentId || null } : r)));
  };

  const removePlan = async (id: string) => {
    if (!confirm('Remove this customer’s plan?')) return;
    await api.removePlan(id);
    load();
  };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Customers <span className="count">{rows.length}</span></h2>
      </div>
      {err ? <div className="err">{err}</div> : null}
      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">No accounts yet. They appear here when customers sign up in the app.</p>
      ) : (
        <table>
          <thead><tr><th>Email</th><th>Name</th><th>Role</th><th>Segment</th><th>Plan</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.email}</td>
                <td>{c.name ?? '—'}</td>
                <td>{c.role}</td>
                <td>
                  <select value={c.segmentId ?? ''} onChange={(e) => changeSegment(c.id, e.target.value)}>
                    <option value="">—</option>
                    {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td>{c.hasPlan ? <span className="badge">Assigned</span> : <span className="muted">—</span>}</td>
                <td className="row-actions">
                  <button className="link" onClick={() => setAssigning(c)}>{c.hasPlan ? 'Reassign' : 'Assign plan'}</button>
                  {c.hasPlan ? <button className="link danger" onClick={() => removePlan(c.id)}>Remove</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {assigning ? (
        <AssignModal
          customer={assigning}
          templates={templates}
          recipes={recipes}
          onClose={() => setAssigning(null)}
          onSaved={() => { setAssigning(null); load(); }}
        />
      ) : null}
    </div>
  );
}

function AssignModal({ customer, templates, recipes, onClose, onSaved }: {
  customer: Customer; templates: Template[]; recipes: Recipe[]; onClose: () => void; onSaved: () => void;
}) {
  const [name, setName] = useState(`${customer.name ?? customer.email}'s plan`);
  const [meals, setMeals] = useState<PlanMeal[]>([]);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const tot = planTotals(meals);

  const applyTemplate = (id: string) => {
    const t = templates.find((x) => x.id === id);
    if (t) { setMeals(t.meals.map((m) => ({ ...m }))); setName(`${customer.name ?? customer.email}'s ${t.name}`); }
  };

  const save = async () => {
    if (!meals.length) { setErr('Add at least one meal (or apply a template).'); return; }
    setErr(''); setBusy(true);
    try {
      await api.assignPlan(customer.id, { name, meals });
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card wide" onClick={(e) => e.stopPropagation()}>
        <h3>Assign plan → {customer.email}</h3>
        <div className="form-grid">
          <label><span>Start from template</span>
            <select defaultValue="" onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">— blank / custom —</option>
              {templates.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </label>
          <label className="full"><span>Plan name</span><input value={name} onChange={(e) => setName(e.target.value)} /></label>
        </div>
        <h4 style={{ margin: '16px 0 8px' }}>Meals · {tot.calories} kcal · P{tot.protein} C{tot.carbs} F{tot.fat}</h4>
        <MealsEditor meals={meals} recipes={recipes} onChange={setMeals} />
        {err ? <div className="err">{err}</div> : null}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={save} disabled={busy || !name}>{busy ? 'Assigning…' : 'Assign to customer'}</button>
        </div>
      </div>
    </div>
  );
}
