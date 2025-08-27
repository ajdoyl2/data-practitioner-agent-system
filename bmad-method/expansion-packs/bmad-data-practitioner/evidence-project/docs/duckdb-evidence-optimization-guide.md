# DuckDB + Evidence.dev Optimization Guide

## For Data Platform Architects, Pipeline Engineers, and Analytics Engineers

This guide provides optimization knowledge for agents building data models and transformations that will be consumed by Evidence.dev publications through Universal SQL.

## Core Optimization Principles

### 1. Query Performance Optimization

**Indexing Strategy:**
- Create compound indexes for Evidence.dev filtering patterns: `(category, metric_name, date)`
- Index frequently joined columns first
- Use covering indexes for dashboard queries

```sql
-- Example: Optimize for Evidence.dev date-based filtering
CREATE INDEX idx_metrics_dashboard ON metrics(date_recorded, category, metric_name);

-- Example: Optimize for correlation analysis
CREATE INDEX idx_correlation_vars ON correlations(variable_1, variable_2, correlation_strength);
```

**View Optimization for Evidence.dev Pages:**
- Create materialized views for complex aggregations used in pages
- Pre-calculate percentage changes and moving averages
- Use CASE statements for status categorization

```sql
-- Example: Pre-calculated dashboard view
CREATE VIEW dashboard_kpis AS
SELECT 
    metric_name,
    metric_value,
    CASE 
        WHEN metric_name LIKE '%Score%' AND metric_value > 95 THEN 'excellent'
        WHEN metric_name LIKE '%Rate%' AND metric_value < 0.5 THEN 'excellent'
        ELSE 'good'
    END as performance_status
FROM metrics 
WHERE category = 'performance';
```

### 2. Data Model Design for Universal SQL

**Table Structure Optimization:**
- Use consistent naming: `category`, `metric_name`, `date_recorded`  
- Include metadata columns: `confidence_score`, `status`, `description`
- Pre-format display values: `formatted_value`, `display_name`

**JSON Support for Complex Data:**
- Use DuckDB's JSON functions for nested analytical results
- Store configuration and metadata as JSON objects
- Enable flexible querying without schema changes

```sql
-- Example: Store analysis metadata as JSON
CREATE TABLE analysis_results (
    id VARCHAR PRIMARY KEY,
    analysis_type VARCHAR,
    results JSON,
    metadata JSON,
    created_at TIMESTAMP
);

-- Query JSON data in Evidence.dev
SELECT 
    analysis_type,
    results->>'$.accuracy_score' as accuracy,
    metadata->>'$.model_version' as version
FROM analysis_results;
```

### 3. Integration with Transformation Engines

**dbt/SQLmesh Output Structure:**
- Create `marts.publication_metrics` models optimized for Evidence.dev
- Include data lineage metadata for traceability
- Use consistent grain and dimensionality

**Dagster Asset Integration:**
- Design assets with Evidence.dev consumption in mind
- Include data quality metrics as separate assets
- Use asset metadata for publication configuration

```python
# Example: Dagster asset optimized for Evidence.dev
@asset(
    group_name="publication_data",
    metadata={
        "evidence_table": "key_metrics",
        "refresh_frequency": "hourly",
        "query_optimization": {
            "indexes": ["category", "date_recorded"],
            "partitioning": "date_recorded"
        }
    }
)
def publication_metrics():
    return query_result
```

### 4. Memory and Performance Tuning

**DuckDB Configuration for Analytics:**
```yaml
# Evidence.dev datasource configuration
datasources:
  analytics:
    type: "duckdb" 
    filename: ".duckdb/analytics.db"
    options:
      memory_limit: "2GB"           # Adjust based on dataset size
      threads: 4                    # Match CPU cores available
      enable_external_access: true  # For HTTP/S3 access
      max_memory: "1.5GB"          # Reserve memory for browser
      temp_directory: ".duckdb/temp" # Dedicated temp space
      enable_optimizer: true        # Enable query optimization
      preserve_insertion_order: false  # Better performance
```

