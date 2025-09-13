import { APIGatewayProxyEvent } from 'aws-lambda';
import { 
  getBudgetStatus, 
  checkBudgetConstraints, 
  getCostOptimizedModel, 
  budgetEnforcementMiddleware,
  setupBudgetMonitoring,
  enforceBudgetConstraints,
  getCostOptimizationStrategies
} from '../budgetHandler';

// Mock the cost management service
jest.mock('../../services/costManagementService');

// Mock budget config - we'll mock the actual config values in the service

describe('Budget Handler', () => {
  let mockEvent: APIGatewayProxyEvent;

  beforeEach(() => {
    mockEvent = {
      httpMethod: 'GET',
      path: '/api/budget/status',
      headers: {},
      queryStringParameters: null,
      body: null,
      isBase64Encoded: false,
      pathParameters: null,
      stageVariables: null,
      requestContext: {} as any,
      multiValueHeaders: {},
      multiValueQueryStringParameters: null,
      resource: ''
    };

    // Reset environment variables
    process.env.AWS_REGION = 'us-east-1';
  });

  describe('getBudgetStatus', () => {
    it('should return budget status successfully', async () => {
      const mockBudgetStatus = {
        currentSpending: 10.0,
        budgetLimit: 15.0,
        percentageUsed: 66.67,
        status: 'warning',
        alertLevel: 50,
        remainingBudget: 5.0,
        isShutdownRequired: false
      };

      // Mock the cost management service
      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await getBudgetStatus(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        data: mockBudgetStatus
      });
    });

    it('should handle errors gracefully', async () => {
      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockRejectedValue(new Error('Service error'));

      const result = await getBudgetStatus(mockEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Failed to get budget status'
      });
    });
  });

  describe('checkBudgetConstraints', () => {
    it('should return budget constraints with blocking when budget exceeded', async () => {
      const mockBudgetStatus = {
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded',
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.shouldBlockApiCalls = jest.fn().mockResolvedValue(true);
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);
      CostManagementService.prototype.sendCostAlert = jest.fn().mockResolvedValue(undefined);

      const result = await checkBudgetConstraints(mockEvent);

      expect(result.statusCode).toBe(200);
      const responseData = JSON.parse(result.body).data;
      expect(responseData.shouldBlock).toBe(true);
      expect(responseData.budgetStatus.status).toBe('exceeded');
      expect(responseData.fallbackOptions.switchToLocalMode).toBe(true);
    });

    it('should not block when budget is within limits', async () => {
      const mockBudgetStatus = {
        currentSpending: 8.0,
        budgetLimit: 15.0,
        percentageUsed: 53.33,
        status: 'ok',
        alertLevel: 0,
        remainingBudget: 7.0,
        isShutdownRequired: false
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.shouldBlockApiCalls = jest.fn().mockResolvedValue(false);
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);
      CostManagementService.prototype.sendCostAlert = jest.fn().mockResolvedValue(undefined);

      const result = await checkBudgetConstraints(mockEvent);

      expect(result.statusCode).toBe(200);
      const responseData = JSON.parse(result.body).data;
      expect(responseData.shouldBlock).toBe(false);
      expect(responseData.budgetStatus.status).toBe('ok');
    });
  });

  describe('getCostOptimizedModel', () => {
    it('should return cost-optimized model recommendation', async () => {
      const mockEventWithBody = {
        ...mockEvent,
        body: JSON.stringify({
          availableModels: [
            'anthropic.claude-v2',
            'anthropic.claude-3-haiku-20240307-v1:0',
            'amazon.titan-text-lite-v1'
          ]
        })
      };

      const mockBudgetStatus = {
        currentSpending: 5.0,
        budgetLimit: 15.0,
        percentageUsed: 33.33,
        status: 'ok',
        alertLevel: 0,
        remainingBudget: 10.0,
        isShutdownRequired: false
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getCostOptimizedModel = jest.fn()
        .mockReturnValue('anthropic.claude-3-haiku-20240307-v1:0');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await getCostOptimizedModel(mockEventWithBody);

      expect(result.statusCode).toBe(200);
      const responseData = JSON.parse(result.body).data;
      expect(responseData.recommendedModel).toBe('anthropic.claude-3-haiku-20240307-v1:0');
      expect(responseData.budgetStatus).toBe('ok');
      expect(responseData.remainingBudget).toBe(10.0);
    });

    it('should handle missing request body', async () => {
      const mockEventWithoutBody = { ...mockEvent, body: null };

      const result = await getCostOptimizedModel(mockEventWithoutBody);

      expect(result.statusCode).toBe(200);
      // Should still work with empty availableModels array
    });
  });

  describe('budgetEnforcementMiddleware', () => {
    it('should allow operation when budget is within limits', async () => {
      const mockBudgetStatus = {
        currentSpending: 5.0,
        budgetLimit: 15.0,
        percentageUsed: 33.33,
        status: 'ok',
        alertLevel: 0,
        remainingBudget: 10.0,
        isShutdownRequired: false
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await budgetEnforcementMiddleware('test-operation', 0.005);

      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should block operation when budget is exceeded', async () => {
      const mockBudgetStatus = {
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded',
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await budgetEnforcementMiddleware('test-operation', 0.005);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Monthly budget limit exceeded');
      expect(result.fallbackOptions).toBeDefined();
    });

    it('should block operation when estimated cost exceeds remaining budget', async () => {
      const mockBudgetStatus = {
        currentSpending: 14.0,
        budgetLimit: 15.0,
        percentageUsed: 93.33,
        status: 'critical',
        alertLevel: 95,
        remainingBudget: 1.0,
        isShutdownRequired: false
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await budgetEnforcementMiddleware('test-operation', 2.0);

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Operation would exceed remaining budget');
    });

    it('should block operation when cost per request exceeds maximum', async () => {
      const mockBudgetStatus = {
        currentSpending: 5.0,
        budgetLimit: 15.0,
        percentageUsed: 33.33,
        status: 'ok',
        alertLevel: 0,
        remainingBudget: 10.0,
        isShutdownRequired: false
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await budgetEnforcementMiddleware('test-operation', 0.02); // Exceeds 0.01 limit

      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Operation cost exceeds maximum per-request limit');
    });

    it('should allow operation if budget check fails', async () => {
      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockRejectedValue(new Error('Service error'));

      const result = await budgetEnforcementMiddleware('test-operation', 0.005);

      expect(result.allowed).toBe(true);
      // Should allow operation to avoid blocking legitimate requests when monitoring fails
    });
  });

  describe('setupBudgetMonitoring', () => {
    it('should setup CloudWatch alarms successfully', async () => {
      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.setupCloudWatchAlarms = jest.fn().mockResolvedValue(undefined);

      const result = await setupBudgetMonitoring(mockEvent);

      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        success: true,
        message: 'Budget monitoring setup completed'
      });
    });

    it('should handle setup errors gracefully', async () => {
      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.setupCloudWatchAlarms = jest.fn().mockRejectedValue(new Error('Setup failed'));

      const result = await setupBudgetMonitoring(mockEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Failed to setup budget monitoring'
      });
    });
  });

  describe('enforceBudgetConstraints', () => {
    it('should enforce budget constraints and return enforcement details', async () => {
      const mockEnforcement = {
        actionTaken: 'api-calls-blocked',
        shutdownRequired: false,
        gracePeriodActive: false
      };

      const mockBudgetStatus = {
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded',
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.enforceBudgetConstraints = jest.fn().mockResolvedValue(mockEnforcement);
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await enforceBudgetConstraints(mockEvent);

      expect(result.statusCode).toBe(200);
      const responseData = JSON.parse(result.body).data;
      expect(responseData.enforcement).toEqual(mockEnforcement);
      expect(responseData.budgetStatus).toEqual(mockBudgetStatus);
      expect(responseData.fallbackOptions).toBeDefined();
    });

    it('should handle enforcement errors', async () => {
      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.enforceBudgetConstraints = jest.fn().mockRejectedValue(new Error('Enforcement failed'));

      const result = await enforceBudgetConstraints(mockEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Failed to enforce budget constraints'
      });
    });
  });

  describe('getCostOptimizationStrategies', () => {
    it('should return cost optimization strategies', async () => {
      const mockStrategies = {
        strategies: ['Use only the cheapest AI models', 'Reduce token limits'],
        recommendedActions: ['Switch to local LLM', 'Disable non-essential features'],
        emergencyMode: false
      };

      const mockBudgetStatus = {
        currentSpending: 12.0,
        budgetLimit: 15.0,
        percentageUsed: 80.0,
        status: 'warning',
        alertLevel: 80,
        remainingBudget: 3.0,
        isShutdownRequired: false
      };

      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getCostOptimizationStrategies = jest.fn().mockResolvedValue(mockStrategies);
      CostManagementService.prototype.getBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);

      const result = await getCostOptimizationStrategies(mockEvent);

      expect(result.statusCode).toBe(200);
      const responseData = JSON.parse(result.body).data;
      expect(responseData.strategies).toEqual(mockStrategies);
      expect(responseData.budgetStatus).toBe('warning');
      expect(responseData.remainingBudget).toBe(3.0);
      expect(responseData.percentageUsed).toBe(80.0);
    });

    it('should handle strategy retrieval errors', async () => {
      const { CostManagementService } = require('../../services/costManagementService');
      CostManagementService.prototype.getCostOptimizationStrategies = jest.fn().mockRejectedValue(new Error('Strategy failed'));

      const result = await getCostOptimizationStrategies(mockEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body)).toEqual({
        success: false,
        error: 'Failed to get cost optimization strategies'
      });
    });
  });
});