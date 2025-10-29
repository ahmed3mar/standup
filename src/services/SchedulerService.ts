import * as cron from 'node-cron';
import { Team } from '../models';
import { StandupService } from './StandupService';

/**
 * SchedulerService manages cron jobs for sending standups
 */
export class SchedulerService {
  private jobs: Map<number, cron.ScheduledTask> = new Map();
  private standupService: StandupService;

  constructor(standupService: StandupService) {
    this.standupService = standupService;
  }

  /**
   * Schedule a team's standup based on their configuration
   */
  scheduleTeam(team: Team): void {
    // Remove existing job if any
    this.unscheduleTeam(team.id);

    // Skip if no schedule time configured
    if (!team.scheduleTime) {
      console.log(`Team ${team.name} has no schedule time configured, skipping`);
      return;
    }

    // Parse schedule time (format: HH:MM)
    const [hours, minutes] = team.scheduleTime.split(':').map((s) => parseInt(s, 10));

    if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      console.error(`Invalid schedule time for team ${team.name}: ${team.scheduleTime}`);
      return;
    }

    // Parse excluded days (default: 0,5 for Sunday and Friday)
    const excludedDays = this.parseExcludedDays(team.excludedDays || '0,5');

    // Create cron expression: "minutes hours * * days"
    // For excluded days, we need to create a day-of-week expression
    const allowedDays = [0, 1, 2, 3, 4, 5, 6].filter((day) => !excludedDays.includes(day));

    if (allowedDays.length === 0) {
      console.warn(`Team ${team.name} has all days excluded, skipping`);
      return;
    }

    // Cron day format: 0=Sunday, 1=Monday, ..., 6=Saturday
    const cronDays = allowedDays.join(',');
    const cronExpression = `${minutes} ${hours} * * ${cronDays}`;

    console.log(`Scheduling team ${team.name} with cron expression: ${cronExpression}`);

    // Create and start the cron job
    const job = cron.schedule(
      cronExpression,
      async () => {
        try {
          console.log(`\n[${new Date().toISOString()}] Running scheduled standup for team: ${team.name}`);
          await this.standupService.sendStandupMessage(team);
          console.log(`✓ Scheduled standup sent successfully for team: ${team.name}`);
        } catch (error) {
          console.error(`✗ Failed to send scheduled standup for team ${team.name}:`, error);
        }
      }
    );

    job.start();

    this.jobs.set(team.id, job);
    console.log(`✓ Team ${team.name} scheduled successfully`);
  }

  /**
   * Unschedule a team's standup
   */
  unscheduleTeam(teamId: number): void {
    const job = this.jobs.get(teamId);
    if (job) {
      job.stop();
      this.jobs.delete(teamId);
    }
  }

  /**
   * Schedule all teams
   */
  async scheduleAllTeams(): Promise<void> {
    const teams = await this.standupService.getTeamsForStandup();

    console.log(`\nScheduling ${teams.length} team(s)...\n`);

    for (const team of teams) {
      this.scheduleTeam(team);
    }

    console.log(`\n✓ All teams scheduled successfully`);
  }

  /**
   * Stop all scheduled jobs
   */
  stopAll(): void {
    console.log('\nStopping all scheduled jobs...');
    for (const [teamId, job] of this.jobs) {
      job.stop();
      console.log(`Stopped job for team ID: ${teamId}`);
    }
    this.jobs.clear();
    console.log('✓ All jobs stopped');
  }

  /**
   * Parse excluded days string into array of numbers
   */
  private parseExcludedDays(excludedDaysStr: string): number[] {
    return excludedDaysStr
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n >= 0 && n <= 6);
  }

  /**
   * Get all active jobs
   */
  getActiveJobs(): number[] {
    return Array.from(this.jobs.keys());
  }
}
