# Data Analyst Training Guide

## Overview
Comprehensive training guide for data analysts using the BMad Data Practitioner Agent System to perform data analysis, create reports, and generate insights.

## Role-Specific Capabilities

### Data Analyst Agent Profile
The Data Analyst agent is optimized for:
- **Exploratory Data Analysis (EDA)**: Automated pattern discovery and statistical analysis
- **Hypothesis Testing**: Statistical validation of business questions
- **Report Generation**: Creating comprehensive analytical reports
- **Data Visualization**: Building interactive charts and dashboards
- **Business Intelligence**: Translating data insights into business recommendations

### Key Tools and Systems
- **DuckDB Analytics Engine**: High-performance SQL analytics
- **Python Analysis Tools**: Statistical analysis and EDA automation
- **Evidence.dev Platform**: Interactive report publishing
- **Dagster Orchestration**: Automated analysis workflows
- **Quality Assurance Framework**: Data validation and quality checks

## Getting Started

### Initial Setup

#### 1. Activate Data Analyst Agent
```bash
# Navigate to project directory
cd bmad-method

# Activate data analyst agent
npx bmad activate-agent data-analyst

# Verify agent activation
npx bmad agent-status
```

#### 2. Environment Configuration
```bash
# Set up analysis environment
export BMAD_AGENT_ROLE=data-analyst
export ANALYSIS_WORKSPACE=/path/to/workspace
export DUCKDB_PATH=./data/analytics.duckdb

# Verify configuration
npm run config:verify --agent data-analyst
```

#### 3. Access Analysis Tools
```bash
# Start analysis environment
npm run analysis:start

# Open Jupyter-style interface (if available)
npm run analysis:notebook

# Access Evidence.dev dashboard
npm run dashboard:open
```

## Core Workflows

### 1. Exploratory Data Analysis (EDA)

#### Automated EDA Workflow
```python
# Python analysis script example
from tools.data_services.eda_engine import EDAEngine

# Initialize EDA engine
eda = EDAEngine(database_path='./data/analytics.duckdb')

# Load dataset for analysis
dataset = eda.load_dataset('customer_transactions')

# Generate automated EDA report
eda_report = eda.generate_comprehensive_report(
    dataset_name='customer_transactions',
    target_variable='purchase_amount',
    include_correlations=True,
    include_distributions=True,
    include_outliers=True
)

# Save report
eda_report.save('./reports/customer_analysis_eda.html')
```

#### SQL-Based Analysis
```sql
-- Example: Customer purchase behavior analysis
WITH customer_metrics AS (
  SELECT 
    customer_id,
    COUNT(*) as transaction_count,
    AVG(purchase_amount) as avg_purchase,
    SUM(purchase_amount) as total_spent,
    DATE_DIFF('day', MIN(purchase_date), MAX(purchase_date)) as customer_lifetime_days,
    STDDEV(purchase_amount) as purchase_variability
  FROM customer_transactions 
  WHERE purchase_date >= '2024-01-01'
  GROUP BY customer_id
),
customer_segments AS (
  SELECT *,
    CASE 
      WHEN total_spent > 10000 AND avg_purchase > 500 THEN 'High Value'
      WHEN total_spent > 5000 OR avg_purchase > 200 THEN 'Medium Value'
      ELSE 'Low Value'
    END as customer_segment
  FROM customer_metrics
)
SELECT 
  customer_segment,
  COUNT(*) as customer_count,
  AVG(total_spent) as avg_total_spent,
  AVG(transaction_count) as avg_transactions,
  AVG(purchase_variability) as avg_variability
FROM customer_segments
GROUP BY customer_segment
ORDER BY avg_total_spent DESC;
```

### 2. Hypothesis Testing and Statistical Analysis

#### Setting Up Statistical Tests
```python
# Statistical testing workflow
from tools.data_services.statistical_tester import StatisticalTester

# Initialize statistical tester
stats_tester = StatisticalTester()

# Test: Do premium customers have higher purchase amounts?
hypothesis_test = stats_tester.compare_groups(
    dataset='customer_transactions',
    group_column='customer_segment',
    measure_column='purchase_amount',
    groups_to_compare=['Premium', 'Standard'],
    test_type='t_test',
    significance_level=0.05
)

# Generate hypothesis report
hypothesis_report = stats_tester.generate_hypothesis_report([
    {
        'hypothesis': 'Premium customers spend more per transaction',
        'test_result': hypothesis_test,
        'business_context': 'Customer segmentation strategy validation'
    }
])
```

