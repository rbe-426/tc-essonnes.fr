import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddDisplayFieldsToPhotos1700000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "photos",
      new TableColumn({
        name: "displayTitle",
        type: "varchar",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "photos",
      new TableColumn({
        name: "displayDesc",
        type: "text",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("photos", "displayTitle");
    await queryRunner.dropColumn("photos", "displayDesc");
  }
}
