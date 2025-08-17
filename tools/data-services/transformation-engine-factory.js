#!/usr/bin/env node

/**
 * Transformation Engine Factory
 * Handles explicit selection between dbt and SQLmesh transformation engines
 */

const inquirer = require('inquirer');
const chalk = require('chalk');
const { logger } = require('../logger');
const DbtWrapper = require('./dbt-wrapper');
const SQLmeshWrapper = require('./sqlmesh-wrapper');
const fs = require('fs').promises;
const path = require('path');
const { loadYaml } = require('../../bmad-method/tools/lib/yaml-utils');

class TransformationEngineFactory {
    constructor(options = {}) {
        this.defaultEngine = options.defaultEngine || null; // No default - must be explicit
        this.interactiveMode = options.interactiveMode !== false;
        this.configPath = path.join(process.cwd(), 'config', 'transformation.json');
    }

    /**
     * Load transformation configuration
     */
    async loadConfig() {
        try {
            const config = JSON.parse(await fs.readFile(this.configPath, 'utf8'));
            return config;
        } catch (error) {
            logger.debug('No transformation config found, using defaults');
            return {
                engines: {
                    dbt: { enabled: true },
                    sqlmesh: { enabled: true }
                },
                defaultEngine: null // No default
            };
        }
    }

    /**
     * Get available engines based on feature flags
     */
    async getAvailableEngines() {
        const config = await this.loadConfig();
        const available = [];

        // Check dbt availability
        if (config.engines.dbt && config.engines.dbt.enabled) {
            try {
                const featureConfig = await loadYaml(
                    path.join(process.cwd(), 'bmad-method', 'config', 'feature-flags.yaml')
                );
                if (!featureConfig.features || !featureConfig.features.dbt_transformations || featureConfig.features.dbt_transformations.enabled !== false) {
                    available.push('dbt');
                }
            } catch {
                // dbt enabled by default if no feature flag
                available.push('dbt');
            }
        }

        // Check SQLmesh availability
        if (config.engines.sqlmesh && config.engines.sqlmesh.enabled) {
            try {
                const featureConfig = await loadYaml(
                    path.join(process.cwd(), 'bmad-method', 'config', 'feature-flags.yaml')
                );
                if (featureConfig.features && featureConfig.features.sqlmesh_transformations && featureConfig.features.sqlmesh_transformations.enabled === true) {
                    available.push('sqlmesh');
                }
            } catch {
                // SQLmesh disabled by default if no feature flag
                logger.debug('SQLmesh disabled - feature flag not set');
            }
        }

        return available;
    }

    /**
     * Create transformation engine instance with explicit selection
     * @param {Object} options - Engine selection options
     * @param {string} options.engine - Explicitly selected engine ('dbt' or 'sqlmesh')
     * @param {string} options.apiHeader - X-Transform-Engine header value
     * @param {boolean} options.interactive - Allow interactive selection
     */
    async createEngine(options = {}) {
        const availableEngines = await this.getAvailableEngines();

        if (availableEngines.length === 0) {
            throw new Error('No transformation engines are enabled. Check feature flags.');
        }

        // Determine engine from various sources
        let selectedEngine = null;

        // 1. Check explicit parameter
        if (options.engine) {
            selectedEngine = options.engine.toLowerCase();
        }
        // 2. Check API header
        else if (options.apiHeader) {
            selectedEngine = options.apiHeader.toLowerCase();
        }
        // 3. Check CLI flag (from process.argv)
        else if (process.argv.includes('--engine=dbt')) {
            selectedEngine = 'dbt';
        } else if (process.argv.includes('--engine=sqlmesh')) {
            selectedEngine = 'sqlmesh';
        }
        // 4. Interactive prompt if allowed and no engine specified
        else if (this.interactiveMode && options.interactive !== false) {
            selectedEngine = await this.promptForEngine(availableEngines);
        }

        // Validate selection
        if (!selectedEngine) {
            throw new Error(
                'No transformation engine specified. Use --engine=dbt or --engine=sqlmesh, ' +
                'or set X-Transform-Engine header in API requests.'
            );
        }

        if (!availableEngines.includes(selectedEngine)) {
            throw new Error(
                `Transformation engine '${selectedEngine}' is not available. ` +
                `Available engines: ${availableEngines.join(', ')}`
            );
        }

        // Create and return appropriate engine instance
        logger.info(`Using transformation engine: ${chalk.cyan(selectedEngine)}`);

        switch (selectedEngine) {
            case 'dbt':
                return new DbtWrapper(options.dbtOptions || {});
            
            case 'sqlmesh':
                return new SQLmeshWrapper(options.sqlmeshOptions || {});
            
            default:
                throw new Error(`Unknown transformation engine: ${selectedEngine}`);
        }
    }

