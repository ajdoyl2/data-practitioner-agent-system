# Data Practitioner System - Configuration Reference

## Overview
Comprehensive reference for all configuration options in the BMad Data Practitioner Agent System (Stories 1.1-1.8).

## Configuration Hierarchy

### Configuration Priority (Highest to Lowest)
1. **Environment Variables**: Runtime environment settings
2. **Local Config Files**: Project-specific configurations
3. **User Config**: User-specific preferences
4. **Default Values**: Built-in system defaults

### Configuration File Structure
```
bmad-method/
├── config/                                    # BMad Method core config
│   ├── main-config.yaml                      # Main system configuration
│   ├── quality-assurance/                    # Quality gates and validation
│   │   ├── quality-gates.yaml
│   │   ├── test-suites.yaml
│   │   └── monitoring-config.yaml
│   └── feature-flags.yaml                    # Feature toggles
├── expansion-packs/bmad-data-practitioner/
│   ├── config.yaml                           # Expansion pack config
│   ├── data/                                 # Data service configurations
│   │   ├── duckdb-cli-integration-config.yaml
│   │   ├── duckdb-memory-config-templates.yaml
│   │   └── resource-thresholds-config.yaml
│   ├── dagster-project/
│   │   ├── dagster.yaml                      # Dagster orchestration config
│   │   └── workspace.yaml                    # Dagster workspace config
│   ├── evidence-project/
│   │   ├── evidence.config.yaml              # Evidence.dev configuration
│   │   └── sources/                          # Data source configurations
│   ├── dbt-project/
│   │   ├── dbt_project.yml                   # dbt configuration
│   │   └── profiles.yml                      # dbt profiles
│   └── sqlmesh-project/
│       └── config.yaml                       # SQLmesh configuration
└── .env                                       # Environment variables
```

## Main System Configuration

### `config/main-config.yaml`
```yaml
# BMad Data Practitioner System Configuration
system:
  name: "BMad Data Practitioner System"
  version: "1.8.0"
  mode: "development"  # development | staging | production
  log_level: "info"    # debug | info | warn | error
  timezone: "UTC"

# Component configurations
components:
  infrastructure:
    agent_discovery: true
    auto_setup: true
    directory_validation: true
    
  ingestion:
    pyairbyte:
      enabled: true
      auto_detect_sources: true
      connection_retry_count: 3
      connection_timeout_seconds: 30
      batch_size: 1000
      max_workers: 4
      
  analytics:
    duckdb:
      enabled: true
      database_path: "./data/analytics.duckdb"
      memory_limit: "4GB"
      thread_count: 4
      temp_directory: "./temp/duckdb"
      enable_parallel_execution: true
      checkpoint_frequency_minutes: 30
      
  transformation:
    primary_engine: "dbt"  # dbt | sqlmesh
    dual_engine_mode: false
    cost_optimization_enabled: true
    engine_selection_strategy: "cost_based"  # cost_based | performance_based | user_defined
    
  orchestration:
    dagster:
      enabled: true
      web_port: 3000
      daemon_enabled: true
      auto_materialize_enabled: true
      max_concurrent_runs: 10
      
  analysis:
    eda_engine:
      enabled: true
      auto_hypothesis_generation: true
      statistical_significance_threshold: 0.05
      max_correlation_variables: 50
      
  publication:
    evidence:
      enabled: true
      port: 3001
      auto_deploy: false
      build_optimization: true
      cdn_enabled: false

# Resource management
resources:
  memory:
    total_limit_gb: 16
    duckdb_allocation_gb: 4
    node_allocation_gb: 2
    python_allocation_gb: 4
    evidence_allocation_gb: 2
    
  performance:
    query_timeout_seconds: 300
    build_timeout_minutes: 30
    max_concurrent_operations: 5
    
  storage:
    data_retention_days: 90
    temp_cleanup_hours: 24
    backup_retention_days: 30

# Monitoring and observability
monitoring:
  enabled: true
  quality_gates_enabled: true
  performance_monitoring_enabled: true
  security_logging_enabled: true
  metrics_collection_interval_seconds: 60
  alert_cooldown_minutes: 15

# Security settings
security:
  audit_logging: true
  credential_encryption: true
  api_rate_limiting: true
  secure_temp_files: true
  
# Feature flags
features:
  dual_transformation_engines: false
  advanced_eda_features: true
  real_time_monitoring: true
  automated_deployment: false
```

