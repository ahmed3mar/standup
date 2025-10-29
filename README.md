# Standup Service - TypeScript Version

A TypeScript implementation of the automated standup messaging service for Slack. This service helps teams automate their daily standup meeting notifications by sending formatted standup messages to Slack channels.

## Features

- Automated standup message posting to Slack channels
- Prevents duplicate standup messages on the same day
- SQLite database for tracking standup history
- Configurable team names and leaders
- SOLID principles implementation
- Dependency injection architecture
- Type-safe TypeScript codebase

## Architecture

This application follows SOLID principles:

- **Single Responsibility Principle (SRP)**: Each class has one responsibility
- **Open/Closed Principle (OCP)**: Extensible through interfaces
- **Liskov Substitution Principle (LSP)**: Interfaces can be swapped
- **Interface Segregation Principle (ISP)**: Small, focused interfaces
- **Dependency Inversion Principle (DIP)**: Depends on abstractions

## Project Structure

```
ts/
├── src/
│   ├── index.ts          # Main entry point and CLI
│   ├── standup.ts        # StandupService - orchestrates workflow
│   ├── database.ts       # Database repository implementation
│   ├── slack.ts          # Slack API client implementation
│   ├── formatter.ts      # Message formatting
│   ├── config.ts         # Configuration management
│   ├── interfaces.ts     # Interface definitions
│   ├── constants.ts      # Constants and enums
│   └── errors.ts         # Custom error classes
├── package.json
├── tsconfig.json
└── .env.example
```

## Prerequisites

- Node.js 18+ (for native fetch API support)
- npm or pnpm

## Installation

1. Clone the repository
2. Navigate to the TypeScript directory:
   ```bash
   cd ts
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

5. Edit `.env` with your Slack credentials:
   ```bash
   SLACK_TOKEN=xoxb-your-token-here
   SLACK_CHANNEL_ID=C1234567890
   TEAM_NAME=Your Team Name
   ```

## Configuration

The application requires the following environment variables:

### Required
- `SLACK_TOKEN`: Your Slack bot token (starts with `xoxb-`)
- `SLACK_CHANNEL_ID`: The Slack channel ID where standups will be posted

### Optional
- `TEAM_NAME`: Name of your team (default: "Team")
- `SLACK_COOKIE`: Slack 'd' cookie for additional authentication (optional)
- `SLACK_TIMEOUT`: HTTP request timeout in seconds (default: 30)
- `DATABASE_PATH`: Path to SQLite database file (default: ./db.sqlite)

## Usage

### Build the project

```bash
pnpm run build
```

### Initialize the database (first time setup)

```bash
pnpm run migrate
```

This command will create the SQLite database and set up the required schema. The database is created automatically when sending standups, but you can run this command explicitly to set up the database before the first use.

### Send a standup message

```bash
pnpm run send
```

Or use the compiled JavaScript:

```bash
node dist/index.js send
```

### Development mode

```bash
pnpm run dev send
```

Or run migrations in dev mode:

```bash
pnpm run dev migrate
```

### Help

```bash
node dist/index.js help
```

## Commands

- `send` - Send daily standup message to the configured channel
- `migrate` - Initialize or update the database schema
- `help` - Show help message

## How It Works

### Migration Command
1. **Configuration Loading**: Loads database path from `.env` file or environment variables
2. **Schema Creation**: Creates the `standups` table with appropriate indexes
3. **Verification**: Confirms successful database initialization

### Send Command
1. **Configuration Loading**: Loads settings from `.env` file or environment variables
2. **Validation**: Validates required configuration parameters
3. **Database Setup**: Automatically creates schema if not exists
4. **Duplicate Check**: Checks if a standup was already sent today
5. **Message Formatting**: Creates a formatted standup message
6. **Slack API Call**: Posts the message to the configured Slack channel
7. **Database Recording**: Saves the standup record to SQLite database

## Error Handling

The application includes custom error types:

- `ValidationError`: Configuration validation failures
- `StandupAlreadyExistsError`: Duplicate standup prevention
- `DatabaseError`: Database operation errors
- `SlackAPIError`: Slack API communication errors

## Development

### Clean build artifacts

```bash
pnpm run clean
```

### Rebuild

```bash
pnpm run clean && pnpm run build
```

## Standup Message Format

The service sends a formatted message that includes:

- Team name and date
- Meeting leader designation
- Sections for Done, Todo, and Blockers
- Example format with ticket references
- Reminder to reply in thread with due dates

## Database Schema

The service uses SQLite with the following schema:

```sql
CREATE TABLE standups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  channel_id TEXT NOT NULL,
  slack_thread_ts TEXT,
  standup_date TEXT NOT NULL,
  status TEXT,
  leader_name TEXT,
  sent_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  deleted_at TEXT
);
```

## Automation

You can automate the standup service using cron jobs:

```bash
# Add to crontab (runs Monday-Friday at 9 AM)
0 9 * * 1-5 cd /path/to/standup/ts && pnpm run send
```

## License

ISC

## Contributing

1. Follow the existing code structure
2. Maintain SOLID principles
3. Add appropriate error handling
4. Update documentation as needed
