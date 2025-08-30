# Kiro Kaiji AWS Backend

This directory contains the AWS Lambda backend services for Kiro Kaiji: Refactor Rampage, providing cloud-based challenge generation, AI grading, and user progress tracking.

## Architecture

- **Serverless Framework v3**: Infrastructure as Code deployment
- **AWS Lambda**: Serverless compute for API endpoints
- **AWS DynamoDB**: NoSQL database for user progress and sessions
- **AWS Bedrock**: AI model integration using Claude 3 Haiku
- **OpenAI-compatible API**: `/v1/models` and `/v1/chat/completions` endpoints

## Services

### Challenge Generation
- **Endpoint**: `POST /api/challenges/generate`
- **Function**: `challengeGeneration`
- **Purpose**: Generate coding challenges with Kaiju monsters using AI

### AI Grading
- **Endpoint**: `POST /api/grading/submit`
- **Function**: `aiGrading`
- **Purpose**: Grade submitted code from multiple role perspectives

### User Progress
- **Endpoints**: 
  - `GET /api/progress/{userId}`
  - `PUT /api/progress/{userId}`
- **Function**: `userProgress`
- **Purpose**: Track user achievements and grading history

### Authentication
- **Endpoints**:
  - `POST /api/auth/login`
  - `GET /api/auth/session`
- **Function**: `auth`
- **Purpose**: Simple session-based authentication

### OpenAI-Compatible AI API
- **Endpoints**:
  - `GET /v1/models`
  - `POST /v1/chat/completions`
- **Functions**: `aiModels`, `aiChat`
- **Purpose**: Provide OpenAI-compatible interface for AI assistance

## Setup

### Prerequisites
- Node.js 18+
- AWS CLI configured with appropriate permissions
- Serverless Framework v3 installed globally

### Installation
```bash
cd aws
npm install
```

### Deployment
```bash
# Deploy to development stage
npm run deploy:dev

# Deploy to production stage
npm run deploy:prod

# Run locally for testing
npm run offline
```

### Testing
```bash
# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Environment Variables

The following environment variables are automatically set by the serverless configuration:

- `DYNAMODB_TABLE`: DynamoDB table name for data storage
- `STAGE`: Deployment stage (dev/prod)
- `BEDROCK_MODEL_ID`: AWS Bedrock model identifier (Claude 3 Haiku)

## AWS Permissions

The Lambda functions require the following IAM permissions:

- **DynamoDB**: Query, Scan, GetItem, PutItem, UpdateItem, DeleteItem
- **Bedrock**: InvokeModel for AI generation and grading

## Cost Optimization

- **DynamoDB**: Pay-per-request billing mode for cost efficiency
- **Bedrock**: Uses Claude 3 Haiku, an inexpensive model suitable for code evaluation
- **Lambda**: Minimal compute time with efficient request handling
- **Request Delays**: Built-in delays to avoid quota issues and reduce costs

## API Documentation

### Challenge Generation
```bash
POST /api/challenges/generate
Content-Type: application/json

{
  "language": "javascript",
  "framework": "vue",
  "category": "refactoring",
  "difficulty": 3
}
```

### AI Grading
```bash
POST /api/grading/submit
Content-Type: application/json

{
  "challengeId": "challenge-123",
  "submittedCode": "function example() { return 'hello'; }",
  "requirements": ["Add error handling", "Improve readability"],
  "userId": "user-123"
}
```

### User Authentication
```bash
POST /api/auth/login
Content-Type: application/json

{
  "userId": "user-123"
}
```

### OpenAI-Compatible Chat
```bash
POST /v1/chat/completions
Content-Type: application/json

{
  "messages": [
    {"role": "user", "content": "Help me refactor this code"}
  ],
  "model": "anthropic.claude-3-haiku-20240307-v1:0"
}
```

## Testing

The backend includes comprehensive unit tests for:

- **BedrockService**: AI model integration and response parsing
- **DynamoService**: Database operations and session management
- **Lambda Handlers**: API endpoint logic and error handling

All tests use mocked AWS services to avoid actual AWS charges during testing.

## Security

- **No AWS Credentials in Frontend**: All AWS operations handled server-side
- **Session-based Authentication**: Simple session management with expiration
- **CORS Configuration**: Proper cross-origin resource sharing setup
- **Input Validation**: Request validation and sanitization

## Monitoring

- **CloudWatch Logs**: Automatic logging for all Lambda functions
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Request Tracing**: Built-in request/response logging for debugging