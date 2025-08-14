# DuckDB Partitioning Troubleshooting Guide

## Overview

This guide provides systematic troubleshooting procedures for common issues encountered when implementing DuckDB partitioning strategies within the BMad-Method data practitioner expansion pack.

## Common Issues and Solutions

### 1. Memory Issues During Partitioning

#### Out of Memory Errors

**Symptoms:**
- `Error: Out of memory` during partition creation
- Process crashes with heap exhaustion
- System becomes unresponsive during partitioning

**Diagnostic Steps:**
```javascript
// Check current memory usage
async function diagnoseMemoryUsage(duckdb) {
  const memUsage = process.memoryUsage();
  const duckdbStats = await duckdb.getStats();
  
  return {
    node_heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
    node_heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
    system_memory_free_gb: Math.round(os.freemem() / 1024 / 1024 / 1024),
    duckdb_memory_limit: duckdb.memoryLimit,
    duckdb_active_queries: duckdbStats.active_queries
  };
}
```

**Solutions:**
1. **Reduce Partition Size**
   ```javascript
   // Before: Large partitions
   const partitioner = new TemporalPartitioner(duckdb, {
     partitionSize: 'year', // Too large
     batchSize: 1000000
   });
   
   // After: Smaller partitions
   const partitioner = new TemporalPartitioner(duckdb, {
     partitionSize: 'month', // More manageable
     batchSize: 100000
   });
   ```

2. **Enable Memory Spilling**
   ```javascript
   await duckdb.executeInternal(`
     PRAGMA memory_limit='4GB';
     PRAGMA temp_directory='/tmp/duckdb_spill';
     PRAGMA enable_object_cache=true;
   `);
   ```

3. **Use Streaming Approach**
   ```javascript
   // Process partitions sequentially instead of creating all at once
   const results = [];
   for (const partition of partitions) {
     const result = await processPartition(partition);
     results.push(result);
     
     // Force cleanup between partitions
     if (global.gc) global.gc();
   }
   ```

#### Memory Leaks During Long-Running Partitioning

**Symptoms:**
- Memory usage continuously increases
- Performance degrades over time
- Eventually leads to out of memory

**Diagnostic Steps:**
```javascript
async function detectMemoryLeak(duckdb, iterations = 10) {
  const measurements = [];
  
  for (let i = 0; i < iterations; i++) {
    const before = process.memoryUsage().heapUsed;
    
    // Perform a test operation
    await duckdb.execute('SELECT COUNT(*) FROM test_table');
    
    if (global.gc) global.gc();
    
    const after = process.memoryUsage().heapUsed;
    measurements.push({ iteration: i, memory_delta: after - before });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return measurements;
}
```

**Solutions:**
1. **Implement Periodic Cleanup**
   ```javascript
   class MemoryLeakPreventionPartitioner {
     async processPartitions(partitions) {
       for (let i = 0; i < partitions.length; i++) {
         await this.processPartition(partitions[i]);
         
         // Cleanup every 5 partitions
         if (i % 5 === 0) {
           await this.performDeepCleanup();
         }
       }
     }
     
     async performDeepCleanup() {
       // Force checkpoint
       await this.duckdb.executeInternal('PRAGMA force_checkpoint;');
       
       // Clear caches
       await this.duckdb.executeInternal('PRAGMA clear_cache;');
       
       // Multiple GC passes
       if (global.gc) {
         for (let i = 0; i < 3; i++) {
           global.gc();
           await new Promise(resolve => setTimeout(resolve, 100));
         }
       }
     }
   }
   ```

2. **Use Connection Pooling**
   ```javascript
   class PartitionConnectionManager {
     constructor(maxConnections = 5) {
       this.connections = [];
       this.maxConnections = maxConnections;
       this.currentIndex = 0;
     }
     
     async getConnection() {
       if (this.connections.length < this.maxConnections) {
         const conn = new DuckDBWrapper({ memoryLimit: '2GB' });
         await conn.initialize();
         this.connections.push(conn);
         return conn;
       }
       
       // Round-robin existing connections
       const conn = this.connections[this.currentIndex];
       this.currentIndex = (this.currentIndex + 1) % this.connections.length;
       
       // Reset connection if it has processed too many operations
       if (conn.operationCount > 1000) {
         await conn.close();
         await conn.initialize();
         conn.operationCount = 0;
       }
       
       return conn;
     }
   }
   ```