## Environment Variables

### Core System Variables
```bash
# System Configuration
BMAD_ENV=development                    # development | staging | production
BMAD_LOG_LEVEL=info                     # debug | info | warn | error
BMAD_CONFIG_PATH=/path/to/config/       # Custom config directory
BMAD_DATA_PATH=/path/to/data/           # Data storage directory

# Database Configuration
DUCKDB_PATH=./data/analytics.duckdb     # DuckDB database file path
DUCKDB_MEMORY_LIMIT=4GB                 # Memory allocation for DuckDB
DUCKDB_THREADS=4                        # Thread count for DuckDB
DUCKDB_TEMP_DIR=./temp/duckdb          # Temporary directory for DuckDB

# PyAirbyte Configuration
PYAIRBYTE_CONFIG_PATH=./config/sources.yaml
PYAIRBYTE_TEMP_DIR=./temp/airbyte
PYAIRBYTE_CACHE_DIR=./cache/airbyte
PYAIRBYTE_LOG_LEVEL=INFO

# Dagster Configuration
DAGSTER_HOME=./dagster-project          # Dagster workspace directory
DAGSTER_WEB_PORT=3000                   # Dagster web interface port
DAGSTER_DAEMON_ENABLED=true             # Enable Dagster daemon
DAGSTER_DATABASE_URL=postgresql://...   # Optional: External database

# Evidence.dev Configuration
EVIDENCE_PORT=3001                      # Evidence.dev development server port
EVIDENCE_BUILD_DIR=./build              # Build output directory
EVIDENCE_CDN_URL=https://...            # Optional: CDN URL for assets

# Quality Assurance Configuration
QA_ENABLED=true                         # Enable quality gates
QA_REPORT_DIR=./reports/quality         # Quality report output directory
QA_THRESHOLD_CONFIG=./config/quality-assurance/quality-gates.yaml

# Security Configuration
BMAD_AUDIT_LOG=true                     # Enable audit logging
BMAD_ENCRYPT_CREDENTIALS=true           # Encrypt stored credentials
BMAD_SECURE_TEMP=true                   # Secure temporary file handling

# Performance Configuration
BMAD_QUERY_TIMEOUT=300                  # Query timeout in seconds
BMAD_BUILD_TIMEOUT=1800                 # Build timeout in seconds
BMAD_MAX_CONCURRENT=5                   # Maximum concurrent operations
```

## Component-Specific Configurations

### Story 1.1 - Infrastructure Configuration

#### Agent Configuration
```yaml
# expansion-packs/bmad-data-practitioner/config.yaml
expansion_pack:
  name: "bmad-data-practitioner"
  version: "1.8.0"
  description: "Data Practitioner Agent System"
  
agents:
  discovery:
    enabled: true
    paths:
      - "./agents/"
    file_pattern: "*.md"
    validation: true
    
  teams:
    default_team: "data-practitioner-team"
    available_teams:
      - name: "data-practitioner-team"
        description: "Complete data practitioner team"
        agents: ["data-analyst", "data-engineer", "data-architect", "data-qa-engineer"]
        
directory_structure:
  auto_create: true
  validation: true
  required_directories:
    - "data"
    - "docs" 
    - "tasks"
    - "templates"
    - "workflows"
```

### Story 1.2 - Data Ingestion Configuration

