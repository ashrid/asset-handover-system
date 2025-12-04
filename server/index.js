import express from 'express';
import cors from 'cors';
import { initDatabase } from './database.js';
import assetsRouter from './routes/assets.js';
import employeesRouter from './routes/employees.js';
import handoverRouter from './routes/handover.js';
import locationsRouter from './routes/locations.js';
import dashboardRouter from './routes/dashboard.js';
import { startReminderService, triggerManualReminder } from './services/reminderService.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Initialize database
initDatabase();

// Start automated reminder service
startReminderService();

// Routes
app.use('/api/assets', assetsRouter);
app.use('/api/employees', employeesRouter);
app.use('/api/handover', handoverRouter);
app.use('/api/locations', locationsRouter);
app.use('/api/dashboard', dashboardRouter);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Manual reminder trigger endpoint (for testing/admin use)
app.post('/api/reminders/trigger', async (req, res) => {
  try {
    const result = await triggerManualReminder();
    res.json({
      success: true,
      message: `Reminder check completed: ${result.sent} sent, ${result.failed} failed`,
      ...result
    });
  } catch (error) {
    console.error('Error triggering reminders:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
