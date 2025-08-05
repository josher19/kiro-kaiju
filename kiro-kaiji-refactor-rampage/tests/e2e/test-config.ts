/**
 * Enhanced E2E Test Configuration for Kiro Kaiji: Refactor Rampage
 * 
 * This file provides centralized configuration for all E2E tests including:
 * - Test data and mock responses
 * - Performance thresholds
 * - Browser and device configurations
 * - Test environment settings
 */

export interface TestEnvironment {
  baseUrl: string;
  apiUrl: string;
  timeout: number;
  retries: number;
  headless: boolean;
}

export interface PerformanceThresholds {
  pageLoad: number;
  challengeGeneration: number;
  codeEvaluation: number;
  editorLoad: number;
  aiResponse: number;
  navigation: number;
  memoryUsage: number;
}

export interface BrowserConfig {
  name: string;
  project: string;
  viewport: { width: number; height: number };
  userAgent?: string;
  features: string[];
}

export interface DeviceConfig {
  name: string;
  viewport: { width: number; height: number };
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
}

export interface TestData {
  sampleCode: Record<string, string>;
  buggyCode: Record<string, string>;
  complexCode: string;
  aiMessages: string[];
  teamMemberResponses: Record<string, RegExp>;
  challengeConfigs: Array<{
    language: string;
    framework?: string;
    category: string;
    difficulty: string;
  }>;
}

export interface MockApiResponses {
  challengeGeneration: any;
  codeEvaluation: any;
  aiChat: any;
  teamMemberDialog: any;
  userProgress: any;
}

// Test Environment Configuration
export const TEST_ENVIRONMENTS: Record<string, TestEnvironment> = {
  local: {
    baseUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:5173/api',
    timeout: 30000,
    retries: 2,
    headless: true
  },
  ci: {
    baseUrl: 'http://localhost:5173',
    apiUrl: 'http://localhost:5173/api',
    timeout: 60000,
    retries: 3,
    headless: true
  },
  staging: {
    baseUrl: 'https://staging.kiro-kaiju.com',
    apiUrl: 'https://api-staging.kiro-kaiju.com',
    timeout: 45000,
    retries: 2,
    headless: true
  }
};

// Performance Thresholds (in milliseconds)
export const PERFORMANCE_THRESHOLDS: PerformanceThresholds = {
  pageLoad: 5000,        // 5 seconds
  challengeGeneration: 12000, // 12 seconds
  codeEvaluation: 15000, // 15 seconds
  editorLoad: 8000,      // 8 seconds
  aiResponse: 10000,     // 10 seconds
  navigation: 2000,      // 2 seconds
  memoryUsage: 100       // 100MB
};

// Browser Configurations
export const BROWSER_CONFIGS: BrowserConfig[] = [
  {
    name: 'Chrome',
    project: 'chromium',
    viewport: { width: 1280, height: 720 },
    features: ['webgl', 'webworkers', 'serviceworker', 'indexeddb']
  },
  {
    name: 'Firefox',
    project: 'firefox',
    viewport: { width: 1280, height: 720 },
    features: ['webgl', 'webworkers', 'serviceworker', 'indexeddb']
  },
  {
    name: 'Safari',
    project: 'webkit',
    viewport: { width: 1280, height: 720 },
    features: ['webgl', 'webworkers', 'serviceworker', 'indexeddb']
  },
  {
    name: 'Edge',
    project: 'Microsoft Edge',
    viewport: { width: 1280, height: 720 },
    features: ['webgl', 'webworkers', 'serviceworker', 'indexeddb']
  }
];

// Device Configurations
export const DEVICE_CONFIGS: DeviceConfig[] = [
  {
    name: 'iPhone 12',
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'Pixel 5',
    viewport: { width: 393, height: 851 },
    userAgent: 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36',
    deviceScaleFactor: 2.75,
    isMobile: true,
    hasTouch: true
  },
  {
    name: 'iPad Pro',
    viewport: { width: 1024, height: 1366 },
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: true
  },
  {
    name: 'Desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false
  }
];

