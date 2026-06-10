import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Module { week: number; title: string; focus: string; tasks: string[] }
interface Program {
  id: string;
  name: string;
  condition: string;
  tagline: string;
  description: string;
  durationWeeks: number;
  color?: string;
  outcomes: string[];
  modules: Module[];
  active: boolean;
}
interface Enrollment { id: string; email: string; name: string | null; currentWeek: number; status: string; completedTasks: string[] }

const CONDITIONS = ['diabetes', 'obesity', 'metabolic', 'hypertension', 'cholesterol', 'pcos', 'general'];

const blank: Program = {
  id: '', name: '', condition: 'diabetes', tagline: '', description: '',
  durationWeeks: 12, color: '#23A455', outcomes: [], modules: [], active: true,
};

export function ProgramsView() {
  const [rows, setRows] = useState<Program[]>([]);
  const [editing, setEditing] = useState<Program | undefined>(undefined);
  const [roster, setRoster] = useState<{ program: Program; rows: Enrollment[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRows(await api.listPrograms<Program>()); setErr(''); }
    catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => { if (confirm('Delete this program?')) { await api.deleteProgram(id); load(); } };
  const viewRoster = async (p: Program) => {
    try { setRoster({ program: p, rows: await api.programEnrollments<Enrollment>(p.id) }); }
    catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Reversal Programs <span className="count">{rows.length}</span></h2>
        <button onClick={() => setEditing(blank)}>+ New Program</button>
      </div>
      {err ? <div className="err">{err}</div> : null}
      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">No programs yet. Create one — it appears in the app's Care tab instantly.</p>
      ) : (
        <table>
          <thead><tr><th>Name</th><th>Condition</th><th>Weeks</th><th>Modules</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td><span className="badge">{p.condition}</span></td>
                <td>{p.durationWeeks}</td>
                <td>{p.modules.length}</td>
                <td>{p.active ? 'Active' : 'Hidden'}</td>
                <td className="row-actions">
                  <button className="link" onClick={() => viewRoster(p)}>Members</button>
                  <button className="link" onClick={() => setEditing(p)}>Edit</button>
                  <button className="link danger" onClick={() => del(p.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing !== undefined ? (
        <ProgramEditor initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      ) : null}
      {roster ? <RosterModal data={roster} onClose={() => setRoster(null)} /> : null}
    </div>
  );
}

function RosterModal({ data, onClose }: { data: { program: Program; rows: Enrollment[] }; onClose: () => void }) {
  const { program, rows } = data;
  const total = program.modules.reduce((a, m) => a + m.tasks.length, 0);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card wide" onClick={(e) => e.stopPropagation()}>
        <h3>{program.name} — Members <span className="count">{rows.length}</span></h3>
        {rows.length === 0 ? <p className="muted">No one has enrolled yet.</p> : (
          <table>
            <thead><tr><th>Member</th><th>Week</th><th>Progress</th><th>Status</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.name || r.email}<div className="muted small">{r.email}</div></td>
                  <td>{r.currentWeek} / {program.durationWeeks}</td>
                  <td>{total ? Math.round((r.completedTasks.length / total) * 100) : 0}%</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <div className="modal-actions"><button className="ghost" onClick={onClose}>Close</button></div>
      </div>
    </div>
  );
}

function ProgramEditor({ initial, onClose, onSaved }: { initial: Program; onClose: () => void; onSaved: () => void }) {
  const [p, setP] = useState<Program>({ ...initial, outcomes: [...initial.outcomes], modules: initial.modules.map((m) => ({ ...m, tasks: [...m.tasks] })) });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<Program>) => setP((cur) => ({ ...cur, ...patch }));

  const setModule = (i: number, patch: Partial<Module>) =>
    setP((cur) => ({ ...cur, modules: cur.modules.map((m, idx) => (idx === i ? { ...m, ...patch } : m)) }));
  const addModule = () =>
    setP((cur) => ({ ...cur, modules: [...cur.modules, { week: cur.modules.length + 1, title: '', focus: '', tasks: [] }] }));
  const removeModule = (i: number) =>
    setP((cur) => ({ ...cur, modules: cur.modules.filter((_, idx) => idx !== i) }));

  const save = async () => {
    setErr(''); setBusy(true);
    try {
      const body = {
        name: p.name, condition: p.condition, tagline: p.tagline, description: p.description,
        durationWeeks: Number(p.durationWeeks) || 1, color: p.color || undefined,
        outcomes: p.outcomes.filter(Boolean),
        modules: p.modules.map((m) => ({ week: Number(m.week), title: m.title, focus: m.focus, tasks: m.tasks.filter(Boolean) })),
        active: p.active,
      };
      if (initial.id) await api.updateProgram(initial.id, body);
      else await api.createProgram(body);
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card wide" onClick={(e) => e.stopPropagation()}>
        <h3>{initial.id ? 'Edit' : 'New'} Program</h3>
        <div className="form-grid">
          <label className="full"><span>Name</span><input value={p.name} onChange={(e) => set({ name: e.target.value })} placeholder="e.g. Type 2 Diabetes Reversal" /></label>
          <label><span>Condition</span>
            <select value={p.condition} onChange={(e) => set({ condition: e.target.value })}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label><span>Duration (weeks)</span><input type="number" value={p.durationWeeks} onChange={(e) => set({ durationWeeks: Number(e.target.value) })} /></label>
          <label><span>Accent colour (hex)</span><input value={p.color ?? ''} onChange={(e) => set({ color: e.target.value })} placeholder="#23A455" /></label>
          <label><span>Visible in app</span>
            <select value={p.active ? 'yes' : 'no'} onChange={(e) => set({ active: e.target.value === 'yes' })}>
              <option value="yes">Active</option><option value="no">Hidden</option>
            </select>
          </label>
          <label className="full"><span>Tagline</span><input value={p.tagline} onChange={(e) => set({ tagline: e.target.value })} placeholder="One-line promise" /></label>
          <label className="full"><span>Description</span><textarea rows={3} value={p.description} onChange={(e) => set({ description: e.target.value })} /></label>
          <label className="full"><span>Expected outcomes (one per line)</span>
            <textarea rows={4} value={p.outcomes.join('\n')} onChange={(e) => set({ outcomes: e.target.value.split('\n') })} />
          </label>
        </div>

        <h4 style={{ margin: '18px 0 8px' }}>Weekly modules · {p.modules.length}</h4>
        {p.modules.map((m, i) => (
          <div key={i} className="card" style={{ padding: 14, marginBottom: 10 }}>
            <div className="form-grid">
              <label><span>Week</span><input type="number" value={m.week} onChange={(e) => setModule(i, { week: Number(e.target.value) })} /></label>
              <label><span>Focus</span><input value={m.focus} onChange={(e) => setModule(i, { focus: e.target.value })} placeholder="e.g. Insulin sensitivity" /></label>
              <label className="full"><span>Title</span><input value={m.title} onChange={(e) => setModule(i, { title: e.target.value })} placeholder="e.g. Plate method & fibre" /></label>
              <label className="full"><span>Tasks (one per line)</span>
                <textarea rows={3} value={m.tasks.join('\n')} onChange={(e) => setModule(i, { tasks: e.target.value.split('\n') })} />
              </label>
            </div>
            <button className="link danger" onClick={() => removeModule(i)}>Remove week</button>
          </div>
        ))}
        <button className="ghost" onClick={addModule}>+ Add week</button>

        {err ? <div className="err">{err}</div> : null}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={save} disabled={busy || !p.name}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
