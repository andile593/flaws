/*
  Warnings:

  - You are about to drop the column `paymentRef` on the `Order` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paystackReference]` on the table `Order` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "paymentRef",
ADD COLUMN     "paystackReference" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Order_paystackReference_key" ON "Order"("paystackReference");
