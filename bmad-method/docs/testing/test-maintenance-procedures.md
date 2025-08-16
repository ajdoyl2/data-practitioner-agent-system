# Test Maintenance Procedures

**Version**: 1.0.0  
**Date**: August 2024  
**Story**: 1.0.3 Enhanced Test Coverage  

## Overview

This document outlines the procedures for maintaining the BMad-Method test suite, ensuring consistent test coverage, quality, and reliability across the codebase.

## Test Coverage Requirements

### Minimum Coverage Thresholds

- **Global Coverage**: 80% minimum (lines, functions, branches, statements)
- **Tools Directory**: 85% minimum (critical CLI functionality)
- **Integration Tests**: 70% minimum
- **Regression Tests**: Baseline coverage tracking

### Coverage Categories

1. **CLI Tools Tests** (`tests/tools/`)
   - Command functionality testing
   - Integration with underlying libraries
   - Error handling and edge cases

2. **Agent Workflow Tests** (`tests/agents/`)
   - YAML configuration processing
   - Dependency resolution
   - Team composition workflows

3. **Storage Operations Tests** (`tests/storage/`)
   - File system operations
   - YAML/Markdown parsing
   - Configuration management

4. **Regression Tests** (`tests/regression/`)
   - CLI command output consistency
   - Performance baselines
   - Workflow behavioral testing

## Test Suite Structure

```
tests/
├── fixtures/                    # Test data and baselines
│   ├── cli-baselines/          # CLI regression baselines
│   ├── workflow-baselines/     # Workflow execution baselines
│   └── performance-thresholds.json
├── tools/                      # CLI tool tests
├── agents/                     # Agent workflow tests
├── storage/                    # File operations tests
├── regression/                 # Regression and baseline tests
└── __snapshots__/             # Jest snapshot files
```

## Maintenance Procedures

### 1. Daily Test Execution

**Run Full Test Suite**:
```bash
npm test
```

**Run with Coverage**:
```bash
npm run test:coverage
```

**Generate Coverage Report**:
```bash
npm run test:coverage:report
```

### 2. Weekly Coverage Review

1. **Check Coverage Reports**:
   - Review `coverage/reports/coverage-report.md`
   - Identify files below threshold
   - Prioritize critical path coverage

2. **Update Coverage Baselines**:
   ```bash
   npm run test:baseline
   npm run test:baseline:validate
   ```

3. **Performance Monitoring**:
   - Review test execution times
   - Check for performance regressions
   - Update performance thresholds if needed

### 3. Monthly Regression Testing

1. **Regenerate Baselines**:
   ```bash
   npm run test:baseline
   ```

2. **Validate Against Previous Baselines**:
   - Compare with previous month's baselines
   - Document any intentional changes
   - Investigate unexpected differences

3. **Update Documentation**:
   - Review and update test procedures
   - Document new testing patterns
   - Update coverage requirements if needed

## Adding New Tests

### 1. Test File Naming Convention

- **Unit Tests**: `{component-name}.test.js`
- **Integration Tests**: `{feature-name}-integration.test.js`
- **Regression Tests**: `{area}-baseline.test.js`

### 2. Test Structure Template

```javascript
/**
 * {Component Name} Test Suite
 * {Brief description of what this tests}
 */

const {RequiredModules} = require('../path/to/modules');

describe('{Component Name} Test Suite', () => {
  beforeEach(() => {
    // Setup for each test
    jest.clearAllMocks();
  });

  describe('{Feature Group}', () => {
    test('should {expected behavior}', async () => {
      // Arrange
      const input = {};
      
      // Act
      const result = await functionUnderTest(input);
      
      // Assert
      expect(result).toEqual(expectedOutput);
    });
  });
});
```

### 3. Mocking Guidelines

**File System Operations**:
```javascript
jest.mock('fs-extra');
const fs = require('fs-extra');
```

**CLI Commands**:
```javascript
jest.mock('child_process');
const { execSync } = require('child_process');
```

**External Dependencies**:
```javascript
jest.mock('../../tools/lib/dependency-resolver');
```

### 4. Coverage Requirements for New Tests

1. **Identify Critical Paths**: Focus on user-facing functionality
2. **Test Error Conditions**: Include failure scenarios
3. **Edge Case Coverage**: Test boundary conditions
4. **Integration Points**: Test module interactions

## Updating Existing Tests

### 1. When to Update Tests

- **Code Changes**: When modifying tested functionality
- **Coverage Gaps**: When coverage reports show gaps
- **Bug Fixes**: When fixing reported issues
- **Performance Issues**: When tests become slow or flaky

### 2. Test Update Process

1. **Identify Impact**: Determine which tests need updates
2. **Update Test Cases**: Modify assertions and expectations
3. **Update Mocks**: Adjust mocked dependencies
4. **Regenerate Snapshots**: Update Jest snapshots if needed
5. **Validate Coverage**: Ensure coverage is maintained

### 3. Snapshot Management

