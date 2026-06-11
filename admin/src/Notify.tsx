import React, { useEffect, useState } from 'react';
import { api } from './api';

interface Segment { id: string; name: string }
interface Result { recipients: number; devices: number; sent: number }

export function NotifyView() {
  const [segments, setSegments] = useState<Segment[]>([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => { api.list<Segment>('segments').then(setSegments).catch(() => {}); }, []);

  const send = async () => {
    setErr(''); setResult(null); setBusy(true);
    try {
      const r = await api.announce<Result>({ title, body, segmentId: segmentId || undefined });
      setResult(r);
      setTitle(''); setBody('');
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <div className="resource">
      <div className="resource-head"><h2>Push Announcement</h2></div>
      <p className="muted">Send a push notification to customers' devices. Targets everyone, or a single segment.</p>

      <div className="card" style={{ padding: 20, maxWidth: 560 }}>
        <div className="form-grid">
          <label className="full"><span>Title</span><input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="e.g. New diabetes program is live 🎉" /></label>
          <label className="full"><span>Message</span><textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={500} placeholder="What do you want to tell your users?" /></label>
          <label className="full"><span>Audience</span>
            <select value={segmentId} onChange={(e) => setSegmentId(e.target.value)}>
              <option value="">All customers</option>
              {segments.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
        {err ? <div className="err">{err}</div> : null}
        {result ? (
          <div className="ok-msg">Sent to {result.devices} device(s) across {result.recipients} user(s) · {result.sent} delivered.</div>
        ) : null}
        <div className="modal-actions">
          <button onClick={send} disabled={busy || !title.trim() || !body.trim()}>{busy ? 'Sending…' : 'Send announcement'}</button>
        </div>
        <p className="muted small">Delivery requires users to have opened the mobile app and allowed notifications. Web users won't receive push.</p>
      </div>
    </div>
  );
}