### 2. Performance Issues

#### Slow Partition Creation

**Symptoms:**
- Partitioning takes much longer than expected
- CPU usage is low during partitioning
- Disk I/O is minimal

**Diagnostic Steps:**
```javascript
async function diagnosePartitioningPerformance(duckdb, sourceTable) {
  const startTime = Date.now();
  
  // Test different operations
  const tests = {
    table_scan: `SELECT COUNT(*) FROM ${sourceTable}`,
    memory_usage: `SELECT * FROM duckdb_memory()`,
    table_info: `PRAGMA table_info('${sourceTable}')`
  };
  
  const results = {};
  
  for (const [testName, query] of Object.entries(tests)) {
    const testStart = Date.now();
    try {
      await duckdb.execute(query);
      results[testName] = {
        duration_ms: Date.now() - testStart,
        status: 'success'
      };
    } catch (error) {
      results[testName] = {
        duration_ms: Date.now() - testStart,
        status: 'error',
        error: error.message
      };
    }
  }
  
  return {
    total_diagnostic_time: Date.now() - startTime,
    test_results: results
  };
}
```

**Solutions:**
1. **Optimize Partitioning Queries**
   ```javascript
   // Before: Inefficient partitioning
   await duckdb.execute(`
     CREATE TABLE partition_2024_01 AS
     SELECT * FROM large_table
     WHERE date_column >= '2024-01-01' AND date_column < '2024-02-01'
   `);
   
   // After: Use column statistics for better performance
   await duckdb.execute(`
     CREATE TABLE partition_2024_01 AS
     SELECT * FROM large_table
     WHERE date_column >= DATE '2024-01-01' 
     AND date_column < DATE '2024-02-01'
     ORDER BY date_column  -- Enable better compression
   `);
   ```

2. **Use Parallel Processing**
   ```javascript
   async function parallelPartitioning(duckdb, partitions, maxConcurrency = 3) {
     const results = [];
     
     for (let i = 0; i < partitions.length; i += maxConcurrency) {
       const batch = partitions.slice(i, i + maxConcurrency);
       
       const batchPromises = batch.map(async (partition) => {
         // Use separate connection for each partition
         const conn = new DuckDBWrapper({ memoryLimit: '2GB' });
         await conn.initialize();
         
         try {
           const result = await createPartition(conn, partition);
           await conn.close();
           return result;
         } catch (error) {
           await conn.close();
           throw error;
         }
       });
       
       const batchResults = await Promise.all(batchPromises);
       results.push(...batchResults);
     }
     
     return results;
   }
   ```

3. **Enable Query Optimization**
   ```javascript
   await duckdb.executeInternal(`
     SET enable_optimizer=true;
     SET enable_profiling=true;
     SET enable_progress_bar=true;
   `);
   ```

#### Uneven Partition Sizes

**Symptoms:**
- Some partitions are much larger than others
- Memory usage spikes for certain partitions
- Inconsistent processing times

**Diagnostic Steps:**
```javascript
async function analyzePartitionDistribution(duckdb, partitions) {
  const distribution = [];
  
  for (const partition of partitions) {
    const stats = await duckdb.execute(`
      SELECT 
        COUNT(*) as row_count,
        pg_size_pretty(pg_total_relation_size('${partition.table_name}')) as size
      FROM ${partition.table_name}
    `);
    
    distribution.push({
      partition_name: partition.table_name,
      row_count: stats.data[0].row_count,
      estimated_size: stats.data[0].size
    });
  }
  
  // Calculate distribution statistics
  const rowCounts = distribution.map(p => p.row_count);
  const mean = rowCounts.reduce((a, b) => a + b, 0) / rowCounts.length;
  const variance = rowCounts.reduce((sum, count) => sum + Math.pow(count - mean, 2), 0) / rowCounts.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / mean;
  
  return {
    partitions: distribution,
    statistics: {
      mean_rows: Math.round(mean),
      std_deviation: Math.round(stdDev),
      coefficient_of_variation: coefficientOfVariation,
      distribution_quality: coefficientOfVariation < 0.3 ? 'good' : 'uneven'
    }
  };
}
```