**Update Snapshots**:
```bash
npm test -- --updateSnapshot
```

**Review Snapshot Changes**:
- Always review snapshot diffs before committing
- Ensure changes are intentional
- Document reasons for snapshot updates

## Troubleshooting Common Issues

### 1. Coverage Below Threshold

**Diagnosis**:
```bash
npm run test:coverage:report
```

**Solutions**:
- Add tests for uncovered lines
- Remove dead code
- Adjust coverage thresholds if justified

### 2. Flaky Tests

**Identification**:
- Tests that pass/fail intermittently
- Tests that depend on timing
- Tests that depend on external state

**Solutions**:
- Add proper wait conditions
- Mock time-dependent functions
- Isolate test environment
- Use deterministic test data

### 3. Performance Issues

**Diagnosis**:
- Use `--verbose` flag to identify slow tests
- Profile test execution times
- Check for resource leaks

**Solutions**:
- Optimize test setup/teardown
- Use selective test execution
- Mock expensive operations
- Parallelize independent tests

### 4. Mock Issues

**Common Problems**:
- Mocks not properly reset
- Incomplete mock implementations
- Mock/real module mismatches

**Solutions**:
```javascript
beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  jest.restoreAllMocks();
});
```

## CI/CD Integration

### 1. Continuous Integration Tests

**Required CI Commands**:
```bash
npm run test:ci
npm run test:coverage:report
```

**Failure Conditions**:
- Any test failure
- Coverage below threshold
- Performance regression beyond baseline

### 2. Pull Request Testing

**PR Test Requirements**:
1. All tests must pass
2. Coverage must meet or exceed thresholds
3. New code must include tests
4. Regression baselines must be updated if behavior changes

### 3. Release Testing

**Pre-Release Checklist**:
- [ ] Full test suite passes
- [ ] Coverage meets requirements
- [ ] Regression baselines validated
- [ ] Performance within acceptable limits
- [ ] Documentation updated

## Test Data Management

### 1. Test Fixtures

**Location**: `tests/fixtures/`

**Types**:
- **Static Data**: Sample YAML, JSON, Markdown files
- **Baselines**: Performance and regression benchmarks
- **Snapshots**: Jest snapshot files

### 2. Test Data Guidelines

- **Isolation**: Each test should have independent data
- **Cleanup**: Remove temporary files after tests
- **Versioning**: Track changes to test data
- **Security**: No sensitive data in test files

### 3. Baseline Management

**Generating Baselines**:
```bash
npm run test:baseline
```

**Validating Baselines**:
```bash
npm run test:baseline:validate
```

**Updating Baselines**:
- Only update when functionality intentionally changes
- Document reasons for baseline changes
- Review baseline diffs before committing

## Performance Monitoring

### 1. Test Execution Metrics

**Track**:
- Total test execution time
- Individual test performance
- Memory usage during tests
- Coverage generation time

### 2. Performance Thresholds

**Current Limits**:
- Full test suite: < 30 seconds
- Coverage generation: < 45 seconds
- Individual tests: < 5 seconds
- Regression tests: < 10 seconds

### 3. Performance Optimization

**Strategies**:
- Parallel test execution
- Selective test running
- Efficient mocking
- Resource cleanup

## Documentation Standards

### 1. Test Documentation

**Requirements**:
- Clear test descriptions
- Commented complex test logic
- Updated coverage documentation
- Procedure documentation maintenance

### 2. Change Documentation

**For Each Change**:
- Document test additions/modifications
- Update coverage impact
- Note baseline changes
- Update maintenance procedures

### 3. Knowledge Transfer

**Maintain**:
- Test maintenance runbooks
- Troubleshooting guides
- Best practices documentation
- Training materials

## Roles and Responsibilities

### 1. Development Team

**Responsibilities**:
- Write tests for new features
- Maintain existing test coverage
- Fix failing tests promptly
- Follow testing best practices

### 2. QA Team

**Responsibilities**:
- Review test coverage adequacy
- Validate regression testing
- Performance monitoring
- Test procedure compliance

### 3. DevOps Team

**Responsibilities**:
- CI/CD test integration
- Test environment maintenance
- Performance monitoring
- Automated reporting

## Tools and Resources

### 1. Testing Tools

- **Jest**: Primary testing framework
- **Supertest**: HTTP endpoint testing
- **fs-extra**: File system operations
- **child_process**: CLI command testing

### 2. Coverage Tools

- **Istanbul/NYC**: Coverage generation
- **Custom Scripts**: Enhanced reporting
- **Badge Generation**: Coverage visualization

### 3. Monitoring Tools

- **Performance Baselines**: Automated tracking
- **Coverage Trending**: Historical analysis
- **CI/CD Integration**: Automated validation

## Conclusion

Maintaining the BMad-Method test suite requires consistent attention to coverage, performance, and reliability. Following these procedures ensures that the test suite continues to provide value and confidence in the codebase quality.

For questions or improvements to these procedures, please update this document and ensure team alignment on any changes.