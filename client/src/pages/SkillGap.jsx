import { useState } from 'react';
import { api } from '../lib/api';
import { ScoreRing } from '../components/ScoreRing.jsx';

export default function SkillGap() {
  const [targetRole, setTargetRole] = useState('');
  const [skillsText, setSkillsText] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setData(null);
    setLoading(true);
    try {
      const currentSkills = skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      setData(await api.skillGap({ targetRole, currentSkills }));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold">Skill Gap Analyzer</h1>
        <p className="mt-1 text-slate-600">
          Find out exactly what you need to learn for your target role.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card mt-6 space-y-4 p-6">
        <div>
          <label htmlFor="role" className="text-sm font-semibold">Target role</label>
          <input
            id="role"
            className="input mt-1.5"
            placeholder="e.g. Backend Engineer"
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            required
          />
        </div>
        <div>
          <label htmlFor="skills" className="text-sm font-semibold">
            Current skills <span className="font-normal text-slate-500">(comma-separated)</span>
          </label>
          <textarea
            id="skills"
            className="input mt-1.5"
            rows={3}
            placeholder="e.g. JavaScript, HTML, Git, some Python"
            value={skillsText}
            onChange={(e) => setSkillsText(e.target.value)}
            required
          />
        </div>
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Analyzing…' : 'Analyze gap'}
        </button>
      </form>

      {err && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {data && (
        <div className="slide-up mt-6 space-y-4">
          <div className="card p-6">
            <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
              <ScoreRing score={data.readinessScore} label="readiness" />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg font-bold">Your readiness for this role</h2>
                <p className="mt-2 text-sm text-slate-600">{data.summary}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-semibold text-green-700">
                ✓ You already have ({data.haveSkills?.length || 0})
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.haveSkills?.length ? (
                  data.haveSkills.map((s) => (
                    <span key={s} className="chip bg-green-50 text-green-700 ring-1 ring-green-200">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-slate-400">None listed yet.</p>
                )}
              </div>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold text-red-700">
                ✗ You're missing ({data.missingSkills?.length || 0})
              </h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {data.missingSkills?.length ? (
                  data.missingSkills.map((s) => (
                    <span key={s} className="chip bg-red-50 text-red-700 ring-1 ring-red-200">
                      {s}
                    </span>
                  ))
                ) : (
                  <p className="text-sm text-green-600">🎉 Nothing! You're ready.</p>
                )}
              </div>
            </div>
          </div>

          {data.priorityOrder?.length > 0 && (
            <div className="card p-6">
              <h3 className="font-semibold">Learn in this order</h3>
              <ol className="mt-3 space-y-2">
                {data.priorityOrder.map((s, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                      {i + 1}
                    </span>
                    <span className="text-sm text-slate-700">{s}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
