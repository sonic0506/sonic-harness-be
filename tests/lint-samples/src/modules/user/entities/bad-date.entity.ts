// expect: sonic-be/timestamptz-only
import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

@Entity('bad_dates')
export class BadDate {
  @PrimaryColumn()
  id!: number;

  @Column()
  bornAt!: Date;

  @Column({ type: 'timestamp' })
  loggedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
