/**
 * BMad-Method CLI Performance Baseline Test Suite
 * Establishes performance baselines for existing BMad-Method functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

describe('BMad-Method CLI Performance Baseline', () => {
  const cliPath = path.join(__dirname, '../../tools/cli.js');
  const performanceBaselines = {};
  
  beforeAll(async () => {
    // Verify CLI exists
    expect(await fs.pathExists(cliPath)).toBe(true);
  });

  afterAll(() => {
    // Log performance baselines for future reference
    console.log('\n=== BMad-Method Performance Baselines ===');
    Object.entries(performanceBaselines).forEach(([command, metrics]) => {
      console.log(`${command}: ${metrics.duration}ms (±${metrics.variation}ms)`);
    });
  });

  /**
   * Execute CLI command and measure performance
   */
  async function measureCliCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = process.hrtime.bigint();
      
      const child = spawn('node', [cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: options.timeout || 30000,
        cwd: path.join(__dirname, '../..')
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('exit', (code, signal) => {
        const endTime = process.hrtime.bigint();
        const duration = Number(endTime - startTime) / 1000000; // Convert to milliseconds

        if (code === 0 || options.allowNonZero) {
          resolve({
            code,
            signal,
            stdout,
            stderr,
            duration,
            success: code === 0
          });
        } else {
          reject(new Error(`CLI command failed with code ${code}: ${stderr}`));
        }
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Run multiple measurements and calculate statistics
   */
  async function benchmarkCommand(command, args, iterations = 5) {
    const measurements = [];
    
    for (let i = 0; i < iterations; i++) {
      try {
        const result = await measureCliCommand(args);
        measurements.push(result.duration);
      } catch (error) {
        console.warn(`Benchmark iteration ${i + 1} failed:`, error.message);
      }
    }

    if (measurements.length === 0) {
      throw new Error(`All benchmark iterations failed for command: ${command}`);
    }

    const avg = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
    const min = Math.min(...measurements);
    const max = Math.max(...measurements);
    const variance = measurements.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / measurements.length;
    const stdDev = Math.sqrt(variance);

    const metrics = {
      command,
      iterations: measurements.length,
      duration: Math.round(avg),
      min: Math.round(min),
      max: Math.round(max),
      variation: Math.round(stdDev),
      measurements
    };

    performanceBaselines[command] = metrics;
    return metrics;
  }

  describe('Core CLI Commands Performance', () => {
    test('should measure "validate" command performance', async () => {
      const metrics = await benchmarkCommand('validate', ['validate']);
      
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.duration).toBeLessThan(10000); // Should complete within 10 seconds
      expect(metrics.variation).toBeLessThan(metrics.duration * 0.5); // Variation should be less than 50% of average
    }, 60000);

    test('should measure "build" command performance', async () => {
      const metrics = await benchmarkCommand('build', ['build', '--agents-only']);
      
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(metrics.variation).toBeLessThan(metrics.duration * 0.5);
    }, 90000);

    test('should measure "list:agents" command performance', async () => {
      const metrics = await benchmarkCommand('list:agents', ['list:agents']);
      
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.duration).toBeLessThan(5000); // Should be fast, within 5 seconds
      expect(metrics.variation).toBeLessThan(metrics.duration * 0.3);
    }, 30000);

    test('should measure CLI startup time (help command)', async () => {
      const metrics = await benchmarkCommand('help', ['--help']);
      
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.duration).toBeLessThan(3000); // Help should be very fast
      expect(metrics.variation).toBeLessThan(metrics.duration * 0.3);
    }, 20000);
  });

  describe('Agent and Build System Performance', () => {
    test('should measure teams build performance', async () => {
      const metrics = await benchmarkCommand('build-teams', ['build', '--teams-only']);
      
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.duration).toBeLessThan(10000); // Teams build should be relatively fast
      expect(metrics.variation).toBeLessThan(metrics.duration * 0.5);
    }, 60000);

    test('should measure full build performance', async () => {
      const metrics = await benchmarkCommand('build-full', ['build'], 3); // Fewer iterations for full build
      
      expect(metrics.duration).toBeGreaterThan(0);
      expect(metrics.duration).toBeLessThan(30000); // Full build might take longer
      expect(metrics.variation).toBeLessThan(metrics.duration * 0.6);
    }, 120000);
  });

  describe('Performance Regression Detection', () => {
    test('should establish regression thresholds', () => {
      const regressionThresholds = {};
      
      Object.entries(performanceBaselines).forEach(([command, metrics]) => {
        // Set regression threshold to 150% of baseline + 2 standard deviations
        const threshold = Math.round(metrics.duration * 1.5 + metrics.variation * 2);
        regressionThresholds[command] = threshold;
      });

      // Save thresholds for future regression testing
      const thresholdsPath = path.join(__dirname, '../fixtures/performance-thresholds.json');
      fs.writeJsonSync(thresholdsPath, {
        generated: new Date().toISOString(),
        baselines: performanceBaselines,
        thresholds: regressionThresholds,
        note: 'These thresholds were generated automatically. Adjust as needed for your environment.'
      }, { spaces: 2 });

      console.log(`\nPerformance thresholds saved to: ${thresholdsPath}`);
      
      // Verify thresholds are reasonable
      Object.entries(regressionThresholds).forEach(([command, threshold]) => {
        expect(threshold).toBeGreaterThan(0);
        expect(threshold).toBeGreaterThan(performanceBaselines[command].duration);
      });
    });

    test('should validate performance consistency', () => {
      Object.entries(performanceBaselines).forEach(([command, metrics]) => {
        // Coefficient of variation should be reasonable (< 50%)
        const coefficientOfVariation = (metrics.variation / metrics.duration) * 100;
        expect(coefficientOfVariation).toBeLessThan(50);
        
        // No measurement should be more than 3 standard deviations from mean
        const outliers = metrics.measurements.filter(measurement => 
          Math.abs(measurement - metrics.duration) > metrics.variation * 3
        );
        expect(outliers.length).toBeLessThanOrEqual(1); // Allow at most 1 outlier per command
      });
    });
  });

  describe('System Resource Usage', () => {
    test('should measure memory usage during build', async () => {
      const initialMemory = process.memoryUsage();
      
      await measureCliCommand(['build', '--agents-only']);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB for a simple build)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory usage during build: ${Math.round(memoryIncrease / 1024 / 1024)}MB increase`);
    }, 30000);

    test('should verify no memory leaks in repeated operations', async () => {
      const measurements = [];
      
      for (let i = 0; i < 3; i++) {
        const beforeMemory = process.memoryUsage().heapUsed;
        await measureCliCommand(['list:agents']);
        const afterMemory = process.memoryUsage().heapUsed;
        measurements.push(afterMemory - beforeMemory);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      // Memory usage should be consistent across iterations
      const avgMemoryUsage = measurements.reduce((sum, val) => sum + val, 0) / measurements.length;
      const memoryVariance = measurements.reduce((sum, val) => sum + Math.pow(val - avgMemoryUsage, 2), 0) / measurements.length;
      
      // Variance should be relatively small (less than 10MB)
      expect(Math.sqrt(memoryVariance)).toBeLessThan(10 * 1024 * 1024);
    }, 45000);
  });
});