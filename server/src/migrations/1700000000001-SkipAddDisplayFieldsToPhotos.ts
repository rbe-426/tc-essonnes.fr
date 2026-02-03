import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Migration vide pour marquer AddDisplayFieldsToPhotos1700000000000 comme exécutée
 * Cette migration ancienne est redondante avec CreatePhotosTable
 */
export class SkipAddDisplayFieldsToPhotos1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Rien à faire - AddDisplayFieldsToPhotos était juste un skip
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rien à faire
  }
}
