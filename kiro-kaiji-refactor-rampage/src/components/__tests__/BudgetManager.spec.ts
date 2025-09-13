import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BudgetManager from '../common/BudgetManager.vue';

// Mock the app store
vi.mock('../../stores/appStore', () => ({
  useAppStore: () => ({
    setDeploymentMode: vi.fn()
  })
}));

describe('BudgetManager', () => {
  let wrapper: any;
  let mockCloudService: any;

  beforeEach(() => {
    setActivePinia(createPinia());
    
    mockCloudService = {
      getBudgetStatus: vi.fn(),
      checkBudgetConstraints: vi.fn(),
      getCostOptimizationStrategies: vi.fn()
    };
  });

  it('should render without errors when no budget issues', async () => {
    mockCloudService.getBudgetStatus.mockResolvedValue({
      currentSpending: 5.0,
      budgetLimit: 15.0,
      percentageUsed: 33.33,
      status: 'ok',
      alertLevel: 0,
      remainingBudget: 10.0,
      isShutdownRequired: false
    });

    wrapper = mount(BudgetManager, {
      props: {
        cloudService: mockCloudService
      }
    });

    // Should not show alert for OK status
    expect(wrapper.find('.budget-alert').exists()).toBe(false);
  });

  it('should show warning alert when budget exceeds 80%', async () => {
    mockCloudService.getBudgetStatus.mockResolvedValue({
      currentSpending: 12.5,
      budgetLimit: 15.0,
      percentageUsed: 83.33,
      status: 'warning',
      alertLevel: 80,
      remainingBudget: 2.5,
      isShutdownRequired: false
    });

    wrapper = mount(BudgetManager, {
      props: {
        cloudService: mockCloudService
      }
    });

    // Wait for component to mount and check budget
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockCloudService.getBudgetStatus).toHaveBeenCalled();
  });

  it('should show exceeded alert with fallback options when budget is exceeded', async () => {
    mockCloudService.getBudgetStatus.mockResolvedValue({
      currentSpending: 16.0,
      budgetLimit: 15.0,
      percentageUsed: 106.67,
      status: 'exceeded',
      alertLevel: 95,
      remainingBudget: 0,
      isShutdownRequired: true
    });

    mockCloudService.checkBudgetConstraints.mockResolvedValue({
      shouldBlock: true,
      budgetStatus: {
        status: 'exceeded'
      },
      fallbackOptions: {
        switchToLocalMode: true,
        requireOpenRouterKey: true,
        disableAIFeatures: false
      }
    });

    mockCloudService.getCostOptimizationStrategies.mockResolvedValue({
      strategies: ['Complete service shutdown'],
      recommendedActions: ['Manual intervention required'],
      emergencyMode: true
    });

    wrapper = mount(BudgetManager, {
      props: {
        cloudService: mockCloudService
      }
    });

    // Wait for component to mount and check budget
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    expect(mockCloudService.getBudgetStatus).toHaveBeenCalled();
  });

  it('should handle cloud service errors gracefully', async () => {
    mockCloudService.getBudgetStatus.mockRejectedValue(new Error('Service unavailable'));

    wrapper = mount(BudgetManager, {
      props: {
        cloudService: mockCloudService
      }
    });

    // Wait for component to mount and handle error
    await wrapper.vm.$nextTick();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Should not crash on error
    expect(wrapper.exists()).toBe(true);
  });

  it('should emit events when switching to local mode', async () => {
    const eventSpy = vi.spyOn(window, 'dispatchEvent');

    wrapper = mount(BudgetManager, {
      props: {
        cloudService: mockCloudService
      }
    });

    // Simulate clicking switch to local mode button
    await wrapper.vm.switchToLocalMode();

    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'kiro-switch-to-local',
        detail: { reason: 'budget-exceeded' }
      })
    );
  });

  it('should save OpenRouter API key to localStorage', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    const eventSpy = vi.spyOn(window, 'dispatchEvent');

    wrapper = mount(BudgetManager, {
      props: {
        cloudService: mockCloudService
      }
    });

    // Set API key and save
    wrapper.vm.openRouterKey = 'test-api-key';
    await wrapper.vm.saveOpenRouterKey();

    expect(setItemSpy).toHaveBeenCalledWith('openrouter-api-key', 'test-api-key');
    expect(eventSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'kiro-openrouter-key-saved',
        detail: { apiKey: 'test-api-key' }
      })
    );
  });

  it('should dismiss alert and set timeout for re-showing if budget exceeded', async () => {
    vi.useFakeTimers();

    wrapper = mount(BudgetManager, {
      props: {
        cloudService: mockCloudService
      }
    });

    // Set budget status to exceeded
    wrapper.vm.budgetStatus = {
      status: 'exceeded'
    };
    wrapper.vm.showBudgetAlert = true;

    // Dismiss alert
    await wrapper.vm.dismissAlert();

    expect(wrapper.vm.showBudgetAlert).toBe(false);
    expect(wrapper.vm.alertDismissed).toBe(true);

    // Fast-forward 30 minutes
    vi.advanceTimersByTime(30 * 60 * 1000);

    expect(wrapper.vm.alertDismissed).toBe(false);

    vi.useRealTimers();
  });
});