# Manual Test Plan for AWS Cloud Mode Services

## Overview
This test plan covers manual testing for the AWS Cloud Mode Services integration that makes AWS the default AI provider instead of Kiro.

## Test Environment
- AWS Backend URL: https://wz1g0oat52.execute-api.us-west-2.amazonaws.com/dev
- Frontend: Local development server (npm run dev)

## Test Cases

### 1. Initial Application Load
**Objective**: Verify AWS is used as default AI provider

**Steps**:
1. Clear browser localStorage
2. Start the application (npm run dev)
3. Open browser developer tools and check console logs
4. Navigate to the application

**Expected Results**:
- Console should show "AI service initialized in cloud mode"
- No errors related to AI service initialization
- Application loads successfully

### 2. AWS Authentication Flow
**Objective**: Verify automatic user authentication with AWS

**Steps**:
1. Open the AI chat interface
2. Send a message like "Hello, can you help me?"
3. Check browser developer tools Network tab
4. Check localStorage for session data

**Expected Results**:
- First request should trigger authentication to `/api/auth/login`
- A `kiro-kaiju-user-id` should be created in localStorage
- A `kiro-kaiju-aws-session` should be stored in localStorage
- Authentication should succeed and return a sessionId

### 3. AI Chat Functionality
**Objective**: Verify AI chat works with AWS backend

**Steps**:
1. Generate a challenge (any language/difficulty)
2. Open the AI chat interface
3. Send various messages:
   - "Help me refactor this code"
   - "Can you generate unit tests?"
   - "What are the requirements for this challenge?"
4. Observe responses and timing

**Expected Results**:
- All messages should receive responses from AWS AI service
- Responses should be contextually relevant to the challenge
- Network requests should go to `/v1/chat/completions` with Bearer token
- No fallback to local or OpenRouter services

### 4. Session Management
**Objective**: Verify session handling and re-authentication

**Steps**:
1. Send a successful AI chat message
2. Clear the `kiro-kaiju-aws-session` from localStorage
3. Send another AI chat message
4. Check network requests

**Expected Results**:
- Second message should trigger re-authentication
- New session should be created automatically
- Message should still be processed successfully

### 5. Error Handling
**Objective**: Verify graceful error handling

**Steps**:
1. Disconnect from internet
2. Try to send an AI chat message
3. Reconnect to internet
4. Try sending another message

**Expected Results**:
- Offline message should show appropriate error
- Online message should work normally after reconnection
- No application crashes or unhandled errors

### 6. Zoom-a-Friend Integration
**Objective**: Verify Zoom-a-Friend uses AWS AI service

**Steps**:
1. Generate a challenge
2. Click on "Zoom-a-Friend"
3. Select different team members (Cat, Owl, Pig, Pufferfish)
4. Check network requests for each interaction

**Expected Results**:
- All team member interactions should use AWS AI service
- Responses should be role-appropriate
- Network requests should use the same AWS endpoints

### 7. Grading System Integration
**Objective**: Verify AI grading uses AWS service

**Steps**:
1. Generate a challenge
2. Write some code in the editor
3. Click "Submit Code for Grading"
4. Check network requests and responses

**Expected Results**:
- Grading request should go to AWS AI service
- Should receive scores from all four roles (Developer, Architect, SQA, Product Owner)
- Results should be displayed properly
- Progress should be updated

### 8. Deployment Mode Switching
**Objective**: Verify switching between cloud and local modes

**Steps**:
1. Start in cloud mode (default)
2. Switch to local mode via deployment mode selector
3. Try AI chat functionality
4. Switch back to cloud mode
5. Try AI chat functionality again

**Expected Results**:
- Local mode should attempt to use Kiro or local LLM
- Cloud mode should use AWS service
- Switching should work without errors
- Appropriate console messages for each mode

## Error Scenarios to Test

### 1. AWS Service Unavailable
**Steps**:
1. Block requests to AWS domain in browser dev tools
2. Try to use AI chat

**Expected Results**:
- Should show appropriate error message
- Should not crash the application

### 2. Invalid Session
**Steps**:
1. Manually set an invalid session ID in localStorage
2. Try to use AI chat

**Expected Results**:
- Should automatically re-authenticate
- Should work normally after re-authentication

### 3. Network Timeout
**Steps**:
1. Use browser dev tools to simulate slow network
2. Send AI chat message

**Expected Results**:
- Should handle timeout gracefully
- Should show appropriate loading states

## Performance Tests

### 1. Response Time
**Objective**: Measure AI response times

**Steps**:
1. Send 5 different AI chat messages
2. Record response times for each

**Expected Results**:
- Responses should typically be under 10 seconds
- No significant degradation over multiple requests

### 2. Session Persistence
**Objective**: Verify session doesn't expire quickly

**Steps**:
1. Authenticate and get session
2. Wait 10 minutes
3. Send AI chat message

**Expected Results**:
- Session should still be valid
- No re-authentication required

## Browser Compatibility

Test the above scenarios in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Mobile Testing

Test key scenarios on:
- iOS Safari
- Android Chrome
- Responsive design at various screen sizes

## Success Criteria

- All test cases pass without errors
- AWS is used as the default AI provider
- Authentication flow works seamlessly
- Error handling is graceful and user-friendly
- Performance is acceptable (responses under 10 seconds)
- All browsers and mobile devices work correctly

## Known Issues / Limitations

- Unit tests are currently skipped and need to be updated
- Some existing tests may fail due to provider changes
- Local LLM fallback may not work if AWS is unavailable (by design)

## Notes for Developers

- Check browser console for detailed error messages
- Use Network tab to verify API calls are going to correct endpoints
- Check localStorage for session management debugging
- AWS backend logs can be viewed in CloudWatch if needed