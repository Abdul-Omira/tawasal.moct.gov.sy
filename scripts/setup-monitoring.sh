#!/bin/bash

# Ministry Platform Monitoring Setup Script
# This script sets up comprehensive monitoring with Prometheus, Grafana, and log aggregation

set -e

echo "🚀 Setting up Ministry Platform Monitoring..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
    print_error "docker-compose is not installed. Please install docker-compose and try again."
    exit 1
fi

# Create monitoring directories
print_status "Creating monitoring directories..."
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/datasources
mkdir -p monitoring/fluentd
mkdir -p monitoring/elasticsearch/data
mkdir -p monitoring/kibana/data
mkdir -p monitoring/alertmanager
mkdir -p monitoring/prometheus/data
mkdir -p monitoring/prometheus/rules
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p monitoring/grafana/provisioning/alerting

# Set proper permissions
print_status "Setting up permissions..."
chmod 755 monitoring/grafana
chmod 755 monitoring/prometheus
chmod 755 monitoring/elasticsearch
chmod 755 monitoring/kibana
chmod 755 monitoring/fluentd
chmod 755 monitoring/alertmanager

# Copy alerting rules
print_status "Copying alerting rules..."
cp monitoring/alerting-rules.yml monitoring/prometheus/rules/

# Create Prometheus configuration
print_status "Creating Prometheus configuration..."
cat > monitoring/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "rules/*.yml"

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'ministry-platform'
    static_configs:
      - targets: ['app:3000']
    metrics_path: '/api/metrics'
    scrape_interval: 5s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']

  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'fluentd'
    static_configs:
      - targets: ['fluentd:24231']
EOF

# Create Alertmanager configuration
print_status "Creating Alertmanager configuration..."
cat > monitoring/alertmanager/alertmanager.yml << 'EOF'
global:
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@ministry-platform.gov.sy'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'web.hook'

receivers:
  - name: 'web.hook'
    webhook_configs:
      - url: 'http://localhost:5001/'

  - name: 'email'
    email_configs:
      - to: 'admin@ministry-platform.gov.sy'
        subject: 'Ministry Platform Alert: {{ .GroupLabels.alertname }}'
        body: |
          {{ range .Alerts }}
          Alert: {{ .Annotations.summary }}
          Description: {{ .Annotations.description }}
          {{ end }}
EOF

# Create Grafana datasource configuration
print_status "Creating Grafana datasource configuration..."
cat > monitoring/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# Create Grafana dashboard provisioning
print_status "Creating Grafana dashboard provisioning..."
cat > monitoring/grafana/provisioning/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create Elasticsearch configuration
print_status "Creating Elasticsearch configuration..."
cat > monitoring/elasticsearch/elasticsearch.yml << 'EOF'
cluster.name: ministry-platform
node.name: ministry-platform-node
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: false
xpack.monitoring.collection.enabled: true
EOF

# Create Kibana configuration
print_status "Creating Kibana configuration..."
cat > monitoring/kibana/kibana.yml << 'EOF'
server.name: kibana
server.host: 0.0.0.0
elasticsearch.hosts: ["http://elasticsearch:9200"]
xpack.security.enabled: false
xpack.monitoring.ui.container.elasticsearch.enabled: true
EOF

# Create Fluentd Dockerfile
print_status "Creating Fluentd Dockerfile..."
cat > monitoring/fluentd/Dockerfile << 'EOF'
FROM fluent/fluentd:v1.16-debian-1

USER root

RUN gem install fluent-plugin-elasticsearch
RUN gem install fluent-plugin-prometheus

COPY fluent.conf /fluentd/etc/fluent.conf

USER fluent
EOF

