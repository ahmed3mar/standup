import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Team } from './Team';
import { User } from './User';

@Entity('standups')
@Index(['teamId', 'standupDate'])
export class Standup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'team_id' })
  teamId: number;

  @Column({ name: 'channel_id' })
  channelId: string;

  @Column({ name: 'slack_thread_ts', nullable: true })
  slackThreadTs?: string;

  @Column({ name: 'standup_date', type: 'date' })
  standupDate: Date;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'leader_user_id', nullable: true })
  leaderUserId?: number;

  @Column({ name: 'sent_at', type: 'datetime', nullable: true })
  sentAt?: Date;

  @CreateDateColumn({ name: 'created_at', type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime' })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => Team, (team) => team.standups)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @ManyToOne(() => User, (user) => user.ledStandups)
  @JoinColumn({ name: 'leader_user_id' })
  leader?: User;
}
