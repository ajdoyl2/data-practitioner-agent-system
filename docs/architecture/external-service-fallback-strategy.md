# External Service Fallback Strategy

## Overview

This document defines comprehensive fallback strategies for all external services in the Data Practitioner Agent System. It provides specific implementations, monitoring approaches, and recovery procedures to ensure system resilience when external dependencies fail.

## Philosophy & Principles

### Circuit Breaker Pattern
- **Closed State**: Normal operation, requests flow to external service
- **Open State**: Service failure detected, requests routed to fallback
- **Half-Open State**: Periodic health checks to detect service recovery

### Graceful Degradation Levels
1. **Level 1**: Retry with exponential backoff
2. **Level 2**: Switch to alternative service provider
3. **Level 3**: Local fallback implementation  
4. **Level 4**: Manual operation mode with user notification

## Service-Specific Fallback Implementations

### 1. PyAirbyte Connector Fallbacks

**Primary Service**: PyAirbyte connectors for data ingestion  
**Criticality**: HIGH - Core data pipeline functionality

#### Fallback Strategy
```javascript
// tools/data-services/ingestion-fallback-manager.js
class IngestionFallbackManager {
  constructor() {
    this.circuitBreaker = new CircuitBreaker({
      timeout: 30000,
      errorThreshold: 5,
      resetTimeout: 60000
    });
  }

  async ingestData(source, options) {
    try {
      return await this.circuitBreaker.execute(() => 
        this.pyairbyteConnector.ingest(source, options)
      );
    } catch (error) {
      return await this.executeFallbackStrategy(source, options, error);
    }
  }

  async executeFallbackStrategy(source, options, error) {
    const strategy = this.determineFallbackLevel(error);
    
    switch (strategy) {
      case 'ALTERNATIVE_CONNECTOR':
        return await this.useAlternativeConnector(source, options);
      case 'LOCAL_FILE_UPLOAD':
        return await this.enableLocalFileUpload(source, options);
      case 'MANUAL_INGESTION':
        return await this.requestManualIngestion(source, options);
      default:
        throw new IngestionFallbackError('All fallback strategies exhausted', error);
    }
  }

  async useAlternativeConnector(source, options) {
    // Try alternative connectors in priority order
    const alternatives = this.getAlternativeConnectors(source.type);
    
    for (const connector of alternatives) {
      try {
        console.log(`Attempting fallback connector: ${connector.name}`);
        return await connector.ingest(source, options);
      } catch (fallbackError) {
        console.warn(`Fallback connector ${connector.name} failed:`, fallbackError);
      }
    }
    
    // All alternatives failed, proceed to next fallback level
    return await this.enableLocalFileUpload(source, options);
  }

  async enableLocalFileUpload(source, options) {
    // Enable local file upload interface
    const uploadInterface = new LocalFileUploadInterface({
      acceptedFormats: ['csv', 'json', 'parquet', 'xlsx'],
      maxFileSize: '100MB',
      validationRules: this.getValidationRules(source.type)
    });

    // Create fallback ingestion record
    await this.createFallbackRecord({
      sourceId: source.id,
      fallbackType: 'LOCAL_FILE_UPLOAD',
      timestamp: new Date(),
      instructions: uploadInterface.generateUserInstructions()
    });

    return {
      fallback: true,
      method: 'LOCAL_FILE_UPLOAD',
      uploadInterface: uploadInterface.getEndpoint(),
      instructions: uploadInterface.generateUserInstructions()
    };
  }

  getAlternativeConnectors(sourceType) {
    const connectorMap = {
      'postgresql': [
        { name: 'node-postgres', connector: this.nodePostgresConnector },
        { name: 'pg-dump', connector: this.pgDumpConnector }
      ],
      'mysql': [
        { name: 'mysql2', connector: this.mysql2Connector },
        { name: 'mysqldump', connector: this.mysqlDumpConnector }
      ],
      'rest-api': [
        { name: 'axios-direct', connector: this.axiosConnector },
        { name: 'curl-fallback', connector: this.curlConnector }
      ]
    };
    
    return connectorMap[sourceType] || [];
  }
}
```

