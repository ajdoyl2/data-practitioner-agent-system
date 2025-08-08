# Data Practitioner Agent System Expansion Pack: Comprehensive PRD

**BMAD-METHOD has evolved from software development into a universal agentic framework that transforms domain expertise into AI-powered workflow systems.** This Product Requirements Document outlines the architecture and implementation approach for a comprehensive data practitioner expansion pack that integrates autonomous analysis capabilities, modern data stack tools, and publication-quality insight generation into BMAD-METHOD's proven expansion pack framework.

The data practitioner expansion pack will enable organizations to build autonomous data analysis systems that guide users through ELT modeling processes, generate hypotheses automatically, perform statistical analysis, and create publication-quality insight documents similar to Pew Research articles. **Each milestone delivers independent value while building toward a comprehensive data intelligence platform.**

## Core system architecture and expansion pack integration

BMAD-METHOD's expansion pack architecture provides an ideal foundation for data practitioner workflows through its natural language framework and modular design patterns. The system's YAML-based agent configuration, template-driven workflows, and dependency management create a sophisticated foundation for domain-specific data analysis capabilities.

### Integration with BMAD-METHOD infrastructure

The data practitioner expansion pack leverages BMAD-METHOD's core infrastructure components including the build system, CLI tools, configuration management, and workflow orchestration. **The expansion pack integrates seamlessly with the existing two-phase approach**: Planning (Web UI) for requirement gathering and architecture design, followed by Development (IDE) for implementation and execution.

```
bmad-data-practitioner/
├── agents/
│   ├── data-product-manager.md     # Requirements and strategy
│   ├── data-architect.md           # System design and governance
│   ├── data-engineer.md           # Pipeline and infrastructure
│   ├── data-analyst.md            # Exploration and analysis
│   ├── ml-engineer.md             # Model development and training
│   └── data-qa-engineer.md        # Testing and validation
├── templates/
│   ├── data-requirements-prd.md    # Data project PRD template
│   ├── data-architecture-doc.md    # Technical architecture template
│   ├── hypothesis-generation.md    # Automated hypothesis workflows
│   ├── statistical-analysis.md     # Analysis methodology template
│   └── insight-document.md         # Publication-ready reporting
├── tasks/
│   ├── data-source-discovery.md    # API and data file ingestion
│   ├── elt-modeling-guidance.md    # Interactive modeling workflows
│   ├── hypothesis-testing.md       # Statistical validation processes
│   └── insight-extraction.md       # Automated narrative generation
├── checklists/
│   ├── data-quality-validation.md  # Quality assurance criteria
│   ├── statistical-rigor.md       # Analysis methodology validation
│   └── publication-readiness.md    # Document quality standards
└── data/
    ├── data-science-knowledge.md   # Domain expertise and best practices
    ├── statistical-methods.md      # Methodology and technique library
    └── regulatory-compliance.md    # Governance and ethics framework
```

The agent orchestration follows BMAD-METHOD's established patterns with specialized workflows: **Data Product Manager → Data Architect → Data Engineer → Data Analyst → ML Engineer → Data QA Engineer**. This progression ensures comprehensive coverage from business requirements through technical implementation to quality validation.

### Natural language workflow templates

BMAD-METHOD's template system provides sophisticated workflow guidance through embedded LLM instructions and elicitation directives. The data practitioner expansion pack extends this approach with specialized templates for data analysis workflows that maintain the system's natural language focus while incorporating technical rigor.

**Data Requirements PRD Template** guides stakeholders through comprehensive requirement gathering including data sources, analysis objectives, hypothesis formation, statistical methodology selection, and publication criteria. The template uses progressive elicitation to transform business questions into technically implementable specifications.

**Hypothesis Generation Template** implements advanced elicitation directives that combine domain knowledge with automated pattern recognition capabilities. This template leverages research breakthroughs in LLM-powered hypothesis generation, incorporating causal graph integration and semantic network analysis for enhanced insight discovery.

## Evidence.dev integration for publication-quality insights

Evidence.dev's Universal SQL architecture and static site generation capabilities provide an ideal platform for creating Pew Research-style insight documents within the BMAD-METHOD ecosystem. **The integration enables analysts to transform data analysis into publication-ready narratives through SQL-driven interactivity and sophisticated visualization capabilities.**

### Universal SQL architecture for embedded analytics

Evidence.dev's DuckDB WASM foundation aligns perfectly with the modern data stack integration patterns identified in the research. The client-side processing architecture enables millisecond response times for user interactions while supporting complex analytical queries on large datasets through intelligent partitioning and caching strategies.

The system's multi-source integration capabilities support the expansion pack's API and data file input requirements through extensive connectivity options including major cloud warehouses (Snowflake, BigQuery, Redshift, Databricks), traditional databases, and non-SQL sources (Google Sheets, CSV files, APIs). **Real-time data handling through scheduled refreshes and build-time extraction enables both historical analysis and current reporting.**

