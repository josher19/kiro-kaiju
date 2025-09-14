# Manual Test Plan for AWS Cloud Mode Services

## Overview
This test plan covers manual testing for the AWS Cloud Mode Services implementation. The system now defaults to AWS instead of Kiro for cloud mode deployment.

## Test Environment Setup
- AWS backend services deployed to: https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev
- Frontend application running locally
- Browser with developer tools for network inspection

## Test Cases

### 1. Application Initialization
**Objective**: Verify the application defaults to AWS cloud mode

**Steps**:
1. Clear browser localStorage
2. Open the application
3. Check the deployment mode indicator in the sidebar

**Expected Results**:
- Application should default to "Cloud" mode
- Sidebar should show "☁️ Cloud" as selected
- Console should log "AI service initialized in cloud mode with AWS as default provider"

### 2. AWS Authentication Flow
**Objective**: Verify automatic user authentication with AWS

**Steps**:
1. Open browser developer tools (Network tab)
2. Refresh the application
3. Monitor network requests

**Expected Results**:
- Should see POST request to `/api/auth/login` with generated userId
- Should receive sessionId in response
- sessionId should be stored in localStorage as 'kiro-kaiju-aws-session'
- Console should log "AWS authentication successful"

### 3. AI Chat Functionality
**Objective**: Test AI chat using AWS backend

**Steps**:
1. Navigate to Challenges view
2. Generate a challenge (any language/difficulty)
3. Switch to Coding view
4. Open AI chat panel
5. Send a message like "Help me refactor this code"
6. Monitor network requests in developer tools

**Expected Results**:
- Should see POST request to `/v1/chat/completions` with Authorization header
- Should receive AI response from AWS backend
- Response should appear in chat interface
- No errors in console

### 4. Challenge Generation
**Objective**: Test challenge generation through AWS

**Steps**:
1. Go to Challenges view
2. Select language (e.g., JavaScript)
3. Select category (e.g., Refactoring)
4. Select difficulty (e.g., Beginner)
5. Click "Generate Challenge"
6. Monitor network requests

**Expected Results**:
- Should see POST request to `/api/challenges/generate`
- Should receive challenge data with Kaiju monster
- Challenge should load in coding view
- Kaiju image should display in sidebar

### 5. Code Grading
**Objective**: Test AI grading through AWS

**Steps**:
1. Complete a challenge (or modify the code)
2. Click "Submit Code for Grading"
3. Monitor network requests

**Expected Results**:
- Should see POST request to `/api/grading/submit`
- Should receive grading results with role-based scores
- Results should display in grading modal
- Progress should be updated

### 6. Session Management
**Objective**: Test session persistence and re-authentication

**Steps**:
1. Use the application normally for a few minutes
2. Clear the AWS session from localStorage: `localStorage.removeItem('kiro-kaiju-aws-session')`
3. Try to send an AI chat message
4. Monitor network requests

**Expected Results**:
- Should automatically re-authenticate when session is missing
- Should see new POST request to `/api/auth/login`
- Should receive new sessionId
- AI request should succeed after re-authentication

### 7. Error Handling
**Objective**: Test error handling when AWS is unavailable

**Steps**:
1. Block network requests to the AWS domain in browser dev tools
2. Try to send an AI chat message
3. Check error messages

**Expected Results**:
- Should show user-friendly error message
- Should not crash the application
- Should provide fallback options or suggest local mode

### 8. Mode Switching
**Objective**: Test switching between cloud and local modes

**Steps**:
1. Start in Cloud mode (default)
2. Click "🏠 Local" button in sidebar
3. Try AI functionality
4. Switch back to "☁️ Cloud"
5. Try AI functionality again

**Expected Results**:
- Mode should switch successfully
- Local mode should use Kiro integration or local LLM
- Cloud mode should use AWS services
- No errors during switching

### 9. Progress Tracking
**Objective**: Test progress tracking with AWS backend

**Steps**:
1. Complete a challenge and submit for grading
2. Navigate to Progress view
3. Check that grading results are saved

**Expected Results**:
- Progress should be saved to AWS DynamoDB
- Should see grading history in Progress view
- Statistics should be updated correctly

### 10. Budget Management Integration
**Objective**: Test budget management with AWS services

**Steps**:
1. Check budget status in sidebar
2. Monitor for any budget alerts
3. Test behavior when budget limits are approached

**Expected Results**:
- Budget status should display correctly
- Should handle budget constraints gracefully
- Should provide fallback options when budget is exceeded

## Error Scenarios to Test

### Authentication Failures
- Invalid userId
- Network timeout during login
- AWS service unavailable

### API Failures
- 401 Unauthorized (expired session)
- 429 Rate limiting
- 500 Server errors
- Network connectivity issues

### Data Validation
- Invalid challenge parameters
- Malformed code submissions
- Missing required fields

## Performance Testing

### Response Times
- Challenge generation: < 10 seconds
- AI chat responses: < 30 seconds
- Code grading: < 45 seconds
- Authentication: < 5 seconds

### Concurrent Usage
- Multiple AI requests
- Simultaneous challenge generation
- Rapid mode switching

## Browser Compatibility
Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Testing
Test on mobile devices:
- iOS Safari
- Android Chrome
- Responsive design functionality
- Touch interactions

## Notes for Testers

1. **Network Monitoring**: Always keep browser developer tools open to monitor network requests and responses
2. **Console Logs**: Check browser console for any errors or warnings
3. **LocalStorage**: Monitor localStorage for session management and user data
4. **Error Recovery**: Test the application's ability to recover from various error conditions
5. **User Experience**: Pay attention to loading states, error messages, and overall user experience

## Known Issues to Ignore
- Some unit tests are currently skipped and may show warnings
- Local LLM functionality may not work without proper local setup
- Some UI components may have minor styling issues during development

## Success Criteria
- All test cases pass without critical errors
- AWS authentication works reliably
- AI functionality works through AWS backend
- Mode switching works correctly
- Error handling is graceful and user-friendly
- Performance meets acceptable thresholds