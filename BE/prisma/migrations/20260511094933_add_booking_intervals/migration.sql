/*
  Warnings:

  - Added the required column `date` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `end_time` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `field_id` to the `Booking` table without a default value. This is not possible if the table is not empty.
  - Added the required column `start_time` to the `Booking` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Booking" DROP CONSTRAINT "Booking_slot_id_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "date" DATE NOT NULL,
ADD COLUMN     "end_time" TIME NOT NULL,
ADD COLUMN     "field_id" UUID NOT NULL,
ADD COLUMN     "start_time" TIME NOT NULL,
ALTER COLUMN "slot_id" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Booking_field_id_date_idx" ON "Booking"("field_id", "date");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_field_id_fkey" FOREIGN KEY ("field_id") REFERENCES "Field"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_slot_id_fkey" FOREIGN KEY ("slot_id") REFERENCES "FieldSlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;
