# Data Practitioner System - Best Practices and Standards

## Overview
Comprehensive best practices for developing, deploying, and maintaining the BMad Data Practitioner Agent System (Stories 1.1-1.8).

## Development Best Practices

### Code Quality Standards

#### JavaScript/Node.js Standards
```javascript
// Use modern ES6+ features
const { duckdbWrapper } = require('../tools/data-services/duckdb-wrapper');

// Async/await over callbacks
async function processData(query) {
    try {
        const result = await duckdbWrapper.execute(query);
        return result;
    } catch (error) {
        logger.error('Data processing failed', { error: error.message, query });
        throw error;
    }
}

// Proper error handling with context
class DataProcessingError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'DataProcessingError';
        this.context = context;
    }
}

// Configuration over magic numbers
const CONFIG = {
    MAX_QUERY_TIMEOUT: 300000, // 5 minutes
    DEFAULT_BATCH_SIZE: 1000,
    MAX_RETRY_ATTEMPTS: 3
};
```

#### Python Standards
```python
# Type hints for clarity
from typing import List, Dict, Optional, Union
import logging
from pathlib import Path

# Proper class structure
class HypothesisGenerator:
    """Generates statistical hypotheses for data analysis."""
    
    def __init__(self, significance_threshold: float = 0.05) -> None:
        self.significance_threshold = significance_threshold
        self.logger = logging.getLogger(__name__)
    
    def generate_hypotheses(self, 
                          data: pd.DataFrame, 
                          target_column: str) -> List[Dict[str, Union[str, float]]]:
        """Generate hypotheses for given dataset."""
        try:
            hypotheses = self._analyze_correlations(data, target_column)
            self.logger.info(f"Generated {len(hypotheses)} hypotheses")
            return hypotheses
        except Exception as error:
            self.logger.error(f"Hypothesis generation failed: {error}")
            raise

# Use dataclasses for structured data
from dataclasses import dataclass

@dataclass
class AnalysisResult:
    metric_name: str
    value: float
    confidence_interval: tuple
    p_value: Optional[float] = None
    
# Constants at module level
DEFAULT_CONFIDENCE_LEVEL = 0.95
MIN_SAMPLE_SIZE = 30
```

### Testing Standards

#### Unit Testing Principles
```javascript
// Test file: tests/data-services/duckdb-wrapper.test.js
describe('DuckDBWrapper', () => {
    let wrapper;
    
    beforeEach(async () => {
        wrapper = new DuckDBWrapper({
            database_path: ':memory:',
            memory_limit: '1GB'
        });
        await wrapper.initialize();
    });
    
    afterEach(async () => {
        await wrapper.cleanup();
    });
    
    describe('query execution', () => {
        it('should execute simple SELECT queries', async () => {
            // Arrange
            const query = 'SELECT 1 as test_column';
            
            // Act
            const result = await wrapper.execute(query);
            
            // Assert
            expect(result).toHaveLength(1);
            expect(result[0].test_column).toBe(1);
        });
        
        it('should handle query timeouts gracefully', async () => {
            // Arrange
            const longQuery = 'SELECT * FROM generate_series(1, 1000000)';
            wrapper.setQueryTimeout(100); // 100ms timeout
            
            // Act & Assert
            await expect(wrapper.execute(longQuery))
                .rejects
                .toThrow('Query timeout exceeded');
        });
    });
});
```

#### Integration Testing Standards
```javascript
// Test file: tests/integration/data-pipeline.test.js
describe('End-to-End Data Pipeline', () => {
    let testDataSource;
    let pipeline;
    
    beforeAll(async () => {
        // Setup test environment
        testDataSource = await setupTestDatabase();
        pipeline = new DataPipeline({
            source: testDataSource,
            destination: ':memory:',
            enableQualityGates: true
        });
    });
    
    afterAll(async () => {
        await cleanupTestEnvironment();
    });
    
    it('should process data end-to-end with quality validation', async () => {
        // Arrange
        const testData = await loadTestDataset('customer_data.csv');
        
        // Act
        const result = await pipeline.process(testData);
        
        // Assert
        expect(result.status).toBe('success');
        expect(result.qualityScore).toBeGreaterThan(0.85);
        expect(result.recordsProcessed).toBe(testData.length);
        
        // Verify data quality
        const qualityReport = await pipeline.getQualityReport();
        expect(qualityReport.completeness).toBeGreaterThan(0.95);
        expect(qualityReport.accuracy).toBeGreaterThan(0.90);
    });
});
```

