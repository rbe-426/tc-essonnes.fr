import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddPhotoFields1707000000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "photos",
      new TableColumn({
        name: "src",
        type: "varchar",
        isNullable: false,
        default: "''"
      })
    );

    await queryRunner.addColumn(
      "photos",
      new TableColumn({
        name: "slug",
        type: "varchar",
        isNullable: false,
        default: "''"
      })
    );

    await queryRunner.addColumn(
      "photos",
      new TableColumn({
        name: "brand",
        type: "varchar",
        isNullable: true
      })
    );

    await queryRunner.addColumn(
      "photos",
      new TableColumn({
        name: "model",
        type: "varchar",
        isNullable: true
      })
    );

    // Index pour requêtes rapides par slug
    await queryRunner.createIndex(
      "photos",
      new TableIndex({
        name: "IDX_photos_slug",
        columnNames: ["slug"]
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex("photos", "IDX_photos_slug");
    await queryRunner.dropColumn("photos", "model");
    await queryRunner.dropColumn("photos", "brand");
    await queryRunner.dropColumn("photos", "slug");
    await queryRunner.dropColumn("photos", "src");
  }
}
