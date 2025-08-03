/**
 * Spaghettizilla Monster
 * 
 * Represents tangled dependencies and unclear data flow.
 * This monster creates code with complex interdependencies that are hard to follow.
 */

import { BaseKaijuMonster, type CodeGenerationOptions, type GeneratedCode } from '../kaijuEngine';
import { KaijuType, type CodeAntiPattern, type DifficultyModifier } from '@/types/kaiju';
import { ProgrammingLanguage } from '@/types/challenge';

export class Spaghettizilla extends BaseKaijuMonster {
  id = 'spaghettizilla-001';
  name = 'Spaghettizilla';
  type = KaijuType.SPAGHETTIZILLA;
  description = 'A massive tangle of interdependent code with unclear data flow and circular dependencies.';
  avatar = '🍝';
  flavorText = 'Everything is connected to everything else in the most confusing way possible!';

  specialAbilities = [
    'Dependency Tangling: Creates circular and unclear dependencies between components',
    'Data Flow Obfuscation: Makes it impossible to track how data moves through the system',
    'Coupling Maximization: Ensures every component depends on every other component'
  ];

  weaknesses = [
    'Separation of Concerns: Clear boundaries between different responsibilities',
    'Dependency Injection: Explicit and manageable dependencies',
    'Single Direction Data Flow: Predictable data movement patterns'
  ];

  codePatterns: CodeAntiPattern[] = [
    {
      id: 'circular-dependencies',
      name: 'Circular Dependencies',
      description: 'Components that depend on each other in circular patterns',
      severity: 'high',
      examples: [
        'Module A imports Module B which imports Module A',
        'Classes that reference each other directly',
        'Functions that call each other recursively without clear termination'
      ]
    },
    {
      id: 'global-state-mutation',
      name: 'Global State Mutations',
      description: 'Multiple components modifying shared global state unpredictably',
      severity: 'high',
      examples: [
        'Global variables modified by multiple functions',
        'Shared objects mutated from different modules',
        'Event handlers that modify unrelated state'
      ]
    },
    {
      id: 'unclear-data-flow',
      name: 'Unclear Data Flow',
      description: 'Data that flows through the system in unpredictable ways',
      severity: 'medium',
      examples: [
        'Data passed through multiple intermediate functions',
        'Side effects that modify data during processing',
        'Implicit data transformations'
      ]
    }
  ];

