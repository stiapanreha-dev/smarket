import { MigrationInterface, QueryRunner } from "typeorm";

export class AddShareTokenToWishlist1763325111161 implements MigrationInterface {
    name = 'AddShareTokenToWishlist1763325111161'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wishlists" ADD "share_token" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "wishlists" ADD CONSTRAINT "UQ_5ab1233df810af094b875b7e796" UNIQUE ("share_token")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "wishlists" DROP CONSTRAINT "UQ_5ab1233df810af094b875b7e796"`);
        await queryRunner.query(`ALTER TABLE "wishlists" DROP COLUMN "share_token"`);
    }

}