#### PyAirbyte Sources Configuration
```yaml
# data/source-configurations.yaml
sources:
  postgres_example:
    connector: "source-postgres"
    config:
      host: "localhost"
      port: 5432
      database: "example_db"
      username: "${POSTGRES_USER}"
      password: "${POSTGRES_PASSWORD}"
      ssl: false
    sync_mode: "incremental"
    
  api_example:
    connector: "source-http-api"
    config:
      base_url: "https://api.example.com"
      headers:
        Authorization: "Bearer ${API_TOKEN}"
    sync_mode: "full_refresh"
    
  file_example:
    connector: "source-file"
    config:
      dataset_name: "csv_data"
      format: "csv"
      url: "./data/input/sample.csv"
    sync_mode: "full_refresh"

# PyAirbyte wrapper configuration
pyairbyte:
  connection:
    retry_count: 3
    timeout_seconds: 30
    pool_size: 5
    
  sync:
    batch_size: 1000
    max_workers: 4
    checkpoint_interval: 100
    
  schema:
    auto_detect: true
    validation: true
    evolution_enabled: true
```

### Story 1.3 - Analytics Platform Configuration

#### DuckDB Configuration
```yaml
# data/duckdb-memory-config-templates.yaml
duckdb:
  memory_management:
    # Total memory allocation
    memory_limit: "4GB"
    
    # Buffer pool settings
    buffer_manager_size: "2GB"
    
    # Query execution settings
    max_temp_directory_size: "1GB"
    temp_directory: "./temp/duckdb"
    
    # Performance settings
    threads: 4
    enable_object_cache: true
    enable_file_system_cache: true
    
    # Connection settings
    max_connections: 10
    connection_timeout: 30
    
  performance:
    # Query optimization
    enable_query_verification: false
    enable_profiling: true
    enable_progress_bar: false
    
    # Parallel execution
    enable_parallel_execution: true
    max_threads_per_query: 4
    
    # Checkpointing
    checkpoint_threshold: "1GB"
    force_checkpoint: false
    
  storage:
    # File format settings
    compression: "auto"
    
    # Backup settings
    enable_wal: true
    checkpoint_frequency: "30min"
```

#### Resource Thresholds Configuration
```yaml
# data/resource-thresholds-config.yaml
resource_thresholds:
  memory:
    warning_percentage: 75
    critical_percentage: 90
    emergency_action: "kill_queries"
    
  cpu:
    warning_percentage: 80
    critical_percentage: 95
    throttling_enabled: true
    
  disk:
    warning_percentage: 85
    critical_percentage: 95
    cleanup_enabled: true
    
  connections:
    max_concurrent: 100
    warning_threshold: 80
    kill_idle_after_minutes: 30
    
monitoring:
  collection_interval_seconds: 10
  retention_hours: 168  # 7 days
  alerting_enabled: true
```

### Story 1.4 - Orchestration Configuration

#### Dagster Configuration
```yaml
# dagster-project/dagster.yaml
scheduler:
  module: dagster.core.scheduler
  class: DagsterDaemonScheduler

run_coordinator:
  module: dagster.core.run_coordinator
  class: QueuedRunCoordinator
  config:
    max_concurrent_runs: 10

run_launcher:
  module: dagster_k8s
  class: K8sRunLauncher
  config:
    service_account_name: dagster
    job_namespace: dagster
    
storage:
  postgres:
    postgres_url: "${DAGSTER_PG_URL}"
    
compute_logs:
  module: dagster_aws.s3.compute_log_manager
  class: S3ComputeLogManager
  config:
    bucket: "dagster-compute-logs"
```

#### Workspace Configuration
```yaml
# dagster-project/workspace.yaml
load_from:
  - python_module:
      module_name: assets.ingestion_assets
      working_directory: .
  - python_module:
      module_name: assets.transformation_assets  
      working_directory: .
  - python_module:
      module_name: assets.analytics_assets
      working_directory: .
  - python_module:
      module_name: jobs.data_pipeline_jobs
      working_directory: .
```

### Story 1.5 - Transformation Configuration

