# DuckDB Dataset Partitioning Strategies

## Overview

This document provides comprehensive partitioning strategies for handling larger-than-memory datasets in DuckDB within the BMad-Method data practitioner expansion pack. These strategies enable efficient processing of datasets ranging from gigabytes to terabytes while maintaining system stability and performance.

## Partitioning Strategy Categories

### 1. Temporal Partitioning (Time-based)

**Use Cases:** Event logs, transaction data, sensor readings, user activity
**Memory Efficiency:** High - processes data chronologically, allowing for streaming cleanup

```javascript
class TemporalPartitioner {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.partitionSize = options.partitionSize || 'month'; // day, week, month, quarter, year
    this.batchSize = options.batchSize || 100000;
    this.overlapWindow = options.overlapWindow || 0; // Days overlap for window functions
  }

  /**
   * Partition data by time periods
   */
  async partitionByTime(sourceTable, dateColumn, targetPrefix) {
    const partitions = await this.getTimePartitions(sourceTable, dateColumn);
    const results = [];

    for (const partition of partitions) {
      const tableName = `${targetPrefix}_${partition.period}`;
      
      // Create partition table
      await this.duckdb.execute(`
        CREATE OR REPLACE TABLE ${tableName} AS
        SELECT * FROM ${sourceTable}
        WHERE ${dateColumn} >= '${partition.start_date}'
        AND ${dateColumn} < '${partition.end_date}'
      `);
      
      const stats = await this.getPartitionStats(tableName);
      results.push({
        partition: partition.period,
        table_name: tableName,
        row_count: stats.row_count,
        size_mb: stats.size_mb,
        date_range: `${partition.start_date} to ${partition.end_date}`
      });
      
      console.log(`Created partition ${tableName}: ${stats.row_count} rows`);
    }
    
    return results;
  }

  /**
   * Process temporal partitions with streaming
   */
  async processTemporalStream(sourceTable, dateColumn, processingFunction) {
    const partitions = await this.getTimePartitions(sourceTable, dateColumn);
    const results = [];

    for (let i = 0; i < partitions.length; i++) {
      const partition = partitions[i];
      console.log(`Processing partition ${i + 1}/${partitions.length}: ${partition.period}`);
      
      // Load partition data
      const data = await this.duckdb.execute(`
        SELECT * FROM ${sourceTable}
        WHERE ${dateColumn} >= '${partition.start_date}'
        AND ${dateColumn} < '${partition.end_date}'
        ORDER BY ${dateColumn}
      `);
      
      // Process partition
      const result = await processingFunction(data.data, partition);
      results.push({
        partition: partition.period,
        result,
        processed_rows: data.data.length
      });
      
      // Force cleanup between partitions
      if (global.gc) global.gc();
    }
    
    return results;
  }

  /**
   * Get time-based partition boundaries
   */
  async getTimePartitions(sourceTable, dateColumn) {
    const result = await this.duckdb.execute(`
      SELECT 
        MIN(${dateColumn}) as min_date,
        MAX(${dateColumn}) as max_date
      FROM ${sourceTable}
    `);
    
    const { min_date, max_date } = result.data[0];
    const partitions = [];
    
    let currentDate = new Date(min_date);
    const endDate = new Date(max_date);
    
    while (currentDate <= endDate) {
      const nextDate = this.getNextPeriodDate(currentDate);
      
      partitions.push({
        period: this.formatPeriod(currentDate),
        start_date: currentDate.toISOString().split('T')[0],
        end_date: nextDate.toISOString().split('T')[0]
      });
      
      currentDate = nextDate;
    }
    
    return partitions;
  }

  getNextPeriodDate(date) {
    const next = new Date(date);
    
    switch (this.partitionSize) {
      case 'day':
        next.setDate(next.getDate() + 1);
        break;
      case 'week':
        next.setDate(next.getDate() + 7);
        break;
      case 'month':
        next.setMonth(next.getMonth() + 1);
        break;
      case 'quarter':
        next.setMonth(next.getMonth() + 3);
        break;
      case 'year':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    
    return next;
  }

  formatPeriod(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    switch (this.partitionSize) {
      case 'day':
        return `${year}${month}${day}`;
      case 'week':
        const week = Math.ceil(date.getDate() / 7);
        return `${year}${month}W${week}`;
      case 'month':
        return `${year}${month}`;
      case 'quarter':
        const quarter = Math.ceil((date.getMonth() + 1) / 3);
        return `${year}Q${quarter}`;
      case 'year':
        return `${year}`;
      default:
        return `${year}${month}`;
    }
  }
}
```

