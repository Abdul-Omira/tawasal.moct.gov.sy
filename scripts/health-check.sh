#!/bin/bash

# Health Check Script for Ministry Platform
# This script checks the health of all services

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}Ministry Platform Health Check${NC}"
echo -e "================================"

# Check Docker services
echo -e "\n${YELLOW}Checking Docker services...${NC}"
if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✓ Docker services are running${NC}"
else
    echo -e "${RED}✗ Some Docker services are not running${NC}"
    exit 1
fi

# Check application health
echo -e "\n${YELLOW}Checking application health...${NC}"
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy${NC}"
else
    echo -e "${RED}✗ Application health check failed${NC}"
fi

# Check database connectivity
echo -e "\n${YELLOW}Checking database connectivity...${NC}"
if docker-compose exec -T db pg_isready -U postgres -d ministry_communication > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Database is accessible${NC}"
else
    echo -e "${RED}✗ Database is not accessible${NC}"
fi

# Check Redis connectivity
echo -e "\n${YELLOW}Checking Redis connectivity...${NC}"
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Redis is accessible${NC}"
else
    echo -e "${RED}✗ Redis is not accessible${NC}"
fi

# Check monitoring services
echo -e "\n${YELLOW}Checking monitoring services...${NC}"
if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Prometheus is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Prometheus is not accessible (may not be running)${NC}"
fi

if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Grafana is healthy${NC}"
else
    echo -e "${YELLOW}⚠ Grafana is not accessible (may not be running)${NC}"
fi

# Check disk space
echo -e "\n${YELLOW}Checking disk space...${NC}"
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓ Disk usage is healthy (${DISK_USAGE}%)${NC}"
else
    echo -e "${RED}✗ Disk usage is high (${DISK_USAGE}%)${NC}"
fi

# Check memory usage
echo -e "\n${YELLOW}Checking memory usage...${NC}"
MEMORY_USAGE=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
if [ "$MEMORY_USAGE" -lt 80 ]; then
    echo -e "${GREEN}✓ Memory usage is healthy (${MEMORY_USAGE}%)${NC}"
else
    echo -e "${RED}✗ Memory usage is high (${MEMORY_USAGE}%)${NC}"
fi

echo -e "\n${GREEN}Health check completed!${NC}"
