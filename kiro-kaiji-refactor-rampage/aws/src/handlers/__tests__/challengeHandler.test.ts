import { generateChallenge } from '../challengeHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock BedrockService
jest.mock('../services/bedrockService', () => ({
  BedrockService: jest.fn().mockImplementation(() => ({
    generateChallenge: jest.fn()
  }))
}));

describe('challengeHandler', () => {
  let mockBedrockService: any;

  beforeEach(() => {
    mockBedrockService = require('../services/bedrockService').BedrockService();
    jest.clearAllMocks();
  });

  describe('generateChallenge', () => {
    it('should generate challenge successfully', async () => {
      const mockChallengeData = {
        kaiju: 'complexasaur',
        initialCode: 'function test() { return "hello"; }',
        requirements: ['Add error handling', 'Improve readability'],
        description: 'Test challenge'
      };

      mockBedrockService.generateChallenge.mockResolvedValue(mockChallengeData);

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          language: 'javascript',
          framework: 'vue',
          category: 'refactoring',
          difficulty: 3
        })
      };

      const result = await generateChallenge(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.kaiju.type).toBe('complexasaur');
      expect(responseBody.initialCode).toBe('function test() { return "hello"; }');
      expect(responseBody.requirements).toEqual(['Add error handling', 'Improve readability']);
      expect(responseBody.language).toBe('javascript');
      expect(responseBody.framework).toBe('vue');
      expect(responseBody.difficulty).toBe(3);
    });

    it('should return 400 for missing request body', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: null
      };

      const result = await generateChallenge(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Request body is required');
    });

    it('should return 400 for missing required fields', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          language: 'javascript'
          // Missing difficulty
        })
      };

      const result = await generateChallenge(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Language and difficulty are required');
    });

    it('should handle Bedrock service errors', async () => {
      mockBedrockService.generateChallenge.mockRejectedValue(new Error('Bedrock error'));

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          language: 'javascript',
          difficulty: 3
        })
      };

      const result = await generateChallenge(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Failed to generate challenge');
    });

    it('should include CORS headers', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          language: 'javascript',
          difficulty: 3
        })
      };

      mockBedrockService.generateChallenge.mockResolvedValue({
        kaiju: 'complexasaur',
        initialCode: 'test',
        requirements: ['test'],
        description: 'test'
      });

      const result = await generateChallenge(event as APIGatewayProxyEvent);

      expect(result.headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      });
    });
  });
});