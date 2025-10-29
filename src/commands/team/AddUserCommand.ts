import { initializeDatabase, AppDataSource } from '../../database/data-source';
import { TeamService } from '../../services';

/**
 * AddUserCommand adds a user to a team
 */
export class AddUserCommand {
  async execute(teamId: number, userName: string, createIfNotExists: boolean = false): Promise<void> {
    try {
      await initializeDatabase();

      const teamService = new TeamService();

      // Find user
      let user = await teamService.getUserByName(userName);

      if (!user) {
        if (createIfNotExists) {
          console.log(`User "${userName}" not found. Creating...`);
          const email = `${userName.toLowerCase().replace(/\s+/g, '.')}@example.com`;
          user = await teamService.createUser(userName, email);
          console.log(`✓ User created with email: ${email}`);
        } else {
          console.error(`✗ User "${userName}" not found. Use --create flag to create the user.`);
          process.exit(1);
        }
      }

      await teamService.addUserToTeam(teamId, user.id);

      const team = await teamService.getTeamById(teamId);
      console.log(`✓ User "${userName}" added to team "${team?.name}"`);

      await AppDataSource.destroy();
    } catch (error) {
      console.error('✗ Failed to add user to team:', error);
      throw error;
    }
  }
}
