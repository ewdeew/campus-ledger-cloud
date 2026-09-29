import express from 'express';
import { z } from 'zod';
import ExcelJS from 'exceljs';
import { prisma } from '../prisma.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

function monthRange(month) {
  if (!/^\d{4}-\d{2}$/.test(month)) return null;
  const [y, m] = month.split('-').map(Number);
  return {
    start: new Date(Date.UTC(y, m - 1, 1)),
    end: new Date(Date.UTC(y, m, 1)),
  };
}

const createSchema = z.object({
  type: z.enum(['income', 'expense']),
  category: z.string().min(1, '请选择分类'),
  amount: z.number().positive('金额必须大于 0'), // 单位：元
  note: z.string().optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式应为 YYYY-MM-DD'),
});

// 列表
router.get('/', auth, async (req, res) => {
  const { month } = req.query;
  const where = { userId: req.user.id };

  if (month) {
    const range = monthRange(month);
    if (!range) return res.status(400).json({ error: 'month 格式应为 YYYY-MM' });
    where.date = { gte: range.start, lt: range.end };
  }

  const records = await prisma.record.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  res.json(records.map(r => ({ ...r, amount: r.amount / 100 })));
});

// 统计
router.get('/stats', auth, async (req, res) => {
  const { month } = req.query;
  const where = { userId: req.user.id };

  if (month) {
    const range = monthRange(month);
    if (!range) return res.status(400).json({ error: 'month 格式应为 YYYY-MM' });
    where.date = { gte: range.start, lt: range.end };
  }

  const records = await prisma.record.findMany({ where });
  let income = 0, expense = 0;
  const categories = {};

  for (const r of records) {
    if (r.type === 'income') {
      income += r.amount;
    } else {
      expense += r.amount;
      categories[r.category] = (categories[r.category] || 0) + r.amount;
    }
  }

  res.json({
    income: income / 100,
    expense: expense / 100,
    balance: (income - expense) / 100,
    categories: Object.fromEntries(
      Object.entries(categories).map(([k, v]) => [k, v / 100])
    ),
  });
});

// ========== 连续记账统计（当前连续天数） ==========
router.get('/streak', auth, async (req, res) => {
  const records = await prisma.record.findMany({
    where: { userId: req.user.id },
    select: { date: true },
  });

  const dateSet = new Set(records.map(r => r.date.toISOString().slice(0, 10)));

  let streak = 0;
  const today = new Date();
  let cursor = new Date(Date.UTC(
    today.getUTCFullYear(),
    today.getUTCMonth(),
    today.getUTCDate()
  ));

  // 如果今天还没记账，则从昨天开始计算
  if (!dateSet.has(cursor.toISOString().slice(0, 10))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  while (dateSet.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  res.json({ streak });
});

// 新增
router.post('/', auth, async (req, res) => {
  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { type, category, amount, note, date } = parsed.data;
  const record = await prisma.record.create({
    data: {
      userId: req.user.id,
      type,
      category,
      amount: Math.round(amount * 100),
      note,
      date: new Date(`${date}T00:00:00.000Z`),
    },
  });

  res.status(201).json({ ...record, amount: record.amount / 100 });
});

// ========== 更新/编辑记录 ==========
router.put('/:id', auth, async (req, res) => {
  const record = await prisma.record.findUnique({ where: { id: req.params.id } });
  if (!record || record.userId !== req.user.id) {
    return res.status(404).json({ error: '记录不存在' });
  }

  const parsed = createSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.errors[0].message });
  }

  const { type, category, amount, note, date } = parsed.data;
  const updated = await prisma.record.update({
    where: { id: req.params.id },
    data: {
      type,
      category,
      amount: Math.round(amount * 100),
      note,
      date: new Date(`${date}T00:00:00.000Z`),
    },
  });

  res.json({ ...updated, amount: updated.amount / 100 });
});

// 删除
router.delete('/:id', auth, async (req, res) => {
  const record = await prisma.record.findUnique({ where: { id: req.params.id } });
  if (!record || record.userId !== req.user.id) {
    return res.status(404).json({ error: '记录不存在' });
  }
  await prisma.record.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ========== 导出 Excel（当前筛选月份） ==========
router.get('/export', auth, async (req, res) => {
  const { month } = req.query;
  const where = { userId: req.user.id };

  if (month) {
    const range = monthRange(month);
    if (!range) return res.status(400).json({ error: 'month 格式应为 YYYY-MM' });
    where.date = { gte: range.start, lt: range.end };
  }

  const records = await prisma.record.findMany({
    where,
    orderBy: { date: 'desc' },
  });

  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('账目明细');

  sheet.columns = [
    { header: '日期', key: 'date', width: 12 },
    { header: '类型', key: 'type', width: 8 },
    { header: '分类', key: 'category', width: 12 },
    { header: '金额(元)', key: 'amount', width: 12 },
    { header: '备注', key: 'note', width: 30 },
  ];

  for (const r of records) {
    sheet.addRow({
      date: r.date.toISOString().slice(0, 10),
      type: r.type === 'income' ? '收入' : '支出',
      category: r.category,
      amount: (r.amount / 100).toFixed(2),
      note: r.note || '',
    });
  }

  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=ledger_${month || 'all'}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});

export default router;
