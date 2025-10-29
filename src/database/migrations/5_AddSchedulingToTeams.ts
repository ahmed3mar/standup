import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddSchedulingToTeams1700000005 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      'teams',
      new TableColumn({
        name: 'schedule_time',
        type: 'varchar',
        length: '5',
        isNullable: true,
        comment: 'Time to send standup in HH:MM format (e.g., 09:00)',
      })
    );

    await queryRunner.addColumn(
      'teams',
      new TableColumn({
        name: 'excluded_days',
        type: 'varchar',
        isNullable: true,
        default: "'0,5'",
        comment: 'Comma-separated day numbers to exclude (0=Sunday, 5=Friday)',
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn('teams', 'excluded_days');
    await queryRunner.dropColumn('teams', 'schedule_time');
  }
}
