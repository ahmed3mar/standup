import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { TeamService } from '../../services';

/**
 * CreateCommand creates a new team
 */
export class CreateCommand {
  async execute(name: string, channelId?: string, description?: string): Promise<void> {
    try {
      await initializeDatabase();

      const teamService = new TeamService();
      const team = await teamService.createTeam(name, channelId, description);

      console.log(`✓ Team created successfully:`);
      console.log(`  ID: ${team.id}`);
      console.log(`  Name: ${team.name}`);
      console.log(`  Channel ID: ${team.channelId || 'Not set'}`);
      console.log(`  Description: ${team.description || 'Not set'}`);

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Failed to create team:', error);
      throw error;
    }
  }
}
