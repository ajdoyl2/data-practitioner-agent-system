# Quality Assurance Configuration

This directory contains the configuration files for the BMad-Method Quality Assurance system. These configurations define quality gates, validation checkpoints, test suites, and monitoring settings for the entire data pipeline.

## Configuration Files

### 1. quality-gates.yaml
Defines quality gates for each stage of the data pipeline:
- **Ingestion Gates**: Data completeness, schema compliance, source availability
- **Transformation Gates**: Test success rates, data quality scores, cost optimization
- **Publication Gates**: Site performance, accessibility, content accuracy
- **Integration Gates**: End-to-end success rates, security compliance
- **Performance Gates**: Response times, throughput, resource utilization

### 2. test-suites.yaml
Configures different test suite execution modes:
- **Comprehensive**: Full validation with coverage reporting
- **Quick**: Fast feedback for development
- **Smoke**: Basic functionality verification
- **Performance**: Performance regression testing
- **Security**: Security validation and compliance
- **Chaos**: Resilience and fault tolerance testing

### 3. monitoring-config.yaml
Defines monitoring, alerting, and health check configurations:
- **Metrics Collection**: Data quality, performance, system resources
- **Dashboards**: Operations, quality trends, executive summary
- **Alerting Rules**: Quality gate failures, performance issues, security alerts
- **Health Checks**: System dependencies and service availability

### 4. validation-checkpoints.yaml
Specifies validation checkpoints throughout the pipeline:
- **Pre-Pipeline**: Environment and dependency validation
- **Ingestion**: Source data and process validation
- **Transformation**: Model execution and data quality validation
- **Publication**: Content and performance validation
- **Integration**: Cross-component and end-to-end validation

## Usage

### Initializing Quality Assurance Engine

```javascript
const QualityAssuranceEngine = require('../../../tools/data-services/quality-assurance-engine');

// Initialize with custom configuration path
const qaEngine = new QualityAssuranceEngine({
  configPath: './config/quality-assurance',
  enforceGates: true,
  alertingEnabled: true,
  trendAnalysis: true
});

await qaEngine.initialize();
```

### Running Quality Gates

```javascript
// Enforce quality gate for ingestion stage
const metrics = {
  data_completeness: 98,
  schema_compliance: 100,
  source_availability: 99
};

const result = await qaEngine.enforceQualityGate('ingestion', metrics);

if (!result.passed) {
  console.log('Quality gate failed:', result.failed_checks);
}
```

### Executing Test Suites

```javascript
// Run comprehensive test suite
const testResults = await qaEngine.executeTestSuite();
console.log('Test Results:', testResults.summary);

// Run specific test suite
const quickResults = await qaEngine.executeTestSuite('quick');
```

### Monitoring and Alerting

```javascript
// Set up monitoring
await qaEngine.setupAlertingSystem();

// Send custom alert
await qaEngine.sendAlert('warning', 'custom_alert', {
  message: 'Custom validation failed',
  component: 'data-ingestion',
  severity: 'medium'
});
```

## Customization

### Adding New Quality Gates

1. Edit `quality-gates.yaml` to add new gates:
```yaml
quality_gates:
  my_new_stage:
    thresholds:
      my_metric: 95
    required_checks:
      - my_metric
    failure_action: block
    enabled: true
```

2. Update your code to enforce the new gate:
```javascript
const metrics = { my_metric: 97 };
const result = await qaEngine.enforceQualityGate('my_new_stage', metrics);
```

### Adding New Test Suites

1. Edit `test-suites.yaml`:
```yaml
test_suites:
  my_custom_suite:
    enabled: true
    parallel: true
    timeout: 120000
    categories:
      - custom
    test_patterns:
      - "**/custom/*.test.js"
```

### Adding New Monitoring Rules

1. Edit `monitoring-config.yaml`:
```yaml
alerting:
  rules:
    - name: my_custom_alert
      condition: "my_metric > 100"
      severity: warning
      cooldown: 10m
      channels: [console]
```

### Adding New Validation Checkpoints

1. Edit `validation-checkpoints.yaml`:
```yaml
validation_checkpoints:
  my_stage:
    my_checkpoint:
      enabled: true
      order: 1
      validations:
        - check: my_validation
          threshold: 95
      failure_action: warn
```

## Environment Variables

The following environment variables can be used to override configuration:

- `QA_CONFIG_PATH`: Path to quality assurance configuration directory
- `QA_ENFORCE_GATES`: Enable/disable quality gate enforcement (true/false)
- `QA_ALERTING_ENABLED`: Enable/disable alerting (true/false)
- `QA_TREND_ANALYSIS`: Enable/disable trend analysis (true/false)
- `DATABASE_URL`: Database connection string for health checks
- `EXTERNAL_API_URL`: External API endpoint for health checks
- `ELASTICSEARCH_URL`: Elasticsearch URL for centralized logging
- `SLACK_WEBHOOK_URL`: Slack webhook for alert notifications
- `SMTP_CONFIG`: Email configuration for alert notifications
- `PAGERDUTY_SERVICE_KEY`: PagerDuty integration key

## Integration with BMad-Method Components

The Quality Assurance system integrates with all BMad-Method components:

### PyAirbyte Integration
- Validates data extraction rates and quality
- Monitors connection health and error rates
- Enforces schema compliance during ingestion

### DuckDB Integration  
- Validates query performance and resource usage
- Monitors database connection health
- Tracks data consistency and integrity

### SQLMesh Integration
- Validates model syntax and execution
- Enforces cost optimization requirements
- Tracks data lineage and test results

### Evidence Site Integration
- Validates site performance and accessibility
- Monitors content accuracy and SEO scores
- Tracks user experience metrics

### Dagster Integration (if enabled)
- Integrates with pipeline orchestration
- Provides quality gate checkpoints in workflows
- Enables automated quality validation triggers

## Troubleshooting

### Common Issues

1. **Configuration File Not Found**
   - Ensure configuration files exist in the specified path
   - Check file permissions and accessibility

2. **Quality Gate Failures**
   - Review the specific failed checks in the gate result
   - Check if bypass conditions are applicable
   - Verify metric calculation accuracy

3. **Test Suite Timeouts**
   - Increase timeout values in test suite configuration
   - Check for resource constraints (CPU, memory)
   - Consider running tests in parallel mode

4. **Monitoring Alerts Not Working**
   - Verify alert channel configurations
   - Check webhook URLs and API keys
   - Review cooldown periods and rate limiting

### Debug Mode

Enable debug logging by setting the log level:

```javascript
const qaEngine = new QualityAssuranceEngine({
  configPath: './config/quality-assurance',
  logLevel: 'debug'
});
```

Or set the environment variable:
```bash
export LOG_LEVEL=debug
```

## Best Practices

1. **Start with Permissive Gates**: Begin with warning-level gates and gradually increase strictness
2. **Monitor Trends**: Use trend analysis to identify patterns and prevent regressions
3. **Regular Configuration Review**: Periodically review and update thresholds based on system evolution
4. **Test Configuration Changes**: Validate configuration changes in non-production environments
5. **Document Custom Rules**: Maintain documentation for any custom quality gates or validation rules
6. **Emergency Procedures**: Ensure emergency bypass procedures are well-documented and tested