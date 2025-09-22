#!/bin/bash

# Backup Script for Ministry Platform
# This script creates backups of the database and application data

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
BACKUP_DIR=${BACKUP_DIR:-./backups}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="ministry_platform_backup_$TIMESTAMP"

echo -e "${GREEN}Ministry Platform Backup${NC}"
echo -e "========================"

# Create backup directory
mkdir -p $BACKUP_DIR/$BACKUP_NAME

# Database backup
echo -e "\n${YELLOW}Creating database backup...${NC}"
docker-compose exec -T db pg_dump -U postgres -d ministry_communication > $BACKUP_DIR/$BACKUP_NAME/database.sql
echo -e "${GREEN}✓ Database backup created${NC}"

# Redis backup
echo -e "\n${YELLOW}Creating Redis backup...${NC}"
docker-compose exec -T redis redis-cli --rdb /data/dump.rdb
docker cp moct-redis:/data/dump.rdb $BACKUP_DIR/$BACKUP_NAME/redis.rdb
echo -e "${GREEN}✓ Redis backup created${NC}"

# Application data backup
echo -e "\n${YELLOW}Creating application data backup...${NC}"
docker-compose exec -T app tar -czf /tmp/app_data.tar.gz /app/uploads /app/logs
docker cp moct-app:/tmp/app_data.tar.gz $BACKUP_DIR/$BACKUP_NAME/app_data.tar.gz
echo -e "${GREEN}✓ Application data backup created${NC}"

# Configuration backup
echo -e "\n${YELLOW}Creating configuration backup...${NC}"
cp -r . $BACKUP_DIR/$BACKUP_NAME/config/ 2>/dev/null || true
echo -e "${GREEN}✓ Configuration backup created${NC}"

# Create backup manifest
echo -e "\n${YELLOW}Creating backup manifest...${NC}"
cat > $BACKUP_DIR/$BACKUP_NAME/manifest.json << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$TIMESTAMP",
  "date": "$(date -Iseconds)",
  "version": "1.0.0",
  "components": {
    "database": "database.sql",
    "redis": "redis.rdb",
    "app_data": "app_data.tar.gz",
    "config": "config/"
  },
  "size": "$(du -sh $BACKUP_DIR/$BACKUP_NAME | cut -f1)"
}
EOF
echo -e "${GREEN}✓ Backup manifest created${NC}"

# Compress backup
echo -e "\n${YELLOW}Compressing backup...${NC}"
cd $BACKUP_DIR
tar -czf ${BACKUP_NAME}.tar.gz $BACKUP_NAME
rm -rf $BACKUP_NAME
echo -e "${GREEN}✓ Backup compressed${NC}"

echo -e "\n${GREEN}Backup completed successfully!${NC}"
echo -e "Backup file: ${YELLOW}$BACKUP_DIR/${BACKUP_NAME}.tar.gz${NC}"
echo -e "Size: ${YELLOW}$(du -sh $BACKUP_DIR/${BACKUP_NAME}.tar.gz | cut -f1)${NC}"