**Client-Side Processing Considerations:**
- Keep result sets under 10MB for smooth browser performance
- Use LIMIT clauses effectively in Evidence.dev queries
- Pre-aggregate data for time series visualizations
- Cache frequently accessed views

### 5. Real-time Data Integration

**Dagster Orchestration Integration:**
- Evidence.dev refreshes automatically when Dagster assets update
- No need for custom refresh scheduling in DuckDB
- Use Dagster asset dependencies to ensure data consistency

**Build-time vs Runtime Queries:**
- Evidence.dev executes SQL at build time for static content
- Use materialized views for expensive computations
- Balance between build time and interactivity

### 6. Query Patterns for Evidence.dev Components

**DataTable Component Optimization:**
```sql
-- Optimize for Evidence.dev DataTable sorting and filtering
SELECT 
    category,
    metric_name,
    ROUND(metric_value, 2) as value,
    unit,
    description,
    -- Pre-calculate status for conditional formatting
    CASE 
        WHEN metric_value > threshold_high THEN 'success'
        WHEN metric_value > threshold_medium THEN 'warning' 
        ELSE 'danger'
    END as status_indicator
FROM metrics
ORDER BY category, metric_name;
```

**Chart Component Optimization:**
```sql
-- Optimize for time series charts
SELECT 
    date_recorded as x,
    metric_value as y,
    metric_name as series,
    -- Include metadata for tooltips
    JSON_OBJECT(
        'category', category,
        'description', description,
        'confidence', confidence_score
    ) as tooltip_data
FROM time_series_data
WHERE date_recorded >= CURRENT_DATE - INTERVAL 30 DAYS
ORDER BY metric_name, date_recorded;
```

### 7. Testing and Validation

**Performance Testing:**
- Test query performance with realistic data volumes
- Validate Evidence.dev build times stay under 5 minutes
- Monitor memory usage during client-side processing

**Data Quality Integration:**
- Include data quality metrics in every data model
- Create validation views for Evidence.dev monitoring
- Use DuckDB constraints for data integrity

## Agent Implementation Checklist

### For Data Platform Architects:
- [ ] Configure DuckDB with optimal memory and threading settings
- [ ] Design schema with Evidence.dev consumption patterns in mind
- [ ] Plan integration points with Dagster orchestration
- [ ] Set up performance monitoring and alerting

### For Pipeline Engineers:
- [ ] Structure Dagster assets for Evidence.dev publication workflows
- [ ] Implement data quality checks in pipeline outputs
- [ ] Optimize asset refresh frequencies for publication needs
- [ ] Include metadata for Evidence.dev configuration

### For Analytics Engineers (dbt/SQLmesh):
- [ ] Create marts layer optimized for publication queries
- [ ] Build reusable macros for Evidence.dev formatting
- [ ] Include data lineage metadata in models
- [ ] Test model performance with Evidence.dev query patterns

### For Publication Engine Developers:
- [ ] Validate Universal SQL connectivity to transformation outputs
- [ ] Test query performance with expected data volumes
- [ ] Implement error handling for data source failures
- [ ] Monitor build performance and optimize as needed

## Common Anti-patterns to Avoid

❌ **Don't:** Create custom refresh scheduling - use Dagster
❌ **Don't:** Build complex aggregations in Evidence.dev queries - pre-calculate in dbt/SQLmesh  
❌ **Don't:** Ignore memory constraints for client-side processing
❌ **Don't:** Use SELECT * in Evidence.dev queries - specify columns
❌ **Don't:** Create deeply nested JSON that's hard to query

✅ **Do:** Design for Evidence.dev query patterns from the start
✅ **Do:** Use consistent naming conventions across all data models
✅ **Do:** Include metadata and quality metrics in every table
✅ **Do:** Test performance with realistic data volumes
✅ **Do:** Leverage Dagster for orchestration and refresh management