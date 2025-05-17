-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_ambulanceId_fkey" FOREIGN KEY ("ambulanceId") REFERENCES "Ambulance"("id") ON DELETE SET NULL ON UPDATE CASCADE;
