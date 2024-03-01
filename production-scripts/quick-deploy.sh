#!/bin/bash

# Quick Deploy Script for MOTCSY Security Fix
# Run this when server is accessible

echo "🚀 Quick Deploy - MOTCSY Security Fix"
echo "======================================"

SERVER_IP="185.216.134.96"
SERVER_USER="root"
SERVER_PASS="YourPassword123!"

# Check connectivity
echo "📡 Checking server connectivity..."
if ! ping -c 1 $SERVER_IP > /dev/null 2>&1; then
    echo "❌ Server not reachable. Please try again later."
    exit 1
fi

echo "✅ Server is reachable"

# Deploy the fix
echo "🔧 Deploying security fix..."

# Upload the fixed file
sshpass -p "$SERVER_PASS" scp server/storage.ts $SERVER_USER@$SERVER_IP:/root/MOTCSY/server/storage.ts

# Restart the application
sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_IP << 'EOF'
    cd /root/MOTCSY
    
    # Create backup
    cp server/storage.ts server/storage.ts.backup.$(date +"%Y-%m-%d_%H-%M-%S")
    echo "✅ Backup created"
    
    # Restart application
    pm2 restart ministry-app
    echo "✅ Application restarted"
    
    # Check status
    sleep 3
    pm2 status
EOF

echo "✅ Deployment completed!"
echo ""
echo "🔍 To verify the fix:"
echo "   1. Submit a test message at https://185.216.134.96"
echo "   2. Check database for IP recording"
echo "   3. Monitor logs for any issues"
echo ""
echo "📊 Check database:"
echo "   sshpass -p 'YourPassword123!' ssh root@185.216.134.96"
echo "   psql -U postgres -d ministry_db -c \"SELECT id, name, email, \\\"ipAddress\\\", \\\"userAgent\\\", created_at FROM citizen_communications ORDER BY created_at DESC LIMIT 5;\""