#### A/B Testing Analysis
```python
# A/B test analysis example
ab_test_results = stats_tester.ab_test_analysis(
    dataset='marketing_experiments',
    variant_column='test_group',
    conversion_column='converted',
    metric_columns=['revenue', 'engagement_score'],
    confidence_level=0.95
)

# Generate A/B test report
ab_report = stats_tester.generate_ab_report(
    test_name='Email Campaign Optimization',
    results=ab_test_results,
    recommendations=True
)
```

### 3. Interactive Dashboard Creation

#### Evidence.dev Dashboard Development
```markdown
<!-- pages/customer-analysis.md -->
# Customer Analysis Dashboard

## Key Metrics
```sql customer_kpis
SELECT 
  COUNT(DISTINCT customer_id) as total_customers,
  SUM(purchase_amount) as total_revenue,
  AVG(purchase_amount) as avg_transaction,
  COUNT(*) as total_transactions
FROM customer_transactions
WHERE purchase_date >= CURRENT_DATE - INTERVAL 30 DAYS
```

<BigValue 
  data={customer_kpis} 
  value=total_revenue
  title="30-Day Revenue"
  fmt="$,.0f"
/>

<BigValue 
  data={customer_kpis} 
  value=total_customers
  title="Active Customers"
  fmt=",.0f"
/>

## Customer Segments

```sql segment_analysis
SELECT 
  customer_segment,
  COUNT(*) as customer_count,
  AVG(total_spent) as avg_spending,
  AVG(transaction_frequency) as avg_frequency
FROM customer_metrics_view
GROUP BY customer_segment
ORDER BY avg_spending DESC
```

<BarChart 
  data={segment_analysis}
  x=customer_segment
  y=avg_spending
  title="Average Spending by Segment"
/>

## Trend Analysis

```sql monthly_trends
SELECT 
  DATE_TRUNC('month', purchase_date) as month,
  SUM(purchase_amount) as monthly_revenue,
  COUNT(DISTINCT customer_id) as active_customers
FROM customer_transactions
WHERE purchase_date >= CURRENT_DATE - INTERVAL 12 MONTHS
GROUP BY DATE_TRUNC('month', purchase_date)
ORDER BY month
```

<LineChart 
  data={monthly_trends}
  x=month
  y=monthly_revenue
  title="Monthly Revenue Trend"
/>
```

### 4. Automated Reporting

#### Scheduled Analysis Reports
```python
# Automated report generation
from tools.data_services.report_generator import ReportGenerator

# Initialize report generator
report_gen = ReportGenerator(
    template_dir='./templates/analyst-reports',
    output_dir='./reports/automated'
)

# Create weekly business report
weekly_report = report_gen.generate_report(
    template='weekly_business_summary.md',
    data_sources={
        'sales_data': 'customer_transactions',
        'customer_metrics': 'customer_analytics_view',
        'product_performance': 'product_sales_view'
    },
    report_date=datetime.now(),
    format=['html', 'pdf']
)

# Schedule report generation
report_gen.schedule_report(
    report_config=weekly_report,
    schedule='weekly',
    day_of_week='monday',
    time='09:00'
)
```

## Advanced Analysis Techniques

### 1. Time Series Analysis

#### Trend and Seasonality Detection
```python
# Time series analysis workflow
from tools.data_services.time_series_analyzer import TimeSeriesAnalyzer

# Initialize analyzer
ts_analyzer = TimeSeriesAnalyzer()

# Load time series data
sales_ts = ts_analyzer.load_time_series(
    table='daily_sales',
    date_column='sale_date',
    value_column='total_sales',
    start_date='2023-01-01'
)

# Detect trends and seasonality
decomposition = ts_analyzer.decompose_series(
    sales_ts,
    frequency='weekly',
    include_trend=True,
    include_seasonal=True
)

# Forecast future values
forecast = ts_analyzer.forecast(
    sales_ts,
    periods=30,
    confidence_intervals=[0.8, 0.95]
)

# Generate time series report
ts_report = ts_analyzer.generate_ts_report(
    original_data=sales_ts,
    decomposition=decomposition,
    forecast=forecast
)
```

### 2. Customer Segmentation

