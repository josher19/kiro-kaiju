/**
 * Complexasaur Monster
 * 
 * Represents overly complex code with excessive nesting and unclear logic.
 * This monster creates code that is difficult to understand and maintain.
 */

import { BaseKaijuMonster, type CodeGenerationOptions, type GeneratedCode } from '../kaijuEngine';
import { KaijuType, type CodeAntiPattern, type DifficultyModifier } from '@/types/kaiju';
import { ProgrammingLanguage } from '@/types/challenge';

export class Complexasaur extends BaseKaijuMonster {
  id = 'complexasaur-001';
  name = 'Complexasaur';
  type = KaijuType.COMPLEXASAUR;
  description = 'A massive beast that creates overly complex code with excessive nesting and convoluted logic paths.';
  avatar = '🦕';
  flavorText = 'Why use simple logic when you can nest it 10 levels deep?';

  specialAbilities = [
    'Nested Complexity: Creates deeply nested conditional structures',
    'Logic Obfuscation: Makes simple operations unnecessarily complex',
    'Cognitive Overload: Generates code that exceeds human comprehension limits'
  ];

  weaknesses = [
    'Simplification: Breaking complex logic into smaller, focused functions',
    'Early Returns: Using guard clauses to reduce nesting',
    'Clear Naming: Descriptive variable and function names reveal intent'
  ];

  codePatterns: CodeAntiPattern[] = [
    {
      id: 'excessive-nesting',
      name: 'Excessive Nesting',
      description: 'Deeply nested conditional statements and loops',
      severity: 'high',
      examples: [
        'If-else chains nested 5+ levels deep',
        'Nested loops with complex break conditions',
        'Try-catch blocks within multiple nested structures'
      ]
    },
    {
      id: 'complex-conditionals',
      name: 'Complex Boolean Logic',
      description: 'Overly complex conditional expressions',
      severity: 'medium',
      examples: [
        'Boolean expressions with 5+ conditions',
        'Mixed AND/OR logic without parentheses',
        'Negated complex conditions'
      ]
    },
    {
      id: 'monolithic-functions',
      name: 'Monolithic Functions',
      description: 'Functions that try to do too many things',
      severity: 'high',
      examples: [
        'Functions with 50+ lines of code',
        'Functions with multiple responsibilities',
        'Functions with 10+ parameters'
      ]
    }
  ];

