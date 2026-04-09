import express from 'express';
import cors from 'cors';
import { config, validateConfig } from './config';
import apiRoutes from './routes/api';

const app = express();

app.use(cors({ origin: config.FRONTEND_URL }));
app.use(express.json());
app.use('/api', apiRoutes);

app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

const warnings = validateConfig();
if (warnings.length) {
  console.warn('⚠️  Config warnings:');
  warnings.forEach(w => console.warn(`   ${w}`));
}

app.listen(config.PORT, () => {
  console.log(`🎯 MB Quizzes API running on http://localhost:${config.PORT}`);
});