# Create monitoring docker-compose
print_status "Creating monitoring docker-compose configuration..."
cat > monitoring/docker-compose.monitoring.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: ministry-platform-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - ./prometheus/rules:/etc/prometheus/rules
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: ministry-platform-grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false
    depends_on:
      - prometheus

  alertmanager:
    image: prom/alertmanager:latest
    container_name: ministry-platform-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - ./alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
      - alertmanager_data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'

  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    container_name: ministry-platform-elasticsearch
    ports:
      - "9200:9200"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
      - ./elasticsearch/elasticsearch.yml:/usr/share/elasticsearch/config/elasticsearch.yml
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    container_name: ministry-platform-kibana
    ports:
      - "5601:5601"
    volumes:
      - ./kibana/kibana.yml:/usr/share/kibana/config/kibana.yml
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    depends_on:
      - elasticsearch

  fluentd:
    build: ./fluentd
    container_name: ministry-platform-fluentd
    ports:
      - "24224:24224"
      - "24231:24231"
    volumes:
      - /var/log/ministry-platform:/var/log/ministry-platform:ro
      - ./fluentd/fluent.conf:/fluentd/etc/fluent.conf
    depends_on:
      - elasticsearch

volumes:
  prometheus_data:
  grafana_data:
  alertmanager_data:
  elasticsearch_data:
EOF

# Create monitoring startup script
print_status "Creating monitoring startup script..."
cat > scripts/start-monitoring.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Ministry Platform Monitoring Stack..."

cd monitoring
docker-compose -f docker-compose.monitoring.yml up -d

echo "✅ Monitoring stack started!"
echo ""
echo "📊 Access URLs:"
echo "  - Grafana: http://localhost:3001 (admin/admin123)"
echo "  - Prometheus: http://localhost:9090"
echo "  - Alertmanager: http://localhost:9093"
echo "  - Kibana: http://localhost:5601"
echo "  - Elasticsearch: http://localhost:9200"
echo ""
echo "🔍 To view logs:"
echo "  docker-compose -f monitoring/docker-compose.monitoring.yml logs -f"
EOF

chmod +x scripts/start-monitoring.sh

# Create monitoring stop script
print_status "Creating monitoring stop script..."
cat > scripts/stop-monitoring.sh << 'EOF'
#!/bin/bash

echo "🛑 Stopping Ministry Platform Monitoring Stack..."

cd monitoring
docker-compose -f docker-compose.monitoring.yml down

echo "✅ Monitoring stack stopped!"
EOF

chmod +x scripts/stop-monitoring.sh

# Create monitoring status script
print_status "Creating monitoring status script..."
cat > scripts/monitoring-status.sh << 'EOF'
#!/bin/bash

echo "📊 Ministry Platform Monitoring Status"
echo "====================================="

cd monitoring

echo ""
echo "🔍 Container Status:"
docker-compose -f docker-compose.monitoring.yml ps

echo ""
echo "🌐 Service URLs:"
echo "  - Grafana: http://localhost:3001"
echo "  - Prometheus: http://localhost:9090"
echo "  - Alertmanager: http://localhost:9093"
echo "  - Kibana: http://localhost:5601"
echo "  - Elasticsearch: http://localhost:9200"

echo ""
echo "📈 Health Checks:"
echo "  - Prometheus: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/api/v1/status/config || echo "DOWN")"
echo "  - Grafana: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/health || echo "DOWN")"
echo "  - Elasticsearch: $(curl -s -o /dev/null -w "%{http_code}" http://localhost:9200/_cluster/health || echo "DOWN")"
EOF

chmod +x scripts/monitoring-status.sh

print_status "✅ Monitoring setup completed!"
print_status ""
print_status "🚀 To start monitoring:"
print_status "  ./scripts/start-monitoring.sh"
print_status ""
print_status "🛑 To stop monitoring:"
print_status "  ./scripts/stop-monitoring.sh"
print_status ""
print_status "📊 To check status:"
print_status "  ./scripts/monitoring-status.sh"
print_status ""
print_status "📋 Next steps:"
print_status "  1. Start the monitoring stack"
print_status "  2. Configure alerting rules in Grafana"
print_status "  3. Set up log shipping from your application"
print_status "  4. Configure notification channels"
