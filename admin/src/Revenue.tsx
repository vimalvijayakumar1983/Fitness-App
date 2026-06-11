import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Revenue {
  mrr: number;
  arr: number;
  arpu: number;
  paying: number;
  byPlan: { premium: number; coached: number };
  movement: { newMrr: number; churnedMrr: number; netMrr: number };
  mrrSeries: { label: string; mrr: number }[];
}

export function RevenueView() {
  const [r, setR] = useState<Revenue | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => { api.revenue<Revenue>().then(setR).catch((e) => setErr(e.message)); }, []);

  if (err) return <div className="resource"><div className="err">{err}</div></div>;
  if (!r) return <div className="resource"><p className="muted">Loading revenue…</p></div>;

  const maxMrr = Math.max(1, ...r.mrrSeries.map((d) => d.mrr));
  const maxPlan = Math.max(1, r.byPlan.premium, r.byPlan.coached);

  return (
    <div className="resource">
      <div className="resource-head"><h2>Revenue</h2></div>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Estimated from active subscriptions × your pricing. Becomes actual paid revenue once Stripe is connected.
      </p>

      <div className="kpi-grid">
        <Kpi label="MRR" value={`AED ${r.mrr.toLocaleString()}`} sub="monthly recurring" accent />
        <Kpi label="ARR" value={`AED ${r.arr.toLocaleString()}`} sub="annual run-rate" />
        <Kpi label="ARPU" value={`AED ${r.arpu}`} sub="per paying user" />
        <Kpi label="Net new MRR (30d)" value={`${r.movement.netMrr >= 0 ? '+' : ''}AED ${r.movement.netMrr}`} sub={`+AED ${r.movement.newMrr} new · -AED ${r.movement.churnedMrr} churned`} />
        <Kpi label="Paying" value={r.paying} sub="active subscriptions" />
      </div>

      <div className="card section">
        <h3>MRR · last 12 weeks</h3>
        <div className="bars">
          {r.mrrSeries.map((d, i) => (
            <div className="bar-col" key={i} title={`${d.label}: AED ${d.mrr}`}>
              <div className="bar" style={{ height: `${(d.mrr / maxMrr) * 100}%` }}>
                {d.mrr > 0 ? <span className="bar-val">{d.mrr}</span> : null}
              </div>
              <span className="bar-label">{d.label.split(' ')[1]}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="two-col">
        <div className="card section">
          <h3>Revenue by plan (MRR)</h3>
          <PlanBar label="Premium" value={r.byPlan.premium} max={maxPlan} color="#23a455" />
          <PlanBar label="Coached" value={r.byPlan.coached} max={maxPlan} color="#f2784b" />
        </div>
        <div className="card section">
          <h3>MRR movement (30d)</h3>
          <div className="dist"><div className="dist-head"><span>New MRR</span><span className="muted">+AED {r.movement.newMrr}</span></div>
            <div className="dist-track"><div className="dist-fill" style={{ width: `${pct(r.movement.newMrr, r.movement.newMrr + r.movement.churnedMrr)}%`, background: '#23a455' }} /></div></div>
          <div className="dist"><div className="dist-head"><span>Churned MRR</span><span className="muted">-AED {r.movement.churnedMrr}</span></div>
            <div className="dist-track"><div className="dist-fill" style={{ width: `${pct(r.movement.churnedMrr, r.movement.newMrr + r.movement.churnedMrr)}%`, background: '#e5484d' }} /></div></div>
          <div style={{ marginTop: 12, fontWeight: 800, fontSize: 18 }}>
            Net: {r.movement.netMrr >= 0 ? '+' : ''}AED {r.movement.netMrr}/mo
          </div>
        </div>
      </div>
    </div>
  );
}

const pct = (v: number, total: number) => (total ? Math.round((v / total) * 100) : 0);

function Kpi({ label, value, sub, accent }: { label: string; value: React.ReactNode; sub?: string; accent?: boolean }) {
  return (
    <div className={`kpi ${accent ? 'kpi-accent' : ''}`}>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value">{value}</div>
      {sub ? <div className="kpi-sub">{sub}</div> : null}
    </div>
  );
}

function PlanBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  return (
    <div className="dist">
      <div className="dist-head"><span>{label}</span><span className="muted">AED {value}/mo</span></div>
      <div className="dist-track"><div className="dist-fill" style={{ width: `${(value / max) * 100}%`, background: color }} /></div>
    </div>
  );
}
