#!/usr/bin/env node

/**
 * SQLmesh Project Initializer
 * Automated setup for SQLmesh projects with environment configuration
 */

const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');
const chalk = require('chalk');
const { logger } = require('../logger');
const SQLmeshWrapper = require('./sqlmesh-wrapper');

class SQLmeshProjectInitializer {
    constructor(options = {}) {
        this.projectPath = options.projectPath || 
            path.join(process.cwd(), 'bmad-data-practitioner', 'sqlmesh-project');
        this.wrapper = new SQLmeshWrapper({ projectPath: this.projectPath });
    }

    /**
     * Initialize complete SQLmesh project
     */
    async initializeProject(analysisType = 'general') {
        logger.info('Initializing SQLmesh project...');

        try {
            // Create project structure
            await this.createProjectStructure();

            // Generate environment-specific configuration
            await this.generateEnvironmentConfig();

            // Create project templates based on analysis type
            await this.createProjectTemplates(analysisType);

            // Set up environment-specific settings
            await this.configureEnvironments();

            // Initialize SQLmesh
            const result = await this.wrapper.init();

            if (result.success) {
                logger.success('SQLmesh project initialized successfully');
                await this.validateSetup();
            }

            return result;

        } catch (error) {
            logger.error(`Failed to initialize SQLmesh project: ${error.message}`);
            throw error;
        }
    }

    /**
     * Create project directory structure
     */
    async createProjectStructure() {
        const directories = [
            'models/staging',
            'models/intermediate', 
            'models/marts',
            'audits',
            'seeds',
            'macros',
            'tests',
            '.sqlmesh'
        ];

        for (const dir of directories) {
            const dirPath = path.join(this.projectPath, dir);
            await fs.mkdir(dirPath, { recursive: true });
            logger.debug(`Created directory: ${dir}`);
        }
    }

    /**
     * Generate environment-specific configuration
     */
    async generateEnvironmentConfig() {
        const config = {
            project: 'bmad_data_practitioner',
            
            gateways: {
                default: {
                    connection: {
                        type: 'duckdb',
                        database: 'bmad_warehouse.db'
                    }
                },
                dev: {
                    connection: {
                        type: 'duckdb',
                        database: 'dev_warehouse.db'
                    },
                    state_connection: {
                        type: 'duckdb',
                        database: '.sqlmesh/state.db'
                    }
                },
                staging: {
                    connection: {
                        type: 'duckdb',
                        database: 'staging_warehouse.db'
                    },
                    state_connection: {
                        type: 'duckdb',
                        database: '.sqlmesh/state.db'
                    }
                },
                prod: {
                    connection: {
                        type: 'duckdb',
                        database: 'prod_warehouse.db'
                    },
                    state_connection: {
                        type: 'duckdb',
                        database: '.sqlmesh/state.db'
                    }
                }
            },
            
            model_defaults: {
                dialect: 'duckdb',
                start: '2024-01-01'
            },
            
            environments: {
                dev: {
                    suffix: '_dev',
                    target_environment: 'dev',
                    physical_data_retention: 0,
                    snapshot_ttl: 7
                },
                staging: {
                    suffix: '_staging',
                    target_environment: 'staging',
                    physical_data_retention: 30,
                    snapshot_ttl: 30,
                    sample_size: 0.1
                },
                prod: {
                    suffix: '_prod',
                    target_environment: 'prod',
                    physical_data_retention: 90,
                    snapshot_ttl: 90,
                    enable_backup: true
                },
                feature: {
                    suffix: '_feature',
                    target_environment: 'feature',
                    physical_data_retention: 14,
                    snapshot_ttl: 14,
                    auto_cleanup: true
                }
            },
            
            plan: {
                auto_categorize_changes: {
                    full: false,
                    forward_only: true
                },
                enable_preview: true
            },
            
            run: {
                environment: 'dev'
            },
            
            test: {
                connection: {
                    type: 'duckdb',
                    database: ':memory:'
                }
            },
            
            audit: {
                include_unmodified: false
            },
            
            ui: {
                enabled: true,
                port: 8001,
                host: '0.0.0.0'
            },
            
            notification: {
                enabled: false
            },
            
            macro_paths: ['macros'],
            model_paths: ['models'],
            seed_paths: ['seeds'],
            test_paths: ['tests'],
            audit_paths: ['audits']
        };

        // Write config.yaml
        const configPath = path.join(this.projectPath, 'config.yaml');
        const yamlStr = yaml.dump(config, { lineWidth: 120 });
        await fs.writeFile(configPath, yamlStr, 'utf8');
        logger.debug('Generated config.yaml with 4-environment strategy');
    }

