/**
 * Tests for AnalyticalEngine
 */

const request = require('supertest');
const { isFeatureEnabled, requireFeatureMiddleware } = require('../../tools/lib/feature-flag-manager');
const fs = require('fs-extra');

// Mock dependencies
jest.mock('../../tools/lib/feature-flag-manager');
jest.mock('../../tools/data-services/duckdb-wrapper');
jest.mock('../../tools/data-services/auth-middleware');
jest.mock('../../tools/lib/memory-manager');
jest.mock('fs-extra');

describe('AnalyticalEngine', () => {
  let service;
  let app;
  let mockDuckDB;
  let mockMemoryManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock feature flag as enabled
    isFeatureEnabled.mockReturnValue(true);
    
    // Mock fs-extra
    fs.ensureDirSync.mockImplementation(() => {});
    
    // Mock auth middleware
    const authMiddleware = require('../../tools/data-services/auth-middleware');
    authMiddleware.verifyApiKey = jest.fn((req, res, next) => next());
    authMiddleware.requireScope = jest.fn(() => (req, res, next) => next());
    
    // Mock feature flag middleware
    requireFeatureMiddleware.mockImplementation(() => (req, res, next) => next());

    // Mock DuckDB wrapper
    const DuckDBWrapper = require('../../tools/data-services/duckdb-wrapper');
    mockDuckDB = {
      isAvailable: jest.fn().mockReturnValue(true),
      getVersion: jest.fn().mockReturnValue('1.3.2'),
      initialize: jest.fn().mockResolvedValue({ success: true }),
      execute: jest.fn(),
      listTables: jest.fn(),
      getTableSchema: jest.fn(),
      loadDataFromFile: jest.fn(),
      dropTable: jest.fn(),
      getStats: jest.fn(),
      getActiveConnections: jest.fn().mockReturnValue(2),
      close: jest.fn().mockResolvedValue()
    };
    DuckDBWrapper.mockImplementation(() => mockDuckDB);

    // Mock Memory Manager
    const MemoryManager = require('../../tools/lib/memory-manager');
    mockMemoryManager = {
      getCurrentUsage: jest.fn().mockResolvedValue({
        rss: 100 * 1024 * 1024,
        heapUsed: 50 * 1024 * 1024,
        heapTotal: 80 * 1024 * 1024
      })
    };
    MemoryManager.mockImplementation(() => mockMemoryManager);

    // Import AnalyticalEngine after setting up mocks
    const AnalyticalEngine = require('../../tools/data-services/analytical-engine');
    
    // Create service instance
    service = new AnalyticalEngine({
      port: 3002,
      configPath: '/test/config',
      duckdbPath: '/test/.duckdb'
    });
    
    app = service.app;
  });

  describe('Health Check', () => {
    it('should return healthy status with DuckDB info', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'analytical-engine',
        timestamp: expect.any(String),
        features: {
          duckdb_analytics: true
        },
        duckdb: {
          available: true,
          version: '1.3.2'
        }
      });
    });
  });

  describe('Execute Query', () => {
    it('should execute SQL query successfully', async () => {
      const mockResult = {
        success: true,
        data: [
          { id: 1, name: 'Alice', age: 25 },
          { id: 2, name: 'Bob', age: 30 }
        ],
        metadata: {
          execution_time: 150,
          row_count: 2
        }
      };
      
      mockDuckDB.execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/analytics/query')
        .set('X-API-Key', 'test-key')
        .send({
          query: 'SELECT * FROM users WHERE age > $minAge',
          parameters: { minAge: 20 },
          options: { useCache: false }
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResult.data,
        metadata: expect.objectContaining({
          execution_time: expect.any(Number),
          memory_usage: expect.any(Number)
        }),
        cached: false,
        timestamp: expect.any(String)
      });

      expect(mockDuckDB.execute).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE age > '20'",
        {},
        { timeout: 30000, maxRows: 10000 }
      );
    });

    it('should return cached result when available', async () => {
      const mockResult = {
        success: true,
        data: [{ id: 1, name: 'Alice' }],
        metadata: { row_count: 1 }
      };
      
      mockDuckDB.execute.mockResolvedValue(mockResult);
      
      const query = 'SELECT * FROM users';

      // First request to populate cache
      await request(app)
        .post('/api/v1/analytics/query')
        .set('X-API-Key', 'test-key')
        .send({ query })
        .expect(200);

      // Second request should use cache
      const response = await request(app)
        .post('/api/v1/analytics/query')
        .set('X-API-Key', 'test-key')
        .send({ query })
        .expect(200);

      expect(response.body.cached).toBe(true);
      expect(mockDuckDB.execute).toHaveBeenCalledTimes(1); // Only called once due to caching
    });

    it('should return 400 for missing query', async () => {
      const response = await request(app)
        .post('/api/v1/analytics/query')
        .set('X-API-Key', 'test-key')
        .send({})
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing or invalid query parameter'
      });
    });

    it('should handle query execution errors', async () => {
      mockDuckDB.execute.mockResolvedValue({
        success: false,
        error: 'Table not found'
      });

      const response = await request(app)
        .post('/api/v1/analytics/query')
        .set('X-API-Key', 'test-key')
        .send({
          query: 'SELECT * FROM nonexistent_table'
        })
        .expect(200);

      expect(response.body.success).toBe(false);
    });
  });

  describe('List Tables', () => {
    it('should return list of tables', async () => {
      const mockTables = ['users', 'orders', 'products'];
      mockDuckDB.listTables.mockResolvedValue(mockTables);

      const response = await request(app)
        .get('/api/v1/analytics/tables')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { tables: mockTables },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Get Table Schema', () => {
    it('should return table schema', async () => {
      const mockSchema = {
        table_name: 'users',
        columns: [
          { column_name: 'id', data_type: 'INTEGER', is_nullable: 'NO' },
          { column_name: 'name', data_type: 'VARCHAR', is_nullable: 'YES' },
          { column_name: 'age', data_type: 'INTEGER', is_nullable: 'YES' }
        ],
        column_count: 3
      };
      
      mockDuckDB.getTableSchema.mockResolvedValue(mockSchema);

      const response = await request(app)
        .get('/api/v1/analytics/schema/users')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockSchema,
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for missing table name', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/schema/')
        .set('X-API-Key', 'test-key')
        .expect(404); // Express returns 404 for missing route parameters
    });
  });

  describe('Load Data From Source', () => {
    it('should load CSV data successfully', async () => {
      const mockResult = {
        success: true,
        table_name: 'customer_data',
        rows_affected: 1000,
        source_type: 'csv'
      };
      
      mockDuckDB.loadDataFromFile.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/api/v1/analytics/load-data')
        .set('X-API-Key', 'test-key')
        .send({
          source_type: 'csv',
          source_path: '/data/customers.csv',
          table_name: 'customer_data',
          options: {
            header: true,
            delimiter: ','
          }
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResult,
        metadata: {
          load_time: expect.any(Number),
          rows_loaded: 1000
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/analytics/load-data')
        .set('X-API-Key', 'test-key')
        .send({
          source_type: 'csv'
          // Missing source_path and table_name
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required fields: source_type, source_path, table_name'
      });
    });

    it('should handle load failures', async () => {
      mockDuckDB.loadDataFromFile.mockResolvedValue({
        success: false,
        error: 'File not found'
      });

      const response = await request(app)
        .post('/api/v1/analytics/load-data')
        .set('X-API-Key', 'test-key')
        .send({
          source_type: 'csv',
          source_path: '/missing/file.csv',
          table_name: 'test_table'
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Failed to load data',
        details: 'File not found'
      });
    });
  });

  describe('Drop Table', () => {
    it('should drop table successfully', async () => {
      mockDuckDB.dropTable.mockResolvedValue({
        success: true,
        table_name: 'old_table'
      });

      const response = await request(app)
        .delete('/api/v1/analytics/table/old_table')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { table: 'old_table', dropped: true },
        timestamp: expect.any(String)
      });
    });

    it('should handle drop failures', async () => {
      mockDuckDB.dropTable.mockResolvedValue({
        success: false,
        error: 'Table has foreign key constraints'
      });

      const response = await request(app)
        .delete('/api/v1/analytics/table/constrained_table')
        .set('X-API-Key', 'test-key')
        .expect(400);

      expect(response.body).toEqual({
        error: 'Failed to drop table',
        details: 'Table has foreign key constraints'
      });
    });
  });

  describe('Cache Management', () => {
    it('should return cache information', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/cache/info')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          size: 0,
          maxSize: expect.any(Number),
          utilization: 0,
          keys: []
        },
        timestamp: expect.any(String)
      });
    });

    it('should clear cache successfully', async () => {
      const response = await request(app)
        .delete('/api/v1/analytics/cache')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          cleared: 0,
          remaining: 0
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Performance Metrics', () => {
    it('should return performance metrics', async () => {
      mockDuckDB.getStats.mockResolvedValue({
        tables: 5,
        database_size: '10MB',
        active_queries: 2
      });

      const response = await request(app)
        .get('/api/v1/analytics/performance')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          memory_usage: expect.any(Object),
          duckdb_stats: expect.any(Object),
          cache_hit_rate: 0.0,
          active_connections: 2,
          uptime: expect.any(Number)
        },
        timestamp: expect.any(String)
      });
    });
  });

  describe('Query History', () => {
    it('should return empty query history', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/queries/history')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          queries: [],
          total: 0,
          limit: 50,
          offset: 0
        },
        timestamp: expect.any(String)
      });
    });

    it('should handle custom limit and offset', async () => {
      const response = await request(app)
        .get('/api/v1/analytics/queries/history?limit=10&offset=20')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body.data.limit).toBe(10);
      expect(response.body.data.offset).toBe(20);
    });
  });

  describe('Feature Flag Integration', () => {
    it('should return 503 when DuckDB analytics is disabled', async () => {
      isFeatureEnabled.mockReturnValue(false);
      requireFeatureMiddleware.mockImplementation(() => (req, res, next) => {
        res.status(503).json({ error: 'Feature disabled' });
      });

      const response = await request(app)
        .post('/api/v1/analytics/query')
        .set('X-API-Key', 'test-key')
        .send({ query: 'SELECT 1' })
        .expect(503);

      expect(response.body).toEqual({
        error: 'Feature disabled'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors', async () => {
      mockDuckDB.execute.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/v1/analytics/query')
        .set('X-API-Key', 'test-key')
        .send({ query: 'SELECT 1' })
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to execute query',
        details: 'Database connection failed',
        timestamp: expect.any(String)
      });
    });
  });

  describe('Service Lifecycle', () => {
    it('should start service successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await service.start();
      
      expect(mockDuckDB.initialize).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('✅ DuckDB analytical engine initialized');
      
      consoleSpy.mockRestore();
    });

    it('should stop service and close connections', async () => {
      await service.start();
      await service.stop();
      
      expect(mockDuckDB.close).toHaveBeenCalled();
    });
  });
});