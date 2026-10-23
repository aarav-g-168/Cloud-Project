# CloudFront account blocker and prepared integration

Actual AWS rejection on 23 October 2026:

> Your account must be verified before you can add new CloudFront resources. To verify your account, please contact AWS Support (https://console.aws.amazon.com/support/home#/) and include this error message.

No CloudFront distribution/domain was created. Contacting AWS Support or submitting account verification is an account-owner action and was not performed by the assistant.

Creation was retried after the request to finish remaining work on 23 October 2026, and AWS returned the same rejection. The retry disabled automatic bucket-policy changes; no additional bucket access was granted. A ready-to-send request is in AWS_SUPPORT_REQUEST.md.

## Prepared resources

- Private SSE-S3 bucket: cloudbusters-static-723695984301, ap-south-1.
- Objects: style.css, app.js. No deployment ZIP, credentials or database data in this bucket.
- Block Public Access remains enabled.
- Application can use optional STATIC_ASSET_BASE=https://your-distribution.cloudfront.net.
- Frontend API requests remain relative /api/* to the ALB origin.

## After AWS verifies the account

1. Create one standard CloudFront distribution named cloudbusters-static.
2. S3 origin: cloudbusters-static-723695984301.s3.ap-south-1.amazonaws.com (REST origin, not website hosting).
3. Use Origin Access Control with signed requests and a bucket policy allowing s3:GetObject only from that distribution ARN.
4. Redirect viewer HTTP to HTTPS. Allow only GET/HEAD for static assets; use managed CachingOptimized.
5. Avoid paid optional WAF/Origin Shield for this small demo unless explicitly required and budgeted.
6. Set price class based on the review's location and budget; do not assume the smallest price class contains Indian edge locations.
7. Verify HTTPS /style.css and /app.js return 200; repeat requests and inspect cache headers.
8. Set STATIC_ASSET_BASE in /etc/cloudbusters.env and the Launch Template's non-secret configuration, then restart/roll out.
9. Verify browser HTML references CDN assets and Add/View Users still uses the ALB API.

Do not claim HTTPS on the ALB website merely because static assets use HTTPS. Full-site HTTPS needs its own validated design (e.g. custom domain + ACM certificate on ALB, or a correctly configured CloudFront application/API origin).
