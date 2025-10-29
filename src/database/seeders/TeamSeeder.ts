import { DataSource } from 'typeorm';
import { Seeder } from './Seeder';
import { Team, User } from '../../models';

export class TeamSeeder implements Seeder {
  async run(dataSource: DataSource): Promise<void> {
    const teamRepository = dataSource.getRepository(Team);
    const userRepository = dataSource.getRepository(User);

    console.log('Seeding teams and users...');

    // Create admin user
    const admin = userRepository.create({
      name: 'Admin User',
      email: 'admin@example.com',
      isAdmin: true,
    });
    await userRepository.save(admin);
    console.log(`  ✓ Created admin user: ${admin.email}`);

    // Create sample users
    const user1 = userRepository.create({
      name: 'John Doe',
      email: 'john@example.com',
      slackUserId: 'U1234ABCD',
    });
    await userRepository.save(user1);

    const user2 = userRepository.create({
      name: 'Jane Smith',
      email: 'jane@example.com',
      slackUserId: 'U5678EFGH',
    });
    await userRepository.save(user2);

    const user3 = userRepository.create({
      name: 'Bob Johnson',
      email: 'bob@example.com',
      slackUserId: 'U9012IJKL',
    });
    await userRepository.save(user3);

    console.log(`  ✓ Created ${3} sample users`);

    // Create sample teams
    const team1 = teamRepository.create({
      name: 'Engineering Team',
      description: 'Core engineering team',
      channelId: process.env.SLACK_CHANNEL_ID || 'C1234567890',
      scheduleTime: '09:00',
      excludedDays: '0,5', // Sunday and Friday
      owner: admin,
      users: [user1, user2, user3],
    });
    await teamRepository.save(team1);
    console.log(`  ✓ Created team: ${team1.name} with ${team1.users.length} members`);

    const team2 = teamRepository.create({
      name: 'Product Team',
      description: 'Product management team',
      channelId: 'C0987654321',
      scheduleTime: '10:00',
      excludedDays: '0,6', // Sunday and Saturday
      owner: admin,
      users: [user2, user3],
    });
    await teamRepository.save(team2);
    console.log(`  ✓ Created team: ${team2.name} with ${team2.users.length} members`);

    console.log('✓ Seeding completed successfully');
  }
}
