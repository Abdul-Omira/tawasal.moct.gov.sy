-- Migration: Add Dynamic Forms Tables
-- Description: Create tables for dynamic form storage, submissions, and analytics
-- Author: Syrian Ministry of Communications
-- Version: 1.0.0

-- Create dynamic_forms table
CREATE TABLE IF NOT EXISTS dynamic_forms (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    form_definition JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    version INTEGER NOT NULL DEFAULT 1,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    published_at TIMESTAMP,
    created_by INTEGER NOT NULL,
    ministry_id TEXT,
    tenant_id TEXT,
    settings JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    published_by INTEGER,
    approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    approved_by INTEGER,
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    is_template BOOLEAN DEFAULT FALSE,
    template_category TEXT,
    access_level TEXT DEFAULT 'public' CHECK (access_level IN ('public', 'ministry', 'private')),
    submission_limit INTEGER,
    submission_count INTEGER DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL,
    FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Create form_submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    submission_data JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'completed')),
    submitted_by INTEGER,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    review_notes TEXT,
    ip_address TEXT,
    user_agent TEXT,
    session_id TEXT,
    tenant_id TEXT,
    ministry_id TEXT,
    metadata JSONB DEFAULT '{}',
    is_anonymous BOOLEAN DEFAULT FALSE,
    submission_hash TEXT,
    validation_errors JSONB DEFAULT '{}',
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    processing_notes TEXT,
    assigned_to INTEGER,
    assigned_at TIMESTAMP,
    due_date TIMESTAMP,
    priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    tags TEXT[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]',
    workflow_state TEXT DEFAULT 'new',
    workflow_data JSONB DEFAULT '{}',
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
);

-- Create form_analytics table
CREATE TABLE IF NOT EXISTS form_analytics (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('view', 'start', 'complete', 'abandon', 'error', 'interaction')),
    event_data JSONB DEFAULT '{}',
    user_id INTEGER,
    session_id TEXT,
    ip_address TEXT,
    user_agent TEXT,
    tenant_id TEXT,
    ministry_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    page_number INTEGER,
    component_id TEXT,
    component_type TEXT,
    interaction_type TEXT,
    duration_ms INTEGER,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
);

-- Create form_templates table
CREATE TABLE IF NOT EXISTS form_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL,
    template_data JSONB NOT NULL,
    preview_image TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    is_ministry_specific BOOLEAN DEFAULT FALSE,
    ministry_id TEXT,
    created_by INTEGER NOT NULL,
    usage_count INTEGER DEFAULT 0,
    rating DECIMAL(3,2) DEFAULT 0.0,
    tags TEXT[] DEFAULT '{}',
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (ministry_id) REFERENCES ministries(id) ON DELETE SET NULL
);

-- Create form_versions table for version control
CREATE TABLE IF NOT EXISTS form_versions (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    version_number INTEGER NOT NULL,
    form_definition JSONB NOT NULL,
    change_notes TEXT,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(form_id, version_number)
);

