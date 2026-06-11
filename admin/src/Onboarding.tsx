import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Goal { key: string; label: string; calorieDelta: number }
interface Activity { label: string; value: number }
interface Diet { key: string; label: string; protein: number; carbs: number; fat: number }
interface Options { goals: Goal[]; activity: Activity[]; diets: Diet[] }

const slug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '_').replace(/(^_|_$)/g, '') || 'opt';

export function OnboardingView() {
  const [o, setO] = useState<Options | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => { api.getOnboarding<Options>().then(setO).catch((e) => setErr(e.message)); }, []);
  if (!o) return <div className="resource"><h2>Onboarding options</h2><p className="muted">{err || 'Loading…'}</p></div>;

  const upd = (patch: Partial<Options>) => setO({ ...o, ...patch });

  const save = async () => {
    setErr(''); setMsg(''); setBusy(true);
    try {
      const clean: Options = {
        goals: o.goals.filter((g) => g.label.trim()).map((g) => ({ key: g.key || slug(g.label), label: g.label.trim(), calorieDelta: Number(g.calorieDelta) || 0 })),
        activity: o.activity.filter((a) => a.label.trim()).map((a) => ({ label: a.label.trim(), value: Number(a.value) || 1.2 })),
        diets: o.diets.filter((d) => d.label.trim()).map((d) => ({ key: d.key || slug(d.label), label: d.label.trim(), protein: Number(d.protein) || 0, carbs: Number(d.carbs) || 0, fat: Number(d.fat) || 0 })),
      };
      if (!clean.goals.length || !clean.activity.length || !clean.diets.length) throw new Error('Each section needs at least one option.');
      const saved = await api.saveOnboarding<Options>(clean);
      setO(saved); setMsg('Saved — changes appear in the app immediately.');
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="resource">
      <div className="resource-head">
        <h2>Onboarding / Plan Options</h2>
        <button onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button>
      </div>
      <p className="muted">Add, rename, retune or remove the goals, activity levels and diets shown in the app's onboarding. These drive the calorie &amp; macro targets.</p>
      {err ? <div className="err">{err}</div> : null}
      {msg ? <div className="ok-msg">{msg}</div> : null}

      {/* Goals */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>Goals <span className="muted small">— calorie adjustment vs maintenance (kcal/day)</span></h4>
        <table className="meals-table"><thead><tr><th>Label</th><th>Calorie delta</th><th></th></tr></thead><tbody>
          {o.goals.map((g, i) => (
            <tr key={i}>
              <td><input value={g.label} onChange={(e) => upd({ goals: o.goals.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} /></td>
              <td><input type="number" className="mini" value={g.calorieDelta} onChange={(e) => upd({ goals: o.goals.map((x, j) => j === i ? { ...x, calorieDelta: Number(e.target.value) } : x) })} /></td>
              <td><button className="link danger" onClick={() => upd({ goals: o.goals.filter((_, j) => j !== i) })}>Remove</button></td>
            </tr>
          ))}
        </tbody></table>
        <button className="ghost" onClick={() => upd({ goals: [...o.goals, { key: '', label: '', calorieDelta: 0 }] })}>+ Add goal</button>
      </div>

      {/* Activity */}
      <div className="card" style={{ padding: 18, marginBottom: 16 }}>
        <h4 style={{ marginTop: 0 }}>Activity levels <span className="muted small">— TDEE multiplier (1.2–1.9)</span></h4>
        <table className="meals-table"><thead><tr><th>Label</th><th>Multiplier</th><th></th></tr></thead><tbody>
          {o.activity.map((a, i) => (
            <tr key={i}>
              <td><input value={a.label} onChange={(e) => upd({ activity: o.activity.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} /></td>
              <td><input type="number" step="0.025" className="mini" value={a.value} onChange={(e) => upd({ activity: o.activity.map((x, j) => j === i ? { ...x, value: Number(e.target.value) } : x) })} /></td>
              <td><button className="link danger" onClick={() => upd({ activity: o.activity.filter((_, j) => j !== i) })}>Remove</button></td>
            </tr>
          ))}
        </tbody></table>
        <button className="ghost" onClick={() => upd({ activity: [...o.activity, { label: '', value: 1.4 }] })}>+ Add level</button>
      </div>

      {/* Diets */}
      <div className="card" style={{ padding: 18 }}>
        <h4 style={{ marginTop: 0 }}>Diets <span className="muted small">— macro split as % (protein + carbs + fat should total 100)</span></h4>
        <table className="meals-table"><thead><tr><th>Label</th><th>Protein %</th><th>Carbs %</th><th>Fat %</th><th>Σ</th><th></th></tr></thead><tbody>
          {o.diets.map((d, i) => {
            const sum = (Number(d.protein) || 0) + (Number(d.carbs) || 0) + (Number(d.fat) || 0);
            return (
              <tr key={i}>
                <td><input value={d.label} onChange={(e) => upd({ diets: o.diets.map((x, j) => j === i ? { ...x, label: e.target.value } : x) })} /></td>
                <td><input type="number" className="mini" value={d.protein} onChange={(e) => upd({ diets: o.diets.map((x, j) => j === i ? { ...x, protein: Number(e.target.value) } : x) })} /></td>
                <td><input type="number" className="mini" value={d.carbs} onChange={(e) => upd({ diets: o.diets.map((x, j) => j === i ? { ...x, carbs: Number(e.target.value) } : x) })} /></td>
                <td><input type="number" className="mini" value={d.fat} onChange={(e) => upd({ diets: o.diets.map((x, j) => j === i ? { ...x, fat: Number(e.target.value) } : x) })} /></td>
                <td style={{ color: sum === 100 ? 'var(--primary-dark)' : 'var(--danger)', fontWeight: 700 }}>{sum}</td>
                <td><button className="link danger" onClick={() => upd({ diets: o.diets.filter((_, j) => j !== i) })}>Remove</button></td>
              </tr>
            );
          })}
        </tbody></table>
        <button className="ghost" onClick={() => upd({ diets: [...o.diets, { key: '', label: '', protein: 30, carbs: 40, fat: 30 }] })}>+ Add diet</button>
      </div>
    </div>
  );
}
