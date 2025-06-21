-- CreateEnum
CREATE TYPE "OrderItemReturnStatus" AS ENUM ('NONE', 'REQUESTED', 'APPROVED', 'REJECTED', 'RECEIVED', 'REFUNDED');

-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "returnStatus" "OrderItemReturnStatus" NOT NULL DEFAULT 'NONE';
