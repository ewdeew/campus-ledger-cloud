import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';

export async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未登录' });
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user) return res.status(401).json({ error: '用户不存在' });

    req.user = user;
    next();
  } catch (e) {
    return res.status(401).json({ error: '令牌无效或已过期' });
  }
}
