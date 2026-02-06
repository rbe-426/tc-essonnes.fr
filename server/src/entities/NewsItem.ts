import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("news_items")
export class NewsItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column({ type: "text" })
  body: string;

  @Column({ nullable: true })
  linkUrl: string;

  @Column({ nullable: true })
  linkLabel: string;

  @Column({ type: "text", nullable: true })
  imageData: string;

  @Column({ nullable: true })
  imageMime: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
