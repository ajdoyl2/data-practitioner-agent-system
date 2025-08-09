# Source Tree Integration

## Existing Project Structure

```plaintext
bmad-method/
├── .github/                     # CI/CD workflows and issue templates
├── bmad-core/                   # Core framework (preserved unchanged)
├── docs/                        # User guides and project documentation
├── expansion-packs/             # Add-on packages (game dev examples)
├── tools/                       # JavaScript tooling infrastructure
└── package.json                 # Project metadata and dependencies
```

## New File Organization

```plaintext
bmad-method/
├── expansion-packs/             # Existing expansion pack directory
│   └── bmad-data-practitioner/  # NEW: Data practitioner expansion pack
│       ├── agents/              # Data-specific agent definitions
│       ├── templates/           # Data workflow templates
│       ├── tasks/               # Data-specific task workflows
│       ├── checklists/          # Data quality and validation
│       ├── data/                # Knowledge bases and preferences
│       ├── workflows/           # Data analysis process flows
│       └── config.yaml          # Expansion pack configuration
├── tools/                       # Enhanced existing tooling
│   ├── builders/                # Existing web builder directory
│   │   └── data-builder.js      # NEW: Data tool integration builder
│   ├── data-services/           # NEW: Data processing services
│   ├── lib/                     # Enhanced shared utilities
│   └── installer/               # Enhanced installer
├── requirements.txt             # NEW: Python dependencies for data tools
├── dbt_project.yml             # NEW: dbt-core project configuration
├── .python-version             # NEW: Python version specification
└── .duckdb/                    # NEW: DuckDB database files (gitignored)
```

## Integration Guidelines

**File Naming Consistency:** All data agents follow hyphenated naming convention matching existing agent patterns, task files use verb-noun patterns consistent with existing task naming, template files maintain .yaml extension following existing template structure.

**Folder Organization Approach:** Complete expansion pack structure under `/expansion-packs/bmad-data-practitioner/` following established patterns, data processing services organized under `/tools/data-services/` for clear separation from core tools.

**Import/Export Pattern Consistency:** All new JavaScript modules use existing ES6 import/export patterns, YAML configuration loading follows existing yaml-utils.js patterns, agent definition processing maintains existing dependency-resolver.js integration.
