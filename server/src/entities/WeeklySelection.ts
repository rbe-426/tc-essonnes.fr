import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm";

@Entity("weekly_selections")
export class WeeklySelection {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "timestamptz", unique: true })
  weekStart: Date;

  @Column()
  photoId: string;

  @Column()
  slug: string;

  @CreateDateColumn()
  createdAt: Date;
}
