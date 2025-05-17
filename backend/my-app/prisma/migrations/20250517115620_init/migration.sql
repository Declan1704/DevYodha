/*
  Warnings:

  - The primary key for the `Ambulance` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `Ambulance` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `ambulanceId` column on the `Request` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- DropForeignKey
ALTER TABLE "Request" DROP CONSTRAINT "Request_ambulanceId_fkey";

-- AlterTable
ALTER TABLE "Ambulance" DROP CONSTRAINT "Ambulance_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ADD CONSTRAINT "Ambulance_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Request" DROP COLUMN "ambulanceId",
ADD COLUMN     "ambulanceId" INTEGER;

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "Ambulance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