    /**
     * Create project templates based on analysis type
     */
    async createProjectTemplates(analysisType) {
        const templates = {
            general: {
                staging: this.getGeneralStagingTemplate(),
                intermediate: this.getGeneralIntermediateTemplate(),
                marts: this.getGeneralMartsTemplate()
            },
            sales: {
                staging: this.getSalesStagingTemplate(),
                intermediate: this.getSalesIntermediateTemplate(),
                marts: this.getSalesMartsTemplate()
            },
            marketing: {
                staging: this.getMarketingStagingTemplate(),
                intermediate: this.getMarketingIntermediateTemplate(),
                marts: this.getMarketingMartsTemplate()
            },
            finance: {
                staging: this.getFinanceStagingTemplate(),
                intermediate: this.getFinanceIntermediateTemplate(),
                marts: this.getFinanceMartsTemplate()
            }
        };

        const selectedTemplates = templates[analysisType] || templates.general;

        // Create staging model
        await fs.writeFile(
            path.join(this.projectPath, 'models', 'staging', 'stg_example.sql'),
            selectedTemplates.staging,
            'utf8'
        );

        // Create intermediate model
        await fs.writeFile(
            path.join(this.projectPath, 'models', 'intermediate', 'int_example.sql'),
            selectedTemplates.intermediate,
            'utf8'
        );

        // Create marts model
        await fs.writeFile(
            path.join(this.projectPath, 'models', 'marts', 'mart_example.sql'),
            selectedTemplates.marts,
            'utf8'
        );

        logger.debug(`Created ${analysisType} analysis templates`);
    }

    /**
     * Configure environment-specific settings
     */
    async configureEnvironments() {
        // Create environment-specific compute limits
        const computeLimits = {
            dev: {
                max_compute_hours: 0,  // Virtual only
                max_memory_gb: 4,
                max_parallel_queries: 2
            },
            staging: {
                max_compute_hours: 10,
                max_memory_gb: 8,
                max_parallel_queries: 4,
                sampling_enabled: true,
                sample_percentage: 10
            },
            prod: {
                max_compute_hours: 100,
                max_memory_gb: 16,
                max_parallel_queries: 8,
                backup_enabled: true
            },
            feature: {
                max_compute_hours: 5,
                max_memory_gb: 4,
                max_parallel_queries: 2,
                auto_cleanup_days: 14
            }
        };

        const limitsPath = path.join(this.projectPath, '.sqlmesh', 'compute_limits.json');
        await fs.writeFile(limitsPath, JSON.stringify(computeLimits, null, 2), 'utf8');
        logger.debug('Configured environment-specific compute limits');

        // Create retention policies
        const retentionPolicies = {
            dev: {
                snapshot_retention_days: 7,
                log_retention_days: 3,
                physical_data: false
            },
            staging: {
                snapshot_retention_days: 30,
                log_retention_days: 14,
                physical_data: true,
                data_retention_days: 30
            },
            prod: {
                snapshot_retention_days: 90,
                log_retention_days: 30,
                physical_data: true,
                data_retention_days: 90,
                backup_retention_days: 365
            },
            feature: {
                snapshot_retention_days: 14,
                log_retention_days: 7,
                physical_data: true,
                data_retention_days: 14,
                auto_cleanup: true
            }
        };

        const policiesPath = path.join(this.projectPath, '.sqlmesh', 'retention_policies.json');
        await fs.writeFile(policiesPath, JSON.stringify(retentionPolicies, null, 2), 'utf8');
        logger.debug('Configured retention policies');
    }

    /**
     * Validate project setup
     */
    async validateSetup() {
        const validations = [
            { path: 'config.yaml', type: 'file' },
            { path: 'models', type: 'directory' },
            { path: 'models/staging', type: 'directory' },
            { path: 'models/intermediate', type: 'directory' },
            { path: 'models/marts', type: 'directory' },
            { path: 'audits', type: 'directory' },
            { path: 'seeds', type: 'directory' },
            { path: 'macros', type: 'directory' },
            { path: 'tests', type: 'directory' },
            { path: '.sqlmesh', type: 'directory' },
            { path: '.sqlmesh/compute_limits.json', type: 'file' },
            { path: '.sqlmesh/retention_policies.json', type: 'file' }
        ];

        let allValid = true;
        for (const validation of validations) {
            const fullPath = path.join(this.projectPath, validation.path);
            try {
                const stat = await fs.stat(fullPath);
                if (validation.type === 'file' && !stat.isFile()) {
                    logger.warn(`Expected file but found directory: ${validation.path}`);
                    allValid = false;
                } else if (validation.type === 'directory' && !stat.isDirectory()) {
                    logger.warn(`Expected directory but found file: ${validation.path}`);
                    allValid = false;
                } else {
                    logger.debug(`✓ ${validation.path}`);
                }
            } catch (error) {
                logger.warn(`Missing: ${validation.path}`);
                allValid = false;
            }
        }

        if (allValid) {
            logger.success('Project setup validation passed');
        } else {
            logger.warn('Project setup validation found issues');
        }

        return allValid;
    }

