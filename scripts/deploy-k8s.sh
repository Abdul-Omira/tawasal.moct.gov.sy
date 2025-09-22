#!/bin/bash

# Kubernetes Deployment Script for Ministry Platform
# This script handles the complete deployment of the platform on Kubernetes

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE=${1:-ministry-platform}
ENVIRONMENT=${2:-production}
CHART_PATH=${3:-./k8s/helm-charts/ministry-platform}

echo -e "${GREEN}Starting Ministry Platform Kubernetes Deployment...${NC}"
echo -e "Namespace: ${YELLOW}$NAMESPACE${NC}"
echo -e "Environment: ${YELLOW}$ENVIRONMENT${NC}"
echo -e "Chart Path: ${YELLOW}$CHART_PATH${NC}"

# Check if kubectl is available
if ! command -v kubectl > /dev/null 2>&1; then
    echo -e "${RED}Error: kubectl is not installed. Please install kubectl and try again.${NC}"
    exit 1
fi

# Check if helm is available
if ! command -v helm > /dev/null 2>&1; then
    echo -e "${RED}Error: Helm is not installed. Please install Helm and try again.${NC}"
    exit 1
fi

# Check if kubectl can connect to cluster
if ! kubectl cluster-info > /dev/null 2>&1; then
    echo -e "${RED}Error: Cannot connect to Kubernetes cluster. Please check your kubeconfig.${NC}"
    exit 1
fi

# Create namespace if it doesn't exist
echo -e "${YELLOW}Creating namespace...${NC}"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Create secrets if they don't exist
echo -e "${YELLOW}Creating secrets...${NC}"
if ! kubectl get secret ministry-platform-secrets -n $NAMESPACE > /dev/null 2>&1; then
    kubectl create secret generic ministry-platform-secrets \
        --from-literal=DB_PASSWORD=$(openssl rand -base64 32) \
        --from-literal=REDIS_PASSWORD=$(openssl rand -base64 32) \
        --from-literal=SESSION_SECRET=$(openssl rand -base64 64) \
        --from-literal=JWT_SECRET=$(openssl rand -base64 64) \
        --from-literal=FILE_ACCESS_SECRET=$(openssl rand -base64 64) \
        --from-literal=ADMIN_PASSWORD=$(openssl rand -base64 16) \
        --from-literal=EMPLOYEE_PASSWORD=$(openssl rand -base64 16) \
        --from-literal=GRAFANA_PASSWORD=$(openssl rand -base64 16) \
        -n $NAMESPACE
    echo -e "${GREEN}✓ Secrets created${NC}"
else
    echo -e "${GREEN}✓ Secrets already exist${NC}"
fi

# Add Helm repositories
echo -e "${YELLOW}Adding Helm repositories...${NC}"
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Deploy PostgreSQL
echo -e "${YELLOW}Deploying PostgreSQL...${NC}"
helm upgrade --install postgresql bitnami/postgresql \
    --namespace $NAMESPACE \
    --set auth.postgresPassword=$(kubectl get secret ministry-platform-secrets -n $NAMESPACE -o jsonpath="{.data.DB_PASSWORD}" | base64 -d) \
    --set auth.database=ministry_communication \
    --set primary.persistence.size=10Gi \
    --set primary.resources.limits.cpu=500m \
    --set primary.resources.limits.memory=1Gi \
    --set primary.resources.requests.cpu=250m \
    --set primary.resources.requests.memory=512Mi

# Deploy Redis
echo -e "${YELLOW}Deploying Redis...${NC}"
helm upgrade --install redis bitnami/redis \
    --namespace $NAMESPACE \
    --set auth.enabled=true \
    --set auth.password=$(kubectl get secret ministry-platform-secrets -n $NAMESPACE -o jsonpath="{.data.REDIS_PASSWORD}" | base64 -d) \
    --set master.persistence.size=5Gi \
    --set master.resources.limits.cpu=200m \
    --set master.resources.limits.memory=512Mi \
    --set master.resources.requests.cpu=100m \
    --set master.resources.requests.memory=256Mi

# Deploy Prometheus
echo -e "${YELLOW}Deploying Prometheus...${NC}"
helm upgrade --install prometheus prometheus-community/prometheus \
    --namespace $NAMESPACE \
    --set server.persistentVolume.enabled=true \
    --set server.persistentVolume.size=10Gi \
    --set server.resources.limits.cpu=500m \
    --set server.resources.limits.memory=1Gi \
    --set server.resources.requests.cpu=250m \
    --set server.resources.requests.memory=512Mi

# Deploy Grafana
echo -e "${YELLOW}Deploying Grafana...${NC}"
helm upgrade --install grafana grafana/grafana \
    --namespace $NAMESPACE \
    --set adminPassword=$(kubectl get secret ministry-platform-secrets -n $NAMESPACE -o jsonpath="{.data.GRAFANA_PASSWORD}" | base64 -d) \
    --set persistence.enabled=true \
    --set persistence.size=5Gi \
    --set resources.limits.cpu=500m \
    --set resources.limits.memory=1Gi \
    --set resources.requests.cpu=250m \
    --set resources.requests.memory=512Mi

# Deploy the main application
echo -e "${YELLOW}Deploying Ministry Platform...${NC}"
helm upgrade --install ministry-platform $CHART_PATH \
    --namespace $NAMESPACE \
    --set image.tag=latest \
    --set replicaCount=3 \
    --set autoscaling.enabled=true \
    --set autoscaling.minReplicas=3 \
    --set autoscaling.maxReplicas=10 \
    --set autoscaling.targetCPUUtilizationPercentage=70 \
    --set autoscaling.targetMemoryUtilizationPercentage=80 \
    --set persistence.enabled=true \
    --set persistence.size=10Gi \
    --set postgresql.enabled=false \
    --set redis.enabled=false \
    --set monitoring.prometheus.enabled=false \
    --set monitoring.grafana.enabled=false \
    --set istio.enabled=true

# Wait for deployments to be ready
echo -e "${YELLOW}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/ministry-platform -n $NAMESPACE

# Check deployment status
echo -e "${YELLOW}Checking deployment status...${NC}"
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE

echo -e "${GREEN}Kubernetes deployment completed successfully!${NC}"
echo -e "${YELLOW}Access the application at: http://localhost:80${NC}"
echo -e "${YELLOW}Access Grafana at: http://localhost:3000${NC}"
echo -e "${YELLOW}Access Prometheus at: http://localhost:9090${NC}"

# Display credentials
echo -e "${GREEN}Admin Credentials:${NC}"
echo -e "Username: ${YELLOW}admin${NC}"
echo -e "Password: ${YELLOW}$(kubectl get secret ministry-platform-secrets -n $NAMESPACE -o jsonpath="{.data.ADMIN_PASSWORD}" | base64 -d)${NC}"
echo -e ""
echo -e "${GREEN}Grafana Credentials:${NC}"
echo -e "Username: ${YELLOW}admin${NC}"
echo -e "Password: ${YELLOW}$(kubectl get secret ministry-platform-secrets -n $NAMESPACE -o jsonpath="{.data.GRAFANA_PASSWORD}" | base64 -d)${NC}"
