# Data Practitioner System - Deployment and Operations Guide

## Overview
Comprehensive guide for deploying and operating the BMad Data Practitioner Agent System (Stories 1.1-1.8) including infrastructure setup, configuration, and operational procedures.

## Prerequisites

### System Requirements
- **Node.js**: ≥18.0.0 LTS (for BMad CLI and Evidence.dev)
- **Python**: ≥3.9 (for PyAirbyte, Dagster, dbt/SQLmesh)
- **DuckDB**: Included in Python package
- **Memory**: Minimum 8GB RAM, 16GB recommended for larger datasets
- **Storage**: 10GB available space, SSD recommended

### External Dependencies
- **Evidence.dev Account**: For publication platform (Story 1.7)
- **Dagster Cloud** (optional): For enhanced orchestration monitoring
- **PyAirbyte Connectors**: Source-specific credentials required

## Installation Process

### 1. BMad Method Base Installation
```bash
# Clone and setup BMad Method
git clone <repository-url>
cd bmad-method
npm install

# Verify installation
npm test
```

### 2. Data Practitioner Expansion Pack Setup
```bash
# Navigate to expansion pack
cd expansion-packs/bmad-data-practitioner

# Install Python dependencies
pip install -r requirements.txt

# Setup DuckDB configuration
python scripts/setup_duckdb.py

# Install Evidence.dev project
cd evidence-project
npm install
```

### 3. Component Initialization

#### Infrastructure Services (Story 1.1)
```bash
# Initialize agent configuration
npx bmad init-agents --profile data-practitioner

# Setup directory structure
npm run setup:infrastructure
```

#### Data Ingestion (Story 1.2)
```bash
# Configure PyAirbyte connectors
python -m tools.data-services.pyairbyte-wrapper --init

# Test source connections
python scripts/test_connectors.py
```

#### Analytics Platform (Story 1.3)
```bash
# Initialize DuckDB configuration
node tools/data-services/duckdb-wrapper.js --init

# Setup memory management
node tools/data-services/memory-manager.js --configure
```

#### Orchestration (Story 1.4)
```bash
# Setup Dagster workspace
cd dagster-project
dagster dev

# Verify pipeline assets
dagster asset materialize --select "*"
```

#### Transformation Engines (Story 1.5)
```bash
# Initialize dbt project
cd bmad-data-practitioner/dbt-project
dbt deps
dbt debug

# Initialize SQLmesh project (if used)
cd ../sqlmesh-project
sqlmesh --config config.yaml init
```

#### Analysis Engine (Story 1.6)
```bash
# Setup Python analysis environment
python -m tools.data-services.eda-engine --init

# Test hypothesis generation
python python-analysis/hypothesis_generation.py --test
```

#### Publication Platform (Story 1.7)
```bash
# Configure Evidence.dev
cd evidence-project
npm run build
npm run preview
```

#### Quality Assurance (Story 1.8)
```bash
# Initialize quality gates
npm run qa:init

# Run comprehensive test suite
npm run test:comprehensive
```

## Configuration Management

### Environment Variables
Create `.env` file in project root:
```env
# Database Configuration
DUCKDB_PATH=./data/analytics.duckdb
DUCKDB_MEMORY_LIMIT=4GB
DUCKDB_THREADS=4

# PyAirbyte Configuration
PYAIRBYTE_CONFIG_PATH=./config/sources.yaml
PYAIRBYTE_TEMP_DIR=./temp/airbyte

# Dagster Configuration
DAGSTER_HOME=./dagster-project
DAGSTER_WEB_PORT=3000

# Evidence.dev Configuration
EVIDENCE_PORT=3001
EVIDENCE_BUILD_DIR=./evidence-project/build

# Quality Assurance
QA_REPORT_DIR=./reports/quality
QA_THRESHOLD_CONFIG=./config/quality-assurance/quality-gates.yaml
```

### Configuration Files

#### Main Configuration (`config/main-config.yaml`)
```yaml
system:
  name: "BMad Data Practitioner System"
  version: "1.8.0"
  mode: "production"

components:
  infrastructure:
    agent_discovery: true
    auto_setup: true
  
  ingestion:
    pyairbyte:
      auto_detect_sources: true
      connection_retry: 3
      batch_size: 1000
  
  analytics:
    duckdb:
      memory_limit: "4GB"
      temp_directory: "./temp/duckdb"
      enable_parallel: true
  
  transformation:
    primary_engine: "dbt"  # or "sqlmesh"
    dual_engine_mode: false
    cost_optimization: true
  
  orchestration:
    dagster:
      web_port: 3000
      auto_materialize: true
  
  publication:
    evidence:
      auto_deploy: false
      build_optimization: true

monitoring:
  quality_gates: true
  performance_monitoring: true
  security_logging: true
```

## Deployment Procedures

### Development Environment
```bash
# 1. Start all services
npm run dev:all

# 2. Verify component status
npm run status:check

# 3. Run integration tests
npm run test:integration
```

### Staging Environment
```bash
# 1. Build production assets
npm run build:production

# 2. Run quality gates
npm run qa:full-suite

# 3. Deploy to staging
npm run deploy:staging

# 4. Run acceptance tests
npm run test:acceptance
```

### Production Environment
```bash
# 1. Final quality validation
npm run qa:pre-production

# 2. Create deployment backup
npm run backup:create

# 3. Deploy with blue-green strategy
npm run deploy:production --strategy=blue-green

# 4. Verify deployment health
npm run health:verify

# 5. Monitor for issues
npm run monitor:production
```

## Operational Procedures

### Daily Operations

