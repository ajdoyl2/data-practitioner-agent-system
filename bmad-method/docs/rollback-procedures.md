# Rollback Procedures for Data Practitioner Expansion Pack

## Overview

This document describes the rollback procedures for the Data Practitioner Agent System expansion pack. Each story (1.2-1.8) has an independent rollback script that can be executed to safely remove the story's components and restore the system to its previous state.

## Quick Reference

| Story | Feature | Description | Rollback Script |
|-------|---------|-------------|-----------------|
| 1.2 | pyairbyte_integration | PyAirbyte Data Ingestion | rollback-story-1.2.sh |
| 1.3 | duckdb_analytics | DuckDB Local Analytics | rollback-story-1.3.sh |
| 1.4 | dbt_transformations | dbt Core Transformations | rollback-story-1.4.sh |
| 1.5 | dagster_orchestration | Dagster Workflow Orchestration | rollback-story-1.5.sh |
| 1.6 | eda_automation | Automated EDA & Hypothesis Generation | rollback-story-1.6.sh |
| 1.7 | evidence_publishing | Evidence.dev Publication Platform | rollback-story-1.7.sh |
| 1.8 | qa_framework | Quality Assurance & Documentation | rollback-story-1.8.sh |

## Rollback Triggers

### Automatic Triggers

The system monitors for conditions that may require rollback:

1. **Error Rate Threshold** (10%)
   - When error rate exceeds 10% for any data service
   - Monitored via security logging system

2. **Memory Usage Threshold** (90%)
   - When system memory usage exceeds 90%
   - Prevents system instability

3. **Response Time Threshold** (5 seconds)
   - When average response time exceeds 5 seconds
   - Indicates performance degradation

### Manual Triggers

Rollback should be initiated manually when:

1. **Integration Conflicts**
   - Incompatibility with existing BMad-Method functionality
   - Unexpected behavior in core system

2. **Data Corruption**
   - Data integrity issues detected
   - Inconsistent state in data stores

3. **Security Incidents**
   - Unauthorized access attempts
   - Vulnerability exploitation

4. **Business Requirements**
   - Feature no longer needed
   - Change in project direction

## Rollback Procedures

### Using the Rollback Manager (Recommended)

```bash
# Rollback a single story
node tools/rollback/rollback-manager.js rollback 1.2

# Rollback with verbose output
node tools/rollback/rollback-manager.js rollback 1.3 --verbose

# Dry run (preview changes without executing)
node tools/rollback/rollback-manager.js rollback 1.4 --dry-run

# Rollback multiple stories
node tools/rollback/rollback-manager.js rollback 1.5,1.6,1.7

# Get rollback status
node tools/rollback/rollback-manager.js status
```

### Direct Script Execution

```bash
# Navigate to rollback directory
cd tools/rollback

# Execute specific rollback script
./rollback-story-1.2.sh

# Dry run mode
ROLLBACK_DRY_RUN=1 ./rollback-story-1.3.sh

# With custom reason
ROLLBACK_REASON="Performance issues" ./rollback-story-1.4.sh
```

## Rollback Process Flow

### 1. Pre-Rollback Phase
- Capture current system state
- Create data backups
- Log rollback initiation
- Disable feature flag

### 2. Execution Phase
- Stop related services
- Remove service files
- Clean up data directories
- Uninstall dependencies
- Remove configuration

### 3. Validation Phase
- Verify file removal
- Check process termination
- Validate feature disabled
- Test system integrity

### 4. Post-Rollback Phase
- Generate rollback report
- Update documentation
- Notify stakeholders

## Story-Specific Considerations

### Story 1.2 - PyAirbyte Integration
- Backs up connector configurations
- Preserves ingested data (optional)
- Removes Docker containers
- Cleans Python virtual environments

### Story 1.3 - DuckDB Analytics
- **Critical**: Always backs up DuckDB data files
- Preserves analysis results
- Maintains data lineage records

### Story 1.4 - dbt Transformations
- Backs up dbt models and documentation
- Preserves transformation history
- Removes dbt targets and logs

### Story 1.5 - Dagster Orchestration
- Stops all Dagster daemons
- Backs up pipeline definitions
- Preserves run history
- Removes Docker resources

### Story 1.6 - EDA Automation
- Backs up Jupyter notebooks
- Preserves analysis results
- Maintains hypothesis records
- Removes Python data science packages

### Story 1.7 - Evidence.dev Publishing
- Backs up published reports
- Preserves deployment configurations
- Maintains publication history

### Story 1.8 - QA Framework
- Backs up test reports
- Preserves documentation
- Maintains quality metrics

## Recovery Procedures

### Accessing Backups

All rollbacks create timestamped backups in:
```
rollback_backups/
├── pyairbyte_data_20240810_143022/
├── duckdb_data_20240810_143125/
├── dbt_project_20240810_143234/
└── ...
```

### Restoring from Backup

```bash
# List available backups
ls -la rollback_backups/

# Restore specific backup
cp -r rollback_backups/duckdb_data_20240810_143125/* data/duckdb/

# Re-enable feature
bmad enable-feature duckdb_analytics
```

## Validation Checklist

After rollback, verify:

- [ ] Feature flag is disabled
- [ ] No related processes running
- [ ] Service files removed
- [ ] Data backed up successfully
- [ ] Dependencies uninstalled
- [ ] System functionality restored
- [ ] No error messages in logs
- [ ] Core BMad-Method functions normally

## Emergency Procedures

### Complete System Rollback

In case of critical system failure:

```bash
# Rollback all stories in reverse order
node tools/rollback/rollback-manager.js rollback 1.8,1.7,1.6,1.5,1.4,1.3,1.2

# Force rollback with error continuation
node tools/rollback/rollback-manager.js rollback all --force --continue-on-error
```

### Manual Recovery

If automated rollback fails:

1. Stop all Node.js processes
2. Manually disable features in `config/feature-flags.yaml`
3. Remove service directories
4. Clear npm cache and reinstall core dependencies
5. Restore from system backup

## Monitoring and Alerts

### Log Locations

- Security events: `logs/security.log`
- Rollback reports: `rollback_reports/`
- Service logs: `logs/[service-name]/`

### Alert Configuration

Configure alerts for:
- Rollback initiation
- Rollback failures
- Threshold breaches
- Security incidents

## Best Practices

1. **Always perform dry run first**
   - Validates rollback will succeed
   - Shows what will be changed

2. **Document rollback reason**
   - Helps with root cause analysis
   - Required for audit trail

3. **Verify backups**
   - Check backup integrity
   - Test restore procedures

4. **Communicate rollbacks**
   - Notify team members
   - Update project documentation

5. **Post-rollback review**
   - Analyze why rollback was needed
   - Plan corrective actions
   - Update procedures if needed

## Support

For rollback assistance:
- Check rollback reports in `rollback_reports/`
- Review security logs for issues
- Contact system administrator
- File issue in project repository