### Documentation Standards

#### Code Documentation
```javascript
/**
 * Executes a query against the DuckDB instance with timeout and retry logic.
 * 
 * @param {string} query - SQL query to execute
 * @param {Object} options - Execution options
 * @param {number} [options.timeout=300000] - Query timeout in milliseconds
 * @param {number} [options.retries=3] - Number of retry attempts
 * @param {boolean} [options.enableProfiling=false] - Enable query profiling
 * @returns {Promise<Array>} Query results as array of objects
 * @throws {QueryTimeoutError} When query exceeds timeout
 * @throws {DatabaseConnectionError} When database connection fails
 * 
 * @example
 * const results = await wrapper.execute(
 *   'SELECT * FROM customers WHERE age > ?',
 *   { timeout: 30000, retries: 2 }
 * );
 */
async execute(query, options = {}) {
    // Implementation...
}
```

#### API Documentation
```javascript
/**
 * @swagger
 * /api/v1/data/query:
 *   post:
 *     summary: Execute data query
 *     description: Execute SQL query against the analytics database
 *     tags:
 *       - Data Query
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *                 description: SQL query to execute
 *               timeout:
 *                 type: integer
 *                 description: Query timeout in milliseconds
 *                 default: 300000
 *     responses:
 *       200:
 *         description: Query executed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                 executionTime:
 *                   type: number
 */
```

## Architecture Best Practices

### Component Design Principles

#### Single Responsibility Principle
```javascript
// Good: Each class has a single responsibility
class DataValidator {
    validateSchema(data, schema) { /* ... */ }
    validateQuality(data, rules) { /* ... */ }
}

class DataTransformer {
    transform(data, transformationRules) { /* ... */ }
}

class DataLoader {
    load(data, destination) { /* ... */ }
}

// Bad: Mixed responsibilities
class DataProcessor {
    validateData(data) { /* ... */ }
    transformData(data) { /* ... */ }
    loadData(data) { /* ... */ }
    generateReports(data) { /* ... */ }
    sendNotifications(status) { /* ... */ }
}
```

#### Dependency Injection
```javascript
// Good: Dependencies injected
class QualityAssuranceEngine {
    constructor(validator, reporter, alerter) {
        this.validator = validator;
        this.reporter = reporter;
        this.alerter = alerter;
    }
}

// Bad: Hard-coded dependencies
class QualityAssuranceEngine {
    constructor() {
        this.validator = new DataValidator();
        this.reporter = new QualityReporter();
        this.alerter = new SlackAlerter();
    }
}
```

### Error Handling Patterns

#### Structured Error Handling
```javascript
// Custom error classes with context
class DataQualityError extends Error {
    constructor(message, context = {}) {
        super(message);
        this.name = 'DataQualityError';
        this.context = context;
        this.timestamp = new Date().toISOString();
    }
}

// Centralized error handling
class ErrorHandler {
    static handle(error, context = {}) {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString()
        };
        
        // Log error
        logger.error('Operation failed', errorInfo);
        
        // Send to monitoring system
        monitoring.reportError(errorInfo);
        
        // Return user-friendly error
        return {
            success: false,
            error: 'Operation failed. Please try again.',
            errorId: generateErrorId()
        };
    }
}
```

#### Circuit Breaker Pattern
```javascript
class CircuitBreaker {
    constructor(service, options = {}) {
        this.service = service;
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.failureCount = 0;
        this.nextAttempt = 0;
    }
    
    async call(method, ...args) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }
        
        try {
            const result = await this.service[method](...args);
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }
    
    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    
    onFailure() {
        this.failureCount++;
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.resetTimeout;
        }
    }
}
```

### Performance Optimization

#### Query Optimization
```sql
-- Good: Efficient query with proper indexing
SELECT 
    c.customer_id,
    c.customer_name,
    SUM(o.order_total) as total_spent
FROM customers c
INNER JOIN orders o ON c.customer_id = o.customer_id
WHERE o.order_date >= '2024-01-01'
    AND c.status = 'active'
GROUP BY c.customer_id, c.customer_name
HAVING SUM(o.order_total) > 1000
ORDER BY total_spent DESC
LIMIT 100;

-- Create appropriate indexes
CREATE INDEX idx_orders_customer_date ON orders(customer_id, order_date);
CREATE INDEX idx_customers_status ON customers(status);
```

