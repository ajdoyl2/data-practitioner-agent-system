# Story Integration Patterns - Security Bridge Implementation

## Overview

Story 1.1.5 (Security & Risk Management Foundation) acts as a **Security Bridge** between the completed foundation (Story 1.1) and all external integrations (Stories 1.2-1.8). This document defines the specific integration patterns and security touchpoints for each story.

## Integration Architecture Pattern

```
Story 1.1 (Complete) 
    ↓
Story 1.1.5 (Security Bridge) ← Provides security for all subsequent stories
    ↓
Stories 1.2-1.8 (Secure External Integrations)
```

Each subsequent story follows this integration pattern:
1. **Security Check**: Validate authentication and permissions
2. **Feature Flag Check**: Ensure story feature is enabled
3. **External Service Validation**: Verify required services are accessible
4. **Secure Operation**: Execute story functionality with monitoring
5. **Audit Logging**: Record all security-relevant events
6. **Rollback Capability**: Maintain ability to safely revert changes

---

## Story 1.2: PyAirbyte Integration Bridge

### **Security Integration Points**

#### **Authentication Integration**
```javascript
// Story 1.2 - PyAirbyte Data Ingestion with Security
class PyAirbyteDataIngestionService {
  constructor() {
    this.security = new DataSecurityService();
    this.featureFlags = require('../lib/feature-flag-manager');
    this.logger = new SecurityLogger();
  }

  async ingestData(request, dataSource) {
    // 1. Security Check
    const authResult = await this.security.validateApiKey(request);
    if (!authResult.valid) {
      throw new Error('Authentication required for data ingestion');
    }

    // 2. Permission Check  
    if (!await this.security.checkPermission(authResult.scopes, 'data_write')) {
      throw new Error('Insufficient permissions for data ingestion');
    }

    // 3. Feature Flag Check
    if (!await this.featureFlags.checkFeatureFlag('pyairbyte_integration')) {
      throw new Error('PyAirbyte integration is currently disabled');
    }

    // 4. Secure Operation
    try {
      const result = await this.executeSecurePyAirbyteIngestion(dataSource);
      
      // 5. Audit Logging
      await this.logger.logSecurityEvent('DATA_INGESTION_SUCCESS', {
        user: authResult.scopes,
        dataSource: dataSource.type,
        recordCount: result.recordCount
      });

      return result;
    } catch (error) {
      await this.logger.logSecurityEvent('DATA_INGESTION_FAILED', {
        error: error.message,
        dataSource: dataSource.type
      });
      throw error;
    }
  }
}
```

#### **Credential Management Integration**
```yaml
# Story 1.2 - External Services Configuration
services:
  pyairbyte:
    type: "python_package"
    package_name: "airbyte"
    version: "^0.20.0"
    credentials_required: false
    
  database_sources:
    postgres:
      type: "database"
      credential_key: "POSTGRES_CONNECTION_STRING"
      test_query: "SELECT 1"
      required: false
      
    mysql:
      type: "database"  
      credential_key: "MYSQL_CONNECTION_STRING"
      test_query: "SELECT 1"
      required: false
```

#### **Feature Flag Configuration**
```yaml
# Story 1.2 - Feature Flag Integration
features:
  pyairbyte_integration: false        # Master toggle
  pyairbyte_csv_connector: false      # CSV file connector
  pyairbyte_json_connector: false     # JSON file connector
  pyairbyte_db_connectors: false      # Database connectors
  pyairbyte_stream_selection: false   # Advanced stream selection
  pyairbyte_cache_management: false   # Cache management features
```

