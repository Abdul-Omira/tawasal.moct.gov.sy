# Deployment Guide

## Overview

This guide covers deploying the Ministry Platform in various environments, from development to production. The platform supports multiple deployment strategies including Docker, Kubernetes, and traditional server deployments.

## Prerequisites

### System Requirements

**Minimum Requirements:**
- CPU: 2 cores
- RAM: 4GB
- Storage: 20GB SSD
- OS: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

**Recommended Requirements:**
- CPU: 4+ cores
- RAM: 8GB+
- Storage: 50GB+ SSD
- OS: Ubuntu 22.04 LTS

### Software Dependencies

- **Node.js**: 18.0.0+
- **PostgreSQL**: 16.0+
- **Redis**: 7.0+
- **Docker**: 20.10+ (for containerized deployment)
- **Kubernetes**: 1.24+ (for K8s deployment)

## Environment Setup

### 1. Development Environment

#### Quick Start with Docker

```bash
# Clone repository
git clone <repository-url>
cd ministry-platform

# Copy environment file
cp .env.example .env

# Start services
docker-compose up -d

# Run migrations
docker-compose exec app npm run db:migrate

# Access application
# Frontend: http://localhost:5173
# Backend: http://localhost:3000
```

#### Manual Setup

```bash
# Install Node.js dependencies
npm install

# Install PostgreSQL and Redis
sudo apt update
sudo apt install postgresql-16 redis-server

# Create database
sudo -u postgres createdb ministry_platform

# Set environment variables
export DATABASE_URL="postgresql://username:password@localhost:5432/ministry_platform"
export REDIS_URL="redis://localhost:6379"
export JWT_SECRET="your-secret-key"

# Run migrations
npm run db:migrate

# Start development server
npm run dev:all
```

### 2. Staging Environment

#### Docker Deployment

```bash
# Build production image
docker build -t ministry-platform:staging .

# Run with production settings
docker run -d \
  --name ministry-platform-staging \
  -p 3000:3000 \
  -e NODE_ENV=staging \
  -e DATABASE_URL="postgresql://user:pass@db:5432/ministry_platform" \
  -e REDIS_URL="redis://redis:6379" \
  ministry-platform:staging
```

#### Docker Compose

```bash
# Use staging configuration
docker-compose -f docker-compose.staging.yml up -d
```

### 3. Production Environment

#### Docker Swarm Deployment

```bash
# Initialize swarm
docker swarm init

# Deploy stack
docker stack deploy -c docker-compose.prod.yml ministry-platform
```

#### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace ministry-platform

# Apply configurations
kubectl apply -f k8s/manifests/

# Deploy with Helm
helm install ministry-platform k8s/helm-charts/ministry-platform \
  --namespace ministry-platform \
  --values k8s/helm-charts/ministry-platform/values.prod.yaml
```

## Configuration

### Environment Variables

#### Required Variables

```env
# Database
DATABASE_URL=postgresql://username:password@host:port/database
TEST_DATABASE_URL=postgresql://username:password@host:port/test_database

# Redis
REDIS_URL=redis://host:port
TEST_REDIS_URL=redis://host:port/1

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Application
NODE_ENV=production
PORT=3000
CLIENT_URL=https://your-domain.com
```

#### Optional Variables

```env
# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@your-domain.com

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads

# Security
BCRYPT_ROUNDS=12
SESSION_SECRET=your-session-secret

# Monitoring
PROMETHEUS_ENDPOINT=http://prometheus:9090
GRAFANA_ENDPOINT=http://grafana:3000

# External Services
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
MICROSOFT_CLIENT_ID=your-microsoft-client-id
MICROSOFT_CLIENT_SECRET=your-microsoft-client-secret
```

### Database Configuration

#### PostgreSQL Setup

```sql
-- Create database
CREATE DATABASE ministry_platform;

-- Create user
CREATE USER ministry_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ministry_platform TO ministry_user;

-- Enable extensions
\c ministry_platform;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

#### Redis Configuration

```conf
# redis.conf
bind 0.0.0.0
port 6379
requirepass your_redis_password
maxmemory 2gb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### SSL/TLS Configuration

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Deployment Strategies

### 1. Blue-Green Deployment

```bash
# Deploy green environment
docker-compose -f docker-compose.green.yml up -d

# Run health checks
./scripts/health-check.sh --environment green

# Switch traffic (update load balancer)
# Switch DNS or load balancer configuration

# Decommission blue environment
docker-compose -f docker-compose.blue.yml down
```

### 2. Rolling Deployment

```bash
# Update Kubernetes deployment
kubectl set image deployment/ministry-platform \
  app=ministry-platform:v2.0.0 \
  --namespace ministry-platform

# Monitor rollout
kubectl rollout status deployment/ministry-platform \
  --namespace ministry-platform

# Rollback if needed
kubectl rollout undo deployment/ministry-platform \
  --namespace ministry-platform
```

### 3. Canary Deployment

```bash
# Deploy canary version
kubectl apply -f k8s/canary/

