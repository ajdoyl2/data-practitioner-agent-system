#!/bin/bash
# Rollback Script for Story 1.5 - Dagster Orchestration
# Removes Dagster components and stops daemons

# Source common utilities
source "$(dirname "$0")/rollback-common.sh"

# Story-specific variables
STORY_ID="1.5"
FEATURE_NAME="dagster_orchestration"

# Print header
print_rollback_header "$STORY_ID"

# Check dependencies
check_dependencies "node" "npm"

# Step 1: Stop Dagster daemons
log_step "Stopping Dagster daemons"
stop_service "dagster-daemon" "$PROJECT_ROOT/logs/dagster-daemon.pid"
stop_service "dagster-webserver" "$PROJECT_ROOT/logs/dagster-webserver.pid"
log_action "Stopped Dagster daemons"

# Step 2: Backup Dagster home
log_step "Backing up Dagster home"
backup_data "$PROJECT_ROOT/dagster_home" "dagster_home"
log_action "Created Dagster home backup"

# Step 3: Remove Dagster service files
log_step "Removing Dagster service files"
remove_file "$PROJECT_ROOT/tools/data-services/dagster-service.js"
remove_file "$PROJECT_ROOT/tools/data-services/dagster-pipeline-manager.js"
remove_file "$PROJECT_ROOT/tools/data-services/dagster-scheduler.js"
log_action "Removed Dagster service files"

# Step 4: Remove Dagster directories
log_step "Removing Dagster directories"
remove_directory "$PROJECT_ROOT/dagster_home"
remove_directory "$PROJECT_ROOT/dagster_workspace"
remove_directory "$PROJECT_ROOT/logs/dagster"
log_action "Removed Dagster directories"

# Step 5: Remove npm packages
log_step "Removing Dagster npm dependencies"
remove_npm_packages "@dagster-io/dagster-js" "dagster-graphql-client"
log_action "Removed Dagster npm packages"

# Step 6: Remove Python Dagster packages
log_step "Removing Dagster Python packages"
remove_python_packages "dagster" "dagster-webserver" "dagster-docker" "dagster-dbt"
log_action "Removed Dagster Python packages"

# Step 7: Clean up Docker resources
log_step "Cleaning up Dagster Docker resources"
cleanup_docker "dagster"
log_action "Cleaned up Dagster Docker resources"

# Step 8: Clean environment configuration
log_step "Cleaning environment configuration"
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    if is_dry_run; then
        log_info "[DRY RUN] Would remove Dagster environment variables"
    else
        sed -i.bak '/^DAGSTER_/d' "$PROJECT_ROOT/.env"
        log_info "Removed Dagster environment variables"
    fi
fi
log_action "Cleaned environment configuration"

# Step 9: Disable feature flag
disable_feature "$FEATURE_NAME"
log_action "Disabled feature flag: $FEATURE_NAME"

# Step 10: Remove tests
log_step "Removing Dagster tests"
remove_directory "$PROJECT_ROOT/tests/data-services/dagster"
remove_file "$PROJECT_ROOT/tests/integration/dagster-integration.test.js"
log_action "Removed Dagster tests"

# Validation
log_step "Validating rollback"
validate_removed "$PROJECT_ROOT/tools/data-services/dagster-service.js" "Dagster service"
validate_removed "$PROJECT_ROOT/dagster_home" "Dagster home directory"
log_validation "File removal validated"

# Create rollback report
create_rollback_report "$STORY_ID" "COMPLETED"

log_info "Rollback for Story $STORY_ID completed successfully"