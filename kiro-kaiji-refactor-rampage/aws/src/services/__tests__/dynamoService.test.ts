import { DynamoService } from '../dynamoService';
import { UserProgress, GradingHistoryEntry, GradingRole } from '../../types';

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: jest.fn()
}));

jest.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: jest.fn().mockReturnValue({
      send: jest.fn()
    })
  },
  GetCommand: jest.fn(),
  PutCommand: jest.fn(),
  UpdateCommand: jest.fn(),
  QueryCommand: jest.fn()
}));

describe('DynamoService', () => {
  let dynamoService: DynamoService;
  let mockSend: jest.Mock;

  beforeEach(() => {
    dynamoService = new DynamoService();
    mockSend = require('@aws-sdk/lib-dynamodb').DynamoDBDocumentClient.from().send;
    jest.clearAllMocks();
  });

  describe('getUserProgress', () => {
    it('should return user progress when found', async () => {
      const mockProgress: UserProgress = {
        userId: 'test-user',
        completedChallenges: ['challenge-1'],
        achievements: [],
        stats: {
          totalChallenges: 1,
          averageScore: 8.5,
          kaijuDefeated: {}
        },
        gradingHistory: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockSend.mockResolvedValue({ Item: mockProgress });

      const result = await dynamoService.getUserProgress('test-user');

      expect(result).toEqual(mockProgress);
    });

    it('should return null when user progress not found', async () => {
      mockSend.mockResolvedValue({ Item: undefined });

      const result = await dynamoService.getUserProgress('test-user');

      expect(result).toBeNull();
    });

    it('should handle DynamoDB errors gracefully', async () => {
      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      const result = await dynamoService.getUserProgress('test-user');

      expect(result).toBeNull();
    });
  });

  describe('updateUserProgress', () => {
    it('should update user progress successfully', async () => {
      const mockProgress: UserProgress = {
        userId: 'test-user',
        completedChallenges: ['challenge-1'],
        achievements: [],
        stats: {
          totalChallenges: 1,
          averageScore: 8.5,
          kaijuDefeated: {}
        },
        gradingHistory: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockSend.mockResolvedValue({});

      await expect(dynamoService.updateUserProgress(mockProgress))
        .resolves.not.toThrow();
    });

    it('should handle update errors', async () => {
      const mockProgress: UserProgress = {
        userId: 'test-user',
        completedChallenges: [],
        achievements: [],
        stats: {
          totalChallenges: 0,
          averageScore: 0,
          kaijuDefeated: {}
        },
        gradingHistory: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      mockSend.mockRejectedValue(new Error('DynamoDB error'));

      await expect(dynamoService.updateUserProgress(mockProgress))
        .rejects.toThrow('Failed to update user progress');
    });
  });

  describe('addGradingHistory', () => {
    it('should create new progress record for new user', async () => {
      const gradingEntry: GradingHistoryEntry = {
        challengeId: 'challenge-1',
        gradingTimestamp: '2024-01-01T00:00:00Z',
        roleScores: {
          [GradingRole.DEVELOPER]: 8,
          [GradingRole.ARCHITECT]: 7,
          [GradingRole.SQA]: 6,
          [GradingRole.PRODUCT_OWNER]: 9
        },
        averageScore: 7.5,
        modelUsed: 'claude-3-haiku'
      };

      // First call returns null (no existing progress)
      // Second call succeeds (update progress)
      mockSend
        .mockResolvedValueOnce({ Item: undefined })
        .mockResolvedValueOnce({});

      await expect(dynamoService.addGradingHistory('test-user', gradingEntry))
        .resolves.not.toThrow();
    });

    it('should update existing progress record', async () => {
      const existingProgress: UserProgress = {
        userId: 'test-user',
        completedChallenges: ['challenge-1'],
        achievements: [],
        stats: {
          totalChallenges: 1,
          averageScore: 8.0,
          kaijuDefeated: {}
        },
        gradingHistory: [],
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      };

      const gradingEntry: GradingHistoryEntry = {
        challengeId: 'challenge-2',
        gradingTimestamp: '2024-01-01T00:00:00Z',
        roleScores: {
          [GradingRole.DEVELOPER]: 7,
          [GradingRole.ARCHITECT]: 8,
          [GradingRole.SQA]: 6,
          [GradingRole.PRODUCT_OWNER]: 9
        },
        averageScore: 7.5,
        modelUsed: 'claude-3-haiku'
      };

      // First call returns existing progress
      // Second call succeeds (update progress)
      mockSend
        .mockResolvedValueOnce({ Item: existingProgress })
        .mockResolvedValueOnce({});

      await expect(dynamoService.addGradingHistory('test-user', gradingEntry))
        .resolves.not.toThrow();
    });
  });

  describe('createSession', () => {
    it('should create session successfully', async () => {
      mockSend.mockResolvedValue({});

      const result = await dynamoService.createSession('test-user');

      expect(result.userId).toBe('test-user');
      expect(result.sessionId).toMatch(/^session_/);
      expect(result.expiresAt).toBeDefined();
      expect(result.createdAt).toBeDefined();
    });
  });

  describe('getSession', () => {
    it('should return valid session', async () => {
      const mockSession = {
        userId: 'test-user',
        sessionId: 'session-123',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockSend.mockResolvedValue({ Item: mockSession });

      const result = await dynamoService.getSession('session-123');

      expect(result).toEqual(mockSession);
    });

    it('should return null for expired session', async () => {
      const mockSession = {
        userId: 'test-user',
        sessionId: 'session-123',
        expiresAt: new Date(Date.now() - 1000).toISOString(), // Expired
        createdAt: '2024-01-01T00:00:00Z'
      };

      mockSend.mockResolvedValue({ Item: mockSession });

      const result = await dynamoService.getSession('session-123');

      expect(result).toBeNull();
    });

    it('should return null when session not found', async () => {
      mockSend.mockResolvedValue({ Item: undefined });

      const result = await dynamoService.getSession('session-123');

      expect(result).toBeNull();
    });
  });
});