#### Memory Management
```javascript
class MemoryManager {
    constructor() {
        this.memoryThreshold = 0.8; // 80% of available memory
        this.cleanupInterval = 300000; // 5 minutes
        this.startMonitoring();
    }
    
    startMonitoring() {
        setInterval(() => {
            const usage = process.memoryUsage();
            const usagePercentage = usage.heapUsed / usage.heapTotal;
            
            if (usagePercentage > this.memoryThreshold) {
                this.performCleanup();
            }
        }, this.cleanupInterval);
    }
    
    performCleanup() {
        // Clear caches
        cache.clear();
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        // Notify other components
        eventEmitter.emit('memory:cleanup');
    }
}
```

## Data Management Best Practices

### Data Quality Standards

#### Validation Rules
```yaml
# config/data-quality-rules.yaml
validation_rules:
  customers:
    required_fields:
      - customer_id
      - email
      - created_date
    
    field_validations:
      customer_id:
        type: "string"
        pattern: "^CUST[0-9]{6}$"
        unique: true
        
      email:
        type: "string"
        pattern: "^[\\w\\.-]+@[\\w\\.-]+\\.[a-zA-Z]{2,}$"
        unique: true
        
      age:
        type: "integer"
        min: 0
        max: 150
        
    business_rules:
      - name: "email_domain_check"
        condition: "email NOT LIKE '%@example.com'"
        severity: "warning"
        
      - name: "recent_activity"
        condition: "last_login_date > DATE_SUB(CURRENT_DATE, INTERVAL 90 DAY)"
        severity: "info"
```

#### Data Lineage Tracking
```python
class DataLineageTracker:
    """Track data lineage across transformations."""
    
    def __init__(self, metadata_store):
        self.metadata_store = metadata_store
    
    def track_transformation(self, 
                           source_datasets: List[str],
                           target_dataset: str,
                           transformation_logic: str,
                           execution_context: Dict):
        """Track a data transformation operation."""
        lineage_record = {
            'transformation_id': str(uuid.uuid4()),
            'timestamp': datetime.now().isoformat(),
            'source_datasets': source_datasets,
            'target_dataset': target_dataset,
            'transformation_logic': transformation_logic,
            'execution_context': execution_context,
            'data_quality_metrics': self._calculate_quality_metrics(target_dataset)
        }
        
        self.metadata_store.store_lineage(lineage_record)
        return lineage_record['transformation_id']
```

### Schema Management

#### Schema Evolution
```sql
-- Migration script: V1.2__add_customer_segments.sql
-- Add new columns with proper defaults
ALTER TABLE customers 
ADD COLUMN segment VARCHAR(50) DEFAULT 'standard';

ALTER TABLE customers 
ADD COLUMN segment_score DECIMAL(5,2) DEFAULT 0.00;

-- Create index for new columns
CREATE INDEX idx_customers_segment ON customers(segment);

-- Update existing records
UPDATE customers 
SET segment = 'premium' 
WHERE total_lifetime_value > 10000;

UPDATE customers 
SET segment = 'vip' 
WHERE total_lifetime_value > 50000;
```

#### Schema Validation
```python
from jsonschema import validate, ValidationError

class SchemaValidator:
    def __init__(self):
        self.schemas = self._load_schemas()
    
    def validate_dataset(self, dataset_name: str, data: Dict) -> bool:
        """Validate data against registered schema."""
        try:
            schema = self.schemas.get(dataset_name)
            if not schema:
                raise ValueError(f"Schema not found for dataset: {dataset_name}")
            
            validate(instance=data, schema=schema)
            return True
            
        except ValidationError as e:
            self.logger.error(f"Schema validation failed: {e.message}")
            return False
```

## Security Best Practices

### Authentication and Authorization

#### API Security
```javascript
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');

// Security middleware
app.use(helmet());

// Rate limiting
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);

// Authentication middleware
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
}
```

