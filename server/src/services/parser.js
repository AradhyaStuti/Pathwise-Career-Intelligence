import { createRequire } from 'module';
import mammoth from 'mammoth';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

export async function extractText(buffer, mimetype, filename = '') {
  const name = filename.toLowerCase();
  if (mimetype === 'application/pdf' || name.endsWith('.pdf')) {
    const data = await pdfParse(buffer);
    return data.text || '';
  }
  if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    name.endsWith('.docx')
  ) {
    const { value } = await mammoth.extractRawText({ buffer });
    return value || '';
  }
  if (mimetype?.startsWith('text/') || name.endsWith('.txt')) {
    return buffer.toString('utf8');
  }
  throw new Error('Unsupported file type. Upload PDF, DOCX, or TXT.');
}

const SECTION_PATTERNS = {
  contact: /\b(email|phone|linkedin|github|portfolio|@[\w.-]+\.\w+|\+?\d[\d\s\-()]{7,})/i,
  summary: /\b(summary|objective|profile|about me)\b/i,
  experience: /\b(experience|employment|work history|professional background)\b/i,
  education: /\b(education|academic|qualifications|b\.?\s*tech|b\.?\s*e\b|bachelor|master|degree)\b/i,
  skills: /\b(skills|technical skills|core competencies|technologies)\b/i,
  projects: /\b(projects?|portfolio)\b/i,
  certifications: /\b(certifications?|licenses?)\b/i,
};

export function detectSections(text) {
  const found = {};
  for (const [k, re] of Object.entries(SECTION_PATTERNS)) found[k] = re.test(text);
  return found;
}

export function detectContact(text) {
  const email = text.match(/[\w.+-]+@[\w-]+\.[\w.-]+/)?.[0] || null;
  const phone = text.match(/\+?\d[\d\s\-()]{8,}\d/)?.[0] || null;
  const linkedin = text.match(/linkedin\.com\/[^\s]+/i)?.[0] || null;
  const github = text.match(/github\.com\/[^\s]+/i)?.[0] || null;
  return { email, phone, linkedin, github };
}

export function calculateWordStats(text) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const chars = text.length;
  return { wordCount: words.length, charCount: chars };
}

export function detectFormattingIssues(text) {
  const issues = [];
  if (text.length < 300) issues.push('Resume is very short (< 300 chars) — may be parse failure');
  if (/\t{3,}/.test(text)) issues.push('Excessive tabs detected — possible table/column layout (ATS-unfriendly)');
  if (/[│┃┆┇┊┋]/.test(text)) issues.push('Box-drawing characters detected — likely from tables');
  if ((text.match(/[^\x00-\x7F]/g) || []).length > 50) {
    issues.push('Many non-ASCII characters — check for special fonts or symbols');
  }
  if (!/\d{4}/.test(text)) issues.push('No year found — add dates to experience/education');
  return issues;
}

