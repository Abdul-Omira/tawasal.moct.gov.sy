import { api } from './api';

export interface SecurityEvent {
  id: string;
  type: 'login_attempt' | 'failed_login' | 'suspicious_activity' | 'data_breach' | 'unauthorized_access' | 'malware_detected' | 'ddos_attack' | 'sql_injection' | 'xss_attempt' | 'csrf_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  description: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
  userId?: string;
  tenantId?: string;
  metadata?: Record<string, any>;
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
  assignedTo?: string;
  resolution?: string;
  tags?: string[];
}

export interface SecurityAlert {
  id: string;
  eventId: string;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'acknowledged' | 'investigating' | 'resolved';
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string;
  dueDate?: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: 'authentication' | 'authorization' | 'data_protection' | 'network' | 'application' | 'infrastructure';
  source: string;
  metadata?: Record<string, any>;
  actions?: SecurityAction[];
}

export interface SecurityAction {
  id: string;
  type: 'block_ip' | 'suspend_user' | 'reset_password' | 'enable_mfa' | 'notify_admin' | 'quarantine_file' | 'update_firewall' | 'restart_service';
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
  completedAt?: Date;
  result?: string;
  metadata?: Record<string, any>;
}

export interface ThreatIntelligence {
  id: string;
  type: 'ip_address' | 'domain' | 'email' | 'file_hash' | 'url';
  value: string;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'malware' | 'phishing' | 'botnet' | 'spam' | 'exploit' | 'c2_server';
  source: string;
  firstSeen: Date;
  lastSeen: Date;
  confidence: number;
  description: string;
  tags: string[];
  isActive: boolean;
}

export interface SecurityDashboard {
  id: string;
  name: string;
  description: string;
  widgets: SecurityWidget[];
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId?: string;
}

export interface SecurityWidget {
  id: string;
  type: 'event_timeline' | 'threat_map' | 'alert_summary' | 'user_activity' | 'network_traffic' | 'file_scan' | 'vulnerability_scan' | 'compliance_status';
  title: string;
  config: Record<string, any>;
  position: { x: number; y: number; w: number; h: number };
  refreshInterval?: number;
}

export interface SecurityReport {
  id: string;
  name: string;
  type: 'incident' | 'threat' | 'compliance' | 'vulnerability' | 'audit';
  period: {
    start: Date;
    end: Date;
  };
  status: 'draft' | 'generating' | 'completed' | 'failed';
  summary: {
    totalEvents: number;
    criticalEvents: number;
    resolvedEvents: number;
    averageResolutionTime: number;
    topThreats: Array<{ type: string; count: number }>;
    complianceScore: number;
  };
  findings: Array<{
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
    status: 'open' | 'in_progress' | 'resolved';
  }>;
  recommendations: string[];
  generatedAt: Date;
  generatedBy: string;
  tenantId?: string;
}

