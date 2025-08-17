/**
 * transformation-engine.test.js
 * Tests for TransformationEngine component
 */

const { TransformationEngine } = require('../../tools/data-services/transformation-engine');
const path = require('path');

// Mock dependencies
jest.mock('../../tools/lib/security-logger', () => ({
    logger: {
        logSecurityEvent: jest.fn().mockResolvedValue(true)
    }
}));

jest.mock('../../tools/data-services/auth-middleware', () => ({
    authenticateApiKey: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../tools/lib/feature-flag-manager', () => ({
    checkFeatureFlag: jest.fn().mockResolvedValue(true)
}));

jest.mock('../../tools/data-services/dbt-wrapper', () => ({
    DbtWrapper: jest.fn().mockImplementation(() => ({
        initialize: jest.fn().mockResolvedValue(true),
        getProjectStatus: jest.fn().mockResolvedValue({
            parsed: true,
            connected: true,
            initialized: true
        }),
        parse: jest.fn().mockResolvedValue({ success: true }),
        compile: jest.fn().mockResolvedValue({ success: true }),
        run: jest.fn().mockResolvedValue({ success: true, stdout: 'Success', stderr: '' }),
        test: jest.fn().mockResolvedValue({ success: true, stdout: 'All tests passed', stderr: '' }),
        docs: jest.fn().mockResolvedValue({ success: true, stdout: 'Docs generated', stderr: '' }),
        list: jest.fn().mockResolvedValue({ 
            success: true, 
            stdout: JSON.stringify([
                {
                    name: 'stg_sample_source',
                    resource_type: 'model',
                    path: 'models/staging/stg_sample_source.sql',
                    schema: 'staging',
                    depends_on: { nodes: [] }
                }
            ])
        }),
        debug: jest.fn().mockResolvedValue({ success: true })
    }))
}));

