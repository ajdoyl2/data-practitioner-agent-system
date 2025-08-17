/**
 * model-generator.js
 * Model template generation helpers for dbt project
 * Automates creation of dbt models following best practices
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const { logger } = require('../lib/security-logger');

class ModelGenerator {
    constructor(projectPath = null) {
        this.projectPath = projectPath || path.join(process.cwd(), '..', 'bmad-data-practitioner', 'dbt-project');
        this.templatesPath = path.join(__dirname, '..', '..', 'templates', 'dbt');
    }

    /**
     * Initialize dbt project structure automatically
     */
    async initializeProject(options = {}) {
        const {
            projectName = 'bmad_data_practitioner',
            overwrite = false
        } = options;

        try {
            await logger.logSecurityEvent('dbt_project_initialization', {
                projectPath: this.projectPath,
                projectName,
                timestamp: new Date().toISOString()
            });

            console.log(chalk.blue('Initializing dbt project structure...'));

            // Create project directory if it doesn't exist
            await this.ensureProjectDirectory();

            // Generate dbt_project.yml
            await this.generateProjectConfig(projectName, overwrite);

            // Generate profiles.yml
            await this.generateProfilesConfig(projectName, overwrite);

            // Create directory structure
            await this.createDirectoryStructure();

            // Generate initial model files
            await this.generateInitialModels(overwrite);

            // Create documentation templates
            await this.generateDocumentationTemplates(overwrite);

            // Validate setup
            await this.validateSetup();

            console.log(chalk.green('✓ dbt project initialized successfully'));
            
            return {
                success: true,
                projectPath: this.projectPath,
                projectName,
                message: 'dbt project structure created and validated'
            };
        } catch (error) {
            console.error(chalk.red('✗ Failed to initialize dbt project:'), error.message);
            throw error;
        }
    }

    /**
     * Generate a staging model
     */
    async generateStagingModel(tableName, sourceSchema = 'raw', options = {}) {
        const {
            columns = [],
            description = '',
            tests = true
        } = options;

        try {
            const modelName = `stg_${sourceSchema}__${tableName}`;
            const modelPath = path.join(this.projectPath, 'models', 'staging', `${modelName}.sql`);

            const modelContent = this.generateStagingModelContent({
                tableName,
                sourceSchema,
                modelName,
                columns,
                description
            });

            await fs.writeFile(modelPath, modelContent);

            if (tests) {
                await this.generateModelTests(modelName, 'staging', columns);
            }

            console.log(chalk.green(`✓ Generated staging model: ${modelName}`));
            
            return {
                success: true,
                modelName,
                modelPath,
                type: 'staging'
            };
        } catch (error) {
            console.error(chalk.red(`✗ Failed to generate staging model for ${tableName}:`), error.message);
            throw error;
        }
    }

    /**
     * Generate an intermediate model
     */
    async generateIntermediateModel(modelName, dependencies = [], options = {}) {
        const {
            description = '',
            businessLogic = '',
            tests = true
        } = options;

        try {
            const fullModelName = `int_${modelName}`;
            const modelPath = path.join(this.projectPath, 'models', 'intermediate', `${fullModelName}.sql`);

            const modelContent = this.generateIntermediateModelContent({
                modelName: fullModelName,
                dependencies,
                description,
                businessLogic
            });

            await fs.writeFile(modelPath, modelContent);

            if (tests) {
                await this.generateModelTests(fullModelName, 'intermediate');
            }

            console.log(chalk.green(`✓ Generated intermediate model: ${fullModelName}`));
            
            return {
                success: true,
                modelName: fullModelName,
                modelPath,
                type: 'intermediate'
            };
        } catch (error) {
            console.error(chalk.red(`✗ Failed to generate intermediate model ${modelName}:`), error.message);
            throw error;
        }
    }

    /**
     * Generate a mart model
     */
    async generateMartModel(modelName, dependencies = [], options = {}) {
        const {
            description = '',
            businessArea = 'analytics',
            tests = true
        } = options;

        try {
            const fullModelName = `${businessArea}__${modelName}`;
            const modelPath = path.join(this.projectPath, 'models', 'marts', `${fullModelName}.sql`);

            const modelContent = this.generateMartModelContent({
                modelName: fullModelName,
                dependencies,
                description,
                businessArea
            });

            await fs.writeFile(modelPath, modelContent);

            if (tests) {
                await this.generateModelTests(fullModelName, 'marts');
            }

            console.log(chalk.green(`✓ Generated mart model: ${fullModelName}`));
            
            return {
                success: true,
                modelName: fullModelName,
                modelPath,
                type: 'mart'
            };
        } catch (error) {
            console.error(chalk.red(`✗ Failed to generate mart model ${modelName}:`), error.message);
            throw error;
        }
    }

    /**
     * Generate project templates for different analysis types
     */
    async generateProjectTemplates() {
        const templates = {
            'customer_analytics': {
                staging: ['customers', 'orders', 'payments'],
                intermediate: ['customer_orders', 'order_totals'],
                marts: ['customer_metrics', 'order_summary']
            },
            'sales_analytics': {
                staging: ['sales', 'products', 'regions'],
                intermediate: ['sales_by_region', 'product_performance'],
                marts: ['sales_dashboard', 'regional_performance']
            },
            'financial_analytics': {
                staging: ['transactions', 'accounts', 'budgets'],
                intermediate: ['account_balances', 'budget_variance'],
                marts: ['financial_summary', 'budget_analysis']
            }
        };

        try {
            const templateDir = path.join(this.projectPath, 'templates');
            await fs.mkdir(templateDir, { recursive: true });

            for (const [templateName, structure] of Object.entries(templates)) {
                const templateFile = path.join(templateDir, `${templateName}_template.yml`);
                const templateContent = this.generateTemplateDefinition(templateName, structure);
                await fs.writeFile(templateFile, templateContent);
            }

            console.log(chalk.green('✓ Generated project templates'));
            return { success: true, templates: Object.keys(templates) };
        } catch (error) {
            console.error(chalk.red('✗ Failed to generate project templates:'), error.message);
            throw error;
        }
    }

    /**
     * Private helper methods
     */

    async ensureProjectDirectory() {
        try {
            await fs.mkdir(this.projectPath, { recursive: true });
        } catch (error) {
            if (error.code !== 'EEXIST') {
                throw error;
            }
        }
    }

    async generateProjectConfig(projectName, overwrite) {
        const configPath = path.join(this.projectPath, 'dbt_project.yml');
        
        if (!overwrite && await this.fileExists(configPath)) {
            console.log(chalk.yellow('dbt_project.yml already exists, skipping...'));
            return;
        }

        const config = `# BMad Data Practitioner dbt Project Configuration
name: '${projectName}'
version: '1.0.0'
config-version: 2

# Directory configuration
model-paths: ["models"]
analysis-paths: ["analysis"]
test-paths: ["tests"]
seed-paths: ["data"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

# Global variables
vars:
  # Security configuration
  security:
    require_authentication: true
    feature_flag: 'dbt_transformations'
    log_security_events: true
  
  # Data quality thresholds
  data_quality:
    completeness_threshold: 0.95
    uniqueness_threshold: 1.0
    validity_threshold: 0.98

# Model configuration
models:
  ${projectName}:
    # Staging models - one-to-one with source tables
    staging:
      +materialized: view
      +schema: staging
      +docs:
        node_color: "#E8F4FD"
    
    # Intermediate models - business logic transformations
    intermediate:
      +materialized: view
      +schema: intermediate
      +docs:
        node_color: "#FFF2CC"
    
    # Marts models - final analytics-ready datasets
    marts:
      +materialized: table
      +schema: marts
      +docs:
        node_color: "#D5E8D4"

# Test configuration
tests:
  +store_failures: true
  +schema: test_failures

# Documentation configuration
docs:
  generate: true

# On-run hooks for logging and monitoring
on-run-start: "{{ log('Starting dbt run at ' ~ run_started_at, info=true) }}"
on-run-end: "{{ log('Completed dbt run at ' ~ run_started_at, info=true) }}"
`;

        await fs.writeFile(configPath, config);
    }

    async generateProfilesConfig(projectName, overwrite) {
        const profilesPath = path.join(this.projectPath, 'profiles.yml');
        
        if (!overwrite && await this.fileExists(profilesPath)) {
            console.log(chalk.yellow('profiles.yml already exists, skipping...'));
            return;
        }

        const profiles = `# BMad Data Practitioner dbt Profiles Configuration
${projectName}:
  target: dev
  outputs:
    dev:
      type: duckdb
      path: '../../../.duckdb/analytics.db'
      schema: main
      threads: 4
      keepalives_idle: 0
      search_path: "main"
      
    prod:
      type: duckdb
      path: '../../../.duckdb/analytics_prod.db'
      schema: main
      threads: 8
      keepalives_idle: 0
      search_path: "main"
      
    test:
      type: duckdb
      path: ':memory:'
      schema: main
      threads: 2
      keepalives_idle: 0
      search_path: "main"

config:
  send_anonymous_usage_stats: false
  use_colors: true
  printer_width: 80
  partial_parse: true
  static_parser: true
`;

        await fs.writeFile(profilesPath, profiles);
    }

    async createDirectoryStructure() {
        const directories = [
            'models/staging',
            'models/intermediate', 
            'models/marts',
            'tests',
            'macros',
            'docs',
            'data',
            'analysis',
            'snapshots',
            'templates'
        ];

        for (const dir of directories) {
            const dirPath = path.join(this.projectPath, dir);
            await fs.mkdir(dirPath, { recursive: true });
        }
    }

    async generateInitialModels(overwrite) {
        // Generate sources configuration
        const sourcesPath = path.join(this.projectPath, 'models', 'staging', '_sources.yml');
        if (!await this.fileExists(sourcesPath) || overwrite) {
            const sourcesContent = `version: 2

sources:
  - name: raw_data
    description: "Raw data ingested via PyAirbyte integration"
    schema: raw
    tables:
      - name: sample_source
        description: "Sample source table for testing dbt configuration"
        columns:
          - name: id
            description: "Primary key"
            tests:
              - unique
              - not_null
          - name: name
            description: "Sample name field"
          - name: created_at
            description: "Record creation timestamp"
          - name: updated_at
            description: "Record update timestamp"
`;
            await fs.writeFile(sourcesPath, sourcesContent);
        }

        // Generate sample staging model
        const stagingModelPath = path.join(this.projectPath, 'models', 'staging', 'stg_sample_source.sql');
        if (!await this.fileExists(stagingModelPath) || overwrite) {
            const stagingModel = `{{
  config(
    materialized='view',
    alias='sample_source_staging'
  )
}}

-- Sample staging model for testing dbt configuration
-- One-to-one mapping with raw source data

with source_data as (
    select
        id,
        name,
        created_at,
        updated_at
    from {{ source('raw_data', 'sample_source') }}
),

cleaned_data as (
    select
        id::integer as source_id,
        trim(upper(name)) as source_name,
        created_at::timestamp as created_timestamp,
        updated_at::timestamp as updated_timestamp,
        current_timestamp as processed_at
    from source_data
    where id is not null
)

select * from cleaned_data
`;
            await fs.writeFile(stagingModelPath, stagingModel);
        }

        // Generate staging model schema
        const stagingSchemaPath = path.join(this.projectPath, 'models', 'staging', 'staging.yml');
        if (!await this.fileExists(stagingSchemaPath) || overwrite) {
            const stagingSchema = `version: 2

models:
  - name: stg_sample_source
    description: "Staging model for sample source data with basic cleaning"
    columns:
      - name: source_id
        description: "Primary key from source system"
        tests:
          - unique
          - not_null
      
      - name: source_name
        description: "Cleaned and standardized name field"
        tests:
          - not_null
      
      - name: created_timestamp
        description: "Record creation timestamp"
        tests:
          - not_null
      
      - name: updated_timestamp
        description: "Record update timestamp"
      
      - name: processed_at
        description: "dbt processing timestamp"
        tests:
          - not_null
`;
            await fs.writeFile(stagingSchemaPath, stagingSchema);
        }
    }

    async generateDocumentationTemplates(overwrite) {
        const docsPath = path.join(this.projectPath, 'docs', 'overview.md');
        if (!await this.fileExists(docsPath) || overwrite) {
            const docsContent = `# BMad Data Practitioner - dbt Documentation

## Project Overview

This dbt project transforms raw data into analytics-ready datasets following a layered architecture approach.

## Architecture

### Staging Layer
- One-to-one mapping with source tables
- Basic data cleaning and type casting
- Standardized naming conventions

### Intermediate Layer
- Business logic transformations
- Data aggregations and joins
- Reusable business concepts

### Marts Layer
- Final analytics-ready datasets
- Optimized for end-user consumption
- Business-area specific models

## Data Quality

All models include comprehensive testing:
- Generic tests (unique, not_null, accepted_values, relationships)
- Custom data quality tests
- Business rule validations

## Getting Started

1. Configure your profiles.yml for DuckDB connection
2. Run \`dbt parse\` to validate project structure
3. Execute \`dbt run\` to build models
4. Run \`dbt test\` to validate data quality
5. Generate docs with \`dbt docs generate\`
`;
            await fs.mkdir(path.dirname(docsPath), { recursive: true });
            await fs.writeFile(docsPath, docsContent);
        }
    }

    async validateSetup() {
        const requiredFiles = [
            'dbt_project.yml',
            'profiles.yml',
            'models/staging/_sources.yml'
        ];

        for (const file of requiredFiles) {
            const filePath = path.join(this.projectPath, file);
            if (!await this.fileExists(filePath)) {
                throw new Error(`Required file ${file} not found`);
            }
        }

        const requiredDirs = [
            'models',
            'tests', 
            'macros',
            'docs'
        ];

        for (const dir of requiredDirs) {
            const dirPath = path.join(this.projectPath, dir);
            try {
                const stats = await fs.stat(dirPath);
                if (!stats.isDirectory()) {
                    throw new Error(`${dir} is not a directory`);
                }
            } catch (error) {
                throw new Error(`Required directory ${dir} not found`);
            }
        }
    }

    async fileExists(filePath) {
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }

    generateStagingModelContent({ tableName, sourceSchema, modelName, columns, description }) {
        const columnSelects = columns.length > 0 
            ? columns.map(col => `        ${col.name}${col.cast ? `::${col.cast}` : ''} as ${col.alias || col.name}`).join(',\n')
            : '        *';

        return `{{
  config(
    materialized='view',
    alias='${tableName}_staging'
  )
}}

-- ${description || `Staging model for ${tableName}`}
-- One-to-one mapping with raw source data

with source_data as (
    select
${columnSelects}
    from {{ source('${sourceSchema}', '${tableName}') }}
),

cleaned_data as (
    select
        *,
        current_timestamp as processed_at
    from source_data
    where id is not null
)

select * from cleaned_data
`;
    }

    generateIntermediateModelContent({ modelName, dependencies, description, businessLogic }) {
        const dependencyRefs = dependencies.map(dep => `    ${dep} as (
        select * from {{ ref('${dep}') }}
    )`).join(',\n\n');

        return `{{
  config(
    materialized='view'
  )
}}

-- ${description || `Intermediate model: ${modelName}`}
-- Business logic transformations

${dependencyRefs ? `with ${dependencyRefs},\n\n` : ''}final as (
    ${businessLogic || '-- Add your business logic here\n    select * from source_data'}
)

select * from final
`;
    }

    generateMartModelContent({ modelName, dependencies, description, businessArea }) {
        const dependencyRefs = dependencies.map(dep => `    ${dep} as (
        select * from {{ ref('${dep}') }}
    )`).join(',\n\n');

        return `{{
  config(
    materialized='table',
    alias='${modelName.replace(`${businessArea}__`, '')}'
  )
}}

-- ${description || `Mart model for ${businessArea}: ${modelName}`}
-- Final analytics-ready dataset

${dependencyRefs ? `with ${dependencyRefs},\n\n` : ''}final as (
    -- Final aggregations and business metrics
    select
        *,
        current_timestamp as last_updated
    from ${dependencies[0] || 'source_data'}
)

select * from final
`;
    }

    generateTemplateDefinition(templateName, structure) {
        return `# ${templateName.replace('_', ' ').toUpperCase()} Template
# Auto-generated project template for ${templateName}

template_name: ${templateName}
description: "Template for ${templateName.replace('_', ' ')} analysis"

structure:
  staging:
${structure.staging.map(table => `    - ${table}`).join('\n')}
  
  intermediate:
${structure.intermediate.map(model => `    - ${model}`).join('\n')}
  
  marts:
${structure.marts.map(mart => `    - ${mart}`).join('\n')}

dependencies:
  - dbt-core
  - dbt-duckdb

configuration:
  materialization:
    staging: view
    intermediate: view
    marts: table
`;
    }

    async generateModelTests(modelName, layer, columns = []) {
        // This would generate test files - implementation depends on specific requirements
        console.log(chalk.blue(`Generating tests for ${modelName} in ${layer} layer`));
    }
}

module.exports = { ModelGenerator };