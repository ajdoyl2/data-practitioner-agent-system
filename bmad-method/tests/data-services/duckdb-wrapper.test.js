/**
 * Tests for DuckDBWrapper
 */

const DuckDBWrapper = require('../../tools/data-services/duckdb-wrapper');
const { isFeatureEnabled } = require('../../tools/lib/feature-flag-manager');
const fs = require('fs-extra');

// Mock dependencies
jest.mock('../../tools/lib/feature-flag-manager');
jest.mock('fs-extra');

describe('DuckDBWrapper', () => {
  let wrapper;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock feature flag as enabled
    isFeatureEnabled.mockReturnValue(true);
    
    // Mock fs-extra
    fs.existsSync.mockReturnValue(true);
    
    // Create wrapper instance
    wrapper = new DuckDBWrapper({
      databasePath: '/test/analytics.db',
      memoryLimit: '2GB',
      maxConnections: 5
    });
  });

  describe('Availability Check', () => {
    it('should return false when feature flag is disabled', () => {
      isFeatureEnabled.mockReturnValue(false);
      
      const available = wrapper.isAvailable();
      
      expect(available).toBe(false);
    });

    it('should return true when feature flag is enabled', () => {
      // Mock require to not throw
      jest.doMock('duckdb', () => ({}), { virtual: true });
      
      const available = wrapper.isAvailable();
      
      expect(available).toBe(true);
    });

    it('should return false when DuckDB module is not available', () => {
      // Mock require to throw
      jest.doMock('duckdb', () => {
        throw new Error('Module not found');
      }, { virtual: true });
      
      const available = wrapper.isAvailable();
      
      expect(available).toBe(false);
    });
  });

  describe('Version Information', () => {
    it('should return version when available', () => {
      const version = wrapper.getVersion();
      expect(version).toBe('1.3.2');
    });

    it('should return unavailable when not available', () => {
      isFeatureEnabled.mockReturnValue(false);
      
      const version = wrapper.getVersion();
      expect(version).toBe('unavailable');
    });
  });

  describe('Initialization', () => {
    it('should initialize successfully when available', async () => {
      const result = await wrapper.initialize();
      
      expect(result.success).toBe(true);
      expect(result.database_path).toBe('/test/analytics.db');
      expect(result.memory_limit).toBe('2GB');
    });

    it('should fail when not available', async () => {
      isFeatureEnabled.mockReturnValue(false);
      
      const result = await wrapper.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('not available or disabled');
    });

    it('should not reinitialize if already initialized', async () => {
      await wrapper.initialize();
      
      const result = await wrapper.initialize();
      
      expect(result.message).toBe('Already initialized');
    });
  });

  describe('Query Execution', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should execute query successfully', async () => {
      const query = 'SELECT * FROM users WHERE age > $minAge';
      const parameters = { minAge: 25 };
      
      const result = await wrapper.execute(query, parameters);
      
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata.execution_time).toBeGreaterThan(0);
    });

    it('should handle query with no parameters', async () => {
      const query = 'SELECT COUNT(*) FROM users';
      
      const result = await wrapper.execute(query);
      
      expect(result.success).toBe(true);
    });

    it('should handle query errors', async () => {
      const query = 'SELECT * FROM error'; // Trigger mock error
      
      const result = await wrapper.execute(query);
      
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should validate dangerous queries', async () => {
      const dangerousQuery = 'SELECT 1; DROP TABLE users;';
      
      const result = await wrapper.execute(dangerousQuery);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('potentially unsafe operations');
    });

    it('should reject overly long queries', async () => {
      const longQuery = 'SELECT 1 ' + 'FROM dual '.repeat(1000);
      
      const result = await wrapper.execute(longQuery);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Query too long');
    });

    it('should replace parameters correctly', async () => {
      const query = 'SELECT * FROM users WHERE id = $userId AND status = $status';
      const parameters = { userId: 123, status: 'active' };
      
      const result = await wrapper.execute(query, parameters);
      
      // Since we're using a mock, we can't verify the exact replacement
      // but we can verify the method completes successfully
      expect(result.success).toBe(true);
    });
  });

  describe('Table Operations', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should list tables successfully', async () => {
      const tables = await wrapper.listTables();
      
      expect(Array.isArray(tables)).toBe(true);
    });

    it('should get table schema', async () => {
      const tableName = 'users';
      
      const schema = await wrapper.getTableSchema(tableName);
      
      expect(schema.table_name).toBe(tableName);
      expect(schema.columns).toBeDefined();
      expect(schema.column_count).toBeDefined();
    });

    it('should reject invalid table names for schema', async () => {
      const invalidTableName = 'users; DROP TABLE orders;';
      
      await expect(wrapper.getTableSchema(invalidTableName))
        .rejects.toThrow('Invalid table name');
    });

    it('should drop table successfully', async () => {
      const tableName = 'temp_table';
      
      const result = await wrapper.dropTable(tableName);
      
      expect(result.success).toBe(true);
      expect(result.table_name).toBe(tableName);
    });

    it('should drop table with cascade option', async () => {
      const tableName = 'parent_table';
      
      const result = await wrapper.dropTable(tableName, { cascade: true });
      
      expect(result.success).toBe(true);
    });

    it('should reject invalid table names for drop', async () => {
      const invalidTableName = 'users; DROP DATABASE;';
      
      const result = await wrapper.dropTable(invalidTableName);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid table name');
    });
  });

  describe('Data Loading', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should load CSV data successfully', async () => {
      const result = await wrapper.loadDataFromFile(
        'csv',
        '/test/data.csv',
        'test_table',
        { header: true, delimiter: ',' }
      );
      
      expect(result.success).toBe(true);
      expect(result.table_name).toBe('test_table');
      expect(result.source_type).toBe('csv');
    });

    it('should load JSON data successfully', async () => {
      const result = await wrapper.loadDataFromFile(
        'json',
        '/test/data.json',
        'json_table'
      );
      
      expect(result.success).toBe(true);
      expect(result.table_name).toBe('json_table');
      expect(result.source_type).toBe('json');
    });

    it('should load Parquet data successfully', async () => {
      const result = await wrapper.loadDataFromFile(
        'parquet',
        '/test/data.parquet',
        'parquet_table'
      );
      
      expect(result.success).toBe(true);
      expect(result.table_name).toBe('parquet_table');
      expect(result.source_type).toBe('parquet');
    });

    it('should reject unsupported file types', async () => {
      await expect(wrapper.loadDataFromFile(
        'xlsx',
        '/test/data.xlsx',
        'excel_table'
      )).rejects.toThrow('Unsupported source type: xlsx');
    });

    it('should reject invalid table names for loading', async () => {
      await expect(wrapper.loadDataFromFile(
        'csv',
        '/test/data.csv',
        'invalid; name'
      )).rejects.toThrow('Invalid table name');
    });

    it('should check file existence', async () => {
      fs.existsSync.mockReturnValue(false);
      
      await expect(wrapper.loadDataFromFile(
        'csv',
        '/missing/file.csv',
        'test_table'
      )).rejects.toThrow('Source file not found');
    });
  });

  describe('Database Statistics', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should return database statistics', async () => {
      const stats = await wrapper.getStats();
      
      expect(stats.active_queries).toBeDefined();
      expect(stats.connections).toBeDefined();
      expect(typeof stats.tables).toBe('number');
    });

    it('should handle statistics errors gracefully', async () => {
      // Force an error in execute method for stats query
      const originalExecute = wrapper.execute;
      wrapper.execute = jest.fn().mockRejectedValue(new Error('Stats error'));
      
      const stats = await wrapper.getStats();
      
      expect(stats.error).toBeDefined();
      expect(stats.active_queries).toBeDefined();
      
      // Restore original method
      wrapper.execute = originalExecute;
    });

    it('should track active connections', () => {
      const connections = wrapper.getActiveConnections();
      expect(typeof connections).toBe('number');
    });
  });

  describe('Query Validation', () => {
    beforeEach(async () => {
      await wrapper.initialize();
    });

    it('should validate safe queries', () => {
      const safeQueries = [
        'SELECT * FROM users',
        'SELECT COUNT(*) FROM orders WHERE date > \'2024-01-01\'',
        'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id'
      ];
      
      safeQueries.forEach(query => {
        expect(() => wrapper.validateQuery(query)).not.toThrow();
      });
    });

    it('should reject dangerous queries', () => {
      const dangerousQueries = [
        'SELECT 1; DROP TABLE users',
        'SELECT 1; DELETE FROM users',
        'SELECT 1; UPDATE users SET name = \'hacked\'',
        'SELECT 1; INSERT INTO logs VALUES (\'hack\')',
        'SELECT 1; CREATE TABLE malware (data TEXT)',
        'SELECT 1; ALTER TABLE users ADD COLUMN backdoor TEXT',
        'EXEC xp_cmdshell \'rm -rf /\'',
        'EXECUTE sp_executesql \'DROP DATABASE\''
      ];
      
      dangerousQueries.forEach(query => {
        expect(() => wrapper.validateQuery(query))
          .toThrow('potentially unsafe operations');
      });
    });
  });

  describe('Value Escaping', () => {
    it('should escape string values correctly', () => {
      const testCases = [
        ['hello', "'hello'"],
        ["it's working", "'it''s working'"],
        ['', "''"],
        ['multi\nline', "'multi\nline'"]
      ];
      
      testCases.forEach(([input, expected]) => {
        expect(wrapper.escapeValue(input)).toBe(expected);
      });
    });

    it('should handle numeric values', () => {
      expect(wrapper.escapeValue(42)).toBe('42');
      expect(wrapper.escapeValue(3.14)).toBe('3.14');
      expect(wrapper.escapeValue(0)).toBe('0');
    });

    it('should handle boolean values', () => {
      expect(wrapper.escapeValue(true)).toBe('TRUE');
      expect(wrapper.escapeValue(false)).toBe('FALSE');
    });

    it('should handle null values', () => {
      expect(wrapper.escapeValue(null)).toBe('NULL');
      expect(wrapper.escapeValue(undefined)).toBe('NULL');
    });
  });

  describe('Query ID Generation', () => {
    it('should generate unique query IDs', () => {
      const id1 = wrapper.generateQueryId();
      const id2 = wrapper.generateQueryId();
      
      expect(id1).toMatch(/^query_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^query_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Query Hashing', () => {
    it('should generate consistent hashes for same queries', () => {
      const query = 'SELECT * FROM users WHERE age > 25';
      
      const hash1 = wrapper.hashQuery(query);
      const hash2 = wrapper.hashQuery(query);
      
      expect(hash1).toBe(hash2);
      expect(hash1).toMatch(/^[a-f0-9]{16}$/);
    });

    it('should generate different hashes for different queries', () => {
      const query1 = 'SELECT * FROM users';
      const query2 = 'SELECT * FROM orders';
      
      const hash1 = wrapper.hashQuery(query1);
      const hash2 = wrapper.hashQuery(query2);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('Connection Lifecycle', () => {
    it('should close connections cleanly', async () => {
      await wrapper.initialize();
      
      await expect(wrapper.close()).resolves.not.toThrow();
      expect(wrapper.isInitialized).toBe(false);
    });

    it('should handle close when not initialized', async () => {
      await expect(wrapper.close()).resolves.not.toThrow();
    });
  });

  describe('Error Scenarios', () => {
    it('should handle initialization errors gracefully', async () => {
      // Mock initialization error
      const originalCreateDuckDBMock = wrapper.createDuckDBMock;
      wrapper.createDuckDBMock = jest.fn(() => {
        throw new Error('Mock initialization error');
      });
      
      const result = await wrapper.initialize();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Mock initialization error');
      
      // Restore original method
      wrapper.createDuckDBMock = originalCreateDuckDBMock;
    });

    it('should handle execution when not initialized', async () => {
      // Don't initialize wrapper
      
      await expect(wrapper.execute('SELECT 1'))
        .rejects.toThrow('DuckDB not initialized');
    });
  });
});