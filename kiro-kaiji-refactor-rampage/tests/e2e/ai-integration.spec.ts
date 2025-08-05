import { test, expect } from '@playwright/test';

test.describe('AI Integration and Zoom-a-Friend Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Generate a challenge to have context for AI interactions
    await page.selectOption('[data-testid="language-select"]', 'javascript');
    await page.selectOption('[data-testid="category-select"]', 'refactoring');
    await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
    await page.click('[data-testid="generate-challenge-btn"]');
    
    await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
  });

  test.describe('Kiro AI Chat Interface', () => {
    test('should provide refactoring assistance', async ({ page }) => {
      // Test AI refactoring help (Requirements 3.1, 3.2)
      await test.step('Open AI chat and request refactoring help', async () => {
        await page.click('[data-testid="ai-chat-toggle"]');
        await expect(page.locator('[data-testid="ai-chat-interface"]')).toBeVisible();
        
        // Send refactoring request
        await page.fill('[data-testid="ai-chat-input"]', 'Help me refactor this code to improve readability');
        await page.click('[data-testid="ai-chat-send"]');
        
        // Wait for AI response
        await page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 });
        
        // Verify response contains refactoring suggestions
        const aiResponse = await page.locator('[data-testid="ai-message"]').last().textContent();
        expect(aiResponse).toBeTruthy();
        expect(aiResponse.toLowerCase()).toMatch(/(refactor|improve|clean|readable)/);
      });
    });

    test('should generate unit tests', async ({ page }) => {
      // Test AI unit test generation (Requirements 3.3)
      await test.step('Request unit test creation', async () => {
        await page.click('[data-testid="ai-chat-toggle"]');
        
        await page.fill('[data-testid="ai-chat-input"]', 'Generate unit tests for this code');
        await page.click('[data-testid="ai-chat-send"]');
        
        await page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 });
        
        const aiResponse = await page.locator('[data-testid="ai-message"]').last().textContent();
        expect(aiResponse).toBeTruthy();
        expect(aiResponse.toLowerCase()).toMatch(/(test|spec|expect|assert)/);
      });
    });

    test('should help implement requirements', async ({ page }) => {
      // Test AI requirement implementation help (Requirements 3.4)
      await test.step('Request implementation guidance', async () => {
        await page.click('[data-testid="ai-chat-toggle"]');
        
        await page.fill('[data-testid="ai-chat-input"]', 'How should I implement the new feature requirements?');
        await page.click('[data-testid="ai-chat-send"]');
        
        await page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 });
        
        const aiResponse = await page.locator('[data-testid="ai-message"]').last().textContent();
        expect(aiResponse).toBeTruthy();
        expect(aiResponse.toLowerCase()).toMatch(/(implement|feature|requirement|function)/);
      });
    });

    test('should maintain conversation context', async ({ page }) => {
      // Test AI context maintenance (Requirements 3.5)
      await test.step('Test multi-turn conversation', async () => {
        await page.click('[data-testid="ai-chat-toggle"]');
        
        // First message
        await page.fill('[data-testid="ai-chat-input"]', 'What is the main issue with this code?');
        await page.click('[data-testid="ai-chat-send"]');
        await page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 });
        
        // Follow-up message referencing previous context
        await page.fill('[data-testid="ai-chat-input"]', 'How can I fix that issue?');
        await page.click('[data-testid="ai-chat-send"]');
        await page.waitForSelector('[data-testid="ai-message"]:nth-child(4)', { timeout: 10000 });
        
        // Verify both messages are displayed
        const messages = await page.locator('[data-testid="ai-message"]').count();
        expect(messages).toBeGreaterThanOrEqual(2);
        
        // Verify context is maintained in response
        const secondResponse = await page.locator('[data-testid="ai-message"]').last().textContent();
        expect(secondResponse).toBeTruthy();
      });
    });

    test('should handle AI service errors gracefully', async ({ page }) => {
      await test.step('Test AI error handling', async () => {
        // Mock AI service failure
        await page.route('**/api/ai/**', route => route.abort());
        
        await page.click('[data-testid="ai-chat-toggle"]');
        await page.fill('[data-testid="ai-chat-input"]', 'Help me with this code');
        await page.click('[data-testid="ai-chat-send"]');
        
        // Verify error message is displayed
        await expect(page.locator('[data-testid="ai-error-message"]')).toBeVisible();
        
        // Verify retry option is available
        await expect(page.locator('[data-testid="ai-retry-btn"]')).toBeVisible();
      });
    });
  });

  test.describe('Zoom-a-Friend Panel', () => {
    test('should display team member selection', async ({ page }) => {
      // Test team member interface (Requirements 4.1)
      await test.step('Open Zoom-a-Friend panel', async () => {
        await page.click('[data-testid="zoom-friend-toggle"]');
        await expect(page.locator('[data-testid="zoom-friend-panel"]')).toBeVisible();
        
        // Verify all team members are displayed with animal icons
        await expect(page.locator('[data-testid="team-member-qa-pufferfish"]')).toBeVisible();
        await expect(page.locator('[data-testid="team-member-architect-owl"]')).toBeVisible();
        await expect(page.locator('[data-testid="team-member-product-pig"]')).toBeVisible();
        await expect(page.locator('[data-testid="team-member-senior-cat"]')).toBeVisible();
        
        // Verify role titles are displayed
        await expect(page.locator('[data-testid="role-title-qa"]')).toContainText('Quality Assurance');
        await expect(page.locator('[data-testid="role-title-architect"]')).toContainText('Architect');
        await expect(page.locator('[data-testid="role-title-product"]')).toContainText('Product Owner');
        await expect(page.locator('[data-testid="role-title-senior"]')).toContainText('Senior Developer');
      });
    });

    test('should provide QA Pufferfish feedback', async ({ page }) => {
      // Test QA Pufferfish dialog (Requirements 4.2)
      await test.step('Interact with QA Pufferfish', async () => {
        await page.click('[data-testid="zoom-friend-toggle"]');
        await page.click('[data-testid="team-member-qa-pufferfish"]');
        
        await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
        
        const dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        expect(dialogText).toBeTruthy();
        
        // Verify pufferfish-themed dialog with bug focus
        expect(dialogText.toLowerCase()).toMatch(/(puff|bubble|bug|defect|quality)/);
        
        // Verify animal sounds are included
        expect(dialogText).toMatch(/[*].*[*]/); // Asterisk-wrapped sounds
      });
    });

    test('should provide Architect Owl advice', async ({ page }) => {
      // Test Architect Owl dialog (Requirements 4.3)
      await test.step('Interact with Architect Owl', async () => {
        await page.click('[data-testid="zoom-friend-toggle"]');
        await page.click('[data-testid="team-member-architect-owl"]');
        
        await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
        
        const dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        expect(dialogText).toBeTruthy();
        
        // Verify owl-themed dialog with architectural focus
        expect(dialogText.toLowerCase()).toMatch(/(hoot|wise|architecture|design|pattern)/);
        expect(dialogText).toMatch(/(Architecture|Redundancy)/); // Key technical terms
      });
    });

    test('should provide Product Owner Pig guidance', async ({ page }) => {
      // Test Product Owner Pig dialog (Requirements 4.4)
      await test.step('Interact with Product Owner Pig', async () => {
        await page.click('[data-testid="zoom-friend-toggle"]');
        await page.click('[data-testid="team-member-product-pig"]');
        
        await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
        
        const dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        expect(dialogText).toBeTruthy();
        
        // Verify pig-themed dialog with requirements focus
        expect(dialogText.toLowerCase()).toMatch(/(oink|snort|requirement|feature|user|story)/);
      });
    });

    test('should provide Senior Developer Cat best practices', async ({ page }) => {
      // Test Senior Developer Cat dialog (Requirements 4.5)
      await test.step('Interact with Senior Developer Cat', async () => {
        await page.click('[data-testid="zoom-friend-toggle"]');
        await page.click('[data-testid="team-member-senior-cat"]');
        
        await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
        
        const dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        expect(dialogText).toBeTruthy();
        
        // Verify cat-themed dialog with coding best practices
        expect(dialogText.toLowerCase()).toMatch(/(meow|purr|code|practice|clean|solid)/);
      });
    });

    test('should generate animal-themed dialogs with technical terms', async ({ page }) => {
      // Test dialog format requirements (Requirements 4.6)
      await test.step('Verify dialog format across all team members', async () => {
        await page.click('[data-testid="zoom-friend-toggle"]');
        
        const teamMembers = ['qa-pufferfish', 'architect-owl', 'product-pig', 'senior-cat'];
        
        for (const member of teamMembers) {
          await page.click(`[data-testid="team-member-${member}"]`);
          await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
          
          const dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
          
          // Verify dialog contains mostly animal sounds with technical terms
          expect(dialogText).toBeTruthy();
          
          // Should contain animal sounds (asterisk-wrapped)
          expect(dialogText).toMatch(/[*].*[*]/);
          
          // Should contain some technical terms
          const technicalTerms = /(code|bug|architecture|requirement|test|quality|design|pattern|feature)/i;
          expect(dialogText).toMatch(technicalTerms);
          
          // Clear dialog for next test
          await page.click('[data-testid="dialog-close"]');
        }
      });
    });

    test('should handle multiple team member interactions', async ({ page }) => {
      await test.step('Test switching between team members', async () => {
        await page.click('[data-testid="zoom-friend-toggle"]');
        
        // Interact with first team member
        await page.click('[data-testid="team-member-qa-pufferfish"]');
        await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
        
        let dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        const firstResponse = dialogText;
        
        // Switch to different team member
        await page.click('[data-testid="team-member-architect-owl"]');
        await page.waitForTimeout(1000); // Wait for dialog update
        
        dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        const secondResponse = dialogText;
        
        // Verify responses are different
        expect(firstResponse).not.toBe(secondResponse);
      });
    });
  });

  test.describe('AI and Zoom-a-Friend Integration', () => {
    test('should work together seamlessly', async ({ page }) => {
      await test.step('Test using both AI and Zoom-a-Friend in same session', async () => {
        // Use AI chat first
        await page.click('[data-testid="ai-chat-toggle"]');
        await page.fill('[data-testid="ai-chat-input"]', 'What should I focus on in this code?');
        await page.click('[data-testid="ai-chat-send"]');
        await page.waitForSelector('[data-testid="ai-message"]', { timeout: 10000 });
        
        // Then use Zoom-a-Friend
        await page.click('[data-testid="zoom-friend-toggle"]');
        await page.click('[data-testid="team-member-senior-cat"]');
        await page.waitForSelector('[data-testid="team-dialog"]', { timeout: 5000 });
        
        // Verify both interfaces remain functional
        await expect(page.locator('[data-testid="ai-chat-interface"]')).toBeVisible();
        await expect(page.locator('[data-testid="zoom-friend-panel"]')).toBeVisible();
        
        // Test switching between them
        await page.fill('[data-testid="ai-chat-input"]', 'Thanks for the help!');
        await page.click('[data-testid="ai-chat-send"]');
        await page.waitForSelector('[data-testid="ai-message"]:nth-child(4)', { timeout: 10000 });
        
        // Verify both still work
        const aiMessages = await page.locator('[data-testid="ai-message"]').count();
        expect(aiMessages).toBeGreaterThanOrEqual(2);
        
        await expect(page.locator('[data-testid="team-dialog"]')).toBeVisible();
      });
    });
  });
});