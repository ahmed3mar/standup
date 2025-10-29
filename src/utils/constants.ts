/**
 * Standup status constants
 */
export const StandupStatus = {
  PENDING: 'pending',
  WAITING_FOR_REPLIES: 'waiting_for_replies',
  COMPLETED: 'completed',
} as const;

export type StandupStatusType = typeof StandupStatus[keyof typeof StandupStatus];

/**
 * Default configuration values
 */
export const DEFAULT_SLACK_TIMEOUT = 30;
export const DEFAULT_DATABASE_PATH = './db.sqlite';
export const DEFAULT_TEAM_NAME = 'Team';

/**
 * Slack API endpoints
 */
export const SLACK_API_POST_MESSAGE = 'https://slack.com/api/chat.postMessage';

/**
 * Environment variable keys
 */
export const ENV_SLACK_TOKEN = 'SLACK_TOKEN';
export const ENV_SLACK_COOKIE = 'SLACK_COOKIE';
export const ENV_SLACK_TIMEOUT = 'SLACK_TIMEOUT';
export const ENV_DATABASE_PATH = 'DATABASE_PATH';
export const ENV_CHANNEL_ID = 'SLACK_CHANNEL_ID';
export const ENV_TEAM_NAME = 'TEAM_NAME';

/**
 * Cookie names
 */
export const SLACK_COOKIE_NAME = 'd';
