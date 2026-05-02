import { Router } from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import Roadmap from '../models/Roadmap.js';
import User from '../models/User.js';
import {
  getJobMarketInsights,
  analyzeSkillGap,
  extractJDRequirements,
  generateResumeNarrative,
} from '../services/ai.js';
import {
  extractText,
  detectSections,
  detectContact,
  calculateWordStats,
  detectFormattingIssues,
  computeAtsScore,
} from '../services/parser.js';

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/insights', authenticate, async (req, res, next) => {
  try {
    const role = z.string().min(2).max(100).parse(req.query.role);
    const data = await getJobMarketInsights(role);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post('/skill-gap', authenticate, async (req, res, next) => {
  try {
    const { targetRole, currentSkills } = z
      .object({
        targetRole: z.string().min(2).max(100),
        currentSkills: z.array(z.string()).default([]),
      })
      .parse(req.body);
    const data = await analyzeSkillGap(targetRole, currentSkills);
    res.json(data);
  } catch (e) {
    next(e);
  }
});

router.post(
  '/resume/scan',
  authenticate,
  upload.single('resume'),
  async (req, res, next) => {
    try {
      const jobDescription = (req.body.jobDescription || '').trim();
      if (jobDescription.length < 30) {
        return res.status(400).json({ error: 'Job description is too short (min 30 chars)' });
      }

      let resumeText = (req.body.resumeText || '').trim();
      if (req.file) {
        resumeText = await extractText(req.file.buffer, req.file.mimetype, req.file.originalname);
      }
      if (!resumeText || resumeText.length < 30) {
        return res
          .status(400)
          .json({ error: 'Resume text is empty or too short. Upload a PDF/DOCX or paste text.' });
      }

      const sections = detectSections(resumeText);
      const contact = detectContact(resumeText);
      const stats = calculateWordStats(resumeText);
      const formattingIssues = detectFormattingIssues(resumeText);

      const jdRequirements = await extractJDRequirements(jobDescription);

      const scoring = computeAtsScore({
        resumeText,
        jdRequirements,
        sections,
        contact,
        formattingIssues,
      });

      let narrative;
      try {
        narrative = await generateResumeNarrative({ resumeText, jdRequirements, scoring });
      } catch (e) {
        narrative = {
          verdictReason: `Resume scored ${scoring.overallScore}/100 — ${scoring.verdict}. (AI narrative unavailable: ${e.message})`,
          redFlags: scoring.hardSkills.missing.length
            ? [`Missing required skills: ${scoring.hardSkills.missing.slice(0, 3).join(', ')}`]
            : [],
          greenFlags: scoring.hardSkills.matched.length
            ? [`Matched skills: ${scoring.hardSkills.matched.slice(0, 3).join(', ')}`]
            : [],
          topRecommendations: scoring.hardSkills.missing.length
            ? scoring.hardSkills.missing.slice(0, 5).map((s) => `Add ${s} to your skills section if you have it`)
            : ['Re-run the scan to get AI-powered recommendations'],
          rewriteSummary: '',
        };
      }

      res.json({
        report: {
          ...scoring,
          ...narrative,
          parsed: {
            sections,
            contact,
            stats,
            formattingIssues,
            textPreview: resumeText.slice(0, 500),
          },
          jdRequirements,
        },
      });
    } catch (e) {
      next(e);
    }
  }
);

// TODO paginate this if it ever gets slow
router.get('/leaderboard', authenticate, async (_req, res, next) => {
  try {
    const roadmaps = await Roadmap.find().populate('userId', 'name').lean({ virtuals: true });
    const byUser = new Map();
    for (const r of roadmaps) {
      const total = (r.weeks || []).reduce((a, w) => a + (w.tasks?.length || 0), 0);
      const done = (r.weeks || []).reduce(
        (a, w) => a + (w.tasks || []).filter((t) => t.completed).length,
        0
      );
      const uid = r.userId?._id?.toString();
      if (!uid) continue;
      const cur = byUser.get(uid) || {
        name: r.userId.name,
        totalTasks: 0,
        doneTasks: 0,
        roadmaps: 0,
      };
      cur.totalTasks += total;
      cur.doneTasks += done;
      cur.roadmaps += 1;
      byUser.set(uid, cur);
    }
    const board = [...byUser.values()]
      .map((u) => ({ ...u, pct: u.totalTasks ? Math.round((u.doneTasks / u.totalTasks) * 100) : 0 }))
      .sort((a, b) => b.doneTasks - a.doneTasks)
      .slice(0, 20);
    res.json({ leaderboard: board });
  } catch (e) {
    next(e);
  }
});

router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    const roadmaps = await Roadmap.find({ userId: req.user.id });
    let tasksDone = 0;
    let tasksTotal = 0;
    for (const r of roadmaps) {
      for (const w of r.weeks) {
        tasksTotal += w.tasks.length;
        tasksDone += w.tasks.filter((t) => t.completed).length;
      }
    }
    const badges = [];
    if (roadmaps.length >= 1) badges.push({ name: 'First Roadmap', level: 'bronze' });
    if (tasksDone >= 5) badges.push({ name: 'Getting Started', level: 'bronze' });
    if (tasksDone >= 25) badges.push({ name: 'Committed Learner', level: 'silver' });
    if (tasksDone >= 50) badges.push({ name: 'Halfway There', level: 'gold' });
    if (tasksDone >= 100) badges.push({ name: 'Centurion', level: 'platinum' });
    if (roadmaps.length >= 3) badges.push({ name: 'Career Explorer', level: 'silver' });
    if (roadmaps.length >= 5) badges.push({ name: 'Strategist', level: 'gold' });
    res.json({
      user,
      totals: { roadmaps: roadmaps.length, tasksDone, tasksTotal },
      badges,
    });
  } catch (e) {
    next(e);
  }
});

export default router;
