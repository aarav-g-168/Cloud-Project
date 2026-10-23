# Cloud Busters - Scalable Multi-Tier Web Application

BCSE355L course project implementing a three-tier AWS user-directory demo. See [current verified state](docs/CURRENT_STATE.md); earlier readiness reports are historical.

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

Implemented supporting services: VPC, Security Groups, IAM roles, encrypted SSM Parameter Store, private S3 deployment storage, CloudWatch logs/metrics/alarms/dashboard. A separate private S3 bucket contains static CSS/JS. **CloudFront creation is blocked by AWS account verification**; live assets still come from Express. Current ALB uses HTTP, not HTTPS.

## Tech Stack

- **Frontend**: HTML, CSS, JavaScript (vanilla)
- **Backend**: Node.js + Express
- **Database**: MySQL (Amazon RDS)
- **Infrastructure**: AWS (EC2, ALB, ASG, RDS, VPC, S3, CloudFront, CloudWatch, IAM)

## Local Development

### Prerequisites
- Node.js 22+
- MySQL 8.0+ (local or remote)

### Setup
```bash
# Install dependencies
npm ci

# Configure environment
cp .env.example .env
# Edit .env with your database credentials

# Initialize database
mysql -u root -p < scripts/init-db.sql

# Start server
npm start
```

Server runs at `http://localhost:3000`

Local integration tests use a mock database: `npm test`. Production dependency audit: `npm audit --omit=dev`. Actual live API verification: set `APP_URL=http://YOUR_ALB_DNS` then run `node scripts/verify-deployed.mjs` (creates a named synthetic test user).

Private RDS cannot be reached directly from an ordinary laptop outside its allowed VPC network. Do not make the database public for local testing.

### Configuration

Required MySQL variables: DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME. Server: PORT (default 3000), NODE_ENV. The listener binds 0.0.0.0.

On EC2 set AWS_REGION and DB_PASSWORD_PARAMETER. `server/start.js` retrieves the encrypted SSM password with temporary instance-role credentials before loading the database configuration. The value is held in memory, not in user data. Optional STATIC_ASSET_BASE is an HTTPS CDN URL; leave unset while CloudFront is unavailable. `.env`, keys and archives are ignored by Git.

### API Endpoints
- `GET /api/health` - Health check with DB connectivity
- `GET /api/users` - List all users
- `POST /api/users` - Create user (JSON: name, email)

## AWS Deployment
Build an allowlisted release with `python scripts/package-release.py`. It excludes .env, credentials, other projects and node_modules. Publish the reviewed archive to the private deployment object, preserving the previous version for rollback.

The Launch Template's `scripts/asg-user-data.sh` installs Node/AWS CLI, retrieves the private ZIP, runs locked production dependencies, writes non-secret `/etc/cloudbusters.env` settings and starts an unprivileged systemd service. Start command: `/usr/local/bin/node /opt/cloudbusters/app/server/start.js`. The currently upgraded server may use a staged release directory; inspect systemd ExecStart without dumping its environment. Database initialization runs once, not on each ASG boot.

`scripts/setup-cloudwatch.sh` installs the official agent, ships sanitized request logs to `/cloudbusters/app`, and configures local rotation. The log group retains seven days. New ASG instances use Launch Template version 2.

Diagnose with `systemctl status cloudbusters`, `journalctl -u cloudbusters`, `/var/log/cloudbusters-bootstrap.log`, and CloudWatch. No aws configure or long-lived AWS access keys are needed.

### Review and operations

- [Actual architecture](docs/ARCHITECTURE.md)
- [Review explanations, demo and 28 evaluator questions](docs/REVIEW_GUIDE.md)
- [Cost controls and cleanup](docs/CLEANUP.md)
- [CloudFront blocker](docs/CLOUDFRONT_PENDING.md)
- [Recovery test record](RECOVERY_TEST_2026-10-23.md)

### Production limitations

Unauthenticated HTTP demo: use synthetic records only. Future hardening includes full-site TLS, authentication/authorization, restricted database app user, verified MySQL transport TLS, private application subnets with budgeted egress, two continuously running app instances, RDS Multi-AZ and immutable artifact keys. A single running ASG instance has recovery gaps; do not describe the demo as fully production-hardened.

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