// Test Data
export const TEST_DATA: TestData = {
  sampleCode: {
    javascript: `function calculateTotal(items) {
  let total = 0;
  for (let i = 0; i < items.length; i++) {
    total += items[i].price * items[i].quantity;
  }
  return total;
}

// Export for testing
module.exports = { calculateTotal };`,
    python: `def calculate_total(items):
    """Calculate total price for items"""
    total = 0
    for item in items:
        total += item['price'] * item['quantity']
    return total

# Test data
if __name__ == "__main__":
    test_items = [
        {'price': 10.99, 'quantity': 2},
        {'price': 5.50, 'quantity': 1}
    ]
    print(f"Total: {calculate_total(test_items)}")`,
    java: `
import java.util.List;

public class Calculator {
    /**
     * Calculate total price for a list of items
     * @param items List of items with price and quantity
     * @return Total price
     */
    public static double calculateTotal(List<Item> items) {
        double total = 0.0;
        for (Item item : items) {
            total += item.getPrice() * item.getQuantity();
        }
        return total;
    }
    
    public static class Item {
        private double price;
        private int quantity;
        
        public Item(double price, int quantity) {
            this.price = price;
            this.quantity = quantity;
        }
        
        public double getPrice() { return price; }
        public int getQuantity() { return quantity; }
    }
}
    `
  },

  buggyCode: {
    javascript: `
// Buggy function with multiple issues
function buggyCalculation(arr) {
  let sum = 0;
  for (let i = 0; i <= arr.length; i++) { // Off-by-one error
    sum += arr[i]; // Potential undefined access
  }
  return sum;
}

function memoryLeak() {
  const data = [];
  setInterval(() => {
    data.push(new Array(1000000).fill('leak')); // Memory leak
  }, 100);
  return data;
}

function divisionByZero(x) {
  return x / 0; // Division by zero
}
    `,
    python: `
# Buggy Python code
def buggy_function(items):
    total = 0
    for i in range(len(items) + 1):  # Off-by-one error
        total += items[i]['price']   # IndexError potential
    return total

def infinite_recursion(n):
    return infinite_recursion(n - 1)  # No base case

def type_error_example():
    return "string" + 5  # TypeError
    `
  },

  complexCode: `
// Overly complex nested function
function complexNestedFunction(a, b, c, d, e) {
  if (a > 0) {
    if (b > 0) {
      if (c > 0) {
        if (d > 0) {
          if (e > 0) {
            return a + b + c + d + e;
          } else {
            if (e < -10) {
              return a + b + c + d - e;
            } else {
              return a + b + c + d;
            }
          }
        } else {
          if (d < -5) {
            return a + b + c - d;
          } else {
            return a + b + c;
          }
        }
      } else {
        if (c < -3) {
          return a + b - c;
        } else {
          return a + b;
        }
      }
    } else {
      if (b < -2) {
        return a - b;
      } else {
        return a;
      }
    }
  } else {
    if (a < -1) {
      return -a;
    } else {
      return 0;
    }
  }
}
  `,

  aiMessages: [
    'Help me refactor this code to improve readability',
    'Generate unit tests for this function',
    'How can I optimize the performance of this code?',
    'What are the potential bugs in this implementation?',
    'Explain the SOLID principles and how they apply here',
    'How should I handle error cases in this function?',
    'What design patterns would be appropriate here?',
    'Can you suggest better variable names?',
    'How can I make this code more maintainable?',
    'What security considerations should I be aware of?'
  ],

  teamMemberResponses: {
    'qa-pufferfish': /puff|bubble|bug|defect|quality|test|issue/i,
    'architect-owl': /hoot|wise|architecture|design|pattern|structure/i,
    'product-pig': /oink|snort|requirement|feature|user|story|business/i,
    'senior-cat': /meow|purr|code|practice|clean|solid|refactor/i
  },

  challengeConfigs: [
    { language: 'javascript', framework: 'vue', category: 'refactoring', difficulty: 'beginner' },
    { language: 'javascript', framework: 'react', category: 'debugging', difficulty: 'intermediate' },
    { language: 'python', category: 'optimization', difficulty: 'advanced' },
    { language: 'java', category: 'design-patterns', difficulty: 'intermediate' },
    { language: 'typescript', framework: 'angular', category: 'testing', difficulty: 'advanced' }
  ]
};

