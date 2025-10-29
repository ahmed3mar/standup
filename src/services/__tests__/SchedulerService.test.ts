import { SchedulerService } from '../SchedulerService';
import { StandupService } from '../StandupService';
import { Team } from '../../models';

// Mock node-cron
jest.mock('node-cron');
import * as cron from 'node-cron';

describe('SchedulerService', () => {
  let schedulerService: SchedulerService;
  let mockStandupService: jest.Mocked<StandupService>;
  let mockCronJob: any;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();

    // Create mock cron job
    mockCronJob = {
      start: jest.fn(),
      stop: jest.fn(),
    };

    // Mock cron.schedule to return our mock job
    (cron.schedule as jest.Mock) = jest.fn().mockReturnValue(mockCronJob);

    // Create mock StandupService
    mockStandupService = {
      sendStandupMessage: jest.fn(),
      getTeamsForStandup: jest.fn(),
    } as any;

    schedulerService = new SchedulerService(mockStandupService);
  });

  describe('scheduleTeam', () => {
    it('should schedule a team with valid configuration', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '09:00',
        excludedDays: '0,5', // Sunday and Friday
        channelId: 'C1234567890',
      } as Team;

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).toHaveBeenCalledTimes(1);
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 9 * * 1,2,3,4,6', // Monday-Thursday, Saturday
        expect.any(Function)
      );
      expect(mockCronJob.start).toHaveBeenCalledTimes(1);
    });

    it('should skip scheduling if no schedule time is configured', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: undefined,
        channelId: 'C1234567890',
      } as Team;

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('has no schedule time configured')
      );

      consoleSpy.mockRestore();
    });

    it('should handle invalid schedule time format', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: 'invalid',
        channelId: 'C1234567890',
      } as Team;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid schedule time')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should handle schedule time with hours out of range', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '25:00',
        channelId: 'C1234567890',
      } as Team;

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid schedule time')
      );

      consoleErrorSpy.mockRestore();
    });

    it('should exclude all specified days correctly', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '10:30',
        excludedDays: '0,6', // Sunday and Saturday
        channelId: 'C1234567890',
      } as Team;

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).toHaveBeenCalledWith(
        '30 10 * * 1,2,3,4,5', // Monday-Friday
        expect.any(Function)
      );
    });

    it('should handle default excluded days when not specified', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '11:00',
        excludedDays: undefined,
        channelId: 'C1234567890',
      } as Team;

      schedulerService.scheduleTeam(team);

      // Should use default '0,5' (Sunday and Friday)
      expect(cron.schedule).toHaveBeenCalledWith(
        '0 11 * * 1,2,3,4,6', // Monday-Thursday, Saturday
        expect.any(Function)
      );
    });

    it('should skip scheduling if all days are excluded', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '09:00',
        excludedDays: '0,1,2,3,4,5,6', // All days
        channelId: 'C1234567890',
      } as Team;

      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining('has all days excluded')
      );

      consoleWarnSpy.mockRestore();
    });

    it('should replace existing job when rescheduling the same team', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '09:00',
        excludedDays: '0,5',
        channelId: 'C1234567890',
      } as Team;

      // Schedule first time
      schedulerService.scheduleTeam(team);
      expect(mockCronJob.start).toHaveBeenCalledTimes(1);

      // Schedule again with different time
      team.scheduleTime = '10:00';
      schedulerService.scheduleTeam(team);

      // Should stop the old job and create new one
      expect(mockCronJob.stop).toHaveBeenCalledTimes(1);
      expect(cron.schedule).toHaveBeenCalledTimes(2);
      expect(mockCronJob.start).toHaveBeenCalledTimes(2);
    });
  });

  describe('unscheduleTeam', () => {
    it('should stop and remove a scheduled job', () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '09:00',
        excludedDays: '0,5',
        channelId: 'C1234567890',
      } as Team;

      schedulerService.scheduleTeam(team);
      schedulerService.unscheduleTeam(team.id);

      expect(mockCronJob.stop).toHaveBeenCalledTimes(1);
      expect(schedulerService.getActiveJobs()).not.toContain(team.id);
    });

    it('should handle unscheduling a non-existent job gracefully', () => {
      expect(() => {
        schedulerService.unscheduleTeam(999);
      }).not.toThrow();
    });
  });

  describe('scheduleAllTeams', () => {
    it('should schedule all teams returned by getTeamsForStandup', async () => {
      const teams: Team[] = [
        {
          id: 1,
          name: 'Team 1',
          scheduleTime: '09:00',
          excludedDays: '0,5',
          channelId: 'C111',
        } as Team,
        {
          id: 2,
          name: 'Team 2',
          scheduleTime: '10:00',
          excludedDays: '0,6',
          channelId: 'C222',
        } as Team,
      ];

      mockStandupService.getTeamsForStandup.mockResolvedValue(teams);

      await schedulerService.scheduleAllTeams();

      expect(mockStandupService.getTeamsForStandup).toHaveBeenCalledTimes(1);
      expect(cron.schedule).toHaveBeenCalledTimes(2);
      expect(schedulerService.getActiveJobs()).toHaveLength(2);
    });

    it('should handle empty teams list', async () => {
      mockStandupService.getTeamsForStandup.mockResolvedValue([]);

      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await schedulerService.scheduleAllTeams();

      expect(mockStandupService.getTeamsForStandup).toHaveBeenCalledTimes(1);
      expect(cron.schedule).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Scheduling 0 team(s)')
      );

      consoleSpy.mockRestore();
    });
  });

  describe('stopAll', () => {
    it('should stop all scheduled jobs', () => {
      const teams: Team[] = [
        {
          id: 1,
          name: 'Team 1',
          scheduleTime: '09:00',
          channelId: 'C111',
        } as Team,
        {
          id: 2,
          name: 'Team 2',
          scheduleTime: '10:00',
          channelId: 'C222',
        } as Team,
      ];

      teams.forEach((team) => schedulerService.scheduleTeam(team));

      expect(schedulerService.getActiveJobs()).toHaveLength(2);

      schedulerService.stopAll();

      expect(mockCronJob.stop).toHaveBeenCalledTimes(2);
      expect(schedulerService.getActiveJobs()).toHaveLength(0);
    });

    it('should handle stopping when no jobs are scheduled', () => {
      expect(() => {
        schedulerService.stopAll();
      }).not.toThrow();
    });
  });

  describe('getActiveJobs', () => {
    it('should return list of team IDs with active jobs', () => {
      const team1: Team = {
        id: 1,
        name: 'Team 1',
        scheduleTime: '09:00',
        channelId: 'C111',
      } as Team;

      const team2: Team = {
        id: 2,
        name: 'Team 2',
        scheduleTime: '10:00',
        channelId: 'C222',
      } as Team;

      schedulerService.scheduleTeam(team1);
      schedulerService.scheduleTeam(team2);

      const activeJobs = schedulerService.getActiveJobs();

      expect(activeJobs).toHaveLength(2);
      expect(activeJobs).toContain(1);
      expect(activeJobs).toContain(2);
    });

    it('should return empty array when no jobs are active', () => {
      const activeJobs = schedulerService.getActiveJobs();

      expect(activeJobs).toHaveLength(0);
      expect(activeJobs).toEqual([]);
    });
  });

  describe('cron job execution', () => {
    it('should call sendStandupMessage when cron job fires', async () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '09:00',
        excludedDays: '0,5',
        channelId: 'C1234567890',
      } as Team;

      mockStandupService.sendStandupMessage.mockResolvedValue({} as any);

      schedulerService.scheduleTeam(team);

      // Get the callback function passed to cron.schedule
      const cronCallback = (cron.schedule as jest.Mock).mock.calls[0][1];

      // Execute the callback
      await cronCallback();

      expect(mockStandupService.sendStandupMessage).toHaveBeenCalledWith(team);
    });

    it('should handle errors during standup message sending', async () => {
      const team: Team = {
        id: 1,
        name: 'Engineering Team',
        scheduleTime: '09:00',
        excludedDays: '0,5',
        channelId: 'C1234567890',
      } as Team;

      const error = new Error('Slack API error');
      mockStandupService.sendStandupMessage.mockRejectedValue(error);

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

      schedulerService.scheduleTeam(team);

      // Get the callback function passed to cron.schedule
      const cronCallback = (cron.schedule as jest.Mock).mock.calls[0][1];

      // Execute the callback
      await cronCallback();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send scheduled standup'),
        error
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('parseExcludedDays', () => {
    it('should parse comma-separated days correctly', () => {
      const team: Team = {
        id: 1,
        name: 'Team',
        scheduleTime: '09:00',
        excludedDays: '0,1,2',
        channelId: 'C111',
      } as Team;

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 9 * * 3,4,5,6', // Wednesday-Saturday
        expect.any(Function)
      );
    });

    it('should handle days with spaces', () => {
      const team: Team = {
        id: 1,
        name: 'Team',
        scheduleTime: '09:00',
        excludedDays: '0, 5, 6',
        channelId: 'C111',
      } as Team;

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 9 * * 1,2,3,4', // Monday-Thursday
        expect.any(Function)
      );
    });

    it('should ignore invalid day numbers', () => {
      const team: Team = {
        id: 1,
        name: 'Team',
        scheduleTime: '09:00',
        excludedDays: '0,7,8,invalid', // 7, 8, and 'invalid' are out of range
        channelId: 'C111',
      } as Team;

      schedulerService.scheduleTeam(team);

      expect(cron.schedule).toHaveBeenCalledWith(
        '0 9 * * 1,2,3,4,5,6', // Monday-Saturday (only 0 was excluded)
        expect.any(Function)
      );
    });
  });
});
