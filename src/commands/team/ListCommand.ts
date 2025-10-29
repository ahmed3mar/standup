import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { TeamService } from '../../services';

/**
 * ListCommand lists all teams
 */
export class ListCommand {
  async execute(): Promise<void> {
    try {
      await initializeDatabase();

      const teamService = new TeamService();
      const teams = await teamService.getAllTeams();

      if (teams.length === 0) {
        console.log('No teams found');
        return;
      }

      console.log(`\nFound ${teams.length} team(s):\n`);

      for (const team of teams) {
        console.log(`[${team.id}] ${team.name}`);
        console.log(`  Channel: ${team.channelId || 'Not set'}`);
        console.log(`  Description: ${team.description || 'Not set'}`);
        console.log(`  Schedule Time: ${team.scheduleTime || 'Not set'}`);
        console.log(`  Excluded Days: ${team.excludedDays || 'Not set (default: 0,5 - Sunday, Friday)'}`);
        console.log(`  Owner: ${team.owner?.name || 'Not set'}`);
        console.log(`  Members: ${team.users?.length || 0}`);
        if (team.users && team.users.length > 0) {
          console.log(`    - ${team.users.map((u) => u.name).join(', ')}`);
        }
        console.log('');
      }

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Failed to list teams:', error);
      throw error;
    }
  }
}
