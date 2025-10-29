/**
 * ValidationError represents a configuration validation error
 */
export class ValidationError extends Error {
  constructor(public field: string, public message: string) {
    super(`validation error for field '${field}': ${message}`);
    this.name = 'ValidationError';
    Object.setPrototypeOf(this, ValidationError.prototype);
  }
}

/**
 * StandupAlreadyExistsError represents an error when standup was already sent
 */
export class StandupAlreadyExistsError extends Error {
  constructor(public channelId: string, public date: string) {
    super(`standup already sent for channel ${channelId} on ${date}`);
    this.name = 'StandupAlreadyExistsError';
    Object.setPrototypeOf(this, StandupAlreadyExistsError.prototype);
  }
}

/**
 * DatabaseError represents a database operation error
 */
export class DatabaseError extends Error {
  constructor(public operation: string, public originalError: Error) {
    super(`database error during ${operation}: ${originalError.message}`);
    this.name = 'DatabaseError';
    Object.setPrototypeOf(this, DatabaseError.prototype);
  }
}

/**
 * SlackAPIError represents a Slack API error
 */
export class SlackAPIError extends Error {
  constructor(public errorCode: string, public message: string) {
    super(`slack API error [${errorCode}]: ${message}`);
    this.name = 'SlackAPIError';
    Object.setPrototypeOf(this, SlackAPIError.prototype);
  }
}
