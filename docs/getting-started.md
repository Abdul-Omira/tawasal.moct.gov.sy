# Getting Started

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** 18.0.0 or higher
- **PostgreSQL** 16.0 or higher
- **Redis** 7.0 or higher
- **Docker** and **Docker Compose** (optional, for containerized setup)
- **Git** for version control

## Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd ministry-platform
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
# Database
DATABASE_URL=postgresql://username:password@localhost:5432/ministry_platform
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/ministry_platform_test

# Redis
REDIS_URL=redis://localhost:6379
TEST_REDIS_URL=redis://localhost:6379/1

# JWT
JWT_SECRET=your-super-secret-jwt-key

# Email
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@ministry-platform.gov.sy

# Application
NODE_ENV=development
PORT=3000
CLIENT_URL=http://localhost:5173
```

### 4. Database Setup

Create the database and run migrations:

```bash
# Create database
createdb ministry_platform

# Run migrations
npm run db:push
npm run db:migrate
```

### 5. Start the Application

#### Development Mode

```bash
# Start both frontend and backend
npm run dev:all

# Or start them separately
npm run dev:server  # Backend only
npm run dev:client  # Frontend only
```

#### Production Mode

```bash
# Build the application
npm run build

# Start production server
npm start
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Admin Dashboard**: http://localhost:5173/admin
- **API Documentation**: http://localhost:3000/api/docs

## Default Credentials

After the first setup, you can log in with:

- **Username**: admin
- **Password**: admin123

**Important**: Change these credentials immediately after first login!

## Docker Setup (Alternative)

If you prefer using Docker:

### 1. Start Services

```bash
docker-compose up -d
```

### 2. Run Migrations

```bash
docker-compose exec app npm run db:migrate
```

### 3. Access Application

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## Verification

### 1. Health Check

Visit http://localhost:3000/api/health to verify the backend is running.

### 2. Database Connection

Check database connectivity at http://localhost:3000/api/health/db.

### 3. Redis Connection

Check Redis connectivity at http://localhost:3000/api/health/redis.

## Next Steps

1. **Configure Authentication**: Set up MFA and SSO
2. **Create Ministries**: Add your organization structure
3. **Set Up Roles**: Configure user permissions
4. **Build Forms**: Start creating your first forms
5. **Configure Analytics**: Set up monitoring and reporting

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill process using port 3000
   lsof -ti:3000 | xargs kill -9
   ```

2. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify DATABASE_URL in .env
   - Ensure database exists

3. **Redis Connection Failed**
   - Check Redis is running
   - Verify REDIS_URL in .env

4. **Build Errors**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Getting Help

- Check the [Troubleshooting Guide](./troubleshooting.md)
- Review the [API Documentation](./api-reference.md)
- Create an issue in the repository