#### System Health Check
```bash
# Quick health verification
npm run health:quick

# Component status
node tools/data-services/monitoring-engine.js --status

# Performance metrics
npm run metrics:daily
```

#### Data Pipeline Monitoring
```bash
# Check pipeline status
dagster asset list --workspace dagster-project

# Review quality metrics
node tools/data-services/quality-assurance-engine.js --report

# Monitor resource usage
node tools/data-services/monitoring-engine.js --resources
```

### Incident Response

#### Performance Issues
1. **Identify bottleneck**: Run performance profiler
2. **Check resource usage**: Memory, CPU, disk I/O
3. **Review recent changes**: Git history, configuration changes
4. **Apply immediate fixes**: Resource scaling, query optimization
5. **Document resolution**: Update troubleshooting guide

#### Data Quality Issues
1. **Isolate affected data**: Identify scope and timeframe
2. **Check source systems**: Verify upstream data integrity
3. **Review transformation logic**: Check dbt/SQLmesh models
4. **Implement fixes**: Data correction or logic updates
5. **Validate resolution**: Re-run quality checks

#### System Failures
1. **Assess impact**: Affected components and users
2. **Check dependencies**: External services, network connectivity
3. **Review logs**: System, application, and security logs
4. **Restore service**: Rollback or hotfix deployment
5. **Post-incident review**: Document lessons learned

## Maintenance Procedures

### Regular Maintenance

#### Weekly Tasks
- Review system performance metrics
- Update dependency packages (security patches)
- Clean temporary files and logs
- Validate backup integrity
- Review and update documentation

#### Monthly Tasks
- Full system backup and archival
- Performance baseline updates
- Security vulnerability assessment
- Capacity planning review
- Quality metrics analysis

### Version Updates

#### Component Updates
```bash
# Update BMad Method core
npm run update:bmad-core

# Update Python dependencies
pip-review --auto

# Update Evidence.dev
cd evidence-project && npm update

# Update Dagster
pip install --upgrade dagster dagster-webserver
```

#### Breaking Changes Management
1. **Review changelog**: Identify breaking changes
2. **Test in development**: Validate compatibility
3. **Update configuration**: Adapt to new requirements
4. **Deploy incrementally**: Stage rollout process
5. **Monitor closely**: Watch for issues post-deployment

## Monitoring and Alerting

### Key Metrics
- **System Performance**: Response times, throughput, error rates
- **Data Quality**: Completeness, accuracy, freshness
- **Resource Usage**: Memory, CPU, storage, network
- **Business Metrics**: Pipeline success rates, user engagement

### Alert Configuration
```yaml
alerts:
  performance:
    - name: "High Response Time"
      threshold: "> 5 seconds"
      severity: "warning"
    - name: "System Overload"
      threshold: "CPU > 80% for 5 minutes"
      severity: "critical"
  
  quality:
    - name: "Data Quality Degradation"
      threshold: "Quality score < 85%"
      severity: "warning"
    - name: "Pipeline Failure"
      threshold: "Failed jobs > 2 in 1 hour"
      severity: "critical"
```

## Backup and Recovery

### Backup Strategy
- **Code Repository**: Git with remote repositories
- **Configuration Files**: Daily automated backup
- **Data**: Incremental daily, full weekly
- **System State**: Complete system snapshots monthly

### Recovery Procedures
1. **Assess damage**: Determine scope of data loss
2. **Select recovery point**: Based on business requirements
3. **Restore components**: Follow priority order
4. **Validate integrity**: Comprehensive testing
5. **Resume operations**: Gradual service restoration

## Security Considerations

### Access Control
- **Multi-factor authentication**: Required for all administrative access
- **Role-based permissions**: Principle of least privilege
- **API key management**: Regular rotation and secure storage
- **Audit logging**: All system access and changes logged

### Data Protection
- **Encryption in transit**: TLS for all network communications
- **Encryption at rest**: Database and file system encryption
- **Data masking**: PII protection in non-production environments
- **Compliance**: GDPR, CCPA, industry-specific requirements

## Troubleshooting Quick Reference

### Common Issues

#### DuckDB Connection Issues
```bash
# Check memory limits
node tools/data-services/duckdb-wrapper.js --memory-check

# Verify file permissions
ls -la data/analytics.duckdb

# Reset connection pool
node tools/data-services/connection-manager.js --reset
```

#### PyAirbyte Sync Failures
```bash
# Test connection
python scripts/test_connectors.py --source <source_name>

# Check logs
tail -f logs/pyairbyte.log

# Restart connector
python -m tools.data-services.pyairbyte-wrapper --restart
```

#### Evidence.dev Build Failures
```bash
# Clear build cache
cd evidence-project && npm run clean

# Verify source connections
npm run sources:test

# Rebuild from scratch
npm run build:full
```

### Emergency Contacts
- **System Administrator**: [Contact Information]
- **Data Team Lead**: [Contact Information]
- **DevOps Team**: [Contact Information]
- **Emergency Hotline**: [Contact Information]

## Appendix

### Reference Links
- [BMad Method Documentation](../docs/README.md)
- [DuckDB Documentation](https://duckdb.org/docs/)
- [Dagster Documentation](https://dagster.io/docs)
- [Evidence.dev Documentation](https://evidence.dev/docs)

### Glossary
- **Agent**: Specialized BMad Method component for specific tasks
- **Asset**: Dagster data processing unit
- **Pipeline**: End-to-end data processing workflow
- **Quality Gate**: Automated validation checkpoint
- **Source**: External data system integrated via PyAirbyte

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial deployment guide creation | Dev Agent |