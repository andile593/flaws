/*
  Warnings:

  - You are about to drop the column `paystackReference` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentReference]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Order_paystackReference_key";

-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paystackReference",
ADD COLUMN     "paymentReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paymentReference_key" ON "Order"("paymentReference");
