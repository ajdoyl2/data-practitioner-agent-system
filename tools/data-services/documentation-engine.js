#!/usr/bin/env node

/**
 * Documentation Engine for BMad Data Practitioner
 * Automated documentation generation, validation, versioning, and publishing
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const { securityLogger } = require('../../bmad-method/tools/lib/security-logger');
const crypto = require('crypto');

class DocumentationEngine {
    constructor(options = {}) {
        this.pythonPath = options.pythonPath || 'python3';
        this.timeout = options.timeout || 300000; // 5 minutes default
        this.cachePath = options.cachePath || path.join(process.cwd(), '.cache', 'documentation');
        this.outputPath = options.outputPath || path.join(process.cwd(), 'docs', 'generated');
        this.templatesPath = options.templatesPath || path.join(process.cwd(), 'expansion-packs', 'bmad-data-practitioner', 'templates');
        this.featureFlag = 'automated_documentation';
        
        // Documentation types and their configurations
        this.docTypes = {
            api: {
                enabled: true,
                parser: 'jsdoc',
                outputFormat: 'markdown',
                template: 'api-reference.md.template'
            },
            data_dictionary: {
                enabled: true,
                parser: 'schema',
                outputFormat: 'markdown',
                template: 'data-dictionary.md.template'
            },
            pipeline: {
                enabled: true,
                parser: 'workflow',
                outputFormat: 'markdown',
                template: 'pipeline-documentation.md.template'
            },
            configuration: {
                enabled: true,
                parser: 'yaml',
                outputFormat: 'markdown',
                template: 'configuration-reference.md.template'
            },
            user_guide: {
                enabled: true,
                parser: 'template',
                outputFormat: 'markdown',
                template: 'user-guide.md.template'
            },
            troubleshooting: {
                enabled: true,
                parser: 'knowledge_base',
                outputFormat: 'markdown',
                template: 'troubleshooting-guide.md.template'
            }
        };

        // Documentation quality standards
        this.qualityStandards = {
            completeness: {
                minimum_coverage: 80, // Percentage
                required_sections: ['overview', 'usage', 'examples'],
                api_coverage: 90
            },
            accuracy: {
                test_examples: true,
                validate_links: true,
                version_sync: true
            },
            accessibility: {
                wcag_compliance: 'AA',
                alt_text_required: true,
                heading_structure: true
            }
        };

        // Version tracking configuration
        this.versioning = {
            enabled: true,
            git_integration: true,
            change_detection: true,
            approval_required: false
        };

        // Initialize directories
        this.initializeDirectories();
    }

    /**
     * Initialize required directories
     */
    async initializeDirectories() {
        try {
            await fs.mkdir(this.cachePath, { recursive: true });
            await fs.mkdir(this.outputPath, { recursive: true });
            await fs.mkdir(path.join(this.outputPath, 'versions'), { recursive: true });
        } catch (error) {
            console.error('Failed to create documentation directories:', error.message);
        }
    }

    /**
     * Check if automated documentation feature is enabled
     */
    async isEnabled() {
        try {
            const configPath = path.join(process.cwd(), 'bmad-method', 'config', 'feature-flags.yaml');
            const { loadYaml } = require('../../bmad-method/tools/lib/yaml-utils');
            const config = await loadYaml(configPath);
            return config.features && config.features[this.featureFlag] && config.features[this.featureFlag].enabled === true;
        } catch (error) {
            console.warn('Feature flags not configured, automated documentation disabled by default');
            return false;
        }
    }

    /**
     * Generate cache key for documentation source
     */
    generateCacheKey(sourceInfo, docType) {
        const hash = crypto.createHash('md5');
        hash.update(JSON.stringify(sourceInfo) + docType + JSON.stringify(this.docTypes[docType]));
        return hash.digest('hex');
    }

    /**
     * Check if cached documentation exists and is valid
     */
    async getCachedDocumentation(cacheKey) {
        try {
            const cachedDocPath = path.join(this.cachePath, `${cacheKey}.json`);
            const cachedDoc = JSON.parse(await fs.readFile(cachedDocPath, 'utf8'));
            
            // Check if cache is still valid (1 hour for development, 24 hours for production)
            const cacheAge = Date.now() - cachedDoc.timestamp;
            const maxCacheAge = process.env.NODE_ENV === 'production' ? 24 * 60 * 60 * 1000 : 60 * 60 * 1000;
            
            if (cacheAge < maxCacheAge) {
                console.log(chalk.green('📚 Using cached documentation'));
                return cachedDoc;
            }
        } catch (error) {
            // Cache miss or invalid cache
            return null;
        }
        
        return null;
    }

    /**
     * Save documentation to cache
     */
    async saveDocumentationToCache(cacheKey, docData) {
        try {
            const cacheFile = path.join(this.cachePath, `${cacheKey}.json`);
            const cacheData = {
                ...docData,
                timestamp: Date.now()
            };
            await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.warn('Failed to save documentation to cache:', error.message);
        }
    }

    /**
     * Parse source code for API documentation
     */
    async parseAPIDocumentation(sourceInfo) {
        console.log(chalk.yellow('📖 Parsing API documentation...'));
        
        const parsers = {
            jsdoc: async () => {
                // Use JSDoc for JavaScript/TypeScript files
                const jsdocPath = path.join(process.cwd(), 'node_modules', '.bin', 'jsdoc');
                
                return new Promise((resolve, reject) => {
                    const jsdocProcess = spawn('node', [jsdocPath, '-c', path.join(this.templatesPath, 'jsdoc.json'), '-d', 'console', ...sourceInfo.files], {
                        timeout: this.timeout
                    });
                    
                    let stdout = '';
                    let stderr = '';
                    
                    jsdocProcess.stdout.on('data', (data) => stdout += data.toString());
                    jsdocProcess.stderr.on('data', (data) => stderr += data.toString());
                    
                    jsdocProcess.on('close', (code) => {
                        if (code === 0) {
                            try {
                                const parsed = JSON.parse(stdout);
                                resolve({
                                    success: true,
                                    data: parsed,
                                    metadata: {
                                        parser: 'jsdoc',
                                        files_processed: sourceInfo.files.length
                                    }
                                });
                            } catch (parseError) {
                                resolve({
                                    success: true,
                                    data: { raw_output: stdout },
                                    metadata: {
                                        parser: 'jsdoc',
                                        files_processed: sourceInfo.files.length,
                                        warning: 'JSON parsing failed, using raw output'
                                    }
                                });
                            }
                        } else {
                            reject(new Error(`JSDoc failed with code ${code}: ${stderr}`));
                        }
                    });
                    
                    jsdocProcess.on('error', reject);
                });
            }
        };
        
        const parser = parsers[sourceInfo.parser] || parsers.jsdoc;
        return await parser();
    }

    /**
     * Generate data dictionary from schemas
     */
    async generateDataDictionary(sourceInfo) {
        console.log(chalk.yellow('📊 Generating data dictionary...'));
        
        const schemas = [];
        
        for (const schemaPath of sourceInfo.schemas) {
            try {
                const schemaContent = await fs.readFile(schemaPath, 'utf8');
                const schema = JSON.parse(schemaContent);
                
                schemas.push({
                    source: schemaPath,
                    schema: schema,
                    tables: this.extractTableDefinitions(schema),
                    relationships: this.extractRelationships(schema)
                });
            } catch (error) {
                console.warn(`Failed to parse schema ${schemaPath}: ${error.message}`);
            }
        }
        
        return {
            success: true,
            data: {
                schemas: schemas,
                summary: {
                    total_schemas: schemas.length,
                    total_tables: schemas.reduce((sum, s) => sum + s.tables.length, 0),
                    total_relationships: schemas.reduce((sum, s) => sum + s.relationships.length, 0)
                }
            },
            metadata: {
                generator: 'data_dictionary',
                generated_at: new Date().toISOString()
            }
        };
    }

    /**
     * Extract table definitions from schema
     */
    extractTableDefinitions(schema) {
        const tables = [];
        
        if (schema.tables) {
            for (const [tableName, tableSchema] of Object.entries(schema.tables)) {
                tables.push({
                    name: tableName,
                    description: tableSchema.description || '',
                    columns: this.extractColumnDefinitions(tableSchema.columns || {}),
                    indexes: tableSchema.indexes || [],
                    constraints: tableSchema.constraints || []
                });
            }
        }
        
        return tables;
    }

    /**
     * Extract column definitions
     */
    extractColumnDefinitions(columns) {
        return Object.entries(columns).map(([columnName, columnSchema]) => ({
            name: columnName,
            type: columnSchema.type || 'unknown',
            description: columnSchema.description || '',
            nullable: columnSchema.nullable !== false,
            primary_key: columnSchema.primary_key || false,
            foreign_key: columnSchema.foreign_key || null,
            default_value: columnSchema.default || null,
            constraints: columnSchema.constraints || []
        }));
    }

    /**
     * Extract relationships from schema
     */
    extractRelationships(schema) {
        const relationships = [];
        
        if (schema.relationships) {
            for (const relationship of schema.relationships) {
                relationships.push({
                    type: relationship.type || 'unknown',
                    from_table: relationship.from_table,
                    from_column: relationship.from_column,
                    to_table: relationship.to_table,
                    to_column: relationship.to_column,
                    description: relationship.description || ''
                });
            }
        }
        
        return relationships;
    }

    /**
     * Generate pipeline documentation
     */
    async generatePipelineDocumentation(sourceInfo) {
        console.log(chalk.yellow('🔧 Generating pipeline documentation...'));
        
        const pipelines = [];
        
        for (const pipelinePath of sourceInfo.pipelines) {
            try {
                const pipelineContent = await fs.readFile(pipelinePath, 'utf8');
                let pipelineData;
                
                if (pipelinePath.endsWith('.yaml') || pipelinePath.endsWith('.yml')) {
                    const { loadYaml } = require('../../bmad-method/tools/lib/yaml-utils');
                    pipelineData = await loadYaml(pipelinePath);
                } else if (pipelinePath.endsWith('.json')) {
                    pipelineData = JSON.parse(pipelineContent);
                } else {
                    // Try to parse as code and extract pipeline definitions
                    pipelineData = this.extractPipelineFromCode(pipelineContent);
                }
                
                pipelines.push({
                    source: pipelinePath,
                    pipeline: pipelineData,
                    stages: this.extractPipelineStages(pipelineData),
                    dependencies: this.extractPipelineDependencies(pipelineData),
                    flow_diagram: this.generateFlowDiagram(pipelineData)
                });
            } catch (error) {
                console.warn(`Failed to parse pipeline ${pipelinePath}: ${error.message}`);
            }
        }
        
        return {
            success: true,
            data: {
                pipelines: pipelines,
                summary: {
                    total_pipelines: pipelines.length,
                    total_stages: pipelines.reduce((sum, p) => sum + p.stages.length, 0),
                    total_dependencies: pipelines.reduce((sum, p) => sum + p.dependencies.length, 0)
                }
            },
            metadata: {
                generator: 'pipeline_documentation',
                generated_at: new Date().toISOString()
            }
        };
    }

    /**
     * Extract pipeline stages
     */
    extractPipelineStages(pipelineData) {
        const stages = [];
        
        if (pipelineData.stages) {
            for (const stage of pipelineData.stages) {
                stages.push({
                    name: stage.name || 'unnamed_stage',
                    description: stage.description || '',
                    type: stage.type || 'unknown',
                    inputs: stage.inputs || [],
                    outputs: stage.outputs || [],
                    configuration: stage.config || {}
                });
            }
        }
        
        return stages;
    }

    /**
     * Extract pipeline dependencies
     */
    extractPipelineDependencies(pipelineData) {
        const dependencies = [];
        
        if (pipelineData.dependencies) {
            for (const dep of pipelineData.dependencies) {
                dependencies.push({
                    type: dep.type || 'unknown',
                    source: dep.source,
                    target: dep.target,
                    condition: dep.condition || null
                });
            }
        }
        
        return dependencies;
    }

    /**
     * Generate flow diagram representation
     */
    generateFlowDiagram(pipelineData) {
        // Generate Mermaid diagram syntax for visual representation
        const stages = this.extractPipelineStages(pipelineData);
        const dependencies = this.extractPipelineDependencies(pipelineData);
        
        let diagram = 'graph TD\n';
        
        // Add nodes
        for (const stage of stages) {
            const stageId = stage.name.replace(/[^a-zA-Z0-9]/g, '_');
            diagram += `    ${stageId}[${stage.name}]\n`;
        }
        
        // Add edges
        for (const dep of dependencies) {
            const sourceId = dep.source.replace(/[^a-zA-Z0-9]/g, '_');
            const targetId = dep.target.replace(/[^a-zA-Z0-9]/g, '_');
            diagram += `    ${sourceId} --> ${targetId}\n`;
        }
        
        return diagram;
    }

    /**
     * Extract pipeline information from code
     */
    extractPipelineFromCode(codeContent) {
        // Simple regex-based extraction for common pipeline patterns
        // This could be enhanced with AST parsing for more accuracy
        
        const pipeline = {
            name: 'extracted_pipeline',
            stages: [],
            dependencies: []
        };
        
        // Look for common pipeline patterns
        const stagePatterns = [
            /def\s+(\w+_stage)\s*\([^)]*\):/g,
            /function\s+(\w+Stage)\s*\([^)]*\)/g,
            /const\s+(\w+Stage)\s*=/g
        ];
        
        for (const pattern of stagePatterns) {
            let match;
            while ((match = pattern.exec(codeContent)) !== null) {
                pipeline.stages.push({
                    name: match[1],
                    type: 'extracted',
                    description: `Extracted from code: ${match[0]}`
                });
            }
        }
        
        return pipeline;
    }

    /**
     * Validate documentation completeness
     */
    async validateCompleteness(docData, docType) {
        const standards = this.qualityStandards.completeness;
        const validation = {
            score: 0,
            issues: [],
            recommendations: []
        };
        
        // Check required sections
        const requiredSections = standards.required_sections;
        let sectionsFound = 0;
        
        for (const section of requiredSections) {
            if (this.hasSectionContent(docData, section)) {
                sectionsFound++;
            } else {
                validation.issues.push(`Missing required section: ${section}`);
                validation.recommendations.push(`Add ${section} section with comprehensive content`);
            }
        }
        
        validation.score = Math.round((sectionsFound / requiredSections.length) * 100);
        
        // Type-specific validation
        if (docType === 'api') {
            const apiValidation = this.validateAPIDocumentation(docData);
            validation.score = Math.min(validation.score, apiValidation.score);
            validation.issues.push(...apiValidation.issues);
            validation.recommendations.push(...apiValidation.recommendations);
        }
        
        return validation;
    }

    /**
     * Check if documentation has content for a section
     */
    hasSectionContent(docData, section) {
        if (!docData.data) return false;
        
        // Look for section in various formats
        const sectionPatterns = [
            section,
            section.replace('_', ' '),
            section.charAt(0).toUpperCase() + section.slice(1),
            section.toUpperCase()
        ];
        
        for (const pattern of sectionPatterns) {
            if (docData.data[pattern] && docData.data[pattern].length > 0) {
                return true;
            }
        }
        
        return false;
    }

    /**
     * Validate API documentation specifically
     */
    validateAPIDocumentation(docData) {
        const validation = {
            score: 100,
            issues: [],
            recommendations: []
        };
        
        if (!docData.data) {
            validation.score = 0;
            validation.issues.push('No API documentation data found');
            return validation;
        }
        
        // Check for function documentation coverage
        const functions = docData.data.functions || [];
        let documentedFunctions = 0;
        
        for (const func of functions) {
            if (func.description && func.params && func.returns) {
                documentedFunctions++;
            } else {
                validation.issues.push(`Function ${func.name || 'unnamed'} is missing documentation`);
            }
        }
        
        if (functions.length > 0) {
            const coverage = (documentedFunctions / functions.length) * 100;
            validation.score = Math.min(validation.score, Math.round(coverage));
            
            if (coverage < this.qualityStandards.completeness.api_coverage) {
                validation.recommendations.push(`Improve API documentation coverage from ${Math.round(coverage)}% to ${this.qualityStandards.completeness.api_coverage}%`);
            }
        }
        
        return validation;
    }

    /**
     * Create version snapshot of documentation
     */
    async createVersionSnapshot(docData, docType, changeInfo = {}) {
        if (!this.versioning.enabled) {
            return { versioning_disabled: true };
        }
        
        const timestamp = new Date().toISOString();
        const version = {
            version_id: crypto.createHash('md5').update(JSON.stringify(docData) + timestamp).digest('hex').substring(0, 8),
            timestamp: timestamp,
            doc_type: docType,
            change_info: {
                author: process.env.USER || 'system',
                description: changeInfo.description || 'Automated documentation update',
                change_type: changeInfo.type || 'update',
                ...changeInfo
            },
            content: docData,
            metadata: {
                size: JSON.stringify(docData).length,
                quality_score: changeInfo.quality_score || null
            }
        };
        
        try {
            const versionFile = path.join(this.outputPath, 'versions', `${docType}_${version.version_id}.json`);
            await fs.writeFile(versionFile, JSON.stringify(version, null, 2));
            
            // Update version index
            await this.updateVersionIndex(docType, version);
            
            console.log(chalk.green(`📋 Created documentation version: ${version.version_id}`));
            return version;
        } catch (error) {
            console.error('Failed to create version snapshot:', error.message);
            return { error: error.message };
        }
    }

    /**
     * Update version index for a document type
     */
    async updateVersionIndex(docType, newVersion) {
        try {
            const indexFile = path.join(this.outputPath, 'versions', `${docType}_index.json`);
            let index = { versions: [] };
            
            try {
                const existingIndex = await fs.readFile(indexFile, 'utf8');
                index = JSON.parse(existingIndex);
            } catch (readError) {
                // Index doesn't exist yet, start fresh
            }
            
            // Add new version to index
            index.versions.unshift({
                version_id: newVersion.version_id,
                timestamp: newVersion.timestamp,
                author: newVersion.change_info.author,
                description: newVersion.change_info.description,
                change_type: newVersion.change_info.change_type,
                size: newVersion.metadata.size,
                quality_score: newVersion.metadata.quality_score
            });
            
            // Keep only the last 50 versions in the index
            index.versions = index.versions.slice(0, 50);
            
            await fs.writeFile(indexFile, JSON.stringify(index, null, 2));
        } catch (error) {
            console.warn('Failed to update version index:', error.message);
        }
    }

    /**
     * Generate documentation of specified type
     */
    async generateDocumentation(docType, sourceInfo, options = {}) {
        // Check feature flag
        if (!await this.isEnabled()) {
            throw new Error('Automated documentation is not enabled. Enable feature flag: automated_documentation');
        }
        
        if (!this.docTypes[docType] || !this.docTypes[docType].enabled) {
            throw new Error(`Documentation type '${docType}' is not supported or disabled`);
        }
        
        console.log(chalk.blue(`📚 Generating ${docType} documentation...`));
        
        // Log security event
        securityLogger.logDataOperation({
            operation: 'documentation_generation',
            doc_type: docType,
            source: sourceInfo.source || 'unknown',
            user: process.env.USER || 'unknown',
            timestamp: new Date().toISOString()
        });
        
        const cacheKey = this.generateCacheKey(sourceInfo, docType);
        
        // Check cache first
        if (!options.forceRefresh) {
            const cachedDoc = await this.getCachedDocumentation(cacheKey);
            if (cachedDoc) {
                return cachedDoc;
            }
        }
        
        let docData;
        const startTime = Date.now();
        
        try {
            // Generate documentation based on type
            switch (docType) {
                case 'api':
                    docData = await this.parseAPIDocumentation(sourceInfo);
                    break;
                case 'data_dictionary':
                    docData = await this.generateDataDictionary(sourceInfo);
                    break;
                case 'pipeline':
                    docData = await this.generatePipelineDocumentation(sourceInfo);
                    break;
                case 'configuration':
                    docData = await this.generateConfigurationReference(sourceInfo);
                    break;
                case 'user_guide':
                    docData = await this.generateUserGuide(sourceInfo);
                    break;
                case 'troubleshooting':
                    docData = await this.generateTroubleshootingGuide(sourceInfo);
                    break;
                default:
                    throw new Error(`Unsupported documentation type: ${docType}`);
            }
            
            // Validate completeness
            const validation = await this.validateCompleteness(docData, docType);
            
            // Create comprehensive result
            const result = {
                success: true,
                doc_type: docType,
                content: docData,
                validation: validation,
                metadata: {
                    generated_at: new Date().toISOString(),
                    generation_time_ms: Date.now() - startTime,
                    cache_key: cacheKey,
                    source_info: sourceInfo,
                    quality_score: validation.score
                }
            };
            
            // Create version snapshot
            if (this.versioning.enabled) {
                const versionInfo = await this.createVersionSnapshot(result, docType, {
                    quality_score: validation.score,
                    description: options.changeDescription || `Generated ${docType} documentation`
                });
                result.version = versionInfo;
            }
            
            // Save to cache
            await this.saveDocumentationToCache(cacheKey, result);
            
            console.log(chalk.green(`✅ ${docType} documentation generated successfully (Quality: ${validation.score}%)`));
            
            if (validation.issues.length > 0) {
                console.warn(chalk.yellow(`⚠️ Quality issues found:`));
                validation.issues.forEach(issue => console.warn(chalk.yellow(`   • ${issue}`)));
            }
            
            return result;
            
        } catch (error) {
            console.error(chalk.red(`❌ Failed to generate ${docType} documentation: ${error.message}`));
            
            const errorResult = {
                success: false,
                doc_type: docType,
                error: error.message,
                metadata: {
                    generated_at: new Date().toISOString(),
                    generation_time_ms: Date.now() - startTime,
                    cache_key: cacheKey,
                    source_info: sourceInfo
                }
            };
            
            return errorResult;
        }
    }

    /**
     * Generate configuration reference documentation
     */
    async generateConfigurationReference(sourceInfo) {
        console.log(chalk.yellow('⚙️ Generating configuration reference...'));
        
        const configs = [];
        
        for (const configPath of sourceInfo.configs) {
            try {
                const configContent = await fs.readFile(configPath, 'utf8');
                let configData;
                
                if (configPath.endsWith('.yaml') || configPath.endsWith('.yml')) {
                    const { loadYaml } = require('../../bmad-method/tools/lib/yaml-utils');
                    configData = await loadYaml(configPath);
                } else if (configPath.endsWith('.json')) {
                    configData = JSON.parse(configContent);
                }
                
                configs.push({
                    source: configPath,
                    config: configData,
                    schema: this.extractConfigSchema(configData),
                    examples: this.extractConfigExamples(configData)
                });
            } catch (error) {
                console.warn(`Failed to parse config ${configPath}: ${error.message}`);
            }
        }
        
        return {
            success: true,
            data: {
                configurations: configs,
                summary: {
                    total_configs: configs.length,
                    total_options: configs.reduce((sum, c) => sum + Object.keys(c.config || {}).length, 0)
                }
            },
            metadata: {
                generator: 'configuration_reference',
                generated_at: new Date().toISOString()
            }
        };
    }

    /**
     * Extract configuration schema
     */
    extractConfigSchema(configData) {
        const schema = {};
        
        const extractTypes = (obj, path = '') => {
            for (const [key, value] of Object.entries(obj || {})) {
                const fullPath = path ? `${path}.${key}` : key;
                
                if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                    extractTypes(value, fullPath);
                } else {
                    schema[fullPath] = {
                        type: Array.isArray(value) ? 'array' : typeof value,
                        example: value,
                        required: true // Could be enhanced with actual schema validation
                    };
                }
            }
        };
        
        extractTypes(configData);
        return schema;
    }

    /**
     * Extract configuration examples
     */
    extractConfigExamples(configData) {
        // Return simplified examples for common configuration patterns
        const examples = {};
        
        for (const [key, value] of Object.entries(configData || {})) {
            if (typeof value !== 'function') {
                examples[key] = value;
            }
        }
        
        return examples;
    }

    /**
     * Generate user guide documentation
     */
    async generateUserGuide(sourceInfo) {
        console.log(chalk.yellow('👥 Generating user guide...'));
        
        // This would typically be template-driven
        const guide = {
            sections: [
                {
                    title: 'Getting Started',
                    content: sourceInfo.getting_started || 'Getting started information not provided'
                },
                {
                    title: 'Basic Usage',
                    content: sourceInfo.basic_usage || 'Basic usage information not provided'
                },
                {
                    title: 'Advanced Features',
                    content: sourceInfo.advanced_features || 'Advanced features information not provided'
                },
                {
                    title: 'Troubleshooting',
                    content: sourceInfo.troubleshooting || 'See troubleshooting guide for detailed information'
                }
            ]
        };
        
        return {
            success: true,
            data: guide,
            metadata: {
                generator: 'user_guide',
                generated_at: new Date().toISOString()
            }
        };
    }

    /**
     * Generate troubleshooting guide
     */
    async generateTroubleshootingGuide(sourceInfo) {
        console.log(chalk.yellow('🔧 Generating troubleshooting guide...'));
        
        const guide = {
            common_issues: sourceInfo.common_issues || [],
            solutions: sourceInfo.solutions || [],
            debugging_steps: sourceInfo.debugging_steps || []
        };
        
        return {
            success: true,
            data: guide,
            metadata: {
                generator: 'troubleshooting_guide',
                generated_at: new Date().toISOString()
            }
        };
    }

    /**
     * Search documentation content
     */
    async searchDocumentation(query, options = {}) {
        console.log(chalk.blue(`🔍 Searching documentation for: "${query}"`));
        
        const searchResults = [];
        const searchPaths = [
            this.outputPath,
            this.cachePath
        ];
        
        for (const searchPath of searchPaths) {
            try {
                const files = await this.getDocumentationFiles(searchPath);
                
                for (const file of files) {
                    try {
                        const content = await fs.readFile(file, 'utf8');
                        const matches = this.findMatches(content, query, options);
                        
                        if (matches.length > 0) {
                            searchResults.push({
                                file: file,
                                matches: matches,
                                relevance: this.calculateRelevance(matches, query)
                            });
                        }
                    } catch (readError) {
                        // Skip files that can't be read
                    }
                }
            } catch (pathError) {
                // Skip paths that don't exist
            }
        }
        
        // Sort by relevance
        searchResults.sort((a, b) => b.relevance - a.relevance);
        
        return {
            success: true,
            query: query,
            results: searchResults.slice(0, options.limit || 10),
            total_matches: searchResults.length,
            metadata: {
                searched_at: new Date().toISOString(),
                search_paths: searchPaths
            }
        };
    }

    /**
     * Get all documentation files in a directory
     */
    async getDocumentationFiles(dirPath) {
        const files = [];
        
        try {
            const entries = await fs.readdir(dirPath, { withFileTypes: true });
            
            for (const entry of entries) {
                const fullPath = path.join(dirPath, entry.name);
                
                if (entry.isDirectory()) {
                    const subFiles = await this.getDocumentationFiles(fullPath);
                    files.push(...subFiles);
                } else if (entry.name.endsWith('.json') || entry.name.endsWith('.md')) {
                    files.push(fullPath);
                }
            }
        } catch (error) {
            // Directory doesn't exist or can't be read
        }
        
        return files;
    }

    /**
     * Find matches in content
     */
    findMatches(content, query, options = {}) {
        const matches = [];
        const caseSensitive = options.caseSensitive || false;
        const searchContent = caseSensitive ? content : content.toLowerCase();
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        
        const regex = new RegExp(searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        let match;
        
        while ((match = regex.exec(searchContent)) !== null) {
            const start = Math.max(0, match.index - 100);
            const end = Math.min(content.length, match.index + query.length + 100);
            const context = content.substring(start, end);
            
            matches.push({
                index: match.index,
                context: context,
                line: this.getLineNumber(content, match.index)
            });
        }
        
        return matches;
    }

    /**
     * Get line number for a character index
     */
    getLineNumber(content, index) {
        return content.substring(0, index).split('\n').length;
    }

    /**
     * Calculate relevance score for search results
     */
    calculateRelevance(matches, query) {
        let score = 0;
        
        for (const match of matches) {
            // Base score for match
            score += 1;
            
            // Bonus for exact matches
            if (match.context.toLowerCase().includes(query.toLowerCase())) {
                score += 2;
            }
            
            // Bonus for matches in headings or important sections
            if (match.context.includes('#') || match.context.includes('**')) {
                score += 1;
            }
        }
        
        return score;
    }

    /**
     * Clean old cache files
     */
    async cleanCache(maxAgeHours = 24) {
        try {
            const files = await fs.readdir(this.cachePath);
            const maxAge = maxAgeHours * 60 * 60 * 1000;
            let cleanedCount = 0;
            
            for (const file of files) {
                const filePath = path.join(this.cachePath, file);
                const stats = await fs.stat(filePath);
                
                if (Date.now() - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                console.log(chalk.green(`🧹 Cleaned ${cleanedCount} old documentation cache files`));
            }
            
        } catch (error) {
            console.warn('Failed to clean documentation cache:', error.message);
        }
    }

    /**
     * Get documentation statistics
     */
    async getStatistics() {
        const stats = {
            cache: {
                total_files: 0,
                total_size: 0
            },
            generated: {
                total_files: 0,
                total_size: 0
            },
            versions: {
                total_versions: 0,
                doc_types: {}
            }
        };
        
        try {
            // Cache statistics
            const cacheFiles = await fs.readdir(this.cachePath);
            stats.cache.total_files = cacheFiles.length;
            
            for (const file of cacheFiles) {
                const filePath = path.join(this.cachePath, file);
                const fileStats = await fs.stat(filePath);
                stats.cache.total_size += fileStats.size;
            }
            
            // Generated documentation statistics
            const generatedFiles = await this.getDocumentationFiles(this.outputPath);
            stats.generated.total_files = generatedFiles.length;
            
            for (const file of generatedFiles) {
                const fileStats = await fs.stat(file);
                stats.generated.total_size += fileStats.size;
            }
            
            // Version statistics
            const versionPath = path.join(this.outputPath, 'versions');
            try {
                const versionFiles = await fs.readdir(versionPath);
                
                for (const file of versionFiles) {
                    if (file.endsWith('_index.json')) {
                        const docType = file.replace('_index.json', '');
                        const indexContent = await fs.readFile(path.join(versionPath, file), 'utf8');
                        const index = JSON.parse(indexContent);
                        
                        stats.versions.doc_types[docType] = index.versions.length;
                        stats.versions.total_versions += index.versions.length;
                    }
                }
            } catch (versionError) {
                // Versions directory doesn't exist yet
            }
            
        } catch (error) {
            console.warn('Failed to calculate documentation statistics:', error.message);
        }
        
        return stats;
    }
}

module.exports = DocumentationEngine;