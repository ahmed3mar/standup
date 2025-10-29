import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { TeamService } from '../../services';

/**
 * DeleteCommand deletes a team
 */
export class DeleteCommand {
  async execute(teamId: number): Promise<void> {
    try {
      await initializeDatabase();

      const teamService = new TeamService();

      // Get team details before deletion
      const team = await teamService.getTeamById(teamId);
      if (!team) {
        console.error(`✗ Team with ID ${teamId} not found`);
        process.exit(1);
      }

      await teamService.deleteTeam(teamId);

      console.log(`✓ Team "${team.name}" (ID: ${teamId}) deleted successfully`);

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Failed to delete team:', error);
      throw error;
    }
  }
}
