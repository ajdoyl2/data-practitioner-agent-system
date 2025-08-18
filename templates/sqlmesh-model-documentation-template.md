# SQLmesh Model Documentation Template

## Model Overview

### Model Name
`[model_name]`

### Model Type
- [ ] SQL Model
- [ ] Python Model
- [ ] Hybrid (SQL + Python)
- [ ] Seed Model
- [ ] External Model

### Model Purpose
```
[Provide a clear, concise description of what this model does and why it exists.
Include the business problem it solves and its role in the data pipeline.]
```

### Model Owner
- **Primary Owner**: [Name/Team]
- **Secondary Owner**: [Name/Team]
- **Last Updated**: [Date]
- **Review Frequency**: [Weekly/Monthly/Quarterly]

## Business Context

### Business Domain
```
[Identify the business domain this model serves: Sales, Marketing, Finance, Operations, etc.]
```

### Key Business Questions
```
[List the primary business questions this model helps answer]
1. 
2. 
3. 
```

### Stakeholders
| Stakeholder | Role | Usage Pattern |
|------------|------|---------------|
| [Name/Team] | [Role] | [How they use this model] |
| [Name/Team] | [Role] | [How they use this model] |

### Business Impact
- **Revenue Impact**: [Direct/Indirect/None]
- **Operational Impact**: [High/Medium/Low]
- **Compliance Impact**: [Required/Optional/None]
- **Decision Criticality**: [Critical/Important/Supportive]

## Technical Specification

### Model Configuration
```python
MODEL (
    name [schema].[model_name],
    kind [FULL/INCREMENTAL/SCD_TYPE_2],
    owner '[owner_email]',
    cron '@daily',  # or specific schedule
    grain '[grain_columns]',  # e.g., 'customer_id', 'date'
    audits [
        [audit_name],
        [audit_name]
    ],
    description '''
    [Comprehensive model description for catalog]
    '''
);
```

### Input Dependencies
| Source Model/Table | Type | Update Frequency | Critical Fields |
|-------------------|------|------------------|-----------------|
| `[schema.model]` | [Model/External] | [Daily/Hourly] | [field1, field2] |
| `[schema.model]` | [Model/External] | [Daily/Hourly] | [field1, field2] |

### Output Schema
| Column Name | Data Type | Description | Business Logic | Data Quality Rules |
|------------|-----------|-------------|----------------|-------------------|
| `[column]` | [type] | [description] | [logic/calculation] | [nullable/unique/range] |
| `[column]` | [type] | [description] | [logic/calculation] | [nullable/unique/range] |

### Primary Keys and Indexes
```sql
-- Primary Key
PRIMARY KEY ([column1], [column2])

-- Indexes for Performance
INDEX idx_[name] ([column1], [column2])
INDEX idx_[name] ([column3])
```

## Data Quality and Validation

### Data Quality Checks
```yaml
quality_checks:
  completeness:
    - column: [column_name]
      threshold: 95%
      action: alert
      
  uniqueness:
    - columns: [col1, col2]
      expected: unique
      action: fail
      
  validity:
    - column: [date_column]
      condition: "date >= current_date - 90"
      action: warn
      
  consistency:
    - check: "sum(revenue) = sum(line_items)"
      tolerance: 0.01
      action: alert
```

### Audit Definitions
```sql
-- Audit: not_null_critical_fields
AUDIT (
    name not_null_critical_fields,
    description "Ensure critical fields are never null"
);
SELECT * FROM @this_model
WHERE customer_id IS NULL 
   OR transaction_date IS NULL
   OR amount IS NULL;

-- Audit: referential_integrity
AUDIT (
    name referential_integrity,
    description "Validate foreign key relationships"
);
SELECT t.*
FROM @this_model t
LEFT JOIN upstream.customers c ON t.customer_id = c.id
WHERE c.id IS NULL;
```

### Expected Data Volumes
```yaml
data_volumes:
  daily_records: [expected_range]
  total_records: [expected_range]
  growth_rate: [percentage]
  retention_period: [days/months]
  peak_processing: [time_window]
```

## Transformation Logic

### Core Business Logic
```sql
-- Main transformation logic with inline documentation
WITH base_data AS (
    -- [Explain this CTE's purpose]
    SELECT 
        column1,
        column2,
        -- [Explain complex calculation]
        CASE 
            WHEN condition1 THEN value1
            WHEN condition2 THEN value2
            ELSE default_value
        END AS derived_column
    FROM upstream_table
    WHERE [filter_conditions]
),

aggregated_metrics AS (
    -- [Explain aggregation logic]
    SELECT 
        dimension1,
        dimension2,
        SUM(metric1) AS total_metric1,
        AVG(metric2) AS avg_metric2
    FROM base_data
    GROUP BY dimension1, dimension2
)

-- Final output with business rules applied
SELECT 
    *,
    -- [Explain derived metrics]
    total_metric1 / NULLIF(avg_metric2, 0) AS efficiency_ratio
FROM aggregated_metrics
WHERE [final_filters];
```

