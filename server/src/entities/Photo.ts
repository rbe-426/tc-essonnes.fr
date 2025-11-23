import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Network } from "./Network";

@Entity("photos")
export class Photo {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string; // Titre original (pour détecter les doublons)

  @Column({ nullable: true })
  displayTitle: string; // Titre affichable (modifiable)

  @Column()
  img: string;

  @Column({ nullable: true })
  date: string;

  @Column({ nullable: true, type: "text" })
  desc: string; // Description originale

  @Column({ nullable: true, type: "text" })
  displayDesc: string; // Description affichable (modifiable)

  @Column({ type: "integer", default: 0 })
  order: number;

  @ManyToOne(() => Network, (network) => network.photos, { onDelete: "CASCADE" })
  @JoinColumn({ name: "networkId" })
  network: Network;

  @Column()
  networkId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
