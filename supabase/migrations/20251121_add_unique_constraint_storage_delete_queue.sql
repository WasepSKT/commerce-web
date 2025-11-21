-- 20251121_add_unique_constraint_storage_delete_queue.sql
-- Add a unique constraint to prevent duplicate entries in storage_delete_queue
ALTER TABLE storage_delete_queue
ADD CONSTRAINT storage_delete_queue_path_unique UNIQUE (path);
