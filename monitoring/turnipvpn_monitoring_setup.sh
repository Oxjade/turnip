#!/bin/bash
# TurnipVPN - Prometheus + Grafana + StrongSwan Monitoring Setup
# Run this on your Netherlands VPS as root
# ============================================================

echo "======================================"
echo " TurnipVPN Monitoring Stack Installer"
echo "======================================"

# ============================================================
# STEP 1 — Install Prometheus
# ============================================================
echo "[1/6] Installing Prometheus..."

apt update -y
apt install -y prometheus

# Configure Prometheus
cat > /etc/prometheus/prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:

  # System metrics (CPU, RAM, Disk, Network)
  - job_name: 'node'
    static_configs:
      - targets: ['localhost:9100']
        labels:
          instance: 'turnipvpn-nl'
          region: 'netherlands'

  # StrongSwan VPN metrics
  - job_name: 'strongswan'
    static_configs:
      - targets: ['localhost:9903']
        labels:
          instance: 'turnipvpn-nl'

  # Prometheus itself
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
EOF

systemctl enable prometheus
systemctl restart prometheus
echo "[1/6] Prometheus installed ✓"


# ============================================================
# STEP 2 — Install Node Exporter (system metrics)
# ============================================================
echo "[2/6] Installing Node Exporter..."

apt install -y prometheus-node-exporter
systemctl enable prometheus-node-exporter
systemctl restart prometheus-node-exporter
echo "[2/6] Node Exporter installed ✓"


# ============================================================
# STEP 3 — Install StrongSwan Exporter (VPN metrics)
# ============================================================
echo "[3/6] Installing StrongSwan Prometheus Exporter..."

apt install -y python3-pip python3-venv -y

# Create dedicated user and directory
useradd --no-create-home --shell /bin/false strongswan-exporter 2>/dev/null || true
mkdir -p /opt/strongswan-exporter

# Install the exporter
pip3 install prometheus-client --break-system-packages 2>/dev/null || pip3 install prometheus-client

# Write the exporter script
cat > /opt/strongswan-exporter/exporter.py << 'PYEOF'
#!/usr/bin/env python3
"""
TurnipVPN StrongSwan Prometheus Exporter
Exposes VPN metrics: active tunnels, bytes in/out, SA count
"""

import subprocess
import time
import re
from prometheus_client import start_http_server, Gauge, Counter

# Metrics
ACTIVE_TUNNELS = Gauge('strongswan_active_tunnels', 'Number of active IKEv2 tunnels')
ACTIVE_USERS   = Gauge('strongswan_active_users', 'Number of connected users')
BYTES_IN       = Gauge('strongswan_bytes_in_total', 'Total bytes received through VPN')
BYTES_OUT      = Gauge('strongswan_bytes_out_total', 'Total bytes sent through VPN')
SA_COUNT       = Gauge('strongswan_security_associations', 'Total security associations')
UPTIME_SECONDS = Gauge('strongswan_uptime_seconds', 'StrongSwan daemon uptime in seconds')

def parse_ipsec_status():
    try:
        result = subprocess.run(
            ['ipsec', 'statusall'],
            capture_output=True, text=True, timeout=10
        )
        output = result.stdout

        # Count ESTABLISHED tunnels
        tunnels = len(re.findall(r'ESTABLISHED', output))
        ACTIVE_TUNNELS.set(tunnels)
        ACTIVE_USERS.set(tunnels)

        # Count Security Associations
        sa_match = re.search(r'(\d+) up,', output)
        if sa_match:
            SA_COUNT.set(int(sa_match.group(1)))

        # Parse bytes in/out
        bytes_in_total  = 0
        bytes_out_total = 0
        for match in re.finditer(r'(\d+) bytes_i.*?(\d+) bytes_o', output):
            bytes_in_total  += int(match.group(1))
            bytes_out_total += int(match.group(2))
        BYTES_IN.set(bytes_in_total)
        BYTES_OUT.set(bytes_out_total)

    except Exception as e:
        print(f"Error parsing ipsec status: {e}")