describe('TransformationEngine', () => {
    let transformationEngine;
    const testProjectPath = path.join(process.cwd(), '..', 'bmad-data-practitioner', 'dbt-project');

    beforeEach(() => {
        // Mock console methods to reduce test noise
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        transformationEngine = new TransformationEngine({
            projectPath: testProjectPath
        });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with correct project path', () => {
            expect(transformationEngine.projectPath).toBe(testProjectPath);
            expect(transformationEngine.initialized).toBe(false);
            expect(transformationEngine.activeJobs).toBeInstanceOf(Map);
            expect(transformationEngine.jobCounter).toBe(0);
        });

        test('should use default project path when none provided', () => {
            const defaultEngine = new TransformationEngine();
            expect(defaultEngine.projectPath).toContain('bmad-data-practitioner/dbt-project');
        });

        test('should initialize dbt wrapper', () => {
            expect(transformationEngine.dbtWrapper).toBeDefined();
        });
    });

    describe('Initialization', () => {
        test('should initialize successfully', async () => {
            const result = await transformationEngine.initialize();
            
            expect(result).toBe(true);
            expect(transformationEngine.initialized).toBe(true);
        });

        test('should throw error when feature flag disabled', async () => {
            const { checkFeatureFlag } = require('../../tools/lib/feature-flag-manager');
            checkFeatureFlag.mockResolvedValueOnce(false);
            
            await expect(transformationEngine.initialize()).rejects.toThrow('dbt_transformations feature is disabled');
        });

        test('should log initialization event', async () => {
            const { logger } = require('../../tools/lib/security-logger');
            
            await transformationEngine.initialize();
            
            expect(logger.logSecurityEvent).toHaveBeenCalledWith(
                'transformation_engine_initialization',
                expect.objectContaining({
                    projectPath: testProjectPath,
                    timestamp: expect.any(String)
                })
            );
        });
    });

    describe('Authentication', () => {
        test('should authenticate successfully', async () => {
            const result = await transformationEngine.authenticate('test-api-key');
            
            expect(result).toBe(true);
        });

        test('should log authentication events', async () => {
            const { logger } = require('../../tools/lib/security-logger');
            
            await transformationEngine.authenticate('test-api-key');
            
            expect(logger.logSecurityEvent).toHaveBeenCalledWith(
                'transformation_authentication',
                expect.objectContaining({
                    success: true,
                    timestamp: expect.any(String)
                })
            );
        });

        test('should handle authentication failure', async () => {
            const { authenticateApiKey } = require('../../tools/data-services/auth-middleware');
            const { logger } = require('../../tools/lib/security-logger');
            
            authenticateApiKey.mockRejectedValueOnce(new Error('Invalid API key'));
            
            await expect(transformationEngine.authenticate('invalid-key')).rejects.toThrow('Invalid API key');
            
            expect(logger.logSecurityEvent).toHaveBeenCalledWith(
                'transformation_authentication_failed',
                expect.objectContaining({
                    success: false,
                    error: 'Invalid API key'
                })
            );
        });
    });

    describe('Project Initialization', () => {
        test('should initialize project successfully', async () => {
            const result = await transformationEngine.initializeProject();
            
            expect(result.success).toBe(true);
            expect(result.jobId).toBeDefined();
            expect(result.projectPath).toBe(testProjectPath);
            expect(result.status).toBeDefined();
        });

        test('should auto-initialize engine if not initialized', async () => {
            expect(transformationEngine.initialized).toBe(false);
            
            await transformationEngine.initializeProject();
            
            expect(transformationEngine.initialized).toBe(true);
        });
    });

    describe('Transformation Execution', () => {
        beforeEach(async () => {
            await transformationEngine.initialize();
        });

        test('should run transformation successfully', async () => {
            const result = await transformationEngine.runTransformation({
                models: 'stg_sample_source'
            });
            
            expect(result.success).toBe(true);
            expect(result.jobId).toBeDefined();
            expect(result.result).toBeDefined();
        });

        test('should handle dry run', async () => {
            const result = await transformationEngine.runTransformation({
                models: 'stg_sample_source',
                dryRun: true
            });
            
            expect(result.success).toBe(true);
            expect(result.dryRun).toBe(true);
            expect(result.message).toContain('Validation completed');
        });

        test('should authenticate when API key provided', async () => {
            const { authenticateApiKey } = require('../../tools/data-services/auth-middleware');
            
            await transformationEngine.runTransformation({
                apiKey: 'test-key'
            });
            
            expect(authenticateApiKey).toHaveBeenCalledWith('test-key');
        });

        test('should track active jobs', async () => {
            const initialJobCount = transformationEngine.activeJobs.size;
            
            await transformationEngine.runTransformation({
                models: 'stg_sample_source'
            });
            
            expect(transformationEngine.activeJobs.size).toBeGreaterThan(initialJobCount);
        });
    });

    describe('Testing', () => {
        beforeEach(async () => {
            await transformationEngine.initialize();
        });

        test('should run tests successfully', async () => {
            const result = await transformationEngine.testTransformation({
                models: 'stg_sample_source'
            });
            
            expect(result.success).toBe(true);
            expect(result.jobId).toBeDefined();
            expect(result.result).toBeDefined();
        });

        test('should log test events', async () => {
            const { logger } = require('../../tools/lib/security-logger');
            
            await transformationEngine.testTransformation();
            
            expect(logger.logSecurityEvent).toHaveBeenCalledWith(
                'transformation_test_start',
                expect.any(Object)
            );
            
            expect(logger.logSecurityEvent).toHaveBeenCalledWith(
                'transformation_test_complete',
                expect.any(Object)
            );
        });
    });

    describe('Documentation Generation', () => {
        beforeEach(async () => {
            await transformationEngine.initialize();
        });

        test('should generate documentation successfully', async () => {
            const result = await transformationEngine.generateDocumentation();
            
            expect(result.success).toBe(true);
            expect(result.jobId).toBeDefined();
            expect(result.docsPath).toBeDefined();
            expect(result.docsPath).toContain('target/index.html');
        });
    });

    describe('Dependency Analysis', () => {
        beforeEach(async () => {
            await transformationEngine.initialize();
        });

        test('should get model dependencies', async () => {
            const dependencies = await transformationEngine.getModelDependencies();
            
            expect(dependencies).toHaveProperty('nodes');
            expect(dependencies).toHaveProperty('edges');
            expect(Array.isArray(dependencies.nodes)).toBe(true);
            expect(Array.isArray(dependencies.edges)).toBe(true);
        });

        test('should build dependency graph correctly', () => {
            const mockModels = [
                {
                    name: 'stg_sample_source',
                    resource_type: 'model',
                    path: 'models/staging/stg_sample_source.sql',
                    schema: 'staging',
                    depends_on: { nodes: [] }
                }
            ];
            
            const graph = transformationEngine.buildDependencyGraph(mockModels);
            
            expect(graph.nodes).toHaveLength(1);
            expect(graph.nodes[0]).toMatchObject({
                id: 'stg_sample_source',
                type: 'model',
                path: 'models/staging/stg_sample_source.sql',
                schema: 'staging'
            });
        });
    });

    describe('Status and Monitoring', () => {
        test('should return engine status', async () => {
            const status = await transformationEngine.getStatus();
            
            expect(status).toHaveProperty('initialized');
            expect(status).toHaveProperty('featureEnabled');
            expect(status).toHaveProperty('projectPath');
            expect(status).toHaveProperty('projectStatus');
            expect(status).toHaveProperty('activeJobs');
            expect(Array.isArray(status.activeJobs)).toBe(true);
        });

        test('should generate unique job IDs', () => {
            const id1 = transformationEngine.generateJobId();
            const id2 = transformationEngine.generateJobId();
            
            expect(id1).not.toBe(id2);
            expect(id1).toMatch(/^job_\d+_\d+$/);
            expect(id2).toMatch(/^job_\d+_\d+$/);
        });
    });

    describe('Error Handling', () => {
        test('should handle initialization errors', async () => {
            const { checkFeatureFlag } = require('../../tools/lib/feature-flag-manager');
            checkFeatureFlag.mockRejectedValueOnce(new Error('Service unavailable'));
            
            await expect(transformationEngine.initialize()).rejects.toThrow('Service unavailable');
        });

        test('should handle transformation errors', async () => {
            await transformationEngine.initialize();
            
            transformationEngine.dbtWrapper.run.mockRejectedValueOnce(new Error('Compilation failed'));
            
            await expect(transformationEngine.runTransformation()).rejects.toThrow('Compilation failed');
        });

        test('should log error events', async () => {
            await transformationEngine.initialize();
            const { logger } = require('../../tools/lib/security-logger');
            
            transformationEngine.dbtWrapper.run.mockRejectedValueOnce(new Error('Test error'));
            
            try {
                await transformationEngine.runTransformation();
            } catch (error) {
                // Expected to throw
            }
            
            expect(logger.logSecurityEvent).toHaveBeenCalledWith(
                'transformation_transformation_failed',
                expect.objectContaining({
                    error: 'Test error'
                })
            );
        });
    });
});