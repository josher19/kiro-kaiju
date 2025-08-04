/**
 * Kiro File System Service Tests
 * 
 * Integration tests for Kiro IDE file system functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    KiroFileSystemService,
    createKiroFileSystemService,
    type FileSystemConfig,
    type FileChange
} from '../kiroFileSystemService';
import type { Challenge } from '@/types/challenge';
import { ProgrammingLanguage, ChallengeCategory, DifficultyLevel } from '@/types/challenge';
import { KaijuType } from '@/types/kaiju';

// Mock Kiro IDE environment
const mockKiroAPI = {
    fileSystem: {
        writeFile: vi.fn(),
        readFile: vi.fn(),
        listFiles: vi.fn(),
        ensureDirectory: vi.fn(),
        removeDirectory: vi.fn(),
        watch: vi.fn(),
        watchFile: vi.fn()
    },
    workspace: {
        sync: vi.fn()
    }
};

// Mock window.kiro
Object.defineProperty(window, 'kiro', {
    value: mockKiroAPI,
    writable: true
});

describe('KiroFileSystemService', () => {
    let service: KiroFileSystemService;
    let config: FileSystemConfig;
    let mockChallenge: Challenge;

    beforeEach(() => {
        config = {
            workspaceRoot: './test-workspace',
            challengeDirectory: './test-challenges',
            autoSave: true,
            watchFiles: true
        };

        mockChallenge = {
            id: 'test-challenge-1',
            title: 'Test Challenge',
            description: 'A test challenge for unit testing',
            kaiju: {
                id: 'hydra-bug',
                name: 'HydraBug',
                type: KaijuType.HYDRA_BUG,
                description: 'A bug that multiplies when you try to fix it',
                avatar: 'hydra-bug.png',
                flavorText: 'Fix one bug, create two more!',
                codePatterns: [],
                difficultyModifiers: []
            },
            config: {
                language: ProgrammingLanguage.JAVASCRIPT,
                category: ChallengeCategory.BUG_FIXING,
                difficulty: DifficultyLevel.INTERMEDIATE
            },
            initialCode: 'function buggyFunction() {\n  // TODO: Fix the bugs\n  return "Hello World";\n}',
            requirements: [
                {
                    id: 'req-1',
                    description: 'Fix all bugs in the code',
                    priority: 'must',
                    testable: true,
                    acceptanceCriteria: ['All tests pass', 'No syntax errors']
                }
            ],
            testCases: [
                {
                    id: 'test-1',
                    name: 'Basic functionality test',
                    description: 'Test basic function behavior',
                    input: {},
                    expectedOutput: 'Hello World',
                    isHidden: false,
                    weight: 1.0
                }
            ],
            hints: ['Look for syntax errors', 'Check variable declarations'],
            createdAt: new Date(),
            timeLimit: 30 * 60 * 1000
        };

        service = createKiroFileSystemService(config);

        // Reset all mocks
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('initialization', () => {
        it('should initialize successfully in Kiro environment', async () => {
            mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
            mockKiroAPI.fileSystem.watch.mockResolvedValue({
                on: vi.fn(),
                close: vi.fn()
            });

            await expect(service.initialize()).resolves.not.toThrow();

            expect(mockKiroAPI.fileSystem.ensureDirectory).toHaveBeenCalledWith(config.challengeDirectory);
        });

        it('should throw error when not in Kiro environment', async () => {
            // Temporarily remove Kiro API
            const originalKiro = window.kiro;
            (window as any).kiro = undefined;

            await expect(service.initialize()).rejects.toThrow('Not running in Kiro IDE environment');

            // Restore Kiro API
            window.kiro = originalKiro;
        });

        it('should start file watching when enabled', async () => {
            const mockWatcher = {
                on: vi.fn(),
                close: vi.fn()
            };

            mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
            mockKiroAPI.fileSystem.watch.mockResolvedValue(mockWatcher);

            await service.initialize();

            expect(mockKiroAPI.fileSystem.watch).toHaveBeenCalledWith(
                config.challengeDirectory,
                { recursive: true, ignoreInitial: true }
            );
            expect(mockWatcher.on).toHaveBeenCalledWith('change', expect.any(Function));
        });
    });

    describe('challenge file management', () => {
        beforeEach(async () => {
            mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
            mockKiroAPI.fileSystem.writeFile.mockResolvedValue(undefined);
            mockKiroAPI.fileSystem.watchFile.mockResolvedValue({
                on: vi.fn(),
                close: vi.fn()
            });

            await service.initialize();
        });

        it('should create challenge files successfully', async () => {
            const createdFiles = await service.createChallengeFiles(mockChallenge);

            expect(createdFiles).toHaveLength(4); // main.js, README.md, REQUIREMENTS.md, test.js
            expect(createdFiles).toContain('./test-challenges/test-challenge-1/main.js');
            expect(createdFiles).toContain('./test-challenges/test-challenge-1/README.md');
            expect(createdFiles).toContain('./test-challenges/test-challenge-1/REQUIREMENTS.md');
            expect(createdFiles).toContain('./test-challenges/test-challenge-1/test.js');

            expect(mockKiroAPI.fileSystem.ensureDirectory).toHaveBeenCalledWith('./test-challenges/test-challenge-1');
            expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledTimes(4);
        });

        it('should create test file when test cases exist', async () => {
            const createdFiles = await service.createChallengeFiles(mockChallenge);

            expect(createdFiles).toContain('./test-challenges/test-challenge-1/test.js');
            expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledTimes(4); // Including test file
        });

        it('should write correct content to main code file', async () => {
            await service.createChallengeFiles(mockChallenge);

            const writeFileCalls = mockKiroAPI.fileSystem.writeFile.mock.calls;
            const codeFileCall = writeFileCalls.find(call => call[0].endsWith('main.js'));

            expect(codeFileCall).toBeDefined();
            expect(codeFileCall![1]).toBe(mockChallenge.initialCode);
        });

        it('should generate proper README content', async () => {
            await service.createChallengeFiles(mockChallenge);

            const writeFileCalls = mockKiroAPI.fileSystem.writeFile.mock.calls;
            const readmeCall = writeFileCalls.find(call => call[0].endsWith('README.md'));

            expect(readmeCall).toBeDefined();
            expect(readmeCall![1]).toContain(mockChallenge.title);
            expect(readmeCall![1]).toContain(mockChallenge.description);
            expect(readmeCall![1]).toContain(mockChallenge.kaiju.name);
        });

        it('should start watching created files', async () => {
            await service.createChallengeFiles(mockChallenge);

            expect(mockKiroAPI.fileSystem.watchFile).toHaveBeenCalledTimes(4); // All created files
        });
    });

    describe('file operations', () => {
        beforeEach(async () => {
            mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
            await service.initialize();
        });

        it('should read challenge code successfully', async () => {
            const expectedCode = 'function fixedFunction() { return "Fixed!"; }';
            mockKiroAPI.fileSystem.readFile.mockResolvedValue(expectedCode);

            const code = await service.readChallengeCode('test-challenge-1');

            expect(code).toBe(expectedCode);
            expect(mockKiroAPI.fileSystem.readFile).toHaveBeenCalledWith('./test-challenges/test-challenge-1/main.js');
        });

        it('should write challenge code successfully', async () => {
            const newCode = 'function newFunction() { return "New!"; }';
            mockKiroAPI.fileSystem.writeFile.mockResolvedValue(undefined);

            await service.writeChallengeCode('test-challenge-1', newCode);

            expect(mockKiroAPI.fileSystem.writeFile).toHaveBeenCalledWith(
                './test-challenges/test-challenge-1/main.js',
                newCode
            );
        });

        it('should list challenge files successfully', async () => {
            const mockFiles = [
                {
                    path: './test-challenges/test-challenge-1/main.js',
                    content: 'function test() {}',
                    lastModified: Date.now(),
                    size: 100,
                    isReadOnly: false
                }
            ];
            mockKiroAPI.fileSystem.listFiles.mockResolvedValue(mockFiles);

            const files = await service.getChallengeFiles('test-challenge-1');

            expect(files).toHaveLength(1);
            expect(files[0].path).toBe('./test-challenges/test-challenge-1/main.js');
            expect(files[0].content).toBe('function test() {}');
        });
    });

    describe('file watching', () => {
        let mockWatcher: any;
        let changeListener: (change: FileChange) => void;

        beforeEach(async () => {
            mockWatcher = {
                on: vi.fn(),
                close: vi.fn()
            };

            mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
            mockKiroAPI.fileSystem.watch.mockResolvedValue(mockWatcher);

            await service.initialize();

            // Set up change listener
            changeListener = vi.fn();
            service.onFileChange(changeListener);
        });

        it('should handle file changes correctly', async () => {
            // Get the change handler that was registered
            const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')[1];

            const mockChange = {
                path: './test-challenges/test-challenge-1/main.js',
                type: 'modified',
                content: 'new content'
            };

            // Simulate file change
            changeHandler({ ...mockChange });

            expect(changeListener).toHaveBeenCalledWith({
                path: mockChange.path,
                type: mockChange.type,
                timestamp: expect.any(Date),
                content: mockChange.content
            });
        });

        it('should stop file watching successfully', async () => {
            await service.stopFileWatching();

            expect(mockWatcher.close).toHaveBeenCalled();
        });

        it('should remove file change listeners', () => {
            service.removeFileChangeListener(changeListener);

            // Trigger a change and verify listener is not called
            const changeHandler = mockWatcher.on.mock.calls.find(call => call[0] === 'change')[1];
            changeHandler({
                path: './test-challenges/test-challenge-1/main.js',
                type: 'modified'
            });

            expect(changeListener).not.toHaveBeenCalled();
        });
    });

    describe('workspace synchronization', () => {
        beforeEach(async () => {
            mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
            await service.initialize();
        });

        it('should sync workspace successfully', async () => {
            mockKiroAPI.workspace.sync.mockResolvedValue(undefined);

            await service.syncWorkspace();

            expect(mockKiroAPI.workspace.sync).toHaveBeenCalled();
        });

        it('should handle sync errors gracefully', async () => {
            mockKiroAPI.workspace.sync.mockRejectedValue(new Error('Sync failed'));

            await expect(service.syncWorkspace()).rejects.toThrow('Sync failed');
        });
    });

    describe('cleanup', () => {
        beforeEach(async () => {
            mockKiroAPI.fileSystem.ensureDirectory.mockResolvedValue(undefined);
            mockKiroAPI.fileSystem.removeDirectory.mockResolvedValue(undefined);
            await service.initialize();
        });

        it('should cleanup challenge files successfully', async () => {
            const mockWatcher = { close: vi.fn() };

            // Set up mocks before creating files
            mockKiroAPI.fileSystem.writeFile.mockResolvedValue(undefined);
            mockKiroAPI.fileSystem.watchFile.mockResolvedValue(mockWatcher);

            // Create some files first to establish watchers
            await service.createChallengeFiles(mockChallenge);

            // Now cleanup
            await service.cleanupChallenge('test-challenge-1');

            expect(mockKiroAPI.fileSystem.removeDirectory).toHaveBeenCalledWith('./test-challenges/test-challenge-1');
            // The watcher close should be called for each file that was being watched
            expect(mockWatcher.close).toHaveBeenCalledTimes(4); // 4 files created, so 4 watchers closed
        });
    });

    describe('file name generation', () => {
        it('should generate correct file names for different languages', async () => {
            const testCases = [
                { language: ProgrammingLanguage.JAVASCRIPT, expected: 'main.js' },
                { language: ProgrammingLanguage.TYPESCRIPT, expected: 'main.ts' },
                { language: ProgrammingLanguage.PYTHON, expected: 'main.py' },
                { language: ProgrammingLanguage.JAVA, expected: 'Main.java' },
                { language: ProgrammingLanguage.CSHARP, expected: 'Main.cs' }
            ];

            for (const testCase of testCases) {
                const challenge = { ...mockChallenge, config: { ...mockChallenge.config, language: testCase.language } };

                mockKiroAPI.fileSystem.writeFile.mockClear();
                await service.createChallengeFiles(challenge);

                const writeFileCalls = mockKiroAPI.fileSystem.writeFile.mock.calls;
                const codeFileCall = writeFileCalls.find(call => call[0].endsWith(testCase.expected));

                expect(codeFileCall).toBeDefined();
            }
        });
    });
});