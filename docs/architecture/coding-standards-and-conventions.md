# Coding Standards and Conventions

## Existing Standards Compliance

**Code Style:** Natural language framework with YAML frontmatter and Markdown content, JavaScript ES6+ modules with consistent async/await patterns following existing tools/ directory conventions  
**Linting Rules:** Prettier ^3.5.3 for Markdown/YAML formatting, ESLint patterns inferred from existing codebase structure, consistent indentation and naming conventions  
**Testing Patterns:** Jest ^30.0.4 testing framework with minimal current coverage, focus on integration testing over unit testing, CLI tool validation through existing validation scripts  
**Documentation Style:** Markdown-based with YAML configuration, embedded instructions for LLM processing, natural language workflow descriptions with structured metadata

## Enhancement-Specific Standards

- **Python Code Integration Standards:** All Python code executed through Node.js subprocess interfaces, Python scripts follow PEP 8 standards with black formatting, virtual environment isolation with pinned dependency versions
- **Data Processing Standards:** SQL queries follow consistent formatting and naming conventions, dbt models use standardized layering (source → staging → intermediate → marts), DuckDB operations wrapped with proper error handling and resource management
- **Configuration Management Standards:** All data tool configurations stored in YAML following existing technical-preferences patterns, environment-specific settings isolated in separate configuration files, sensitive credentials encrypted using existing BMad security patterns
- **API Endpoint Standards:** RESTful endpoint design following existing CLI command patterns, consistent error response formats with proper HTTP status codes, JSON schema validation for all request/response payloads
- **Agent Workflow Standards:** Data agents follow identical YAML schema structure as existing agents, natural language instructions maintain existing elicitation and template patterns, cross-agent workflow coordination uses established handoff mechanisms

## Critical Integration Rules

**Existing API Compatibility:** All existing BMad-Method CLI commands, agent workflows, and web-builder functionality must remain completely unchanged - new functionality is purely additive through expansion pack patterns

**Database Integration Consistency:** All data processing errors use existing BMad error patterns with chalk styling, Python subprocess errors wrapped and translated to Node.js error objects, graceful degradation when data tools unavailable with clear user messaging

**Error Handling Integration:** Consistent logging patterns across all data components, error handling strategy comprehensive with retry policies and fallback approaches, system can recover from partial failures

**Logging Consistency:** All data processing components use existing BMad logging patterns, audit logging for all data operations following existing BMad logging patterns, secure deletion procedures for temporary data files
