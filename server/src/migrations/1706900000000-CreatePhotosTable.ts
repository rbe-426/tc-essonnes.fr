import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreatePhotosTable1706900000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Créer la table networks si elle n'existe pas
    const networksTable = await queryRunner.hasTable("networks");
    if (!networksTable) {
      await queryRunner.createTable(
        new Table({
          name: "networks",
          columns: [
            {
              name: "id",
              type: "uuid",
              isPrimary: true,
              default: "uuid_generate_v4()",
            },
            {
              name: "name",
              type: "varchar",
              isNullable: false,
            },
            {
              name: "slug",
              type: "varchar",
              isUnique: true,
              isNullable: false,
            },
            {
              name: "href",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "createdAt",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
            },
            {
              name: "updatedAt",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
              onUpdate: "CURRENT_TIMESTAMP",
            },
          ],
        })
      );
    }

    // Créer la table photos si elle n'existe pas
    const photosTable = await queryRunner.hasTable("photos");
    if (!photosTable) {
      await queryRunner.createTable(
        new Table({
          name: "photos",
          columns: [
            {
              name: "id",
              type: "uuid",
              isPrimary: true,
              default: "uuid_generate_v4()",
            },
            {
              name: "title",
              type: "varchar",
              isNullable: false,
            },
            {
              name: "displayTitle",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "img",
              type: "varchar",
              isNullable: false,
            },
            {
              name: "src",
              type: "varchar",
              isNullable: false,
              default: "''",
            },
            {
              name: "slug",
              type: "varchar",
              isNullable: false,
              default: "''",
            },
            {
              name: "brand",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "model",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "date",
              type: "varchar",
              isNullable: true,
            },
            {
              name: "desc",
              type: "text",
              isNullable: true,
            },
            {
              name: "displayDesc",
              type: "text",
              isNullable: true,
            },
            {
              name: "order",
              type: "integer",
              default: 0,
              isNullable: false,
            },
            {
              name: "networkId",
              type: "uuid",
              isNullable: false,
            },
            {
              name: "createdAt",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
            },
            {
              name: "updatedAt",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
              onUpdate: "CURRENT_TIMESTAMP",
            },
          ],
          foreignKeys: [
            {
              columnNames: ["networkId"],
              referencedTableName: "networks",
              referencedColumnNames: ["id"],
              onDelete: "CASCADE",
            },
          ],
          indices: [
            {
              columnNames: ["slug"],
              name: "IDX_photos_slug",
            },
          ],
        })
      );
    }

    // Créer la table users si elle n'existe pas
    const usersTable = await queryRunner.hasTable("users");
    if (!usersTable) {
      await queryRunner.createTable(
        new Table({
          name: "users",
          columns: [
            {
              name: "id",
              type: "uuid",
              isPrimary: true,
              default: "uuid_generate_v4()",
            },
            {
              name: "username",
              type: "varchar",
              isUnique: true,
              isNullable: false,
            },
            {
              name: "password",
              type: "varchar",
              isNullable: false,
            },
            {
              name: "createdAt",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
            },
          ],
        })
      );
    }

    // Créer la table auditlogs si elle n'existe pas
    const auditLogsTable = await queryRunner.hasTable("audit_logs");
    if (!auditLogsTable) {
      await queryRunner.createTable(
        new Table({
          name: "audit_logs",
          columns: [
            {
              name: "id",
              type: "uuid",
              isPrimary: true,
              default: "uuid_generate_v4()",
            },
            {
              name: "action",
              type: "varchar",
              isNullable: false,
            },
            {
              name: "details",
              type: "text",
              isNullable: true,
            },
            {
              name: "userId",
              type: "uuid",
              isNullable: true,
            },
            {
              name: "createdAt",
              type: "timestamp",
              default: "CURRENT_TIMESTAMP",
            },
          ],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("audit_logs", true);
    await queryRunner.dropTable("photos", true);
    await queryRunner.dropTable("networks", true);
    await queryRunner.dropTable("users", true);
  }
}
