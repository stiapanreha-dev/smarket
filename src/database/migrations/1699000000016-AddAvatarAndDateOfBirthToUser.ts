import { MigrationInterface, QueryRunner, TableColumn } from 'typeorm';

export class AddAvatarAndDateOfBirthToUser1699000000016 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add avatar_url column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'avatar_url',
        type: 'varchar',
        length: '500',
        isNullable: true,
        comment: 'URL to user avatar/profile picture',
      }),
    );

    // Add date_of_birth column to users table
    await queryRunner.addColumn(
      'users',
      new TableColumn({
        name: 'date_of_birth',
        type: 'date',
        isNullable: true,
        comment: 'User date of birth',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove avatar_url column
    await queryRunner.dropColumn('users', 'avatar_url');

    // Remove date_of_birth column
    await queryRunner.dropColumn('users', 'date_of_birth');
  }
}