#### **Rollback Integration**
```bash
#!/bin/bash
# tools/rollback/rollback-story-1.2.sh - PyAirbyte Rollback

echo "Rolling back Story 1.2: PyAirbyte Integration..."

# 1. Disable feature flags
node -e "
const flags = require('../lib/feature-flag-manager');
flags.disableFeature('pyairbyte_integration');
flags.disableFeature('pyairbyte_csv_connector');
flags.disableFeature('pyairbyte_json_connector');
"

# 2. Stop PyAirbyte processes
pkill -f "python.*airbyte" || true

# 3. Remove Python packages
pip uninstall -y airbyte pyairbyte || true

# 4. Clean up data cache
rm -rf .airbyte_cache/ || true

# 5. Remove service endpoints
rm -rf tools/data-services/data-ingestion-service.js || true

# 6. Validate rollback
echo "Validating PyAirbyte rollback..."
python -c "import airbyte" 2>/dev/null && echo "ERROR: PyAirbyte still installed" || echo "SUCCESS: PyAirbyte removed"

echo "Story 1.2 rollback completed"
```

---

## Story 1.3: DuckDB Integration Bridge

### **Security Integration Points**

#### **Database Security Integration**
```javascript
// Story 1.3 - DuckDB Analytics with Security
class DuckDBAnalyticsService {
  constructor() {
    this.security = new DataSecurityService();
    this.featureFlags = require('../lib/feature-flag-manager');
    this.logger = new SecurityLogger();
    this.duckdb = null;
  }

  async executeQuery(request, query) {
    // Security validation
    const authResult = await this.security.validateApiKey(request);
    if (!authResult.valid) {
      throw new Error('Authentication required for analytics queries');
    }

    if (!await this.security.checkPermission(authResult.scopes, 'data_read')) {
      throw new Error('Insufficient permissions for data queries');
    }

    // Feature flag validation
    if (!await this.featureFlags.checkFeatureFlag('duckdb_analytics')) {
      throw new Error('DuckDB analytics is currently disabled');
    }

    // Query security validation
    if (this.containsDangerousOperations(query)) {
      await this.logger.logSecurityEvent('DANGEROUS_QUERY_BLOCKED', {
        query: query,
        user: authResult.scopes
      });
      throw new Error('Query contains potentially dangerous operations');
    }

    // Execute secure query
    try {
      const connection = await this.getSecureConnection();
      const result = await connection.all(query);
      
      await this.logger.logSecurityEvent('ANALYTICS_QUERY_SUCCESS', {
        user: authResult.scopes,
        rowCount: result.length,
        queryHash: this.hashQuery(query)
      });

      return result;
    } catch (error) {
      await this.logger.logSecurityEvent('ANALYTICS_QUERY_FAILED', {
        error: error.message,
        queryHash: this.hashQuery(query)
      });
      throw error;
    }
  }

  containsDangerousOperations(query) {
    const dangerousKeywords = [
      'DROP', 'DELETE', 'TRUNCATE', 'ALTER', 
      'CREATE', 'INSERT', 'UPDATE', 'EXEC'
    ];
    
    const upperQuery = query.toUpperCase();
    return dangerousKeywords.some(keyword => upperQuery.includes(keyword));
  }
}
```

#### **Feature Flag Configuration**
```yaml
# Story 1.3 - DuckDB Feature Flags
features:
  duckdb_analytics: false             # Master toggle
  duckdb_memory_limit: false          # Memory management
  duckdb_partitioning: false          # Data partitioning
  duckdb_multi_format_read: false     # CSV/Parquet/JSON reading
  duckdb_query_optimization: false    # Advanced optimizations
```

#### **Rollback Integration**
```bash
#!/bin/bash
# tools/rollback/rollback-story-1.3.sh - DuckDB Rollback

echo "Rolling back Story 1.3: DuckDB Integration..."

# 1. Disable feature flags
node -e "
const flags = require('../lib/feature-flag-manager');
flags.disableFeature('duckdb_analytics');
"

# 2. Close DuckDB connections
node -e "
const duckdb = require('duckdb');
// Close all connections gracefully
"

# 3. Backup and remove DuckDB files
if [ -d ".duckdb" ]; then
  mv .duckdb .duckdb.backup.$(date +%s)
fi

# 4. Remove Node.js bindings
npm uninstall duckdb || true

# 5. Clean up analytics service
rm -rf tools/data-services/analytics-service.js || true

echo "Story 1.3 rollback completed"
```