const SYNONYMS = {
  js: 'javascript',
  javascript: 'javascript',
  ecmascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  reactjs: 'react',
  'react.js': 'react',
  react: 'react',
  nextjs: 'next.js',
  'next.js': 'next.js',
  next: 'next.js',
  nodejs: 'node.js',
  'node.js': 'node.js',
  node: 'node.js',
  k8s: 'kubernetes',
  kubernetes: 'kubernetes',
  gcp: 'google cloud',
  'google cloud platform': 'google cloud',
  'google cloud': 'google cloud',
  aws: 'aws',
  'amazon web services': 'aws',
  ml: 'machine learning',
  'machine learning': 'machine learning',
  ai: 'artificial intelligence',
  'artificial intelligence': 'artificial intelligence',
  nlp: 'natural language processing',
  'natural language processing': 'natural language processing',
  cv: 'computer vision',
  'computer vision': 'computer vision',
  'ci/cd': 'cicd',
  cicd: 'cicd',
  'ci-cd': 'cicd',
  sql: 'sql',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  mongo: 'mongodb',
  mongodb: 'mongodb',
  mysql: 'mysql',
  rest: 'rest api',
  'rest api': 'rest api',
  restful: 'rest api',
  graphql: 'graphql',
  tailwind: 'tailwind css',
  tailwindcss: 'tailwind css',
  'tailwind css': 'tailwind css',
  'gh actions': 'github actions',
  'github actions': 'github actions',
  tf: 'tensorflow',
  tensorflow: 'tensorflow',
  pytorch: 'pytorch',
  py: 'python',
  python: 'python',
  go: 'golang',
  golang: 'golang',
  cpp: 'c++',
  'c++': 'c++',
  csharp: 'c#',
  'c#': 'c#',
  'objective c': 'objective-c',
  'objective-c': 'objective-c',
  oop: 'object-oriented programming',
  ds: 'data structures',
  'data structures': 'data structures',
  algo: 'algorithms',
  algorithms: 'algorithms',
  ds_algo: 'data structures and algorithms',
  dsa: 'data structures and algorithms',
  agile: 'agile',
  scrum: 'scrum',
  jira: 'jira',
  figma: 'figma',
  'unit test': 'unit testing',
  'unit tests': 'unit testing',
  'unit testing': 'unit testing',
  tdd: 'test-driven development',
  'test driven': 'test-driven development',
  'test-driven': 'test-driven development',
  ux: 'user experience',
  ui: 'user interface',
  saas: 'saas',
  api: 'api',
  apis: 'api',
};

const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'of', 'for', 'to', 'in', 'on', 'with', 'at', 'by', 'or', 'as', 'is', 'are',
  'be', 'strong', 'solid', 'good', 'great', 'excellent', 'experience', 'knowledge', 'skills',
  'hands-on', 'hands', 'years', 'year', 'plus', 'using', 'from', 'that', 'than', 'very', 'work', 'working',
  'understanding', 'familiarity', 'proficient', 'proficiency', 'expert', 'expertise',
]);

// hacky stemmer, good enough
function stem(w) {
  if (w.length <= 4) return w;
  if (w.endsWith('ing')) return w.slice(0, -3);
  if (w.endsWith('ies')) return w.slice(0, -3) + 'y';
  if (w.endsWith('ed'))  return w.slice(0, -2);
  if (w.endsWith('es'))  return w.slice(0, -2);
  if (w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1);
  return w;
}

export function normalizeKeyword(s) {
  if (!s) return '';
  const raw = s.toLowerCase().trim();
  if (SYNONYMS[raw]) return SYNONYMS[raw];
  const stripped = raw.replace(/[._]/g, '').replace(/\s+/g, ' ');
  if (SYNONYMS[stripped]) return SYNONYMS[stripped];
  return raw;
}

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function buildResumeIndex(resumeText) {
  const lower = resumeText.toLowerCase();
  return { lower };
}

function aliasesFor(canonical) {
  const out = new Set([canonical]);
  for (const [alias, target] of Object.entries(SYNONYMS)) {
    if (target === canonical) out.add(alias);
  }
  return [...out];
}

export function smartKeywordMatch(resumeText, keywords) {
  const idx = buildResumeIndex(resumeText);
  return keywords.map((kw) => matchOne(idx, kw));
}

