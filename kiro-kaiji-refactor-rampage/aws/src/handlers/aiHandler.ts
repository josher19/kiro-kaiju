import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockService } from '../services/bedrockService';
import { authenticateRequest, createUnauthorizedResponse } from '../middleware/auth';
import { budgetEnforcementMiddleware, recordCostMetrics } from './budgetHandler';
import { CostManagementService } from '../services/costManagementService';
const budgetConfig = require('../../budget-config.json');

const bedrockService = new BedrockService();
const costManagement = new CostManagementService({
  monthlyBudgetLimit: budgetConfig.monthlyLimit,
  alertThresholds: budgetConfig.alertThresholds,
  snsTopicArn: process.env.SNS_TOPIC_ARN,
  region: process.env.AWS_REGION || 'us-east-1',
  automaticShutoff: budgetConfig.automaticShutoff,
  gracePeriodHours: budgetConfig.gracePeriodHours
});

export const getModels = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Return available models in OpenAI-compatible format
    const models = {
      object: "list",
      data: [
        {
          id: "anthropic.claude-3-haiku-20240307-v1:0",
          object: "model",
          created: Date.now(),
          owned_by: "anthropic",
          permission: [],
          root: "anthropic.claude-3-haiku-20240307-v1:0",
          parent: null
        }
      ]
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify(models)
    };
  } catch (error) {
    console.error('Get models error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, OPTIONS'
      },
      body: JSON.stringify({ error: 'Failed to get models' })
    };
  }
};

export const chatCompletion = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Require authentication for chat completions
    const auth = await authenticateRequest(event);
    if (!auth) {
      return createUnauthorizedResponse();
    }

    if (!event.body) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Request body is required' })
      };
    }

    const { messages, model, max_tokens = 2000, temperature = 0.7 } = JSON.parse(event.body);

    if (!messages || !Array.isArray(messages)) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Messages array is required' })
      };
    }

    // Estimate cost for this request
    const inputTokens = messages.reduce((sum: number, msg: any) => sum + (msg.content?.length || 0), 0);
    const estimatedOutputTokens = Math.min(max_tokens, 1000); // Conservative estimate
    const selectedModel = model || costManagement.getCostOptimizedModel(['anthropic.claude-3-haiku-20240307-v1:0']);
    const estimatedCost = costManagement.estimateAIRequestCost(selectedModel, inputTokens, estimatedOutputTokens);

    console.log('model', { model, selectedModel, max_tokens });

    // Check budget constraints before processing
    const budgetCheck = await budgetEnforcementMiddleware('ai-chat-completion', estimatedCost);
    if (!budgetCheck.allowed) {
      return {
        statusCode: 429,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({
          error: 'Budget limit exceeded',
          reason: budgetCheck.reason,
          fallbackOptions: budgetCheck.fallbackOptions
        })
      };
    }

    // Get response from Bedrock using cost-optimized model
    const response = await bedrockService.chatCompletion(messages, selectedModel, max_tokens);

    // Add small delay to avoid quota issues
    await new Promise(resolve => setTimeout(resolve, 500));

    // Calculate actual cost and record metrics
    const actualOutputTokens = response.length;
    const actualCost = costManagement.estimateAIRequestCost(selectedModel, inputTokens, actualOutputTokens);
    await recordCostMetrics('bedrock', 'chat-completion', actualCost);

    // Return in OpenAI-compatible format
    const completion = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: selectedModel,
      choices: [
        {
          index: 0,
          message: {
            role: "assistant",
            content: response
          },
          finish_reason: "stop"
        }
      ],
      usage: {
        prompt_tokens: inputTokens,
        completion_tokens: actualOutputTokens,
        total_tokens: inputTokens + actualOutputTokens
      }
    };

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(completion)
    };
  } catch (error) {
    console.error('Chat completion error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Failed to complete chat' })
    };
  }
};
