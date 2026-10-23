# Cloud Busters — verified state, 23 October 2026

This is the current deployment record. Older readiness reports are historical. About 90% of the proposed course-project scope is implemented; this is an engineering estimate, not an AWS score. CloudFront remains blocked by account verification.

## Working and demonstrated

| Requirement | Verified result |
|---|---|
| Web application | HTML/CSS/JS and Express API through the HTTP ALB; create/list users persist in RDS |
| Database | RDS MySQL Community, db.t4g.micro, Available in ap-south-1b, Multi-AZ No, publicly accessible No; inbound source is application SG |
| Load balancing | Two healthy ASG servers sampled by the final verification: ip-172-30-10-197 and ip-172-30-11-4 |
| Automatic scale-out | At 17:39:27 UTC the high CPU alarm invoked cloudbusters-cpu-scaling and changed desired capacity 1→2; new instance i-06a0dba4368b1d65a became Healthy |
| Automatic scale-in | Earlier low CPU alarm changed desired capacity 2→1; Activity evidence distinguishes this from manual scale-out |
| Recovery | Stopped the application service on an ASG instance; ELB health failure caused automatic replacement; replacement served healthy DB-connected responses |
| Bootstrap | ASG explicitly uses launch template version 2; private S3 archive, locked dependencies, systemd, IMDSv2, SSM password lookup, detailed monitoring and log agent |
| Monitoring | CloudBusters dashboard: ASG CPU, ALB health/requests, RDS CPU/connections/storage. Target tracking alarms enabled |
| Logs | /cloudbusters/app, seven-day retention, instance streams including the freshly bootstrapped i-06a0dba4368b1d65a |
| IAM | Exact parameter read, exact deployment-object read, scoped application-log write; no decrypted password in code/archive/user data |
| Static asset preparation | style.css and app.js uploaded to a separate private S3 bucket; public access remains blocked |
| Code checks | Three application tests passed; npm audit reported zero known vulnerabilities at deployment time |

Final live API verification at **17:45:50 UTC** passed health, HTML, both assets, create/list persistence, duplicate handling and invalid input. A named synthetic verification record was created (ID 8). See [machine-readable evidence](evidence/deployment-verification.json).

## Operating configuration

- ALB: http://cloudbusters-alb-2088482537.ap-south-1.elb.amazonaws.com
- ASG: cloudbusters-asg; minimum 1, maximum 2; CPU target 50%; scale-in enabled; health grace 600 seconds. Desired capacity can return to 1 automatically after load falls.
- Target group: cloudbusters-tg, HTTP 3000, health path /api/health (SELECT 1).
- Healthy capacity observed: i-06a0dba4368b1d65a in 1a and i-065e62d285850d924 in 1b.
- Original standalone i-0d651b2e02cf2fa85 was deregistered and confirmed Stopped for reversible rollback storage. It is not part of the serving design. EBS storage still costs money.
- Stress test was stopped after the genuine automatic scale-out; no continuous load is intended.
- Deployment bucket: cloudbusters-deploy-723695984301; static bucket: cloudbusters-static-723695984301. Both are private.

## Remaining and blocked

1. **CloudFront:** AWS rejected distribution creation pending account verification. No distribution or CDN URL exists. See [exact blocker and completion steps](CLOUDFRONT_PENDING.md). STATIC_ASSET_BASE remains unset; website serves local assets.
2. **HTTPS and application authentication:** The current public demo uses HTTP and has no user authentication. Do not enter sensitive real user data. HTTPS for the full application requires an appropriate domain/certificate and ALB configuration; a static CDN alone does not secure API traffic.
3. **Production availability:** Minimum 1 does not guarantee simultaneous multi-AZ application capacity. RDS is single-AZ; no DB failover demonstration is claimed.
4. **Further hardening:** Use a restricted database application user, verify DB TLS, review credential rotation, and consider private application subnets with managed outbound access. These are not claimed as done.

Account also disallows T3 Unlimited and currently blocks CloudShell initialization. Neither prevents this demonstrated deployment. Standard CPU credits require care for repeated load tests. Detailed monitoring and logs incur usage charges.

## Evidence and handover

- [Automatic CPU scale-out](evidence/automatic-cpu-scaleout.jpg)
- [Final targets](evidence/final-targets.jpg)
- [CloudWatch logs](evidence/cloudwatch-logs.jpg)
- [Dashboard](evidence/cloudwatch-dashboard.jpg)
- [CloudFront account blocker](evidence/cloudfront-account-blocker.jpg)
- [Activity text](SCALING_ACTIVITY.txt)
- [Architecture](ARCHITECTURE.md), [review/demo guide](REVIEW_GUIDE.md), [cost cleanup](CLEANUP.md)

Preserve evidence before changing capacity or deleting resources. Do not stop individual ASG instances as a cost-control method: the group replaces them. Follow CLEANUP.md when the demo is finished.
