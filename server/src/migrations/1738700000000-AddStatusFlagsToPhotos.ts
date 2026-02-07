import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddStatusFlagsToPhotos1738700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns("photos", [
      new TableColumn({
        name: "isReformed",
        type: "boolean",
        isNullable: false,
        default: false,
      }),
      new TableColumn({
        name: "isPreserved",
        type: "boolean",
        isNullable: false,
        default: false,
      }),
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("photos", "isPreserved");
    await queryRunner.dropColumn("photos", "isReformed");
  }
}
