# Data Practitioner Agent System Brownfield Architecture Document

## Introduction

This document captures the **CURRENT STATE** of the Data Practitioner Agent System expansion pack for BMad-Method, including technical debt, workarounds, and real-world patterns. It serves as a reference for AI agents working on the enhancement outlined in the comprehensive PRD.

### Document Scope

**Focused on areas relevant to**: Data Practitioner Agent System expansion pack implementation - integrating PyAirbyte, DuckDB, dbt-core, Dagster, and Evidence.dev into the BMad-Method framework for autonomous data analysis workflows.

### Change Log

| Date       | Version | Description                 | Author    |
| ---------- | ------- | --------------------------- | --------- |
| 2025-08-14 | 1.0     | Initial brownfield analysis | Winston   |

## Quick Reference - Key Files and Entry Points for Data Stack Development

### Critical Files for Understanding the System

- **Main Entry**: `bmad-method/tools/cli.js` (command line interface with data service commands)
- **Configuration**: `bmad-method/bmad-core/core-config.yaml`, `bmad-method/config/feature-flags.yaml`
- **Core Agent Patterns**: `bmad-method/bmad-core/agents/dev.md`, `bmad-method/bmad-core/agents/architect.md`
- **Web Builder**: `bmad-method/tools/builders/web-builder.js` (handles expansion pack bundling)
- **Python Integration**: `bmad-method/tools/lib/python-subprocess.js` (Node.js/Python bridge)
- **Data Services Hub**: `bmad-method/tools/data-services/` (13 data service modules - partially implemented)

### Enhancement Impact Areas - PRD Story Implementation Focus

**Story 1.1 Foundation**: 
- `bmad-method/expansion-packs/bmad-data-practitioner/` (already created with 6 agents)
- `bmad-method/tools/builders/web-builder.js` (expansion pack bundling exists)

**Story 1.2 PyAirbyte**: 
- `bmad-method/tools/data-services/pyairbyte-wrapper.js` (skeleton implementation)
- `bmad-method/tools/lib/python-subprocess.js` (foundation exists)
- `bmad-method/scripts/python/` (needs creation)

**Story 1.3 DuckDB**: 
- `bmad-method/tools/data-services/duckdb-wrapper.js` (mock implementation)
- `package.json` includes `duckdb: ^1.3.2` dependency

**Story 1.4 dbt-core**: 
- `requirements.txt` includes dbt dependencies (needs wrapper implementation)

**Story 1.5 Dagster**: 
- `bmad-method/tools/data-services/dagster-wrapper.js` (needs implementation)
- `bmad-method/expansion-packs/bmad-data-practitioner/dagster-project/` (structure exists)

**Stories 1.6-1.8**: 
- Service integration points established, need implementation

## High Level Architecture

### Technical Summary

**BMad-Method** is a Node.js-based AI agent orchestration framework that uses natural language definitions (Markdown/YAML) to create contextual AI agents. The Data Practitioner expansion pack extends this pattern into data analysis workflows by integrating modern data stack tools through Python subprocess execution while maintaining the framework's natural language philosophy.

### Actual Tech Stack (from package.json/requirements.txt)

| Category        | Technology    | Version   | Implementation Status | Critical Notes                    |
| --------------- | ------------- | --------- | --------------------- | --------------------------------- |
| Runtime         | Node.js       | >=20.0.0  | ✅ Production        | Primary execution environment     |
| Framework       | commander     | ^14.0.0   | ✅ Production        | CLI command structure             |
| Database        | DuckDB        | ^1.3.2    | 🚧 Mock only         | **CRITICAL**: Mock implementation |
| Python Runtime  | Python        | >=3.10.0  | 🚧 Subprocess        | Via python-subprocess.js          |
| Data Ingestion  | PyAirbyte     | 0.20.0    | 🚧 Wrapper only      | Python integration needed         |
| Transformation  | dbt-core      | >=1.8.0   | ❌ Not implemented   | Requires Python wrapper           |
| Orchestration   | Dagster       | >=1.8.12  | 🚧 Skeleton only     | Python integration needed         |
| File System     | fs-extra      | ^11.3.0   | ✅ Production        | Heavy usage for file operations   |
| YAML Processing | js-yaml       | ^4.1.0    | ✅ Production        | Agent definitions, config         |

### Repository Structure Reality Check

- **Type**: Monorepo with expansion pack architecture
- **Package Manager**: npm (with Python virtual environment integration)
- **Notable**: Dual-language architecture (Node.js + Python) with subprocess communication pattern

## Source Tree and Module Organization

### Project Structure (Actual)

