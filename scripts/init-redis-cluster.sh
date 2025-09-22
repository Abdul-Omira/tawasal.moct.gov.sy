#!/bin/bash

# Redis Cluster Initialization Script
# This script initializes a Redis cluster with 3 nodes

set -e

echo "Initializing Redis Cluster..."

# Wait for Redis nodes to be ready
echo "Waiting for Redis nodes to be ready..."
sleep 10

# Get the IP addresses of the Redis nodes
REDIS_NODE1_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' moct-redis-node1)
REDIS_NODE2_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' moct-redis-node2)
REDIS_NODE3_IP=$(docker inspect -f '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}' moct-redis-node3)

echo "Redis Node 1 IP: $REDIS_NODE1_IP"
echo "Redis Node 2 IP: $REDIS_NODE2_IP"
echo "Redis Node 3 IP: $REDIS_NODE3_IP"

# Create the cluster
echo "Creating Redis cluster..."
docker exec moct-redis-node1 redis-cli --cluster create \
  $REDIS_NODE1_IP:7000 \
  $REDIS_NODE2_IP:7000 \
  $REDIS_NODE3_IP:7000 \
  --cluster-replicas 0 \
  --cluster-yes

echo "Redis cluster initialized successfully!"

# Verify cluster status
echo "Verifying cluster status..."
docker exec moct-redis-node1 redis-cli cluster nodes

echo "Redis cluster setup complete!"
