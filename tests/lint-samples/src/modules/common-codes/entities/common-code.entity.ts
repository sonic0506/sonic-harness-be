import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('common_codes')
export class CommonCode {
  @PrimaryColumn()
  groupId!: string;

  @PrimaryColumn()
  code!: string;

  @Column()
  name!: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 0 })
  sortOrder!: number;
}