#### dbt Configuration
```yaml
# dbt-project/dbt_project.yml
name: 'bmad_data_practitioner'
version: '1.8.0'
config-version: 2

profile: 'bmad_data_practitioner'

model-paths: ["models"]
analysis-paths: ["analyses"]
test-paths: ["tests"]
seed-paths: ["seeds"]
macro-paths: ["macros"]
snapshot-paths: ["snapshots"]

target-path: "target"
clean-targets:
  - "target"
  - "dbt_packages"

models:
  bmad_data_practitioner:
    staging:
      +materialized: view
      +tags: ["staging"]
    intermediate:
      +materialized: ephemeral
      +tags: ["intermediate"]
    marts:
      +materialized: table
      +tags: ["marts"]

tests:
  +store_failures: true
  +severity: warn

vars:
  # Quality thresholds
  freshness_threshold_hours: 24
  completeness_threshold: 0.95
  uniqueness_threshold: 0.99
  
  # Performance settings
  batch_size: 10000
  enable_incremental: true
```

#### dbt Profiles Configuration
```yaml
# dbt-project/profiles.yml
bmad_data_practitioner:
  target: dev
  outputs:
    dev:
      type: duckdb
      path: '../../data/analytics.duckdb'
      threads: 4
      keepalives_idle: 0
      search_path: main
      
    prod:
      type: duckdb
      path: '../../data/analytics_prod.duckdb'
      threads: 8
      keepalives_idle: 0
      search_path: main
```

#### SQLmesh Configuration
```yaml
# sqlmesh-project/config.yaml
gateways:
  local:
    connection:
      type: duckdb
      database: ../../data/analytics.duckdb
      
model_defaults:
  dialect: duckdb
  
ui:
  host: 0.0.0.0
  port: 8080
  
notification_targets:
  - type: console
  - type: slack
    url: "${SLACK_WEBHOOK_URL}"
    
scheduler:
  type: builtin
  
state_connection:
  type: duckdb
  database: ../../data/sqlmesh_state.duckdb
```

### Story 1.6 - Analysis Engine Configuration

#### EDA Configuration
```yaml
# python-analysis/eda-config.yaml
eda:
  auto_analysis:
    enabled: true
    max_variables: 100
    correlation_threshold: 0.3
    
  hypothesis_generation:
    enabled: true
    statistical_tests:
      - t_test
      - chi_square
      - anova
      - correlation
    significance_threshold: 0.05
    
  pattern_detection:
    enabled: true
    algorithms:
      - anomaly_detection
      - trend_analysis
      - seasonality_detection
    sensitivity: 0.8
    
  reporting:
    auto_generate: true
    format: ["html", "pdf"]
    include_visualizations: true
```

### Story 1.7 - Publication Configuration

#### Evidence.dev Configuration
```yaml
# evidence-project/evidence.config.yaml
database: 'duckdb'
duckdb:
  filename: '../data/analytics.duckdb'

plugins:
  - '@evidence-dev/core-components'
  - '@evidence-dev/plugin-connector-duckdb'

layout:
  header_colour: '#1f2937'
  logo: './static/logo.png'
  
build:
  output_dir: './build'
  base_url: ''
  
dev:
  port: 3001
  host: 'localhost'
  
deployment:
  type: 'static'
  provider: 'netlify'  # or 'vercel', 'github-pages'
```

### Story 1.8 - Quality Assurance Configuration

