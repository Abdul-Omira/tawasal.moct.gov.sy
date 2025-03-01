-- Add indexes for better query performance on citizen_communications table

-- Index on status for filtering
CREATE INDEX IF NOT EXISTS idx_citizen_communications_status 
ON citizen_communications(status);

-- Index on createdAt for sorting (descending for newest first)
CREATE INDEX IF NOT EXISTS idx_citizen_communications_created_at 
ON citizen_communications("createdAt" DESC);

-- Index on communicationType for filtering
CREATE INDEX IF NOT EXISTS idx_citizen_communications_type 
ON citizen_communications("communicationType");

-- Composite index for common query pattern (status + createdAt)
CREATE INDEX IF NOT EXISTS idx_citizen_communications_status_created 
ON citizen_communications(status, "createdAt" DESC);

-- Index on phone for sorting (partial index for non-null values)
CREATE INDEX IF NOT EXISTS idx_citizen_communications_phone 
ON citizen_communications(phone) 
WHERE phone IS NOT NULL;

-- Index on attachmentUrl for quick filtering of records with attachments
CREATE INDEX IF NOT EXISTS idx_citizen_communications_attachment 
ON citizen_communications("attachmentUrl") 
WHERE "attachmentUrl" IS NOT NULL;