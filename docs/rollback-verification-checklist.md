# Rollback Verification Checklist

## Overview
This checklist ensures complete and safe rollback of Data Practitioner Agent System stories. Each story must pass all verification steps before rollback is considered complete.

## Pre-Rollback Checklist

### 1. Preparation Phase
- [ ] **Backup Current State**
  ```bash
  # Create rollback checkpoint
  npm run backup:create --name="pre-rollback-$(date +%Y%m%d-%H%M%S)"
  
  # Verify backup integrity
  npm run backup:verify --latest
  ```

- [ ] **Document Current Configuration**
  ```bash
  # Export current configuration
  npm run config:export > config-backup-$(date +%Y%m%d).json
  
  # Export feature flag states
  npm run flags:export > flags-backup-$(date +%Y%m%d).yaml
  ```

- [ ] **Notify Stakeholders**
  - [ ] Send rollback notification to team
  - [ ] Update status page if applicable
  - [ ] Pause any running data pipelines

## Story-Specific Rollback Verification

### Story 1.1.5: Security Foundation

**Rollback Script**: `tools/rollback/rollback-story-1.1.5.sh`

- [ ] **Pre-Rollback Checks**
  ```bash
  # Verify no active sessions using authentication
  npm run security:active-sessions
  
  # Check for in-flight security operations
  npm run security:pending-ops
  ```

- [ ] **Execute Rollback**
  ```bash
  # Run rollback script
  ./tools/rollback/rollback-story-1.1.5.sh
  
  # Expected output:
  # - Removing security-service.js... ✓
  # - Removing feature-flag-manager.js... ✓
  # - Cleaning security logs... ✓
  # - Removing API key store... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify components removed
  test ! -f tools/lib/security-service.js || echo "FAIL: Security service still exists"
  test ! -f tools/lib/feature-flag-manager.js || echo "FAIL: Feature flag manager still exists"
  
  # Verify no authentication middleware active
  curl -X GET http://localhost:3000/api/v1/data-sources 2>/dev/null | grep -q "401" && echo "FAIL: Auth still active"
  
  # Check feature flags disabled
  grep -q "false" config/feature-flags.yaml || echo "FAIL: Feature flags not disabled"
  ```

### Story 1.2: PyAirbyte Integration

**Rollback Script**: `tools/rollback/rollback-story-1.2.sh`

- [ ] **Pre-Rollback Checks**
  ```bash
  # Stop any active ingestion jobs
  npm run ingestion:stop-all
  
  # Check for cached data
  du -sh .cache/pyairbyte/
  ```

- [ ] **Execute Rollback**
  ```bash
  ./tools/rollback/rollback-story-1.2.sh
  
  # Expected output:
  # - Stopping PyAirbyte processes... ✓
  # - Removing Python virtual environment... ✓
  # - Cleaning PyAirbyte cache... ✓
  # - Removing data-ingestion-service.js... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify Python environment removed
  test ! -d .venv || echo "FAIL: Virtual environment still exists"
  
  # Check PyAirbyte processes stopped
  ps aux | grep -q "[p]yairbyte" && echo "FAIL: PyAirbyte processes still running"
  
  # Verify cache cleaned
  test ! -d .cache/pyairbyte || echo "FAIL: PyAirbyte cache still exists"
  
  # Test ingestion endpoints removed
  curl -X POST http://localhost:3000/api/v1/data-sources 2>&1 | grep -q "404" || echo "FAIL: Ingestion API still active"
  ```

### Story 1.3: DuckDB Integration

**Rollback Script**: `tools/rollback/rollback-story-1.3.sh`

- [ ] **Pre-Rollback Checks**
  ```bash
  # Check for active DuckDB connections
  npm run duckdb:active-connections
  
  # Backup any important data
  cp -r .duckdb/ .duckdb-backup-$(date +%Y%m%d)/
  ```

