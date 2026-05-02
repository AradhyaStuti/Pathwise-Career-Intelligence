import { useEffect, useState } from 'react';
import { api } from '../lib/api';

function rankBadge(i) {
  if (i === 0) return '🥇';
  if (i === 1) return '🥈';
  if (i === 2) return '🥉';
  return `#${i + 1}`;
}

function RowSkeleton() {
  return (
    <div className="card flex items-center gap-4 p-4">
      <div className="skeleton h-8 w-8 rounded-full" />
      <div className="flex-1">
        <div className="skeleton h-4 w-32" />
        <div className="skeleton mt-2 h-3 w-20" />
      </div>
      <div className="skeleton h-6 w-12" />
    </div>
  );
}

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api
      .leaderboard()
      .then((d) => setBoard(d.leaderboard || []))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold">Leaderboard</h1>
        <p className="mt-1 text-sm text-slate-600">Top learners by tasks completed.</p>
      </div>

      {error && (
        <div role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="mt-8 space-y-3">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : board.length === 0 ? (
        <div className="card mt-8 p-12 text-center">
          <p className="text-slate-600">No activity yet. Be the first to climb the board.</p>
        </div>
      ) : (
        <>
          <ul className="mt-8 space-y-3 md:hidden">
            {board.map((u, i) => (
              <li key={i} className="card flex items-center gap-4 p-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-base font-bold">
                  {rankBadge(i)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="truncate font-medium">{u.name}</div>
                  <div className="mt-0.5 text-xs text-slate-500">
                    {u.doneTasks} tasks · {u.roadmaps} roadmaps
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold tabular-nums text-brand-600">{u.pct}%</div>
                  <div className="text-[10px] uppercase text-slate-400">progress</div>
                </div>
              </li>
            ))}
          </ul>

          <div className="card mt-8 hidden overflow-hidden md:block">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="p-4">Rank</th>
                  <th className="p-4">Name</th>
                  <th className="p-4 text-right">Tasks done</th>
                  <th className="p-4 text-right">Roadmaps</th>
                  <th className="p-4 text-right">Progress</th>
                </tr>
              </thead>
              <tbody>
                {board.map((u, i) => (
                  <tr key={i} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-4 text-base font-bold">{rankBadge(i)}</td>
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-right tabular-nums">{u.doneTasks}</td>
                    <td className="p-4 text-right tabular-nums">{u.roadmaps}</td>
                    <td className="p-4 text-right font-semibold tabular-nums text-brand-600">{u.pct}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </main>
  );
}
