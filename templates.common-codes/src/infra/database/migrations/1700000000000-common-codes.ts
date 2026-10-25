import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommonCodes1700000000000 implements MigrationInterface {
  name = 'CommonCodes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "common_code_groups" ("id" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3670b2fd74ac2298774e8e25c44" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "common_codes" ("groupId" character varying(50) NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "sortOrder" integer NOT NULL DEFAULT '0', "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_f8801cea5104f8c2afec438be5d" PRIMARY KEY ("groupId", "code"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "common_codes" ADD CONSTRAINT "FK_d28d8b3d1f131674bace8452d17" FOREIGN KEY ("groupId") REFERENCES "common_code_groups"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    // 그룹은 migration으로 넣어요(common-code-groups.constants.ts와 같은 ID). EXAMPLE_TYPE은 예시예요.
    await queryRunner.query(
      `INSERT INTO "common_code_groups" ("id", "name") VALUES ('EXAMPLE_TYPE', '예시 유형')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "common_codes" DROP CONSTRAINT "FK_d28d8b3d1f131674bace8452d17"`,
    );
    await queryRunner.query(`DROP TABLE "common_codes"`);
    await queryRunner.query(`DROP TABLE "common_code_groups"`);
  }
}