```text
data-practitioner-agent-system/
├── bmad-method/                    # Core BMad-Method framework
│   ├── bmad-core/                  # Agent definitions (Markdown/YAML)
│   │   ├── agents/                 # 10 core agents (dev, architect, pm, etc.)
│   │   ├── tasks/                  # Reusable task workflows
│   │   ├── templates/              # Document templates
│   │   └── core-config.yaml       # Framework configuration
│   ├── expansion-packs/            # Modular expansion packs
│   │   └── bmad-data-practitioner/ # NEW: Data practitioner pack
│   │       ├── agents/             # 6 data agents (data-architect, etc.)
│   │       ├── templates/          # Data workflow templates (2 files)
│   │       ├── dagster-project/    # Dagster asset definitions
│   │       └── config.yaml         # Pack configuration
│   ├── tools/                      # JavaScript tooling and services
│   │   ├── cli.js                  # Main CLI entry point
│   │   ├── builders/               # Web bundle builders
│   │   ├── data-services/          # NEW: 13 data service modules
│   │   ├── lib/                    # Shared utilities (crucial patterns)
│   │   └── installer/              # Framework installation
│   ├── config/                     # Runtime configuration
│   │   └── feature-flags.yaml      # Progressive rollout flags
│   ├── scripts/                    # NEW: Python scripts directory
│   ├── package.json                # Node.js dependencies + data tools
│   └── requirements.txt            # NEW: Python dependencies
├── docs/                           # Project documentation (sharded architecture)
└── tests/                          # Test suites (Jest + integration)
```

### Key Modules and Their Purpose

- **Agent Orchestration**: `bmad-core/agents/` - Natural language agent definitions with YAML config
- **Web Builder**: `tools/builders/web-builder.js` - Bundles agents for web deployment
- **Python Bridge**: `tools/lib/python-subprocess.js` - Node.js/Python communication layer
- **Data Services**: `tools/data-services/` - **13 service modules in various states of implementation**
- **Feature Flags**: `config/feature-flags.yaml` - Progressive rollout control (most features disabled)
- **Dependency Resolution**: `tools/lib/dependency-resolver.js` - Agent dependency bundling

## Data Models and APIs

### Data Agent Models

**Reference actual agent files**:
- **Data Architect**: `expansion-packs/bmad-data-practitioner/agents/data-architect.md`
- **Data Engineer**: `expansion-packs/bmad-data-practitioner/agents/data-engineer.md`
- **Data Analyst**: `expansion-packs/bmad-data-practitioner/agents/data-analyst.md`
- **ML Engineer**: `expansion-packs/bmad-data-practitioner/agents/ml-engineer.md`
- **Data Product Manager**: `expansion-packs/bmad-data-practitioner/agents/data-product-manager.md`
- **Data QA Engineer**: `expansion-packs/bmad-data-practitioner/agents/data-qa-engineer.md`

### API Specifications

- **CLI Commands**: `tools/cli.js` includes data service commands (`data:service`, `analytics:service`)
- **Web Bundle API**: `tools/builders/web-builder.js` with expansion pack support
- **Python Subprocess API**: `tools/lib/python-subprocess.js` - JSON communication protocol
- **Feature Flag API**: `tools/lib/feature-flag-manager.js` - Runtime feature control

## Technical Debt and Known Issues

### Critical Technical Debt

1. **DuckDB Integration**: `tools/data-services/duckdb-wrapper.js` - **MOCK IMPLEMENTATION ONLY**
   - Contains placeholder mock methods instead of actual DuckDB bindings
   - Feature flag `duckdb_analytics` disabled due to implementation gaps
   - Node.js DuckDB package installed but not connected

2. **Python Service Integration**: Most data services are skeleton implementations
   - `pyairbyte-wrapper.js` - Interface defined but missing Python script creation
   - `dagster-wrapper.js` - Structure exists but no Dagster integration
   - `analytical-engine.js` - Placeholder implementation

3. **Feature Flag Dependencies**: Complex dependency chain in `config/feature-flags.yaml`
   - Only `pyairbyte_integration` enabled
   - All other features disabled due to implementation dependencies
   - **CRITICAL**: Must enable features in dependency order

4. **Testing Coverage**: Extensive test structure but many data services untested
   - Integration tests exist but many marked as placeholder
   - No end-to-end tests for data stack integration

### Workarounds and Gotchas

- **Python Environment**: Must run `npm run setup:python` for virtual environment setup
- **Feature Flag Order**: Enable flags in dependency order or services fail silently
- **DuckDB Package**: Installed but `duckdb-wrapper.js` uses mock instead of real bindings
- **Memory Management**: `tools/lib/memory-manager.js` exists but not integrated with data services
- **Subprocess Timeout**: Default 30s timeout in `python-subprocess.js` may be insufficient for large data operations

## Integration Points and External Dependencies

### External Services

| Service     | Purpose               | Integration Type     | Key Files                                      | Status        |
| ----------- | --------------------- | -------------------- | ---------------------------------------------- | ------------- |
| PyAirbyte   | Data ingestion        | Python subprocess    | `tools/data-services/pyairbyte-wrapper.js`    | 🚧 Skeleton   |
| DuckDB      | Analytical engine     | Node.js native      | `tools/data-services/duckdb-wrapper.js`       | ❌ Mock only  |
| dbt-core    | Data transformation   | Python subprocess    | Not implemented                                | ❌ Missing    |
| Dagster     | Workflow orchestration| Python subprocess    | `tools/data-services/dagster-wrapper.js`      | 🚧 Skeleton   |
| Evidence.dev| Publication platform  | Build integration    | Not implemented                                | ❌ Missing    |

