# Data Practitioner Agent System Brownfield Enhancement PRD

## Intro Project Analysis and Context

### Analysis Source
**Document-project output available at**: `/Users/ajdoyle/data-practitioner-agent-system/Phase1doc.md`

### Current Project State
Based on the available documentation, this is the **BMad-Method** framework - a Node.js-based system designed to orchestrate AI agents for agile development. The architecture centers around a `bmad-core` directory containing modular, natural language definitions for agents, tasks, and templates written in Markdown and YAML. Command-line tools process these core files, resolving dependencies and bundling them into single-file contexts for different environments.

### Available Documentation Analysis
**Note**: Document-project analysis available - using existing technical documentation

Key documents from document-project output:
- ✓ Tech Stack Documentation (Node.js >=20.0.0, commander, fs-extra, js-yaml, etc.)
- ✓ Source Tree/Architecture (bmad-core structure with agents, tasks, templates)
- ✓ API Documentation (Agent command APIs via YAML configuration)
- ✓ External API Documentation (NPM, GitHub integrations)
- ✓ Technical Debt Documentation (Configuration complexity, dual environment maintenance, lack of automated tests)

### Enhancement Scope Definition

#### Enhancement Type
✓ Integration with New Systems  
✓ Major Feature Modification  
✓ New Feature Addition  

#### Enhancement Description
Adding a comprehensive Data Practitioner expansion pack that integrates autonomous analysis capabilities, modern data stack tools (DuckDB, dbt/SQLmesh, PyAirbyte, Dagster, Evidence.dev), and publication-quality insight generation into the BMad-Method framework. This represents a major extension of BMad-Method from pure software development into data analysis and intelligence workflows.

#### Impact Assessment
✓ **Significant Impact** - This enhancement requires:
- New agent definitions (6 specialized data agents)
- New task workflows for data analysis
- Integration with external data tools and frameworks
- New templates for data-specific documentation
- Infrastructure additions for data processing capabilities

### Goals and Background Context

#### Goals
- Enable autonomous data analysis workflows through specialized AI agents
- Integrate modern data stack tools (DuckDB, dbt/SQLmesh, PyAirbyte, Dagster) for ELT processing
- Support API and data file ingestion from diverse sources
- Generate publication-quality insight documents via Evidence.dev integration
- Provide guided ELT modeling and hypothesis generation capabilities
- Implement statistical analysis automation with human-AI collaboration

#### Background Context
The BMad-Method has proven successful as an agentic framework for software development workflows. This expansion extends the framework into data practitioner domains, leveraging the same natural language framework and modular design patterns to create sophisticated data analysis capabilities. The expansion pack will follow BMad-Method's established patterns while adding specialized workflows for data discovery, transformation, analysis, and publication-quality reporting.

### Change Log
| Change | Date | Version | Description | Author |
|--------|------|---------|-------------|--------|
| Initial | 2025-08-08 | 1.0 | Data Practitioner expansion pack PRD | PM |
| Update | 2025-08-08 | 1.1 | Updated requirements per user feedback | PM |
| Complete | 2025-08-08 | 1.2 | Finalized PRD with complete epic structure | PM |

## Requirements

### Functional Requirements

- **FR1:** The expansion pack shall integrate with BMad-Method's existing expansion pack architecture, following the established directory structure (agents/, templates/, tasks/, checklists/, data/) and configuration patterns.

- **FR2:** The system shall provide six specialized data agents (data-product-manager, data-architect, data-engineer, data-analyst, ml-engineer, data-qa-engineer) that follow BMad-Method's YAML-based agent definition patterns.

- **FR3:** The system shall integrate PyAirbyte for flexible data ingestion, supporting selective data loading through stream selection and cache management with connectivity to various data sources through Python-native integration.

- **FR4:** The system shall integrate DuckDB as the local analytical engine for in-process data processing, supporting larger-than-memory datasets through smart partitioning.