function matchOne(idx, kw) {
  const original = kw;
  const needle = (kw || '').toLowerCase().trim();
  if (!needle) return { keyword: original, found: false, count: 0 };

  const exactCount = countWordBoundary(idx.lower, needle);
  if (exactCount > 0) return { keyword: original, found: true, count: exactCount };

  const canonical = normalizeKeyword(needle);
  const aliases = aliasesFor(canonical);
  for (const alias of aliases) {
    if (alias === needle) continue;
    const c = countWordBoundary(idx.lower, alias);
    if (c > 0) return { keyword: original, found: true, count: c };
  }

  const tokens = needle
    .split(/[\s/,&|()\-]+/)
    .map((t) => t.trim())
    .filter((t) => t && !STOPWORDS.has(t));
  if (tokens.length === 0) return { keyword: original, found: false, count: 0 };

  if (tokens.length === 1) {
    const t = tokens[0];
    const c = countWordBoundary(idx.lower, t) || countStemMatch(idx.lower, t);
    return { keyword: original, found: c > 0, count: c };
  }

  let total = 0;
  let allPresent = true;
  for (const t of tokens) {
    const c = countWordBoundary(idx.lower, t) || countStemMatch(idx.lower, t);
    if (c === 0) {
      allPresent = false;
      break;
    }
    total += c;
  }
  return { keyword: original, found: allPresent, count: allPresent ? total : 0 };
}

function countWordBoundary(haystack, needle) {
  if (!needle) return 0;
  const re = new RegExp(`\\b${escapeRegex(needle)}\\b`, 'g');
  return (haystack.match(re) || []).length;
}

function countStemMatch(haystack, token) {
  const s = stem(token);
  if (s === token || s.length < 4) return 0;
  const re = new RegExp(`\\b${escapeRegex(s)}[a-z]{0,4}\\b`, 'g');
  return (haystack.match(re) || []).length;
}

export const keywordOverlap = smartKeywordMatch;

const MONTHS = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
  jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

// FIXME misses ranges like "Jan'22 - Dec'23" (apostrophe years). add later if anyone notices
export function extractExperienceYears(text) {
  if (!text) return 0;
  const ranges = [];
  const now = new Date();
  const nowMonths = now.getFullYear() * 12 + (now.getMonth() + 1);

  const re = /(?:([A-Za-z]{3,9})\s+)?(\d{4})\s*(?:-|–|—|to|through|until)\s*(?:([A-Za-z]{3,9})\s+)?(\d{4}|present|current|now|today|ongoing)/gi;

  let m;
  while ((m = re.exec(text))) {
    const startMo = m[1] ? MONTHS[m[1].toLowerCase().slice(0, 3)] || 1 : 1;
    const startYr = parseInt(m[2], 10);
    const endRaw = m[4].toLowerCase();
    let endYr, endMo;
    if (/present|current|now|today|ongoing/.test(endRaw)) {
      endYr = now.getFullYear();
      endMo = now.getMonth() + 1;
    } else {
      endYr = parseInt(endRaw, 10);
      endMo = m[3] ? MONTHS[m[3].toLowerCase().slice(0, 3)] || 12 : 12;
    }
    if (startYr < 1980 || endYr < startYr || endYr > now.getFullYear() + 1) continue;

    const start = startYr * 12 + startMo;
    const end = endYr * 12 + endMo;
    if (end <= start || end - start > 600) continue;
    if (end > nowMonths + 1) continue;
    ranges.push({ start, end });
  }

  if (ranges.length === 0) return 0;

  ranges.sort((a, b) => a.start - b.start);
  const merged = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) last.end = Math.max(last.end, r.end);
    else merged.push({ ...r });
  }
  const totalMonths = merged.reduce((acc, r) => acc + (r.end - r.start), 0);
  return Math.round((totalMonths / 12) * 10) / 10;
}

const TITLE_KEYWORDS = /\b([\w-]+(?:\s+[\w-]+){0,3})\s+(engineer|engineering|developer|designer|manager|analyst|scientist|architect|consultant|administrator|specialist|lead|director|intern|associate|coordinator)\b/gi;

export function extractJobTitles(text) {
  const titles = [];
  let m;
  TITLE_KEYWORDS.lastIndex = 0;
  while ((m = TITLE_KEYWORDS.exec(text))) {
    titles.push(`${m[1]} ${m[2]}`.toLowerCase().trim());
  }
  return titles;
}

