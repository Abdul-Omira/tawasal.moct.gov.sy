#!/bin/bash

# Syrian Ministry of Communications Platform - Deployment Script
# Author: Abdulwahab Omira
# Version: 1.0.0

set -e

echo "🇸🇾 Syrian Ministry of Communications Platform Deployment"
echo "========================================================"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   echo -e "${RED}This script should not be run as root!${NC}"
   exit 1
fi

# Check required tools
echo -e "${YELLOW}Checking required tools...${NC}"
command -v docker >/dev/null 2>&1 || { echo -e "${RED}Docker is required but not installed. Aborting.${NC}" >&2; exit 1; }
command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}Docker Compose is required but not installed. Aborting.${NC}" >&2; exit 1; }

# Deployment options
echo ""
echo "Select deployment option:"
echo "1) Local Development (localhost)"
echo "2) Production Server (with SSL)"
echo "3) Cloud Deployment (DigitalOcean, AWS, etc.)"
read -p "Enter your choice (1-3): " choice

case $choice in
    1)
        echo -e "${GREEN}Deploying for Local Development...${NC}"
        COMPOSE_FILE="docker-compose.yml"
        ENV_FILE=".env"
        ;;
    2)
        echo -e "${GREEN}Deploying for Production Server...${NC}"
        COMPOSE_FILE="docker-compose.production.yml"
        ENV_FILE=".env.production"
        
        # Check SSL certificates
        if [ ! -d "./ssl" ]; then
            echo -e "${YELLOW}SSL certificates not found. Creating self-signed certificates...${NC}"
            mkdir -p ssl
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ssl/private.key \
                -out ssl/certificate.crt \
                -subj "/C=SY/ST=Damascus/L=Damascus/O=Ministry of Communications/CN=tawasal.moct.gov.sy"
        fi
        ;;
    3)
        echo -e "${GREEN}Preparing for Cloud Deployment...${NC}"
        echo ""
        echo "Cloud deployment instructions:"
        echo "1. Create a VPS (Ubuntu 22.04 recommended)"
        echo "2. Install Docker and Docker Compose"
        echo "3. Clone this repository"
        echo "4. Run this script on the server"
        echo ""
        echo "Recommended cloud providers:"
        echo "- DigitalOcean: $20/month droplet"
        echo "- AWS EC2: t3.small instance"
        echo "- Linode: 4GB plan"
        echo ""
        read -p "Press enter to continue with local build for cloud..."
        COMPOSE_FILE="docker-compose.production.yml"
        ENV_FILE=".env.production"
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

# Check environment file
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Environment file $ENV_FILE not found!${NC}"
    echo "Creating from example..."
    cp .env.example "$ENV_FILE"
    echo -e "${YELLOW}Please edit $ENV_FILE with your production values${NC}"
    exit 1
fi

# Create necessary directories
echo -e "${YELLOW}Creating necessary directories...${NC}"
mkdir -p uploads logs backups ssl

# Build and start services
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f "$COMPOSE_FILE" build

echo -e "${YELLOW}Starting services...${NC}"
docker-compose -f "$COMPOSE_FILE" up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check service health
echo -e "${YELLOW}Checking service health...${NC}"
docker-compose -f "$COMPOSE_FILE" ps

# Show access information
echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo "========================================"
echo "Access your application:"
if [ "$choice" == "1" ]; then
    echo "🌐 Frontend: http://localhost:5000"
    echo "📊 Admin Panel: http://localhost:5000/mgt-system-2025"
else
    echo "🌐 Frontend: https://tawasal.moct.gov.sy"
    echo "📊 Admin Panel: https://tawasal.moct.gov.sy/mgt-system-2025"
fi
echo ""
echo "Login Credentials:"
echo "Admin: admin / Syria@MOCT#2025\$Admin!"
echo "Employee: employee / MOCT@Employee#2025!Secure"
echo ""
echo "Useful commands:"
echo "- View logs: docker-compose -f $COMPOSE_FILE logs -f"
echo "- Stop services: docker-compose -f $COMPOSE_FILE down"
echo "- Backup database: docker-compose -f $COMPOSE_FILE exec db pg_dump -U postgres ministry_communication > backup.sql"
echo ""

# Optional: Show container logs
read -p "Would you like to see the logs? (y/n): " show_logs
if [ "$show_logs" == "y" ]; then
    docker-compose -f "$COMPOSE_FILE" logs -f
fi