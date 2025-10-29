import { SlackAPIError } from '../utils/errors';
import { SLACK_API_POST_MESSAGE, SLACK_COOKIE_NAME } from '../utils/constants';

/**
 * PostMessageRequest represents the request body for posting a message
 */
interface PostMessageRequest {
  channel: string;
  text: string;
}

/**
 * PostMessageResponse represents the response from Slack
 */
interface PostMessageResponse {
  ok: boolean;
  ts?: string;
  channel?: string;
  error?: string;
}

/**
 * SlackService handles Slack API interactions
 */
export class SlackService {
  private token: string;
  private cookie?: string;
  private timeoutMs: number;

  constructor(token: string, cookie?: string, timeoutSeconds: number = 30) {
    this.token = token;
    this.cookie = cookie;
    this.timeoutMs = timeoutSeconds * 1000;
  }

  /**
   * SendMessage sends a message to a Slack channel
   */
  async sendMessage(channelId: string, text: string): Promise<string> {
    const jsonData = this.prepareRequestBody(channelId, text);
    const response = await this.executeRequest(jsonData);
    return response;
  }

  /**
   * prepareRequestBody prepares the JSON request body
   */
  private prepareRequestBody(channelId: string, text: string): PostMessageRequest {
    return {
      channel: channelId,
      text: text,
    };
  }

  /**
   * executeRequest executes the HTTP request and processes the response
   */
  private async executeRequest(reqBody: PostMessageRequest): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.token}`,
      };

      // Add cookie if provided
      if (this.cookie) {
        headers['Cookie'] = `${SLACK_COOKIE_NAME}=${this.cookie}`;
      }

      const response = await fetch(SLACK_API_POST_MESSAGE, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(reqBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as PostMessageResponse;

      if (!data.ok) {
        throw new SlackAPIError(data.error || 'unknown', 'failed to send message');
      }

      if (!data.ts) {
        throw new SlackAPIError('no_timestamp', 'response missing timestamp');
      }

      return data.ts;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error instanceof SlackAPIError) {
        throw error;
      }
      throw new Error(`failed to send request: ${error}`);
    }
  }
}
