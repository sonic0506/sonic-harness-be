import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: 'date', nullable: true })
  birthDate!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