- **FR5:** The system shall provide dual transformation engine support with auto-detection capabilities, integrating both dbt-core and SQLmesh for transformation workflows. The system shall support the layered architecture approach (Source → Staging → Intermediate → Marts) with comprehensive testing patterns, embedded documentation, blue-green deployment capabilities, and cost optimization features through intelligent execution strategies.

- **FR6:** The system shall enable automated exploratory data analysis through integration with tools like pandas-profiling, Sweetviz, and AutoViz.

- **FR7:** The system shall implement LLM-agnostic hypothesis generation capabilities, supporting any LLM provider (OpenAI, Anthropic, Google, local models) through configurable interfaces while maintaining causal knowledge graph integration.

- **FR8:** The system shall generate publication-quality insight documents through Evidence.dev integration, supporting Pew Research-style narratives with interactive visualizations.

- **FR9:** The system shall provide workflow orchestration through Dagster integration with asset-centric design and comprehensive lineage tracking.

- **FR10:** The system shall support both local development and cloud deployment patterns, scaling from DuckDB local processing to cloud data warehouse integration.

### Non-Functional Requirements

- **NFR1:** The expansion pack must maintain compatibility with BMad-Method's existing Node.js >=20.0.0 runtime requirements and not introduce conflicting dependencies.

- **NFR2:** The system shall maintain response times of <3 seconds for interactive analysis operations and <100ms for UI interactions through Evidence.dev.

- **NFR3:** The expansion pack must support BMad-Method's two-phase approach (Planning in Web UI, Development in IDE) without breaking existing workflows.

- **NFR4:** The system shall provide comprehensive data quality validation with automated testing achieving ≥80% coverage for critical data pipelines.

- **NFR5:** The expansion pack must maintain BMad-Method's natural language framework philosophy, with all agent definitions and workflows written in Markdown/YAML.

- **NFR6:** The system shall support incremental milestone delivery over 16 weeks, with each 4-week milestone providing independent value.

- **NFR7:** All data processing must maintain audit logging and support role-based access control for enterprise governance requirements.

- **NFR8:** The system shall handle datasets ranging from megabytes to terabytes through appropriate scaling strategies (local to cloud).

### Compatibility Requirements

- **CR1:** The expansion pack must maintain full compatibility with existing BMad-Method CLI tools (bmad.js, web-builder.js, installer) without requiring modifications to core framework code.

- **CR2:** All new agent definitions must follow existing YAML schema patterns including activation-instructions, commands, dependencies, and persona definitions.

- **CR3:** The expansion pack must integrate with existing IDE configurations (Cursor, Claude Code, Windsurf, VS Code Copilot) through established .bmad-core patterns.

- **CR4:** New templates must maintain compatibility with BMad-Method's template engine, supporting elicitation directives and LLM instructions in existing formats.

## Technical Constraints and Integration Requirements

### Existing Technology Stack

**Languages**: JavaScript/Node.js (>=20.0.0)
**Frameworks**: Commander (^14.0.0) for CLI, Express-like patterns for web builder
**Database**: File-based storage (YAML, Markdown), no traditional database
**Infrastructure**: NPM for distribution, GitHub Actions for CI/CD, Semantic Release for versioning
**External Dependencies**: fs-extra (^11.3.0), js-yaml (^4.1.0), glob (^11.0.3), chalk (^4.1.2), ora (^5.4.1), inquirer (^8.2.6)

### Integration Approach

**Database Integration Strategy**: Since BMad-Method has no existing database, the expansion pack will introduce DuckDB as an embedded analytical database that operates alongside the file-based system. DuckDB will handle data processing while YAML/Markdown files maintain agent configurations and workflows.

**API Integration Strategy**: New REST and WebSocket APIs for data ingestion will be added as separate endpoints under the tools/ directory, following the existing CLI tool patterns. PyAirbyte connectors will be wrapped in Node.js interfaces to maintain framework consistency.

**Frontend Integration Strategy**: Evidence.dev will operate as a separate static site generator that consumes outputs from the data pipeline, with build integration through the existing web-builder.js patterns.

**Testing Integration Strategy**: Dual transformation engine testing frameworks (dbt-core and SQLmesh) will complement the minimal Jest setup, providing data-specific validation while maintaining compatibility with existing validation scripts.