### Publication workflow automation

Evidence.dev's template system enables dynamic page generation from single templates with parameterized content, supporting the expansion pack's goal of automated insight document creation. The markdown-based authoring approach with embedded SQL queries aligns with BMAD-METHOD's natural language philosophy while providing sophisticated data integration capabilities.

**Automated narrative generation** leverages Evidence.dev's component library for standard statistical visualizations combined with custom D3 and Observable integration for advanced analytical displays. The system supports responsive design for mobile and desktop consumption with export capabilities for PDF and static sharing, meeting publication requirements.

The deployment architecture through Evidence Cloud or self-hosting options (Netlify, Vercel) provides flexible sharing mechanisms with public/private deployments, embedded reporting capabilities, and multi-tenant architecture supporting organization-wide deployments.

## Modern data stack integration patterns

The research reveals powerful integration patterns combining DuckDB, dbt, PyAirbyte, and Dagster that create a comprehensive local-first development environment scaling to production deployment. **These tools form the technical foundation for the expansion pack's ELT modeling guidance and automated analysis capabilities.**

### DuckDB as the analytical engine

DuckDB's embedded, in-process design eliminates client-server barriers while providing sophisticated analytical capabilities directly within applications. The expansion pack leverages DuckDB's columnar architecture and vectorized execution for efficient analytical queries on larger-than-memory datasets through smart partitioning and out-of-core processing.

**Multi-format support** enables direct ingestion from CSV, Parquet, JSON, and other formats from local filesystem, HTTP endpoints, and cloud storage without intermediate loading steps. This capability directly supports the expansion pack's API and data file input requirements while maintaining high performance through partial file reading and intelligent caching.

The Medallion Architecture integration (Bronze/Silver/Gold patterns) provides a structured approach for data transformation workflows where DuckDB handles the L and T stages of ETL/ELT processes with efficient SQL processing and joins.

### dbt for transformation workflows

dbt's layered architecture approach (Source → Staging → Intermediate → Marts) provides a proven framework for organizing data transformations within the expansion pack's ELT modeling guidance workflows. **The system's testing patterns and documentation generation capabilities ensure data quality and maintain comprehensive lineage documentation.**

Generic tests (unique, not_null, accepted_values, relationships) combined with custom SQL-based assertions provide robust data quality validation integrated into the expansion pack's quality assurance framework. The CI/CD integration patterns enable automated testing of data transformations with selective execution for modified models, reducing pipeline execution time while maintaining quality standards.

### PyAirbyte for flexible data ingestion

PyAirbyte's connector architecture provides flexible data ingestion capabilities supporting the expansion pack's diverse input requirements. **The Python-native integration enables seamless connectivity to various data sources while maintaining local development capabilities that scale to production deployment.**

Stream selection and cache management features allow selective data loading optimized for specific analysis requirements. The integration with DataFrame libraries (Pandas, Polars) through DuckDB provides efficient transformation workflows supporting the expansion pack's analytical processing needs.

### Dagster for workflow orchestration

Dagster's asset-centric design treats data assets (tables, files, ML models) as first-class citizens, aligning perfectly with the expansion pack's focus on data products and analysis artifacts. **Software-defined assets provide intuitive dependency tracking, built-in lineage visualization, and clear separation of concerns between data products.**

Asset checks and data quality monitoring capabilities integrate directly with the expansion pack's validation frameworks, providing real-time quality alerts and historical trend tracking. The partitioning strategies (time-based, custom, dynamic) support various analytical scenarios while resource management enables cost optimization through selective execution.

## Autonomous analysis capabilities integration

The research reveals a mature ecosystem of tools and techniques for automated exploratory data analysis, hypothesis generation, statistical testing, and insight extraction. **The expansion pack integrates these capabilities through a human-AI collaboration framework that leverages automation while maintaining analyst oversight and validation.**

### Automated exploratory data analysis

The expansion pack incorporates proven automated EDA tools including pandas-profiling for comprehensive data summaries, Sweetviz for target analysis and dataset comparison, and AutoViz for automatic visualization selection. These tools integrate with the DuckDB analytical engine to provide rapid data exploration capabilities within the expansion pack's workflow templates.

**Pattern detection and anomaly identification** leverage statistical thresholds, machine learning approaches (isolation forests, autoencoders), and time series analysis algorithms for comprehensive data understanding. Multi-dimensional analysis capabilities identify complex patterns across multiple variables, supporting the hypothesis generation workflows.

### LLM-powered hypothesis generation

Research breakthroughs demonstrate GPT-4's capability to analyze scientific literature and extract causal relationships with 87.54% accuracy in distinguishing causality from correlation. **The expansion pack integrates these capabilities through specialized templates that combine LLMs with causal knowledge graphs for enhanced hypothesis quality.**

