-- Migration: Add Enterprise Tables for Multi-Tenant Form Builder
-- Description: Adds ministry management, RBAC, audit logs, dynamic forms, and analytics tables
-- Author: Syrian Ministry of Communications
-- Date: 2025-01-27

-- Create ministries table
CREATE TABLE IF NOT EXISTS ministries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,
    branding JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create role definitions table
CREATE TABLE IF NOT EXISTS role_definitions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    ministry_specific BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(100),
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create dynamic forms table
CREATE TABLE IF NOT EXISTS dynamic_forms (
    id SERIAL PRIMARY KEY,
    ministry_id INTEGER REFERENCES ministries(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    form_schema JSONB NOT NULL,
    styling JSONB DEFAULT '{}',
    settings JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'draft',
    created_by INTEGER REFERENCES users(id),
    published_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES dynamic_forms(id),
    data JSONB NOT NULL,
    encrypted_data TEXT,
    status VARCHAR(50) DEFAULT 'submitted',
    submitted_by VARCHAR(255),
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create form analytics table (for TimescaleDB)
CREATE TABLE IF NOT EXISTS form_analytics (
    time TIMESTAMPTZ NOT NULL,
    form_id INTEGER,
    event_type VARCHAR(50),
    user_id INTEGER,
    session_id VARCHAR(255),
    data JSONB
);

-- Create users_extended table with RBAC fields
CREATE TABLE IF NOT EXISTS users_extended (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE NOT NULL,
    ministry_id INTEGER REFERENCES ministries(id),
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '[]',
    mfa_enabled BOOLEAN DEFAULT FALSE,
    mfa_secret VARCHAR(255),
    last_login TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ministries_domain ON ministries(domain);
CREATE INDEX IF NOT EXISTS idx_ministries_name ON ministries(name);
CREATE INDEX IF NOT EXISTS idx_role_definitions_name ON role_definitions(name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_ministry_id ON dynamic_forms(ministry_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_status ON dynamic_forms(status);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_created_by ON dynamic_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_created_at ON form_submissions(created_at);
CREATE INDEX IF NOT EXISTS idx_form_analytics_time ON form_analytics(time);
CREATE INDEX IF NOT EXISTS idx_form_analytics_form_id ON form_analytics(form_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_event_type ON form_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_users_extended_ministry_id ON users_extended(ministry_id);
CREATE INDEX IF NOT EXISTS idx_users_extended_role ON users_extended(role);
CREATE INDEX IF NOT EXISTS idx_users_extended_is_active ON users_extended(is_active);

-- Insert default ministry (Syrian Ministry of Communications)
INSERT INTO ministries (name, domain, branding, settings) VALUES (
    'وزارة الاتصالات وتقانة المعلومات',
    'moct.gov.sy',
    '{"primaryColor": "#00594f", "secondaryColor": "#d9c89e", "logo": "/assets/ministery-logo.png"}',
    '{"allowCustomBranding": true, "maxFormsPerMinistry": 1000, "requireApproval": false}'
) ON CONFLICT (domain) DO NOTHING;

-- Insert default role definitions
INSERT INTO role_definitions (name, description, permissions, ministry_specific) VALUES 
('super_admin', 'مدير النظام العام', '["*"]', false),
('ministry_admin', 'مدير الوزارة', '["forms:create", "forms:read", "forms:update", "forms:delete", "forms:publish", "users:create", "users:read", "users:update", "analytics:read"]', true),
('form_creator', 'منشئ النماذج', '["forms:create", "forms:read", "forms:update", "forms:delete"]', true),
('form_manager', 'مدير النماذج', '["forms:read", "forms:update", "forms:publish", "submissions:read", "submissions:update"]', true),
('viewer', 'مشاهد', '["forms:read", "submissions:read"]', true)
ON CONFLICT (name) DO NOTHING;

-- Create TimescaleDB hypertable for form_analytics (if TimescaleDB is available)
-- This will be handled by the application when TimescaleDB is installed
-- SELECT create_hypertable('form_analytics', 'time', if_not_exists => TRUE);

-- Add comments for documentation
COMMENT ON TABLE ministries IS 'Ministry management for multi-tenant architecture';
COMMENT ON TABLE role_definitions IS 'Role-based access control definitions';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for security and compliance';
COMMENT ON TABLE dynamic_forms IS 'Dynamic form definitions with JSON schema';
COMMENT ON TABLE form_submissions IS 'Form submission data with optional encryption';
COMMENT ON TABLE form_analytics IS 'Time-series analytics data for form interactions';
COMMENT ON TABLE users_extended IS 'Extended user table with RBAC and MFA support';
