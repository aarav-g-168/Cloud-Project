# Ready-to-send AWS Support request

Prepared for the account owner; not submitted.

**Subject:** Account verification required to create CloudFront resources

Hello AWS Support,

I am building a student course project in AWS account 723695984301. CloudFront distribution creation fails with:

> Your account must be verified before you can add new CloudFront resources. To verify your account, please contact AWS Support (https://console.aws.amazon.com/support/home#/) and include this error message.

This was reproduced on 23 October 2026. Please advise what account verification steps are required and enable CloudFront resource creation once verification is complete.

The planned distribution serves CSS and JavaScript from the private S3 bucket cloudbusters-static-723695984301 in ap-south-1 using Origin Access Control. This is a small educational demo.

Thank you.

## Submit

Open https://console.aws.amazon.com/support/home#/ and choose the available account/billing support route. Attach docs/evidence/cloudfront-retry-blocker.jpg if requested. Complete any identity or payment verification personally; do not send passwords, access keys, or database credentials in the case.

After AWS confirms that CloudFront creation is enabled, follow CLOUDFRONT_PENDING.md. No distribution exists yet and no bucket access was granted by the retry.
