# Data Practitioner System - Troubleshooting Guide

## Overview
Comprehensive troubleshooting guide for the BMad Data Practitioner Agent System, covering common issues, diagnostic procedures, and resolution strategies for Stories 1.1-1.8.

## Quick Diagnostic Commands

### System Health Check
```bash
# Overall system status
npm run health:check

# Component-specific status
node tools/data-services/monitoring-engine.js --component-status

# Resource utilization
node tools/data-services/monitoring-engine.js --resources

# Quality metrics summary
node tools/data-services/quality-assurance-engine.js --summary
```

### Log Analysis
```bash
# View recent system logs
tail -f logs/system.log

# Security events
tail -f logs/security.log

# Quality assurance logs
tail -f logs/quality-assurance.log

# Component-specific logs
tail -f logs/[component-name].log
```

## Story 1.1 - Infrastructure Issues

### Agent Discovery Failures

#### Symptoms
- Agents not found during initialization
- "Agent configuration not loaded" errors
- Missing agent team configurations

#### Diagnosis
```bash
# Check agent configuration files
ls -la bmad-method/expansion-packs/bmad-data-practitioner/agents/

# Validate agent configuration
node tools/lib/yaml-utils.js --validate agents/data-analyst.md

# Test agent loading
npm run test agents/agent-workflow.test.js
```

#### Solutions
1. **Missing Agent Files**: Ensure all agent configuration files exist
2. **Invalid YAML**: Run YAML validation and fix syntax errors
3. **Permission Issues**: Check file permissions (`chmod 644 agents/*.md`)
4. **Path Configuration**: Verify agent discovery paths in config

### Directory Structure Issues

#### Symptoms
- "Directory not found" errors during initialization
- Missing required folders
- Permission denied errors

#### Diagnosis
```bash
# Verify directory structure
find . -type d -name "*data-practitioner*" | head -20

# Check permissions
ls -la expansion-packs/bmad-data-practitioner/

# Validate structure against requirements
node tools/installer/lib/ide-setup.js --validate-structure
```

#### Solutions
1. **Create Missing Directories**: 
   ```bash
   mkdir -p expansion-packs/bmad-data-practitioner/{docs,data,tasks,templates}
   ```
2. **Fix Permissions**: 
   ```bash
   chmod -R 755 expansion-packs/bmad-data-practitioner/
   ```
3. **Reinitialize Structure**: 
   ```bash
   npm run setup:infrastructure
   ```

## Story 1.2 - Data Ingestion Issues

### PyAirbyte Connection Failures

#### Symptoms
- "Connection failed" errors
- Timeout during source synchronization
- Authentication failures

#### Diagnosis
```bash
# Test PyAirbyte installation
python -c "import airbyte; print(airbyte.__version__)"

# Check connector availability
python scripts/test_connectors.py --list

# Test specific source connection
python scripts/test_connectors.py --source <source_name> --test-connection

# Review PyAirbyte logs
tail -f logs/pyairbyte.log
```

#### Solutions
1. **Installation Issues**:
   ```bash
   pip uninstall pyairbyte
   pip install pyairbyte==0.4.0  # or latest stable version
   ```
2. **Authentication Problems**:
   - Verify credentials in source configuration
   - Check API key expiration
   - Validate OAuth tokens
3. **Network Issues**:
   - Check firewall settings
   - Verify proxy configuration
   - Test network connectivity

### Data Sync Failures

#### Symptoms
- Incomplete data synchronization
- Data format errors
- Schema mismatch issues

#### Diagnosis
```bash
# Check sync status
python -m tools.data-services.pyairbyte-wrapper --status

# Validate data schema
python -m tools.data-services.pyairbyte-wrapper --validate-schema

# Check data quality
node tools/data-services/quality-assurance-engine.js --check-ingestion
```

#### Solutions
1. **Schema Evolution**: Update schema definitions
2. **Data Type Conversion**: Implement type casting in transformation layer
3. **Incremental Sync Issues**: Reset sync state if necessary

## Story 1.3 - Analytics Platform Issues

### DuckDB Connection Problems

#### Symptoms
- "Database locked" errors
- Connection timeouts
- Memory allocation failures