### Code Organization and Standards

**File Structure Approach**: The expansion pack will follow the established expansion-pack pattern seen in game-dev examples, creating a bmad-data-practitioner/ directory with standard subdirectories (agents/, templates/, tasks/, checklists/, data/).

**Naming Conventions**: Data agents will use hyphenated names (data-product-manager.md), consistent with existing agents. Tasks will follow verb-noun patterns (ingest-data.md, transform-dataset.md).

**Coding Standards**: Maintain existing JavaScript patterns for tooling while introducing Python scripts for data operations, wrapped in Node.js execution contexts to preserve framework unity.

**Documentation Standards**: All agent definitions in Markdown with YAML frontmatter, templates in YAML with embedded instructions, following existing BMAD patterns.

### Deployment and Operations

**Build Process Integration**: Extend web-builder.js to bundle data practitioner agents and resolve Python tool dependencies. Add new build targets for Evidence.dev static site generation.

**Deployment Strategy**: Maintain NPM package distribution for expansion pack installation. Python dependencies (PyAirbyte, dbt-core, SQLmesh) will be managed through requirements.txt with automated setup during installation.

**Monitoring and Logging**: Leverage Dagster's built-in monitoring for data pipelines while maintaining console-based logging for agent interactions, consistent with current framework approach.

**Configuration Management**: Extend core-config.yaml to include data tool configurations (DuckDB paths, transformation engine settings, PyAirbyte connection strings) while maintaining backward compatibility.

### Risk Assessment and Mitigation

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

## Epic and Story Structure

### Epic Approach
**Epic Structure Decision**: Single epic delivering the complete Data Practitioner expansion pack with 4 milestone-based story groups, each providing independent value while building toward the comprehensive solution.

## Epic 1: Data Practitioner Agent System Expansion Pack Integration

**Epic Goal**: Integrate a comprehensive data practitioner expansion pack into BMad-Method, enabling autonomous data analysis workflows through specialized agents, modern data stack tools integration (PyAirbyte, DuckDB, dbt-core/SQLmesh, Dagster, Evidence.dev), and publication-quality insight generation.

**Integration Requirements**: 
- Maintain full compatibility with existing BMad-Method infrastructure
- Preserve natural language framework philosophy 
- Support two-phase workflow (Planning/Development)
- Enable incremental value delivery through milestone-based stories
- Ensure no disruption to existing framework functionality

### Story 1.1: Foundation - Data Agent Infrastructure Setup

As a **BMad-Method developer**,
I want to establish the data practitioner expansion pack structure with core agent definitions,
so that the framework can support data analysis workflows.

#### Acceptance Criteria
1. Create bmad-data-practitioner/ directory structure following expansion pack patterns
2. Implement 6 data agent definitions (data-product-manager, data-architect, data-engineer, data-analyst, ml-engineer, data-qa-engineer) with YAML configurations
3. Create base templates for data workflows (data-requirements-prd, data-architecture-doc)
4. Integrate expansion pack with existing installer and web-builder tools
5. Validate agents load correctly in both IDE and web environments

#### Integration Verification
- IV1: Existing agents and workflows continue functioning without modification
- IV2: Web-builder successfully bundles new data agents alongside existing agents
- IV3: No performance degradation in agent loading or command execution

### Story 1.2: Data Ingestion - PyAirbyte Integration

As a **data engineer**,
I want to ingest data from multiple sources through PyAirbyte connectors,
so that I can work with diverse datasets in the BMad-Method framework.

#### Acceptance Criteria
1. Implement Node.js wrapper for PyAirbyte Python execution
2. Create data ingestion API endpoints for file upload and database connections
3. Configure PyAirbyte connectors for common sources (CSV, JSON, databases)
4. Implement stream selection and cache management capabilities
5. Create ingestion task templates (data-source-discovery.md)

#### Integration Verification
- IV1: Existing CLI tools remain functional with new Python dependencies
- IV2: PyAirbyte subprocess execution doesn't block Node.js event loop
- IV3: Memory usage remains within acceptable limits during data ingestion

