# Monitoring & Alerting Guide

## Overview

The Ministry Platform includes comprehensive monitoring and alerting capabilities to ensure system reliability, performance, and security. This guide covers the monitoring stack, dashboards, alerting rules, and troubleshooting.

## Monitoring Stack

### Components

1. **Prometheus** - Metrics collection and storage
2. **Grafana** - Visualization and dashboards
3. **Alertmanager** - Alert routing and notification
4. **Elasticsearch** - Log storage and search
5. **Kibana** - Log visualization and analysis
6. **Fluentd** - Log collection and forwarding

### Architecture

```
Application → Prometheus → Grafana
     ↓
   Fluentd → Elasticsearch → Kibana
     ↓
  Alertmanager → Notifications
```

## Quick Start

### 1. Start Monitoring Stack

```bash
# Setup monitoring (first time only)
./scripts/setup-monitoring.sh

# Start monitoring stack
./scripts/start-monitoring.sh

# Check status
./scripts/monitoring-status.sh
```

### 2. Access Dashboards

- **Grafana**: http://localhost:3001 (admin/admin123)
- **Prometheus**: http://localhost:9090
- **Kibana**: http://localhost:5601
- **Alertmanager**: http://localhost:9093

## Dashboards

### Application Metrics Dashboard

**URL**: http://localhost:3001/d/application-metrics

**Key Metrics**:
- Request Rate (requests/sec)
- Response Time (95th percentile)
- Error Rate (%)
- Active Users
- Top Endpoints by Request Count
- Error Rate by Endpoint

**Alerts**:
- High Error Rate (>5% for 2 minutes)
- High Response Time (>1s for 2 minutes)
- High Request Rate (>1000 req/s for 2 minutes)

### Database Metrics Dashboard

**URL**: http://localhost:3001/d/database-metrics

**Key Metrics**:
- Database Connections
- Database Size
- Query Rate (queries/sec)
- Cache Hit Ratio
- Database Locks
- Query Performance

**Alerts**:
- High Database Connections (>80 for 2 minutes)
- Low Cache Hit Ratio (<80% for 5 minutes)
- High Database Size (>10GB)

### Redis Metrics Dashboard

**URL**: http://localhost:3001/d/redis-metrics

**Key Metrics**:
- Connected Clients
- Memory Usage
- Operations per Second
- Hit Rate
- Key Expiration

**Alerts**:
- High Memory Usage (>2GB for 2 minutes)
- High Client Count (>200 for 2 minutes)
- Low Hit Rate (<80% for 5 minutes)

## Alerting Rules

### Critical Alerts

1. **Service Down**
   - Trigger: Service is unreachable
   - Severity: Critical
   - Action: Immediate notification

2. **High Error Rate**
   - Trigger: Error rate >5% for 2 minutes
   - Severity: Critical
   - Action: Page on-call engineer

3. **Database Down**
   - Trigger: Database unreachable
   - Severity: Critical
   - Action: Immediate notification

4. **Redis Down**
   - Trigger: Redis unreachable
   - Severity: Critical
   - Action: Immediate notification

### Warning Alerts

1. **High Response Time**
   - Trigger: 95th percentile >1s for 2 minutes
   - Severity: Warning
   - Action: Investigate performance

2. **High Memory Usage**
   - Trigger: Memory usage >85% for 5 minutes
   - Severity: Warning
   - Action: Check for memory leaks

3. **Low Cache Hit Ratio**
   - Trigger: Cache hit ratio <80% for 5 minutes
   - Severity: Warning
   - Action: Optimize queries

### Security Alerts

1. **Suspicious Activity**
   - Trigger: Suspicious activity detected
   - Severity: Critical
   - Action: Immediate investigation

2. **Brute Force Attack**
   - Trigger: High auth failure rate (>20/min)
   - Severity: Critical
   - Action: Block IP addresses

3. **MFA Failure Rate**
   - Trigger: MFA failures >3/min for 2 minutes
   - Severity: Warning
   - Action: Check MFA service

## Health Checks

### Application Health

**Endpoint**: `/api/health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "environment": "production",
  "services": {
    "database": "connected",
    "redis": "connected",
    "memory": {
      "status": "normal",
      "usage": {
        "rss": 128,
        "heapTotal": 64,
        "heapUsed": 32,
        "external": 8
      }
    },
    "disk": {
      "status": "normal",
      "message": "Disk space check not implemented"
    }
  }
}
```

### Readiness Probe

**Endpoint**: `/api/health/ready`

**Use**: Kubernetes readiness probe

**Response**:
```json
{
  "status": "ready",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Liveness Probe

**Endpoint**: `/api/health/live`

**Use**: Kubernetes liveness probe

**Response**:
```json
{
  "status": "alive",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 3600
}
```

## Log Management

### Log Collection

Fluentd collects logs from:
- Application logs (`/var/log/ministry-platform/application.log`)
- Access logs (`/var/log/ministry-platform/access.log`)
- Error logs (`/var/log/ministry-platform/error.log`)

### Log Processing

1. **Collection**: Fluentd tail plugin
2. **Parsing**: JSON format for application/error logs, Apache2 format for access logs
3. **Enrichment**: Add service name, environment, log type
4. **Storage**: Elasticsearch with time-based indices

### Log Search

**Kibana URL**: http://localhost:5601

**Common Searches**:
```
# Application errors
service:"ministry-platform" AND log_type:"error"

