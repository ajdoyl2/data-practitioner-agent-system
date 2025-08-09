# Tech Stack Alignment

## Existing Technology Stack

| Category | Current Technology | Version | Usage in Enhancement | Notes |
|----------|-------------------|---------|---------------------|-------|
| Runtime | Node.js | >=20.0.0 | Core framework execution, Python subprocess management | Maintained as primary runtime |
| CLI Framework | commander | ^14.0.0 | Extended for data ingestion APIs | Existing patterns preserved |
| File System | fs-extra | ^11.3.0 | File operations for data caching and Evidence.dev builds | Current usage patterns maintained |
| YAML Processing | js-yaml | ^4.1.0 | Agent definitions, template processing, data tool configs | Extended for data tool configuration |
| Pattern Matching | glob, minimatch | ^11.0.3, ^10.0.3 | File discovery, enhanced for data file patterns | Existing patterns extended |
| CLI Interface | chalk, ora, inquirer | ^4.1.2, ^5.4.1, ^8.2.6 | User interaction, progress indication for data operations | Enhanced for long-running data tasks |
| Testing Framework | Jest | ^30.0.4 | Unit testing, integration testing for data workflows | Extended for data pipeline testing |
| Code Formatting | Prettier | ^3.5.3 | Markdown/YAML formatting, Python code formatting | Extended scope |
| Release Management | semantic-release | ^22.0.0 | Automated versioning and publishing | Unchanged |

## New Technology Additions

| Technology | Version | Purpose | Rationale | Integration Method |
|------------|---------|---------|-----------|-------------------|
| DuckDB | ^1.1.3 | Embedded analytical database | Latest stable with performance improvements and WASM support for Evidence.dev | Node.js bindings with subprocess fallback |
| dbt-core | ^1.8.8 | Data transformation workflows | Latest stable with improved Jinja rendering and enhanced testing framework | Python subprocess execution |
| PyAirbyte | ^0.20.0 | Flexible data ingestion | Major version update with improved caching and stream selection capabilities | Python subprocess with JSON communication |
| Dagster | ^1.8.12 | Workflow orchestration | Latest stable with enhanced asset lineage and improved web UI performance | Python subprocess with web UI integration |
| Evidence.dev | ^25.0.0 | Publication-quality reporting | Latest major version with improved Universal SQL and faster build times | Build system integration |
| Python | >=3.10.0 | Data tool runtime | Updated minimum for better performance and modern syntax support | Subprocess execution with virtual environments |
