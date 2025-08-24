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
| SQLmesh | ^0.57.0 | Advanced data transformation and modeling | Modern transformation framework with native cost optimization, blue-green deployment, and virtual environments | Python subprocess with intelligent agent integration |
| PyAirbyte | ^0.20.0 | Flexible data ingestion | Major version update with improved caching and stream selection capabilities | Python subprocess with JSON communication |
| Dagster | ^1.8.12 | Workflow orchestration | Latest stable with enhanced asset lineage and improved web UI performance | Python subprocess with web UI integration |
| Evidence.dev | ^25.0.0 | Publication-quality reporting | Latest major version with improved Universal SQL and faster build times | Build system integration |
| Python | >=3.10.0 | Data tool runtime | Updated minimum for better performance and modern syntax support | Subprocess execution with virtual environments |

## Transformation Engine Strategy

The system now supports a **dual-engine transformation approach** with intelligent selection between dbt and SQLmesh based on project characteristics:

### Engine Selection Criteria

| Factor | dbt Preference | SQLmesh Preference | Dual-Engine Approach |
|--------|----------------|-------------------|---------------------|
| **Cost Optimization** | Low priority projects | High warehouse costs (>$10K/month) | Mixed: expensive models → SQLmesh |
| **Deployment Safety** | Standard deployment | Zero-downtime required | Critical paths → SQLmesh |
| **Team Experience** | Strong dbt background | Greenfield or SQLmesh experience | Gradual migration strategy |
| **Python Integration** | Minimal Python needs | Heavy custom logic/ML | Python models → SQLmesh |
| **Project Maturity** | Legacy/established | Modern/cloud-native | Hybrid modernization |

### Agent-Driven Decision Making

The system includes intelligent agent modules for transformation engine selection:

- **`agents/data-engineer/decision-logic/engine-selection.py`** - Weighted scoring algorithm with 7 decision factors
- **`agents/data-architect/cost-monitoring/optimization-advisor.py`** - Cost analysis and optimization recommendations  
- **`agents/data-qa-engineer/deployment-validation/safety-gates.py`** - Blue-green deployment validation
- **`agents/shared/auto-detection/engine-detection-algorithm.py`** - Automatic engine detection and recommendation

## Architectural Patterns & Best Practices

### Cost Optimization Architecture
- **Virtual Environment Controls** - SQLmesh virtual environments with aggressive auto-suspend (60s) for development
- **Intelligent Resource Sizing** - Right-sizing warehouses based on usage patterns and cost efficiency scoring
- **Cost Monitoring & Alerting** - Real-time cost tracking with budget limits and optimization recommendations

### Production Deployment Patterns
- **Blue-Green Deployment** - Native SQLmesh support with automated safety gates and rollback procedures
- **Quality Validation Gates** - Multi-level validation (syntax → type → lint → security → test → performance → documentation → integration)
- **Progressive Deployment** - Canary releases with automated monitoring and rollback triggers

### Agent Integration Patterns
- **Decision Logic Modules** - Standardized agent modules for intelligent recommendations
- **Cross-Agent Communication** - Shared error handling and fallback strategies
- **Template Standardization** - Unified templates for Python models, documentation, and testing

### Documentation & Standards
- **Embedded Documentation** - Inline documentation patterns with automated quality validation
- **Metadata Management** - Consistent lineage tracking and model description guidelines  
- **Testing Strategies** - Comprehensive patterns for mixed SQL/Python model validation

## Technology Integration Status

| Integration Category | Status | Key Components |
|---------------------|--------|----------------|
| **Transformation Engines** | ✅ Complete | dbt, SQLmesh with intelligent selection |
| **Cost Optimization** | ✅ Complete | Virtual environments, usage monitoring, optimization advisor |
| **Deployment Safety** | ✅ Complete | Blue-green workflows, safety gates, automated rollback |
| **Agent Intelligence** | ✅ Complete | Decision logic, auto-detection, error handling |
| **Documentation Standards** | ✅ Complete | Templates, validation, metadata management |
| **Mixed Language Support** | ✅ Complete | Python + SQL coordination patterns |