### 2. Hash-based Partitioning (Horizontal)

**Use Cases:** User data, product catalogs, evenly distributed datasets
**Memory Efficiency:** High - enables parallel processing and balanced load distribution

```javascript
class HashPartitioner {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.partitionCount = options.partitionCount || 8;
    this.hashColumn = options.hashColumn;
    this.batchSize = options.batchSize || 50000;
  }

  /**
   * Partition data using hash function
   */
  async partitionByHash(sourceTable, hashColumn, targetPrefix) {
    const partitions = [];
    
    for (let i = 0; i < this.partitionCount; i++) {
      const tableName = `${targetPrefix}_hash_${i}`;
      
      await this.duckdb.execute(`
        CREATE OR REPLACE TABLE ${tableName} AS
        SELECT * FROM ${sourceTable}
        WHERE ABS(HASH(${hashColumn})) % ${this.partitionCount} = ${i}
      `);
      
      const stats = await this.getPartitionStats(tableName);
      partitions.push({
        partition_id: i,
        table_name: tableName,
        hash_range: `${i}/${this.partitionCount}`,
        row_count: stats.row_count,
        size_mb: stats.size_mb
      });
      
      console.log(`Created hash partition ${i}: ${stats.row_count} rows`);
    }
    
    return partitions;
  }

  /**
   * Process hash partitions in parallel
   */
  async processHashPartitionsParallel(sourceTable, hashColumn, processingFunction, maxConcurrent = 3) {
    const partitionPromises = [];
    const results = [];
    
    for (let i = 0; i < this.partitionCount; i += maxConcurrent) {
      const batch = [];
      
      for (let j = i; j < Math.min(i + maxConcurrent, this.partitionCount); j++) {
        batch.push(this.processHashPartition(sourceTable, hashColumn, j, processingFunction));
      }
      
      const batchResults = await Promise.all(batch);
      results.push(...batchResults);
      
      console.log(`Completed hash partition batch ${Math.floor(i / maxConcurrent) + 1}`);
      
      // Allow garbage collection between batches
      if (global.gc) global.gc();
    }
    
    return results;
  }

  async processHashPartition(sourceTable, hashColumn, partitionId, processingFunction) {
    const data = await this.duckdb.execute(`
      SELECT * FROM ${sourceTable}
      WHERE ABS(HASH(${hashColumn})) % ${this.partitionCount} = ${partitionId}
    `);
    
    const result = await processingFunction(data.data, { partitionId, hashColumn });
    
    return {
      partition_id: partitionId,
      processed_rows: data.data.length,
      result
    };
  }
}
```

### 3. Range-based Partitioning (Ordered Data)

**Use Cases:** Numeric ranges, geographic data, ordered sequences
**Memory Efficiency:** Medium-High - enables efficient range queries and ordered processing

