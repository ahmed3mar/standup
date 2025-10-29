import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { StandupService, SlackService, SchedulerService } from '../../services';
import { getAppConfig } from '../../config';

/**
 * SchedulerCommand starts the cron scheduler for automated standups
 */
export class SchedulerCommand {
  async execute(): Promise<void> {
    try {
      await initializeDatabase();

      const appConfig = getAppConfig();
      const slackService = new SlackService(
        appConfig.slackToken,
        appConfig.slackCookie,
        appConfig.slackTimeout
      );
      const standupService = new StandupService(slackService);
      const schedulerService = new SchedulerService(standupService);

      console.log('Starting Standup Scheduler...\n');
      console.log('Configuration:');
      console.log('- Excluded days: Sunday (0), Friday (5)');
      console.log('- Teams will run at their configured schedule times\n');

      await schedulerService.scheduleAllTeams();

      console.log('\nScheduler is running. Press Ctrl+C to stop.\n');

      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('\n\nReceived SIGINT signal...');
        schedulerService.stopAll();
        await AppDataSource.destroy();
        console.log('✓ Scheduler stopped gracefully');
        process.exit(0);
      });

      process.on('SIGTERM', async () => {
        console.log('\n\nReceived SIGTERM signal...');
        schedulerService.stopAll();
        await AppDataSource.destroy();
        console.log('✓ Scheduler stopped gracefully');
        process.exit(0);
      });

      // Keep process alive
      await new Promise(() => {});
    } catch (error) {
      console.error('✗ Scheduler command failed:', error);
      throw error;
    }
  }
}
