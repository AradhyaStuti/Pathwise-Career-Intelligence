import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';

export default function RoadmapView() {
  const { id } = useParams();
  const [roadmap, setRoadmap] = useState(null);
  const [openWeek, setOpenWeek] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .getRoadmap(id)
      .then((d) => setRoadmap(d.roadmap))
      .catch((e) => setError(e.message));
  }, [id]);

  async function toggleTask(weekId, taskId, completed) {
    try {
      const { roadmap: updated } = await api.toggleTask(id, {
        weekId,
        taskId,
        completed: !completed,
      });
      setRoadmap(updated);
    } catch (e) {
      setError(e.message);
    }
  }

  if (error) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <div className="card p-8 text-center">
          <h2 className="text-xl font-bold">Couldn't load this roadmap</h2>
          <p className="mt-2 text-sm text-slate-600">{error}</p>
          <Link to="/dashboard" className="btn-primary mt-6 inline-flex">
            Back to dashboard
          </Link>
        </div>
      </main>
    );
  }

  if (!roadmap) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton mt-4 h-8 w-2/3" />
        <div className="skeleton mt-2 h-4 w-1/2" />
        <div className="skeleton mt-6 h-3 w-full" />
        <div className="mt-8 space-y-3">
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
          <div className="skeleton h-20 w-full" />
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex items-center justify-between print:hidden">
        <Link to="/dashboard" className="text-sm text-brand-600">
          ← Back to dashboard
        </Link>
        <button className="btn-ghost text-sm" onClick={() => window.print()}>
          Export as PDF
        </button>
      </div>
      <h1 className="mt-2 text-3xl font-bold">{roadmap.title}</h1>
      <p className="mt-1 text-slate-600">
        {roadmap.targetRole} • {roadmap.hoursPerWeek}h/week • {roadmap.totalWeeks} weeks
      </p>

      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>{roadmap.completedPct}% complete</span>
        </div>
        <div className="mt-1 h-3 w-full rounded-full bg-slate-100">
          <div
            className="h-3 rounded-full bg-brand-500 transition-all"
            style={{ width: `${roadmap.completedPct}%` }}
          />
        </div>
      </div>

      {roadmap.skillsToGain?.length > 0 && (
        <div className="card mt-6 p-5">
          <h3 className="text-sm font-semibold text-slate-700">Skills you'll gain</h3>
          <div className="mt-2 flex flex-wrap gap-2">
            {roadmap.skillsToGain.map((s) => (
              <span
                key={s}
                className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700"
              >
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {roadmap.weeks.map((w, idx) => {
          const isOpen = openWeek === idx;
          const done = w.tasks.filter((t) => t.completed).length;
          return (
            <div key={w._id} className="card overflow-hidden">
              <button
                onClick={() => setOpenWeek(isOpen ? -1 : idx)}
                className="flex w-full items-center justify-between p-5 text-left hover:bg-slate-50"
              >
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-brand-600">
                    Week {w.weekNumber}
                  </div>
                  <div className="mt-1 font-semibold">{w.theme}</div>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <div>
                    {done}/{w.tasks.length} tasks
                  </div>
                  <div className="text-xs">{isOpen ? '▲' : '▼'}</div>
                </div>
              </button>
              {isOpen && (
                <div className="border-t border-slate-100 p-5">
                  {w.goals?.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold uppercase text-slate-500">Goals</h4>
                      <ul className="mt-1 list-inside list-disc text-sm text-slate-700">
                        {w.goals.map((g, i) => (
                          <li key={i}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <h4 className="text-xs font-semibold uppercase text-slate-500">Tasks</h4>
                  <ul className="mt-2 space-y-2">
                    {w.tasks.map((t) => (
                      <li key={t._id}>
                        <label
                          className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-slate-50 ${
                            t.completed ? 'border-slate-200 bg-slate-50' : 'border-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={t.completed}
                            onChange={() => toggleTask(w._id, t._id, t.completed)}
                            className="mt-1 h-4 w-4 cursor-pointer accent-brand-600"
                            aria-label={`Mark task ${t.title} ${t.completed ? 'incomplete' : 'complete'}`}
                          />
                          <div className="flex-1">
                            <div className={t.completed ? 'text-slate-400 line-through' : 'text-slate-800'}>
                              {t.title}
                            </div>
                            <div className="mt-1 text-xs text-slate-500">
                              {t.type} • ~{t.hours}h
                            </div>
                          </div>
                        </label>
                      </li>
                    ))}
                  </ul>

                  {w.resources?.length > 0 && (
                    <>
                      <h4 className="mt-5 text-xs font-semibold uppercase text-slate-500">
                        Free resources
                      </h4>
                      <ul className="mt-2 space-y-1 text-sm">
                        {w.resources.map((r, i) => (
                          <li key={i}>
                            <a
                              href={r.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-brand-600 hover:underline"
                            >
                              {r.title}
                            </a>
                            <span className="ml-2 text-xs text-slate-400">({r.type})</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {w.milestone && (
                    <div className="mt-5 rounded-lg bg-brand-50 p-3 text-sm text-brand-800">
                      <strong>Milestone:</strong> {w.milestone}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </main>
  );
}