### Story 1.3: Local Analytics - DuckDB Integration

As a **data analyst**,
I want to perform analytical queries using DuckDB as an embedded engine,
so that I can process data efficiently without external dependencies.

#### Acceptance Criteria
1. Integrate DuckDB with Node.js through appropriate bindings
2. Implement data loading from PyAirbyte cache to DuckDB
3. Create analytical query interfaces for agent workflows
4. Support larger-than-memory datasets through partitioning
5. Enable multi-format data reading (CSV, Parquet, JSON)

#### Integration Verification
- IV1: File-based YAML/Markdown storage remains unaffected
- IV2: DuckDB operations isolated from core framework processes
- IV3: System remains responsive during analytical operations

### Story 1.4: Transformation Workflows - dbt-core Integration

As a **data engineer**,
I want to define and execute transformation workflows using dbt-core,
so that I can maintain data quality and lineage.

#### Acceptance Criteria
1. Integrate dbt-core with Python subprocess execution
2. Create guided ELT modeling templates (elt-modeling-guidance.md)
3. Implement dbt project initialization within expansion pack
4. Configure testing patterns (generic and custom tests)
5. Enable documentation generation from dbt models

#### Integration Verification
- IV1: Existing validation scripts continue functioning
- IV2: dbt operations don't interfere with BMad build processes
- IV3: Test execution times remain reasonable (<5 minutes for standard suite)

### Story 1.5: Workflow Orchestration - Dagster Integration

As a **data architect**,
I want to orchestrate data pipelines using Dagster's asset-centric approach,
so that I can manage complex data workflows with proper dependencies.

#### Acceptance Criteria
1. Implement Dagster integration with configuration management
2. Create asset definitions for data pipeline components
3. Configure scheduling and triggering mechanisms
4. Implement monitoring and alerting interfaces
5. Enable lineage tracking and visualization

#### Integration Verification
- IV1: Existing workflow patterns in BMad-Method remain functional
- IV2: Dagster UI accessible without conflicting with other tools
- IV3: Resource usage remains manageable with Dagster daemon running

### Story 1.6: Automated Analysis - EDA and Hypothesis Generation

As a **data analyst**,
I want automated exploratory data analysis and hypothesis generation,
so that I can discover insights more efficiently.

#### Acceptance Criteria
1. Integrate automated EDA tools (pandas-profiling, Sweetviz, AutoViz)
2. Implement LLM-agnostic hypothesis generation interfaces
3. Create hypothesis testing workflows (hypothesis-testing.md)
4. Configure statistical testing frameworks
5. Enable pattern detection and anomaly identification

#### Integration Verification
- IV1: LLM interfaces compatible with existing agent LLM usage
- IV2: Analysis tools don't conflict with existing dependencies
- IV3: Processing times remain acceptable for interactive workflows

### Story 1.7: Publication Platform - Evidence.dev Integration

As a **data product manager**,
I want to generate publication-quality insight documents,
so that I can share analysis results in professional formats.

#### Acceptance Criteria
1. Integrate Evidence.dev with build system
2. Create publication templates (insight-document.md)
3. Configure Universal SQL with DuckDB WASM
4. Implement automated narrative generation workflows
5. Enable static site generation and deployment

#### Integration Verification
- IV1: Web-builder continues to function for agent bundles
- IV2: Evidence.dev builds don't interfere with main build process
- IV3: Generated sites maintain acceptable performance metrics

### Story 1.8: Quality Assurance and Documentation

As a **data QA engineer**,
I want comprehensive testing and documentation for the expansion pack,
so that the system maintains quality and usability standards.

#### Acceptance Criteria
1. Create data quality validation checklists
2. Implement integration tests for all data tools
3. Generate comprehensive documentation for data workflows
4. Create troubleshooting guides for common issues
5. Validate all milestone deliverables function correctly

#### Integration Verification
- IV1: All existing BMad-Method functionality remains intact
- IV2: New components pass integration tests with >80% coverage
- IV3: Documentation integrates with existing user guides