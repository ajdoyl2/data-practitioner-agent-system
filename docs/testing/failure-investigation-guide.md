# Test Failure Investigation Guide

Comprehensive guide for diagnosing and resolving test failures in the BMad-Method Data Practitioner testing framework.

## Quick Reference

| Failure Type | First Steps | Common Causes | Solutions |
|-------------|-------------|---------------|-----------|
| Python Subprocess | Check Python environment | Missing dependencies, path issues | `pip install -r requirements.txt` |
| Performance Regression | Check system load | Hardware change, background processes | Update baselines, isolate tests |
| CLI Command Failure | Test command manually | Code changes, missing files | Verify functionality, check paths |
| Integration Test | Check component status | Service unavailable, configuration | Restart services, verify config |
| Mock Script Error | Verify mock scripts exist | Missing fixtures, permission issues | Check file permissions, recreate fixtures |

## Investigation Process

### Step 1: Identify Failure Category

```bash
# Run specific test category to isolate issue
npm test -- --testPathPatterns="tests/integration" --verbose
npm test -- --testPathPatterns="tests/regression" --verbose
npm test -- --testPathPatterns="tests/performance" --verbose
```

### Step 2: Examine Error Messages

Common error patterns and their meanings:

#### Python Subprocess Errors

```
Error: Python script execution failed: ModuleNotFoundError: No module named 'duckdb'
```
**Diagnosis**: Missing Python dependency
**Solution**: Install requirements and verify Python environment

```
Error: Process timed out after 15000ms
```
**Diagnosis**: Python script taking too long or hanging
**Solution**: Increase timeout or optimize Python script

#### Performance Test Errors

```
Expected: < 500
Received: 1250
```
**Diagnosis**: Performance regression detected
**Solution**: Investigate performance changes or update baselines

#### CLI Command Errors

```
Error: Command failed with exit code 1
```
**Diagnosis**: CLI command execution failure
**Solution**: Test command manually and check implementation

### Step 3: Detailed Investigation

## Python/Node.js Integration Failures

### Environment Validation

```bash
# Check Python installation
python --version
python3 --version

# Verify required packages
python -c "import duckdb, pandas, json; print('All packages available')"

# Check Node.js version
node --version
npm --version

# Verify BMad-Method dependencies
cd bmad-method && npm ls
```

### Subprocess Communication Issues

```javascript
// Debug subprocess execution
const PythonSubprocessManager = require('./tools/lib/python-subprocess');
const manager = new PythonSubprocessManager({ timeout: 30000 });

// Test basic execution
try {
  const result = await manager.execute('python', ['--version']);
  console.log('Python execution successful:', result);
} catch (error) {
  console.error('Python execution failed:', error);
}
```

### Common Python Issues

#### 1. Module Import Errors

**Investigation**:
```bash
# Check Python path
python -c "import sys; print('\n'.join(sys.path))"

# Test specific imports
python -c "import duckdb; print(f'DuckDB version: {duckdb.__version__}')"
python -c "import pandas; print(f'Pandas version: {pandas.__version__}')"
```

**Solutions**:
```bash
# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Use virtual environment
python -m venv venv
source venv/bin/activate  # Linux/macOS
# or
venv\Scripts\activate     # Windows
pip install -r requirements.txt
```

#### 2. JSON Communication Errors

**Investigation**:
```bash
# Test JSON handling
echo '{"test": "data"}' | python -c "import sys, json; data=json.load(sys.stdin); print(json.dumps(data))"
```

**Common Issues**:
- Invalid JSON syntax in test data
- Unicode encoding issues
- Large JSON payloads causing memory issues

#### 3. File Path Issues

**Investigation**:
```javascript
// Check file paths in tests
const path = require('path');
const fs = require('fs-extra');

const scriptPath = path.join(__dirname, 'tests/fixtures/mock-python-scripts/data-processor.py');
console.log('Script exists:', await fs.pathExists(scriptPath));
console.log('Script path:', scriptPath);
```

## Performance Test Failures

### Baseline Analysis

```bash
# Check current baselines
cat bmad-method/tests/fixtures/performance-thresholds.json

# Compare with previous baselines
git show HEAD~1:bmad-method/tests/fixtures/performance-thresholds.json
```

### System Performance Investigation

```bash
# Check system load during tests
top
htop
iostat 1 5

# Monitor memory usage
free -h
ps aux --sort=-%mem | head -10

# Check disk I/O
iotop
```

### Performance Debugging

