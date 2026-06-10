import React, { useEffect, useState } from 'react';
import { api, auth, Me } from './api';
import { CustomersView } from './Customers';
import { PlansView } from './Plans';
import { ReportsView } from './Reports';
import { RevenueView } from './Revenue';
import { PricingView } from './Pricing';
import { ProgramsView } from './Programs';
import { CoachesView } from './Coaches';
import { CompaniesView } from './Companies';

type FieldType = 'text' | 'number' | 'select' | 'tags' | 'lines' | 'ingredients';
interface Field {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  optional?: boolean;
}
interface Resource {
  key: string;
  label: string;
  fields: Field[];
  columns: { key: string; label: string }[];
}

const RESOURCES: Resource[] = [
  {
    key: 'foods',
    label: 'Foods',
    columns: [{ key: 'name', label: 'Name' }, { key: 'serving', label: 'Serving' }, { key: 'calories', label: 'Kcal' }, { key: 'category', label: 'Category' }],
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'brand', label: 'Brand', type: 'text', optional: true },
      { key: 'serving', label: 'Serving', type: 'text' },
      { key: 'calories', label: 'Calories', type: 'number' },
      { key: 'protein', label: 'Protein (g)', type: 'number' },
      { key: 'carbs', label: 'Carbs (g)', type: 'number' },
      { key: 'fat', label: 'Fat (g)', type: 'number' },
      { key: 'category', label: 'Category', type: 'select', options: ['protein', 'carb', 'veg', 'fruit', 'dairy', 'fat', 'drink', 'snack', 'meal'] },
      { key: 'imageUrl', label: 'Image URL', type: 'text', optional: true },
    ],
  },
  {
    key: 'exercises',
    label: 'Exercises',
    columns: [{ key: 'name', label: 'Name' }, { key: 'category', label: 'Type' }, { key: 'muscle', label: 'Muscle' }, { key: 'met', label: 'MET' }],
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'category', label: 'Type', type: 'select', options: ['strength', 'bodyweight', 'cardio', 'sports', 'flexibility'] },
      { key: 'muscle', label: 'Muscle', type: 'select', options: ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core', 'full_body', 'cardio'] },
      { key: 'equipment', label: 'Equipment', type: 'text', optional: true },
      { key: 'met', label: 'Intensity (MET)', type: 'number' },
      { key: 'imageUrl', label: 'Image URL', type: 'text', optional: true },
    ],
  },
  {
    key: 'recipes',
    label: 'Recipes',
    columns: [{ key: 'name', label: 'Name' }, { key: 'calories', label: 'Kcal' }, { key: 'mealTypes', label: 'Meals' }, { key: 'diets', label: 'Diets' }],
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'emoji', label: 'Emoji', type: 'text', optional: true },
      { key: 'mealTypes', label: 'Meal types (comma separated)', type: 'tags' },
      { key: 'diets', label: 'Diets (comma separated)', type: 'tags' },
      { key: 'timeMin', label: 'Time (min)', type: 'number' },
      { key: 'calories', label: 'Calories', type: 'number' },
      { key: 'protein', label: 'Protein (g)', type: 'number' },
      { key: 'carbs', label: 'Carbs (g)', type: 'number' },
      { key: 'fat', label: 'Fat (g)', type: 'number' },
      { key: 'ingredients', label: 'Ingredients (one per line: name | quantity)', type: 'ingredients' },
      { key: 'steps', label: 'Steps (one per line)', type: 'lines' },
      { key: 'imageUrl', label: 'Image URL', type: 'text', optional: true },
    ],
  },
  {
    key: 'segments',
    label: 'Segments',
    columns: [{ key: 'name', label: 'Name' }, { key: 'color', label: 'Color' }],
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'color', label: 'Color (hex)', type: 'text', optional: true },
    ],
  },
];

// ── form value helpers ──
function toInput(field: Field, value: any): string {
  if (value == null) return '';
  if (field.type === 'tags') return Array.isArray(value) ? value.join(', ') : '';
  if (field.type === 'lines') return Array.isArray(value) ? value.join('\n') : '';
  if (field.type === 'ingredients') return Array.isArray(value) ? value.map((i: any) => `${i.name} | ${i.quantity}`).join('\n') : '';
  return String(value);
}
function fromInput(field: Field, raw: string): any {
  const s = raw.trim();
  if (field.type === 'number') return Number(s) || 0;
  if (field.type === 'tags') return s ? s.split(',').map((x) => x.trim()).filter(Boolean) : [];
  if (field.type === 'lines') return s ? s.split('\n').map((x) => x.trim()).filter(Boolean) : [];
  if (field.type === 'ingredients')
    return s
      ? s.split('\n').map((line) => {
          const [name, quantity] = line.split('|').map((x) => x.trim());
          return { name: name || '', quantity: quantity || '' };
        }).filter((i) => i.name)
      : [];
  return s;
}

