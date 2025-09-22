# Ministry Platform Documentation

## Table of Contents

- [Getting Started](./getting-started.md)
- [Architecture](./architecture.md)
- [API Reference](./api-reference.md)
- [Deployment Guide](./deployment.md)
- [Development Guide](./development.md)
- [Testing Guide](./testing.md)
- [Security Guide](./security.md)
- [Troubleshooting](./troubleshooting.md)

## Quick Start

1. **Prerequisites**
   - Node.js 18+
   - PostgreSQL 16+
   - Redis 7+
   - Docker & Docker Compose

2. **Installation**
   ```bash
   git clone <repository-url>
   cd ministry-platform
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:push
   npm run db:migrate
   ```

5. **Start Development**
   ```bash
   npm run dev:all
   ```

6. **Access Application**
   - Frontend: http://localhost:5173
   - Backend: http://localhost:3000
   - Admin: http://localhost:5173/admin

## Default Credentials

- **Admin User**: admin / admin123
- **Database**: ministry_platform / ministry_platform
- **Redis**: localhost:6379

## Features

### Core Features
- ✅ Dynamic Form Builder
- ✅ Multi-step Forms
- ✅ Conditional Logic
- ✅ Template System
- ✅ Form Publishing
- ✅ Analytics Dashboard
- ✅ Multi-tenant Architecture
- ✅ Role-Based Access Control
- ✅ Multi-Factor Authentication
- ✅ Audit Logging
- ✅ Field-Level Encryption

### Enterprise Features
- ✅ API Gateway
- ✅ Webhook System
- ✅ SSO Integration
- ✅ White-label Support
- ✅ Multi-language Support
- ✅ Performance Monitoring
- ✅ Security Monitoring
- ✅ Reporting System

### DevOps Features
- ✅ Docker Containerization
- ✅ Kubernetes Deployment
- ✅ CI/CD Pipeline
- ✅ Monitoring & Alerting
- ✅ Load Testing
- ✅ Security Scanning

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting guide
- Review the API documentation