```javascript
class RangePartitioner {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.rangeColumn = options.rangeColumn;
    this.partitionCount = options.partitionCount || 10;
    this.customRanges = options.customRanges; // Optional predefined ranges
  }

  /**
   * Partition data by value ranges
   */
  async partitionByRange(sourceTable, rangeColumn, targetPrefix) {
    const ranges = this.customRanges || await this.calculateOptimalRanges(sourceTable, rangeColumn);
    const partitions = [];
    
    for (let i = 0; i < ranges.length; i++) {
      const range = ranges[i];
      const tableName = `${targetPrefix}_range_${i}`;
      
      let whereClause;
      if (i === 0) {
        whereClause = `${rangeColumn} <= ${range.max}`;
      } else if (i === ranges.length - 1) {
        whereClause = `${rangeColumn} > ${ranges[i-1].max}`;
      } else {
        whereClause = `${rangeColumn} > ${ranges[i-1].max} AND ${rangeColumn} <= ${range.max}`;
      }
      
      await this.duckdb.execute(`
        CREATE OR REPLACE TABLE ${tableName} AS
        SELECT * FROM ${sourceTable}
        WHERE ${whereClause}
      `);
      
      const stats = await this.getPartitionStats(tableName);
      partitions.push({
        partition_id: i,
        table_name: tableName,
        range: range,
        where_clause: whereClause,
        row_count: stats.row_count,
        size_mb: stats.size_mb
      });
      
      console.log(`Created range partition ${i}: ${stats.row_count} rows`);
    }
    
    return partitions;
  }

  /**
   * Calculate optimal range boundaries for even distribution
   */
  async calculateOptimalRanges(sourceTable, rangeColumn) {
    // Get percentiles for even distribution
    const percentileQuery = [];
    for (let i = 1; i < this.partitionCount; i++) {
      const percentile = (i / this.partitionCount) * 100;
      percentileQuery.push(`PERCENTILE_CONT(${percentile / 100}) WITHIN GROUP (ORDER BY ${rangeColumn}) as p${percentile}`);
    }
    
    const result = await this.duckdb.execute(`
      SELECT 
        MIN(${rangeColumn}) as min_val,
        MAX(${rangeColumn}) as max_val,
        ${percentileQuery.join(', ')}
      FROM ${sourceTable}
    `);
    
    const stats = result.data[0];
    const ranges = [];
    
    // Build ranges from percentiles
    for (let i = 0; i < this.partitionCount; i++) {
      const percentileKey = `p${((i + 1) / this.partitionCount) * 100}`;
      ranges.push({
        min: i === 0 ? stats.min_val : ranges[i - 1].max,
        max: i === this.partitionCount - 1 ? stats.max_val : stats[percentileKey]
      });
    }
    
    return ranges;
  }
}
```

## Chunking and Streaming Approaches

### 1. Row-based Chunking

**Memory Usage:** Fixed memory footprint regardless of dataset size
**Best For:** ETL processing, data transformation pipelines

```javascript
class RowChunker {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.chunkSize = options.chunkSize || 100000;
    this.overlapRows = options.overlapRows || 0; // For window functions
  }

  /**
   * Process large dataset in row-based chunks
   */
  async processInChunks(sourceTable, processingFunction, orderBy = null) {
    const totalRows = await this.getTotalRowCount(sourceTable);
    const chunks = Math.ceil(totalRows / this.chunkSize);
    const results = [];
    
    console.log(`Processing ${totalRows} rows in ${chunks} chunks of ${this.chunkSize}`);
    
    for (let i = 0; i < chunks; i++) {
      const offset = i * this.chunkSize;
      const adjustedOffset = Math.max(0, offset - this.overlapRows);
      const limit = this.chunkSize + this.overlapRows;
      
      const orderClause = orderBy ? `ORDER BY ${orderBy}` : '';
      
      const chunk = await this.duckdb.execute(`
        SELECT * FROM ${sourceTable}
        ${orderClause}
        LIMIT ${limit} OFFSET ${adjustedOffset}
      `);
      
      console.log(`Processing chunk ${i + 1}/${chunks}: ${chunk.data.length} rows`);
      
      const result = await processingFunction(chunk.data, {
        chunkIndex: i,
        offset: adjustedOffset,
        totalChunks: chunks,
        isLastChunk: i === chunks - 1
      });
      
      results.push({
        chunk_index: i,
        processed_rows: chunk.data.length,
        result
      });
      
      // Memory cleanup between chunks
      if (i % 5 === 0 && global.gc) {
        global.gc();
      }
    }
    
    return results;
  }

  async getTotalRowCount(tableName) {
    const result = await this.duckdb.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
    return result.data[0].count;
  }
}
```

### 2. Memory-based Chunking

**Memory Usage:** Adaptive based on available memory
**Best For:** Variable row sizes, memory-constrained environments

