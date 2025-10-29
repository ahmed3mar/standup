import { StandupService } from '../StandupService';
import { SlackService } from '../SlackService';
import { Team, Standup } from '../../models';
import { AppDataSource } from '../../database/data-source';
import { Repository } from 'typeorm';

// Mock dependencies
jest.mock('../../database/data-source');
jest.mock('../SlackService');

describe('StandupService - Duplicate Prevention', () => {
  let standupService: StandupService;
  let mockSlackService: jest.Mocked<SlackService>;
  let mockStandupRepository: jest.Mocked<Repository<Standup>>;
  let mockTeamRepository: jest.Mocked<Repository<Team>>;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock repositories
    mockStandupRepository = {
      createQueryBuilder: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    } as any;

    mockTeamRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    } as any;

    // Mock AppDataSource.getRepository
    (AppDataSource.getRepository as jest.Mock) = jest.fn((entity) => {
      if (entity.name === 'Standup') return mockStandupRepository;
      if (entity.name === 'Team') return mockTeamRepository;
      return {} as any;
    });

    // Mock SlackService
    mockSlackService = new SlackService('token', undefined, 30) as jest.Mocked<SlackService>;
    mockSlackService.sendMessage = jest.fn().mockResolvedValue('1234567890.123456');

    standupService = new StandupService(mockSlackService);
  });

  describe('sendStandupMessage - duplicate prevention', () => {
    it('should not send standup if already sent today', async () => {
      const team = {
        id: 1,
        name: 'Engineering Team',
        channelId: 'C1234567890',
        users: [],
      } as unknown as Team;

      const existingStandup: Standup = {
        id: 1,
        teamId: 1,
        channelId: 'C1234567890',
        slackThreadTs: '1234567890.123456',
        standupDate: new Date(),
        status: 'pending',
      } as Standup;

      // Mock query builder for duplicate check
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(existingStandup),
      };

      mockStandupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockTeamRepository.findOne.mockResolvedValue(team);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await standupService.sendStandupMessage(team);

      expect(result).toEqual(existingStandup);
      expect(mockSlackService.sendMessage).not.toHaveBeenCalled();
      expect(mockStandupRepository.save).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Standup already sent today')
      );

      consoleSpy.mockRestore();
    });

    it('should send standup if not sent today', async () => {
      const team = {
        id: 1,
        name: 'Engineering Team',
        channelId: 'C1234567890',
        users: [
          { id: 1, name: 'User 1', slackUserId: 'U111' },
          { id: 2, name: 'User 2', slackUserId: 'U222' },
        ],
      } as unknown as Team;

      // Mock query builder - no existing standup
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockStandupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockTeamRepository.findOne.mockResolvedValue(team);

      const newStandup: Standup = {
        id: 1,
        teamId: 1,
        channelId: 'C1234567890',
        slackThreadTs: '1234567890.123456',
        standupDate: new Date(),
        status: 'pending',
      } as Standup;

      mockStandupRepository.create.mockReturnValue(newStandup);
      mockStandupRepository.save.mockResolvedValue(newStandup);

      const result = await standupService.sendStandupMessage(team);

      expect(mockSlackService.sendMessage).toHaveBeenCalledTimes(1);
      expect(mockStandupRepository.create).toHaveBeenCalledTimes(1);
      expect(mockStandupRepository.save).toHaveBeenCalledTimes(1);
      expect(result.slackThreadTs).toBe('1234567890.123456');
    });

    it('should check for duplicate using date-only comparison', async () => {
      const team = {
        id: 1,
        name: 'Engineering Team',
        channelId: 'C1234567890',
        users: [],
      } as unknown as Team;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockStandupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockTeamRepository.findOne.mockResolvedValue(team);

      mockStandupRepository.create.mockReturnValue({} as Standup);
      mockStandupRepository.save.mockResolvedValue({} as Standup);

      await standupService.sendStandupMessage(team);

      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];

      // Verify query uses DATE() function for date-only comparison
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'DATE(standup.standup_date) = :date',
        { date: dateStr }
      );
    });

    it('should only consider standups with slack_thread_ts as duplicates', async () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        channelId: 'C1234567890',
        users: [],
      } as unknown as Team;

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockStandupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockTeamRepository.findOne.mockResolvedValue(team);

      mockStandupRepository.create.mockReturnValue({} as Standup);
      mockStandupRepository.save.mockResolvedValue({} as Standup);

      await standupService.sendStandupMessage(team);

      // Verify query checks for slack_thread_ts IS NOT NULL
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith(
        'standup.slack_thread_ts IS NOT NULL'
      );
    });
  });

  describe('sendStandupToAllTeams', () => {
    it('should send to all teams and return success/failure counts', async () => {
      const teams: Partial<Team>[] = [
        {
          id: 1,
          name: 'Team 1',
          channelId: 'C111',
          users: [],
        },
        {
          id: 2,
          name: 'Team 2',
          channelId: 'C222',
          users: [],
        },
        {
          id: 3,
          name: 'Team 3',
          channelId: 'C333',
          users: [],
        },
      ];

      mockTeamRepository.find.mockResolvedValue(teams as Team[]);

      // Mock query builder for duplicate checks
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockStandupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockTeamRepository.findOne.mockImplementation((options: any) => {
        return Promise.resolve(teams.find((t) => t.id === options.where.id) as Team || null);
      });

      mockStandupRepository.create.mockReturnValue({} as Standup);
      mockStandupRepository.save.mockResolvedValue({} as Standup);

      // Make one team fail
      mockSlackService.sendMessage
        .mockResolvedValueOnce('123')
        .mockRejectedValueOnce(new Error('Slack error'))
        .mockResolvedValueOnce('456');

      const result = await standupService.sendStandupToAllTeams();

      expect(result.sent).toBe(2);
      expect(result.failed).toBe(1);
    });

    it('should handle all teams failing', async () => {
      const teams: Partial<Team>[] = [
        {
          id: 1,
          name: 'Team 1',
          channelId: 'C111',
          users: [],
        },
      ];

      mockTeamRepository.find.mockResolvedValue(teams as Team[]);

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };

      mockStandupRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder as any);
      mockTeamRepository.findOne.mockResolvedValue(teams[0] as Team);

      mockSlackService.sendMessage.mockRejectedValue(new Error('Slack error'));

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await standupService.sendStandupToAllTeams();

      expect(result.sent).toBe(0);
      expect(result.failed).toBe(1);
      expect(consoleErrorSpy).toHaveBeenCalled();

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getTeamsForStandup', () => {
    it('should return only teams with channel IDs', async () => {
      const teams: Partial<Team>[] = [
        {
          id: 1,
          name: 'Team 1',
          channelId: 'C111',
          users: [],
        },
        {
          id: 2,
          name: 'Team 2',
          channelId: undefined,
          users: [],
        },
        {
          id: 3,
          name: 'Team 3',
          channelId: 'C333',
          users: [],
        },
      ];

      mockTeamRepository.find.mockResolvedValue(teams as Team[]);

      const result = await standupService.getTeamsForStandup();

      expect(result).toHaveLength(2);
      expect(result[0].channelId).toBe('C111');
      expect(result[1].channelId).toBe('C333');
    });

    it('should return empty array if no teams have channel IDs', async () => {
      const teams: Partial<Team>[] = [
        {
          id: 1,
          name: 'Team 1',
          channelId: undefined,
          users: [],
        },
        {
          id: 2,
          name: 'Team 2',
          channelId: undefined,
          users: [],
        },
      ];

      mockTeamRepository.find.mockResolvedValue(teams as Team[]);

      const result = await standupService.getTeamsForStandup();

      expect(result).toHaveLength(0);
    });
  });
});
