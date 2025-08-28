const { DocumentationGenerator } = require('../../tools/data-services/documentation-generator');
const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

describe('DocumentationGenerator', () => {
    let docGenerator;
    let testOutputPath;
    let testSourcePaths;
    
    beforeEach(async () => {
        // Create temporary test directories
        testOutputPath = path.join(__dirname, 'temp-docs-output');
        const testSourceDir = path.join(__dirname, 'temp-source');
        
        await fs.mkdir(testOutputPath, { recursive: true });
        await fs.mkdir(testSourceDir, { recursive: true });
        
        testSourcePaths = [path.join(testSourceDir, '**/*.js')];
        
        docGenerator = new DocumentationGenerator({
            outputPath: testOutputPath,
            sourcePaths: testSourcePaths,
            schemaPaths: [path.join(testSourceDir, '**/*.yaml')],
            evidenceIntegration: false // Disable for testing
        });
        
        // Create test source files
        await createTestSourceFiles(testSourceDir);
    });
    
    afterEach(async () => {
        // Clean up test directories
        await cleanupTestDirectories();
    });
    
    async function createTestSourceFiles(sourceDir) {
        // Create test JavaScript file with JSDoc annotations
        const jsContent = `#!/usr/bin/env node

/**
 * Test API Service
 * Provides testing functionality for documentation generation
 */

const fs = require('fs');

/**
 * Main test service class
 * Handles test operations and data management
 */
class TestService {
    /**
     * Create a new test service
     * @param {Object} options - Configuration options
     * @param {string} options.name - Service name
     * @param {number} options.timeout - Timeout in milliseconds
     */
    constructor(options = {}) {
        this.name = options.name || 'test-service';
        this.timeout = options.timeout || 5000;
    }

    /**
     * Process test data
     * @param {Array} data - Input data array
     * @param {Object} config - Processing configuration
     * @returns {Promise<Object>} Processing results
     */
    async processData(data, config) {
        return {
            processed: data.length,
            config: config
        };
    }

    /**
     * Validate input data
     * @param {any} input - Data to validate
     * @returns {boolean} Validation result
     */
    validateData(input) {
        return input !== null && input !== undefined;
    }
}

/**
 * Helper function for data formatting
 * @param {Object} data - Raw data object
 * @returns {string} Formatted data string
 */
function formatData(data) {
    return JSON.stringify(data, null, 2);
}

module.exports = { TestService, formatData };`;
        
        await fs.writeFile(path.join(sourceDir, 'test-service.js'), jsContent);
        
        // Create test YAML schema file
        const schemaContent = {
            description: 'Test schema for documentation generation',
            tables: [
                {
                    name: 'users',
                    description: 'User account information'
                },
                {
                    name: 'orders',
                    description: 'Customer orders'
                }
            ],
            fields: [
                {
                    name: 'user_id',
                    type: 'string',
                    description: 'Unique user identifier'
                },
                {
                    name: 'email',
                    type: 'string',
                    description: 'User email address'
                },
                {
                    name: 'created_at',
                    type: 'timestamp',
                    description: 'Account creation timestamp'
                }
            ]
        };
        
        await fs.writeFile(
            path.join(sourceDir, 'test-schema.yaml'),
            yaml.dump(schemaContent)
        );
    }
    
    async function cleanupTestDirectories() {
        try {
            await fs.rm(testOutputPath, { recursive: true, force: true });
            await fs.rm(path.join(__dirname, 'temp-source'), { recursive: true, force: true });
        } catch (error) {
            // Ignore cleanup errors
        }
    }
    
    describe('Constructor and Initialization', () => {
        test('should initialize with default options', () => {
            const generator = new DocumentationGenerator();
            
            expect(generator.outputPath).toContain('docs/generated');
            expect(generator.generationTypes).toContain('api-docs');
            expect(generator.generationTypes).toContain('data-dictionary');
            expect(generator.evidenceIntegration).toBe(true);
        });
        
        test('should initialize with custom options', async () => {
            const customOutputPath = path.join(__dirname, 'custom-docs-output');
            const customOptions = {
                outputPath: customOutputPath,
                generationTypes: ['api-docs'],
                evidenceIntegration: false
            };
            
            const generator = new DocumentationGenerator(customOptions);
            
            expect(generator.outputPath).toBe(customOutputPath);
            expect(generator.generationTypes).toEqual(['api-docs']);
            expect(generator.evidenceIntegration).toBe(false);
            
            // Clean up
            try {
                await fs.rm(customOutputPath, { recursive: true, force: true });
            } catch (error) {
                // Ignore cleanup errors
            }
        });
        
        test('should create output directory structure', async () => {
            const generator = new DocumentationGenerator({
                outputPath: testOutputPath
            });
            
            await generator.initializeOutputDirectory();
            
            // Check that subdirectories were created
            const subdirs = ['api', 'data-dictionary', 'pipelines', 'configuration', 'user-guides', 'assets'];
            for (const subdir of subdirs) {
                const dirPath = path.join(testOutputPath, subdir);
                const stats = await fs.stat(dirPath);
                expect(stats.isDirectory()).toBe(true);
            }
        });
    });
    
    describe('JSDoc Extraction', () => {
        test('should extract class information from JavaScript files', () => {
            const jsContent = `/**
 * Test class for documentation
 */
class TestClass {
    constructor(options) {
        this.options = options;
    }
    
    async processData(data) {
        return data;
    }
}`;
            
            const result = docGenerator.extractJSDocAnnotations(jsContent, 'test.js');
            
            expect(result.classes).toHaveLength(1);
            expect(result.classes[0].name).toBe('TestClass');
            expect(result.classes[0].methods).toHaveLength(1);
            expect(result.classes[0].methods[0].name).toBe('processData');
            expect(result.classes[0].methods[0].isAsync).toBe(true);
        });
        
        test('should extract function information from JavaScript files', () => {
            const jsContent = `/**
 * Test function
 */
function testFunction(param1, param2) {
    return param1 + param2;
}

async function asyncFunction(data) {
    return await processData(data);
}`;
            
            const result = docGenerator.extractJSDocAnnotations(jsContent, 'test.js');
            
            expect(result.functions).toHaveLength(2);
            expect(result.functions[0].name).toBe('testFunction');
            expect(result.functions[0].parameters).toBe('param1, param2');
            expect(result.functions[1].name).toBe('asyncFunction');
        });
        
        test('should extract file description from JSDoc', () => {
            const jsContent = `/**
 * Test service module
 * Provides testing functionality
 */

class TestService {}`;
            
            const result = docGenerator.extractJSDocAnnotations(jsContent, 'test.js');
            
            expect(result.fileDescription).toBe('Test service module');
        });
    });
    
    describe('Schema Documentation Extraction', () => {
        test('should extract schema information from YAML files', () => {
            const schema = {
                description: 'Test schema',
                tables: [
                    { name: 'users', description: 'User table' },
                    { name: 'orders', description: 'Orders table' }
                ],
                fields: [
                    { name: 'id', type: 'string', description: 'Primary key' },
                    { name: 'name', type: 'string', description: 'User name' }
                ]
            };
            
            const result = docGenerator.extractSchemaDocumentation(schema, 'test-schema.yaml');
            
            expect(result.description).toBe('Test schema');
            expect(result.tables).toHaveLength(2);
            expect(result.fields).toHaveLength(2);
            expect(result.tables[0].name).toBe('users');
            expect(result.fields[0].name).toBe('id');
        });
    });
    
    describe('Mermaid Diagram Generation', () => {
        test('should generate ingestion pipeline diagram', () => {
            const diagram = docGenerator.generateMermaidDiagram('ingestion');
            
            expect(diagram).toContain('graph TD');
            expect(diagram).toContain('Data Sources');
            expect(diagram).toContain('PyAirbyte Connectors');
            expect(diagram).toContain('Data Validation');
        });
        
        test('should generate transformation pipeline diagram', () => {
            const diagram = docGenerator.generateMermaidDiagram('transformation');
            
            expect(diagram).toContain('graph TD');
            expect(diagram).toContain('Raw Data');
            expect(diagram).toContain('Staging Layer');
            expect(diagram).toContain('Data Marts');
        });
        
        test('should generate analytics pipeline diagram', () => {
            const diagram = docGenerator.generateMermaidDiagram('analytics');
            
            expect(diagram).toContain('graph TD');
            expect(diagram).toContain('DuckDB Loading');
            expect(diagram).toContain('Query Execution');
            expect(diagram).toContain('Analysis Engine');
        });
        
        test('should generate publication pipeline diagram', () => {
            const diagram = docGenerator.generateMermaidDiagram('publication');
            
            expect(diagram).toContain('graph TD');
            expect(diagram).toContain('Evidence.dev Templates');
            expect(diagram).toContain('Report Generation');
            expect(diagram).toContain('Static Site Build');
        });
        
        test('should return default diagram for unknown pipeline type', () => {
            const diagram = docGenerator.generateMermaidDiagram('unknown');
            
            expect(diagram).toBe('graph TD\n    A[Start] --> B[End]');
        });
    });
    
    describe('API Documentation Generation', () => {
        test('should generate API documentation from source files', async () => {
            const result = await docGenerator.generateAPIDocumentation();
            
            expect(result.files).toHaveLength(2); // index.md + TestService.md
            
            // Check that API documentation file was created
            const apiDocPath = path.join(testOutputPath, 'api', 'index.md');
            const apiDocContent = await fs.readFile(apiDocPath, 'utf-8');
            
            expect(apiDocContent).toContain('BMad Data Practitioner API Documentation');
            expect(apiDocContent).toContain('test-service');
            expect(apiDocContent).toContain('TestService');
        });
        
        test('should generate individual class documentation', async () => {
            await docGenerator.generateAPIDocumentation();
            
            const classDocPath = path.join(testOutputPath, 'api', 'TestService.md');
            const classDocContent = await fs.readFile(classDocPath, 'utf-8');
            
            expect(classDocContent).toContain('# TestService');
            expect(classDocContent).toContain('## Constructor');
            expect(classDocContent).toContain('## Methods');
            expect(classDocContent).toContain('### processData');
        });
    });
    
    describe('Data Dictionary Generation', () => {
        test('should generate data dictionary from schema files', async () => {
            const result = await docGenerator.generateDataDictionary();
            
            expect(result.files).toHaveLength(1);
            
            // Check that data dictionary file was created
            const dictionaryPath = path.join(testOutputPath, 'data-dictionary', 'index.md');
            const dictionaryContent = await fs.readFile(dictionaryPath, 'utf-8');
            
            expect(dictionaryContent).toContain('BMad Data Practitioner Data Dictionary');
            expect(dictionaryContent).toContain('test-schema');
            expect(dictionaryContent).toContain('users');
            expect(dictionaryContent).toContain('orders');
        });
        
        test('should include field information in data dictionary', async () => {
            await docGenerator.generateDataDictionary();
            
            const dictionaryPath = path.join(testOutputPath, 'data-dictionary', 'index.md');
            const dictionaryContent = await fs.readFile(dictionaryPath, 'utf-8');
            
            expect(dictionaryContent).toContain('user_id');
            expect(dictionaryContent).toContain('email');
            expect(dictionaryContent).toContain('created_at');
            expect(dictionaryContent).toContain('| Field | Type | Description |');
        });
    });
    
    describe('Pipeline Documentation Generation', () => {
        test('should generate pipeline documentation with diagrams', async () => {
            const result = await docGenerator.generatePipelineDocumentation();
            
            expect(result.files).toHaveLength(1);
            
            const pipelinePath = path.join(testOutputPath, 'pipelines', 'index.md');
            const pipelineContent = await fs.readFile(pipelinePath, 'utf-8');
            
            expect(pipelineContent).toContain('BMad Data Practitioner Pipeline Documentation');
            expect(pipelineContent).toContain('Data Ingestion Pipeline');
            expect(pipelineContent).toContain('Data Transformation Pipeline');
            expect(pipelineContent).toContain('Analytics Pipeline');
            expect(pipelineContent).toContain('Publication Pipeline');
            expect(pipelineContent).toContain('```mermaid');
        });
    });
    
    describe('Configuration Documentation Generation', () => {
        test('should generate configuration documentation', async () => {
            const result = await docGenerator.generateConfigurationDocumentation();
            
            expect(result.files).toHaveLength(1);
            
            const configPath = path.join(testOutputPath, 'configuration', 'index.md');
            const configContent = await fs.readFile(configPath, 'utf-8');
            
            expect(configContent).toContain('BMad Data Practitioner Configuration Reference');
            expect(configContent).toContain('Core Configuration');
            expect(configContent).toContain('Data Services Configuration');
            expect(configContent).toContain('Agent Configuration');
        });
    });
    
    describe('User Guide Generation', () => {
        test('should generate user guides with proper structure', async () => {
            const result = await docGenerator.generateUserGuides();
            
            expect(result.files).toHaveLength(6); // 5 guides + index
            
            // Check individual guide files
            const guideNames = [
                'getting-started.md',
                'data-ingestion.md',
                'data-transformation.md',
                'analytics-workflows.md',
                'publishing-reports.md'
            ];
            
            for (const guideName of guideNames) {
                const guidePath = path.join(testOutputPath, 'user-guides', guideName);
                const guideContent = await fs.readFile(guidePath, 'utf-8');
                
                expect(guideContent).toContain('Table of Contents');
                expect(guideContent).toContain('Overview');
                expect(guideContent).toContain('Steps');
                expect(guideContent).toContain('Examples');
            }
        });
        
        test('should generate user guide index', async () => {
            await docGenerator.generateUserGuides();
            
            const indexPath = path.join(testOutputPath, 'user-guides', 'index.md');
            const indexContent = await fs.readFile(indexPath, 'utf-8');
            
            expect(indexContent).toContain('User Guides');
            expect(indexContent).toContain('Getting Started');
            expect(indexContent).toContain('Data Ingestion Guide');
            expect(indexContent).toContain('Data Transformation Guide');
        });
    });
    
    describe('Evidence.dev Integration', () => {
        test('should generate Evidence.dev template files', async () => {
            // Enable Evidence integration for this test
            docGenerator.evidenceIntegration = true;
            
            await docGenerator.generateEvidenceIntegration();
            
            // Check Evidence sources configuration
            const sourcesPath = path.join(testOutputPath, '..', 'evidence-sources', 'documentation.yaml');
            const sourcesContent = await fs.readFile(sourcesPath, 'utf-8');
            const sourcesConfig = yaml.load(sourcesContent);
            
            expect(sourcesConfig.documentation.type).toBe('markdown');
            expect(sourcesConfig.documentation.path).toBe(testOutputPath);
            
            // Check Evidence page templates
            const pagesPath = path.join(testOutputPath, '..', 'evidence-pages');
            const pageFiles = await fs.readdir(pagesPath);
            
            expect(pageFiles).toContain('api-reference.md');
            expect(pageFiles).toContain('data-dictionary.md');
            expect(pageFiles).toContain('pipeline-overview.md');
        });
    });
    
    describe('Complete Documentation Generation', () => {
        test('should generate all documentation types successfully', async () => {
            const result = await docGenerator.generateAllDocumentation();
            
            expect(result.success).toBe(true);
            expect(result.generated).toHaveLength(docGenerator.generationTypes.length);
            expect(result.errors).toHaveLength(0);
            expect(result.metrics.generatedDocs).toBeGreaterThan(0);
            expect(result.metrics.processingTime).toBeGreaterThan(0);
        });
        
        test('should create documentation index file', async () => {
            await docGenerator.generateAllDocumentation();
            
            const indexPath = path.join(testOutputPath, 'index.md');
            const indexContent = await fs.readFile(indexPath, 'utf-8');
            
            expect(indexContent).toContain('BMad Data Practitioner Documentation');
            expect(indexContent).toContain('API Reference');
            expect(indexContent).toContain('Data Dictionary');
            expect(indexContent).toContain('Pipeline Documentation');
            expect(indexContent).toContain('Configuration Reference');
            expect(indexContent).toContain('User Guides');
            expect(indexContent).toContain('Generation Statistics');
        });
        
        test('should handle errors gracefully during generation', async () => {
            // Create generator with invalid source paths to trigger errors
            const invalidGenerator = new DocumentationGenerator({
                outputPath: testOutputPath,
                sourcePaths: ['/non-existent/path/**/*.js'],
                evidenceIntegration: false
            });
            
            const result = await invalidGenerator.generateAllDocumentation();
            
            // Should still succeed overall but with some errors
            expect(result.success).toBe(true);
            expect(result.generated).toBeDefined();
            // Some operations might still succeed even with invalid paths
        });
    });
    
    describe('Markdown Generation Helpers', () => {
        test('should generate proper API markdown format', () => {
            const mockAPIContent = {
                title: 'Test API Documentation',
                lastUpdated: new Date().toISOString(),
                sections: [
                    {
                        file: 'test-service.js',
                        description: 'Test service implementation',
                        classes: [
                            {
                                name: 'TestService',
                                description: 'Main test service class',
                                constructor: { parameters: 'options = {}' },
                                methods: [
                                    {
                                        name: 'processData',
                                        parameters: 'data, config',
                                        isAsync: true
                                    }
                                ]
                            }
                        ],
                        functions: [
                            {
                                name: 'helperFunction',
                                parameters: 'input',
                                description: 'Helper function'
                            }
                        ]
                    }
                ]
            };
            
            const markdown = docGenerator.generateAPIMarkdown(mockAPIContent);
            
            expect(markdown).toContain('# Test API Documentation');
            expect(markdown).toContain('## Table of Contents');
            expect(markdown).toContain('### Class: TestService');
            expect(markdown).toContain('#### Constructor');
            expect(markdown).toContain('#### Methods');
            expect(markdown).toContain('##### processData');
            expect(markdown).toContain('### Function: helperFunction');
            expect(markdown).toContain('async processData(data, config)');
        });
        
        test('should generate proper data dictionary markdown format', () => {
            const mockDictionaryContent = {
                title: 'Test Data Dictionary',
                lastUpdated: new Date().toISOString(),
                schemas: [
                    {
                        file: 'test-schema.yaml',
                        description: 'Test schema description',
                        tables: [
                            { name: 'users', description: 'User accounts' },
                            { name: 'orders', description: 'Customer orders' }
                        ],
                        fields: [
                            { name: 'user_id', type: 'string', description: 'User identifier' },
                            { name: 'email', type: 'string', description: 'Email address' }
                        ]
                    }
                ]
            };
            
            const markdown = docGenerator.generateDataDictionaryMarkdown(mockDictionaryContent);
            
            expect(markdown).toContain('# Test Data Dictionary');
            expect(markdown).toContain('## test-schema');
            expect(markdown).toContain('### Tables');
            expect(markdown).toContain('**users**: User accounts');
            expect(markdown).toContain('### Fields');
            expect(markdown).toContain('| Field | Type | Description |');
            expect(markdown).toContain('| user_id | string | User identifier |');
        });
    });
    
    describe('Error Handling', () => {
        test('should handle file system errors gracefully', async () => {
            // Create generator with read-only output directory to trigger errors
            const readOnlyPath = path.join(__dirname, 'readonly-output');
            await fs.mkdir(readOnlyPath, { recursive: true });
            await fs.chmod(readOnlyPath, 0o444); // Read-only
            
            const errorGenerator = new DocumentationGenerator({
                outputPath: readOnlyPath,
                evidenceIntegration: false
            });
            
            // Should handle initialization error
            await expect(errorGenerator.initializeOutputDirectory())
                .rejects.toThrow();
            
            // Clean up
            await fs.chmod(readOnlyPath, 0o755);
            await fs.rm(readOnlyPath, { recursive: true, force: true });
        });
        
        test('should handle invalid JSDoc content gracefully', () => {
            const invalidJSContent = `
            // Not valid JSDoc
            function invalidFunction() {
                // Missing JSDoc
            }
            `;
            
            const result = docGenerator.extractJSDocAnnotations(invalidJSContent, 'invalid.js');
            
            expect(result.classes).toHaveLength(0);
            expect(result.functions).toHaveLength(1); // Still finds function
            expect(result.functions[0].name).toBe('invalidFunction');
        });
        
        test('should handle invalid YAML content gracefully', () => {
            const invalidSchema = null;
            
            const result = docGenerator.extractSchemaDocumentation(invalidSchema, 'invalid.yaml');
            
            expect(result.tables).toHaveLength(0);
            expect(result.fields).toHaveLength(0);
            expect(result.description).toBe('');
        });
    });
});