import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { UserProgress, AuthSession, GradingHistoryEntry } from '../types';

export class DynamoService {
  private client: DynamoDBDocumentClient;
  private tableName: string;

  constructor() {
    const dynamoClient = new DynamoDBClient({ region: process.env.AWS_REGION || 'us-east-1' });
    this.client = DynamoDBDocumentClient.from(dynamoClient);
    this.tableName = process.env.DYNAMODB_TABLE || 'kiro-kaiji-refactor-rampage-dev';
  }

  async getUserProgress(userId: string): Promise<UserProgress | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          userId: userId,
          challengeId: 'PROGRESS'
        }
      });

      const result = await this.client.send(command);
      return result.Item as UserProgress || null;
    } catch (error) {
      console.error('Error getting user progress:', error);
      return null;
    }
  }

  async updateUserProgress(progress: UserProgress): Promise<void> {
    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          ...progress,
          challengeId: 'PROGRESS',
          updatedAt: new Date().toISOString()
        }
      });

      await this.client.send(command);
    } catch (error) {
      console.error('Error updating user progress:', error);
      throw new Error('Failed to update user progress');
    }
  }

  async addGradingHistory(userId: string, gradingEntry: GradingHistoryEntry): Promise<void> {
    try {
      // Get current progress
      const currentProgress = await this.getUserProgress(userId);
      
      if (!currentProgress) {
        // Create new progress record
        const newProgress: UserProgress = {
          userId,
          completedChallenges: [gradingEntry.challengeId],
          achievements: [],
          stats: {
            totalChallenges: 1,
            averageScore: gradingEntry.averageScore,
            kaijuDefeated: {}
          },
          gradingHistory: [gradingEntry],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await this.updateUserProgress(newProgress);
      } else {
        // Update existing progress
        const updatedHistory = [...currentProgress.gradingHistory, gradingEntry];
        const totalChallenges = updatedHistory.length;
        const averageScore = updatedHistory.reduce((sum, entry) => sum + entry.averageScore, 0) / totalChallenges;

        const updatedProgress: UserProgress = {
          ...currentProgress,
          gradingHistory: updatedHistory,
          stats: {
            ...currentProgress.stats,
            totalChallenges,
            averageScore
          },
          updatedAt: new Date().toISOString()
        };

        await this.updateUserProgress(updatedProgress);
      }
    } catch (error) {
      console.error('Error adding grading history:', error);
      throw new Error('Failed to add grading history');
    }
  }

  async createSession(userId: string): Promise<AuthSession> {
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const session: AuthSession = {
      userId,
      sessionId,
      expiresAt,
      createdAt: new Date().toISOString()
    };

    try {
      const command = new PutCommand({
        TableName: this.tableName,
        Item: {
          userId: `SESSION_${sessionId}`,
          challengeId: 'AUTH',
          ...session
        }
      });

      await this.client.send(command);
      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw new Error('Failed to create session');
    }
  }

  async getSession(sessionId: string): Promise<AuthSession | null> {
    try {
      const command = new GetCommand({
        TableName: this.tableName,
        Key: {
          userId: `SESSION_${sessionId}`,
          challengeId: 'AUTH'
        }
      });

      const result = await this.client.send(command);
      if (!result.Item) return null;

      const session = result.Item as AuthSession;
      
      // Check if session is expired
      if (new Date(session.expiresAt) < new Date()) {
        return null;
      }

      return session;
    } catch (error) {
      console.error('Error getting session:', error);
      return null;
    }
  }
}