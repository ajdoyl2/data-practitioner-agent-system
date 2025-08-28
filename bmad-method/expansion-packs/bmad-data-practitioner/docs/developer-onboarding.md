# Data Practitioner System - Developer Onboarding and Training Guide

## Welcome to the BMad Data Practitioner System

This guide will help new developers understand, configure, and contribute to the BMad Data Practitioner Agent System (Stories 1.1-1.8).

## Prerequisites

### Required Knowledge
- **JavaScript/Node.js**: Intermediate level (ES6+, async/await, modules)
- **Python**: Intermediate level (3.9+, virtual environments, package management)
- **SQL**: Advanced level (complex queries, CTEs, window functions)
- **Git**: Basic to intermediate (branching, merging, pull requests)
- **YAML/JSON**: Configuration file management
- **Command Line**: Comfortable with bash/terminal operations

### Recommended Background
- **Data Engineering**: ETL/ELT processes, data warehousing concepts
- **Testing**: Unit testing, integration testing, TDD principles
- **DevOps**: CI/CD pipelines, containerization basics
- **Data Analysis**: Statistical concepts, data visualization

## System Architecture Overview

### Core Components (Stories 1.1-1.8)

```
BMad Data Practitioner System Architecture
├── 1.1 Infrastructure (Agent Foundation)
│   ├── Agent discovery and configuration
│   ├── Directory structure management
│   └── Base service coordination
├── 1.2 Data Ingestion (PyAirbyte)
│   ├── Source connector management
│   ├── Data synchronization
│   └── Schema management
├── 1.3 Analytics Platform (DuckDB)
│   ├── Local analytics database
│   ├── Memory management
│   └── Query optimization
├── 1.4 Orchestration (Dagster)
│   ├── Workflow scheduling
│   ├── Asset management
│   └── Pipeline monitoring
├── 1.5 Transformation (dbt/SQLmesh)
│   ├── Data modeling
│   ├── Quality testing
│   └── Cost optimization
├── 1.6 Analysis Engine (Python)
│   ├── Automated EDA
│   ├── Hypothesis generation
│   └── Statistical testing
├── 1.7 Publication (Evidence.dev)
│   ├── Static site generation
│   ├── Interactive visualizations
│   └── Report publishing
└── 1.8 Quality Assurance (Testing & Docs)
    ├── Quality gates
    ├── Comprehensive testing
    └── Documentation management
```

### Technology Stack

#### Backend Services
- **Node.js**: Core BMad Method framework and tooling
- **Python**: Data processing, analysis, and PyAirbyte connectors
- **DuckDB**: High-performance analytics database
- **Dagster**: Data orchestration and workflow management

#### Frontend/Publication
- **Evidence.dev**: Static site generation with Svelte components
- **D3.js**: Advanced data visualizations
- **Svelte**: Reactive UI components

#### Development Tools
- **Jest**: JavaScript testing framework
- **pytest**: Python testing framework
- **ESLint/Prettier**: Code formatting and linting
- **npm**: Package management

## Development Environment Setup

### 1. System Requirements
```bash
# Check Node.js version (>=18.0.0)
node --version

# Check Python version (>=3.9)
python --version

# Check npm version
npm --version

# Check Git configuration
git --version
git config --list
```

### 2. Project Setup
```bash
# Clone repository
git clone <repository-url>
cd data-practitioner-agent-system

# Install Node.js dependencies
cd bmad-method
npm install

# Setup Python environment
python -m venv venv
source venv/bin/activate  # or `venv\Scripts\activate` on Windows
pip install -r requirements.txt

# Navigate to expansion pack
cd expansion-packs/bmad-data-practitioner
```

### 3. Component Initialization

#### Core BMad Setup
```bash
# Run setup script
npm run setup:development

# Initialize agents
npx bmad init-agents --profile data-practitioner

# Verify installation
npm test
```

#### Python Components Setup
```bash
# Test PyAirbyte installation
python -c "import airbyte; print('PyAirbyte installed successfully')"

# Initialize DuckDB
python scripts/setup_duckdb.py

# Test EDA components
python tools/data-services/test-eda-simple.js
```

#### Dagster Setup
```bash
# Navigate to Dagster project
cd dagster-project

# Start development server
dagster dev

# Verify in browser: http://localhost:3000
```

