import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { config } from '../config.js';

const router = Router();

const signupSchema = z.object({
  name: z.string().trim().min(2).max(50),
  email: z.string().email().toLowerCase(),
  password: z.string().min(8).max(100),
});

const loginSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(1),
});

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: 'lax',
  secure: config.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/',
};

function setAuthCookie(res, user) {
  const token = jwt.sign({ id: user._id, email: user.email, name: user.name }, config.JWT_SECRET, {
    expiresIn: '7d',
  });
  res.cookie('token', token, COOKIE_OPTIONS);
}

function publicUser(u) {
  return { id: u._id, name: u.name, email: u.email, profile: u.profile || {} };
}

const profileSchema = z
  .object({
    phone: z.string().max(50).optional(),
    location: z.string().max(100).optional(),
    linkedin: z.string().max(200).optional(),
    github: z.string().max(200).optional(),
    skills: z.array(z.string().max(80)).max(50).optional(),
    experienceYears: z.number().min(0).max(60).optional(),
    background: z.string().max(8000).optional(),
    targetRole: z.string().max(100).optional(),
    hoursPerWeek: z.number().min(1).max(80).optional(),
    experienceLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
  })
  .strict();

router.post('/signup', async (req, res, next) => {
  try {
    const data = signupSchema.parse(req.body);
    const exists = await User.findOne({ email: data.email });
    if (exists) return res.status(409).json({ error: 'Email already registered' });
    const password = await bcrypt.hash(data.password, 10);
    const user = await User.create({ ...data, password });
    setAuthCookie(res, user);
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    setAuthCookie(res, user);
    res.json({ user: publicUser(user) });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token', { path: '/' });
  res.json({ ok: true });
});

router.get('/me', authenticate, (req, res, next) => {
  User.findById(req.user.id).select('-password')
    .then(u => {
      if (!u) return res.status(404).json({ error: 'Not found' });
      res.json({ user: publicUser(u) });
    })
    .catch(next);
});

router.put('/profile', authenticate, async (req, res, next) => {
  try {
    const data = profileSchema.parse(req.body);
    const u = await User.findById(req.user.id);
    if (!u) return res.status(404).json({ error: 'Not found' });
    u.profile = { ...(u.profile?.toObject?.() || u.profile || {}), ...data };
    await u.save();
    res.json({ user: publicUser(u) });
  } catch (e) {
    next(e);
  }
});

router.put('/password', authenticate, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = z
      .object({
        currentPassword: z.string().min(1),
        newPassword: z.string().min(8).max(100),
      })
      .parse(req.body);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

router.delete('/account', authenticate, async (req, res, next) => {
  try {
    const { password } = z.object({ password: z.string().min(1) }).parse(req.body);
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'Not found' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Password is incorrect' });
    const { default: Roadmap } = await import('../models/Roadmap.js');
    await Roadmap.deleteMany({ userId: user._id });
    await User.deleteOne({ _id: user._id });
    res.clearCookie('token', { path: '/' });
    res.json({ ok: true });
  } catch (e) {
    next(e);
  }
});

export default router;
