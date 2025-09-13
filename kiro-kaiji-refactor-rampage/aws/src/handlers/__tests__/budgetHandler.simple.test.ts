import { budgetEnforcementMiddleware } from '../budgetHandler';

// Mock the cost management service
jest.mock('../../services/costManagementService', () => ({
  CostManagementService: jest.fn().mockImplementation(() => ({
    getBudgetStatus: jest.fn()
  }))
}));

// Mock budget config
jest.mock('../../budget-config.json', () => ({
  monthlyLimit: 15.0,
  alertThresholds: [50, 80, 95],
  automaticShutoff: true,
  gracePeriodHours: 2,
  costOptimization: {
    prioritizeFreeTier: true,
    maxCostPerRequest: 0.01,
    preferredModels: ['anthropic.claude-3-haiku-20240307-v1:0']
  },
  fallbackOptions: {
    switchToLocalMode: true,
    requireOpenRouterKey: true,
    disableAIFeatures: false
  }
}), { virtual: true });

describe('Budget Handler - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('budgetEnforcementMiddleware', () => {
    it('should allow operation when budget check fails (graceful degradation)', async () => {
      const { CostManagementService } = require('../../services/costManagementService');
      const mockInstance = new CostManagementService();
      mockInstance.getBudgetStatus = jest.fn().mockRejectedValue(new Error('Service error'));

      const result = await budgetEnforcementMiddleware('test-operation', 0.005);

      expect(result.allowed).toBe(true);
      // Should allow operation to avoid blocking legitimate requests when monitoring fails
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

      // Mock the CostManagementService constructor and methods
      const { CostManagementService } = require('../../services/costManagementService');
      const mockGetBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);
      
      CostManagementService.mockImplementation(() => ({
        getBudgetStatus: mockGetBudgetStatus
      }));

      const result = await budgetEnforcementMiddleware('test-operation', 0.005);

      expect(mockGetBudgetStatus).toHaveBeenCalled();
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Monthly budget limit exceeded');
      expect(result.fallbackOptions).toBeDefined();
    });

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

      // Mock the CostManagementService constructor and methods
      const { CostManagementService } = require('../../services/costManagementService');
      const mockGetBudgetStatus = jest.fn().mockResolvedValue(mockBudgetStatus);
      
      CostManagementService.mockImplementation(() => ({
        getBudgetStatus: mockGetBudgetStatus
      }));

      const result = await budgetEnforcementMiddleware('test-operation', 0.005);

      expect(mockGetBudgetStatus).toHaveBeenCalled();
      expect(result.allowed).toBe(true);
      expect(result.reason).toBeUndefined();
    });
  });
});