// Mock API Responses
export const MOCK_API_RESPONSES: MockApiResponses = {
  challengeGeneration: {
    id: 'challenge-123',
    kaiju: {
      id: 'hydra-bug-1',
      name: 'HydraBug',
      type: 'hydra-bug',
      description: 'A monster that multiplies bugs when you try to fix them',
      avatar: '/images/kaiju/hydra-bug.png',
      flavorText: 'Cut off one bug, two more shall take its place!',
      specialAbilities: ['Bug Multiplication', 'Error Cascade'],
      weaknesses: ['Proper Testing', 'Code Review']
    },
    initialCode: TEST_DATA.buggyCode.javascript,
    requirements: [
      'Fix the off-by-one error in the loop',
      'Add proper error handling',
      'Implement unit tests',
      'Optimize for performance'
    ],
    testCases: [
      {
        input: '[1, 2, 3, 4, 5]',
        expected: '15',
        description: 'Should sum array correctly'
      }
    ],
    hints: [
      'Check your loop boundaries',
      'Consider edge cases like empty arrays',
      'Think about what happens with invalid input'
    ]
  },

  codeEvaluation: {
    scores: {
      readability: 85,
      quality: 78,
      defects: 92,
      requirements: 88,
      overall: 86
    },
    feedback: [
      {
        category: 'readability',
        message: 'Good use of descriptive variable names',
        severity: 'info',
        line: null
      },
      {
        category: 'quality',
        message: 'Consider extracting this logic into a separate function',
        severity: 'warning',
        line: 15
      },
      {
        category: 'defects',
        message: 'Potential null pointer exception',
        severity: 'error',
        line: 23
      }
    ],
    achievements: [
      {
        id: 'bug-squasher',
        name: 'Bug Squasher',
        description: 'Fixed 5 bugs in a single challenge',
        icon: '/images/achievements/bug-squasher.png'
      }
    ]
  },

  aiChat: {
    id: 'msg-456',
    role: 'assistant',
    content: 'I can help you refactor this code. The main issues I see are: 1) The loop boundary is incorrect, 2) There\'s no null checking, 3) The function lacks error handling. Here\'s how you can improve it...',
    timestamp: new Date().toISOString(),
    context: {
      challengeId: 'challenge-123',
      codeSnapshot: 'function buggyCalculation...'
    }
  },

  teamMemberDialog: {
    teamMember: {
      id: 'qa-pufferfish',
      role: 'quality-assurance',
      avatar: 'pufferfish',
      name: 'Puffy the QA Pufferfish'
    },
    message: '*puff puff* I see some BUGS in your code! *bubble bubble* The loop boundary looks FISHY to me. *puff* You should add some TESTS to catch these issues before they multiply! *bubble puff*',
    animalSounds: ['*puff puff*', '*bubble bubble*', '*puff*', '*bubble puff*'],
    keyTerms: ['BUGS', 'FISHY', 'TESTS'],
    advice: 'Add comprehensive unit tests and boundary condition checks',
    mood: 'concerned'
  },

  userProgress: {
    userId: 'user-789',
    completedChallenges: ['challenge-123', 'challenge-124'],
    achievements: [
      {
        id: 'first-victory',
        name: 'First Victory',
        description: 'Completed your first challenge',
        unlockedAt: new Date().toISOString()
      }
    ],
    stats: {
      totalChallenges: 2,
      averageScore: 83.5,
      kaijuDefeated: {
        'hydra-bug': 1,
        'complexasaur': 1,
        'duplicatron': 0,
        'spaghettizilla': 0,
        'memoryleak-odactyl': 0
      },
      improvementTrend: [75, 82, 85, 88]
    },
    unlockedDifficulties: ['beginner', 'intermediate'],
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date().toISOString()
  }
};

