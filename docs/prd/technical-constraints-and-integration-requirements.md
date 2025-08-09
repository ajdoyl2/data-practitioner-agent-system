# Technical Constraints and Integration Requirements

## Existing Technology Stack

**Languages**: JavaScript/Node.js (>=20.0.0)
**Frameworks**: Commander (^14.0.0) for CLI, Express-like patterns for web builder
**Database**: File-based storage (YAML, Markdown), no traditional database
**Infrastructure**: NPM for distribution, GitHub Actions for CI/CD, Semantic Release for versioning
**External Dependencies**: fs-extra (^11.3.0), js-yaml (^4.1.0), glob (^11.0.3), chalk (^4.1.2), ora (^5.4.1), inquirer (^8.2.6)

## Integration Approach

**Database Integration Strategy**: Since BMad-Method has no existing database, the expansion pack will introduce DuckDB as an embedded analytical database that operates alongside the file-based system. DuckDB will handle data processing while YAML/Markdown files maintain agent configurations and workflows.

**API Integration Strategy**: New REST and WebSocket APIs for data ingestion will be added as separate endpoints under the tools/ directory, following the existing CLI tool patterns. PyAirbyte connectors will be wrapped in Node.js interfaces to maintain framework consistency.

**Frontend Integration Strategy**: Evidence.dev will operate as a separate static site generator that consumes outputs from the data pipeline, with build integration through the existing web-builder.js patterns.

**Testing Integration Strategy**: dbt-core's testing framework will complement the minimal Jest setup, providing data-specific validation while maintaining compatibility with existing validation scripts.

## Code Organization and Standards

**File Structure Approach**: The expansion pack will follow the established expansion-pack pattern seen in game-dev examples, creating a bmad-data-practitioner/ directory with standard subdirectories (agents/, templates/, tasks/, checklists/, data/).

**Naming Conventions**: Data agents will use hyphenated names (data-product-manager.md), consistent with existing agents. Tasks will follow verb-noun patterns (ingest-data.md, transform-dataset.md).

**Coding Standards**: Maintain existing JavaScript patterns for tooling while introducing Python scripts for data operations, wrapped in Node.js execution contexts to preserve framework unity.

**Documentation Standards**: All agent definitions in Markdown with YAML frontmatter, templates in YAML with embedded instructions, following existing BMAD patterns.

## Deployment and Operations

**Build Process Integration**: Extend web-builder.js to bundle data practitioner agents and resolve Python tool dependencies. Add new build targets for Evidence.dev static site generation.

**Deployment Strategy**: Maintain NPM package distribution for expansion pack installation. Python dependencies (PyAirbyte, dbt-core) will be managed through requirements.txt with automated setup during installation.

**Monitoring and Logging**: Leverage Dagster's built-in monitoring for data pipelines while maintaining console-based logging for agent interactions, consistent with current framework approach.

**Configuration Management**: Extend core-config.yaml to include data tool configurations (DuckDB paths, dbt project settings, PyAirbyte connection strings) while maintaining backward compatibility.

## Risk Assessment and Mitigation

**Technical Risks**: 
- Python/Node.js interoperability complexity - Mitigate through subprocess execution and structured data exchange via JSON
- DuckDB memory management for large datasets - Implement configurable memory limits and automatic spilling to disk
- Evidence.dev build time for large reports - Use incremental builds and caching strategies

**Integration Risks**:
- Version conflicts between Node and Python ecosystems - Use virtual environments and explicit dependency pinning
- Breaking changes in external data tools - Vendor specific versions and provide upgrade migration paths
- Performance degradation of existing framework - Isolate data operations in separate processes

**Deployment Risks**:
- Complex installation process with multiple runtimes - Provide automated installer enhancements with clear prerequisites
- Cross-platform compatibility issues - Test on Windows, Mac, Linux with CI/CD matrix builds
- Large package size with data tool dependencies - Offer modular installation with core vs. full options

**Mitigation Strategies**:
- Implement comprehensive integration tests before each milestone
- Provide rollback procedures for each component installation
- Create detailed troubleshooting documentation for common issues
- Establish performance benchmarks and monitor for regression
