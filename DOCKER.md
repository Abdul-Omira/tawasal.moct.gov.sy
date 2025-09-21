# Docker Configuration Guide

## Overview

This project uses a smart Docker Compose configuration that supports both development and production environments through profiles and override files.

## Files Structure

- `Dockerfile` - Multi-stage build configuration
- `docker-compose.yml` - Base configuration with all services
- `docker-compose.override.yml` - Development overrides (auto-loaded)
- `docker-compose.prod.yml` - Production overrides
- `docker-compose-mail.yml` - Mail server configuration (legacy)

## Quick Start

### Development
```bash
# Start development environment
docker-compose up

# Start with mail service
docker-compose --profile mail up

# Start specific services
docker-compose up app db redis
```

### Production
```bash
# Start production environment
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Start with mail server
docker-compose -f docker-compose.yml -f docker-compose.prod.yml --profile mail up -d
```

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DB_PASSWORD=your_strong_password
SESSION_SECRET=your_session_secret
JWT_SECRET=your_jwt_secret
FILE_ACCESS_SECRET=your_file_access_secret

# Admin Credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your_admin_password
ADMIN_NAME=مدير النظام
EMPLOYEE_USERNAME=employee
EMPLOYEE_PASSWORD=your_employee_password
EMPLOYEE_NAME=موظف من

# Redis
REDIS_PASSWORD=your_redis_password

# Optional
CONTAINER_PREFIX=moct
DATA_PATH=/opt/moct-data
```

## Services

### Core Services (Always Running)
- **app** - Main application
- **db** - PostgreSQL database
- **redis** - Redis cache and session store

### Development Services
- **mailhog** - Mail testing (port 8025)

### Production Services
- **nginx** - Reverse proxy with SSL
- **db-backup** - Automated database backups
- **log-aggregator** - Log collection
- **security-monitor** - Security monitoring
- **mailserver** - Production mail server

## Profiles

### Development Profile
```bash
docker-compose --profile development up
```

### Production Profile
```bash
docker-compose --profile production up
```

### Mail Profile
```bash
docker-compose --profile mail up
```

### Full Profile (All Services)
```bash
docker-compose --profile full up
```

## Ports

### Development
- App: http://localhost:3000
- Database: localhost:5432
- Redis: localhost:6379
- MailHog: http://localhost:8025

### Production
- HTTP: http://localhost:80
- HTTPS: https://localhost:443
- App (internal): localhost:5000

## Data Persistence

All data is stored in named volumes:
- `postgres_data` - Database data
- `redis_data` - Redis data
- `app_uploads` - File uploads
- `secure_uploads` - Secure file storage
- `app_logs` - Application logs

## Security Features

- Non-root user execution
- Read-only filesystem (production)
- Security headers
- Rate limiting
- Input validation
- File upload scanning

## Backup and Recovery

### Manual Backup
```bash
docker-compose exec db pg_dump -U postgres ministry_communication > backup.sql
```

### Restore
```bash
docker-compose exec -T db psql -U postgres ministry_communication < backup.sql
```

### Automated Backups
Backups run automatically via cron in production mode.

## Monitoring

### Health Checks
All services include health checks:
```bash
docker-compose ps
```

### Logs
```bash
# All services
docker-compose logs

# Specific service
docker-compose logs app

# Follow logs
docker-compose logs -f app
```

## Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in `.env` file
2. **Permission issues**: Check volume mounts and user permissions
3. **Database connection**: Ensure database is healthy before starting app
4. **Memory issues**: Increase Docker memory limits

### Reset Everything
```bash
docker-compose down -v
docker system prune -a
docker-compose up --build
```

## Migration from Multiple Files

The old separate Docker files have been consolidated:
- `docker-compose.yml` (old) → `docker-compose.override.yml`
- `docker-compose.production.yml` → `docker-compose.prod.yml`
- `docker-compose-mail.yml` → Integrated into main compose file

## Best Practices

1. Always use environment variables for secrets
2. Run production with read-only filesystem
3. Monitor logs regularly
4. Keep backups up to date
5. Use specific image tags in production
6. Regularly update base images
