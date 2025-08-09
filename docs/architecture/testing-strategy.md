# Testing Strategy

## Integration with Existing Tests

**Existing Test Framework:** Jest ^30.0.4 with minimal current test coverage, primary focus on CLI tool validation through existing validation scripts  
**Test Organization:** Tests organized under `/tests/` directory following component-based structure, integration tests preferred over extensive unit testing  
**Coverage Requirements:** Enhanced from minimal coverage to 80% minimum for data processing components, maintaining existing patterns for core BMad functionality

## New Testing Requirements

### Unit Tests for New Components

**Framework:** Jest ^30.0.4 extended with Python subprocess testing utilities and DuckDB in-memory testing capabilities  
**Location:** `/tests/data-services/` following existing test organization patterns, mirroring source code structure  
**Coverage Target:** 80% minimum coverage for all data processing components, 90% coverage for critical data integrity operations  
**Integration with Existing:** Leverages existing Jest configuration and test utilities, extends existing validation patterns for data-specific components

### Integration Tests

**Scope:** End-to-end data workflows from ingestion through publication, cross-component data flow validation, Python-Node.js interoperability testing  
**Existing System Verification:** All existing BMad-Method functionality must continue working unchanged, regression testing for core agent workflows and CLI tools  
**New Feature Testing:** Complete data analysis pipeline testing (PyAirbyte → DuckDB → dbt → Dagster → Evidence.dev), LLM hypothesis generation with multiple provider validation

### Regression Testing

**Existing Feature Verification:** Automated testing suite validating all existing BMad-Method functionality remains intact after data enhancement installation  
**Automated Regression Suite:** CI/CD pipeline integration with comprehensive existing functionality validation, performance regression testing for CLI tool response times  
**Manual Testing Requirements:** User acceptance testing for new data agent workflows, Evidence.dev publication quality validation, cross-platform compatibility testing (Windows, macOS, Linux)
