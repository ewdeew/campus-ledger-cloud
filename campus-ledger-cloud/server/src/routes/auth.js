import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

const registerSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(6, '密码至少 6 位'),
  name: z.string().min(1).optional(),
});

// 注册
router.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { email, password, name } = parsed.data;
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return res.status(400).json({ error: '该邮箱已注册' });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, passwordHash, name },
  });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// 登录
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: '邮箱或密码错误' });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: '邮箱或密码错误' });

  const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name },
  });
});

// 当前用户
router.get('/me', auth, (req, res) => {
  res.json({
    user: { id: req.user.id, email: req.user.email, name: req.user.name },
  });
});

export default router;
