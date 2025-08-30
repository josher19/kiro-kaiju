import { BedrockService } from '../bedrockService';
import { GradingRole } from '../../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-bedrock-runtime', () => ({
  BedrockRuntimeClient: jest.fn().mockImplementation(() => ({
    send: jest.fn()
  })),
  InvokeModelCommand: jest.fn()
}));

describe('BedrockService', () => {
  let bedrockService: BedrockService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    bedrockService = new BedrockService();
    mockSend = require('@aws-sdk/client-bedrock-runtime').BedrockRuntimeClient().send;
    jest.clearAllMocks();
  });

  describe('generateChallenge', () => {
    it('should generate a challenge successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              kaiju: 'complexasaur',
              initialCode: 'function test() { return "hello"; }',
              requirements: ['Add error handling', 'Improve readability'],
              description: 'Test challenge'
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await bedrockService.generateChallenge('javascript', 'vue', 3);

      expect(result).toEqual({
        kaiju: 'complexasaur',
        initialCode: 'function test() { return "hello"; }',
        requirements: ['Add error handling', 'Improve readability'],
        description: 'Test challenge'
      });
    });

    it('should handle Bedrock API errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('Bedrock API error'));

      await expect(bedrockService.generateChallenge('javascript', 'vue', 3))
        .rejects.toThrow('Failed to invoke Bedrock model');
    });

    it('should return fallback challenge on JSON parse error', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'invalid json response'
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await bedrockService.generateChallenge('javascript', 'vue', 3);

      expect(result).toEqual({
        kaiju: 'complexasaur',
        initialCode: '// Generated challenge code\nfunction example() {\n  return "Hello World";\n}',
        requirements: ['Refactor the code', 'Add error handling', 'Improve readability'],
        description: 'Basic refactoring challenge'
      });
    });
  });

  describe('gradeCode', () => {
    it('should grade code successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: JSON.stringify({
              developer: [8, 'Good code quality'],
              architect: [7, 'Decent architecture'],
              sqa: [6, 'Some test coverage needed'],
              productOwner: [9, 'Meets requirements well']
            })
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await bedrockService.gradeCode('function test() {}', ['Add tests']);

      expect(result).toEqual({
        [GradingRole.DEVELOPER]: [8, 'Good code quality'],
        [GradingRole.ARCHITECT]: [7, 'Decent architecture'],
        [GradingRole.SQA]: [6, 'Some test coverage needed'],
        [GradingRole.PRODUCT_OWNER]: [9, 'Meets requirements well']
      });
    });

    it('should return fallback scores on parsing error', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'invalid json'
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const result = await bedrockService.gradeCode('function test() {}', ['Add tests']);

      expect(result).toEqual({
        [GradingRole.DEVELOPER]: [5, 'Evaluation failed'],
        [GradingRole.ARCHITECT]: [5, 'Evaluation failed'],
        [GradingRole.SQA]: [5, 'Evaluation failed'],
        [GradingRole.PRODUCT_OWNER]: [5, 'Evaluation failed']
      });
    });
  });

  describe('chatCompletion', () => {
    it('should handle chat completion successfully', async () => {
      const mockResponse = {
        body: new TextEncoder().encode(JSON.stringify({
          content: [{
            text: 'This is a helpful response'
          }]
        }))
      };

      mockSend.mockResolvedValue(mockResponse);

      const messages = [
        { role: 'user', content: 'Help me refactor this code' }
      ];

      const result = await bedrockService.chatCompletion(messages);

      expect(result).toBe('This is a helpful response');
    });
  });
});