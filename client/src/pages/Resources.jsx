import { useMemo, useState } from 'react';
import { CATEGORIES, RESOURCES } from '../lib/resources.js';

const TYPE_COLORS = {
  course: 'bg-purple-50 text-purple-700',
  docs: 'bg-blue-50 text-blue-700',
  video: 'bg-red-50 text-red-700',
  article: 'bg-amber-50 text-amber-700',
};

export default function Resources() {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return RESOURCES.filter((r) => {
      if (activeCategory !== 'All' && r.category !== activeCategory) return false;
      if (!q) return true;
      const hay = `${r.title} ${r.description || ''} ${r.platform} ${r.tags.join(' ')}`.toLowerCase();
      return hay.includes(q);
    });
  }, [query, activeCategory]);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold">Free Learning Resources</h1>
        <p className="mt-2 text-slate-600">
          A curated library of {RESOURCES.length} hand-picked free resources. Every link is verified,
          official, or community-trusted — zero paywalls.
        </p>
      </div>

      <div className="card mt-6 p-4">
        <input
          className="input"
          placeholder="Search resources — React, system design, docker…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {['All', ...CATEGORIES].map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategory === c
                  ? 'bg-brand-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((r) => (
          <a
            key={r.url}
            href={r.url}
            target="_blank"
            rel="noreferrer"
            className="card group p-5 transition hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                  TYPE_COLORS[r.type] || 'bg-slate-100 text-slate-700'
                }`}
              >
                {r.type}
              </span>
              <span className="text-[11px] text-slate-400">{r.category}</span>
            </div>
            <h3 className="mt-3 font-semibold text-slate-900 group-hover:text-brand-700">
              {r.title}
            </h3>
            <p className="mt-1 text-xs text-slate-500">{r.platform}</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{r.description}</p>
            <div className="mt-3 flex flex-wrap gap-1">
              {r.tags.slice(0, 4).map((t) => (
                <span key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] text-slate-600">
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="card mt-6 p-10 text-center text-slate-500">
          No resources match your search. Try a different term or category.
        </div>
      )}
    </main>
  );
}
