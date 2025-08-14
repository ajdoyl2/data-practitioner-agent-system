/**
 * DuckDB In-Memory Testing Utilities
 * Provides utilities for testing DuckDB operations without persistent storage
 */

const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

class DuckDBTestUtils {
  constructor(options = {}) {
    this.testId = options.testId || crypto.randomBytes(4).toString('hex');
    this.inMemory = options.inMemory !== false; // Default to in-memory
    this.cleanup = options.cleanup !== false; // Default to cleanup
    this.tempFiles = [];
    this.connections = [];
  }

  /**
   * Create an in-memory DuckDB instance for testing
   */
  async createInMemoryDB() {
    // Mock DuckDB connection for testing
    const mockConnection = {
      id: this.testId,
      type: 'memory',
      isOpen: true,
      
      async query(sql) {
        // Simulate query execution
        return {
          success: true,
          sql: sql.trim(),
          rows: this._generateMockResults(sql),
          rowCount: this._getMockRowCount(sql),
          executionTime: Math.floor(Math.random() * 50) + 10 // 10-60ms
        };
      },

      async execute(sql) {
        // Simulate DDL execution
        return {
          success: true,
          sql: sql.trim(),
          message: 'Query executed successfully',
          executionTime: Math.floor(Math.random() * 30) + 5 // 5-35ms
        };
      },

      async close() {
        this.isOpen = false;
        return { success: true, message: 'Connection closed' };
      }
    };

    this.connections.push(mockConnection);
    return mockConnection;
  }

