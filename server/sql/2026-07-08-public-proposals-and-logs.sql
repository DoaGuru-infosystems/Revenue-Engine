-- Add token columns and snapshot to proposals table
ALTER TABLE proposals
ADD COLUMN public_token_hash VARCHAR(64) DEFAULT NULL,
ADD COLUMN public_token_expires DATETIME DEFAULT NULL,
ADD COLUMN public_snapshot_json LONGTEXT DEFAULT NULL;

-- Create public access logs table
CREATE TABLE IF NOT EXISTS public_access_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    doc_type VARCHAR(50) NOT NULL,
    doc_id INT DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    status VARCHAR(20) NOT NULL COMMENT 'Success, 403, 404, etc.',
    accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
