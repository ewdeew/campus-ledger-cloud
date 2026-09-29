import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import authRoutes from './routes/auth.js';
import recordRoutes from './routes/records.js';
import budgetRoutes from './routes/budget.js';

const app = express();

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/records', recordRoutes);
app.use('/api/budget', budgetRoutes);

app.use((req, res) => res.status(404).json({ error: '接口不存在' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ API 已启动： http://localhost:${PORT}`);
});