#### RFM Analysis
```sql
-- Recency, Frequency, Monetary (RFM) Analysis
WITH customer_rfm AS (
  SELECT 
    customer_id,
    DATE_DIFF('day', MAX(purchase_date), CURRENT_DATE) as recency,
    COUNT(*) as frequency,
    SUM(purchase_amount) as monetary
  FROM customer_transactions
  WHERE purchase_date >= CURRENT_DATE - INTERVAL 365 DAYS
  GROUP BY customer_id
),
rfm_scores AS (
  SELECT *,
    NTILE(5) OVER (ORDER BY recency DESC) as recency_score,
    NTILE(5) OVER (ORDER BY frequency) as frequency_score,
    NTILE(5) OVER (ORDER BY monetary) as monetary_score
  FROM customer_rfm
),
customer_segments AS (
  SELECT *,
    CASE 
      WHEN recency_score >= 4 AND frequency_score >= 4 AND monetary_score >= 4 THEN 'Champions'
      WHEN recency_score >= 3 AND frequency_score >= 3 AND monetary_score >= 3 THEN 'Loyal Customers'
      WHEN recency_score >= 3 AND frequency_score <= 2 THEN 'Potential Loyalists'
      WHEN recency_score <= 2 AND frequency_score >= 3 THEN 'At Risk'
      WHEN recency_score <= 2 AND frequency_score <= 2 THEN 'Lost Customers'
      ELSE 'New Customers'
    END as rfm_segment
  FROM rfm_scores
)
SELECT 
  rfm_segment,
  COUNT(*) as customer_count,
  AVG(monetary) as avg_monetary_value,
  AVG(frequency) as avg_frequency,
  AVG(recency) as avg_recency
FROM customer_segments
GROUP BY rfm_segment
ORDER BY avg_monetary_value DESC;
```

### 3. Cohort Analysis

#### Customer Retention Analysis
```python
# Cohort analysis implementation
from tools.data_services.cohort_analyzer import CohortAnalyzer

# Initialize cohort analyzer
cohort_analyzer = CohortAnalyzer()

# Perform cohort analysis
cohort_data = cohort_analyzer.analyze_retention(
    transaction_table='customer_transactions',
    customer_id='customer_id',
    date_column='purchase_date',
    cohort_type='monthly'
)

# Generate cohort visualization
cohort_heatmap = cohort_analyzer.create_cohort_heatmap(
    cohort_data,
    metric='retention_rate',
    title='Customer Retention Cohort Analysis'
)

# Calculate customer lifetime value by cohort
clv_analysis = cohort_analyzer.calculate_cohort_clv(
    cohort_data,
    revenue_column='purchase_amount'
)
```

## Quality Assurance for Analysts

### Data Validation Workflows

#### Pre-Analysis Data Checks
```python
# Data quality validation
from tools.data_services.data_validator import DataValidator

# Initialize validator
validator = DataValidator()

# Validate dataset before analysis
validation_report = validator.validate_dataset(
    table_name='customer_transactions',
    checks=[
        'completeness_check',
        'uniqueness_check',
        'range_validation',
        'referential_integrity',
        'business_rule_validation'
    ],
    generate_report=True
)

# Only proceed if validation passes
if validation_report.overall_score >= 0.85:
    # Proceed with analysis
    proceed_with_analysis()
else:
    # Flag data quality issues
    notify_data_quality_issues(validation_report)
```

#### Analysis Result Validation
```python
# Validate analysis results
def validate_analysis_results(results):
    validation_checks = [
        check_statistical_significance(results),
        check_sample_sizes(results),
        check_business_logic(results),
        check_data_freshness(results)
    ]
    
    return all(validation_checks)
```

## Performance Optimization

### Query Optimization Tips

#### Efficient DuckDB Queries
```sql
-- Optimized query patterns for DuckDB

-- Use column pruning
SELECT customer_id, purchase_amount, purchase_date
FROM customer_transactions  -- Don't use SELECT *

-- Leverage predicate pushdown
SELECT customer_id, SUM(purchase_amount) as total
FROM customer_transactions 
WHERE purchase_date >= '2024-01-01'  -- Filter early
GROUP BY customer_id;

-- Use appropriate data types
CREATE TABLE optimized_transactions AS
SELECT 
  customer_id::VARCHAR,
  purchase_amount::DECIMAL(10,2),
  purchase_date::DATE,
  product_category::VARCHAR
FROM raw_transactions;

-- Leverage DuckDB's columnar advantages
SELECT category, AVG(amount), COUNT(*)
FROM transactions 
GROUP BY category  -- Efficient with columnar storage
```

### Memory Management
```python
# Memory-efficient analysis patterns
def memory_efficient_analysis(large_dataset):
    # Process data in chunks
    chunk_size = 10000
    results = []
    
    for chunk in pd.read_sql(query, connection, chunksize=chunk_size):
        chunk_result = process_chunk(chunk)
        results.append(chunk_result)
        
        # Clear memory
        del chunk
        gc.collect()
    
    return combine_results(results)
```