---

## Story 1.4: dbt-core Integration Bridge

### **Security Integration Points**

#### **Transformation Security**
```javascript
// Story 1.4 - dbt-core Transformations with Security
class DBTTransformationService {
  constructor() {
    this.security = new DataSecurityService();
    this.featureFlags = require('../lib/feature-flag-manager');
    this.logger = new SecurityLogger();
  }

  async runTransformation(request, transformationConfig) {
    // Authentication & authorization
    const authResult = await this.security.validateApiKey(request);
    if (!authResult.valid) {
      throw new Error('Authentication required for data transformations');
    }

    if (!await this.security.checkPermission(authResult.scopes, 'data_write')) {
      throw new Error('Insufficient permissions for data transformations');
    }

    // Feature flag check
    if (!await this.featureFlags.checkFeatureFlag('dbt_transformations')) {
      throw new Error('dbt transformations are currently disabled');
    }

    // Validate transformation safety
    if (!this.validateTransformationSafety(transformationConfig)) {
      await this.logger.logSecurityEvent('UNSAFE_TRANSFORMATION_BLOCKED', {
        config: transformationConfig,
        user: authResult.scopes
      });
      throw new Error('Transformation configuration contains unsafe operations');
    }

    // Execute secure transformation
    try {
      const result = await this.executeDBTRun(transformationConfig);
      
      await this.logger.logSecurityEvent('TRANSFORMATION_SUCCESS', {
        user: authResult.scopes,
        modelsRun: result.modelsRun,
        testsRun: result.testsRun
      });

      return result;
    } catch (error) {
      await this.logger.logSecurityEvent('TRANSFORMATION_FAILED', {
        error: error.message,
        config: transformationConfig
      });
      throw error;
    }
  }
}
```

#### **Feature Flag Configuration**
```yaml
# Story 1.4 - dbt-core Feature Flags
features:
  dbt_transformations: false          # Master toggle
  dbt_testing: false                  # Data testing
  dbt_documentation: false            # Documentation generation
  dbt_snapshots: false                # Snapshot functionality
  dbt_macros: false                   # Custom macros
```

---

## Story 1.5: Dagster Integration Bridge

### **Security Integration Points**

#### **Orchestration Security**
```javascript
// Story 1.5 - Dagster Orchestration with Security
class DagsterOrchestrationService {
  constructor() {
    this.security = new DataSecurityService();
    this.featureFlags = require('../lib/feature-flag-manager');
    this.logger = new SecurityLogger();
  }

  async triggerPipeline(request, pipelineConfig) {
    // Security validation
    const authResult = await this.security.validateApiKey(request);
    if (!authResult.valid) {
      throw new Error('Authentication required for pipeline orchestration');
    }

    if (!await this.security.checkPermission(authResult.scopes, 'admin')) {
      throw new Error('Admin permissions required for pipeline orchestration');
    }

    // Feature flag validation
    if (!await this.featureFlags.checkFeatureFlag('dagster_orchestration')) {
      throw new Error('Dagster orchestration is currently disabled');
    }

    // Pipeline safety validation
    if (!this.validatePipelineSafety(pipelineConfig)) {
      await this.logger.logSecurityEvent('UNSAFE_PIPELINE_BLOCKED', {
        pipeline: pipelineConfig.name,
        user: authResult.scopes
      });
      throw new Error('Pipeline configuration contains unsafe operations');
    }

    // Execute secure pipeline
    try {
      const runId = await this.launchDagsterRun(pipelineConfig);
      
      await this.logger.logSecurityEvent('PIPELINE_TRIGGERED', {
        user: authResult.scopes,
        pipeline: pipelineConfig.name,
        runId: runId
      });

      return { runId: runId, status: 'LAUNCHED' };
    } catch (error) {
      await this.logger.logSecurityEvent('PIPELINE_FAILED', {
        error: error.message,
        pipeline: pipelineConfig.name
      });
      throw error;
    }
  }
}
```

