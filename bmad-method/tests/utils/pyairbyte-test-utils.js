/**
 * PyAirbyte Testing Utilities
 * Provides utilities for testing PyAirbyte operations and mock connectors
 */

const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');
const PythonSubprocessManager = require('../../tools/lib/python-subprocess');

class PyAirbyteTestUtils {
  constructor(options = {}) {
    this.testId = options.testId || crypto.randomBytes(4).toString('hex');
    this.mockScriptPath = options.mockScriptPath || path.join(__dirname, '../fixtures/mock-python-scripts/pyairbyte-mock.py');
    this.pythonManager = new PythonSubprocessManager({
      timeout: options.timeout || 30000
    });
    this.tempFiles = [];
    this.connectors = [];
  }

  /**
   * Create a mock PyAirbyte connector for testing
   */
  async createMockConnector(sourceType = 'database', config = {}) {
    const connectorId = `test_${sourceType}_${this.testId}`;
    
    const connector = {
      id: connectorId,
      sourceType: sourceType,
      config: config,
      connected: false,
      
      async connect() {
        const result = await this._executeMockScript(['--source-type', sourceType, '--operation', 'connect'], config);
        this.connected = result.success;
        return result;
      },

      async listStreams() {
        if (!this.connected) {
          throw new Error('Connector not connected. Call connect() first.');
        }
        return this._executeMockScript(['--source-type', sourceType, '--operation', 'list_streams'], {});
      },

      async readStream(streamName, limit = null) {
        if (!this.connected) {
          throw new Error('Connector not connected. Call connect() first.');
        }
        
        const args = ['--source-type', sourceType, '--operation', 'read_stream', '--stream-name', streamName];
        if (limit) {
          args.push('--limit', limit.toString());
        }
        
        return this._executeMockScript(args, {});
      },

      async getCacheInfo() {
        if (!this.connected) {
          throw new Error('Connector not connected. Call connect() first.');
        }
        return this._executeMockScript(['--source-type', sourceType, '--operation', 'cache_info'], {});
      },

      async clearCache() {
        if (!this.connected) {
          throw new Error('Connector not connected. Call connect() first.');
        }
        return this._executeMockScript(['--source-type', sourceType, '--operation', 'clear_cache'], {});
      },

      async disconnect() {
        this.connected = false;
        return { success: true, message: 'Disconnected successfully' };
      }
    };

    // Bind the context for private methods
    connector._executeMockScript = this._executeMockScript.bind(this);
    
    this.connectors.push(connector);
    return connector;
  }

  /**
   * Test connection to various source types
   */
  async testConnectionTypes() {
    const sourceTypes = ['database', 'api', 'file'];
    const results = {};

    for (const sourceType of sourceTypes) {
      try {
        const connector = await this.createMockConnector(sourceType);
        const connectResult = await connector.connect();
        
        results[sourceType] = {
          success: connectResult.success,
          connection_id: connectResult.data?.connection_id,
          error: connectResult.error
        };

        if (connectResult.success) {
          // Test stream listing
          const streamsResult = await connector.listStreams();
          results[sourceType].streams = streamsResult.data?.streams || [];
          results[sourceType].stream_count = results[sourceType].streams.length;
        }

        await connector.disconnect();
      } catch (error) {
        results[sourceType] = {
          success: false,
          error: error.message
        };
      }
    }

    return results;
  }

  /**
   * Test data extraction from multiple streams
   */
  async testDataExtraction(sourceType = 'database', streams = null) {
    const connector = await this.createMockConnector(sourceType);
    await connector.connect();

    const results = {
      sourceType: sourceType,
      timestamp: new Date().toISOString(),
      streams: {},
      summary: {}
    };

    try {
      // Get available streams if not specified
      if (!streams) {
        const streamsResult = await connector.listStreams();
        streams = streamsResult.data.streams.map(s => s.name);
      }

      let totalRecords = 0;
      let successfulExtractions = 0;

      for (const streamName of streams) {
        try {
          const extractResult = await connector.readStream(streamName, 10); // Limit to 10 records
          
          results.streams[streamName] = {
            success: extractResult.success,
            record_count: extractResult.data?.record_count || 0,
            sample_data: extractResult.data?.data?.slice(0, 3) || [], // First 3 records
            extraction_time: extractResult.executionTime || 0
          };

          if (extractResult.success) {
            totalRecords += extractResult.data.record_count;
            successfulExtractions++;
          }
        } catch (error) {
          results.streams[streamName] = {
            success: false,
            error: error.message
          };
        }
      }

      results.summary = {
        streams_tested: streams.length,
        successful_extractions: successfulExtractions,
        total_records_extracted: totalRecords,
        success_rate: (successfulExtractions / streams.length) * 100
      };

    } finally {
      await connector.disconnect();
    }

    return results;
  }

