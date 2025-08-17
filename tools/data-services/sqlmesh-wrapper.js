#!/usr/bin/env node

/**
 * SQLmesh Wrapper for BMad Data Practitioner
 * Handles subprocess execution and JSON communication with Python bridge
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const { logger } = require('../logger');
const { securityLogger } = require('../security');
const { loadYaml } = require('../../bmad-method/tools/lib/yaml-utils');

class SQLmeshWrapper {
    constructor(options = {}) {
        this.projectPath = options.projectPath || path.join(process.cwd(), 'bmad-data-practitioner', 'sqlmesh-project');
        this.bridgePath = path.join(process.cwd(), 'bmad-data-practitioner', 'scripts', 'sqlmesh_bridge.py');
        this.pythonPath = options.pythonPath || 'python3';
        this.timeout = options.timeout || 300000; // 5 minutes default
        this.featureFlag = 'sqlmesh_transformations';
    }

    /**
     * Check if SQLmesh feature is enabled
     */
    async isEnabled() {
        try {
            const configPath = path.join(process.cwd(), 'bmad-method', 'config', 'feature-flags.yaml');
            const config = await loadYaml(configPath);
            return config.features && config.features[this.featureFlag] && config.features[this.featureFlag].enabled === true;
        } catch (error) {
            logger.warn('Feature flags not configured, SQLmesh disabled by default');
            return false;
        }
    }

    /**
     * Execute SQLmesh command through Python bridge
     */
    async executeCommand(command, args = [], options = {}) {
        // Check feature flag
        if (!await this.isEnabled()) {
            throw new Error('SQLmesh transformations are not enabled. Enable feature flag: sqlmesh_transformations');
        }

        // Log security event
        securityLogger.logDataOperation({
            operation: 'sqlmesh_command',
            command,
            user: process.env.USER || 'unknown',
            timestamp: new Date().toISOString()
        });

        // Prepare input for Python bridge
        const input = JSON.stringify({
            command,
            args,
            options,
            project_path: this.projectPath
        });

        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonPath, [this.bridgePath, input], {
                timeout: this.timeout,
                env: { ...process.env, SQLMESH_PROJECT_PATH: this.projectPath }
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('error', (error) => {
                logger.error(`SQLmesh bridge error: ${error.message}`);
                reject(new Error(`Failed to execute SQLmesh command: ${error.message}`));
            });

            pythonProcess.on('close', (code) => {
                try {
                    // Parse JSON response from bridge
                    const result = JSON.parse(stdout);
                    
                    if (result.success) {
                        logger.debug(`SQLmesh command successful: ${command}`);
                        resolve(result);
                    } else {
                        logger.error(`SQLmesh command failed: ${result.error || result.stderr}`);
                        reject(new Error(result.error || result.stderr || 'Unknown error'));
                    }
                } catch (parseError) {
                    // If not JSON, return raw output
                    if (code === 0) {
                        resolve({ success: true, stdout, stderr });
                    } else {
                        reject(new Error(`SQLmesh command failed with code ${code}: ${stderr || stdout}`));
                    }
                }
            });
        });
    }

    /**
     * Initialize SQLmesh project
     */
    async init(config = null) {
        logger.info('Initializing SQLmesh project...');
        
        // Ensure project directory exists
        await fs.mkdir(this.projectPath, { recursive: true });
        
        // Execute init command
        const result = await this.executeCommand('init', [], { config });
        
        if (result.success) {
            logger.success('SQLmesh project initialized successfully');
            
            // Create directory structure if not exists
            const dirs = ['models', 'audits', 'seeds', 'macros', 'tests'];
            for (const dir of dirs) {
                await fs.mkdir(path.join(this.projectPath, dir), { recursive: true });
            }
            
            // Create model subdirectories
            const modelDirs = ['staging', 'intermediate', 'marts'];
            for (const dir of modelDirs) {
                await fs.mkdir(path.join(this.projectPath, 'models', dir), { recursive: true });
            }
        }
        
        return result;
    }

    /**
     * Create execution plan
     */
    async plan(environment = 'dev', autoApply = false) {
        logger.info(`Creating SQLmesh plan for environment: ${environment}`);
        
        const result = await this.executeCommand('plan', [], {
            environment,
            auto_apply: autoApply
        });
        
        if (result.success) {
            logger.success('SQLmesh plan created successfully');
            
            // Parse plan output for cost estimation
            if (result.stdout) {
                const costInfo = this.parseCostInfo(result.stdout);
                if (costInfo) {
                    logger.info(chalk.green(`Estimated cost savings: ${costInfo.savings}%`));
                }
            }
        }
        
        return result;
    }

    /**
     * Run models
     */
    async run(environment = 'dev', model = null) {
        logger.info(`Running SQLmesh models in ${environment} environment`);
        
        const args = model ? [model] : [];
        const result = await this.executeCommand('run', args, { environment });
        
        if (result.success) {
            logger.success('SQLmesh models executed successfully');
        }
        
        return result;
    }

    /**
     * Test models
     */
    async test(model = null) {
        logger.info('Running SQLmesh tests...');
        
        const args = model ? [model] : [];
        const result = await this.executeCommand('test', args);
        
        if (result.success) {
            logger.success('SQLmesh tests passed');
        }
        
        return result;
    }

    /**
     * Audit models
     */
    async audit(model = null) {
        logger.info('Running SQLmesh audits...');
        
        const args = model ? [model] : [];
        const result = await this.executeCommand('audit', args);
        
        if (result.success) {
            logger.success('SQLmesh audits completed');
        }
        
        return result;
    }

    /**
     * Migrate (blue-green deployment)
     */
    async migrate(environment = 'prod') {
        logger.info(`Starting blue-green deployment for ${environment}`);
        
        const result = await this.executeCommand('migrate', [], { environment });
        
        if (result.success) {
            logger.success('Blue-green deployment completed successfully');
            securityLogger.logDataOperation({
                operation: 'sqlmesh_migrate',
                environment,
                success: true,
                timestamp: new Date().toISOString()
            });
        }
        
        return result;
    }

    /**
     * Show differences between environments
     */
    async diff(environment = null) {
        logger.info('Calculating environment differences...');
        
        const options = environment ? { environment } : {};
        const result = await this.executeCommand('diff', [], options);
        
        if (result.success && result.stdout) {
            logger.info('Environment differences:');
            console.log(result.stdout);
        }
        
        return result;
    }

    /**
     * Parse cost information from output
     */
    parseCostInfo(output) {
        // Parse virtual execution indicators
        const virtualMatch = output.match(/Virtual execution: (\d+) compute hours saved/);
        const savingsMatch = output.match(/Cost savings: (\d+)%/);
        
        if (virtualMatch || savingsMatch) {
            return {
                virtualHours: virtualMatch ? parseInt(virtualMatch[1]) : 0,
                savings: savingsMatch ? parseInt(savingsMatch[1]) : 0
            };
        }
        
        return null;
    }

    /**
     * Validate SQLmesh installation
     */
    async validateInstallation() {
        try {
            const result = await this.executeCommand('version');
            return result.success;
        } catch (error) {
            logger.error('SQLmesh not installed or not accessible');
            return false;
        }
    }

    /**
     * Get project status
     */
    async getStatus() {
        try {
            const result = await this.executeCommand('info');
            return result;
        } catch (error) {
            logger.error('Failed to get SQLmesh project status');
            return { success: false, error: error.message };
        }
    }
}

module.exports = SQLmeshWrapper;