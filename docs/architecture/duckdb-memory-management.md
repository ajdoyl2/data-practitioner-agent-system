# DuckDB Memory Management Documentation

## Overview

This document provides comprehensive DuckDB memory management patterns and scaling strategies for the BMad-Method data practitioner expansion pack, enabling efficient processing of datasets ranging from megabytes to terabytes without system instability.

## Memory Configuration Options

### 1. Basic Memory Limits

The DuckDB wrapper supports configurable memory limits through the constructor options:

```javascript
const duckdb = new DuckDBWrapper({
  memoryLimit: '4GB',      // Default: 4GB
  maxConnections: 10,      // Default: 10 connections
  databasePath: ':memory:' // In-memory or file path
});
```

### 2. Runtime Memory Configuration

Memory limits can be set via SQL PRAGMA statements during initialization:

```sql
-- Set memory limit (supports B, KB, MB, GB, TB suffixes)
PRAGMA memory_limit='8GB';

-- Enable automatic spilling to disk when memory limit reached
PRAGMA temp_directory='/tmp/duckdb_spill';
PRAGMA enable_object_cache=true;
```

### 3. Dynamic Memory Adjustment

For dynamic memory adjustment based on system resources:

```javascript
// Get system memory information
const os = require('os');
const totalMem = os.totalmem();
const freeMem = os.freemem();

// Calculate safe memory limit (50-70% of available memory)
const safeMemoryLimit = Math.floor(freeMem * 0.6);
const memoryLimitGB = Math.floor(safeMemoryLimit / (1024 * 1024 * 1024));

const duckdb = new DuckDBWrapper({
  memoryLimit: `${memoryLimitGB}GB`
});
```

## System Specification-Based Configuration Templates

### Development Environment (8-16GB RAM)
```yaml
duckdb_config:
  memory_limit: "2GB"
  max_connections: 5
  temp_directory: "./tmp/duckdb_spill"
  enable_object_cache: true
  checkpoint_threshold: "1GB"
```

### Production Environment (32GB+ RAM)
```yaml
duckdb_config:
  memory_limit: "16GB"
  max_connections: 20
  temp_directory: "/var/tmp/duckdb_spill"
  enable_object_cache: true
  checkpoint_threshold: "4GB"
  wal_autocheckpoint: 10000
```

### Cloud Environment (Variable Resources)
```yaml
duckdb_config:
  memory_limit: "${DUCKDB_MEMORY_LIMIT:-4GB}"
  max_connections: "${DUCKDB_MAX_CONNECTIONS:-10}"
  temp_directory: "${DUCKDB_TEMP_DIR:-/tmp/duckdb_spill}"
  enable_object_cache: true
  adaptive_memory: true
```

## Automatic Spilling Configuration

### 1. Spill Directory Configuration

```javascript
// Ensure spill directory exists and has proper permissions
const spillDir = process.env.DUCKDB_SPILL_DIR || '/tmp/duckdb_spill';
await fs.ensureDir(spillDir);

// Set spill configuration during initialization
await duckdb.executeInternal(`
  PRAGMA temp_directory='${spillDir}';
  PRAGMA enable_object_cache=true;
  PRAGMA memory_limit='${memoryLimit}';
`);
```

### 2. Spill Optimization Settings

```sql
-- Configure spilling behavior
PRAGMA enable_object_cache=true;           -- Enable object caching
PRAGMA checkpoint_threshold='2GB';         -- Checkpoint at 2GB
PRAGMA wal_autocheckpoint=5000;           -- Auto-checkpoint every 5000 operations
PRAGMA cache_size=262144;                 -- 256MB cache (in pages)
```

### 3. Monitoring Spill Activity

```javascript
// Monitor memory usage and spill activity
async function getMemoryStats() {
  const result = await duckdb.execute(`
    SELECT 
      memory_usage,
      memory_limit,
      (memory_usage::FLOAT / memory_limit::FLOAT * 100) as memory_percent
    FROM duckdb_memory()
  `);
  
  return result.data[0];
}
```

## Memory Cleanup and Garbage Collection

### 1. Automatic Cleanup Procedures

```javascript
class MemoryManagedDuckDB extends DuckDBWrapper {
  constructor(options = {}) {
    super(options);
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    this.setupAutomaticCleanup();
  }

  setupAutomaticCleanup() {
    this.cleanupTimer = setInterval(async () => {
      await this.performMemoryCleanup();
    }, this.cleanupInterval);
  }

  async performMemoryCleanup() {
    try {
      // Force garbage collection
      await this.executeInternal('PRAGMA force_checkpoint;');
      
      // Clear query cache if memory pressure detected
      const stats = await this.getMemoryStats();
      if (stats.memory_percent > 80) {
        await this.executeInternal('PRAGMA clear_cache;');
      }
      
      // Clean up temporary tables older than 1 hour
      await this.executeInternal(`
        DROP TABLE IF EXISTS temp_data_older_than_hour;
      `);
      
    } catch (error) {
      console.warn('Memory cleanup failed:', error.message);
    }
  }
}
```

### 2. Manual Memory Management

