#!/usr/bin/env node

import 'reflect-metadata';
import * as dotenv from 'dotenv';
import { MigrateCommand } from './commands/db/MigrateCommand';
import { SeedCommand } from './commands/db/SeedCommand';
import { SendCommand } from './commands/standup/SendCommand';
import { SchedulerCommand } from './commands/standup/SchedulerCommand';
import {
  CreateCommand,
  ListCommand,
  UpdateCommand,
  DeleteCommand,
  AddUserCommand,
  RemoveUserCommand,
} from './commands/team';

dotenv.config();

/**
 * Main CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 1) {
    printUsage();
    process.exit(1);
  }

  const command = args[0];
  const subCommand = args[1];

  try {
    switch (command) {
      case 'db:migrate':
        await new MigrateCommand().execute();
        break;

      case 'db:seed':
        await new SeedCommand().execute();
        break;

      case 'standup:send':
        const teamId = args[1] ? parseInt(args[1], 10) : undefined;
        await new SendCommand().execute(teamId);
        break;

      case 'standup:scheduler':
        await new SchedulerCommand().execute();
        break;

      case 'team:create':
        if (!args[1] || !args[2]) {
          console.error('Usage: team:create <name> <channel_id> [description]');
          process.exit(1);
        }
        await new CreateCommand().execute(args[1], args[2], args[3]);
        break;

      case 'team:list':
        await new ListCommand().execute();
        break;

      case 'team:update':
        if (!args[1]) {
          console.error('Usage: team:update <team_id> [--name=<name>] [--channel=<id>] [--description=<desc>] [--schedule=<HH:MM>] [--excluded-days=<0,5>]');
          process.exit(1);
        }
        const updateTeamId = parseInt(args[1], 10);
        const updateOptions = parseUpdateOptions(args.slice(2));
        await new UpdateCommand().execute(updateTeamId, updateOptions);
        break;

      case 'team:delete':
        if (!args[1]) {
          console.error('Usage: team:delete <team_id>');
          process.exit(1);
        }
        await new DeleteCommand().execute(parseInt(args[1], 10));
        break;

      case 'team:add-user':
        if (!args[1] || !args[2]) {
          console.error('Usage: team:add-user <team_id> <user_name> [--create]');
          process.exit(1);
        }
        const createUser = args.includes('--create');
        await new AddUserCommand().execute(parseInt(args[1], 10), args[2], createUser);
        break;

      case 'team:remove-user':
        if (!args[1] || !args[2]) {
          console.error('Usage: team:remove-user <team_id> <user_id>');
          process.exit(1);
        }
        await new RemoveUserCommand().execute(parseInt(args[1], 10), parseInt(args[2], 10));
        break;

      case 'help':
      case '--help':
      case '-h':
        printUsage();
        break;

      default:
        console.error(`Unknown command: ${command}\n`);
        printUsage();
        process.exit(1);
    }
  } catch (error) {
    console.error('\n✗ Command failed:', error);
    process.exit(1);
  }
}

/**
 * Parse update options from command line arguments
 */
function parseUpdateOptions(args: string[]): {
  name?: string;
  channelId?: string;
  description?: string;
  scheduleTime?: string;
  excludedDays?: string;
} {
  const options: any = {};

  for (const arg of args) {
    if (arg.startsWith('--name=')) {
      options.name = arg.substring(7);
    } else if (arg.startsWith('--channel=')) {
      options.channelId = arg.substring(10);
    } else if (arg.startsWith('--description=')) {
      options.description = arg.substring(14);
    } else if (arg.startsWith('--schedule=')) {
      options.scheduleTime = arg.substring(11);
    } else if (arg.startsWith('--excluded-days=')) {
      options.excludedDays = arg.substring(16);
    }
  }

  return options;
}

/**
 * Print usage information
 */
function printUsage() {
  console.log('Standup Service - Multi-Team CLI\n');
  console.log('Usage:');
  console.log('  standup <command> [options]\n');
  console.log('Database Commands:');
  console.log('  db:migrate                          Run database migrations');
  console.log('  db:seed                             Seed database with sample data\n');
  console.log('Standup Commands:');
  console.log('  standup:send [team_id]              Send standup to all teams or specific team');
  console.log('  standup:scheduler                   Start automated cron scheduler for daily standups\n');
  console.log('Team Management Commands:');
  console.log('  team:create <name> <channel_id> [desc]  Create a new team');
  console.log('  team:list                               List all teams');
  console.log('  team:update <id> [options]              Update team details');
  console.log('    Options: --name=<name> --channel=<id> --description=<desc>');
  console.log('             --schedule=<HH:MM> --excluded-days=<0,5>');
  console.log('  team:delete <id>                        Delete a team');
  console.log('  team:add-user <team_id> <user_name> [--create]  Add user to team');
  console.log('  team:remove-user <team_id> <user_id>    Remove user from team\n');
  console.log('Other Commands:');
  console.log('  help                                Show this help message\n');
  console.log('Environment Variables:');
  console.log('  DB_TYPE           Database type: sqlite | postgres (default: sqlite)');
  console.log('  DATABASE_PATH     SQLite database path (default: ./db.sqlite)');
  console.log('  DB_HOST           PostgreSQL host (default: localhost)');
  console.log('  DB_PORT           PostgreSQL port (default: 5432)');
  console.log('  DB_USERNAME       PostgreSQL username');
  console.log('  DB_PASSWORD       PostgreSQL password');
  console.log('  DB_DATABASE       PostgreSQL database name');
  console.log('  SLACK_TOKEN       Slack API token (required)');
  console.log('  SLACK_COOKIE      Slack \'d\' cookie (optional)');
  console.log('  SLACK_TIMEOUT     HTTP timeout in seconds (default: 30)\n');
  console.log('Examples:');
  console.log('  npm run db:migrate');
  console.log('  npm run db:seed');
  console.log('  npm run team:create "Engineering" "C1234567890" "Core team"');
  console.log('  npm run team:list');
  console.log('  npm run team:add-user 1 "John Doe" --create');
  console.log('  npm run standup:send');
  console.log('  npm run standup:send 1');
  console.log('  npm run standup:scheduler\n');
}

// Run the CLI
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
