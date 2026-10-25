import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

import { CommonCodeGroup } from './common-code-group.entity.js';

// (groupId, code)가 기본 키라 그룹 안에서 코드 값이 겹칠 수 없어요.
// code는 바꾸지 않고, 쓰지 않게 되면 지우지 않고 isActive를 꺼요.
@Entity('common_codes')
export class CommonCode {
  @PrimaryColumn({ length: 50 })
  groupId: string;

  @PrimaryColumn({ length: 50 })
  code: string;

  @Column({ length: 100 })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 0 })
  sortOrder: number;

  @ManyToOne(() => CommonCodeGroup, { onDelete: 'RESTRICT' })
  // name은 적지 않아요. naming strategy가 group_id로 정해 groupId 컬럼과 합쳐요.
  @JoinColumn()
  group: CommonCodeGroup;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
