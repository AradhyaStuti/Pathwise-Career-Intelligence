import { useEffect, useRef, useState } from 'react';
import { api } from '../lib/api';
import { ScoreRing, ScoreBar } from '../components/ScoreRing.jsx';

const MAX_FILE_BYTES = 5 * 1024 * 1024;

const VERDICT_COLORS = {
  'STRONG MATCH': 'bg-green-100 text-green-800 border-green-300',
  'GOOD MATCH': 'bg-emerald-100 text-emerald-800 border-emerald-300',
  'PARTIAL MATCH': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'WEAK MATCH': 'bg-orange-100 text-orange-800 border-orange-300',
  REJECT: 'bg-red-100 text-red-800 border-red-300',
};

function Chip({ children, tone = 'slate' }) {
  const tones = {
    slate: 'bg-slate-100 text-slate-700',
    green: 'bg-green-50 text-green-700 ring-1 ring-green-200',
    red: 'bg-red-50 text-red-700 ring-1 ring-red-200',
  };
  return <span className={`chip ${tones[tone]}`}>{children}</span>;
}

function SkillBlock({ title, matched, missing }) {
  return (
    <div className="card p-6">
      <h3 className="font-bold">{title}</h3>
      <div className="mt-3">
        <div className="text-xs font-semibold text-green-700">MATCHED ({matched?.length || 0})</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {matched?.length ? (
            matched.map((s) => (
              <Chip key={s} tone="green">
                {s}
              </Chip>
            ))
          ) : (
            <span className="text-xs text-slate-400">None</span>
          )}
        </div>
      </div>
      <div className="mt-4">
        <div className="text-xs font-semibold text-red-700">MISSING ({missing?.length || 0})</div>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {missing?.length ? (
            missing.map((s) => (
              <Chip key={s} tone="red">
                {s}
              </Chip>
            ))
          ) : (
            <span className="text-xs text-slate-400">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

const PROGRESS_STAGES = [
  'Extracting resume text…',
  'Parsing sections & contact info…',
  'Analyzing job description…',
  'Matching keywords…',
  'Scoring against ATS rubric…',
  'Finalizing report…',
];

export default function Resume() {
  const [jobDescription, setJobDescription] = useState('');
  const [file, setFile] = useState(null);
  const [resumeText, setResumeText] = useState('');
  const [mode, setMode] = useState('upload');
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stage, setStage] = useState(0);
  const [err, setErr] = useState('');
  const reportRef = useRef(null);

  useEffect(() => {
    if (!loading) return;
    setStage(0);
    const id = setInterval(() => {
      setStage((s) => (s + 1) % PROGRESS_STAGES.length);
    }, 3500);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (report && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [report]);

  function onFileChange(f) {
    setErr('');
    if (!f) return setFile(null);
    if (f.size > MAX_FILE_BYTES) {
      setErr(`File too large (${(f.size / 1024 / 1024).toFixed(1)} MB). Maximum is 5 MB.`);
      return;
    }
    setFile(f);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr('');
    if (jobDescription.trim().length < 30) {
      setErr('Job description must be at least 30 characters.');
      return;
    }
    if (mode === 'upload' && !file) {
      setErr('Please choose a resume file.');
      return;
    }
    if (mode === 'paste' && resumeText.trim().length < 30) {
      setErr('Resume text must be at least 30 characters.');
      return;
    }
    setLoading(true);
    setReport(null);
    try {
      const fd = new FormData();
      fd.append('jobDescription', jobDescription);
      if (mode === 'upload' && file) fd.append('resume', file);
      else fd.append('resumeText', resumeText);
      const { report } = await api.scanResume(fd);
      setReport(report);
    } catch (e) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-12">
      <div>
        <h1 className="text-3xl font-bold">ATS Resume Scanner</h1>
        <p className="mt-1 text-slate-600">
          Deterministic scoring engine — same resume, same score. Upload your resume and paste a job description.
        </p>
      </div>

      <form onSubmit={onSubmit} className="card slide-up mt-6 space-y-5 p-6">
        <div>
          <label htmlFor="jd" className="text-sm font-semibold">
            Job description <span className="text-red-500">*</span>
          </label>
          <textarea
            id="jd"
            className="input mt-1.5 font-mono text-xs scrollbar-thin"
            rows={8}
            placeholder="Paste the complete job description here…"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            required
          />
          <div className="mt-1 text-right text-xs text-slate-400">
            {jobDescription.length} chars
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode('upload')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === 'upload' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Upload PDF/DOCX
          </button>
          <button
            type="button"
            onClick={() => setMode('paste')}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              mode === 'paste' ? 'bg-white text-brand-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Paste text
          </button>
        </div>

        {mode === 'upload' ? (
          <div>
            <label htmlFor="resumeFile" className="text-sm font-semibold">
              Resume file
            </label>
            <p className="text-xs text-slate-500">PDF, DOCX or TXT — max 5 MB</p>
            <input
              id="resumeFile"
              type="file"
              accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
              onChange={(e) => onFileChange(e.target.files?.[0] || null)}
              className="mt-2 block w-full cursor-pointer rounded-lg border border-slate-300 bg-white p-2 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-brand-700 hover:file:bg-brand-100"
              required={mode === 'upload'}
            />
            {file && (
              <p className="mt-2 text-xs text-slate-600">
                ✓ {file.name} <span className="text-slate-400">— {(file.size / 1024).toFixed(1)} KB</span>
              </p>
            )}
          </div>
        ) : (
          <div>
            <label htmlFor="resumeText" className="text-sm font-semibold">
              Resume text
            </label>
            <textarea
              id="resumeText"
              className="input mt-1.5 font-mono text-xs scrollbar-thin"
              rows={10}
              placeholder="Paste your resume text here…"
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              required={mode === 'paste'}
            />
          </div>
        )}

        {err && (
          <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <strong className="block text-base">Scan failed</strong>
            <p className="mt-1 whitespace-pre-line leading-relaxed">{err}</p>
            {/rate|limit|429|groq/i.test(err) && (
              <a
                href="https://console.groq.com/keys"
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block font-semibold text-red-900 underline"
              >
                → Get a free Groq API key
              </a>
            )}
          </div>
        )}

        <button className="btn-primary w-full sm:w-auto" disabled={loading}>
          {loading ? 'Scanning…' : 'Run ATS Scan'}
        </button>

        {loading && (
          <div className="fade-in rounded-lg border border-brand-200 bg-brand-50 p-4">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-300 border-t-brand-600" />
              <p className="text-sm font-medium text-brand-800">{PROGRESS_STAGES[stage]}</p>
            </div>
            <p className="mt-2 text-xs text-brand-700/80">
              This usually takes 10–30 seconds. The AI is reading your resume against the JD.
            </p>
          </div>
        )}
      </form>

      {report && (
        <div ref={reportRef} className="slide-up mt-8 space-y-6 scroll-mt-8">
          <div className="card p-6">
            <div className="flex flex-col items-center gap-6 md:flex-row md:items-start">
              <ScoreRing score={report.overallScore} />
              <div className="flex-1">
                <div
                  className={`inline-block rounded-full border px-4 py-1 text-sm font-bold ${
                    VERDICT_COLORS[report.verdict] || 'bg-slate-100 text-slate-700 border-slate-300'
                  }`}
                >
                  {report.verdict}
                </div>
                <p className="mt-3 text-slate-700">{report.verdictReason}</p>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <div>
                    <div className="text-xs text-slate-500">Keyword coverage</div>
                    <div className="text-lg font-bold tabular-nums">{report.keywordCoverage}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Hard skill match</div>
                    <div className="text-lg font-bold tabular-nums">{report.hardSkills?.matchPercent}%</div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Experience</div>
                    <div className="text-lg font-bold tabular-nums">
                      {report.experienceAnalysis?.yearsDetected ?? 0}y
                      {report.experienceAnalysis?.yearsRequired > 0 ? (
                        <span className="text-slate-400"> / {report.experienceAnalysis.yearsRequired}y</span>
                      ) : (
                        <span className="ml-1 text-xs font-normal text-slate-400">· not required</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-slate-500">Title match</div>
                    <div className="text-lg font-bold tabular-nums">{report.jobTitleAnalysis?.similarity}%</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold">Scoring breakdown</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {Object.entries(report.breakdown || {}).map(([key, val]) => (
                <div key={key}>
                  <div className="text-sm font-semibold capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <ScoreBar value={val.score} weight={val.weight} />
                  <p className="mt-1 text-xs text-slate-600">{val.details}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-bold">Keyword match table</h2>
            <p className="mt-1 text-xs text-slate-500">
              Exact keywords from the JD that an ATS looks for.
            </p>
            <div className="mt-4 max-h-96 overflow-auto scrollbar-thin">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-slate-50">
                  <tr className="text-left">
                    <th className="p-2">Keyword</th>
                    <th className="p-2 text-center">Found</th>
                    <th className="p-2 text-center">Count</th>
                  </tr>
                </thead>
                <tbody>
                  {report.keywordTable?.map((k) => (
                    <tr key={k.keyword} className="border-t border-slate-100">
                      <td className="p-2 font-mono text-xs">{k.keyword}</td>
                      <td className="p-2 text-center">
                        {k.found ? (
                          <span className="text-green-600">✓</span>
                        ) : (
                          <span className="text-red-500">✗</span>
                        )}
                      </td>
                      <td className="p-2 text-center text-xs tabular-nums text-slate-500">{k.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <SkillBlock
              title="Hard skills"
              matched={report.hardSkills?.matched}
              missing={report.hardSkills?.missing}
            />
            <SkillBlock
              title="Soft skills"
              matched={report.softSkills?.matched}
              missing={report.softSkills?.missing}
            />
          </div>

          <div className="card p-6">
            <h3 className="font-bold">Parsed resume signals</h3>
            <div className="mt-3 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Sections detected</div>
                <ul className="mt-1 space-y-0.5">
                  {Object.entries(report.parsed?.sections || {}).map(([k, v]) => (
                    <li key={k} className={v ? 'text-slate-700' : 'text-slate-400'}>
                      {v ? '✓' : '✗'} {k}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Contact info</div>
                <ul className="mt-1 space-y-0.5">
                  <li><span className="text-slate-500">Email:</span> {report.parsed?.contact?.email || '—'}</li>
                  <li><span className="text-slate-500">Phone:</span> {report.parsed?.contact?.phone || '—'}</li>
                  <li><span className="text-slate-500">LinkedIn:</span> {report.parsed?.contact?.linkedin || '—'}</li>
                  <li><span className="text-slate-500">GitHub:</span> {report.parsed?.contact?.github || '—'}</li>
                </ul>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Word count</div>
                <div className="mt-1 tabular-nums">{report.parsed?.stats?.wordCount} words</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase text-slate-500">Formatting issues</div>
                {report.parsed?.formattingIssues?.length ? (
                  <ul className="mt-1 list-disc pl-5 text-xs text-red-600">
                    {report.parsed.formattingIssues.map((i, j) => (
                      <li key={j}>{i}</li>
                    ))}
                  </ul>
                ) : (
                  <div className="mt-1 text-xs text-green-600">None detected ✓</div>
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="card p-6">
              <h3 className="font-bold text-red-700">Red flags</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {report.redFlags?.length ? (
                  report.redFlags.map((r, i) => <li key={i}>{r}</li>)
                ) : (
                  <li className="list-none text-slate-500">None — looking good!</li>
                )}
              </ul>
            </div>
            <div className="card p-6">
              <h3 className="font-bold text-green-700">Green flags</h3>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {report.greenFlags?.length ? (
                  report.greenFlags.map((g, i) => <li key={i}>{g}</li>)
                ) : (
                  <li className="list-none text-slate-500">None detected</li>
                )}
              </ul>
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold">Top recommendations</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
              {report.topRecommendations?.map((r, i) => (
                <li key={i}>{r}</li>
              ))}
            </ol>
          </div>

          {report.rewriteSummary && (
            <div className="card p-6">
              <h3 className="font-bold">Suggested summary rewrite</h3>
              <p className="mt-2 rounded-lg bg-slate-50 p-3 text-sm italic text-slate-700">
                {report.rewriteSummary}
              </p>
            </div>
          )}
        </div>
      )}
    </main>
  );
}
