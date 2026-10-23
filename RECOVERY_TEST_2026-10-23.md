# Automatic recovery test — 23 October 2026

## Observed result

Automatic application-failure detection and instance replacement passed.

- Before test: standalone instance `i-0d651b2e02cf2fa85` and ASG instance `i-05999104a1e544363` both Healthy in `cloudbusters-tg`.
- Simulated failure: `sudo systemctl stop cloudbusters` on ASG server `172.30.11.20`. Service became inactive and local port 3000 refused connections.
- ASG activity at 16:57:50 UTC / 22:27:50 IST explicitly reported an ELB system health-check failure and replacement of the unhealthy instance.
- Replacement: `i-065e62d285850d924`, private IP `172.30.11.4`, ap-south-1b.
- Replacement bootstrap completed; systemd service active; local health returned HTTP 200, database connected, production environment.
- Target group subsequently showed replacement Healthy, standalone Healthy, old ASG instance Draining.
- Public ALB check at 17:03:02 UTC / 22:33:02 IST returned healthy, database.connected=true, hostname=ip-172-30-11-4, environment=production.

## Limits

- This proves automatic replacement after application failure, not CPU-triggered scale-out.
- Manual scale-out and CPU-alarm automatic scale-in were demonstrated earlier.
- Standalone EC2 remained available during this test. Continuous zero-downtime behavior was not measured.
- Desired/minimum ASG capacity remains 1; this is not two simultaneously running ASG instances across AZs.
- Old-instance termination was still completing when the replacement became Healthy.
- Dependency audit remains unresolved: bootstrap reports 2 moderate and 1 critical vulnerability.