  difficultyModifiers: DifficultyModifier[] = [
    {
      factor: 1.0,
      description: 'Increases nesting depth and logical complexity',
      affectedMetrics: ['nesting_depth', 'cyclomatic_complexity', 'function_length']
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
    const baseCode = `// User Registration System - Complexasaur Edition
function processUserRegistration(userData, systemConfig, validationRules, permissions) {
    if (userData) {
        if (userData.email) {
            if (userData.email.includes('@')) {
                if (userData.email.split('@').length === 2) {
                    if (userData.email.split('@')[1].includes('.')) {
                        if (userData.password) {
                            if (userData.password.length >= 8) {
                                if (userData.password.match(/[A-Z]/)) {
                                    if (userData.password.match(/[a-z]/)) {
                                        if (userData.password.match(/[0-9]/)) {
                                            if (userData.password.match(/[!@#$%^&*]/)) {
                                                if (userData.confirmPassword) {
                                                    if (userData.password === userData.confirmPassword) {
                                                        if (userData.age) {
                                                            if (userData.age >= 13) {
                                                                if (userData.age <= 120) {
                                                                    if (userData.country) {
                                                                        if (systemConfig.allowedCountries.includes(userData.country)) {
                                                                            if (userData.termsAccepted) {
                                                                                if (userData.termsAccepted === true) {
                                                                                    if (permissions) {
                                                                                        if (permissions.canCreateUser) {
                                                                                            if (validationRules) {
                                                                                                if (validationRules.strictMode) {
                                                                                                    if (userData.phoneNumber) {
                                                                                                        if (userData.phoneNumber.match(/^\\+?[1-9]\\d{1,14}$/)) {
                                                                                                            // Finally, create the user
                                                                                                            return createUser(userData);
                                                                                                        } else {
                                                                                                            return { error: 'Invalid phone number format' };
                                                                                                        }
                                                                                                    } else {
                                                                                                        return { error: 'Phone number required in strict mode' };
                                                                                                    }
                                                                                                } else {
                                                                                                    return createUser(userData);
                                                                                                }
                                                                                            } else {
                                                                                                return { error: 'Validation rules not provided' };
                                                                                            }
                                                                                        } else {
                                                                                            return { error: 'Insufficient permissions to create user' };
                                                                                        }
                                                                                    } else {
                                                                                        return { error: 'Permissions not provided' };
                                                                                    }
                                                                                } else {
                                                                                    return { error: 'Terms must be explicitly accepted' };
                                                                                }
                                                                            } else {
                                                                                return { error: 'Terms and conditions must be accepted' };
                                                                            }
                                                                        } else {
                                                                            return { error: 'Country not allowed for registration' };
                                                                        }
                                                                    } else {
                                                                        return { error: 'Country is required' };
                                                                    }
                                                                } else {
                                                                    return { error: 'Age must be 120 or less' };
                                                                }
                                                            } else {
                                                                return { error: 'Must be at least 13 years old' };
                                                            }
                                                        } else {
                                                            return { error: 'Age is required' };
                                                        }
                                                    } else {
                                                        return { error: 'Passwords do not match' };
                                                    }
                                                } else {
                                                    return { error: 'Password confirmation is required' };
                                                }
                                            } else {
                                                return { error: 'Password must contain at least one special character' };
                                            }
                                        } else {
                                            return { error: 'Password must contain at least one number' };
                                        }
                                    } else {
                                        return { error: 'Password must contain at least one lowercase letter' };
                                    }
                                } else {
                                    return { error: 'Password must contain at least one uppercase letter' };
                                }
                            } else {
                                return { error: 'Password must be at least 8 characters long' };
                            }
                        } else {
                            return { error: 'Password is required' };
                        }
                    } else {
                        return { error: 'Invalid email domain format' };
                    }
                } else {
                    return { error: 'Email must contain exactly one @ symbol' };
                }
            } else {
                return { error: 'Email must contain @ symbol' };
            }
        } else {
            return { error: 'Email is required' };
        }
    } else {
        return { error: 'User data is required' };
    }
}

function createUser(userData) {
    // Simulate user creation
    return { success: true, userId: Math.random().toString(36).substr(2, 9) };
}`;

    const complexCode = difficulty > 2 ? `

// Additional complexity for higher difficulty
function validateUserPermissions(user, action, resource, context, metadata, auditLog) {
    if (user && user.roles && user.roles.length > 0) {
        for (let i = 0; i < user.roles.length; i++) {
            if (user.roles[i].permissions) {
                for (let j = 0; j < user.roles[i].permissions.length; j++) {
                    if (user.roles[i].permissions[j].action === action) {
                        if (user.roles[i].permissions[j].resource === resource || user.roles[i].permissions[j].resource === '*') {
                            if (context && context.timeRestrictions) {
                                if (context.timeRestrictions.startTime && context.timeRestrictions.endTime) {
                                    const currentTime = new Date().getHours();
                                    if (currentTime >= context.timeRestrictions.startTime && currentTime <= context.timeRestrictions.endTime) {
                                        if (context.locationRestrictions) {
                                            if (context.locationRestrictions.allowedCountries) {
                                                if (context.locationRestrictions.allowedCountries.includes(user.country)) {
                                                    if (metadata && metadata.riskLevel) {
                                                        if (metadata.riskLevel === 'low' || (metadata.riskLevel === 'medium' && user.roles[i].level >= 2) || (metadata.riskLevel === 'high' && user.roles[i].level >= 3)) {
                                                            if (auditLog) {
                                                                auditLog.push({
                                                                    userId: user.id,
                                                                    action: action,
                                                                    resource: resource,
                                                                    timestamp: new Date(),
                                                                    result: 'allowed'
                                                                });
                                                            }
                                                            return true;
                                                        } else {
                                                            return false;
                                                        }
                                                    } else {
                                                        return true;
                                                    }
                                                } else {
                                                    return false;
                                                }
                                            } else {
                                                return true;
                                            }
                                        } else {
                                            return true;
                                        }
                                    } else {
                                        return false;
                                    }
                                } else {
                                    return true;
                                }
                            } else {
                                return true;
                            }
                        }
                    }
                }
            }
        }
    }
    return false;
}` : '';

    return {
      code: baseCode + complexCode,
      problems: [
        'Excessive nesting makes code difficult to read and maintain',
        'Single function handles too many responsibilities',
        'Complex conditional logic is hard to test',
        'Error handling is scattered throughout nested conditions',
        'Function has too many parameters and dependencies',
        ...(difficulty > 2 ? [
          'Permission validation logic is overly complex',
          'Multiple nested loops make performance unpredictable',
          'Audit logging is tightly coupled with business logic'
        ] : [])
      ],
      hints: [
        'Use early returns to reduce nesting levels',
        'Extract validation logic into separate functions',
        'Create a validation chain or pipeline pattern',
        'Use guard clauses for error conditions',
        'Consider using a validation library or framework',
        ...(difficulty > 2 ? [
          'Implement a role-based access control (RBAC) system',
          'Separate audit logging from permission checking',
          'Use strategy pattern for different validation rules'
        ] : [])
      ],
      requirements: [
        'Reduce nesting depth to maximum 3 levels',
        'Split the monolithic function into smaller, focused functions',
        'Implement clear error handling strategy',
        'Add comprehensive input validation',
        'Ensure all validation rules are testable independently'
      ]
    };
  }

  private generatePythonCode(difficulty: number): GeneratedCode {
    const baseCode = `# User Registration System - Complexasaur Edition
def process_user_registration(user_data, system_config, validation_rules, permissions):
    if user_data:
        if user_data.get('email'):
            if '@' in user_data['email']:
                if len(user_data['email'].split('@')) == 2:
                    if '.' in user_data['email'].split('@')[1]:
                        if user_data.get('password'):
                            if len(user_data['password']) >= 8:
                                if any(c.isupper() for c in user_data['password']):
                                    if any(c.islower() for c in user_data['password']):
                                        if any(c.isdigit() for c in user_data['password']):
                                            if any(c in '!@#$%^&*' for c in user_data['password']):
                                                if user_data.get('confirm_password'):
                                                    if user_data['password'] == user_data['confirm_password']:
                                                        if user_data.get('age'):
                                                            if user_data['age'] >= 13:
                                                                if user_data['age'] <= 120:
                                                                    if user_data.get('country'):
                                                                        if user_data['country'] in system_config['allowed_countries']:
                                                                            if user_data.get('terms_accepted'):
                                                                                if user_data['terms_accepted'] is True:
                                                                                    if permissions:
                                                                                        if permissions.get('can_create_user'):
                                                                                            if validation_rules:
                                                                                                if validation_rules.get('strict_mode'):
                                                                                                    if user_data.get('phone_number'):
                                                                                                        import re
                                                                                                        if re.match(r'^\\+?[1-9]\\d{1,14}$', user_data['phone_number']):
                                                                                                            return create_user(user_data)
                                                                                                        else:
                                                                                                            return {'error': 'Invalid phone number format'}
                                                                                                    else:
                                                                                                        return {'error': 'Phone number required in strict mode'}
                                                                                                else:
                                                                                                    return create_user(user_data)
                                                                                            else:
                                                                                                return {'error': 'Validation rules not provided'}
                                                                                        else:
                                                                                            return {'error': 'Insufficient permissions'}
                                                                                    else:
                                                                                        return {'error': 'Permissions not provided'}
                                                                                else:
                                                                                    return {'error': 'Terms must be explicitly accepted'}
                                                                            else:
                                                                                return {'error': 'Terms must be accepted'}
                                                                        else:
                                                                            return {'error': 'Country not allowed'}
                                                                    else:
                                                                        return {'error': 'Country is required'}
                                                                else:
                                                                    return {'error': 'Age must be 120 or less'}
                                                            else:
                                                                return {'error': 'Must be at least 13 years old'}
                                                        else:
                                                            return {'error': 'Age is required'}
                                                    else:
                                                        return {'error': 'Passwords do not match'}
                                                else:
                                                    return {'error': 'Password confirmation required'}
                                            else:
                                                return {'error': 'Password must contain special character'}
                                        else:
                                            return {'error': 'Password must contain number'}
                                    else:
                                        return {'error': 'Password must contain lowercase letter'}
                                else:
                                    return {'error': 'Password must contain uppercase letter'}
                            else:
                                return {'error': 'Password must be at least 8 characters'}
                        else:
                            return {'error': 'Password is required'}
                    else:
                        return {'error': 'Invalid email domain format'}
                else:
                    return {'error': 'Email must contain exactly one @ symbol'}
            else:
                return {'error': 'Email must contain @ symbol'}
        else:
            return {'error': 'Email is required'}
    else:
        return {'error': 'User data is required'}

def create_user(user_data):
    import random
    import string
    user_id = ''.join(random.choices(string.ascii_letters + string.digits, k=9))
    return {'success': True, 'user_id': user_id}`;

    return {
      code: baseCode,
      problems: [
        'Excessive nesting creates deeply indented code',
        'Single function handles all validation logic',
        'Complex nested conditions are hard to test',
        'Error messages are scattered throughout the function',
        'Function violates single responsibility principle'
      ],
      hints: [
        'Use early returns to reduce nesting',
        'Extract validation into separate functions',
        'Create a validation pipeline',
        'Use guard clauses for error conditions',
        'Consider using decorators for validation'
      ],
      requirements: [
        'Reduce nesting depth to maximum 3 levels',
        'Split validation logic into focused functions',
        'Implement clear error handling',
        'Make validation rules easily testable',
        'Improve code readability and maintainability'
      ]
    };
  }
}