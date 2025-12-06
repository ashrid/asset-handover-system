import cron from 'node-cron';
import db from '../database.js';
import { sendHandoverEmail } from './emailService.js';
import { createModuleLogger, logReminderService } from './logger.js';

const logger = createModuleLogger('reminder-service');

/**
 * Automated Reminder Service
 * Sends weekly reminders for unsigned asset assignments
 * Runs daily at 9:00 AM to check for assignments needing reminders
 */

// Function to send reminders for unsigned assignments
export async function sendReminders() {
  logReminderService('check-started');

  try {
    // Query for assignments that need reminders
    // Criteria:
    // 1. Not signed and not disputed
    // 2. Token not expired
    // 3. Either never sent reminder OR last reminder sent >= 7 days ago
    // 4. Reminder count < 4 (maximum 4 reminders = 28 days)
    const stmt = db.prepare(`
      SELECT
        id,
        employee_name,
        email,
        signature_token,
        token_expires_at,
        reminder_count,
        last_reminder_sent,
        (
          SELECT COUNT(*) FROM assignment_items WHERE assignment_id = asset_assignments.id
        ) as asset_count
      FROM asset_assignments
      WHERE is_signed = 0
        AND is_disputed = 0
        AND datetime(token_expires_at) > datetime('now')
        AND (
          last_reminder_sent IS NULL
          OR datetime(last_reminder_sent) <= datetime('now', '-7 days')
        )
        AND reminder_count < 4
    `);

    const assignments = stmt.all();

    if (assignments.length === 0) {
      logReminderService('no-reminders-needed');
      return { sent: 0, failed: 0 };
    }

    logger.info({ count: assignments.length }, `Found ${assignments.length} assignment(s) needing reminders`);

    let sent = 0;
    let failed = 0;

    // Send reminder email for each assignment
    for (const assignment of assignments) {
      try {
        const now = new Date();
        const expiresAt = new Date(assignment.token_expires_at);
        const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        const reminderNumber = (assignment.reminder_count || 0) + 1;

        // Generate signing URL
        const signingUrl = `${process.env.BASE_URL || 'http://localhost:3000'}/sign/${assignment.signature_token}`;

        // Send reminder email
        await sendHandoverEmail({
          email: assignment.email,
          employeeName: assignment.employee_name,
          signingUrl: signingUrl,
          expiresAt: expiresAt,
          assetCount: assignment.asset_count,
          reminderNumber: reminderNumber,
          daysRemaining: daysRemaining,
          isReminder: true
        });

        // Update database with new reminder info
        const updateStmt = db.prepare(`
          UPDATE asset_assignments
          SET last_reminder_sent = datetime('now'),
              reminder_count = reminder_count + 1
          WHERE id = ?
        `);
        updateStmt.run(assignment.id);

        logger.info({
          assignmentId: assignment.id,
          reminderNumber,
          daysRemaining,
          employeeName: assignment.employee_name
        }, `Sent reminder #${reminderNumber}`);
        sent++;
      } catch (error) {
        logger.error({
          assignmentId: assignment.id,
          error: error.message
        }, 'Failed to send reminder');
        failed++;
      }
    }

    logReminderService('check-completed', { sent, failed });
    return { sent, failed };
  } catch (error) {
    logger.error({ error }, 'Error in reminder check');
    throw error;
  }
}

// Initialize cron job
export function startReminderService() {
  // Run daily at 9:00 AM (0 9 * * *)
  // For testing: Run every minute (*/1 * * * *)
  const schedule = process.env.REMINDER_CRON_SCHEDULE || '0 9 * * *';
  const timezone = process.env.TZ || 'Asia/Dubai';

  logger.info({ schedule, timezone }, 'Initializing reminder service');

  const job = cron.schedule(schedule, async () => {
    logger.info('Cron job triggered');
    await sendReminders();
  }, {
    timezone
  });

  logger.info({ schedule, timezone }, 'Reminder service started');

  return job;
}

// Manual trigger function (for testing)
export async function triggerManualReminder() {
  logger.info('Manual reminder trigger requested');
  return await sendReminders();
}
