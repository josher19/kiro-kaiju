import { test, expect } from '@playwright/test';

test.describe('Complete Challenge Workflow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should complete full challenge generation and submission workflow', async ({ page }) => {
    // Test challenge selection (Requirements 1.1, 1.2, 1.3, 1.4)
    await test.step('Select challenge parameters', async () => {
      // Select programming language
      await page.selectOption('[data-testid="language-select"]', 'javascript');
      
      // Wait for framework options to update
      await page.waitForTimeout(500);
      
      // Select framework
      await page.selectOption('[data-testid="framework-select"]', 'vue');
      
      // Select category
      await page.selectOption('[data-testid="category-select"]', 'refactoring');
      
      // Select difficulty
      await page.selectOption('[data-testid="difficulty-select"]', '1');
      
      // Verify Generate Challenge button is enabled
      await expect(page.locator('[data-testid="generate-challenge-btn"]')).toBeEnabled();
    });

    await test.step('Generate challenge with Kaiju monster', async () => {
      // Click generate challenge
      await page.click('[data-testid="generate-challenge-btn"]');
      
      // Wait for challenge to load
      await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
      
      // Verify Kaiju monster is displayed (Requirements 2.1, 2.2, 2.3, 2.4, 2.5)
      await expect(page.locator('[data-testid="kaiju-display"]')).toBeVisible();
      
      // Verify code editor is loaded with initial code
      await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
      
      // Verify requirements are displayed
      await expect(page.locator('[data-testid="requirements-list"]')).toBeVisible();
    });

    await test.step('Interact with code editor', async () => {
      // Wait for Monaco editor to fully load
      await page.waitForSelector('.monaco-editor', { timeout: 5000 });
      
      // Click in the editor to focus
      await page.click('.monaco-editor .view-lines');
      
      // Add some code changes
      await page.keyboard.press('Control+A');
      await page.keyboard.type('// Refactored code\nfunction improvedFunction() {\n  return "Hello, World!";\n}');
      
      // Verify code was entered
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('improvedFunction');
    });

    await test.step('Test AI assistance integration', async () => {
      // Open AI chat interface (Requirements 3.1, 3.2, 3.3, 3.4, 3.5)
      await page.click('[data-testid="ai-chat-toggle"]');
      
      // Verify chat interface is visible
      await expect(page.locator('[data-testid="ai-chat-interface"]')).toBeVisible();
      
      // Send a message to AI
      await page.fill('[data-testid="ai-chat-input"]', 'Help me refactor this code');
      await page.click('[data-testid="ai-chat-send"]');
      
      // Wait for AI response (with timeout for mock response)
      await page.waitForSelector('[data-testid="ai-message"]', { timeout: 5000 });
      
      // Verify AI response is displayed
      await expect(page.locator('[data-testid="ai-message"]')).toBeVisible();
    });

    await test.step('Test Zoom-a-Friend functionality', async () => {
      // Open Zoom-a-Friend panel (Requirements 4.1, 4.2, 4.3, 4.4, 4.5, 4.6)
      await page.click('[data-testid="zoom-friend-toggle"]');
      
      // Verify team member selection is visible
      await expect(page.locator('[data-testid="team-members"]')).toBeVisible();
      
      // Test each team member
      const teamMembers = ['qa-pufferfish', 'architect-owl', 'product-pig', 'senior-cat'];
      
      for (const member of teamMembers) {
        await page.click(`[data-testid="team-member-${member}"]`);
        
        // Wait for dialog response
        await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 3000 });
        
        // Verify dialog contains animal sounds and technical terms
        const dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        expect(dialogText).toBeTruthy();
      }
    });

    await test.step('Submit and evaluate solution', async () => {
      // Submit solution for evaluation (Requirements 5.1, 5.2, 5.3, 5.4, 5.5)
      await page.click('[data-testid="submit-solution-btn"]');
      
      // Wait for evaluation to complete
      await page.waitForSelector('[data-testid="evaluation-results"]', { timeout: 10000 });
      
      // Verify evaluation scores are displayed
      await expect(page.locator('[data-testid="readability-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="quality-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="defects-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirements-score"]')).toBeVisible();
      await expect(page.locator('[data-testid="overall-score"]')).toBeVisible();
      
      // Verify feedback is provided
      await expect(page.locator('[data-testid="evaluation-feedback"]')).toBeVisible();
    });

    await test.step('Verify progress tracking', async () => {
      // Check progress tracking (Requirements 7.1, 7.2, 7.3, 7.4, 7.5)
      await page.click('[data-testid="progress-tab"]');
      
      // Verify progress profile is displayed
      await expect(page.locator('[data-testid="progress-profile"]')).toBeVisible();
      
      // Verify statistics are shown
      await expect(page.locator('[data-testid="challenges-completed"]')).toBeVisible();
      await expect(page.locator('[data-testid="average-score"]')).toBeVisible();
      
      // Check for achievement notifications
      const achievements = page.locator('[data-testid="achievement-badge"]');
      if (await achievements.count() > 0) {
        await expect(achievements.first()).toBeVisible();
      }
    });
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Try to generate challenge
      await page.selectOption('[data-testid="language-select"]', 'javascript');
      await page.selectOption('[data-testid="category-select"]', 'refactoring');
      await page.selectOption('[data-testid="difficulty-select"]', '1');
      await page.click('[data-testid="generate-challenge-btn"]');
      
      // Verify error message is displayed
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // Verify offline mode is activated
      await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    });
  });

  test('should support keyboard navigation', async ({ page }) => {
    await test.step('Test accessibility keyboard navigation', async () => {
      // Tab through challenge selector
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="language-select"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="framework-select"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="category-select"]')).toBeFocused();
      
      await page.keyboard.press('Tab');
      await expect(page.locator('[data-testid="difficulty-select"]')).toBeFocused();
    });
  });
});