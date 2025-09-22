-- Analytics Tables Migration
-- @copyright 2025 Syrian Ministry of Communications and Information Technology

-- Create analytics_events table for storing raw analytics events
CREATE TABLE IF NOT EXISTS analytics_events (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    tenant_id TEXT,
    user_id TEXT,
    session_id TEXT,
    event_type TEXT NOT NULL,
    event_data JSONB NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_form_id ON analytics_events(form_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_id ON analytics_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_form_tenant ON analytics_events(form_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_tenant_timestamp ON analytics_events(tenant_id, timestamp);

-- Create form_analytics_summary table for aggregated form analytics
CREATE TABLE IF NOT EXISTS form_analytics_summary (
    id TEXT PRIMARY KEY,
    form_id TEXT NOT NULL,
    tenant_id TEXT,
    total_views INTEGER NOT NULL DEFAULT 0,
    total_submissions INTEGER NOT NULL DEFAULT 0,
    completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    average_time_to_complete INTEGER NOT NULL DEFAULT 0,
    bounce_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    device_breakdown JSONB NOT NULL DEFAULT '{}',
    browser_breakdown JSONB NOT NULL DEFAULT '{}',
    os_breakdown JSONB NOT NULL DEFAULT '{}',
    time_series JSONB NOT NULL DEFAULT '[]',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(form_id, tenant_id)
);

-- Create indexes for form_analytics_summary
CREATE INDEX IF NOT EXISTS idx_form_analytics_summary_form_id ON form_analytics_summary(form_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_summary_tenant_id ON form_analytics_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_form_analytics_summary_last_updated ON form_analytics_summary(last_updated);

-- Create user_analytics_summary table for user analytics
CREATE TABLE IF NOT EXISTS user_analytics_summary (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    tenant_id TEXT,
    total_forms_created INTEGER NOT NULL DEFAULT 0,
    total_forms_published INTEGER NOT NULL DEFAULT 0,
    total_submissions_received INTEGER NOT NULL DEFAULT 0,
    average_form_completion_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    most_used_components JSONB NOT NULL DEFAULT '[]',
    activity_timeline JSONB NOT NULL DEFAULT '[]',
    last_active TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, tenant_id)
);

-- Create indexes for user_analytics_summary
CREATE INDEX IF NOT EXISTS idx_user_analytics_summary_user_id ON user_analytics_summary(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_summary_tenant_id ON user_analytics_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_summary_last_active ON user_analytics_summary(last_active);

-- Create tenant_analytics_summary table for tenant analytics
CREATE TABLE IF NOT EXISTS tenant_analytics_summary (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL UNIQUE,
    total_forms INTEGER NOT NULL DEFAULT 0,
    total_submissions INTEGER NOT NULL DEFAULT 0,
    total_users INTEGER NOT NULL DEFAULT 0,
    active_users INTEGER NOT NULL DEFAULT 0,
    storage_used BIGINT NOT NULL DEFAULT 0,
    api_calls INTEGER NOT NULL DEFAULT 0,
    average_response_time DECIMAL(10,2) NOT NULL DEFAULT 0,
    error_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
    time_series JSONB NOT NULL DEFAULT '[]',
    last_updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for tenant_analytics_summary
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_summary_tenant_id ON tenant_analytics_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_summary_last_updated ON tenant_analytics_summary(last_updated);

-- Create performance_metrics table for system performance tracking
CREATE TABLE IF NOT EXISTS performance_metrics (
    id TEXT PRIMARY KEY,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    metric_unit TEXT NOT NULL,
    tags JSONB NOT NULL DEFAULT '{}',
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for performance_metrics
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_timestamp ON performance_metrics(metric_name, timestamp);

-- Create security_events table for security monitoring
CREATE TABLE IF NOT EXISTS security_events (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    user_id TEXT,
    tenant_id TEXT,
    ip_address INET,
    user_agent TEXT,
    request_data JSONB,
    response_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for security_events
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_timestamp ON security_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_security_events_ip_address ON security_events(ip_address);

-- Create api_usage_logs table for API usage tracking
CREATE TABLE IF NOT EXISTS api_usage_logs (
    id TEXT PRIMARY KEY,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    user_id TEXT,
    tenant_id TEXT,
    ip_address INET,
    user_agent TEXT,
    request_size INTEGER NOT NULL DEFAULT 0,
    response_size INTEGER NOT NULL DEFAULT 0,
    response_time INTEGER NOT NULL DEFAULT 0,
    status_code INTEGER NOT NULL,
    error_message TEXT,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for api_usage_logs
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_method ON api_usage_logs(method);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_tenant_id ON api_usage_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_timestamp ON api_usage_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_logs_status_code ON api_usage_logs(status_code);

-- Create real_time_metrics table for real-time dashboard data
CREATE TABLE IF NOT EXISTS real_time_metrics (
    id TEXT PRIMARY KEY,
    metric_key TEXT NOT NULL,
    metric_value JSONB NOT NULL,
    tenant_id TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for real_time_metrics
CREATE INDEX IF NOT EXISTS idx_real_time_metrics_key ON real_time_metrics(metric_key);
CREATE INDEX IF NOT EXISTS idx_real_time_metrics_tenant_id ON real_time_metrics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_real_time_metrics_expires_at ON real_time_metrics(expires_at);

-- Create analytics_reports table for generated reports
CREATE TABLE IF NOT EXISTS analytics_reports (
    id TEXT PRIMARY KEY,
    report_name TEXT NOT NULL,
    report_type TEXT NOT NULL,
    tenant_id TEXT,
    user_id TEXT,
    parameters JSONB NOT NULL DEFAULT '{}',
    data JSONB NOT NULL DEFAULT '{}',
    status TEXT NOT NULL DEFAULT 'pending',
    file_path TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics_reports
CREATE INDEX IF NOT EXISTS idx_analytics_reports_name ON analytics_reports(report_name);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_type ON analytics_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_tenant_id ON analytics_reports(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_user_id ON analytics_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_status ON analytics_reports(status);
CREATE INDEX IF NOT EXISTS idx_analytics_reports_created_at ON analytics_reports(created_at);

-- Create analytics_alerts table for alerting system
CREATE TABLE IF NOT EXISTS analytics_alerts (
    id TEXT PRIMARY KEY,
    alert_name TEXT NOT NULL,
    alert_type TEXT NOT NULL,
    condition JSONB NOT NULL,
    threshold DECIMAL(15,4) NOT NULL,
    tenant_id TEXT,
    user_id TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    last_triggered TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for analytics_alerts
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_name ON analytics_alerts(alert_name);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_type ON analytics_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_tenant_id ON analytics_alerts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_user_id ON analytics_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_is_active ON analytics_alerts(is_active);

-- Add foreign key constraints
ALTER TABLE analytics_events ADD CONSTRAINT fk_analytics_events_form_id 
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE;

ALTER TABLE form_analytics_summary ADD CONSTRAINT fk_form_analytics_summary_form_id 
    FOREIGN KEY (form_id) REFERENCES dynamic_forms(id) ON DELETE CASCADE;

ALTER TABLE user_analytics_summary ADD CONSTRAINT fk_user_analytics_summary_user_id 
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON TABLE analytics_events IS 'Raw analytics events for detailed analysis';
COMMENT ON TABLE form_analytics_summary IS 'Aggregated analytics data per form';
COMMENT ON TABLE user_analytics_summary IS 'User activity and performance analytics';
COMMENT ON TABLE tenant_analytics_summary IS 'Tenant-level analytics and usage metrics';
COMMENT ON TABLE performance_metrics IS 'System performance metrics and KPIs';
COMMENT ON TABLE security_events IS 'Security events and threat detection logs';
COMMENT ON TABLE api_usage_logs IS 'API usage tracking and performance monitoring';
COMMENT ON TABLE real_time_metrics IS 'Real-time metrics for dashboard display';
COMMENT ON TABLE analytics_reports IS 'Generated analytics reports and exports';
COMMENT ON TABLE analytics_alerts IS 'Alerting rules and thresholds';
