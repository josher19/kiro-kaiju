import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CloudService } from '../cloudService';
import axios from 'axios';

// Mock axios
vi.mock('axios');
const mockedAxios = axios as any;

describe('CloudService', () => {
  let cloudService: CloudService;
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      interceptors: {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      }
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance);
    
    cloudService = new CloudService({
      apiBaseUrl: 'https://api.example.com'
    });

    // Clear localStorage
    localStorage.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should authenticate user successfully', async () => {
      const mockResponse = {
        data: {
          sessionId: 'session-123',
          expiresAt: '2024-12-31T23:59:59Z'
        }
      };

      mockAxiosInstance.post.mockResolvedValue(mockResponse);

      const result = await cloudService.login('user-123');

      expect(result).toEqual({
        sessionId: 'session-123',
        expiresAt: '2024-12-31T23:59:59Z'
      });

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/api/auth/login', {
        userId: 'user-123'
      });
    });
  });
});