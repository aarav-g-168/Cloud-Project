#!/bin/bash
set -euo pipefail
exec > >(tee -a /var/log/cloudbusters-bootstrap.log) 2>&1
export DEBIAN_FRONTEND=noninteractive

apt-get -o Acquire::Retries=5 update
apt-get -o Acquire::Retries=5 install -y ca-certificates curl unzip xz-utils

# Install a fixed Node.js 22 release and verify its download checksum.
NODE_VERSION=22.22.1
BOOTSTRAP_DIR=$(mktemp -d)
cd "$BOOTSTRAP_DIR"
curl --fail --silent --show-error --retry 5 -O "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.xz"
curl --fail --silent --show-error --retry 5 -O "https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt"
grep " node-v${NODE_VERSION}-linux-x64.tar.xz$" SHASUMS256.txt | sha256sum -c -
tar -xJf "node-v${NODE_VERSION}-linux-x64.tar.xz" -C /usr/local --strip-components=1

# AWS CLI uses the launch template's instance role; no access keys needed.
curl --fail --silent --show-error --retry 5 https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip -o awscliv2.zip
unzip -q awscliv2.zip
./aws/install

useradd --system --create-home --home-dir /opt/cloudbusters --shell /usr/sbin/nologin cloudbusters
install -d -o cloudbusters -g cloudbusters /opt/cloudbusters/app
aws s3 cp s3://cloudbusters-deploy-723695984301/cloudbusters-deploy.zip "$BOOTSTRAP_DIR/app.zip" --region ap-south-1 --no-progress
unzip -q "$BOOTSTRAP_DIR/app.zip" -d /opt/cloudbusters/app
chown -R cloudbusters:cloudbusters /opt/cloudbusters/app
cd /opt/cloudbusters/app
runuser -u cloudbusters -- /usr/local/bin/npm ci --omit=dev

# Configuration contains no database password. start.js retrieves it in memory.
cat > /etc/cloudbusters.env <<'CONFIG'
NODE_ENV=production
PORT=3000
AWS_REGION=ap-south-1
DB_PASSWORD_PARAMETER=/cloudbusters/db/password
DB_HOST=cloudbusters-db.cj08820eo5ib.ap-south-1.rds.amazonaws.com
DB_PORT=3306
DB_USER=admin
DB_NAME=cloudapp
CONFIG
chmod 600 /etc/cloudbusters.env

cat > /etc/systemd/system/cloudbusters.service <<'SERVICE'
[Unit]
Description=Cloud Busters application
Wants=network-online.target
After=network-online.target
StartLimitIntervalSec=0

[Service]
Type=simple
User=cloudbusters
Group=cloudbusters
WorkingDirectory=/opt/cloudbusters/app
EnvironmentFile=/etc/cloudbusters.env
ExecStart=/usr/local/bin/node /opt/cloudbusters/app/server/start.js
Restart=always
RestartSec=10
NoNewPrivileges=true
PrivateTmp=true
UMask=0077

[Install]
WantedBy=multi-user.target
SERVICE

systemctl daemon-reload
systemctl enable --now cloudbusters

for attempt in $(seq 1 30); do
  if curl --fail --silent --max-time 12 http://127.0.0.1:3000/api/health >/dev/null; then
    echo 'Cloud Busters bootstrap complete; application and database healthy.'
    exit 0
  fi
  sleep 5
done
echo 'Application health check failed. Inspect: journalctl -u cloudbusters'
exit 1