#### Quality Gates Configuration
```yaml
# config/quality-assurance/quality-gates.yaml
quality_gates:
  ingestion:
    data_completeness:
      threshold: 95
      action: "warn"  # warn | block | log
      metric_type: "percentage"
      
    schema_compliance:
      threshold: 100
      action: "block"
      metric_type: "percentage"
      
    source_availability:
      threshold: 99
      action: "warn"
      metric_type: "percentage"
      
  transformation:
    dbt_test_success:
      threshold: 100
      action: "block"
      metric_type: "percentage"
      
    model_execution_time:
      threshold: 300
      action: "warn"
      metric_type: "seconds"
      
    data_quality_score:
      threshold: 85
      action: "warn"
      metric_type: "percentage"
      
  publication:
    site_load_time:
      threshold: 3
      action: "warn"
      metric_type: "seconds"
      
    build_success:
      threshold: 100
      action: "block"
      metric_type: "percentage"
      
    accessibility_score:
      threshold: 90
      action: "warn"
      metric_type: "percentage"
      
  integration:
    end_to_end_success:
      threshold: 95
      action: "warn"
      metric_type: "percentage"
      
    cross_component_latency:
      threshold: 10
      action: "warn"
      metric_type: "seconds"
      
  performance:
    memory_usage:
      threshold: 80
      action: "warn"
      metric_type: "percentage"
      
    cpu_usage:
      threshold: 85
      action: "warn" 
      metric_type: "percentage"
      
    query_response_time:
      threshold: 5
      action: "warn"
      metric_type: "seconds"

# Quality exception handling
exceptions:
  emergency_bypass:
    enabled: true
    requires_approval: true
    audit_required: true
    
  temporary_thresholds:
    enabled: true
    max_duration_hours: 24
    approval_required: true
```

#### Test Suites Configuration
```yaml
# config/quality-assurance/test-suites.yaml
test_suites:
  unit:
    enabled: true
    coverage_threshold: 80
    framework: "jest"
    patterns:
      - "tests/**/*.test.js"
    timeout: 30000
    
  integration:
    enabled: true
    framework: "jest"
    patterns:
      - "tests/integration/**/*.test.js"
    timeout: 60000
    setup_timeout: 120000
    
  end_to_end:
    enabled: true
    framework: "jest"
    patterns:
      - "tests/comprehensive/**/*.test.js"
    timeout: 300000
    parallel: false
    
  performance:
    enabled: true
    framework: "jest"
    patterns:
      - "tests/performance/**/*.test.js"
    baseline_file: "tests/fixtures/performance-baseline.json"
    
  security:
    enabled: true
    framework: "jest"
    patterns:
      - "tests/security/**/*.test.js"
    
python_tests:
  unit:
    enabled: true
    framework: "pytest"
    patterns:
      - "python-analysis/tests/"
    coverage_threshold: 75
    
data_quality:
  dbt_tests:
    enabled: true
    framework: "dbt"
    models: "all"
    
  custom_validation:
    enabled: true
    scripts:
      - "scripts/validate_data_quality.py"
```

#### Monitoring Configuration
```yaml
# monitoring-config/monitoring-config.yaml
monitoring:
  system:
    metrics:
      collection_interval_seconds: 10
      retention_days: 30
      
    health_checks:
      interval_seconds: 30
      timeout_seconds: 5
      retries: 3
      
    alerting:
      enabled: true
      channels:
        - type: "console"
          level: "error"
        - type: "file"
          path: "./logs/alerts.log"
        - type: "webhook"
          url: "http://localhost:3000/api/alerts"
          
  components:
    duckdb:
      enabled: true
      metrics:
        - "connection_count"
        - "query_execution_time" 
        - "memory_usage"
        - "disk_usage"
      thresholds:
        connection_count:
          warning: 80
          critical: 95
        query_execution_time:
          warning: 10
          critical: 30
          
    dagster:
      enabled: true
      metrics:
        - "pipeline_success_rate"
        - "asset_materialization_time"
        - "job_queue_length"
      check_interval_seconds: 60
      
    evidence:
      enabled: true
      metrics:
        - "build_time"
        - "site_load_time"
        - "error_rate"
      performance_budget:
        build_time_seconds: 300
        site_load_time_seconds: 3
        
  data_quality:
    enabled: true
    validation_rules:
      - name: "completeness_check"
        query: "SELECT COUNT(*) FROM {table} WHERE {column} IS NULL"
        threshold: 5
        
      - name: "uniqueness_check"
        query: "SELECT COUNT(*) - COUNT(DISTINCT {column}) FROM {table}"
        threshold: 0
```

## Configuration Validation

