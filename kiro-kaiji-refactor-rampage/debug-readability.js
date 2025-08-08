// Debug script to understand readability scoring
import { EvaluationService } from './src/services/evaluationService.ts';
import { ProgrammingLanguage } from './src/types/challenge.ts';

const evaluationService = new EvaluationService();

const typescriptCode = `
        interface User {
          id: string;
          name: string;
          email: string;
          createdAt: Date;
        }

        interface UserRepository {
          create(userData: Omit<User, 'id' | 'createdAt'>): Promise<User>;
          findById(id: string): Promise<User | null>;
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

async function debugReadability() {
  try {
    const result = await evaluationService.evaluateReadability(typescriptCode, ProgrammingLanguage.TYPESCRIPT);
    console.log('Readability Score:', result.score);
    console.log('Feedback:', result.feedback);
  } catch (error) {
    console.error('Error:', error);
  }
}

debugReadability();