#### Diagnosis
```bash
# Check DuckDB status
node tools/data-services/duckdb-wrapper.js --status

# Test connection
node tools/data-services/duckdb-wrapper.js --test-connection

# Check memory usage
node tools/data-services/memory-manager.js --status

# Validate database file
file data/analytics.duckdb
```

#### Solutions
1. **Database Locks**:
   ```bash
   # Kill blocking processes
   node tools/data-services/duckdb-wrapper.js --kill-connections
   
   # Restart connection pool
   node tools/data-services/connection-manager.js --restart
   ```
2. **Memory Issues**:
   ```bash
   # Adjust memory settings
   export DUCKDB_MEMORY_LIMIT=2GB
   
   # Clear memory caches
   node tools/data-services/memory-manager.js --clear-cache
   ```
3. **File Corruption**:
   ```bash
   # Restore from backup
   cp backups/analytics_backup.duckdb data/analytics.duckdb
   ```

### Query Performance Issues

#### Symptoms
- Slow query execution
- Timeout errors
- High memory usage during queries

#### Diagnosis
```bash
# Profile query performance
node tools/data-services/duckdb-wrapper.js --profile-query "SELECT * FROM large_table LIMIT 10"

# Check query plans
node tools/data-services/duckdb-wrapper.js --explain-query "your_query_here"

# Monitor resource usage
node tools/data-services/performance-monitor.js --real-time
```

#### Solutions
1. **Query Optimization**:
   - Add appropriate indexes
   - Implement query result caching
   - Use LIMIT clauses for exploratory queries
2. **Resource Management**:
   - Increase memory allocation
   - Use columnar storage optimizations
   - Implement query result pagination

## Story 1.4 - Orchestration Issues

### Dagster Pipeline Failures

#### Symptoms
- Asset materialization failures
- Job execution errors
- Sensor/schedule malfunctions

#### Diagnosis
```bash
# Check Dagster daemon status
dagster-daemon status

# View recent runs
dagster run list --limit 10

# Check specific asset status
dagster asset list --workspace dagster-project

# View job logs
dagster run logs <run_id>
```

#### Solutions
1. **Daemon Issues**:
   ```bash
   # Restart Dagster daemon
   dagster-daemon restart
   
   # Check daemon logs
   tail -f ~/.dagster/logs/dagster-daemon.log
   ```
2. **Asset Dependencies**:
   - Verify upstream asset availability
   - Check dependency graph for cycles
   - Validate asset configuration
3. **Resource Conflicts**:
   - Adjust concurrency settings
   - Implement resource management
   - Schedule jobs to avoid conflicts

### Workflow Orchestration Problems

#### Symptoms
- Tasks not executing in correct order
- Missing task dependencies
- Workflow state inconsistencies

#### Diagnosis
```bash
# Validate workflow configuration
node tools/data-services/workflow-orchestrator.js --validate

# Check task dependencies
node tools/data-services/workflow-orchestrator.js --dependency-graph

# Monitor workflow execution
node tools/data-services/workflow-orchestrator.js --monitor
```

#### Solutions
1. **Fix Dependencies**: Update task dependency configurations
2. **State Recovery**: Implement workflow state recovery mechanisms
3. **Error Handling**: Add robust error handling to workflow steps

## Story 1.5 - Transformation Issues

### dbt Model Failures

#### Symptoms
- Model compilation errors
- Test failures
- Dependency resolution issues

#### Diagnosis
```bash
# Check dbt installation
cd bmad-data-practitioner/dbt-project && dbt --version

# Compile models
dbt compile

# Run tests
dbt test

# Check model dependencies
dbt deps
```

#### Solutions
1. **Compilation Errors**:
   ```bash
   # Debug specific model
   dbt compile --select model_name
   
   # Check SQL syntax
   dbt parse
   ```
2. **Test Failures**:
   - Review test configurations
   - Update test thresholds
   - Add custom test macros
3. **Dependency Issues**:
   ```bash
   # Update dependencies
   dbt deps --upgrade
   
   # Check for version conflicts
   dbt list --resource-type package
   ```

### SQLmesh Integration Problems

