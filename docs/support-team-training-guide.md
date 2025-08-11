# Support Team Training Guide - Data Practitioner Agent System

## Overview
This guide prepares support teams to assist users with the Data Practitioner Agent System expansion pack.

## Training Modules

### Module 1: System Architecture (2 hours)

#### 1.1 BMad-Method Foundation
- Understanding the agent-based architecture
- Expansion pack concept and structure
- Natural language workflow processing
- YAML/Markdown configuration system

#### 1.2 Data Practitioner Components
- **Data Ingestion**: PyAirbyte connectors and caching
- **Analytics Engine**: DuckDB embedded database
- **Transformation Layer**: dbt-core models and tests
- **Orchestration**: Dagster pipeline management
- **Analysis Tools**: EDA and hypothesis generation
- **Publishing**: Evidence.dev report generation

#### 1.3 Security Architecture
- API key authentication system
- Feature flag controls
- Rollback procedures
- Audit logging

### Module 2: Common Support Scenarios (3 hours)

#### 2.1 Installation Issues

**Scenario**: Python environment setup failure
```
ISSUE: "Python not found" or version mismatch
RESOLUTION:
1. Verify Python >=3.10.0: python --version
2. Install Python from python.org if needed
3. Create virtual environment: python -m venv .venv
4. Activate venv:
   - Windows: .venv\Scripts\activate
   - Mac/Linux: source .venv/bin/activate
5. Retry installation: npm run install:data-pack
```

**Scenario**: PyAirbyte dependency conflicts
```
ISSUE: "Module not found: airbyte"
RESOLUTION:
1. Ensure venv is activated
2. Clear pip cache: pip cache purge
3. Reinstall requirements: pip install -r requirements.txt --force-reinstall
4. Verify installation: python -c "import airbyte; print(airbyte.__version__)"
```

#### 2.2 Authentication Problems

**Scenario**: API key rejection
```
ISSUE: "401 Unauthorized" on data endpoints
RESOLUTION:
1. Verify API key exists in .env file
2. Check key format (no extra spaces/quotes)
3. Verify scope includes required permissions
4. Test with curl:
   curl -H "X-API-Key: YOUR_KEY" http://localhost:3000/api/v1/data-sources
5. If still failing, regenerate key using security tools
```

**Scenario**: Feature flag not working
```
ISSUE: Feature appears disabled despite flag setting
RESOLUTION:
1. Check feature-flags.yaml for correct setting
2. Restart services to reload configuration
3. Verify no typos in flag name
4. Use flag status tool: npm run flags:status
```

#### 2.3 Data Pipeline Issues

**Scenario**: Ingestion failure
```
ISSUE: "Connection refused" when ingesting data
RESOLUTION:
1. Check data source credentials in .env
2. Verify network connectivity to source
3. Test connection manually:
   - For DB: Use database client
   - For API: Use curl/Postman
4. Check PyAirbyte logs: tail -f logs/pyairbyte.log
5. Verify sufficient disk space for cache
```

**Scenario**: DuckDB out of memory
```
ISSUE: "Out of memory" during queries
RESOLUTION:
1. Check current memory limit in config
2. Increase limit: 
   analyticalEngine.duckdb.memoryLimit: "4GB"
3. Enable disk spilling:
   analyticalEngine.duckdb.tempDirectory: "./temp"
4. Optimize query (add LIMIT, use sampling)
5. Monitor with: npm run monitor:duckdb
```

### Module 3: Troubleshooting Tools (2 hours)

#### 3.1 Diagnostic Commands

```bash
# System health check
npm run health:check

# Component status
npm run status:components

# Security audit
npm run security:audit

# Performance metrics
npm run metrics:report

# Log analysis
npm run logs:analyze --component=pyairbyte --level=error

# Feature flag status
npm run flags:status

# Rollback dry-run
npm run rollback:test --story=1.2
```

#### 3.2 Log File Locations

