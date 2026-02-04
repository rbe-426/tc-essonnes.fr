import { Entity, PrimaryColumn, Column, UpdateDateColumn } from "typeorm";

@Entity("editable_content")
export class EditableContent {
  @PrimaryColumn("varchar", { length: 100 })
  id: string;

  @Column("text")
  content: string;

  @UpdateDateColumn()
  updatedAt: Date;
}
