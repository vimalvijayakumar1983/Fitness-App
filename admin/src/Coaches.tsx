import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Coach {
  id: string;
  name: string;
  title: string;
  specialties: string[];
  bio: string;
  photoUrl?: string;
  rating: number;
  reviews: number;
  priceMonthUsd: number;
  languages: string[];
  active: boolean;
}
interface Booking { id: string; status: string; note: string; createdAt: string; email: string; userName: string | null; coachName: string }

const blank: Coach = {
  id: '', name: '', title: '', specialties: [], bio: '', photoUrl: '',
  rating: 5, reviews: 0, priceMonthUsd: 99, languages: [], active: true,
};

export function CoachesView() {
  const [rows, setRows] = useState<Coach[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [editing, setEditing] = useState<Coach | undefined>(undefined);
  const [showBookings, setShowBookings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const [c, b] = await Promise.all([api.listCoaches<Coach>(), api.coachBookings<Booking>()]);
      setRows(c); setBookings(b); setErr('');
    } catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => { if (confirm('Delete this coach?')) { await api.deleteCoach(id); load(); } };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Coaches <span className="count">{rows.length}</span></h2>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="ghost" onClick={() => setShowBookings((v) => !v)}>{showBookings ? 'Hide' : 'View'} bookings ({bookings.length})</button>
          <button onClick={() => setEditing(blank)}>+ New Coach</button>
        </div>
      </div>
      {err ? <div className="err">{err}</div> : null}

      {showBookings ? (
        <div className="card" style={{ padding: 16, marginBottom: 16 }}>
          <h4 style={{ marginTop: 0 }}>Coaching requests & relationships</h4>
          {bookings.length === 0 ? <p className="muted">No bookings yet.</p> : (
            <table>
              <thead><tr><th>Member</th><th>Coach</th><th>Status</th><th>Note</th><th>When</th></tr></thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id}>
                    <td>{b.userName || b.email}<div className="muted small">{b.email}</div></td>
                    <td>{b.coachName}</td>
                    <td><span className="badge">{b.status}</span></td>
                    <td className="muted small">{b.note || '—'}</td>
                    <td className="muted small">{new Date(b.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : null}

      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">No coaches yet. Add specialists — they appear in the app's coaching marketplace.</p>
      ) : (
        <table>
          <thead><tr><th>Name</th><th>Title</th><th>Specialties</th><th>Rating</th><th>$/mo</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td className="muted small">{c.title}</td>
                <td className="muted small">{c.specialties.join(', ')}</td>
                <td>★ {c.rating} ({c.reviews})</td>
                <td>${c.priceMonthUsd}</td>
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
        <CoachEditor initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      ) : null}
    </div>
  );
}

function CoachEditor({ initial, onClose, onSaved }: { initial: Coach; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<Coach>({ ...initial, specialties: [...initial.specialties], languages: [...initial.languages] });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Coach>) => setC((cur) => ({ ...cur, ...patch }));

  const save = async () => {
    setErr(''); setBusy(true);
    try {
      const body = {
        name: c.name, title: c.title, bio: c.bio, photoUrl: c.photoUrl || undefined,
        specialties: c.specialties.filter(Boolean), languages: c.languages.filter(Boolean),
        rating: Number(c.rating) || 0, reviews: Number(c.reviews) || 0, priceMonthUsd: Number(c.priceMonthUsd) || 0,
        active: c.active,
      };
      if (initial.id) await api.updateCoach(initial.id, body);
      else await api.createCoach(body);
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>{initial.id ? 'Edit' : 'New'} Coach</h3>
        <div className="form-grid">
          <label className="full"><span>Name</span><input value={c.name} onChange={(e) => set({ name: e.target.value })} /></label>
          <label className="full"><span>Title</span><input value={c.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. Registered Dietitian" /></label>
          <label className="full"><span>Specialties (comma separated)</span><input value={c.specialties.join(', ')} onChange={(e) => set({ specialties: e.target.value.split(',').map((s) => s.trim()) })} /></label>
          <label className="full"><span>Languages (comma separated)</span><input value={c.languages.join(', ')} onChange={(e) => set({ languages: e.target.value.split(',').map((s) => s.trim()) })} /></label>
          <label><span>Rating (0–5)</span><input type="number" step="0.1" value={c.rating} onChange={(e) => set({ rating: Number(e.target.value) })} /></label>
          <label><span>Reviews</span><input type="number" value={c.reviews} onChange={(e) => set({ reviews: Number(e.target.value) })} /></label>
          <label><span>Price ($/month)</span><input type="number" value={c.priceMonthUsd} onChange={(e) => set({ priceMonthUsd: Number(e.target.value) })} /></label>
          <label><span>Visible in app</span>
            <select value={c.active ? 'yes' : 'no'} onChange={(e) => set({ active: e.target.value === 'yes' })}>
              <option value="yes">Active</option><option value="no">Hidden</option>
            </select>
          </label>
          <label className="full"><span>Photo URL</span><input value={c.photoUrl ?? ''} onChange={(e) => set({ photoUrl: e.target.value })} placeholder="https://…" /></label>
          <label className="full"><span>Bio</span><textarea rows={3} value={c.bio} onChange={(e) => set({ bio: e.target.value })} /></label>
        </div>
        {err ? <div className="err">{err}</div> : null}
        <div className="modal-actions">
          <button className="ghost" onClick={onClose}>Cancel</button>
          <button onClick={save} disabled={busy || !c.name}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </div>
    </div>
  );
}
