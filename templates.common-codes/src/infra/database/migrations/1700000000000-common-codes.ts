import { MigrationInterface, QueryRunner } from 'typeorm';

export class CommonCodes1700000000000 implements MigrationInterface {
  name = 'CommonCodes1700000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "common_code_groups" ("id" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_3670b2fd74ac2298774e8e25c44" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "common_codes" ("group_id" character varying(50) NOT NULL, "code" character varying(50) NOT NULL, "name" character varying(100) NOT NULL, "is_active" boolean NOT NULL DEFAULT true, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_772461865e36f37c799e6c9c247" PRIMARY KEY ("group_id", "code"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "common_codes" ADD CONSTRAINT "FK_f6410a972222b2c90107244a6ef" FOREIGN KEY ("group_id") REFERENCES "common_code_groups"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    // 그룹은 migration으로 넣어요(common-code-groups.constants.ts와 같은 ID). EXAMPLE_TYPE은 예시예요.
    await queryRunner.query(
      `INSERT INTO "common_code_groups" ("id", "name") VALUES ('EXAMPLE_TYPE', '예시 유형')`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "common_codes" DROP CONSTRAINT "FK_f6410a972222b2c90107244a6ef"`,
    );
    await queryRunner.query(`DROP TABLE "common_codes"`);
    await queryRunner.query(`DROP TABLE "common_code_groups"`);
  }
}
