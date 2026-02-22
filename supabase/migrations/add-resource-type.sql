-- Add resource_type column to resources table
-- Types: 'file', 'link', 'video', 'text'

ALTER TABLE resources ADD COLUMN IF NOT EXISTS resource_type TEXT DEFAULT 'file';

-- Update existing records based on their current data
UPDATE resources
SET resource_type = CASE
  WHEN file_name = 'external-link' THEN 'link'
  WHEN file_name = 'text-content' THEN 'text'
  WHEN category = 'videos' THEN 'video'
  ELSE 'file'
END
WHERE resource_type IS NULL OR resource_type = 'file';

-- Add comment for documentation
COMMENT ON COLUMN resources.resource_type IS 'Type of resource: file, link, video, or text';