```javascript
// Add performance monitoring to tests
const { performance } = require('perf_hooks');

describe('Performance Debug', () => {
  test('should measure operation performance', async () => {
    const startTime = performance.now();
    
    // Your operation here
    await someOperation();
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`Operation took ${duration}ms`);
    
    // Compare against baseline
    const threshold = 500; // ms
    expect(duration).toBeLessThan(threshold);
  });
});
```

### Updating Performance Baselines

When legitimate performance changes occur:

```bash
# Re-establish baselines
npm test -- --testPathPatterns="tests/performance"

# Review changes
git diff tests/fixtures/performance-thresholds.json

# Commit updated baselines if appropriate
git add tests/fixtures/performance-thresholds.json
git commit -m "Update performance baselines after optimization"
```

## CLI Command Failures

### Manual Testing

```bash
cd bmad-method

# Test each command manually
node tools/cli.js --version
node tools/cli.js --help
node tools/cli.js list:agents
node tools/cli.js list:expansions
node tools/cli.js validate
node tools/cli.js build --agents-only
```

### Debug CLI Execution

```javascript
// Add debug logging to CLI tests
const { spawn } = require('child_process');

function debugCliCommand(args) {
  const child = spawn('node', ['tools/cli.js', ...args], {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: __dirname
  });

  child.stdout.on('data', (data) => {
    console.log('STDOUT:', data.toString());
  });

  child.stderr.on('data', (data) => {
    console.log('STDERR:', data.toString());
  });

  child.on('exit', (code, signal) => {
    console.log('Exit code:', code, 'Signal:', signal);
  });
}
```

### Common CLI Issues

#### 1. Path Resolution Errors

**Investigation**:
```bash
# Check current working directory
pwd

# Verify CLI file exists
ls -la tools/cli.js

# Check file permissions
ls -la tools/cli.js
```

#### 2. Configuration File Issues

**Investigation**:
```bash
# Check for configuration files
find . -name "*.yaml" -o -name "*.yml" -o -name "*.json" | grep -E "(config|settings)"

# Validate YAML/JSON syntax
yamllint bmad-core/core-config.yaml
node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))"
```

## Integration Test Failures

### Component Status Check

```bash
# Check all required components
ls -la bmad-core/
ls -la bmad-core/agents/
ls -la tools/
ls -la tools/builders/

# Verify web builder
node -e "const WebBuilder = require('./tools/builders/web-builder'); console.log('WebBuilder loaded successfully');"
```

### Mock Data Validation

```bash
# Check mock scripts
ls -la tests/fixtures/mock-python-scripts/
python tests/fixtures/mock-python-scripts/data-processor.py --help
python tests/fixtures/mock-python-scripts/pyairbyte-mock.py --help
```

### Database Connection Issues

```javascript
// Test DuckDB connection
const DuckDBTestUtils = require('./tests/utils/duckdb-test-utils');

async function testDuckDB() {
  const utils = new DuckDBTestUtils();
  try {
    const connection = await utils.createInMemoryDB();
    console.log('DuckDB connection successful');
    await connection.close();
  } catch (error) {
    console.error('DuckDB connection failed:', error);
  }
}
```

## CI/CD Pipeline Failures

### GitHub Actions Investigation

1. **Check Actions logs**:
   - Go to GitHub repository → Actions tab
   - Select failing workflow run
   - Examine logs for each step

2. **Common CI Issues**:
   - Environment setup failures
   - Dependency installation problems
   - Platform-specific issues
   - Resource limitations

### Local CI Simulation

```bash
# Simulate CI environment locally
docker run -it node:18-alpine sh

# Install dependencies
apk add python3 py3-pip
npm ci
pip install -r requirements.txt

# Run tests
npm test
```

### Platform-Specific Debugging

#### Windows Issues
```bash
# Check Python installation
py --version
py -3 --version

# Use Windows-specific paths
dir tools\cli.js
type tools\cli.js
```

#### macOS Issues
```bash
# Check Python installation
python3 --version
which python3

# Check for permission issues
ls -la tests/fixtures/mock-python-scripts/
chmod +x tests/fixtures/mock-python-scripts/*.py
```

#### Linux Issues
```bash
# Check system packages
apt list --installed | grep python
yum list installed | grep python

# Check for missing system dependencies
ldd $(which python3)
```

## Data Test Failures

### Test Data Validation

```javascript
// Validate test data structure
const TestDataManager = require('./tests/fixtures/test-data-manager');

async function validateTestData() {
  const manager = new TestDataManager();
  
  try {
    await manager.initialize();
    
    // Test data creation
    const usersPath = await manager.createUserData(5, 'json');
    const users = await manager.loadTestData('users');
    
    console.log('Test data validation:', {
      usersCount: users.length,
      sampleUser: users[0]
    });
    
    await manager.cleanup();
  } catch (error) {
    console.error('Test data validation failed:', error);
  }
}
```

