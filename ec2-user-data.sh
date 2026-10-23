#!/bin/bash
#
# EC2 User Data Script for Cloud Busters Application
# This script runs on first boot of an EC2 instance to set up the application
#
# IMPORTANT:
# 1. You must manually update the .env file with your RDS credentials after first boot
# 2. Or, you can pass RDS credentials securely through AWS Systems Manager Parameter Store or Secrets Manager
# 3. For simplicity in this review, we'll show manual .env update approach
#
# This script assumes Amazon Linux 2 AMI

set -e  # Exit on any error

echo "Starting Cloud Busters application setup..."

# Update system
yum update -y

# Install Node.js 18.x (LTS)
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
yum install -y nodejs

# Install git and mysql client
yum install -y git mysql

# Create app directory
mkdir -p /opt/cloudbusters
cd /opt/cloudbusters

# For this example, we'll assume code is already present (e.g., copied via AMI or EFS)
# In practice, you might clone from a repository:
# git clone <your-repository-url> .
# OR copy from S3:
# aws s3 cp s3://your-bucket/cloudbusters-app.tar.gz .
# tar -xzf cloudbusters-app.tar.gz

# Install Node.js dependencies
npm install

echo "Application dependencies installed."
echo ""
echo "=== NEXT STEPS (MANUAL REQUIRED) ==="
echo "1. SSH into this instance and navigate to /opt/cloudbusters"
echo "2. Copy .env.example to .env: cp .env.example .env"
echo "3. Edit .env with your RDS credentials:"
echo "   DB_HOST=your-rds-endpoint.rds.amazonaws.com"
echo "   DB_PORT=3306"
echo "   DB_USER=your_username"
echo "   DB_PASSWORD=your_password"
echo "   DB_NAME=cloudapp"
echo "   PORT=3000"
echo "   NODE_ENV=production"
echo ""
echo "4. Test database connection:"
echo "   mysql -h your-rds-endpoint.rds.amazonaws.com -P 3306 -u your_username -p cloudapp"
echo ""
echo "5. Initialize database schema:"
echo "   mysql -h your-rds-endpoint.rds.amazonaws.com -P 3306 -u your_username -p cloudapp < scripts/init-db.sql"
echo ""
echo "6. Start the application:"
echo "   nohup npm start > app.log 2>&1 &"
echo ""
echo "7. Verify it's working:"
echo "   curl http://localhost:3000/api/health"
echo ""
echo "Setup complete! Remember to configure security groups properly:"
echo "- EC2 SG: Allow SSH (22) inbound, HTTP (3000) inbound if needed"
echo "- RDS SG: Allow MySQL/Aurora (3306) inbound from EC2 SG"
echo ""