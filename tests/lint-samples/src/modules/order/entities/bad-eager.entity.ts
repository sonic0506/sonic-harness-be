// expect: sonic-be/no-eager-lazy-relation
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

import { User } from '@/modules/user';

@Entity('bad_eager')
export class BadEager {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => User, { eager: true })
  user!: User;

  @ManyToOne(() => User)
  owner!: Promise<User>;
}
