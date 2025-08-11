#!/bin/bash
# Rollback Script for Story 1.6 - EDA Automation
# Removes EDA tools and analysis components

# Source common utilities
source "$(dirname "$0")/rollback-common.sh"

# Story-specific variables
STORY_ID="1.6"
FEATURE_NAME="eda_automation"

# Print header
print_rollback_header "$STORY_ID"

# Check dependencies
check_dependencies "node" "npm"

# Step 1: Stop EDA services
log_step "Stopping EDA services"
stop_service "eda-service" "$PROJECT_ROOT/logs/eda.pid"
stop_service "jupyter" "$PROJECT_ROOT/logs/jupyter.pid"
log_action "Stopped EDA services"

# Step 2: Backup notebooks and analysis
log_step "Backing up EDA notebooks and analysis"
backup_data "$PROJECT_ROOT/notebooks" "eda_notebooks"
backup_data "$PROJECT_ROOT/analysis" "eda_analysis"
log_action "Created EDA data backup"

# Step 3: Remove EDA service files
log_step "Removing EDA service files"
remove_file "$PROJECT_ROOT/tools/data-services/eda-service.js"
remove_file "$PROJECT_ROOT/tools/data-services/eda-analyzer.js"
remove_file "$PROJECT_ROOT/tools/data-services/hypothesis-generator.js"
log_action "Removed EDA service files"

# Step 4: Remove EDA directories
log_step "Removing EDA directories"
remove_directory "$PROJECT_ROOT/notebooks"
remove_directory "$PROJECT_ROOT/analysis"
remove_directory "$PROJECT_ROOT/logs/eda"
log_action "Removed EDA directories"

# Step 5: Remove npm packages
log_step "Removing EDA npm dependencies"
remove_npm_packages "pandas-js" "plotly.js" "notebook-js"
log_action "Removed EDA npm packages"

# Step 6: Remove Python EDA packages
log_step "Removing EDA Python packages"
remove_python_packages "pandas" "numpy" "matplotlib" "seaborn" "scikit-learn" "jupyter" "notebook"
log_action "Removed EDA Python packages"

# Step 7: Clean environment configuration
log_step "Cleaning environment configuration"
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    if is_dry_run; then
        log_info "[DRY RUN] Would remove EDA environment variables"
    else
        sed -i.bak '/^EDA_/d' "$PROJECT_ROOT/.env"
        sed -i.bak '/^JUPYTER_/d' "$PROJECT_ROOT/.env"
        log_info "Removed EDA environment variables"
    fi
fi
log_action "Cleaned environment configuration"

# Step 8: Disable feature flag
disable_feature "$FEATURE_NAME"
log_action "Disabled feature flag: $FEATURE_NAME"

# Step 9: Remove tests
log_step "Removing EDA tests"
remove_directory "$PROJECT_ROOT/tests/data-services/eda"
remove_file "$PROJECT_ROOT/tests/integration/eda-integration.test.js"
log_action "Removed EDA tests"

# Validation
log_step "Validating rollback"
validate_removed "$PROJECT_ROOT/tools/data-services/eda-service.js" "EDA service"
validate_removed "$PROJECT_ROOT/notebooks" "Notebooks directory"
log_validation "File removal validated"

# Create rollback report
create_rollback_report "$STORY_ID" "COMPLETED"

log_info "Rollback for Story $STORY_ID completed successfully"
log_warn "EDA notebooks have been backed up to: $PROJECT_ROOT/rollback_backups/"