// Test Selectors (data-testid attributes)
export const TEST_SELECTORS = {
  // Main layout
  mainContainer: '[data-testid="main-container"]',
  mobileNav: '[data-testid="mobile-nav"]',
  
  // Challenge selector
  languageSelect: '[data-testid="language-select"]',
  frameworkSelect: '[data-testid="framework-select"]',
  categorySelect: '[data-testid="category-select"]',
  difficultySelect: '[data-testid="difficulty-select"]',
  generateChallengeBtn: '[data-testid="generate-challenge-btn"]',
  
  // Challenge display
  challengeContainer: '[data-testid="challenge-container"]',
  kaijuDisplay: '[data-testid="kaiju-display"]',
  codeEditor: '[data-testid="code-editor"]',
  requirementsList: '[data-testid="requirements-list"]',
  
  // AI chat
  aiChatToggle: '[data-testid="ai-chat-toggle"]',
  aiChatInterface: '[data-testid="ai-chat-interface"]',
  aiChatInput: '[data-testid="ai-chat-input"]',
  aiChatSend: '[data-testid="ai-chat-send"]',
  aiMessage: '[data-testid="ai-message"]',
  aiErrorMessage: '[data-testid="ai-error-message"]',
  aiRetryBtn: '[data-testid="ai-retry-btn"]',
  
  // Zoom-a-Friend
  zoomFriendToggle: '[data-testid="zoom-friend-toggle"]',
  zoomFriendPanel: '[data-testid="zoom-friend-panel"]',
  teamMembers: '[data-testid="team-members"]',
  teamMemberQA: '[data-testid="team-member-qa-pufferfish"]',
  teamMemberArchitect: '[data-testid="team-member-architect-owl"]',
  teamMemberProduct: '[data-testid="team-member-product-pig"]',
  teamMemberSenior: '[data-testid="team-member-senior-cat"]',
  teamDialog: '[data-testid="team-dialog"]',
  dialogClose: '[data-testid="dialog-close"]',
  
  // Evaluation
  submitSolutionBtn: '[data-testid="submit-solution-btn"]',
  evaluationResults: '[data-testid="evaluation-results"]',
  readabilityScore: '[data-testid="readability-score"]',
  qualityScore: '[data-testid="quality-score"]',
  defectsScore: '[data-testid="defects-score"]',
  requirementsScore: '[data-testid="requirements-score"]',
  overallScore: '[data-testid="overall-score"]',
  evaluationFeedback: '[data-testid="evaluation-feedback"]',
  evaluationError: '[data-testid="evaluation-error"]',
  evaluationRetryBtn: '[data-testid="evaluation-retry-btn"]',
  
  // Progress tracking
  progressTab: '[data-testid="progress-tab"]',
  progressProfile: '[data-testid="progress-profile"]',
  challengesCompleted: '[data-testid="challenges-completed"]',
  averageScore: '[data-testid="average-score"]',
  achievementBadge: '[data-testid="achievement-badge"]',
  
  // Error handling
  errorMessage: '[data-testid="error-message"]',
  offlineIndicator: '[data-testid="offline-indicator"]',
  
  // Mobile specific
  editorZoomControls: '[data-testid="editor-zoom-controls"]',
  newChallengeBtn: '[data-testid="new-challenge-btn"]'
};

// Utility functions for test configuration
export function getEnvironment(): TestEnvironment {
  const env = process.env.TEST_ENV || 'local';
  return TEST_ENVIRONMENTS[env] || TEST_ENVIRONMENTS.local;
}

export function getBrowserConfig(browserName: string): BrowserConfig | undefined {
  return BROWSER_CONFIGS.find(config => 
    config.name.toLowerCase() === browserName.toLowerCase() ||
    config.project.toLowerCase() === browserName.toLowerCase()
  );
}

export function getDeviceConfig(deviceName: string): DeviceConfig | undefined {
  return DEVICE_CONFIGS.find(config => 
    config.name.toLowerCase() === deviceName.toLowerCase()
  );
}

export function getPerformanceThreshold(metric: keyof PerformanceThresholds): number {
  return PERFORMANCE_THRESHOLDS[metric];
}

export function getTestData(): TestData {
  return TEST_DATA;
}

export function getMockResponse(type: keyof MockApiResponses): any {
  return MOCK_API_RESPONSES[type];
}

export function getSelector(name: keyof typeof TEST_SELECTORS): string {
  return TEST_SELECTORS[name];
}