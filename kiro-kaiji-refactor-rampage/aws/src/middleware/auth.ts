import { APIGatewayProxyEvent } from 'aws-lambda';
import { DynamoService } from '../services/dynamoService';

const dynamoService = new DynamoService();

export interface AuthenticatedEvent extends APIGatewayProxyEvent {
  userId?: string;
  sessionId?: string;
}

export async function authenticateRequest(event: APIGatewayProxyEvent): Promise<{ userId: string; sessionId: string } | null> {
  const authHeader = event.headers.Authorization || event.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const sessionId = authHeader.replace('Bearer ', '');
  
  try {
    const session = await dynamoService.getSession(sessionId);
    
    if (!session) {
      return null;
    }

    return {
      userId: session.userId,
      sessionId: session.sessionId
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function createUnauthorizedResponse() {
  return {
    statusCode: 401,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS'
    },
    body: JSON.stringify({ error: 'Unauthorized - valid session required' })
  };
}