import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from "typeorm";
import { Photo } from "./Photo";

@Entity("networks")
export class Network {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column()
  folder: string;

  @Column({ nullable: true })
  img: string;

  @Column({ nullable: true })
  href: string;

  @Column({ nullable: true, type: "integer" })
  logoHeight: number;

  @OneToMany(() => Photo, (photo) => photo.network, { cascade: true })
  photos: Photo[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
