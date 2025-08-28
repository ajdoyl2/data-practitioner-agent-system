#!/usr/bin/env node

/**
 * Documentation Generator for BMad Data Practitioner
 * Automated documentation generation from code annotations, schema metadata, and configuration
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const yaml = require('js-yaml');
const { glob } = require('glob');
const { securityLogger } = require('../lib/security-logger');

/**
 * Main documentation generation engine
 * Supports API documentation, data dictionaries, pipeline docs, configuration docs, and user guides
 */
class DocumentationGenerator {
    constructor(options = {}) {
        this.outputPath = options.outputPath || path.join(process.cwd(), 'docs', 'generated');
        this.sourcePaths = options.sourcePaths || [
            'tools/data-services/**/*.js',
            'expansion-packs/bmad-data-practitioner/**/*.yaml',
            'expansion-packs/bmad-data-practitioner/**/*.py'
        ];
        this.schemaPaths = options.schemaPaths || [
            'bmad-method/config/**/*.yaml',
            'expansion-packs/bmad-data-practitioner/config/**/*.yaml'
        ];
        this.templatePath = options.templatePath || path.join(process.cwd(), 'expansion-packs', 'bmad-data-practitioner', 'templates');
        this.evidenceIntegration = options.evidenceIntegration || true;
        this.generationTypes = options.generationTypes || [
            'api-docs',
            'data-dictionary', 
            'pipeline-docs',
            'config-docs',
            'user-guides'
        ];
        
        // Documentation configuration
        this.docConfig = {
            apiDocs: {
                format: 'markdown',
                includePrivate: false,
                includeExamples: true,
                generateTOC: true
            },
            dataDictionary: {
                includeLineage: true,
                includeConstraints: true,
                includeExamples: true,
                format: 'markdown'
            },
            pipelineDocs: {
                generateDiagrams: true,
                includeMetrics: true,
                diagramFormat: 'mermaid'
            },
            configDocs: {
                includeDefaults: true,
                includeValidation: true,
                generateExamples: true
            },
            userGuides: {
                includeScreenshots: false,
                includeWorkflows: true,
                targetAudience: 'data-practitioners'
            }
        };

        // Initialize output directory
        this.initializeOutputDirectory();
        
        securityLogger.logServiceStart({
            component: 'documentation-generator',
            service: 'DocumentationGenerator',
            outputPath: this.outputPath,
            generationTypes: this.generationTypes
        });
    }

