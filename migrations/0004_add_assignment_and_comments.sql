-- Add assignment and comments functionality
-- Migration: 0004_add_assignment_and_comments.sql

-- Add assignment fields to citizen_communications table
ALTER TABLE citizen_communications 
ADD COLUMN assigned_to INTEGER REFERENCES users(id),
ADD COLUMN assigned_at TIMESTAMP,
ADD COLUMN assigned_by INTEGER REFERENCES users(id);

-- Create communication_assignments table
CREATE TABLE communication_assignments (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER NOT NULL REFERENCES citizen_communications(id),
    assigned_to INTEGER NOT NULL REFERENCES users(id),
    assigned_by INTEGER NOT NULL REFERENCES users(id),
    assigned_at TIMESTAMP NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'assigned'
);

-- Create communication_comments table
CREATE TABLE communication_comments (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER NOT NULL REFERENCES citizen_communications(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    comment TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create communication_status_history table
CREATE TABLE communication_status_history (
    id SERIAL PRIMARY KEY,
    communication_id INTEGER NOT NULL REFERENCES citizen_communications(id),
    user_id INTEGER NOT NULL REFERENCES users(id),
    old_status TEXT,
    new_status TEXT NOT NULL,
    comment TEXT,
    changed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_communication_assignments_communication_id ON communication_assignments(communication_id);
CREATE INDEX idx_communication_assignments_assigned_to ON communication_assignments(assigned_to);
CREATE INDEX idx_communication_comments_communication_id ON communication_comments(communication_id);
CREATE INDEX idx_communication_comments_user_id ON communication_comments(user_id);
CREATE INDEX idx_communication_status_history_communication_id ON communication_status_history(communication_id);
CREATE INDEX idx_communication_status_history_user_id ON communication_status_history(user_id);

