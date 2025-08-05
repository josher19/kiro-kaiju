import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for E2E tests
 */
export class TestHelpers {
  constructor(private page: Page) {}

  /**
   * Generate a basic challenge for testing
   */
  async generateBasicChallenge(
    language = 'javascript',
    category = 'refactoring',
    difficulty = 'beginner'
  ) {
    await this.page.selectOption('[data-testid="language-select"]', language);
    await this.page.selectOption('[data-testid="category-select"]', category);
    await this.page.selectOption('[data-testid="difficulty-select"]', difficulty);
    await this.page.click('[data-testid="generate-challenge-btn"]');
    
    await this.page.waitForSelector('[data-testid="challenge-container"]', { timeout: 15000 });
  }

  /**
   * Wait for Monaco Editor to be fully loaded and interactive
   */
  async waitForMonacoEditor() {
    await this.page.waitForSelector('.monaco-editor', { timeout: 10000 });
    await this.page.waitForFunction(() => {
      const editor = document.querySelector('.monaco-editor');
      return editor && (
        editor.classList.contains('monaco-editor-focused') || 
        document.querySelector('.monaco-editor .view-lines')
      );
    }, { timeout: 10000 });
  }

  /**
   * Enter code into Monaco Editor
   */
  async enterCode(code: string) {
    await this.waitForMonacoEditor();
    await this.page.click('.monaco-editor .view-lines');
    await this.page.keyboard.press('Control+A');
    await this.page.keyboard.type(code);
  }

  /**
   * Submit code for evaluation and wait for results
   */
  async submitAndWaitForEvaluation() {
    await this.page.click('[data-testid="submit-solution-btn"]');
    await this.page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 20000 });
  }

  /**
   * Open AI chat interface
   */
  async openAIChat() {
    await this.page.click('[data-testid="ai-chat-toggle"]');
    await expect(this.page.locator('[data-testid="ai-chat-interface"]')).toBeVisible();
  }

  /**
   * Send message to AI and wait for response
   */
  async sendAIMessage(message: string) {
    await this.page.fill('[data-testid="ai-chat-input"]', message);
    await this.page.click('[data-testid="ai-chat-send"]');
    await this.page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 });
  }

  /**
   * Open Zoom-a-Friend panel
   */
  async openZoomAFriend() {
    await this.page.click('[data-testid="zoom-friend-toggle"]');
    await expect(this.page.locator('[data-testid="zoom-friend-panel"]')).toBeVisible();
  }

  /**
   * Interact with a specific team member
   */
  async interactWithTeamMember(memberType: 'qa-pufferfish' | 'architect-owl' | 'product-pig' | 'senior-cat') {
    await this.page.click(`[data-testid="team-member-${memberType}"]`);
    await this.page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
  }

  /**
   * Verify all evaluation scores are displayed
   */
  async verifyEvaluationScores() {
    await expect(this.page.locator('[data-testid="readability-score"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="quality-score"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="defects-score"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="requirements-score"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="overall-score"]')).toBeVisible();
    await expect(this.page.locator('[data-testid="evaluation-feedback"]')).toBeVisible();
  }

  /**
   * Check if element is in viewport
   */
  async isInViewport(selector: string): Promise<boolean> {
    return await this.page.evaluate((sel) => {
      const element = document.querySelector(sel);
      if (!element) return false;
      
      const rect = element.getBoundingClientRect();
      return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
      );
    }, selector);
  }

  /**
   * Measure performance of an operation
   */
  async measurePerformance<T>(operation: () => Promise<T>, operationName: string): Promise<T> {
    const startTime = Date.now();
    const result = await operation();
    const endTime = Date.now();
    
    console.log(`${operationName} took ${endTime - startTime}ms`);
    return result;
  }

  /**
   * Simulate network conditions
   */
  async simulateSlowNetwork() {
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: 1000 * 1024 / 8, // 1 Mbps
      uploadThroughput: 500 * 1024 / 8,     // 500 Kbps
      latency: 100, // 100ms
    });
  }

  /**
   * Reset network conditions
   */
  async resetNetworkConditions() {
    const client = await this.page.context().newCDPSession(this.page);
    await client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  }

  /**
   * Take screenshot with timestamp
   */
  async takeTimestampedScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true 
    });
  }

  /**
   * Wait for loading states to complete
   */
  async waitForLoadingComplete() {
    // Wait for any loading spinners to disappear
    await this.page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"], .loading, .spinner');
      return loadingElements.length === 0 || 
             Array.from(loadingElements).every(el => el.style.display === 'none');
    }, { timeout: 10000 });
  }

  /**
   * Verify accessibility attributes
   */
  async verifyAccessibility(selector: string) {
    const element = this.page.locator(selector);
    
    // Check for ARIA attributes
    const ariaLabel = await element.getAttribute('aria-label');
    const ariaDescribedBy = await element.getAttribute('aria-describedby');
    const role = await element.getAttribute('role');
    
    // At least one accessibility attribute should be present
    const hasAccessibilityAttribute = ariaLabel || ariaDescribedBy || role;
    expect(hasAccessibilityAttribute).toBeTruthy();
  }

  /**
   * Test keyboard navigation
   */
  async testKeyboardNavigation(selectors: string[]) {
    for (let i = 0; i < selectors.length; i++) {
      await this.page.keyboard.press('Tab');
      await expect(this.page.locator(selectors[i])).toBeFocused();
    }
  }

  /**
   * Verify responsive breakpoints
   */
  async testResponsiveBreakpoints() {
    const breakpoints = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1200, height: 800 }
    ];

    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ 
        width: breakpoint.width, 
        height: breakpoint.height 
      });
      
      // Verify main container is visible at this breakpoint
      await expect(this.page.locator('[data-testid="main-container"]')).toBeVisible();
      
      console.log(`✓ ${breakpoint.name} breakpoint (${breakpoint.width}x${breakpoint.height}) working`);
    }
  }
}

