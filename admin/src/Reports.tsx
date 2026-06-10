import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Stats {
  totalUsers: number;
  totalCustomers: number;
  newToday: number;
  new7d: number;
  new30d: number;
  plans: { free: number; premium: number; coached: number; paying: number };
  conversion: number;
  mrr: number;
  signups: { date: string; count: number }[];
  segments: { name: string; n: number }[];
  recent: { email: string; name: string | null; plan: string; createdAt: string }[];
}

export function ReportsView() {
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api.stats<Stats>().then(setS).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  if (loading) return <div className="resource"><p className="muted">Loading reports…</p></div>;
  if (err) return <div className="resource"><div className="err">{err}</div></div>;
  if (!s) return null;

  const maxSignup = Math.max(1, ...s.signups.map((d) => d.count));
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Overview</h2>
        <button className="ghost" onClick={load}>↻ Refresh</button>
      </div>

      {/* KPI cards */}
      <div className="kpi-grid">
        <Kpi label="Total accounts" value={s.totalUsers} sub={`${s.totalCustomers} customers`} />
        <Kpi label="Paying subscribers" value={s.plans.paying} sub={`${s.plans.premium} premium · ${s.plans.coached} coached`} accent />
        <Kpi label="Est. MRR" value={`$${s.mrr.toLocaleString()}`} sub="monthly recurring" />
        <Kpi label="Conversion" value={`${s.conversion}%`} sub="paying / accounts" />
        <Kpi label="New today" value={s.newToday} sub={`${s.new7d} this week`} />
        <Kpi label="New (30d)" value={s.new30d} sub="last 30 days" />
      </div>

      {/* Signups chart */}
      <div className="card section">
        <h3>Signups · last 14 days</h3>
        <div className="bars">
          {s.signups.map((d) => (
            <div className="bar-col" key={d.date} title={`${d.date}: ${d.count}`}>
              <div className="bar" style={{ height: `${(d.count / maxSignup) * 100}%` }}>
                {d.count > 0 ? <span className="bar-val">{d.count}</span> : null}
              </div>
              <span className="bar-label">{fmtDate(d.date).split(' ')[1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        {/* Plan distribution */}
        <div className="card section">
          <h3>Plan distribution</h3>
          <Dist label="Free" value={s.plans.free} total={s.totalUsers} color="#94a3b8" />
          <Dist label="Premium" value={s.plans.premium} total={s.totalUsers} color="#23a455" />
          <Dist label="Coached" value={s.plans.coached} total={s.totalUsers} color="#f2784b" />
        </div>

        {/* Segments */}
        <div className="card section">
          <h3>Segments</h3>
          {s.segments.length === 0 ? (
            <p className="muted">No segments yet. Create them in the Segments tab and assign in Customers.</p>
          ) : (
            s.segments.map((seg) => <Dist key={seg.name} label={seg.name} value={seg.n} total={s.totalCustomers} color="#6c4ce0" />)
          )}
        </div>
      </div>

      {/* Recent signups */}
      <div className="card section">
        <h3>Recent signups</h3>
        <table>
          <thead><tr><th>Email</th><th>Name</th><th>Plan</th><th>Joined</th></tr></thead>
          <tbody>
            {s.recent.map((r) => (
              <tr key={r.email}>
                <td>{r.email}</td>
                <td>{r.name ?? '—'}</td>
                <td>{r.plan === 'free' ? <span className="muted">Free</span> : <span className="badge">{r.plan}</span>}</td>
                <td>{new Date(r.createdAt).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Kpi({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div className={`kpi ${accent ? 'kpi-accent' : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  );
}

function Dist({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="dist">
      <div className="dist-head"><span>{label}</span><span className="muted">{value} · {pct}%</span></div>
      <div className="dist-track"><div className="dist-fill" style={{ width: `${pct}%`, background: color }} /></div>
    </div>
  );
}
