import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../store/auth.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';

function StatCard({ label, value, accent = false }) {
  return (
    <div className="card-hover slide-up p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold tabular-nums ${accent ? 'text-brand-600' : 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}

function StatSkeleton() {
  return (
    <div className="card p-5">
      <div className="skeleton h-3 w-20" />
      <div className="skeleton mt-3 h-8 w-16" />
    </div>
  );
}

function RoadmapSkeleton() {
  return (
    <div className="card p-6">
      <div className="skeleton h-5 w-3/4" />
      <div className="skeleton mt-2 h-4 w-1/2" />
      <div className="skeleton mt-6 h-2 w-full" />
      <div className="mt-4 flex gap-2">
        <div className="skeleton h-9 flex-1" />
        <div className="skeleton h-9 w-20" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [roadmaps, setRoadmaps] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toDelete, setToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    try {
      const [rs, st] = await Promise.all([api.listRoadmaps(), api.stats()]);
      setRoadmaps(rs.roadmaps || []);
      setStats(st);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function confirmDelete() {
    if (!toDelete) return;
    setDeleting(true);
    try {
      await api.deleteRoadmap(toDelete._id);
      setToDelete(null);
      await refresh();
    } catch (e) {
      setError(e.message);
    } finally {
      setDeleting(false);
    }
  }

  const overallPct = stats?.totals?.tasksTotal
    ? Math.round((stats.totals.tasksDone / stats.totals.tasksTotal) * 100)
    : 0;

  return (
    <main className="mx-auto max-w-6xl px-4 pb-12 pt-6 md:pt-12">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Hi, {user?.name?.split(' ')[0] || 'there'}</h1>
          <p className="mt-1 text-sm text-slate-600 sm:text-base">Pick up where you left off.</p>
        </div>
        <Link to="/onboarding" className="btn-primary self-start text-sm sm:self-auto sm:text-base">
          + New roadmap
        </Link>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-4">
        {loading || !stats ? (
          <>
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
            <StatSkeleton />
          </>
        ) : (
          <>
            <StatCard label="Roadmaps" value={stats.totals.roadmaps} />
            <StatCard label="Tasks done" value={stats.totals.tasksDone} />
            <StatCard label="Total tasks" value={stats.totals.tasksTotal} />
            <StatCard label="Overall progress" value={`${overallPct}%`} accent />
          </>
        )}
      </div>

      {stats?.badges?.length > 0 && (
        <div className="card slide-up mt-4 p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Badges earned</div>
          <div className="mt-3 flex flex-wrap gap-2">
            {stats.badges.map((b) => (
              <span
                key={b.name}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-medium ring-1 ${
                  b.level === 'platinum' ? 'bg-violet-50 text-violet-700 ring-violet-200' :
                  b.level === 'gold' ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                  b.level === 'silver' ? 'bg-slate-100 text-slate-700 ring-slate-300' :
                  'bg-orange-50 text-orange-700 ring-orange-200'
                }`}
              >
                {b.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 md:mt-10">
        <h2 className="text-lg font-semibold text-slate-700">Your roadmaps</h2>
        {loading ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <RoadmapSkeleton />
            <RoadmapSkeleton />
            <RoadmapSkeleton />
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="card mt-4 p-12 text-center">
            <h3 className="text-xl font-semibold">No roadmaps yet</h3>
            <p className="mt-2 text-slate-600">
              Generate your first personalized career roadmap in under a minute.
            </p>
            <Link to="/onboarding" className="btn-primary mt-6">
              Create your first roadmap
            </Link>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roadmaps.map((r) => (
              <div key={r._id} className="card-hover slide-up flex flex-col p-5 sm:p-6">
                <h3 className="text-lg font-semibold leading-snug">{r.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{r.targetRole}</p>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-medium tabular-nums">{r.completedPct}% complete</span>
                    <span>{r.totalWeeks} weeks</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-2 rounded-full bg-gradient-to-r from-brand-500 to-indigo-500 transition-all duration-700"
                      style={{ width: `${r.completedPct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-auto flex gap-2 pt-4">
                  <Link to={`/roadmap/${r._id}`} className="btn-primary flex-1 text-sm">
                    Open
                  </Link>
                  <button
                    className="btn-ghost text-sm text-red-600 hover:bg-red-50"
                    onClick={() => setToDelete(r)}
                    aria-label={`Delete roadmap ${r.title}`}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!toDelete}
        title="Delete this roadmap?"
        message={toDelete ? `"${toDelete.title}" and all its progress will be permanently removed.` : ''}
        confirmText="Delete"
        destructive
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </main>
  );
}
