# AWS cost control and cleanup

Do not execute destructive cleanup during the review. Export evidence first. These are instructions, not a record of deleted resources.

## Stop the demo without deleting the database

1. Set ASG minimum=0, desired=0 (maximum may remain 2). Stopping ASG instances individually causes replacements and continues charges.
2. Stop the standalone cloudbusters-ec2 if it still exists. Stopping does not delete EBS storage.
3. ALB continues billing even with no running targets. Delete it only when the public demo endpoint is no longer required.
4. RDS compute/storage/backup charges continue while running. Stopping supported RDS instances is temporary and AWS can automatically restart them after seven days; it is not permanent cost elimination.
5. Review detailed EC2 monitoring, CloudWatch dashboard/alarms/log ingestion, public IPv4, S3 and KMS use. Credits/free offers depend on account eligibility; zero cost is not promised.

## Permanent project cleanup (requires explicit approval)

- [ ] Export screenshots, architecture and any required synthetic DB records.
- [ ] If DB must be preserved, create and retain an intentional final snapshot; snapshots themselves cost money.
- [ ] Delete cloudbusters-asg after scaling desired/minimum to zero; wait for managed instances to terminate.
- [ ] Terminate standalone cloudbusters-ec2 only after confirming nothing required is left on its disk.
- [ ] Delete cloudbusters-alb, then cloudbusters-tg.
- [ ] Delete Launch Template lt-09174ed780870c266 and its versions.
- [ ] Delete RDS cloudbusters-db only after deciding about final snapshot and retained automated backups.
- [ ] Empty and delete cloudbusters-deploy-723695984301 and cloudbusters-static-723695984301; check object versions if versioning is later enabled.
- [ ] If CloudFront is created later, disable it, wait for deployment, then delete it and unused OAC.
- [ ] Delete CloudBusters dashboard, project alarms and /cloudbusters/app log group after preserving evidence.
- [ ] Delete /cloudbusters/db/password from Parameter Store.
- [ ] Detach/remove project policies and CloudBustersEC2Role/instance profile once no instance references them.
- [ ] Remove unused project Security Groups, subnet group and VPC resources only after dependencies are gone.
- [ ] Verify remaining EBS volumes, snapshots, public/Elastic IP allocations, NAT Gateways and detached Internet Gateways. Do not delete default/shared resources.
- [ ] Check Billing after cleanup, including other regions. CloudFront and IAM are global.

## Current cost boundaries

- Small t3.micro app instances, ASG maximum 2; original standalone instance may add a third until retired.
- RDS class recorded as db.t4g.micro; verify current settings in RDS.
- No NAT Gateway intentionally created.
- S3 private buckets and SSE-S3 default encryption.
- Application logs use 7-day CloudWatch retention.
- One-minute EC2 monitoring incurs additional metric charges; disable or scale to zero when not needed.
- Account currently blocks Unlimited CPU mode, CloudFront creation and CloudShell.