function Login({ onDone }: { onDone: (me: Me['user']) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr('');
    setBusy(true);
    try {
      const { token, user } = await api.login(email, password);
      auth.token = token;
      if (user.role !== 'admin') throw new Error('This account is not an admin.');
      onDone(user);
    } catch (e: any) {
      setErr(e.message);
      auth.token = null;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-wrap">
      <form className="card login" onSubmit={submit}>
        <div className="brand">🌿 Al Zaabi Health</div>
        <p className="muted">Admin · preventive & metabolic health platform</p>
        <input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {err ? <div className="err">{err}</div> : null}
        <button disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}

function Editor({ resource, initial, onClose, onSaved }: { resource: Resource; initial: any | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const f of resource.fields) o[f.key] = toInput(f, initial?.[f.key]);
    return o;
  });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    setErr('');
    setBusy(true);
    try {
      const body: Record<string, any> = {};
      for (const f of resource.fields) {
        const v = fromInput(f, form[f.key] ?? '');
        if (f.optional && (v === '' || (Array.isArray(v) && v.length === 0))) continue;
        body[f.key] = v;
      }
      if (initial?.id) await api.update(resource.key, initial.id, body);
      else await api.create(resource.key, body);
      onSaved();
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>{initial ? 'Edit' : 'New'} {resource.label.replace(/s$/, '')}</h3>
        <div className="form-grid">
          {resource.fields.map((f) => (
            <label key={f.key} className={f.type === 'lines' || f.type === 'ingredients' ? 'full' : ''}>
              <span>{f.label}</span>
              {f.type === 'select' ? (
                <select value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                  <option value="">—</option>
                  {f.options!.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : f.type === 'lines' || f.type === 'ingredients' ? (
                <textarea rows={4} value={form[f.key]} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
              ) : (
                <input
                  type={f.type === 'number' ? 'number' : 'text'}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              )}
            </label>
          ))}
        </div>
        {err ? <div className="err">{err}</div> : null}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}

function ResourceView({ resource }: { resource: Resource }) {
  const [rows, setRows] = useState<any[]>([]);
  const [editing, setEditing] = useState<any | null | undefined>(undefined); // undefined = closed
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      setRows(await api.list<any>(resource.key));
      setErr('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, [resource.key]);

  const del = async (id: string) => {
    if (!confirm('Delete this item?')) return;
    await api.remove(resource.key, id);
    load();
  };

  const cell = (row: any, key: string) => {
    const v = row[key];
    return Array.isArray(v) ? v.join(', ') : String(v ?? '');
  };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>{resource.label} <span className="count">{rows.length}</span></h2>
        <button onClick={() => setEditing(null)}>+ New {resource.label.replace(/s$/, '')}</button>
      </div>
      {err ? <div className="err">{err}</div> : null}
      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">No {resource.label.toLowerCase()} yet. Create one — it appears in the app instantly.</p>
      ) : (
        <table>
          <thead><tr>{resource.columns.map((c) => <th key={c.key}>{c.label}</th>)}<th></th></tr></thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                {resource.columns.map((c) => <td key={c.key}>{cell(r, c.key)}</td>)}
                <td className="row-actions">
                  <button className="link" onClick={() => setEditing(r)}>Edit</button>
                  <button className="link danger" onClick={() => del(r.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing !== undefined ? (
        <Editor resource={resource} initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      ) : null}
    </div>
  );
}

export function App() {
  const [me, setMe] = useState<Me['user'] | null>(null);
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState('overview');

  useEffect(() => {
    if (!auth.token) { setChecking(false); return; }
    api.me().then((r) => setMe(r.user)).catch(() => { auth.token = null; }).finally(() => setChecking(false));
  }, []);

  if (checking) return <div className="login-wrap"><p className="muted">Loading…</p></div>;
  if (!me) return <Login onDone={setMe} />;

  const resource = RESOURCES.find((r) => r.key === tab);

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">🌿 Al Zaabi Health</div>
        <nav>
          <button className={tab === 'overview' ? 'active' : ''} onClick={() => setTab('overview')}>📊 Overview</button>
          <button className={tab === 'revenue' ? 'active' : ''} onClick={() => setTab('revenue')}>💰 Revenue</button>
          <div className="nav-sep">CRM</div>
          <button className={tab === 'customers' ? 'active' : ''} onClick={() => setTab('customers')}>Customers</button>
          <button className={tab === 'plans' ? 'active' : ''} onClick={() => setTab('plans')}>Plans</button>
          <button className={tab === 'pricing' ? 'active' : ''} onClick={() => setTab('pricing')}>Pricing</button>
          <div className="nav-sep">Care</div>
          <button className={tab === 'programs' ? 'active' : ''} onClick={() => setTab('programs')}>Programs</button>
          <button className={tab === 'coaches' ? 'active' : ''} onClick={() => setTab('coaches')}>Coaches</button>
          <button className={tab === 'companies' ? 'active' : ''} onClick={() => setTab('companies')}>Corporate</button>
          <div className="nav-sep">Content</div>
          {RESOURCES.map((r) => (
            <button key={r.key} className={tab === r.key ? 'active' : ''} onClick={() => setTab(r.key)}>{r.label}</button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="muted small">{me.email}</div>
          <button className="link" onClick={() => { auth.token = null; setMe(null); }}>Sign out</button>
        </div>
      </aside>
      <main className="content">
        {tab === 'overview' ? <ReportsView />
          : tab === 'revenue' ? <RevenueView />
          : tab === 'pricing' ? <PricingView />
          : tab === 'customers' ? <CustomersView />
          : tab === 'plans' ? <PlansView />
          : tab === 'programs' ? <ProgramsView />
          : tab === 'coaches' ? <CoachesView />
          : tab === 'companies' ? <CompaniesView />
          : resource ? <ResourceView resource={resource} />
          : null}
      </main>
    </div>
  );
}
