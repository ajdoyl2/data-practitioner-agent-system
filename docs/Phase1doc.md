I notice you haven't provided a PRD or requirements document. To create more focused and useful documentation, I recommend one of these options:

1.  **Create a PRD first** - Would you like me to help create a brownfield PRD before documenting? [cite\_start]This helps focus documentation on relevant areas. [cite: 43]
2.  [cite\_start]**Provide existing requirements** - Do you have a requirements document, epic, or feature description you can share? [cite: 43]
3.  **Describe the focus** - Can you briefly describe what enhancement or feature you're planning? [cite\_start]For example: [cite: 43]
      * [cite\_start]'Adding payment processing to the user service' [cite: 43]
      * [cite\_start]'Refactoring the authentication module' [cite: 43]
      * [cite\_start]'Integrating with a new third-party API' [cite: 43]
4.  **Document everything** - Or should I proceed with comprehensive documentation of the entire codebase? (Note: This may create excessive documentation for large projects) [cite\_start][cite: 44]

Please let me know your preference. As you've provided the entire codebase and initiated the `document-project` task, I will proceed with a comprehensive documentation of the entire system unless you specify otherwise.

Here is the Brownfield Architecture Document based on the provided codebase.

# BMad-Method Brownfield Architecture Document

## Introduction

This document captures the CURRENT STATE of the BMad-Method codebase, including technical debt, workarounds, and real-world patterns. [cite\_start]It serves as a reference for AI agents working on enhancements. [cite: 57]

### Document Scope

[cite\_start]Comprehensive documentation of entire system. [cite: 58]

### Change Log

| Date | Version | Description | Author |
| --- | --- | --- | --- |
| 2025-08-08 | 1.0 | Initial brownfield analysis | Winston |

## Quick Reference - Key Files and Entry Points

### Critical Files for Understanding the System

  * **Main Entry**: `tools/cli.js` (Primary CLI tool entry point)
  * **NPX Wrapper**: `tools/bmad-npx-wrapper.js` (Handles execution via npx)
  * **Installer**: `tools/installer/bin/bmad.js` (Handles new installations and updates)
  * **Configuration**: `bmad-core/core-config.yaml` (Core configuration for agent behavior, such as document locations and sharding)
  * **Core Business Logic**: The logic is distributed across several key directories:
      * `bmad-core/agents/`: Defines the roles, capabilities, and personas of individual AI agents.
      * `bmad-core/tasks/`: Contains the step-by-step instructions for complex, reusable actions that agents perform.
      * `bmad-core/templates/`: YAML-based document templates that guide AI agents in generating structured outputs like PRDs and architecture documents.
  * **Build System**: `tools/builders/web-builder.js` (Builds the web-compatible bundles for platforms like Gemini or ChatGPT).

## High Level Architecture

### Technical Summary

The BMad-Method is a Node.js-based framework designed to orchestrate AI agents for agile development. Its architecture is centered around a `bmad-core` directory which contains modular, natural language definitions for agents, tasks, and templates written in Markdown and YAML. A suite of command-line tools written in JavaScript processes these core files, resolving dependencies and bundling them into single-file contexts for different environments (IDE vs. Web). The system is highly configurable, primarily through YAML files, and uses a command-based structure for agent interaction.

### Actual Tech Stack (from package.json)

| Category | Technology | Version | Notes |
| --- | --- | --- | --- |
| Runtime | Node.js | \>=20.0.0 | Requirement specified in `package.json` |
| CLI Framework | commander | ^14.0.0 | Used for building the command-line interface |
| File System | fs-extra | ^11.3.0 | Provides extended file system methods |
| YAML Parsing | js-yaml | ^4.1.0 | Used for parsing YAML configuration files |
| Glob Matching | glob, minimatch | ^11.0.3, ^10.0.3 | Used for file pattern matching, especially during build and discovery |
| CLI UI | chalk, ora, inquirer | ^4.1.2, ^5.4.1, ^8.2.6 | Libraries for styling CLI output and creating interactive prompts |
| Testing | Jest | ^30.0.4 | The designated testing framework for the project |
| Formatting | Prettier | ^3.5.3 | Used for code and Markdown formatting |
| Release Mgmt | semantic-release | ^22.0.0 | Automates the versioning and package publishing process |

### Repository Structure Reality Check

  * **Type**: Monorepo-like structure for a single, unified NPM package. It is not a traditional monorepo with multiple packages, but it organizes different types of source files (agents, tasks, tools) in a modular way.
  * **Package Manager**: npm
  * **Notable**: The core logic is not in traditional JavaScript code but in Markdown and YAML files within `bmad-core/`. The JavaScript files in `tools/` act as a processor or "compiler" for this natural language framework.

## Source Tree and Module Organization

### Project Structure (Actual)

