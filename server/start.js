require('dotenv').config();

async function start() {
  if (process.env.DB_PASSWORD_PARAMETER) {
    const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
    const client = new SSMClient({ region: process.env.AWS_REGION });
    try {
      const result = await client.send(new GetParameterCommand({
        Name: process.env.DB_PASSWORD_PARAMETER,
        WithDecryption: true
      }));
      if (!result.Parameter || !result.Parameter.Value) {
        throw new Error('Empty password parameter');
      }
      process.env.DB_PASSWORD = result.Parameter.Value;
      console.log('Database password loaded from Parameter Store');
    } finally {
      client.destroy();
    }
  }
  require('./index');
}

start().catch(() => {
  console.error('Startup failed: check Parameter Store configuration, IAM role, and network access.');
  process.exit(1);
});
