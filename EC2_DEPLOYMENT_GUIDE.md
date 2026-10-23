# EC2 Deployment Guide for Cloud Busters Application

This guide explains how to deploy the Cloud Busters application to an Amazon EC2 instance. 
**Do not execute these steps yet** - this is preparation for when RDS is available.

## Prerequisites
1. Amazon RDS MySQL instance `cloudapp` database is available and accessible
2. EC2 instance running Amazon Linux 2 or Ubuntu Server
3. Security group configured to allow SSH (port 22) and HTTP (port 80) or custom port
4. RDS security group configured to allow traffic from EC2 security group on MySQL port (3306)

## Step 1: Connect to EC2 Instance
```bash
# Using SSH (replace with your instance details)
ssh -i "your-key.pem" ec2-user@your-ec2-public-dns.compute.amazonaws.com
```

## Step 2: Update System and Install Dependencies
### For Amazon Linux 2:
```bash
sudo yum update -y
sudo yum install -y git nodejs npm
```

### For Ubuntu Server:
```bash
sudo apt update
sudo apt install -y git nodejs npm
```

## Step 3: Install MySQL Client (for testing)
### Amazon Linux 2:
```bash
sudo yum install -y mysql
```

### Ubuntu Server:
```bash
sudo apt install -y mysql-client
```

## Step 4: Clone/Transfer Application Code
```bash
# Option 1: Clone from repository (if using CodeCommit, GitHub, etc.)
git clone <repository-url> CloudBusters
cd CloudBusters

# Option 2: Transfer files manually (if you have the code locally)
# Use scp or your preferred method to transfer the CloudBusters directory
```

## Step 5: Install Node.js Dependencies
```bash
cd CloudBusters
npm install
```

## Step 6: Configure Environment Variables
```bash
# Copy example environment file
cp .env.example .env

# Edit .env with your actual RDS credentials
# Use your preferred editor (vi, nano, etc.)
vi .env

# Update these values with your RDS details:
DB_HOST=your-rds-endpoint.rds.amazonaws.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=cloudapp
PORT=3000          # or 80 if you prefer standard HTTP
NODE_ENV=production
```

## Step 7: Test Database Connection
```bash
# Test MySQL connection to RDS
mysql -h your-rds-endpoint.rds.amazonaws.com -P 3306 -u your_username -p cloudapp
# Enter password when prompted

# If successful, you should see the MySQL prompt
```

## Step 8: Initialize Database Schema
```bash
# Run the database initialization script
mysql -h your-rds-endpoint.rds.amazonaws.com -P 3306 -u your_username -p cloudapp < scripts/init-db.sql
# Enter password when prompted
```

## Step 9: Start the Application
```bash
# Start the application in background using nohup or pm2
# Option 1: Using nohup (simple)
nohup npm start > app.log 2>&1 &

# Option 2: Using PM2 (recommended for production)
# First install PM2 globally: npm install -g pm2
pm2 start npm --name "cloudbusters-app" -- start
pm2 save
pm2 startup
```

## Step 10: Verify Application is Running
```bash
# Check if application is running
ps aux | grep node

# Check logs
tail -f app.log

# Test health endpoint locally
curl http://localhost:3000/api/health

# Should return JSON with database connected: true
```

## Step 11: Configure Auto Start (Optional but Recommended)
If using the nohup method, you might want to set up a systemd service or use the instance's rc.local.

## Important Configuration Notes

### Port Configuration
- The application listens on `0.0.0.0:${PORT}` where PORT comes from environment
- Default PORT is 3000, but you can change it in `.env`
- If using port 80, you may need to run as root or use authbind (not recommended)
- Consider using a reverse proxy like nginx or ALB for port 80/443

### Environment Variables
All configuration is done through environment variables in `.env`:
- `DB_HOST`: RDS endpoint
- `DB_PORT`: 3306 (MySQL default)
- `DB_USERNAME`: Your RDS master username
- `DB_PASSWORD`: Your RDS master password
- `DB_NAME`: cloudapp
- `PORT`: Server port (default 3000)
- `NODE_ENV`: development or production

### Security
- **Never** commit `.env` file with real credentials
- The `.gitignore` file already excludes `.env`
- Use IAM roles for EC2 if the instance needs to access other AWS services
- Restrict security groups to minimum required access

### Application Access
Once deployed, access the application at:
- Frontend: `http://your-ec2-public-dns:${PORT}`
- Health API: `http://your-ec2-public-dns:${PORT}/api/health`
- Users API: `http://your-ec2-public-dns:${PORT}/api/users`

### Frontend-Backend Communication
The frontend uses relative API paths (`/api/health`, `/api/users`). This works when:
1. Both frontend and backend are served from the same EC2 instance (current setup)
2. Deployed behind an ALB that routes to the same backend
3. Deployed with CloudFront pointing to the same domain

For completely separate domains (e.g., frontend on S3, backend on different subdomain), you would need to:
1. Update `API_BASE` in `public/app.js` to point to your backend URL
2. Or configure CORS on the backend
3. Or use a reverse proxy setup

## Troubleshooting

### Application Won't Start
- Check logs: `cat app.log` or `pm2 logs cloudbusters-app`
- Verify Node.js and npm are installed
- Check if port is already in use: `sudo netstat -tulpn | grep :${PORT}`
- Verify `.env` file is correctly formatted

### Database Connection Failed
- Verify RDS endpoint is correct
- Verify security group allows traffic from EC2 to RDS on port 3306
- Verify username and password are correct
- Test connection manually with mysql client
- Check if RDS instance is available and in correct state

### Application Not Responding
- Check if process is running: `ps aux | grep node`
- Check if port is listening: `sudo netstat -tulpn | grep :${PORT}`
- Check application logs for errors
- Verify security group allows inbound traffic on the application port

## Cleanup
To stop the application:
```bash
# Using nohup
kill $(ps aux | grep '[n]pm start' | awk '{print $2}')

# Using PM2
pm2 stop cloudbusters-app
pm2 delete cloudbusters-app
```

## Next Steps After Deployment
Once EC2 deployment is working:
1. Set up Application Load Balancer (ALB) in front of EC2
2. Configure Auto Scaling Group for the EC2 instances
3. Add CloudWatch monitoring
4. Configure S3 for static assets (if needed)
5. Set up CloudFront for CDN (if needed)

## Files Referenced in This Guide
- `.env.example` - Template for environment variables
- `.gitignore` - Ensures `.env` is not committed
- `package.json` - Contains `npm start` script
- `scripts/init-db.sql` - Database schema initialization
- `server/index.js` - Application entry point (listens on 0.0.0.0:${PORT})
- `public/app.js` - Frontend (uses relative API paths: /api/*)