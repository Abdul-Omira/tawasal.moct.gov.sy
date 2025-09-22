#!/bin/bash

# Ministry Platform Deployment Script
# This script handles the complete deployment of the platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
PROFILE=${2:-full}
DATA_PATH=${DATA_PATH:-/opt/moct-data}

echo -e "${GREEN}Starting Ministry Platform Deployment...${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Profile: ${YELLOW}$PROFILE${NC}"
echo -e "Data Path: ${YELLOW}$DATA_PATH${NC}"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker is not running. Please start Docker and try again.${NC}"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    echo -e "${RED}Error: Docker Compose is not installed. Please install Docker Compose and try again.${NC}"
    exit 1
fi

# Create data directories
echo -e "${YELLOW}Creating data directories...${NC}"
sudo mkdir -p $DATA_PATH/{postgres,redis,redis-node1,redis-node2,redis-node3,uploads,secure-uploads,logs,prometheus,grafana}
sudo chown -R 1001:1001 $DATA_PATH

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating environment file...${NC}"
    cat > .env << EOF
# Environment Configuration
NODE_ENV=$ENVIRONMENT
DOCKER_TARGET=production
CONTAINER_PREFIX=moct
RESTART_POLICY=unless-stopped
READ_ONLY=true
DATA_PATH=$DATA_PATH

# Application Configuration
APP_PORT=5000
HTTP_PORT=80
HTTPS_PORT=443

# Database Configuration
DB_PASSWORD=$(openssl rand -base64 32)

# Redis Configuration
REDIS_PASSWORD=$(openssl rand -base64 32)

# Security Configuration
SESSION_SECRET=$(openssl rand -base64 64)
JWT_SECRET=$(openssl rand -base64 64)
FILE_ACCESS_SECRET=$(openssl rand -base64 64)

# Admin Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD=$(openssl rand -base64 16)
ADMIN_NAME=مدير النظام

# Employee Configuration
EMPLOYEE_USERNAME=employee
EMPLOYEE_PASSWORD=$(openssl rand -base64 16)
EMPLOYEE_NAME=موظف من

# Monitoring Configuration
PROMETHEUS_PORT=9090
GRAFANA_PORT=3000
GRAFANA_PASSWORD=$(openssl rand -base64 16)
NODE_EXPORTER_PORT=9100
REDIS_EXPORTER_PORT=9121
POSTGRES_EXPORTER_PORT=9187

# Backup Configuration
BACKUP_SCHEDULE=0 2 * * *

# Mail Configuration
MAILHOG_SMTP_PORT=1025
MAILHOG_WEB_PORT=8025
MAIL_HOSTNAME=mail.moct-platform.local
EOF
    echo -e "${GREEN}Environment file created successfully!${NC}"
    echo -e "${YELLOW}Please review the .env file and update any configuration as needed.${NC}"
fi

# Load environment variables
source .env

# Build the application
echo -e "${YELLOW}Building application...${NC}"
docker-compose build --no-cache

# Start the services
echo -e "${YELLOW}Starting services...${NC}"
docker-compose --profile $PROFILE up -d

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 30

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
docker-compose ps

# Initialize Redis cluster if using cluster profile
if [ "$PROFILE" = "cluster" ] || [ "$PROFILE" = "production" ]; then
    echo -e "${YELLOW}Initializing Redis cluster...${NC}"
    ./scripts/init-redis-cluster.sh
fi

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose exec app npm run migrate

# Create admin user
echo -e "${YELLOW}Creating admin user...${NC}"
docker-compose exec app npm run create-admin

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${YELLOW}Access the application at: http://localhost:${APP_PORT}${NC}"
echo -e "${YELLOW}Access Grafana at: http://localhost:${GRAFANA_PORT}${NC}"
echo -e "${YELLOW}Access Prometheus at: http://localhost:${PROMETHEUS_PORT}${NC}"

# Display credentials
echo -e "${GREEN}Admin Credentials:${NC}"
echo -e "Username: ${YELLOW}$ADMIN_USERNAME${NC}"
echo -e "Password: ${YELLOW}$ADMIN_PASSWORD${NC}"
echo -e ""
echo -e "${GREEN}Grafana Credentials:${NC}"
echo -e "Username: ${YELLOW}admin${NC}"
echo -e "Password: ${YELLOW}$GRAFANA_PASSWORD${NC}"
