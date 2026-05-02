import { describe, it, expect } from 'vitest';
import {
  detectSections,
  detectContact,
  calculateWordStats,
  detectFormattingIssues,
  keywordOverlap,
  smartKeywordMatch,
  extractText,
  extractExperienceYears,
  titleSimilarity,
  detectEducation,
  computeAtsScore,
  normalizeKeyword,
} from './parser.js';

const SAMPLE = `Jane Doe
jane.doe@example.com | +1 555 123 4567 | Bangalore, India | linkedin.com/in/janedoe | github.com/janedoe

SUMMARY
Frontend developer with 3 years of experience.

EXPERIENCE
Frontend Engineer — Acme Corp (2022 - Present)
- Built dashboards used by 20k users
- Improved load time by 40%

EDUCATION
B.Tech CS — IIT Delhi (2017-2021)

SKILLS
React, TypeScript, Tailwind, Node, Git`;

describe('parser.detectSections', () => {
  it('detects all standard sections', () => {
    const s = detectSections(SAMPLE);
    expect(s.contact).toBe(true);
    expect(s.summary).toBe(true);
    expect(s.experience).toBe(true);
    expect(s.education).toBe(true);
    expect(s.skills).toBe(true);
  });

  it('returns false for missing sections', () => {
    const s = detectSections('just some random text without structure');
    expect(s.experience).toBe(false);
    expect(s.education).toBe(false);
  });
});

describe('parser.detectContact', () => {
  it('extracts email, phone, linkedin, github', () => {
    const c = detectContact(SAMPLE);
    expect(c.email).toBe('jane.doe@example.com');
    expect(c.phone).toMatch(/555/);
    expect(c.linkedin).toContain('linkedin.com/in/janedoe');
    expect(c.github).toContain('github.com/janedoe');
  });

  it('returns null fields when none present', () => {
    const c = detectContact('no contact info here');
    expect(c.email).toBeNull();
    expect(c.phone).toBeNull();
  });
});

describe('parser.calculateWordStats', () => {
  it('counts words and chars', () => {
    const s = calculateWordStats('one two three four five');
    expect(s.wordCount).toBe(5);
    expect(s.charCount).toBe(23);
  });
});

describe('parser.detectFormattingIssues', () => {
  it('flags short resumes', () => {
    const issues = detectFormattingIssues('too short');
    expect(issues.some((i) => /short/i.test(i))).toBe(true);
  });

  it('flags missing years', () => {
    const issues = detectFormattingIssues('a '.repeat(200) + 'no dates');
    expect(issues.some((i) => /year/i.test(i))).toBe(true);
  });

  it('returns no issues on a healthy resume', () => {
    const issues = detectFormattingIssues(SAMPLE);
    expect(issues.length).toBe(0);
  });
});

describe('parser.keywordOverlap', () => {
  it('finds exact matches with counts', () => {
    const res = keywordOverlap(SAMPLE, ['React', 'Rust', 'TypeScript']);
    const react = res.find((r) => r.keyword === 'React');
    const rust = res.find((r) => r.keyword === 'Rust');
    expect(react.found).toBe(true);
    expect(react.count).toBeGreaterThanOrEqual(1);
    expect(rust.found).toBe(false);
    expect(rust.count).toBe(0);
  });

  it('uses word boundaries (React should not match Reacts inside Reacting)', () => {
    const res = keywordOverlap('I am Reacting to the news', ['React']);
    expect(res[0].found).toBe(false);
  });
});

describe('parser.normalizeKeyword', () => {
  it('maps synonyms to canonical form', () => {
    expect(normalizeKeyword('JS')).toBe('javascript');
    expect(normalizeKeyword('ReactJS')).toBe('react');
    expect(normalizeKeyword('K8s')).toBe('kubernetes');
    expect(normalizeKeyword('Postgres')).toBe('postgresql');
  });

  it('returns lowercased original when no synonym', () => {
    expect(normalizeKeyword('Webpack')).toBe('webpack');
  });
});

describe('parser.smartKeywordMatch', () => {
  it('matches via synonym alias (JD says React, resume says ReactJS)', () => {
    const res = smartKeywordMatch('Built apps with ReactJS and Tailwindcss', ['React', 'Tailwind']);
    expect(res[0].found).toBe(true);
    expect(res[1].found).toBe(true);
  });

  it('matches via stemming (JD says developing, resume says developed)', () => {
    const res = smartKeywordMatch('Developed and shipped REST APIs', ['developing']);
    expect(res[0].found).toBe(true);
  });

  it('does not false-match unrelated tokens', () => {
    const res = smartKeywordMatch('I cook food', ['Kotlin']);
    expect(res[0].found).toBe(false);
  });
});

describe('parser.extractExperienceYears', () => {
  it('parses simple year ranges', () => {
    const text = 'Software Engineer (2020 - 2023)';
    const y = extractExperienceYears(text);
    expect(y).toBeGreaterThanOrEqual(3);
    expect(y).toBeLessThanOrEqual(4);
  });

  it('parses month-year ranges', () => {
    const text = 'Frontend Engineer Jan 2022 - Dec 2023';
    expect(extractExperienceYears(text)).toBeCloseTo(2, 0);
  });

  it('handles "Present" as current date', () => {
    const text = 'Engineer 2022 - Present';
    const years = extractExperienceYears(text);
    expect(years).toBeGreaterThan(0);
    expect(years).toBeLessThan(20);
  });

  it('merges overlapping ranges (no double-count)', () => {
    const text = 'Job A 2020 - 2023. Job B 2022 - 2024.';
    expect(extractExperienceYears(text)).toBeLessThanOrEqual(5);
    expect(extractExperienceYears(text)).toBeGreaterThanOrEqual(4);
  });

  it('returns 0 when no dates', () => {
    expect(extractExperienceYears('no dates here')).toBe(0);
  });
});

