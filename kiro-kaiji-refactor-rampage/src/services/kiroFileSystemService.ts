/**
 * Kiro File System Service
 * 
 * Handles file system integration for local mode with Kiro IDE.
 * Provides file watching, modification tracking, and workspace synchronization.
 */

import type { Challenge } from '@/types/challenge';

export interface FileSystemConfig {
  workspaceRoot: string;
  challengeDirectory: string;
  autoSave: boolean;
  watchFiles: boolean;
}

export interface FileChange {
  path: string;
  type: 'created' | 'modified' | 'deleted';
  timestamp: Date;
  content?: string;
}

export interface WorkspaceFile {
  path: string;
  content: string;
  lastModified: Date;
  size: number;
  isReadOnly: boolean;
}

export class KiroFileSystemService {
  private config: FileSystemConfig;
  private fileWatchers: Map<string, FileSystemWatcher> = new Map();
  private changeListeners: Array<(change: FileChange) => void> = [];
  private isWatching = false;

  constructor(config: FileSystemConfig) {
    this.config = config;
  }

  /**
   * Initialize file system integration with Kiro IDE
   */
  async initialize(): Promise<void> {
    try {
      // Check if we're running in Kiro IDE environment
      if (!this.isKiroEnvironment()) {
        throw new Error('Not running in Kiro IDE environment');
      }

      // Ensure challenge directory exists
      await this.ensureDirectoryExists(this.config.challengeDirectory);

      // Start file watching if enabled
      if (this.config.watchFiles) {
        await this.startFileWatching();
      }

      console.log('Kiro File System Service initialized');
    } catch (error) {
      console.error('Failed to initialize Kiro File System Service:', error);
      throw error;
    }
  }

  /**
   * Create challenge files in the workspace
   */
  async createChallengeFiles(challenge: Challenge): Promise<string[]> {
    const challengePath = this.getChallengeDirectory(challenge.id);
    const createdFiles: string[] = [];

    try {
      // Create challenge directory
      await this.ensureDirectoryExists(challengePath);

      // Create main code file
      const codeFileName = this.getCodeFileName(challenge.config.language);
      const codeFilePath = `${challengePath}/${codeFileName}`;
      await this.writeFile(codeFilePath, challenge.initialCode);
      createdFiles.push(codeFilePath);

      // Create README with challenge description
      const readmePath = `${challengePath}/README.md`;
      const readmeContent = this.generateChallengeReadme(challenge);
      await this.writeFile(readmePath, readmeContent);
      createdFiles.push(readmePath);

      // Create requirements file
      const requirementsPath = `${challengePath}/REQUIREMENTS.md`;
      const requirementsContent = this.generateRequirementsFile(challenge);
      await this.writeFile(requirementsPath, requirementsContent);
      createdFiles.push(requirementsPath);

      // Create test file if test cases exist
      if (challenge.testCases.length > 0) {
        const testFileName = this.getTestFileName(challenge.config.language);
        const testFilePath = `${challengePath}/${testFileName}`;
        const testContent = this.generateTestFile(challenge);
        await this.writeFile(testFilePath, testContent);
        createdFiles.push(testFilePath);
      }

      // Start watching these files
      if (this.config.watchFiles) {
        for (const filePath of createdFiles) {
          await this.watchFile(filePath);
        }
      }

      return createdFiles;
    } catch (error) {
      console.error('Failed to create challenge files:', error);
      throw error;
    }
  }

  /**
   * Read current code from challenge file
   */
  async readChallengeCode(challengeId: string): Promise<string> {
    const challengePath = this.getChallengeDirectory(challengeId);
    const codeFileName = this.getCodeFileName('javascript'); // Default, should be determined from challenge
    const codeFilePath = `${challengePath}/${codeFileName}`;

    try {
      return await this.readFile(codeFilePath);
    } catch (error) {
      console.error('Failed to read challenge code:', error);
      throw error;
    }
  }

  /**
   * Write code to challenge file
   */
  async writeChallengeCode(challengeId: string, code: string): Promise<void> {
    const challengePath = this.getChallengeDirectory(challengeId);
    const codeFileName = this.getCodeFileName('javascript'); // Default, should be determined from challenge
    const codeFilePath = `${challengePath}/${codeFileName}`;

    try {
      await this.writeFile(codeFilePath, code);
    } catch (error) {
      console.error('Failed to write challenge code:', error);
      throw error;
    }
  }

  /**
   * Get all files in challenge directory
   */
  async getChallengeFiles(challengeId: string): Promise<WorkspaceFile[]> {
    const challengePath = this.getChallengeDirectory(challengeId);
    
    try {
      return await this.listFiles(challengePath);
    } catch (error) {
      console.error('Failed to get challenge files:', error);
      throw error;
    }
  }

