/*
  Warnings:

  - You are about to drop the column `interests` on the `WaitlistEntry` table. All the data in the column will be lost.
  - You are about to drop the column `province` on the `WaitlistEntry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WaitlistEntry" DROP COLUMN "interests",
DROP COLUMN "province";