#### Health Check Configuration
```yaml
# config/health-checks.yaml
pyairbyte:
  endpoint: "health"
  timeout: 10000
  interval: 30000
  failure_threshold: 3
  recovery_threshold: 2
  alerts:
    - type: "circuit_breaker_open"
      channels: ["slack", "email"]
    - type: "fallback_activated" 
      channels: ["slack"]
```

### 2. LLM Provider Failover Chain

**Primary Service**: LLM providers (OpenAI, Anthropic, Google) for hypothesis generation  
**Criticality**: MEDIUM - Analysis enhancement functionality

#### Provider Chain Implementation
```javascript
// tools/data-services/llm-provider-manager.js
class LLMProviderManager {
  constructor() {
    this.providers = [
      { name: 'openai', client: new OpenAIClient(), priority: 1, cost: 'high' },
      { name: 'anthropic', client: new AnthropicClient(), priority: 2, cost: 'high' },
      { name: 'google', client: new GoogleClient(), priority: 3, cost: 'medium' },
      { name: 'local-llama', client: new LocalLlamaClient(), priority: 4, cost: 'free' },
      { name: 'manual-input', client: new ManualInputClient(), priority: 5, cost: 'free' }
    ];
    
    this.circuitBreakers = new Map();
    this.initializeCircuitBreakers();
  }

  async generateHypothesis(analysisContext, options = {}) {
    for (const provider of this.getAvailableProviders(options)) {
      try {
        const result = await this.attemptGeneration(provider, analysisContext, options);
        if (result.success) {
          await this.recordSuccessfulGeneration(provider, result);
          return result;
        }
      } catch (error) {
        await this.recordProviderFailure(provider, error);
        continue; // Try next provider
      }
    }

    // All providers failed, use manual input fallback
    return await this.requestManualHypothesis(analysisContext, options);
  }

  async attemptGeneration(provider, context, options) {
    const circuitBreaker = this.circuitBreakers.get(provider.name);
    
    return await circuitBreaker.execute(async () => {
      const startTime = Date.now();
      
      const prompt = this.buildPrompt(context, provider.capabilities);
      const result = await provider.client.generate(prompt, {
        maxTokens: options.maxTokens || 2000,
        temperature: options.temperature || 0.7,
        timeout: options.timeout || 30000
      });

      const duration = Date.now() - startTime;
      
      return {
        success: true,
        provider: provider.name,
        hypotheses: this.parseHypotheses(result.text),
        confidence: result.confidence || 0.8,
        duration,
        cost: this.estimateCost(provider, result.tokens)
      };
    });
  }

  async requestManualHypothesis(context, options) {
    const manualInterface = new ManualHypothesisInterface({
      context: this.formatContextForHuman(context),
      suggestedHypotheses: this.generateBasicHypotheses(context),
      deadline: options.deadline || '24 hours'
    });

    await this.createManualTask({
      type: 'HYPOTHESIS_GENERATION',
      context: context,
      interface: manualInterface.getEndpoint(),
      priority: options.priority || 'medium',
      assignedTo: options.assignedAnalyst || 'auto-assign'
    });

    return {
      fallback: true,
      method: 'MANUAL_INPUT',
      taskId: manualInterface.taskId,
      instructions: manualInterface.generateUserInstructions(),
      estimatedCompletion: manualInterface.getEstimatedCompletion()
    };
  }

  generateBasicHypotheses(context) {
    // Generate simple statistical hypotheses without LLM
    const basicPatterns = [
      'Correlation between variables may exist',
      'Seasonal patterns may be present',
      'Outliers may indicate data quality issues',
      'Missing values may follow a pattern'
    ];

    return basicPatterns.map(pattern => ({
      hypothesis: pattern,
      confidence: 0.3,
      source: 'rule-based-fallback'
    }));
  }
}
```

