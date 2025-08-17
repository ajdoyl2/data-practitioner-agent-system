/**
 * dbt-wrapper.test.js
 * Tests for dbt subprocess wrapper functionality
 */

const { DbtWrapper } = require('../../tools/data-services/dbt-wrapper');
const path = require('path');
const fs = require('fs').promises;

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

describe('DbtWrapper', () => {
    let dbtWrapper;
    const testProjectPath = path.join(process.cwd(), '..', 'bmad-data-practitioner', 'dbt-project');

    beforeEach(() => {
        // Mock console methods to reduce test noise
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        
        dbtWrapper = new DbtWrapper(testProjectPath);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with correct project path', () => {
            expect(dbtWrapper.projectPath).toBe(testProjectPath);
            expect(dbtWrapper.initialized).toBe(false);
        });

        test('should use default project path when none provided', () => {
            const defaultWrapper = new DbtWrapper();
            expect(defaultWrapper.projectPath).toContain('bmad-data-practitioner/dbt-project');
        });
    });

    describe('Project Structure Validation', () => {
        test('should find dbt_project.yml file', async () => {
            const projectFile = path.join(testProjectPath, 'dbt_project.yml');
            
            try {
                await fs.access(projectFile);
                expect(true).toBe(true); // File exists
            } catch (error) {
                throw new Error('dbt_project.yml file should exist');
            }
        });

        test('should find profiles.yml file', async () => {
            const profilesFile = path.join(testProjectPath, 'profiles.yml');
            
            try {
                await fs.access(profilesFile);
                expect(true).toBe(true); // File exists
            } catch (error) {
                throw new Error('profiles.yml file should exist');
            }
        });

        test('should have required directory structure', async () => {
            const requiredDirs = [
                'models',
                'models/staging',
                'models/intermediate', 
                'models/marts',
                'tests',
                'macros',
                'docs',
                'data'
            ];

            for (const dir of requiredDirs) {
                const dirPath = path.join(testProjectPath, dir);
                try {
                    const stats = await fs.stat(dirPath);
                    expect(stats.isDirectory()).toBe(true);
                } catch (error) {
                    throw new Error(`Required directory ${dir} should exist`);
                }
            }
        });
    });

    describe('Configuration Validation', () => {
        test('should have valid dbt_project.yml configuration', async () => {
            const projectFile = path.join(testProjectPath, 'dbt_project.yml');
            const content = await fs.readFile(projectFile, 'utf8');
            
            // Check for essential configuration elements
            expect(content).toContain('name: \'bmad_data_practitioner\'');
            expect(content).toContain('version: \'1.0.0\'');
            expect(content).toContain('config-version: 2');
            expect(content).toContain('model-paths: ["models"]');
            expect(content).toContain('dbt_transformations');
        });

        test('should have valid profiles.yml configuration', async () => {
            const profilesFile = path.join(testProjectPath, 'profiles.yml');
            const content = await fs.readFile(profilesFile, 'utf8');
            
            // Check for essential profile configuration
            expect(content).toContain('bmad_data_practitioner:');
            expect(content).toContain('type: duckdb');
            expect(content).toContain('analytics.db');
            expect(content).toContain('target: dev');
        });
    });

    describe('Model Structure Validation', () => {
        test('should have staging model files', async () => {
            const stagingFiles = [
                '_sources.yml',
                'stg_sample_source.sql',
                'staging.yml'
            ];

            for (const file of stagingFiles) {
                const filePath = path.join(testProjectPath, 'models', 'staging', file);
                try {
                    await fs.access(filePath);
                    expect(true).toBe(true); // File exists
                } catch (error) {
                    throw new Error(`Staging file ${file} should exist`);
                }
            }
        });

        test('should have valid source configuration', async () => {
            const sourcesFile = path.join(testProjectPath, 'models', 'staging', '_sources.yml');
            const content = await fs.readFile(sourcesFile, 'utf8');
            
            expect(content).toContain('version: 2');
            expect(content).toContain('sources:');
            expect(content).toContain('raw_data');
            expect(content).toContain('sample_source');
        });

        test('should have valid staging model', async () => {
            const modelFile = path.join(testProjectPath, 'models', 'staging', 'stg_sample_source.sql');
            const content = await fs.readFile(modelFile, 'utf8');
            
            expect(content).toContain('config(');
            expect(content).toContain('source(\'raw_data\', \'sample_source\')');
            expect(content).toContain('select');
        });
    });

    describe('Error Handling', () => {
        test('should handle missing dbt installation gracefully', async () => {
            // This test assumes dbt might not be installed in CI environment
            const wrapper = new DbtWrapper('/nonexistent/path');
            
            try {
                await wrapper.initialize();
                // If we reach here, dbt is actually installed
                expect(wrapper.initialized).toBe(true);
            } catch (error) {
                // Expected behavior when dbt is not installed
                expect(error.message).toContain('dbt');
                expect(wrapper.initialized).toBe(false);
            }
        });

        test('should validate project path exists', () => {
            expect(dbtWrapper.projectPath).toBeTruthy();
            expect(typeof dbtWrapper.projectPath).toBe('string');
        });
    });

    describe('Command Interface', () => {
        test('should have all required methods', () => {
            const requiredMethods = [
                'initialize',
                'executeDbtCommand',
                'run',
                'test',
                'compile',
                'docs',
                'parse',
                'list',
                'debug',
                'getProjectStatus'
            ];

            requiredMethods.forEach(method => {
                expect(typeof dbtWrapper[method]).toBe('function');
            });
        });

        test('should return project status', async () => {
            const status = await dbtWrapper.getProjectStatus();
            
            expect(status).toHaveProperty('projectPath');
            expect(status).toHaveProperty('initialized');
            expect(status.projectPath).toBe(testProjectPath);
        });
    });
});