- [ ] **Execute Rollback**
  ```bash
  ./tools/rollback/rollback-story-1.3.sh
  
  # Expected output:
  # - Closing DuckDB connections... ✓
  # - Removing DuckDB database files... ✓
  # - Removing analytical-engine.js... ✓
  # - Cleaning temporary files... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify DuckDB files removed
  test ! -d .duckdb || echo "FAIL: DuckDB directory still exists"
  
  # Check no DuckDB processes
  lsof | grep -q "duckdb" && echo "FAIL: DuckDB files still open"
  
  # Verify analytical endpoints removed
  curl -X POST http://localhost:3000/api/v1/analytics/query 2>&1 | grep -q "404" || echo "FAIL: Analytics API still active"
  ```

### Story 1.4: dbt Integration

**Rollback Script**: `tools/rollback/rollback-story-1.4.sh`

- [ ] **Pre-Rollback Checks**
  ```bash
  # Check for running dbt processes
  ps aux | grep -q "[d]bt run" && echo "WARNING: dbt processes running"
  
  # Backup dbt models
  tar -czf dbt-models-backup-$(date +%Y%m%d).tar.gz dbt/
  ```

- [ ] **Execute Rollback**
  ```bash
  ./tools/rollback/rollback-story-1.4.sh
  
  # Expected output:
  # - Stopping dbt processes... ✓
  # - Removing dbt project directory... ✓
  # - Removing transformation-engine.js... ✓
  # - Cleaning dbt logs... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify dbt directory removed
  test ! -d dbt/ || echo "FAIL: dbt directory still exists"
  
  # Check transformation service removed
  test ! -f tools/data-services/transformation-engine.js || echo "FAIL: Transformation engine still exists"
  
  # Verify dbt commands unavailable
  which dbt 2>/dev/null && echo "FAIL: dbt command still available"
  ```

### Story 1.5: Dagster Integration

**Rollback Script**: `tools/rollback/rollback-story-1.5.sh`

- [ ] **Pre-Rollback Checks**
  ```bash
  # Stop Dagster daemon
  dagster daemon stop
  
  # Check for running pipelines
  dagster pipeline list --status RUNNING
  ```

- [ ] **Execute Rollback**
  ```bash
  ./tools/rollback/rollback-story-1.5.sh
  
  # Expected output:
  # - Stopping Dagster daemon... ✓
  # - Removing Dagster home directory... ✓
  # - Removing orchestration-service.js... ✓
  # - Cleaning Dagster database... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify Dagster processes stopped
  ps aux | grep -q "[d]agster" && echo "FAIL: Dagster processes still running"
  
  # Check Dagster home removed
  test ! -d ~/.dagster || echo "FAIL: Dagster home still exists"
  
  # Verify orchestration service removed
  test ! -f tools/data-services/orchestration-service.js || echo "FAIL: Orchestration service still exists"
  ```

### Story 1.6: EDA Tools Integration

**Rollback Script**: `tools/rollback/rollback-story-1.6.sh`

- [ ] **Execute Rollback**
  ```bash
  ./tools/rollback/rollback-story-1.6.sh
  
  # Expected output:
  # - Removing EDA tool configurations... ✓
  # - Removing hypothesis-engine.js... ✓
  # - Cleaning analysis cache... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify EDA tools removed
  pip list | grep -E "pandas-profiling|sweetviz|autoviz" && echo "FAIL: EDA tools still installed"
  
  # Check hypothesis engine removed
  test ! -f tools/data-services/hypothesis-engine.js || echo "FAIL: Hypothesis engine still exists"
  ```

### Story 1.7: Evidence.dev Integration

**Rollback Script**: `tools/rollback/rollback-story-1.7.sh`

- [ ] **Pre-Rollback Checks**
  ```bash
  # Check for Evidence.dev builds
  ls -la evidence/build/ 2>/dev/null
  
  # Stop Evidence dev server if running
  pkill -f "evidence dev"
  ```

