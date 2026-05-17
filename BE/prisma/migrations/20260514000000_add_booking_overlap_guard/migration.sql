CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
ADD CONSTRAINT "Booking_no_active_overlap"
EXCLUDE USING gist (
  "field_id" WITH =,
  "date" WITH =,
  tsrange("date" + "start_time", "date" + "end_time", '[)') WITH &&
)
WHERE ("status" IN ('PENDING', 'CONFIRMED'));