/**
 * Mock data for testing
 */
export const MockData = {
  sampleCode: {
    javascript: `
function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}
    `,
    python: `
def calculate_total(items):
    total = 0
    for item in items:
        total += item['price'] * item['quantity']
    return total
    `,
    java: `
public class Calculator {
    public static double calculateTotal(List<Item> items) {
        double total = 0.0;
        for (Item item : items) {
            total += item.getPrice() * item.getQuantity();
        }
        return total;
    }
}
    `
  },

  buggyCode: {
    javascript: `
function buggyFunction(arr) {
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) { // Off-by-one error
    sum += arr[i];
  }
  return sum;
}
    `,
    memoryLeak: `
function createMemoryLeak() {
  const data = [];
  setInterval(() => {
    data.push(new Array(1000000).fill('leak'));
  }, 100);
  return data;
}
    `
  },

  complexCode: `
function complexFunction(a,b,c,d,e) {
  if(a>0){
    if(b>0){
      if(c>0){
        if(d>0){
          if(e>0){
            return a+b+c+d+e;
          }else{
            return a+b+c+d;
          }
        }else{
          return a+b+c;
        }
      }else{
        return a+b;
      }
    }else{
      return a;
    }
  }else{
    return 0;
  }
}
  `,

  aiMessages: [
    'Help me refactor this code',
    'Generate unit tests for this function',
    'How can I improve the performance?',
    'What are the potential bugs in this code?',
    'Explain the SOLID principles'
  ],

  teamMemberResponses: {
    'qa-pufferfish': /puff|bubble|bug|defect|quality/i,
    'architect-owl': /hoot|wise|architecture|design|pattern/i,
    'product-pig': /oink|snort|requirement|feature|user|story/i,
    'senior-cat': /meow|purr|code|practice|clean|solid/i
  }
};

/**
 * Performance thresholds for testing
 */
export const PerformanceThresholds = {
  pageLoad: 5000,        // 5 seconds
  challengeGeneration: 12000, // 12 seconds
  codeEvaluation: 15000, // 15 seconds
  editorLoad: 8000,      // 8 seconds
  aiResponse: 10000,     // 10 seconds
  navigation: 2000       // 2 seconds
};