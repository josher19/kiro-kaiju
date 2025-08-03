/**
 * HydraBug Monster
 * 
 * Represents bugs that multiply when fixed incorrectly.
 * Fixing one bug introduces two new bugs if not handled carefully.
 */

import { BaseKaijuMonster, type CodeGenerationOptions, type GeneratedCode } from '../kaijuEngine';
import { KaijuType, type CodeAntiPattern, type DifficultyModifier } from '@/types/kaiju';
import { ProgrammingLanguage } from '@/types/challenge';

export class HydraBug extends BaseKaijuMonster {
  id = 'hydra-bug-001';
  name = 'HydraBug';
  type = KaijuType.HYDRA_BUG;
  description = 'A monstrous bug that multiplies when fixed incorrectly. Each hasty fix spawns two new problems.';
  avatar = '🐲';
  flavorText = 'Cut off one bug, two more shall take its place!';

  specialAbilities = [
    'Bug Multiplication: Fixing one bug incorrectly creates two new bugs',
    'Hidden Dependencies: Bugs are interconnected in unexpected ways',
    'Regression Spawning: Changes in one area break seemingly unrelated functionality'
  ];

  weaknesses = [
    'Systematic Testing: Comprehensive test coverage prevents bug multiplication',
    'Root Cause Analysis: Understanding the underlying issue prevents new bugs',
    'Incremental Fixes: Small, careful changes limit the blast radius'
  ];

  codePatterns: CodeAntiPattern[] = [
    {
      id: 'interconnected-bugs',
      name: 'Interconnected Bug Network',
      description: 'Multiple bugs that are connected through shared state or dependencies',
      severity: 'high',
      examples: [
        'Global variables modified by multiple functions',
        'Shared mutable objects passed between components',
        'Race conditions in asynchronous code'
      ]
    },
    {
      id: 'hidden-side-effects',
      name: 'Hidden Side Effects',
      description: 'Functions that modify state in unexpected ways',
      severity: 'medium',
      examples: [
        'Functions that modify their input parameters',
        'Methods that change global state as a side effect',
        'Event handlers that trigger other events'
      ]
    },
    {
      id: 'fragile-conditionals',
      name: 'Fragile Conditional Logic',
      description: 'Complex conditional statements that break easily when modified',
      severity: 'medium',
      examples: [
        'Deeply nested if-else chains',
        'Boolean logic with multiple negations',
        'Conditions that depend on specific ordering'
      ]
    }
  ];

  difficultyModifiers: DifficultyModifier[] = [
    {
      factor: 0.5,
      description: 'Increases bug interconnectedness with difficulty',
      affectedMetrics: ['pattern_complexity', 'bug_count', 'dependency_depth']
    }
  ];

  generateCode(options: CodeGenerationOptions): GeneratedCode {
    const { language, difficulty } = options;
    
    switch (language) {
      case ProgrammingLanguage.JAVASCRIPT:
      case ProgrammingLanguage.TYPESCRIPT:
        return this.generateJavaScriptCode(difficulty);
      case ProgrammingLanguage.PYTHON:
        return this.generatePythonCode(difficulty);
      default:
        return this.generateJavaScriptCode(difficulty);
    }
  }

