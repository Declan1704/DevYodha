/*
  Warnings:

  - A unique constraint covering the columns `[osm_id]` on the table `Hospital` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Hospital" ADD COLUMN     "osm_id" TEXT;

-- AlterTable
ALTER TABLE "Request" ADD COLUMN     "assignedHospitalId" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_osm_id_key" ON "Hospital"("osm_id");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_assignedHospitalId_fkey" FOREIGN KEY ("assignedHospitalId") REFERENCES "Hospital"("id") ON DELETE SET NULL ON UPDATE CASCADE;