```javascript
class MemoryChunker {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.targetMemoryMB = options.targetMemoryMB || 500; // 500MB chunks
    this.sampleSize = options.sampleSize || 1000; // Rows to sample for size estimation
  }

  /**
   * Process data in memory-sized chunks
   */
  async processInMemoryChunks(sourceTable, processingFunction, orderBy = null) {
    const totalRows = await this.getTotalRowCount(sourceTable);
    const avgRowSize = await this.estimateAverageRowSize(sourceTable);
    const rowsPerChunk = Math.floor((this.targetMemoryMB * 1024 * 1024) / avgRowSize);
    
    console.log(`Estimated ${avgRowSize} bytes per row, processing ${rowsPerChunk} rows per chunk`);
    
    const rowChunker = new RowChunker(this.duckdb, { chunkSize: rowsPerChunk });
    return await rowChunker.processInChunks(sourceTable, processingFunction, orderBy);
  }

  /**
   * Estimate average row size by sampling
   */
  async estimateAverageRowSize(sourceTable) {
    const sample = await this.duckdb.execute(`
      SELECT * FROM ${sourceTable} 
      TABLESAMPLE SYSTEM(1) 
      LIMIT ${this.sampleSize}
    `);
    
    if (sample.data.length === 0) {
      return 1000; // Default estimate
    }
    
    // Rough estimation based on JSON serialization size
    const sampleSizeBytes = JSON.stringify(sample.data).length;
    return Math.ceil(sampleSizeBytes / sample.data.length);
  }
}
```

### 3. Streaming with External Sources

**Memory Usage:** Minimal - processes data as it arrives
**Best For:** Real-time data, large file ingestion, API data

```javascript
class StreamingProcessor {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.batchSize = options.batchSize || 10000;
    this.commitInterval = options.commitInterval || 100000; // Commit every 100k rows
    this.tempTablePrefix = options.tempTablePrefix || 'stream_temp';
  }

  /**
   * Process streaming data with batching
   */
  async processStream(dataStream, targetTable, schema) {
    let batch = [];
    let totalProcessed = 0;
    let batchCount = 0;
    
    // Create temporary staging table
    const stagingTable = `${this.tempTablePrefix}_${Date.now()}`;
    await this.createStagingTable(stagingTable, schema);
    
    return new Promise((resolve, reject) => {
      dataStream.on('data', async (row) => {
        batch.push(row);
        
        if (batch.length >= this.batchSize) {
          await this.processBatch(batch, stagingTable);
          totalProcessed += batch.length;
          batchCount++;
          
          console.log(`Processed batch ${batchCount}: ${totalProcessed} total rows`);
          
          // Commit periodically
          if (totalProcessed % this.commitInterval === 0) {
            await this.commitToTargetTable(stagingTable, targetTable);
            await this.duckdb.execute(`DELETE FROM ${stagingTable}`);
          }
          
          batch = [];
          
          // Memory cleanup
          if (batchCount % 10 === 0 && global.gc) {
            global.gc();
          }
        }
      });
      
      dataStream.on('end', async () => {
        try {
          // Process remaining batch
          if (batch.length > 0) {
            await this.processBatch(batch, stagingTable);
            totalProcessed += batch.length;
          }
          
          // Final commit
          await this.commitToTargetTable(stagingTable, targetTable);
          
          // Cleanup
          await this.duckdb.execute(`DROP TABLE IF EXISTS ${stagingTable}`);
          
          resolve({
            total_processed: totalProcessed,
            batch_count: batchCount + 1
          });
        } catch (error) {
          reject(error);
        }
      });
      
      dataStream.on('error', reject);
    });
  }

  async createStagingTable(tableName, schema) {
    const columns = Object.entries(schema)
      .map(([name, type]) => `${name} ${type}`)
      .join(', ');
    
    await this.duckdb.execute(`
      CREATE OR REPLACE TABLE ${tableName} (${columns})
    `);
  }

  async processBatch(batch, stagingTable) {
    if (batch.length === 0) return;
    
    const values = batch.map(row => {
      const vals = Object.values(row).map(val => {
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        return val;
      });
      return `(${vals.join(', ')})`;
    }).join(', ');
    
    await this.duckdb.execute(`INSERT INTO ${stagingTable} VALUES ${values}`);
  }

  async commitToTargetTable(stagingTable, targetTable) {
    await this.duckdb.execute(`
      INSERT INTO ${targetTable} 
      SELECT * FROM ${stagingTable}
    `);
  }
}
```

## PyAirbyte Integration for Large Data Ingestion

### Streaming PyAirbyte Data into DuckDB