## Troubleshooting Common Issues

### Analysis Performance Issues
```python
# Performance monitoring and optimization
def monitor_analysis_performance():
    import time
    import psutil
    
    start_time = time.time()
    start_memory = psutil.virtual_memory().percent
    
    # Perform analysis
    results = run_analysis()
    
    end_time = time.time()
    end_memory = psutil.virtual_memory().percent
    
    # Log performance metrics
    performance_metrics = {
        'execution_time': end_time - start_time,
        'memory_usage_change': end_memory - start_memory,
        'analysis_complexity': calculate_complexity_score()
    }
    
    log_performance_metrics(performance_metrics)
    return results
```

### Data Quality Issues
```python
# Handle common data quality problems
def handle_data_quality_issues(df):
    # Handle missing values
    df = df.fillna({
        'purchase_amount': df['purchase_amount'].median(),
        'customer_segment': 'Unknown',
        'purchase_date': df['purchase_date'].mode()[0]
    })
    
    # Remove outliers using IQR method
    Q1 = df['purchase_amount'].quantile(0.25)
    Q3 = df['purchase_amount'].quantile(0.75)
    IQR = Q3 - Q1
    
    df = df[
        (df['purchase_amount'] >= Q1 - 1.5 * IQR) &
        (df['purchase_amount'] <= Q3 + 1.5 * IQR)
    ]
    
    return df
```

## Best Practices for Data Analysts

### 1. Analysis Documentation
```markdown
# Analysis Documentation Template

## Analysis Overview
- **Objective**: What business question are we answering?
- **Dataset**: Which data sources are being used?
- **Timeframe**: What period does this analysis cover?
- **Methodology**: What analytical techniques are applied?

## Key Assumptions
- List all assumptions made during analysis
- Document any data limitations or constraints
- Note business context and external factors

## Results Summary
- Key findings and insights
- Statistical significance and confidence levels
- Business implications and recommendations

## Technical Details
- SQL queries used
- Statistical tests performed  
- Validation checks completed
- Performance metrics
```

### 2. Code Organization
```python
# Structured analysis script template
class CustomerAnalysis:
    def __init__(self, config):
        self.config = config
        self.db_connection = self.setup_database_connection()
        self.logger = self.setup_logging()
    
    def load_data(self):
        """Load and validate input data."""
        pass
    
    def preprocess_data(self):
        """Clean and prepare data for analysis."""
        pass
    
    def perform_analysis(self):
        """Execute main analysis logic."""
        pass
    
    def validate_results(self):
        """Validate analysis results."""
        pass
    
    def generate_report(self):
        """Create final analysis report."""
        pass
```

### 3. Version Control for Analysis
```bash
# Git workflow for analysis projects
git checkout -b analysis/customer-segmentation-q1-2024
git add analysis/customer_segmentation.py
git add reports/customer_segmentation_report.md
git add queries/customer_metrics.sql
git commit -m "feat: Add Q1 2024 customer segmentation analysis"
git push origin analysis/customer-segmentation-q1-2024
```

## Continuous Learning Resources

### Internal Resources
- **BMad Method Documentation**: Core system understanding
- **Data Quality Guidelines**: Data validation standards  
- **SQL Best Practices**: DuckDB-specific optimization techniques
- **Statistical Analysis Templates**: Reusable analysis patterns

### External Learning
- **Statistical Analysis**: Coursera Data Science courses
- **SQL Optimization**: DuckDB documentation and tutorials
- **Data Visualization**: Evidence.dev documentation
- **Python Analytics**: pandas, numpy, scipy documentation

### Community and Support
- **Internal Data Team**: Weekly analysis review sessions
- **BMad Method Community**: Best practice sharing
- **Office Hours**: Regular Q&A sessions with senior analysts
- **Knowledge Base**: Searchable repository of past analyses

## Certification Path

### Level 1: Basic Data Analyst
- [ ] Complete DuckDB query training
- [ ] Perform basic EDA on sample dataset
- [ ] Create simple Evidence.dev dashboard
- [ ] Document analysis following templates

### Level 2: Advanced Data Analyst  
- [ ] Implement statistical hypothesis testing
- [ ] Build automated reporting workflows
- [ ] Optimize query performance
- [ ] Mentor junior analysts

### Level 3: Senior Data Analyst
- [ ] Design analysis frameworks
- [ ] Lead cross-functional analysis projects
- [ ] Contribute to system architecture decisions
- [ ] Train other team members

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial data analyst training guide | Dev Agent |