    // Template methods
    getGeneralStagingTemplate() {
        return `MODEL (
    name bmad_data_practitioner.stg_example,
    kind FULL,
    dialect duckdb
);

-- Staging layer: Raw data extraction with minimal transformation
-- This model demonstrates SQLmesh embedded documentation
-- Cost optimization: Virtual execution in dev environment (0 compute hours)

SELECT
    id,
    created_at,
    updated_at,
    status,
    amount,
    currency,
    CURRENT_TIMESTAMP AS _loaded_at
FROM raw.transactions
WHERE status != 'deleted';`;
    }

    getGeneralIntermediateTemplate() {
        return `MODEL (
    name bmad_data_practitioner.int_example,
    kind INCREMENTAL_BY_TIME_RANGE (
        time_column updated_at
    ),
    dialect duckdb,
    grain (id, updated_at)
);

-- Intermediate layer: Business logic and transformations
-- Incremental processing for cost optimization

SELECT
    t.id,
    t.created_at,
    t.updated_at,
    t.status,
    t.amount,
    t.currency,
    -- Business logic transformations
    CASE 
        WHEN t.amount > 1000 THEN 'high_value'
        WHEN t.amount > 100 THEN 'medium_value'
        ELSE 'low_value'
    END AS value_category,
    t._loaded_at
FROM bmad_data_practitioner.stg_example AS t
WHERE t.updated_at >= @start_dt AND t.updated_at < @end_dt;`;
    }

    getGeneralMartsTemplate() {
        return `MODEL (
    name bmad_data_practitioner.mart_example,
    kind FULL,
    dialect duckdb,
    audits (unique_values(columns = (id)), not_null(columns = (id, value_category)))
);

-- Marts layer: Business-ready aggregated data
-- Blue-green deployment ensures zero-downtime updates

SELECT
    value_category,
    currency,
    COUNT(*) AS transaction_count,
    SUM(amount) AS total_amount,
    AVG(amount) AS avg_amount,
    MAX(amount) AS max_amount,
    MIN(amount) AS min_amount,
    CURRENT_TIMESTAMP AS calculated_at
FROM bmad_data_practitioner.int_example
GROUP BY value_category, currency;`;
    }

    getSalesStagingTemplate() {
        return `MODEL (
    name bmad_data_practitioner.stg_sales,
    kind FULL,
    dialect duckdb
);

-- Sales staging: Extract raw sales data
SELECT * FROM raw.sales_transactions;`;
    }

    getSalesIntermediateTemplate() {
        return `MODEL (
    name bmad_data_practitioner.int_sales_enriched,
    kind INCREMENTAL_BY_TIME_RANGE (
        time_column order_date
    ),
    dialect duckdb
);

-- Sales intermediate: Enrich with customer and product data
SELECT * FROM bmad_data_practitioner.stg_sales;`;
    }

    getSalesMartsTemplate() {
        return `MODEL (
    name bmad_data_practitioner.mart_sales_summary,
    kind FULL,
    dialect duckdb
);

-- Sales mart: Aggregated sales metrics
SELECT * FROM bmad_data_practitioner.int_sales_enriched;`;
    }

    getMarketingStagingTemplate() {
        return `MODEL (
    name bmad_data_practitioner.stg_campaigns,
    kind FULL,
    dialect duckdb
);

-- Marketing staging: Extract campaign data
SELECT * FROM raw.marketing_campaigns;`;
    }

    getMarketingIntermediateTemplate() {
        return `MODEL (
    name bmad_data_practitioner.int_campaign_performance,
    kind INCREMENTAL_BY_TIME_RANGE (
        time_column campaign_date
    ),
    dialect duckdb
);

-- Marketing intermediate: Calculate performance metrics
SELECT * FROM bmad_data_practitioner.stg_campaigns;`;
    }

    getMarketingMartsTemplate() {
        return `MODEL (
    name bmad_data_practitioner.mart_marketing_roi,
    kind FULL,
    dialect duckdb
);

-- Marketing mart: ROI and attribution analysis
SELECT * FROM bmad_data_practitioner.int_campaign_performance;`;
    }

    getFinanceStagingTemplate() {
        return `MODEL (
    name bmad_data_practitioner.stg_transactions,
    kind FULL,
    dialect duckdb
);

-- Finance staging: Extract financial transactions
SELECT * FROM raw.financial_transactions;`;
    }

    getFinanceIntermediateTemplate() {
        return `MODEL (
    name bmad_data_practitioner.int_financial_reconciliation,
    kind INCREMENTAL_BY_TIME_RANGE (
        time_column transaction_date
    ),
    dialect duckdb
);

-- Finance intermediate: Reconciliation and validation
SELECT * FROM bmad_data_practitioner.stg_transactions;`;
    }

    getFinanceMartsTemplate() {
        return `MODEL (
    name bmad_data_practitioner.mart_financial_reporting,
    kind FULL,
    dialect duckdb,
    audits (not_null(columns = (account_id, period)))
);

-- Finance mart: Regulatory reporting and compliance
SELECT * FROM bmad_data_practitioner.int_financial_reconciliation;`;
    }
}

module.exports = SQLmeshProjectInitializer;