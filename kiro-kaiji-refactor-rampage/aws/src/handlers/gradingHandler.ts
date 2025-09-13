import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { BedrockService } from '../services/bedrockService';
import { DynamoService } from '../services/dynamoService';
import { authenticateRequest, createUnauthorizedResponse } from '../middleware/auth';
import { budgetEnforcementMiddleware, recordCostMetrics } from './budgetHandler';
import { CostManagementService } from '../services/costManagementService';
import { AIGradingRequest, GradingRole, RoleEvaluation, GradingHistoryEntry } from '../types';
const budgetConfig = require('../../budget-config.json');

const bedrockService = new BedrockService();
const dynamoService = new DynamoService();
const costManagement = new CostManagementService({
  monthlyBudgetLimit: budgetConfig.monthlyLimit,
  alertThresholds: budgetConfig.alertThresholds,
  snsTopicArn: process.env.SNS_TOPIC_ARN,
  region: process.env.AWS_REGION || 'us-east-1',
  automaticShutoff: budgetConfig.automaticShutoff,
  gracePeriodHours: budgetConfig.gracePeriodHours
});

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

    const { challengeId, submittedCode, requirements }: AIGradingRequest = JSON.parse(event.body);

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

    // Estimate cost for grading request (typically larger than chat)
    const inputTokens = submittedCode.length + requirements.join(' ').length + 2000; // Include grading prompt
    const estimatedOutputTokens = 1500; // Grading responses are typically detailed
    const selectedModel = costManagement.getCostOptimizedModel(['anthropic.claude-3-haiku-20240307-v1:0']);
    const estimatedCost = costManagement.estimateAIRequestCost(selectedModel, inputTokens, estimatedOutputTokens);

    // Check budget constraints before processing
    const budgetCheck = await budgetEnforcementMiddleware('ai-code-grading', estimatedCost);
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

    // Add small delay to avoid quota issues
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Grade code using Bedrock AI
    const rawRoleScores = await bedrockService.gradeCode(submittedCode, requirements);
    
    // Record actual cost
    await recordCostMetrics('bedrock', 'code-grading', estimatedCost);
    
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