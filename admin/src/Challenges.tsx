import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Challenge {
  id: string; title: string; description: string; emoji: string;
  metric: string; goal: number; unit: string; startAt: string; endAt: string;
  active: boolean; participants?: number;
}

const METRICS = ['steps', 'active_minutes', 'workouts', 'glucose_logs', 'days_logged'];
const today = () => new Date().toISOString().slice(0, 10);
const plus = (d: number) => new Date(Date.now() + d * 864e5).toISOString().slice(0, 10);

const blank: Challenge = {
  id: '', title: '', description: '', emoji: '🏆', metric: 'steps', goal: 70000, unit: 'steps',
  startAt: today(), endAt: plus(7), active: true,
};

export function ChallengesView() {
  const [rows, setRows] = useState<Challenge[]>([]);
  const [editing, setEditing] = useState<Challenge | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRows(await api.listChallenges<Challenge>()); setErr(''); }
    catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => { if (confirm('Delete this challenge?')) { await api.deleteChallenge(id); load(); } };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Challenges <span className="count">{rows.length}</span></h2>
        <button onClick={() => setEditing(blank)}>+ New Challenge</button>
      </div>
      {err ? <div className="err">{err}</div> : null}
      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">No challenges yet. Create one — it appears in the app's Care tab with a live leaderboard.</p>
      ) : (
        <table>
          <thead><tr><th>Challenge</th><th>Metric</th><th>Goal</th><th>Window</th><th>Joined</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.emoji} {c.title}</td>
                <td>{c.metric}</td>
                <td>{c.goal.toLocaleString()} {c.unit}</td>
                <td className="muted small">{c.startAt.slice(0, 10)} → {c.endAt.slice(0, 10)}</td>
                <td>{c.participants ?? 0}</td>
                <td>{c.active ? 'Active' : 'Hidden'}</td>
                <td className="row-actions">
                  <button className="link" onClick={() => setEditing(c)}>Edit</button>
                  <button className="link danger" onClick={() => del(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing !== undefined ? (
        <Editor initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      ) : null}
    </div>
  );
}

function Editor({ initial, onClose, onSaved }: { initial: Challenge; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<Challenge>({ ...initial, startAt: initial.startAt.slice(0, 10), endAt: initial.endAt.slice(0, 10) });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Challenge>) => setC((cur) => ({ ...cur, ...patch }));

  const save = async () => {
    setErr(''); setBusy(true);
    try {
      const body = {
        title: c.title, description: c.description, emoji: c.emoji, metric: c.metric,
        goal: Number(c.goal) || 1, unit: c.unit,
        startAt: new Date(c.startAt).toISOString(), endAt: new Date(c.endAt).toISOString(), active: c.active,
      };
      if (initial.id) await api.updateChallenge(initial.id, body);
      else await api.createChallenge(body);
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>{initial.id ? 'Edit' : 'New'} Challenge</h3>
        <div className="form-grid">
          <label><span>Emoji</span><input value={c.emoji} onChange={(e) => set({ emoji: e.target.value })} /></label>
          <label><span>Title</span><input value={c.title} onChange={(e) => set({ title: e.target.value })} /></label>
          <label className="full"><span>Description</span><textarea rows={2} value={c.description} onChange={(e) => set({ description: e.target.value })} /></label>
          <label><span>Metric</span>
            <select value={c.metric} onChange={(e) => set({ metric: e.target.value })}>{METRICS.map((m) => <option key={m} value={m}>{m}</option>)}</select>
          </label>
          <label><span>Goal</span><input type="number" value={c.goal} onChange={(e) => set({ goal: Number(e.target.value) })} /></label>
          <label><span>Unit</span><input value={c.unit} onChange={(e) => set({ unit: e.target.value })} placeholder="steps / min / logs" /></label>
          <label><span>Visible</span>
            <select value={c.active ? 'yes' : 'no'} onChange={(e) => set({ active: e.target.value === 'yes' })}><option value="yes">Active</option><option value="no">Hidden</option></select>
          </label>
          <label><span>Start</span><input type="date" value={c.startAt} onChange={(e) => set({ startAt: e.target.value })} /></label>
          <label><span>End</span><input type="date" value={c.endAt} onChange={(e) => set({ endAt: e.target.value })} /></label>
        </div>
        {err ? <div className="err">{err}</div> : null}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={save} disabled={busy || !c.title}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
