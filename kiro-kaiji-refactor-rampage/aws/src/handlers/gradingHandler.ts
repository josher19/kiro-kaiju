import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockService } from '../services/bedrockService';
import { DynamoService } from '../services/dynamoService';
import { authenticateRequest, createUnauthorizedResponse } from '../middleware/auth';
import { AIGradingRequest, GradingRole, RoleEvaluation, GradingHistoryEntry } from '../types';

const bedrockService = new BedrockService();
const dynamoService = new DynamoService();

export const gradeCode = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    // Require authentication
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

    const { challengeId, submittedCode, requirements, userId }: AIGradingRequest = JSON.parse(event.body);

    if (!challengeId || !submittedCode || !requirements) {
      return {
        statusCode: 400,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Methods': 'POST, OPTIONS'
        },
        body: JSON.stringify({ error: 'Challenge ID, submitted code, and requirements are required' })
      };
    }

    // Add small delay to avoid quota issues
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Grade code using Bedrock AI
    const rawRoleScores = await bedrockService.gradeCode(submittedCode, requirements);
    
    // Convert to role evaluations
    const roleEvaluations: Record<GradingRole, RoleEvaluation> = {} as Record<GradingRole, RoleEvaluation>;
    let totalScore = 0;
    
    for (const [role, [score, feedback]] of Object.entries(rawRoleScores)) {
      roleEvaluations[role as GradingRole] = {
        role: role as GradingRole,
        score,
        feedback
      };
      totalScore += score;
    }

    const averageScore = totalScore / Object.keys(roleEvaluations).length;
    const gradingTimestamp = new Date().toISOString();

    const gradingResponse = {
      challengeId,
      modelUsed: 'anthropic.claude-3-haiku-20240307-v1:0',
      roleEvaluations,
      averageScore,
      gradingTimestamp
    };

    // Store grading history for authenticated user
    const gradingEntry: GradingHistoryEntry = {
      challengeId,
      gradingTimestamp,
      roleScores: Object.fromEntries(
        Object.entries(roleEvaluations).map(([role, evaluation]) => [role, evaluation.score])
      ) as Record<GradingRole, number>,
      averageScore,
      modelUsed: 'anthropic.claude-3-haiku-20240307-v1:0'
    };

    await dynamoService.addGradingHistory(auth.userId, gradingEntry);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify(gradingResponse)
    };
  } catch (error) {
    console.error('Code grading error:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ error: 'Failed to grade code' })
    };
  }
};