def parse_uptime():
    try:
        result = subprocess.run(
            ['systemctl', 'show', 'strongswan-starter', '--property=ActiveEnterTimestamp'],
            capture_output=True, text=True
        )
        # Simple uptime from /proc/uptime as fallback
        with open('/proc/uptime', 'r') as f:
            uptime = float(f.read().split()[0])
            UPTIME_SECONDS.set(uptime)
    except Exception as e:
        print(f"Error parsing uptime: {e}")

if __name__ == '__main__':
    print("TurnipVPN StrongSwan Exporter starting on port 9903...")
    start_http_server(9903)
    while True:
        parse_ipsec_status()
        parse_uptime()
        time.sleep(15)
PYEOF

chmod +x /opt/strongswan-exporter/exporter.py

# Create systemd service for the exporter
cat > /etc/systemd/system/strongswan-exporter.service << 'EOF'
[Unit]
Description=TurnipVPN StrongSwan Prometheus Exporter
After=network.target strongswan-starter.service

[Service]
Type=simple
User=root
ExecStart=/usr/bin/python3 /opt/strongswan-exporter/exporter.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable strongswan-exporter
systemctl start strongswan-exporter
echo "[3/6] StrongSwan Exporter installed ✓"


# ============================================================
# STEP 4 — Install Grafana
# ============================================================
echo "[4/6] Installing Grafana..."

apt install -y apt-transport-https software-properties-common wget
wget -q -O /usr/share/keyrings/grafana.key https://apt.grafana.com/gpg.key
echo "deb [signed-by=/usr/share/keyrings/grafana.key] https://apt.grafana.com stable main" \
  > /etc/apt/sources.list.d/grafana.list
apt update -y
apt install -y grafana

# Configure Grafana
cat > /etc/grafana/grafana.ini << 'EOF'
[server]
http_port = 3000
domain = localhost

[security]
admin_user = turnip
admin_password = turnipvpn2024

[auth.anonymous]
enabled = false

[analytics]
reporting_enabled = false
check_for_updates = false
EOF

systemctl enable grafana-server
systemctl start grafana-server
echo "[4/6] Grafana installed ✓"


# ============================================================
# STEP 5 — Auto-provision Grafana datasource + dashboard
# ============================================================
echo "[5/6] Configuring Grafana datasource..."

mkdir -p /etc/grafana/provisioning/datasources
mkdir -p /etc/grafana/provisioning/dashboards

# Prometheus datasource
cat > /etc/grafana/provisioning/datasources/prometheus.yml << 'EOF'
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    url: http://localhost:9090
    isDefault: true
    access: proxy
EOF

# Dashboard provisioner
cat > /etc/grafana/provisioning/dashboards/turnipvpn.yml << 'EOF'
apiVersion: 1
providers:
  - name: TurnipVPN
    folder: TurnipVPN
    type: file
    options:
      path: /var/lib/grafana/dashboards
EOF

mkdir -p /var/lib/grafana/dashboards

