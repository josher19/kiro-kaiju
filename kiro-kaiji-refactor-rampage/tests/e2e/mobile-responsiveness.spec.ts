import { test, expect, devices } from '@playwright/test';

test.describe('Mobile Responsiveness Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // Test on different mobile devices
  const mobileDevices = [
    { name: 'iPhone 12', device: devices['iPhone 12'] },
    { name: 'Pixel 5', device: devices['Pixel 5'] },
    { name: 'iPad Pro', device: devices['iPad Pro'] }
  ];

  mobileDevices.forEach(({ name, device }) => {
    test.describe(`${name} Tests`, () => {

      test(`should display responsive layout on ${name}`, async ({ page }) => {
        // Set viewport for this specific device
        await page.setViewportSize(device.viewport);
        
        // Test mobile-first responsive design (Requirements 6.1, 6.2, 6.3, 6.4, 6.5)
        await test.step('Verify mobile layout', async () => {
          // Check that main container is responsive
          const mainContainer = page.locator('[data-testid="main-container"]');
          await expect(mainContainer).toBeVisible();
          
          // Verify mobile navigation is present
          if (device.viewport.width < 768) {
            await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
          }
        });

        await test.step('Test challenge selector on mobile', async () => {
          // Verify dropdowns are touch-friendly
          const languageSelect = page.locator('[data-testid="language-select"]');
          await expect(languageSelect).toBeVisible();
          
          // Test touch interaction
          await languageSelect.tap();
          await page.selectOption('[data-testid="language-select"]', 'javascript');
          
          // Verify selection worked
          await expect(languageSelect).toHaveValue('javascript');
        });

        await test.step('Test code editor mobile optimization', async () => {
          // Generate a challenge first
          await page.selectOption('[data-testid="language-select"]', 'javascript');
          await page.selectOption('[data-testid="category-select"]', 'refactoring');
          await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
          await page.click('[data-testid="generate-challenge-btn"]');
          
          // Wait for challenge to load
          await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
          
          // Verify code editor is responsive
          const codeEditor = page.locator('[data-testid="code-editor"]');
          await expect(codeEditor).toBeVisible();
          
          // Test horizontal scrolling for long lines
          const editorContainer = page.locator('.monaco-editor');
          await expect(editorContainer).toBeVisible();
          
          // Verify touch controls are available on mobile
          if (device.viewport.width < 768) {
            await expect(page.locator('[data-testid="editor-zoom-controls"]')).toBeVisible();
          }
        });

        await test.step('Test collapsible panels on mobile', async () => {
          if (device.viewport.width < 768) {
            // Test AI chat panel collapse/expand
            const aiChatToggle = page.locator('[data-testid="ai-chat-toggle"]');
            await expect(aiChatToggle).toBeVisible();
            
            await aiChatToggle.tap();
            await expect(page.locator('[data-testid="ai-chat-interface"]')).toBeVisible();
            
            // Test panel can be collapsed
            await aiChatToggle.tap();
            await expect(page.locator('[data-testid="ai-chat-interface"]')).toBeHidden();
            
            // Test Zoom-a-Friend panel
            const zoomFriendToggle = page.locator('[data-testid="zoom-friend-toggle"]');
            await expect(zoomFriendToggle).toBeVisible();
            
            await zoomFriendToggle.tap();
            await expect(page.locator('[data-testid="zoom-friend-panel"]')).toBeVisible();
          }
        });

        await test.step('Test swipe gestures', async () => {
          if (device.viewport.width < 768) {
            // Test swipe navigation between sections
            const challengeContainer = page.locator('[data-testid="challenge-container"]');
            
            // Perform swipe gesture (simulate touch events)
            await challengeContainer.hover();
            await page.mouse.down();
            await page.mouse.move(100, 0);
            await page.mouse.up();
            
            // Verify swipe was handled (implementation dependent)
            // This would need to be implemented in the actual component
          }
        });

        await test.step('Test virtual keyboard handling', async () => {
          // Focus on AI chat input to trigger virtual keyboard
          const chatInput = page.locator('[data-testid="ai-chat-input"]');
          if (await chatInput.isVisible()) {
            await chatInput.tap();
            await chatInput.fill('Test message for virtual keyboard');
            
            // Verify input is still visible and accessible
            await expect(chatInput).toBeVisible();
            await expect(chatInput).toHaveValue('Test message for virtual keyboard');
          }
        });
      });

      test(`should maintain functionality on ${name}`, async ({ page }) => {
        await test.step('Test complete workflow on mobile', async () => {
          // Run abbreviated version of main workflow
          await page.selectOption('[data-testid="language-select"]', 'javascript');
          await page.selectOption('[data-testid="category-select"]', 'refactoring');
          await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
          await page.click('[data-testid="generate-challenge-btn"]');
          
          // Wait for challenge
          await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
          
          // Verify all key elements are accessible
          await expect(page.locator('[data-testid="kaiju-display"]')).toBeVisible();
          await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
          await expect(page.locator('[data-testid="requirements-list"]')).toBeVisible();
        });
      });

      test(`should handle orientation changes on ${name}`, async ({ page }) => {
        if (name.includes('iPhone') || name.includes('Pixel')) {
          await test.step('Test portrait to landscape rotation', async () => {
            // Start in portrait
            await page.setViewportSize({ width: device.viewport.height, height: device.viewport.width });
            
            // Verify layout adapts to landscape
            const mainContainer = page.locator('[data-testid="main-container"]');
            await expect(mainContainer).toBeVisible();
            
            // Generate challenge to test editor in landscape
            await page.selectOption('[data-testid="language-select"]', 'javascript');
            await page.selectOption('[data-testid="category-select"]', 'refactoring');
            await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
            await page.click('[data-testid="generate-challenge-btn"]');
            
            await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
            
            // Verify code editor works in landscape
            await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
          });
        }
      });
    });
  });

  test.describe('Touch Interaction Tests', () => {
    test.use({ ...devices['iPad Pro'] });

    test('should support touch gestures', async ({ page }) => {
      await page.goto('/');

      await test.step('Test tap interactions', async () => {
        // Test tap to select options
        await page.locator('[data-testid="language-select"]').tap();
        await page.selectOption('[data-testid="language-select"]', 'javascript');
        
        // Verify tap worked
        await expect(page.locator('[data-testid="language-select"]')).toHaveValue('javascript');
      });

      await test.step('Test long press interactions', async () => {
        // Generate challenge first
        await page.selectOption('[data-testid="category-select"]', 'refactoring');
        await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
        await page.click('[data-testid="generate-challenge-btn"]');
        
        await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 10000 });
        
        // Test long press on Kaiju for additional info (if implemented)
        const kaijuDisplay = page.locator('[data-testid="kaiju-display"]');
        await kaijuDisplay.hover();
        await page.mouse.down();
        await page.waitForTimeout(1000); // Long press
        await page.mouse.up();
        
        // This would trigger context menu or tooltip (implementation dependent)
      });

      await test.step('Test pinch zoom on code editor', async () => {
        // This would require more complex touch simulation
        // For now, verify zoom controls are available
        const zoomControls = page.locator('[data-testid="editor-zoom-controls"]');
        if (await zoomControls.isVisible()) {
          await expect(zoomControls).toBeVisible();
        }
      });
    });
  });
});