describe('parser.titleSimilarity', () => {
  it('returns high score for identical titles', () => {
    const t = titleSimilarity('Frontend Engineer at Acme', 'Frontend Engineer');
    expect(t.similarity).toBeGreaterThanOrEqual(50);
  });

  it('returns 0 when no title in resume', () => {
    const t = titleSimilarity('No titles here at all', 'Backend Engineer');
    expect(t.similarity).toBe(0);
  });
});

describe('parser.detectEducation', () => {
  it('detects bachelor degree', () => {
    expect(detectEducation('B.Tech in CS').level).toBe('bachelors');
  });

  it('detects masters degree', () => {
    expect(detectEducation('M.Sc in Data Science').level).toBe('masters');
  });

  it('returns unspecified when no degree', () => {
    expect(detectEducation('I went to school').level).toBe('unspecified');
  });
});

describe('parser.computeAtsScore (deterministic)', () => {
  const goodResume = `Jane Doe
jane@example.com | +1 555 123 4567 | linkedin.com/in/jane

SUMMARY
Frontend Engineer with 4 years of React + TypeScript experience.

EXPERIENCE
Frontend Engineer — Acme (2021 - Present)
- Built dashboards with React and TypeScript
- Shipped Tailwind CSS design system
- Set up CI/CD with GitHub Actions

EDUCATION
B.Tech CS — IIT Delhi (2017-2021)

SKILLS
React, TypeScript, Tailwind, Node.js, REST APIs, Git`;

  const jd = {
    jobTitle: 'Frontend Engineer',
    yearsRequired: 2,
    mustHaveSkills: ['React', 'TypeScript', 'Tailwind'],
    softSkills: ['Communication'],
    atsKeywords: ['React', 'TypeScript', 'CI/CD', 'REST APIs'],
    educationRequired: 'Bachelor',
  };

  it('produces deterministic output (same input → same score)', () => {
    const a = computeAtsScore({
      resumeText: goodResume,
      jdRequirements: jd,
      sections: detectSections(goodResume),
      contact: detectContact(goodResume),
      formattingIssues: [],
    });
    const b = computeAtsScore({
      resumeText: goodResume,
      jdRequirements: jd,
      sections: detectSections(goodResume),
      contact: detectContact(goodResume),
      formattingIssues: [],
    });
    expect(a.overallScore).toBe(b.overallScore);
    expect(a.verdict).toBe(b.verdict);
  });

  it('gives a strong/good verdict to a clearly matching resume', () => {
    const r = computeAtsScore({
      resumeText: goodResume,
      jdRequirements: jd,
      sections: detectSections(goodResume),
      contact: detectContact(goodResume),
      formattingIssues: [],
    });
    expect(['STRONG MATCH', 'GOOD MATCH']).toContain(r.verdict);
    expect(r.overallScore).toBeGreaterThan(70);
    expect(r.hardSkills.matched).toEqual(expect.arrayContaining(['React', 'TypeScript', 'Tailwind']));
    expect(r.experienceAnalysis.meetsRequirement).toBe(true);
  });

  it('gives a weak/reject verdict when nothing matches', () => {
    const badResume = 'I like dogs. I went to high school. I have hobbies.';
    const r = computeAtsScore({
      resumeText: badResume,
      jdRequirements: jd,
      sections: detectSections(badResume),
      contact: detectContact(badResume),
      formattingIssues: detectFormattingIssues(badResume),
    });
    expect(['REJECT', 'WEAK MATCH']).toContain(r.verdict);
    expect(r.overallScore).toBeLessThan(50);
    expect(r.hardSkills.missing.length).toBeGreaterThan(0);
  });

  it('does not penalize experience when JD has no years requirement', () => {
    const noYearsJd = { ...jd, yearsRequired: 0 };
    const r = computeAtsScore({
      resumeText: 'No dates here at all. Just skills: React, TypeScript, Tailwind',
      jdRequirements: noYearsJd,
      sections: { skills: true },
      contact: {},
      formattingIssues: [],
    });
    expect(r.experienceAnalysis.meetsRequirement).toBe(true);
    expect(r.breakdown.experienceMatch.score).toBe(100);
  });

  it('breakdown weights add up to roughly 100', () => {
    const r = computeAtsScore({
      resumeText: goodResume,
      jdRequirements: jd,
      sections: detectSections(goodResume),
      contact: detectContact(goodResume),
      formattingIssues: [],
    });
    const totalWeight = Object.values(r.breakdown).reduce((s, b) => s + b.weight, 0);
    // soft check - i tweak the weights occasionally and don't always re-balance to exactly 100
    expect(totalWeight).toBeGreaterThanOrEqual(90);
    expect(totalWeight).toBeLessThanOrEqual(110);
  });
});

describe('parser.extractText', () => {
  it('extracts plain text from a buffer', async () => {
    const text = await extractText(Buffer.from('hello world'), 'text/plain', 'a.txt');
    expect(text).toBe('hello world');
  });

  it('throws on unknown mime', async () => {
    await expect(
      extractText(Buffer.from('x'), 'image/png', 'a.png')
    ).rejects.toThrow(/Unsupported/);
  });

  // need a fixture image PDF to run this without hitting real tesseract download. doing it later
  it.todo('OCR fallback: image-only PDF returns text via tesseract');
});