  /**
   * Test error conditions and error handling
   */
  async testErrorConditions() {
    const errorTests = [
      {
        name: 'connection_error',
        test: async () => {
          return this._executeMockScript([
            '--source-type', 'database',
            '--operation', 'connect',
            '--error', 'connection'
          ], {});
        }
      },
      {
        name: 'permission_error',
        test: async () => {
          return this._executeMockScript([
            '--source-type', 'api',
            '--operation', 'connect',
            '--error', 'permission'
          ], {});
        }
      },
      {
        name: 'missing_stream_name',
        test: async () => {
          return this._executeMockScript([
            '--source-type', 'database',
            '--operation', 'read_stream'
            // Missing --stream-name
          ], {});
        }
      }
    ];

    const results = {};

    for (const errorTest of errorTests) {
      try {
        const result = await errorTest.test();
        results[errorTest.name] = {
          success: false, // We expect these to fail
          expected_error: true,
          actual_success: result.success,
          error_handled: !result.success // Should be false (failed as expected)
        };
      } catch (error) {
        results[errorTest.name] = {
          success: true, // Error was thrown as expected
          expected_error: true,
          error_handled: true,
          error_message: error.message
        };
      }
    }

    return results;
  }

  /**
   * Create test configuration files
   */
  async createTestConfig(sourceType, customConfig = {}) {
    const baseConfigs = {
      database: {
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_password',
        ...customConfig
      },
      api: {
        api_key: 'test_api_key_12345',
        base_url: 'https://api.example.com',
        timeout: 30,
        ...customConfig
      },
      file: {
        file_path: '/path/to/test/data.csv',
        format: 'csv',
        delimiter: ',',
        ...customConfig
      }
    };

    const config = baseConfigs[sourceType] || {};
    const configPath = path.join(__dirname, '../fixtures', `${sourceType}_config_${this.testId}.json`);
    
    // Ensure fixtures directory exists
    await fs.ensureDir(path.dirname(configPath));
    
    await fs.writeJson(configPath, config, { spaces: 2 });
    this.tempFiles.push(configPath);

    return { configPath, config };
  }

  /**
   * Test PyAirbyte caching functionality
   */
  async testCaching(sourceType = 'database') {
    const connector = await this.createMockConnector(sourceType);
    await connector.connect();

    const results = {
      sourceType: sourceType,
      timestamp: new Date().toISOString(),
      cache_tests: {}
    };

    try {
      // Get initial cache info
      const initialCacheInfo = await connector.getCacheInfo();
      results.cache_tests.initial_state = {
        success: initialCacheInfo.success,
        cache_enabled: initialCacheInfo.data?.cache_enabled,
        cache_size_mb: initialCacheInfo.data?.cache_size_mb,
        cached_streams: initialCacheInfo.data?.cached_streams || []
      };

      // Test cache clearing
      const clearCacheResult = await connector.clearCache();
      results.cache_tests.cache_clear = {
        success: clearCacheResult.success,
        status: clearCacheResult.data?.status,
        timestamp: clearCacheResult.data?.timestamp
      };

      // Get cache info after clearing
      const postClearCacheInfo = await connector.getCacheInfo();
      results.cache_tests.post_clear_state = {
        success: postClearCacheInfo.success,
        cache_enabled: postClearCacheInfo.data?.cache_enabled,
        cache_size_mb: postClearCacheInfo.data?.cache_size_mb,
        cached_streams: postClearCacheInfo.data?.cached_streams || []
      };

    } finally {
      await connector.disconnect();
    }

    return results;
  }

