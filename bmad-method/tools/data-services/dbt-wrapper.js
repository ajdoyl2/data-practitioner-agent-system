/**
 * dbt-wrapper.js
 * Python subprocess wrapper for dbt command execution
 * Integrates with BMad error handling and security patterns
 */

const { spawn } = require('child_process');
const path = require('path');
const chalk = require('chalk');
const fs = require('fs').promises;
const { logger } = require('../lib/security-logger');
const { authenticateApiKey } = require('./auth-middleware');
const { checkFeatureFlag } = require('../lib/feature-flag-manager');

class DbtWrapper {
    constructor(projectPath = null) {
        this.projectPath = projectPath || path.join(process.cwd(), 'bmad-data-practitioner', 'dbt-project');
        this.pythonPath = 'python3';
        this.venvPath = path.join(process.cwd(), 'bmad-data-practitioner', 'venv');
        this.initialized = false;
    }

    /**
     * Initialize dbt environment and verify installation
     */
    async initialize() {
        try {
            // Check feature flag
            if (!await checkFeatureFlag('dbt_transformations')) {
                throw new Error('dbt transformations feature is disabled');
            }

            // Log security event
            await logger.logSecurityEvent('dbt_initialization', {
                projectPath: this.projectPath,
                timestamp: new Date().toISOString()
            });

            // Verify dbt installation
            await this.verifyDbtInstallation();
            this.initialized = true;
            
            console.log(chalk.green('✓ dbt environment initialized successfully'));
            return true;
        } catch (error) {
            console.error(chalk.red('✗ Failed to initialize dbt environment:'), error.message);
            throw error;
        }
    }

    /**
     * Verify dbt is installed and accessible
     */
    async verifyDbtInstallation() {
        return new Promise((resolve, reject) => {
            const dbtCheck = spawn('dbt', ['--version'], {
                cwd: this.projectPath,
                stdio: 'pipe'
            });

            let output = '';
            let errorOutput = '';

            dbtCheck.stdout.on('data', (data) => {
                output += data.toString();
            });

            dbtCheck.stderr.on('data', (data) => {
                errorOutput += data.toString();
            });

            dbtCheck.on('close', (code) => {
                if (code === 0) {
                    console.log(chalk.blue('dbt version:'), output.trim());
                    resolve(true);
                } else {
                    reject(new Error(`dbt not found or not properly installed: ${errorOutput}`));
                }
            });

            dbtCheck.on('error', (error) => {
                reject(new Error(`Failed to execute dbt: ${error.message}`));
            });
        });
    }

    /**
     * Execute dbt command with proper error handling
     */
    async executeDbtCommand(command, args = [], options = {}) {
        if (!this.initialized) {
            await this.initialize();
        }

        // Authenticate API key if required
        if (options.requireAuth) {
            await authenticateApiKey(options.apiKey);
        }

        // Log security event
        await logger.logSecurityEvent('dbt_command_execution', {
            command,
            args: args.filter(arg => !arg.includes('password')), // Filter sensitive data
            projectPath: this.projectPath,
            timestamp: new Date().toISOString()
        });

        return new Promise((resolve, reject) => {
            const fullArgs = [command, ...args];
            
            console.log(chalk.blue('Executing dbt command:'), 'dbt', fullArgs.join(' '));

            const dbtProcess = spawn('dbt', fullArgs, {
                cwd: this.projectPath,
                stdio: 'pipe',
                env: {
                    ...process.env,
                    DBT_PROFILES_DIR: this.projectPath
                }
            });

            let stdout = '';
            let stderr = '';

            dbtProcess.stdout.on('data', (data) => {
                const output = data.toString();
                stdout += output;
                if (options.verbose) {
                    console.log(output.trim());
                }
            });

            dbtProcess.stderr.on('data', (data) => {
                const error = data.toString();
                stderr += error;
                if (options.verbose) {
                    console.error(chalk.yellow(error.trim()));
                }
            });

            dbtProcess.on('close', (code) => {
                const result = {
                    success: code === 0,
                    code,
                    stdout: stdout.trim(),
                    stderr: stderr.trim(),
                    command: `dbt ${fullArgs.join(' ')}`
                };

                if (code === 0) {
                    console.log(chalk.green('✓ dbt command completed successfully'));
                    resolve(result);
                } else {
                    console.error(chalk.red('✗ dbt command failed with code:'), code);
                    if (stderr) {
                        console.error(chalk.red('Error output:'), stderr);
                    }
                    reject(new Error(`dbt command failed: ${stderr || 'Unknown error'}`));
                }
            });

            dbtProcess.on('error', (error) => {
                console.error(chalk.red('✗ Failed to execute dbt command:'), error.message);
                reject(new Error(`Failed to execute dbt: ${error.message}`));
            });
        });
    }

    /**
     * Run dbt models
     */
    async run(models = null, options = {}) {
        const args = [];
        if (models) {
            args.push('--models', models);
        }
        if (options.fullRefresh) {
            args.push('--full-refresh');
        }
        if (options.exclude) {
            args.push('--exclude', options.exclude);
        }

        return await this.executeDbtCommand('run', args, options);
    }

    /**
     * Test dbt models
     */
    async test(models = null, options = {}) {
        const args = [];
        if (models) {
            args.push('--models', models);
        }
        if (options.exclude) {
            args.push('--exclude', options.exclude);
        }

        return await this.executeDbtCommand('test', args, options);
    }

    /**
     * Compile dbt models
     */
    async compile(models = null, options = {}) {
        const args = [];
        if (models) {
            args.push('--models', models);
        }

        return await this.executeDbtCommand('compile', args, options);
    }

    /**
     * Generate dbt documentation
     */
    async docs(action = 'generate', options = {}) {
        const args = [action];
        
        return await this.executeDbtCommand('docs', args, options);
    }

    /**
     * Parse dbt project
     */
    async parse(options = {}) {
        return await this.executeDbtCommand('parse', [], options);
    }

    /**
     * List dbt resources
     */
    async list(resourceType = null, options = {}) {
        const args = [];
        if (resourceType) {
            args.push('--resource-type', resourceType);
        }
        if (options.output) {
            args.push('--output', options.output);
        }

        return await this.executeDbtCommand('list', args, options);
    }

    /**
     * Debug dbt configuration
     */
    async debug(options = {}) {
        return await this.executeDbtCommand('debug', [], options);
    }

    /**
     * Snapshot dbt models
     */
    async snapshot(options = {}) {
        return await this.executeDbtCommand('snapshot', [], options);
    }

    /**
     * Seed dbt data
     */
    async seed(options = {}) {
        const args = [];
        if (options.show) {
            args.push('--show');
        }
        if (options.fullRefresh) {
            args.push('--full-refresh');
        }

        return await this.executeDbtCommand('seed', args, options);
    }

    /**
     * Clean dbt artifacts
     */
    async clean(options = {}) {
        return await this.executeDbtCommand('clean', [], options);
    }

    /**
     * Get dbt project status
     */
    async getProjectStatus() {
        try {
            const parseResult = await this.parse({ verbose: false });
            const debugResult = await this.debug({ verbose: false });
            
            return {
                parsed: parseResult.success,
                connected: debugResult.success,
                projectPath: this.projectPath,
                initialized: this.initialized
            };
        } catch (error) {
            return {
                parsed: false,
                connected: false,
                projectPath: this.projectPath,
                initialized: this.initialized,
                error: error.message
            };
        }
    }
}

module.exports = { DbtWrapper };