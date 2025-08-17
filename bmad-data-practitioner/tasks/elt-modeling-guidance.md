# ELT Modeling Guidance

## Overview

This guided workflow helps data engineers design and implement transformation workflows using dbt-core within the BMad Data Practitioner expansion pack. Follow the layered architecture approach (Source → Staging → Intermediate → Marts) for maintainable and scalable data transformations.

## Prerequisites

- BMad Data Practitioner expansion pack installed
- dbt-core environment configured
- DuckDB analytical engine available
- Feature flag `dbt_transformations` enabled

## Workflow Steps

### Step 1: Understand Your Data Sources

**Elicitation Questions:**
1. What data sources will you be transforming?
2. What is the business purpose of this transformation?
3. Who are the end consumers of the transformed data?
4. What is the expected data volume and update frequency?
5. Are there any data quality concerns or business rules to enforce?

**Action Items:**
- [ ] Document source systems and their schemas
- [ ] Identify key business entities and relationships
- [ ] Define data quality requirements and thresholds
- [ ] Establish naming conventions for your project

### Step 2: Design Your Layered Architecture

**Source Layer (Raw Data)**
- Raw data ingested via PyAirbyte integration
- No transformations applied
- Preserved in original format for lineage

**Staging Layer (Cleaning & Standardization)**
- One-to-one mapping with source tables
- Basic data cleaning and type casting
- Standardized naming conventions
- No business logic applied

**Intermediate Layer (Business Logic)**
- Business transformations and calculations
- Data joins and aggregations
- Reusable business concepts
- Complex logic modularization

**Marts Layer (Analytics Ready)**
- Final datasets for consumption
- Optimized for query performance
- Business-area specific models
- End-user friendly naming

### Step 3: Model Naming Conventions

**Follow BMad Data Practitioner Standards:**

```yaml
Staging Models:
  Pattern: stg_[source_name]__[table_name]
  Examples:
    - stg_salesforce__accounts
    - stg_hubspot__contacts
    - stg_stripe__payments

Intermediate Models:
  Pattern: int_[business_concept]__[description]
  Examples:
    - int_customer__first_orders
    - int_revenue__monthly_summary
    - int_product__category_mapping

Mart Models:
  Pattern: [business_area]__[entity_type]
  Examples:
    - sales__customer_metrics
    - finance__revenue_summary
    - marketing__campaign_performance
```

### Step 4: Create Source Definitions

**Define Your Sources:**

```yaml
# models/staging/_sources.yml
version: 2

sources:
  - name: [source_system_name]
    description: "Description of source system"
    schema: [schema_name]
    tables:
      - name: [table_name]
        description: "Table description"
        columns:
          - name: [column_name]
            description: "Column description"
            tests:
              - unique
              - not_null
```

### Step 5: Build Staging Models

**Staging Model Template:**

```sql
{{
  config(
    materialized='view',
    alias='[descriptive_alias]'
  )
}}

-- Description of what this staging model does
-- Maps to source: [source_system].[table_name]

with source_data as (
    select
        -- Primary keys
        id::integer as [entity]_id,
        
        -- Descriptive fields
        trim(upper(name)) as [entity]_name,
        
        -- Dates and timestamps
        created_at::timestamp as created_timestamp,
        updated_at::timestamp as updated_timestamp,
        
        -- Add processing metadata
        current_timestamp as processed_at
        
    from {{ source('[source_name]', '[table_name]') }}
),

cleaned_data as (
    select
        *,
        -- Add data quality flags
        case 
            when [key_field] is null then 'missing_key'
            when [important_field] is null then 'missing_data'
            else 'valid'
        end as data_quality_flag
        
    from source_data
    where [key_field] is not null  -- Filter out invalid records
)

select * from cleaned_data
```

### Step 6: Implement Business Logic (Intermediate Models)

**Intermediate Model Template:**

```sql
{{
  config(
    materialized='view'
  )
}}

-- Description of business logic being implemented
-- Dependencies: [list dependent models]

with base_data as (
    select * from {{ ref('stg_[source]__[table]') }}
),

business_logic as (
    select
        [entity]_id,
        [entity]_name,
        
        -- Business calculations
        case
            when [condition] then 'category_a'
            when [condition] then 'category_b'
            else 'category_other'
        end as business_category,
        
        -- Aggregations
        sum([metric_field]) as total_[metric],
        count(*) as record_count,
        
        -- Date calculations
        date_diff('day', created_timestamp, current_timestamp) as days_since_creation,
        
        created_timestamp,
        processed_at
        
    from base_data
    where data_quality_flag = 'valid'
    group by [entity]_id, [entity]_name, created_timestamp, processed_at
)

select * from business_logic
```

### Step 7: Build Analytics Marts

**Mart Model Template:**

```sql
{{
  config(
    materialized='table',
    alias='[business_friendly_name]'
  )
}}

-- Final analytics dataset for [business_area]
-- Optimized for [specific_use_case]

with base_metrics as (
    select * from {{ ref('int_[business_concept]__[description]') }}
),

additional_data as (
    select * from {{ ref('int_[other_concept]__[description]') }}
),

final_mart as (
    select
        -- Primary dimensions
        bm.[entity]_id,
        bm.[entity]_name,
        bm.business_category,
        
        -- Key metrics
        bm.total_[metric] as [metric_name],
        bm.record_count,
        bm.days_since_creation,
        
        -- Additional metrics from joins
        ad.[additional_metric],
        
        -- Calculated KPIs
        round(bm.total_[metric] / nullif(bm.record_count, 0), 2) as avg_[metric]_per_record,
        
        -- Time dimensions
        bm.created_timestamp,
        date_trunc('month', bm.created_timestamp) as created_month,
        date_trunc('year', bm.created_timestamp) as created_year,
        
        -- Metadata
        current_timestamp as last_updated,
        '{{ var("dbt_version") }}' as dbt_version
        
    from base_metrics bm
    left join additional_data ad 
        on bm.[entity]_id = ad.[entity]_id
    
    where bm.[important_filter] is not null
)

select * from final_mart
```

