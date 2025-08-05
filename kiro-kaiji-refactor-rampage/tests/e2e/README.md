# End-to-End Testing Suite

This directory contains comprehensive E2E tests for the Kiro Kaiji: Refactor Rampage application using Playwright.

## Test Structure

### Core Test Files

- **`challenge-workflow.spec.ts`** - Tests the complete challenge workflow from selection to evaluation
- **`mobile-responsiveness.spec.ts`** - Tests mobile device compatibility and responsive design
- **`ai-integration.spec.ts`** - Tests AI chat interface and Zoom-a-Friend functionality
- **`evaluation-performance.spec.ts`** - Tests code evaluation system and performance benchmarks
- **`cross-browser-compatibility.spec.ts`** - Tests compatibility across different browsers
- **`comprehensive-workflow.spec.ts`** - Full application workflow with performance monitoring

### Helper Utilities

- **`helpers/test-helpers.ts`** - Reusable test utilities and mock data

## Requirements Coverage

The E2E tests cover all requirements from the specification:

### Challenge Selection (Requirements 1.1-1.4)
- ✅ Language, framework, category, and difficulty selection
- ✅ Dynamic framework filtering based on language
- ✅ Form validation and button state management
- ✅ Challenge generation with proper parameters

### Kaiju Monsters (Requirements 2.1-2.5)
- ✅ HydraBug monster with bug multiplication logic
- ✅ Complexasaur monster with complex code generation
- ✅ Duplicatron monster with code duplication patterns
- ✅ Spaghettizilla monster with tangled dependencies
- ✅ Memoryleak-odactyl monster with memory issues

### AI Integration (Requirements 3.1-3.5)
- ✅ Kiro AI chat interface integration
- ✅ Refactoring assistance and suggestions
- ✅ Unit test generation capabilities
- ✅ Implementation guidance for requirements
- ✅ Context maintenance across conversations

### Zoom-a-Friend (Requirements 4.1-4.6)
- ✅ Team member selection with animal icons
- ✅ QA Pufferfish bug-focused feedback
- ✅ Architect Owl architectural advice
- ✅ Product Owner Pig requirements clarification
- ✅ Senior Developer Cat coding best practices
- ✅ Animal-themed dialogs with technical terms

### Code Evaluation (Requirements 5.1-5.5)
- ✅ Readability scoring with automated metrics
- ✅ Code quality assessment
- ✅ Defect detection through static analysis
- ✅ Requirement verification system
- ✅ Overall scoring with detailed feedback

### Mobile Responsiveness (Requirements 6.1-6.5)
- ✅ Touch-optimized responsive interface
- ✅ Mobile code editor with horizontal scrolling
- ✅ Touch-friendly AI chat controls
- ✅ Optimized Zoom-a-Friend for small screens
- ✅ Full functionality on mobile devices

### Progress Tracking (Requirements 7.1-7.5)
- ✅ Progress profile creation and tracking
- ✅ Achievement system with badge unlocking
- ✅ Statistics display and improvement trends
- ✅ Milestone tracking with encouraging feedback
- ✅ Difficulty level progression

## Running Tests

### Prerequisites

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Test Commands

```bash
# Run all E2E tests
npm run test:e2e

# Run tests with UI mode
npm run test:e2e:ui

# Run tests in headed mode (visible browser)
npm run test:e2e:headed

# Debug tests
npm run test:e2e:debug

# View test report
npm run test:e2e:report

# Run specific test file
npx playwright test tests/e2e/challenge-workflow.spec.ts

# Run tests on specific browser
npx playwright test --project=chromium

# Run mobile tests only
npx playwright test --project="Mobile Chrome"
```

### Test Configuration

The tests are configured in `playwright.config.ts` with:

- **Multiple browsers**: Chromium, Firefox, WebKit, Edge, Chrome
- **Mobile devices**: iPhone 12, Pixel 5, iPad Pro
- **Reporters**: HTML, JSON, JUnit
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

## Performance Benchmarks

The tests include performance monitoring with the following thresholds:

- **Page Load**: < 5 seconds
- **Challenge Generation**: < 12 seconds
- **Code Evaluation**: < 15 seconds
- **Monaco Editor Load**: < 8 seconds
- **AI Response**: < 10 seconds
- **Navigation**: < 2 seconds

## Test Data and Mocking

### Mock Data Available

- Sample code in JavaScript, Python, Java
- Buggy code examples for testing evaluation
- Complex code for performance testing
- AI message templates
- Team member response patterns

### Network Mocking

Tests include network failure simulation to verify:
- Error handling and recovery
- Offline mode activation
- Graceful degradation
- Retry mechanisms

## Accessibility Testing

The E2E tests include accessibility verification:

- ARIA attributes presence
- Keyboard navigation support
- Focus management
- Screen reader compatibility
- Color contrast (visual verification)

## Cross-Browser Testing

Tests run on multiple browsers to ensure:

- Feature compatibility
- Performance consistency
- UI rendering accuracy
- JavaScript API support
- CSS styling consistency

## Mobile Testing

Comprehensive mobile testing includes:

- Touch interaction support
- Responsive layout verification
- Virtual keyboard handling
- Orientation change support
- Swipe gesture functionality
- Performance on mobile devices

## Continuous Integration

The tests are configured to run in GitHub Actions with:

- Matrix strategy for multiple browsers
- Separate mobile test job
- Performance test monitoring
- Artifact collection for reports
- Failure screenshots and videos

## Debugging Tests

### Local Debugging

```bash
# Run with debug mode
npm run test:e2e:debug

# Run specific test with debug
npx playwright test tests/e2e/challenge-workflow.spec.ts --debug

# Run with headed browser
npm run test:e2e:headed
```

### CI Debugging

- Check GitHub Actions artifacts for screenshots
- Review test reports in HTML format
- Examine console logs in test output
- Use trace viewer for detailed debugging

## Test Maintenance

### Adding New Tests

1. Create test file in appropriate category
2. Use `TestHelpers` class for common operations
3. Follow existing naming conventions
4. Add performance monitoring where appropriate
5. Include accessibility checks
6. Update this README with new test coverage

### Updating Tests

1. Keep tests in sync with UI changes
2. Update selectors when components change
3. Adjust performance thresholds as needed
4. Maintain mock data relevance
5. Update browser compatibility as needed

## Known Limitations

- Tests require development server to be running
- Some tests may be flaky on slower CI environments
- Mobile gesture testing is limited by Playwright capabilities
- Performance thresholds may need adjustment based on hardware

## Troubleshooting

### Common Issues

1. **Timeout errors**: Increase timeout values or check server startup
2. **Selector not found**: Verify component test IDs are present
3. **Performance failures**: Check if thresholds need adjustment
4. **Browser compatibility**: Ensure all browsers are installed

### Getting Help

- Check Playwright documentation: https://playwright.dev/
- Review test helper utilities in `helpers/test-helpers.ts`
- Examine existing test patterns for guidance
- Use debug mode to step through test execution