### Schema Validation
The system uses JSON Schema validation for all YAML configuration files:

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "system": {
      "type": "object",
      "properties": {
        "name": {"type": "string"},
        "version": {"type": "string", "pattern": "^\\d+\\.\\d+\\.\\d+$"},
        "mode": {"type": "string", "enum": ["development", "staging", "production"]}
      },
      "required": ["name", "version", "mode"]
    }
  }
}
```

### Configuration Validation Commands
```bash
# Validate all configuration files
npm run config:validate

# Validate specific configuration
npm run config:validate -- --file config/main-config.yaml

# Check configuration syntax
npm run config:lint

# Generate configuration schema
npm run config:schema
```

## Configuration Templates

### Development Environment Template
```yaml
# config/templates/development.yaml
system:
  mode: development
  log_level: debug
  
components:
  ingestion:
    pyairbyte:
      batch_size: 100
      max_workers: 2
      
  analytics:
    duckdb:
      memory_limit: "2GB"
      thread_count: 2
      
resources:
  memory:
    total_limit_gb: 8
```

### Production Environment Template
```yaml
# config/templates/production.yaml
system:
  mode: production
  log_level: info
  
components:
  ingestion:
    pyairbyte:
      batch_size: 5000
      max_workers: 8
      
  analytics:
    duckdb:
      memory_limit: "16GB" 
      thread_count: 8
      
resources:
  memory:
    total_limit_gb: 32
    
monitoring:
  enabled: true
  quality_gates_enabled: true
  alert_cooldown_minutes: 5
```

## Configuration Migration

### Version Migration Scripts
```bash
# Migrate configuration from v1.7 to v1.8
npm run config:migrate -- --from 1.7 --to 1.8

# Validate migrated configuration
npm run config:validate -- --migrated

# Backup current configuration
npm run config:backup
```

## Troubleshooting Configuration Issues

### Common Configuration Problems

#### 1. Invalid YAML Syntax
```bash
# Check YAML syntax
npm run config:lint

# Fix common issues
npm run config:fix -- --file config/main-config.yaml
```

#### 2. Missing Required Fields
```bash
# Validate against schema
npm run config:validate -- --strict

# Show required fields
npm run config:schema -- --required-only
```

#### 3. Environment Variable Issues
```bash
# Check environment variables
npm run config:env-check

# Show resolved configuration
npm run config:resolved
```

## Best Practices

### Configuration Management
1. **Version Control**: All configuration files in version control
2. **Environment Separation**: Separate configs for dev/staging/prod
3. **Secret Management**: Never store secrets in config files
4. **Validation**: Always validate configuration changes
5. **Documentation**: Document all configuration options

### Security Considerations
1. **Credential Storage**: Use environment variables for credentials
2. **File Permissions**: Restrict access to configuration files
3. **Audit Logging**: Log all configuration changes
4. **Encryption**: Encrypt sensitive configuration data

### Performance Optimization
1. **Resource Limits**: Set appropriate resource limits
2. **Caching**: Enable caching where appropriate
3. **Connection Pooling**: Configure connection pools
4. **Monitoring**: Monitor configuration effectiveness

## Appendix

### Configuration File Locations Quick Reference
| Component | Configuration File | Location |
|-----------|-------------------|----------|
| System | main-config.yaml | config/ |
| Quality Gates | quality-gates.yaml | config/quality-assurance/ |
| DuckDB | duckdb-memory-config-templates.yaml | data/ |
| Dagster | dagster.yaml | dagster-project/ |
| dbt | dbt_project.yml | dbt-project/ |
| Evidence | evidence.config.yaml | evidence-project/ |
| Monitoring | monitoring-config.yaml | monitoring-config/ |

### Environment Variable Quick Reference
| Variable | Default | Description |
|----------|---------|-------------|
| BMAD_ENV | development | Environment mode |
| DUCKDB_MEMORY_LIMIT | 4GB | DuckDB memory allocation |
| DAGSTER_WEB_PORT | 3000 | Dagster web interface port |
| EVIDENCE_PORT | 3001 | Evidence.dev port |
| QA_ENABLED | true | Enable quality gates |

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial configuration reference | Dev Agent |