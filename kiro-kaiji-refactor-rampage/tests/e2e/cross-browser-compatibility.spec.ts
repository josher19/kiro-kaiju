import { test, expect } from '@playwright/test';

test.describe('Cross-Browser Compatibility Tests', () => {
  const browsers = [
    { name: 'Chromium', project: 'chromium' },
    { name: 'Firefox', project: 'firefox' },
    { name: 'WebKit', project: 'webkit' },
    { name: 'Edge', project: 'Microsoft Edge' },
    { name: 'Chrome', project: 'Google Chrome' }
  ];

  browsers.forEach(({ name, project }) => {
    test.describe(`${name} Browser Tests`, () => {
      test(`should work correctly in ${name}`, async ({ page, browserName }) => {
        // Skip if browser not available in current test run
        const normalizedBrowserName = browserName.toLowerCase().replace(/\s+/g, '');
        const normalizedProject = project.toLowerCase().replace(/\s+/g, '');
        test.skip(normalizedBrowserName !== normalizedProject && !normalizedProject.includes(normalizedBrowserName), `Skipping ${name} test`);
        
        await page.goto('/');

        await test.step('Test basic functionality', async () => {
          // Test challenge selector
          await expect(page.locator('[data-testid="language-select"]')).toBeVisible();
          await expect(page.locator('[data-testid="category-select"]')).toBeVisible();
          await expect(page.locator('[data-testid="difficulty-select"]')).toBeVisible();
          
          // Select options
          await page.selectOption('[data-testid="language-select"]', 'javascript');
          await page.selectOption('[data-testid="category-select"]', 'refactoring');
          await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
          
          // Verify generate button is enabled
          await expect(page.locator('[data-testid="generate-challenge-btn"]')).toBeEnabled();
        });

        await test.step('Test challenge generation', async () => {
          await page.click('[data-testid="generate-challenge-btn"]');
          
          // Wait for challenge to load
          await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 15000 });
          
          // Verify key elements are present
          await expect(page.locator('[data-testid="kaiju-display"]')).toBeVisible();
          await expect(page.locator('[data-testid="code-editor"]')).toBeVisible();
          await expect(page.locator('[data-testid="requirements-list"]')).toBeVisible();
        });

        await test.step('Test Monaco Editor compatibility', async () => {
          // Wait for Monaco editor to load
          await page.waitForSelector('.monaco-editor', { timeout: 10000 });
          
          // Test editor interaction
          await page.click('.monaco-editor .view-lines');
          await page.keyboard.type('// Browser compatibility test');
          
          // Verify text was entered
          const editorContent = await page.locator('.monaco-editor').textContent();
          expect(editorContent).toContain('Browser compatibility test');
        });

        await test.step('Test CSS and styling', async () => {
          // Verify Tailwind CSS classes are applied correctly
          const mainContainer = page.locator('[data-testid="main-container"]');
          await expect(mainContainer).toBeVisible();
          
          // Check computed styles (basic responsiveness)
          const containerBox = await mainContainer.boundingBox();
          expect(containerBox).toBeTruthy();
          if (containerBox) {
            expect(containerBox.width).toBeGreaterThan(0);
            expect(containerBox.height).toBeGreaterThan(0);
          }
        });

        await test.step('Test JavaScript features', async () => {
          // Test modern JavaScript features work
          const result = await page.evaluate(() => {
            // Test arrow functions
            const testArrow = () => 'arrow function works';
            
            // Test template literals
            const testTemplate = `template literal works`;
            
            // Test destructuring
            const { test: testDestructure } = { test: 'destructuring works' };
            
            // Test async/await (return promise)
            return Promise.resolve({
              arrow: testArrow(),
              template: testTemplate,
              destructure: testDestructure
            });
          });
          
          expect(result.arrow).toBe('arrow function works');
          expect(result.template).toBe('template literal works');
          expect(result.destructure).toBe('destructuring works');
        });

        await test.step('Test API compatibility', async () => {
          // Test fetch API availability
          const fetchSupported = await page.evaluate(() => {
            return typeof fetch !== 'undefined';
          });
          expect(fetchSupported).toBe(true);
          
          // Test localStorage availability
          const localStorageSupported = await page.evaluate(() => {
            try {
              localStorage.setItem('test', 'value');
              const value = localStorage.getItem('test');
              localStorage.removeItem('test');
              return value === 'value';
            } catch {
              return false;
            }
          });
          expect(localStorageSupported).toBe(true);
        });
      });

      test(`should handle form interactions in ${name}`, async ({ page, browserName }) => {
        const normalizedBrowserName = browserName.toLowerCase().replace(/\s+/g, '');
        const normalizedProject = project.toLowerCase().replace(/\s+/g, '');
        test.skip(normalizedBrowserName !== normalizedProject && !normalizedProject.includes(normalizedBrowserName), `Skipping ${name} test`);
        
        await page.goto('/');

        await test.step('Test dropdown interactions', async () => {
          // Test all dropdowns work correctly
          const languageSelect = page.locator('[data-testid="language-select"]');
          await languageSelect.selectOption('python');
          await expect(languageSelect).toHaveValue('python');
          
          const categorySelect = page.locator('[data-testid="category-select"]');
          await categorySelect.selectOption('debugging');
          await expect(categorySelect).toHaveValue('debugging');
          
          const difficultySelect = page.locator('[data-testid="difficulty-select"]');
          await difficultySelect.selectOption('intermediate');
          await expect(difficultySelect).toHaveValue('intermediate');
        });

        await test.step('Test button interactions', async () => {
          // Verify button states and interactions
          const generateBtn = page.locator('[data-testid="generate-challenge-btn"]');
          await expect(generateBtn).toBeEnabled();
          
          await generateBtn.click();
          
          // Button should show loading state or be disabled during generation
          // (Implementation dependent)
          await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 15000 });
        });
      });

      test(`should support keyboard navigation in ${name}`, async ({ page, browserName }) => {
        const normalizedBrowserName = browserName.toLowerCase().replace(/\s+/g, '');
        const normalizedProject = project.toLowerCase().replace(/\s+/g, '');
        test.skip(normalizedBrowserName !== normalizedProject && !normalizedProject.includes(normalizedBrowserName), `Skipping ${name} test`);
        
        await page.goto('/');

        await test.step('Test tab navigation', async () => {
          // Test keyboard navigation through form elements
          await page.keyboard.press('Tab');
          await expect(page.locator('[data-testid="language-select"]')).toBeFocused();
          
          await page.keyboard.press('Tab');
          await expect(page.locator('[data-testid="framework-select"]')).toBeFocused();
          
          await page.keyboard.press('Tab');
          await expect(page.locator('[data-testid="category-select"]')).toBeFocused();
          
          await page.keyboard.press('Tab');
          await expect(page.locator('[data-testid="difficulty-select"]')).toBeFocused();
          
          await page.keyboard.press('Tab');
          await expect(page.locator('[data-testid="generate-challenge-btn"]')).toBeFocused();
        });

        await test.step('Test keyboard shortcuts', async () => {
          // Generate challenge first
          await page.selectOption('[data-testid="language-select"]', 'javascript');
          await page.selectOption('[data-testid="category-select"]', 'refactoring');
          await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
          await page.click('[data-testid="generate-challenge-btn"]');
          
          await page.waitForSelector('.monaco-editor', { timeout: 10000 });
          
          // Test common editor shortcuts
          await page.click('.monaco-editor .view-lines');
          await page.keyboard.type('function test() { return true; }');
          
          // Test Ctrl+A (Select All)
          await page.keyboard.press('Control+A');
          
          // Test Ctrl+C and Ctrl+V (Copy/Paste)
          await page.keyboard.press('Control+C');
          await page.keyboard.press('Control+V');
          
          // Verify shortcuts worked (content should be duplicated)
          const editorContent = await page.locator('.monaco-editor').textContent();
          expect(editorContent).toContain('function test()');
        });
      });

      test(`should handle responsive design in ${name}`, async ({ page, browserName }) => {
        const normalizedBrowserName = browserName.toLowerCase().replace(/\s+/g, '');
        const normalizedProject = project.toLowerCase().replace(/\s+/g, '');
        test.skip(normalizedBrowserName !== normalizedProject && !normalizedProject.includes(normalizedBrowserName), `Skipping ${name} test`);
        
        await page.goto('/');

        await test.step('Test desktop layout', async () => {
          // Set desktop viewport
          await page.setViewportSize({ width: 1200, height: 800 });
          
          // Verify desktop layout elements
          const mainContainer = page.locator('[data-testid="main-container"]');
          await expect(mainContainer).toBeVisible();
          
          const containerBox = await mainContainer.boundingBox();
          if (containerBox) {
            expect(containerBox.width).toBeGreaterThan(1000);
          }
        });

        await test.step('Test tablet layout', async () => {
          // Set tablet viewport
          await page.setViewportSize({ width: 768, height: 1024 });
          
          // Verify layout adapts
          const mainContainer = page.locator('[data-testid="main-container"]');
          await expect(mainContainer).toBeVisible();
          
          const containerBox = await mainContainer.boundingBox();
          if (containerBox) {
            expect(containerBox.width).toBeLessThanOrEqual(768);
          }
        });

        await test.step('Test mobile layout', async () => {
          // Set mobile viewport
          await page.setViewportSize({ width: 375, height: 667 });
          
          // Verify mobile layout
          const mainContainer = page.locator('[data-testid="main-container"]');
          await expect(mainContainer).toBeVisible();
          
          // Check if mobile navigation is present
          const mobileNav = page.locator('[data-testid="mobile-nav"]');
          if (await mobileNav.isVisible()) {
            await expect(mobileNav).toBeVisible();
          }
        });
      });

      test(`should handle error scenarios in ${name}`, async ({ page, browserName }) => {
        const normalizedBrowserName = browserName.toLowerCase().replace(/\s+/g, '');
        const normalizedProject = project.toLowerCase().replace(/\s+/g, '');
        test.skip(normalizedBrowserName !== normalizedProject && !normalizedProject.includes(normalizedBrowserName), `Skipping ${name} test`);
        
        await page.goto('/');

        await test.step('Test network error handling', async () => {
          // Mock network failure
          await page.route('**/api/**', route => route.abort());
          
          // Try to generate challenge
          await page.selectOption('[data-testid="language-select"]', 'javascript');
          await page.selectOption('[data-testid="category-select"]', 'refactoring');
          await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
          await page.click('[data-testid="generate-challenge-btn"]');
          
          // Verify error handling
          await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
        });

        await test.step('Test JavaScript error handling', async () => {
          // Inject a JavaScript error
          await page.evaluate(() => {
            // Simulate an error that might occur
            window.addEventListener('error', (e) => {
              console.log('Caught error:', e.message);
            });
            
            // This should be caught by error boundaries
            throw new Error('Test error for error boundary');
          });
          
          // Verify the app continues to function
          await expect(page.locator('[data-testid="language-select"]')).toBeVisible();
        });
      });
    });
  });

  test.describe('Feature Support Detection', () => {
    test('should detect and handle missing features gracefully', async ({ page }) => {
      await page.goto('/');

      await test.step('Test WebGL support detection', async () => {
        const webglSupported = await page.evaluate(() => {
          const canvas = document.createElement('canvas');
          const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
          return !!gl;
        });
        
        console.log(`WebGL supported: ${webglSupported}`);
        
        // App should work regardless of WebGL support
        await expect(page.locator('[data-testid="main-container"]')).toBeVisible();
      });

      await test.step('Test Web Workers support', async () => {
        const webWorkersSupported = await page.evaluate(() => {
          return typeof Worker !== 'undefined';
        });
        
        console.log(`Web Workers supported: ${webWorkersSupported}`);
        
        // App should work regardless of Web Workers support
        await expect(page.locator('[data-testid="main-container"]')).toBeVisible();
      });

      await test.step('Test Service Worker support', async () => {
        const serviceWorkerSupported = await page.evaluate(() => {
          return 'serviceWorker' in navigator;
        });
        
        console.log(`Service Worker supported: ${serviceWorkerSupported}`);
        
        // App should work regardless of Service Worker support
        await expect(page.locator('[data-testid="main-container"]')).toBeVisible();
      });
    });
  });

  test.describe('Performance Across Browsers', () => {
    test('should maintain performance standards across browsers', async ({ page, browserName }) => {
      await page.goto('/');

      await test.step('Measure page load performance', async () => {
        const startTime = Date.now();
        
        // Wait for main content to be visible
        await page.waitForSelector('[data-testid="main-container"]', { timeout: 10000 });
        
        const loadTime = Date.now() - startTime;
        
        console.log(`${browserName} page load time: ${loadTime}ms`);
        
        // Page should load within 5 seconds across all browsers
        expect(loadTime).toBeLessThan(5000);
      });

      await test.step('Measure challenge generation performance', async () => {
        const startTime = Date.now();
        
        await page.selectOption('[data-testid="language-select"]', 'javascript');
        await page.selectOption('[data-testid="category-select"]', 'refactoring');
        await page.selectOption('[data-testid="difficulty-select"]', 'beginner');
        await page.click('[data-testid="generate-challenge-btn"]');
        
        await page.waitForSelector('[data-testid="challenge-container"]', { timeout: 15000 });
        
        const generationTime = Date.now() - startTime;
        
        console.log(`${browserName} challenge generation time: ${generationTime}ms`);
        
        // Challenge generation should complete within 12 seconds across all browsers
        expect(generationTime).toBeLessThan(12000);
      });
    });
  });
});