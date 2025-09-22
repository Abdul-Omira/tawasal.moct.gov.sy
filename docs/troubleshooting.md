# Troubleshooting Guide

## Overview

This guide helps diagnose and resolve common issues with the Ministry Platform. It covers application errors, database problems, deployment issues, and performance troubleshooting.

## Quick Diagnostics

### Health Check Commands

```bash
# Check application health
curl http://localhost:3000/api/health

# Check database health
curl http://localhost:3000/api/health/db

# Check Redis health
curl http://localhost:3000/api/health/redis

# Check system resources
docker stats
```

### Log Locations

```bash
# Application logs
docker-compose logs app

# Database logs
docker-compose logs db

# Redis logs
docker-compose logs redis

# Nginx logs
docker-compose logs nginx
```

## Common Issues

### 1. Application Won't Start

#### Symptoms
- Application fails to start
- Error messages in logs
- Port already in use errors

#### Diagnosis
```bash
# Check if port is in use
lsof -i :3000

# Check application logs
docker-compose logs app

# Check environment variables
docker-compose exec app env
```

#### Solutions

**Port Already in Use**
```bash
# Kill process using port 3000
lsof -ti:3000 | xargs kill -9

# Or change port in docker-compose.yml
ports:
  - "3001:3000"
```

**Missing Environment Variables**
```bash
# Check .env file exists
ls -la .env

# Verify required variables
grep -E "DATABASE_URL|REDIS_URL|JWT_SECRET" .env
```

**Database Connection Issues**
```bash
# Check database is running
docker-compose ps db

# Test database connection
docker-compose exec app npm run db:push

# Check database logs
docker-compose logs db
```

### 2. Database Connection Errors

#### Symptoms
- "Database connection failed" errors
- Timeout errors
- Authentication failures

#### Diagnosis
```bash
# Check database status
docker-compose ps db

# Test connection
docker-compose exec db psql -U ministry_user -d ministry_platform

# Check database logs
docker-compose logs db
```

#### Solutions

**Database Not Running**
```bash
# Start database
docker-compose up -d db

# Check database health
docker-compose exec db pg_isready -U ministry_user
```

**Connection String Issues**
```bash
# Verify DATABASE_URL format
echo $DATABASE_URL
# Should be: postgresql://username:password@host:port/database

# Test connection string
docker-compose exec app node -e "
const { Client } = require('pg');
const client = new Client(process.env.DATABASE_URL);
client.connect().then(() => console.log('Connected')).catch(console.error);
"
```

**Authentication Issues**
```bash
# Reset database password
docker-compose exec db psql -U postgres -c "
ALTER USER ministry_user PASSWORD 'new_password';
"

# Update .env file
DATABASE_URL=postgresql://ministry_user:new_password@db:5432/ministry_platform
```

### 3. Redis Connection Errors

#### Symptoms
- "Redis connection failed" errors
- Cache not working
- Session issues

#### Diagnosis
```bash
# Check Redis status
docker-compose ps redis

# Test Redis connection
docker-compose exec redis redis-cli ping

# Check Redis logs
docker-compose logs redis
```

#### Solutions

**Redis Not Running**
```bash
# Start Redis
docker-compose up -d redis

# Check Redis health
docker-compose exec redis redis-cli ping
```

**Memory Issues**
```bash
# Check Redis memory usage
docker-compose exec redis redis-cli info memory

# Clear Redis cache
docker-compose exec redis redis-cli flushall
```

### 4. Build Errors

#### Symptoms
- npm install fails
- TypeScript compilation errors
- Build process fails

#### Diagnosis
```bash
# Check Node.js version
node --version

# Check npm version
npm --version

# Check for lock file conflicts
ls -la package-lock.json

# Check TypeScript errors
npm run type-check
```

#### Solutions

**Dependency Issues**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Use legacy peer deps if needed
npm install --legacy-peer-deps
```

**TypeScript Errors**
```bash
# Check TypeScript configuration
npx tsc --noEmit

# Fix type errors
npm run type-check

# Update TypeScript
npm install typescript@latest
```

**Memory Issues**
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or in package.json
"scripts": {
  "build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
}
```

### 5. Performance Issues

#### Symptoms
- Slow response times
- High memory usage
- High CPU usage
- Timeout errors

