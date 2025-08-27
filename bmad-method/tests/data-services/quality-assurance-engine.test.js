/**
 * Quality Assurance Engine Tests
 */

const path = require('path');
const fs = require('fs-extra');
const QualityAssuranceEngine = require('../../tools/data-services/quality-assurance-engine');

// Mock dependencies
jest.mock('../../tools/data-services/test-orchestrator');
jest.mock('../lib/security-logger', () => ({
  logger: {
    logSecurityEvent: jest.fn().mockResolvedValue(true)
  }
}), { virtual: true });

describe('Quality Assurance Engine', () => {
  let qaEngine;
  let tempConfigPath;

  beforeEach(async () => {
    tempConfigPath = path.join(__dirname, '../fixtures/temp/qa-config');
    await fs.ensureDir(tempConfigPath);
    
    qaEngine = new QualityAssuranceEngine({
      configPath: tempConfigPath,
      testOptions: { coverage: false }
    });
  });

  afterEach(async () => {
    if (await fs.pathExists(tempConfigPath)) {
      await fs.remove(tempConfigPath);
    }
  });

  describe('Initialization', () => {
    test('should initialize with default options', () => {
      const engine = new QualityAssuranceEngine();
      expect(engine.options.enforceGates).toBe(true);
      expect(engine.options.alertingEnabled).toBe(true);
      expect(engine.options.trendAnalysis).toBe(true);
      expect(engine.initialized).toBe(false);
    });

    test('should initialize with custom options', () => {
      const engine = new QualityAssuranceEngine({
        enforceGates: false,
        alertingEnabled: false,
        trendAnalysis: true,
        autoRemediation: true
      });
      expect(engine.options.enforceGates).toBe(false);
      expect(engine.options.alertingEnabled).toBe(false);
      expect(engine.options.trendAnalysis).toBe(true);
      expect(engine.options.autoRemediation).toBe(true);
    });

    test('should initialize successfully', async () => {
      const mockTestSuite = {
        preflightChecks: jest.fn().mockResolvedValue(true)
      };
      qaEngine.testSuite = mockTestSuite;

      await qaEngine.initialize();
      
      expect(qaEngine.initialized).toBe(true);
      expect(mockTestSuite.preflightChecks).toHaveBeenCalled();
    });
  });

  describe('Configuration Management', () => {
    test('should create default configuration files', async () => {
      await qaEngine.createDefaultConfiguration('quality-gates.yaml');
      
      const configPath = path.join(tempConfigPath, 'quality-gates.yaml');
      expect(await fs.pathExists(configPath)).toBe(true);
      
      const content = await fs.readFile(configPath, 'utf8');
      expect(content).toContain('quality_gates');
    });

    test('should load existing configuration', async () => {
      // Create test config
      const testConfig = {
        quality_gates: {
          test_stage: {
            thresholds: { test_metric: 90 },
            required_checks: ['test_metric'],
            enabled: true
          }
        }
      };
      
      const configPath = path.join(tempConfigPath, 'quality-gates.yaml');
      await fs.writeFile(configPath, 'quality_gates:\n  test_stage:\n    thresholds:\n      test_metric: 90\n    required_checks: [test_metric]\n    enabled: true\n');

      await qaEngine.loadQualityConfiguration();
      
      expect(qaEngine.qualityGates.has('test_stage')).toBe(true);
      expect(qaEngine.qualityGates.get('test_stage').thresholds.test_metric).toBe(90);
    });

    test('should setup default quality gates when none configured', async () => {
      await qaEngine.setupQualityGates();
      
      expect(qaEngine.qualityGates.size).toBeGreaterThan(0);
      expect(qaEngine.qualityGates.has('ingestion')).toBe(true);
      expect(qaEngine.qualityGates.has('transformation')).toBe(true);
      expect(qaEngine.qualityGates.has('publication')).toBe(true);
    });
  });

  describe('Quality Gates', () => {
    beforeEach(async () => {
      await qaEngine.setupQualityGates();
    });

    test('should enforce quality gate with passing metrics', async () => {
      const metrics = {
        data_completeness: 98,
        schema_compliance: 100,
        source_availability: 99
      };

      const result = await qaEngine.enforceQualityGate('ingestion', metrics);
      
      expect(result.passed).toBe(true);
      expect(result.failed_checks).toHaveLength(0);
      expect(result.stage).toBe('ingestion');
    });

    test('should enforce quality gate with failing metrics', async () => {
      const metrics = {
        data_completeness: 80, // Below threshold of 95
        schema_compliance: 100
      };

      qaEngine.options.enforceGates = false; // Prevent throwing

      const result = await qaEngine.enforceQualityGate('ingestion', metrics);
      
      expect(result.passed).toBe(false);
      expect(result.failed_checks.length).toBeGreaterThan(0);
      expect(result.failed_checks[0].metric).toBe('data_completeness');
      expect(result.failed_checks[0].expected).toBe(95);
      expect(result.failed_checks[0].actual).toBe(80);
    });

    test('should handle missing quality gate gracefully', async () => {
      const result = await qaEngine.enforceQualityGate('nonexistent_stage', {});
      
      expect(result.passed).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('No quality gate configured');
    });

    test('should handle disabled quality gate', async () => {
      qaEngine.qualityGates.get('ingestion').enabled = false;
      
      const result = await qaEngine.enforceQualityGate('ingestion', {});
      
      expect(result.passed).toBe(true);
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0]).toContain('disabled');
    });
  });

  describe('Test Suite Orchestration', () => {
    test('should execute comprehensive test suite', async () => {
      const mockResults = {
        summary: {
          success: true,
          total: 100,
          passed: 95,
          failed: 5,
          duration: '45.2s'
        },
        categories: {
          unit: { passed: 50, failed: 2 },
          integration: { passed: 30, failed: 1 },
          performance: { passed: 15, failed: 2 }
        }
      };

      const mockTestSuite = {
        runFullSuite: jest.fn().mockResolvedValue(mockResults),
        options: {}
      };

      qaEngine.testSuite = mockTestSuite;
      qaEngine.initialized = true;
      await qaEngine.setupQualityGates();

      const result = await qaEngine.executeTestSuite();

      expect(result.test_results).toEqual(mockResults);
      expect(result.quality_gates).toBeDefined();
      expect(result.overall_success).toBeDefined();
    });
  });

  describe('Threshold Evaluation', () => {
    test('should evaluate numeric thresholds correctly', () => {
      // Percentage-based metrics (higher is better)
      expect(qaEngine.evaluateThreshold('data_completeness', 95, 90)).toBe(true);
      expect(qaEngine.evaluateThreshold('data_completeness', 85, 90)).toBe(false);

      // Performance metrics (lower is better)  
      expect(qaEngine.evaluateThreshold('site_load_time', 2000, 3000)).toBe(true);
      expect(qaEngine.evaluateThreshold('site_load_time', 4000, 3000)).toBe(false);
    });

    test('should evaluate boolean thresholds correctly', () => {
      expect(qaEngine.evaluateThreshold('feature_enabled', true, true)).toBe(true);
      expect(qaEngine.evaluateThreshold('feature_enabled', false, true)).toBe(false);
    });

    test('should handle undefined/null values', () => {
      expect(qaEngine.evaluateThreshold('missing_metric', undefined, 90)).toBe(false);
      expect(qaEngine.evaluateThreshold('missing_metric', null, 90)).toBe(false);
    });
  });

  describe('Metrics Collection', () => {
    beforeEach(async () => {
      await qaEngine.initializeMetricsCollection();
    });

    test('should initialize metrics collection', () => {
      expect(qaEngine.qualityMetrics.size).toBeGreaterThan(0);
      expect(qaEngine.qualityMetrics.has('test_execution')).toBe(true);
      expect(qaEngine.qualityMetrics.has('quality_gates')).toBe(true);
    });

    test('should record metrics correctly', async () => {
      const testMetric = {
        timestamp: new Date().toISOString(),
        value: 95,
        category: 'test'
      };

      await qaEngine.recordMetric('test_execution', 'sample_metric', testMetric);

      const categoryData = qaEngine.qualityMetrics.get('test_execution');
      expect(categoryData.metrics.has('sample_metric')).toBe(true);
      expect(categoryData.metrics.get('sample_metric').value).toEqual(testMetric);
    });
  });

  describe('Alerting System', () => {
    beforeEach(async () => {
      await qaEngine.setupAlertingSystem();
    });

    test('should setup alerting system', () => {
      expect(qaEngine.alerting).toBeDefined();
      expect(qaEngine.alerting.enabled).toBe(true);
      expect(qaEngine.alerting.channels).toBeDefined();
    });

    test('should send alert through console channel', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await qaEngine.sendAlert('warning', 'test_alert', { message: 'Test alert' });

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should respect cooldown periods', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Send first alert
      await qaEngine.sendAlert('warning', 'test_alert', { message: 'First alert' });
      
      // Send second alert immediately (should be blocked)
      await qaEngine.sendAlert('warning', 'test_alert', { message: 'Second alert' });

      // Should only be called twice (once for main message, once for data) due to cooldown
      expect(consoleSpy).toHaveBeenCalledTimes(2);
      consoleSpy.mockRestore();
    });
  });

  describe('Quality Assessment', () => {
    test('should generate quality assessment report', async () => {
      qaEngine.initialized = true;
      await qaEngine.initializeMetricsCollection();
      await qaEngine.setupQualityGates();

      const assessment = await qaEngine.getQualityAssessment();

      expect(assessment).toBeDefined();
      expect(assessment.timestamp).toBeDefined();
      expect(assessment.overall_score).toBeDefined();
      expect(assessment.categories).toBeDefined();
      expect(assessment.gates_status).toBeDefined();
      expect(assessment.recommendations).toBeDefined();
    });

    test('should generate recommendations based on scores', () => {
      const lowScoreAssessment = {
        overall_score: 75,
        categories: {
          test_execution: { score: 60 },
          quality_gates: { score: 80 }
        }
      };

      const recommendations = qaEngine.generateRecommendations(lowScoreAssessment);

      expect(recommendations.length).toBeGreaterThan(0);
      expect(recommendations.some(r => r.priority === 'high')).toBe(true);
      expect(recommendations.some(r => r.category === 'test_execution')).toBe(true);
    });
  });

  describe('Trend Analysis', () => {
    test('should analyze quality trends when enabled', async () => {
      qaEngine.options.trendAnalysis = true;
      await qaEngine.initializeMetricsCollection();

      const trends = await qaEngine.analyzeQualityTrends();

      expect(trends).toBeDefined();
      expect(trends.timestamp).toBeDefined();
      expect(trends.analysis_period).toBeDefined();
      expect(trends.categories).toBeDefined();
    });

    test('should skip trend analysis when disabled', async () => {
      qaEngine.options.trendAnalysis = false;

      const trends = await qaEngine.analyzeQualityTrends();

      expect(trends).toBeNull();
    });
  });

  describe('Error Handling', () => {
    test('should throw error when executing tests without initialization', async () => {
      qaEngine.initialized = false;

      await expect(qaEngine.executeTestSuite()).rejects.toThrow('Quality Assurance Engine not initialized');
    });

    test('should handle test suite execution errors', async () => {
      const mockTestSuite = {
        runFullSuite: jest.fn().mockRejectedValue(new Error('Test suite failed'))
      };

      qaEngine.testSuite = mockTestSuite;
      qaEngine.initialized = true;
      qaEngine.options.alertingEnabled = false; // Disable alerting for test

      await expect(qaEngine.executeTestSuite()).rejects.toThrow('Test suite failed');
    });
  });
});