#### Symptoms
- Model execution failures
- Configuration errors
- Performance issues

#### Diagnosis
```bash
# Check SQLmesh configuration
cd bmad-data-practitioner/sqlmesh-project && sqlmesh config

# Validate models
sqlmesh validate

# Test model execution
sqlmesh run --dry-run
```

#### Solutions
1. **Configuration Issues**: Validate SQLmesh configuration files
2. **Model Errors**: Debug individual model SQL
3. **Performance**: Optimize model execution plans

### Dual-Engine Coordination Issues

#### Symptoms
- Engine selection failures
- Inconsistent results between engines
- Cost optimization not working

#### Diagnosis
```bash
# Check transformation engine factory
node tools/data-services/transformation-engine-factory.js --status

# Validate engine coordination
npm run test tests/data-services/transformation-engine-factory.test.js

# Review cost tracking
node tools/data-services/cost-tracker.js --report
```

#### Solutions
1. **Engine Selection**: Review and update engine selection logic
2. **Result Consistency**: Implement cross-engine validation
3. **Cost Optimization**: Tune cost-benefit algorithms

## Story 1.6 - Analysis Engine Issues

### EDA Engine Problems

#### Symptoms
- Analysis generation failures
- Statistical computation errors
- Hypothesis generation issues

#### Diagnosis
```bash
# Test EDA engine
python tools/data-services/test-eda-simple.js

# Check Python analysis components
python python-analysis/eda_automation.py --test

# Validate statistical testing
python python-analysis/statistical_testing.py --validate
```

#### Solutions
1. **Python Dependencies**: 
   ```bash
   pip install -r requirements.txt
   pip install --upgrade pandas numpy scipy matplotlib seaborn
   ```
2. **Statistical Errors**: Review and update statistical computation logic
3. **Data Issues**: Validate input data quality and format

### Hypothesis Generation Failures

#### Symptoms
- No hypotheses generated
- Invalid hypothesis formats
- Performance issues with large datasets

#### Diagnosis
```bash
# Test hypothesis generation
python tools/data-services/test-hypothesis-generator.js

# Check pattern detection
python python-analysis/pattern_detection.py --test

# Validate statistical testing integration
node tools/data-services/statistical-tester.js --test
```

#### Solutions
1. **Algorithm Tuning**: Adjust hypothesis generation parameters
2. **Performance Optimization**: Implement data sampling strategies
3. **Validation Logic**: Enhance hypothesis validation rules

## Story 1.7 - Publication Platform Issues

### Evidence.dev Build Failures

#### Symptoms
- Build process errors
- Component rendering issues
- Static site generation failures

#### Diagnosis
```bash
# Check Evidence.dev installation
cd evidence-project && npm run dev

# Test build process
npm run build

# Validate sources
npm run sources:test

# Check component loading
npm run test:components
```

#### Solutions
1. **Build Errors**:
   ```bash
   # Clear build cache
   npm run clean
   
   # Reinstall dependencies
   rm -rf node_modules package-lock.json
   npm install
   ```
2. **Component Issues**:
   - Validate Svelte component syntax
   - Check component dependencies
   - Review component props and data binding
3. **Source Connection Problems**:
   - Verify DuckDB connection in sources configuration
   - Test SQL queries in source files
   - Check data availability

### Performance Issues

#### Symptoms
- Slow page load times
- Build timeouts
- High memory usage during build

#### Diagnosis
```bash
# Profile build performance
cd evidence-project && npm run build:profile

# Check bundle sizes
npm run analyze

# Monitor resource usage during build
top -p $(pgrep -f "evidence")
```

#### Solutions
1. **Optimize Queries**: Reduce data fetching overhead
2. **Implement Caching**: Add query result caching
3. **Code Splitting**: Implement dynamic imports for large components

## Story 1.8 - Quality Assurance Issues

### Quality Gate Failures

#### Symptoms
- Quality gates blocking deployments
- False positive quality failures
- Inconsistent quality metrics

#### Diagnosis
```bash
# Check quality gate configuration
cat config/quality-assurance/quality-gates.yaml

# Run quality assessment
node tools/data-services/quality-assurance-engine.js --assess

# Review quality metrics
node tools/data-services/quality-assurance-engine.js --metrics
```

