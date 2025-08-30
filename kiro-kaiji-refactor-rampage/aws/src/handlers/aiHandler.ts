import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockService } from '../services/bedrockService';

const bedrockService = new BedrockService();

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

    const { messages, model, max_tokens, temperature } = JSON.parse(event.body);

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

    // Add small delay to avoid quota issues
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Get response from Bedrock
    const response = await bedrockService.chatCompletion(messages, model);

    // Return in OpenAI-compatible format
    const completion = {
      id: `chatcmpl-${Date.now()}`,
      object: "chat.completion",
      created: Math.floor(Date.now() / 1000),
      model: model || "anthropic.claude-3-haiku-20240307-v1:0",
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
        prompt_tokens: messages.reduce((sum: number, msg: any) => sum + msg.content.length, 0),
        completion_tokens: response.length,
        total_tokens: messages.reduce((sum: number, msg: any) => sum + msg.content.length, 0) + response.length
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