The LLMCG framework approach leverages causal knowledge graphs with LLMs using link prediction algorithms and node2vec embeddings for discovering potential causal relationships. This integration supports cross-domain applications while maintaining scientific rigor through automated validation and expert review processes.

### Statistical analysis automation

Automated statistical testing frameworks integrate with the expansion pack's validation workflows through tools like Displayr's automatic test selection (50+ statistical tests) and advanced significance testing capabilities. **The system automatically selects appropriate tests based on data properties including sample size, weights, and data types while providing automated multiple comparison corrections.**

AutoML integration through frameworks like Auto-sklearn, H2O AutoML, and AutoGluon provides sophisticated model selection and validation capabilities. The expansion pack incorporates these tools through workflow templates that guide analysts through model development while maintaining statistical rigor and interpretability.

## API design for data workflows

The expansion pack implements comprehensive API patterns supporting data ingestion, processing workflows, and real-time interaction requirements. **The API architecture follows modern design principles with RESTful endpoints for data submission, WebSocket integration for real-time updates, and asynchronous processing patterns for long-running analytical tasks.**

### Data ingestion API patterns

The system supports both homogeneous and heterogeneous data ingestion patterns through flexible endpoint design. **Homogeneous ingestion focuses on speed and data protection for same-format transfers, while heterogeneous ingestion provides transformation capabilities for complex data integration scenarios.**

```
POST /api/v1/data-sources
{
  "name": "customer-analytics-source",
  "type": "file_upload|api_connector|database_connection",
  "configuration": {
    "format": "csv|parquet|json",
    "schema_validation": true,
    "transformation_rules": []
  },
  "schedule": "on_demand|batch|streaming"
}
```

The Fire-and-Forget pattern enables near real-time synchronization between sources and destinations through micro-batches with configurable intervals. Point-to-point, hub-and-spoke, and lambda architecture patterns provide flexibility for different organizational requirements and data volumes.

### Workflow orchestration APIs

Asynchronous processing patterns handle long-running analytical tasks through proper status monitoring and progress tracking. **The system implements WebSocket APIs for real-time status updates combined with REST endpoints for workflow management and result delivery.**

Status monitoring provides comprehensive execution tracking with estimated completion times, progress indicators, and detailed error reporting. The system maintains execution state through proper connection mapping and supports both polling and webhook callback patterns for result delivery.

### Real-time interaction capabilities

WebSocket integration enables bidirectional communication for interactive analysis sessions where analysts can adjust parameters and receive immediate feedback. **The system balances real-time capabilities with scalability requirements through intelligent connection management and backpressure handling.**

Queue management through message queues (SQS, Kafka) provides decoupled architecture supporting high-volume scenarios with exactly-once delivery guarantees and comprehensive error handling through dead letter queues.

## Milestone-based development framework

The expansion pack implements a comprehensive milestone-based development approach that delivers independent value at each stage while building toward the complete data intelligence platform. **The framework combines learning milestones for uncertainty reduction, PI milestones for progress evaluation, and fixed-date milestones for external requirements.**

### Component independence and value delivery

**Milestone 1: Data Discovery and Ingestion Foundation (Weeks 1-4)**
- Implement basic API endpoints for file upload and database connectivity
- Deploy DuckDB integration for local analytical processing  
- Create fundamental data quality validation workflows
- Deliver immediate value through simplified data ingestion and basic exploration

**Milestone 2: ELT Modeling and Transformation Workflows (Weeks 5-8)**
- Integrate dbt for structured transformation workflows
- Implement guided modeling templates through BMAD-METHOD framework
- Deploy automated testing and validation capabilities
- Provide comprehensive data transformation and quality assurance

**Milestone 3: Automated Analysis and Hypothesis Generation (Weeks 9-12)**
- Integrate automated EDA tools and statistical testing frameworks
- Deploy LLM-powered hypothesis generation capabilities
- Implement human-AI collaboration patterns for analysis validation
- Enable sophisticated analytical capabilities with automated insights

**Milestone 4: Publication-Quality Reporting (Weeks 13-16)**
- Deploy Evidence.dev integration for insight document generation
- Implement automated narrative generation and visualization capabilities
- Create publication workflow templates and quality validation
- Deliver comprehensive reporting capabilities meeting publication standards

### Learning milestone implementation

Each milestone incorporates learning objectives that convert project uncertainties into knowledge through systematic experimentation and validation. **The framework emphasizes building reusable knowledge about design constraints, user requirements, and integration patterns for future expansion pack development.**

Set-Based Concurrent Engineering principles guide exploration of design limits rather than point solutions, documenting learning for organizational reuse. The approach enables systematic progression through alphabetical prototype naming and structured knowledge capture.

### Agile integration patterns