#### Diagnosis
```bash
# Check system resources
docker stats

# Check application metrics
curl http://localhost:3000/api/health/metrics

# Check database performance
docker-compose exec db psql -U ministry_user -d ministry_platform -c "
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
"
```

#### Solutions

**High Memory Usage**
```bash
# Check memory usage
docker stats --no-stream

# Restart application
docker-compose restart app

# Check for memory leaks
docker-compose exec app node --inspect=0.0.0.0:9229
```

**Slow Database Queries**
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;

-- Add indexes
CREATE INDEX idx_forms_created_by ON forms(created_by);
CREATE INDEX idx_submissions_form_id ON form_submissions(form_id);

-- Analyze tables
ANALYZE forms;
ANALYZE form_submissions;
```

**High CPU Usage**
```bash
# Check CPU usage
top

# Check application logs for errors
docker-compose logs app | grep ERROR

# Optimize application code
# Check for infinite loops
# Optimize database queries
```

### 6. Authentication Issues

#### Symptoms
- Login failures
- Token validation errors
- Permission denied errors

#### Diagnosis
```bash
# Check JWT secret
echo $JWT_SECRET

# Test authentication endpoint
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Check user permissions
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/users
```

#### Solutions

**Invalid JWT Secret**
```bash
# Generate new JWT secret
openssl rand -base64 32

# Update .env file
JWT_SECRET=your-new-secret-key

# Restart application
docker-compose restart app
```

**User Permission Issues**
```bash
# Check user role
docker-compose exec app node -e "
const { storage } = require('./server/database/storage');
storage.getUserById('1').then(console.log);
"

# Update user permissions
docker-compose exec app node -e "
const { storage } = require('./server/database/storage');
storage.updateUser('1', { role: 'super_admin' });
"
```

### 7. File Upload Issues

#### Symptoms
- File upload fails
- Large file errors
- Permission denied errors

#### Diagnosis
```bash
# Check upload directory permissions
ls -la uploads/

# Check file size limits
grep -i "max.*size" server/index.ts

# Check disk space
df -h
```

#### Solutions

**Permission Issues**
```bash
# Fix upload directory permissions
sudo chown -R 1000:1000 uploads/
chmod -R 755 uploads/
```

**File Size Limits**
```bash
# Increase file size limit in docker-compose.yml
environment:
  - MAX_FILE_SIZE=52428800  # 50MB

# Or in nginx configuration
client_max_body_size 50M;
```

### 8. Email Issues

#### Symptoms
- Emails not sending
- SMTP connection errors
- Authentication failures

#### Diagnosis
```bash
# Check SMTP configuration
grep -i smtp .env

# Test SMTP connection
docker-compose exec app node -e "
const nodemailer = require('nodemailer');
const transporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});
transporter.verify().then(console.log).catch(console.error);
"
```

#### Solutions

**SMTP Configuration**
```bash
# Update .env file
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com

# Restart application
docker-compose restart app
```

**Gmail App Password**
1. Enable 2-factor authentication
2. Generate app password
3. Use app password instead of regular password

### 9. Monitoring Issues

#### Symptoms
- Grafana not loading
- Prometheus not collecting metrics
- Alerts not working

#### Diagnosis
```bash
# Check monitoring stack
docker-compose -f monitoring/docker-compose.monitoring.yml ps

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Check Grafana health
curl http://localhost:3001/api/health
```

#### Solutions

**Prometheus Issues**
```bash
# Restart Prometheus
docker-compose -f monitoring/docker-compose.monitoring.yml restart prometheus

# Check configuration
docker-compose -f monitoring/docker-compose.monitoring.yml exec prometheus \
  promtool check config /etc/prometheus/prometheus.yml
```

**Grafana Issues**
```bash
# Restart Grafana
docker-compose -f monitoring/docker-compose.monitoring.yml restart grafana

# Check logs
docker-compose -f monitoring/docker-compose.monitoring.yml logs grafana
```

### 10. Kubernetes Issues

#### Symptoms
- Pods not starting
- Services not accessible
- Persistent volume issues

#### Diagnosis
```bash
# Check pod status
kubectl get pods -n ministry-platform

# Check pod logs
kubectl logs -f deployment/ministry-platform -n ministry-platform

