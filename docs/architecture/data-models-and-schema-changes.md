# Data Models and Schema Changes

## New Data Models

### DataSource
**Purpose:** Represents ingested data sources from PyAirbyte connectors, maintaining metadata and processing state  
**Integration:** Stores metadata in YAML files following existing patterns, actual data processed through DuckDB

**Key Attributes:**
- source_id: String - Unique identifier following BMad naming conventions
- source_type: Enum(file_upload, api_connector, database_connection) - PyAirbyte connector classification
- connection_config: Object - Encrypted configuration following existing technical-preferences patterns
- schema_metadata: Object - Discovered schema information for EDA workflows
- ingestion_status: Enum(pending, active, completed, failed) - Processing state tracking
- cache_location: String - DuckDB table reference for processed data
- created_at: DateTime - Creation timestamp
- updated_at: DateTime - Last processing timestamp

**Relationships:**
- **With Existing:** References technical-preferences.md patterns for configuration storage
- **With New:** Parent to AnalysisProject, referenced by DataTransformation

### AnalysisProject
**Purpose:** Represents complete data analysis workflows, linking PRD requirements to data processing pipelines  
**Integration:** Extends existing project patterns in BMad-Method, stored as structured YAML documents

**Key Attributes:**
- project_id: String - Unique identifier following BMad project naming
- project_name: String - Human-readable name for Evidence.dev publications
- prd_reference: String - Link to associated brownfield-prd.md document
- hypothesis_list: Array[Object] - LLM-generated hypotheses with validation status
- analysis_state: Enum(discovery, modeling, analysis, publication) - Current workflow phase
- publication_config: Object - Evidence.dev site generation configuration
- milestone_progress: Object - Tracking against 4-milestone delivery structure

**Relationships:**
- **With Existing:** References docs/prd.md and architecture.md documents
- **With New:** Parent to DataTransformation and InsightDocument entities

### DataTransformation
**Purpose:** Represents dbt-core transformation workflows with lineage and quality metrics  
**Integration:** Stored as YAML metadata alongside dbt model definitions, following BMad template patterns

**Key Attributes:**
- transformation_id: String - Unique identifier for dbt model tracking
- model_name: String - dbt model name following naming conventions
- source_references: Array[String] - References to DataSource entities
- transformation_logic: String - SQL transformation logic (stored in dbt models)
- test_results: Object - dbt test execution results and quality metrics
- lineage_metadata: Object - Upstream and downstream dependencies
- execution_metadata: Object - Performance and resource usage tracking

**Relationships:**
- **With Existing:** Follows existing task workflow patterns for execution tracking
- **With New:** Child of AnalysisProject, feeds into InsightDocument generation

### InsightDocument
**Purpose:** Publication-ready documents generated through Evidence.dev with interactive visualizations  
**Integration:** Generated as markdown files with embedded SQL, following BMad documentation patterns

**Key Attributes:**
- document_id: String - Unique identifier for publication tracking
- document_title: String - Publication title for Evidence.dev site
- narrative_content: String - LLM-generated narrative following Pew Research patterns
- visualization_config: Object - Evidence.dev component and chart configurations
- publication_status: Enum(draft, review, published, archived) - Publication workflow state
- quality_metrics: Object - Automated quality assessment scores
- export_formats: Array[String] - Available export formats (PDF, HTML, static)

**Relationships:**
- **With Existing:** Extends existing documentation patterns in docs/ folder
- **With New:** Child of AnalysisProject, consumes DataTransformation outputs

## Schema Integration Strategy

**Database Changes Required:**
- **New Tables:** DuckDB tables for data processing (managed dynamically, not persistent schema)
- **Modified Tables:** None - existing YAML/Markdown files unchanged  
- **New Indexes:** DuckDB indexes created dynamically based on query patterns
- **Migration Strategy:** Additive only - new YAML files created, existing files preserved

**Backward Compatibility:**
- All existing BMad-Method files and structures remain completely unchanged
- New data models stored in `/bmad-data-practitioner/data/` following expansion pack patterns
- DuckDB operates in isolation - no impact on existing file-based storage
- Configuration extensions added to core-config.yaml as new sections only
- Existing agent workflows and templates function without modification
