# BMad Data Practitioner Agent System 📊

> **Modern Data Stack Integration for BMad Method**
> 
> Transform your data analysis workflows with 6 specialized AI agents designed for comprehensive data lifecycle management. Powered by PyAirbyte, DuckDB, dbt-core, Dagster, and Evidence.dev.

[![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)](./config.yaml)
[![BMad Method](https://img.shields.io/badge/BMad-expansion--pack-green.svg)](https://github.com/bmad-method)
[![Data Stack](https://img.shields.io/badge/stack-modern--data-purple.svg)](#tech-stack)

---

## 🚀 Quick Start

### Installation

Choose your preferred installation method:

#### **Option 1: Local Development**
```bash
# Clone or copy the expansion pack
git clone <your-repo-url> bmad-data-practitioner
cd bmad-method
npm install ./path-to/bmad-data-practitioner
```

#### **Option 2: NPM Registry**
```bash
npm install bmad-data-practitioner
```

#### **Option 3: Direct Git Install**
```bash
npm install git+https://github.com/your-org/bmad-data-practitioner
```

### Verification
```bash
# Start BMad Orchestrator
/BMad:agents:bmad-orchestrator

# Check available agents
*agent
```

### First Steps
1. **Start with Analysis**: `*agent data-analyst` for exploratory work
2. **Design Architecture**: `*agent data-architect` for system planning  
3. **Build Pipelines**: `*agent data-engineer` for implementation
4. **Ensure Quality**: `*agent data-qa-engineer` for validation

---

## 🎭 Specialized Agents

Our 6 AI specialists cover the complete data lifecycle:

### 📈 **Emma - Data Analyst**
**When to use:** Exploratory analysis, statistical testing, insight generation
```bash
*agent data-analyst
```
**Key capabilities:**
- Automated exploratory data analysis (EDA)
- Statistical hypothesis testing and validation
- Business insight generation and recommendations
- Interactive data visualization and storytelling
- Statistical modeling (predictive & descriptive)

### 🏗️ **Alex - Data Architect**  
**When to use:** System design, data modeling, infrastructure planning
```bash
*agent data-architect
```
**Key capabilities:**
- Data warehouse and lake architecture design
- Data modeling and schema optimization
- Technology stack selection and integration
- Scalability and performance planning
- Governance and compliance frameworks

### ⚙️ **Jordan - Data Engineer**
**When to use:** ETL/ELT pipelines, data integration, processing workflows
```bash
*agent data-engineer
```
**Key capabilities:**
- Data pipeline development (Dagster orchestration)
- Source system integration (PyAirbyte connectors)
- Data transformation workflows (dbt-core)
- Performance optimization and monitoring
- Data quality implementation

### 🎯 **Morgan - Data Product Manager**
**When to use:** Requirements gathering, stakeholder alignment, strategy
```bash
*agent data-product-manager
```  
**Key capabilities:**
- Business requirements elicitation and documentation
- Data product strategy and roadmap development
- Stakeholder communication and alignment
- Success metrics definition and tracking
- Cross-functional team coordination

### ✅ **Casey - Data QA Engineer**
**When to use:** Data quality, testing, validation, monitoring
```bash
*agent data-qa-engineer
```
**Key capabilities:**
- Automated data quality testing frameworks
- Data validation and profiling workflows  
- Monitoring and alerting system design
- Data lineage tracking and documentation
- Quality gate implementation

### 🤖 **Sam - ML Engineer**
**When to use:** Machine learning, model development, ML operations
```bash
*agent ml-engineer
```
**Key capabilities:**  
- ML model development and training pipelines
- Feature engineering and selection
- Model deployment and monitoring
- A/B testing and experiment design
- MLOps workflow implementation

---

## 🔄 Suggested Workflow

### **Complete Data Analysis Lifecycle**

```mermaid
graph TD
    A[📋 Start: Business Question] --> B{Data Available?}
    
    B -->|No| C[🎯 Morgan: Requirements<br/>& Source Discovery]
    B -->|Yes| D[📈 Emma: Exploratory<br/>Data Analysis]
    
    C --> E[🏗️ Alex: Architecture<br/>Design]
    E --> F[⚙️ Jordan: Pipeline<br/>Development]
    F --> G[✅ Casey: Quality<br/>Validation]
    G --> D
    
    D --> H[📈 Emma: Statistical<br/>Analysis & Hypotheses]
    H --> I{ML Required?}
    
    I -->|Yes| J[🤖 Sam: Model<br/>Development]
    I -->|No| K[📈 Emma: Insights &<br/>Recommendations]
    
    J --> L[🤖 Sam: Model<br/>Validation & Deploy]
    L --> M[✅ Casey: Model<br/>Quality Monitoring]
    M --> K
    
    K --> N[📈 Emma: Visualization<br/>& Reporting]
    N --> O[🎯 Morgan: Stakeholder<br/>Communication]
    O --> P[✅ End: Business Value]
    
    style A fill:#e1f5fe
    style P fill:#e8f5e8
    style C fill:#fff3e0
    style E fill:#f3e5f5
    style F fill:#e0f2f1
    style G fill:#fff8e1
    style D fill:#e1f5fe
    style H fill:#e1f5fe
    style J fill:#fce4ec
    style L fill:#fce4ec
    style M fill:#fff8e1
    style K fill:#e1f5fe
    style N fill:#e1f5fe
    style O fill:#fff3e0
```

### **Quick Analysis Workflow** (Existing Data)

```mermaid
sequenceDiagram
    participant User
    participant Emma as 📈 Emma<br/>(Analyst)
    participant Casey as ✅ Casey<br/>(QA Engineer)
    
    User->>Emma: *exploratory-analysis
    Emma->>Emma: Automated EDA
    Emma->>Casey: Data quality check
    Casey->>Emma: Quality report
    Emma->>Emma: Statistical testing
    Emma->>User: Insights & recommendations
    User->>Emma: *create-visualizations
    Emma->>User: Interactive dashboards
```

---

## 🛠 Tech Stack Integration

This expansion pack seamlessly integrates with modern data stack tools:

| Tool | Purpose | Agent Integration |
|------|---------|-------------------|
| **PyAirbyte** | Data ingestion | Jordan (Data Engineer) |
| **DuckDB** | Fast analytics | Emma (Data Analyst) |  
| **dbt-core** | Data transformation | Jordan (Data Engineer) |
| **Dagster** | Workflow orchestration | Jordan (Data Engineer) |
| **Evidence.dev** | BI & visualization | Emma (Data Analyst) |

---

## 📁 Project Structure

```
bmad-data-practitioner/
├── agents/                 # 6 specialized AI agents
│   ├── data-analyst.md
│   ├── data-architect.md  
│   ├── data-engineer.md
│   ├── data-product-manager.md
│   ├── data-qa-engineer.md
│   └── ml-engineer.md
├── tasks/                  # Executable workflow tasks
├── templates/              # Document and config templates
├── checklists/            # Quality assurance checklists
├── data/                  # Knowledge base and guides
├── tools/                 # Utility scripts and configs
├── evidence-project/      # Evidence.dev BI setup
├── dagster-project/       # Dagster orchestration
└── config.yaml           # Pack configuration
```

---

## 🎯 Use Cases

### **Business Intelligence**
1. `*agent data-analyst` → Explore sales data patterns
2. Create executive dashboards with Evidence.dev
3. Generate automated insights and recommendations

### **Data Pipeline Development**  
1. `*agent data-architect` → Design system architecture
2. `*agent data-engineer` → Implement with Dagster + dbt
3. `*agent data-qa-engineer` → Validate data quality

### **Machine Learning Projects**
1. `*agent data-product-manager` → Define ML requirements  
2. `*agent data-analyst` → Feature exploration and selection
3. `*agent ml-engineer` → Model development and deployment

### **Data Quality Initiative**
1. `*agent data-qa-engineer` → Assessment and strategy
2. `*agent data-engineer` → Implementation and monitoring
3. `*agent data-analyst` → Impact measurement and reporting

---

## 🚦 Getting Started Guide

### **For Data Analysts**
```bash
*agent data-analyst
*exploratory-analysis    # Start with EDA
*hypothesis-testing      # Statistical validation  
*create-visualizations   # Build dashboards
```

### **For Data Engineers**
```bash
*agent data-engineer
*pipeline-design         # Architecture planning
*source-integration      # PyAirbyte setup
*transformation-logic    # dbt implementation
```

### **For Product Managers**
```bash
*agent data-product-manager  
*requirements-gathering  # Stakeholder interviews
*success-metrics        # KPI definition
*roadmap-planning       # Strategic planning
```

---

## 🤝 Agent Collaboration

Agents work together seamlessly:

- **Morgan** (Product Manager) → defines requirements → **Alex** (Architect)
- **Alex** (Architect) → creates design → **Jordan** (Engineer)  
- **Jordan** (Engineer) → builds pipeline → **Casey** (QA Engineer)
- **Casey** (QA Engineer) → validates data → **Emma** (Analyst)
- **Emma** (Analyst) → finds insights → **Sam** (ML Engineer)
- **Sam** (ML Engineer) → deploys models → **Morgan** (Product Manager)

---

## 📚 Documentation

- **Agent Commands**: Each agent has built-in `*help` command
- **Task Templates**: Comprehensive workflow guides in `/tasks`
- **Best Practices**: Data methodology guides in `/data`  
- **Configuration**: Tool setup guides in `/tools`

---

## 🔧 Advanced Configuration

### Custom Templates
Add your own templates to the `/templates` directory following BMad format.

### Extended Workflows  
Create custom workflows in `/workflows` for domain-specific processes.

### Integration Setup
- **Evidence.dev**: Pre-configured project in `/evidence-project`
- **Dagster**: Orchestration setup in `/dagster-project`  
- **DuckDB**: Optimized for analytical queries

---

## 🤖 BMad Orchestrator Integration

All agents integrate with BMad Orchestrator:

```bash
/BMad:agents:bmad-orchestrator

*help                    # Show all commands
*agent                   # List available agents
*workflow-guidance       # Get workflow recommendations  
*plan                    # Create detailed execution plan
*status                  # Check current progress
```

---

## 💡 Tips & Best Practices

1. **Start Small**: Begin with `*agent data-analyst` for quick wins
2. **Plan First**: Use `*agent data-product-manager` for complex projects  
3. **Quality Gates**: Always involve `*agent data-qa-engineer`
4. **Collaborate**: Agents work better together than in isolation
5. **Document**: Use built-in templates for consistent documentation

---

## 🆘 Support & Troubleshooting

### Common Issues
- **Agent not found**: Verify installation with `*agent` command
- **Task failures**: Check dependencies in agent help
- **Template errors**: Validate YAML formatting

### Getting Help
1. Use `*help` command in any agent
2. Check agent-specific documentation
3. Review troubleshooting guides in `/docs`

---

## 📄 License

This expansion pack follows BMad Method licensing terms.

---

## 🚀 Ready to Transform Your Data Workflows?

```bash
# Install the pack
npm install bmad-data-practitioner

# Start your first analysis  
/BMad:agents:bmad-orchestrator
*agent data-analyst
*exploratory-analysis
```

**Welcome to the future of AI-assisted data analysis! 🎉**