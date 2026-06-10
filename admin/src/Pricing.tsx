import React, { useEffect, useState } from 'react';
import { api } from './api';

type Money = Record<string, number>;
interface Pricing {
  premium: { month: Money; year: Money };
  coached: { month: Money; year: Money };
}

const TIERS: ('premium' | 'coached')[] = ['premium', 'coached'];
const INTERVALS: ('month' | 'year')[] = ['month', 'year'];
const CURRENCIES = ['usd', 'aed', 'eur', 'gbp'];

/** Edit subscription prices (minor units → shown in major units). */
export function PricingView() {
  const [p, setP] = useState<Pricing | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.getPricing<Pricing>().then(setP).catch((e) => setErr(e.message));
  }, []);

  if (err) return <div className="resource"><div className="err">{err}</div></div>;
  if (!p) return <div className="resource"><p className="muted">Loading pricing…</p></div>;

  const setVal = (tier: 'premium' | 'coached', interval: 'month' | 'year', cur: string, major: string) => {
    const minor = Math.round((parseFloat(major) || 0) * 100);
    setP({ ...p, [tier]: { ...p[tier], [interval]: { ...p[tier][interval], [cur]: minor } } });
  };

  const save = async () => {
    setBusy(true); setMsg(''); setErr('');
    try {
      await api.savePricing(p);
      setMsg('Saved ✓ Prices are now live in the app paywall and checkout.');
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Pricing</h2>
        <button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save pricing'}</button>
      </div>
      <p className="muted" style={{ marginTop: -8, marginBottom: 16 }}>
        Set what customers pay per plan. Values are the price the customer is charged in each currency.
      </p>
      {msg ? <div className="ok-msg">{msg}</div> : null}

      {TIERS.map((tier) => (
        <div className="card section" key={tier}>
          <h3 style={{ textTransform: 'capitalize' }}>{tier} plan</h3>
          <table className="meals-table">
            <thead>
              <tr><th>Billing</th>{CURRENCIES.map((c) => <th key={c}>{c.toUpperCase()}</th>)}</tr>
            </thead>
            <tbody>
              {INTERVALS.map((iv) => (
                <tr key={iv}>
                  <td style={{ fontWeight: 600 }}>{iv === 'month' ? 'Monthly' : 'Yearly'}</td>
                  {CURRENCIES.map((c) => (
                    <td key={c}>
                      <input
                        className="mini"
                        type="number"
                        step="0.01"
                        value={(p[tier][iv][c] ?? 0) / 100}
                        onChange={(e) => setVal(tier, iv, c, e.target.value)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