### 3. Evidence.dev Publication Fallbacks

**Primary Service**: Evidence.dev for publication-quality reporting  
**Criticality**: LOW - Enhancement functionality

#### Static Generation Fallback
```javascript
// tools/data-services/publication-fallback-manager.js
class PublicationFallbackManager {
  constructor() {
    this.templates = {
      'pew-research': new PewResearchTemplate(),
      'basic-report': new BasicReportTemplate(),
      'data-summary': new DataSummaryTemplate()
    };
  }

  async generatePublication(analysisResults, options) {
    try {
      return await this.evidenceGenerator.generate(analysisResults, options);
    } catch (error) {
      console.warn('Evidence.dev unavailable, using fallback generation', error);
      return await this.generateStaticFallback(analysisResults, options);
    }
  }

  async generateStaticFallback(analysisResults, options) {
    const template = this.templates[options.template || 'basic-report'];
    
    // Generate static HTML report
    const htmlReport = await template.generateHTML({
      title: options.title || 'Data Analysis Report',
      data: analysisResults,
      visualizations: await this.generateStaticCharts(analysisResults),
      narrative: await this.generateFallbackNarrative(analysisResults)
    });

    // Generate PDF version
    const pdfReport = await this.generatePDF(htmlReport, options);

    // Generate CSV data exports
    const csvExports = await this.generateCSVExports(analysisResults);

    return {
      fallback: true,
      method: 'STATIC_GENERATION',
      formats: {
        html: htmlReport.path,
        pdf: pdfReport.path,
        csv: csvExports.paths
      },
      limitations: [
        'No interactive visualizations',
        'Static data only - no real-time updates',
        'Limited styling options'
      ]
    };
  }

  async generateStaticCharts(analysisResults) {
    // Use D3.js or Chart.js for static chart generation
    const chartGenerator = new StaticChartGenerator({
      width: 800,
      height: 600,
      format: 'svg'
    });

    const charts = [];
    for (const dataset of analysisResults.datasets) {
      if (dataset.visualizationHints) {
        const chart = await chartGenerator.generate({
          type: dataset.visualizationHints.type,
          data: dataset.data,
          title: dataset.title
        });
        charts.push(chart);
      }
    }

    return charts;
  }
}
```

### 4. External Data API Resilience

**Primary Service**: External data source APIs  
**Criticality**: HIGH - Data pipeline dependency