### Internal Integration Points

- **CLI Integration**: `tools/cli.js` includes data service commands with feature flag checks
- **Web Builder Integration**: `tools/builders/web-builder.js` supports expansion pack bundling
- **Agent Definition Loading**: `tools/lib/dependency-resolver.js` handles data agent dependencies
- **Feature Management**: All data services check `config/feature-flags.yaml` before operation

## Development and Deployment

### Local Development Setup

1. **Node.js Environment**: Requires Node.js >=20.0.0
2. **Python Setup**: Run `npm run setup:python` to create virtual environment
3. **Install Dependencies**: `npm install` then activate Python venv and `pip install -r requirements.txt`
4. **Feature Flags**: Enable required flags in `config/feature-flags.yaml` in dependency order
5. **Build System**: Run `npm run build` to bundle agents and expansion packs

### Build and Deployment Process

- **Build Command**: `npm run build` (supports `--expansions-only` flag)
- **Data Services**: `npm run data:service` and `npm run analytics:service` 
- **Agent Bundling**: Web builder automatically includes expansion pack agents
- **Python Integration**: Subprocess execution managed by `python-subprocess.js`

## Testing Reality

### Current Test Coverage

- **Unit Tests**: Jest configuration with data service test stubs
- **Integration Tests**: `tests/integration/` includes cross-language testing
- **Data Service Tests**: `tests/data-services/` - 9 test files (mostly placeholders)
- **Security Tests**: `tests/security/` includes external service validation
- **Performance Tests**: `tests/performance/` includes baseline testing

### Running Tests

```bash
npm test                    # Runs Jest unit tests
npm run test:integration    # Cross-language integration tests
npm run validate           # Agent definition validation
```

## Enhancement PRD Implementation - Impact Analysis

### Files That Will Need Modification

Based on the PRD requirements, these files require implementation work:

**Story 1.1 - Foundation (Mostly Complete)**:
- `expansion-packs/bmad-data-practitioner/agents/` - 6 agents exist, may need refinement
- `tools/builders/web-builder.js` - Expansion pack support exists

**Story 1.2 - PyAirbyte Integration**:
- `tools/data-services/pyairbyte-wrapper.js` - Replace skeleton with full implementation
- `scripts/python/` - Create Python connector scripts
- `config/feature-flags.yaml` - Enable pyairbyte_integration (already enabled)

**Story 1.3 - DuckDB Integration**:
- `tools/data-services/duckdb-wrapper.js` - **CRITICAL**: Replace mock with real DuckDB bindings
- `config/feature-flags.yaml` - Enable duckdb_analytics flag
- Memory management integration needed

**Story 1.4 - dbt-core Integration**:
- Create `tools/data-services/dbt-wrapper.js` (missing)
- `config/feature-flags.yaml` - Enable dbt_transformations flag
- dbt project initialization logic

**Story 1.5-1.8 - Remaining Integrations**:
- Complete implementation of remaining `tools/data-services/` modules
- Enable corresponding feature flags in dependency order
- Evidence.dev build system integration

### New Files/Modules Needed

- `tools/data-services/dbt-wrapper.js` - dbt-core integration
- `tools/data-services/evidence-builder.js` - Evidence.dev build integration
- `scripts/python/` directory with connector scripts
- Enhanced test coverage for all data services

### Integration Considerations

- **Feature Flag Dependencies**: Must enable in order: duckdb_analytics → dbt_transformations → evidence_publishing
- **Python Subprocess Management**: All data tools use `python-subprocess.js` communication pattern
- **Memory Management**: Large datasets require DuckDB memory limit configuration
- **Build System**: Evidence.dev requires separate build pipeline integration
- **Agent Loading**: New agents automatically bundled by existing web-builder system

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
npm run build                        # Build all agent bundles
npm run build:expansions            # Build only expansion packs
npm run data:service                # Start data ingestion service
npm run analytics:service           # Start analytics service
npm run setup:python               # Create Python virtual environment
npm run validate                   # Validate agent definitions
```

### Data Stack Specific Commands

```bash
# Feature flag management
npm run feature:enable duckdb_analytics
npm run feature:disable duckdb_analytics

# Development workflow
npm run build -- --expansion bmad-data-practitioner  # Build specific pack
npm run test:data-services                           # Run data service tests
```

### Debugging and Troubleshooting

- **Logs**: Console-based logging with security logger integration
- **Feature Flags**: Check `config/feature-flags.yaml` for enabled features
- **Python Issues**: Virtual environment in `.venv/` directory
- **DuckDB Issues**: Currently using mock - check `tools/data-services/duckdb-wrapper.js`
- **Memory Issues**: Monitor via `tools/lib/memory-manager.js` (integration needed)