---

## Story 1.6: EDA & Hypothesis Generation Bridge

### **Security Integration Points**

#### **Analysis Security**
```javascript
// Story 1.6 - EDA & Hypothesis Generation with Security
class EDAAnalysisService {
  constructor() {
    this.security = new DataSecurityService();
    this.featureFlags = require('../lib/feature-flag-manager');
    this.logger = new SecurityLogger();
  }

  async generateHypothesis(request, datasetConfig) {
    // Authentication
    const authResult = await this.security.validateApiKey(request);
    if (!authResult.valid) {
      throw new Error('Authentication required for EDA analysis');
    }

    if (!await this.security.checkPermission(authResult.scopes, 'data_read')) {
      throw new Error('Insufficient permissions for data analysis');
    }

    // Feature flag check
    if (!await this.featureFlags.checkFeatureFlag('eda_automation')) {
      throw new Error('EDA automation is currently disabled');
    }

    // Data privacy validation
    if (this.containsSensitiveData(datasetConfig)) {
      if (!await this.security.checkPermission(authResult.scopes, 'admin')) {
        await this.logger.logSecurityEvent('SENSITIVE_DATA_ACCESS_DENIED', {
          dataset: datasetConfig.name,
          user: authResult.scopes
        });
        throw new Error('Admin permissions required for sensitive data analysis');
      }
    }

    // Execute secure analysis
    try {
      const analysis = await this.performSecureEDA(datasetConfig);
      const hypotheses = await this.generateSecureHypotheses(analysis);
      
      await this.logger.logSecurityEvent('EDA_ANALYSIS_SUCCESS', {
        user: authResult.scopes,
        dataset: datasetConfig.name,
        hypothesesGenerated: hypotheses.length
      });

      return { analysis: analysis, hypotheses: hypotheses };
    } catch (error) {
      await this.logger.logSecurityEvent('EDA_ANALYSIS_FAILED', {
        error: error.message,
        dataset: datasetConfig.name
      });
      throw error;
    }
  }
}
```

---

## Story 1.7: Evidence.dev Integration Bridge

### **Security Integration Points**

#### **Publication Security**
```javascript
// Story 1.7 - Evidence.dev Publication with Security
class EvidencePublicationService {
  constructor() {
    this.security = new DataSecurityService();
    this.featureFlags = require('../lib/feature-flag-manager');
    this.logger = new SecurityLogger();
  }

  async publishInsights(request, publicationConfig) {
    // Authentication
    const authResult = await this.security.validateApiKey(request);
    if (!authResult.valid) {
      throw new Error('Authentication required for insight publication');
    }

    if (!await this.security.checkPermission(authResult.scopes, 'data_write')) {
      throw new Error('Insufficient permissions for publication');
    }

    // Feature flag check
    if (!await this.featureFlags.checkFeatureFlag('evidence_publishing')) {
      throw new Error('Evidence.dev publishing is currently disabled');
    }

    // Content security validation
    if (!this.validatePublicationSecurity(publicationConfig)) {
      await this.logger.logSecurityEvent('UNSAFE_PUBLICATION_BLOCKED', {
        publication: publicationConfig.title,
        user: authResult.scopes
      });
      throw new Error('Publication contains potentially unsafe content');
    }

    // Execute secure publication
    try {
      const result = await this.buildSecureEvidenceSite(publicationConfig);
      
      await this.logger.logSecurityEvent('PUBLICATION_SUCCESS', {
        user: authResult.scopes,
        publication: publicationConfig.title,
        url: result.url
      });

      return result;
    } catch (error) {
      await this.logger.logSecurityEvent('PUBLICATION_FAILED', {
        error: error.message,
        publication: publicationConfig.title
      });
      throw error;
    }
  }

  validatePublicationSecurity(config) {
    // Check for potential XSS, injection attacks, etc.
    const content = JSON.stringify(config);
    
    const dangerousPatterns = [
      /<script/i,
      /javascript:/i,
      /eval\(/i,
      /innerHTML/i,
      /document\.write/i
    ];

    return !dangerousPatterns.some(pattern => pattern.test(content));
  }
}
```

