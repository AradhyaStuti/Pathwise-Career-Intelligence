import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth.js';
import Roadmap from '../models/Roadmap.js';
import User from '../models/User.js';
import { generateRoadmap } from '../services/ai.js';

const router = Router();

const generateSchema = z.object({
  targetRole: z.string().min(2).max(100),
  currentSkills: z.array(z.string()).default([]),
  hoursPerWeek: z.number().int().min(1).max(80),
  totalWeeks: z.number().int().min(2).max(24),
  experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
});

const ACTIVE_ROADMAP_LIMIT = 10;

router.post('/generate', authenticate, async (req, res, next) => {
  try {
    const input = generateSchema.parse(req.body);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const activeCount = await Roadmap.countDocuments({ userId: user._id });
    if (activeCount >= ACTIVE_ROADMAP_LIMIT) {
      return res.status(429).json({
        error: `You have ${activeCount} active roadmaps (max ${ACTIVE_ROADMAP_LIMIT}). Delete one from your dashboard to make room.`,
      });
    }

    const ai = await generateRoadmap(input);

    const roadmap = await Roadmap.create({
      userId: user._id,
      title: ai.title || `${input.targetRole} Roadmap`,
      targetRole: input.targetRole,
      currentSkills: input.currentSkills,
      hoursPerWeek: input.hoursPerWeek,
      totalWeeks: ai.totalWeeks || input.totalWeeks,
      skillsToGain: ai.skillsToGain || [],
      weeks: (ai.weeks || []).map((w) => ({
        weekNumber: w.weekNumber,
        theme: w.theme,
        goals: w.goals || [],
        tasks: (w.tasks || []).map((t) => ({ ...t, completed: false })),
        resources: w.resources || [],
        milestone: w.milestone || '',
      })),
    });

    res.json({ roadmap });
  } catch (e) {
    if (e.name === 'SyntaxError') return res.status(502).json({ error: 'AI returned invalid JSON' });
    next(e);
  }
});

router.get('/', authenticate, async (req, res, next) => {
  try {
    const roadmaps = await Roadmap.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json({ roadmaps });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user.id });
    if (!roadmap) return res.status(404).json({ error: 'Not found' });
    res.json({ roadmap });
  } catch (e) {
    next(e);
  }
});

router.patch('/:id/task', authenticate, async (req, res, next) => {
  try {
    const { weekId, taskId, completed } = req.body;
    const roadmap = await Roadmap.findOne({ _id: req.params.id, userId: req.user.id });
    if (!roadmap) return res.status(404).json({ error: 'Not found' });
    const week = roadmap.weeks.id(weekId);
    if (!week) return res.status(404).json({ error: 'Week not found' });
    const task = week.tasks.id(taskId);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    task.completed = !!completed;
    week.completed = week.tasks.every((t) => t.completed);
    await roadmap.save();
    res.json({ roadmap });
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await Roadmap.deleteOne({ _id: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
