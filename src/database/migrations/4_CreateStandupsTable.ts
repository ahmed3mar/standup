import { MigrationInterface, QueryRunner, Table, TableForeignKey, TableIndex } from 'typeorm';

export class CreateStandupsTable1700000004 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'standups',
        columns: [
          {
            name: 'id',
            type: 'integer',
            isPrimary: true,
            isGenerated: true,
            generationStrategy: 'increment',
          },
          {
            name: 'team_id',
            type: 'integer',
          },
          {
            name: 'channel_id',
            type: 'varchar',
          },
          {
            name: 'slack_thread_ts',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'standup_date',
            type: 'date',
          },
          {
            name: 'status',
            type: 'varchar',
            default: "'pending'",
          },
          {
            name: 'leader_user_id',
            type: 'integer',
            isNullable: true,
          },
          {
            name: 'sent_at',
            type: 'timestamp',
            isNullable: true,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true
    );

    // Create foreign keys
    await queryRunner.createForeignKey(
      'standups',
      new TableForeignKey({
        columnNames: ['team_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'teams',
        onDelete: 'CASCADE',
      })
    );

    await queryRunner.createForeignKey(
      'standups',
      new TableForeignKey({
        columnNames: ['leader_user_id'],
        referencedColumnNames: ['id'],
        referencedTableName: 'users',
        onDelete: 'SET NULL',
      })
    );

    // Create indexes
    await queryRunner.createIndex(
      'standups',
      new TableIndex({
        name: 'IDX_STANDUPS_TEAM_DATE',
        columnNames: ['team_id', 'standup_date'],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('standups', 'IDX_STANDUPS_TEAM_DATE');
    const table = await queryRunner.getTable('standups');
    const foreignKeys = table?.foreignKeys || [];
    for (const foreignKey of foreignKeys) {
      await queryRunner.dropForeignKey('standups', foreignKey);
    }
    await queryRunner.dropTable('standups');
  }
}