  /**
   * Start watching files for changes
   */
  async startFileWatching(): Promise<void> {
    if (this.isWatching) {
      return;
    }

    try {
      // Use Kiro IDE's file watching API
      if (window.kiro?.fileSystem?.watch) {
        const watcher = await window.kiro.fileSystem.watch(
          this.config.challengeDirectory,
          {
            recursive: true,
            ignoreInitial: true
          }
        );

        watcher.on('change', (event: any) => {
          this.handleFileChange({
            path: event.path,
            type: event.type,
            timestamp: new Date(),
            content: event.content
          });
        });

        this.fileWatchers.set('main', watcher);
        this.isWatching = true;
        console.log('File watching started');
      }
    } catch (error) {
      console.error('Failed to start file watching:', error);
      throw error;
    }
  }

  /**
   * Stop watching files
   */
  async stopFileWatching(): Promise<void> {
    try {
      for (const [key, watcher] of this.fileWatchers) {
        if (watcher.close) {
          await watcher.close();
        }
        this.fileWatchers.delete(key);
      }
      this.isWatching = false;
      console.log('File watching stopped');
    } catch (error) {
      console.error('Failed to stop file watching:', error);
    }
  }

  /**
   * Watch a specific file
   */
  async watchFile(filePath: string): Promise<void> {
    if (!this.config.watchFiles || this.fileWatchers.has(filePath)) {
      return;
    }

    try {
      if (window.kiro?.fileSystem?.watchFile) {
        const watcher = await window.kiro.fileSystem.watchFile(filePath);
        
        watcher.on('change', (event: any) => {
          this.handleFileChange({
            path: filePath,
            type: 'modified',
            timestamp: new Date(),
            content: event.content
          });
        });

        this.fileWatchers.set(filePath, watcher);
      }
    } catch (error) {
      console.error(`Failed to watch file ${filePath}:`, error);
    }
  }

  /**
   * Add file change listener
   */
  onFileChange(listener: (change: FileChange) => void): void {
    this.changeListeners.push(listener);
  }

  /**
   * Remove file change listener
   */
  removeFileChangeListener(listener: (change: FileChange) => void): void {
    const index = this.changeListeners.indexOf(listener);
    if (index > -1) {
      this.changeListeners.splice(index, 1);
    }
  }

  /**
   * Sync workspace files with Kiro IDE
   */
  async syncWorkspace(): Promise<void> {
    try {
      if (window.kiro?.workspace?.sync) {
        await window.kiro.workspace.sync();
        console.log('Workspace synchronized with Kiro IDE');
      }
    } catch (error) {
      console.error('Failed to sync workspace:', error);
      throw error;
    }
  }

  /**
   * Clean up challenge files
   */
  async cleanupChallenge(challengeId: string): Promise<void> {
    const challengePath = this.getChallengeDirectory(challengeId);
    
    try {
      // Stop watching files in this directory
      for (const [key, watcher] of this.fileWatchers) {
        if (key.startsWith(challengePath)) {
          if (watcher.close) {
            await watcher.close();
          }
          this.fileWatchers.delete(key);
        }
      }

      // Remove directory if it exists
      if (window.kiro?.fileSystem?.removeDirectory) {
        await window.kiro.fileSystem.removeDirectory(challengePath);
      }
    } catch (error) {
      console.error('Failed to cleanup challenge:', error);
    }
  }

  // Private methods

  private isKiroEnvironment(): boolean {
    return typeof window !== 'undefined' && 
           window.kiro !== undefined &&
           window.kiro.fileSystem !== undefined;
  }

  private getChallengeDirectory(challengeId: string): string {
    return `${this.config.challengeDirectory}/${challengeId}`;
  }

