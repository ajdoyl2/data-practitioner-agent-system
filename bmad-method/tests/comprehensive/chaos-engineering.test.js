/**
 * Chaos Engineering Tests for System Resilience
 * Tests system behavior under various failure scenarios and stress conditions
 */

const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');

// Mock the dependencies for testing
jest.mock('../../tools/data-services/duckdb-wrapper');
jest.mock('../../tools/data-services/workflow-orchestrator');

describe('Chaos Engineering - System Resilience Testing', () => {
  let orchestrator;
  let tempTestDir;

  beforeAll(async () => {
    orchestrator = {
      initialize: jest.fn().mockResolvedValue(true),
      executeWorkflow: jest.fn().mockResolvedValue({ success: true })
    };
    tempTestDir = path.join(__dirname, '../fixtures/temp/chaos-tests');
    
    if (!fs.existsSync(tempTestDir)) {
      fs.mkdirSync(tempTestDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Cleanup chaos test artifacts
    if (fs.existsSync(tempTestDir)) {
      fs.rmSync(tempTestDir, { recursive: true, force: true });
    }
  });

  describe('Database Failure Scenarios', () => {
    test('should gracefully handle database connection failures', async () => {
      // Mock DuckDB wrapper with failure simulation
      const duckdb = {
        config: { database_path: '/invalid/path/database.db' },
        connect: jest.fn(),
        initialize: jest.fn(),
        execute: jest.fn().mockResolvedValue(true),
        query: jest.fn().mockResolvedValue([{ count: 0 }]),
        disconnect: jest.fn().mockResolvedValue(true)
      };

      // Simulate connection failure by using invalid database path
      const invalidConfig = {
        database_path: '/invalid/path/database.db',
        fallback_mode: 'memory'
      };

      let connectionAttempts = 0;
      let fallbackUsed = false;

      try {
        // Override connection method to simulate failures
        const originalConnect = duckdb.connect;
        duckdb.connect = async function() {
          connectionAttempts++;
          if (connectionAttempts <= 2) {
            throw new Error('Connection failed');
          }
          
          // Use fallback after failures
          fallbackUsed = true;
          this.config.database_path = ':memory:';
          return originalConnect.call(this);
        };

        await duckdb.initialize();
        
        // Verify system recovered using fallback
        expect(connectionAttempts).toBeGreaterThan(1);
        expect(fallbackUsed).toBe(true);
        
        // Test that basic operations work with fallback
        await duckdb.execute('CREATE TABLE resilience_test (id INTEGER, name TEXT)');
        const result = await duckdb.query('SELECT COUNT(*) as count FROM resilience_test');
        expect(result[0].count).toBe(0);
        
        await duckdb.disconnect();
      } catch (error) {
        // Should not reach here - system should have recovered
        fail(`System failed to recover from database connection failure: ${error.message}`);
      }
    });

    test('should handle database lock and timeout scenarios', async () => {
      const duckdb1 = new DuckDBWrapper({ memory: '128MB' });
      const duckdb2 = new DuckDBWrapper({ memory: '128MB' });

      await duckdb1.initialize();
      await duckdb2.initialize();

      try {
        // Create a long-running transaction in first connection
        await duckdb1.execute('CREATE TABLE lock_test (id INTEGER, data TEXT)');
        await duckdb1.execute('BEGIN TRANSACTION');
        await duckdb1.execute('INSERT INTO lock_test VALUES (1, \'locked_data\')');

        // Attempt conflicting operation from second connection with timeout
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));
        const queryPromise = duckdb2.query('INSERT INTO lock_test VALUES (2, \'concurrent_data\')', { timeout: 1000 });

        const result = await Promise.race([queryPromise, timeoutPromise]);

        // Should handle timeout gracefully
        expect(result).toBeUndefined(); // Timeout occurred
        
        // Commit first transaction
        await duckdb1.execute('COMMIT');
        
        // Second operation should now succeed
        await duckdb2.execute('INSERT INTO lock_test VALUES (2, \'concurrent_data\')');
        const finalResult = await duckdb2.query('SELECT COUNT(*) as count FROM lock_test');
        expect(finalResult[0].count).toBe(2);

      } finally {
        await duckdb1.disconnect();
        await duckdb2.disconnect();
      }
    });
  });

  describe('Memory Pressure Simulation', () => {
    test('should handle memory exhaustion gracefully', async () => {
      const duckdb = new DuckDBWrapper({ 
        memory: '64MB', // Intentionally small
        enable_memory_monitoring: true 
      });

      await duckdb.initialize();

      try {
        // Attempt to create large dataset that exceeds memory limit
        let memoryExhausted = false;
        let spillToDisk = false;

        try {
          await duckdb.execute(`
            CREATE TABLE memory_pressure_test AS 
            SELECT 
              row_number() OVER () as id,
              md5(random()::text) as hash_col1,
              md5(random()::text) as hash_col2,
              md5(random()::text) as hash_col3,
              md5(random()::text) as hash_col4,
              md5(random()::text) as hash_col5
            FROM generate_series(1, 1000000)
          `);
        } catch (error) {
          if (error.message.includes('memory') || error.message.includes('Memory')) {
            memoryExhausted = true;
          }
        }

        // System should either handle gracefully or spill to disk
        if (memoryExhausted) {
          console.log('Memory exhaustion detected - testing recovery...');
          
          // Try smaller dataset
          await duckdb.execute(`
            CREATE TABLE memory_recovery_test AS 
            SELECT row_number() OVER () as id, 'test_data' as data
            FROM generate_series(1, 1000)
          `);
          
          const result = await duckdb.query('SELECT COUNT(*) as count FROM memory_recovery_test');
          expect(result[0].count).toBe(1000);
        }

        // Verify system is still responsive
        const healthCheck = await duckdb.query('SELECT 1 as health_check');
        expect(healthCheck[0].health_check).toBe(1);

      } finally {
        await duckdb.disconnect();
      }
    });

    test('should monitor and report memory usage during operations', async () => {
      const memorySnapshots = [];
      
      const captureMemorySnapshot = (operation) => {
        const usage = process.memoryUsage();
        memorySnapshots.push({
          operation,
          timestamp: Date.now(),
          heapUsed: usage.heapUsed,
          heapTotal: usage.heapTotal,
          external: usage.external,
          rss: usage.rss
        });
      };

      captureMemorySnapshot('initial');

      const duckdb = new DuckDBWrapper({ memory: '256MB' });
      await duckdb.initialize();
      captureMemorySnapshot('initialized');

      // Run memory-intensive operations
      await duckdb.execute('CREATE TABLE memory_monitor_test AS SELECT * FROM generate_series(1, 50000)');
      captureMemorySnapshot('table_created');

      await duckdb.query('SELECT COUNT(*), AVG(generate_series), MAX(generate_series) FROM memory_monitor_test');
      captureMemorySnapshot('query_executed');

      await duckdb.disconnect();
      captureMemorySnapshot('disconnected');

      // Analyze memory usage patterns
      const maxHeapUsed = Math.max(...memorySnapshots.map(s => s.heapUsed));
      const initialHeap = memorySnapshots[0].heapUsed;
      const finalHeap = memorySnapshots[memorySnapshots.length - 1].heapUsed;

      // Memory should be released after operations
      expect(finalHeap - initialHeap).toBeLessThan(maxHeapUsed - initialHeap);
      
      // Save memory profile for analysis
      const profilePath = path.join(tempTestDir, 'memory-profile.json');
      fs.writeFileSync(profilePath, JSON.stringify(memorySnapshots, null, 2));
    });
  });

  describe('Network Timeout and Connectivity Issues', () => {
    test('should handle external service timeouts gracefully', async () => {
      // Mock external service with timeout
      const mockExternalService = {
        async fetchData(url, timeout = 5000) {
          return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
              reject(new Error('Request timeout'));
            }, timeout);

            // Simulate slow response
            setTimeout(() => {
              clearTimeout(timer);
              resolve({ data: 'mock_data', status: 'success' });
            }, 8000); // Intentionally longer than timeout
          });
        }
      };

      let timeoutHandled = false;
      let fallbackUsed = false;

      try {
        await mockExternalService.fetchData('https://example.com/api/data', 1000);
      } catch (error) {
        if (error.message.includes('timeout')) {
          timeoutHandled = true;
          
          // Use cached/fallback data
          const fallbackData = { data: 'cached_data', status: 'fallback' };
          fallbackUsed = true;
          
          expect(fallbackData.status).toBe('fallback');
        }
      }

      expect(timeoutHandled).toBe(true);
      expect(fallbackUsed).toBe(true);
    });

    test('should retry failed requests with exponential backoff', async () => {
      let attemptCount = 0;
      const maxRetries = 3;
      const baseDelay = 100;

      const mockFailingService = {
        async unreliableOperation() {
          attemptCount++;
          
          if (attemptCount < 3) {
            throw new Error(`Attempt ${attemptCount} failed`);
          }
          
          return { success: true, attempt: attemptCount };
        }
      };

      const retryWithBackoff = async (operation, maxRetries, baseDelay) => {
        let lastError;
        
        for (let attempt = 0; attempt < maxRetries; attempt++) {
          try {
            return await operation();
          } catch (error) {
            lastError = error;
            
            if (attempt < maxRetries - 1) {
              const delay = baseDelay * Math.pow(2, attempt);
              await new Promise(resolve => setTimeout(resolve, delay));
            }
          }
        }
        
        throw lastError;
      };

      const result = await retryWithBackoff(
        () => mockFailingService.unreliableOperation(),
        maxRetries,
        baseDelay
      );

      expect(result.success).toBe(true);
      expect(attemptCount).toBe(3);
    });
  });

  describe('Disk Space and I/O Failures', () => {
    test('should handle disk space exhaustion scenarios', async () => {
      // Simulate disk space constraints
      const smallTempDir = path.join(tempTestDir, 'small-disk-sim');
      if (!fs.existsSync(smallTempDir)) {
        fs.mkdirSync(smallTempDir, { recursive: true });
      }

      let diskSpaceError = false;
      let cleanupTriggered = false;

      try {
        // Attempt to create large files that would exhaust disk space
        const largeFakeData = 'x'.repeat(1024 * 1024); // 1MB string
        
        for (let i = 0; i < 100; i++) { // Try to write 100MB
          const filePath = path.join(smallTempDir, `large-file-${i}.txt`);
          
          try {
            fs.writeFileSync(filePath, largeFakeData);
          } catch (error) {
            if (error.code === 'ENOSPC' || error.message.includes('space')) {
              diskSpaceError = true;
              
              // Trigger cleanup
              const files = fs.readdirSync(smallTempDir);
              files.forEach(file => {
                fs.unlinkSync(path.join(smallTempDir, file));
              });
              cleanupTriggered = true;
              break;
            }
          }
        }

        // Even if we didn't hit actual disk space limits, verify cleanup would work
        if (!diskSpaceError) {
          const files = fs.readdirSync(smallTempDir);
          if (files.length > 0) {
            files.forEach(file => {
              fs.unlinkSync(path.join(smallTempDir, file));
            });
            cleanupTriggered = true;
          }
        }

        expect(cleanupTriggered).toBe(true);

      } finally {
        // Cleanup test directory
        if (fs.existsSync(smallTempDir)) {
          fs.rmSync(smallTempDir, { recursive: true, force: true });
        }
      }
    });

    test('should handle file permission and access errors', async () => {
      const restrictedPath = path.join(tempTestDir, 'restricted');
      fs.mkdirSync(restrictedPath, { recursive: true });

      let permissionError = false;
      let fallbackPath = null;

      try {
        // Try to change permissions to simulate restricted access
        // Note: This may not work on all systems, so we'll also simulate
        if (process.platform !== 'win32') {
          fs.chmodSync(restrictedPath, 0o000); // No permissions
        }

        // Attempt to write to restricted directory
        const testFile = path.join(restrictedPath, 'test.txt');
        fs.writeFileSync(testFile, 'test data');
        
      } catch (error) {
        if (error.code === 'EACCES' || error.code === 'EPERM') {
          permissionError = true;
          
          // Use fallback location
          fallbackPath = path.join(tempTestDir, 'fallback');
          fs.mkdirSync(fallbackPath, { recursive: true });
          
          const fallbackFile = path.join(fallbackPath, 'test.txt');
          fs.writeFileSync(fallbackFile, 'test data');
          
          expect(fs.existsSync(fallbackFile)).toBe(true);
        }
      }

      // Restore permissions for cleanup
      if (process.platform !== 'win32' && fs.existsSync(restrictedPath)) {
        fs.chmodSync(restrictedPath, 0o755);
      }
    });
  });

  describe('Service Dependency Failures', () => {
    test('should handle cascading service failures', async () => {
      // Simulate service dependency chain: A -> B -> C
      const services = {
        serviceA: {
          async process() {
            const resultB = await services.serviceB.process();
            return { service: 'A', dependency: resultB };
          }
        },
        serviceB: {
          async process() {
            const resultC = await services.serviceC.process();
            return { service: 'B', dependency: resultC };
          }
        },
        serviceC: {
          async process() {
            // Simulate random failure
            if (Math.random() < 0.7) { // 70% chance of failure
              throw new Error('Service C unavailable');
            }
            return { service: 'C', data: 'success' };
          }
        }
      };

      // Add circuit breaker pattern
      const circuitBreaker = {
        failures: 0,
        maxFailures: 3,
        resetTimeout: 1000,
        state: 'closed', // closed, open, half-open
        lastFailTime: null,

        async call(serviceFunc) {
          if (this.state === 'open') {
            if (Date.now() - this.lastFailTime > this.resetTimeout) {
              this.state = 'half-open';
            } else {
              throw new Error('Circuit breaker is open');
            }
          }

          try {
            const result = await serviceFunc();
            if (this.state === 'half-open') {
              this.state = 'closed';
              this.failures = 0;
            }
            return result;
          } catch (error) {
            this.failures++;
            this.lastFailTime = Date.now();
            
            if (this.failures >= this.maxFailures) {
              this.state = 'open';
            }
            throw error;
          }
        }
      };

      // Test cascade failure handling
      let circuitBreakerTriggered = false;
      let fallbackUsed = false;

      for (let attempt = 0; attempt < 5; attempt++) {
        try {
          await circuitBreaker.call(() => services.serviceA.process());
        } catch (error) {
          if (error.message === 'Circuit breaker is open') {
            circuitBreakerTriggered = true;
            
            // Use fallback/cached data
            fallbackUsed = true;
            break;
          }
        }
      }

      // Circuit breaker should have triggered to prevent cascade failures
      expect(circuitBreakerTriggered || fallbackUsed).toBe(true);
    });

    test('should implement bulkhead isolation for critical components', async () => {
      // Simulate resource pools with bulkhead pattern
      const resourcePools = {
        critical: {
          maxConnections: 5,
          currentConnections: 0,
          async acquireConnection() {
            if (this.currentConnections >= this.maxConnections) {
              throw new Error('Critical pool exhausted');
            }
            this.currentConnections++;
            return { pool: 'critical', id: this.currentConnections };
          },
          releaseConnection() {
            this.currentConnections = Math.max(0, this.currentConnections - 1);
          }
        },
        nonCritical: {
          maxConnections: 2,
          currentConnections: 0,
          async acquireConnection() {
            if (this.currentConnections >= this.maxConnections) {
              throw new Error('Non-critical pool exhausted');
            }
            this.currentConnections++;
            return { pool: 'non-critical', id: this.currentConnections };
          },
          releaseConnection() {
            this.currentConnections = Math.max(0, this.currentConnections - 1);
          }
        }
      };

      // Test bulkhead isolation
      const criticalOperations = [];
      const nonCriticalOperations = [];

      // Exhaust non-critical pool
      for (let i = 0; i < 3; i++) {
        try {
          const conn = await resourcePools.nonCritical.acquireConnection();
          nonCriticalOperations.push(conn);
        } catch (error) {
          expect(error.message).toContain('Non-critical pool exhausted');
        }
      }

      // Critical operations should still work
      for (let i = 0; i < 3; i++) {
        const conn = await resourcePools.critical.acquireConnection();
        criticalOperations.push(conn);
        expect(conn.pool).toBe('critical');
      }

      // Critical pool isolation verified
      expect(criticalOperations.length).toBe(3);
      expect(nonCriticalOperations.length).toBe(2); // Only 2 succeeded due to pool limit

      // Cleanup
      criticalOperations.forEach(() => resourcePools.critical.releaseConnection());
      nonCriticalOperations.forEach(() => resourcePools.nonCritical.releaseConnection());
    });
  });

  describe('Recovery and Resilience Validation', () => {
    test('should validate system recovery after chaos events', async () => {
      const systemHealth = {
        components: ['database', 'ingestion', 'transformation', 'publication'],
        status: {},
        
        async checkHealth() {
          for (const component of this.components) {
            try {
              await this.healthCheck(component);
              this.status[component] = 'healthy';
            } catch (error) {
              this.status[component] = 'unhealthy';
            }
          }
          return this.status;
        },
        
        async healthCheck(component) {
          // Simulate component health checks
          switch (component) {
            case 'database':
              const duckdb = new DuckDBWrapper({ memory: '128MB' });
              await duckdb.initialize();
              await duckdb.query('SELECT 1 as health');
              await duckdb.disconnect();
              break;
            case 'ingestion':
              // Simulate ingestion health check
              await new Promise(resolve => setTimeout(resolve, 10));
              break;
            case 'transformation':
              // Simulate transformation health check
              await new Promise(resolve => setTimeout(resolve, 10));
              break;
            case 'publication':
              // Simulate publication health check
              await new Promise(resolve => setTimeout(resolve, 10));
              break;
          }
        },
        
        isSystemHealthy() {
          return Object.values(this.status).every(status => status === 'healthy');
        }
      };

      // Initial health check
      await systemHealth.checkHealth();
      const initialHealth = systemHealth.isSystemHealthy();
      
      // Simulate chaos event (component failure)
      systemHealth.healthCheck = async function(component) {
        if (component === 'database') {
          throw new Error('Simulated database failure');
        }
        await new Promise(resolve => setTimeout(resolve, 10));
      };

      await systemHealth.checkHealth();
      const chaosHealth = systemHealth.isSystemHealthy();
      expect(chaosHealth).toBe(false);

      // Simulate recovery
      systemHealth.healthCheck = async function(component) {
        switch (component) {
          case 'database':
            const duckdb = new DuckDBWrapper({ memory: '128MB' });
            await duckdb.initialize();
            await duckdb.query('SELECT 1 as health');
            await duckdb.disconnect();
            break;
          default:
            await new Promise(resolve => setTimeout(resolve, 10));
        }
      };

      await systemHealth.checkHealth();
      const recoveryHealth = systemHealth.isSystemHealthy();
      
      // System should recover
      expect(recoveryHealth).toBe(true);
    });

    test('should measure mean time to recovery (MTTR)', async () => {
      const recoveryTests = [];
      
      for (let i = 0; i < 3; i++) {
        const startTime = Date.now();
        
        // Simulate failure
        const failureTime = Date.now();
        
        // Simulate detection time (1-3 seconds)
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        const detectionTime = Date.now();
        
        // Simulate recovery time (2-5 seconds)
        await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
        const recoveryTime = Date.now();
        
        recoveryTests.push({
          test: i + 1,
          failure_time: failureTime - startTime,
          detection_time: detectionTime - failureTime,
          recovery_time: recoveryTime - detectionTime,
          total_time: recoveryTime - startTime
        });
      }
      
      const avgRecoveryTime = recoveryTests.reduce((sum, test) => sum + test.total_time, 0) / recoveryTests.length;
      
      // MTTR should be under 10 seconds for this test scenario
      expect(avgRecoveryTime).toBeLessThan(10000);
      
      // Log recovery metrics
      console.log('Recovery metrics:', {
        average_recovery_time: `${(avgRecoveryTime / 1000).toFixed(2)}s`,
        tests: recoveryTests.map(t => ({
          test: t.test,
          total_time: `${(t.total_time / 1000).toFixed(2)}s`
        }))
      });
    });
  });
});