-- Create form_permissions table for granular access control
CREATE TABLE IF NOT EXISTS form_permissions (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    user_id INTEGER,
    role_id TEXT,
    permission_type TEXT NOT NULL CHECK (permission_type IN ('view', 'edit', 'submit', 'review', 'admin')),
    granted_by INTEGER NOT NULL,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (role_id) REFERENCES role_definitions(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create form_workflows table for approval workflows
CREATE TABLE IF NOT EXISTS form_workflows (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    workflow_name TEXT NOT NULL,
    workflow_definition JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
);

-- Create form_notifications table for submission notifications
CREATE TABLE IF NOT EXISTS form_notifications (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('submission', 'approval', 'rejection', 'assignment', 'due_date')),
    recipient_type TEXT NOT NULL CHECK (recipient_type IN ('creator', 'reviewer', 'assignee', 'ministry_admin', 'custom')),
    recipient_id INTEGER,
    recipient_email TEXT,
    template_id TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE,
    FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_ministry_id ON dynamic_forms(ministry_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_tenant_id ON dynamic_forms(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_status ON dynamic_forms(status);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_created_by ON dynamic_forms(created_by);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_published_at ON dynamic_forms(published_at);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_is_published ON dynamic_forms(is_published);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_approval_status ON dynamic_forms(approval_status);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_category ON dynamic_forms(category);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_is_template ON dynamic_forms(is_template);
CREATE INDEX IF NOT EXISTS idx_dynamic_forms_access_level ON dynamic_forms(access_level);

CREATE INDEX IF NOT EXISTS idx_form_submissions_form_id ON form_submissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_by ON form_submissions(submitted_by);
CREATE INDEX IF NOT EXISTS idx_form_submissions_status ON form_submissions(status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_tenant_id ON form_submissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_ministry_id ON form_submissions(ministry_id);
CREATE INDEX IF NOT EXISTS idx_form_submissions_submitted_at ON form_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_submissions_processing_status ON form_submissions(processing_status);
CREATE INDEX IF NOT EXISTS idx_form_submissions_assigned_to ON form_submissions(assigned_to);
CREATE INDEX IF NOT EXISTS idx_form_submissions_priority ON form_submissions(priority);

CREATE INDEX IF NOT EXISTS idx_form_analytics_form_id ON form_analytics(form_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_event_type ON form_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_form_analytics_user_id ON form_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_tenant_id ON form_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_ministry_id ON form_analytics(ministry_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_created_at ON form_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_form_analytics_component_id ON form_analytics(component_id);

CREATE INDEX IF NOT EXISTS idx_form_templates_category ON form_templates(category);
CREATE INDEX IF NOT EXISTS idx_form_templates_ministry_id ON form_templates(ministry_id);
CREATE INDEX IF NOT EXISTS idx_form_templates_is_public ON form_templates(is_public);
CREATE INDEX IF NOT EXISTS idx_form_templates_created_by ON form_templates(created_by);

CREATE INDEX IF NOT EXISTS idx_form_versions_form_id ON form_versions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_versions_version_number ON form_versions(version_number);
CREATE INDEX IF NOT EXISTS idx_form_versions_is_current ON form_versions(is_current);

CREATE INDEX IF NOT EXISTS idx_form_permissions_form_id ON form_permissions(form_id);
CREATE INDEX IF NOT EXISTS idx_form_permissions_user_id ON form_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_form_permissions_role_id ON form_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_form_permissions_permission_type ON form_permissions(permission_type);

CREATE INDEX IF NOT EXISTS idx_form_workflows_form_id ON form_workflows(form_id);
CREATE INDEX IF NOT EXISTS idx_form_workflows_is_active ON form_workflows(is_active);

CREATE INDEX IF NOT EXISTS idx_form_notifications_form_id ON form_notifications(form_id);
CREATE INDEX IF NOT EXISTS idx_form_notifications_notification_type ON form_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_form_notifications_recipient_type ON form_notifications(recipient_type);

-- Create triggers for updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_dynamic_forms_updated_at
    AFTER UPDATE ON dynamic_forms
    FOR EACH ROW
    BEGIN
        UPDATE dynamic_forms SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_form_templates_updated_at
    AFTER UPDATE ON form_templates
    FOR EACH ROW
    BEGIN
        UPDATE form_templates SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_form_workflows_updated_at
    AFTER UPDATE ON form_workflows
    FOR EACH ROW
    BEGIN
        UPDATE form_workflows SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- Create trigger to update submission count
CREATE TRIGGER IF NOT EXISTS update_form_submission_count
    AFTER INSERT ON form_submissions
    FOR EACH ROW
    BEGIN
        UPDATE dynamic_forms 
        SET submission_count = submission_count + 1 
        WHERE id = NEW.form_id;
    END;

-- Create trigger to update template usage count
CREATE TRIGGER IF NOT EXISTS update_template_usage_count
    AFTER INSERT ON dynamic_forms
    FOR EACH ROW
    WHEN NEW.is_template = TRUE
    BEGIN
        UPDATE form_templates 
        SET usage_count = usage_count + 1 
        WHERE id = NEW.id;
    END;