### Data Quality Issues

```javascript
// Debug data quality checks
const DuckDBTestUtils = require('./tests/utils/duckdb-test-utils');

async function debugDataQuality() {
  const utils = new DuckDBTestUtils();
  const connection = await utils.createInMemoryDB();
  
  try {
    await utils.createTestDatabase(connection);
    const qualityReport = await utils.runDataQualityChecks(connection, 'users');
    console.log('Data quality report:', JSON.stringify(qualityReport, null, 2));
  } catch (error) {
    console.error('Data quality check failed:', error);
  } finally {
    await utils.cleanup();
  }
}
```

## Memory and Resource Issues

### Memory Leak Detection

```javascript
// Monitor memory usage during tests
describe('Memory Usage', () => {
  test('should not leak memory', async () => {
    const initialMemory = process.memoryUsage();
    
    // Run test operations
    for (let i = 0; i < 100; i++) {
      await performOperation();
    }
    
    // Force garbage collection
    if (global.gc) {
      global.gc();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    console.log('Memory increase:', memoryIncrease / 1024 / 1024, 'MB');
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

### Resource Cleanup Verification

```javascript
// Verify all resources are cleaned up
afterEach(async () => {
  // Check for open handles
  const handles = process._getActiveHandles();
  const requests = process._getActiveRequests();
  
  console.log('Active handles:', handles.length);
  console.log('Active requests:', requests.length);
  
  // Close any remaining connections
  await cleanupResources();
});
```

## Advanced Debugging Techniques

### Test Isolation

```bash
# Run single test in isolation
npm test -- tests/integration/python-nodejs-subprocess.test.js --testNamePattern="should execute basic Python script"

# Run with debugging flags
npm test -- --runInBand --detectOpenHandles --forceExit
```

### Logging and Tracing

```javascript
// Add comprehensive logging
const debug = require('debug');
const log = debug('bmad:test');

describe('Debug Test', () => {
  beforeEach(() => {
    log('Starting test:', expect.getState().currentTestName);
  });
  
  test('should provide detailed logging', async () => {
    log('Test step 1: Setup');
    // Setup code
    
    log('Test step 2: Execution');
    // Execution code
    
    log('Test step 3: Validation');
    // Validation code
  });
});
```

### Performance Profiling

```bash
# Run with Node.js profiler
node --prof --prof-process tests/performance/bmad-cli-baseline.test.js

# Use clinic.js for detailed profiling
npx clinic doctor -- npm test
npx clinic bubbleprof -- npm test
```

## Recovery Procedures

### Clean Test Environment

```bash
# Remove temporary files
rm -rf bmad-method/tests/fixtures/temp/
rm -rf bmad-method/coverage/
rm -f bmad-method/tests/fixtures/*_test_*.json
rm -f bmad-method/tests/fixtures/*_test_*.csv

# Reset performance baselines
git checkout -- bmad-method/tests/fixtures/performance-thresholds.json
git checkout -- bmad-method/tests/fixtures/agent-workflow-baseline.json
```

### Reinstall Dependencies

```bash
# Node.js dependencies
cd bmad-method
rm -rf node_modules package-lock.json
npm install

# Python dependencies
pip uninstall -r requirements.txt -y
pip install -r requirements.txt
```

### Reset Test State

```bash
# Reset git state
git reset --hard HEAD
git clean -fd

# Rebuild project
npm run build

# Re-establish baselines
npm test -- --testPathPatterns="tests/performance"
```

## Escalation Guidelines

### When to Escalate

1. **Infrastructure Issues**: CI/CD pipeline failures, environment setup problems
2. **Critical Regressions**: Performance degradation > 200%, core functionality broken
3. **Security Issues**: Potential security vulnerabilities in test code
4. **Data Corruption**: Test data integrity issues

### Information to Provide

1. **Error logs**: Complete error messages and stack traces
2. **Environment details**: OS, Node.js version, Python version
3. **Reproduction steps**: Exact commands used to reproduce the issue
4. **System state**: Resource usage, running processes
5. **Recent changes**: Recent commits, dependency updates

### Emergency Procedures

```bash
# Disable problematic tests temporarily
npm test -- --testPathIgnorePatterns="tests/problematic/"

# Use previous working baselines
git checkout HEAD~1 -- tests/fixtures/performance-thresholds.json

# Skip CI checks if critical
git commit -m "fix: emergency fix" --no-verify
```