#### Data Encryption
```python
from cryptography.fernet import Fernet
import os

class CredentialManager:
    """Secure credential management."""
    
    def __init__(self):
        self.key = os.environ.get('ENCRYPTION_KEY')
        if not self.key:
            raise ValueError("ENCRYPTION_KEY environment variable required")
        self.cipher_suite = Fernet(self.key.encode())
    
    def encrypt_credential(self, credential: str) -> str:
        """Encrypt a credential for storage."""
        encrypted = self.cipher_suite.encrypt(credential.encode())
        return encrypted.decode()
    
    def decrypt_credential(self, encrypted_credential: str) -> str:
        """Decrypt a stored credential."""
        decrypted = self.cipher_suite.decrypt(encrypted_credential.encode())
        return decrypted.decode()
```

### Audit Logging

#### Security Event Logging
```javascript
class SecurityLogger {
    constructor() {
        this.auditLogger = winston.createLogger({
            level: 'info',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
            ),
            transports: [
                new winston.transports.File({ 
                    filename: 'logs/security-audit.log',
                    maxsize: 10000000, // 10MB
                    maxFiles: 10
                })
            ]
        });
    }
    
    logAuthAttempt(userId, success, ipAddress, userAgent) {
        this.auditLogger.info('Authentication attempt', {
            eventType: 'AUTH_ATTEMPT',
            userId,
            success,
            ipAddress,
            userAgent,
            timestamp: new Date().toISOString()
        });
    }
    
    logDataAccess(userId, resource, action, success) {
        this.auditLogger.info('Data access', {
            eventType: 'DATA_ACCESS',
            userId,
            resource,
            action,
            success,
            timestamp: new Date().toISOString()
        });
    }
}
```

## Deployment Best Practices

### Environment Management

#### Configuration Management
```bash
# .env.development
NODE_ENV=development
LOG_LEVEL=debug
DUCKDB_MEMORY_LIMIT=2GB
ENABLE_PROFILING=true

# .env.production
NODE_ENV=production
LOG_LEVEL=info
DUCKDB_MEMORY_LIMIT=16GB
ENABLE_PROFILING=false
```

#### Health Checks
```javascript
class HealthChecker {
    constructor(components) {
        this.components = components;
    }
    
    async checkHealth() {
        const results = await Promise.allSettled(
            Object.entries(this.components).map(async ([name, component]) => {
                const startTime = Date.now();
                try {
                    await component.healthCheck();
                    return {
                        name,
                        status: 'healthy',
                        responseTime: Date.now() - startTime
                    };
                } catch (error) {
                    return {
                        name,
                        status: 'unhealthy',
                        error: error.message,
                        responseTime: Date.now() - startTime
                    };
                }
            })
        );
        
        return {
            overall: results.every(r => r.value.status === 'healthy') ? 'healthy' : 'unhealthy',
            components: results.map(r => r.value),
            timestamp: new Date().toISOString()
        };
    }
}
```

### Monitoring and Alerting

#### Metrics Collection
```javascript
const promClient = require('prom-client');

// Create metrics
const queryDurationHistogram = new promClient.Histogram({
    name: 'duckdb_query_duration_seconds',
    help: 'Duration of DuckDB queries',
    buckets: [0.1, 0.5, 1, 5, 10, 30, 60]
});

const qualityScoreGauge = new promClient.Gauge({
    name: 'data_quality_score',
    help: 'Current data quality score',
    labelNames: ['dataset']
});

// Use metrics in code
async function executeQuery(query) {
    const endTimer = queryDurationHistogram.startTimer();
    try {
        const result = await duckdbWrapper.execute(query);
        endTimer();
        return result;
    } catch (error) {
        endTimer();
        throw error;
    }
}
```

## Maintenance Best Practices

### Regular Maintenance Tasks

#### Database Maintenance
```sql
-- Weekly maintenance script
-- Analyze tables for query optimization
ANALYZE;

-- Check database integrity
PRAGMA integrity_check;

-- Compact database (if needed)
VACUUM;

-- Update statistics
UPDATE statistics SET last_updated = CURRENT_TIMESTAMP;
```

#### Log Rotation
```javascript
// Log rotation configuration
const winston = require('winston');
require('winston-daily-rotate-file');

const logger = winston.createLogger({
    transports: [
        new winston.transports.DailyRotateFile({
            filename: 'logs/application-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '100m',
            maxFiles: '30d',
            zippedArchive: true
        })
    ]
});
```