#### Evidence.dev Setup
```bash
# Navigate to Evidence project
cd evidence-project

# Install dependencies
npm install

# Start development server
npm run dev

# Verify in browser: http://localhost:3001
```

### 4. Development Tools Configuration

#### VS Code Setup (Recommended)
Create `.vscode/settings.json`:
```json
{
  "python.defaultInterpreterPath": "./venv/bin/python",
  "python.linting.enabled": true,
  "python.linting.pylintEnabled": true,
  "javascript.preferences.importModuleSpecifier": "relative",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "files.associations": {
    "*.md": "markdown"
  }
}
```

Create `.vscode/extensions.json`:
```json
{
  "recommendations": [
    "ms-python.python",
    "ms-vscode.vscode-json",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.test-adapter-converter"
  ]
}
```

## Learning Path

### Week 1: Foundation Understanding

#### Day 1-2: BMad Method Core
- **Read**: `docs/core-architecture.md`
- **Study**: Agent system in `bmad-method/.bmad-core/agents/`
- **Practice**: Create a simple agent configuration
- **Exercise**: Run existing test suite and understand structure

#### Day 3-4: Data Ingestion (Story 1.2)
- **Read**: `docs/stories/1.2.data-ingestion-pyairbyte-integration.md`
- **Study**: `tools/data-services/pyairbyte-wrapper.js`
- **Practice**: Configure a test data source
- **Exercise**: Create a simple PyAirbyte connector test

#### Day 5: Analytics Platform (Story 1.3)
- **Read**: `docs/stories/1.3.local-analytics-duckdb-integration.md`
- **Study**: `tools/data-services/duckdb-wrapper.js`
- **Practice**: Execute basic DuckDB queries
- **Exercise**: Create a simple analytics query

### Week 2: Advanced Components

#### Day 1-2: Orchestration (Story 1.4)
- **Read**: Dagster documentation and project structure
- **Study**: `dagster-project/assets/` and `jobs/`
- **Practice**: Create a simple asset
- **Exercise**: Build a basic data pipeline

#### Day 3-4: Transformation (Story 1.5)
- **Read**: dbt and SQLmesh integration documentation
- **Study**: `bmad-data-practitioner/dbt-project/models/`
- **Practice**: Create a simple dbt model
- **Exercise**: Implement dual-engine coordination

#### Day 5: Analysis Engine (Story 1.6)
- **Study**: `python-analysis/` components
- **Practice**: Run EDA automation scripts
- **Exercise**: Create a custom hypothesis generator

### Week 3: Publication and Quality

#### Day 1-2: Publication Platform (Story 1.7)
- **Read**: Evidence.dev documentation
- **Study**: `evidence-project/pages/` and components
- **Practice**: Create a simple report page
- **Exercise**: Build interactive visualization

#### Day 3-4: Quality Assurance (Story 1.8)
- **Study**: Quality gate configuration
- **Practice**: Run comprehensive test suite
- **Exercise**: Create quality validation tests

#### Day 5: Integration Testing
- **Practice**: Run epic-level integration tests
- **Exercise**: Create end-to-end workflow test

### Week 4: Advanced Development

#### Day 1-2: Code Quality and Standards
- **Study**: Coding standards and best practices
- **Practice**: Code review processes
- **Exercise**: Refactor existing component

#### Day 3-4: Performance Optimization
- **Study**: Performance monitoring tools
- **Practice**: Profile system components
- **Exercise**: Optimize slow queries or processes

#### Day 5: Documentation and Deployment
- **Practice**: Write technical documentation
- **Exercise**: Deploy system to staging environment

## Development Workflows

### Daily Development Process

#### 1. Environment Preparation
```bash
# Activate Python environment
source venv/bin/activate

# Check system status
npm run health:check

# Pull latest changes
git pull origin main
npm install  # if package.json changed
```

#### 2. Feature Development
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... development work ...

# Run tests frequently
npm test -- --watch

# Run component-specific tests
npm run test:component -- data-ingestion
```

#### 3. Quality Checks
```bash
# Run linting
npm run lint

# Run type checking
npm run typecheck

# Run quality gates
npm run qa:check