# Write the TurnipVPN dashboard JSON
cat > /var/lib/grafana/dashboards/turnipvpn.json << 'EOF'
{
  "title": "TurnipVPN — Node Dashboard",
  "uid": "turnipvpn-main",
  "timezone": "browser",
  "refresh": "15s",
  "panels": [
    {
      "id": 1, "type": "stat", "title": "Active Users",
      "gridPos": {"x":0,"y":0,"w":6,"h":4},
      "targets": [{"expr": "strongswan_active_users", "legendFormat": "Users"}],
      "options": {"colorMode": "background", "textMode": "auto"},
      "fieldConfig": {"defaults": {"color": {"mode": "thresholds"},
        "thresholds": {"steps": [
          {"color":"green","value":0},
          {"color":"yellow","value":50},
          {"color":"red","value":75}
        ]}}}
    },
    {
      "id": 2, "type": "stat", "title": "Active Tunnels",
      "gridPos": {"x":6,"y":0,"w":6,"h":4},
      "targets": [{"expr": "strongswan_active_tunnels", "legendFormat": "Tunnels"}],
      "options": {"colorMode": "background"},
      "fieldConfig": {"defaults": {"color": {"mode": "thresholds"},
        "thresholds": {"steps": [{"color":"blue","value":0}]}}}
    },
    {
      "id": 3, "type": "stat", "title": "CPU Usage %",
      "gridPos": {"x":12,"y":0,"w":6,"h":4},
      "targets": [{"expr": "100 - (avg(rate(node_cpu_seconds_total{mode='idle'}[5m])) * 100)", "legendFormat": "CPU %"}],
      "fieldConfig": {"defaults": {"unit": "percent", "color": {"mode": "thresholds"},
        "thresholds": {"steps": [
          {"color":"green","value":0},
          {"color":"yellow","value":60},
          {"color":"red","value":80}
        ]}}}
    },
    {
      "id": 4, "type": "stat", "title": "Memory Used %",
      "gridPos": {"x":18,"y":0,"w":6,"h":4},
      "targets": [{"expr": "(1 - (node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes)) * 100", "legendFormat": "RAM %"}],
      "fieldConfig": {"defaults": {"unit": "percent"}}
    },
    {
      "id": 5, "type": "graph", "title": "Bandwidth In/Out (bytes/sec)",
      "gridPos": {"x":0,"y":4,"w":24,"h":8},
      "targets": [
        {"expr": "rate(node_network_receive_bytes_total{device='ens16'}[5m])", "legendFormat": "Inbound"},
        {"expr": "rate(node_network_transmit_bytes_total{device='ens16'}[5m])", "legendFormat": "Outbound"}
      ],
      "fieldConfig": {"defaults": {"unit": "Bps"}}
    },
    {
      "id": 6, "type": "graph", "title": "VPN Bytes In/Out",
      "gridPos": {"x":0,"y":12,"w":12,"h":8},
      "targets": [
        {"expr": "strongswan_bytes_in_total", "legendFormat": "VPN Bytes In"},
        {"expr": "strongswan_bytes_out_total", "legendFormat": "VPN Bytes Out"}
      ]
    },
    {
      "id": 7, "type": "graph", "title": "Active Users Over Time",
      "gridPos": {"x":12,"y":12,"w":12,"h":8},
      "targets": [{"expr": "strongswan_active_users", "legendFormat": "Connected Users"}]
    }
  ]
}
EOF

systemctl restart grafana-server
echo "[5/6] Grafana dashboard configured ✓"


# ============================================================
# STEP 6 — Open firewall ports
# ============================================================
echo "[6/6] Configuring firewall..."

ufw allow 3000/tcp comment "Grafana Dashboard"
ufw allow 9090/tcp comment "Prometheus"
# Keep 9100 and 9903 internal only — don't expose to internet

echo "[6/6] Firewall configured ✓"


# ============================================================
# DONE
# ============================================================
echo ""
echo "======================================"
echo " TurnipVPN Monitoring Stack Ready!"
echo "======================================"
echo ""
echo " Grafana Dashboard:"
echo " URL:      http://$(curl -s ifconfig.me):3000"
echo " User:     turnip"
echo " Password: turnipvpn2024"
echo ""
echo " Prometheus:"
echo " URL:      http://localhost:9090"
echo ""
echo " Metrics being tracked:"
echo "  ✓ Active VPN users"
echo "  ✓ Active tunnels"
echo "  ✓ Bandwidth in/out"
echo "  ✓ CPU usage"
echo "  ✓ RAM usage"
echo "  ✓ StrongSwan security associations"
echo ""
echo " IMPORTANT: Change your Grafana password after first login!"
echo " Settings → Change Password"
echo ""
