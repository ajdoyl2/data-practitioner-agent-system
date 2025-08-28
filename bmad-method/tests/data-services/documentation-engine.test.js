/**
 * Comprehensive test suite for DocumentationEngine
 * Tests all functionality including generation, validation, versioning, and search
 */

const DocumentationEngine = require('../../tools/data-services/documentation-engine');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');

// Mock dependencies
jest.mock('../../tools/lib/security-logger', () => ({
    securityLogger: {
        logDataOperation: jest.fn()
    }
}));

jest.mock('../../tools/lib/yaml-utils', () => ({
    loadYaml: jest.fn()
}));

// Test utilities
const createTestDirectory = async (testDir) => {
    try {
        await fs.mkdir(testDir, { recursive: true });
    } catch (error) {
        // Directory already exists
    }
};

const cleanupTestDirectory = async (testDir) => {
    try {
        await fs.rmdir(testDir, { recursive: true });
    } catch (error) {
        // Directory doesn't exist or can't be removed
    }
};

const createTestFile = async (filePath, content) => {
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, content);
};

describe('DocumentationEngine', () => {
    let engine;
    let testDir;
    let mockYamlUtils;

    beforeAll(async () => {
        testDir = path.join(__dirname, '.test-docs');
        await createTestDirectory(testDir);
    });

    afterAll(async () => {
        await cleanupTestDirectory(testDir);
    });

    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock yaml-utils
        mockYamlUtils = require('../../tools/lib/yaml-utils');
        mockYamlUtils.loadYaml.mockResolvedValue({
            features: {
                automated_documentation: { enabled: true }
            }
        });

        // Initialize engine with test configuration
        engine = new DocumentationEngine({
            cachePath: path.join(testDir, 'cache'),
            outputPath: path.join(testDir, 'output'),
            templatesPath: path.join(testDir, 'templates'),
            timeout: 10000 // Shorter timeout for tests
        });
    });

    describe('Initialization and Configuration', () => {
        test('should initialize with default options', () => {
            const defaultEngine = new DocumentationEngine();
            
            expect(defaultEngine.pythonPath).toBe('python3');
            expect(defaultEngine.timeout).toBe(300000);
            expect(defaultEngine.featureFlag).toBe('automated_documentation');
        });

        test('should initialize with custom options', () => {
            const customEngine = new DocumentationEngine({
                pythonPath: 'python',
                timeout: 120000,
                cachePath: '/custom/cache'
            });
            
            expect(customEngine.pythonPath).toBe('python');
            expect(customEngine.timeout).toBe(120000);
            expect(customEngine.cachePath).toBe('/custom/cache');
        });

        test('should have correct documentation types configured', () => {
            const expectedTypes = ['api', 'data_dictionary', 'pipeline', 'configuration', 'user_guide', 'troubleshooting'];
            const actualTypes = Object.keys(engine.docTypes);
            
            expect(actualTypes).toEqual(expect.arrayContaining(expectedTypes));
            expect(actualTypes).toHaveLength(expectedTypes.length);
        });

        test('should initialize directories on startup', async () => {
            // Check if directories are created
            const cachePath = engine.cachePath;
            const outputPath = engine.outputPath;
            
            // Wait for initialization to complete
            await new Promise(resolve => setTimeout(resolve, 100));
            
            try {
                await fs.access(cachePath);
                await fs.access(outputPath);
                // Directories should exist
            } catch (error) {
                // If access fails, directories don't exist - this would be a failure
                throw new Error(`Directories not initialized: ${error.message}`);
            }
        });
    });

    describe('Feature Flag Management', () => {
        test('should check if documentation generation is enabled', async () => {
            const isEnabled = await engine.isEnabled();
            expect(isEnabled).toBe(true);
            expect(mockYamlUtils.loadYaml).toHaveBeenCalledWith(
                expect.stringContaining('feature-flags.yaml')
            );
        });

        test('should handle missing feature flags gracefully', async () => {
            mockYamlUtils.loadYaml.mockRejectedValue(new Error('File not found'));
            
            const isEnabled = await engine.isEnabled();
            expect(isEnabled).toBe(false);
        });

        test('should handle disabled feature flag', async () => {
            mockYamlUtils.loadYaml.mockResolvedValue({
                features: {
                    automated_documentation: { enabled: false }
                }
            });
            
            const isEnabled = await engine.isEnabled();
            expect(isEnabled).toBe(false);
        });
    });

    describe('Cache Management', () => {
        test('should generate cache key correctly', () => {
            const sourceInfo = { source: 'test.js', files: ['test.js'] };
            const docType = 'api';
            
            const key1 = engine.generateCacheKey(sourceInfo, docType);
            const key2 = engine.generateCacheKey(sourceInfo, docType);
            const key3 = engine.generateCacheKey({ ...sourceInfo, files: ['other.js'] }, docType);
            
            expect(key1).toBe(key2); // Same input should generate same key
            expect(key1).not.toBe(key3); // Different input should generate different key
            expect(key1).toMatch(/^[a-f0-9]{32}$/); // Should be MD5 hash
        });

        test('should save and retrieve documentation from cache', async () => {
            const cacheKey = 'test-cache-key';
            const docData = {
                success: true,
                data: { test: 'data' },
                metadata: { test: 'metadata' }
            };
            
            // Save to cache
            await engine.saveDocumentationToCache(cacheKey, docData);
            
            // Retrieve from cache
            const retrieved = await engine.getCachedDocumentation(cacheKey);
            
            expect(retrieved).toMatchObject(docData);
            expect(retrieved.timestamp).toBeDefined();
            expect(typeof retrieved.timestamp).toBe('number');
        });

        test('should return null for expired cache', async () => {
            const cacheKey = 'expired-cache-key';
            const docData = {
                success: true,
                data: { test: 'data' },
                timestamp: Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
            };
            
            // Create expired cache file manually
            const cacheFile = path.join(engine.cachePath, `${cacheKey}.json`);
            await fs.mkdir(path.dirname(cacheFile), { recursive: true });
            await fs.writeFile(cacheFile, JSON.stringify(docData));
            
            const retrieved = await engine.getCachedDocumentation(cacheKey);
            expect(retrieved).toBeNull();
        });

        test('should clean old cache files', async () => {
            const oldFile = path.join(engine.cachePath, 'old-file.json');
            const newFile = path.join(engine.cachePath, 'new-file.json');
            
            // Create old and new files
            await createTestFile(oldFile, JSON.stringify({ data: 'old' }));
            await createTestFile(newFile, JSON.stringify({ data: 'new' }));
            
            // Manually set old file modification time
            const oldTime = Date.now() - (48 * 60 * 60 * 1000); // 48 hours ago
            await fs.utimes(oldFile, new Date(oldTime), new Date(oldTime));
            
            // Clean cache with 24 hour threshold
            await engine.cleanCache(24);
            
            // Old file should be deleted, new file should remain
            await expect(fs.access(oldFile)).rejects.toThrow();
            await expect(fs.access(newFile)).resolves.toBeUndefined();
        });
    });

    describe('Data Dictionary Generation', () => {
        test('should generate data dictionary from schemas', async () => {
            // Create test schema
            const testSchema = {
                tables: {
                    users: {
                        description: 'User accounts table',
                        columns: {
                            id: { type: 'integer', primary_key: true, description: 'Unique user ID' },
                            email: { type: 'string', nullable: false, description: 'User email address' },
                            created_at: { type: 'timestamp', default: 'CURRENT_TIMESTAMP', description: 'Account creation date' }
                        },
                        indexes: ['email'],
                        constraints: ['UNIQUE(email)']
                    }
                },
                relationships: [
                    {
                        type: 'one-to-many',
                        from_table: 'users',
                        from_column: 'id',
                        to_table: 'orders',
                        to_column: 'user_id',
                        description: 'Users can have multiple orders'
                    }
                ]
            };
            
            const schemaFile = path.join(testDir, 'schema.json');
            await createTestFile(schemaFile, JSON.stringify(testSchema));
            
            const sourceInfo = { schemas: [schemaFile] };
            const result = await engine.generateDataDictionary(sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.data.schemas).toHaveLength(1);
            expect(result.data.schemas[0].tables).toHaveLength(1);
            expect(result.data.schemas[0].tables[0].name).toBe('users');
            expect(result.data.schemas[0].tables[0].columns).toHaveLength(3);
            expect(result.data.schemas[0].relationships).toHaveLength(1);
            expect(result.data.summary.total_tables).toBe(1);
            expect(result.data.summary.total_relationships).toBe(1);
        });

        test('should handle invalid schema files gracefully', async () => {
            const invalidSchemaFile = path.join(testDir, 'invalid-schema.json');
            await createTestFile(invalidSchemaFile, 'invalid json content');
            
            const sourceInfo = { schemas: [invalidSchemaFile] };
            const result = await engine.generateDataDictionary(sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.data.schemas).toHaveLength(0);
        });
    });

    describe('Pipeline Documentation Generation', () => {
        test('should generate pipeline documentation from YAML', async () => {
            const testPipeline = {
                name: 'data-processing-pipeline',
                description: 'Main data processing pipeline',
                stages: [
                    {
                        name: 'ingestion',
                        description: 'Data ingestion stage',
                        type: 'extract',
                        inputs: ['raw_data'],
                        outputs: ['cleaned_data'],
                        config: { batch_size: 1000 }
                    },
                    {
                        name: 'transformation',
                        description: 'Data transformation stage',
                        type: 'transform',
                        inputs: ['cleaned_data'],
                        outputs: ['processed_data']
                    }
                ],
                dependencies: [
                    {
                        type: 'sequential',
                        source: 'ingestion',
                        target: 'transformation'
                    }
                ]
            };
            
            const pipelineFile = path.join(testDir, 'pipeline.yaml');
            await createTestFile(pipelineFile, JSON.stringify(testPipeline));
            
            // Mock loadYaml for pipeline parsing
            const originalLoadYaml = mockYamlUtils.loadYaml;
            mockYamlUtils.loadYaml.mockImplementation((filePath) => {
                if (filePath === pipelineFile) {
                    return Promise.resolve(testPipeline);
                }
                return originalLoadYaml(filePath);
            });
            
            const sourceInfo = { pipelines: [pipelineFile] };
            const result = await engine.generatePipelineDocumentation(sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.data.pipelines).toHaveLength(1);
            expect(result.data.pipelines[0].stages).toHaveLength(2);
            expect(result.data.pipelines[0].dependencies).toHaveLength(1);
            expect(result.data.pipelines[0].flow_diagram).toContain('graph TD');
            expect(result.data.summary.total_stages).toBe(2);
            expect(result.data.summary.total_dependencies).toBe(1);
        });

        test('should extract pipeline from code', async () => {
            const testCode = `
                function ingestionStage(data) {
                    return processData(data);
                }
                
                const transformationStage = (input) => {
                    return transform(input);
                };
                
                def analysis_stage(data):
                    return analyze(data)
            `;
            
            const codeFile = path.join(testDir, 'pipeline.js');
            await createTestFile(codeFile, testCode);
            
            const sourceInfo = { pipelines: [codeFile] };
            const result = await engine.generatePipelineDocumentation(sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.data.pipelines).toHaveLength(1);
            expect(result.data.pipelines[0].stages.length).toBeGreaterThan(0);
        });
    });

    describe('Documentation Validation', () => {
        test('should validate documentation completeness', async () => {
            const completeDocData = {
                data: {
                    overview: 'Complete overview section',
                    usage: 'Complete usage section',
                    examples: 'Complete examples section',
                    functions: [
                        {
                            name: 'testFunction',
                            description: 'Test function description',
                            params: [{ name: 'param1', type: 'string' }],
                            returns: { type: 'boolean', description: 'Return value' }
                        }
                    ]
                }
            };
            
            const validation = await engine.validateCompleteness(completeDocData, 'api');
            
            expect(validation.score).toBeGreaterThan(80);
            expect(validation.issues).toHaveLength(0);
        });

        test('should identify missing sections', async () => {
            const incompleteDocData = {
                data: {
                    overview: 'Only overview section'
                    // Missing usage and examples
                }
            };
            
            const validation = await engine.validateCompleteness(incompleteDocData, 'api');
            
            expect(validation.score).toBeLessThan(100);
            expect(validation.issues.length).toBeGreaterThan(0);
            expect(validation.issues.some(issue => issue.includes('usage'))).toBe(true);
            expect(validation.issues.some(issue => issue.includes('examples'))).toBe(true);
        });

        test('should validate API documentation specifically', async () => {
            const apiDocData = {
                data: {
                    functions: [
                        {
                            name: 'documentedFunction',
                            description: 'Well documented function',
                            params: [{ name: 'param1', type: 'string' }],
                            returns: { type: 'boolean', description: 'Return value' }
                        },
                        {
                            name: 'undocumentedFunction'
                            // Missing description, params, returns
                        }
                    ]
                }
            };
            
            const validation = engine.validateAPIDocumentation(apiDocData);
            
            expect(validation.score).toBe(50); // 1 out of 2 functions documented
            expect(validation.issues.some(issue => issue.includes('undocumentedFunction'))).toBe(true);
        });
    });

    describe('Version Management', () => {
        test('should create version snapshots', async () => {
            const docData = {
                success: true,
                data: { test: 'documentation' },
                metadata: { generated_at: new Date().toISOString() }
            };
            
            const version = await engine.createVersionSnapshot(docData, 'api', {
                description: 'Test version',
                type: 'update'
            });
            
            expect(version.version_id).toBeDefined();
            expect(version.version_id).toMatch(/^[a-f0-9]{8}$/);
            expect(version.timestamp).toBeDefined();
            expect(version.doc_type).toBe('api');
            expect(version.change_info.description).toBe('Test version');
            expect(version.content).toEqual(docData);
        });

        test('should update version index', async () => {
            const docData = { success: true, data: { test: 'data' } };
            const version1 = await engine.createVersionSnapshot(docData, 'test_type', { description: 'First version' });
            const version2 = await engine.createVersionSnapshot(docData, 'test_type', { description: 'Second version' });
            
            // Check that index file exists and contains both versions
            const indexFile = path.join(engine.outputPath, 'versions', 'test_type_index.json');
            const indexContent = await fs.readFile(indexFile, 'utf8');
            const index = JSON.parse(indexContent);
            
            expect(index.versions).toHaveLength(2);
            expect(index.versions[0].version_id).toBe(version2.version_id); // Most recent first
            expect(index.versions[1].version_id).toBe(version1.version_id);
        });

        test('should handle versioning disabled', async () => {
            const noVersionEngine = new DocumentationEngine({
                cachePath: path.join(testDir, 'no-version-cache'),
                outputPath: path.join(testDir, 'no-version-output'),
                versioning: { enabled: false }
            });
            
            const result = await noVersionEngine.createVersionSnapshot({}, 'api');
            expect(result.versioning_disabled).toBe(true);
        });
    });

    describe('Search Functionality', () => {
        beforeEach(async () => {
            // Create test documentation files
            await createTestFile(
                path.join(engine.outputPath, 'test-doc.md'),
                '# Test Documentation\n\nThis is a test document with **important** information about the API.'
            );
            
            await createTestFile(
                path.join(engine.outputPath, 'another-doc.json'),
                JSON.stringify({
                    title: 'API Reference',
                    content: 'This document contains API information and examples.'
                })
            );
        });

        test('should search documentation content', async () => {
            const results = await engine.searchDocumentation('API');
            
            expect(results.success).toBe(true);
            expect(results.query).toBe('API');
            expect(results.results.length).toBeGreaterThan(0);
            expect(results.total_matches).toBeGreaterThan(0);
        });

        test('should return relevant matches with context', async () => {
            const results = await engine.searchDocumentation('important');
            
            expect(results.results.length).toBeGreaterThan(0);
            
            const match = results.results[0];
            expect(match.file).toBeDefined();
            expect(match.matches).toBeDefined();
            expect(match.matches.length).toBeGreaterThan(0);
            expect(match.matches[0].context).toContain('important');
            expect(match.matches[0].line).toBeDefined();
            expect(match.relevance).toBeGreaterThan(0);
        });

        test('should handle case sensitivity option', async () => {
            const caseSensitiveResults = await engine.searchDocumentation('API', { caseSensitive: true });
            const caseInsensitiveResults = await engine.searchDocumentation('api', { caseSensitive: false });
            
            // Case sensitive should find matches for 'API'
            expect(caseSensitiveResults.results.length).toBeGreaterThan(0);
            // Case insensitive should find matches for 'api' (matching 'API')
            expect(caseInsensitiveResults.results.length).toBeGreaterThan(0);
        });

        test('should limit search results', async () => {
            const results = await engine.searchDocumentation('test', { limit: 1 });
            
            expect(results.results.length).toBeLessThanOrEqual(1);
        });
    });

    describe('Documentation Generation Integration', () => {
        test('should reject generation when feature is disabled', async () => {
            mockYamlUtils.loadYaml.mockResolvedValue({
                features: {
                    automated_documentation: { enabled: false }
                }
            });
            
            const sourceInfo = { files: ['test.js'] };
            
            await expect(engine.generateDocumentation('api', sourceInfo))
                .rejects.toThrow('Automated documentation is not enabled');
        });

        test('should reject unsupported documentation types', async () => {
            const sourceInfo = { files: ['test.js'] };
            
            await expect(engine.generateDocumentation('unsupported_type', sourceInfo))
                .rejects.toThrow('Documentation type \'unsupported_type\' is not supported');
        });

        test('should use cache when available', async () => {
            const sourceInfo = { files: ['test.js'] };
            const cacheKey = engine.generateCacheKey(sourceInfo, 'user_guide');
            const cachedData = {
                success: true,
                data: { cached: true },
                timestamp: Date.now()
            };
            
            // Pre-populate cache
            await engine.saveDocumentationToCache(cacheKey, cachedData);
            
            const result = await engine.generateDocumentation('user_guide', sourceInfo);
            
            expect(result).toMatchObject(cachedData);
        });

        test('should generate user guide documentation', async () => {
            const sourceInfo = {
                getting_started: 'Getting started with the system',
                basic_usage: 'How to use basic features',
                advanced_features: 'Advanced feature documentation',
                troubleshooting: 'Common troubleshooting steps'
            };
            
            const result = await engine.generateDocumentation('user_guide', sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.doc_type).toBe('user_guide');
            expect(result.content.data.sections).toHaveLength(4);
            expect(result.validation).toBeDefined();
            expect(result.metadata.generated_at).toBeDefined();
        });

        test('should generate troubleshooting guide', async () => {
            const sourceInfo = {
                common_issues: ['Issue 1', 'Issue 2'],
                solutions: ['Solution 1', 'Solution 2'],
                debugging_steps: ['Step 1', 'Step 2']
            };
            
            const result = await engine.generateDocumentation('troubleshooting', sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.doc_type).toBe('troubleshooting');
            expect(result.content.data.common_issues).toEqual(sourceInfo.common_issues);
            expect(result.content.data.solutions).toEqual(sourceInfo.solutions);
            expect(result.content.data.debugging_steps).toEqual(sourceInfo.debugging_steps);
        });

        test('should create version when versioning is enabled', async () => {
            const sourceInfo = { getting_started: 'Test content' };
            
            const result = await engine.generateDocumentation('user_guide', sourceInfo, {
                changeDescription: 'Test generation'
            });
            
            expect(result.version).toBeDefined();
            expect(result.version.version_id).toBeDefined();
            expect(result.version.change_info.description).toBe('Test generation');
        });
    });

    describe('Statistics and Monitoring', () => {
        test('should calculate documentation statistics', async () => {
            // Create some test files
            await createTestFile(
                path.join(engine.cachePath, 'cache-test.json'),
                JSON.stringify({ test: 'cache data' })
            );
            
            await createTestFile(
                path.join(engine.outputPath, 'output-test.md'),
                '# Test output document'
            );
            
            const stats = await engine.getStatistics();
            
            expect(stats.cache.total_files).toBeGreaterThan(0);
            expect(stats.cache.total_size).toBeGreaterThan(0);
            expect(stats.generated.total_files).toBeGreaterThan(0);
            expect(stats.generated.total_size).toBeGreaterThan(0);
        });

        test('should handle statistics calculation errors gracefully', async () => {
            const badPathEngine = new DocumentationEngine({
                cachePath: '/nonexistent/path',
                outputPath: '/another/nonexistent/path'
            });
            
            const stats = await badPathEngine.getStatistics();
            
            // Should return empty stats without throwing
            expect(stats.cache.total_files).toBe(0);
            expect(stats.generated.total_files).toBe(0);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        test('should handle file system errors gracefully', async () => {
            const sourceInfo = { schemas: ['/nonexistent/schema.json'] };
            
            const result = await engine.generateDataDictionary(sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.data.schemas).toHaveLength(0);
        });

        test('should handle malformed JSON files', async () => {
            const badJsonFile = path.join(testDir, 'bad.json');
            await createTestFile(badJsonFile, '{ invalid json content');
            
            const sourceInfo = { configs: [badJsonFile] };
            const result = await engine.generateConfigurationReference(sourceInfo);
            
            expect(result.success).toBe(true);
            expect(result.data.configurations).toHaveLength(0);
        });

        test('should handle search in non-existent directories', async () => {
            const badEngine = new DocumentationEngine({
                outputPath: '/nonexistent/path',
                cachePath: '/another/nonexistent/path'
            });
            
            const results = await badEngine.searchDocumentation('test');
            
            expect(results.success).toBe(true);
            expect(results.results).toHaveLength(0);
            expect(results.total_matches).toBe(0);
        });

        test('should handle cache corruption gracefully', async () => {
            const cacheKey = 'corrupted-cache';
            const corruptedCache = path.join(engine.cachePath, `${cacheKey}.json`);
            
            await createTestFile(corruptedCache, 'invalid json');
            
            const result = await engine.getCachedDocumentation(cacheKey);
            expect(result).toBeNull();
        });
    });

    describe('Integration with BMad Patterns', () => {
        test('should log security events for documentation operations', async () => {
            const { securityLogger } = require('../../tools/lib/security-logger');
            const sourceInfo = { getting_started: 'Test' };
            
            await engine.generateDocumentation('user_guide', sourceInfo);
            
            expect(securityLogger.logDataOperation).toHaveBeenCalledWith({
                operation: 'documentation_generation',
                doc_type: 'user_guide',
                source: 'unknown',
                user: expect.any(String),
                timestamp: expect.any(String)
            });
        });

        test('should use BMad YAML utilities for configuration loading', async () => {
            await engine.isEnabled();
            
            expect(mockYamlUtils.loadYaml).toHaveBeenCalledWith(
                expect.stringContaining('config/feature-flags.yaml')
            );
        });

        test('should follow BMad error handling patterns', async () => {
            // Test that errors are handled gracefully without crashing
            const sourceInfo = { files: ['nonexistent.js'] };
            
            // This should not throw but return error information
            const result = await engine.generateDocumentation('api', sourceInfo);
            
            if (!result.success) {
                expect(result.error).toBeDefined();
                expect(result.metadata).toBeDefined();
            }
        });
    });
});