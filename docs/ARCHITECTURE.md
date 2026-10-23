# Actual architecture

Only implemented services are shown. CloudFront is absent because AWS rejected creation pending account verification.

```mermaid
flowchart TB
    User[Browser: HTML/CSS/JavaScript] -->|HTTP 80| ALB[Public ALB: cloudbusters-alb]
    subgraph VPC[Project VPC 172.30.0.0/16]
        ALB --> TG[Target group: HTTP 3000 /api/health]
        subgraph ASG[cloudbusters-asg: two configured AZs; capacity 1 to 2]
            EC2[Ubuntu EC2 / Express / systemd]
        end
        TG --> EC2
        EC2 -->|TCP3306 restricted by SG| RDS[(Private RDS MySQL: cloudapp)]
    end
    S3[(Private S3 deployment ZIP)] -. role-scoped download .-> EC2
    SSM[SSM SecureString] -. password retrieval .-> EC2
    IAM[IAM instance role / IMDSv2] -. temporary credentials .-> EC2
    EC2 --> CW[CloudWatch logs / dashboard / metrics / alarms]
    ALB --> CW
    RDS --> CW
    CW -. CPU target tracking .-> ASG
    Static[(Private S3 CSS/JS: staged, CDN integration blocked)]
```

- ALB spans public subnets 172.30.10.0/24 (1a) and 172.30.11.0/24 (1b).
- EC2 uses those public subnets for inexpensive outbound access, with application inbound access restricted to the ALB Security Group. No NAT Gateway was intentionally added.
- RDS public access is disabled according to the handover; live verification is recorded in CURRENT_STATE.md.
- Security group chain: Internet TCP80 → ALB SG → app SG TCP3000 → RDS SG TCP3306.
- Target tracking: average ASG CPU target 50%, minimum 1 / maximum 2, health grace 600 s, policy warmup 300 s.
- Desired=1 does not provide continuous two-AZ app availability. Automatic replacement has startup delay; RDS Multi-AZ is a separate setting.
- Static resources bucket contains no credentials or source ZIP. CDN integration is prepared but not active.
- Innovation is service integration: repeatable role-based provisioning, health-based routing, managed data, monitoring and automatic infrastructure response. No new scaling algorithm is claimed.
- Original standalone EC2 was retained during tests; CURRENT_STATE.md records its final state.