# Run comprehensive tests
npm run test:comprehensive
```

#### 4. Code Review Process
```bash
# Commit changes
git add .
git commit -m "feat: implement feature description"

# Push branch
git push origin feature/your-feature-name

# Create pull request (via GitHub/GitLab)
```

### Testing Strategy

#### Unit Tests
```bash
# Run specific component tests
npm test tests/data-services/duckdb-wrapper.test.js

# Run Python tests
python -m pytest python-analysis/tests/

# Generate coverage report
npm run test:coverage
```

#### Integration Tests
```bash
# Run integration test suite
npm run test:integration

# Test specific story integration
npm run test:story -- 1.2

# Test cross-component workflows
npm run test:workflow
```

#### End-to-End Tests
```bash
# Run comprehensive E2E tests
npm run test:e2e

# Test complete data pipeline
npm run test:pipeline

# Performance testing
npm run test:performance
```

## Common Development Patterns

### 1. Adding New Data Sources

#### Step-by-Step Process
1. **Configure PyAirbyte Connector**:
   ```python
   # In tools/data-services/pyairbyte-wrapper.js
   async addSource(sourceConfig) {
       // Implementation
   }
   ```

2. **Create Schema Definition**:
   ```yaml
   # In config/sources/new-source.yaml
   source:
     name: "new-source"
     type: "api"
     config:
       endpoint: "https://api.example.com"
   ```

3. **Add Transformation Models**:
   ```sql
   -- In dbt-project/models/staging/stg_new_source.sql
   {{ config(materialized='view') }}
   SELECT * FROM {{ source('new_source', 'raw_table') }}
   ```

4. **Create Quality Tests**:
   ```yaml
   # In dbt-project/models/staging/schema.yml
   version: 2
   models:
     - name: stg_new_source
       tests:
         - unique:
             column_name: id
   ```

### 2. Creating New Analysis Components

#### Example: Custom Pattern Detector
```python
# In python-analysis/custom_pattern_detector.py
class CustomPatternDetector:
    def __init__(self, data_source):
        self.data_source = data_source
    
    def detect_patterns(self):
        # Implementation
        pass
    
    def generate_insights(self):
        # Implementation
        pass
```

#### Integration with Analysis Engine
```javascript
// In tools/data-services/analytical-engine.js
async runCustomAnalysis(dataSource) {
    const detector = new CustomPatternDetector(dataSource);
    const patterns = await detector.detect_patterns();
    return this.formatResults(patterns);
}
```

### 3. Adding New Quality Gates

#### Configuration
```yaml
# In config/quality-assurance/custom-gates.yaml
gates:
  custom_data_quality:
    threshold: 95
    metric: completeness_score
    action: warn
    
  custom_performance:
    threshold: 5000
    metric: query_response_time_ms
    action: block
```

#### Implementation
```javascript
// In tools/data-services/quality-assurance-engine.js
async evaluateCustomGate(gateConfig, metrics) {
    const score = metrics[gateConfig.metric];
    const threshold = gateConfig.threshold;
    
    if (score < threshold) {
        return {
            passed: false,
            action: gateConfig.action,
            message: `${gateConfig.metric} below threshold`
        };
    }
    
    return { passed: true };
}
```

## Debugging and Troubleshooting

### Common Issues and Solutions

#### 1. Python Environment Issues
```bash
# Check Python path
which python

# Verify virtual environment
echo $VIRTUAL_ENV

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

#### 2. Node.js Module Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove and reinstall node_modules
rm -rf node_modules package-lock.json
npm install
```

#### 3. DuckDB Connection Problems
```bash
# Check database file permissions
ls -la data/analytics.duckdb

# Reset connection pool
node tools/data-services/connection-manager.js --reset

# Test connection
node tools/data-services/duckdb-wrapper.js --test-connection
```

#### 4. Dagster Issues
```bash
# Restart Dagster daemon
dagster-daemon restart

# Check daemon status
dagster-daemon status

# View logs
tail -f ~/.dagster/logs/dagster-daemon.log
```

### Debugging Tools

#### 1. System Monitoring
```bash
# Real-time system status
npm run monitor:dev

# Component health check
npm run health:component -- duckdb

# Performance profiling
npm run profile:performance
```

#### 2. Log Analysis
```bash
# Structured log viewing
npm run logs:structured

