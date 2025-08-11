#!/bin/bash
# Rollback Script for Story 1.4 - dbt Core Integration
# Removes dbt components and models

# Source common utilities
source "$(dirname "$0")/rollback-common.sh"

# Story-specific variables
STORY_ID="1.4"
FEATURE_NAME="dbt_transformations"

# Print header
print_rollback_header "$STORY_ID"

# Check dependencies
check_dependencies "node" "npm"

# Step 1: Stop dbt services
log_step "Stopping dbt services"
stop_service "dbt" "$PROJECT_ROOT/logs/dbt.pid"
log_action "Stopped dbt services"

# Step 2: Backup dbt project
log_step "Backing up dbt project"
backup_data "$PROJECT_ROOT/dbt_project" "dbt_project"
log_action "Created dbt project backup"

# Step 3: Remove dbt service files
log_step "Removing dbt service files"
remove_file "$PROJECT_ROOT/tools/data-services/dbt-service.js"
remove_file "$PROJECT_ROOT/tools/data-services/dbt-runner.js"
remove_file "$PROJECT_ROOT/tools/data-services/dbt-model-manager.js"
log_action "Removed dbt service files"

# Step 4: Remove dbt project directory
log_step "Removing dbt project"
remove_directory "$PROJECT_ROOT/dbt_project"
remove_directory "$PROJECT_ROOT/logs/dbt"
log_action "Removed dbt project directory"

# Step 5: Remove npm packages
log_step "Removing dbt npm dependencies"
remove_npm_packages "@dbt-labs/dbt-js" "dbt-cloud-api"
log_action "Removed dbt npm packages"

# Step 6: Remove Python dbt packages
log_step "Removing dbt Python packages"
remove_python_packages "dbt-core" "dbt-duckdb" "dbt-postgres"
log_action "Removed dbt Python packages"

# Step 7: Clean environment configuration
log_step "Cleaning environment configuration"
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    if is_dry_run; then
        log_info "[DRY RUN] Would remove dbt environment variables"
    else
        sed -i.bak '/^DBT_/d' "$PROJECT_ROOT/.env"
        log_info "Removed dbt environment variables"
    fi
fi
log_action "Cleaned environment configuration"

# Step 8: Disable feature flag
disable_feature "$FEATURE_NAME"
log_action "Disabled feature flag: $FEATURE_NAME"

# Step 9: Remove tests
log_step "Removing dbt tests"
remove_directory "$PROJECT_ROOT/tests/data-services/dbt"
remove_file "$PROJECT_ROOT/tests/integration/dbt-integration.test.js"
log_action "Removed dbt tests"

# Validation
log_step "Validating rollback"
validate_removed "$PROJECT_ROOT/tools/data-services/dbt-service.js" "dbt service"
validate_removed "$PROJECT_ROOT/dbt_project" "dbt project directory"
log_validation "File removal validated"

# Create rollback report
create_rollback_report "$STORY_ID" "COMPLETED"

log_info "Rollback for Story $STORY_ID completed successfully"