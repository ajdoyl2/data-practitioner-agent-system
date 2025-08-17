/**
 * Tests for SQLmesh Wrapper
 */

const SQLmeshWrapper = require('../../tools/data-services/sqlmesh-wrapper');
const { spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
jest.mock('child_process');
jest.mock('fs').promises;
jest.mock('../../tools/logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        success: jest.fn()
    }
}));
jest.mock('../../tools/security', () => ({
    securityLogger: {
        logDataOperation: jest.fn()
    }
}));

describe('SQLmeshWrapper', () => {
    let wrapper;
    let mockSpawn;

    beforeEach(() => {
        wrapper = new SQLmeshWrapper({
            projectPath: '/test/sqlmesh-project',
            pythonPath: 'python3'
        });

        // Setup spawn mock
        mockSpawn = {
            stdout: {
                on: jest.fn()
            },
            stderr: {
                on: jest.fn()
            },
            on: jest.fn()
        };
        spawn.mockReturnValue(mockSpawn);

        // Setup fs mock for feature flag
        fs.readFile = jest.fn().mockResolvedValue(JSON.stringify({
            features: {
                sqlmesh_transformations: true
            }
        }));

        fs.mkdir = jest.fn().mockResolvedValue();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('executeCommand', () => {
        it('should execute command successfully with JSON communication', async () => {
            // Setup successful response
            const successResponse = JSON.stringify({
                success: true,
                stdout: 'Command executed',
                stderr: '',
                returncode: 0
            });

            mockSpawn.stdout.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(successResponse));
                }
            });

            mockSpawn.on.mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
            });

            const result = await wrapper.executeCommand('test', ['model1'], { environment: 'dev' });

            expect(result.success).toBe(true);
            expect(spawn).toHaveBeenCalledWith(
                'python3',
                [
                    wrapper.bridgePath,
                    JSON.stringify({
                        command: 'test',
                        args: ['model1'],
                        options: { environment: 'dev' },
                        project_path: '/test/sqlmesh-project'
                    })
                ],
                expect.objectContaining({
                    timeout: 300000,
                    env: expect.objectContaining({
                        SQLMESH_PROJECT_PATH: '/test/sqlmesh-project'
                    })
                })
            );
        });

        it('should handle error when SQLmesh is not installed', async () => {
            mockSpawn.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('Command not found: sqlmesh'));
                }
            });

            await expect(wrapper.executeCommand('test')).rejects.toThrow('Failed to execute SQLmesh command');
        });

        it('should enforce feature flag requirement', async () => {
            // Disable feature flag
            fs.readFile = jest.fn().mockResolvedValue(JSON.stringify({
                features: {
                    sqlmesh_transformations: false
                }
            }));

            await expect(wrapper.executeCommand('test')).rejects.toThrow(
                'SQLmesh transformations are not enabled'
            );
        });

        it('should handle command timeout', async () => {
            // Don't trigger close event to simulate timeout
            mockSpawn.on.mockImplementation((event, callback) => {
                if (event === 'error') {
                    callback(new Error('Timeout'));
                }
            });

            wrapper.timeout = 100; // Short timeout for test

            await expect(wrapper.executeCommand('test')).rejects.toThrow();
        });
    });

    describe('init', () => {
        it('should initialize SQLmesh project with directory structure', async () => {
            const successResponse = JSON.stringify({
                success: true,
                stdout: 'Project initialized'
            });

            mockSpawn.stdout.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(successResponse));
                }
            });

            mockSpawn.on.mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
            });

            const result = await wrapper.init();

            expect(result.success).toBe(true);
            
            // Verify directory creation
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/models', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/audits', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/seeds', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/macros', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/tests', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/models/staging', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/models/intermediate', { recursive: true });
            expect(fs.mkdir).toHaveBeenCalledWith('/test/sqlmesh-project/models/marts', { recursive: true });
        });
    });

    describe('plan', () => {
        it('should create execution plan and parse cost info', async () => {
            const planResponse = JSON.stringify({
                success: true,
                stdout: 'Virtual execution: 100 compute hours saved\nCost savings: 45%\nPlan created successfully'
            });

            mockSpawn.stdout.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(planResponse));
                }
            });

            mockSpawn.on.mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
            });

            const result = await wrapper.plan('staging', false);

            expect(result.success).toBe(true);
            expect(result.stdout).toContain('Cost savings: 45%');
        });
    });

    describe('migrate', () => {
        it('should execute blue-green deployment', async () => {
            const migrateResponse = JSON.stringify({
                success: true,
                stdout: 'Migration completed successfully'
            });

            mockSpawn.stdout.on.mockImplementation((event, callback) => {
                if (event === 'data') {
                    callback(Buffer.from(migrateResponse));
                }
            });

            mockSpawn.on.mockImplementation((event, callback) => {
                if (event === 'close') {
                    callback(0);
                }
            });

            const result = await wrapper.migrate('prod');

            expect(result.success).toBe(true);
            expect(spawn).toHaveBeenCalledWith(
                'python3',
                expect.arrayContaining([
                    wrapper.bridgePath,
                    expect.stringContaining('"command":"migrate"')
                ]),
                expect.any(Object)
            );
        });
    });

    describe('parseCostInfo', () => {
        it('should parse cost savings from output', () => {
            const output = 'Virtual execution: 150 compute hours saved\nCost savings: 35%';
            const costInfo = wrapper.parseCostInfo(output);

            expect(costInfo).toEqual({
                virtualHours: 150,
                savings: 35
            });
        });

        it('should return null when no cost info found', () => {
            const output = 'No cost information available';
            const costInfo = wrapper.parseCostInfo(output);

            expect(costInfo).toBeNull();
        });
    });
});