# Check service status
kubectl get services -n ministry-platform

# Check persistent volumes
kubectl get pv
kubectl get pvc -n ministry-platform
```

#### Solutions

**Pod Issues**
```bash
# Describe pod for details
kubectl describe pod <pod-name> -n ministry-platform

# Check resource limits
kubectl get pod <pod-name> -n ministry-platform -o yaml | grep -A 5 resources

# Increase resource limits
kubectl patch deployment ministry-platform -n ministry-platform -p '
{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}
'
```

**Service Issues**
```bash
# Check service endpoints
kubectl get endpoints -n ministry-platform

# Check service configuration
kubectl describe service ministry-platform -n ministry-platform
```

## Advanced Troubleshooting

### Database Performance

```sql
-- Check database size
SELECT pg_size_pretty(pg_database_size('ministry_platform'));

-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT 
  query,
  mean_time,
  calls,
  total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Application Performance

```bash
# Check memory usage
docker-compose exec app node -e "
const usage = process.memoryUsage();
console.log('RSS:', Math.round(usage.rss / 1024 / 1024), 'MB');
console.log('Heap Total:', Math.round(usage.heapTotal / 1024 / 1024), 'MB');
console.log('Heap Used:', Math.round(usage.heapUsed / 1024 / 1024), 'MB');
console.log('External:', Math.round(usage.external / 1024 / 1024), 'MB');
"

# Check CPU usage
docker-compose exec app node -e "
const usage = process.cpuUsage();
console.log('CPU Usage:', usage);
"

# Profile application
docker-compose exec app node --prof server/index.ts
```

### Network Issues

```bash
# Check network connectivity
docker-compose exec app ping db
docker-compose exec app ping redis

# Check port accessibility
docker-compose exec app nc -zv db 5432
docker-compose exec app nc -zv redis 6379

# Check DNS resolution
docker-compose exec app nslookup db
docker-compose exec app nslookup redis
```

### Security Issues

```bash
# Check for security vulnerabilities
npm audit

# Fix security issues
npm audit fix

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## Recovery Procedures

### Database Recovery

```bash
# Backup database
docker-compose exec db pg_dump -U ministry_user ministry_platform > backup.sql

# Restore database
docker-compose exec -T db psql -U ministry_user ministry_platform < backup.sql

# Point-in-time recovery
docker-compose exec db pg_basebackup -D /var/lib/postgresql/data/backup
```

### Application Recovery

```bash
# Rollback to previous version
git checkout <previous-commit>
docker-compose up -d --build

# Restore from backup
tar -xzf backup.tar.gz
docker-compose up -d
```

### Configuration Recovery

```bash
# Restore configuration
cp .env.backup .env
docker-compose restart

# Reset to defaults
cp .env.example .env
# Edit .env with your values
docker-compose restart
```

## Prevention

### Regular Maintenance

```bash
# Daily health checks
./scripts/health-check.sh

# Weekly backups
./scripts/backup.sh

# Monthly updates
npm update
docker-compose pull
docker-compose up -d
```

### Monitoring

```bash
# Set up monitoring
./scripts/start-monitoring.sh

# Check alerts
curl http://localhost:9093/api/v1/alerts

# Review logs
docker-compose logs --tail=100 app
```

### Documentation

- Keep documentation updated
- Document custom configurations
- Maintain runbooks
- Regular team training

## Getting Help

### Self-Service

1. Check this troubleshooting guide
2. Review application logs
3. Check monitoring dashboards
4. Search existing issues

### Community Support

1. GitHub Issues
2. Discussion Forums
3. Stack Overflow
4. Community Slack

### Professional Support

1. Contact system administrator
2. Escalate to development team
3. Contact vendor support
4. Emergency hotline

## Emergency Contacts

- **System Administrator**: admin@ministry-platform.gov.sy
- **Database Administrator**: dba@ministry-platform.gov.sy
- **Security Team**: security@ministry-platform.gov.sy
- **Development Team**: dev@ministry-platform.gov.sy

## Escalation Procedures

1. **Level 1**: Self-service troubleshooting
2. **Level 2**: Contact system administrator
3. **Level 3**: Escalate to development team
4. **Level 4**: Contact vendor support
5. **Level 5**: Emergency response team
