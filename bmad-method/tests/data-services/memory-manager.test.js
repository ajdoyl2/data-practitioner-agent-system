/**
 * Tests for MemoryManager
 */

const MemoryManager = require('../../tools/lib/memory-manager');

describe('MemoryManager', () => {
  let memoryManager;

  beforeEach(() => {
    // Create fresh instance for each test
    memoryManager = new MemoryManager({
      maxMemoryUsage: '1GB',
      enableMonitoring: false // Disable automatic monitoring for tests
    });
  });

  afterEach(() => {
    // Clean up any monitoring
    if (memoryManager.monitoringTimer) {
      memoryManager.stopMonitoring();
    }
  });

  describe('Memory Limit Parsing', () => {
    it('should parse bytes correctly', () => {
      expect(memoryManager.parseMemoryLimit('1024B')).toBe(1024);
    });

    it('should parse kilobytes correctly', () => {
      expect(memoryManager.parseMemoryLimit('2KB')).toBe(2048);
      expect(memoryManager.parseMemoryLimit('1.5KB')).toBe(1536);
    });

    it('should parse megabytes correctly', () => {
      expect(memoryManager.parseMemoryLimit('10MB')).toBe(10 * 1024 * 1024);
      expect(memoryManager.parseMemoryLimit('512MB')).toBe(512 * 1024 * 1024);
    });

    it('should parse gigabytes correctly', () => {
      expect(memoryManager.parseMemoryLimit('4GB')).toBe(4 * 1024 * 1024 * 1024);
      expect(memoryManager.parseMemoryLimit('1.5GB')).toBe(1.5 * 1024 * 1024 * 1024);
    });

    it('should parse terabytes correctly', () => {
      expect(memoryManager.parseMemoryLimit('2TB')).toBe(2 * 1024 * 1024 * 1024 * 1024);
    });

    it('should handle case-insensitive units', () => {
      expect(memoryManager.parseMemoryLimit('1gb')).toBe(1024 * 1024 * 1024);
      expect(memoryManager.parseMemoryLimit('500mb')).toBe(500 * 1024 * 1024);
    });

    it('should throw error for invalid format', () => {
      expect(() => memoryManager.parseMemoryLimit('invalid')).toThrow('Invalid memory limit format');
      expect(() => memoryManager.parseMemoryLimit('100XB')).toThrow('Invalid memory limit format');
      expect(() => memoryManager.parseMemoryLimit('')).toThrow('Invalid memory limit format');
    });
  });

  describe('Current Memory Usage', () => {
    it('should return current memory usage information', async () => {
      const usage = await memoryManager.getCurrentUsage();
      
      expect(usage).toHaveProperty('rss');
      expect(usage).toHaveProperty('heapTotal');
      expect(usage).toHaveProperty('heapUsed');
      expect(usage).toHaveProperty('external');
      expect(usage).toHaveProperty('timestamp');
      expect(usage).toHaveProperty('heapUtilization');
      expect(usage).toHaveProperty('rssUtilization');
      
      expect(typeof usage.rss).toBe('number');
      expect(typeof usage.heapUtilization).toBe('number');
      expect(typeof usage.rssUtilization).toBe('number');
      expect(usage.heapUtilization).toBeGreaterThanOrEqual(0);
      expect(usage.heapUtilization).toBeLessThanOrEqual(1);
    });

    it('should add usage to history', async () => {
      await memoryManager.getCurrentUsage();
      await memoryManager.getCurrentUsage();
      
      expect(memoryManager.memoryHistory.length).toBe(2);
    });

    it('should maintain history length limit', async () => {
      const smallManager = new MemoryManager({
        maxMemoryUsage: '1GB',
        maxHistoryLength: 3,
        enableMonitoring: false
      });
      
      // Add more samples than the limit
      for (let i = 0; i < 5; i++) {
        await smallManager.getCurrentUsage();
      }
      
      expect(smallManager.memoryHistory.length).toBe(3);
    });
  });

  describe('Memory Statistics', () => {
    it('should return no_data when no history exists', () => {
      const stats = memoryManager.getStats();
      expect(stats.status).toBe('no_data');
    });

    it('should return comprehensive stats with history', async () => {
      await memoryManager.getCurrentUsage();
      
      const stats = memoryManager.getStats();
      
      expect(stats).toHaveProperty('current');
      expect(stats).toHaveProperty('limits');
      expect(stats).toHaveProperty('history');
      expect(stats).toHaveProperty('alerts');
      
      expect(stats.current).toHaveProperty('rss_mb');
      expect(stats.current).toHaveProperty('heap_used_mb');
      expect(stats.current).toHaveProperty('utilization');
      
      expect(stats.limits).toHaveProperty('max_memory_mb');
      expect(stats.limits).toHaveProperty('warning_threshold');
      expect(stats.limits).toHaveProperty('critical_threshold');
      
      expect(stats.history.samples).toBe(1);
    });

    it('should calculate trends with sufficient history', async () => {
      // Add multiple samples
      for (let i = 0; i < 5; i++) {
        await memoryManager.getCurrentUsage();
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const stats = memoryManager.getStats();
      expect(stats).toHaveProperty('trends');
      expect(stats.trends).toHaveProperty('rss_trend');
      expect(stats.trends).toHaveProperty('heap_trend');
    });
  });

  describe('Memory Alerts', () => {
    let consoleSpy;
    
    beforeEach(() => {
      consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
    });
    
    afterEach(() => {
      consoleSpy.mockRestore();
    });

    it('should not trigger alerts for normal usage', async () => {
      // Create manager with high thresholds
      const manager = new MemoryManager({
        maxMemoryUsage: '8GB',
        warningThreshold: 0.9,
        criticalThreshold: 0.95,
        enableMonitoring: false
      });
      
      await manager.getCurrentUsage();
      
      expect(manager.alerts.size).toBe(0);
      expect(consoleSpy).not.toHaveBeenCalled();
    });

    it('should trigger warning alert for high memory usage', async () => {
      // Create manager with low threshold to trigger warning
      const manager = new MemoryManager({
        maxMemoryUsage: '100MB',
        warningThreshold: 0.1,
        criticalThreshold: 0.9,
        enableMonitoring: false
      });
      
      await manager.getCurrentUsage();
      
      expect(manager.alerts.has('warning_rss')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('⚠️ Memory warning'));
    });

    it('should trigger critical alert for very high memory usage', async () => {
      // Create manager with very low threshold to trigger critical
      const manager = new MemoryManager({
        maxMemoryUsage: '50MB',
        warningThreshold: 0.8,
        criticalThreshold: 0.1,
        enableMonitoring: false
      });
      
      await manager.getCurrentUsage();
      
      expect(manager.alerts.has('critical_rss')).toBe(true);
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('🚨 Memory critical'));
    });

    it('should clear alerts when usage returns to normal', async () => {
      // Create manager with low threshold
      const manager = new MemoryManager({
        maxMemoryUsage: '100MB',
        warningThreshold: 0.1,
        enableMonitoring: false
      });
      
      await manager.getCurrentUsage(); // Should trigger warning
      expect(manager.alerts.has('warning_rss')).toBe(true);
      
      // Update thresholds to high values
      manager.warningThreshold = 0.9;
      manager.criticalThreshold = 0.95;
      
      await manager.getCurrentUsage(); // Should clear warning
      expect(manager.alerts.has('warning_rss')).toBe(false);
    });
  });

  describe('Memory Safety Check', () => {
    it('should indicate safe operation for normal usage', async () => {
      const safetyCheck = await memoryManager.checkMemorySafety(10 * 1024 * 1024); // 10MB
      
      expect(safetyCheck.safe).toBe(true);
      expect(safetyCheck.recommendation).toBe('proceed');
      expect(safetyCheck).toHaveProperty('current_utilization');
      expect(safetyCheck).toHaveProperty('projected_utilization');
    });

    it('should indicate caution for moderate projected usage', async () => {
      // Create manager with small limit
      const manager = new MemoryManager({
        maxMemoryUsage: '200MB',
        warningThreshold: 0.7,
        criticalThreshold: 0.9,
        enableMonitoring: false
      });
      
      const largeEstimate = 150 * 1024 * 1024; // 150MB
      const safetyCheck = await manager.checkMemorySafety(largeEstimate);
      
      expect(safetyCheck.safe).toBe(false);
      expect(safetyCheck.recommendation).toBe('caution');
      expect(safetyCheck.reason).toContain('warning threshold');
    });

    it('should indicate abort for critical projected usage', async () => {
      // Create manager with small limit
      const manager = new MemoryManager({
        maxMemoryUsage: '200MB',
        warningThreshold: 0.7,
        criticalThreshold: 0.8,
        enableMonitoring: false
      });
      
      const hugeEstimate = 180 * 1024 * 1024; // 180MB
      const safetyCheck = await manager.checkMemorySafety(hugeEstimate);
      
      expect(safetyCheck.recommendation).toBe('abort');
      expect(safetyCheck.reason).toContain('critical threshold');
    });
  });

  describe('Garbage Collection', () => {
    it('should handle GC when not exposed', () => {
      const originalGC = global.gc;
      delete global.gc;
      
      const result = memoryManager.forceGarbageCollection();
      
      expect(result.success).toBe(false);
      expect(result.reason).toContain('not exposed');
      
      // Restore original gc
      if (originalGC) {
        global.gc = originalGC;
      }
    });

    it('should force GC when available', () => {
      // Mock global.gc
      const mockGC = jest.fn();
      global.gc = mockGC;
      
      const result = memoryManager.forceGarbageCollection();
      
      expect(mockGC).toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(result).toHaveProperty('freed_mb');
      expect(result).toHaveProperty('before_heap_mb');
      expect(result).toHaveProperty('after_heap_mb');
      
      delete global.gc;
    });
  });

  describe('Trend Calculation', () => {
    it('should return null for insufficient data', () => {
      const trend = memoryManager.calculateTrend([100]);
      expect(trend).toBe('stable');
    });

    it('should detect increasing trend', () => {
      const values = [100, 105, 110, 115, 120];
      const trend = memoryManager.calculateTrend(values);
      expect(trend).toBe('increasing');
    });

    it('should detect decreasing trend', () => {
      const values = [120, 115, 110, 105, 100];
      const trend = memoryManager.calculateTrend(values);
      expect(trend).toBe('decreasing');
    });

    it('should detect stable trend', () => {
      const values = [100, 101, 99, 102, 98];
      const trend = memoryManager.calculateTrend(values);
      expect(trend).toBe('stable');
    });
  });

  describe('Monitoring', () => {
    it('should start monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      memoryManager.startMonitoring();
      
      expect(memoryManager.monitoringTimer).toBeDefined();
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Memory monitoring started'));
      
      memoryManager.stopMonitoring();
      consoleSpy.mockRestore();
    });

    it('should stop monitoring', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      memoryManager.startMonitoring();
      memoryManager.stopMonitoring();
      
      expect(memoryManager.monitoringTimer).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('📊 Memory monitoring stopped');
      
      consoleSpy.mockRestore();
    });

    it('should not start monitoring if already running', () => {
      memoryManager.startMonitoring();
      const timer1 = memoryManager.monitoringTimer;
      
      memoryManager.startMonitoring();
      const timer2 = memoryManager.monitoringTimer;
      
      expect(timer1).toBe(timer2);
      
      memoryManager.stopMonitoring();
    });

    it('should handle monitoring errors gracefully', (done) => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock getCurrentUsage to throw error
      const originalGetCurrentUsage = memoryManager.getCurrentUsage;
      memoryManager.getCurrentUsage = jest.fn().mockRejectedValue(new Error('Mock monitoring error'));
      
      // Start monitoring with very short interval
      const manager = new MemoryManager({
        maxMemoryUsage: '1GB',
        monitoringInterval: 10
      });
      
      setTimeout(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Memory monitoring error:', expect.any(Error));
        
        manager.stopMonitoring();
        memoryManager.getCurrentUsage = originalGetCurrentUsage;
        consoleSpy.mockRestore();
        done();
      }, 50);
    });
  });

  describe('History Management', () => {
    it('should track time span of history', async () => {
      await memoryManager.getCurrentUsage();
      await new Promise(resolve => setTimeout(resolve, 10));
      await memoryManager.getCurrentUsage();
      
      const timeSpan = memoryManager.getHistoryTimeSpan();
      expect(timeSpan).toBeGreaterThanOrEqual(0);
    });

    it('should return 0 for insufficient history', () => {
      const timeSpan = memoryManager.getHistoryTimeSpan();
      expect(timeSpan).toBe(0);
    });
  });

  describe('Reset Functionality', () => {
    it('should reset history and alerts', async () => {
      // Add some history and alerts
      await memoryManager.getCurrentUsage();
      memoryManager.alerts.add('test_alert');
      
      expect(memoryManager.memoryHistory.length).toBe(1);
      expect(memoryManager.alerts.size).toBe(1);
      
      memoryManager.reset();
      
      expect(memoryManager.memoryHistory.length).toBe(0);
      expect(memoryManager.alerts.size).toBe(0);
    });
  });

  describe('Configuration Options', () => {
    it('should use custom configuration options', () => {
      const customManager = new MemoryManager({
        maxMemoryUsage: '2GB',
        warningThreshold: 0.7,
        criticalThreshold: 0.9,
        monitoringInterval: 60000,
        maxHistoryLength: 50,
        enableMonitoring: false
      });
      
      expect(customManager.maxMemoryUsage).toBe(2 * 1024 * 1024 * 1024);
      expect(customManager.warningThreshold).toBe(0.7);
      expect(customManager.criticalThreshold).toBe(0.9);
      expect(customManager.monitoringInterval).toBe(60000);
      expect(customManager.maxHistoryLength).toBe(50);
    });

    it('should use default values when options not provided', () => {
      const defaultManager = new MemoryManager();
      
      expect(defaultManager.maxMemoryUsage).toBe(4 * 1024 * 1024 * 1024); // 4GB
      expect(defaultManager.warningThreshold).toBe(0.8);
      expect(defaultManager.criticalThreshold).toBe(0.95);
      expect(defaultManager.monitoringInterval).toBe(30000);
      expect(defaultManager.maxHistoryLength).toBe(100);
    });
  });
});