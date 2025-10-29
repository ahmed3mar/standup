/**
 * Application configuration
 */

export interface AppConfig {
  slackToken: string;
  slackCookie?: string;
  slackTimeout: number;
  teamName?: string;
  channelId?: string;
}

export function getAppConfig(): AppConfig {
  return {
    slackToken: process.env.SLACK_TOKEN || '',
    slackCookie: process.env.SLACK_COOKIE,
    slackTimeout: parseInt(process.env.SLACK_TIMEOUT || '30', 10),
    teamName: process.env.TEAM_NAME,
    channelId: process.env.SLACK_CHANNEL_ID,
  };
}

export function validateAppConfig(): void {
  const config = getAppConfig();

  if (!config.slackToken) {
    throw new Error('SLACK_TOKEN is required');
  }
}