  private generateJavaScriptCode(difficulty: number): GeneratedCode {
    const baseCode = `// Shopping Cart System with HydraBug infestation
let cart = [];
let totalPrice = 0;
let discountApplied = false;

function addItem(item) {
    cart.push(item);
    totalPrice += item.price;
    
    // Bug 1: Discount logic modifies global state unexpectedly
    if (cart.length > 2 && !discountApplied) {
        totalPrice = totalPrice * 0.9;
        discountApplied = true;
        // This creates a hidden dependency - removing items won't recalculate correctly
    }
    
    updateDisplay();
}

function removeItem(itemId) {
    // Bug 2: Doesn't properly handle discount recalculation
    for (let i = 0; i < cart.length; i++) {
        if (cart[i].id === itemId) {
            totalPrice -= cart[i].price;
            cart.splice(i, 1);
            break;
        }
    }
    
    // Bug 3: Display update can trigger other bugs
    updateDisplay();
}

function updateDisplay() {
    // Bug 4: Modifies cart during display update
    cart.forEach(item => {
        if (!item.displayName) {
            item.displayName = item.name.toUpperCase();
        }
    });
    
    console.log(\`Cart: \${cart.length} items, Total: $\${totalPrice}\`);
    
    // Bug 5: Side effect that affects other functions
    if (totalPrice < 0) {
        totalPrice = 0;
        cart = []; // This will break any ongoing operations
    }
}

function applyPromoCode(code) {
    // Bug 6: Doesn't check if discount already applied
    if (code === 'SAVE10') {
        totalPrice = totalPrice * 0.9;
        discountApplied = true;
    }
}`;

    const complexCode = difficulty > 2 ? `
// Additional complexity for higher difficulty
let promotionHistory = [];
let userPreferences = { autoApplyDiscounts: true };

function processPromotion(promotion) {
    promotionHistory.push(promotion);
    
    // Bug 7: Modifies cart based on history
    if (promotionHistory.length > 3) {
        cart.forEach(item => {
            item.price = item.price * 0.95; // Permanent price modification!
        });
    }
    
    // Bug 8: Recursive discount application
    if (userPreferences.autoApplyDiscounts && totalPrice > 100) {
        applyPromoCode('SAVE10');
    }
}` : '';

    return {
      code: baseCode + complexCode,
      problems: [
        'Discount logic creates hidden state dependencies',
        'Removing items doesn\'t recalculate discounts properly',
        'Display update function modifies cart data',
        'Multiple functions can apply discounts simultaneously',
        'Global state modifications cause race conditions',
        ...(difficulty > 2 ? [
          'Promotion history affects item prices permanently',
          'Auto-discount feature can create infinite loops',
          'Price modifications are not reversible'
        ] : [])
      ],
      hints: [
        'Consider separating calculation logic from display logic',
        'Track discount state more explicitly',
        'Implement proper state management for cart operations',
        'Add validation to prevent negative totals',
        ...(difficulty > 2 ? [
          'Implement immutable data structures',
          'Add safeguards against recursive discount application'
        ] : [])
      ],
      requirements: [
        'Fix the discount calculation to work correctly when items are added/removed',
        'Ensure display updates don\'t modify cart data',
        'Prevent multiple discount applications',
        'Handle edge cases like negative totals gracefully',
        'Add proper validation for all cart operations'
      ]
    };
  }

  private generatePythonCode(difficulty: number): GeneratedCode {
    const baseCode = `# Shopping Cart System with HydraBug infestation
cart = []
total_price = 0
discount_applied = False

def add_item(item):
    global total_price, discount_applied
    cart.append(item)
    total_price += item['price']
    
    # Bug 1: Discount logic modifies global state unexpectedly
    if len(cart) > 2 and not discount_applied:
        total_price = total_price * 0.9
        discount_applied = True
        # This creates a hidden dependency
    
    update_display()

def remove_item(item_id):
    global total_price
    # Bug 2: Doesn't properly handle discount recalculation
    for i, item in enumerate(cart):
        if item['id'] == item_id:
            total_price -= item['price']
            cart.pop(i)
            break
    
    # Bug 3: Display update can trigger other bugs
    update_display()

def update_display():
    global total_price, cart
    # Bug 4: Modifies cart during display update
    for item in cart:
        if 'display_name' not in item:
            item['display_name'] = item['name'].upper()
    
    print(f"Cart: {len(cart)} items, Total: {total_price}")
    
    # Bug 5: Side effect that affects other functions
    if total_price < 0:
        total_price = 0
        cart.clear()  # This will break any ongoing operations

def apply_promo_code(code):
    global total_price, discount_applied
    # Bug 6: Doesn't check if discount already applied
    if code == 'SAVE10':
        total_price = total_price * 0.9
        discount_applied = True`;

    return {
      code: baseCode,
      problems: [
        'Global state modifications cause unexpected side effects',
        'Discount calculation doesn\'t handle item removal correctly',
        'Display function modifies cart data',
        'Multiple discount applications possible',
        'Cart clearing breaks ongoing operations'
      ],
      hints: [
        'Use classes to encapsulate state',
        'Separate calculation from display logic',
        'Implement proper discount tracking',
        'Add validation for edge cases'
      ],
      requirements: [
        'Fix discount calculation for add/remove operations',
        'Prevent display function from modifying cart',
        'Ensure only one discount can be applied',
        'Handle negative totals without clearing cart'
      ]
    };
  }
}