# Cloud Busters - Scalable Multi-Tier Web Application

Cloud Architecture Design course project demonstrating a production-style, scalable, highly available three-tier web application on AWS.

## Architecture

```
Users
      ↓
Application Load Balancer
      ↓
Target Group
      ↓
EC2 instances (Auto Scaling Group)
      ↓
Amazon RDS MySQL
```

Supporting: VPC, Security Groups, IAM, CloudWatch, S3, CloudFront

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js + Express
- **Database**: MySQL (Amazon RDS)
- **Infrastructure**: AWS (EC2, ALB, ASG, RDS, VPC, S3, CloudFront, CloudWatch, IAM)

## Local Development

### Prerequisites
- Node.js 18+
- MySQL 8.0+ (local or remote)

### Setup
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
mysql -u root -p < scripts/init-db.sql

# Start server
npm start
```

Server runs at `http://localhost:3000`

### API Endpoints
- `GET /api/health` - Health check with DB connectivity
- `GET /api/users` - List all users
- `POST /api/users` - Create user (JSON: name, email)

## AWS Deployment
See [DEPLOYMENT.md](DEPLOYMENT.md) for step-by-step AWS deployment guide.

## Project Structure
```
├── server/          # Backend API
│   ├── index.js     # Express app entry
│   ├── db.js        # Database connection
│   ├── routes/      # API routes
│   └── config/      # Configuration
├── public/          # Frontend assets
│   ├── index.html
│   ├── style.css
│   └── app.js
├── scripts/         # Database scripts
└── package.json
```

## Team
**Cloud Busters** - Cloud Architecture Design Course