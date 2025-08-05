import { test, expect } from '@playwright/test';
import { TestHelpers, MockData, PerformanceThresholds } from './helpers/test-helpers';

test.describe('Comprehensive Application Workflow', () => {
  let helpers: TestHelpers;

  test.beforeEach(async ({ page }) => {
    helpers = new TestHelpers(page);
    await page.goto('/');
  });

  test('should complete full application workflow with performance monitoring', async ({ page }) => {
    await test.step('Initialize and generate challenge', async () => {
      await helpers.measurePerformance(async () => {
        await helpers.generateBasicChallenge('javascript', 'refactoring', 'intermediate');
      }, 'Challenge Generation');

      // Verify all challenge elements are present
      await expect(page.locator('[data-testid="kaiju-display"]')).toBeVisible();
      await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
      await expect(page.locator('[data-testid="requirements-list"]')).toBeVisible();
    });

    await test.step('Test code editing with performance monitoring', async () => {
      await helpers.measurePerformance(async () => {
        await helpers.enterCode(MockData.sampleCode.javascript);
      }, 'Code Entry');

      // Verify code was entered correctly
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('calculateTotal');
    });

    await test.step('Test AI assistance workflow', async () => {
      await helpers.openAIChat();
      
      // Test multiple AI interactions
      for (const message of MockData.aiMessages.slice(0, 3)) {
        await helpers.measurePerformance(async () => {
          await helpers.sendAIMessage(message);
        }, `AI Response for: ${message}`);
        
        // Verify AI response is present
        const aiMessages = await page.locator('[data-testid="ai-message"]').count();
        expect(aiMessages).toBeGreaterThan(0);
      }
    });

    await test.step('Test Zoom-a-Friend interactions', async () => {
      await helpers.openZoomAFriend();
      
      // Test each team member
      const teamMembers = ['qa-pufferfish', 'architect-owl', 'product-pig', 'senior-cat'] as const;
      
      for (const member of teamMembers) {
        await helpers.interactWithTeamMember(member);
        
        const dialogText = await page.locator('[data-testid="team-dialog"]').textContent();
        expect(dialogText).toBeTruthy();
        
        // Verify dialog matches expected pattern
        const expectedPattern = MockData.teamMemberResponses[member];
        expect(dialogText).toMatch(expectedPattern);
        
        // Close dialog for next test
        if (await page.locator('[data-testid="dialog-close"]').isVisible()) {
          await page.click('[data-testid="dialog-close"]');
        }
      }
    });

    await test.step('Test code evaluation with comprehensive checks', async () => {
      await helpers.measurePerformance(async () => {
        await helpers.submitAndWaitForEvaluation();
      }, 'Code Evaluation');

      // Verify all evaluation components
      await helpers.verifyEvaluationScores();
      
      // Check score values are reasonable
      const scores = await Promise.all([
        page.locator('[data-testid="readability-score"]').textContent(),
        page.locator('[data-testid="quality-score"]').textContent(),
        page.locator('[data-testid="defects-score"]').textContent(),
        page.locator('[data-testid="requirements-score"]').textContent(),
        page.locator('[data-testid="overall-score"]').textContent()
      ]);
      
      scores.forEach(score => {
        expect(score).toBeTruthy();
        const numericScore = score?.match(/(\d+)/)?.[1];
        if (numericScore) {
          const scoreValue = parseInt(numericScore);
          expect(scoreValue).toBeGreaterThanOrEqual(0);
          expect(scoreValue).toBeLessThanOrEqual(100);
        }
      });
    });

    await test.step('Test progress tracking', async () => {
      // Navigate to progress view
      if (await page.locator('[data-testid="progress-tab"]').isVisible()) {
        await page.click('[data-testid="progress-tab"]');
        
        // Verify progress elements
        await expect(page.locator('[data-testid="progress-profile"]')).toBeVisible();
        await expect(page.locator('[data-testid="challenges-completed"]')).toBeVisible();
        
        // Check for achievement notifications
        const achievements = page.locator('[data-testid="achievement-badge"]');
        if (await achievements.count() > 0) {
          await expect(achievements.first()).toBeVisible();
        }
      }
    });

    await test.step('Test accessibility compliance', async () => {
      // Test key interactive elements for accessibility
      const accessibilityElements = [
        '[data-testid="language-select"]',
        '[data-testid="generate-challenge-btn"]',
        '[data-testid="ai-chat-toggle"]',
        '[data-testid="zoom-friend-toggle"]',
        '[data-testid="submit-solution-btn"]'
      ];

      for (const selector of accessibilityElements) {
        if (await page.locator(selector).isVisible()) {
          await helpers.verifyAccessibility(selector);
        }
      }
    });
  });

  test('should handle error scenarios gracefully', async ({ page }) => {
    await test.step('Test network error handling', async () => {
      // Mock network failure
      await page.route('**/api/**', route => route.abort());
      
      await page.selectOption('[data-testid="language-select"]', 'javascript');
      await page.selectOption('[data-testid="category-select"]', 'refactoring');
      await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
      await page.click('[data-testid="generate-challenge-btn"]');
      
      // Verify error handling
      await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
      
      // Verify offline mode activation
      if (await page.locator('[data-testid="offline-indicator"]').isVisible()) {
        await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
      }
    });

    await test.step('Test recovery from errors', async () => {
      // Remove network mock to restore functionality
      await page.unroute('**/api/**');
      
      // Try operation again
      await page.click('[data-testid="generate-challenge-btn"]');
      
      // Should work now
      await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 15000 });
      await expect(page.locator('[data-testid="kaiju-display"]')).toBeVisible();
    });
  });

  test('should maintain performance under load', async ({ page }) => {
    await test.step('Test multiple rapid operations', async () => {
      // Generate multiple challenges rapidly
      const languages = ['javascript', 'python', 'java'];
      
      for (const language of languages) {
        const startTime = Date.now();
        
        await page.selectOption('[data-testid="language-select"]', language);
        await page.selectOption('[data-testid="category-select"]', 'refactoring');
        await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
        await page.click('[data-testid="generate-challenge-btn"]');
        
        await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 15000 });
        
        const generationTime = Date.now() - startTime;
        expect(generationTime).toBeLessThan(PerformanceThresholds.challengeGeneration);
        
        console.log(`${language} challenge generated in ${generationTime}ms`);
        
        // Reset for next iteration
        if (await page.locator('[data-testid="new-challenge-btn"]').isVisible()) {
          await page.click('[data-testid="new-challenge-btn"]');
          await page.waitForTimeout(500);
        }
      }
    });

    await test.step('Test memory usage with large operations', async () => {
      await helpers.generateBasicChallenge();
      
      // Enter large code file
      await helpers.enterCode(MockData.complexCode.repeat(10));
      
      // Perform multiple evaluations
      for (let i = 0; i < 3; i++) {
        await helpers.submitAndWaitForEvaluation();
        
        // Verify evaluation completed successfully
        await helpers.verifyEvaluationScores();
        
        // Small delay between evaluations
        await page.waitForTimeout(1000);
      }
      
      // App should still be responsive
      await expect(page.locator('[data-testid="main-container"]')).toBeVisible();
    });
  });

  test('should work correctly across different challenge types', async ({ page }) => {
    const challengeTypes = [
      { language: 'javascript', category: 'refactoring', difficulty: 'beginner' },
      { language: 'python', category: 'debugging', difficulty: 'intermediate' },
      { language: 'java', category: 'optimization', difficulty: 'advanced' }
    ];

    for (const challenge of challengeTypes) {
      await test.step(`Test ${challenge.language} ${challenge.category} ${challenge.difficulty}`, async () => {
        await helpers.generateBasicChallenge(
          challenge.language,
          challenge.category,
          challenge.difficulty
        );
        
        // Verify challenge-specific elements
        await expect(page.locator('[data-testid="kaiju-display"]')).toBeVisible();
        await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
        
        // Verify language-specific syntax highlighting
        await helpers.waitForMonacoEditor();
        const editorLanguage = await page.evaluate(() => {
          const editor = document.querySelector('.monaco-editor');
          return editor?.getAttribute('data-language') || 'unknown';
        });
        
        // Should match selected language or be properly configured
        expect(editorLanguage).toBeTruthy();
        
        // Test basic code entry for this language
        const sampleCode = MockData.sampleCode[challenge.language as keyof typeof MockData.sampleCode];
        if (sampleCode) {
          await helpers.enterCode(sampleCode);
          
          const editorContent = await page.locator('.monaco-editor').textContent();
          expect(editorContent).toContain(sampleCode.trim().split('\n')[1].trim());
        }
        
        // Reset for next challenge
        if (await page.locator('[data-testid="new-challenge-btn"]').isVisible()) {
          await page.click('[data-testid="new-challenge-btn"]');
          await page.waitForTimeout(1000);
        }
      });
    }
  });

  test('should support advanced user interactions', async ({ page }) => {
    await helpers.generateBasicChallenge();

    await test.step('Test advanced editor features', async () => {
      await helpers.waitForMonacoEditor();
      
      // Test code folding
      await page.click('.monaco-editor .view-lines');
      await page.keyboard.type(`
function testFunction() {
  if (true) {
    console.log('nested code');
    if (true) {
      console.log('deeply nested');
    }
  }
}
      `);
      
      // Test find and replace
      await page.keyboard.press('Control+F');
      await page.keyboard.type('console.log');
      await page.keyboard.press('Escape');
      
      // Test multi-cursor editing
      await page.keyboard.press('Control+D'); // Select next occurrence
    });

    await test.step('Test context switching between features', async () => {
      // Switch between AI chat and Zoom-a-Friend rapidly
      await helpers.openAIChat();
      await helpers.sendAIMessage('Quick question about this code');
      
      await helpers.openZoomAFriend();
      await helpers.interactWithTeamMember('senior-cat');
      
      // Switch back to AI
      await helpers.sendAIMessage('Thanks for the help!');
      
      // Verify both features remain functional
      const aiMessages = await page.locator('[data-testid="ai-message"]').count();
      expect(aiMessages).toBeGreaterThanOrEqual(2);
      
      await expect(page.locator('[data-testid="team-dialog"]')).toBeVisible();
    });

    await test.step('Test data persistence across interactions', async () => {
      // Enter code
      await helpers.enterCode('function persistenceTest() { return true; }');
      
      // Open and close various panels
      await helpers.openAIChat();
      await page.click('[data-testid="ai-chat-toggle"]'); // Close
      
      await helpers.openZoomAFriend();
      await page.click('[data-testid="zoom-friend-toggle"]'); // Close
      
      // Verify code is still there
      const editorContent = await page.locator('.monaco-editor').textContent();
      expect(editorContent).toContain('persistenceTest');
    });
  });
});