```javascript
const { spawn } = require('child_process');
const { Transform } = require('stream');

class PyAirbyteStreamer {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.pythonPath = options.pythonPath || 'python';
    this.airbyteConfigPath = options.airbyteConfigPath;
    this.batchSize = options.batchSize || 5000;
  }

  /**
   * Stream data from PyAirbyte source to DuckDB
   */
  async streamFromSource(sourceName, streams, targetTablePrefix) {
    const results = {};
    
    for (const streamName of streams) {
      console.log(`Starting stream: ${streamName}`);
      
      const targetTable = `${targetTablePrefix}_${streamName}`;
      const result = await this.streamSingleSource(sourceName, streamName, targetTable);
      
      results[streamName] = result;
    }
    
    return results;
  }

  async streamSingleSource(sourceName, streamName, targetTable) {
    return new Promise((resolve, reject) => {
      // Spawn PyAirbyte process
      const pyProcess = spawn(this.pythonPath, [
        '-c', this.generatePyAirbyteScript(sourceName, streamName)
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let batch = [];
      let totalRows = 0;
      let schema = null;

      // Transform stream to handle JSON lines
      const jsonTransform = new Transform({
        objectMode: true,
        transform(chunk, encoding, callback) {
          const lines = chunk.toString().split('\n').filter(line => line.trim());
          
          for (const line of lines) {
            try {
              const data = JSON.parse(line);
              this.push(data);
            } catch (error) {
              console.warn('Failed to parse JSON line:', line);
            }
          }
          
          callback();
        }
      });

      pyProcess.stdout.pipe(jsonTransform);

      jsonTransform.on('data', async (record) => {
        try {
          if (record.type === 'SCHEMA') {
            schema = this.convertAirbyteSchema(record.schema);
            await this.createTableFromSchema(targetTable, schema);
          } else if (record.type === 'RECORD') {
            batch.push(record.record.data);
            
            if (batch.length >= this.batchSize) {
              await this.insertBatch(targetTable, batch, schema);
              totalRows += batch.length;
              console.log(`Inserted batch: ${totalRows} total rows in ${targetTable}`);
              batch = [];
              
              // Memory cleanup
              if (totalRows % (this.batchSize * 10) === 0 && global.gc) {
                global.gc();
              }
            }
          }
        } catch (error) {
          console.error('Error processing record:', error);
        }
      });

      jsonTransform.on('end', async () => {
        try {
          // Insert remaining batch
          if (batch.length > 0) {
            await this.insertBatch(targetTable, batch, schema);
            totalRows += batch.length;
          }
          
          resolve({
            table_name: targetTable,
            total_rows: totalRows,
            schema: schema
          });
        } catch (error) {
          reject(error);
        }
      });

      pyProcess.stderr.on('data', (data) => {
        console.error('PyAirbyte stderr:', data.toString());
      });

      pyProcess.on('error', reject);
      pyProcess.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`PyAirbyte process exited with code ${code}`));
        }
      });
    });
  }

  generatePyAirbyteScript(sourceName, streamName) {
    return `
import airbyte as ab
import json
import sys

# Initialize source
source = ab.get_source("${sourceName}")

# Configure source (would need actual config)
source.set_config({
    # Configuration would be loaded from file or environment
})

# Install and check
source.install()
source.check()

# Read and stream data
try:
    for record in source.read(streams=["${streamName}"]):
        print(json.dumps(record.to_dict()))
        sys.stdout.flush()
except Exception as e:
    print(f"Error: {str(e)}", file=sys.stderr)
    sys.exit(1)
