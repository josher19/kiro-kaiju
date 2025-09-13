import { CostManagementService } from '../costManagementService';
import type { CostManagementConfig } from '../costManagementService';

// Mock AWS SDK clients
jest.mock('@aws-sdk/client-cloudwatch');
jest.mock('@aws-sdk/client-sns');
jest.mock('@aws-sdk/client-cost-explorer');

describe('CostManagementService', () => {
  let costManagement: CostManagementService;
  let mockConfig: CostManagementConfig;

  beforeEach(() => {
    mockConfig = {
      monthlyBudgetLimit: 15.0,
      alertThresholds: [50, 80, 95],
      snsTopicArn: 'arn:aws:sns:us-east-1:123456789012:test-topic',
      region: 'us-east-1',
      automaticShutoff: true,
      gracePeriodHours: 2
    };

    costManagement = new CostManagementService(mockConfig);
  });

  describe('getBudgetStatus', () => {
    it('should return ok status when spending is below thresholds', async () => {
      // Mock getCurrentMonthSpending to return low spending
      jest.spyOn(costManagement, 'getCurrentMonthSpending').mockResolvedValue(5.0);

      const status = await costManagement.getBudgetStatus();

      expect(status.status).toBe('ok');
      expect(status.currentSpending).toBe(5.0);
      expect(status.budgetLimit).toBe(15.0);
      expect(status.percentageUsed).toBeCloseTo(33.33);
      expect(status.remainingBudget).toBe(10.0);
      expect(status.isShutdownRequired).toBe(false);
    });

    it('should return warning status when spending exceeds 80% threshold', async () => {
      jest.spyOn(costManagement, 'getCurrentMonthSpending').mockResolvedValue(12.5);

      const status = await costManagement.getBudgetStatus();

      expect(status.status).toBe('warning');
      expect(status.alertLevel).toBe(80);
      expect(status.percentageUsed).toBeCloseTo(83.33);
    });

    it('should return critical status when spending exceeds 95% threshold', async () => {
      jest.spyOn(costManagement, 'getCurrentMonthSpending').mockResolvedValue(14.5);

      const status = await costManagement.getBudgetStatus();

      expect(status.status).toBe('critical');
      expect(status.alertLevel).toBe(95);
      expect(status.percentageUsed).toBeCloseTo(96.67);
    });

    it('should return exceeded status when spending exceeds budget limit', async () => {
      jest.spyOn(costManagement, 'getCurrentMonthSpending').mockResolvedValue(16.0);

      const status = await costManagement.getBudgetStatus();

      expect(status.status).toBe('exceeded');
      expect(status.percentageUsed).toBeCloseTo(106.67);
      expect(status.remainingBudget).toBe(0);
      expect(status.isShutdownRequired).toBe(true);
    });
  });

  describe('shouldBlockApiCalls', () => {
    it('should return false when budget is not exceeded', async () => {
      jest.spyOn(costManagement, 'getCurrentMonthSpending').mockResolvedValue(10.0);

      const shouldBlock = await costManagement.shouldBlockApiCalls();

      expect(shouldBlock).toBe(false);
    });

    it('should return true when budget is exceeded', async () => {
      jest.spyOn(costManagement, 'getCurrentMonthSpending').mockResolvedValue(16.0);

      const shouldBlock = await costManagement.shouldBlockApiCalls();

      expect(shouldBlock).toBe(true);
    });
  });

  describe('getCostOptimizedModel', () => {
    it('should return the cheapest available model', () => {
      const availableModels = [
        'anthropic.claude-v2',
        'anthropic.claude-3-haiku-20240307-v1:0',
        'amazon.titan-text-lite-v1'
      ];

      const optimizedModel = costManagement.getCostOptimizedModel(availableModels);

      expect(optimizedModel).toBe('anthropic.claude-3-haiku-20240307-v1:0');
    });

    it('should return first available model if no preferred models are available', () => {
      const availableModels = ['some-expensive-model', 'another-expensive-model'];

      const optimizedModel = costManagement.getCostOptimizedModel(availableModels);

      expect(optimizedModel).toBe('some-expensive-model');
    });

    it('should return fallback model if no models are available', () => {
      const availableModels: string[] = [];

      const optimizedModel = costManagement.getCostOptimizedModel(availableModels);

      expect(optimizedModel).toBe('anthropic.claude-3-haiku-20240307-v1:0');
    });
  });

  describe('estimateAIRequestCost', () => {
    it('should calculate cost correctly for Claude Haiku model', () => {
      const cost = costManagement.estimateAIRequestCost(
        'anthropic.claude-3-haiku-20240307-v1:0',
        1000, // input tokens
        500   // output tokens
      );

      // Expected: (1000/1000 * 0.00025) + (500/1000 * 0.00125) = 0.00025 + 0.000625 = 0.000875
      expect(cost).toBeCloseTo(0.000875);
    });

    it('should use fallback costs for unknown models', () => {
      const cost = costManagement.estimateAIRequestCost(
        'unknown-model',
        1000, // input tokens
        500   // output tokens
      );

      // Expected fallback: (1000/1000 * 0.001) + (500/1000 * 0.002) = 0.001 + 0.001 = 0.002
      expect(cost).toBeCloseTo(0.002);
    });
  });

  describe('formatAlertMessage', () => {
    it('should format alert message correctly for exceeded budget', () => {
      const budgetStatus = {
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded' as const,
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      };

      const message = (costManagement as any).formatAlertMessage(budgetStatus);

      expect(message).toContain('Status: EXCEEDED');
      expect(message).toContain('Current Spending: $16.00');
      expect(message).toContain('Budget Limit: $15.00');
      expect(message).toContain('AUTOMATIC SHUTDOWN REQUIRED');
    });

    it('should format alert message correctly for warning status', () => {
      const budgetStatus = {
        currentSpending: 12.0,
        budgetLimit: 15.0,
        percentageUsed: 80.0,
        status: 'warning' as const,
        alertLevel: 80,
        remainingBudget: 3.0,
        isShutdownRequired: false
      };

      const message = (costManagement as any).formatAlertMessage(budgetStatus);

      expect(message).toContain('Status: WARNING');
      expect(message).toContain('Monitor usage closely');
      expect(message).not.toContain('AUTOMATIC SHUTDOWN REQUIRED');
    });
  });

  describe('setupCloudWatchAlarms', () => {
    it('should create alarms for each threshold when CloudWatch is enabled', async () => {
      const mockConfigWithCloudWatch = {
        ...mockConfig,
        cloudWatch: {
          enabled: true,
          metricNamespace: 'KiroKaiju/Costs',
          alarmPrefix: 'KiroKaiju-Budget',
          costMetricName: 'MonthlySpending',
          alertActions: { '50': 'notification', '80': 'warning', '95': 'critical' },
          monitoringFrequency: 'daily',
          retentionDays: 30
        }
      };

      const costManagementWithCloudWatch = new CostManagementService(mockConfigWithCloudWatch);
      const mockPutMetricAlarm = jest.fn().mockResolvedValue({});
      
      (costManagementWithCloudWatch as any).cloudWatch = {
        send: mockPutMetricAlarm
      };

      await costManagementWithCloudWatch.setupCloudWatchAlarms();

      // Should create 3 alarms (one for each threshold: 50%, 80%, 95%)
      expect(mockPutMetricAlarm).toHaveBeenCalledTimes(3);
    });

    it('should skip alarm creation when CloudWatch is disabled', async () => {
      const mockConfigWithoutCloudWatch = {
        ...mockConfig,
        cloudWatch: { enabled: false }
      };

      const costManagementWithoutCloudWatch = new CostManagementService(mockConfigWithoutCloudWatch as any);
      const mockPutMetricAlarm = jest.fn();
      
      (costManagementWithoutCloudWatch as any).cloudWatch = {
        send: mockPutMetricAlarm
      };

      await costManagementWithoutCloudWatch.setupCloudWatchAlarms();

      expect(mockPutMetricAlarm).not.toHaveBeenCalled();
    });
  });

  describe('enforceBudgetConstraints', () => {
    it('should return no action when budget enforcement is disabled', async () => {
      const mockConfigWithoutEnforcement = {
        ...mockConfig,
        budgetEnforcement: undefined
      };

      const costManagementWithoutEnforcement = new CostManagementService(mockConfigWithoutEnforcement);
      jest.spyOn(costManagementWithoutEnforcement, 'getBudgetStatus').mockResolvedValue({
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded',
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      });

      const result = await costManagementWithoutEnforcement.enforceBudgetConstraints();

      expect(result.actionTaken).toBe('none');
      expect(result.shutdownRequired).toBe(false);
    });

    it('should block API calls when budget is exceeded', async () => {
      const mockConfigWithEnforcement = {
        ...mockConfig,
        budgetEnforcement: {
          preventNewApiCalls: true,
          shutdownServices: false,
          notifyAdministrators: true,
          logBudgetViolations: true
        }
      };

      const costManagementWithEnforcement = new CostManagementService(mockConfigWithEnforcement);
      jest.spyOn(costManagementWithEnforcement, 'getBudgetStatus').mockResolvedValue({
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded',
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      });

      // Mock private methods
      jest.spyOn(costManagementWithEnforcement as any, 'isInGracePeriod').mockResolvedValue(false);
      jest.spyOn(costManagementWithEnforcement as any, 'logBudgetViolation').mockResolvedValue(undefined);
      jest.spyOn(costManagementWithEnforcement, 'recordCostMetrics').mockResolvedValue(undefined);
      jest.spyOn(costManagementWithEnforcement, 'sendCostAlert').mockResolvedValue(undefined);

      const result = await costManagementWithEnforcement.enforceBudgetConstraints();

      expect(result.actionTaken).toBe('api-calls-blocked');
      expect(result.shutdownRequired).toBe(false);
      expect(result.gracePeriodActive).toBe(false);
    });

    it('should initiate service shutdown when budget exceeded and grace period expired', async () => {
      const mockConfigWithShutdown = {
        ...mockConfig,
        budgetEnforcement: {
          preventNewApiCalls: true,
          shutdownServices: true,
          notifyAdministrators: true,
          logBudgetViolations: true
        }
      };

      const costManagementWithShutdown = new CostManagementService(mockConfigWithShutdown);
      jest.spyOn(costManagementWithShutdown, 'getBudgetStatus').mockResolvedValue({
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded',
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      });

      // Mock private methods
      jest.spyOn(costManagementWithShutdown as any, 'isInGracePeriod').mockResolvedValue(false);
      jest.spyOn(costManagementWithShutdown as any, 'logBudgetViolation').mockResolvedValue(undefined);
      jest.spyOn(costManagementWithShutdown as any, 'initiateServiceShutdown').mockResolvedValue(undefined);
      jest.spyOn(costManagementWithShutdown, 'recordCostMetrics').mockResolvedValue(undefined);
      jest.spyOn(costManagementWithShutdown, 'sendCostAlert').mockResolvedValue(undefined);

      const result = await costManagementWithShutdown.enforceBudgetConstraints();

      expect(result.actionTaken).toBe('service-shutdown');
      expect(result.shutdownRequired).toBe(true);
      expect(result.gracePeriodActive).toBe(false);
    });
  });

  describe('getCostOptimizationStrategies', () => {
    it('should return basic strategies when budget usage is below 80%', async () => {
      jest.spyOn(costManagement, 'getBudgetStatus').mockResolvedValue({
        currentSpending: 10.0,
        budgetLimit: 15.0,
        percentageUsed: 66.67,
        status: 'ok',
        alertLevel: 0,
        remainingBudget: 5.0,
        isShutdownRequired: false
      });

      const strategies = await costManagement.getCostOptimizationStrategies();

      expect(strategies.emergencyMode).toBe(false);
      expect(strategies.strategies).toHaveLength(0);
      expect(strategies.recommendedActions).toHaveLength(0);
    });

    it('should return cost reduction strategies when budget usage exceeds 80%', async () => {
      jest.spyOn(costManagement, 'getBudgetStatus').mockResolvedValue({
        currentSpending: 12.5,
        budgetLimit: 15.0,
        percentageUsed: 83.33,
        status: 'warning',
        alertLevel: 80,
        remainingBudget: 2.5,
        isShutdownRequired: false
      });

      const strategies = await costManagement.getCostOptimizationStrategies();

      expect(strategies.emergencyMode).toBe(false);
      expect(strategies.strategies.length).toBeGreaterThan(0);
      expect(strategies.strategies).toContain('Use only the cheapest AI models');
      expect(strategies.recommendedActions).toContain('Switch to local LLM if available');
    });

    it('should return emergency strategies when budget usage exceeds 95%', async () => {
      jest.spyOn(costManagement, 'getBudgetStatus').mockResolvedValue({
        currentSpending: 14.5,
        budgetLimit: 15.0,
        percentageUsed: 96.67,
        status: 'critical',
        alertLevel: 95,
        remainingBudget: 0.5,
        isShutdownRequired: false
      });

      const strategies = await costManagement.getCostOptimizationStrategies();

      expect(strategies.emergencyMode).toBe(true);
      expect(strategies.strategies).toContain('Block all non-critical API calls');
      expect(strategies.recommendedActions).toContain('Require OpenRouter API key for continued usage');
    });

    it('should return shutdown strategies when budget is exceeded', async () => {
      jest.spyOn(costManagement, 'getBudgetStatus').mockResolvedValue({
        currentSpending: 16.0,
        budgetLimit: 15.0,
        percentageUsed: 106.67,
        status: 'exceeded',
        alertLevel: 95,
        remainingBudget: 0,
        isShutdownRequired: true
      });

      const strategies = await costManagement.getCostOptimizationStrategies();

      expect(strategies.emergencyMode).toBe(true);
      expect(strategies.strategies).toContain('Complete service shutdown');
      expect(strategies.recommendedActions).toContain('Manual intervention required');
    });
  });
});