#### Retry and Caching Strategy
```javascript
// tools/data-services/api-resilience-manager.js
class APIResilienceManager {
  constructor() {
    this.cache = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      retryStrategy: (times) => Math.min(times * 50, 2000)
    });
    
    this.retryConfig = {
      retries: 3,
      factor: 2,
      minTimeout: 1000,
      maxTimeout: 5000,
      randomize: true
    };
  }

  async fetchWithResilience(endpoint, options = {}) {
    const cacheKey = this.generateCacheKey(endpoint, options);
    
    try {
      // Try primary endpoint with retry logic
      return await this.executeWithRetry(
        () => this.fetchFromPrimary(endpoint, options),
        this.retryConfig
      );
    } catch (primaryError) {
      console.warn(`Primary API failed: ${endpoint}`, primaryError);
      
      // Try alternative endpoints
      const alternatives = this.getAlternativeEndpoints(endpoint);
      for (const alternative of alternatives) {
        try {
          const result = await this.fetchFromAlternative(alternative, options);
          await this.updateCache(cacheKey, result, 3600); // Cache for 1 hour
          return result;
        } catch (altError) {
          console.warn(`Alternative API failed: ${alternative.url}`, altError);
        }
      }
      
      // Try cached data
      const cachedData = await this.getCachedData(cacheKey);
      if (cachedData) {
        console.info(`Using cached data for: ${endpoint}`);
        return {
          ...cachedData,
          warning: 'Using cached data - external APIs unavailable',
          cacheAge: this.getCacheAge(cacheKey)
        };
      }
      
      // All options exhausted
      throw new APIResilienceError('All API endpoints and cache exhausted', {
        primaryError,
        endpoint,
        alternatives: alternatives.map(alt => alt.url)
      });
    }
  }

  async executeWithRetry(operation, config) {
    let lastError;
    
    for (let attempt = 1; attempt <= config.retries + 1; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        if (attempt <= config.retries) {
          const delay = Math.min(
            config.minTimeout * Math.pow(config.factor, attempt - 1),
            config.maxTimeout
          );
          
          const jitter = config.randomize ? Math.random() * 0.1 * delay : 0;
          const actualDelay = delay + jitter;
          
          console.warn(`API call failed, retrying in ${actualDelay}ms (attempt ${attempt}/${config.retries + 1})`);
          await new Promise(resolve => setTimeout(resolve, actualDelay));
        }
      }
    }
    
    throw lastError;
  }

  getAlternativeEndpoints(primaryEndpoint) {
    // Map primary endpoints to their alternatives
    const alternativeMap = {
      'https://api.primary-source.com/data': [
        { url: 'https://backup-api.primary-source.com/data', priority: 1 },
        { url: 'https://api.alternative-source.com/similar-data', priority: 2 }
      ],
      'https://financial-api.com/market-data': [
        { url: 'https://backup.financial-api.com/market-data', priority: 1 },
        { url: 'https://alternative-financial.com/market-data', priority: 2 }
      ]
    };

    return alternativeMap[primaryEndpoint] || [];
  }
}
```

## Health Check & Monitoring Implementation

### Service Health Dashboard
```javascript
// tools/data-services/health-monitor.js
class HealthMonitor {
  constructor() {
    this.services = [
      { name: 'PyAirbyte', checker: new PyAirbyteHealthChecker() },
      { name: 'LLM-OpenAI', checker: new OpenAIHealthChecker() },
      { name: 'Evidence.dev', checker: new EvidenceHealthChecker() },
      { name: 'External-APIs', checker: new ExternalAPIHealthChecker() }
    ];
    
    this.healthStatus = new Map();
    this.setupPeriodicChecks();
  }

  async checkAllServices() {
    const results = await Promise.allSettled(
      this.services.map(service => this.checkService(service))
    );

    const healthReport = {
      timestamp: new Date(),
      overall: 'healthy',
      services: {},
      fallbacksActive: []
    };

    results.forEach((result, index) => {
      const service = this.services[index];
      
      if (result.status === 'fulfilled') {
        healthReport.services[service.name] = result.value;
        if (result.value.status !== 'healthy') {
          healthReport.overall = 'degraded';
        }
        if (result.value.fallbackActive) {
          healthReport.fallbacksActive.push(service.name);
        }
      } else {
        healthReport.services[service.name] = {
          status: 'error',
          error: result.reason.message,
          fallbackActive: true
        };
        healthReport.overall = 'degraded';
        healthReport.fallbacksActive.push(service.name);
      }
    });

    return healthReport;
  }

  setupPeriodicChecks() {
    // Check every 2 minutes
    setInterval(async () => {
      try {
        const healthReport = await this.checkAllServices();
        await this.updateHealthStatus(healthReport);
        
        if (healthReport.overall === 'degraded') {
          await this.sendHealthAlert(healthReport);
        }
      } catch (error) {
        console.error('Health check failed:', error);
      }
    }, 120000);
  }
}
```

### Circuit Breaker Configuration
```yaml
# config/circuit-breakers.yaml
circuit_breakers:
  pyairbyte:
    failure_threshold: 5
    reset_timeout: 60000
    timeout: 30000
    monitoring_period: 60000
    
  llm_providers:
    failure_threshold: 3
    reset_timeout: 30000
    timeout: 20000
    monitoring_period: 30000
    
  evidence_dev:
    failure_threshold: 5
    reset_timeout: 120000
    timeout: 45000
    monitoring_period: 60000
    
  external_apis:
    failure_threshold: 3
    reset_timeout: 60000
    timeout: 15000
    monitoring_period: 30000
```

