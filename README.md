# Kiro Kaiju

The Yellow/Crossroads Monster.

[![Kiro Kaiju](./kiro-kaiji-refactor-rampage/public/src/assets/images/team/host_sm.png "Kiro Kaiju: Refactor Rampage")](./kiro-kaiji-refactor-rampage/public/src/assets/images/team/host.png)

He's on a rampage to refactor bad code created by Complexosaur, HydraBug, and other Coding Kaiju.

**[Play!](https://kaiju-refactor-rampage-site-prod.s3.us-west-2.amazonaws.com/index.html)**

## Running locally

[Install LM Studio](https://lmstudio.ai/download)

### Start in CORS mode

`lms server start --port 1234 --cors `

### Confirm running

Check OPTIONS cors response

```bash
curl -I -X OPTIONS http://127.0.0.1:1234/v1/models 2>&1 | grep Allow-Methods
```

Should return:

`Access-Control-Allow-Methods: PUT, POST, PATCH, DELETE, GET`

You should have at least on model loaded.

Note that `openai/gpt-oss-20b` will run on a Mac Air M3 with 24GB of memory.

Check models:

```bash
curl -X GET http://127.0.0.1:1234/v1/models
```

Output might looks something like this:

```json
{
  "data": [
    {
      "id": "openai/gpt-oss-20b",
      "object": "model",
      "owned_by": "organization_owner"
    }
  ]
}
```

## Deploying to AWS

### Deploy your S3 bucket

```shell
cd aws
aws configure
npm run deploy:s3
```

Then you should have a static site such as:

https://kaiju-refactor-rampage-site-dev.s3.us-west-2.amazonaws.com/index.html

If you make any changes to the Front-End code, you'll need to push those:

`npm run sync`

### Deploy Services to AWS

`npm run deploy:dev`

✔ Service deployed to stack kiro-kaiju-refactor-rampage-dev (107s)

endpoints:
  POST - https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev/api/challenges/generate
  ...

### AWS Bedrock

You will need to enable the Models inside Bedrock before you can use AI.

- "anthropic.claude-3-haiku-20240307-v1"
- "amazon.titan-text-lite-v1"
etc.