```text
bmad-method/
├── .github/                 # CI/CD workflows and issue templates
├── bmad-core/               # The "brain" of the framework
│   ├── agents/              # AI agent definitions (personas, commands)
│   ├── agent-teams/         # Definitions for bundling agents into teams
│   ├── checklists/          # Validation checklists for agents
│   ├── data/                # Knowledge bases, preferences, elicitation methods
│   ├── templates/           # YAML-driven document templates
│   ├── tasks/               # Step-by-step instructions for agent tasks
│   └── workflows/           # High-level process flows for agent collaboration
├── docs/                    # User guides and project documentation
├── expansion-packs/         # Add-on packages for specialized domains (e.g., game dev)
├── tools/                   # JS-based tooling that powers the framework
│   ├── builders/            # Scripts to build web bundles
│   ├── flattener/           # Tool to flatten codebases into XML for AI context
│   ├── installer/           # The interactive installer for setting up BMad in a project
│   └── lib/                 # Shared utilities for the tools
├── package.json             # Project metadata and dependencies
└── README.md                # Project entrypoint documentation
```

### Key Modules and Their Purpose

  * **bmad-core**: This is the central module containing all the definitions for the AI agents' behavior. It's designed to be human-readable and written in natural language.
  * **tools/installer**: A critical component that handles the setup of the BMad framework into a user's project, configuring IDE integration and installing necessary files.
  * **tools/builders**: This module contains the logic to read the `bmad-core` files, resolve their dependencies, and package them into large, single-file text bundles for use in web-based AI environments that don't have file system access.
  * **tools/flattener**: A utility that converts an entire codebase into a single XML file, making it easier to provide as context to large language models.
  * **expansion-packs**: These are self-contained extensions that add new agents, tasks, and templates for specialized domains like Game Development or DevOps, demonstrating the framework's modularity.

## Data Models and APIs

This project does not have traditional data models (like database schemas) or a public-facing API (like REST or GraphQL). Its "API" is the set of commands defined within each agent's YAML configuration, which are invoked by the user in a supported IDE or web UI. The data models are the YAML structures defined within the `bmad-core/templates/` directory, which dictate the format of generated documents.

## Technical Debt and Known Issues

  * **Configuration Complexity**: The system's high degree of configurability through multiple YAML files (`core-config.yaml`, agent YAML, template YAML) can create a steep learning curve and potential for misconfiguration.
  * **Dual Environment Maintenance**: Maintaining feature parity and consistent behavior between the file-system-based IDE environment and the single-file web bundle environment is a significant challenge. The `web-builder.js` script is critical but also a potential point of failure if agent dependencies are not resolved correctly.
  * **Lack of Automated Tests**: While `jest` is listed as a dependency, the flattened codebase does not contain a significant number of test files. This indicates a reliance on manual testing for the core tooling.
  * **Implicit Dependencies**: The natural language-based system has many implicit dependencies. For example, a task file might reference another file, but this is not formally tracked outside of the explicit `dependencies` block in an agent's YAML.

## Integration Points and External Dependencies

### External Services

  * **NPM**: Used for package distribution and dependency management.
  * **GitHub**: Used for source control and release automation via GitHub Actions.

### Internal Integration Points

  * **Agent-Task-Template System**: The core integration is between agents, the tasks they can execute, and the templates they use. An agent's YAML file explicitly lists its dependencies on tasks and templates, which are resolved by the tooling.
  * **Installer & IDEs**: The installer integrates with various IDEs (like VS Code with GitHub Copilot, Cursor, etc.) by creating configuration files (`.cursor/rules`, `.github/chatmodes`) that tell the IDE how to invoke the agents.
  * **Build System**: The `web-builder.js` integrates all `bmad-core` components into a single file, effectively "compiling" the natural language framework for a web environment.

## Development and Deployment

### Local Development Setup

1.  Clone the repository: `git clone https://github.com/bmadcode/bmad-method.git`
2.  Install dependencies: `npm install` (inferred from `package.json`)
3.  Run the installer to set up a test environment: `npm run install:bmad`
4.  Build web bundles: `npm run build`

### Build and Deployment Process

  * **Build Command**: `npm run build` executes `tools/cli.js build` to generate the `dist/` directory with web bundles.
  * **Deployment**: Deployment is automated via `semantic-release` and triggered by pushes to the `main` branch, as configured in `.github/workflows/release.yaml`.
  * **Versioning**: Versioning is handled automatically based on conventional commit messages (`feat:`, `fix:`, etc.). Manual versioning scripts are present but discouraged.

## Testing Reality

### Current Test Coverage

  * **Unit Tests**: A `jest` dependency exists, but the provided files show a lack of a dedicated test suite.
  * **Integration Tests**: No integration tests are apparent in the codebase.
  * **Manual Testing**: The primary method of QA appears to be manual testing of the installer, builder, and agent workflows.

### Running Tests

There are no dedicated test scripts in `package.json` (e.g., `npm test`). The `validate` script (`node tools/cli.js validate`) serves as a configuration check rather than a traditional test suite.

## Appendix - Useful Commands and Scripts

### Frequently Used Commands

```bash
# Build all web bundles for agents and teams
npm run build

# Install the framework into a target project
npm run install:bmad

# Flatten a codebase for AI context
npx bmad-method flatten

# Run configuration validation
npm run validate

# Format all markdown files
npm run format
```

### Debugging and Troubleshooting

  * **Logs**: No formal logging framework is apparent. Debugging would rely on `console.log` statements within the JavaScript tools.
  * **Common Issues**: The most common issues are likely related to incorrect YAML configuration in agent or template files, or dependency resolution errors during the build process. The `npm run validate` script can help identify some of these issues.