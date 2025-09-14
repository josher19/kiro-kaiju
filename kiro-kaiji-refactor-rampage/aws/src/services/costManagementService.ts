import { 
  CloudWatchClient, 
  PutMetricDataCommand, 
  GetMetricStatisticsCommand,
  PutMetricAlarmCommand,
  DescribeAlarmsCommand,
  DeleteAlarmsCommand
} from '@aws-sdk/client-cloudwatch';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { CostExplorerClient, GetCostAndUsageCommand } from '@aws-sdk/client-cost-explorer';
import type { BudgetConfig, CostAlert, BudgetStatus } from '../types';

export interface CostManagementConfig {
  monthlyBudgetLimit: number;
  alertThresholds: number[];
  snsTopicArn?: string;
  region: string;
  automaticShutoff: boolean;
  gracePeriodHours: number;
  cloudWatch?: {
    enabled: boolean;
    metricNamespace: string;
    alarmPrefix: string;
    costMetricName: string;
    alertActions: Record<string, string>;
    monitoringFrequency: string;
    retentionDays: number;
  };
  budgetEnforcement?: {
    preventNewApiCalls: boolean;
    shutdownServices: boolean;
    notifyAdministrators: boolean;
    logBudgetViolations: boolean;
  };
}

export class CostManagementService {
  private cloudWatch: CloudWatchClient;
  private sns: SNSClient;
  private costExplorer: CostExplorerClient;
  private config: CostManagementConfig;

  constructor(config: CostManagementConfig) {
    this.config = config;
    this.cloudWatch = new CloudWatchClient({ region: config.region });
    this.sns = new SNSClient({ region: config.region });
    this.costExplorer = new CostExplorerClient({ region: config.region });
  }

  /**
   * Get current month's spending for the service
   */
  async getCurrentMonthSpending(): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      const command = new GetCostAndUsageCommand({
        TimePeriod: {
          Start: startOfMonth.toISOString().split('T')[0],
          End: endOfMonth.toISOString().split('T')[0]
        },
        Granularity: 'MONTHLY',
        Metrics: ['BlendedCost'],
        GroupBy: [
          {
            Type: 'DIMENSION',
            Key: 'SERVICE'
          }
        ]
      });

      const response = await this.costExplorer.send(command);
      
      let totalCost = 0;
      if (response.ResultsByTime && response.ResultsByTime.length > 0) {
        const monthData = response.ResultsByTime[0];
        if (monthData.Groups) {
          for (const group of monthData.Groups) {
            const cost = parseFloat(group.Metrics?.BlendedCost?.Amount || '0');
            totalCost += cost;
          }
        }
      }