### Backup Strategies

#### Automated Backups
```bash
#!/bin/bash
# backup-script.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/data-practitioner"
SOURCE_DIR="/data"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Backup DuckDB database
cp "$SOURCE_DIR/analytics.duckdb" "$BACKUP_DIR/analytics_$DATE.duckdb"

# Backup configuration files
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" config/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -type f -mtime +30 -delete

# Verify backup integrity
duckdb "$BACKUP_DIR/analytics_$DATE.duckdb" "PRAGMA integrity_check;"

echo "Backup completed: $DATE"
```

### Performance Monitoring

#### Performance Benchmarking
```python
import time
import statistics
from typing import List, Dict

class PerformanceBenchmark:
    """Performance benchmarking utility."""
    
    def __init__(self):
        self.results = {}
    
    def benchmark_function(self, func_name: str, func, iterations: int = 10):
        """Benchmark a function's performance."""
        execution_times = []
        
        for _ in range(iterations):
            start_time = time.time()
            func()
            execution_time = time.time() - start_time
            execution_times.append(execution_time)
        
        self.results[func_name] = {
            'mean': statistics.mean(execution_times),
            'median': statistics.median(execution_times),
            'min': min(execution_times),
            'max': max(execution_times),
            'std_dev': statistics.stdev(execution_times),
            'iterations': iterations
        }
    
    def generate_report(self) -> Dict:
        """Generate performance benchmark report."""
        return {
            'timestamp': time.time(),
            'benchmarks': self.results
        }
```

## Quality Assurance Best Practices

### Code Review Standards

#### Review Checklist
- [ ] Code follows established patterns and conventions
- [ ] All functions have appropriate error handling
- [ ] Unit tests cover new functionality
- [ ] Documentation is updated
- [ ] Configuration changes are documented
- [ ] Security considerations are addressed
- [ ] Performance impact is evaluated
- [ ] Breaking changes are documented

#### Review Process
1. **Automated Checks**: Run linting, type checking, and tests
2. **Peer Review**: At least one senior developer review
3. **Security Review**: For security-sensitive changes
4. **Performance Review**: For performance-critical changes
5. **Documentation Review**: Ensure documentation accuracy

### Continuous Integration

#### CI Pipeline Configuration
```yaml
# .github/workflows/ci.yml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
        python-version: [3.9, 3.10, 3.11]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: ${{ matrix.python-version }}
    
    - name: Install dependencies
      run: |
        npm ci
        pip install -r requirements.txt
    
    - name: Run linting
      run: |
        npm run lint
        flake8 python-analysis/
    
    - name: Run tests
      run: |
        npm test -- --coverage
        pytest python-analysis/tests/ --cov
    
    - name: Run quality gates
      run: npm run qa:check
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

## Appendix

### Development Tools Configuration

#### VS Code Settings
```json
{
  "editor.tabSize": 2,
  "editor.insertSpaces": true,
  "editor.formatOnSave": true,
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "javascript.preferences.importModuleSpecifier": "relative",
  "eslint.autoFixOnSave": true,
  "files.exclude": {
    "**/node_modules": true,
    "**/.git": true,
    "**/.DS_Store": true,
    "**/coverage": true
  }
}
```

#### ESLint Configuration
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended"
  ],
  "rules": {
    "no-console": "warn",
    "prefer-const": "error",
    "no-unused-vars": "error",
    "semi": ["error", "always"],
    "quotes": ["error", "single"],
    "indent": ["error", 2]
  }
}
```

### Performance Optimization Checklist

#### Database Optimization
- [ ] Appropriate indexes created
- [ ] Query plans reviewed
- [ ] Memory allocation optimized
- [ ] Connection pooling configured
- [ ] Query result caching implemented

#### Application Optimization
- [ ] Code profiling completed
- [ ] Memory leaks identified and fixed
- [ ] Async operations optimized
- [ ] Error handling optimized
- [ ] Logging overhead minimized

#### Infrastructure Optimization
- [ ] Resource limits configured
- [ ] Monitoring implemented
- [ ] Backup strategies tested
- [ ] Disaster recovery plan created
- [ ] Security measures implemented

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial best practices guide | Dev Agent |