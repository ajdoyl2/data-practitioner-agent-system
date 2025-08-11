#!/bin/bash
# Rollback Script for Story 1.8 - QA Framework
# Removes QA framework and documentation components

# Source common utilities
source "$(dirname "$0")/rollback-common.sh"

# Story-specific variables
STORY_ID="1.8"
FEATURE_NAME="qa_framework"

# Print header
print_rollback_header "$STORY_ID"

# Check dependencies
check_dependencies "node" "npm"

# Step 1: Stop QA services
log_step "Stopping QA services"
stop_service "qa-service" "$PROJECT_ROOT/logs/qa.pid"
log_action "Stopped QA services"

# Step 2: Backup QA documentation
log_step "Backing up QA documentation"
backup_data "$PROJECT_ROOT/docs/qa" "qa_documentation"
backup_data "$PROJECT_ROOT/test-reports" "qa_test_reports"
log_action "Created QA documentation backup"

# Step 3: Remove QA service files
log_step "Removing QA service files"
remove_file "$PROJECT_ROOT/tools/data-services/qa-service.js"
remove_file "$PROJECT_ROOT/tools/data-services/qa-test-runner.js"
remove_file "$PROJECT_ROOT/tools/data-services/qa-report-generator.js"
log_action "Removed QA service files"

# Step 4: Remove QA directories
log_step "Removing QA directories"
remove_directory "$PROJECT_ROOT/docs/qa"
remove_directory "$PROJECT_ROOT/test-reports"
remove_directory "$PROJECT_ROOT/logs/qa"
log_action "Removed QA directories"

# Step 5: Remove npm packages
log_step "Removing QA npm dependencies"
remove_npm_packages "jest-extended" "jest-html-reporter" "@testing-library/jest-dom"
log_action "Removed QA npm packages"

# Step 6: Remove QA configuration files
log_step "Removing QA configuration"
remove_file "$PROJECT_ROOT/jest.config.qa.js"
remove_file "$PROJECT_ROOT/.eslintrc.qa.js"
remove_file "$PROJECT_ROOT/config/qa-config.yaml"
log_action "Removed QA configuration files"

# Step 7: Clean environment configuration
log_step "Cleaning environment configuration"
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    if is_dry_run; then
        log_info "[DRY RUN] Would remove QA environment variables"
    else
        sed -i.bak '/^QA_/d' "$PROJECT_ROOT/.env"
        log_info "Removed QA environment variables"
    fi
fi
log_action "Cleaned environment configuration"

# Step 8: Disable feature flag
disable_feature "$FEATURE_NAME"
log_action "Disabled feature flag: $FEATURE_NAME"

# Step 9: Remove comprehensive test suites
log_step "Removing comprehensive test suites"
remove_directory "$PROJECT_ROOT/tests/data-services/qa"
remove_directory "$PROJECT_ROOT/tests/e2e/data-practitioner"
remove_file "$PROJECT_ROOT/tests/integration/qa-framework.test.js"
log_action "Removed comprehensive test suites"

# Step 10: Remove documentation generation tools
log_step "Removing documentation tools"
remove_file "$PROJECT_ROOT/tools/data-services/doc-generator.js"
remove_directory "$PROJECT_ROOT/docs/generated"
log_action "Removed documentation generation tools"

# Validation
log_step "Validating rollback"
validate_removed "$PROJECT_ROOT/tools/data-services/qa-service.js" "QA service"
validate_removed "$PROJECT_ROOT/docs/qa" "QA documentation directory"
validate_removed "$PROJECT_ROOT/test-reports" "Test reports directory"
log_validation "File removal validated"

# Create rollback report
create_rollback_report "$STORY_ID" "COMPLETED"

log_info "Rollback for Story $STORY_ID completed successfully"
log_warn "QA documentation has been backed up to: $PROJECT_ROOT/rollback_backups/"