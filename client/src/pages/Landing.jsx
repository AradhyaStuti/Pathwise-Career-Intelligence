import { Link } from 'react-router-dom';
import { useAuth } from '../store/auth.jsx';

const features = [
  {
    title: 'Roadmap',
    body: 'Tell it your target role and hours per week, get a week-by-week plan with free resources.',
    to: '/onboarding',
    authOnly: true,
  },
  {
    title: 'ATS scan',
    body: 'Upload a resume + JD. Rule-based scoring (same input = same score), AI writes the verdict.',
    to: '/resume',
    authOnly: true,
  },
  {
    title: 'Skill gap',
    body: 'What you have, what you are missing, what to learn first.',
    to: '/skill-gap',
    authOnly: true,
  },
  {
    title: 'Market insights',
    body: 'Salaries, demand, top skills, and who hires for a given role.',
    to: '/insights',
    authOnly: true,
  },
  {
    title: 'Resources',
    body: 'A hand-picked list of free learning links across 13 areas.',
    to: '/resources',
    authOnly: false,
  },
];

const stats = [
  { label: 'Tools', value: '5' },
  { label: 'Free resources', value: '100+' },
  { label: 'Cost', value: '$0' },
];

export default function Landing() {
  const { user } = useAuth();
  return (
    <main>
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-white to-slate-50">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              'radial-gradient(circle at 25% 0%, rgba(124,58,237,0.12), transparent 50%), radial-gradient(circle at 75% 100%, rgba(99,102,241,0.08), transparent 50%)',
          }}
        />
        <div className="relative mx-auto max-w-5xl px-4 py-24 sm:py-32">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Figure out what to learn{' '}
              <span className="bg-gradient-to-r from-brand-600 to-indigo-600 bg-clip-text text-transparent">
                next
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">
              Roadmaps, ATS resume scoring, and skill-gap analysis. Free, no signup gimmicks, no credit card.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                to={user ? '/dashboard' : '/signup'}
                className="btn-primary px-8 py-3 text-base shadow-lg shadow-brand-600/20"
              >
                Get started free
              </Link>
              <Link
                to={user ? '/resume' : '/resources'}
                className="btn-ghost px-8 py-3 text-base"
              >
                {user ? 'Scan my resume' : 'Explore resources'}
              </Link>
            </div>
          </div>

          <div className="mx-auto mt-16 flex max-w-md justify-center gap-8 border-t border-slate-200 pt-8">
            {stats.map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl font-bold text-slate-900">{s.value}</div>
                <div className="mt-1 text-xs text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-slate-900">
            Five tools, one app
          </h2>
          <p className="mt-3 text-slate-600">
            From "where do I even start" to interview-ready.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => {
            const href = f.authOnly && !user ? '/signup' : f.to;
            return (
              <Link
                key={f.title}
                to={href}
                className="card group flex flex-col p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-50 text-sm font-bold text-brand-600">
                  {String(i + 1).padStart(2, '0')}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900 group-hover:text-brand-700">
                  {f.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.body}</p>
                <div className="mt-4 text-xs font-medium text-brand-600 group-hover:underline">
                  {f.authOnly && !user ? 'Sign up to access' : 'Open tool'}
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="border-t border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-16">
          <h2 className="text-center text-3xl font-bold tracking-tight text-slate-900">
            How it works
          </h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Pick a goal',
                desc: 'Target role, current skills, hours per week.',
              },
              {
                step: '02',
                title: 'Get a plan',
                desc: 'A week-by-week schedule with free resources and milestones.',
              },
              {
                step: '03',
                title: 'Work through it',
                desc: 'Check off tasks, scan your resume against JDs, close the gaps.',
              },
            ].map((s) => (
              <div key={s.step} className="text-center">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-brand-600 text-sm font-bold text-white">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold text-slate-900">{s.title}</h3>
                <p className="mt-2 text-sm text-slate-600">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to={user ? '/dashboard' : '/signup'}
              className="btn-primary px-8 py-3 text-base"
            >
              Start building your roadmap
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200">
        <div className="mx-auto max-w-4xl px-4 py-12">
          <div className="grid grid-cols-2 gap-6 text-center text-sm text-slate-600 sm:grid-cols-4">
            <div>
              <div className="font-semibold text-slate-900">No card required</div>
              <div className="mt-1 text-xs text-slate-500">Free</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">No data sold</div>
              <div className="mt-1 text-xs text-slate-500">No ads either</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Plain MERN stack</div>
              <div className="mt-1 text-xs text-slate-500">React, Node, Mongo</div>
            </div>
            <div>
              <div className="font-semibold text-slate-900">Deterministic scoring</div>
              <div className="mt-1 text-xs text-slate-500">Same resume = same score</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
