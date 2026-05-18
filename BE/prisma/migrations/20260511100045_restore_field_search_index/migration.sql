CREATE INDEX idx_field_search_vector
	ON "Field" USING GIN (search_vector);