## Recovery Procedures

### Automatic Service Recovery
```javascript
// tools/data-services/recovery-manager.js
class RecoveryManager {
  constructor() {
    this.recoveryProcedures = new Map([
      ['PyAirbyte', this.recoverPyAirbyte.bind(this)],
      ['LLM-Provider', this.recoverLLMProvider.bind(this)],
      ['Evidence.dev', this.recoverEvidence.bind(this)],
      ['External-API', this.recoverExternalAPI.bind(this)]
    ]);
  }

  async executeRecovery(serviceName, failureContext) {
    const procedure = this.recoveryProcedures.get(serviceName);
    
    if (!procedure) {
      throw new Error(`No recovery procedure defined for service: ${serviceName}`);
    }

    console.log(`Starting recovery procedure for ${serviceName}`);
    
    try {
      const recoveryResult = await procedure(failureContext);
      
      await this.logRecoverySuccess(serviceName, recoveryResult);
      await this.notifyRecoverySuccess(serviceName);
      
      return recoveryResult;
    } catch (recoveryError) {
      await this.logRecoveryFailure(serviceName, recoveryError);
      await this.escalateRecoveryFailure(serviceName, recoveryError);
      throw recoveryError;
    }
  }

  async recoverPyAirbyte(context) {
    // Restart Python virtual environment
    await this.restartPythonEnvironment();
    
    // Clear PyAirbyte cache if corrupted
    if (context.error.includes('cache')) {
      await this.clearPyAirbyteCache();
    }
    
    // Test connection with simple query
    await this.testPyAirbyteConnection();
    
    return { status: 'recovered', method: 'environment_restart' };
  }

  async recoverLLMProvider(context) {
    // Reset API key rotation if authentication failed
    if (context.error.includes('authentication')) {
      await this.rotateAPIKeys();
    }
    
    // Clear provider cache
    await this.clearProviderCache();
    
    // Test with simple generation request
    await this.testProviderConnectivity();
    
    return { status: 'recovered', method: 'key_rotation' };
  }
}
```

## Testing Strategy

### Fallback Scenario Testing
```javascript
// tests/fallback/fallback-scenarios.test.js
describe('External Service Fallback Scenarios', () => {
  let fallbackManager;
  let mockServices;

  beforeEach(() => {
    fallbackManager = new FallbackManager();
    mockServices = new MockServiceManager();
  });

  test('PyAirbyte fallback to local file upload', async () => {
    // Simulate PyAirbyte failure
    mockServices.simulateFailure('pyairbyte', 'connection_timeout');
    
    const result = await fallbackManager.handleIngestion({
      source: 'test-database',
      type: 'postgresql'
    });

    expect(result.fallback).toBe(true);
    expect(result.method).toBe('LOCAL_FILE_UPLOAD');
    expect(result.uploadInterface).toBeDefined();
  });

  test('LLM provider failover chain', async () => {
    // Simulate OpenAI failure
    mockServices.simulateFailure('openai', 'rate_limit_exceeded');
    
    const result = await fallbackManager.generateHypothesis({
      context: 'test analysis context'
    });

    expect(result.success).toBe(true);
    expect(result.provider).toBe('anthropic'); // Should failover to next provider
  });

  test('Evidence.dev fallback to static generation', async () => {
    mockServices.simulateFailure('evidence', 'build_timeout');
    
    const result = await fallbackManager.generatePublication({
      data: 'test-analysis-results'
    });

    expect(result.fallback).toBe(true);
    expect(result.method).toBe('STATIC_GENERATION');
    expect(result.formats.html).toBeDefined();
    expect(result.formats.pdf).toBeDefined();
  });

  test('External API with cached data fallback', async () => {
    // Pre-populate cache
    await fallbackManager.cache.set('api-key', JSON.stringify({
      data: 'cached-response',
      timestamp: Date.now()
    }), 'EX', 3600);

    // Simulate API failure
    mockServices.simulateFailure('external-api', 'network_error');
    
    const result = await fallbackManager.fetchData('test-endpoint');

    expect(result.data).toBe('cached-response');
    expect(result.warning).toContain('Using cached data');
  });
});

describe('Circuit Breaker Functionality', () => {
  test('Circuit breaker opens after threshold failures', async () => {
    const circuitBreaker = new CircuitBreaker({
      errorThreshold: 3,
      resetTimeout: 5000
    });

    // Trigger failures to open circuit
    for (let i = 0; i < 3; i++) {
      try {
        await circuitBreaker.execute(() => Promise.reject(new Error('Service unavailable')));
      } catch (error) {
        // Expected failures
      }
    }

    expect(circuitBreaker.state).toBe('OPEN');
  });
});
```

