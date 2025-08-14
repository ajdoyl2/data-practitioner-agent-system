/**
 * Mock Python Scripts Integration Test Suite
 * Tests the mock Python scripts used for data processing simulation
 */

const path = require('path');
const fs = require('fs-extra');
const PythonSubprocessManager = require('../../tools/lib/python-subprocess');

describe('Mock Python Scripts Integration', () => {
  let pythonManager;
  let scriptsDir;

  beforeAll(async () => {
    pythonManager = new PythonSubprocessManager({
      timeout: 15000 // 15 seconds for tests
    });
    scriptsDir = path.join(__dirname, '../fixtures/mock-python-scripts');
    
    // Verify mock scripts exist
    expect(await fs.pathExists(path.join(scriptsDir, 'data-processor.py'))).toBe(true);
    expect(await fs.pathExists(path.join(scriptsDir, 'pyairbyte-mock.py'))).toBe(true);
  });

  describe('Data Processor Mock Script', () => {
    const dataProcessorScript = path.join(__dirname, '../fixtures/mock-python-scripts/data-processor.py');

    test('should perform data transformation operation', async () => {
      const inputData = {
        records: [
          { id: 1, name: 'Record 1', value: 100 },
          { id: 2, name: 'Record 2', value: 200 },
          { id: 3, name: 'Record 3', value: 150 }
        ]
      };

      const result = await pythonManager.execute(dataProcessorScript, ['--operation', 'transform'], {
        parseJson: true,
        input: inputData
      });

      expect(result.success).toBe(true);
      expect(result.data.original_data).toEqual(inputData);
      expect(result.data.transformed.record_count).toBe(3);
      expect(result.data.transformed.operation).toBe('transform');
      expect(result.data.transformed.timestamp).toBeGreaterThan(0);
    });

    test('should perform data validation operation', async () => {
      const inputData = {
        records: [
          { id: 1, name: 'Valid Record', category: 'test' }
        ]
      };

      const result = await pythonManager.execute(dataProcessorScript, ['--operation', 'validate'], {
        parseJson: true,
        input: inputData
      });

      expect(result.success).toBe(true);
      expect(result.data.valid).toBe(true);
      expect(result.data.validation_results.schema_valid).toBe(true);
      expect(result.data.validation_results.data_quality_score).toBe(0.95);
      expect(Array.isArray(result.data.validation_results.missing_fields)).toBe(true);
    });

    test('should perform data aggregation operation', async () => {
      const inputData = {
        records: [
          { id: 1, value: 100, category: 'A' },
          { id: 2, value: 200, category: 'B' },
          { id: 3, value: 150, category: 'A' },
          { id: 4, value: 300, category: 'C' }
        ]
      };

      const result = await pythonManager.execute(dataProcessorScript, ['--operation', 'aggregate'], {
        parseJson: true,
        input: inputData
      });

      expect(result.success).toBe(true);
      expect(result.data.aggregation.total_records).toBe(4);
      expect(result.data.aggregation.numeric_sum).toBe(750);
      expect(result.data.aggregation.categories).toEqual(expect.arrayContaining(['A', 'B', 'C']));
    });

    test('should handle simulated runtime errors', async () => {
      await expect(
        pythonManager.execute(dataProcessorScript, ['--error', 'runtime'])
      ).rejects.toThrow();
    });

    test('should handle simulated value errors', async () => {
      await expect(
        pythonManager.execute(dataProcessorScript, ['--error', 'value'])
      ).rejects.toThrow();
    });

    test('should handle processing delays', async () => {
      const startTime = Date.now();
      
      const result = await pythonManager.execute(dataProcessorScript, ['--delay', '0.5'], {
        parseJson: true,
        input: { records: [] }
      });

      const duration = Date.now() - startTime;
      
      expect(result.success).toBe(true);
      expect(duration).toBeGreaterThan(500); // Should be at least 500ms due to delay
    });

    test('should handle memory test operation', async () => {
      const result = await pythonManager.execute(dataProcessorScript, ['--error', 'memory'], {
        parseJson: true
      });

      expect(result.success).toBe(true);
      expect(result.data.memory_test).toBe(10000);
    });
  });

  describe('PyAirbyte Mock Script', () => {
    const pyairbyteScript = path.join(__dirname, '../fixtures/mock-python-scripts/pyairbyte-mock.py');

    test('should simulate database connection', async () => {
      const config = {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user'
      };

      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'connect'
      ], {
        parseJson: true,
        input: config
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('connected');
      expect(result.data.source_type).toBe('database');
      expect(result.data.connection_id).toMatch(/database_conn_\d+/);
    });

    test('should list available streams for database source', async () => {
      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'list_streams'
      ], {
        parseJson: true,
        input: {}
      });

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(3);
      expect(result.data.streams).toHaveLength(3);
      
      const streamNames = result.data.streams.map(s => s.name);
      expect(streamNames).toEqual(expect.arrayContaining(['users', 'orders', 'products']));
    });

    test('should read data from users stream', async () => {
      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'read_stream',
        '--stream-name', 'users',
        '--limit', '10'
      ], {
        parseJson: true,
        input: {}
      });

      expect(result.success).toBe(true);
      expect(result.data.stream_name).toBe('users');
      expect(result.data.record_count).toBe(10);
      expect(result.data.data).toHaveLength(10);
      
      // Verify user record structure
      const firstUser = result.data.data[0];
      expect(firstUser).toHaveProperty('id');
      expect(firstUser).toHaveProperty('name');
      expect(firstUser).toHaveProperty('email');
      expect(firstUser).toHaveProperty('created_at');
    });

    test('should read data from orders stream', async () => {
      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'read_stream',
        '--stream-name', 'orders',
        '--limit', '5'
      ], {
        parseJson: true,
        input: {}
      });

      expect(result.success).toBe(true);
      expect(result.data.stream_name).toBe('orders');
      expect(result.data.record_count).toBe(5);
      
      // Verify order record structure
      const firstOrder = result.data.data[0];
      expect(firstOrder).toHaveProperty('id');
      expect(firstOrder).toHaveProperty('user_id');
      expect(firstOrder).toHaveProperty('amount');
      expect(firstOrder).toHaveProperty('status');
    });

    test('should handle API source type', async () => {
      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'api',
        '--operation', 'list_streams'
      ], {
        parseJson: true,
        input: { api_key: 'test_key' }
      });

      expect(result.success).toBe(true);
      expect(result.data.count).toBe(2);
      
      const streamNames = result.data.streams.map(s => s.name);
      expect(streamNames).toEqual(expect.arrayContaining(['customers', 'transactions']));
    });

    test('should handle file source type', async () => {
      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'file',
        '--operation', 'read_stream',
        '--stream-name', 'data',
        '--limit', '15'
      ], {
        parseJson: true,
        input: { file_path: '/path/to/data.csv' }
      });

      expect(result.success).toBe(true);
      expect(result.data.record_count).toBe(15);
      
      // Verify generic data record structure
      const firstRecord = result.data.data[0];
      expect(firstRecord).toHaveProperty('id');
      expect(firstRecord).toHaveProperty('value');
      expect(firstRecord).toHaveProperty('category');
      expect(firstRecord).toHaveProperty('timestamp');
    });

    test('should provide cache information', async () => {
      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'cache_info'
      ], {
        parseJson: true,
        input: {}
      });

      expect(result.success).toBe(true);
      expect(result.data.cache_enabled).toBe(true);
      expect(typeof result.data.cache_size_mb).toBe('number');
      expect(Array.isArray(result.data.cached_streams)).toBe(true);
      expect(typeof result.data.last_updated).toBe('number');
    });

    test('should handle cache clearing', async () => {
      const result = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'clear_cache'
      ], {
        parseJson: true,
        input: {}
      });

      expect(result.success).toBe(true);
      expect(result.data.status).toBe('cache_cleared');
      expect(typeof result.data.timestamp).toBe('number');
    });

    test('should simulate connection errors', async () => {
      await expect(
        pythonManager.execute(pyairbyteScript, [
          '--source-type', 'database',
          '--operation', 'connect',
          '--error', 'connection'
        ])
      ).rejects.toThrow();
    });

    test('should simulate permission errors', async () => {
      await expect(
        pythonManager.execute(pyairbyteScript, [
          '--source-type', 'api',
          '--operation', 'connect',
          '--error', 'permission'
        ])
      ).rejects.toThrow();
    });

    test('should require stream name for read operations', async () => {
      await expect(
        pythonManager.execute(pyairbyteScript, [
          '--source-type', 'database',
          '--operation', 'read_stream'
          // Missing --stream-name
        ], { timeout: 8000 })
      ).rejects.toThrow();
    }, 10000);
  });

  describe('Cross-Script Integration', () => {
    test('should chain data from PyAirbyte mock to data processor', async () => {
      const pyairbyteScript = path.join(__dirname, '../fixtures/mock-python-scripts/pyairbyte-mock.py');
      const dataProcessorScript = path.join(__dirname, '../fixtures/mock-python-scripts/data-processor.py');

      // First, get data from PyAirbyte mock
      const sourceResult = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'read_stream',
        '--stream-name', 'orders',
        '--limit', '5'
      ], {
        parseJson: true,
        input: {}
      });

      expect(sourceResult.success).toBe(true);

      // Then, process the data with data processor
      const processedResult = await pythonManager.execute(dataProcessorScript, [
        '--operation', 'aggregate'
      ], {
        parseJson: true,
        input: { records: sourceResult.data.data }
      });

      expect(processedResult.success).toBe(true);
      expect(processedResult.data.aggregation.total_records).toBe(5);
      expect(processedResult.data.aggregation.numeric_sum).toBeGreaterThan(0);
    });

    test('should handle data transformation pipeline', async () => {
      const pyairbyteScript = path.join(__dirname, '../fixtures/mock-python-scripts/pyairbyte-mock.py');
      const dataProcessorScript = path.join(__dirname, '../fixtures/mock-python-scripts/data-processor.py');

      // Get users data
      const usersResult = await pythonManager.execute(pyairbyteScript, [
        '--source-type', 'database',
        '--operation', 'read_stream',
        '--stream-name', 'users',
        '--limit', '3'
      ], {
        parseJson: true,
        input: {}
      });

      // Transform the data
      const transformResult = await pythonManager.execute(dataProcessorScript, [
        '--operation', 'transform'
      ], {
        parseJson: true,
        input: { records: usersResult.data.data }
      });

      // Validate the transformed data
      const validateResult = await pythonManager.execute(dataProcessorScript, [
        '--operation', 'validate'
      ], {
        parseJson: true,
        input: transformResult.data
      });

      expect(usersResult.success).toBe(true);
      expect(transformResult.success).toBe(true);
      expect(validateResult.success).toBe(true);
      expect(validateResult.data.valid).toBe(true);
    });
  });
});