### Complex Calculations
```yaml
calculations:
  - name: [calculation_name]
    formula: "[SQL expression or Python function]"
    description: "[Business meaning]"
    example: "[Example with sample data]"
    edge_cases: "[How nulls/zeros/negatives are handled]"
```

### Data Transformations
| Transformation | Input | Output | Business Rule |
|---------------|-------|--------|---------------|
| [Transform name] | [Input format] | [Output format] | [Rule description] |
| Date standardization | Various formats | YYYY-MM-DD | Convert all dates to ISO format |
| Currency conversion | Multiple currencies | USD | Use daily exchange rates |

## Performance Optimization

### Virtual Environment Configuration
```yaml
virtual_environment:
  warehouse_size: [X-Small/Small/Medium/Large/X-Large]
  min_cluster_count: 1
  max_cluster_count: 4
  scaling_policy: "Standard"
  auto_suspend_minutes: 10
  auto_resume: true
  
estimated_cost:
  daily_runs: $[amount]
  monthly_estimate: $[amount]
  cost_optimization_notes: "[Notes on cost-saving strategies]"
```

### Query Optimization Strategies
```yaml
optimizations:
  - type: "Incremental Processing"
    description: "Process only new/changed records"
    impact: "90% reduction in processing time"
    
  - type: "Partitioning"
    columns: ["date_column"]
    description: "Partition by date for faster queries"
    
  - type: "Clustering"
    columns: ["frequently_filtered_column"]
    description: "Improve filter performance"
    
  - type: "Materialization"
    strategy: "table"
    description: "Materialize for downstream performance"
```

### Performance Benchmarks
| Metric | Target | Current | Notes |
|--------|--------|---------|-------|
| Run Time | < 5 min | [actual] | [optimization notes] |
| Data Freshness | < 2 hours | [actual] | [latency factors] |
| Resource Usage | < 80% | [actual] | [scaling triggers] |

## Downstream Impact

### Direct Consumers
| Consumer Model/Report | Type | Dependency Type | Impact of Changes |
|----------------------|------|-----------------|-------------------|
| `[model_name]` | Model | Hard dependency | Breaking changes require coordination |
| `[dashboard_name]` | Dashboard | Soft dependency | Schema changes need communication |

### API/Service Dependencies
```yaml
external_dependencies:
  - service: "[Service name]"
    type: "API/Database/File"
    contract: "[Schema/API version]"
    sla: "[Availability/Latency requirements]"
    fallback: "[Fallback strategy if unavailable]"
```

### Change Impact Assessment
```yaml
change_categories:
  breaking_changes:
    - "Column removal or rename"
    - "Data type changes"
    - "Primary key modifications"
    - "Grain changes"
    
  non_breaking_changes:
    - "New column additions"
    - "Performance optimizations"
    - "Documentation updates"
    - "Audit additions"
    
  notification_required:
    - "Schema changes: 2 weeks notice"
    - "Deprecations: 30 days notice"
    - "Major refactoring: 1 week notice"
```

## Monitoring and Alerting

### Key Metrics to Monitor
```yaml
monitoring:
  data_quality_metrics:
    - metric: "null_rate"
      threshold: "< 5%"
      alert_channel: "#data-quality-alerts"
      
    - metric: "duplicate_rate"
      threshold: "< 0.1%"
      alert_channel: "#data-quality-alerts"
      
  performance_metrics:
    - metric: "execution_time"
      threshold: "< 10 minutes"
      alert_channel: "#performance-alerts"
      
    - metric: "memory_usage"
      threshold: "< 80%"
      alert_channel: "#performance-alerts"
      
  business_metrics:
    - metric: "daily_revenue_total"
      validation: "within 5% of source system"
      alert_channel: "#business-alerts"
```

### Alert Configuration
```yaml
alerts:
  - name: "Model Failure"
    condition: "model_run_status = 'failed'"
    severity: "critical"
    notification: ["email", "slack", "pagerduty"]
    
  - name: "Data Freshness"
    condition: "data_age > 3 hours"
    severity: "warning"
    notification: ["slack"]
    
  - name: "Volume Anomaly"
    condition: "row_count < 0.5 * historical_average OR row_count > 2 * historical_average"
    severity: "warning"
    notification: ["email", "slack"]
```

## Error Handling and Recovery

### Common Failure Scenarios
| Failure Type | Root Cause | Resolution Steps | Recovery Time |
|-------------|------------|------------------|---------------|
| Source data missing | Upstream delay | Wait and retry, or use previous run | 30 min |
| Schema mismatch | Upstream change | Update model schema, reprocess | 2 hours |
| Resource exhaustion | Large data spike | Scale warehouse, optimize query | 1 hour |

