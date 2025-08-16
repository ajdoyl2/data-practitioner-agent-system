# Testing Guidelines and Maintenance

## Overview

This document provides comprehensive guidelines for writing, maintaining, and debugging tests in the BMad-Method project.

## Test Organization

### Directory Structure
```
tests/
├── agents/           # Agent workflow and orchestration tests  
├── data-services/    # Data practitioner service tests
├── integration/      # Cross-component integration tests
├── performance/      # Performance and benchmark tests
├── regression/       # Regression and snapshot tests
├── security/         # Security-specific tests
├── storage/          # File and storage operation tests
├── tools/            # CLI and tool tests
├── fixtures/         # Test data and mock objects
└── utils/            # Test utilities and helpers
```

## Writing Tests

### Test Standards

1. **Naming Convention**
   - Test files: `{component}.test.js` or `{component}.spec.js`
   - Test suites: Descriptive names matching component purpose
   - Test cases: Start with "should" for clarity

2. **Test Structure**
   ```javascript
   describe('Component Name', () => {
     beforeEach(() => {
       // Setup
     });
     
     afterEach(() => {
       // Cleanup
     });
     
     describe('Feature/Method', () => {
       test('should perform expected behavior', () => {
         // Arrange
         // Act
         // Assert
       });
     });
   });
   ```

3. **Mocking Guidelines**
   - Mock external dependencies
   - Use `jest.mock()` for module mocking
   - Clear mocks in `beforeEach()` or `afterEach()`
   - Verify mock calls when testing integrations

### Coverage Requirements

- **Global**: 80% minimum for all metrics
- **Tools Directory**: 80% minimum
- **Critical Paths**: 90% recommended
- **New Code**: 100% expected

### Test Types

#### Unit Tests
- Test individual functions/methods in isolation
- Mock all dependencies
- Focus on edge cases and error conditions
- Keep tests fast (<100ms per test)

#### Integration Tests
- Test component interactions
- Use real implementations where practical
- Test data flow between components
- Verify error propagation

#### Regression Tests
- Snapshot testing for CLI outputs
- Behavioral baseline validation
- Version compatibility checks
- Performance regression detection

#### Performance Tests
- Benchmark critical operations
- Monitor memory usage
- Track execution times
- Set performance budgets

## Running Tests

### Commands

```bash
# Run all tests
npm test

# Run specific test file
npm test -- tests/tools/cli.test.js

# Run with coverage
npm test -- --coverage

# Update snapshots
npm test -- -u

# Watch mode
npm test -- --watch

# Run specific test suite
npm test -- --testNamePattern="CLI Tool"
```

### Coverage Reports

```bash
# Generate coverage report
npm test -- --coverage

# Generate detailed HTML report
npm test -- --coverage --coverageReporters=html

# Run coverage script
node scripts/coverage-report.js
```

## Debugging Tests

### Common Issues and Solutions

#### 1. Mock Not Working
**Problem**: Mock functions not being called or returning undefined
**Solution**:
```javascript
// Ensure mock is properly set up
jest.mock('./module');
const module = require('./module');
module.method = jest.fn().mockReturnValue('value');
```

#### 2. Async Test Failures
**Problem**: Tests passing but showing errors about unhandled promises
**Solution**:
```javascript
// Always use async/await or return promises
test('async test', async () => {
  await expect(asyncFunction()).resolves.toBe('value');
});
```

#### 3. Snapshot Mismatches
**Problem**: Snapshots failing after code changes
**Solution**:
```bash
# Review changes first
npm test -- --no-coverage

# Update if changes are intentional
npm test -- -u
```

#### 4. Coverage Not Meeting Threshold
**Problem**: Coverage below required threshold
**Solution**:
- Add tests for uncovered lines
- Check coverage report: `coverage/lcov-report/index.html`
- Focus on critical paths first

### Debugging Tools

1. **VSCode Debugging**
   ```json
   // .vscode/launch.json
   {
     "type": "node",
     "request": "launch",
     "name": "Jest Debug",
     "program": "${workspaceFolder}/node_modules/.bin/jest",
     "args": ["--runInBand", "--no-coverage"],
     "console": "integratedTerminal"
   }
   ```

