import { gradeCode } from '../gradingHandler';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { GradingRole } from '../../types';

// Mock services
jest.mock('../services/bedrockService', () => ({
  BedrockService: jest.fn().mockImplementation(() => ({
    gradeCode: jest.fn()
  }))
}));

jest.mock('../services/dynamoService', () => ({
  DynamoService: jest.fn().mockImplementation(() => ({
    addGradingHistory: jest.fn()
  }))
}));

describe('gradingHandler', () => {
  let mockBedrockService: any;
  let mockDynamoService: any;

  beforeEach(() => {
    mockBedrockService = require('../services/bedrockService').BedrockService();
    mockDynamoService = require('../services/dynamoService').DynamoService();
    jest.clearAllMocks();
  });

  describe('gradeCode', () => {
    it('should grade code successfully', async () => {
      const mockRoleScores = {
        [GradingRole.DEVELOPER]: [8, 'Good code quality'],
        [GradingRole.ARCHITECT]: [7, 'Decent architecture'],
        [GradingRole.SQA]: [6, 'Some test coverage needed'],
        [GradingRole.PRODUCT_OWNER]: [9, 'Meets requirements well']
      };

      mockBedrockService.gradeCode.mockResolvedValue(mockRoleScores);
      mockDynamoService.addGradingHistory.mockResolvedValue(undefined);

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          challengeId: 'challenge-123',
          submittedCode: 'function test() { return "hello"; }',
          requirements: ['Add error handling', 'Improve readability'],
          userId: 'user-123'
        })
      };

      const result = await gradeCode(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      
      const responseBody = JSON.parse(result.body);
      expect(responseBody.challengeId).toBe('challenge-123');
      expect(responseBody.averageScore).toBe(7.5); // (8+7+6+9)/4
      expect(responseBody.roleEvaluations[GradingRole.DEVELOPER].score).toBe(8);
      expect(responseBody.roleEvaluations[GradingRole.DEVELOPER].feedback).toBe('Good code quality');
    });

    it('should return 400 for missing request body', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: null
      };

      const result = await gradeCode(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Request body is required');
    });

    it('should return 400 for missing required fields', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          challengeId: 'challenge-123'
          // Missing submittedCode and requirements
        })
      };

      const result = await gradeCode(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).error).toBe('Challenge ID, submitted code, and requirements are required');
    });

    it('should handle grading without userId', async () => {
      const mockRoleScores = {
        [GradingRole.DEVELOPER]: [8, 'Good code quality'],
        [GradingRole.ARCHITECT]: [7, 'Decent architecture'],
        [GradingRole.SQA]: [6, 'Some test coverage needed'],
        [GradingRole.PRODUCT_OWNER]: [9, 'Meets requirements well']
      };

      mockBedrockService.gradeCode.mockResolvedValue(mockRoleScores);

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          challengeId: 'challenge-123',
          submittedCode: 'function test() { return "hello"; }',
          requirements: ['Add error handling', 'Improve readability']
          // No userId provided
        })
      };

      const result = await gradeCode(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(200);
      expect(mockDynamoService.addGradingHistory).not.toHaveBeenCalled();
    });

    it('should handle Bedrock service errors', async () => {
      mockBedrockService.gradeCode.mockRejectedValue(new Error('Bedrock error'));

      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          challengeId: 'challenge-123',
          submittedCode: 'function test() { return "hello"; }',
          requirements: ['Add error handling']
        })
      };

      const result = await gradeCode(event as APIGatewayProxyEvent);

      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).error).toBe('Failed to grade code');
    });

    it('should include CORS headers', async () => {
      const event: Partial<APIGatewayProxyEvent> = {
        body: JSON.stringify({
          challengeId: 'challenge-123',
          submittedCode: 'test',
          requirements: ['test']
        })
      };

      mockBedrockService.gradeCode.mockResolvedValue({
        [GradingRole.DEVELOPER]: [5, 'test'],
        [GradingRole.ARCHITECT]: [5, 'test'],
        [GradingRole.SQA]: [5, 'test'],
        [GradingRole.PRODUCT_OWNER]: [5, 'test']
      });

      const result = await gradeCode(event as APIGatewayProxyEvent);

      expect(result.headers).toEqual({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      });
    });
  });
});