export function titleSimilarity(resumeText, targetTitle) {
  if (!targetTitle) return { similarity: 0, currentOrLatest: '', targetTitle: '' };
  const resumeTitles = extractJobTitles(resumeText);
  if (resumeTitles.length === 0) {
    return { similarity: 0, currentOrLatest: '', targetTitle };
  }
  const targetTokens = new Set(
    targetTitle
      .toLowerCase()
      .split(/\s+/)
      .filter((t) => t && !STOPWORDS.has(t))
      .map(stem)
  );
  let bestSim = 0;
  let bestTitle = resumeTitles[0];
  for (const t of resumeTitles) {
    const tokens = new Set(
      t.split(/\s+/).filter((x) => x && !STOPWORDS.has(x)).map(stem)
    );
    const intersection = [...targetTokens].filter((x) => tokens.has(x)).length;
    const union = new Set([...targetTokens, ...tokens]).size;
    const sim = union > 0 ? Math.round((intersection / union) * 100) : 0;
    if (sim > bestSim) {
      bestSim = sim;
      bestTitle = t;
    }
  }
  return { similarity: bestSim, currentOrLatest: bestTitle, targetTitle };
}

const EDUCATION_LEVELS = [
  { level: 'phd', re: /\b(ph\.?\s*d|doctorate|doctoral)\b/i, rank: 5 },
  { level: 'masters', re: /\b(m\.?\s*tech|m\.?\s*s\.?(?!\w)|master|mba|m\.?\s*sc)\b/i, rank: 4 },
  { level: 'bachelors', re: /\b(b\.?\s*tech|b\.?\s*e\.?(?!\w)|b\.?\s*s\.?(?!\w)|bachelor|b\.?\s*sc|b\.?\s*com)\b/i, rank: 3 },
  { level: 'associate', re: /\b(associate degree|diploma)\b/i, rank: 2 },
  { level: 'highschool', re: /\b(high school|secondary school|12th)\b/i, rank: 1 },
];

export function detectEducation(text) {
  for (const e of EDUCATION_LEVELS) {
    if (e.re.test(text)) return { level: e.level, rank: e.rank };
  }
  return { level: 'unspecified', rank: 0 };
}

export function requiredEducationRank(req) {
  if (!req) return 0;
  for (const e of EDUCATION_LEVELS) {
    if (e.re.test(req)) return e.rank;
  }
  return 0;
}

