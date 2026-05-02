import { useState } from 'react';
import { api } from '../lib/api';

const DEMAND_TONE = {
  high: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low: 'bg-red-100 text-red-700',
};

function SalaryRow({ label, value, currency }) {
  const symbol = currency === 'USD' ? '$' : '₹';
  return (
    <li className="flex items-baseline justify-between border-b border-slate-100 py-1.5 last:border-b-0">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold tabular-nums text-slate-900">
        {symbol}
        {value?.toLocaleString() || '—'}
      </span>
    </li>
  );
}

function ResultSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <div className="card p-6">
        <div className="skeleton h-6 w-1/2" />
        <div className="skeleton mt-3 h-4 w-3/4" />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="card p-6">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton mt-3 h-4 w-full" />
          <div className="skeleton mt-2 h-4 w-full" />
          <div className="skeleton mt-2 h-4 w-full" />
        </div>
        <div className="card p-6">
          <div className="skeleton h-5 w-24" />
          <div className="skeleton mt-3 h-4 w-full" />
          <div className="skeleton mt-2 h-4 w-full" />
          <div className="skeleton mt-2 h-4 w-full" />
        </div>
      </div>
    </div>
  );
}

export default function Insights() {
  const [role, setRole] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    setData(null);
    setLoading(true);
    try {
      setData(await api.insights(role));
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold">Market Intelligence</h1>
        <p className="mt-1 text-slate-600">Salary benchmarks, demand signals, and top skills for any role.</p>
      </div>

      <form onSubmit={onSubmit} className="card mt-6 flex flex-col gap-2 p-4 sm:flex-row">
        <input
          className="input"
          placeholder="e.g. Data Scientist, DevOps Engineer"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          required
        />
        <button className="btn-primary" disabled={loading}>
          {loading ? 'Analyzing…' : 'Analyze'}
        </button>
      </form>

      {err && (
        <div role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading && <ResultSkeleton />}

      {data && !loading && (
        <div className="slide-up mt-6 space-y-4">
          <div className="card p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xl font-bold">{data.role}</h2>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                  DEMAND_TONE[data.demand?.toLowerCase()] || 'bg-slate-100 text-slate-700'
                }`}
              >
                Demand: {data.demand}
              </span>
            </div>
            <p className="mt-2 text-sm text-slate-600">{data.growthTrend}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-semibold">Salary (USD)</h3>
              <ul className="mt-3 text-sm">
                <SalaryRow label="Junior" value={data.avgSalaryUSD?.junior} currency="USD" />
                <SalaryRow label="Mid" value={data.avgSalaryUSD?.mid} currency="USD" />
                <SalaryRow label="Senior" value={data.avgSalaryUSD?.senior} currency="USD" />
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="font-semibold">Salary (INR)</h3>
              <ul className="mt-3 text-sm">
                <SalaryRow label="Junior" value={data.avgSalaryINR?.junior} currency="INR" />
                <SalaryRow label="Mid" value={data.avgSalaryINR?.mid} currency="INR" />
                <SalaryRow label="Senior" value={data.avgSalaryINR?.senior} currency="INR" />
              </ul>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Top skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.topSkills?.map((s) => (
                <span key={s} className="chip bg-slate-100 text-slate-700">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Emerging skills</h3>
            <div className="mt-3 flex flex-wrap gap-2">
              {data.emergingSkills?.map((s) => (
                <span key={s} className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-200">
                  {s}
                </span>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-semibold">Top hiring companies</h3>
            <p className="mt-2 text-sm text-slate-700">{data.topCompanies?.join(' · ')}</p>
          </div>
        </div>
      )}
    </main>
  );
}