class SecurityService {
  // Security Events
  async getSecurityEvents(filters: {
    type?: string;
    severity?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    tenantId?: string;
  } = {}): Promise<SecurityEvent[]> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters.tenantId) params.append('tenantId', filters.tenantId);

    const response = await api.get(`/security/events?${params.toString()}`);
    return response.data;
  }

  async getSecurityEventById(id: string): Promise<SecurityEvent | null> {
    try {
      const response = await api.get(`/security/events/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createSecurityEvent(event: Omit<SecurityEvent, 'id' | 'timestamp'>): Promise<SecurityEvent> {
    const response = await api.post('/security/events', event);
    return response.data;
  }

  async updateSecurityEvent(id: string, updates: Partial<SecurityEvent>): Promise<SecurityEvent> {
    const response = await api.put(`/security/events/${id}`, updates);
    return response.data;
  }

  async deleteSecurityEvent(id: string): Promise<boolean> {
    try {
      await api.delete(`/security/events/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Security Alerts
  async getSecurityAlerts(filters: {
    severity?: string;
    status?: string;
    category?: string;
    assignedTo?: string;
    tenantId?: string;
  } = {}): Promise<SecurityAlert[]> {
    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.assignedTo) params.append('assignedTo', filters.assignedTo);
    if (filters.tenantId) params.append('tenantId', filters.tenantId);

    const response = await api.get(`/security/alerts?${params.toString()}`);
    return response.data;
  }

  async getSecurityAlertById(id: string): Promise<SecurityAlert | null> {
    try {
      const response = await api.get(`/security/alerts/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createSecurityAlert(alert: Omit<SecurityAlert, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityAlert> {
    const response = await api.post('/security/alerts', alert);
    return response.data;
  }

  async updateSecurityAlert(id: string, updates: Partial<SecurityAlert>): Promise<SecurityAlert> {
    const response = await api.put(`/security/alerts/${id}`, updates);
    return response.data;
  }

  async acknowledgeAlert(id: string, userId: string): Promise<SecurityAlert> {
    const response = await api.post(`/security/alerts/${id}/acknowledge`, { userId });
    return response.data;
  }

  async resolveAlert(id: string, resolution: string, userId: string): Promise<SecurityAlert> {
    const response = await api.post(`/security/alerts/${id}/resolve`, { resolution, userId });
    return response.data;
  }

  // Threat Intelligence
  async getThreatIntelligence(filters: {
    type?: string;
    threatLevel?: string;
    category?: string;
    isActive?: boolean;
    tenantId?: string;
  } = {}): Promise<ThreatIntelligence[]> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.threatLevel) params.append('threatLevel', filters.threatLevel);
    if (filters.category) params.append('category', filters.category);
    if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
    if (filters.tenantId) params.append('tenantId', filters.tenantId);

    const response = await api.get(`/security/threat-intelligence?${params.toString()}`);
    return response.data;
  }

  async addThreatIntelligence(threat: Omit<ThreatIntelligence, 'id' | 'firstSeen' | 'lastSeen'>): Promise<ThreatIntelligence> {
    const response = await api.post('/security/threat-intelligence', threat);
    return response.data;
  }

  async updateThreatIntelligence(id: string, updates: Partial<ThreatIntelligence>): Promise<ThreatIntelligence> {
    const response = await api.put(`/security/threat-intelligence/${id}`, updates);
    return response.data;
  }

  async deleteThreatIntelligence(id: string): Promise<boolean> {
    try {
      await api.delete(`/security/threat-intelligence/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Security Dashboards
  async getSecurityDashboards(tenantId?: string): Promise<SecurityDashboard[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/security/dashboards${params}`);
    return response.data;
  }

  async getSecurityDashboardById(id: string): Promise<SecurityDashboard | null> {
    try {
      const response = await api.get(`/security/dashboards/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async createSecurityDashboard(dashboard: Omit<SecurityDashboard, 'id' | 'createdAt' | 'updatedAt'>): Promise<SecurityDashboard> {
    const response = await api.post('/security/dashboards', dashboard);
    return response.data;
  }

  async updateSecurityDashboard(id: string, updates: Partial<SecurityDashboard>): Promise<SecurityDashboard> {
    const response = await api.put(`/security/dashboards/${id}`, updates);
    return response.data;
  }

  async deleteSecurityDashboard(id: string): Promise<boolean> {
    try {
      await api.delete(`/security/dashboards/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Security Reports
  async getSecurityReports(tenantId?: string): Promise<SecurityReport[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/security/reports${params}`);
    return response.data;
  }

  async getSecurityReportById(id: string): Promise<SecurityReport | null> {
    try {
      const response = await api.get(`/security/reports/${id}`);
      return response.data;
    } catch (error) {
      return null;
    }
  }

  async generateSecurityReport(config: {
    name: string;
    type: string;
    period: { start: Date; end: Date };
    generatedBy: string;
    tenantId?: string;
  }): Promise<SecurityReport> {
    const response = await api.post('/security/reports/generate', config);
    return response.data;
  }

  // Security Actions
  async executeSecurityAction(action: Omit<SecurityAction, 'id' | 'createdAt'>): Promise<SecurityAction> {
    const response = await api.post('/security/actions', action);
    return response.data;
  }

  async getSecurityActions(eventId?: string): Promise<SecurityAction[]> {
    const params = eventId ? `?eventId=${eventId}` : '';
    const response = await api.get(`/security/actions${params}`);
    return response.data;
  }

  // Security Analytics
  async getSecurityAnalytics(period: { start: Date; end: Date }, tenantId?: string): Promise<any> {
    const params = new URLSearchParams();
    params.append('start', period.start.toISOString());
    params.append('end', period.end.toISOString());
    if (tenantId) params.append('tenantId', tenantId);

    const response = await api.get(`/security/analytics?${params.toString()}`);
    return response.data;
  }

  async getSecurityMetrics(tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/security/metrics${params}`);
    return response.data;
  }

  async getThreatMap(tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/security/threat-map${params}`);
    return response.data;
  }

  // Automated Response
  async getAutomatedResponseRules(tenantId?: string): Promise<any[]> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/security/automated-response${params}`);
    return response.data;
  }

  async createAutomatedResponseRule(rule: any): Promise<any> {
    const response = await api.post('/security/automated-response', rule);
    return response.data;
  }

  async updateAutomatedResponseRule(id: string, updates: any): Promise<any> {
    const response = await api.put(`/security/automated-response/${id}`, updates);
    return response.data;
  }

  async deleteAutomatedResponseRule(id: string): Promise<boolean> {
    try {
      await api.delete(`/security/automated-response/${id}`);
      return true;
    } catch (error) {
      return false;
    }
  }

  // Compliance
  async getComplianceStatus(tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.get(`/security/compliance${params}`);
    return response.data;
  }

  async runComplianceCheck(checkType: string, tenantId?: string): Promise<any> {
    const params = tenantId ? `?tenantId=${tenantId}` : '';
    const response = await api.post(`/security/compliance/check/${checkType}${params}`);
    return response.data;
  }

  // Vulnerability Management
  async getVulnerabilities(filters: {
    severity?: string;
    status?: string;
    category?: string;
    tenantId?: string;
  } = {}): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.status) params.append('status', filters.status);
    if (filters.category) params.append('category', filters.category);
    if (filters.tenantId) params.append('tenantId', filters.tenantId);

    const response = await api.get(`/security/vulnerabilities?${params.toString()}`);
    return response.data;
  }

  async scanForVulnerabilities(scanType: string, target: string, tenantId?: string): Promise<any> {
    const response = await api.post('/security/vulnerabilities/scan', {
      scanType,
      target,
      tenantId,
    });
    return response.data;
  }

  // Real-time Security Monitoring
  async subscribeToSecurityEvents(callback: (event: SecurityEvent) => void): Promise<() => void> {
    // Mock WebSocket connection
    const mockEvents = [
      {
        id: '1',
        type: 'failed_login' as const,
        severity: 'medium' as const,
        source: 'auth_service',
        description: 'Multiple failed login attempts detected',
        timestamp: new Date(),
        ipAddress: '192.168.1.100',
        status: 'active' as const,
      },
      {
        id: '2',
        type: 'suspicious_activity' as const,
        severity: 'high' as const,
        source: 'network_monitor',
        description: 'Unusual data transfer patterns detected',
        timestamp: new Date(),
        ipAddress: '10.0.0.50',
        status: 'active' as const,
      },
    ];

    const interval = setInterval(() => {
      const randomEvent = mockEvents[Math.floor(Math.random() * mockEvents.length)];
      callback({
        ...randomEvent,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date(),
      });
    }, 5000);

    return () => clearInterval(interval);
  }
}

export const securityService = new SecurityService();