export function computeAtsScore({
  resumeText,
  jdRequirements,
  sections,
  contact,
  formattingIssues,
}) {
  const must = (jdRequirements?.mustHaveSkills || []).filter(Boolean);
  const soft = (jdRequirements?.softSkills || []).filter(Boolean);
  const ats = (jdRequirements?.atsKeywords || []).filter(Boolean);

  const allKeywords = [...new Set([...ats, ...must].map((k) => k.trim()).filter(Boolean))];
  const keywordTable = smartKeywordMatch(resumeText, allKeywords);
  const matchedKw = keywordTable.filter((k) => k.found).length;
  const keywordCoverage = allKeywords.length
    ? Math.round((matchedKw / allKeywords.length) * 100)
    : 100;

  const hardMatched = [];
  const hardMissing = [];
  for (const skill of must) {
    const hit = matchOne(buildResumeIndex(resumeText), skill);
    (hit.found ? hardMatched : hardMissing).push(skill);
  }
  const hardMatchPercent = must.length
    ? Math.round((hardMatched.length / must.length) * 100)
    : 100;

  const softMatched = [];
  const softMissing = [];
  for (const s of soft) {
    const hit = matchOne(buildResumeIndex(resumeText), s);
    (hit.found ? softMatched : softMissing).push(s);
  }

  const yearsDetected = extractExperienceYears(resumeText);
  const yearsRequired = Number(jdRequirements?.yearsRequired) || 0;
  const meetsExperience = yearsRequired === 0 || yearsDetected >= yearsRequired;
  let experienceScore;
  if (yearsRequired === 0) experienceScore = 100;
  else if (yearsDetected >= yearsRequired) experienceScore = 100;
  else experienceScore = Math.round((yearsDetected / yearsRequired) * 100);

  const eduDetected = detectEducation(resumeText);
  const eduRequiredRank = requiredEducationRank(jdRequirements?.educationRequired);
  const meetsEducation = eduRequiredRank === 0 || eduDetected.rank >= eduRequiredRank;
  const educationScore =
    eduRequiredRank === 0
      ? 100
      : eduDetected.rank >= eduRequiredRank
      ? 100
      : Math.round((eduDetected.rank / eduRequiredRank) * 100);

  const titleAnalysis = titleSimilarity(resumeText, jdRequirements?.jobTitle || '');

  let formatScore = 100;
  formatScore -= (formattingIssues?.length || 0) * 15;
  if (!sections?.experience) formatScore -= 10;
  if (!sections?.education) formatScore -= 5;
  if (!sections?.skills) formatScore -= 10;
  if (!contact?.email) formatScore -= 10;
  if (!contact?.phone) formatScore -= 5;
  formatScore = Math.max(0, Math.min(100, formatScore));

  const breakdown = {
    keywordMatch: {
      score: keywordCoverage,
      weight: 35,
      details: allKeywords.length
        ? `${matchedKw}/${allKeywords.length} ATS keywords matched`
        : 'No ATS keywords extracted from JD',
    },
    skillsMatch: {
      score: hardMatchPercent,
      weight: 25,
      details: must.length
        ? `${hardMatched.length}/${must.length} must-have skills present`
        : 'No must-have skills specified in JD',
    },
    experienceMatch: {
      score: experienceScore,
      weight: 15,
      details: yearsRequired
        ? `${yearsDetected}y detected vs ${yearsRequired}y required`
        : 'No years requirement in JD',
    },
    educationMatch: {
      score: educationScore,
      weight: 10,
      details: jdRequirements?.educationRequired
        ? `${eduDetected.level} vs required: ${jdRequirements.educationRequired}`
        : 'No education requirement in JD',
    },
    formatting: {
      score: formatScore,
      weight: 10,
      details: formattingIssues?.length
        ? `${formattingIssues.length} formatting issue(s) detected`
        : 'Clean ATS-friendly format',
    },
    jobTitleMatch: {
      score: titleAnalysis.similarity,
      weight: 5,
      details: titleAnalysis.currentOrLatest
        ? `"${titleAnalysis.currentOrLatest}" vs "${jdRequirements?.jobTitle || ''}"`
        : 'No clear job title found in resume',
    },
  };

  const overallScore = Math.round(
    Object.values(breakdown).reduce((sum, b) => sum + b.score * b.weight, 0) / 100
  );

  let verdict;
  if (overallScore >= 85) verdict = 'STRONG MATCH';
  else if (overallScore >= 70) verdict = 'GOOD MATCH';
  else if (overallScore >= 55) verdict = 'PARTIAL MATCH';
  else if (overallScore >= 40) verdict = 'WEAK MATCH';
  else verdict = 'REJECT';

  return {
    overallScore,
    verdict,
    breakdown,
    keywordTable,
    keywordCoverage,
    hardSkills: { matched: hardMatched, missing: hardMissing, matchPercent: hardMatchPercent },
    softSkills: { matched: softMatched, missing: softMissing },
    experienceAnalysis: {
      yearsDetected,
      yearsRequired,
      meetsRequirement: meetsExperience,
      relevantRoles: extractJobTitles(resumeText).slice(0, 5),
    },
    educationAnalysis: {
      detected: eduDetected.level,
      meetsRequirement: meetsEducation,
    },
    jobTitleAnalysis: {
      currentOrLatest: titleAnalysis.currentOrLatest,
      targetTitle: titleAnalysis.targetTitle,
      similarity: titleAnalysis.similarity,
    },
  };
}
