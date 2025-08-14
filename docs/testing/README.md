# BMad-Method Testing Documentation

Comprehensive testing documentation for the BMad-Method Data Practitioner expansion pack integration.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Python/Node.js Integration Testing](#pythonnodejs-integration-testing)
- [Performance Testing](#performance-testing)
- [Data Testing Utilities](#data-testing-utilities)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)
- [Maintenance](#maintenance)

## Overview

The BMad-Method testing framework provides comprehensive coverage for the brownfield data practitioner enhancement, ensuring that:

1. **Existing functionality remains unchanged** - Regression testing validates all current BMad-Method features
2. **Python/Node.js integration works reliably** - Subprocess communication is thoroughly tested
3. **Performance baselines are maintained** - Automated performance regression detection
4. **Data processing components are validated** - DuckDB and PyAirbyte integration testing
5. **CI/CD pipeline ensures quality** - Automated testing across multiple environments

## Test Structure

```
bmad-method/tests/
├── integration/           # Integration tests
│   ├── python-nodejs-subprocess.test.js    # Python/Node.js communication
│   ├── mock-python-scripts.test.js         # Mock script integration
│   └── existing-system-compatibility.test.js # Backward compatibility
├── regression/            # Regression tests
│   ├── cli-commands.test.js                 # CLI command regression
│   └── agent-workflows.test.js              # Agent workflow regression
├── performance/           # Performance tests
│   ├── bmad-cli-baseline.test.js           # CLI performance baselines
│   └── agent-workflow-baseline.test.js     # Workflow performance baselines
├── data-services/         # Data service tests
│   ├── duckdb-wrapper.test.js              # DuckDB integration
│   └── pyairbyte-wrapper.test.js           # PyAirbyte integration
├── utils/                 # Testing utilities
│   ├── duckdb-test-utils.js                # DuckDB testing framework
│   └── pyairbyte-test-utils.js             # PyAirbyte testing framework
└── fixtures/              # Test data and fixtures
    ├── test-data-manager.js                # Test data management
    ├── mock-python-scripts/                # Mock Python scripts
    ├── performance-thresholds.json         # Performance baselines
    └── agent-workflow-baseline.json        # Workflow baselines
```

## Running Tests

### All Tests
```bash
cd bmad-method
npm test
```

### Test Categories
```bash
# Integration tests
npm test -- --testPathPatterns="tests/integration"

# Regression tests
npm test -- --testPathPatterns="tests/regression"

# Performance tests
npm test -- --testPathPatterns="tests/performance"

# Data service tests
npm test -- --testPathPatterns="tests/data-services"

# Specific test files
npm test -- tests/integration/python-nodejs-subprocess.test.js
```

### With Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

### Debug Mode
```bash
npm test -- --verbose --detectOpenHandles
```

## Test Categories

### 1. Integration Tests

**Purpose**: Validate Python/Node.js communication and component integration

**Key Files**:
- `python-nodejs-subprocess.test.js` - Tests subprocess communication, error handling, timeouts
- `mock-python-scripts.test.js` - Tests mock data processing workflows
- `existing-system-compatibility.test.js` - Validates backward compatibility

**What's Tested**:
- ✅ Python script execution from Node.js
- ✅ JSON data exchange between Python and Node.js
- ✅ Error handling and timeout scenarios
- ✅ Unicode character support
- ✅ Concurrent subprocess execution
- ✅ Resource cleanup and process management

### 2. Regression Tests

**Purpose**: Ensure existing BMad-Method functionality remains unchanged

**Key Files**:
- `cli-commands.test.js` - Tests all CLI commands maintain identical behavior
- `agent-workflows.test.js` - Tests agent loading and workflow patterns

**What's Tested**:
- ✅ All CLI commands execute successfully
- ✅ Agent definition loading and parsing
- ✅ Web builder functionality
- ✅ File-based storage patterns
- ✅ Configuration loading
- ✅ Error handling consistency

### 3. Performance Tests

**Purpose**: Establish baselines and detect performance regressions

**Key Files**:
- `bmad-cli-baseline.test.js` - CLI command performance benchmarks
- `agent-workflow-baseline.test.js` - Agent workflow performance metrics

**What's Tested**:
- ✅ CLI command response times (validate, build, list commands)
- ✅ Agent file loading performance
- ✅ Memory usage patterns
- ✅ Regression threshold calculation
- ✅ Performance consistency validation

**Current Baselines**:
- `validate`: ~224ms (±69ms)
- `build`: ~334ms (±30ms)
- `list:agents`: ~154ms (±5ms)
- `help`: ~147ms (±8ms)

### 4. Data Service Tests

**Purpose**: Test data processing components and utilities

**Key Files**:
- `duckdb-wrapper.test.js` - DuckDB integration testing
- `pyairbyte-wrapper.test.js` - PyAirbyte connector testing

**What's Tested**:
- ✅ DuckDB in-memory database operations
- ✅ PyAirbyte connector functionality
- ✅ Data ingestion workflows
- ✅ Data quality validation
- ✅ Error handling for data operations

## Python/Node.js Integration Testing

### Prerequisites

Ensure Python environment is properly configured:

```bash
# Install Python dependencies
pip install -r requirements.txt

# Verify critical packages
python -c "import duckdb, pandas, json; print('Python dependencies OK')"
```

### Testing Subprocess Communication

The integration tests validate:

1. **Basic Execution**: Python scripts can be executed from Node.js
2. **Data Exchange**: JSON data can be passed to and received from Python
3. **Error Handling**: Python errors are properly caught and translated
4. **Timeout Management**: Long-running operations are properly terminated
5. **Resource Cleanup**: Subprocess resources are properly cleaned up

### Mock Python Scripts

Located in `tests/fixtures/mock-python-scripts/`:

- `data-processor.py` - Simulates data transformation, validation, and aggregation
- `pyairbyte-mock.py` - Simulates PyAirbyte connector operations

### Testing Custom Python Scripts

```javascript
const PythonSubprocessManager = require('../../tools/lib/python-subprocess');

const pythonManager = new PythonSubprocessManager();

// Execute custom Python script
const result = await pythonManager.execute('path/to/script.py', ['--arg', 'value'], {
  parseJson: true,
  input: { data: 'test' }
});
```

## Performance Testing

### Baseline Establishment

Performance baselines are automatically established during test execution:

1. **CLI Commands**: Measured across 5 iterations with statistical analysis
2. **Agent Workflows**: File I/O and memory usage patterns
3. **Regression Thresholds**: Calculated as 150% of baseline + 2 standard deviations

### Performance Monitoring

```bash
# Run performance tests
npm test -- --testPathPatterns="tests/performance"

# Check current baselines
cat tests/fixtures/performance-thresholds.json
cat tests/fixtures/agent-workflow-baseline.json
```

### Regression Detection

Automatic regression detection flags performance degradation:

- **Warning**: Performance > 125% of baseline
- **Error**: Performance > regression threshold
- **Critical**: Performance > 200% of baseline

## Data Testing Utilities

### DuckDB Test Utils

```javascript
const DuckDBTestUtils = require('../utils/duckdb-test-utils');

const dbUtils = new DuckDBTestUtils();

// Create in-memory database
const connection = await dbUtils.createInMemoryDB();

// Create test tables with sample data
await dbUtils.createTestDatabase(connection);

// Run data quality checks
const qualityResults = await dbUtils.runDataQualityChecks(connection, 'users');

// Cleanup
await dbUtils.cleanup();
```

### PyAirbyte Test Utils

```javascript
const PyAirbyteTestUtils = require('../utils/pyairbyte-test-utils');

const airbyteUtils = new PyAirbyteTestUtils();

// Create mock connector
const connector = await airbyteUtils.createMockConnector('database');

// Test connection and data extraction
await connector.connect();
const streams = await connector.listStreams();
const data = await connector.readStream('users', 10);

// Cleanup
await airbyteUtils.cleanup();
```

### Test Data Manager

```javascript
const TestDataManager = require('../fixtures/test-data-manager');

const dataManager = new TestDataManager({ testSuiteId: 'my-test' });

// Generate test datasets
await dataManager.initialize();
const usersFile = await dataManager.createUserData(100, 'json');
const ordersFile = await dataManager.createOrderData(100, 3, 'csv');

// Load test data
const users = await dataManager.loadTestData('users');

// Cleanup
await dataManager.cleanup();
```

## CI/CD Integration

### GitHub Actions Workflow

Located at `.github/workflows/integration-tests.yml`

**Test Matrix**:
- Node.js versions: 18.x, 20.x
- Python versions: 3.9, 3.11
- Operating systems: Ubuntu, Windows, macOS

**Pipeline Stages**:
1. **Environment Setup** - Node.js, Python, dependencies
2. **Python Validation** - Verify Python dependencies
3. **Integration Tests** - Python/Node.js communication
4. **Performance Tests** - Baseline validation
5. **Regression Tests** - Existing functionality
6. **Data Pipeline Tests** - Data utilities and workflows
7. **Cross-Platform Tests** - Platform compatibility
8. **Coverage Reporting** - Test coverage analysis

### Running CI Tests Locally

```bash
# Install dependencies
npm ci
pip install -r requirements.txt

# Run full test suite
npm test

# Run specific CI test categories
npm test -- --testPathPatterns="tests/integration"
npm test -- --testPathPatterns="tests/regression"
npm test -- --testPathPatterns="tests/performance"
```

## Troubleshooting

### Common Issues

#### 1. Python Subprocess Timeout

**Symptoms**: Tests fail with timeout errors
**Solutions**:
- Increase timeout in test configuration
- Check Python script performance
- Verify Python environment is properly configured

```javascript
const pythonManager = new PythonSubprocessManager({
  timeout: 30000 // Increase timeout to 30 seconds
});
```

#### 2. Python Module Import Errors

**Symptoms**: `ModuleNotFoundError` in Python scripts
**Solutions**:
- Verify `requirements.txt` is installed: `pip install -r requirements.txt`
- Check Python path configuration
- Ensure virtual environment is activated

#### 3. Performance Test Failures

**Symptoms**: Performance tests fail due to slow execution
**Solutions**:
- Check system load during test execution
- Update performance thresholds if hardware changed
- Review baseline calculations in `performance-thresholds.json`

#### 4. File Permission Errors

**Symptoms**: Cannot create or delete test files
**Solutions**:
- Check file system permissions
- Ensure test cleanup is properly executed
- Use isolated test directories

### Debug Commands

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific failing test
npm test -- tests/path/to/failing.test.js --verbose

# Run with debugging
npm test -- --detectOpenHandles --forceExit

# Check Python environment
python -c "import sys; print(sys.path)"
pip list
```

### Log Analysis

Test logs include:
- **Subprocess execution details** - Python script calls and responses
- **Performance metrics** - Execution times and memory usage
- **Error stack traces** - Detailed error information
- **Resource cleanup** - File and process cleanup status

## Maintenance

### Updating Baselines

When system performance characteristics change:

```bash
# Re-establish performance baselines
npm test -- --testPathPatterns="tests/performance"

# Review updated thresholds
cat tests/fixtures/performance-thresholds.json
```

### Adding New Tests

1. **Integration Tests**: Add to `tests/integration/`
2. **Regression Tests**: Add to `tests/regression/`
3. **Performance Tests**: Add to `tests/performance/`
4. **Data Tests**: Add to `tests/data-services/`

### Test Data Management

- **Fixtures**: Store in `tests/fixtures/`
- **Mock Scripts**: Store in `tests/fixtures/mock-python-scripts/`
- **Temporary Data**: Use TestDataManager for automatic cleanup
- **Large Datasets**: Generate programmatically, don't commit to repository

### Review Schedule

- **Weekly**: Review test performance and failure rates
- **Monthly**: Update performance baselines if needed
- **Quarterly**: Review test coverage and add new test scenarios
- **Before Releases**: Full regression test execution and validation

## Support

For testing issues or questions:

1. Check this documentation first
2. Review test logs and error messages
3. Verify environment configuration (Node.js, Python, dependencies)
4. Run tests in isolation to identify specific failures
5. Check GitHub Actions logs for CI/CD issues

**Test Coverage Goals**:
- **Integration Tests**: 90%+ for Python/Node.js communication
- **Regression Tests**: 100% for existing BMad-Method functionality
- **Performance Tests**: All CLI commands and critical workflows
- **Data Tests**: 80%+ for data processing components