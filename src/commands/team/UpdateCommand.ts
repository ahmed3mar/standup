import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { TeamService } from '../../services';

/**
 * UpdateCommand updates a team
 */
export class UpdateCommand {
  async execute(
    teamId: number,
    options: {
      name?: string;
      channelId?: string;
      description?: string;
    }
  ): Promise<void> {
    try {
      await initializeDatabase();

      const teamService = new TeamService();

      // Build update object
      const updates: any = {};
      if (options.name) updates.name = options.name;
      if (options.channelId) updates.channelId = options.channelId;
      if (options.description !== undefined) updates.description = options.description;

      if (Object.keys(updates).length === 0) {
        console.log('No updates provided');
        return;
      }

      const team = await teamService.updateTeam(teamId, updates);

      console.log(`✓ Team updated successfully:`);
      console.log(`  ID: ${team.id}`);
      console.log(`  Name: ${team.name}`);
      console.log(`  Channel ID: ${team.channelId || 'Not set'}`);
      console.log(`  Description: ${team.description || 'Not set'}`);

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Failed to update team:', error);
      throw error;
    }
  }
}