```
logs/
├── bmad-method.log          # Core framework logs
├── security.log             # Authentication and authorization
├── pyairbyte.log           # Data ingestion operations
├── duckdb.log              # Analytics queries
├── dbt.log                 # Transformation runs
├── dagster.log             # Orchestration events
├── evidence.log            # Publication generation
└── performance.log         # Performance metrics
```

#### 3.3 Configuration Validation

```bash
# Validate all configurations
npm run validate:config

# Check specific component
npm run validate:config --component=duckdb

# Test credentials
npm run validate:credentials

# Verify Python environment
npm run validate:python
```

### Module 4: Escalation Procedures (1 hour)

#### 4.1 Escalation Matrix

| Issue Type | L1 Support | L2 Support | Engineering |
|------------|------------|------------|-------------|
| Installation | ✓ | - | - |
| Configuration | ✓ | ✓ | - |
| Authentication | ✓ | ✓ | - |
| Data Pipeline | ✓ | ✓ | ✓ |
| Performance | - | ✓ | ✓ |
| Security | - | - | ✓ |
| Core Framework | - | - | ✓ |

#### 4.2 Information to Collect

**For All Issues**:
1. BMad-Method version: `npm run version`
2. Expansion pack version: `cat expansion-packs/bmad-data-practitioner/config.yaml`
3. Error messages and stack traces
4. Recent configuration changes
5. System resources (CPU, memory, disk)

**For Data Pipeline Issues**:
1. Data source type and size
2. Ingestion/query logs
3. Memory usage during operation
4. Network connectivity test results

**For Security Issues**:
1. Audit logs from security.log
2. Failed authentication attempts
3. Feature flag configuration
4. Recent credential changes

### Module 5: Best Practices (1 hour)

#### 5.1 Preventive Measures

1. **Regular Health Checks**
   - Run `npm run health:check` daily
   - Monitor resource usage trends
   - Review security logs weekly

2. **Configuration Management**
   - Version control all configurations
   - Test changes in staging first
   - Document all modifications

3. **Credential Rotation**
   - Rotate API keys quarterly
   - Update credentials during maintenance windows
   - Test after rotation

#### 5.2 User Education

**Common User Mistakes**:
1. Not activating Python venv before operations
2. Committing credentials to version control
3. Setting memory limits too high
4. Forgetting to enable feature flags
5. Not checking rollback procedures

**Proactive Communications**:
- Send monthly tips newsletter
- Create video tutorials for common tasks
- Maintain FAQ documentation
- Host quarterly training sessions

### Module 6: Hands-On Lab (2 hours)

#### Lab Exercises

1. **Installation Troubleshooting**
   - Deliberately break Python environment
   - Practice diagnosis and resolution
   - Document steps taken

2. **Authentication Debugging**
   - Create invalid API keys
   - Test various failure modes
   - Practice using diagnostic tools

3. **Pipeline Recovery**
   - Simulate ingestion failure
   - Practice rollback procedures
   - Test feature flag controls

4. **Performance Investigation**
   - Create slow query scenario
   - Use monitoring tools
   - Optimize and verify improvement

### Assessment Checklist

Before supporting the Data Practitioner Agent System, team members should be able to:

- [ ] Explain the expansion pack architecture
- [ ] Identify all major components and their roles
- [ ] Navigate log files and configuration files
- [ ] Execute diagnostic commands
- [ ] Resolve common installation issues
- [ ] Debug authentication problems
- [ ] Troubleshoot data pipeline failures
- [ ] Perform basic performance analysis
- [ ] Execute rollback procedures safely
- [ ] Escalate appropriately when needed

### Resources

1. **Documentation**
   - Architecture: `/docs/architecture.md`
   - User Guide: `/docs/user-guide.md`
   - API Reference: `/docs/api-reference.md`

2. **Support Tools**
   - Diagnostic Scripts: `/tools/support/`
   - Log Analyzers: `/tools/log-analysis/`
   - Health Checkers: `/tools/health/`

3. **Contact Information**
   - Engineering Team: data-platform@company.com
   - Security Team: security@company.com
   - On-Call: Use PagerDuty escalation

This training ensures support teams can effectively assist users while maintaining system security and performance.