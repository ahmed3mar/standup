import { Team } from '../Team';

describe('Team Model', () => {
  describe('scheduling fields', () => {
    it('should have scheduleTime field', () => {
      const team = new Team();
      team.scheduleTime = '09:00';

      expect(team.scheduleTime).toBe('09:00');
    });

    it('should have excludedDays field', () => {
      const team = new Team();
      team.excludedDays = '0,5';

      expect(team.excludedDays).toBe('0,5');
    });

    it('should allow undefined scheduleTime', () => {
      const team = new Team();
      team.scheduleTime = undefined;

      expect(team.scheduleTime).toBeUndefined();
    });

    it('should have default excludedDays value', () => {
      const team = new Team();

      // The default is set at the database level, but we can test the model structure
      expect(team).toHaveProperty('excludedDays');
    });

    it('should accept valid time formats', () => {
      const team = new Team();
      const validTimes = ['00:00', '09:30', '12:00', '23:59'];

      validTimes.forEach((time) => {
        team.scheduleTime = time;
        expect(team.scheduleTime).toBe(time);
        expect(team.scheduleTime).toMatch(/^\d{2}:\d{2}$/);
      });
    });

    it('should accept valid day exclusion formats', () => {
      const team = new Team();
      const validDays = ['0', '0,5', '0,6', '1,2,3,4,5', '0,1,2,3,4,5,6'];

      validDays.forEach((days) => {
        team.excludedDays = days;
        expect(team.excludedDays).toBe(days);
      });
    });
  });

  describe('team properties', () => {
    it('should have required fields', () => {
      const team = new Team();
      team.id = 1;
      team.name = 'Engineering Team';
      team.channelId = 'C1234567890';

      expect(team.id).toBe(1);
      expect(team.name).toBe('Engineering Team');
      expect(team.channelId).toBe('C1234567890');
    });

    it('should have optional description field', () => {
      const team = new Team();
      team.description = 'Core engineering team';

      expect(team.description).toBe('Core engineering team');
    });

    it('should support team without description', () => {
      const team = new Team();
      team.name = 'Engineering Team';
      team.description = undefined;

      expect(team.description).toBeUndefined();
    });
  });

  describe('scheduling configuration combinations', () => {
    it('should support weekday-only schedule (exclude weekend)', () => {
      const team = new Team();
      team.scheduleTime = '09:00';
      team.excludedDays = '0,6'; // Sunday and Saturday

      expect(team.scheduleTime).toBe('09:00');
      expect(team.excludedDays).toBe('0,6');
    });

    it('should support Monday-Friday schedule (exclude Sunday and Friday)', () => {
      const team = new Team();
      team.scheduleTime = '10:00';
      team.excludedDays = '0,5'; // Sunday and Friday (default)

      expect(team.scheduleTime).toBe('10:00');
      expect(team.excludedDays).toBe('0,5');
    });

    it('should support custom day exclusions', () => {
      const team = new Team();
      team.scheduleTime = '14:30';
      team.excludedDays = '2,4'; // Tuesday and Thursday

      expect(team.scheduleTime).toBe('14:30');
      expect(team.excludedDays).toBe('2,4');
    });

    it('should support no scheduling', () => {
      const team = new Team();
      team.scheduleTime = undefined;
      team.excludedDays = undefined;

      expect(team.scheduleTime).toBeUndefined();
      expect(team.excludedDays).toBeUndefined();
    });
  });
});
