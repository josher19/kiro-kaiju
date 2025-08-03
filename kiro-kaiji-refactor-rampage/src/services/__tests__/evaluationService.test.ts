/**
 * Evaluation Service Tests
 * 
 * Comprehensive tests for the code evaluation system including
 * readability scoring, defect detection, requirement verification,
 * and overall scoring algorithms.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluationService, type EvaluationRequest } from '../evaluationService';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';
import type { Challenge, Requirement, TestCase } from '@/types/challenge';
import { KaijuType } from '@/types/kaiju';

describe('EvaluationService', () => {
  let evaluationService: EvaluationService;
  let mockChallenge: Challenge;
  let mockRequirements: Requirement[];
  let mockTestCases: TestCase[];

  beforeEach(() => {
    evaluationService = new EvaluationService();
    
    mockRequirements = [
      {
        id: 'req-1',
        description: 'Refactor the code to improve readability',
        priority: 'must',
        testable: true,
        acceptanceCriteria: [
          'Code should follow JavaScript best practices',
          'Functions should be properly documented'
        ]
      },
      {
        id: 'req-2',
        description: 'Fix all bugs in the code',
        priority: 'must',
        testable: true,
        acceptanceCriteria: [
          'All test cases should pass',
          'No syntax errors should remain'
        ]
      },
      {
        id: 'req-3',
        description: 'Add unit tests for the functions',
        priority: 'should',
        testable: true,
        acceptanceCriteria: [
          'Test coverage should be maintained',
          'Edge cases should be tested'
        ]
      }
    ];

    mockTestCases = [
      {
        id: 'test-1',
        name: 'Basic functionality test',
        description: 'Test basic function behavior',
        input: { value: 5 },
        expectedOutput: { result: 10 },
        isHidden: false,
        weight: 0.5
      },
      {
        id: 'test-2',
        name: 'Edge case test',
        description: 'Test edge case handling',
        input: { value: 0 },
        expectedOutput: { result: 0 },
        isHidden: false,
        weight: 0.3
      },
      {
        id: 'test-3',
        name: 'Error handling test',
        description: 'Test error conditions',
        input: { value: -1 },
        expectedOutput: { error: 'Invalid input' },
        isHidden: true,
        weight: 0.2
      }
    ];

    mockChallenge = {
      id: 'challenge-1',
      kaiju: {
        id: 'kaiju-1',
        type: KaijuType.COMPLEXASAUR,
        name: 'Complexasaur',
        description: 'A monster that creates overly complex code',
        avatar: 'complexasaur.png',
        flavorText: 'Simplify the tangled mess!',
        codePatterns: [],
        difficultyModifiers: []
      },
      config: {
        language: ProgrammingLanguage.JAVASCRIPT,
        category: ChallengeCategory.REFACTORING,
        difficulty: DifficultyLevel.INTERMEDIATE
      },
      title: 'Complexasaur Refactoring Challenge',
      description: 'Refactor this overly complex code',
      initialCode: 'function complexFunction() { /* complex code */ }',
      requirements: mockRequirements,
      testCases: mockTestCases,
      hints: ['Break down complex functions', 'Use meaningful variable names'],
      createdAt: new Date(),
      timeLimit: 30 * 60 * 1000,
      maxAttempts: 3
    };
  });

  describe('evaluateCode', () => {
    it('should evaluate code and return comprehensive results', async () => {
      const goodCode = `
        /**
         * Calculate the double of a number
         * @param {number} value - The input value
         * @returns {number} The doubled value
         */
        function calculateDouble(value) {
          if (typeof value !== 'number') {
            throw new Error('Invalid input: expected number');
          }
          
          if (value < 0) {
            throw new Error('Invalid input: negative numbers not allowed');
          }
          
          return value * 2;
        }

        // Test the function
        try {
          const result = calculateDouble(5);
          console.log('Result:', result);
        } catch (error) {
          console.error('Error:', error.message);
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: goodCode,
        userId: 'user-1',
        timeSpent: 15 * 60 * 1000, // 15 minutes
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);

      expect(result).toBeDefined();
      expect(result.challengeId).toBe('challenge-1');
      expect(result.userId).toBe('user-1');
      expect(result.submittedCode).toBe(goodCode);
      expect(result.timeSpent).toBe(15 * 60 * 1000);
      expect(result.attempts).toBe(1);
      expect(result.evaluatedAt).toBeInstanceOf(Date);

      // Check scores
      expect(result.scores.readability).toBeGreaterThan(70);
      expect(result.scores.quality).toBeGreaterThan(70);
      expect(result.scores.defects).toBeGreaterThan(80);
      expect(result.scores.requirements).toBeGreaterThan(60);
      expect(result.overallScore).toBeGreaterThan(70);

      // Check feedback
      expect(result.feedback).toHaveLength(4);
      expect(result.feedback.map(f => f.category)).toEqual(['readability', 'quality', 'defects', 'requirements']);

      // Should pass with good code
      expect(result.passed).toBe(true);
    });

    it('should handle poor quality code appropriately', async () => {
      const poorCode = `
        function x(a){if(a>0){if(a<10){if(a%2==0){return a*2}else{return a*3}}else{return a/2}}else{return 0}}
        var y=x(5);var z=x(10);var w=x(-1);
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: poorCode,
        userId: 'user-1',
        timeSpent: 30 * 60 * 1000,
        attempts: 3
      };

      const result = await evaluationService.evaluateCode(request);

      // Poor code should have low scores
      expect(result.scores.readability).toBeLessThan(60);
      expect(result.scores.quality).toBeLessThan(60);
      expect(result.overallScore).toBeLessThan(70);

      // Should not pass
      expect(result.passed).toBe(false);

      // Should have suggestions for improvement
      result.feedback.forEach(feedback => {
        expect(feedback.suggestions.length).toBeGreaterThan(0);
      });
    });

    it('should detect syntax errors', async () => {
      const syntaxErrorCode = `
        function brokenFunction() {
          if (true {
            return "missing closing parenthesis";
          }
          
          const unclosedString = "this string is not closed;
          
          return result;
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: syntaxErrorCode,
        userId: 'user-1',
        timeSpent: 10 * 60 * 1000,
        attempts: 2
      };

      const result = await evaluationService.evaluateCode(request);

      // Should have very low defect score due to syntax errors
      expect(result.scores.defects).toBeLessThan(50);
      expect(result.passed).toBe(false);

      // Should identify syntax errors in feedback
      const defectFeedback = result.feedback.find(f => f.category === 'defects');
      expect(defectFeedback?.suggestions.some(s => s.includes('syntax'))).toBe(true);
    });

    it('should handle different programming languages', async () => {
      const pythonCode = `
def calculate_double(value):
    """
    Calculate the double of a number
    
    Args:
        value (int): The input value
        
    Returns:
        int: The doubled value
        
    Raises:
        ValueError: If value is negative
    """
    if not isinstance(value, (int, float)):
        raise TypeError("Expected number")
    
    if value < 0:
        raise ValueError("Negative numbers not allowed")
    
    return value * 2

# Test the function
try:
    result = calculate_double(5)
    print(f"Result: {result}")
except (TypeError, ValueError) as error:
    print(f"Error: {error}")
      `;

      const pythonChallenge = {
        ...mockChallenge,
        config: {
          ...mockChallenge.config,
          language: ProgrammingLanguage.PYTHON
        }
      };

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: pythonChallenge,
        submittedCode: pythonCode,
        userId: 'user-1',
        timeSpent: 20 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);

      expect(result.scores.readability).toBeGreaterThan(80);
      expect(result.scores.quality).toBeGreaterThan(70);
      expect(result.passed).toBe(true);
    });
  });

  describe('readability evaluation', () => {
    it('should score well-formatted code highly', async () => {
      const wellFormattedCode = `
        /**
         * User authentication service
         */
        class AuthenticationService {
          constructor(apiClient) {
            this.apiClient = apiClient;
            this.currentUser = null;
          }

          /**
           * Authenticate user with credentials
           * @param {string} username - User's username
           * @param {string} password - User's password
           * @returns {Promise<User>} Authenticated user
           */
          async authenticateUser(username, password) {
            if (!username || !password) {
              throw new Error('Username and password are required');
            }

            try {
              const response = await this.apiClient.post('/auth/login', {
                username,
                password
              });

              this.currentUser = response.data.user;
              return this.currentUser;
            } catch (error) {
              throw new Error('Authentication failed');
            }
          }

          /**
           * Log out current user
           */
          logout() {
            this.currentUser = null;
          }
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: wellFormattedCode,
        userId: 'user-1',
        timeSpent: 25 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);
      expect(result.scores.readability).toBeGreaterThan(85);
    });

    it('should penalize poor formatting and naming', async () => {
      const poorlyFormattedCode = `
        function x(a,b,c){var d=a+b;var e=d*c;if(e>100){return e/2}else{if(e<50){return e*2}else{return e}}}
        var result1=x(1,2,3);var result2=x(10,20,30);
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: poorlyFormattedCode,
        userId: 'user-1',
        timeSpent: 5 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);
      expect(result.scores.readability).toBeLessThan(50);

      const readabilityFeedback = result.feedback.find(f => f.category === 'readability');
      expect(readabilityFeedback?.suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('quality evaluation', () => {
    it('should detect high cyclomatic complexity', async () => {
      const complexCode = `
        function processData(data, type, options) {
          if (data) {
            if (type === 'user') {
              if (options.validate) {
                if (data.email) {
                  if (data.email.includes('@')) {
                    if (data.password) {
                      if (data.password.length > 8) {
                        return { valid: true, user: data };
                      } else {
                        return { valid: false, error: 'Password too short' };
                      }
                    } else {
                      return { valid: false, error: 'Password required' };
                    }
                  } else {
                    return { valid: false, error: 'Invalid email' };
                  }
                } else {
                  return { valid: false, error: 'Email required' };
                }
              } else {
                return { valid: true, user: data };
              }
            } else if (type === 'admin') {
              // Similar nested structure...
              return { valid: true, admin: data };
            } else {
              return { valid: false, error: 'Unknown type' };
            }
          } else {
            return { valid: false, error: 'No data provided' };
          }
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: complexCode,
        userId: 'user-1',
        timeSpent: 40 * 60 * 1000,
        attempts: 2
      };

      const result = await evaluationService.evaluateCode(request);
      expect(result.scores.quality).toBeLessThan(70);

      const qualityFeedback = result.feedback.find(f => f.category === 'quality');
      expect(qualityFeedback?.suggestions.some(s => s.includes('complexity'))).toBe(true);
    });

    it('should detect code duplication', async () => {
      const duplicatedCode = `
        function processUserData(userData) {
          if (!userData.email) {
            throw new Error('Email is required');
          }
          if (!userData.password) {
            throw new Error('Password is required');
          }
          return { processed: true, data: userData };
        }

        function processAdminData(adminData) {
          if (!adminData.email) {
            throw new Error('Email is required');
          }
          if (!adminData.password) {
            throw new Error('Password is required');
          }
          return { processed: true, data: adminData };
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: duplicatedCode,
        userId: 'user-1',
        timeSpent: 20 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);
      
      const qualityFeedback = result.feedback.find(f => f.category === 'quality');
      expect(qualityFeedback?.suggestions.some(s => s.includes('duplication'))).toBe(true);
    });
  });

  describe('defect detection', () => {
    it('should detect potential null pointer issues', async () => {
      const nullPointerCode = `
        function getUserName(user) {
          return user.profile.name.toUpperCase();
        }

        function processUsers(users) {
          return users.map(user => getUserName(user));
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: nullPointerCode,
        userId: 'user-1',
        timeSpent: 15 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);
      
      const defectFeedback = result.feedback.find(f => f.category === 'defects');
      expect(defectFeedback?.suggestions.some(s => s.includes('null') || s.includes('undefined'))).toBe(true);
    });

    it('should detect security issues', async () => {
      const securityIssueCode = `
        function displayUserContent(content) {
          document.getElementById('content').innerHTML = content;
        }

        function executeUserCode(code) {
          eval(code);
        }

        const password = "hardcoded123";
        const apiKey = "sk-1234567890abcdef";
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: securityIssueCode,
        userId: 'user-1',
        timeSpent: 10 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);
      expect(result.scores.defects).toBeLessThan(60);

      const defectFeedback = result.feedback.find(f => f.category === 'defects');
      expect(defectFeedback?.suggestions.some(s => 
        s.includes('security') || s.includes('XSS') || s.includes('eval')
      )).toBe(true);
    });

    it('should detect performance issues', async () => {
      const performanceIssueCode = `
        function processLargeDataset(data) {
          let result = "";
          for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < data[i].items.length; j++) {
              result += data[i].items[j].name + " ";
              const element = document.getElementById('item-' + j);
              element.textContent = data[i].items[j].name;
            }
          }
          return result;
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: performanceIssueCode,
        userId: 'user-1',
        timeSpent: 25 * 60 * 1000,
        attempts: 2
      };

      const result = await evaluationService.evaluateCode(request);
      
      const defectFeedback = result.feedback.find(f => f.category === 'defects');
      expect(defectFeedback?.suggestions.some(s => 
        s.includes('performance') || s.includes('optimization')
      )).toBe(true);
    });
  });

  describe('requirement verification', () => {
    it('should verify refactoring requirements', async () => {
      const refactoredCode = `
        /**
         * User data processor with improved structure
         */
        class UserDataProcessor {
          constructor() {
            this.validators = new Map();
            this.setupValidators();
          }

          setupValidators() {
            this.validators.set('email', this.validateEmail);
            this.validators.set('password', this.validatePassword);
          }

          validateEmail(email) {
            return email && email.includes('@');
          }

          validatePassword(password) {
            return password && password.length >= 8;
          }

          processUser(userData) {
            const errors = this.validateUserData(userData);
            if (errors.length > 0) {
              throw new Error(\`Validation failed: \${errors.join(', ')}\`);
            }
            return { processed: true, data: userData };
          }

          validateUserData(userData) {
            const errors = [];
            for (const [field, validator] of this.validators) {
              if (!validator(userData[field])) {
                errors.push(\`Invalid \${field}\`);
              }
            }
            return errors;
          }
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: refactoredCode,
        userId: 'user-1',
        timeSpent: 35 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);
      expect(result.scores.requirements).toBeGreaterThan(70);

      const requirementsFeedback = result.feedback.find(f => f.category === 'requirements');
      expect(requirementsFeedback?.score).toBeGreaterThan(70);
    });

    it('should detect missing test implementations', async () => {
      const codeWithoutTests = `
        function calculateSum(a, b) {
          return a + b;
        }

        function calculateProduct(a, b) {
          return a * b;
        }
      `;

      const testRequirement: Requirement = {
        id: 'test-req',
        description: 'Add unit tests for the functions',
        priority: 'must',
        testable: true,
        acceptanceCriteria: ['Test coverage should be maintained']
      };

      const challengeWithTestReq = {
        ...mockChallenge,
        requirements: [testRequirement]
      };

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: challengeWithTestReq,
        submittedCode: codeWithoutTests,
        userId: 'user-1',
        timeSpent: 15 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);
      
      const requirementsFeedback = result.feedback.find(f => f.category === 'requirements');
      expect(requirementsFeedback?.suggestions.some(s => s.includes('test'))).toBe(true);
    });
  });

  describe('overall scoring', () => {
    it('should calculate weighted overall score correctly', async () => {
      const averageCode = `
        function processData(data) {
          if (data && data.length > 0) {
            return data.map(item => {
              return {
                id: item.id,
                name: item.name || 'Unknown',
                processed: true
              };
            });
          }
          return [];
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: averageCode,
        userId: 'user-1',
        timeSpent: 20 * 60 * 1000,
        attempts: 2
      };

      const result = await evaluationService.evaluateCode(request);

      // Verify that overall score is weighted average
      const expectedScore = Math.round(
        result.scores.readability * 0.25 +
        result.scores.quality * 0.30 +
        result.scores.defects * 0.25 +
        result.scores.requirements * 0.20
      );

      expect(result.overallScore).toBe(expectedScore);
    });

    it('should determine pass/fail status correctly', async () => {
      const excellentCode = `
        /**
         * High-quality user service implementation
         */
        class UserService {
          constructor(apiClient) {
            this.apiClient = apiClient;
            this.cache = new Map();
          }

          /**
           * Get user by ID with caching
           * @param {string} userId - The user ID
           * @returns {Promise<User>} The user object
           */
          async getUserById(userId) {
            if (!userId) {
              throw new Error('User ID is required');
            }

            // Check cache first
            if (this.cache.has(userId)) {
              return this.cache.get(userId);
            }

            try {
              const user = await this.apiClient.get(\`/users/\${userId}\`);
              this.cache.set(userId, user);
              return user;
            } catch (error) {
              throw new Error(\`Failed to fetch user: \${error.message}\`);
            }
          }

          /**
           * Clear user cache
           */
          clearCache() {
            this.cache.clear();
          }
        }

        // Unit tests
        describe('UserService', () => {
          it('should fetch user by ID', async () => {
            const mockApiClient = { get: vi.fn().mockResolvedValue({ id: '1', name: 'Test' }) };
            const service = new UserService(mockApiClient);
            
            const user = await service.getUserById('1');
            expect(user).toEqual({ id: '1', name: 'Test' });
          });

          it('should throw error for missing user ID', async () => {
            const service = new UserService({});
            await expect(service.getUserById('')).rejects.toThrow('User ID is required');
          });
        });
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: excellentCode,
        userId: 'user-1',
        timeSpent: 45 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);

      // High-quality code should pass
      expect(result.passed).toBe(true);
      expect(result.overallScore).toBeGreaterThan(70);
      expect(result.scores.readability).toBeGreaterThan(60);
      expect(result.scores.quality).toBeGreaterThan(60);
      expect(result.scores.defects).toBeGreaterThan(70);
      expect(result.scores.requirements).toBeGreaterThan(80);
    });
  });

  describe('error handling', () => {
    it('should handle evaluation errors gracefully', async () => {
      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: '', // Empty code
        userId: 'user-1',
        timeSpent: 5 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);

      // Should still return a result, even for empty code
      expect(result).toBeDefined();
      expect(result.scores.readability).toBe(0);
      expect(result.scores.quality).toBe(0);
      expect(result.passed).toBe(false);
    });

    it('should handle malformed code input', async () => {
      const malformedCode = 'function broken() { if (true { return false; } }';

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: malformedCode,
        userId: 'user-1',
        timeSpent: 10 * 60 * 1000,
        attempts: 3
      };

      const result = await evaluationService.evaluateCode(request);

      expect(result.scores.defects).toBeLessThan(50);
      expect(result.passed).toBe(false);

      const defectFeedback = result.feedback.find(f => f.category === 'defects');
      expect(defectFeedback?.suggestions.some(s => s.includes('syntax'))).toBe(true);
    });
  });

  describe('language-specific evaluation', () => {
    it('should apply Python-specific rules', async () => {
      const pythonCode = `
import os
import sys

def process_file(file_path):
    """Process a file and return its contents."""
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found: {file_path}")
    
    with open(file_path, 'r') as file:
        content = file.read()
    
    return content.strip()

class DataProcessor:
    """A class for processing data files."""
    
    def __init__(self, base_path):
        self.base_path = base_path
        self.processed_files = []
    
    def process_directory(self, directory):
        """Process all files in a directory."""
        full_path = os.path.join(self.base_path, directory)
        
        if not os.path.isdir(full_path):
            raise ValueError(f"Invalid directory: {directory}")
        
        results = []
        for filename in os.listdir(full_path):
            file_path = os.path.join(full_path, filename)
            if os.path.isfile(file_path):
                try:
                    content = process_file(file_path)
                    results.append({
                        'filename': filename,
                        'content': content,
                        'size': len(content)
                    })
                    self.processed_files.append(filename)
                except Exception as e:
                    print(f"Error processing {filename}: {e}")
        
        return results
      `;

      const pythonChallenge = {
        ...mockChallenge,
        config: {
          ...mockChallenge.config,
          language: ProgrammingLanguage.PYTHON
        }
      };

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: pythonChallenge,
        submittedCode: pythonCode,
        userId: 'user-1',
        timeSpent: 30 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);

      // Python code should score well for readability and quality
      expect(result.scores.readability).toBeGreaterThan(80);
      expect(result.scores.quality).toBeGreaterThan(75);
      expect(result.passed).toBe(true);
    });

    it('should apply TypeScript-specific rules', async () => {
      const typescriptCode = `
        interface User {
          id: string;
          name: string;
          email: string;
          createdAt: Date;
        }

        interface UserRepository {
          findById(id: string): Promise<User | null>;
          create(user: Omit<User, 'id' | 'createdAt'>): Promise<User>;
          update(id: string, updates: Partial<User>): Promise<User>;
          delete(id: string): Promise<void>;
        }

        /**
         * Service for managing user operations
         */
        class UserService {
          constructor(private readonly userRepository: UserRepository) {}

          /**
           * Create a new user
           */
          async createUser(userData: Omit<User, 'id' | 'createdAt'>): Promise<User> {
            if (!userData.email || !userData.name) {
              throw new Error('Name and email are required');
            }

            if (!this.isValidEmail(userData.email)) {
              throw new Error('Invalid email format');
            }

            return await this.userRepository.create(userData);
          }

          /**
           * Get user by ID
           */
          async getUser(id: string): Promise<User> {
            if (!id) {
              throw new Error('User ID is required');
            }

            const user = await this.userRepository.findById(id);
            if (!user) {
              throw new Error('User not found');
            }

            return user;
          }

          private isValidEmail(email: string): boolean {
            const emailRegex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
            return emailRegex.test(email);
          }
        }
      `;

      const typescriptChallenge = {
        ...mockChallenge,
        config: {
          ...mockChallenge.config,
          language: ProgrammingLanguage.TYPESCRIPT
        }
      };

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: typescriptChallenge,
        submittedCode: typescriptCode,
        userId: 'user-1',
        timeSpent: 40 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);

      // TypeScript code with interfaces should score well
      expect(result.scores.readability).toBeGreaterThan(85);
      expect(result.scores.quality).toBeGreaterThan(80);
      expect(result.passed).toBe(true);
    });
  });

  describe('feedback generation', () => {
    it('should provide actionable feedback', async () => {
      const improvableCode = `
        function calc(x, y, z) {
          var result;
          if (x > 0) {
            if (y > 0) {
              if (z > 0) {
                result = x + y + z;
              } else {
                result = x + y;
              }
            } else {
              result = x;
            }
          } else {
            result = 0;
          }
          return result;
        }
      `;

      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: improvableCode,
        userId: 'user-1',
        timeSpent: 15 * 60 * 1000,
        attempts: 2
      };

      const result = await evaluationService.evaluateCode(request);

      // Should provide specific, actionable feedback
      result.feedback.forEach(feedback => {
        expect(feedback.message).toBeTruthy();
        expect(feedback.suggestions.length).toBeGreaterThan(0);
        expect(feedback.score).toBeGreaterThanOrEqual(0);
        expect(feedback.score).toBeLessThanOrEqual(100);
        expect(feedback.maxScore).toBe(100);
      });

      // Should include code examples for improvement
      const feedbackWithExamples = result.feedback.filter(f => f.codeExamples && f.codeExamples.length > 0);
      expect(feedbackWithExamples.length).toBeGreaterThan(0);
    });

    it('should provide category-specific messages', async () => {
      const request: EvaluationRequest = {
        challengeId: 'challenge-1',
        challenge: mockChallenge,
        submittedCode: 'function test() { return true; }',
        userId: 'user-1',
        timeSpent: 5 * 60 * 1000,
        attempts: 1
      };

      const result = await evaluationService.evaluateCode(request);

      const categories = ['readability', 'quality', 'defects', 'requirements'];
      categories.forEach(category => {
        const feedback = result.feedback.find(f => f.category === category);
        expect(feedback).toBeDefined();
        expect(feedback!.message).toContain(category === 'readability' ? 'readability' : 
                                          category === 'quality' ? 'quality' :
                                          category === 'defects' ? 'defects' : 'requirements');
      });
    });
  });
});