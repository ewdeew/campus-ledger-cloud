import express from 'express';
import { z } from 'zod';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

function monthRange(month) {
  const [y, m] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

const budgetSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, '月份格式应为 YYYY-MM'),
  amount: z.number().nonnegative('预算不能为负数'), // 单位：元
});

// 获取某月预算（含已用、剩余、状态，并支持自动继承）
router.get('/', auth, async (req, res) => {
  const { month } = req.query;
  if (!month || !/^\d{4}-\d{2}$/.test(month)) {
    return res.status(400).json({ error: 'month 必填且格式为 YYYY-MM' });
  }

  // 自动继承：查找 <= 当前月的最近一次预算记录
  const budget = await prisma.budget.findFirst({
    where: {
      userId: req.user.id,
      month: { lte: month },
    },
    orderBy: { month: 'desc' },
  });

  const range = monthRange(month);
  const agg = await prisma.record.aggregate({
    where: {
      userId: req.user.id,
      type: 'expense',
      date: { gte: range.start, lt: range.end },
    },
    _sum: { amount: true },
  });

  const used = (agg._sum.amount || 0) / 100;

  if (!budget) {
    return res.json({
      month,
      amount: null,
      used,
      remaining: null,
      percent: 0,
      status: 'none',
      inherited: false,
      sourceMonth: null,
    });
  }

  const amount = budget.amount / 100;
  const inherited = budget.month !== month;

  let status = amount > 0 ? 'normal' : 'none';
  let percent = 0;

  if (amount > 0) {
    percent = Math.min(100, Math.round((used / amount) * 100));
    if (used > amount) status = 'exceeded';
    else if (percent >= 80) status = 'warning';
    else status = 'normal';
  }

  res.json({
    month,
    amount,
    used,
    remaining: amount - used,
    percent,
    status, // none | normal | warning | exceeded
    inherited,
    sourceMonth: budget.month,
  });
});

// 设置/更新某月预算
router.put('/', auth, async (req, res) => {
  const parsed = budgetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { month, amount } = parsed.data;
  const cents = Math.round(amount * 100);

  const budget = await prisma.budget.upsert({
    where: { userId_month: { userId: req.user.id, month } },
    update: { amount: cents },
    create: { userId: req.user.id, month, amount: cents },
  });

  res.json({ month, amount: budget.amount / 100 });
});

export default router;
