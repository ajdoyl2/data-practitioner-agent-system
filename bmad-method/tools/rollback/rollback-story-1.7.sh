#!/bin/bash
# Rollback Script for Story 1.7 - Evidence.dev Integration
# Removes Evidence.dev components and publications

# Source common utilities
source "$(dirname "$0")/rollback-common.sh"

# Story-specific variables
STORY_ID="1.7"
FEATURE_NAME="evidence_publishing"

# Print header
print_rollback_header "$STORY_ID"

# Check dependencies
check_dependencies "node" "npm"

# Step 1: Stop Evidence services
log_step "Stopping Evidence services"
stop_service "evidence" "$PROJECT_ROOT/logs/evidence.pid"
stop_service "evidence-dev" "$PROJECT_ROOT/logs/evidence-dev.pid"
log_action "Stopped Evidence services"

# Step 2: Backup Evidence project
log_step "Backing up Evidence project"
backup_data "$PROJECT_ROOT/evidence_project" "evidence_project"
log_action "Created Evidence project backup"

# Step 3: Remove Evidence service files
log_step "Removing Evidence service files"
remove_file "$PROJECT_ROOT/tools/data-services/evidence-service.js"
remove_file "$PROJECT_ROOT/tools/data-services/evidence-publisher.js"
remove_file "$PROJECT_ROOT/tools/data-services/evidence-report-manager.js"
log_action "Removed Evidence service files"

# Step 4: Remove Evidence directories
log_step "Removing Evidence directories"
remove_directory "$PROJECT_ROOT/evidence_project"
remove_directory "$PROJECT_ROOT/public/evidence"
remove_directory "$PROJECT_ROOT/logs/evidence"
log_action "Removed Evidence directories"

# Step 5: Remove npm packages
log_step "Removing Evidence npm dependencies"
remove_npm_packages "@evidence-dev/evidence" "@evidence-dev/core-components"
log_action "Removed Evidence npm packages"

# Step 6: Clean environment configuration
log_step "Cleaning environment configuration"
if [[ -f "$PROJECT_ROOT/.env" ]]; then
    if is_dry_run; then
        log_info "[DRY RUN] Would remove Evidence environment variables"
    else
        sed -i.bak '/^EVIDENCE_/d' "$PROJECT_ROOT/.env"
        log_info "Removed Evidence environment variables"
    fi
fi
log_action "Cleaned environment configuration"

# Step 7: Remove deployment configurations
log_step "Removing deployment configurations"
remove_file "$PROJECT_ROOT/.github/workflows/evidence-deploy.yml"
remove_file "$PROJECT_ROOT/vercel.json"
remove_file "$PROJECT_ROOT/netlify.toml"
log_action "Removed deployment configurations"

# Step 8: Disable feature flag
disable_feature "$FEATURE_NAME"
log_action "Disabled feature flag: $FEATURE_NAME"

# Step 9: Remove tests
log_step "Removing Evidence tests"
remove_directory "$PROJECT_ROOT/tests/data-services/evidence"
remove_file "$PROJECT_ROOT/tests/integration/evidence-integration.test.js"
log_action "Removed Evidence tests"

# Validation
log_step "Validating rollback"
validate_removed "$PROJECT_ROOT/tools/data-services/evidence-service.js" "Evidence service"
validate_removed "$PROJECT_ROOT/evidence_project" "Evidence project directory"
log_validation "File removal validated"

# Create rollback report
create_rollback_report "$STORY_ID" "COMPLETED"

log_info "Rollback for Story $STORY_ID completed successfully"
log_warn "Evidence project has been backed up to: $PROJECT_ROOT/rollback_backups/"