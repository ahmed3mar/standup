import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { StandupService, SlackService, TeamService } from '../../services';
import { getAppConfig } from '../../config';

/**
 * SendCommand sends standup messages
 */
export class SendCommand {
  async execute(teamId?: number): Promise<void> {
    try {
      await initializeDatabase();

      const appConfig = getAppConfig();
      const slackService = new SlackService(
        appConfig.slackToken,
        appConfig.slackCookie,
        appConfig.slackTimeout
      );
      const standupService = new StandupService(slackService);

      if (teamId) {
        // Send to specific team
        const teamService = new TeamService();
        const team = await teamService.getTeamById(teamId);

        if (!team) {
          console.error(`✗ Team with ID ${teamId} not found`);
          process.exit(1);
        }

        if (!team.channelId) {
          console.error(`✗ Team ${team.name} does not have a channel ID configured`);
          process.exit(1);
        }

        console.log(`Sending standup to team: ${team.name} (Channel: ${team.channelId})`);
        const standup = await standupService.sendStandupMessage(team);
        console.log(`✓ Sent successfully (Thread: ${standup.slackThreadTs})`);
      } else {
        // Send to all teams
        const teams = await standupService.getTeamsForStandup();

        if (teams.length === 0) {
          console.log('No teams configured to receive standup');
          return;
        }

        console.log(`Sending standup to ${teams.length} team(s)...\n`);

        const result = await standupService.sendStandupToAllTeams();

        console.log(`\nSummary: ${result.sent} sent, ${result.failed} failed`);
      }

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Send command failed:', error);
      throw error;
    }
  }
}
