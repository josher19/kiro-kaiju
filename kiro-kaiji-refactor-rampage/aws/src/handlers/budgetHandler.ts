import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { CostManagementService } from '../services/costManagementService';
import type { BudgetConfig, BudgetStatus } from '../types';
const budgetConfig = require('../../budget-config.json');

const costManagement = new CostManagementService({
  monthlyBudgetLimit: budgetConfig.monthlyLimit,
  alertThresholds: budgetConfig.alertThresholds,
  snsTopicArn: process.env.SNS_TOPIC_ARN,
  region: process.env.AWS_REGION || 'us-east-1',
  automaticShutoff: budgetConfig.automaticShutoff,
  gracePeriodHours: budgetConfig.gracePeriodHours
});

/**
 * Get current budget status
 */
export const getBudgetStatus = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const budgetStatus = await costManagement.getBudgetStatus();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: budgetStatus
      })
    };
  } catch (error) {
    console.error('Failed to get budget status:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get budget status'
      })
    };
  }
};

/**
 * Check if API calls should be blocked due to budget constraints
 */
export const checkBudgetConstraints = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const shouldBlock = await costManagement.shouldBlockApiCalls();
    const budgetStatus = await costManagement.getBudgetStatus();

    // Send alert if budget thresholds are exceeded
    if (budgetStatus.status !== 'ok') {
      await costManagement.sendCostAlert(budgetStatus);
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {
          shouldBlock,
          budgetStatus,
          fallbackOptions: budgetConfig.fallbackOptions
        }
      })
    };
  } catch (error) {
    console.error('Failed to check budget constraints:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to check budget constraints'
      })
    };
  }
};

/**
 * Get cost-optimized AI model recommendation
 */
export const getCostOptimizedModel = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const body = event.body ? JSON.parse(event.body) : {};
    const { availableModels = [] } = body;

    const recommendedModel = costManagement.getCostOptimizedModel(availableModels);
    const budgetStatus = await costManagement.getBudgetStatus();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {
          recommendedModel,
          budgetStatus: budgetStatus.status,
          remainingBudget: budgetStatus.remainingBudget,
          costOptimization: budgetConfig.costOptimization
        }
      })
    };
  } catch (error) {
    console.error('Failed to get cost-optimized model:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get cost-optimized model'
      })
    };
  }
};

/**
 * Middleware to check budget before processing expensive operations
 */
export const budgetEnforcementMiddleware = async (
  operation: string,
  estimatedCost: number = 0
): Promise<{ allowed: boolean; reason?: string; fallbackOptions?: any }> => {
  try {
    const budgetStatus = await costManagement.getBudgetStatus();
    
    // Block if budget is exceeded
    if (budgetStatus.status === 'exceeded') {
      return {
        allowed: false,
        reason: 'Monthly budget limit exceeded',
        fallbackOptions: budgetConfig.fallbackOptions
      };
    }

    // Check if estimated cost would exceed remaining budget
    if (estimatedCost > budgetStatus.remainingBudget) {
      return {
        allowed: false,
        reason: 'Operation would exceed remaining budget',
        fallbackOptions: budgetConfig.fallbackOptions
      };
    }

    // Check if cost per request exceeds maximum
    if (estimatedCost > budgetConfig.costOptimization.maxCostPerRequest) {
      return {
        allowed: false,
        reason: 'Operation cost exceeds maximum per-request limit',
        fallbackOptions: budgetConfig.fallbackOptions
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Budget enforcement check failed:', error);
    // Allow operation if budget check fails to avoid blocking legitimate requests
    return { allowed: true };
  }
};

/**
 * Record cost metrics for monitoring
 */
export const recordCostMetrics = async (
  service: string,
  operation: string,
  cost: number
): Promise<void> => {
  try {
    await costManagement.recordCostMetrics(cost, service);
    console.log(`Recorded cost metrics: ${service}/${operation} - $${cost.toFixed(4)}`);
  } catch (error) {
    console.error('Failed to record cost metrics:', error);
  }
};
/**
 
* Setup CloudWatch monitoring and alarms
 */
export const setupBudgetMonitoring = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    await costManagement.setupCloudWatchAlarms();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        message: 'Budget monitoring setup completed'
      })
    };
  } catch (error) {
    console.error('Failed to setup budget monitoring:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to setup budget monitoring'
      })
    };
  }
};

/**
 * Enforce budget constraints and handle automatic shutdown
 */
export const enforceBudgetConstraints = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const enforcement = await costManagement.enforceBudgetConstraints();
    const budgetStatus = await costManagement.getBudgetStatus();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'POST,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {
          enforcement,
          budgetStatus,
          fallbackOptions: budgetConfig.fallbackOptions
        }
      })
    };
  } catch (error) {
    console.error('Failed to enforce budget constraints:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to enforce budget constraints'
      })
    };
  }
};

/**
 * Get cost optimization strategies
 */
export const getCostOptimizationStrategies = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  try {
    const strategies = await costManagement.getCostOptimizationStrategies();
    const budgetStatus = await costManagement.getBudgetStatus();

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,OPTIONS'
      },
      body: JSON.stringify({
        success: true,
        data: {
          strategies,
          budgetStatus: budgetStatus.status,
          remainingBudget: budgetStatus.remainingBudget,
          percentageUsed: budgetStatus.percentageUsed
        }
      })
    };
  } catch (error) {
    console.error('Failed to get cost optimization strategies:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: false,
        error: 'Failed to get cost optimization strategies'
      })
    };
  }
};