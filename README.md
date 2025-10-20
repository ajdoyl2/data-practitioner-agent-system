# Data Practitioner Agent System

> **BMad Method Expansion Pack for Modern Data Stack**
>
> A comprehensive AI-driven data analysis framework featuring 6 specialized agents for the complete data lifecycle.

[![BMad Method](https://img.shields.io/badge/BMad-expansion--pack-green.svg)](https://github.com/bmadcode/bmad-method)
[![Data Stack](https://img.shields.io/badge/stack-modern--data-purple.svg)](#tech-stack)

---

## 📖 Documentation

This repository contains a BMad Method expansion pack designed for data practitioners, providing specialized AI agents and integrated tools for modern data workflows.

**Main Documentation:**
- **[BMad Data Practitioner Expansion Pack →](bmad-method/expansion-packs/bmad-data-practitioner/README.md)** - Complete guide to agents, workflows, and features
- [BMad Method Framework →](bmad-method/README.md) - Core BMad framework documentation

---

## 🚀 Quick Start

```bash
# Install Python dependencies
pip install -r requirements.txt
pip install -r requirements-dagster.txt

# Install BMad Method framework
npm install

# Verify agents are available
/BMad:agents:bmad-orchestrator
*agent
```

---

## 📁 Repository Structure

```
├── bmad-method/              # BMad Method framework
│   ├── expansion-packs/
│   │   └── bmad-data-practitioner/  # Main expansion pack (agents, tasks, templates)
│   ├── config/               # Feature flags and QA configuration
│   └── tools/                # BMad CLI and utilities
├── agents/                   # Agent utility implementations (Python/JS)
├── bmad-data-practitioner/   # dbt/SQLMesh projects and scripts
├── docs/                     # Extensive project documentation
│   ├── architecture/         # System architecture documents
│   ├── stories/              # Implementation stories (1.0-1.8)
│   └── user-guides/          # User documentation
├── tools/                    # Data service wrappers (8 major tools)
│   └── data-services/        # EDA engine, documentation engine, etc.
├── templates/                # Document and code templates
├── tests/                    # Test suites
├── requirements.txt          # Core Python dependencies
└── requirements-dagster.txt  # Dagster-specific dependencies
```

---

## 🎭 6 Specialized Agents

Our AI specialists cover the complete data lifecycle:

- **Emma** - Data Analyst (exploratory analysis, insights, visualization)
- **Marcus** - Data Architect (system design, data modeling, architecture)
- **Alex** - Data Engineer (pipelines, ETL/ELT, infrastructure)
- **Sophia** - Data Product Manager (strategy, requirements, stakeholder alignment)
- **Riley** - Data QA Engineer (quality assurance, validation, monitoring)
- **Jordan** - ML Engineer (machine learning models, MLOps, deployment)

**[See full agent documentation →](bmad-method/expansion-packs/bmad-data-practitioner/README.md#-specialized-agents)**

---

## 🛠 Tech Stack

This expansion pack integrates with modern data stack tools:

- **PyAirbyte** - Data ingestion from 350+ sources
- **DuckDB** - High-performance analytical database
- **dbt-core** - SQL-based data transformation
- **Dagster** - Workflow orchestration and monitoring
- **Evidence.dev** - BI and interactive visualization

Additional tools include ydata-profiling, Sweetviz, AutoViz for automated EDA, and comprehensive Python data science libraries.

---

## 🔄 Typical Workflows

### Quick Analysis (Existing Data)
1. `*agent data-analyst` → Exploratory data analysis
2. Statistical testing and hypothesis validation
3. Interactive dashboards and visualizations

### Full Pipeline Development
1. `*agent data-product-manager` → Requirements gathering
2. `*agent data-architect` → System architecture design
3. `*agent data-engineer` → Pipeline implementation with Dagster + dbt
4. `*agent data-qa-engineer` → Data quality validation and monitoring

### Machine Learning Projects
1. `*agent data-analyst` → Feature exploration and selection
2. `*agent ml-engineer` → Model development and training
3. `*agent data-engineer` → Deployment pipeline setup
4. `*agent data-qa-engineer` → Model monitoring and validation

---

## 🚧 Project Status

### Production Ready ✅
- All 6 specialized AI agents
- Evidence.dev BI platform with sample dashboards
- Dagster orchestration framework
- Python analysis modules (EDA, statistical testing, pattern detection)
- DuckDB and PyAirbyte integration
- Comprehensive documentation

### In Development ⚠️
- dbt transformation asset integration in Dagster
- Evidence.dev publication integration in Dagster
- Additional workflow task templates

### Configuration Note 📝
- dbt-core dependency should be added to `requirements.txt` before using dbt features
- See troubleshooting section in main README for details

---

## 💡 Key Features

- **Automated EDA**: Multiple tools (ydata-profiling, Sweetviz, AutoViz) for comprehensive data profiling
- **Statistical Analysis**: Built-in hypothesis testing and pattern detection modules
- **Cost Tracking**: Monitor data processing costs across workflows
- **Narrative Generation**: Pew Research-style insight documentation
- **Quality Gates**: Comprehensive validation checkpoints and monitoring
- **Dual Transformation**: Choose between dbt-core or SQLMesh
- **Agent Collaboration**: Seamless handoffs between specialized agents

---

## 📚 Documentation

- **[User Guides](docs/user-guides/)** - Role-specific guides for analysts, engineers, and managers
- **[Architecture](docs/architecture/)** - System design and technical deep dives
- **[Stories](docs/stories/)** - Implementation stories and development history
- **[Testing](docs/testing/)** - Testing frameworks and quality assurance
- **[Expansion Pack Docs](bmad-method/expansion-packs/bmad-data-practitioner/docs/)** - Detailed configuration and deployment guides

---

## 🆘 Support & Troubleshooting

### Common Issues

**Agent names don't match documentation:**
- Agents use their actual names: Marcus, Alex, Sophia, Riley, Emma, Jordan
- This is expected behavior - each agent introduces itself correctly

**dbt commands fail:**
```bash
# Add dbt-core to requirements
echo "dbt-core>=1.7.0" >> requirements.txt
echo "dbt-duckdb>=1.7.0" >> requirements.txt
pip install -r requirements.txt
```

**Dagster transformation assets show as placeholder:**
- This is expected - dbt integration in Dagster is marked for future development
- Use dbt CLI directly or the data-engineer agent for transformations

### Getting Help
1. Use `*help` command in any agent for agent-specific assistance
2. Check the [troubleshooting guide](bmad-method/expansion-packs/bmad-data-practitioner/README.md#-support--troubleshooting)
3. Review the extensive documentation in `/docs`

---

## 🤝 Contributing

This project is part of the BMad Method ecosystem. For contribution guidelines, see:
- [BMad Method Contributing Guide](bmad-method/CONTRIBUTING.md)
- Project-specific patterns in `/docs/patterns`

---

## 📄 License

This expansion pack follows BMad Method licensing terms (MIT).

---

## 🚀 Ready to Transform Your Data Workflows?

```bash
# Install the dependencies
pip install -r requirements.txt
pip install -r requirements-dagster.txt

# Start your first analysis
/BMad:agents:bmad-orchestrator
*agent data-analyst
*exploratory-analysis
```

**Welcome to the future of AI-assisted data analysis!**

---

**[Get Started with Full Documentation →](bmad-method/expansion-packs/bmad-data-practitioner/README.md)**