- [ ] **Execute Rollback**
  ```bash
  ./tools/rollback/rollback-story-1.7.sh
  
  # Expected output:
  # - Removing Evidence.dev project... ✓
  # - Removing publication-engine.js... ✓
  # - Cleaning build artifacts... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify Evidence directory removed
  test ! -d evidence/ || echo "FAIL: Evidence directory still exists"
  
  # Check publication engine removed
  test ! -f tools/data-services/publication-engine.js || echo "FAIL: Publication engine still exists"
  
  # Verify Evidence commands unavailable
  which evidence 2>/dev/null && echo "FAIL: Evidence command still available"
  ```

### Story 1.8: QA Framework

**Rollback Script**: `tools/rollback/rollback-story-1.8.sh`

- [ ] **Execute Rollback**
  ```bash
  ./tools/rollback/rollback-story-1.8.sh
  
  # Expected output:
  # - Removing QA test suites... ✓
  # - Removing quality-validator.js... ✓
  # - Cleaning test reports... ✓
  ```

- [ ] **Post-Rollback Verification**
  ```bash
  # Verify QA tests removed
  test ! -d tests/data-quality/ || echo "FAIL: QA tests still exist"
  
  # Check quality validator removed
  test ! -f tools/data-services/quality-validator.js || echo "FAIL: Quality validator still exists"
  ```

## Post-Rollback System Verification

### 1. Core BMad-Method Functionality
- [ ] **Verify Core Commands Work**
  ```bash
  # Test basic BMad commands
  npm run bmad -- --help
  npm run build
  npm run test
  ```

- [ ] **Check Agent Loading**
  ```bash
  # Verify core agents load
  npm run agent:list
  npm run agent:validate
  ```

### 2. System Health Check
- [ ] **Run Comprehensive Health Check**
  ```bash
  npm run health:check --comprehensive
  
  # Expected: All core components PASS
  ```

- [ ] **Verify No Orphaned Processes**
  ```bash
  # Check for lingering Python processes
  ps aux | grep -E "python|pyairbyte|dbt|dagster|evidence" | grep -v grep
  
  # Check for orphaned Node workers
  ps aux | grep "node.*data-services" | grep -v grep
  ```

### 3. Configuration Restoration
- [ ] **Restore Original Configuration**
  ```bash
  # If needed, restore backed up configuration
  npm run config:import < config-backup-[date].json
  ```

- [ ] **Verify Feature Flags Reset**
  ```bash
  # All data practitioner flags should be false
  cat config/feature-flags.yaml | grep -E "pyairbyte|duckdb|dbt|dagster|eda|evidence" | grep -v "false" && echo "FAIL: Feature flags not reset"
  ```

### 4. Final Validation
- [ ] **Complete System Test**
  ```bash
  # Run full system test suite
  npm run test:system
  
  # Expected: All tests pass
  ```

- [ ] **Generate Rollback Report**
  ```bash
  npm run rollback:report --story=[story-number] > rollback-report-$(date +%Y%m%d).txt
  ```

## Rollback Completion Criteria

The rollback is considered complete when:

1. ✅ All story-specific components removed
2. ✅ No active processes from rolled-back story
3. ✅ All data and cache directories cleaned
4. ✅ Feature flags disabled for rolled-back features
5. ✅ Core BMad-Method functionality verified working
6. ✅ No errors in system health check
7. ✅ Rollback report generated and reviewed

## Emergency Contacts

- **On-Call Engineer**: Use PagerDuty
- **Security Team**: security@company.com (for Story 1.1.5 rollbacks)
- **Data Platform Team**: data-platform@company.com
- **Infrastructure Team**: infrastructure@company.com

## Post-Rollback Actions

1. **Update Documentation**
   - Mark story as rolled back in project tracker
   - Document reason for rollback
   - Create post-mortem if failure-driven

2. **Communicate Status**
   - Send rollback completion notice
   - Update status page
   - Schedule retrospective if needed

3. **Plan Re-Implementation**
   - Address issues that caused rollback
   - Update story with lessons learned
   - Schedule re-deployment attempt

This comprehensive rollback verification ensures safe and complete removal of Data Practitioner Agent System components while preserving core BMad-Method functionality.