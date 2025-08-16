# Testing Quick Reference Guide

**BMad-Method Test Suite - Developer Quick Reference**

## Essential Commands

### Daily Testing
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Watch mode for development
npm run test:watch

# CI mode (for automation)
npm run test:ci
```

### Coverage Reporting
```bash
# Generate enhanced coverage report
npm run test:coverage:report

# View coverage in browser
open coverage/lcov-report/index.html
```

### Regression Testing
```bash
# Generate regression baselines
npm run test:baseline

# Validate existing baselines
npm run test:baseline:validate
```

## Test File Structure

```
tests/
├── tools/                  # CLI tool tests
├── agents/                 # Agent workflow tests  
├── storage/               # File operations tests
├── regression/            # Baseline tests
└── fixtures/              # Test data & baselines
```

## Coverage Requirements

| Component | Minimum Coverage |
|-----------|------------------|
| Global    | 80%             |
| Tools     | 85%             |
| Integration | 70%           |

## Quick Test Template

```javascript
describe('Component Name', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should do expected behavior', async () => {
    // Arrange
    const input = {};
    
    // Act  
    const result = await functionUnderTest(input);
    
    // Assert
    expect(result).toEqual(expected);
  });
});
```

## Common Mocks

```javascript
// File system
jest.mock('fs-extra');

// Child process
jest.mock('child_process');

// Custom modules
jest.mock('../../tools/lib/module-name');
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Coverage below threshold | Add tests for uncovered lines |
| Flaky tests | Add proper wait conditions, mock timing |
| Slow tests | Profile and optimize, use mocks |
| Mock issues | Clear mocks in beforeEach |

## Performance Limits

- Full test suite: < 30 seconds
- Individual test: < 5 seconds  
- Coverage generation: < 45 seconds

## File Locations

- **Tests**: `tests/`
- **Coverage Reports**: `coverage/reports/`
- **Baselines**: `tests/fixtures/`
- **Documentation**: `docs/testing/`