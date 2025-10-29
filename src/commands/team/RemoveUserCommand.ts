import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { TeamService } from '../../services';

/**
 * RemoveUserCommand removes a user from a team
 */
export class RemoveUserCommand {
  async execute(teamId: number, userId: number): Promise<void> {
    try {
      await initializeDatabase();

      const teamService = new TeamService();

      await teamService.removeUserFromTeam(teamId, userId);

      const team = await teamService.getTeamById(teamId);
      console.log(`✓ User removed from team "${team?.name}"`);

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Failed to remove user from team:', error);
      throw error;
    }
  }
}
