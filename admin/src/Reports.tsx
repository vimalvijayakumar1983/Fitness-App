import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Stats {
  days: number;
  totalUsers: number;
  totalCustomers: number;
  newToday: number;
  newInRange: number;
  growthPct: number;
  plans: { free: number; premium: number; coached: number; paying: number };
  conversion: number;
  churned: number;
  churnRate: number;
  revenue: { mrr: number; arr: number; arpu: number };
  activeUsers: { dau: number; wau: number; mau: number };
  retention: number;
  signups: { date: string; count: number }[];
  cumulative: { date: string; count: number }[];
  newSubs: { date: string; count: number }[];
  segments: { name: string; n: number }[];
  content: { foods: number; recipes: number; exercises: number; templates: number; segments: number };
  recent: { email: string; name: string | null; plan: string; createdAt: string }[];
  recentSubs: { email: string; plan: string; at: string }[];
}

const RANGES = [7, 30, 90];

function downloadCSV(filename: string, rows: (string | number)[][]) {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = filename;
  a.click();
}

export function ReportsView() {
  const [days, setDays] = useState(30);
  const [s, setS] = useState<Stats | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  const load = (d: number) => {
    setLoading(true);
    api.stats<Stats>(d).then(setS).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  };
  useEffect(() => { load(days); }, [days]);

  const exportCustomers = async () => {
    const [cs, segs] = await Promise.all([
      api.listCustomers<any>(),
      api.list<{ id: string; name: string }>('segments'),
    ]);
    const segName = (id: string | null) => segs.find((x) => x.id === id)?.name ?? '';
    downloadCSV('customers.csv', [
      ['Email', 'Name', 'Role', 'Plan', 'Segment', 'Has plan', 'Joined'],
      ...cs.map((c: any) => [c.email, c.name ?? '', c.role, c.plan, segName(c.segmentId), c.hasPlan ? 'yes' : 'no', c.createdAt]),
    ]);
  };
  const exportSignups = () => {
    if (!s) return;
    downloadCSV('signups.csv', [['Date', 'Signups', 'Cumulative accounts'],
      ...s.signups.map((d, i) => [d.date, d.count, s.cumulative[i].count])]);
  };

  if (loading && !s) return <div className="resource"><p className="muted">Loading reports…</p></div>;
  if (err) return <div className="resource"><div className="err">{err}</div></div>;
  if (!s) return null;

  const arrow = s.growthPct > 0 ? '▲' : s.growthPct < 0 ? '▼' : '';
  const fmtDay = (iso: string) => new Date(iso + 'T00:00:00').getDate();

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Overview</h2>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div className="toggle-mini">
            {RANGES.map((r) => (
              <button key={r} className={days === r ? 'on' : ''} onClick={() => setDays(r)}>{r}d</button>
            ))}
          </div>
          <button className="ghost" onClick={exportCustomers}>⬇ Customers CSV</button>
          <button className="ghost" onClick={exportSignups}>⬇ Signups CSV</button>
        </div>
      </div>

      {/* KPIs */}
      <div className="kpi-grid">
        <Kpi label="Total accounts" value={s.totalUsers} sub={`${arrow} ${Math.abs(s.growthPct)}% vs prev ${s.days}d`} />
        <Kpi label="Paying subscribers" value={s.plans.paying} sub={`${s.plans.premium} premium · ${s.plans.coached} coached`} accent />
        <Kpi label="MRR (est.)" value={`$${s.revenue.mrr.toLocaleString()}`} sub={`ARR $${s.revenue.arr.toLocaleString()}`} />
        <Kpi label="ARPU" value={`$${s.revenue.arpu}`} sub="per paying user / mo" />
        <Kpi label="Conversion" value={`${s.conversion}%`} sub="paying / accounts" />
        <Kpi label="Churn" value={`${s.churnRate}%`} sub={`${s.churned} canceled`} />
        <Kpi label="Active (7d)" value={s.activeUsers.wau} sub={`${s.retention}% retention`} />
        <Kpi label="New today" value={s.newToday} sub={`${s.newInRange} in ${s.days}d`} />
      </div>

      {/* Active users */}
      <div className="card section">
        <h3>Active users</h3>
        <div className="mini-stats">
          <div><b>{s.activeUsers.dau}</b><span>DAU</span></div>
          <div><b>{s.activeUsers.wau}</b><span>WAU</span></div>
          <div><b>{s.activeUsers.mau}</b><span>MAU</span></div>
          <div><b>{s.retention}%</b><span>7-day retention</span></div>
        </div>
      </div>

      <div className="two-col">
        <Bars title={`Signups · last ${s.days}d`} data={s.signups} color="#23a455" labelEvery={Math.ceil(s.days / 10)} fmtDay={fmtDay} />
        <Bars title={`New subscribers · last ${s.days}d`} data={s.newSubs} color="#f2784b" labelEvery={Math.ceil(s.days / 10)} fmtDay={fmtDay} />
      </div>

      <div className="two-col">
        <div className="card section">
          <h3>Plan distribution</h3>
          <Dist label="Free" value={s.plans.free} total={s.totalUsers} color="#94a3b8" />
          <Dist label="Premium" value={s.plans.premium} total={s.totalUsers} color="#23a455" />
          <Dist label="Coached" value={s.plans.coached} total={s.totalUsers} color="#f2784b" />
        </div>
        <div className="card section">
          <h3>Segments</h3>
          {s.segments.length === 0 ? <p className="muted">No segments yet.</p>
            : s.segments.map((seg) => <Dist key={seg.name} label={seg.name} value={seg.n} total={s.totalCustomers} color="#6c4ce0" />)}
        </div>
      </div>

      {/* Content library */}
      <div className="card section">
        <h3>Content library</h3>
        <div className="mini-stats">
          <div><b>{s.content.foods}</b><span>Foods</span></div>
          <div><b>{s.content.recipes}</b><span>Recipes</span></div>
          <div><b>{s.content.exercises}</b><span>Exercises</span></div>
          <div><b>{s.content.templates}</b><span>Plan templates</span></div>
          <div><b>{s.content.segments}</b><span>Segments</span></div>
        </div>
      </div>

      <div className="two-col">
        <div className="card section">
          <h3>Recent signups</h3>
          <table>
            <thead><tr><th>Email</th><th>Plan</th><th>Joined</th></tr></thead>
            <tbody>
              {s.recent.map((r) => (
                <tr key={r.email}>
                  <td>{r.email}</td>
                  <td>{r.plan === 'free' ? <span className="muted">Free</span> : <span className="badge">{r.plan}</span>}</td>
                  <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card section">
          <h3>Recent subscriptions</h3>
          {s.recentSubs.length === 0 ? <p className="muted">No paid subscriptions yet.</p> : (
            <table>
              <thead><tr><th>Email</th><th>Plan</th><th>When</th></tr></thead>
              <tbody>
                {s.recentSubs.map((r) => (
                  <tr key={r.email + r.at}>
                    <td>{r.email}</td>
                    <td><span className="badge">{r.plan}</span></td>
                    <td>{new Date(r.at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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

function Bars({ title, data, color, labelEvery, fmtDay }: {
  title: string; data: { date: string; count: number }[]; color: string; labelEvery: number; fmtDay: (s: string) => number;
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="card section">
      <h3>{title}</h3>
      <div className="bars">
        {data.map((d, i) => (
          <div className="bar-col" key={d.date} title={`${d.date}: ${d.count}`}>
            <div className="bar" style={{ height: `${(d.count / max) * 100}%`, background: color }} />
            <span className="bar-label">{i % labelEvery === 0 ? fmtDay(d.date) : ''}</span>
          </div>
        ))}
      </div>
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
