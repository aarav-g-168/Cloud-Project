# Project Understanding: Scalable Multi-Tier Web Application

## Project Overview
Based on the project proposal (CAD-review1.pdf) and your description, this is a Cloud Architecture Design course project titled "Scalable Multi-Tier Web Application" by team "Cloud Busters".

## Core Requirements from Proposal
1. **Three-tier Architecture**:
   - Presentation Layer (frontend)
   - Application Layer (backend/API)
   - Database Layer (data storage)

2. **AWS Services to Implement**:
   - Amazon EC2 (compute)
   - Elastic Load Balancer (traffic distribution)
   - Auto Scaling Group (automatic scaling)
   - Amazon RDS (managed MySQL database)
   - Amazon S3 (static asset storage)
   - Amazon CloudFront (CDN for static content)
   - Amazon VPC (isolated network)
   - IAM (access management)
   - Security Groups (network security)
   - Amazon CloudWatch (monitoring & logging)

3. **Development Technologies**:
   - Frontend: HTML, CSS, JavaScript
   - Backend: Node.js + Express (if required)
   - Database: MySQL via Amazon RDS

4. **Project Purpose**: Demonstrate a scalable, secure, highly available production-style cloud application by integrating AWS services.

## Updated Target Architecture (per your adjustments)
```
Users
      ↓
Application Load Balancer
      ↓
Target Group
      ↓
EC2 instances managed by Auto Scaling Group
      ↓
Amazon RDS MySQL
```

Network Design:
- ALB is public-facing
- EC2 instances are NOT directly publicly accessible (only accessible via ALB)
- RDS is in private networking
- Security Groups restrict traffic: ALB → EC2 → RDS (least privilege)

## 70% Implementation Target Definition
For tomorrow's review, 70% implementation means having a **working, demonstrable system** where:
- Core functionality is implemented and connected
- Key AWS services are provisioned and integrated (focusing on the core architecture)
- The application can be accessed end-to-end through the ALB
- Supporting services are configured (even if simplified)
- The system demonstrates the three-tier architecture principles with Auto Scaling as a core component

This does NOT mean 70% of the code, but rather 70% of the proposed system functionality.

## Updated Priority Implementation Roadmap
Based on your adjustments, implementation will proceed in this order:

### PHASE 1 — Basic Working Application (MUST HAVE FOR TOMORROW)
- Simple frontend (HTML/CSS/JS) with home/status page
- Backend API (Node.js/Express) with:
  - GET /api/health (application status, DB connectivity)
  - GET /api/users (view users)
  - POST /api/users (add user)
- Database integration (MySQL via local for testing, then RDS)
- All layers connected and functional locally

### PHASE 2 — RDS Configuration (MUST HAVE FOR TOMORROW)
- Create Amazon RDS MySQL instance
- Database: `cloudapp`
- Table: `users` (id, name, email, created_at)
- Backend connects to RDS using environment variables
- No hard-coded credentials

### PHASE 3 — VPC & Networking (MUST HAVE FOR TOMORROW)
- Create VPC with public and private subnets
- Internet Gateway and proper route tables
- RDS placed in private subnets
- Explain networking purpose

### PHASE 4 — Security Groups (MUST HAVE FOR TOMORROW)
- ALB Security Group (allow HTTP/HTTPS from internet)
- EC2 Security Group (allow from ALB SG only)
- RDS Security Group (allow from EC2 SG only on MySQL port)
- Follow least privilege principle

### PHASE 5 — EC2 Deployment (MUST HAVE FOR TOMORROW)
- Launch EC2 instance(s) in private subnets
- Install dependencies and deploy application
- Configure environment variables for DB connection
- Test application-EC2-RDS connectivity
- Verify EC2 is NOT directly accessible from internet (only via ALB)

### PHASE 6 — Application Load Balancer (MUST HAVE FOR TOMORROW)
- Create ALB in public subnets
- Create target group
- Configure health checks (/api/health endpoint)
- Register EC2 instances
- Verify traffic flows through ALB
- Verify application is accessible via ALB DNS name

### PHASE 7 — Auto Scaling Group (MUST HAVE FOR TOMORROW - CORE COMPONENT)
- Create Launch Template with EC2 configuration
- Create Auto Scaling Group (min=1, desired=1, max=2)
- Attach ASG to ALB target group
- Configure basic CPU-based scaling policy (e.g., scale at 50% CPU)
- Verify ASG launches/terminates instances based on load
- Verify new instances are automatically registered with ALB

### PHASE 8 — S3 (SECONDARY PRIORITY)
- Create S3 bucket for static resources
- Store appropriate static assets (images, docs)
- Configure appropriate access (not unnecessarily public)
- Reference static assets from frontend if applicable

### PHASE 9 — CloudWatch (SECONDARY PRIORITY)
- Basic monitoring: EC2 CPU utilization, instance health/status
- Create at least one useful alarm (e.g., high CPU on ASG)
- Connect monitoring to scaling behavior if practical

### PHASE 10 — IAM (SECONDARY PRIORITY)
- Avoid root account usage
- Create IAM role for EC2 instances if they need AWS access
- Attach least-privilege policies (e.g., read-only access to S3 if needed)
- Prefer IAM roles over hard-coded access keys

### PHASE 11 — CloudFront (SECONDARY PRIORITY)
- Configure if time permits after core is complete
- Architecture: User → CloudFront → S3 (for static content)
- Lower priority than core architecture

## Local vs AWS Responsibilities

### What I Can Do Locally:
- Create project structure and application code
- Write frontend (HTML/CSS/JS)
- Write backend (Node.js/Express) with API endpoints
- Create deployment scripts and configuration
- Create .gitignore and README
- Create architecture diagrams
- Write deployment documentation
- Create review preparation materials
- Create local testing scripts

### What You Must Do in AWS (I'll Guide You Step-by-Step):
- Create VPC, subnets (public/private), Internet Gateway, route tables
- Create and configure RDS MySQL instance in private subnets
- Create Security Groups with proper least-privilege rules
- Launch EC2 instance(s) in private subnets
- Deploy application code to EC2
- Configure Environment Variables on EC2 (DB credentials)
- Create and configure Application Load Balancer in public subnets
- Create Target Group and health checks (/api/health)
- Set up Auto Scaling Group with Launch Template
- Configure scaling policies
- Create S3 bucket (if implemented)
- Configure CloudWatch monitoring and alarms
- Set up IAM roles and policies
- Configure CloudFront distribution (if implemented)
- Test and verify end-to-end connectivity: User → ALB → Target Group → EC2 (in ASG) → RDS
- Verify EC2 is NOT directly accessible from internet

## Current Project State
- Directory: `C:\Users\gupta\OneDrive\Desktop\CloudBusters`
- Contains only: `CAD-review1.pdf` (project proposal)
- No application code, configuration, or AWS resources created yet
- Ready to start implementation from scratch

## Next Steps
I will now provide the exact Phase 1 plan and files to create. Once you confirm, I will begin implementation.