The expansion pack integrates with BMAD-METHOD's existing agile workflows through incremental delivery every 2-3 weeks with continuous stakeholder feedback. **Progressive user experiences with reactive components enable early validation of core capabilities while building toward comprehensive functionality.**

Platform Engineering approaches consolidate technology stacks for improved usability while enabling unbridled innovation through developer-friendly abstractions. The milestone framework celebrates achievements while maintaining focus on continuous value delivery and course correction based on user feedback.

## Technical implementation strategy

The implementation strategy leverages BMAD-METHOD's proven infrastructure while incorporating modern data stack best practices and autonomous analysis capabilities. **The approach emphasizes local-first development that scales to production deployment with comprehensive quality assurance and governance frameworks.**

### Architecture integration patterns

Microservices architecture enables modular components for EDA, hypothesis generation, statistical testing, and insight extraction through API-first design and container deployment for consistent environments. **Workflow engines (Dagster, Apache Airflow) provide automated orchestration while event-driven architecture supports real-time processing triggers.**

Data integration strategies support multi-source connectivity through automated connectors for databases, APIs, files, and streaming sources. Schema evolution capabilities adapt to changing data structures while maintaining comprehensive lineage tracking for all transformations and analysis steps.

### Development and deployment patterns

The Local Modern Data Stack (Dagster + dbt + DuckDB) creates powerful local development environments that eliminate expensive PaaS platform usage while providing fast feedback loops and complete environment isolation. **Software engineering best practices include version control, CI/CD integration, and automated testing throughout the development lifecycle.**

Hybrid cloud patterns enable development-to-production pipeline progression: local development using DuckDB + dbt + Dagster for rapid iteration, cloud transition deploying same code to platforms like Microsoft Fabric Python Notebooks, scaling through cloud compute for larger datasets, and enterprise governance applying security and monitoring.

### Quality assurance and governance

Automated bias detection and human oversight protocols ensure ethical AI practices throughout the analytical workflows. **Fairness monitoring provides continuous assessment of algorithmic fairness across different groups while learning from human feedback improves system performance over time.**

Performance evaluation frameworks measure task completion time, decision quality, user satisfaction, and trust/adoption metrics to ensure successful human-AI collaboration. The system maintains comprehensive audit logging and monitoring while supporting role-based access control and data privacy requirements.

## Integration with existing BMAD-METHOD infrastructure

The data practitioner expansion pack seamlessly integrates with BMAD-METHOD's existing infrastructure through proven extension patterns and shared service utilization. **The integration leverages the core framework's agent orchestration, template engine, context management, and workflow engine while adding specialized data analysis capabilities.**

### Shared service utilization

The expansion pack leverages BMAD-METHOD's Node.js-based build system for consolidating agent assets into structured bundles and CLI tools for installation, planning, development, and quality assurance phases. **Configuration system integration through core-config.yml and technical preferences maintains consistency with existing organizational standards.**

Template engine integration provides markdown-based workflows with YAML front matter and embedded LLM instructions optimized for data analysis scenarios. Context management ensures lean context windows through dependency-based loading while maintaining cross-session persistence through document artifacts.

### IDE and development tool integration

The expansion pack supports BMAD-METHOD's existing IDE integration patterns including Cursor custom modes, Claude Code slash commands, Windsurf @ symbol interactions, and VS Code Copilot integration. **The natural language framework approach ensures consistency with existing development workflows while adding specialized data analysis capabilities.**

Story-file based handoffs between agents maintain the established workflow patterns while incorporating data analysis artifacts and validation checkpoints. Human-in-the-loop validation points ensure quality control throughout the analytical workflows while maintaining the system's agile development principles.

## Conclusion and implementation roadmap

The data practitioner agent system expansion pack represents a comprehensive integration of autonomous analysis capabilities, modern data stack tools, and publication-quality reporting within BMAD-METHOD's proven expansion pack framework. **The milestone-based approach delivers independent value at each stage while building toward a complete data intelligence platform that transforms how organizations approach data analysis and insight generation.**

The technical architecture leverages cutting-edge research in automated data analysis, LLM-powered hypothesis generation, and modern data stack integration patterns to create a sophisticated yet accessible system for data practitioners. Evidence.dev integration provides publication-quality insight generation capabilities that rival professional research organizations while maintaining the code-first approach that ensures reproducibility and version control.

**The implementation strategy balances immediate value delivery through basic data ingestion and analysis capabilities with long-term vision for comprehensive autonomous analysis systems.** Each milestone builds upon previous capabilities while delivering standalone value, ensuring continuous stakeholder engagement and iterative improvement based on real-world usage and feedback.

This expansion pack positions BMAD-METHOD at the forefront of intelligent data analysis platforms, combining the framework's proven agent orchestration capabilities with the latest advances in automated analysis and modern data infrastructure to create truly revolutionary data practitioner workflows.