### Chaos Engineering Tests
```javascript
// tests/chaos/chaos-testing.test.js
describe('Chaos Engineering - Service Failure Simulation', () => {
  test('Random service failures during data pipeline', async () => {
    const chaosMonkey = new ChaosMonkey({
      services: ['pyairbyte', 'llm-provider', 'evidence'],
      failureRate: 0.3, // 30% chance of failure
      duration: 60000 // 1 minute test
    });

    chaosMonkey.start();

    const pipelineResults = [];
    for (let i = 0; i < 10; i++) {
      try {
        const result = await runFullDataPipeline({
          source: `test-source-${i}`,
          analysis: true,
          publication: true
        });
        pipelineResults.push({ success: true, result });
      } catch (error) {
        pipelineResults.push({ success: false, error: error.message });
      }
    }

    chaosMonkey.stop();

    // Verify that at least some pipelines succeeded despite chaos
    const successCount = pipelineResults.filter(r => r.success).length;
    expect(successCount).toBeGreaterThan(5); // At least 50% success rate
  });
});
```

## Integration with Existing Systems

### Feature Flag Integration
```yaml
# config/feature-flags.yaml
feature_flags:
  fallback_strategies:
    pyairbyte_fallback: true
    llm_provider_failover: true
    evidence_static_fallback: true
    api_retry_logic: true
    
  circuit_breakers:
    enabled: true
    monitoring: true
    alerts: true

  recovery_procedures:
    automatic_recovery: true
    manual_escalation: true
    health_monitoring: true
```

### Monitoring Integration
```javascript
// Integration with performance monitoring strategy
const performanceMonitor = require('../performance-monitoring-strategy');

class FallbackMonitor extends performanceMonitor.BaseMonitor {
  collectFallbackMetrics() {
    return {
      fallback_activations: this.getFallbackActivationCount(),
      recovery_times: this.getRecoveryTimes(),
      service_availability: this.getServiceAvailabilityMetrics(),
      circuit_breaker_states: this.getCircuitBreakerStates()
    };
  }
}
```

## Documentation Integration

This fallback strategy document integrates with:
- `/docs/architecture/python-nodejs-integration-risk-analysis.md` - Provides implementation details for identified risks
- `/docs/development-sequence-plan.md` - Informs development priorities and testing requirements
- `/docs/rollback-verification-checklist.md` - Provides service-specific rollback procedures
- `/docs/support-team-training-guide.md` - Training scenarios for fallback situation handling

## Conclusion

This comprehensive fallback strategy ensures system resilience by:
1. **Providing multiple fallback levels** for each external service
2. **Implementing circuit breaker patterns** to prevent cascade failures
3. **Enabling graceful degradation** when services are unavailable
4. **Maintaining user productivity** through alternative operation modes
5. **Supporting automatic recovery** when services return online

The strategy balances system availability with operational complexity, ensuring that the Data Practitioner Agent System remains functional even when external dependencies fail.