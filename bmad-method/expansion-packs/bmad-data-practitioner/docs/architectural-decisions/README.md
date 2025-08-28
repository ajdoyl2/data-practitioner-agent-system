# Architectural Decision Records (ADRs)

This directory contains the architectural decision records for the BMad Data Practitioner Agent System. These records document key architectural decisions, their context, reasoning, and consequences.

## ADR Format

Each ADR follows a standard format:

1. **Status**: proposed, accepted, rejected, deprecated, superseded
2. **Context**: The situation that prompted this decision
3. **Decision**: What we decided to do
4. **Consequences**: The positive and negative impacts of this decision

## Current ADRs

| ADR | Title | Status | Date |
|-----|-------|--------|------|
| [ADR-001](ADR-001-duckdb-as-analytics-engine.md) | DuckDB as Primary Analytics Engine | Accepted | 2024-01-XX |
| [ADR-002](ADR-002-dual-transformation-engines.md) | Dual Transformation Engine Architecture | Accepted | 2024-01-XX |
| [ADR-003](ADR-003-dagster-orchestration.md) | Dagster for Workflow Orchestration | Accepted | 2024-01-XX |
| [ADR-004](ADR-004-evidence-publication-platform.md) | Evidence.dev for Publication Platform | Accepted | 2024-01-XX |
| [ADR-005](ADR-005-quality-gates-architecture.md) | Quality Gates Architecture | Accepted | 2024-01-XX |
| [ADR-006](ADR-006-pyairbyte-data-ingestion.md) | PyAirbyte for Data Ingestion | Accepted | 2024-01-XX |

## Creating New ADRs

When making significant architectural decisions:

1. Create a new ADR file using the template
2. Use the next sequential number (ADR-XXX)
3. Follow the established naming convention
4. Include all relevant context and reasoning
5. Update this README with the new ADR

## ADR Template

```markdown
# ADR-XXX: [Decision Title]

## Status
[proposed | accepted | rejected | deprecated | superseded]

## Context
[Describe the forces at play, including technological, political, social, and project local]

## Decision
[State the architecture decision and provide detailed justification]

## Consequences
[Describe the resulting context, positive and negative consequences]

## References
[List any supporting documentation or research]
```