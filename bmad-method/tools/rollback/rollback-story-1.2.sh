#!/bin/bash
# Rollback Script for Story 1.2 - PyAirbyte Integration
# Removes PyAirbyte components and restores system state

# Source common utilities
source "$(dirname "$0")/rollback-common.sh"

# Story-specific variables
STORY_ID="1.2"
FEATURE_NAME="pyairbyte_integration"

# Print header
print_rollback_header "$STORY_ID"

# Check dependencies
check_dependencies "node" "npm"

# Step 1: Stop PyAirbyte services
log_step "Stopping PyAirbyte services"
stop_service "pyairbyte" "$PROJECT_ROOT/logs/pyairbyte.pid"
log_action "Stopped PyAirbyte services"

# Step 2: Remove PyAirbyte service files
log_step "Removing PyAirbyte service files"
remove_file "$PROJECT_ROOT/tools/data-services/pyairbyte-service.js"
remove_file "$PROJECT_ROOT/tools/data-services/pyairbyte-connector.js"
remove_directory "$PROJECT_ROOT/config/pyairbyte"
log_action "Removed PyAirbyte service files"

# Step 3: Remove PyAirbyte configuration
log_step "Removing PyAirbyte configuration"
remove_file "$PROJECT_ROOT/config/pyairbyte-connectors.yaml"
remove_file "$PROJECT_ROOT/config/pyairbyte-destinations.yaml"
log_action "Removed PyAirbyte configuration files"

# Step 4: Clean up data directories
log_step "Cleaning up PyAirbyte data"
backup_data "$PROJECT_ROOT/data/pyairbyte" "pyairbyte_data"
remove_directory "$PROJECT_ROOT/data/pyairbyte"
remove_directory "$PROJECT_ROOT/logs/pyairbyte"
log_action "Cleaned up PyAirbyte data directories"

# Step 5: Remove npm packages
log_step "Removing PyAirbyte npm dependencies"
remove_npm_packages "@pyairbyte/node" "node-fetch" "yaml"
log_action "Removed PyAirbyte npm packages"

# Step 6: Remove Python packages (if installed)
log_step "Removing PyAirbyte Python packages"
remove_python_packages "airbyte-cdk" "pyairbyte"
log_action "Removed PyAirbyte Python packages"

# Step 7: Clean up Docker resources
log_step "Cleaning up PyAirbyte Docker resources"
cleanup_docker "airbyte"
log_action "Cleaned up PyAirbyte Docker resources"

# Step 8: Remove environment variables
log_step "Cleaning environment configuration"
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    if is_dry_run; then
        log_info "[DRY RUN] Would remove PyAirbyte environment variables"
    else
        # Remove PyAirbyte-specific env vars
        sed -i.bak '/^PYAIRBYTE_/d' "$PROJECT_ROOT/.env"
        sed -i.bak '/^AIRBYTE_/d' "$PROJECT_ROOT/.env"
        log_info "Removed PyAirbyte environment variables"
    fi
fi
log_action "Cleaned environment configuration"

# Step 9: Disable feature flag
disable_feature "$FEATURE_NAME"
log_action "Disabled feature flag: $FEATURE_NAME"

# Step 10: Remove tests
log_step "Removing PyAirbyte tests"
remove_directory "$PROJECT_ROOT/tests/data-services/pyairbyte"
remove_file "$PROJECT_ROOT/tests/integration/pyairbyte-integration.test.js"
log_action "Removed PyAirbyte tests"

# Validation
log_step "Validating rollback"

# Check files are removed
validate_removed "$PROJECT_ROOT/tools/data-services/pyairbyte-service.js" "PyAirbyte service"
validate_removed "$PROJECT_ROOT/config/pyairbyte-connectors.yaml" "PyAirbyte config"
validate_removed "$PROJECT_ROOT/data/pyairbyte" "PyAirbyte data directory"
log_validation "File removal validated"

# Check processes are stopped
if pgrep -f "pyairbyte" > /dev/null; then
    log_error "PyAirbyte processes still running"
    log_validation "Process termination failed"
else
    log_info "No PyAirbyte processes found"
    log_validation "Process termination validated"
fi

# Check feature is disabled
if node -e "const {isFeatureEnabled} = require('$PROJECT_ROOT/tools/lib/feature-flag-manager.js'); process.exit(isFeatureEnabled('$FEATURE_NAME') ? 1 : 0)"; then
    log_info "Feature flag successfully disabled"
    log_validation "Feature flag disabled"
else
    log_error "Feature flag still enabled"
    log_validation "Feature flag validation failed"
fi

# Create rollback report
create_rollback_report "$STORY_ID" "COMPLETED"

log_info "Rollback for Story $STORY_ID completed successfully"