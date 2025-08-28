/**
 * MonitoringEngine Test Suite
 * 
 * Comprehensive testing for unified monitoring and observability across data pipeline components
 * Tests health checking, alerting, performance tracking, and integration capabilities
 */

const MonitoringEngine = require('../../tools/data-services/monitoring-engine');
const fs = require('fs-extra');
const path = require('path');

describe('MonitoringEngine', () => {
  let engine;
  const testDataDir = path.join(__dirname, '../../data/test-monitoring');

  beforeEach(async () => {
    // Clean up test data directory
    await fs.remove(testDataDir);
    
    engine = new MonitoringEngine({
      dataRetentionDays: 1,
      healthCheckInterval: 1000, // 1 second for testing
      alertCooldownMs: 1000, // 1 second for testing
      metricsBufferSize: 50,
      enableDagsterIntegration: false // Disable for unit tests
    });
    
    // Override data directory for testing
    engine.dataDir = testDataDir;
  });

  afterEach(async () => {
    if (engine && engine.isRunning) {
      await engine.stopMonitoring();
    }
    await fs.remove(testDataDir);
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const result = await engine.initialize();
      
      expect(result.success).toBe(true);
      expect(result.message).toContain('initialized');
      expect(engine.initialized).toBe(true);
      expect(await fs.pathExists(testDataDir)).toBe(true);
    });

    test('should create required data directories', async () => {
      await engine.initialize();
      
      const dirs = ['metrics', 'health-checks', 'alerts', 'performance'];
      for (const dir of dirs) {
        expect(await fs.pathExists(path.join(testDataDir, dir))).toBe(true);
      }
    });

    test('should register default health checks', async () => {
      await engine.initialize();
      
      expect(engine.healthChecks.size).toBeGreaterThan(0);
      expect(engine.healthChecks.has('duckdb')).toBe(true);
      expect(engine.healthChecks.has('filesystem')).toBe(true);
      expect(engine.healthChecks.has('pyairbyte')).toBe(true);
      expect(engine.healthChecks.has('evidence')).toBe(true);
    });

    test('should setup default alert rules', async () => {
      await engine.initialize();
      
      expect(engine.alertRules.size).toBeGreaterThan(0);
      expect(engine.alertRules.has('component_failure')).toBe(true);
      expect(engine.alertRules.has('high_error_rate')).toBe(true);
      expect(engine.alertRules.has('performance_degradation')).toBe(true);
      expect(engine.alertRules.has('data_quality_degradation')).toBe(true);
    });

    test('should handle initialization errors', async () => {
      // Mock fs.ensureDir to fail
      const originalEnsureDir = fs.ensureDir;
      fs.ensureDir = jest.fn().mockRejectedValue(new Error('Permission denied'));
      
      await expect(engine.initialize()).rejects.toThrow('Permission denied');
      
      fs.ensureDir = originalEnsureDir;
    });
  });

  describe('Component Registration', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should register component successfully', async () => {
      const config = {
        name: 'Test Component',
        type: 'service',
        dependencies: ['database'],
        metrics: ['response_time', 'error_rate']
      };

      const result = await engine.registerComponent('test-component', config);
      
      expect(result.id).toBe('test-component');
      expect(result.name).toBe('Test Component');
      expect(result.type).toBe('service');
      expect(result.dependencies).toEqual(['database']);
      
      expect(engine.components.has('test-component')).toBe(true);
      expect(engine.dependencies.has('test-component')).toBe(true);
    });

    test('should handle component without dependencies', async () => {
      const config = {
        name: 'Standalone Component',
        type: 'worker'
      };

      await engine.registerComponent('standalone', config);
      
      expect(engine.components.has('standalone')).toBe(true);
      expect(engine.dependencies.has('standalone')).toBe(false);
    });

    test('should emit component registration event', (done) => {
      engine.on('component.registered', (data) => {
        expect(data.componentId).toBe('event-test');
        expect(data.config.name).toBe('Event Test');
        done();
      });
      
      engine.registerComponent('event-test', { name: 'Event Test' });
    });
  });

  describe('Health Checks', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should register custom health check', () => {
      const checkFunction = jest.fn().mockResolvedValue({ healthy: true, responseTime: 100 });
      
      engine.registerHealthCheck('custom-check', {
        name: 'Custom Health Check',
        interval: 5000,
        timeout: 2000,
        checkFunction
      });
      
      expect(engine.healthChecks.has('custom-check')).toBe(true);
      
      const healthCheck = engine.healthChecks.get('custom-check');
      expect(healthCheck.name).toBe('Custom Health Check');
      expect(healthCheck.interval).toBe(5000);
      expect(healthCheck.timeout).toBe(2000);
    });

    test('should run single health check successfully', async () => {
      const checkFunction = jest.fn().mockResolvedValue({ 
        healthy: true, 
        responseTime: 150,
        details: { message: 'All systems operational' }
      });
      
      engine.registerHealthCheck('test-check', {
        name: 'Test Check',
        checkFunction
      });
      
      const result = await engine.runSingleHealthCheck('test-check');
      
      expect(checkFunction).toHaveBeenCalled();
      expect(result.healthy).toBe(true);
      expect(result.checkId).toBe('test-check');
      expect(result.name).toBe('Test Check');
      expect(result.responseTime).toBe(150);
      expect(result.details).toEqual({ message: 'All systems operational' });
    });

    test('should handle health check failure', async () => {
      const checkFunction = jest.fn().mockResolvedValue({ 
        healthy: false,
        error: 'Service unavailable',
        responseTime: 0
      });
      
      engine.registerHealthCheck('failing-check', {
        name: 'Failing Check',
        checkFunction
      });
      
      const result = await engine.runSingleHealthCheck('failing-check');
      
      expect(result.healthy).toBe(false);
      expect(result.error).toBe('Service unavailable');
      
      const healthCheck = engine.healthChecks.get('failing-check');
      expect(healthCheck.consecutiveFailures).toBe(1);
    });

    test('should handle health check timeout', async () => {
      const checkFunction = jest.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({ healthy: true }), 2000))
      );
      
      engine.registerHealthCheck('timeout-check', {
        name: 'Timeout Check',
        timeout: 100, // Very short timeout
        checkFunction
      });
      
      const result = await engine.runSingleHealthCheck('timeout-check');
      
      expect(result.healthy).toBe(false);
      expect(result.error).toContain('timeout');
    });

    test('should handle missing health check', async () => {
      await expect(engine.runSingleHealthCheck('nonexistent')).rejects.toThrow('Health check not found');
    });

    test('should run all health checks', async () => {
      const check1 = jest.fn().mockResolvedValue({ healthy: true, responseTime: 100 });
      const check2 = jest.fn().mockResolvedValue({ healthy: false, error: 'Failed' });
      
      engine.registerHealthCheck('check1', { checkFunction: check1, interval: 0 });
      engine.registerHealthCheck('check2', { checkFunction: check2, interval: 0 });
      
      const results = await engine.runHealthChecks();
      
      expect(results.length).toBeGreaterThanOrEqual(2);
      expect(check1).toHaveBeenCalled();
      expect(check2).toHaveBeenCalled();
    });

    test('should update component status from health checks', async () => {
      await engine.registerComponent('linked-component', {
        name: 'Linked Component',
        healthCheckId: 'linked-check'
      });
      
      const checkFunction = jest.fn().mockResolvedValue({ healthy: true, responseTime: 100 });
      engine.registerHealthCheck('linked-check', { checkFunction });
      
      await engine.runSingleHealthCheck('linked-check');
      
      const component = engine.components.get('linked-component');
      expect(component.status).toBe('healthy');
      expect(component.lastSeen).toBeInstanceOf(Date);
    });
  });

  describe('Metrics Recording', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should record metric successfully', () => {
      const metric = engine.recordMetric('test_metric', 42.5, 'performance', { component: 'test' });
      
      expect(metric.name).toBe('test_metric');
      expect(metric.value).toBe(42.5);
      expect(metric.type).toBe('performance');
      expect(metric.tags.component).toBe('test');
      expect(metric.timestamp).toBeInstanceOf(Date);
      
      expect(engine.metrics).toHaveLength(1);
      expect(engine.metrics[0]).toEqual(metric);
    });

    test('should maintain metrics buffer size', () => {
      engine.options.metricsBufferSize = 3;
      
      engine.recordMetric('metric1', 1);
      engine.recordMetric('metric2', 2);
      engine.recordMetric('metric3', 3);
      engine.recordMetric('metric4', 4); // Should trigger buffer cleanup
      
      expect(engine.metrics).toHaveLength(3);
      expect(engine.metrics[0].name).toBe('metric2');
      expect(engine.metrics[2].name).toBe('metric4');
    });

    test('should emit metric events', (done) => {
      engine.on('metric.recorded', (metric) => {
        expect(metric.name).toBe('event_test');
        expect(metric.value).toBe(123);
        done();
      });
      
      engine.recordMetric('event_test', 123);
    });
  });

  describe('Alert Rules and Management', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should register custom alert rule', () => {
      const condition = jest.fn().mockReturnValue(false);
      
      engine.registerAlertRule('custom-alert', {
        name: 'Custom Alert',
        condition,
        severity: 'warning',
        cooldown: 5000,
        notificationChannels: ['console', 'file']
      });
      
      expect(engine.alertRules.has('custom-alert')).toBe(true);
      
      const rule = engine.alertRules.get('custom-alert');
      expect(rule.name).toBe('Custom Alert');
      expect(rule.severity).toBe('warning');
      expect(rule.cooldown).toBe(5000);
      expect(rule.notificationChannels).toEqual(['console', 'file']);
    });

    test('should evaluate alert rules and trigger alerts', async () => {
      const condition = jest.fn().mockReturnValue(true);
      
      engine.registerAlertRule('test-alert', {
        name: 'Test Alert',
        condition,
        severity: 'critical',
        notificationChannels: ['console']
      });
      
      // Add some metrics
      engine.recordMetric('error_rate', 0.1, 'error');
      
      // Mock notification to prevent console output in tests
      engine.sendNotification = jest.fn();
      
      await engine.evaluateAlertRules();
      
      expect(condition).toHaveBeenCalledWith(expect.any(Array));
      expect(engine.sendNotification).toHaveBeenCalledWith('console', expect.any(Object));
      expect(engine.activeAlerts.size).toBe(1);
      
      const alert = Array.from(engine.activeAlerts.values())[0];
      expect(alert.severity).toBe('critical');
      expect(alert.ruleName).toBe('Test Alert');
    });

    test('should respect alert cooldown', async () => {
      const condition = jest.fn().mockReturnValue(true);
      
      engine.registerAlertRule('cooldown-alert', {
        name: 'Cooldown Alert',
        condition,
        cooldown: 10000, // 10 seconds
        notificationChannels: ['console']
      });
      
      engine.sendNotification = jest.fn();
      
      // First evaluation should trigger alert
      await engine.evaluateAlertRules();
      expect(engine.sendNotification).toHaveBeenCalledTimes(1);
      
      // Second evaluation should be blocked by cooldown
      await engine.evaluateAlertRules();
      expect(engine.sendNotification).toHaveBeenCalledTimes(1); // Still 1
    });

    test('should handle alert rule evaluation errors', async () => {
      const condition = jest.fn().mockImplementation(() => {
        throw new Error('Evaluation failed');
      });
      
      engine.registerAlertRule('error-alert', {
        name: 'Error Alert',
        condition,
        notificationChannels: ['console']
      });
      
      // Should not throw, should handle error gracefully
      await expect(engine.evaluateAlertRules()).resolves.toBeUndefined();
      expect(condition).toHaveBeenCalled();
      expect(engine.activeAlerts.size).toBe(0);
    });

    test('should trigger alerts and emit events', async () => {
      const condition = jest.fn().mockReturnValue(true);
      let alertTriggered = false;
      
      engine.registerAlertRule('event-alert', {
        name: 'Event Alert',
        condition,
        notificationChannels: []
      });
      
      engine.on('alert.triggered', (alert) => {
        expect(alert.ruleName).toBe('Event Alert');
        alertTriggered = true;
      });
      
      engine.sendNotification = jest.fn();
      await engine.evaluateAlertRules();
      
      expect(alertTriggered).toBe(true);
    });
  });

  describe('Monitoring Operations', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should start and stop monitoring', async () => {
      expect(engine.isRunning).toBe(false);
      
      await engine.startMonitoring();
      expect(engine.isRunning).toBe(true);
      expect(engine.monitoringInterval).toBeDefined();
      expect(engine.cleanupInterval).toBeDefined();
      
      await engine.stopMonitoring();
      expect(engine.isRunning).toBe(false);
      expect(engine.monitoringInterval).toBeNull();
      expect(engine.cleanupInterval).toBeNull();
    });

    test('should emit monitoring events', async () => {
      const startHandler = jest.fn();
      const stopHandler = jest.fn();
      
      engine.on('monitoring.started', startHandler);
      engine.on('monitoring.stopped', stopHandler);
      
      await engine.startMonitoring();
      await engine.stopMonitoring();
      
      expect(startHandler).toHaveBeenCalledWith(expect.objectContaining({
        timestamp: expect.any(Date)
      }));
      expect(stopHandler).toHaveBeenCalledWith(expect.objectContaining({
        timestamp: expect.any(Date)
      }));
    });

    test('should handle duplicate start/stop calls', async () => {
      await engine.startMonitoring();
      await engine.startMonitoring(); // Should not cause error
      expect(engine.isRunning).toBe(true);
      
      await engine.stopMonitoring();
      await engine.stopMonitoring(); // Should not cause error
      expect(engine.isRunning).toBe(false);
    });

    test('should require initialization before starting', async () => {
      const newEngine = new MonitoringEngine();
      
      await expect(newEngine.startMonitoring()).rejects.toThrow('must be initialized');
    });
  });

  describe('System Status and Statistics', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should provide comprehensive system status', async () => {
      // Register some components
      await engine.registerComponent('comp1', { name: 'Component 1' });
      await engine.registerComponent('comp2', { name: 'Component 2' });
      
      // Set component statuses
      engine.components.get('comp1').status = 'healthy';
      engine.components.get('comp2').status = 'unhealthy';
      
      // Add some metrics and start monitoring
      engine.recordMetric('test_metric', 100);
      await engine.startMonitoring();
      
      const status = engine.getSystemStatus();
      
      expect(status.timestamp).toBeInstanceOf(Date);
      expect(status.isRunning).toBe(true);
      expect(status.initialized).toBe(true);
      expect(status.uptime).toBeGreaterThan(0);
      expect(status.components.total).toBe(2);
      expect(status.components.healthy).toBe(1);
      expect(status.components.unhealthy).toBe(1);
      expect(status.metrics.total).toBe(1);
      expect(status.integrations.dagster).toBe(false);
      expect(status.integrations.bmad).toBe(true);
    });

    test('should provide monitoring statistics', async () => {
      await engine.registerComponent('test-comp', { name: 'Test Component' });
      engine.components.get('test-comp').status = 'healthy';
      
      // Add health check result
      const healthCheck = engine.healthChecks.get('filesystem');
      healthCheck.lastResult = { healthy: true };
      
      // Add some metrics
      engine.recordMetric('test1', 1);
      engine.recordMetric('test2', 2);
      
      const stats = engine.getMonitoringStats();
      
      expect(stats.components.registered).toBe(1);
      expect(stats.components.healthy).toBe(1);
      expect(stats.healthChecks.total).toBeGreaterThan(0);
      expect(stats.healthChecks.successRate).toMatch(/\d+%/);
      expect(stats.alerts.rules).toBeGreaterThan(0);
      expect(stats.metrics.total).toBe(2);
      expect(stats.integrations.dagster).toBe(false);
      expect(stats.integrations.bmad).toBe(true);
    });
  });

  describe('Data Management and Export', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should export monitoring data', async () => {
      await engine.registerComponent('export-test', { name: 'Export Test' });
      engine.recordMetric('export_metric', 42);
      
      const data = await engine.exportMonitoringData();
      
      expect(data.timestamp).toBeInstanceOf(Date);
      expect(data.systemStatus).toBeDefined();
      expect(data.components).toHaveLength(1);
      expect(data.components[0].name).toBe('Export Test');
      expect(data.recentMetrics).toHaveLength(1);
      expect(data.recentMetrics[0].name).toBe('export_metric');
      expect(data.integrations).toBeDefined();
    });

    test('should export monitoring data to file', async () => {
      const outputFile = path.join(testDataDir, 'export-test.json');
      
      await engine.exportMonitoringData({ outputFile });
      
      expect(await fs.pathExists(outputFile)).toBe(true);
      
      const exportedData = await fs.readJSON(outputFile);
      expect(exportedData.timestamp).toBeDefined();
      expect(exportedData.systemStatus).toBeDefined();
    });

    test('should clean up old data', async () => {
      // Create old alert file
      const alertsDir = path.join(testDataDir, 'alerts');
      await fs.ensureDir(alertsDir);
      
      const oldAlertFile = path.join(alertsDir, 'old-alert.json');
      await fs.writeJSON(oldAlertFile, { id: 'old-alert' });
      
      // Make it appear old
      const oldTime = new Date(Date.now() - 86400000 * 2); // 2 days ago
      await fs.utimes(oldAlertFile, oldTime, oldTime);
      
      engine.options.dataRetentionDays = 1;
      engine.lastCleanup = 0; // Force cleanup
      
      await engine.cleanupOldData();
      
      expect(await fs.pathExists(oldAlertFile)).toBe(false);
    });

    test('should create monitoring configuration file', async () => {
      const configFile = await engine.createMonitoringConfig();
      
      expect(await fs.pathExists(configFile)).toBe(true);
      
      const config = await fs.readFile(configFile, 'utf8');
      expect(config).toContain('monitoring:');
      expect(config).toContain('healthCheckInterval');
      expect(config).toContain('integrations:');
    });
  });

  describe('Integration Features', () => {
    test('should initialize with Dagster integration disabled', async () => {
      engine.options.enableDagsterIntegration = false;
      await engine.initialize();
      
      expect(engine.dagsterIntegration).toBeNull();
      expect(engine.healthChecks.has('dagster')).toBe(false);
    });

    test('should initialize with Dagster integration enabled', async () => {
      engine.options.enableDagsterIntegration = true;
      await engine.initialize();
      
      expect(engine.dagsterIntegration).toBeDefined();
      expect(engine.dagsterIntegration.enabled).toBe(true);
    });

    test('should initialize BMad integration', async () => {
      await engine.initialize();
      
      expect(engine.bmadProgressIntegration).toBeDefined();
      expect(engine.bmadProgressIntegration.enabled).toBe(true);
      expect(engine.bmadProgressIntegration.progressTrackers).toBeInstanceOf(Map);
    });
  });

  describe('Notification System', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should send console notifications', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const alert = {
        id: 'test-alert',
        ruleName: 'Test Alert',
        severity: 'warning',
        timestamp: new Date()
      };
      
      await engine.sendNotification('console', alert);
      
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should write file notifications', async () => {
      const alert = {
        id: 'test-alert',
        ruleName: 'Test Alert',
        severity: 'critical',
        timestamp: new Date()
      };
      
      await engine.sendNotification('file', alert);
      
      const alertFile = path.join(testDataDir, 'alerts', `${alert.timestamp.toISOString().split('T')[0]}.log`);
      expect(await fs.pathExists(alertFile)).toBe(true);
      
      const content = await fs.readFile(alertFile, 'utf8');
      expect(content).toContain('Test Alert');
      expect(content).toContain('CRITICAL');
    });

    test('should handle webhook notifications', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const alert = { id: 'test', ruleName: 'Test', severity: 'info', timestamp: new Date() };
      
      await engine.sendNotification('webhook', alert);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Would send webhook notification')
      );
      consoleSpy.mockRestore();
    });

    test('should handle unknown notification channels', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      const alert = { id: 'test', ruleName: 'Test', severity: 'info', timestamp: new Date() };
      
      await engine.sendNotification('unknown-channel', alert);
      
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Unknown notification channel: unknown-channel')
      );
      consoleSpy.mockRestore();
    });

    test('should store alerts persistently', async () => {
      const alert = {
        id: 'stored-alert',
        ruleName: 'Stored Alert',
        severity: 'info',
        timestamp: new Date()
      };
      
      await engine.storeAlert(alert);
      
      const alertFile = path.join(testDataDir, 'alerts', `alert-${alert.id}.json`);
      expect(await fs.pathExists(alertFile)).toBe(true);
      
      const storedAlert = await fs.readJSON(alertFile);
      expect(storedAlert.id).toBe('stored-alert');
      expect(storedAlert.ruleName).toBe('Stored Alert');
    });
  });

  describe('Default Health Checks Integration', () => {
    beforeEach(async () => {
      await engine.initialize();
    });

    test('should run filesystem health check successfully', async () => {
      const result = await engine.runSingleHealthCheck('filesystem');
      
      expect(result.healthy).toBe(true);
      expect(result.checkId).toBe('filesystem');
      expect(result.name).toBe('File System Access');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details?.access).toBe('read-write');
    });

    test('should run DuckDB health check successfully', async () => {
      const result = await engine.runSingleHealthCheck('duckdb');
      
      expect(result.healthy).toBe(true);
      expect(result.checkId).toBe('duckdb');
      expect(result.name).toBe('DuckDB Connection');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details?.status).toBe('connected');
    });

    test('should run PyAirbyte health check successfully', async () => {
      const result = await engine.runSingleHealthCheck('pyairbyte');
      
      expect(result.healthy).toBe(true);
      expect(result.checkId).toBe('pyairbyte');
      expect(result.name).toBe('PyAirbyte Service');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details?.connectors).toBe('available');
    });

    test('should run Evidence.dev health check successfully', async () => {
      const result = await engine.runSingleHealthCheck('evidence');
      
      expect(result.healthy).toBe(true);
      expect(result.checkId).toBe('evidence');
      expect(result.name).toBe('Evidence.dev Build System');
      expect(result.responseTime).toBeGreaterThan(0);
      expect(result.details?.build).toBe('ready');
    });
  });

  describe('Default Alert Rules Integration', () => {
    beforeEach(async () => {
      await engine.initialize();
      engine.sendNotification = jest.fn(); // Mock notifications for all tests
    });

    test('should trigger component failure alert', async () => {
      // Add unhealthy metric
      engine.recordMetric('health_check', { healthy: false, error: 'Component down' }, 'health');
      
      await engine.evaluateAlertRules();
      
      expect(engine.activeAlerts.size).toBe(1);
      const alert = Array.from(engine.activeAlerts.values())[0];
      expect(alert.severity).toBe('critical');
      expect(alert.ruleName).toBe('Component Failure');
    });

    test('should trigger high error rate alert', async () => {
      // Add high error rate metrics
      engine.recordMetric('error_rate', 0.1, 'error_rate'); // 10% error rate
      engine.recordMetric('error_rate', 0.08, 'error_rate'); // 8% error rate
      
      await engine.evaluateAlertRules();
      
      expect(engine.activeAlerts.size).toBe(1);
      const alert = Array.from(engine.activeAlerts.values())[0];
      expect(alert.severity).toBe('warning');
      expect(alert.ruleName).toBe('High Error Rate');
    });

    test('should trigger performance degradation alert', async () => {
      // Add high response time metrics
      engine.recordMetric('response_time', 6000, 'response_time'); // 6 seconds
      engine.recordMetric('response_time', 7000, 'response_time'); // 7 seconds
      
      await engine.evaluateAlertRules();
      
      expect(engine.activeAlerts.size).toBe(1);
      const alert = Array.from(engine.activeAlerts.values())[0];
      expect(alert.severity).toBe('warning');
      expect(alert.ruleName).toBe('Performance Degradation');
    });

    test('should trigger data quality degradation alert', async () => {
      // Add low data quality metrics
      engine.recordMetric('data_quality', 0.7, 'data_quality_score'); // 70% quality
      engine.recordMetric('data_quality', 0.6, 'data_quality_score'); // 60% quality
      
      await engine.evaluateAlertRules();
      
      expect(engine.activeAlerts.size).toBe(1);
      const alert = Array.from(engine.activeAlerts.values())[0];
      expect(alert.severity).toBe('warning');
      expect(alert.ruleName).toBe('Data Quality Degradation');
    });
  });
});