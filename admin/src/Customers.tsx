import React, { useEffect, useMemo, useState } from 'react';
import { api } from './api';
import { MealsEditor, PlanMeal, planTotals } from './MealsEditor';

interface Customer {
  id: string;
  email: string;
  name: string | null;
  role: string;
  plan: string;
  segmentId: string | null;
  hasPlan: boolean;
  createdAt: string;
}
interface Segment { id: string; name: string }
interface Template { id: string; name: string; meals: PlanMeal[] }
interface Recipe { id: string; name: string; calories: number; protein: number; carbs: number; fat: number }

const PLAN_FILTERS = ['all', 'free', 'premium', 'coached'];

export function CustomersView() {
  const [rows, setRows] = useState<Customer[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [query, setQuery] = useState('');
  const [planF, setPlanF] = useState('all');
  const [segF, setSegF] = useState('all');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [assigning, setAssigning] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [c, s, t, r] = await Promise.all([
        api.listCustomers<Customer>(), api.list<Segment>('segments'),
        api.listTemplates<Template>(), api.list<Recipe>('recipes'),
      ]);
      setRows(c); setSegments(s); setTemplates(t); setRecipes(r); setErr('');
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const segName = (id: string | null) => segments.find((s) => s.id === id)?.name ?? '—';

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((c) => {
      if (planF !== 'all' && c.plan !== planF) return false;
      if (segF !== 'all' && c.segmentId !== segF) return false;
      if (q && !(`${c.email} ${c.name ?? ''}`.toLowerCase().includes(q))) return false;
      return true;
    });
  }, [rows, query, planF, segF]);

  const paying = rows.filter((c) => c.plan !== 'free').length;
  const withPlan = rows.filter((c) => c.hasPlan).length;

  const changeSegment = async (id: string, segmentId: string) => {
    await api.setSegment(id, segmentId || null);
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, segmentId: segmentId || null } : r)));
  };
  const removePlan = async (id: string) => {
    if (!confirm('Remove this customer’s plan?')) return;
    await api.removePlan(id); load();
  };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Customers <span className="count">{rows.length}</span></h2>
      </div>

      <div className="cust-summary">
        <div><b>{rows.length}</b><span>accounts</span></div>
        <div><b>{paying}</b><span>paying</span></div>
        <div><b>{withPlan}</b><span>with a plan</span></div>
      </div>

      <div className="cust-filters">
        <input placeholder="Search email or name…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <div className="toggle-mini">
          {PLAN_FILTERS.map((p) => (
            <button key={p} className={planF === p ? 'on' : ''} onClick={() => setPlanF(p)}>{p === 'all' ? 'All plans' : p}</button>
          ))}
        </div>
        <select value={segF} onChange={(e) => setSegF(e.target.value)}>
          <option value="all">All segments</option>
          {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {err ? <div className="err">{err}</div> : null}
      {loading ? <p className="muted">Loading…</p> : filtered.length === 0 ? (
        <p className="muted">No customers match.</p>
      ) : (
        <table>
          <thead><tr><th></th><th>Email</th><th>Name</th><th>Plan</th><th>Segment</th><th>Plan?</th><th>Joined</th><th></th></tr></thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id}>
                <td><div className="avatar-sm">{(c.name || c.email)[0].toUpperCase()}</div></td>
                <td>{c.email}</td>
                <td>{c.name ?? '—'}</td>
                <td>{c.plan === 'free' ? <span className="muted">Free</span> : <span className="badge">{c.plan}</span>}</td>
                <td>
                  <select value={c.segmentId ?? ''} onChange={(e) => changeSegment(c.id, e.target.value)}>
                    <option value="">—</option>
                    {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td>{c.hasPlan ? '✓' : <span className="muted">—</span>}</td>
                <td>{new Date(c.createdAt).toLocaleDateString()}</td>
                <td className="row-actions">
                  <button className="link" onClick={() => setDetailId(c.id)}>View</button>
                  <button className="link" onClick={() => setAssigning(c)}>{c.hasPlan ? 'Reassign' : 'Assign'}</button>
                  {c.hasPlan ? <button className="link danger" onClick={() => removePlan(c.id)}>Remove</button> : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {detailId ? (
        <CustomerDetail
          id={detailId} segments={segments}
          onClose={() => setDetailId(null)}
          onAssign={(c) => { setDetailId(null); setAssigning(c); }}
          onChanged={load}
        />
      ) : null}
      {assigning ? (
        <AssignModal customer={assigning} templates={templates} recipes={recipes}
          onClose={() => setAssigning(null)} onSaved={() => { setAssigning(null); load(); }} />
      ) : null}
    </div>
  );
}

function CustomerDetail({ id, segments, onClose, onAssign, onChanged }: {
  id: string; segments: Segment[]; onClose: () => void; onAssign: (c: any) => void; onChanged: () => void;
}) {
  const [d, setD] = useState<any>(null);
  const [err, setErr] = useState('');
  useEffect(() => { api.getCustomer(id).then(setD).catch((e) => setErr(e.message)); }, [id]);

  const setSeg = async (segmentId: string) => {
    await api.setSegment(id, segmentId || null);
    setD((x: any) => ({ ...x, segmentId: segmentId || null }));
    onChanged();
  };
  const removePlan = async () => {
    if (!confirm('Remove plan?')) return;
    await api.removePlan(id); setD((x: any) => ({ ...x, assignedPlan: null })); onChanged();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card wide" onClick={(e) => e.stopPropagation()}>
        {!d ? (err ? <div className="err">{err}</div> : <p className="muted">Loading…</p>) : (
          <>
            <div className="detail-head">
              <div className="avatar-lg">{(d.name || d.email)[0].toUpperCase()}</div>
              <div>
                <h3 style={{ margin: 0 }}>{d.name ?? d.email}</h3>
                <div className="muted">{d.email}</div>
              </div>
            </div>

            <div className="detail-grid">
              <Field label="Subscription" value={d.subscription.plan === 'free' ? 'Free' : `${d.subscription.plan} (${d.subscription.status})`} />
              <Field label="Lifetime value (est.)" value={d.ltv ? `$${d.ltv} · ${d.monthsActive} mo` : '—'} />
              <Field label="Joined" value={new Date(d.createdAt).toLocaleDateString()} />
              <Field label="Last active" value={d.lastActive ? new Date(d.lastActive).toLocaleString() : 'Never synced'} />
            </div>

            <label className="detail-seg">
              <span>Segment</span>
              <select value={d.segmentId ?? ''} onChange={(e) => setSeg(e.target.value)}>
                <option value="">— none —</option>
                {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </label>

            <h4 style={{ margin: '16px 0 8px' }}>Assigned plan</h4>
            {d.assignedPlan ? (
              <div className="card" style={{ padding: 14 }}>
                <b>{d.assignedPlan.name}</b>
                <div className="muted small" style={{ margin: '4px 0 8px' }}>
                  {(() => { const t = planTotals(d.assignedPlan.meals); return `${t.calories} kcal · P${t.protein} C${t.carbs} F${t.fat}`; })()}
                </div>
                {d.assignedPlan.meals.map((m: PlanMeal, i: number) => (
                  <div key={i} className="plan-meal-row"><span style={{ textTransform: 'capitalize' }}>{m.slot}</span><span>{m.title}</span><span className="muted">{m.calories} kcal</span></div>
                ))}
              </div>
            ) : <p className="muted">No plan assigned yet.</p>}

            <div className="modal-actions">
              {d.assignedPlan ? <button className="ghost" onClick={removePlan}>Remove plan</button> : null}
              <button onClick={() => onAssign(d)}>{d.assignedPlan ? 'Reassign plan' : 'Assign plan'}</button>
              <button className="ghost" onClick={onClose}>Close</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return <div className="field"><div className="field-label">{label}</div><div className="field-value">{value}</div></div>;
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
    try { await api.assignPlan(customer.id, { name, meals }); onSaved(); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
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
