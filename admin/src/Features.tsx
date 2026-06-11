import React, { useEffect, useState } from 'react';
import { api } from './api';

type Gates = Record<string, 'free' | 'premium'>;

const META: Record<string, { label: string; desc: string }> = {
  ai_coach: { label: 'AI Coach chat', desc: 'Claude-powered coach on the dashboard' },
  ai_food_photo: { label: 'Snap-a-meal (AI photo)', desc: 'Identify food & macros from a photo' },
  lab_analysis: { label: 'AI lab analysis', desc: 'Read & explain blood panels' },
  meal_plan: { label: 'Meal-plan generation', desc: 'Auto-generate a day of meals' },
  coaching: { label: '1:1 Coaching', desc: 'Book a human coach' },
  programs: { label: 'Reversal programs', desc: 'Diabetes/obesity programs' },
  longevity: { label: 'Longevity & biological age', desc: 'Digital twin projection' },
  glucose: { label: 'Glucose / CGM', desc: 'Track blood sugar' },
  family: { label: 'Family health', desc: 'Track household members' },
  week_review: { label: 'Week in review', desc: 'Weekly insights' },
  challenges: { label: 'Challenges', desc: 'Community challenges & leaderboards' },
};

export function FeaturesView() {
  const [gates, setGates] = useState<Gates | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { api.getFeatures<Gates>().then(setGates).catch((e) => setErr(e.message)); }, []);
  if (!gates) return <div className="resource"><h2>Features</h2><p className="muted">{err || 'Loading…'}</p></div>;

  const set = (k: string, v: 'free' | 'premium') => setGates({ ...gates, [k]: v });

  const save = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try { setGates(await api.saveFeatures<Gates>(gates)); setMsg('Saved — changes apply in the app immediately.'); }
    catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  const keys = Object.keys(gates).sort((a, b) => (META[a]?.label || a).localeCompare(META[b]?.label || b));

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Features · Free vs Premium</h2>
        <button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
      <p className="muted">Choose which features require Premium. Free users see an “Upgrade” prompt when they tap a Premium feature.</p>
      {err ? <div className="err">{err}</div> : null}
      {msg ? <div className="ok-msg">{msg}</div> : null}

      <table>
        <thead><tr><th>Feature</th><th>Access</th></tr></thead>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <td>
                <div style={{ fontWeight: 600 }}>{META[k]?.label || k}</div>
                <div className="muted small">{META[k]?.desc || k}</div>
              </td>
              <td>
                <div className="toggle-mini">
                  <button className={gates[k] === 'free' ? 'on' : ''} onClick={() => set(k, 'free')}>Free</button>
                  <button className={gates[k] === 'premium' ? 'on' : ''} onClick={() => set(k, 'premium')}>Premium</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
