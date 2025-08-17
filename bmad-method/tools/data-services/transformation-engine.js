/**
 * transformation-engine.js
 * TransformationEngine component for dbt-core integration
 * Manages data transformation workflows with security and monitoring
 */

const { DbtWrapper } = require('./dbt-wrapper');
const { logger } = require('../lib/security-logger');
const { authenticateApiKey } = require('./auth-middleware');
const { checkFeatureFlag } = require('../lib/feature-flag-manager');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');

class TransformationEngine {
    constructor(options = {}) {
        this.projectPath = options.projectPath || path.join(process.cwd(), '..', 'bmad-data-practitioner', 'dbt-project');
        this.dbtWrapper = new DbtWrapper(this.projectPath);
        this.initialized = false;
        this.activeJobs = new Map();
        this.jobCounter = 0;
    }

    /**
     * Initialize the transformation engine
     */
    async initialize() {
        try {
            // Check feature flag
            const featureEnabled = await checkFeatureFlag('dbt_transformations');
            if (!featureEnabled) {
                throw new Error('dbt_transformations feature is disabled');
            }

            // Initialize dbt wrapper
            await this.dbtWrapper.initialize();

            // Log initialization
            await logger.logSecurityEvent('transformation_engine_initialization', {
                projectPath: this.projectPath,
                timestamp: new Date().toISOString(),
                userId: process.env.USER || 'unknown'
            });

            this.initialized = true;
            console.log(chalk.green('✓ TransformationEngine initialized successfully'));
            return true;
        } catch (error) {
            console.error(chalk.red('✗ Failed to initialize TransformationEngine:'), error.message);
            throw error;
        }
    }

    /**
     * Authenticate and check permissions
     */
    async authenticate(apiKey) {
        try {
            await authenticateApiKey(apiKey);
            
            await logger.logSecurityEvent('transformation_authentication', {
                timestamp: new Date().toISOString(),
                success: true,
                userId: process.env.USER || 'unknown'
            });
            
            return true;
        } catch (error) {
            await logger.logSecurityEvent('transformation_authentication_failed', {
                timestamp: new Date().toISOString(),
                success: false,
                error: error.message,
                userId: process.env.USER || 'unknown'
            });
            throw error;
        }
    }

