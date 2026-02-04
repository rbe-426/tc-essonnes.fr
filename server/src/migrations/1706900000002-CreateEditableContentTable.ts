import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateEditableContentTable1706900000002 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "editable_content",
                columns: [
                    {
                        name: "id",
                        type: "varchar",
                        length: "100",
                        isPrimary: true,
                    },
                    {
                        name: "content",
                        type: "text",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "CURRENT_TIMESTAMP",
                        onUpdate: "CURRENT_TIMESTAMP",
                    },
                ],
            }),
            true
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("editable_content", true);
    }

}