---

## Story 1.8: QA & Documentation Bridge

### **Security Integration Points**

#### **Quality Assurance Security**
```javascript
// Story 1.8 - QA & Documentation with Security
class QualityAssuranceService {
  constructor() {
    this.security = new DataSecurityService();
    this.featureFlags = require('../lib/feature-flag-manager');
    this.logger = new SecurityLogger();
  }

  async runSecurityTests(request, testConfig) {
    // Authentication
    const authResult = await this.security.validateApiKey(request);
    if (!authResult.valid) {
      throw new Error('Authentication required for security testing');
    }

    if (!await this.security.checkPermission(authResult.scopes, 'admin')) {
      throw new Error('Admin permissions required for security testing');
    }

    // Execute comprehensive security validation
    try {
      const securityTestResults = await this.performSecurityTests();
      const complianceCheck = await this.validateCompliance();
      const auditReport = await this.generateSecurityAudit();
      
      await this.logger.logSecurityEvent('SECURITY_AUDIT_COMPLETED', {
        user: authResult.scopes,
        testsRun: securityTestResults.length,
        complianceScore: complianceCheck.score
      });

      return {
        securityTests: securityTestResults,
        compliance: complianceCheck,
        audit: auditReport
      };
    } catch (error) {
      await this.logger.logSecurityEvent('SECURITY_AUDIT_FAILED', {
        error: error.message
      });
      throw error;
    }
  }
}
```

---

## Cross-Story Security Patterns

### **Unified Security Middleware**
```javascript
// tools/lib/security-middleware.js
class UnifiedSecurityMiddleware {
  static async validateRequest(request, requiredPermissions = ['data_read']) {
    const security = new DataSecurityService();
    const featureFlags = require('./feature-flag-manager');
    const logger = new SecurityLogger();

    // 1. Authentication
    const authResult = await security.validateApiKey(request);
    if (!authResult.valid) {
      await logger.logSecurityEvent('MIDDLEWARE_AUTH_FAILED', {
        ip: request.ip,
        endpoint: request.path
      });
      throw new Error('Authentication failed');
    }

    // 2. Authorization
    for (const permission of requiredPermissions) {
      if (!await security.checkPermission(authResult.scopes, permission)) {
        await logger.logSecurityEvent('MIDDLEWARE_PERMISSION_DENIED', {
          user: authResult.scopes,
          requiredPermission: permission,
          endpoint: request.path
        });
        throw new Error(`Permission ${permission} required`);
      }
    }

    return authResult;
  }

  static async checkStoryFeature(storyFeature) {
    const featureFlags = require('./feature-flag-manager');
    
    if (!await featureFlags.checkFeatureFlag(storyFeature)) {
      throw new Error(`Feature ${storyFeature} is currently disabled`);
    }
  }
}

module.exports = UnifiedSecurityMiddleware;
```

This integration pattern ensures that every subsequent story (1.2-1.8) has:
- ✅ **Consistent Authentication** via unified security service
- ✅ **Feature Flag Protection** preventing accidental activation
- ✅ **Comprehensive Audit Logging** for all operations
- ✅ **Rollback Capability** for safe deployment and recovery
- ✅ **Security Validation** for all external integrations
- ✅ **Credential Management** for all external services

Each story can now be developed and deployed safely with full security integration from Story 1.1.5.