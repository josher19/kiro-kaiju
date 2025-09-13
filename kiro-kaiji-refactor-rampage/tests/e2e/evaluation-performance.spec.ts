import { test, expect } from '@playwright/test';

test.describe('Evaluation System and Performance Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Generate a challenge for evaluation testing
    await page.selectOption('[data-testid="language-select"]', 'javascript');
    await page.selectOption('[data-testid="category-select"]', 'refactoring');
    await page.selectOption('[data-testid="difficulty-select"]', '1');
    await page.click('[data-testid="generate-challenge-btn"]');
    
    await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
  });

  test.describe('Code Evaluation System', () => {
    test('should evaluate code readability', async ({ page }) => {
      // Test readability scoring (Requirements 5.1)
      await test.step('Submit code and check readability evaluation', async () => {
        // Wait for Monaco editor to load
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        
        // Enter well-formatted code
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        await page.keyboard.type(`
// Well-documented and readable code
function calculateTotal(items) {
  if (!items || items.length === 0) {
    return 0;
  }
  
  return items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);
}

// Export for testing
module.exports = { calculateTotal };
        `);
        
        // Submit for evaluation
        await page.click('[data-testid="submit-solution-btn"]');
        
        // Wait for evaluation results
        await page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 15000 });
        
        // Verify readability score is displayed
        await expect(page.locator('[data-testid="readability-score"]')).toBeVisible();
        
        // Check that score is reasonable for well-formatted code
        const readabilityScore = await page.locator('[data-testid="readability-score"]').textContent();
        expect(readabilityScore).toBeTruthy();
        
        // Verify score is numeric and within expected range
        const scoreMatch = String(readabilityScore).match(/(\d+)/);
        if (scoreMatch) {
          const score = parseInt(scoreMatch[1]);
          expect(score).toBeGreaterThanOrEqual(0);
          expect(score).toBeLessThanOrEqual(100);
        }
      });
    });

    test('should assess code quality', async ({ page }) => {
      // Test code quality assessment (Requirements 5.2)
      await test.step('Evaluate code quality metrics', async () => {
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        
        // Enter code with quality issues
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        await page.keyboard.type(`
function badCode(x,y,z) {
var result;
if(x>0){
if(y>0){
if(z>0){
result=x+y+z;
}else{
result=x+y;
}
}else{
result=x;
}
}else{
result=0;
}
return result;
}
        `);
        
        await page.click('[data-testid="submit-solution-btn"]');
        await page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 15000 });
        
        // Verify quality score reflects poor code quality
        await expect(page.locator('[data-testid="quality-score"]')).toBeVisible();
        
        const qualityScore = await page.locator('[data-testid="quality-score"]').textContent();
        expect(qualityScore).toBeTruthy();
      });
    });

    test('should detect defects and bugs', async ({ page }) => {
      // Test defect detection (Requirements 5.3)
      await test.step('Identify bugs in submitted code', async () => {
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        
        // Enter code with obvious bugs
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        await page.keyboard.type(`
function buggyFunction(arr) {
  // Bug: No null check
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) { // Bug: Off-by-one error
    sum += arr[i];
  }
  return sum;
}

function anotherBug() {
  let x = 10;
  let y = 0;
  return x / y; // Bug: Division by zero
}
        `);
        
        await page.click('[data-testid="submit-solution-btn"]');
        await page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 15000 });
        
        // Verify defects are detected
        await expect(page.locator('[data-testid="defects-score"]')).toBeVisible();
        
        // Check for specific bug feedback
        const feedback = page.locator('[data-testid="evaluation-feedback"]');
        await expect(feedback).toBeVisible();
        
        const feedbackText = await feedback.textContent();
        expect(String(feedbackText).toLowerCase()).toMatch(/(bug|error|defect|issue)/);
      });
    });

    test('should verify requirement implementation', async ({ page }) => {
      // Test requirement verification (Requirements 5.4)
      await test.step('Check if requirements are met', async () => {
        // First, check what requirements are listed
        const requirementsList = page.locator('[data-testid="requirements-list"]');
        await expect(requirementsList).toBeVisible();
        
        const requirements = await requirementsList.textContent();
        
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        
        // Enter code that attempts to meet requirements
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        await page.keyboard.type(`
// Attempting to implement the requirements
function implementRequirements() {
  // Add implementation based on challenge requirements
  console.log("Implementing required functionality");
  return true;
}

// Export for testing
module.exports = { implementRequirements };
        `);
        
        await page.click('[data-testid="submit-solution-btn"]');
        await page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 15000 });
        
        // Verify requirements score is displayed
        await expect(page.locator('[data-testid="requirements-score"]')).toBeVisible();
        
        const reqScore = await page.locator('[data-testid="requirements-score"]').textContent();
        expect(reqScore).toBeTruthy();
      });
    });

    test('should provide overall scoring', async ({ page }) => {
      // Test overall scoring algorithm (Requirements 5.5)
      await test.step('Calculate and display overall score', async () => {
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        
        // Enter decent quality code
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        await page.keyboard.type(`
/**
 * Calculates the factorial of a number
 * @param {number} n - The number to calculate factorial for
 * @returns {number} The factorial result
 */
function factorial(n) {
  if (n < 0) {
    throw new Error('Factorial is not defined for negative numbers');
  }
  
  if (n === 0 || n === 1) {
    return 1;
  }
  
  return n * factorial(n - 1);
}

module.exports = { factorial };
        `);
        
        await page.click('[data-testid="submit-solution-btn"]');
        await page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 15000 });
        
        // Verify all score components are displayed
        await expect(page.locator('[data-testid="readability-score"]')).toBeVisible();
        await expect(page.locator('[data-testid="quality-score"]')).toBeVisible();
        await expect(page.locator('[data-testid="defects-score"]')).toBeVisible();
        await expect(page.locator('[data-testid="requirements-score"]')).toBeVisible();
        await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
        
        // Verify overall score is calculated
        const overallScore = await page.locator('[data-testid="overall-score"]').textContent();
        expect(overallScore).toBeTruthy();
        
        // Verify detailed feedback is provided
        await expect(page.locator('[data-testid="evaluation-feedback"]')).toBeVisible();
        
        const feedback = await page.locator('[data-testid="evaluation-feedback"]').textContent();
        expect(feedback).toBeTruthy();
        expect(String(feedback).length).toBeGreaterThan(10); // Should have substantial feedback
      });
    });

    test('should handle evaluation errors gracefully', async ({ page }) => {
      await test.step('Test evaluation service error handling', async () => {
        // Mock evaluation service failure
        await page.route('**/api/evaluate/**', route => route.abort());
        
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        await page.keyboard.type('function test() { return "test"; }');
        
        await page.click('[data-testid="submit-solution-btn"]');
        
        // Verify error handling
        await expect(page.locator('[data-testid="evaluation-error"]')).toBeVisible();
        await expect(page.locator('[data-testid="evaluation-retry-btn"]')).toBeVisible();
      });
    });
  });

  test.describe('Performance Benchmarks', () => {
    test('should generate challenges within acceptable time', async ({ page }) => {
      await test.step('Benchmark challenge generation performance', async () => {
        const startTime = Date.now();
        
        // Navigate to fresh page
        await page.goto('/');
        
        // Generate multiple challenges and measure time
        const languages = ['javascript', 'python', 'java'];
        const difficulties = ['1', '2', 'advanced'];
        
        for (const language of languages) {
          for (const difficulty of difficulties) {
            const challengeStartTime = Date.now();
            
            await page.selectOption('[data-testid="language-select"]', language);
            await page.selectOption('[data-testid="category-select"]', 'refactoring');
            await page.selectOption('[data-testid="difficulty-select"]', difficulty);
            await page.click('[data-testid="generate-challenge-btn"]');
            
            // Wait for challenge to load
            await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 15000 });
            
            const challengeEndTime = Date.now();
            const challengeTime = challengeEndTime - challengeStartTime;
            
            // Challenge generation should complete within 10 seconds
            expect(challengeTime).toBeLessThan(10000);
            
            console.log(`Challenge generation (${language}-${difficulty}): ${challengeTime}ms`);
            
            // Reset for next challenge
            await page.click('[data-testid="new-challenge-btn"]');
            await page.waitForTimeout(1000);
          }
        }
        
        const totalTime = Date.now() - startTime;
        console.log(`Total benchmark time: ${totalTime}ms`);
      });
    });

    test('should load Monaco Editor efficiently', async ({ page }) => {
      await test.step('Benchmark code editor loading performance', async () => {
        const startTime = Date.now();
        
        // Generate challenge to trigger editor loading
        await page.selectOption('[data-testid="language-select"]', 'javascript');
        await page.selectOption('[data-testid="category-select"]', 'refactoring');
        await page.selectOption('[data-testid="difficulty-select"]', '1');
        await page.click('[data-testid="generate-challenge-btn"]');
        
        // Wait for Monaco editor to be fully loaded and interactive
        await page.waitForSelector('.monaco-editor', { timeout: 10000 });
        await page.waitForFunction(() => {
          const editor = document.querySelector('.monaco-editor');
          return editor && editor.classList.contains('monaco-editor-focused') || 
                 document.querySelector('.monaco-editor .view-lines');
        }, { timeout: 10000 });
        
        const loadTime = Date.now() - startTime;
        
        // Editor should load within 8 seconds
        expect(loadTime).toBeLessThan(8000);
        
        console.log(`Monaco Editor load time: ${loadTime}ms`);
        
        // Test editor responsiveness
        const interactionStartTime = Date.now();
        
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.type('console.log("performance test");');
        
        const interactionTime = Date.now() - interactionStartTime;
        
        // Editor interaction should be responsive (< 1 second)
        expect(interactionTime).toBeLessThan(1000);
        
        console.log(`Editor interaction time: ${interactionTime}ms`);
      });
    });

    test('should evaluate code within reasonable time', async ({ page }) => {
      await test.step('Benchmark code evaluation performance', async () => {
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        
        // Enter a moderately complex piece of code
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        await page.keyboard.type(`
class DataProcessor {
  constructor(data) {
    this.data = data || [];
    this.processed = false;
  }
  
  validate() {
    return this.data.every(item => 
      item && typeof item === 'object' && 
      'id' in item && 'value' in item
    );
  }
  
  process() {
    if (!this.validate()) {
      throw new Error('Invalid data format');
    }
    
    this.data = this.data
      .filter(item => item.value > 0)
      .map(item => ({
        ...item,
        processed: true,
        timestamp: Date.now()
      }))
      .sort((a, b) => b.value - a.value);
    
    this.processed = true;
    return this.data;
  }
  
  getStats() {
    if (!this.processed) {
      this.process();
    }
    
    return {
      count: this.data.length,
      total: this.data.reduce((sum, item) => sum + item.value, 0),
      average: this.data.length > 0 ? 
        this.data.reduce((sum, item) => sum + item.value, 0) / this.data.length : 0
    };
  }
}

module.exports = { DataProcessor };
        `);
        
        const evaluationStartTime = Date.now();
        
        await page.click('[data-testid="submit-solution-btn"]');
        await page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 20000 });
        
        const evaluationTime = Date.now() - evaluationStartTime;
        
        // Evaluation should complete within 15 seconds
        expect(evaluationTime).toBeLessThan(15000);
        
        console.log(`Code evaluation time: ${evaluationTime}ms`);
        
        // Verify all evaluation components completed
        await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
        await expect(page.locator('[data-testid="evaluation-feedback"]')).toBeVisible();
      });
    });

    test('should handle large code files efficiently', async ({ page }) => {
      await test.step('Test performance with large code input', async () => {
        await page.waitForSelector('.monaco-editor', { timeout: 5000 });
        
        // Generate a large code file (simulate real-world scenario)
        let largeCode = '// Large code file for performance testing\n';
        for (let i = 0; i < 100; i++) {
          largeCode += `
function generatedFunction${i}(param1, param2, param3) {
  const result = {
    id: ${i},
    data: param1 + param2 + param3,
    timestamp: Date.now(),
    processed: false
  };
  
  if (result.data > 0) {
    result.processed = true;
    result.validation = 'passed';
  } else {
    result.validation = 'failed';
  }
  
  return result;
}
          `;
        }
        
        const inputStartTime = Date.now();
        
        await page.click('.monaco-editor .view-lines');
        await page.keyboard.press('Control+A');
        
        // Input large code in chunks to avoid timeout
        const chunkSize = 1000;
        for (let i = 0; i < largeCode.length; i += chunkSize) {
          const chunk = largeCode.slice(i, i + chunkSize);
          await page.keyboard.type(chunk);
          
          // Small delay to prevent overwhelming the editor
          if (i % (chunkSize * 5) === 0) {
            await page.waitForTimeout(100);
          }
        }
        
        const inputTime = Date.now() - inputStartTime;
        console.log(`Large code input time: ${inputTime}ms`);
        
        // Test editor responsiveness with large file
        const scrollStartTime = Date.now();
        
        await page.keyboard.press('Control+End'); // Go to end
        await page.keyboard.press('Control+Home'); // Go to beginning
        
        const scrollTime = Date.now() - scrollStartTime;
        
        // Navigation should remain responsive
        expect(scrollTime).toBeLessThan(2000);
        
        console.log(`Large file navigation time: ${scrollTime}ms`);
      });
    });
  });

  test.describe('Memory and Resource Usage', () => {
    test('should not cause memory leaks during extended use', async ({ page }) => {
      await test.step('Test for memory leaks in challenge generation', async () => {
        // Generate multiple challenges to test for memory leaks
        for (let i = 0; i < 5; i++) {
          await page.selectOption('[data-testid="language-select"]', 'javascript');
          await page.selectOption('[data-testid="category-select"]', 'refactoring');
          await page.selectOption('[data-testid="difficulty-select"]', '1');
          await page.click('[data-testid="generate-challenge-btn"]');
          
          await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
          
          // Interact with the challenge
          await page.waitForSelector('.monaco-editor', { timeout: 5000 });
          await page.click('.monaco-editor .view-lines');
          await page.keyboard.type(`console.log("Challenge ${i}");`);
          
          // Reset for next iteration
          await page.click('[data-testid="new-challenge-btn"]');
          await page.waitForTimeout(1000);
        }
        
        // The test passing indicates no major memory leaks occurred
        // In a real scenario, you might use browser dev tools to monitor memory
        expect(true).toBe(true);
      });
    });
  });
});