    /**
     * Interactive prompt for engine selection
     */
    async promptForEngine(availableEngines) {
        if (availableEngines.length === 1) {
            // Only one engine available, use it
            logger.info(`Only ${availableEngines[0]} is available, using it by default`);
            return availableEngines[0];
        }

        const answers = await inquirer.prompt([
            {
                type: 'list',
                name: 'engine',
                message: 'Select transformation engine:',
                choices: availableEngines.map(engine => ({
                    name: this.getEngineDescription(engine),
                    value: engine
                })),
                default: this.defaultEngine || availableEngines[0]
            }
        ]);

        return answers.engine;
    }

    /**
     * Get user-friendly engine description
     */
    getEngineDescription(engine) {
        const descriptions = {
            dbt: 'dbt - Data Build Tool (traditional, widely adopted)',
            sqlmesh: 'SQLmesh - Cost-optimized with virtual environments (30-50% savings)'
        };
        return descriptions[engine] || engine;
    }

    /**
     * Compare engines for user decision
     */
    async compareEngines() {
        const comparison = {
            dbt: {
                pros: [
                    'Industry standard with large community',
                    'Extensive documentation and resources',
                    'Wide range of adapters and packages',
                    'Mature ecosystem'
                ],
                cons: [
                    'Higher compute costs',
                    'YAML-heavy configuration',
                    'Manual dependency management',
                    'No built-in blue-green deployment'
                ],
                bestFor: 'Teams familiar with dbt, existing dbt projects'
            },
            sqlmesh: {
                pros: [
                    '30-50% cost reduction through virtual environments',
                    'Built-in blue-green deployment',
                    'Automatic dependency detection',
                    'Embedded documentation in SQL',
                    'Python model support'
                ],
                cons: [
                    'Newer tool with smaller community',
                    'Less third-party packages',
                    'Learning curve for teams used to dbt'
                ],
                bestFor: 'Cost-conscious teams, greenfield projects, Python-heavy workflows'
            }
        };

        console.log(chalk.bold('\nTransformation Engine Comparison:\n'));
        
        for (const [engine, details] of Object.entries(comparison)) {
            console.log(chalk.cyan.bold(`${engine.toUpperCase()}:`));
            console.log(chalk.green('  Pros:'));
            details.pros.forEach(pro => console.log(`    ✓ ${pro}`));
            console.log(chalk.yellow('  Cons:'));
            details.cons.forEach(con => console.log(`    ✗ ${con}`));
            console.log(chalk.magenta(`  Best for: ${details.bestFor}\n`));
        }

        return comparison;
    }

    /**
     * Validate engine configuration
     */
    async validateEngineConfig(engine) {
        const validations = {
            dbt: async () => {
                // Check dbt installation
                const dbtWrapper = new DbtWrapper();
                return await dbtWrapper.validateInstallation();
            },
            sqlmesh: async () => {
                // Check SQLmesh installation
                const sqlmeshWrapper = new SQLmeshWrapper();
                return await sqlmeshWrapper.validateInstallation();
            }
        };

        if (validations[engine]) {
            const isValid = await validations[engine]();
            if (!isValid) {
                logger.warn(`${engine} is not properly installed or configured`);
            }
            return isValid;
        }

        return false;
    }

    /**
     * Get engine from HTTP request
     */
    static getEngineFromRequest(req) {
        // Check header
        if (req.headers && req.headers['x-transform-engine']) {
            return req.headers['x-transform-engine'].toLowerCase();
        }
        
        // Check query parameter
        if (req.query && req.query.engine) {
            return req.query.engine.toLowerCase();
        }
        
        // Check body
        if (req.body && req.body.engine) {
            return req.body.engine.toLowerCase();
        }
        
        return null;
    }

    /**
     * Middleware for Express to enforce engine selection
     */
    static requireEngineSelection() {
        return (req, res, next) => {
            const engine = TransformationEngineFactory.getEngineFromRequest(req);
            
            if (!engine) {
                return res.status(400).json({
                    error: 'Transformation engine not specified',
                    message: 'Please specify transformation engine using X-Transform-Engine header',
                    availableEngines: ['dbt', 'sqlmesh']
                });
            }
            
            req.transformEngine = engine;
            next();
        };
    }
}

module.exports = TransformationEngineFactory;