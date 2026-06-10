import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Company {
  id: string;
  name: string;
  joinCode: string;
  seats: number;
  contactEmail: string;
  plan: string;
  seatsUsed?: number;
}
interface CompanyDetail extends Company {
  seatsUsed: number;
  activeThisWeek: number;
  engagement: number;
  employees: { email: string; name: string | null; plan: string; joinedAt: string; lastActive: string | null }[];
}

const blank: Company = { id: '', name: '', joinCode: '', seats: 50, contactEmail: '', plan: 'premium' };

export function CompaniesView() {
  const [rows, setRows] = useState<Company[]>([]);
  const [editing, setEditing] = useState<Company | undefined>(undefined);
  const [detail, setDetail] = useState<CompanyDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');

  const load = async () => {
    setLoading(true);
    try { setRows(await api.listCompanies<Company>()); setErr(''); }
    catch (e: any) { setErr(e.message); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const del = async (id: string) => { if (confirm('Delete this company? Employees keep their accounts but lose the corporate plan.')) { await api.deleteCompany(id); load(); } };
  const open = async (id: string) => {
    try { setDetail(await api.getCompany<CompanyDetail>(id)); }
    catch (e: any) { setErr(e.message); }
  };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Corporate Wellness <span className="count">{rows.length}</span></h2>
        <button onClick={() => setEditing(blank)}>+ New Company</button>
      </div>
      {err ? <div className="err">{err}</div> : null}
      {loading ? <p className="muted">Loading…</p> : rows.length === 0 ? (
        <p className="muted">No companies yet. Add an employer — employees redeem the join code in-app to unlock their plan.</p>
      ) : (
        <table>
          <thead><tr><th>Company</th><th>Join code</th><th>Seats</th><th>Plan</th><th></th></tr></thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id}>
                <td>{c.name}<div className="muted small">{c.contactEmail}</div></td>
                <td><span className="badge">{c.joinCode}</span></td>
                <td>{c.seatsUsed ?? 0} / {c.seats}</td>
                <td>{c.plan}</td>
                <td className="row-actions">
                  <button className="link" onClick={() => open(c.id)}>Dashboard</button>
                  <button className="link" onClick={() => setEditing(c)}>Edit</button>
                  <button className="link danger" onClick={() => del(c.id)}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {editing !== undefined ? (
        <CompanyEditor initial={editing} onClose={() => setEditing(undefined)} onSaved={() => { setEditing(undefined); load(); }} />
      ) : null}
      {detail ? <CompanyDashboard data={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}

function CompanyDashboard({ data, onClose }: { data: CompanyDetail; onClose: () => void }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card wide" onClick={(e) => e.stopPropagation()}>
        <h3>{data.name}</h3>
        <div className="kpi-grid">
          <div className="kpi"><div className="kpi-label">Seats used</div><div className="kpi-value">{data.seatsUsed}</div><div className="kpi-sub">of {data.seats}</div></div>
          <div className="kpi"><div className="kpi-label">Active this week</div><div className="kpi-value">{data.activeThisWeek}</div></div>
          <div className="kpi kpi-accent"><div className="kpi-label">Engagement</div><div className="kpi-value">{data.engagement}%</div><div className="kpi-sub">weekly active / enrolled</div></div>
        </div>
        <h4 style={{ margin: '8px 0' }}>Employees</h4>
        {data.employees.length === 0 ? <p className="muted">No employees have joined with code <b>{data.joinCode}</b> yet.</p> : (
          <table>
            <thead><tr><th>Employee</th><th>Plan</th><th>Joined</th><th>Last active</th></tr></thead>
            <tbody>
              {data.employees.map((e) => (
                <tr key={e.email}>
                  <td>{e.name || e.email}<div className="muted small">{e.email}</div></td>
                  <td>{e.plan}</td>
                  <td className="muted small">{new Date(e.joinedAt).toLocaleDateString()}</td>
                  <td className="muted small">{e.lastActive ? new Date(e.lastActive).toLocaleDateString() : '—'}</td>
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

function CompanyEditor({ initial, onClose, onSaved }: { initial: Company; onClose: () => void; onSaved: () => void }) {
  const [c, setC] = useState<Company>({ ...initial });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Company>) => setC((cur) => ({ ...cur, ...patch }));

  const save = async () => {
    setErr(''); setBusy(true);
    try {
      const body = {
        name: c.name, joinCode: c.joinCode || undefined, seats: Number(c.seats) || 1,
        contactEmail: c.contactEmail || undefined, plan: c.plan,
      };
      if (initial.id) await api.updateCompany(initial.id, body);
      else await api.createCompany(body);
      onSaved();
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <h3>{initial.id ? 'Edit' : 'New'} Company</h3>
        <div className="form-grid">
          <label className="full"><span>Company name</span><input value={c.name} onChange={(e) => set({ name: e.target.value })} /></label>
          <label><span>Join code (blank = auto)</span><input value={c.joinCode} onChange={(e) => set({ joinCode: e.target.value.toUpperCase() })} placeholder="AUTO" /></label>
          <label><span>Seats</span><input type="number" value={c.seats} onChange={(e) => set({ seats: Number(e.target.value) })} /></label>
          <label><span>Employee plan</span>
            <select value={c.plan} onChange={(e) => set({ plan: e.target.value })}>
              <option value="premium">premium</option>
              <option value="coached">coached</option>
            </select>
          </label>
          <label className="full"><span>Contact email</span><input value={c.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} placeholder="hr@company.com" /></label>
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