**Solutions:**
1. **Use Percentile-based Range Partitioning**
   ```javascript
   async function createBalancedRangePartitions(duckdb, sourceTable, column, partitionCount) {
     // Calculate percentile boundaries
     const percentiles = [];
     for (let i = 1; i < partitionCount; i++) {
       percentiles.push((i / partitionCount) * 100);
     }
     
     const boundaries = await duckdb.execute(`
       SELECT 
         ${percentiles.map(p => `PERCENTILE_CONT(${p/100}) WITHIN GROUP (ORDER BY ${column}) as p${p}`).join(', ')}
       FROM ${sourceTable}
     `);
     
     // Create partitions using calculated boundaries
     const partitions = [];
     for (let i = 0; i < partitionCount; i++) {
       const isFirst = i === 0;
       const isLast = i === partitionCount - 1;
       
       let whereClause;
       if (isFirst) {
         whereClause = `${column} <= ${boundaries.data[0][`p${percentiles[0]}`]}`;
       } else if (isLast) {
         whereClause = `${column} > ${boundaries.data[0][`p${percentiles[i-1]}`]}`;
       } else {
         whereClause = `${column} > ${boundaries.data[0][`p${percentiles[i-1]}`]} AND ${column} <= ${boundaries.data[0][`p${percentiles[i]}`]}`;
       }
       
       partitions.push({ whereClause, partitionIndex: i });
     }
     
     return partitions;
   }
   ```

2. **Dynamic Partition Adjustment**
   ```javascript
   async function adjustPartitionSizes(duckdb, partitions, targetSizeRows = 100000) {
     const adjustedPartitions = [];
     
     for (const partition of partitions) {
       const rowCount = await getPartitionRowCount(duckdb, partition.table_name);
       
       if (rowCount > targetSizeRows * 2) {
         // Split large partition
         const subPartitions = await splitPartition(duckdb, partition, 2);
         adjustedPartitions.push(...subPartitions);
       } else if (rowCount < targetSizeRows * 0.5) {
         // Mark for merging with next partition
         partition.needsMerging = true;
         adjustedPartitions.push(partition);
       } else {
         adjustedPartitions.push(partition);
       }
     }
     
     return adjustedPartitions;
   }
   ```

### 3. Data Consistency Issues

#### Missing Data After Partitioning

**Symptoms:**
- Row count doesn't match between source and partitioned tables
- Some records appear to be missing
- Data validation failures

**Diagnostic Steps:**
```javascript
async function validatePartitioningIntegrity(duckdb, sourceTable, partitions) {
  // Check total row count
  const sourceCount = await duckdb.execute(`SELECT COUNT(*) as count FROM ${sourceTable}`);
  
  let partitionTotalCount = 0;
  const partitionCounts = [];
  
  for (const partition of partitions) {
    const partitionCount = await duckdb.execute(`SELECT COUNT(*) as count FROM ${partition.table_name}`);
    const count = partitionCount.data[0].count;
    partitionTotalCount += count;
    partitionCounts.push({
      partition: partition.table_name,
      count: count
    });
  }
  
  // Check for overlaps (sample-based)
  const overlapCheck = await duckdb.execute(`
    SELECT COUNT(*) as overlap_count
    FROM (
      SELECT DISTINCT primary_key 
      FROM (
        ${partitions.map(p => `SELECT primary_key FROM ${p.table_name}`).join(' UNION ALL ')}
      )
    ) duplicates
    WHERE (
      SELECT COUNT(*) 
      FROM (
        ${partitions.map(p => `SELECT primary_key FROM ${p.table_name}`).join(' UNION ALL ')}
      ) all_records
      WHERE all_records.primary_key = duplicates.primary_key
    ) > 1
  `);
  
  return {
    source_count: sourceCount.data[0].count,
    partition_total_count: partitionTotalCount,
    count_difference: sourceCount.data[0].count - partitionTotalCount,
    partition_counts: partitionCounts,
    overlap_count: overlapCheck.data[0].overlap_count,
    integrity_check: {
      row_count_match: sourceCount.data[0].count === partitionTotalCount,
      no_overlaps: overlapCheck.data[0].overlap_count === 0
    }
  };
}
```