# Component-specific logs
npm run logs:component -- transformation-engine

# Error log analysis
npm run logs:errors
```

## Best Practices

### Code Quality
1. **Follow existing patterns**: Study current implementations before adding new features
2. **Write tests first**: TDD approach for new functionality
3. **Document decisions**: Update ADRs for architectural changes
4. **Performance aware**: Consider memory and CPU impact
5. **Security conscious**: Never expose credentials or sensitive data

### Git Workflow
1. **Meaningful commits**: Use conventional commit messages
2. **Small focused PRs**: Easier to review and merge
3. **Feature branches**: Always work on feature branches
4. **Clean history**: Squash commits when appropriate

### Testing
1. **Test coverage**: Aim for >80% code coverage
2. **Integration tests**: Test component interactions
3. **Performance tests**: Monitor performance regressions
4. **Quality gates**: All tests must pass before merge

### Documentation
1. **Code comments**: Explain complex business logic
2. **README updates**: Keep documentation current
3. **API documentation**: Document public interfaces
4. **Change logs**: Document breaking changes

## Resources and References

### Internal Documentation
- **Architecture**: `/docs/architecture/`
- **API Documentation**: `/docs/generated/api/`
- **Testing Guidelines**: `/docs/testing-guidelines.md`
- **User Guides**: `/docs/user-guides/`

### External Resources
- **BMad Method**: [Core Documentation]
- **DuckDB**: https://duckdb.org/docs/
- **Dagster**: https://dagster.io/docs
- **Evidence.dev**: https://evidence.dev/docs
- **dbt**: https://docs.getdbt.com/

### Community and Support
- **Team Slack**: #data-practitioner-dev
- **Code Reviews**: GitHub/GitLab pull requests
- **Architecture Discussions**: Weekly team meetings
- **Knowledge Sharing**: Bi-weekly tech talks

## Career Development Path

### Junior Developer (0-1 years)
- Master individual component development
- Understand data pipeline concepts
- Contribute to bug fixes and small features
- Learn testing and quality practices

### Mid-Level Developer (1-3 years)
- Design and implement new features
- Lead component architecture decisions
- Mentor junior developers
- Contribute to system optimization

### Senior Developer (3+ years)
- System architecture design
- Cross-team collaboration
- Performance and scalability optimization
- Technical leadership and mentoring

## Assessment and Certification

### Development Milestones

#### Week 2 Assessment
- [ ] Successfully set up development environment
- [ ] Created simple PyAirbyte connector
- [ ] Wrote basic DuckDB queries
- [ ] Ran and understood test suite

#### Month 1 Assessment
- [ ] Implemented complete feature (with tests)
- [ ] Created dbt transformation models
- [ ] Built Dagster asset pipeline
- [ ] Contributed to code review process

#### Month 3 Assessment
- [ ] Led feature development from design to deployment
- [ ] Optimized system performance issue
- [ ] Mentored new team member
- [ ] Contributed to architecture decisions

### Certification Levels
- **BMad Data Practitioner Developer**: Basic system understanding
- **BMad Data Practitioner Engineer**: Feature development capability
- **BMad Data Practitioner Architect**: System design and optimization

## Appendix

### Useful Commands Reference
```bash
# Development environment
npm run dev:all              # Start all services
npm run dev:minimal          # Start core services only
npm run stop:all             # Stop all services

# Testing
npm run test:unit            # Unit tests only
npm run test:integration     # Integration tests
npm run test:e2e            # End-to-end tests
npm run test:performance    # Performance tests

# Quality assurance
npm run lint                 # Code linting
npm run format              # Code formatting
npm run typecheck           # Type checking
npm run qa:full             # Complete quality check

# Monitoring and debugging
npm run health:check        # System health
npm run logs:tail           # Live log viewing
npm run monitor:real-time   # Real-time monitoring
npm run debug:component     # Component debugging
```

### Configuration Files Overview
- `config/main-config.yaml`: Main system configuration
- `config/quality-assurance/`: Quality gate configurations
- `dagster-project/dagster.yaml`: Dagster configuration
- `evidence-project/evidence.config.yaml`: Evidence.dev configuration
- `dbt-project/dbt_project.yml`: dbt configuration

### Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial developer onboarding guide | Dev Agent |