  /**
   * Performance testing for data extraction
   */
  async benchmarkExtraction(sourceType = 'database', streamName = 'users', recordLimits = [10, 50, 100]) {
    const connector = await this.createMockConnector(sourceType);
    await connector.connect();

    const results = {
      sourceType: sourceType,
      streamName: streamName,
      timestamp: new Date().toISOString(),
      benchmarks: []
    };

    try {
      for (const limit of recordLimits) {
        const startTime = process.hrtime.bigint();
        const extractResult = await connector.readStream(streamName, limit);
        const endTime = process.hrtime.bigint();
        
        const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        results.benchmarks.push({
          record_limit: limit,
          success: extractResult.success,
          actual_records: extractResult.data?.record_count || 0,
          execution_time_ms: executionTime,
          records_per_second: extractResult.success ? 
            (extractResult.data.record_count / executionTime) * 1000 : 0
        });
      }

      // Calculate performance summary
      const successfulBenchmarks = results.benchmarks.filter(b => b.success);
      if (successfulBenchmarks.length > 0) {
        results.performance_summary = {
          avg_execution_time_ms: successfulBenchmarks.reduce((sum, b) => sum + b.execution_time_ms, 0) / successfulBenchmarks.length,
          max_records_per_second: Math.max(...successfulBenchmarks.map(b => b.records_per_second)),
          total_records_extracted: successfulBenchmarks.reduce((sum, b) => sum + b.actual_records, 0)
        };
      }

    } finally {
      await connector.disconnect();
    }

    return results;
  }

  /**
   * Data validation and quality checks
   */
  async validateExtractedData(sourceType = 'database', streamName = 'users') {
    const connector = await this.createMockConnector(sourceType);
    await connector.connect();

    const results = {
      sourceType: sourceType,
      streamName: streamName,
      timestamp: new Date().toISOString(),
      validation: {}
    };

    try {
      const extractResult = await connector.readStream(streamName, 20);
      
      if (extractResult.success && extractResult.data.data) {
        const data = extractResult.data.data;
        
        results.validation = {
          record_count: data.length,
          has_data: data.length > 0,
          data_types: {},
          required_fields: {},
          data_quality: {}
        };

        if (data.length > 0) {
          const firstRecord = data[0];
          
          // Analyze data types
          for (const [key, value] of Object.entries(firstRecord)) {
            results.validation.data_types[key] = typeof value;
          }

          // Check for required fields (based on stream type)
          const requiredFields = this._getRequiredFields(streamName);
          for (const field of requiredFields) {
            results.validation.required_fields[field] = firstRecord.hasOwnProperty(field);
          }

          // Data quality checks
          results.validation.data_quality = {
            unique_ids: new Set(data.map(r => r.id)).size === data.length,
            no_null_ids: data.every(r => r.id != null),
            consistent_structure: data.every(r => 
              Object.keys(r).length === Object.keys(firstRecord).length
            )
          };
        }
      } else {
        results.validation.error = extractResult.error || 'Failed to extract data';
      }

    } finally {
      await connector.disconnect();
    }

    return results;
  }

  /**
   * Cleanup test resources
   */
  async cleanup() {
    // Disconnect all connectors
    for (const connector of this.connectors) {
      if (connector.connected) {
        await connector.disconnect();
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

    this.connectors = [];
    this.tempFiles = [];
  }

  /**
   * Private helper methods
   */
  async _executeMockScript(args, input) {
    try {
      const result = await this.pythonManager.execute(this.mockScriptPath, args, {
        parseJson: true,
        input: input
      });
      return result;
    } catch (error) {
      return {
        success: false,
        error: error.message,
        args: args,
        input: input
      };
    }
  }

  _getRequiredFields(streamName) {
    const fieldMap = {
      users: ['id', 'name', 'email'],
      orders: ['id', 'user_id', 'amount', 'status'],
      products: ['id', 'name', 'price'],
      customers: ['customer_id', 'company'],
      transactions: ['transaction_id', 'amount'],
      data: ['id', 'value']
    };

    return fieldMap[streamName] || ['id'];
  }
}

module.exports = PyAirbyteTestUtils;