**Solutions:**
1. **Use Comprehensive Partition Conditions**
   ```javascript
   // Before: Potential gaps in partitioning
   const partitions = [
     { condition: "date_column >= '2024-01-01' AND date_column < '2024-02-01'" },
     { condition: "date_column >= '2024-02-01' AND date_column < '2024-03-01'" }
     // Missing boundary conditions
   ];
   
   // After: Comprehensive partitioning with explicit boundaries
   async function createComprehensivePartitions(duckdb, sourceTable, dateColumn) {
     const boundaries = await duckdb.execute(`
       SELECT 
         MIN(${dateColumn}) as min_date,
         MAX(${dateColumn}) as max_date
       FROM ${sourceTable}
     `);
     
     const { min_date, max_date } = boundaries.data[0];
     
     // Create overlapping partitions to catch edge cases
     const partitions = [
       { 
         condition: `${dateColumn} >= '${min_date}' AND ${dateColumn} < '2024-02-01'`,
         name: 'partition_2024_01'
       },
       { 
         condition: `${dateColumn} >= '2024-02-01' AND ${dateColumn} < '2024-03-01'`,
         name: 'partition_2024_02'
       },
       {
         condition: `${dateColumn} >= '2024-03-01' AND ${dateColumn} <= '${max_date}'`,
         name: 'partition_2024_03_and_after'
       }
     ];
     
     return partitions;
   }
   ```

2. **Implement Data Validation Checkpoints**
   ```javascript
   class ValidatedPartitioner {
     async partitionWithValidation(sourceTable, partitions) {
       const results = [];
       
       // Pre-partitioning validation
       const sourceStats = await this.getTableStats(sourceTable);
       
       // Create partitions
       for (const partition of partitions) {
         const result = await this.createPartition(sourceTable, partition);
         results.push(result);
       }
       
       // Post-partitioning validation
       const validation = await this.validatePartitioning(sourceTable, results);
       
       if (!validation.is_valid) {
         await this.rollbackPartitioning(results);
         throw new Error(`Partitioning validation failed: ${validation.errors.join(', ')}`);
       }
       
       return results;
     }
     
     async validatePartitioning(sourceTable, partitionResults) {
       const errors = [];
       
       // Check row count conservation
       const sourceCount = await this.getRowCount(sourceTable);
       const partitionSum = partitionResults.reduce((sum, p) => sum + p.row_count, 0);
       
       if (sourceCount !== partitionSum) {
         errors.push(`Row count mismatch: source=${sourceCount}, partitions=${partitionSum}`);
       }
       
       // Check for overlaps (if applicable)
       const overlapCheck = await this.checkForOverlaps(partitionResults);
       if (overlapCheck.has_overlaps) {
         errors.push(`Data overlaps detected: ${overlapCheck.overlap_count} records`);
       }
       
       return {
         is_valid: errors.length === 0,
         errors: errors
       };
     }
   }
   ```

#### Partition Overlap Issues

**Symptoms:**
- Same records appear in multiple partitions
- Data duplication in query results
- Incorrect aggregation results

**Diagnostic Steps:**
```javascript
async function detectPartitionOverlaps(duckdb, partitions) {
  const overlaps = [];
  
  // Check each pair of partitions for overlaps
  for (let i = 0; i < partitions.length; i++) {
    for (let j = i + 1; j < partitions.length; j++) {
      const partition1 = partitions[i];
      const partition2 = partitions[j];
      
      const overlapQuery = `
        SELECT COUNT(*) as overlap_count
        FROM ${partition1.table_name} p1
        INNER JOIN ${partition2.table_name} p2
        ON p1.primary_key = p2.primary_key
      `;
      
      const result = await duckdb.execute(overlapQuery);
      const overlapCount = result.data[0].overlap_count;
      
      if (overlapCount > 0) {
        overlaps.push({
          partition1: partition1.table_name,
          partition2: partition2.table_name,
          overlap_count: overlapCount
        });
      }
    }
  }
  
  return overlaps;
}
```

**Solutions:**
1. **Use Mutually Exclusive Conditions**
   ```javascript
   // Before: Overlapping conditions
   const conditions = [
     "amount >= 0 AND amount <= 1000",    // Includes 1000
     "amount >= 1000 AND amount <= 5000"  // Also includes 1000 - OVERLAP!
   ];
   
   // After: Mutually exclusive conditions
   const conditions = [
     "amount >= 0 AND amount < 1000",     // Excludes 1000
     "amount >= 1000 AND amount < 5000",  // Includes 1000, excludes 5000
     "amount >= 5000"                     // Includes 5000 and above
   ];
   ```

