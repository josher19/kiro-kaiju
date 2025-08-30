import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoService } from '../services/dynamoService';
import { v4 as uuidv4 } from 'uuid';

const dynamoService = new DynamoService();

export const authenticate = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    if (event.httpMethod === 'POST' && event.path === '/api/auth/login') {
      // Simple authentication - create session for any user
      if (!event.body) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
          },
          body: JSON.stringify({ error: 'Request body is required' })
        };
      }

      const { userId } = JSON.parse(event.body);
      
      if (!userId) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
          },
          body: JSON.stringify({ error: 'User ID is required' })
        };
      }

      // Create session
      const session = await dynamoService.createSession(userId);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
        },
        body: JSON.stringify({
          sessionId: session.sessionId,
          userId: session.userId,
          expiresAt: session.expiresAt
        })
      };
    }

    if (event.httpMethod === 'GET' && event.path === '/api/auth/session') {
      // Validate session
      const sessionId = event.headers.Authorization?.replace('Bearer ', '');
      
      if (!sessionId) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
          },
          body: JSON.stringify({ error: 'Session ID is required' })
        };
      }

      const session = await dynamoService.getSession(sessionId);
      
      if (!session) {
        return {
          statusCode: 401,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
          },
          body: JSON.stringify({ error: 'Invalid or expired session' })
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
        },
        body: JSON.stringify({
          userId: session.userId,
          sessionId: session.sessionId,
          expiresAt: session.expiresAt
        })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Auth handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, GET, OPTIONS'
      },
      body: JSON.stringify({ error: 'Authentication failed' })
    };
  }
};