`;
  }

  convertAirbyteSchema(airbyteSchema) {
    const schema = {};
    
    for (const [fieldName, fieldDef] of Object.entries(airbyteSchema.properties || {})) {
      schema[fieldName] = this.mapAirbyteTypeToDuckDB(fieldDef);
    }
    
    return schema;
  }

  mapAirbyteTypeToDuckDB(fieldDef) {
    const type = fieldDef.type;
    
    if (Array.isArray(type)) {
      // Handle nullable types
      const nonNullType = type.find(t => t !== 'null');
      return this.mapSingleTypeToDuckDB(nonNullType, fieldDef);
    }
    
    return this.mapSingleTypeToDuckDB(type, fieldDef);
  }

  mapSingleTypeToDuckDB(type, fieldDef) {
    switch (type) {
      case 'string':
        return fieldDef.format === 'date-time' ? 'TIMESTAMP' : 'VARCHAR';
      case 'integer':
        return 'INTEGER';
      case 'number':
        return 'DOUBLE';
      case 'boolean':
        return 'BOOLEAN';
      case 'array':
        return 'JSON';
      case 'object':
        return 'JSON';
      default:
        return 'VARCHAR';
    }
  }

  async createTableFromSchema(tableName, schema) {
    const columns = Object.entries(schema)
      .map(([name, type]) => `"${name}" ${type}`)
      .join(', ');
    
    await this.duckdb.execute(`
      CREATE OR REPLACE TABLE ${tableName} (${columns})
    `);
  }

  async insertBatch(tableName, batch, schema) {
    if (batch.length === 0) return;
    
    const columns = Object.keys(schema);
    const values = batch.map(row => {
      const vals = columns.map(col => {
        const val = row[col];
        if (val === null || val === undefined) return 'NULL';
        if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
        if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
        return val;
      });
      return `(${vals.join(', ')})`;
    }).join(', ');
    
    const columnNames = columns.map(col => `"${col}"`).join(', ');
    
    await this.duckdb.execute(`
      INSERT INTO ${tableName} (${columnNames}) VALUES ${values}
    `);
  }
}
```

## Implementation Examples for Common Scenarios

### Scenario 1: E-commerce Transaction Analysis

```javascript
/**
 * Process large e-commerce transaction dataset with temporal partitioning
 */
async function processEcommerceTransactions(duckdb, sourceTable) {
  const partitioner = new TemporalPartitioner(duckdb, {
    partitionSize: 'month',
    batchSize: 100000
  });
  
  // Partition by transaction month
  const partitions = await partitioner.partitionByTime(
    sourceTable, 
    'transaction_date', 
    'transactions'
  );
  
  // Process each month independently
  const results = await partitioner.processTemporalStream(
    sourceTable,
    'transaction_date',
    async (data, partition) => {
      // Calculate monthly metrics
      const monthlyStats = {
        total_revenue: data.reduce((sum, row) => sum + parseFloat(row.amount), 0),
        transaction_count: data.length,
        unique_customers: new Set(data.map(row => row.customer_id)).size,
        avg_order_value: 0
      };
      
      monthlyStats.avg_order_value = monthlyStats.total_revenue / monthlyStats.transaction_count;
      
      // Store results in summary table
      await duckdb.execute(`
        INSERT INTO monthly_transaction_summary VALUES (
          '${partition.period}',
          ${monthlyStats.total_revenue},
          ${monthlyStats.transaction_count},
          ${monthlyStats.unique_customers},
          ${monthlyStats.avg_order_value}
        )
      `);
      
      return monthlyStats;
    }
  );
  
  return { partitions, results };
}
```

### Scenario 2: User Behavior Analytics with Hash Partitioning

```javascript
/**
 * Analyze user behavior patterns using hash partitioning for parallel processing
 */
async function analyzeUserBehavior(duckdb, sourceTable) {
  const partitioner = new HashPartitioner(duckdb, {
    partitionCount: 8,
    batchSize: 50000
  });
  
  // Process user segments in parallel
  const results = await partitioner.processHashPartitionsParallel(
    sourceTable,
    'user_id',
    async (data, partition) => {
      // Analyze user patterns for this partition
      const userStats = {};
      
      data.forEach(row => {
        if (!userStats[row.user_id]) {
          userStats[row.user_id] = {
            total_sessions: 0,
            total_page_views: 0,
            total_time_spent: 0,
            first_seen: row.timestamp,
            last_seen: row.timestamp
          };
        }
        
        const stats = userStats[row.user_id];
        stats.total_sessions += 1;
        stats.total_page_views += row.page_views || 0;
        stats.total_time_spent += row.session_duration || 0;
        
        if (row.timestamp < stats.first_seen) stats.first_seen = row.timestamp;
        if (row.timestamp > stats.last_seen) stats.last_seen = row.timestamp;
      });
      
      // Store partition results
      const partitionTable = `user_behavior_partition_${partition.partitionId}`;
      await createUserBehaviorTable(duckdb, partitionTable, userStats);
      
      return {
        partition_id: partition.partitionId,
        user_count: Object.keys(userStats).length,
        table_name: partitionTable
      };
    },
    3 // Max 3 concurrent partitions
  );
  
  // Combine partition results
  await combineUserBehaviorPartitions(duckdb, results);
  
  return results;
}

async function createUserBehaviorTable(duckdb, tableName, userStats) {
  await duckdb.execute(`
    CREATE OR REPLACE TABLE ${tableName} (
      user_id VARCHAR,
      total_sessions INTEGER,
      total_page_views INTEGER,
      total_time_spent INTEGER,
      first_seen TIMESTAMP,
      last_seen TIMESTAMP
    )
  `);
  
  const values = Object.entries(userStats).map(([userId, stats]) => 
    `('${userId}', ${stats.total_sessions}, ${stats.total_page_views}, ${stats.total_time_spent}, '${stats.first_seen}', '${stats.last_seen}')`
  ).join(', ');
  
  if (values) {
    await duckdb.execute(`INSERT INTO ${tableName} VALUES ${values}`);
  }
}
```

