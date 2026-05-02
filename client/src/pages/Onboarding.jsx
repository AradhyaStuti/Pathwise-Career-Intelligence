import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../store/auth.jsx';

const SKILL_SUGGESTIONS = [
  'HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python',
  'SQL', 'Git', 'MongoDB', 'Express', 'Tailwind', 'Docker', 'AWS',
  'Java', 'C++', 'Go', 'Rust', 'Kubernetes', 'GraphQL', 'Redis',
];

const MAX_SKILLS = 20;

const STAGES = [
  'Analyzing job market data…',
  'Building week-by-week curriculum…',
  'Selecting free learning resources…',
  'Tailoring to your skill level…',
  'Setting milestones…',
  'Almost there…',
];

export default function Onboarding() {
  const nav = useNavigate();
  const { user, updateProfile } = useAuth();
  const p = user?.profile || {};
  const [form, setForm] = useState({
    targetRole: p.targetRole || '',
    currentSkills: p.skills || [],
    hoursPerWeek: p.hoursPerWeek || 10,
    totalWeeks: 8,
    experienceLevel: p.experienceLevel || 'beginner',
  });
  const [skillInput, setSkillInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [err, setErr] = useState('');

  function addSkill(s) {
    const skill = s.trim();
    if (!skill || form.currentSkills.includes(skill) || form.currentSkills.length >= MAX_SKILLS) return;
    setForm({ ...form, currentSkills: [...form.currentSkills, skill] });
    setSkillInput('');
  }

  function removeSkill(s) {
    setForm({ ...form, currentSkills: form.currentSkills.filter((x) => x !== s) });
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!form.targetRole.trim()) {
      setErr('Please enter a target role.');
      return;
    }
    setErr('');
    setLoading(true);
    setStage(0);
    const stageInterval = setInterval(() => setStage((s) => Math.min(s + 1, STAGES.length - 1)), 4000);
    try {
      const { roadmap } = await api.generateRoadmap(form);
      updateProfile({
        targetRole: form.targetRole,
        skills: form.currentSkills,
        hoursPerWeek: form.hoursPerWeek,
        experienceLevel: form.experienceLevel,
      }).catch(() => {});
      nav(`/roadmap/${roadmap._id}`);
    } catch (e) {
      setErr(e.message);
    } finally {
      clearInterval(stageInterval);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="card slide-up max-w-md p-10 text-center">
          <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-brand-200 border-t-brand-600" />
          <h2 className="mt-6 text-xl font-bold">Crafting your roadmap…</h2>
          <p className="mt-2 text-sm font-medium text-brand-600">{STAGES[stage]}</p>
          <p className="mt-4 text-xs text-slate-500">
            This usually takes 15-30 seconds. The AI is designing your personalized curriculum.
          </p>
        </div>
      </main>
    );
  }

  const suggestions = SKILL_SUGGESTIONS.filter((s) => !form.currentSkills.includes(s));

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Tell us about your goal</h1>
        <p className="mt-2 text-slate-600">
          We'll build a personalized, week-by-week roadmap using 100% free resources.
        </p>
      </div>

      <form onSubmit={onSubmit} className="mt-8 space-y-5">
        <div className="card p-6">
          <label htmlFor="role" className="block text-sm font-semibold">
            What role do you want? <span className="text-red-500">*</span>
          </label>
          <input
            id="role"
            className="input mt-2"
            placeholder="e.g. Frontend Developer, Data Analyst, ML Engineer"
            value={form.targetRole}
            onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
            required
          />
        </div>

        <div className="card p-6">
          <label htmlFor="skills" className="block text-sm font-semibold">
            Current skills
            <span className="ml-2 text-xs font-normal text-slate-400">
              {form.currentSkills.length}/{MAX_SKILLS}
            </span>
          </label>
          <div className="mt-2 flex gap-2">
            <input
              id="skills"
              className="input"
              placeholder="Type a skill and press Enter"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  addSkill(skillInput);
                }
              }}
            />
            <button
              type="button"
              className="btn-ghost shrink-0 text-sm"
              onClick={() => addSkill(skillInput)}
              disabled={!skillInput.trim()}
            >
              Add
            </button>
          </div>

          {form.currentSkills.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {form.currentSkills.map((s) => (
                <span
                  key={s}
                  className="chip bg-brand-50 text-brand-700 ring-1 ring-brand-200"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => removeSkill(s)}
                    className="ml-0.5 text-brand-400 hover:text-brand-700"
                    aria-label={`Remove ${s}`}
                  >
                    x
                  </button>
                </span>
              ))}
            </div>
          )}

          {suggestions.length > 0 && (
            <div className="mt-3">
              <p className="text-xs text-slate-400">Quick add:</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {suggestions.slice(0, 12).map((s) => (
                  <button
                    type="button"
                    key={s}
                    onClick={() => addSkill(s)}
                    className="chip border border-slate-200 bg-white text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-600"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="card p-6">
            <label className="block text-sm font-semibold">
              Hours per week: <span className="tabular-nums text-brand-600">{form.hoursPerWeek}h</span>
            </label>
            <input
              type="range"
              min={3}
              max={40}
              value={form.hoursPerWeek}
              onChange={(e) => setForm({ ...form, hoursPerWeek: Number(e.target.value) })}
              className="mt-3 w-full accent-brand-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>3h</span>
              <span>40h</span>
            </div>
          </div>

          <div className="card p-6">
            <label className="block text-sm font-semibold">
              Duration: <span className="tabular-nums text-brand-600">{form.totalWeeks} weeks</span>
            </label>
            <input
              type="range"
              min={4}
              max={24}
              value={form.totalWeeks}
              onChange={(e) => setForm({ ...form, totalWeeks: Number(e.target.value) })}
              className="mt-3 w-full accent-brand-600"
            />
            <div className="mt-1 flex justify-between text-xs text-slate-400">
              <span>4 weeks</span>
              <span>24 weeks</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <label className="block text-sm font-semibold">Experience level</label>
          <div className="mt-3 grid grid-cols-3 gap-2">
            {[
              { value: 'beginner', label: 'Beginner', desc: 'New to this field' },
              { value: 'intermediate', label: 'Intermediate', desc: 'Some experience' },
              { value: 'advanced', label: 'Advanced', desc: 'Looking to specialize' },
            ].map((lvl) => (
              <button
                type="button"
                key={lvl.value}
                onClick={() => setForm({ ...form, experienceLevel: lvl.value })}
                className={`rounded-lg border p-3 text-left transition-all ${
                  form.experienceLevel === lvl.value
                    ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm ring-1 ring-brand-200'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div className="text-sm font-semibold">{lvl.label}</div>
                <div className="mt-0.5 text-xs opacity-70">{lvl.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {err && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {err}
          </div>
        )}

        <button
          className="btn-primary w-full py-3 text-base"
          disabled={!form.targetRole.trim()}
        >
          Generate my roadmap
        </button>
      </form>
    </main>
  );
}
