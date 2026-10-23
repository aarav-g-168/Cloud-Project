# Cloud Busters — review and demo guide

## Two-minute explanation

Our project is a Scalable Multi-Tier Web Application. Its presentation tier is a simple HTML, CSS and JavaScript interface. The application tier is Node.js and Express on EC2, and the data tier is private Amazon RDS MySQL.

Users enter through an Application Load Balancer. Its target group forwards requests to application instances managed by an Auto Scaling Group. Each instance starts from a Launch Template, downloads an allowlisted application ZIP from private S3, installs its locked dependencies and starts a systemd service. Instances use an IAM role to retrieve the database password from an encrypted Systems Manager parameter. The password is not in user data or the deployment archive.

We have demonstrated creating and retrieving users, persistent RDS storage, traffic distribution, manual scale-out, CPU-policy scale-in, and automatic replacement after an application service failure. CloudWatch collects application logs and displays infrastructure metrics. Consult CURRENT_STATE.md for the final CPU scale-out test result.

S3 static assets are prepared in a separate private bucket. CloudFront creation was rejected by AWS because this account needs verification, so CDN delivery is not claimed as complete. The current website uses HTTP, and the economical single-instance ASG setting is not continuous multi-AZ availability. These are disclosed limitations, not hidden implementation claims.

## Five-minute technical explanation

1. **Requirements (30 s):** Proposal integrates EC2, ELB, ASG, RDS, S3, CloudFront, VPC, IAM, Security Groups and CloudWatch. The innovation is integration and automatic infrastructure response, not a novel scaling algorithm.
2. **Network (50 s):** Project VPC is 172.30.0.0/16. ALB spans public subnets in ap-south-1a and 1b. EC2 uses public subnets for inexpensive outbound package installation; inbound application traffic is restricted to the ALB SG. RDS has no public access, in database subnets. Route tables distinguish Internet-connected subnets from internal database routing.
3. **Application/data (40 s):** Same-origin browser API requests call Express. MySQL queries are parameterized, credentials come from environment/SSM, and database connections are pooled. GET /api/health tests SELECT 1 and reports hostname, connectivity and timing. User records remain in RDS across application-instance replacement.
4. **Deployment (50 s):** Ubuntu 24.04 x86_64 and t3.micro. User data installs Node 22 and AWS CLI, downloads private S3 code, runs npm ci, writes non-secret configuration and starts systemd. Role credentials are temporary through IMDSv2. Parameter Store is read before database configuration loads.
5. **Scaling/recovery (60 s):** Target tracking aims for 50% CPU; limits are 1–2. Explain the difference between manually changing desired capacity, a metric-triggered scaling action and unhealthy-instance replacement. Show actual Activity causes. T3 Standard credits limited earlier tests; account disallows Unlimited. Never present a manual launch as CPU-triggered.
6. **Monitoring/security/limits (70 s):** CloudWatch logs /cloudbusters/app have 7-day retention, with streams per instance. Dashboard shows ASG/ALB/RDS. SG flow is ALB→EC2:3000→RDS:3306. Current deployment is a public demo without authentication or TLS on ALB. CloudFront account verification is pending. Single-instance ASG and single DB are not a fully fault-tolerant production deployment.

## Live demo sequence

1. Open the ALB URL with explicit http:// in Chrome; verify healthy and DB connected.
2. Add a clearly named demo user; reload and show persistence.
3. Open /api/health and explain hostname, environment and timing.
4. Show target group health and /api/health check path.
5. Show ASG Launch Template version and non-secret user data.
6. Show IAM role's parameter-read, deployment-read and scoped log-write policies. Never open the parameter's decrypted value.
7. Show private RDS networking and SG source reference.
8. Show successful ASG Activity events with causes: manual scale-out, policy scale-in, ELB-triggered replacement; include CPU-triggered scale-out only if verified in CURRENT_STATE.md.
9. Open CloudWatch CloudBusters dashboard and /cloudbusters/app log stream.
10. Show S3 private deployment/static buckets and disclose the CloudFront verification blocker.

## Screenshot checklist