2. **Implement Overlap Detection and Removal**
   ```javascript
   async function removePartitionOverlaps(duckdb, partitions) {
     const cleanedPartitions = [];
     
     for (let i = 0; i < partitions.length; i++) {
       const partition = partitions[i];
       let whereClause = '';
       
       // Add conditions to exclude records that belong to previous partitions
       for (let j = 0; j < i; j++) {
         const prevPartition = partitions[j];
         whereClause += ` AND primary_key NOT IN (SELECT primary_key FROM ${prevPartition.table_name})`;
       }
       
       // Recreate partition without overlaps
       const cleanTableName = `${partition.table_name}_clean`;
       await duckdb.execute(`
         CREATE TABLE ${cleanTableName} AS
         SELECT * FROM ${partition.table_name}
         WHERE 1=1 ${whereClause}
       `);
       
       // Drop original and rename clean version
       await duckdb.execute(`DROP TABLE ${partition.table_name}`);
       await duckdb.execute(`ALTER TABLE ${cleanTableName} RENAME TO ${partition.table_name}`);
       
       cleanedPartitions.push(partition);
     }
     
     return cleanedPartitions;
   }
   ```

### 4. Configuration and Setup Issues

#### Incorrect Partition Column Data Types

**Symptoms:**
- Partitioning fails with type conversion errors
- Unexpected partition boundaries
- Poor partition performance

**Diagnostic Steps:**
```javascript
async function analyzePartitionColumn(duckdb, tableName, columnName) {
  const analysis = await duckdb.execute(`
    SELECT 
      data_type,
      is_nullable,
      MIN(${columnName}) as min_value,
      MAX(${columnName}) as max_value,
      COUNT(DISTINCT ${columnName}) as distinct_values,
      COUNT(*) as total_rows,
      COUNT(CASE WHEN ${columnName} IS NULL THEN 1 END) as null_count
    FROM information_schema.columns 
    CROSS JOIN ${tableName}
    WHERE table_name = '${tableName}' AND column_name = '${columnName}'
    GROUP BY data_type, is_nullable
  `);
  
  return analysis.data[0];
}
```

**Solutions:**
1. **Convert Column Types Before Partitioning**
   ```javascript
   async function preparePartitionColumn(duckdb, tableName, columnName, targetType) {
     // Create temporary table with converted column
     const tempTable = `${tableName}_prepared`;
     
     let conversionExpr;
     switch (targetType) {
       case 'DATE':
         conversionExpr = `CAST(${columnName} AS DATE)`;
         break;
       case 'TIMESTAMP':
         conversionExpr = `CAST(${columnName} AS TIMESTAMP)`;
         break;
       case 'INTEGER':
         conversionExpr = `CAST(${columnName} AS INTEGER)`;
         break;
       default:
         conversionExpr = `CAST(${columnName} AS ${targetType})`;
     }
     
     await duckdb.execute(`
       CREATE TABLE ${tempTable} AS
       SELECT 
         *,
         ${conversionExpr} as ${columnName}_converted
       FROM ${tableName}
       WHERE ${columnName} IS NOT NULL
     `);
     
     return tempTable;
   }
   ```

2. **Handle Null Values in Partition Columns**
   ```javascript
   async function handleNullsInPartitioning(duckdb, sourceTable, partitionColumn) {
     // Create separate partition for null values
     await duckdb.execute(`
       CREATE TABLE ${sourceTable}_null_partition AS
       SELECT * FROM ${sourceTable}
       WHERE ${partitionColumn} IS NULL
     `);
     
     // Create main partitioning table without nulls
     await duckdb.execute(`
       CREATE TABLE ${sourceTable}_for_partitioning AS
       SELECT * FROM ${sourceTable}
       WHERE ${partitionColumn} IS NOT NULL
     `);
     
     return {
       main_table: `${sourceTable}_for_partitioning`,
       null_partition: `${sourceTable}_null_partition`
     };
   }
   ```

