#!/bin/bash
set -euo pipefail
install -d -m 755 /var/log/cloudbusters
touch /var/log/cloudbusters/application.log
chmod 640 /var/log/cloudbusters/application.log
curl --fail --silent --show-error --retry 5 https://amazoncloudwatch-agent.s3.amazonaws.com/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb -o /tmp/cloudbusters-cloudwatch-agent.deb
dpkg -i /tmp/cloudbusters-cloudwatch-agent.deb
cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudbusters.json <<'CONFIG'
{
  "agent": {"region": "ap-south-1", "run_as_user": "root"},
  "logs": {
    "force_flush_interval": 5,
    "logs_collected": {
      "files": {"collect_list": [{
        "file_path": "/var/log/cloudbusters/application.log",
        "log_group_name": "/cloudbusters/app",
        "log_stream_name": "{instance_id}",
        "timezone": "UTC"
      }]}
    }
  }
}
CONFIG
install -d /etc/systemd/system/cloudbusters.service.d
cat > /etc/systemd/system/cloudbusters.service.d/logging.conf <<'SERVICE'
[Service]
StandardOutput=append:/var/log/cloudbusters/application.log
StandardError=append:/var/log/cloudbusters/application.log
SERVICE
cat > /etc/logrotate.d/cloudbusters <<'ROTATE'
/var/log/cloudbusters/application.log {
    daily
    size 10M
    rotate 3
    compress
    missingok
    notifempty
    copytruncate
}
ROTATE
systemctl daemon-reload
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudbusters.json
systemctl restart cloudbusters
