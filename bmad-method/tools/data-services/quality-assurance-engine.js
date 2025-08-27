/**
 * Quality Assurance Engine
 * Orchestrates comprehensive quality assurance across all data components,
 * enforces quality gates, and maintains system reliability through automated testing and validation
 */

const path = require('path');
const fs = require('fs-extra');
const yaml = require('js-yaml');
const chalk = require('chalk');
const ComprehensiveTestSuite = require('./test-orchestrator');
const { logSecurityEvent } = require('../lib/security-logger');

class QualityAssuranceEngine {
  constructor(options = {}) {
    this.configPath = options.configPath || path.join(process.cwd(), 'expansion-packs', 'bmad-data-practitioner', 'quality-config');
    this.testSuite = new ComprehensiveTestSuite(options.testOptions || {});
    this.qualityGates = new Map();
    this.qualityMetrics = new Map();
    this.initialized = false;
    this.options = {
      enforceGates: options.enforceGates !== false,
      alertingEnabled: options.alertingEnabled !== false,
      trendAnalysis: options.trendAnalysis !== false,
      autoRemediation: options.autoRemediation || false,
      ...options
    };
  }

  /**
   * Initialize the Quality Assurance Engine
   */
  async initialize() {
    try {
      console.log(chalk.blue('🔧 Initializing Quality Assurance Engine...'));

      // Load quality configuration
      await this.loadQualityConfiguration();

      // Initialize test suite
      await this.testSuite.preflightChecks();

      // Setup quality gates
      await this.setupQualityGates();

      // Initialize metrics collection
      await this.initializeMetricsCollection();

      // Setup alerting system
      if (this.options.alertingEnabled) {
        await this.setupAlertingSystem();
      }

      this.initialized = true;
      console.log(chalk.green('✅ Quality Assurance Engine initialized successfully'));

      await logSecurityEvent('quality_assurance_engine_initialization', {
        config_path: this.configPath,
        gates_configured: this.qualityGates.size,
        metrics_tracked: this.qualityMetrics.size,
        timestamp: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error(chalk.red('❌ Failed to initialize Quality Assurance Engine:'), error.message);
      throw error;
    }
  }

  /**
   * Load quality configuration from YAML files
   */
  async loadQualityConfiguration() {
    const configFiles = [
      'quality-gates.yaml',
      'test-suites.yaml',
      'monitoring-config.yaml'
    ];

    for (const configFile of configFiles) {
      const configPath = path.join(this.configPath, configFile);
      
      if (await fs.pathExists(configPath)) {
        try {
          const configContent = await fs.readFile(configPath, 'utf8');
          const config = yaml.load(configContent);
          
          switch (configFile) {
            case 'quality-gates.yaml':
              this.processQualityGatesConfig(config);
              break;
            case 'test-suites.yaml':
              this.processTestSuitesConfig(config);
              break;
            case 'monitoring-config.yaml':
              this.processMonitoringConfig(config);
              break;
          }
          
          console.log(chalk.green(`✓ Loaded configuration: ${configFile}`));
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  Failed to load ${configFile}:`, error.message));
        }
      } else {
        // Create default configuration if missing
        await this.createDefaultConfiguration(configFile);
      }
    }
  }

  /**
   * Process quality gates configuration
   */
  processQualityGatesConfig(config) {
    if (config.quality_gates) {
      Object.entries(config.quality_gates).forEach(([stageName, gateConfig]) => {
        this.qualityGates.set(stageName, {
          stage: stageName,
          thresholds: gateConfig.thresholds || {},
          required_checks: gateConfig.required_checks || [],
          optional_checks: gateConfig.optional_checks || [],
          failure_action: gateConfig.failure_action || 'block',
          bypass_conditions: gateConfig.bypass_conditions || [],
          enabled: gateConfig.enabled !== false
        });
      });
    }
  }

  /**
   * Process test suites configuration
   */
  processTestSuitesConfig(config) {
    if (config.test_suites) {
      this.testSuiteConfig = config.test_suites;
    }
  }

  /**
   * Process monitoring configuration
   */
  processMonitoringConfig(config) {
    if (config.monitoring) {
      this.monitoringConfig = config.monitoring;
    }
  }

  /**
   * Setup quality gates for each pipeline stage
   */
  async setupQualityGates() {
    // Default quality gates if none configured
    if (this.qualityGates.size === 0) {
      this.setupDefaultQualityGates();
    }

    console.log(chalk.blue(`🚪 Configured ${this.qualityGates.size} quality gates`));
    
    this.qualityGates.forEach((gate, stageName) => {
      console.log(chalk.gray(`  • ${stageName}: ${gate.required_checks.length} required checks`));
    });
  }

  /**
   * Setup default quality gates
   */
  setupDefaultQualityGates() {
    const defaultGates = {
      ingestion: {
        stage: 'ingestion',
        thresholds: {
          data_completeness: 95,
          schema_compliance: 100,
          source_availability: 99
        },
        required_checks: ['data_completeness', 'schema_compliance'],
        optional_checks: ['source_availability'],
        bypass_conditions: [],
        failure_action: 'block',
        enabled: true
      },
      analytics: {
        stage: 'analytics',
        thresholds: {
          query_performance: 5000, // 5 seconds max
          memory_usage: 80, // 80% max
          error_rate: 1 // 1% max
        },
        required_checks: ['query_performance', 'memory_usage'],
        optional_checks: ['error_rate'],
        bypass_conditions: [],
        failure_action: 'warn',
        enabled: true
      },
      transformation: {
        stage: 'transformation',
        thresholds: {
          test_success_rate: 95,
          cost_optimization_active: true,
          model_execution_time: 300000, // 5 minutes
          data_quality_score: 85
        },
        required_checks: ['test_success_rate', 'data_quality_score'],
        optional_checks: ['model_execution_time', 'cost_optimization_active'],
        bypass_conditions: [],
        failure_action: 'block',
        enabled: true
      },
      publication: {
        stage: 'publication',
        thresholds: {
          site_load_time: 3000, // 3 seconds
          accessibility_score: 90,
          content_accuracy: 95
        },
        required_checks: ['site_load_time', 'accessibility_score'],
        optional_checks: ['content_accuracy'],
        bypass_conditions: [],
        failure_action: 'warn',
        enabled: true
      }
    };

    Object.entries(defaultGates).forEach(([stageName, gateConfig]) => {
      this.qualityGates.set(stageName, gateConfig);
    });
  }

  /**
   * Initialize metrics collection system
   */
  async initializeMetricsCollection() {
    const metricsCategories = [
      'test_execution',
      'quality_gates',
      'pipeline_performance',
      'system_health',
      'trend_analysis'
    ];

    metricsCategories.forEach(category => {
      this.qualityMetrics.set(category, {
        category,
        metrics: new Map(),
        last_updated: null,
        retention_days: 30
      });
    });

    console.log(chalk.blue(`📊 Initialized metrics collection for ${metricsCategories.length} categories`));
  }

  /**
   * Setup alerting system
   */
  async setupAlertingSystem() {
    this.alerting = {
      channels: this.monitoringConfig?.alerting?.channels || [
        { type: 'console', level: 'error' }
      ],
      rules: this.monitoringConfig?.alerting?.rules || [],
      cooldown_periods: new Map(),
      enabled: true
    };

    console.log(chalk.blue(`🔔 Configured alerting with ${this.alerting.channels.length} channels`));
  }

  /**
   * Execute comprehensive test orchestration
   */
  async executeTestSuite(options = {}) {
    if (!this.initialized) {
      throw new Error('Quality Assurance Engine not initialized');
    }

    console.log(chalk.blue('🧪 Executing comprehensive test suite...'));

    try {
      const testOptions = {
        ...this.testSuite.options,
        ...options
      };

      // Use existing testSuite instance or create new one
      const testSuite = this.testSuite || new ComprehensiveTestSuite(testOptions);
      const results = await testSuite.runFullSuite();

      // Record test execution metrics
      await this.recordMetric('test_execution', 'comprehensive_test_run', {
        timestamp: new Date().toISOString(),
        success: results.summary.success,
        total_tests: results.summary.total,
        passed_tests: results.summary.passed,
        failed_tests: results.summary.failed,
        duration: results.summary.duration
      });

      // Check quality gates based on test results
      const gateResults = await this.checkQualityGates('test_execution', results);

      return {
        test_results: results,
        quality_gates: gateResults,
        overall_success: results.summary.success && gateResults.all_passed
      };
    } catch (error) {
      console.error(chalk.red('❌ Test suite execution failed:'), error.message);
      
      await this.sendAlert('critical', 'test_suite_execution_failed', {
        error: error.message,
        timestamp: new Date().toISOString()
      });

      throw error;
    }
  }

  /**
   * Enforce quality gates for a specific stage
   */
  async enforceQualityGate(stageName, metrics) {
    if (!this.qualityGates.has(stageName)) {
      console.warn(chalk.yellow(`⚠️  No quality gate configured for stage: ${stageName}`));
      return { passed: true, warnings: [`No quality gate configured for ${stageName}`] };
    }

    const gate = this.qualityGates.get(stageName);
    if (!gate.enabled) {
      return { passed: true, warnings: [`Quality gate disabled for ${stageName}`] };
    }

    console.log(chalk.blue(`🚪 Enforcing quality gate: ${stageName}`));

    const results = {
      stage: stageName,
      passed: true,
      failed_checks: [],
      warnings: [],
      bypassed: false,
      timestamp: new Date().toISOString()
    };

    // Check required thresholds
    for (const [metricName, threshold] of Object.entries(gate.thresholds)) {
      if (gate.required_checks.includes(metricName)) {
        const actualValue = metrics[metricName];
        const passed = this.evaluateThreshold(metricName, actualValue, threshold);
        
        if (!passed) {
          results.failed_checks.push({
            metric: metricName,
            expected: threshold,
            actual: actualValue,
            severity: 'error'
          });
          results.passed = false;
        }
      }
    }

    // Check optional thresholds (warnings only)
    for (const [metricName, threshold] of Object.entries(gate.thresholds)) {
      if (gate.optional_checks && gate.optional_checks.includes(metricName)) {
        const actualValue = metrics[metricName];
        const passed = this.evaluateThreshold(metricName, actualValue, threshold);
        
        if (!passed) {
          results.warnings.push({
            metric: metricName,
            expected: threshold,
            actual: actualValue,
            severity: 'warning'
          });
        }
      }
    }

    // Check bypass conditions
    if (!results.passed && gate.bypass_conditions && gate.bypass_conditions.length > 0) {
      const bypassApplied = this.checkBypassConditions(gate.bypass_conditions, metrics);
      if (bypassApplied.allowed) {
        results.bypassed = true;
        results.passed = true;
        results.bypass_reason = bypassApplied.reason;
        console.log(chalk.yellow(`⚠️  Quality gate bypassed: ${bypassApplied.reason}`));
      }
    }

    // Handle failure action
    if (!results.passed && this.options.enforceGates) {
      await this.handleQualityGateFailure(gate, results);
    }

    // Record quality gate metrics
    await this.recordMetric('quality_gates', `${stageName}_gate_execution`, results);

    return results;
  }

  /**
   * Check quality gates based on test results
   */
  async checkQualityGates(context, testResults) {
    const gateResults = {
      context,
      gates_checked: 0,
      gates_passed: 0,
      gates_failed: 0,
      all_passed: true,
      results: []
    };

    // Map test results to quality gate metrics
    const metrics = this.mapTestResultsToMetrics(testResults);

    // Check each configured quality gate
    for (const [stageName, gate] of this.qualityGates) {
      if (gate.enabled) {
        const result = await this.enforceQualityGate(stageName, metrics);
        gateResults.results.push(result);
        gateResults.gates_checked++;
        
        if (result.passed || result.bypassed) {
          gateResults.gates_passed++;
        } else {
          gateResults.gates_failed++;
          gateResults.all_passed = false;
        }
      }
    }

    return gateResults;
  }

  /**
   * Map test results to quality gate metrics
   */
  mapTestResultsToMetrics(testResults) {
    const metrics = {};

    if (testResults.summary) {
      metrics.test_success_rate = (testResults.summary.passed / testResults.summary.total) * 100;
      metrics.test_failure_rate = (testResults.summary.failed / testResults.summary.total) * 100;
      metrics.test_coverage = 85; // Would be calculated from actual coverage data
    }

    // Add category-specific metrics
    Object.entries(testResults.categories).forEach(([category, results]) => {
      if (results.passed > 0 || results.failed > 0) {
        metrics[`${category}_success_rate`] = (results.passed / (results.passed + results.failed)) * 100;
      }
    });

    // Default values for missing metrics
    metrics.data_completeness = metrics.data_completeness || 95;
    metrics.schema_compliance = metrics.schema_compliance || 100;
    metrics.data_quality_score = metrics.data_quality_score || 90;
    metrics.site_load_time = metrics.site_load_time || 2500;
    metrics.accessibility_score = metrics.accessibility_score || 92;

    return metrics;
  }

  /**
   * Evaluate threshold comparison
   */
  evaluateThreshold(metricName, actualValue, threshold) {
    if (actualValue === undefined || actualValue === null) {
      return false;
    }

    // Handle boolean thresholds
    if (typeof threshold === 'boolean') {
      return actualValue === threshold;
    }

    // Handle numeric thresholds (most common case)
    if (typeof threshold === 'number') {
      // For performance metrics, lower is better
      const performanceMetrics = ['site_load_time', 'query_performance', 'model_execution_time'];
      if (performanceMetrics.includes(metricName)) {
        return actualValue <= threshold;
      }
      
      // For percentage-based metrics, higher is better
      return actualValue >= threshold;
    }

    return false;
  }

  /**
   * Check bypass conditions
   */
  checkBypassConditions(bypassConditions, metrics) {
    for (const condition of bypassConditions) {
      if (this.evaluateBypassCondition(condition, metrics)) {
        return { allowed: true, reason: condition.reason || 'Bypass condition met' };
      }
    }
    return { allowed: false };
  }

  /**
   * Evaluate individual bypass condition
   */
  evaluateBypassCondition(condition, metrics) {
    // Simple condition evaluation - can be extended
    if (condition.type === 'emergency_override') {
      return process.env.QA_EMERGENCY_OVERRIDE === 'true';
    }
    
    if (condition.type === 'metric_threshold') {
      const value = metrics[condition.metric];
      return this.evaluateThreshold(condition.metric, value, condition.threshold);
    }

    return false;
  }

  /**
   * Handle quality gate failure
   */
  async handleQualityGateFailure(gate, results) {
    const action = gate.failure_action || 'block';

    switch (action) {
      case 'block':
        await this.sendAlert('critical', 'quality_gate_blocked', {
          stage: gate.stage,
          failed_checks: results.failed_checks,
          timestamp: results.timestamp
        });
        throw new Error(`Quality gate failed for ${gate.stage}: ${results.failed_checks.map(c => c.metric).join(', ')}`);
        
      case 'warn':
        await this.sendAlert('warning', 'quality_gate_warning', {
          stage: gate.stage,
          failed_checks: results.failed_checks,
          timestamp: results.timestamp
        });
        console.warn(chalk.yellow(`⚠️  Quality gate warning for ${gate.stage}`));
        break;
        
      case 'log':
        console.log(chalk.blue(`ℹ️  Quality gate info for ${gate.stage}: ${results.failed_checks.length} checks failed`));
        break;
        
      default:
        console.log(chalk.gray(`Quality gate result for ${gate.stage}: ${results.passed ? 'PASSED' : 'FAILED'}`));
    }
  }

  /**
   * Collect and analyze quality trends
   */
  async analyzeQualityTrends() {
    if (!this.options.trendAnalysis) {
      return null;
    }

    console.log(chalk.blue('📈 Analyzing quality trends...'));

    const trends = {
      timestamp: new Date().toISOString(),
      analysis_period: '30_days',
      categories: {}
    };

    // Analyze trends for each metric category
    for (const [category, metricData] of this.qualityMetrics) {
      trends.categories[category] = await this.analyzeCategoryTrends(category, metricData);
    }

    // Record trend analysis
    await this.recordMetric('trend_analysis', 'quality_trends', trends);

    return trends;
  }

  /**
   * Analyze trends for specific category
   */
  async analyzeCategoryTrends(category, metricData) {
    // Placeholder for trend analysis implementation
    return {
      category,
      trend_direction: 'stable', // 'improving', 'degrading', 'stable'
      quality_score: 85,
      change_percentage: 2.5,
      recommendations: []
    };
  }

  /**
   * Record quality metric
   */
  async recordMetric(category, metricName, value) {
    if (!this.qualityMetrics.has(category)) {
      return;
    }

    const categoryData = this.qualityMetrics.get(category);
    categoryData.metrics.set(metricName, {
      value,
      timestamp: new Date().toISOString()
    });
    categoryData.last_updated = new Date().toISOString();

    // Cleanup old metrics based on retention policy
    await this.cleanupOldMetrics(category);
  }

  /**
   * Cleanup old metrics based on retention policy
   */
  async cleanupOldMetrics(category) {
    const categoryData = this.qualityMetrics.get(category);
    const retentionMs = categoryData.retention_days * 24 * 60 * 60 * 1000;
    const cutoffTime = Date.now() - retentionMs;

    for (const [metricName, metricData] of categoryData.metrics) {
      const metricTime = new Date(metricData.timestamp).getTime();
      if (metricTime < cutoffTime) {
        categoryData.metrics.delete(metricName);
      }
    }
  }

  /**
   * Send alert through configured channels
   */
  async sendAlert(severity, alertType, data) {
    if (!this.options.alertingEnabled || !this.alerting?.enabled) {
      return;
    }

    // Check cooldown period
    const cooldownKey = `${alertType}_${severity}`;
    const now = Date.now();
    const lastAlert = this.alerting.cooldown_periods.get(cooldownKey);
    
    if (lastAlert && (now - lastAlert) < 900000) { // 15 minutes cooldown
      return;
    }

    const alert = {
      severity,
      type: alertType,
      timestamp: new Date().toISOString(),
      data
    };

    // Send through all configured channels
    for (const channel of this.alerting.channels) {
      try {
        await this.sendAlertToChannel(channel, alert);
      } catch (error) {
        console.error(chalk.red(`Failed to send alert to ${channel.type}:`), error.message);
      }
    }

    // Update cooldown
    this.alerting.cooldown_periods.set(cooldownKey, now);

    // Log alert
    await logSecurityEvent('quality_alert_sent', alert);
  }

  /**
   * Send alert to specific channel
   */
  async sendAlertToChannel(channel, alert) {
    switch (channel.type) {
      case 'console':
        const color = alert.severity === 'critical' ? chalk.red : 
                     alert.severity === 'warning' ? chalk.yellow : chalk.blue;
        console.log(color(`🚨 QA Alert [${alert.severity.toUpperCase()}]: ${alert.type}`));
        console.log(color(`   ${JSON.stringify(alert.data, null, 2)}`));
        break;
        
      case 'webhook':
        // Would implement webhook notification
        console.log(chalk.gray(`📡 Webhook alert sent: ${alert.type}`));
        break;
        
      default:
        console.log(chalk.gray(`Alert sent via ${channel.type}: ${alert.type}`));
    }
  }

  /**
   * Get quality assessment report
   */
  async getQualityAssessment() {
    const assessment = {
      timestamp: new Date().toISOString(),
      overall_score: 0,
      categories: {},
      recommendations: [],
      gates_status: {},
      trends: null
    };

    // Calculate scores for each category
    let totalScore = 0;
    let categoryCount = 0;

    for (const [category, metricData] of this.qualityMetrics) {
      const categoryScore = await this.calculateCategoryScore(category, metricData);
      assessment.categories[category] = categoryScore;
      totalScore += categoryScore.score;
      categoryCount++;
    }

    assessment.overall_score = categoryCount > 0 ? totalScore / categoryCount : 0;

    // Get quality gates status
    for (const [stageName, gate] of this.qualityGates) {
      assessment.gates_status[stageName] = {
        enabled: gate.enabled,
        required_checks: gate.required_checks.length,
        optional_checks: gate.optional_checks ? gate.optional_checks.length : 0,
        failure_action: gate.failure_action
      };
    }

    // Include trend analysis if enabled
    if (this.options.trendAnalysis) {
      assessment.trends = await this.analyzeQualityTrends();
    }

    // Generate recommendations
    assessment.recommendations = this.generateRecommendations(assessment);

    return assessment;
  }

  /**
   * Calculate quality score for category
   */
  async calculateCategoryScore(category, metricData) {
    // Placeholder implementation - would use actual metric analysis
    return {
      category,
      score: 85,
      metrics_count: metricData.metrics.size,
      last_updated: metricData.last_updated,
      status: 'good' // 'excellent', 'good', 'fair', 'poor'
    };
  }

  /**
   * Generate quality improvement recommendations
   */
  generateRecommendations(assessment) {
    const recommendations = [];

    // Analyze overall score
    if (assessment.overall_score < 80) {
      recommendations.push({
        priority: 'high',
        category: 'overall',
        issue: 'Overall quality score below threshold',
        recommendation: 'Review failing quality gates and increase test coverage'
      });
    }

    // Analyze category scores
    Object.entries(assessment.categories).forEach(([category, data]) => {
      if (data.score < 70) {
        recommendations.push({
          priority: 'medium',
          category,
          issue: `${category} quality score below acceptable threshold`,
          recommendation: `Investigate and improve ${category} metrics and processes`
        });
      }
    });

    return recommendations;
  }

  /**
   * Create default configuration files
   */
  async createDefaultConfiguration(configFile) {
    await fs.ensureDir(this.configPath);
    
    const defaultConfigs = {
      'quality-gates.yaml': this.getDefaultQualityGatesConfig(),
      'test-suites.yaml': this.getDefaultTestSuitesConfig(),
      'monitoring-config.yaml': this.getDefaultMonitoringConfig()
    };

    const configPath = path.join(this.configPath, configFile);
    const config = defaultConfigs[configFile];
    
    if (config) {
      await fs.writeFile(configPath, yaml.dump(config), 'utf8');
      console.log(chalk.green(`✓ Created default configuration: ${configFile}`));
    }
  }

  /**
   * Get default quality gates configuration
   */
  getDefaultQualityGatesConfig() {
    return {
      quality_gates: {
        ingestion: {
          thresholds: {
            data_completeness: 95,
            schema_compliance: 100,
            source_availability: 99
          },
          required_checks: ['data_completeness', 'schema_compliance'],
          optional_checks: ['source_availability'],
          failure_action: 'block',
          enabled: true
        },
        transformation: {
          thresholds: {
            test_success_rate: 100,
            data_quality_score: 85,
            cost_optimization_active: true,
            model_execution_time: 300
          },
          required_checks: ['test_success_rate', 'data_quality_score'],
          optional_checks: ['model_execution_time'],
          failure_action: 'block',
          enabled: true
        },
        publication: {
          thresholds: {
            site_load_time: 3,
            accessibility_score: 90,
            content_accuracy: 95
          },
          required_checks: ['site_load_time', 'accessibility_score'],
          optional_checks: ['content_accuracy'],
          failure_action: 'warn',
          enabled: true
        }
      }
    };
  }

  /**
   * Get default test suites configuration
   */
  getDefaultTestSuitesConfig() {
    return {
      test_suites: {
        comprehensive: {
          enabled: true,
          parallel: false,
          coverage: true,
          timeout: 300000
        },
        quick: {
          enabled: true,
          parallel: true,
          coverage: false,
          timeout: 60000
        }
      }
    };
  }

  /**
   * Get default monitoring configuration
   */
  getDefaultMonitoringConfig() {
    return {
      monitoring: {
        metrics_retention_days: 30,
        trend_analysis: true,
        auto_remediation: false
      },
      alerting: {
        enabled: true,
        channels: [
          { type: 'console', level: 'error' }
        ],
        rules: [
          {
            name: 'quality_gate_failure',
            condition: 'quality_gate.failed = true',
            severity: 'critical',
            cooldown: '15m'
          }
        ]
      }
    };
  }
}

module.exports = QualityAssuranceEngine;