#### Solutions
1. **Threshold Adjustment**: Review and adjust quality thresholds
2. **Metric Calibration**: Calibrate quality metrics based on system performance
3. **Exception Handling**: Implement quality exception workflows

### Testing Framework Issues

#### Symptoms
- Test suite failures
- Incomplete test coverage
- Performance test timeouts

#### Diagnosis
```bash
# Run comprehensive test suite
npm run test:comprehensive

# Check test coverage
npm run test:coverage

# Review test performance
npm run test:performance
```

#### Solutions
1. **Test Fixes**: Debug and fix failing tests
2. **Coverage Improvement**: Add tests for uncovered code
3. **Performance Optimization**: Optimize slow-running tests

## Performance Troubleshooting

### System Performance Issues

#### Memory Issues
```bash
# Check memory usage
free -h

# Monitor process memory
ps aux --sort=-%mem | head

# Check for memory leaks
node --inspect tools/data-services/monitoring-engine.js
```

#### CPU Issues
```bash
# Check CPU usage
top -p $(pgrep -f "node\|python\|dagster")

# Profile CPU usage
perf top -p $(pgrep -f "node")

# Check for high-CPU processes
ps aux --sort=-%cpu | head
```

#### Disk I/O Issues
```bash
# Check disk usage
df -h

# Monitor I/O activity
iotop

# Check for large files
find . -type f -size +100M | head -10
```

### Network Issues
```bash
# Test connectivity
ping -c 4 api.evidence.dev

# Check port availability
netstat -tlnp | grep :3000

# Monitor network traffic
nethogs
```

## Emergency Procedures

### System Recovery
1. **Stop all services**:
   ```bash
   npm run stop:all
   ```
2. **Check system resources**:
   ```bash
   npm run health:emergency
   ```
3. **Restore from backup** (if necessary):
   ```bash
   npm run restore:emergency
   ```
4. **Restart services incrementally**:
   ```bash
   npm run start:minimal
   npm run start:core-services
   npm run start:all
   ```

### Data Recovery
1. **Assess data integrity**:
   ```bash
   node tools/data-services/quality-assurance-engine.js --integrity-check
   ```
2. **Restore from backup**:
   ```bash
   npm run data:restore --backup-date=YYYY-MM-DD
   ```
3. **Validate restored data**:
   ```bash
   npm run test:data-integrity
   ```

## Getting Help

### Internal Resources
- **Documentation**: Check `/docs` directory for detailed guides
- **Test Suite**: Run relevant tests to isolate issues
- **Configuration**: Review YAML configuration files

### External Resources
- **BMad Method Community**: [Community Forum Link]
- **Component Documentation**: 
  - [DuckDB Docs](https://duckdb.org/docs/)
  - [Dagster Docs](https://dagster.io/docs)
  - [Evidence.dev Docs](https://evidence.dev/docs)

### Contact Information
- **System Administrator**: [Contact Info]
- **Data Team Lead**: [Contact Info]
- **Emergency Support**: [24/7 Hotline]

## Preventive Measures

### Regular Maintenance
- **Daily**: System health checks, log review
- **Weekly**: Performance metrics review, backup verification
- **Monthly**: Security audit, dependency updates

### Monitoring Setup
- **Alerts**: Configure alerts for critical system metrics
- **Dashboards**: Set up monitoring dashboards
- **Automation**: Implement automated health checks

### Documentation Updates
- **Issue Tracking**: Document new issues and solutions
- **Knowledge Base**: Update troubleshooting procedures
- **Training**: Regular team training on common issues

## Appendix

### Common Error Codes
- **E1001**: Agent configuration not found
- **E1002**: Database connection failed
- **E1003**: Quality gate threshold exceeded
- **E1004**: Transform engine selection failed
- **E1005**: Publication build failed

### Useful Commands Reference
```bash
# System status
npm run status:all

# Component restart
npm run restart:<component-name>

# Emergency shutdown
npm run emergency:stop

# Recovery mode
npm run recovery:start

# Health verification
npm run health:full
```

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial troubleshooting guide creation | Dev Agent |