-- 1) Add column
ALTER TABLE "Field" ADD COLUMN "search_vector" tsvector;

-- 2) Backfill existing rows
UPDATE "Field" SET search_vector =
	to_tsvector('simple',
		coalesce(name, '') || ' ' ||
		coalesce(location, '') || ' ' ||
		coalesce(description, '')
	);

-- 3) GIN index
CREATE INDEX idx_field_search_vector
	ON "Field" USING GIN (search_vector);

-- 4) Trigger function
CREATE OR REPLACE FUNCTION field_search_vector_update() RETURNS trigger AS $$
BEGIN
	NEW.search_vector := to_tsvector('simple',
		coalesce(NEW.name, '') || ' ' ||
		coalesce(NEW.location, '') || ' ' ||
		coalesce(NEW.description, '')
	);
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5) Trigger
CREATE TRIGGER trg_field_search_vector
	BEFORE INSERT OR UPDATE ON "Field"
	FOR EACH ROW EXECUTE FUNCTION field_search_vector_update();
