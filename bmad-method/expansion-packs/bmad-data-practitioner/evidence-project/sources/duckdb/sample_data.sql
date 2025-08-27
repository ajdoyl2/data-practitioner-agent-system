-- Sample data setup for Evidence.dev Universal SQL with DuckDB
-- This creates sample analytical datasets for testing and demonstration

-- Create analytical insights table
CREATE OR REPLACE TABLE analysis_insights AS 
SELECT 
    'Automated EDA' as insight_category,
    'Sample Data Pattern' as key_metric,
    'High' as statistical_significance,
    'Positive trend detected in key metrics' as business_impact,
    0.85 as confidence_score,
    current_timestamp as analysis_timestamp;

-- Create hypothesis test results table  
CREATE OR REPLACE TABLE hypothesis_test_results AS
SELECT 
    'T-Test: Group Comparison' as test_name,
    0.03 as p_value,
    2.45 as test_statistic,
    'Reject null hypothesis' as result,
    'Significant difference detected between groups' as interpretation,
    current_timestamp as test_timestamp;

-- Create sample metrics table for dashboard
CREATE OR REPLACE TABLE key_metrics AS
SELECT 
    'Total Records Processed' as metric_name,
    1250000 as metric_value,
    'count' as metric_type,
    'Data processing pipeline performance' as description
UNION ALL
SELECT 
    'Analysis Accuracy Score' as metric_name, 
    94.5 as metric_value,
    'percentage' as metric_type,
    'Overall accuracy of automated analysis' as description
UNION ALL  
SELECT
    'Processing Time (seconds)' as metric_name,
    45.2 as metric_value, 
    'duration' as metric_type,
    'Time required for complete analysis pipeline' as description;