```javascript
// Force immediate memory cleanup
async function forceMemoryCleanup(duckdb) {
  await duckdb.executeInternal('PRAGMA force_checkpoint;');
  await duckdb.executeInternal('PRAGMA clear_cache;');
  
  // Run Node.js garbage collection if available
  if (global.gc) {
    global.gc();
  }
}

// Monitor and alert on high memory usage
async function monitorMemoryUsage(duckdb, threshold = 85) {
  const stats = await duckdb.getMemoryStats();
  
  if (stats.memory_percent > threshold) {
    console.warn(`High memory usage detected: ${stats.memory_percent}%`);
    await forceMemoryCleanup(duckdb);
    return true; // Cleanup performed
  }
  
  return false;
}
```

### 3. Connection Pool Management

```javascript
// Enhanced connection pool with memory awareness
class MemoryAwareConnectionPool {
  constructor(maxConnections = 10, memoryThreshold = 75) {
    this.pool = [];
    this.maxConnections = maxConnections;
    this.memoryThreshold = memoryThreshold;
    this.activeConnections = 0;
  }

  async getConnection(duckdb) {
    // Check memory usage before creating new connection
    const memStats = await duckdb.getMemoryStats();
    
    if (memStats.memory_percent > this.memoryThreshold) {
      throw new Error(`Memory usage too high (${memStats.memory_percent}%) for new connection`);
    }

    if (this.activeConnections >= this.maxConnections) {
      throw new Error('Maximum connections reached');
    }

    this.activeConnections++;
    return this.createConnection(duckdb);
  }

  releaseConnection(connection) {
    this.activeConnections--;
    // Perform connection cleanup
    connection.executeInternal('PRAGMA clear_cache;').catch(() => {});
  }
}
```

## Error Handling and Recovery

### 1. Memory Exhaustion Recovery

```javascript
async function handleMemoryExhaustion(duckdb, query, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    return await duckdb.execute(query);
  } catch (error) {
    if (error.message.includes('memory') && retryCount < maxRetries) {
      console.warn(`Memory error, attempting recovery (attempt ${retryCount + 1})`);
      
      // Perform aggressive cleanup
      await forceMemoryCleanup(duckdb);
      
      // Reduce memory limit temporarily
      const currentLimit = duckdb.memoryLimit;
      const reducedLimit = Math.floor(parseInt(currentLimit) * 0.8);
      await duckdb.executeInternal(`PRAGMA memory_limit='${reducedLimit}GB';`);
      
      // Retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
      
      return await handleMemoryExhaustion(duckdb, query, retryCount + 1);
    }
    
    throw error;
  }
}
```

### 2. Graceful Degradation

```javascript
async function executeWithFallback(duckdb, query, fallbackOptions = {}) {
  try {
    // Try full query first
    return await duckdb.execute(query);
  } catch (error) {
    if (error.message.includes('memory')) {
      // Try with row limit
      const limitedQuery = `${query} LIMIT ${fallbackOptions.maxRows || 10000}`;
      
      try {
        const result = await duckdb.execute(limitedQuery);
        result.truncated = true;
        result.originalError = error.message;
        return result;
      } catch (limitedError) {
        // Final fallback: return error with suggestion
        return {
          success: false,
          error: error.message,
          suggestion: 'Consider using smaller dataset or streaming approach'
        };
      }
    }
    
    throw error;
  }
}
```

## Integration with BMad-Method Resource Management

### 1. Feature Flag Integration

The DuckDB memory management respects existing BMad feature flags:

```javascript
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

// Check if memory management features are enabled
if (isFeatureEnabled('duckdb_memory_management')) {
  await duckdb.enableAdvancedMemoryManagement();
}

if (isFeatureEnabled('duckdb_spilling')) {
  await duckdb.configureSpilling();
}
```

### 2. Security Logger Integration

All memory management operations are logged using the existing security logger:

```javascript
const { securityLogger } = require('../lib/security-logger');

// Log memory management events
securityLogger.logDuckDBOperation({
  operation: 'memory_cleanup',
  memory_before: beforeStats.memory_usage,
  memory_after: afterStats.memory_usage,
  cleanup_type: 'automatic',
  timestamp: new Date().toISOString()
});
```

### 3. Error Handling Integration

Memory management errors follow existing BMad error patterns:

```javascript
// Use existing BMad error styling
const chalk = require('chalk');

function formatMemoryError(error, context) {
  return chalk.red(`DuckDB Memory Error: ${error.message}`) + 
         chalk.yellow(`\nContext: ${context}`) +
         chalk.blue(`\nSuggestion: Reduce dataset size or increase memory limit`);
}
```

## Next Steps

1. **Performance Benchmark Documentation** - Establish baseline metrics for various dataset sizes
2. **Resource Usage Thresholds** - Define memory usage monitoring and alerting
3. **Dataset Partitioning Strategies** - Document approaches for larger-than-memory datasets
4. **Monitoring Configuration** - Set up resource usage tracking
5. **Fallback Procedures** - Establish procedures for memory exhaustion scenarios

## References

- [DuckDB Memory Management Documentation](https://duckdb.org/docs/configuration)
- [BMad-Method Coding Standards](./coding-standards.md)
- [DuckDB Wrapper Implementation](../../bmad-method/tools/data-services/duckdb-wrapper.js)