      return totalCost;
    } catch (error) {
      console.error('Failed to get current spending:', error);
      // Fallback to CloudWatch metrics if Cost Explorer fails
      return this.getCurrentSpendingFromCloudWatch();
    }
  }

  /**
   * Fallback method to estimate spending from CloudWatch metrics
   */
  private async getCurrentSpendingFromCloudWatch(): Promise<number> {
    try {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const command = new GetMetricStatisticsCommand({
        Namespace: 'AWS/Lambda',
        MetricName: 'Invocations',
        StartTime: startOfMonth,
        EndTime: now,
        Period: 86400, // Daily
        Statistics: ['Sum']
      });

      const response = await this.cloudWatch.send(command);
      
      // Rough estimation: $0.0000002 per invocation + $0.0000166667 per GB-second
      const totalInvocations = response.Datapoints?.reduce((sum, point) => sum + (point.Sum || 0), 0) || 0;
      const estimatedCost = totalInvocations * 0.0000002 + (totalInvocations * 0.5 * 0.0000166667); // Assume 500ms average duration
      
      return estimatedCost;
    } catch (error) {
      console.error('Failed to get spending from CloudWatch:', error);
      return 0;
    }
  }

  /**
   * Check if budget is exceeded and return status
   */
  async getBudgetStatus(): Promise<BudgetStatus> {
    const currentSpending = await this.getCurrentMonthSpending();
    const percentageUsed = (currentSpending / this.config.monthlyBudgetLimit) * 100;
    
    let status: 'ok' | 'warning' | 'critical' | 'exceeded' = 'ok';
    let alertLevel = 0;

    for (const threshold of this.config.alertThresholds.sort((a, b) => b - a)) {
      if (percentageUsed >= threshold) {
        alertLevel = threshold;
        if (threshold >= 95) {
          status = 'critical';
        } else if (threshold >= 80) {
          status = 'warning';
        }
        break;
      }
    }

    if (percentageUsed >= 100) {
      status = 'exceeded';
    }

    return {
      currentSpending,
      budgetLimit: this.config.monthlyBudgetLimit,
      percentageUsed,
      status,
      alertLevel,
      remainingBudget: Math.max(0, this.config.monthlyBudgetLimit - currentSpending),
      isShutdownRequired: status === 'exceeded' && this.config.automaticShutoff
    };
  }

  /**
   * Send cost alert notification
   */
  async sendCostAlert(budgetStatus: BudgetStatus): Promise<void> {
    if (!this.config.snsTopicArn) {
      console.warn('SNS topic not configured, skipping alert notification');
      return;
    }

    const message = this.formatAlertMessage(budgetStatus);
    
    try {
      const command = new PublishCommand({
        TopicArn: this.config.snsTopicArn,
        Message: message,
        Subject: `Kiro Kaiju Budget Alert - ${budgetStatus.status.toUpperCase()}`
      });

      await this.sns.send(command);
      console.log('Cost alert sent successfully');
    } catch (error) {
      console.error('Failed to send cost alert:', error);
    }
  }

  /**
   * Format alert message for notifications
   */
  private formatAlertMessage(budgetStatus: BudgetStatus): string {
    return `
Kiro Kaiju Refactor Rampage - Budget Alert

Status: ${budgetStatus.status.toUpperCase()}
Current Spending: $${budgetStatus.currentSpending.toFixed(2)}
Budget Limit: $${budgetStatus.budgetLimit.toFixed(2)}
Percentage Used: ${budgetStatus.percentageUsed.toFixed(1)}%
Remaining Budget: $${budgetStatus.remainingBudget.toFixed(2)}

${budgetStatus.isShutdownRequired ? 
  'AUTOMATIC SHUTDOWN REQUIRED: Budget limit exceeded. Services will be disabled.' :
  'Monitor usage closely to avoid exceeding budget limits.'
}

Alert Level: ${budgetStatus.alertLevel}%
Timestamp: ${new Date().toISOString()}
    `.trim();
  }

  /**
   * Record cost metrics to CloudWatch
   */
  async recordCostMetrics(spending: number, service: string): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: 'KiroKaiju/Costs',
        MetricData: [
          {
            MetricName: 'MonthlySpending',
            Value: spending,
            Unit: 'None',
            Dimensions: [
              {
                Name: 'Service',
                Value: service
              }
            ],
            Timestamp: new Date()
          }
        ]
      });

      await this.cloudWatch.send(command);
    } catch (error) {
      console.error('Failed to record cost metrics:', error);
    }
  }

  /**
   * Check if new API calls should be blocked due to budget
   */
  async shouldBlockApiCalls(): Promise<boolean> {
    const budgetStatus = await this.getBudgetStatus();
    return budgetStatus.status === 'exceeded';
  }

  /**
   * Get cost-optimized AI model selection
   */
  getCostOptimizedModel(availableModels: string[]): string {
    // Prioritize free-tier and low-cost models
    const costPriority = [
      'amazon.titan-text-lite-v1',              // Amazon's lightweight model
      'anthropic.claude-3-haiku-20240307-v1:0', // Lowest cost Claude model
      'meta.llama2-13b-chat-v1',               // Open source option
      'anthropic.claude-instant-v1',           // Faster, cheaper Claude
      'anthropic.claude-v2'                    // Standard Claude
    ];

    for (const preferredModel of costPriority) {
      if (availableModels.includes(preferredModel)) {
        return preferredModel;
      }
    }

    // Fallback to first available model
    return availableModels[0] || 'anthropic.claude-3-haiku-20240307-v1:0';
  }

  /**
   * Calculate estimated cost for AI request
   */
  estimateAIRequestCost(model: string, inputTokens: number, outputTokens: number): number {
    // Cost estimates per 1000 tokens (as of 2024)
    const modelCosts: Record<string, { input: number; output: number }> = {
      'amazon.titan-text-lite-v1': { input: 0.0003, output: 0.0008 },
      'anthropic.claude-3-haiku-20240307-v1:0': { input: 0.00025, output: 0.00125 },
      'anthropic.claude-instant-v1': { input: 0.0008, output: 0.0024 },
      'anthropic.claude-v2': { input: 0.008, output: 0.024 },
      'meta.llama2-13b-chat-v1': { input: 0.00075, output: 0.001 }
    };

    const costs = modelCosts[model] || { input: 0.001, output: 0.002 }; // Default fallback
    
    return (inputTokens / 1000 * costs.input) + (outputTokens / 1000 * costs.output);
  }

  /**
   * Set up CloudWatch alarms for budget monitoring
   */
  async setupCloudWatchAlarms(): Promise<void> {
    if (!this.config.cloudWatch?.enabled) {
      console.log('CloudWatch monitoring is disabled');
      return;
    }

    try {
      const { metricNamespace, alarmPrefix, costMetricName } = this.config.cloudWatch;
      
      // Create alarms for each threshold
      for (const threshold of this.config.alertThresholds) {
        const alarmName = `${alarmPrefix}-${threshold}Percent`;
        const thresholdAmount = (this.config.monthlyBudgetLimit * threshold) / 100;

        const alarmCommand = new PutMetricAlarmCommand({
          AlarmName: alarmName,
          AlarmDescription: `Budget alert when spending exceeds ${threshold}% (${thresholdAmount.toFixed(2)})`,
          MetricName: costMetricName,
          Namespace: metricNamespace,
          Statistic: 'Maximum',
          Period: 86400, // Daily
          EvaluationPeriods: 1,
          Threshold: thresholdAmount,
          ComparisonOperator: 'GreaterThanThreshold',
          AlarmActions: this.config.snsTopicArn ? [this.config.snsTopicArn] : [],
          TreatMissingData: 'notBreaching'
        });

        await this.cloudWatch.send(alarmCommand);
        console.log(`Created CloudWatch alarm: ${alarmName}`);
      }
    } catch (error) {
      console.error('Failed to setup CloudWatch alarms:', error);
    }
  }

  /**
   * Remove existing CloudWatch alarms
   */
  async removeCloudWatchAlarms(): Promise<void> {
    if (!this.config.cloudWatch?.enabled) {
      return;
    }

    try {
      const { alarmPrefix } = this.config.cloudWatch;
      
      // List existing alarms
      const describeCommand = new DescribeAlarmsCommand({
        AlarmNamePrefix: alarmPrefix
      });
      
      const response = await this.cloudWatch.send(describeCommand);
      
      if (response.MetricAlarms && response.MetricAlarms.length > 0) {
        const alarmNames = response.MetricAlarms.map(alarm => alarm.AlarmName!);
        
        const deleteCommand = new DeleteAlarmsCommand({
          AlarmNames: alarmNames
        });
        
        await this.cloudWatch.send(deleteCommand);
        console.log(`Removed CloudWatch alarms: ${alarmNames.join(', ')}`);
      }
    } catch (error) {
      console.error('Failed to remove CloudWatch alarms:', error);
    }
  }

  /**
   * Enforce budget constraints with automatic service shutdown
   */
  async enforceBudgetConstraints(): Promise<{
    actionTaken: string;
    shutdownRequired: boolean;
    gracePeriodActive: boolean;
  }> {
    const budgetStatus = await this.getBudgetStatus();
    
    if (!this.config.budgetEnforcement) {
      return {
        actionTaken: 'none',
        shutdownRequired: false,
        gracePeriodActive: false
      };
    }

    // Log budget violations
    if (budgetStatus.status !== 'ok' && this.config.budgetEnforcement.logBudgetViolations) {
      await this.logBudgetViolation(budgetStatus);
    }

    // Check if we're in grace period
    const gracePeriodActive = await this.isInGracePeriod(budgetStatus);

    if (budgetStatus.status === 'exceeded') {
      if (this.config.budgetEnforcement.preventNewApiCalls) {
        // Prevent new API calls immediately
        await this.recordCostMetrics(budgetStatus.currentSpending, 'budget-enforcement');
      }

      if (this.config.budgetEnforcement.shutdownServices && !gracePeriodActive) {
        // Shutdown services after grace period
        await this.initiateServiceShutdown();
        return {
          actionTaken: 'service-shutdown',
          shutdownRequired: true,
          gracePeriodActive: false
        };
      }

      if (this.config.budgetEnforcement.notifyAdministrators) {
        await this.sendCostAlert(budgetStatus);
      }

      return {
        actionTaken: gracePeriodActive ? 'grace-period-active' : 'api-calls-blocked',
        shutdownRequired: !gracePeriodActive,
        gracePeriodActive
      };
    }

    return {
      actionTaken: 'none',
      shutdownRequired: false,
      gracePeriodActive: false
    };
  }

  /**
   * Check if we're currently in the grace period after budget exceeded
   */
  private async isInGracePeriod(budgetStatus: BudgetStatus): Promise<boolean> {
    if (budgetStatus.status !== 'exceeded' || !this.config.automaticShutoff) {
      return false;
    }

    try {
      // Check when budget was first exceeded using CloudWatch metrics
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const command = new GetMetricStatisticsCommand({
        Namespace: this.config.cloudWatch?.metricNamespace || 'KiroKaiju/Costs',
        MetricName: 'BudgetExceeded',
        StartTime: oneDayAgo,
        EndTime: now,
        Period: 3600, // Hourly
        Statistics: ['Maximum']
      });

      const response = await this.cloudWatch.send(command);
      
      if (response.Datapoints && response.Datapoints.length > 0) {
        // Find first time budget was exceeded
        const firstExceeded = response.Datapoints
          .filter(point => point.Maximum === 1)
          .sort((a, b) => a.Timestamp!.getTime() - b.Timestamp!.getTime())[0];

        if (firstExceeded) {
          const exceededTime = firstExceeded.Timestamp!;
          const gracePeriodEnd = new Date(exceededTime.getTime() + this.config.gracePeriodHours * 60 * 60 * 1000);
          return now < gracePeriodEnd;
        }
      }

      // If no record found, assume we just exceeded and start grace period
      await this.recordBudgetExceeded();
      return true;
    } catch (error) {
      console.error('Failed to check grace period:', error);
      return false;
    }
  }

  /**
   * Record that budget was exceeded
   */
  private async recordBudgetExceeded(): Promise<void> {
    try {
      const command = new PutMetricDataCommand({
        Namespace: this.config.cloudWatch?.metricNamespace || 'KiroKaiju/Costs',
        MetricData: [
          {
            MetricName: 'BudgetExceeded',
            Value: 1,
            Unit: 'None',
            Timestamp: new Date()
          }
        ]
      });

      await this.cloudWatch.send(command);
    } catch (error) {
      console.error('Failed to record budget exceeded metric:', error);
    }
  }

  /**
   * Log budget violation for audit purposes
   */
  private async logBudgetViolation(budgetStatus: BudgetStatus): Promise<void> {
    try {
      const violation = {
        timestamp: new Date().toISOString(),
        currentSpending: budgetStatus.currentSpending,
        budgetLimit: budgetStatus.budgetLimit,
        percentageUsed: budgetStatus.percentageUsed,
        status: budgetStatus.status,
        alertLevel: budgetStatus.alertLevel
      };

      // Record as CloudWatch metric for monitoring
      await this.recordCostMetrics(budgetStatus.percentageUsed, 'budget-violation');
      
      console.warn('Budget violation logged:', violation);
    } catch (error) {
      console.error('Failed to log budget violation:', error);
    }
  }

  /**
   * Initiate service shutdown when budget is exceeded
   */
  private async initiateServiceShutdown(): Promise<void> {
    try {
      console.warn('Initiating service shutdown due to budget exceeded');
      
      // Record shutdown event
      const command = new PutMetricDataCommand({
        Namespace: this.config.cloudWatch?.metricNamespace || 'KiroKaiju/Costs',
        MetricData: [
          {
            MetricName: 'ServiceShutdown',
            Value: 1,
            Unit: 'None',
            Timestamp: new Date()
          }
        ]
      });

      await this.cloudWatch.send(command);
      
      // In a real implementation, this would disable Lambda functions,
      // set DynamoDB to on-demand with minimal capacity, etc.
      // For now, we just log the event
      console.warn('Service shutdown initiated - API calls will be blocked');
    } catch (error) {
      console.error('Failed to initiate service shutdown:', error);
    }
  }

  /**
   * Get cost optimization strategies based on current budget status
   */
  async getCostOptimizationStrategies(): Promise<{
    strategies: string[];
    recommendedActions: string[];
    emergencyMode: boolean;
  }> {
    const budgetStatus = await this.getBudgetStatus();
    const strategies: string[] = [];
    const recommendedActions: string[] = [];
    let emergencyMode = false;

    if (budgetStatus.percentageUsed > 80) {
      strategies.push('Use only the cheapest AI models');
      strategies.push('Reduce token limits for AI requests');
      strategies.push('Implement request caching to avoid duplicate calls');
      recommendedActions.push('Switch to local LLM if available');
      recommendedActions.push('Disable non-essential AI features');
    }

    if (budgetStatus.percentageUsed > 95) {
      strategies.push('Block all non-critical API calls');
      strategies.push('Enable emergency fallback mode');
      recommendedActions.push('Require OpenRouter API key for continued usage');
      recommendedActions.push('Switch to offline mode');
      emergencyMode = true;
    }

    if (budgetStatus.status === 'exceeded') {
      strategies.push('Complete service shutdown');
      recommendedActions.push('Manual intervention required');
      recommendedActions.push('Increase budget or wait for next billing cycle');
      emergencyMode = true;
    }

    return {
      strategies,
      recommendedActions,
      emergencyMode
    };
  }
}