    /**
     * Initialize dbt project structure
     */
    async initializeProject(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const jobId = this.generateJobId();
            await this.logTransformationEvent('project_initialization_start', { jobId });

            // Verify project structure exists
            await this.verifyProjectStructure();

            // Initialize dbt project if needed
            const projectStatus = await this.dbtWrapper.getProjectStatus();
            if (!projectStatus.parsed) {
                console.log(chalk.blue('Initializing dbt project...'));
                await this.dbtWrapper.parse({ verbose: true });
            }

            // Validate project configuration
            await this.validateProjectConfiguration();

            await this.logTransformationEvent('project_initialization_complete', { 
                jobId,
                status: 'success'
            });

            return {
                success: true,
                jobId,
                projectPath: this.projectPath,
                status: projectStatus
            };
        } catch (error) {
            await this.logTransformationEvent('project_initialization_failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Execute transformation models
     */
    async runTransformation(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const {
            models = null,
            fullRefresh = false,
            exclude = null,
            apiKey = null,
            dryRun = false
        } = options;

        try {
            // Authenticate if API key provided
            if (apiKey) {
                await this.authenticate(apiKey);
            }

            const jobId = this.generateJobId();
            this.activeJobs.set(jobId, {
                type: 'transformation',
                startTime: new Date(),
                models,
                status: 'running'
            });

            await this.logTransformationEvent('transformation_start', {
                jobId,
                models,
                fullRefresh,
                exclude,
                dryRun
            });

            // Parse models first to check for issues
            console.log(chalk.blue('Parsing dbt models...'));
            await this.dbtWrapper.parse({ verbose: true });

            // Compile models to validate
            console.log(chalk.blue('Compiling dbt models...'));
            await this.dbtWrapper.compile(models, { verbose: true });

            if (!dryRun) {
                // Execute transformation
                console.log(chalk.blue('Running dbt transformation...'));
                const result = await this.dbtWrapper.run(models, {
                    fullRefresh,
                    exclude,
                    verbose: true
                });

                this.activeJobs.get(jobId).status = 'completed';
                
                await this.logTransformationEvent('transformation_complete', {
                    jobId,
                    success: result.success,
                    duration: Date.now() - this.activeJobs.get(jobId).startTime.getTime()
                });

                return {
                    success: true,
                    jobId,
                    result
                };
            } else {
                console.log(chalk.yellow('Dry run completed - no models executed'));
                this.activeJobs.get(jobId).status = 'dry_run_complete';
                
                return {
                    success: true,
                    jobId,
                    dryRun: true,
                    message: 'Validation completed successfully'
                };
            }
        } catch (error) {
            await this.logTransformationEvent('transformation_failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Run tests on transformation models
     */
    async testTransformation(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const { models = null, exclude = null, apiKey = null } = options;

        try {
            if (apiKey) {
                await this.authenticate(apiKey);
            }

            const jobId = this.generateJobId();
            await this.logTransformationEvent('test_start', {
                jobId,
                models,
                exclude
            });

            console.log(chalk.blue('Running dbt tests...'));
            const result = await this.dbtWrapper.test(models, {
                exclude,
                verbose: true
            });

            await this.logTransformationEvent('test_complete', {
                jobId,
                success: result.success
            });

            return {
                success: true,
                jobId,
                result
            };
        } catch (error) {
            await this.logTransformationEvent('test_failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Generate documentation for transformation models
     */
    async generateDocumentation(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        const { apiKey = null } = options;

        try {
            if (apiKey) {
                await this.authenticate(apiKey);
            }

            const jobId = this.generateJobId();
            await this.logTransformationEvent('docs_generation_start', { jobId });

            console.log(chalk.blue('Generating dbt documentation...'));
            const result = await this.dbtWrapper.docs('generate', { verbose: true });

            await this.logTransformationEvent('docs_generation_complete', {
                jobId,
                success: result.success
            });

            return {
                success: true,
                jobId,
                result,
                docsPath: path.join(this.projectPath, 'target', 'index.html')
            };
        } catch (error) {
            await this.logTransformationEvent('docs_generation_failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get model dependency graph
     */
    async getModelDependencies(options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        try {
            const result = await this.dbtWrapper.list(null, {
                output: 'json',
                verbose: false
            });

            if (result.success) {
                const models = JSON.parse(result.stdout);
                return this.buildDependencyGraph(models);
            }

            throw new Error('Failed to retrieve model list');
        } catch (error) {
            await this.logTransformationEvent('dependency_analysis_failed', {
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Get transformation engine status
     */
    async getStatus() {
        try {
            const projectStatus = await this.dbtWrapper.getProjectStatus();
            const featureEnabled = await checkFeatureFlag('dbt_transformations');
            
            return {
                initialized: this.initialized,
                featureEnabled,
                projectPath: this.projectPath,
                projectStatus,
                activeJobs: Array.from(this.activeJobs.entries()).map(([id, job]) => ({
                    id,
                    ...job
                }))
            };
        } catch (error) {
            return {
                initialized: this.initialized,
                error: error.message
            };
        }
    }

    /**
     * Private helper methods
     */

    generateJobId() {
        return `job_${++this.jobCounter}_${Date.now()}`;
    }

    async logTransformationEvent(event, data = {}) {
        await logger.logSecurityEvent(`transformation_${event}`, {
            timestamp: new Date().toISOString(),
            userId: process.env.USER || 'unknown',
            ...data
        });
    }

    async verifyProjectStructure() {
        const requiredFiles = [
            'dbt_project.yml',
            'profiles.yml'
        ];

        const requiredDirs = [
            'models',
            'models/staging',
            'models/intermediate',
            'models/marts',
            'tests',
            'macros'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectPath, file);
            try {
                await fs.access(filePath);
            } catch (error) {
                throw new Error(`Required file ${file} not found in project`);
            }
        }

        for (const dir of requiredDirs) {
            const dirPath = path.join(this.projectPath, dir);
            try {
                const stats = await fs.stat(dirPath);
                if (!stats.isDirectory()) {
                    throw new Error(`${dir} is not a directory`);
                }
            } catch (error) {
                throw new Error(`Required directory ${dir} not found in project`);
            }
        }
    }

    async validateProjectConfiguration() {
        try {
            const debugResult = await this.dbtWrapper.debug({ verbose: false });
            if (!debugResult.success) {
                throw new Error(`dbt project configuration invalid: ${debugResult.stderr}`);
            }
            return true;
        } catch (error) {
            throw new Error(`Project validation failed: ${error.message}`);
        }
    }

    buildDependencyGraph(models) {
        const graph = {
            nodes: [],
            edges: []
        };

        // Build nodes
        models.forEach(model => {
            graph.nodes.push({
                id: model.name,
                type: model.resource_type,
                path: model.path,
                schema: model.schema
            });
        });

        // Build edges from depends_on relationships
        models.forEach(model => {
            if (model.depends_on && model.depends_on.nodes) {
                model.depends_on.nodes.forEach(dependency => {
                    graph.edges.push({
                        from: dependency,
                        to: model.name
                    });
                });
            }
        });

        return graph;
    }
}

module.exports = { TransformationEngine };