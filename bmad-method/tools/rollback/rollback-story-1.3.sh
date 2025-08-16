#!/bin/bash
# rollback-story-1.3.sh - DuckDB Local Analytics Integration Rollback
# Removes DuckDB integration while preserving existing data

set -e  # Exit on any error

# Source common rollback utilities
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/rollback-common.sh"

echo "🔄 Starting Story 1.3 DuckDB Integration Rollback..."

# Check if rollback is needed
if ! check_story_installed "1.3"; then
    echo "ℹ️ Story 1.3 not installed, skipping rollback"
    exit 0
fi

# Capture pre-rollback state
capture_system_state "1.3"

# 1. Stop DuckDB processes if running
echo "Stopping DuckDB processes..."
pkill -f "duckdb" || echo "No DuckDB processes found"

# 2. Disable feature flag
echo "Disabling duckdb_analytics feature flag..."
disable_feature_flag "duckdb_analytics"

# 3. Backup DuckDB databases before removal
DUCKDB_DIR=".duckdb"
BACKUP_DIR="backups/story-1.3-$(date +%Y%m%d_%H%M%S)"

if [ -d "$DUCKDB_DIR" ]; then
    echo "Backing up DuckDB databases to $BACKUP_DIR..."
    mkdir -p "$BACKUP_DIR"
    cp -r "$DUCKDB_DIR" "$BACKUP_DIR/"
    echo "✅ DuckDB data backed up to $BACKUP_DIR"
fi

# 4. Remove DuckDB service files
echo "Removing DuckDB service components..."
SERVICE_FILES=(
    "tools/data-services/duckdb-service.js"
    "tools/data-services/analytical-query-service.js"
    "tools/lib/duckdb-manager.js"
    "tools/lib/query-optimizer.js"
)

for file in "${SERVICE_FILES[@]}"; do
    if [ -f "$file" ]; then
        backup_file "$file"
        rm "$file"
        echo "Removed: $file"
    fi
done

# 5. Remove DuckDB configuration
echo "Removing DuckDB configuration..."
CONFIG_FILES=(
    "config/duckdb-config.yaml"
    "config/analytical-schemas.yaml"
)

for file in "${CONFIG_FILES[@]}"; do
    if [ -f "$file" ]; then
        backup_file "$file"
        rm "$file"
        echo "Removed: $file"
    fi
done

# 6. Remove DuckDB tests
echo "Removing DuckDB test files..."
TEST_FILES=(
    "tests/data-services/duckdb-service.test.js"
    "tests/data-services/analytical-query-service.test.js"
    "tests/integration/duckdb-integration.test.js"
)

for file in "${TEST_FILES[@]}"; do
    if [ -f "$file" ]; then
        backup_file "$file"
        rm "$file"
        echo "Removed: $file"
    fi
done

# 7. Remove DuckDB documentation
echo "Removing DuckDB documentation..."
DOC_FILES=(
    "docs/data-services/duckdb-integration.md"
    "docs/guides/analytical-queries.md"
    "docs/guides/duckdb-best-practices.md"
)

for file in "${DOC_FILES[@]}"; do
    if [ -f "$file" ]; then
        backup_file "$file"
        rm "$file"
        echo "Removed: $file"
    fi
done

# 8. Remove npm dependencies added for DuckDB
echo "Removing DuckDB npm dependencies..."
DUCKDB_DEPS=(
    "duckdb"
    "@duckdb/duckdb-wasm"
)

for dep in "${DUCKDB_DEPS[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
        npm uninstall "$dep"
        echo "Removed npm dependency: $dep"
    fi
done

# 9. Clean up DuckDB cache and temp files
echo "Cleaning up DuckDB cache and temporary files..."
CLEANUP_DIRS=(
    ".cache/duckdb"
    "temp/duckdb"
    "logs/duckdb"
)

for dir in "${CLEANUP_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        rm -rf "$dir"
        echo "Cleaned up: $dir"
    fi
done

# 10. Remove DuckDB CLI commands from tools/cli.js
echo "Removing DuckDB CLI commands..."
if [ -f "tools/cli.js" ]; then
    backup_file "tools/cli.js"
    # Remove DuckDB command registrations
    sed -i.backup '/duckdb.*command/d' tools/cli.js || echo "No DuckDB commands found in CLI"
    sed -i.backup '/analytical.*query.*command/d' tools/cli.js || echo "No analytical query commands found in CLI"
    echo "Removed DuckDB CLI commands"
fi

# 11. Restore previous package.json if it exists
if [ -f "package.json.pre-1.3" ]; then
    echo "Restoring previous package.json..."
    cp "package.json.pre-1.3" "package.json"
    npm install --silent
    echo "✅ Package.json restored and dependencies updated"
fi

# 12. Update core configuration to remove DuckDB references
echo "Updating core configuration..."
if [ -f "core-config.yaml" ]; then
    backup_file "core-config.yaml"
    # Remove DuckDB-related configuration
    sed -i.backup '/duckdb/d' core-config.yaml || echo "No DuckDB config found"
    echo "Updated core configuration"
fi

# 13. Log rollback event
log_security_event "ROLLBACK_COMPLETED" "Story 1.3 DuckDB integration rolled back successfully" "system"

# 14. Validate rollback success
echo "Validating rollback..."
VALIDATION_ERRORS=()

# Check that feature flag is disabled
if ! validate_feature_flag_disabled "duckdb_analytics"; then
    VALIDATION_ERRORS+=("Feature flag still enabled")
fi

# Check that DuckDB processes are stopped
if pgrep -f "duckdb" >/dev/null; then
    VALIDATION_ERRORS+=("DuckDB processes still running")
fi

# Check that service files are removed
for file in "${SERVICE_FILES[@]}"; do
    if [ -f "$file" ]; then
        VALIDATION_ERRORS+=("Service file still exists: $file")
    fi
done

# Check that npm dependencies are removed
for dep in "${DUCKDB_DEPS[@]}"; do
    if npm list "$dep" >/dev/null 2>&1; then
        VALIDATION_ERRORS+=("npm dependency still installed: $dep")
    fi
done

# Report validation results
if [ ${#VALIDATION_ERRORS[@]} -eq 0 ]; then
    echo "✅ Story 1.3 rollback completed successfully"
    echo "📁 DuckDB data preserved in: $BACKUP_DIR"
    echo "🔄 Rollback validation: PASSED"
    
    # Update rollback completion status
    mark_story_rollback_complete "1.3"
    
    exit 0
else
    echo "❌ Rollback validation failed:"
    printf '   - %s\n' "${VALIDATION_ERRORS[@]}"
    echo "🔄 Rollback validation: FAILED"
    exit 1
fi