### 5. Integration Issues with BMad-Method

#### Feature Flag Configuration Problems

**Symptoms:**
- Partitioning features not available
- Inconsistent behavior across environments
- Configuration not loading properly

**Diagnostic Steps:**
```javascript
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

async function diagnoseFeatureFlags() {
  const features = [
    'duckdb_analytics',
    'duckdb_partitioning',
    'duckdb_memory_management',
    'duckdb_monitoring'
  ];
  
  const status = {};
  
  for (const feature of features) {
    status[feature] = {
      enabled: isFeatureEnabled(feature),
      source: process.env[`FEATURE_${feature.toUpperCase()}`] || 'default'
    };
  }
  
  return status;
}
```

**Solutions:**
1. **Check Feature Flag Configuration**
   ```yaml
   # bmad-method/config/feature-flags.yaml
   features:
     duckdb_analytics:
       enabled: true
       description: "Enable DuckDB analytics integration"
     
     duckdb_partitioning:
       enabled: true
       description: "Enable DuckDB data partitioning"
       dependencies: ["duckdb_analytics"]
     
     duckdb_memory_management:
       enabled: true
       description: "Enable DuckDB memory management"
       dependencies: ["duckdb_analytics"]
   ```

2. **Environment-specific Configuration**
   ```javascript
   // Check and set environment-specific flags
   function configureEnvironmentFlags() {
     const environment = process.env.NODE_ENV || 'development';
     
     const envConfig = {
       development: {
         duckdb_partitioning: true,
         duckdb_monitoring: true
       },
       testing: {
         duckdb_partitioning: true,
         duckdb_monitoring: false  // Reduce noise in tests
       },
       production: {
         duckdb_partitioning: true,
         duckdb_monitoring: true
       }
     };
     
     const config = envConfig[environment] || envConfig.development;
     
     Object.entries(config).forEach(([feature, enabled]) => {
       if (!process.env[`FEATURE_${feature.toUpperCase()}`]) {
         process.env[`FEATURE_${feature.toUpperCase()}`] = enabled.toString();
       }
     });
   }
   ```

## Recovery Procedures

### Automatic Recovery

```javascript
class PartitioningRecoveryManager {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.backupEnabled = options.backupEnabled || true;
    this.maxRetryAttempts = options.maxRetryAttempts || 3;
  }

  async recoverFromPartitioningFailure(sourceTable, partitioningConfig, error) {
    console.log(`Attempting recovery from partitioning failure: ${error.message}`);
    
    // Step 1: Assess the failure
    const failureType = this.classifyFailure(error);
    
    // Step 2: Choose recovery strategy
    switch (failureType) {
      case 'memory':
        return await this.recoverFromMemoryFailure(sourceTable, partitioningConfig);
      case 'timeout':
        return await this.recoverFromTimeoutFailure(sourceTable, partitioningConfig);
      case 'data_integrity':
        return await this.recoverFromDataIntegrityFailure(sourceTable, partitioningConfig);
      default:
        return await this.performGeneralRecovery(sourceTable, partitioningConfig);
    }
  }

  classifyFailure(error) {
    const message = error.message.toLowerCase();
    
    if (message.includes('memory') || message.includes('out of space')) {
      return 'memory';
    } else if (message.includes('timeout') || message.includes('connection')) {
      return 'timeout';
    } else if (message.includes('constraint') || message.includes('duplicate')) {
      return 'data_integrity';
    }
    
    return 'unknown';
  }

  async recoverFromMemoryFailure(sourceTable, config) {
    console.log('Recovering from memory failure...');
    
    // Reduce partition size and retry
    const reducedConfig = {
      ...config,
      partitionCount: Math.ceil(config.partitionCount * 0.5),
      batchSize: Math.ceil(config.batchSize * 0.5)
    };
    
    // Enable aggressive memory management
    await this.duckdb.executeInternal(`
      PRAGMA memory_limit='${Math.ceil(parseInt(this.duckdb.memoryLimit) * 0.7)}GB';
      PRAGMA temp_directory='/tmp/duckdb_recovery_spill';
    `);
    
    return await this.retryPartitioning(sourceTable, reducedConfig);
  }

  async retryPartitioning(sourceTable, config, attempt = 1) {
    if (attempt > this.maxRetryAttempts) {
      throw new Error(`Partitioning failed after ${this.maxRetryAttempts} attempts`);
    }
    
    try {
      console.log(`Retry attempt ${attempt}/${this.maxRetryAttempts}`);
      
      // Clean up any partial results
      await this.cleanupPartialPartitions(sourceTable);
      
      // Retry with modified configuration
      return await this.performPartitioning(sourceTable, config);
      
    } catch (error) {
      console.warn(`Retry attempt ${attempt} failed: ${error.message}`);
      
      // Wait before retry with exponential backoff
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      
      return await this.retryPartitioning(sourceTable, config, attempt + 1);
    }
  }
}
```