# Monitor metrics
kubectl get pods -l version=canary

# Gradually increase traffic
kubectl patch service ministry-platform \
  -p '{"spec":{"selector":{"version":"canary"}}}'

# Promote to production
kubectl apply -f k8s/production/
```

## Monitoring and Logging

### Health Checks

```bash
# Application health
curl http://localhost:3000/api/health

# Database health
curl http://localhost:3000/api/health/db

# Redis health
curl http://localhost:3000/api/health/redis
```

### Log Management

```bash
# View application logs
docker-compose logs -f app

# View database logs
docker-compose logs -f db

# View Redis logs
docker-compose logs -f redis

# Centralized logging with ELK stack
docker-compose -f docker-compose.logging.yml up -d
```

### Metrics Collection

```bash
# Start monitoring stack
./scripts/start-monitoring.sh

# Access Grafana
open http://localhost:3001

# Access Prometheus
open http://localhost:9090
```

## Security Considerations

### 1. Network Security

- Use VPCs and security groups
- Implement WAF (Web Application Firewall)
- Enable DDoS protection
- Use private subnets for databases

### 2. Application Security

- Enable HTTPS/TLS
- Implement rate limiting
- Use secure headers
- Regular security updates

### 3. Data Security

- Encrypt data at rest
- Encrypt data in transit
- Implement field-level encryption
- Regular security audits

### 4. Access Control

- Use strong authentication
- Implement MFA
- Role-based access control
- Regular access reviews

## Backup and Recovery

### Database Backup

```bash
# Create backup
pg_dump -h localhost -U ministry_user ministry_platform > backup.sql

# Restore backup
psql -h localhost -U ministry_user ministry_platform < backup.sql

# Automated backup script
./scripts/backup.sh
```

### File Backup

```bash
# Backup uploads
tar -czf uploads-backup.tar.gz uploads/

# Backup configuration
tar -czf config-backup.tar.gz .env docker-compose.yml
```

### Disaster Recovery

```bash
# Full system backup
./scripts/full-backup.sh

# Restore from backup
./scripts/restore.sh backup-2024-01-01.tar.gz
```

## Scaling

### Horizontal Scaling

```bash
# Scale application instances
kubectl scale deployment ministry-platform --replicas=5

# Scale database read replicas
kubectl scale deployment postgres-replica --replicas=3

# Scale Redis cluster
kubectl scale deployment redis-cluster --replicas=6
```

### Vertical Scaling

```bash
# Increase resource limits
kubectl patch deployment ministry-platform \
  -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","resources":{"limits":{"memory":"2Gi","cpu":"1000m"}}}]}}}}'
```

### Load Balancing

```yaml
# nginx.conf
upstream ministry_platform {
    server app1:3000;
    server app2:3000;
    server app3:3000;
}

server {
    location / {
        proxy_pass http://ministry_platform;
    }
}
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   systemctl status postgresql
   
   # Check connection
   psql -h localhost -U ministry_user -d ministry_platform
   ```

2. **Redis Connection Failed**
   ```bash
   # Check Redis status
   systemctl status redis
   
   # Test connection
   redis-cli ping
   ```

3. **Application Won't Start**
   ```bash
   # Check logs
   docker-compose logs app
   
   # Check environment variables
   docker-compose exec app env
   ```

4. **High Memory Usage**
   ```bash
   # Check memory usage
   docker stats
   
   # Restart application
   docker-compose restart app
   ```

### Performance Issues

1. **Slow Database Queries**
   ```sql
   -- Check slow queries
   SELECT query, mean_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_time DESC;
   ```

2. **High CPU Usage**
   ```bash
   # Check CPU usage
   top
   
   # Check application metrics
   curl http://localhost:3000/api/health/metrics
   ```

3. **Memory Leaks**
   ```bash
   # Monitor memory usage
   docker stats --no-stream
   
   # Check heap dumps
   docker-compose exec app node --inspect=0.0.0.0:9229
   ```

## Maintenance

### Regular Tasks

1. **Daily**
   - Check system health
   - Monitor logs
   - Verify backups

2. **Weekly**
   - Update dependencies
   - Review security logs
   - Performance analysis

3. **Monthly**
   - Security updates
   - Capacity planning
   - Disaster recovery testing

### Updates

```bash
# Update application
git pull origin main
npm install
npm run build
docker-compose up -d --build

# Update dependencies
npm audit fix
npm update

# Database migrations
npm run db:migrate
```

## Support

### Getting Help

1. **Documentation**: Check this guide and API docs
2. **Logs**: Review application and system logs
3. **Monitoring**: Check Grafana dashboards
4. **Issues**: Create GitHub issue with details

### Emergency Contacts

- **System Administrator**: admin@ministry-platform.gov.sy
- **Database Administrator**: dba@ministry-platform.gov.sy
- **Security Team**: security@ministry-platform.gov.sy

### Escalation Procedures

1. **Level 1**: Check logs and documentation
2. **Level 2**: Contact system administrator
3. **Level 3**: Escalate to development team
4. **Level 4**: Contact vendor support