- [ ] Application with successful user creation and users list
- [ ] Health JSON with DB connected and production
- [ ] ALB listener and healthy target group
- [ ] Target health-check path /api/health
- [ ] ASG instance management, capacities and template version
- [ ] Scale-out activity with actual cause
- [ ] Scale-in activity with low-CPU alarm cause
- [ ] Replacement activity with ELB failure cause
- [ ] CloudWatch dashboard and per-instance log events
- [ ] RDS public access No, database SG source
- [ ] IAM least-privilege policy resources (no credentials)
- [ ] S3 Block Public Access and uploaded asset names
- [ ] CloudFront account-verification rejection

## Likely evaluator questions and short answers

1. **Why three tiers?** Separates presentation, request processing and persistent storage.
2. **Are frontend and API on different EC2 fleets?** No. They are logical tiers served by one stateless Express fleet; RDS is separate.
3. **Why an ALB?** HTTP routing, health-based target selection and traffic distribution.
4. **What is a target group?** A set of application endpoints with shared protocol, port and health-check settings.
5. **Why Auto Scaling?** Maintains desired capacity, replaces unhealthy instances and adjusts capacity using metric policies.
6. **Manual scaling versus automatic scaling?** Manual changes desired count; automatic scaling uses metric policy decisions. Activity history distinguishes them.
7. **Does replacement prove scale-out?** No. Replacement maintains capacity after failure; scale-out increases desired capacity.
8. **What triggers the CPU policy?** Average ASG CPU relative to a 50% target, using AWS-managed target-tracking alarms.
9. **Why did early load tests fail to scale?** T3 Standard CPU credits ran out, limiting sustained CPU; basic monitoring also had sparse samples.
10. **What are CPU credits?** Burst capacity earned below the instance baseline and spent when CPU exceeds baseline.
11. **What is the health grace period?** A startup interval before ASG uses health failures to replace newly InService instances; it does not make ALB forward to unhealthy targets.
12. **What does warmup do?** Lets new instances stabilize before their metrics drive further scaling decisions.
13. **Where does data survive?** RDS, independent of individual EC2 disks.
14. **Why is RDS private?** Only the application needs database access; Internet exposure is unnecessary.
15. **How do SGs differ from route tables?** SGs filter traffic; routes choose a network path.
16. **How are credentials managed?** EC2 role retrieves an encrypted SSM SecureString; the application keeps the value in memory.
17. **Why no access keys on EC2?** Instance roles provide short-lived credentials automatically.
18. **Does SecureString encrypt MySQL traffic?** No. It encrypts the stored secret. Database transport TLS is a separate configuration.
19. **Why use S3?** Durable private code delivery and separate static resource storage.
20. **Is CloudFront complete?** No. AWS rejected creation pending account verification. No CDN domain is claimed.
21. **What is the innovation?** Coordinating managed compute, scaling, load balancing, secret retrieval, networking, database and observability in one demonstrable system.
22. **Is the current system fully highly available?** No. A minimum of one app instance has recovery gaps; DB Multi-AZ must be separately verified/enabled. Two healthy app instances across AZs improve application availability.
23. **Why public EC2 subnets?** Low-cost outbound access without NAT. SGs restrict app traffic to ALB; private compute with controlled egress is a future hardening step.
24. **Is HTTP secure for real user data?** No. This is a demo with synthetic users. Real deployment requires HTTPS and authentication.
25. **Can an SQL injection string alter SQL?** Queries use bound parameters; input values are not concatenated into statements.
26. **What does a pooled health-check timing of 0 ms mean?** A fast check within millisecond resolution; it is not zero network latency.
27. **How are application logs collected?** systemd appends sanitized request logs to a file; CloudWatch agent ships them to per-instance streams.
28. **What is still needed for production?** TLS, authentication/authorization, restricted DB app user, verified DB TLS, multi-AZ design, immutable artifact versioning and operational hardening.

## Why each service was selected

| Service | Role |
|---|---|
| EC2 | Explainable Linux application runtime |
| ALB | Health-aware HTTP entry point |
| ASG | Capacity management and failure recovery |
| RDS MySQL | Persistent managed relational data |
| S3 | Private code artifacts and static assets |
| CloudFront | Proposed edge caching; currently account-blocked |
| VPC/subnets/routes | Network isolation and routing |
| Security Groups | Source-restricted tier communication |
| IAM | Temporary role credentials and resource-scoped access |
| Parameter Store/KMS | Encrypted secret storage, added to support safe repeatable bootstrapping |
| CloudWatch | Metrics, alarms, central logs and dashboard |
