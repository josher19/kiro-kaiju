#!/usr/bin/env node

/**
 * Enhanced E2E Test Runner for Kiro Kaiji: Refactor Rampage
 * 
 * This script provides enhanced test execution with:
 * - Pre-test validation
 * - Performance monitoring
 * - Detailed reporting
 * - Error recovery
 */

import { execSync, spawn } from 'child_process';
import { existsSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

interface TestConfig {
  browsers: string[];
  devices: string[];
  parallel: boolean;
  retries: number;
  timeout: number;
  headless: boolean;
  generateReport: boolean;
}

interface TestResult {
  browser: string;
  device?: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  errors: string[];
}

class E2ETestRunner {
  private config: TestConfig;
  private results: TestResult[] = [];
  private startTime: number = 0;

  constructor(config: Partial<TestConfig> = {}) {
    this.config = {
      browsers: ['chromium', 'firefox', 'webkit'],
      devices: ['Desktop Chrome', 'Mobile Chrome', 'Mobile Safari'],
      parallel: false,
      retries: 2,
      timeout: 30000,
      headless: true,
      generateReport: true,
      ...config
    };
  }

  async run(): Promise<void> {
    console.log('🚀 Starting Kiro Kaiji E2E Test Suite');
    console.log('=====================================');
    
    this.startTime = Date.now();

    try {
      // Pre-test validation
      await this.validateEnvironment();
      
      // Install dependencies if needed
      await this.ensureDependencies();
      
      // Run tests
      await this.executeTests();
      
      // Generate reports
      if (this.config.generateReport) {
        await this.generateReports();
      }
      
      // Display summary
      this.displaySummary();
      
    } catch (error) {
      console.error('❌ Test execution failed:', error);
      process.exit(1);
    }
  }

  private async validateEnvironment(): Promise<void> {
    console.log('🔍 Validating test environment...');
    
    // Check if package.json exists
    if (!existsSync('package.json')) {
      throw new Error('package.json not found. Please run from project root.');
    }
    
    // Check if Playwright config exists
    if (!existsSync('playwright.config.ts')) {
      throw new Error('playwright.config.ts not found.');
    }
    
    // Check if test files exist
    const testDir = 'tests/e2e';
    if (!existsSync(testDir)) {
      throw new Error(`Test directory ${testDir} not found.`);
    }
    
    // Validate test files
    const requiredTests = [
      'challenge-workflow.spec.ts',
      'mobile-responsiveness.spec.ts',
      'ai-integration.spec.ts',
      'evaluation-performance.spec.ts',
      'cross-browser-compatibility.spec.ts',
      'comprehensive-workflow.spec.ts'
    ];
    
    for (const testFile of requiredTests) {
      if (!existsSync(join(testDir, testFile))) {
        console.warn(`⚠️  Warning: ${testFile} not found`);
      }
    }
    
    console.log('✅ Environment validation complete');
  }

  private async ensureDependencies(): Promise<void> {
    console.log('📦 Checking dependencies...');
    
    try {
      // Check if node_modules exists
      if (!existsSync('node_modules')) {
        console.log('Installing dependencies...');
        execSync('npm install', { stdio: 'inherit' });
      }
      
      // Check if Playwright browsers are installed
      try {
        execSync('npx playwright --version', { stdio: 'pipe' });
      } catch {
        console.log('Installing Playwright browsers...');
        execSync('npx playwright install', { stdio: 'inherit' });
      }
      
      console.log('✅ Dependencies ready');
    } catch (error) {
      throw new Error(`Failed to install dependencies: ${error}`);
    }
  }

  private async executeTests(): Promise<void> {
    console.log('🧪 Executing test suite...');
    
    const testCommands = this.buildTestCommands();
    
    for (const command of testCommands) {
      console.log(`\n🔄 Running: ${command.description}`);
      
      const startTime = Date.now();
      
      try {
        const result = await this.runCommand(command.cmd, command.args);
        const duration = Date.now() - startTime;
        
        this.results.push({
          browser: command.browser || 'all',
          device: command.device,
          passed: result.passed,
          failed: result.failed,
          skipped: result.skipped,
          duration,
          errors: result.errors
        });
        
        console.log(`✅ ${command.description} completed in ${duration}ms`);
        
      } catch (error) {
        const duration = Date.now() - startTime;
        
        this.results.push({
          browser: command.browser || 'all',
          passed: 0,
          failed: 1,
          skipped: 0,
          duration,
          errors: [String(error)]
        });
        
        console.error(`❌ ${command.description} failed:`, error);
        
        if (!this.config.parallel) {
          // Continue with other tests in non-parallel mode
          continue;
        }
      }
    }
  }

  private buildTestCommands(): Array<{
    cmd: string;
    args: string[];
    description: string;
    browser?: string;
    device?: string;
  }> {
    const commands = [];
    
    // Core workflow tests
    commands.push({
      cmd: 'npx',
      args: ['playwright', 'test', 'tests/e2e/challenge-workflow.spec.ts', '--reporter=json'],
      description: 'Challenge Workflow Tests'
    });
    
    // Mobile responsiveness tests
    commands.push({
      cmd: 'npx',
      args: ['playwright', 'test', 'tests/e2e/mobile-responsiveness.spec.ts', '--project=Mobile Chrome', '--reporter=json'],
      description: 'Mobile Responsiveness Tests',
      device: 'Mobile Chrome'
    });
    
    // AI integration tests
    commands.push({
      cmd: 'npx',
      args: ['playwright', 'test', 'tests/e2e/ai-integration.spec.ts', '--reporter=json'],
      description: 'AI Integration Tests'
    });
    
    // Performance tests
    commands.push({
      cmd: 'npx',
      args: ['playwright', 'test', 'tests/e2e/evaluation-performance.spec.ts', '--reporter=json'],
      description: 'Evaluation Performance Tests'
    });
    
    // Cross-browser tests
    for (const browser of this.config.browsers) {
      commands.push({
        cmd: 'npx',
        args: ['playwright', 'test', 'tests/e2e/cross-browser-compatibility.spec.ts', `--project=${browser}`, '--reporter=json'],
        description: `Cross-Browser Tests (${browser})`,
        browser
      });
    }
    
    // Comprehensive workflow test
    commands.push({
      cmd: 'npx',
      args: ['playwright', 'test', 'tests/e2e/comprehensive-workflow.spec.ts', '--reporter=json'],
      description: 'Comprehensive Workflow Tests'
    });
    
    return commands;
  }

  private async runCommand(cmd: string, args: string[]): Promise<{
    passed: number;
    failed: number;
    skipped: number;
    errors: string[];
  }> {
    return new Promise((resolve, reject) => {
      const process = spawn(cmd, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, CI: 'true' }
      });
      
      let stdout = '';
      let stderr = '';
      
      process.stdout.on('data', (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });
      
      process.on('close', (code) => {
        try {
          // Parse Playwright JSON output
          const result = this.parsePlaywrightOutput(stdout);
          
          if (code === 0) {
            resolve(result);
          } else {
            resolve({
              ...result,
              errors: [...result.errors, stderr]
            });
          }
        } catch (error) {
          reject(new Error(`Failed to parse test output: ${error}`));
        }
      });
      
      process.on('error', (error) => {
        reject(error);
      });
      
      // Set timeout
      setTimeout(() => {
        process.kill();
        reject(new Error('Test execution timeout'));
      }, this.config.timeout);
    });
  }

  private parsePlaywrightOutput(output: string): {
    passed: number;
    failed: number;
    skipped: number;
    errors: string[];
  } {
    // Default values
    let passed = 0;
    let failed = 0;
    let skipped = 0;
    const errors: string[] = [];
    
    try {
      // Try to parse JSON output
      const lines = output.split('\n').filter(line => line.trim());
      const jsonLine = lines.find(line => line.startsWith('{') && line.includes('"stats"'));
      
      if (jsonLine) {
        const result = JSON.parse(jsonLine);
        passed = result.stats?.passed || 0;
        failed = result.stats?.failed || 0;
        skipped = result.stats?.skipped || 0;
        
        if (result.errors) {
          errors.push(...result.errors);
        }
      } else {
        // Fallback: parse text output
        const passedMatch = output.match(/(\d+) passed/);
        const failedMatch = output.match(/(\d+) failed/);
        const skippedMatch = output.match(/(\d+) skipped/);
        
        passed = passedMatch ? parseInt(passedMatch[1]) : 0;
        failed = failedMatch ? parseInt(failedMatch[1]) : 0;
        skipped = skippedMatch ? parseInt(skippedMatch[1]) : 0;
      }
    } catch (error) {
      console.warn('Failed to parse test output, using defaults');
    }
    
    return { passed, failed, skipped, errors };
  }

  private async generateReports(): Promise<void> {
    console.log('📊 Generating test reports...');
    
    // Ensure reports directory exists
    const reportsDir = 'test-results/e2e-reports';
    if (!existsSync(reportsDir)) {
      mkdirSync(reportsDir, { recursive: true });
    }
    
    // Generate JSON report
    const jsonReport = {
      timestamp: new Date().toISOString(),
      duration: Date.now() - this.startTime,
      config: this.config,
      results: this.results,
      summary: this.calculateSummary()
    };
    
    writeFileSync(
      join(reportsDir, 'e2e-test-results.json'),
      JSON.stringify(jsonReport, null, 2)
    );
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport(jsonReport);
    writeFileSync(
      join(reportsDir, 'e2e-test-report.html'),
      htmlReport
    );
    
    console.log(`✅ Reports generated in ${reportsDir}`);
  }

  private calculateSummary() {
    const totalPassed = this.results.reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = this.results.reduce((sum, r) => sum + r.failed, 0);
    const totalSkipped = this.results.reduce((sum, r) => sum + r.skipped, 0);
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);
    const totalErrors = this.results.reduce((sum, r) => sum + r.errors.length, 0);
    
    return {
      totalTests: totalPassed + totalFailed + totalSkipped,
      passed: totalPassed,
      failed: totalFailed,
      skipped: totalSkipped,
      duration: totalDuration,
      errors: totalErrors,
      successRate: totalPassed / (totalPassed + totalFailed) * 100
    };
  }

  private generateHtmlReport(data: any): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Kiro Kaiji E2E Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: white; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .metric h3 { margin: 0 0 10px 0; color: #333; }
        .metric .value { font-size: 24px; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .skipped { color: #ffc107; }
        .results { margin-top: 30px; }
        .result-item { background: white; margin: 10px 0; padding: 15px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .result-header { display: flex; justify-content: space-between; align-items: center; }
        .errors { margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 4px; }
        .error { color: #dc3545; font-family: monospace; font-size: 12px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎮 Kiro Kaiji: Refactor Rampage - E2E Test Report</h1>
        <p>Generated: ${data.timestamp}</p>
        <p>Total Duration: ${(data.duration / 1000).toFixed(2)}s</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Total Tests</h3>
            <div class="value">${data.summary.totalTests}</div>
        </div>
        <div class="metric">
            <h3>Passed</h3>
            <div class="value passed">${data.summary.passed}</div>
        </div>
        <div class="metric">
            <h3>Failed</h3>
            <div class="value failed">${data.summary.failed}</div>
        </div>
        <div class="metric">
            <h3>Skipped</h3>
            <div class="value skipped">${data.summary.skipped}</div>
        </div>
        <div class="metric">
            <h3>Success Rate</h3>
            <div class="value">${data.summary.successRate.toFixed(1)}%</div>
        </div>
    </div>
    
    <div class="results">
        <h2>Test Results by Browser/Device</h2>
        ${data.results.map((result: TestResult) => `
            <div class="result-item">
                <div class="result-header">
                    <h3>${result.browser}${result.device ? ` (${result.device})` : ''}</h3>
                    <span>${(result.duration / 1000).toFixed(2)}s</span>
                </div>
                <div>
                    <span class="passed">✅ ${result.passed} passed</span> |
                    <span class="failed">❌ ${result.failed} failed</span> |
                    <span class="skipped">⏭️ ${result.skipped} skipped</span>
                </div>
                ${result.errors.length > 0 ? `
                    <div class="errors">
                        <h4>Errors:</h4>
                        ${result.errors.map(error => `<div class="error">${error}</div>`).join('')}
                    </div>
                ` : ''}
            </div>
        `).join('')}
    </div>
</body>
</html>
    `;
  }

  private displaySummary(): void {
    const summary = this.calculateSummary();
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n📊 Test Execution Summary');
    console.log('========================');
    console.log(`Total Tests: ${summary.totalTests}`);
    console.log(`✅ Passed: ${summary.passed}`);
    console.log(`❌ Failed: ${summary.failed}`);
    console.log(`⏭️  Skipped: ${summary.skipped}`);
    console.log(`🎯 Success Rate: ${summary.successRate.toFixed(1)}%`);
    console.log(`⏱️  Total Time: ${(totalTime / 1000).toFixed(2)}s`);
    
    if (summary.failed > 0) {
      console.log('\n❌ Some tests failed. Check the detailed report for more information.');
      process.exit(1);
    } else {
      console.log('\n🎉 All tests passed successfully!');
    }
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const config: Partial<TestConfig> = {};
  
  // Parse CLI arguments
  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--browsers':
        config.browsers = args[++i]?.split(',') || ['chromium'];
        break;
      case '--parallel':
        config.parallel = true;
        break;
      case '--headed':
        config.headless = false;
        break;
      case '--no-report':
        config.generateReport = false;
        break;
      case '--timeout':
        config.timeout = parseInt(args[++i]) || 30000;
        break;
      case '--retries':
        config.retries = parseInt(args[++i]) || 2;
        break;
    }
  }
  
  const runner = new E2ETestRunner(config);
  runner.run().catch(console.error);
}

export { E2ETestRunner, TestConfig, TestResult };