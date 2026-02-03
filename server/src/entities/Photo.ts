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

  @Column()
  src: string; // Chemin complet: /photos/folder/filename.jpg

  @Column()
  slug: string; // Folder name (ratp, rer, etc.)

  @Column({ nullable: true })
  brand: string; // Marque du bus

  @Column({ nullable: true })
  model: string; // Modèle du bus

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
