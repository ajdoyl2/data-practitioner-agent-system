#!/bin/bash
# Common Rollback Utilities
# Shared functions for all rollback scripts

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Project root directory
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "\n${GREEN}==>${NC} $1"
}

# Check if dry run mode
is_dry_run() {
    [[ "${ROLLBACK_DRY_RUN:-0}" == "1" ]]
}

# Execute command with dry run support
execute_cmd() {
    local cmd="$1"
    if is_dry_run; then
        log_info "[DRY RUN] Would execute: $cmd"
    else
        log_info "Executing: $cmd"
        eval "$cmd"
    fi
}

# Remove directory with confirmation
remove_directory() {
    local dir="$1"
    if [[ -d "$dir" ]]; then
        log_info "Removing directory: $dir"
        if is_dry_run; then
            log_info "[DRY RUN] Would remove directory: $dir"
        else
            rm -rf "$dir"
            log_info "Directory removed: $dir"
        fi
    else
        log_info "Directory does not exist: $dir"
    fi
}

# Remove file with confirmation
remove_file() {
    local file="$1"
    if [[ -f "$file" ]]; then
        log_info "Removing file: $file"
        if is_dry_run; then
            log_info "[DRY RUN] Would remove file: $file"
        else
            rm -f "$file"
            log_info "File removed: $file"
        fi
    else
        log_info "File does not exist: $file"
    fi
}

# Stop a service/process
stop_service() {
    local service_name="$1"
    local pid_file="${2:-}"
    
    log_step "Stopping $service_name"
    
    # Check for PID file
    if [[ -n "$pid_file" && -f "$pid_file" ]]; then
        local pid=$(cat "$pid_file")
        if ps -p "$pid" > /dev/null 2>&1; then
            execute_cmd "kill -TERM $pid"
            sleep 2
            if ps -p "$pid" > /dev/null 2>&1; then
                log_warn "Process still running, sending KILL signal"
                execute_cmd "kill -KILL $pid"
            fi
        fi
        remove_file "$pid_file"
    fi
    
    # Check for running processes by name
    local pids=$(pgrep -f "$service_name" || true)
    if [[ -n "$pids" ]]; then
        log_info "Found running processes: $pids"
        execute_cmd "kill -TERM $pids || true"
    fi
}

# Remove npm packages
remove_npm_packages() {
    local packages=("$@")
    
    log_step "Removing npm packages"
    
    if [[ ${#packages[@]} -eq 0 ]]; then
        log_info "No packages to remove"
        return
    fi
    
    cd "$PROJECT_ROOT"
    
    for package in "${packages[@]}"; do
        if grep -q "\"$package\"" package.json 2>/dev/null; then
            execute_cmd "npm uninstall $package"
        else
            log_info "Package not installed: $package"
        fi
    done
}

# Remove Python packages
remove_python_packages() {
    local packages=("$@")
    
    log_step "Removing Python packages"
    
    if [[ ${#packages[@]} -eq 0 ]]; then
        log_info "No packages to remove"
        return
    fi
    
    # Check if pip is available
    if ! command -v pip &> /dev/null; then
        log_warn "pip not found, skipping Python package removal"
        return
    fi
    
    for package in "${packages[@]}"; do
        if pip show "$package" &> /dev/null; then
            execute_cmd "pip uninstall -y $package"
        else
            log_info "Package not installed: $package"
        fi
    done
}

# Clean up Docker containers/images
cleanup_docker() {
    local prefix="$1"
    
    log_step "Cleaning up Docker resources with prefix: $prefix"
    
    # Check if Docker is available
    if ! command -v docker &> /dev/null; then
        log_warn "Docker not found, skipping Docker cleanup"
        return
    fi
    
    # Stop and remove containers
    local containers=$(docker ps -a --filter "name=$prefix" -q || true)
    if [[ -n "$containers" ]]; then
        execute_cmd "docker stop $containers"
        execute_cmd "docker rm $containers"
    fi
    
    # Remove images
    local images=$(docker images "$prefix*" -q || true)
    if [[ -n "$images" ]]; then
        execute_cmd "docker rmi $images || true"
    fi
    
    # Remove volumes
    local volumes=$(docker volume ls --filter "name=$prefix" -q || true)
    if [[ -n "$volumes" ]]; then
        execute_cmd "docker volume rm $volumes"
    fi
}

# Backup data before removal
backup_data() {
    local source="$1"
    local backup_name="${2:-backup}"
    
    if [[ ! -e "$source" ]]; then
        log_info "Source does not exist, nothing to backup: $source"
        return
    fi
    
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_dir="$PROJECT_ROOT/rollback_backups/${backup_name}_${timestamp}"
    
    log_info "Creating backup: $backup_dir"
    
    if is_dry_run; then
        log_info "[DRY RUN] Would create backup at: $backup_dir"
    else
        mkdir -p "$backup_dir"
        cp -r "$source" "$backup_dir/"
        log_info "Backup created at: $backup_dir"
    fi
}

# Validate rollback completion
validate_removed() {
    local path="$1"
    local type="${2:-path}"
    
    if [[ -e "$path" ]]; then
        log_error "$type still exists: $path"
        return 1
    else
        log_info "$type successfully removed: $path"
        return 0
    fi
}

# Update feature flags
disable_feature() {
    local feature="$1"
    
    log_step "Disabling feature flag: $feature"
    
    if is_dry_run; then
        log_info "[DRY RUN] Would disable feature: $feature"
    else
        cd "$PROJECT_ROOT"
        node -e "
            const { disableFeature } = require('./tools/lib/feature-flag-manager.js');
            disableFeature('$feature', true).then(() => {
                console.log('Feature disabled: $feature');
            }).catch(err => {
                console.error('Failed to disable feature:', err.message);
                process.exit(1);
            });
        "
    fi
}

# Check dependencies before rollback
check_dependencies() {
    local deps=("$@")
    local missing=()
    
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            missing+=("$dep")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required dependencies: ${missing[*]}"
        log_info "Please install missing dependencies before running rollback"
        exit 1
    fi
}

# Create rollback report
create_rollback_report() {
    local story_id="$1"
    local status="$2"
    
    local report_file="$PROJECT_ROOT/rollback_reports/rollback_${story_id}_$(date +%Y%m%d_%H%M%S).txt"
    mkdir -p "$(dirname "$report_file")"
    
    cat > "$report_file" << EOF
Rollback Report for Story $story_id
================================
Date: $(date)
Status: $status
Reason: ${ROLLBACK_REASON:-Manual rollback}
Dry Run: ${ROLLBACK_DRY_RUN:-0}

Actions Performed:
$(cat /tmp/rollback_actions_$$ 2>/dev/null || echo "No actions logged")

Validation Results:
$(cat /tmp/rollback_validation_$$ 2>/dev/null || echo "No validation performed")

EOF
    
    log_info "Rollback report created: $report_file"
    
    # Cleanup temp files
    rm -f /tmp/rollback_actions_$$ /tmp/rollback_validation_$$
}

# Log action for report
log_action() {
    echo "- $1" >> /tmp/rollback_actions_$$
}

# Log validation result
log_validation() {
    echo "- $1" >> /tmp/rollback_validation_$$
}

# Main rollback header
print_rollback_header() {
    local story_id="$1"
    
    echo ""
    echo "=========================================="
    echo "Rollback for Story $story_id"
    echo "=========================================="
    echo "Time: $(date)"
    echo "Reason: ${ROLLBACK_REASON:-Manual rollback}"
    echo "Dry Run: ${ROLLBACK_DRY_RUN:-No}"
    echo "=========================================="
    echo ""
}