  difficultyModifiers: DifficultyModifier[] = [
    {
      factor: 1.2,
      description: 'Increases dependency complexity and coupling',
      affectedMetrics: ['coupling_degree', 'dependency_depth', 'data_flow_complexity']
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
    const baseCode = `// Task Management System - Spaghettizilla Edition

// Global state that everyone modifies
let globalTasks = [];
let globalUsers = [];
let globalProjects = [];
let currentUser = null;
let systemSettings = {};
let notificationQueue = [];

// User management that depends on tasks
class UserManager {
    constructor() {
        this.taskManager = new TaskManager();
        this.projectManager = new ProjectManager();
    }
    
    createUser(userData) {
        const user = {
            id: Math.random().toString(36).substr(2, 9),
            ...userData,
            tasks: [],
            projects: []
        };
        
        globalUsers.push(user);
        currentUser = user;
        
        // Circular dependency: UserManager modifies tasks
        this.taskManager.assignDefaultTasks(user);
        this.projectManager.createDefaultProject(user);
        
        // Side effect: modifies global notification queue
        notificationQueue.push({
            type: 'user_created',
            userId: user.id,
            timestamp: new Date()
        });
        
        // More side effects
        this.updateSystemSettings(user);
        
        return user;
    }
    
    updateSystemSettings(user) {
        // Modifies global state based on user
        systemSettings.lastUserCreated = user.id;
        systemSettings.totalUsers = globalUsers.length;
        
        // Calls project manager which calls back to user manager
        this.projectManager.updateProjectStats();
    }
    
    deleteUser(userId) {
        // Complex deletion with side effects everywhere
        const userIndex = globalUsers.findIndex(u => u.id === userId);
        if (userIndex !== -1) {
            const user = globalUsers[userIndex];
            
            // Delete user's tasks (modifies global tasks)
            this.taskManager.deleteUserTasks(userId);
            
            // Delete user's projects (which affects other users)
            this.projectManager.deleteUserProjects(userId);
            
            globalUsers.splice(userIndex, 1);
            
            // Update current user if it was deleted
            if (currentUser && currentUser.id === userId) {
                currentUser = globalUsers.length > 0 ? globalUsers[0] : null;
            }
        }
    }
}

// Task management that depends on users and projects
class TaskManager {
    constructor() {
        this.userManager = null; // Will be set later, creating circular dependency
        this.projectManager = new ProjectManager();
    }
    
    setUserManager(userManager) {
        this.userManager = userManager;
    }
    
    createTask(taskData) {
        const task = {
            id: Math.random().toString(36).substr(2, 9),
            ...taskData,
            createdAt: new Date(),
            assignedUsers: []
        };
        
        globalTasks.push(task);
        
        // Modifies user data
        if (currentUser) {
            currentUser.tasks.push(task.id);
            
            // Side effect: updates project if task belongs to one
            if (task.projectId) {
                this.projectManager.addTaskToProject(task.projectId, task.id);
            }
        }
        
        // More global state modification
        this.updateTaskStats();
        
        return task;
    }
    
    assignDefaultTasks(user) {
        // Creates tasks that modify global state
        const defaultTasks = [
            { title: 'Welcome Task', description: 'Get started', priority: 'low' },
            { title: 'Setup Profile', description: 'Complete your profile', priority: 'medium' }
        ];
        
        defaultTasks.forEach(taskData => {
            const task = this.createTask(taskData);
            // Circular: modifies user which was passed from UserManager
            user.tasks.push(task.id);
        });
    }
    
    deleteUserTasks(userId) {
        // Modifies global tasks array
        globalTasks = globalTasks.filter(task => {
            if (task.assignedUsers.includes(userId)) {
                // Side effect: notify project manager
                if (task.projectId) {
                    this.projectManager.removeTaskFromProject(task.projectId, task.id);
                }
                return false;
            }
            return true;
        });
        
        this.updateTaskStats();
    }
    
    updateTaskStats() {
        // Modifies global system settings
        systemSettings.totalTasks = globalTasks.length;
        systemSettings.completedTasks = globalTasks.filter(t => t.completed).length;
        
        // Triggers notification
        notificationQueue.push({
            type: 'stats_updated',
            timestamp: new Date(),
            stats: { ...systemSettings }
        });
    }
}

// Project management that depends on both users and tasks
class ProjectManager {
    constructor() {
        this.taskManager = null; // Circular dependency
        this.userManager = null; // Circular dependency
    }
    
    setManagers(taskManager, userManager) {
        this.taskManager = taskManager;
        this.userManager = userManager;
    }
    
    createDefaultProject(user) {
        const project = {
            id: Math.random().toString(36).substr(2, 9),
            name: \`\${user.name}'s Default Project\`,
            ownerId: user.id,
            members: [user.id],
            tasks: []
        };
        
        globalProjects.push(project);
        
        // Modifies user data
        user.projects.push(project.id);
        
        // Creates tasks through task manager
        if (this.taskManager) {
            const welcomeTask = this.taskManager.createTask({
                title: 'Project Setup',
                projectId: project.id,
                assignedUsers: [user.id]
            });
        }
        
        this.updateProjectStats();
        
        return project;
    }
    
    addTaskToProject(projectId, taskId) {
        const project = globalProjects.find(p => p.id === projectId);
        if (project) {
            project.tasks.push(taskId);
            
            // Side effect: update all project members
            project.members.forEach(memberId => {
                const member = globalUsers.find(u => u.id === memberId);
                if (member && !member.tasks.includes(taskId)) {
                    member.tasks.push(taskId);
                }
            });
        }
    }
    
    updateProjectStats() {
        // Modifies global settings
        systemSettings.totalProjects = globalProjects.length;
        
        // Calls back to user manager
        if (this.userManager) {
            systemSettings.averageProjectsPerUser = globalProjects.length / globalUsers.length;
        }
    }
    
    deleteUserProjects(userId) {
        // Complex deletion with cascading effects
        const userProjects = globalProjects.filter(p => p.ownerId === userId);
        
        userProjects.forEach(project => {
            // Delete all tasks in the project
            project.tasks.forEach(taskId => {
                const taskIndex = globalTasks.findIndex(t => t.id === taskId);
                if (taskIndex !== -1) {
                    globalTasks.splice(taskIndex, 1);
                }
            });
            
            // Remove project from all members
            project.members.forEach(memberId => {
                const member = globalUsers.find(u => u.id === memberId);
                if (member) {
                    member.projects = member.projects.filter(pid => pid !== project.id);
                }
            });
        });
        
        // Remove projects
        globalProjects = globalProjects.filter(p => p.ownerId !== userId);
        
        this.updateProjectStats();
    }
}

// Initialize with circular dependencies
const userManager = new UserManager();
const taskManager = new TaskManager();
const projectManager = new ProjectManager();

// Set up circular references
taskManager.setUserManager(userManager);
projectManager.setManagers(taskManager, userManager);
userManager.taskManager = taskManager;
userManager.projectManager = projectManager;`;

    const complexCode = difficulty > 2 ? `

// Additional complexity for higher difficulty
class NotificationManager {
    constructor() {
        this.subscribers = [];
        this.userManager = userManager; // Global dependency
        this.taskManager = taskManager; // Global dependency
    }
    
    processNotifications() {
        while (notificationQueue.length > 0) {
            const notification = notificationQueue.shift();
            
            // Complex processing that modifies global state
            switch (notification.type) {
                case 'user_created':
                    this.handleUserCreated(notification);
                    break;
                case 'stats_updated':
                    this.handleStatsUpdated(notification);
                    break;
            }
        }
    }
    
    handleUserCreated(notification) {
        // Modifies global state and triggers more notifications
        const user = globalUsers.find(u => u.id === notification.userId);
        if (user) {
            // Create welcome tasks (circular call back to task manager)
            this.taskManager.createTask({
                title: 'Welcome Notification Task',
                assignedUsers: [user.id],
                priority: 'high'
            });
            
            // Modify system settings
            systemSettings.lastNotificationProcessed = new Date();
            
            // Trigger more notifications
            notificationQueue.push({
                type: 'welcome_sent',
                userId: user.id,
                timestamp: new Date()
            });
        }
    }
    
    handleStatsUpdated(notification) {
        // Updates global state based on stats
        if (notification.stats.totalTasks > 100) {
            // Automatically create a new project for organization
            if (currentUser) {
                userManager.projectManager.createDefaultProject(currentUser);
            }
        }
        
        // Modify user preferences based on stats
        globalUsers.forEach(user => {
            if (user.tasks.length > 10) {
                user.preferences = user.preferences || {};
                user.preferences.autoOrganize = true;
            }
        });
    }
}

const notificationManager = new NotificationManager();

// Auto-process notifications every second (side effect)
setInterval(() => {
    notificationManager.processNotifications();
}, 1000);` : '';

    return {
      code: baseCode + complexCode,
      problems: [
        'Circular dependencies between UserManager, TaskManager, and ProjectManager',
        'Global state modified by multiple classes unpredictably',
        'Side effects scattered throughout all methods',
        'Data flow is impossible to track due to cross-cutting modifications',
        'Tight coupling makes testing and maintenance extremely difficult',
        ...(difficulty > 2 ? [
          'NotificationManager creates additional circular dependencies',
          'Automatic processing creates unpredictable side effects',
          'Global timers modify state without clear ownership'
        ] : [])
      ],
      hints: [
        'Use dependency injection instead of circular references',
        'Implement event-driven architecture for loose coupling',
        'Create clear data flow patterns (unidirectional)',
        'Separate state management from business logic',
        'Use interfaces to define clear contracts between components',
        ...(difficulty > 2 ? [
          'Implement observer pattern for notifications',
          'Use message queues for asynchronous processing',
          'Create clear ownership boundaries for global state'
        ] : [])
      ],
      requirements: [
        'Eliminate circular dependencies between classes',
        'Implement clear separation of concerns',
        'Create predictable data flow patterns',
        'Reduce coupling between components',
        'Make the system testable by isolating dependencies'
      ]
    };
  }

  private generatePythonCode(difficulty: number): GeneratedCode {
    const baseCode = `# Task Management System - Spaghettizilla Edition

# Global state that everyone modifies
global_tasks = []
global_users = []
global_projects = []
current_user = None
system_settings = {}
notification_queue = []

class UserManager:
    def __init__(self):
        self.task_manager = TaskManager()
        self.project_manager = ProjectManager()
        
        # Set up circular dependencies
        self.task_manager.user_manager = self
        self.project_manager.user_manager = self
        self.project_manager.task_manager = self.task_manager
    
    def create_user(self, user_data):
        global current_user, global_users, notification_queue, system_settings
        
        import random
        import string
        
        user = {
            'id': ''.join(random.choices(string.ascii_letters + string.digits, k=9)),
            **user_data,
            'tasks': [],
            'projects': []
        }
        
        global_users.append(user)
        current_user = user
        
        # Circular dependency: UserManager modifies tasks
        self.task_manager.assign_default_tasks(user)
        self.project_manager.create_default_project(user)
        
        # Side effect: modifies global notification queue
        notification_queue.append({
            'type': 'user_created',
            'user_id': user['id'],
            'timestamp': __import__('datetime').datetime.now()
        })
        
        # More side effects
        self.update_system_settings(user)
        
        return user
    
    def update_system_settings(self, user):
        global system_settings
        
        # Modifies global state based on user
        system_settings['last_user_created'] = user['id']
        system_settings['total_users'] = len(global_users)
        
        # Calls project manager which calls back to user manager
        self.project_manager.update_project_stats()

class TaskManager:
    def __init__(self):
        self.user_manager = None  # Will create circular dependency
        self.project_manager = None  # Will create circular dependency
    
    def create_task(self, task_data):
        global global_tasks, current_user, system_settings
        
        import random
        import string
        from datetime import datetime
        
        task = {
            'id': ''.join(random.choices(string.ascii_letters + string.digits, k=9)),
            **task_data,
            'created_at': datetime.now(),
            'assigned_users': []
        }
        
        global_tasks.append(task)
        
        # Modifies user data
        if current_user:
            current_user['tasks'].append(task['id'])
            
            # Side effect: updates project if task belongs to one
            if task.get('project_id'):
                self.project_manager.add_task_to_project(task['project_id'], task['id'])
        
        # More global state modification
        self.update_task_stats()
        
        return task
    
    def assign_default_tasks(self, user):
        # Creates tasks that modify global state
        default_tasks = [
            {'title': 'Welcome Task', 'description': 'Get started', 'priority': 'low'},
            {'title': 'Setup Profile', 'description': 'Complete your profile', 'priority': 'medium'}
        ]
        
        for task_data in default_tasks:
            task = self.create_task(task_data)
            # Circular: modifies user which was passed from UserManager
            user['tasks'].append(task['id'])
    
    def update_task_stats(self):
        global system_settings, notification_queue
        
        # Modifies global system settings
        system_settings['total_tasks'] = len(global_tasks)
        system_settings['completed_tasks'] = len([t for t in global_tasks if t.get('completed')])
        
        # Triggers notification
        notification_queue.append({
            'type': 'stats_updated',
            'timestamp': __import__('datetime').datetime.now(),
            'stats': dict(system_settings)
        })

class ProjectManager:
    def __init__(self):
        self.task_manager = None  # Circular dependency
        self.user_manager = None  # Circular dependency
    
    def create_default_project(self, user):
        global global_projects
        
        import random
        import string
        
        project = {
            'id': ''.join(random.choices(string.ascii_letters + string.digits, k=9)),
            'name': f"{user['name']}'s Default Project",
            'owner_id': user['id'],
            'members': [user['id']],
            'tasks': []
        }
        
        global_projects.append(project)
        
        # Modifies user data
        user['projects'].append(project['id'])
        
        # Creates tasks through task manager
        if self.task_manager:
            welcome_task = self.task_manager.create_task({
                'title': 'Project Setup',
                'project_id': project['id'],
                'assigned_users': [user['id']]
            })
        
        self.update_project_stats()
        
        return project
    
    def add_task_to_project(self, project_id, task_id):
        global global_projects, global_users
        
        project = next((p for p in global_projects if p['id'] == project_id), None)
        if project:
            project['tasks'].append(task_id)
            
            # Side effect: update all project members
            for member_id in project['members']:
                member = next((u for u in global_users if u['id'] == member_id), None)
                if member and task_id not in member['tasks']:
                    member['tasks'].append(task_id)
    
    def update_project_stats(self):
        global system_settings, global_projects, global_users
        
        # Modifies global settings
        system_settings['total_projects'] = len(global_projects)
        
        # Calls back to user manager
        if self.user_manager and global_users:
            system_settings['average_projects_per_user'] = len(global_projects) / len(global_users)

# Initialize with circular dependencies
user_manager = UserManager()`;

    return {
      code: baseCode,
      problems: [
        'Circular dependencies between all manager classes',
        'Global state modified unpredictably by multiple classes',
        'Side effects scattered throughout all methods',
        'Data flow is impossible to track',
        'Tight coupling makes testing extremely difficult'
      ],
      hints: [
        'Use dependency injection instead of circular references',
        'Implement event-driven architecture',
        'Create clear data flow patterns',
        'Separate state management from business logic',
        'Use composition over inheritance'
      ],
      requirements: [
        'Eliminate circular dependencies',
        'Implement clear separation of concerns',
        'Create predictable data flow',
        'Reduce coupling between components',
        'Make the system testable'
      ]
    };
  }
}