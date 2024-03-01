#!/bin/bash

# Simple Server Connectivity Test
echo "🔍 Testing server connectivity..."

SERVER_IP="185.216.134.96"
SERVER_USER="root"
SERVER_PASS="YourPassword123!"

# Test 1: Ping test
echo "📡 Testing ping connectivity..."
if ping -c 3 $SERVER_IP > /dev/null 2>&1; then
    echo "✅ Server is reachable via ping"
else
    echo "❌ Server is not reachable via ping"
    echo "   This could mean:"
    echo "   - Server is down"
    echo "   - Network connectivity issues"
    echo "   - Firewall blocking ICMP"
fi

# Test 2: SSH connectivity
echo ""
echo "🔐 Testing SSH connectivity..."
if timeout 10 sshpass -p "$SERVER_PASS" ssh -o ConnectTimeout=5 $SERVER_USER@$SERVER_IP "echo 'SSH connection successful'" 2>/dev/null; then
    echo "✅ SSH connection successful"
    
    # Test 3: Basic server status
    echo ""
    echo "📊 Getting server status..."
    sshpass -p "$SERVER_PASS" ssh $SERVER_USER@$SERVER_IP << 'EOF'
        echo "=== System Status ==="
        uptime
        echo ""
        echo "=== Disk Usage ==="
        df -h | head -5
        echo ""
        echo "=== Memory Usage ==="
        free -h
        echo ""
        echo "=== PM2 Status ==="
        pm2 status
        echo ""
        echo "=== Nginx Status ==="
        systemctl status nginx --no-pager -l | head -10
EOF
else
    echo "❌ SSH connection failed"
    echo "   This could mean:"
    echo "   - SSH service is down"
    echo "   - Wrong credentials"
    echo "   - Firewall blocking SSH (port 22)"
    echo "   - Server is in maintenance mode"
fi

echo ""
echo "🎯 Next steps:"
echo "   If server is accessible, run: ./safe-deploy-fix.sh"
echo "   If server is not accessible, wait and try again later" 