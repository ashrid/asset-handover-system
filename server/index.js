import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import assetsRouter from './routes/assets.js';
import employeesRouter from './routes/employees.js';
import handoverRouter from './routes/handover.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Routes
app.use('/api/assets', assetsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/handover', handoverRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