### Scenario 3: Large File Processing with Memory Chunking

```javascript
/**
 * Process large CSV files with adaptive memory chunking
 */
async function processLargeCsvFile(duckdb, filePath, targetTable) {
  // First, load file into temporary table
  const tempTable = `temp_large_csv_${Date.now()}`;
  
  await duckdb.execute(`
    CREATE TABLE ${tempTable} AS
    SELECT * FROM read_csv('${filePath}', AUTO_DETECT=true)
  `);
  
  // Use memory-based chunking for processing
  const chunker = new MemoryChunker(duckdb, {
    targetMemoryMB: 256, // 256MB chunks
    sampleSize: 5000
  });
  
  const results = await chunker.processInMemoryChunks(
    tempTable,
    async (data, chunkInfo) => {
      // Process chunk data
      const processedData = data.map(row => {
        // Example: data cleaning and transformation
        return {
          ...row,
          processed_at: new Date().toISOString(),
          chunk_id: chunkInfo.chunkIndex
        };
      });
      
      // Insert processed data
      if (chunkInfo.chunkIndex === 0) {
        // Create target table from first chunk
        await createTableFromData(duckdb, targetTable, processedData[0]);
      }
      
      await insertProcessedData(duckdb, targetTable, processedData);
      
      return {
        processed_rows: processedData.length,
        chunk_id: chunkInfo.chunkIndex
      };
    }
  );
  
  // Cleanup temporary table
  await duckdb.execute(`DROP TABLE ${tempTable}`);
  
  return results;
}

async function createTableFromData(duckdb, tableName, sampleRow) {
  const columns = Object.keys(sampleRow).map(key => {
    const value = sampleRow[key];
    let type = 'VARCHAR';
    
    if (typeof value === 'number') {
      type = Number.isInteger(value) ? 'INTEGER' : 'DOUBLE';
    } else if (typeof value === 'boolean') {
      type = 'BOOLEAN';
    } else if (value && value.match && value.match(/^\d{4}-\d{2}-\d{2}/)) {
      type = 'TIMESTAMP';
    }
    
    return `"${key}" ${type}`;
  }).join(', ');
  
  await duckdb.execute(`CREATE OR REPLACE TABLE ${tableName} (${columns})`);
}
```

## Memory Efficiency Best Practices

### 1. Optimal Partition Sizing

```yaml
partition_sizing_guidelines:
  small_datasets:
    size_range: "< 1GB"
    partition_strategy: "Single partition or temporal by day"
    memory_target: "50-100MB per partition"
    
  medium_datasets:
    size_range: "1GB - 10GB"
    partition_strategy: "Temporal by week/month or hash partitioning"
    memory_target: "100-500MB per partition"
    
  large_datasets:
    size_range: "10GB - 100GB"
    partition_strategy: "Temporal by month or range partitioning"
    memory_target: "500MB - 2GB per partition"
    
  very_large_datasets:
    size_range: "> 100GB"
    partition_strategy: "Combination of temporal and hash/range"
    memory_target: "1GB - 4GB per partition"
```

### 2. Memory Management During Partitioning