  private getCodeFileName(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'main.js',
      typescript: 'main.ts',
      python: 'main.py',
      java: 'Main.java',
      csharp: 'Main.cs',
      cpp: 'main.cpp',
      go: 'main.go',
      rust: 'main.rs'
    };
    return extensions[language] || 'main.txt';
  }

  private getTestFileName(language: string): string {
    const extensions: Record<string, string> = {
      javascript: 'test.js',
      typescript: 'test.ts',
      python: 'test.py',
      java: 'Test.java',
      csharp: 'Test.cs',
      cpp: 'test.cpp',
      go: 'test.go',
      rust: 'test.rs'
    };
    return extensions[language] || 'test.txt';
  }

  private async ensureDirectoryExists(path: string): Promise<void> {
    if (window.kiro?.fileSystem?.ensureDirectory) {
      await window.kiro.fileSystem.ensureDirectory(path);
    }
  }

  private async writeFile(path: string, content: string): Promise<void> {
    if (window.kiro?.fileSystem?.writeFile) {
      await window.kiro.fileSystem.writeFile(path, content);
    }
  }

  private async readFile(path: string): Promise<string> {
    if (window.kiro?.fileSystem?.readFile) {
      return await window.kiro.fileSystem.readFile(path);
    }
    throw new Error('File system not available');
  }

  private async listFiles(path: string): Promise<WorkspaceFile[]> {
    if (window.kiro?.fileSystem?.listFiles) {
      const files = await window.kiro.fileSystem.listFiles(path);
      return files.map((file: any) => ({
        path: file.path,
        content: file.content || '',
        lastModified: new Date(file.lastModified),
        size: file.size || 0,
        isReadOnly: file.isReadOnly || false
      }));
    }
    return [];
  }

  private handleFileChange(change: FileChange): void {
    console.log('File change detected:', change);
    
    // Notify all listeners
    this.changeListeners.forEach(listener => {
      try {
        listener(change);
      } catch (error) {
        console.error('Error in file change listener:', error);
      }
    });
  }

  private generateChallengeReadme(challenge: Challenge): string {
    return `# ${challenge.title}

## Challenge Description
${challenge.description}

## Kaiju Monster: ${challenge.kaiju.name}
${challenge.kaiju.description}

## Requirements
${challenge.requirements.map(req => `- ${req.description}`).join('\n')}

## Hints
${challenge.hints.map(hint => `- ${hint}`).join('\n')}

## Time Limit
${challenge.timeLimit ? `${Math.round(challenge.timeLimit / 60000)} minutes` : 'No time limit'}

---
Generated by Kiro Kaiju: Refactor Rampage
`;
  }

  private generateRequirementsFile(challenge: Challenge): string {
    return `# Requirements

${challenge.requirements.map(req => `
## ${req.id}: ${req.description}
**Priority:** ${req.priority}
**Testable:** ${req.testable ? 'Yes' : 'No'}

### Acceptance Criteria
${req.acceptanceCriteria.map(criteria => `- ${criteria}`).join('\n')}
`).join('\n')}
`;
  }

  private generateTestFile(challenge: Challenge): string {
    // Generate basic test structure based on language
    const language = challenge.config.language;
    
    switch (language) {
      case 'javascript':
      case 'typescript':
        return this.generateJavaScriptTests(challenge);
      case 'python':
        return this.generatePythonTests(challenge);
      default:
        return `// Test cases for ${challenge.title}\n// TODO: Implement tests based on requirements`;
    }
  }

  private generateJavaScriptTests(challenge: Challenge): string {
    return `// Test cases for ${challenge.title}
// Generated by Kiro Kaiju: Refactor Rampage

${challenge.testCases.map(testCase => `
// ${testCase.name}
// ${testCase.description}
// Input: ${JSON.stringify(testCase.input)}
// Expected: ${JSON.stringify(testCase.expectedOutput)}
`).join('\n')}

// TODO: Implement actual test functions
// Example:
// function test${challenge.title.replace(/\s+/g, '')}() {
//   // Your test implementation here
// }
`;
  }

  private generatePythonTests(challenge: Challenge): string {
    return `# Test cases for ${challenge.title}
# Generated by Kiro Kaiju: Refactor Rampage

${challenge.testCases.map(testCase => `
# ${testCase.name}
# ${testCase.description}
# Input: ${JSON.stringify(testCase.input)}
# Expected: ${JSON.stringify(testCase.expectedOutput)}
`).join('\n')}

# TODO: Implement actual test functions
# Example:
# def test_${challenge.title.toLowerCase().replace(/\s+/g, '_')}():
#     # Your test implementation here
#     pass
`;
  }
}

// Global type declarations for Kiro IDE integration
declare global {
  interface Window {
    kiro?: {
      fileSystem?: {
        writeFile: (path: string, content: string) => Promise<void>;
        readFile: (path: string) => Promise<string>;
        listFiles: (path: string) => Promise<any[]>;
        ensureDirectory: (path: string) => Promise<void>;
        removeDirectory: (path: string) => Promise<void>;
        watch: (path: string, options?: any) => Promise<FileSystemWatcher>;
        watchFile: (path: string) => Promise<FileSystemWatcher>;
      };
      workspace?: {
        sync: () => Promise<void>;
      };
      ai?: {
        chat: (request: any) => Promise<any>;
        analyze: (code: string, context: any) => Promise<any>;
      };
    };
  }
}

interface FileSystemWatcher {
  on: (event: string, callback: (event: any) => void) => void;
  close?: () => Promise<void>;
}

// Export singleton instance
let fileSystemServiceInstance: KiroFileSystemService | null = null;

export function createKiroFileSystemService(config: FileSystemConfig): KiroFileSystemService {
  fileSystemServiceInstance = new KiroFileSystemService(config);
  return fileSystemServiceInstance;
}

export function getKiroFileSystemService(): KiroFileSystemService {
  if (!fileSystemServiceInstance) {
    throw new Error('Kiro File System Service not initialized. Call createKiroFileSystemService first.');
  }
  return fileSystemServiceInstance;
}