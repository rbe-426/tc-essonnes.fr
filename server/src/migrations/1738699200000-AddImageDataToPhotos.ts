import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddImageDataToPhotos1738699200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "photos",
      new TableColumn({
        name: "imageData",
        type: "text",
        isNullable: true,
        comment: "Image compressée en base64 stockée directement en DB",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("photos", "imageData");
  }
}
