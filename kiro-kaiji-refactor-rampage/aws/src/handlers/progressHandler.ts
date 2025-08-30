import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoService } from '../services/dynamoService';
import { UserProgress } from '../types';

const dynamoService = new DynamoService();

export const updateProgress = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const userId = event.pathParameters?.userId;
    
    if (!userId) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({ error: 'User ID is required' })
      };
    }

    if (event.httpMethod === 'GET') {
      // Get user progress
      const progress = await dynamoService.getUserProgress(userId);
      
      if (!progress) {
        // Return default progress for new users
        const defaultProgress: UserProgress = {
          userId,
          completedChallenges: [],
          achievements: [],
          stats: {
            totalChallenges: 0,
            averageScore: 0,
            kaijuDefeated: {}
          },
          gradingHistory: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        return {
          statusCode: 200,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
          },
          body: JSON.stringify(defaultProgress)
        };
      }

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify(progress)
      };
    }

    if (event.httpMethod === 'PUT') {
      // Update user progress
      if (!event.body) {
        return {
          statusCode: 400,
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
          },
          body: JSON.stringify({ error: 'Request body is required' })
        };
      }

      const progressUpdate: UserProgress = JSON.parse(event.body);
      progressUpdate.userId = userId; // Ensure userId matches path parameter
      
      await dynamoService.updateUserProgress(progressUpdate);

      return {
        statusCode: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
        },
        body: JSON.stringify({ message: 'Progress updated successfully' })
      };
    }

    return {
      statusCode: 405,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    console.error('Progress handler error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS'
      },
      body: JSON.stringify({ error: 'Failed to handle progress request' })
    };
  }
};