2. **Console Debugging**
   ```javascript
   test('debug test', () => {
     console.log('Debug:', variable);
     expect(variable).toBe(expected);
   });
   ```

3. **Jest Verbose Mode**
   ```bash
   npm test -- --verbose
   ```

## Test Maintenance

### Regular Maintenance Tasks

1. **Weekly**
   - Run full test suite
   - Check coverage trends
   - Review failing tests

2. **Monthly**
   - Update snapshots if needed
   - Review and refactor slow tests
   - Update test documentation

3. **Per Release**
   - Full regression testing
   - Performance benchmark comparison
   - Coverage report generation
   - Update test baselines

### Adding New Tests

1. **For New Features**
   - Write tests before implementation (TDD)
   - Cover happy path and edge cases
   - Add integration tests
   - Update regression baselines

2. **For Bug Fixes**
   - Write failing test first
   - Fix the bug
   - Verify test passes
   - Add regression test

3. **For Refactoring**
   - Ensure existing tests pass
   - Add tests if coverage drops
   - Update snapshots if output changes
   - Verify performance doesn't degrade

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Push to main/master/develop branches
- Pull requests
- Scheduled daily runs

### Coverage Enforcement

- PRs blocked if coverage drops below threshold
- Coverage reports posted as PR comments
- Coverage badges updated automatically
- Trend tracking in coverage reports

### Failure Handling

1. **Test Failures in CI**
   - Check GitHub Actions logs
   - Reproduce locally
   - Fix and push updates
   - Re-run CI checks

2. **Coverage Failures**
   - Add missing tests
   - Check for dead code
   - Update thresholds if justified
   - Document exemptions

## Best Practices

### Do's
- ✅ Write descriptive test names
- ✅ Test one thing per test
- ✅ Use beforeEach/afterEach for setup/cleanup
- ✅ Mock external dependencies
- ✅ Test error conditions
- ✅ Keep tests independent
- ✅ Use meaningful assertions
- ✅ Document complex test scenarios

### Don'ts
- ❌ Don't test implementation details
- ❌ Don't use hardcoded timeouts
- ❌ Don't share state between tests
- ❌ Don't ignore failing tests
- ❌ Don't test third-party libraries
- ❌ Don't write overly complex tests
- ❌ Don't skip tests without documentation

## Test Data Management

### Fixtures
- Store in `tests/fixtures/`
- Use meaningful names
- Document data structure
- Keep fixtures minimal

### Mocks
- Centralize common mocks in `tests/utils/`
- Document mock behavior
- Update mocks when APIs change
- Use factory functions for complex mocks

## Performance Testing

### Benchmarks
```javascript
describe('Performance', () => {
  test('should complete within time limit', () => {
    const start = Date.now();
    performOperation();
    const duration = Date.now() - start;
    expect(duration).toBeLessThan(100); // 100ms limit
  });
});
```

### Memory Testing
```javascript
test('should not leak memory', () => {
  const initialMemory = process.memoryUsage().heapUsed;
  // Perform operations
  global.gc(); // Requires --expose-gc flag
  const finalMemory = process.memoryUsage().heapUsed;
  expect(finalMemory - initialMemory).toBeLessThan(1024 * 1024); // 1MB limit
});
```

## Troubleshooting Guide

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `Cannot find module` | Missing dependency | Run `npm install` |
| `Timeout - Async callback` | Test taking too long | Increase timeout or optimize test |
| `Expected X received Y` | Assertion failure | Check test logic and actual values |
| `Mock not called` | Mock setup issue | Verify mock configuration |
| `Snapshot mismatch` | Output changed | Review and update snapshot |

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)
- [Coverage Reports](./coverage/lcov-report/index.html)
- [CI/CD Workflows](./.github/workflows/)

## Getting Help

- Check this documentation first
- Review existing tests for examples
- Check GitHub issues for similar problems
- Ask in development chat/forum
- Create detailed bug reports with reproduction steps