  /**
   * Create test database with sample tables
   */
  async createTestDatabase(connection) {
    const tables = [
      {
        name: 'users',
        schema: `
          CREATE TABLE users (
            id INTEGER PRIMARY KEY,
            name VARCHAR(100),
            email VARCHAR(150),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
        data: [
          { id: 1, name: 'Alice Johnson', email: 'alice@example.com', created_at: '2023-01-15 10:30:00' },
          { id: 2, name: 'Bob Smith', email: 'bob@example.com', created_at: '2023-02-20 14:15:00' },
          { id: 3, name: 'Carol Davis', email: 'carol@example.com', created_at: '2023-03-10 09:45:00' }
        ]
      },
      {
        name: 'orders',
        schema: `
          CREATE TABLE orders (
            id INTEGER PRIMARY KEY,
            user_id INTEGER,
            amount DECIMAL(10,2),
            status VARCHAR(50),
            order_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
          )
        `,
        data: [
          { id: 101, user_id: 1, amount: 299.99, status: 'completed', order_date: '2023-03-01 11:30:00' },
          { id: 102, user_id: 2, amount: 149.50, status: 'pending', order_date: '2023-03-05 16:20:00' },
          { id: 103, user_id: 1, amount: 89.99, status: 'completed', order_date: '2023-03-12 13:45:00' }
        ]
      },
      {
        name: 'products',
        schema: `
          CREATE TABLE products (
            id INTEGER PRIMARY KEY,
            name VARCHAR(200),
            price DECIMAL(10,2),
            category VARCHAR(100),
            in_stock BOOLEAN DEFAULT true
          )
        `,
        data: [
          { id: 201, name: 'Laptop Pro', price: 1299.99, category: 'Electronics', in_stock: true },
          { id: 202, name: 'Wireless Mouse', price: 29.99, category: 'Electronics', in_stock: true },
          { id: 203, name: 'Office Chair', price: 249.99, category: 'Furniture', in_stock: false }
        ]
      }
    ];

    const results = [];

    for (const table of tables) {
      // Create table
      const createResult = await connection.execute(table.schema);
      results.push({ operation: 'CREATE', table: table.name, result: createResult });

      // Insert test data
      for (const row of table.data) {
        const columns = Object.keys(row).join(', ');
        const values = Object.values(row).map(v => 
          typeof v === 'string' ? `'${v}'` : v
        ).join(', ');
        
        const insertSql = `INSERT INTO ${table.name} (${columns}) VALUES (${values})`;
        const insertResult = await connection.execute(insertSql);
        results.push({ operation: 'INSERT', table: table.name, result: insertResult });
      }
    }

    return results;
  }

  /**
   * Generate mock CSV file for testing data ingestion
   */
  async createTestCSV(filename, data = null) {
    const testData = data || [
      { id: 1, name: 'Test User 1', value: 100.50, category: 'A', active: true },
      { id: 2, name: 'Test User 2', value: 200.75, category: 'B', active: false },
      { id: 3, name: 'Test User 3', value: 150.25, category: 'A', active: true },
      { id: 4, name: 'Test User 4', value: 300.00, category: 'C', active: true }
    ];

    const csvPath = path.join(__dirname, '../fixtures', `${filename}.csv`);
    
    // Ensure fixtures directory exists
    await fs.ensureDir(path.dirname(csvPath));

    // Generate CSV content
    const headers = Object.keys(testData[0]);
    const csvContent = [
      headers.join(','),
      ...testData.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
        }).join(',')
      )
    ].join('\n');

    await fs.writeFile(csvPath, csvContent, 'utf8');
    this.tempFiles.push(csvPath);

    return csvPath;
  }

  /**
   * Create test JSON file for data ingestion
   */
  async createTestJSON(filename, data = null) {
    const testData = data || {
      metadata: {
        source: 'test_system',
        generated_at: new Date().toISOString(),
        version: '1.0'
      },
      records: [
        { id: 'rec_001', type: 'transaction', amount: 150.00, timestamp: '2023-03-15T10:30:00Z' },
        { id: 'rec_002', type: 'transaction', amount: 75.50, timestamp: '2023-03-15T11:45:00Z' },
        { id: 'rec_003', type: 'refund', amount: -25.00, timestamp: '2023-03-15T14:20:00Z' }
      ]
    };

    const jsonPath = path.join(__dirname, '../fixtures', `${filename}.json`);
    
    // Ensure fixtures directory exists
    await fs.ensureDir(path.dirname(jsonPath));

    await fs.writeJson(jsonPath, testData, { spaces: 2 });
    this.tempFiles.push(jsonPath);

    return jsonPath;
  }

  /**
   * Test data validation utilities
   */
  async validateTableStructure(connection, tableName, expectedColumns) {
    const result = await connection.query(`DESCRIBE ${tableName}`);
    
    if (!result.success) {
      throw new Error(`Failed to describe table ${tableName}: ${result.error}`);
    }

    const actualColumns = result.rows.map(row => ({
      name: row.column_name || row.Field,
      type: row.column_type || row.Type
    }));

    const validation = {
      table: tableName,
      expected: expectedColumns,
      actual: actualColumns,
      valid: true,
      missing: [],
      extra: []
    };

    // Check for missing columns
    for (const expected of expectedColumns) {
      const found = actualColumns.find(col => col.name === expected.name);
      if (!found) {
        validation.missing.push(expected);
        validation.valid = false;
      }
    }

    // Check for extra columns
    for (const actual of actualColumns) {
      const found = expectedColumns.find(col => col.name === actual.name);
      if (!found) {
        validation.extra.push(actual);
      }
    }

    return validation;
  }

  /**
   * Test data quality checks
   */
  async runDataQualityChecks(connection, tableName) {
    const checks = {
      table: tableName,
      timestamp: new Date().toISOString(),
      results: {}
    };

    try {
      // Row count check
      const countResult = await connection.query(`SELECT COUNT(*) as total FROM ${tableName}`);
      checks.results.row_count = {
        success: countResult.success,
        count: countResult.success ? countResult.rows[0].total : 0
      };

      // Null value checks
      const columnsResult = await connection.query(`DESCRIBE ${tableName}`);
      if (columnsResult.success) {
        for (const column of columnsResult.rows.slice(0, 5)) { // Check first 5 columns
          const columnName = column.column_name || column.Field;
          const nullCheckResult = await connection.query(
            `SELECT COUNT(*) as null_count FROM ${tableName} WHERE ${columnName} IS NULL`
          );
          
          checks.results[`${columnName}_nulls`] = {
            success: nullCheckResult.success,
            null_count: nullCheckResult.success ? nullCheckResult.rows[0].null_count : 0
          };
        }
      }

      // Data freshness check (if has timestamp column)
      const timestampColumns = ['created_at', 'updated_at', 'timestamp', 'date'];
      for (const tsCol of timestampColumns) {
        try {
          const freshnessResult = await connection.query(
            `SELECT MAX(${tsCol}) as latest FROM ${tableName}`
          );
          if (freshnessResult.success) {
            checks.results.data_freshness = {
              success: true,
              latest_timestamp: freshnessResult.rows[0].latest,
              column: tsCol
            };
            break;
          }
        } catch (e) {
          // Column doesn't exist, continue
        }
      }

    } catch (error) {
      checks.error = error.message;
    }

    return checks;
  }

  /**
   * Performance testing utilities
   */
  async benchmarkQuery(connection, sql, iterations = 5) {
    const results = [];
    
    for (let i = 0; i < iterations; i++) {
      const startTime = process.hrtime.bigint();
      const queryResult = await connection.query(sql);
      const endTime = process.hrtime.bigint();
      
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      results.push({
        iteration: i + 1,
        success: queryResult.success,
        execution_time_ms: executionTime,
        row_count: queryResult.success ? queryResult.rowCount : 0
      });
    }

    const successfulRuns = results.filter(r => r.success);
    const avgTime = successfulRuns.reduce((sum, r) => sum + r.execution_time_ms, 0) / successfulRuns.length;
    const minTime = Math.min(...successfulRuns.map(r => r.execution_time_ms));
    const maxTime = Math.max(...successfulRuns.map(r => r.execution_time_ms));

    return {
      sql: sql.trim(),
      iterations: iterations,
      successful_runs: successfulRuns.length,
      avg_execution_time_ms: avgTime,
      min_execution_time_ms: minTime,
      max_execution_time_ms: maxTime,
      results: results
    };
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    if (!this.cleanup) return;

    // Close all connections
    for (const connection of this.connections) {
      if (connection.isOpen) {
        await connection.close();
      }
    }

    // Remove temporary files
    for (const file of this.tempFiles) {
      try {
        await fs.remove(file);
      } catch (error) {
        console.warn(`Failed to remove temp file ${file}:`, error.message);
      }
    }

    this.connections = [];
    this.tempFiles = [];
  }

  /**
   * Private helper methods
   */
  _generateMockResults(sql) {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('select') && lowerSql.includes('users')) {
      return [
        { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
        { id: 2, name: 'Bob Smith', email: 'bob@example.com' }
      ];
    }
    
    if (lowerSql.includes('select') && lowerSql.includes('orders')) {
      return [
        { id: 101, user_id: 1, amount: 299.99, status: 'completed' },
        { id: 102, user_id: 2, amount: 149.50, status: 'pending' }
      ];
    }
    
    if (lowerSql.includes('count(*)')) {
      return [{ count: 42, total: 42 }];
    }
    
    if (lowerSql.includes('describe') || lowerSql.includes('show columns')) {
      return [
        { column_name: 'id', column_type: 'INTEGER', Field: 'id', Type: 'INTEGER' },
        { column_name: 'name', column_type: 'VARCHAR(100)', Field: 'name', Type: 'VARCHAR(100)' }
      ];
    }

    return [];
  }

  _getMockRowCount(sql) {
    const lowerSql = sql.toLowerCase();
    
    if (lowerSql.includes('count(*)')) {
      return 1;
    }
    
    if (lowerSql.includes('select')) {
      return 2; // Default row count for SELECT queries
    }
    
    return 0;
  }
}

module.exports = DuckDBTestUtils;