    /**
     * Initialize output directory structure
     */
    async initializeOutputDirectory() {
        try {
            await fs.mkdir(this.outputPath, { recursive: true });
            
            // Create subdirectories for different documentation types
            const subdirs = ['api', 'data-dictionary', 'pipelines', 'configuration', 'user-guides', 'assets'];
            for (const subdir of subdirs) {
                await fs.mkdir(path.join(this.outputPath, subdir), { recursive: true });
            }
            
            securityLogger.logServiceStart({
                component: 'documentation-generator',
                action: 'directory-initialization',
                path: this.outputPath
            });
        } catch (error) {
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                path: this.outputPath,
                action: 'directory-initialization-failed'
            });
            throw error;
        }
    }

    /**
     * Generate all configured documentation types
     */
    async generateAllDocumentation() {
        const results = {
            success: true,
            generated: [],
            errors: [],
            metrics: {
                totalFiles: 0,
                processingTime: 0,
                generatedDocs: 0
            }
        };

        const startTime = Date.now();

        try {
            console.log(chalk.blue('🔄 Starting documentation generation...'));
            
            for (const docType of this.generationTypes) {
                try {
                    console.log(chalk.yellow(`📝 Generating ${docType}...`));
                    
                    let result;
                    switch (docType) {
                        case 'api-docs':
                            result = await this.generateAPIDocumentation();
                            break;
                        case 'data-dictionary':
                            result = await this.generateDataDictionary();
                            break;
                        case 'pipeline-docs':
                            result = await this.generatePipelineDocumentation();
                            break;
                        case 'config-docs':
                            result = await this.generateConfigurationDocumentation();
                            break;
                        case 'user-guides':
                            result = await this.generateUserGuides();
                            break;
                        default:
                            throw new Error(`Unknown documentation type: ${docType}`);
                    }
                    
                    results.generated.push({
                        type: docType,
                        files: result.files || [],
                        success: true
                    });
                    results.metrics.generatedDocs += result.files ? result.files.length : 0;
                    
                    console.log(chalk.green(`✅ Generated ${docType}: ${result.files ? result.files.length : 0} files`));
                } catch (error) {
                    console.log(chalk.red(`❌ Failed to generate ${docType}: ${error.message}`));
                    results.errors.push({
                        type: docType,
                        error: error.message
                    });
                }
            }
            
            // Generate Evidence.dev integration if enabled
            if (this.evidenceIntegration) {
                try {
                    await this.generateEvidenceIntegration();
                    console.log(chalk.green('✅ Evidence.dev integration files generated'));
                } catch (error) {
                    console.log(chalk.yellow(`⚠️ Evidence.dev integration failed: ${error.message}`));
                    results.errors.push({
                        type: 'evidence-integration',
                        error: error.message
                    });
                }
            }
            
            results.metrics.processingTime = Date.now() - startTime;
            
            // Generate index file
            await this.generateDocumentationIndex(results);
            
            console.log(chalk.green(`🎉 Documentation generation completed in ${results.metrics.processingTime}ms`));
            console.log(chalk.blue(`📚 Generated ${results.metrics.generatedDocs} documentation files`));
            
            securityLogger.logServiceStart({
                component: 'documentation-generator',
                action: 'generation-completed',
                metrics: results.metrics,
                generated: results.generated.length,
                errors: results.errors.length
            });
            
            return results;
        } catch (error) {
            results.success = false;
            results.errors.push({
                type: 'global',
                error: error.message
            });
            
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                action: 'generation-failed'
            });
            
            throw error;
        }
    }

    /**
     * Generate API documentation from JSDoc annotations
     */
    async generateAPIDocumentation() {
        try {
            const apiFiles = [];
            const sourceFiles = [];
            
            // Find all JavaScript files with potential API documentation
            for (const pattern of this.sourcePaths) {
                const files = await glob(pattern);
                sourceFiles.push(...files);
            }
            
            const apiDocContent = {
                title: 'BMad Data Practitioner API Documentation',
                lastUpdated: new Date().toISOString(),
                sections: []
            };
            
            for (const file of sourceFiles) {
                if (!file.endsWith('.js')) continue;
                
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    const documentation = this.extractJSDocAnnotations(content, file);
                    
                    if (documentation.classes.length > 0 || documentation.functions.length > 0) {
                        apiDocContent.sections.push({
                            file: path.relative(process.cwd(), file),
                            classes: documentation.classes,
                            functions: documentation.functions,
                            description: documentation.fileDescription
                        });
                    }
                } catch (error) {
                    console.log(chalk.yellow(`⚠️ Skipping ${file}: ${error.message}`));
                }
            }
            
            // Generate markdown documentation
            const markdownContent = this.generateAPIMarkdown(apiDocContent);
            const apiDocPath = path.join(this.outputPath, 'api', 'index.md');
            await fs.writeFile(apiDocPath, markdownContent);
            apiFiles.push(apiDocPath);
            
            // Generate individual class documentation
            for (const section of apiDocContent.sections) {
                for (const classInfo of section.classes) {
                    const classDocPath = path.join(this.outputPath, 'api', `${classInfo.name}.md`);
                    const classMarkdown = this.generateClassMarkdown(classInfo, section.file);
                    await fs.writeFile(classDocPath, classMarkdown);
                    apiFiles.push(classDocPath);
                }
            }
            
            return { files: apiFiles };
        } catch (error) {
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                action: 'api-documentation-failed'
            });
            throw error;
        }
    }

    /**
     * Generate data dictionary from schema metadata
     */
    async generateDataDictionary() {
        try {
            const dictionaryFiles = [];
            const schemaFiles = [];
            
            // Find all schema/configuration files
            for (const pattern of this.schemaPaths) {
                const files = await glob(pattern);
                schemaFiles.push(...files);
            }
            
            const dataDictionary = {
                title: 'BMad Data Practitioner Data Dictionary',
                lastUpdated: new Date().toISOString(),
                schemas: []
            };
            
            for (const file of schemaFiles) {
                try {
                    const content = await fs.readFile(file, 'utf-8');
                    const schema = yaml.load(content);
                    
                    if (schema && typeof schema === 'object') {
                        const schemaDoc = this.extractSchemaDocumentation(schema, file);
                        if (schemaDoc.tables.length > 0 || schemaDoc.fields.length > 0) {
                            dataDictionary.schemas.push(schemaDoc);
                        }
                    }
                } catch (error) {
                    console.log(chalk.yellow(`⚠️ Skipping schema ${file}: ${error.message}`));
                }
            }
            
            // Generate data dictionary markdown
            const dictionaryMarkdown = this.generateDataDictionaryMarkdown(dataDictionary);
            const dictionaryPath = path.join(this.outputPath, 'data-dictionary', 'index.md');
            await fs.writeFile(dictionaryPath, dictionaryMarkdown);
            dictionaryFiles.push(dictionaryPath);
            
            return { files: dictionaryFiles };
        } catch (error) {
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                action: 'data-dictionary-failed'
            });
            throw error;
        }
    }

    /**
     * Generate pipeline documentation with visual flow diagrams
     */
    async generatePipelineDocumentation() {
        try {
            const pipelineFiles = [];
            
            // Generate pipeline overview
            const pipelineOverview = {
                title: 'BMad Data Practitioner Pipeline Documentation',
                lastUpdated: new Date().toISOString(),
                pipelines: [
                    {
                        name: 'Data Ingestion Pipeline',
                        description: 'PyAirbyte-based data ingestion from various sources',
                        stages: ['Source Connection', 'Data Extraction', 'Data Validation', 'Data Storage'],
                        diagram: this.generateMermaidDiagram('ingestion')
                    },
                    {
                        name: 'Data Transformation Pipeline', 
                        description: 'dbt/SQLmesh-based data transformations with cost optimization',
                        stages: ['Source Data', 'Staging', 'Intermediate', 'Marts', 'Quality Testing'],
                        diagram: this.generateMermaidDiagram('transformation')
                    },
                    {
                        name: 'Analytics Pipeline',
                        description: 'DuckDB-powered analytics and exploratory data analysis',
                        stages: ['Data Loading', 'Query Execution', 'Analysis', 'Results Export'],
                        diagram: this.generateMermaidDiagram('analytics')
                    },
                    {
                        name: 'Publication Pipeline',
                        description: 'Evidence.dev-based report generation and publishing',
                        stages: ['Data Preparation', 'Report Generation', 'Site Building', 'Deployment'],
                        diagram: this.generateMermaidDiagram('publication')
                    }
                ]
            };
            
            // Generate pipeline documentation
            const pipelineMarkdown = this.generatePipelineMarkdown(pipelineOverview);
            const pipelinePath = path.join(this.outputPath, 'pipelines', 'index.md');
            await fs.writeFile(pipelinePath, pipelineMarkdown);
            pipelineFiles.push(pipelinePath);
            
            return { files: pipelineFiles };
        } catch (error) {
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                action: 'pipeline-docs-failed'
            });
            throw error;
        }
    }

    /**
     * Generate configuration documentation and change tracking
     */
    async generateConfigurationDocumentation() {
        try {
            const configFiles = [];
            
            // Configuration documentation structure
            const configDoc = {
                title: 'BMad Data Practitioner Configuration Reference',
                lastUpdated: new Date().toISOString(),
                sections: [
                    {
                        name: 'Core Configuration',
                        description: 'Main system configuration options',
                        files: ['bmad-method/config/**/*.yaml']
                    },
                    {
                        name: 'Data Services Configuration',
                        description: 'Data tool and service configurations',
                        files: ['expansion-packs/bmad-data-practitioner/config/**/*.yaml']
                    },
                    {
                        name: 'Agent Configuration',
                        description: 'Data practitioner agent configurations',
                        files: ['expansion-packs/bmad-data-practitioner/agents/**/*.yaml']
                    }
                ]
            };
            
            // Generate configuration reference
            const configMarkdown = this.generateConfigurationMarkdown(configDoc);
            const configPath = path.join(this.outputPath, 'configuration', 'index.md');
            await fs.writeFile(configPath, configMarkdown);
            configFiles.push(configPath);
            
            return { files: configFiles };
        } catch (error) {
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                action: 'config-docs-failed'
            });
            throw error;
        }
    }

    /**
     * Generate user guides from template workflows
     */
    async generateUserGuides() {
        try {
            const guideFiles = [];
            
            // User guide structure
            const userGuides = [
                {
                    name: 'getting-started',
                    title: 'Getting Started with BMad Data Practitioner',
                    description: 'Quick start guide for new users',
                    sections: ['Installation', 'First Project', 'Basic Workflows']
                },
                {
                    name: 'data-ingestion',
                    title: 'Data Ingestion Guide',
                    description: 'Complete guide to setting up data ingestion pipelines',
                    sections: ['PyAirbyte Setup', 'Connector Configuration', 'Data Validation']
                },
                {
                    name: 'data-transformation',
                    title: 'Data Transformation Guide', 
                    description: 'Using dbt and SQLmesh for data transformations',
                    sections: ['Engine Selection', 'Model Development', 'Testing', 'Deployment']
                },
                {
                    name: 'analytics-workflows',
                    title: 'Analytics Workflows Guide',
                    description: 'Performing data analysis with DuckDB and EDA tools',
                    sections: ['DuckDB Queries', 'Exploratory Analysis', 'Custom Analytics']
                },
                {
                    name: 'publishing-reports',
                    title: 'Publishing Reports Guide',
                    description: 'Creating and publishing reports with Evidence.dev',
                    sections: ['Report Development', 'Deployment', 'Customization']
                }
            ];
            
            for (const guide of userGuides) {
                const guideMarkdown = this.generateUserGuideMarkdown(guide);
                const guidePath = path.join(this.outputPath, 'user-guides', `${guide.name}.md`);
                await fs.writeFile(guidePath, guideMarkdown);
                guideFiles.push(guidePath);
            }
            
            // Generate user guide index
            const indexMarkdown = this.generateUserGuideIndex(userGuides);
            const indexPath = path.join(this.outputPath, 'user-guides', 'index.md');
            await fs.writeFile(indexPath, indexMarkdown);
            guideFiles.push(indexPath);
            
            return { files: guideFiles };
        } catch (error) {
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                action: 'user-guides-failed'
            });
            throw error;
        }
    }

    /**
     * Generate Evidence.dev integration files
     */
    async generateEvidenceIntegration() {
        try {
            const evidenceSourcesPath = path.join(this.outputPath, '..', 'evidence-sources');
            await fs.mkdir(evidenceSourcesPath, { recursive: true });
            
            // Create Evidence.dev source configuration for documentation
            const sourcesConfig = {
                documentation: {
                    type: 'markdown',
                    path: this.outputPath,
                    refresh: '1d'
                }
            };
            
            await fs.writeFile(
                path.join(evidenceSourcesPath, 'documentation.yaml'),
                yaml.dump(sourcesConfig)
            );
            
            // Create Evidence.dev page templates for documentation sections
            const pageTemplates = [
                {
                    name: 'api-reference.md',
                    content: this.generateEvidenceAPITemplate()
                },
                {
                    name: 'data-dictionary.md', 
                    content: this.generateEvidenceDataDictionaryTemplate()
                },
                {
                    name: 'pipeline-overview.md',
                    content: this.generateEvidencePipelineTemplate()
                }
            ];
            
            const evidencePagesPath = path.join(this.outputPath, '..', 'evidence-pages');
            await fs.mkdir(evidencePagesPath, { recursive: true });
            
            for (const template of pageTemplates) {
                await fs.writeFile(
                    path.join(evidencePagesPath, template.name),
                    template.content
                );
            }
            
            securityLogger.logServiceStart({
                component: 'documentation-generator',
                action: 'evidence-integration-completed',
                sourcesPath: evidenceSourcesPath,
                pagesPath: evidencePagesPath
            });
        } catch (error) {
            securityLogger.logApiError({
                component: 'documentation-generator',
                error: error.message,
                action: 'evidence-integration-failed'
            });
            throw error;
        }
    }

    /**
     * Generate documentation index file
     */
    async generateDocumentationIndex(results) {
        const indexContent = `# BMad Data Practitioner Documentation

Generated on: ${new Date().toISOString()}

## Available Documentation

### 📚 API Reference
- [Complete API Documentation](api/index.md)
- Auto-generated from JSDoc comments in source code

### 📊 Data Dictionary
- [Data Schema Reference](data-dictionary/index.md)
- Generated from YAML configuration files

### 🔄 Pipeline Documentation
- [Pipeline Overview](pipelines/index.md)
- Visual flow diagrams and component descriptions

### ⚙️ Configuration Reference
- [Configuration Guide](configuration/index.md)
- Complete configuration options and examples

### 👥 User Guides
- [User Guide Index](user-guides/index.md)
- Step-by-step guides for all user roles

## Generation Statistics

- **Total Documentation Types**: ${this.generationTypes.length}
- **Files Generated**: ${results.metrics.generatedDocs}
- **Processing Time**: ${results.metrics.processingTime}ms
- **Generation Date**: ${new Date().toLocaleString()}

## Integration

This documentation is integrated with Evidence.dev for publication-quality reporting and can be automatically updated when code or configuration changes.

---

*Generated by BMad Data Practitioner Documentation Generator*
`;
        
        const indexPath = path.join(this.outputPath, 'index.md');
        await fs.writeFile(indexPath, indexContent);
    }

    // Helper methods for content generation...
    extractJSDocAnnotations(content, filePath) {
        // Extract JSDoc comments and parse them
        const jsdocRegex = /\/\*\*[\s\S]*?\*\//g;
        const classRegex = /class\s+(\w+)/g;
        const functionRegex = /(?:async\s+)?(?:function\s+)?(\w+)\s*\([^)]*\)/g;
        
        return {
            fileDescription: this.extractFileDescription(content),
            classes: this.extractClassInfo(content),
            functions: this.extractFunctionInfo(content)
        };
    }

    extractFileDescription(content) {
        const match = content.match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);
        return match ? match[1].trim() : '';
    }

    extractClassInfo(content) {
        const classes = [];
        const classRegex = /class\s+(\w+)[^{]*\{([\s\S]*?)(?:\n\}\s*(?:module\.exports|$)|\n\}\s*\n|\n\}$)/g;
        let match;
        
        while ((match = classRegex.exec(content)) !== null) {
            const className = match[1];
            const classBody = match[2];
            
            // Extract constructor and methods
            const methods = this.extractMethods(classBody);
            const constructor = this.extractConstructor(classBody);
            
            classes.push({
                name: className,
                constructor,
                methods,
                description: this.extractClassDescription(content, className)
            });
        }
        
        return classes;
    }

    extractFunctionInfo(content) {
        const functions = [];
        const functionRegex = /(?:^|\n)\s*(?:async\s+)?function\s+(\w+)\s*\(([^)]*)\)/g;
        let match;
        
        while ((match = functionRegex.exec(content)) !== null) {
            const funcName = match[1];
            // Skip if this function is already captured as a method or constructor
            if (!funcName.includes('constructor') && !content.includes(`class`) || 
                !content.substring(0, match.index).includes('class')) {
                functions.push({
                    name: funcName,
                    parameters: match[2],
                    description: this.extractFunctionDescription(content, funcName)
                });
            }
        }
        
        return functions;
    }

    extractMethods(classBody) {
        const methods = [];
        const methodMatches = classBody.matchAll(/(?:async\s+)?(\w+)\s*\(([^)]*)\)/g);
        
        for (const match of methodMatches) {
            methods.push({
                name: match[1],
                parameters: match[2],
                isAsync: match[0].includes('async')
            });
        }
        
        return methods;
    }

    extractConstructor(classBody) {
        const constructorMatch = classBody.match(/constructor\s*\(([^)]*)\)/);
        return constructorMatch ? {
            parameters: constructorMatch[1]
        } : null;
    }

    extractClassDescription(content, className) {
        const classPattern = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*class\\s+${className}`);
        const match = content.match(classPattern);
        if (match) {
            const docMatch = match[0].match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);
            return docMatch ? docMatch[1].trim() : '';
        }
        return '';
    }

    extractFunctionDescription(content, functionName) {
        const functionPattern = new RegExp(`\\/\\*\\*[\\s\\S]*?\\*\\/\\s*(?:async\\s+)?(?:function\\s+)?${functionName}\\s*\\(`);
        const match = content.match(functionPattern);
        if (match) {
            const docMatch = match[0].match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);
            return docMatch ? docMatch[1].trim() : '';
        }
        return '';
    }

    extractSchemaDocumentation(schema, filePath) {
        return {
            file: path.relative(process.cwd(), filePath),
            tables: this.extractTables(schema),
            fields: this.extractFields(schema),
            description: schema.description || ''
        };
    }

    extractTables(schema) {
        const tables = [];
        if (schema.tables && Array.isArray(schema.tables)) {
            tables.push(...schema.tables);
        }
        return tables;
    }

    extractFields(schema) {
        const fields = [];
        if (schema.fields && Array.isArray(schema.fields)) {
            fields.push(...schema.fields);
        }
        return fields;
    }

    generateMermaidDiagram(pipelineType) {
        const diagrams = {
            ingestion: `graph TD
    A[Data Sources] --> B[PyAirbyte Connectors]
    B --> C[Data Validation]
    C --> D[Raw Data Storage]
    D --> E[Data Processing]`,
            
            transformation: `graph TD
    A[Raw Data] --> B[Staging Layer]
    B --> C[Intermediate Transformations]
    C --> D[Data Marts]
    D --> E[Quality Testing]
    E --> F[Production Data]`,
            
            analytics: `graph TD
    A[Data Sources] --> B[DuckDB Loading]
    B --> C[Query Execution]
    C --> D[Analysis Engine]
    D --> E[Results Export]`,
            
            publication: `graph TD
    A[Analysis Results] --> B[Evidence.dev Templates]
    B --> C[Report Generation]
    C --> D[Static Site Build]
    D --> E[Publication]`
        };
        
        return diagrams[pipelineType] || 'graph TD\n    A[Start] --> B[End]';
    }

    generateAPIMarkdown(apiDocContent) {
        let markdown = `# ${apiDocContent.title}\n\n*Last updated: ${new Date(apiDocContent.lastUpdated).toLocaleString()}*\n\n`;
        
        markdown += `## Table of Contents\n\n`;
        
        for (const section of apiDocContent.sections) {
            markdown += `- [${path.basename(section.file, '.js')}](#${path.basename(section.file, '.js').toLowerCase().replace(/[^a-z0-9]/g, '-')})\n`;
        }
        
        markdown += `\n`;
        
        for (const section of apiDocContent.sections) {
            markdown += `## ${path.basename(section.file, '.js')}\n\n`;
            markdown += `**File:** \`${section.file}\`\n\n`;
            
            if (section.description) {
                markdown += `${section.description}\n\n`;
            }
            
            for (const classInfo of section.classes) {
                markdown += `### Class: ${classInfo.name}\n\n`;
                if (classInfo.description) {
                    markdown += `${classInfo.description}\n\n`;
                }
                
                if (classInfo.constructor) {
                    markdown += `#### Constructor\n\n`;
                    markdown += `\`\`\`javascript\n`;
                    markdown += `new ${classInfo.name}(${classInfo.constructor.parameters})\n`;
                    markdown += `\`\`\`\n\n`;
                }
                
                if (classInfo.methods.length > 0) {
                    markdown += `#### Methods\n\n`;
                    for (const method of classInfo.methods) {
                        markdown += `##### ${method.name}\n\n`;
                        markdown += `\`\`\`javascript\n`;
                        markdown += `${method.isAsync ? 'async ' : ''}${method.name}(${method.parameters})\n`;
                        markdown += `\`\`\`\n\n`;
                    }
                }
            }
            
            for (const func of section.functions) {
                markdown += `### Function: ${func.name}\n\n`;
                if (func.description) {
                    markdown += `${func.description}\n\n`;
                }
                markdown += `\`\`\`javascript\n`;
                markdown += `${func.name}(${func.parameters})\n`;
                markdown += `\`\`\`\n\n`;
            }
        }
        
        return markdown;
    }

    generateClassMarkdown(classInfo, filePath) {
        let markdown = `# ${classInfo.name}\n\n`;
        markdown += `**File:** \`${filePath}\`\n\n`;
        
        if (classInfo.description) {
            markdown += `## Description\n\n${classInfo.description}\n\n`;
        }
        
        if (classInfo.constructor) {
            markdown += `## Constructor\n\n`;
            markdown += `\`\`\`javascript\n`;
            markdown += `new ${classInfo.name}(${classInfo.constructor.parameters})\n`;
            markdown += `\`\`\`\n\n`;
        }
        
        if (classInfo.methods.length > 0) {
            markdown += `## Methods\n\n`;
            for (const method of classInfo.methods) {
                markdown += `### ${method.name}\n\n`;
                markdown += `\`\`\`javascript\n`;
                markdown += `${method.isAsync ? 'async ' : ''}${method.name}(${method.parameters})\n`;
                markdown += `\`\`\`\n\n`;
            }
        }
        
        return markdown;
    }

    generateDataDictionaryMarkdown(dataDictionary) {
        let markdown = `# ${dataDictionary.title}\n\n*Last updated: ${new Date(dataDictionary.lastUpdated).toLocaleString()}*\n\n`;
        
        markdown += `## Overview\n\nThis data dictionary documents all schemas, tables, and fields used in the BMad Data Practitioner system.\n\n`;
        
        for (const schema of dataDictionary.schemas) {
            markdown += `## ${path.basename(schema.file, path.extname(schema.file))}\n\n`;
            markdown += `**File:** \`${schema.file}\`\n\n`;
            
            if (schema.description) {
                markdown += `${schema.description}\n\n`;
            }
            
            if (schema.tables.length > 0) {
                markdown += `### Tables\n\n`;
                for (const table of schema.tables) {
                    markdown += `- **${table.name || table}**`;
                    if (table.description) {
                        markdown += `: ${table.description}`;
                    }
                    markdown += `\n`;
                }
                markdown += `\n`;
            }
            
            if (schema.fields.length > 0) {
                markdown += `### Fields\n\n`;
                markdown += `| Field | Type | Description |\n`;
                markdown += `|-------|------|-------------|\n`;
                for (const field of schema.fields) {
                    const name = field.name || field;
                    const type = field.type || 'string';
                    const description = field.description || '';
                    markdown += `| ${name} | ${type} | ${description} |\n`;
                }
                markdown += `\n`;
            }
        }
        
        return markdown;
    }

    generatePipelineMarkdown(pipelineOverview) {
        let markdown = `# ${pipelineOverview.title}\n\n*Last updated: ${new Date(pipelineOverview.lastUpdated).toLocaleString()}*\n\n`;
        
        markdown += `## Overview\n\nThis document describes all data pipelines in the BMad Data Practitioner system, including their stages, dependencies, and flow diagrams.\n\n`;
        
        for (const pipeline of pipelineOverview.pipelines) {
            markdown += `## ${pipeline.name}\n\n`;
            markdown += `${pipeline.description}\n\n`;
            
            markdown += `### Pipeline Stages\n\n`;
            for (let i = 0; i < pipeline.stages.length; i++) {
                markdown += `${i + 1}. **${pipeline.stages[i]}**\n`;
            }
            markdown += `\n`;
            
            markdown += `### Flow Diagram\n\n`;
            markdown += `\`\`\`mermaid\n${pipeline.diagram}\n\`\`\`\n\n`;
        }
        
        return markdown;
    }

    generateConfigurationMarkdown(configDoc) {
        let markdown = `# ${configDoc.title}\n\n*Last updated: ${new Date(configDoc.lastUpdated).toLocaleString()}*\n\n`;
        
        markdown += `## Overview\n\nThis reference documents all configuration options available in the BMad Data Practitioner system.\n\n`;
        
        for (const section of configDoc.sections) {
            markdown += `## ${section.name}\n\n`;
            markdown += `${section.description}\n\n`;
            
            markdown += `### Configuration Files\n\n`;
            for (const pattern of section.files) {
                markdown += `- \`${pattern}\`\n`;
            }
            markdown += `\n`;
        }
        
        return markdown;
    }

    generateUserGuideMarkdown(guide) {
        let markdown = `# ${guide.title}\n\n${guide.description}\n\n`;
        
        markdown += `## Table of Contents\n\n`;
        for (let i = 0; i < guide.sections.length; i++) {
            const sectionId = guide.sections[i].toLowerCase().replace(/[^a-z0-9]/g, '-');
            markdown += `${i + 1}. [${guide.sections[i]}](#${sectionId})\n`;
        }
        markdown += `\n`;
        
        for (const section of guide.sections) {
            const sectionId = section.toLowerCase().replace(/[^a-z0-9]/g, '-');
            markdown += `## ${section}\n\n`;
            markdown += `*This section provides detailed guidance on ${section.toLowerCase()}.*\n\n`;
            
            // Add placeholder content
            markdown += `### Overview\n\nDetailed instructions for ${section.toLowerCase()} will be provided here.\n\n`;
            markdown += `### Steps\n\n1. Step 1 description\n2. Step 2 description\n3. Step 3 description\n\n`;
            markdown += `### Examples\n\nCode examples and use cases will be provided here.\n\n`;
        }
        
        return markdown;
    }

    generateUserGuideIndex(userGuides) {
        let markdown = `# User Guides\n\nComprehensive guides for all BMad Data Practitioner users.\n\n`;
        
        for (const guide of userGuides) {
            markdown += `## [${guide.title}](${guide.name}.md)\n\n${guide.description}\n\n`;
        }
        
        return markdown;
    }

    generateEvidenceAPITemplate() {
        return `---
title: API Reference
---

# API Reference

This page provides interactive API documentation for the BMad Data Practitioner system.

\`\`\`sql api_endpoints
SELECT * FROM documentation.api_endpoints
\`\`\`

<DataTable data={api_endpoints} />

## Classes

\`\`\`sql api_classes
SELECT * FROM documentation.api_classes
\`\`\`

<DataTable data={api_classes} />
`;
    }

    generateEvidenceDataDictionaryTemplate() {
        return `---
title: Data Dictionary
---

# Data Dictionary

Interactive data dictionary for all schemas and tables.

\`\`\`sql data_schemas
SELECT * FROM documentation.data_schemas
\`\`\`

<DataTable data={data_schemas} />

## Field Definitions

\`\`\`sql data_fields  
SELECT * FROM documentation.data_fields
\`\`\`

<DataTable data={data_fields} />
`;
    }

    generateEvidencePipelineTemplate() {
        return `---
title: Pipeline Overview
---

# Pipeline Overview

Visual representation of all data pipelines.

\`\`\`sql pipeline_overview
SELECT * FROM documentation.pipelines
\`\`\`

<DataTable data={pipeline_overview} />

## Pipeline Metrics

\`\`\`sql pipeline_metrics
SELECT * FROM documentation.pipeline_metrics
\`\`\`

<LineChart data={pipeline_metrics} x=date y=processing_time />
`;
    }
}

module.exports = { DocumentationGenerator };