### Manual Recovery Procedures

1. **Clean Up Failed Partitions**
   ```bash
   # Connect to DuckDB and clean up
   duckdb analytics.db
   
   # List all tables to identify partial partitions
   .tables
   
   # Drop failed partition tables
   DROP TABLE IF EXISTS partition_table_1;
   DROP TABLE IF EXISTS partition_table_2;
   
   # Check for orphaned temporary tables
   SELECT table_name FROM information_schema.tables 
   WHERE table_name LIKE 'temp_%' OR table_name LIKE 'tmp_%';
   ```

2. **Restore from Backup**
   ```javascript
   async function restoreFromBackup(duckdb, backupPath, targetTable) {
     console.log(`Restoring ${targetTable} from backup: ${backupPath}`);
     
     try {
       // Drop existing table if it exists
       await duckdb.execute(`DROP TABLE IF EXISTS ${targetTable}`);
       
       // Restore from backup
       await duckdb.execute(`
         CREATE TABLE ${targetTable} AS
         SELECT * FROM read_parquet('${backupPath}')
       `);
       
       // Verify restoration
       const count = await duckdb.execute(`SELECT COUNT(*) as count FROM ${targetTable}`);
       console.log(`Restored ${count.data[0].count} rows`);
       
       return true;
     } catch (error) {
       console.error(`Backup restoration failed: ${error.message}`);
       return false;
     }
   }
   ```

## Monitoring and Prevention

### Proactive Monitoring

```javascript
class PartitioningMonitor {
  constructor(duckdb) {
    this.duckdb = duckdb;
    this.alerts = [];
  }

  async monitorPartitioningHealth() {
    const health = {
      memory_status: await this.checkMemoryStatus(),
      partition_balance: await this.checkPartitionBalance(),
      performance_metrics: await this.checkPerformanceMetrics()
    };

    // Check for warning conditions
    if (health.memory_status.usage_percent > 80) {
      this.alerts.push({
        type: 'memory_warning',
        message: `High memory usage: ${health.memory_status.usage_percent}%`,
        severity: 'warning'
      });
    }

    if (health.partition_balance.coefficient_of_variation > 0.5) {
      this.alerts.push({
        type: 'partition_imbalance',
        message: `Uneven partition distribution detected`,
        severity: 'warning'
      });
    }

    return health;
  }

  async checkMemoryStatus() {
    const memUsage = process.memoryUsage();
    return {
      heap_used_mb: Math.round(memUsage.heapUsed / 1024 / 1024),
      heap_total_mb: Math.round(memUsage.heapTotal / 1024 / 1024),
      usage_percent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
    };
  }
}
```

## Best Practices for Troubleshooting

1. **Always Test with Small Datasets First**
2. **Monitor Memory Usage Throughout Partitioning**
3. **Validate Data Integrity After Each Partition**
4. **Use Appropriate Error Handling and Logging**
5. **Keep Backups Before Large Partitioning Operations**
6. **Document Custom Partitioning Strategies**
7. **Test Recovery Procedures Regularly**

## Getting Help

For additional support:
1. Check DuckDB logs for detailed error messages
2. Review memory usage patterns before partitioning
3. Validate data types and constraints
4. Test partitioning logic with sample data
5. Consult BMad-Method integration documentation

## References

- [DuckDB Error Handling](https://duckdb.org/docs/guides/troubleshooting)
- [Memory Management Documentation](../architecture/duckdb-memory-management.md)
- [Partitioning Strategies](../architecture/duckdb-partitioning-strategies.md)
- [Performance Benchmarks](../performance/duckdb-performance-benchmarks.md)