# High response times
service:"ministry-platform" AND response_time:>1000

# Authentication failures
service:"ministry-platform" AND message:"authentication failed"

# Form submissions
service:"ministry-platform" AND message:"form submitted"
```

## Performance Monitoring

### Key Performance Indicators (KPIs)

1. **Response Time**
   - Target: <500ms (95th percentile)
   - Alert: >1s for 2 minutes

2. **Throughput**
   - Target: >1000 requests/second
   - Alert: <500 requests/second

3. **Error Rate**
   - Target: <1%
   - Alert: >5% for 2 minutes

4. **Availability**
   - Target: 99.9%
   - Alert: <99% for 5 minutes

### Performance Optimization

1. **Database Optimization**
   - Monitor slow queries
   - Check index usage
   - Optimize connection pooling

2. **Cache Optimization**
   - Monitor hit rates
   - Tune cache sizes
   - Implement cache warming

3. **Application Optimization**
   - Profile memory usage
   - Optimize algorithms
   - Implement caching

## Security Monitoring

### Security Events

1. **Authentication Failures**
   - Monitor failed login attempts
   - Detect brute force attacks
   - Track MFA failures

2. **Suspicious Activity**
   - Unusual access patterns
   - Privilege escalation attempts
   - Data exfiltration attempts

3. **System Vulnerabilities**
   - Security scan results
   - Dependency vulnerabilities
   - Configuration issues

### Security Alerts

1. **Critical Security Events**
   - Immediate notification
   - Automatic response actions
   - Escalation procedures

2. **Security Warnings**
   - Regular monitoring
   - Investigation required
   - Documentation needed

## Troubleshooting

### Common Issues

1. **High Memory Usage**
   ```bash
   # Check memory usage
   curl http://localhost:3000/api/health/metrics
   
   # Restart application
   docker-compose restart app
   ```

2. **Database Connection Issues**
   ```bash
   # Check database health
   curl http://localhost:3000/api/health/db
   
   # Check database logs
   docker-compose logs db
   ```

3. **Redis Connection Issues**
   ```bash
   # Check Redis health
   curl http://localhost:3000/api/health/redis
   
   # Check Redis logs
   docker-compose logs redis
   ```

4. **High Error Rate**
   ```bash
   # Check application logs
   docker-compose logs app
   
   # Check error logs in Kibana
   # Search: service:"ministry-platform" AND log_type:"error"
   ```

### Monitoring Commands

```bash
# Check monitoring stack status
./scripts/monitoring-status.sh

# View application logs
docker-compose logs -f app

# View Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana health
curl http://localhost:3001/api/health

# Check Elasticsearch health
curl http://localhost:9200/_cluster/health
```

### Performance Tuning

1. **Prometheus Tuning**
   - Adjust scrape intervals
   - Configure retention policies
   - Optimize query performance

2. **Grafana Tuning**
   - Optimize dashboard queries
   - Configure caching
   - Tune refresh intervals

3. **Elasticsearch Tuning**
   - Optimize index settings
   - Configure sharding
   - Tune memory settings

## Best Practices

### Monitoring

1. **Set Appropriate Thresholds**
   - Base on historical data
   - Consider business impact
   - Regular threshold review

2. **Use Multiple Alert Channels**
   - Email for warnings
   - SMS for critical alerts
   - Slack for team notifications

3. **Regular Dashboard Review**
   - Weekly dashboard review
   - Monthly performance analysis
   - Quarterly capacity planning

### Alerting

1. **Avoid Alert Fatigue**
   - Use appropriate severity levels
   - Implement alert grouping
   - Regular alert review

2. **Clear Alert Messages**
   - Include context
   - Provide action steps
   - Link to runbooks

3. **Test Alerting**
   - Regular alert testing
   - Validate notification channels
   - Review alert effectiveness

### Logging

1. **Structured Logging**
   - Use consistent format
   - Include correlation IDs
   - Add relevant context

2. **Log Levels**
   - ERROR: System errors
   - WARN: Warning conditions
   - INFO: General information
   - DEBUG: Detailed information

3. **Log Retention**
   - Set appropriate retention
   - Archive old logs
   - Compress log files

## Maintenance

### Regular Tasks

1. **Daily**
   - Check alert status
   - Review error logs
   - Monitor performance

2. **Weekly**
   - Review dashboards
   - Analyze trends
   - Update documentation

3. **Monthly**
   - Capacity planning
   - Performance optimization
   - Security review

### Backup and Recovery

1. **Configuration Backup**
   - Backup Grafana dashboards
   - Export Prometheus rules
   - Save alert configurations

2. **Data Backup**
   - Backup Elasticsearch indices
   - Export Prometheus data
   - Archive log files

3. **Recovery Procedures**
   - Document recovery steps
   - Test recovery procedures
   - Maintain runbooks
