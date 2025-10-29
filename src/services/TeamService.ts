import { Repository } from 'typeorm';
import { Team, User } from '../models';
import { AppDataSource } from '../database/data-source';

/**
 * TeamService handles team management operations
 */
export class TeamService {
  private teamRepository: Repository<Team>;
  private userRepository: Repository<User>;

  constructor() {
    this.teamRepository = AppDataSource.getRepository(Team);
    this.userRepository = AppDataSource.getRepository(User);
  }

  /**
   * Get all teams
   */
  async getAllTeams(): Promise<Team[]> {
    return await this.teamRepository.find({
      relations: ['owner', 'users'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get team by ID
   */
  async getTeamById(id: number): Promise<Team | null> {
    return await this.teamRepository.findOne({
      where: { id },
      relations: ['owner', 'users'],
    });
  }

  /**
   * Create a new team
   */
  async createTeam(
    name: string,
    channelId?: string,
    description?: string,
    ownerId?: number
  ): Promise<Team> {
    const team = this.teamRepository.create({
      name,
      channelId,
      description,
      ownerUserId: ownerId,
    });

    return await this.teamRepository.save(team);
  }

  /**
   * Update a team
   */
  async updateTeam(
    id: number,
    updates: Partial<Pick<Team, 'name' | 'channelId' | 'description' | 'ownerUserId'>>
  ): Promise<Team> {
    await this.teamRepository.update(id, updates);
    const team = await this.getTeamById(id);
    if (!team) {
      throw new Error(`Team with ID ${id} not found`);
    }
    return team;
  }

  /**
   * Delete a team
   */
  async deleteTeam(id: number): Promise<void> {
    await this.teamRepository.delete(id);
  }

  /**
   * Add a user to a team
   */
  async addUserToTeam(teamId: number, userId: number): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['users'],
    });

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error(`User with ID ${userId} not found`);
    }

    // Check if user is already in team
    if (team.users.some((u) => u.id === userId)) {
      console.log(`User ${user.name} is already in team ${team.name}`);
      return;
    }

    team.users.push(user);
    await this.teamRepository.save(team);
  }

  /**
   * Remove a user from a team
   */
  async removeUserFromTeam(teamId: number, userId: number): Promise<void> {
    const team = await this.teamRepository.findOne({
      where: { id: teamId },
      relations: ['users'],
    });

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    team.users = team.users.filter((u) => u.id !== userId);
    await this.teamRepository.save(team);
  }

  /**
   * Get user by name
   */
  async getUserByName(name: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { name } });
  }

  /**
   * Create a new user
   */
  async createUser(
    name: string,
    email: string,
    slackUserId?: string,
    isAdmin?: boolean
  ): Promise<User> {
    const user = this.userRepository.create({
      name,
      email,
      slackUserId,
      isAdmin: isAdmin || false,
    });

    return await this.userRepository.save(user);
  }
}