### Step 8: Implement Data Quality Tests

**Generic Tests:**
```yaml
# models/[layer]/[layer].yml
version: 2

models:
  - name: [model_name]
    description: "Model description"
    columns:
      - name: [primary_key]
        description: "Primary key column"
        tests:
          - unique
          - not_null
      
      - name: [important_field]
        description: "Critical business field"
        tests:
          - not_null
          - accepted_values:
              values: ['value1', 'value2', 'value3']
      
      - name: [numeric_field]
        description: "Numeric field with constraints"
        tests:
          - not_null
          - dbt_utils.expression_is_true:
              expression: ">= 0"
```

**Custom Tests:**
```sql
-- tests/assert_[business_rule].sql
-- Test that [describe business rule]

select
    [entity]_id,
    [field_violating_rule]
from {{ ref('[model_name]') }}
where [field_violating_rule] [violates_business_rule]
having count(*) > 0
```

### Step 9: Documentation and Lineage

**Model Documentation:**
```yaml
models:
  - name: [model_name]
    description: |
      ### Purpose
      This model [describe purpose]
      
      ### Business Logic
      - [Logic point 1]
      - [Logic point 2]
      
      ### Data Sources
      - {{ doc("source_description") }}
      
      ### Usage Notes
      - [Usage note 1]
      - [Usage note 2]
    
    columns:
      - name: [column_name]
        description: "{{ doc('column_description') }}"
```

**Generate Documentation:**
```bash
# From your dbt project directory
dbt docs generate
dbt docs serve
```

### Step 10: Testing and Validation

**Run Your Models:**
```bash
# Parse and validate
dbt parse

# Compile without executing
dbt compile

# Run specific models
dbt run --models staging
dbt run --models intermediate  
dbt run --models marts

# Run tests
dbt test

# Full pipeline
dbt run && dbt test
```

## Best Practices Checklist

### Data Quality
- [ ] All models have appropriate tests
- [ ] Business rules are validated with custom tests
- [ ] Data quality flags are implemented where needed
- [ ] Null handling is explicit and documented

### Performance
- [ ] Staging models are materialized as views
- [ ] Intermediate models are materialized as views
- [ ] Mart models are materialized as tables
- [ ] Large datasets use incremental materialization where appropriate

### Maintainability
- [ ] Models follow naming conventions
- [ ] Complex logic is broken into intermediate steps
- [ ] Models have clear descriptions and documentation
- [ ] Dependencies are logical and minimized

### Security and Compliance
- [ ] PII data is handled according to privacy requirements
- [ ] Access controls are implemented at the schema level
- [ ] Data lineage is documented for audit purposes
- [ ] Sensitive data transformations are logged

## Common Patterns

### Customer Analytics Pattern
```yaml
Sources: customers, orders, payments
Staging: stg_crm__customers, stg_orders__orders, stg_payments__payments
Intermediate: int_customers__order_history, int_customers__payment_methods
Marts: customer_analytics__customer_metrics, customer_analytics__retention_cohorts
```

### Sales Analytics Pattern
```yaml
Sources: sales, products, regions, sales_reps
Staging: stg_sales__transactions, stg_products__catalog, stg_regions__territories
Intermediate: int_sales__product_performance, int_sales__regional_summary
Marts: sales_analytics__performance_dashboard, sales_analytics__rep_metrics
```

### Financial Analytics Pattern
```yaml
Sources: transactions, accounts, budgets, cost_centers
Staging: stg_finance__transactions, stg_finance__chart_of_accounts
Intermediate: int_finance__account_balances, int_finance__budget_variance
Marts: finance_analytics__financial_statements, finance_analytics__budget_reports
```

## Troubleshooting

### Common Issues

**Model Won't Parse:**
- Check SQL syntax
- Verify source/ref references exist
- Ensure proper Jinja templating

**Model Won't Run:**
- Check data types and casting
- Verify source data exists
- Review error logs for specific issues

**Tests Failing:**
- Review test logic and expectations
- Check for data quality issues in sources
- Verify test configurations

**Performance Issues:**
- Consider materialization strategy
- Review query plans
- Optimize joins and aggregations

## Integration Points

### With PyAirbyte (Story 1.2)
- Source data comes from PyAirbyte cached extracts
- Use standardized source schema definitions
- Implement incremental loading where appropriate

### With DuckDB (Story 1.3)
- All transformations execute in DuckDB
- Leverage DuckDB-specific optimizations
- Use DuckDB's analytical functions

### With Security Framework (Story 1.1.5)
- All transformation operations are logged
- API key authentication required for sensitive operations
- Feature flags control transformation availability

## Success Criteria

- [ ] Transformation models follow layered architecture
- [ ] All models have comprehensive tests
- [ ] Documentation is complete and accurate
- [ ] Performance meets requirements (< 5 minute test suite)
- [ ] Integration with existing BMad components verified
- [ ] Security logging and authentication integrated