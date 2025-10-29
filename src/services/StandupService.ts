import { Repository } from 'typeorm';
import { Team, Standup, User } from '../models';
import { AppDataSource } from '../database/data-source';
import { SlackService } from './SlackService';
import { FormatterService } from './FormatterService';

/**
 * StandupService handles standup operations
 */
export class StandupService {
  private standupRepository: Repository<Standup>;
  private teamRepository: Repository<Team>;
  private slackService: SlackService;
  private formatterService: FormatterService;

  constructor(slackService: SlackService) {
    this.standupRepository = AppDataSource.getRepository(Standup);
    this.teamRepository = AppDataSource.getRepository(Team);
    this.slackService = slackService;
    this.formatterService = new FormatterService();
  }

  /**
   * Send standup message to a team
   */
  async sendStandupMessage(team: Team): Promise<Standup> {
    // Check if standup already sent today
    const today = new Date();
    const dateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const existing = await this.checkStandupExists(team.id, dateOnly);
    if (existing) {
      console.log(
        `Standup already sent today for team ${team.name} (timestamp: ${existing.slackThreadTs})`
      );
      return existing;
    }

    // Load team with users
    const teamWithUsers = await this.teamRepository.findOne({
      where: { id: team.id },
      relations: ['users'],
    });

    if (!teamWithUsers) {
      throw new Error(`Team with ID ${team.id} not found`);
    }

    // Select random leader
    const leader = this.selectRandomLeader(teamWithUsers.users);

    // Format message
    const message = this.formatterService.formatStandupMessage(
      team.name,
      leader?.slackUserId ? `<@${leader.slackUserId}>` : 'TBD',
      today
    );

    // Send to Slack
    const timestamp = await this.slackService.sendMessage(team.channelId!, message);

    // Create standup record
    const standup = this.standupRepository.create({
      teamId: team.id,
      channelId: team.channelId!,
      slackThreadTs: timestamp,
      standupDate: dateOnly,
      status: 'pending',
      leaderUserId: leader?.id,
      sentAt: new Date(),
    });

    await this.standupRepository.save(standup);

    console.log(`Sent standup message to team ${team.name} (timestamp: ${timestamp})`);

    return standup;
  }

  /**
   * Send standup to all teams
   */
  async sendStandupToAllTeams(): Promise<{ sent: number; failed: number }> {
    const teams = await this.getTeamsForStandup();

    let sent = 0;
    let failed = 0;

    for (const team of teams) {
      try {
        await this.sendStandupMessage(team);
        sent++;
      } catch (error) {
        console.error(`Failed to send standup to team ${team.name}:`, error);
        failed++;
      }
    }

    return { sent, failed };
  }

  /**
   * Get teams that should receive standup today
   */
  async getTeamsForStandup(): Promise<Team[]> {
    // Get all teams with channel IDs
    const teams = await this.teamRepository.find({
      where: {},
      relations: ['users'],
    });

    // Filter teams that have channel IDs
    return teams.filter((team) => team.channelId);
  }

  /**
   * Check if standup exists for a team on a specific date
   */
  private async checkStandupExists(teamId: number, date: Date): Promise<Standup | null> {
    const dateStr = date.toISOString().split('T')[0];

    return await this.standupRepository
      .createQueryBuilder('standup')
      .where('standup.team_id = :teamId', { teamId })
      .andWhere('DATE(standup.standup_date) = :date', { date: dateStr })
      .andWhere('standup.slack_thread_ts IS NOT NULL')
      .getOne();
  }

  /**
   * Select a random leader from team users
   */
  private selectRandomLeader(users: User[]): User | undefined {
    if (!users || users.length === 0) {
      return undefined;
    }

    const randomIndex = Math.floor(Math.random() * users.length);
    return users[randomIndex];
  }
}