### Recovery Procedures
```yaml
recovery_procedures:
  automatic_retry:
    enabled: true
    max_attempts: 3
    backoff_strategy: "exponential"
    initial_delay: "5 minutes"
    
  manual_intervention:
    - scenario: "Persistent failures after retries"
      steps:
        1. "Check upstream data availability"
        2. "Validate schema compatibility"
        3. "Review recent model changes"
        4. "Escalate to data engineering team if needed"
      
  rollback_strategy:
    - scenario: "Critical data quality issues"
      steps:
        1. "Pause downstream processing"
        2. "Restore previous model version"
        3. "Reprocess affected time period"
        4. "Validate data quality before resuming"
```

## Maintenance and Evolution

### Maintenance Schedule
```yaml
maintenance:
  regular_tasks:
    - task: "Statistics update"
      frequency: "weekly"
      impact: "none"
      
    - task: "Partition maintenance"
      frequency: "monthly"
      impact: "minimal"
      
    - task: "Performance review"
      frequency: "quarterly"
      impact: "none"
      
  optimization_review:
    - review: "Query performance"
      frequency: "monthly"
      owner: "Data Engineering"
      
    - review: "Cost optimization"
      frequency: "quarterly"
      owner: "Data Architecture"
```

### Evolution Roadmap
```yaml
planned_improvements:
  q1_2024:
    - "Add customer segmentation logic"
    - "Implement incremental processing"
    - "Add data quality dashboards"
    
  q2_2024:
    - "Migrate to real-time processing"
    - "Add ML-based anomaly detection"
    - "Implement advanced partitioning"
    
  technical_debt:
    - "Refactor complex joins"
    - "Optimize window functions"
    - "Consolidate duplicate logic"
```

## Code Examples and Patterns

### Sample Queries
```sql
-- Example 1: Basic query pattern
SELECT 
    customer_id,
    transaction_date,
    SUM(amount) as daily_total
FROM [model_name]
WHERE transaction_date >= CURRENT_DATE - 30
GROUP BY customer_id, transaction_date;

-- Example 2: Join with dimensional data
SELECT 
    m.*,
    d.dimension_attribute
FROM [model_name] m
JOIN dimension_table d ON m.key = d.key
WHERE m.filter_column = 'value';
```

### Integration Examples
```python
# Python integration example
import sqlmesh

# Query the model
df = sqlmesh.query("""
    SELECT * FROM [schema].[model_name]
    WHERE date_column >= '2024-01-01'
""")

# Process results
processed_df = df.groupby('category').agg({
    'metric1': 'sum',
    'metric2': 'mean'
})
```

## Testing Guidelines

### Unit Tests
```yaml
unit_tests:
  - test_name: "test_null_handling"
    description: "Verify null values are handled correctly"
    input_scenario: "Records with null customer_id"
    expected_output: "Records excluded from output"
    
  - test_name: "test_business_logic"
    description: "Validate business rule calculations"
    input_scenario: "Sample transaction data"
    expected_output: "Correctly calculated metrics"
```

### Integration Tests
```yaml
integration_tests:
  - test_name: "test_upstream_compatibility"
    description: "Verify model handles upstream changes"
    test_data: "Modified schema with new columns"
    expected_behavior: "Model continues to function"
    
  - test_name: "test_downstream_contract"
    description: "Ensure output meets downstream requirements"
    validation: "Schema and data quality checks"
    expected_result: "All contracts satisfied"
```

## Version History

| Version | Date | Author | Changes | Impact |
|---------|------|--------|---------|--------|
| 1.0.0 | [Date] | [Author] | Initial implementation | New model |
| 1.1.0 | [Date] | [Author] | Added new metrics | Non-breaking |
| 2.0.0 | [Date] | [Author] | Schema restructure | Breaking change |

## References and Resources

### Documentation Links
- [SQLmesh Documentation](https://sqlmesh.com/docs)
- [Internal Data Dictionary](link)
- [Business Glossary](link)
- [Data Governance Policies](link)

### Related Models
- Upstream: `[model_name]` - [description]
- Peer: `[model_name]` - [description]
- Downstream: `[model_name]` - [description]

### Contact Information
- **Slack Channel**: #[channel-name]
- **Email Group**: [email@company.com]
- **Wiki Page**: [link to confluence/wiki]
- **On-Call Rotation**: [pagerduty/opsgenie link]

---

## Template Usage Instructions

1. **Copy this template** for each new SQLmesh model
2. **Fill in all sections** that apply to your model
3. **Remove sections** that don't apply (mark as N/A if unsure)
4. **Keep documentation updated** as the model evolves
5. **Review quarterly** for accuracy and completeness

### Documentation Standards
- Use clear, concise language
- Include specific examples where possible
- Document assumptions and limitations
- Keep technical and business context balanced
- Update version history for all changes

### Review Checklist
- [ ] All required sections completed
- [ ] Business context clearly explained
- [ ] Technical details accurate and complete
- [ ] Dependencies documented
- [ ] Testing guidelines provided
- [ ] Monitoring configured
- [ ] Contact information current