```javascript
class PartitionMemoryManager {
  constructor(options = {}) {
    this.memoryThreshold = options.memoryThreshold || 0.8; // 80% of limit
    this.cleanupInterval = options.cleanupInterval || 5; // Every 5 partitions
    this.maxConcurrentPartitions = options.maxConcurrentPartitions || 3;
  }

  async processWithMemoryManagement(partitions, processor) {
    const results = [];
    
    for (let i = 0; i < partitions.length; i += this.maxConcurrentPartitions) {
      // Process batch of partitions
      const batch = partitions.slice(i, i + this.maxConcurrentPartitions);
      const batchPromises = batch.map(partition => 
        this.processPartitionWithCleanup(partition, processor)
      );
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Check memory usage and cleanup if needed
      if (i % this.cleanupInterval === 0) {
        await this.performMemoryCleanup();
      }
      
      console.log(`Completed partition batch ${Math.floor(i / this.maxConcurrentPartitions) + 1}`);
    }
    
    return results;
  }

  async processPartitionWithCleanup(partition, processor) {
    try {
      const result = await processor(partition);
      
      // Force cleanup after each partition
      if (global.gc) {
        global.gc();
      }
      
      return result;
    } catch (error) {
      console.error(`Error processing partition ${partition.id}:`, error);
      throw error;
    }
  }

  async performMemoryCleanup() {
    console.log('Performing memory cleanup...');
    
    // Multiple garbage collection passes
    if (global.gc) {
      for (let i = 0; i < 3; i++) {
        global.gc();
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    // Log memory usage
    const memUsage = process.memoryUsage();
    console.log(`Memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB heap`);
  }
}
```

## Integration with BMad-Method Patterns

### Error Handling Integration

```javascript
const chalk = require('chalk');

class BMadPartitioningService {
  constructor(duckdb, options = {}) {
    this.duckdb = duckdb;
    this.options = options;
  }

  async partitionWithBMadErrorHandling(sourceTable, strategy, options) {
    try {
      console.log(chalk.blue(`Starting partitioning: ${strategy}`));
      
      let partitioner;
      switch (strategy) {
        case 'temporal':
          partitioner = new TemporalPartitioner(this.duckdb, options);
          break;
        case 'hash':
          partitioner = new HashPartitioner(this.duckdb, options);
          break;
        case 'range':
          partitioner = new RangePartitioner(this.duckdb, options);
          break;
        default:
          throw new Error(`Unknown partitioning strategy: ${strategy}`);
      }
      
      const result = await partitioner.partition(sourceTable, options);
      
      console.log(chalk.green(`✅ Partitioning completed: ${result.partitions.length} partitions created`));
      return result;
      
    } catch (error) {
      console.error(chalk.red(`❌ Partitioning failed: ${error.message}`));
      console.error(chalk.yellow(`💡 Suggestion: ${this.getErrorSuggestion(error)}`));
      
      // BMad-style error logging
      const { securityLogger } = require('../lib/security-logger');
      securityLogger.logDuckDBOperation({
        operation: 'partitioning_error',
        strategy,
        error: error.message,
        source_table: sourceTable,
        timestamp: new Date().toISOString()
      });
      
      throw error;
    }
  }

  getErrorSuggestion(error) {
    if (error.message.includes('memory')) {
      return 'Try reducing partition size or enabling spilling to disk';
    } else if (error.message.includes('timeout')) {
      return 'Consider using smaller batches or increasing timeout limits';
    } else if (error.message.includes('table')) {
      return 'Verify table exists and column names are correct';
    }
    
    return 'Check logs for more details and verify configuration';
  }
}
```

## Next Steps

1. **Configure Resource Monitoring** - Set up resource usage tracking
2. **Establish Fallback Procedures** - Document procedures for memory exhaustion scenarios
3. **Document BMad-Method Integration** - Complete integration with existing BMad resource management

## References

- [DuckDB Partitioning Documentation](https://duckdb.org/docs/data/partitioning)
- [PyAirbyte Documentation](https://docs.airbyte.com/using-airbyte/pyairbyte/getting-started)
- [DuckDB Memory Management](./duckdb-memory-management.md)
- [Performance Benchmarks](../performance/duckdb-performance-benchmarks.md)