-- Enhanced Analytical Dataset for Universal SQL Integration
-- Optimized for Evidence.dev client-side processing with DuckDB WASM

-- Drop existing tables if they exist
DROP TABLE IF EXISTS analysis_insights;
DROP TABLE IF EXISTS hypothesis_test_results;  
DROP TABLE IF EXISTS key_metrics;
DROP TABLE IF EXISTS time_series_data;
DROP TABLE IF EXISTS correlation_matrix;
DROP TABLE IF EXISTS performance_benchmarks;
DROP TABLE IF EXISTS data_quality_metrics;

-- Create enhanced analysis insights table with more dimensional data
CREATE OR REPLACE TABLE analysis_insights AS 
SELECT * FROM VALUES 
    ('Automated EDA', 'Customer Segmentation', 'High', 'Identified 3 distinct customer segments with 94% accuracy', 0.94, '2025-08-25 02:00:00'::TIMESTAMP, 'BMad-Analytics-Engine', 'completed'),
    ('Pattern Detection', 'Seasonal Trends', 'Medium', 'Q4 shows 23% higher engagement across all segments', 0.87, '2025-08-25 02:15:00'::TIMESTAMP, 'BMad-Analytics-Engine', 'completed'),
    ('Anomaly Detection', 'Data Quality Issues', 'High', 'Detected 0.3% anomalous records requiring investigation', 0.91, '2025-08-25 02:30:00'::TIMESTAMP, 'BMad-Analytics-Engine', 'completed'),
    ('Predictive Analysis', 'Revenue Forecast', 'High', 'Projected 18% revenue growth in next quarter', 0.88, '2025-08-25 02:45:00'::TIMESTAMP, 'BMad-Analytics-Engine', 'completed'),
    ('Correlation Analysis', 'Feature Relationships', 'Medium', 'Strong correlation (r=0.73) between engagement and retention', 0.85, '2025-08-25 03:00:00'::TIMESTAMP, 'BMad-Analytics-Engine', 'completed')
AS t(insight_category, key_metric, statistical_significance, business_impact, confidence_score, analysis_timestamp, analysis_engine, status);

-- Create enhanced hypothesis test results with multiple test types
CREATE OR REPLACE TABLE hypothesis_test_results AS
SELECT * FROM VALUES
    ('T-Test: Segment Comparison', 0.023, 2.89, 'Reject null hypothesis', 'Significant difference between customer segments A and B', '2025-08-25 02:10:00'::TIMESTAMP, 'two-sample', 95.0, 0.023),
    ('Chi-Square: Independence Test', 0.001, 15.43, 'Reject null hypothesis', 'Strong association between product category and customer segment', '2025-08-25 02:25:00'::TIMESTAMP, 'chi-square', 99.9, 0.001),
    ('ANOVA: Multi-group Comparison', 0.007, 4.72, 'Reject null hypothesis', 'Significant differences in retention across multiple channels', '2025-08-25 02:40:00'::TIMESTAMP, 'anova', 99.3, 0.007),
    ('Mann-Whitney: Non-parametric Test', 0.045, 1.96, 'Reject null hypothesis', 'Median engagement differs between mobile and web users', '2025-08-25 02:55:00'::TIMESTAMP, 'mann-whitney', 95.5, 0.045),
    ('Kolmogorov-Smirnov: Distribution Test', 0.012, 0.23, 'Reject null hypothesis', 'Revenue distributions differ significantly between regions', '2025-08-25 03:10:00'::TIMESTAMP, 'ks-test', 98.8, 0.012)
AS t(test_name, p_value, test_statistic, result, interpretation, test_timestamp, test_type, confidence_level, adjusted_p_value);

-- Create comprehensive key metrics table with hierarchical structure
CREATE OR REPLACE TABLE key_metrics AS
SELECT * FROM VALUES
    ('Total Records Processed', 2450000.0, 'count', 'Data processing pipeline performance', 'performance', 'records', '2025-08-25', 'daily'),
    ('Analysis Accuracy Score', 96.3, 'percentage', 'Overall accuracy of automated analysis', 'quality', 'percentage', '2025-08-25', 'daily'),  
    ('Processing Time (seconds)', 32.7, 'duration', 'Time required for complete analysis pipeline', 'performance', 'seconds', '2025-08-25', 'daily'),
    ('Data Quality Score', 98.1, 'percentage', 'Overall data quality assessment score', 'quality', 'percentage', '2025-08-25', 'daily'),
    ('Memory Utilization', 67.8, 'percentage', 'Peak memory usage during processing', 'performance', 'percentage', '2025-08-25', 'daily'),
    ('Query Response Time', 145.2, 'milliseconds', 'Average SQL query execution time', 'performance', 'milliseconds', '2025-08-25', 'daily'),
    ('Error Rate', 0.12, 'percentage', 'Processing error rate', 'quality', 'percentage', '2025-08-25', 'daily'),
    ('Customer Satisfaction', 4.7, 'rating', 'Average customer satisfaction rating (1-5)', 'business', 'rating', '2025-08-25', 'daily'),
    ('Revenue per Customer', 127.50, 'currency', 'Average revenue per customer', 'business', 'dollars', '2025-08-25', 'daily'),
    ('Active Users', 15673.0, 'count', 'Number of active users in last 24 hours', 'business', 'users', '2025-08-25', 'daily')
AS t(metric_name, metric_value, metric_type, description, category, unit, date_recorded, frequency);

-- Create time series data for trend analysis
CREATE OR REPLACE TABLE time_series_data AS
SELECT * FROM VALUES
    ('2025-08-20', 'Revenue', 45230.00, 'daily', 'business'),
    ('2025-08-21', 'Revenue', 47890.00, 'daily', 'business'),
    ('2025-08-22', 'Revenue', 44670.00, 'daily', 'business'),
    ('2025-08-23', 'Revenue', 52340.00, 'daily', 'business'),
    ('2025-08-24', 'Revenue', 48920.00, 'daily', 'business'),
    ('2025-08-25', 'Revenue', 51450.00, 'daily', 'business'),
    ('2025-08-20', 'Active Users', 14230.0, 'daily', 'engagement'),
    ('2025-08-21', 'Active Users', 15670.0, 'daily', 'engagement'),
    ('2025-08-22', 'Active Users', 14890.0, 'daily', 'engagement'),
    ('2025-08-23', 'Active Users', 16780.0, 'daily', 'engagement'),
    ('2025-08-24', 'Active Users', 15340.0, 'daily', 'engagement'),
    ('2025-08-25', 'Active Users', 15673.0, 'daily', 'engagement'),
    ('2025-08-20', 'Error Rate', 0.15, 'daily', 'quality'),
    ('2025-08-21', 'Error Rate', 0.13, 'daily', 'quality'),
    ('2025-08-22', 'Error Rate', 0.18, 'daily', 'quality'),
    ('2025-08-23', 'Error Rate', 0.11, 'daily', 'quality'),
    ('2025-08-24', 'Error Rate', 0.09, 'daily', 'quality'),
    ('2025-08-25', 'Error Rate', 0.12, 'daily', 'quality')
AS t(date_recorded, metric_name, metric_value, frequency, category);

-- Create correlation matrix for advanced analytics
CREATE OR REPLACE TABLE correlation_matrix AS
SELECT * FROM VALUES
    ('Revenue', 'Active Users', 0.73, 'positive', 'strong'),
    ('Revenue', 'Customer Satisfaction', 0.68, 'positive', 'moderate'),
    ('Revenue', 'Error Rate', -0.45, 'negative', 'moderate'),
    ('Active Users', 'Customer Satisfaction', 0.81, 'positive', 'strong'),
    ('Active Users', 'Error Rate', -0.39, 'negative', 'weak'),
    ('Customer Satisfaction', 'Error Rate', -0.52, 'negative', 'moderate'),
    ('Processing Time', 'Memory Utilization', 0.67, 'positive', 'moderate'),
    ('Processing Time', 'Data Quality Score', -0.23, 'negative', 'weak'),
    ('Memory Utilization', 'Error Rate', 0.41, 'positive', 'moderate'),
    ('Data Quality Score', 'Analysis Accuracy', 0.89, 'positive', 'very strong')
AS t(variable_1, variable_2, correlation_coefficient, correlation_direction, correlation_strength);

-- Create performance benchmarks table
CREATE OR REPLACE TABLE performance_benchmarks AS
SELECT * FROM VALUES
    ('Query Execution', 'Simple SELECT', 12.3, 'milliseconds', 'target: <50ms', 'excellent'),
    ('Query Execution', 'Complex JOIN', 145.7, 'milliseconds', 'target: <500ms', 'good'),
    ('Query Execution', 'Aggregation', 67.2, 'milliseconds', 'target: <200ms', 'excellent'),
    ('Data Loading', 'CSV Import', 2.1, 'seconds', 'target: <5s', 'excellent'),
    ('Data Loading', 'JSON Processing', 4.7, 'seconds', 'target: <10s', 'good'),
    ('Data Loading', 'Parquet Read', 0.8, 'seconds', 'target: <2s', 'excellent'),
    ('Memory Usage', 'Peak Utilization', 67.8, 'percentage', 'target: <80%', 'good'),
    ('Memory Usage', 'Average Utilization', 45.2, 'percentage', 'target: <60%', 'excellent'),
    ('Throughput', 'Records per Second', 12500.0, 'records/sec', 'target: >10000/sec', 'excellent'),
    ('Latency', '95th Percentile', 234.5, 'milliseconds', 'target: <500ms', 'excellent')
AS t(category, operation, value, unit, benchmark, performance_rating);

-- Create data quality metrics table
CREATE OR REPLACE TABLE data_quality_metrics AS
SELECT * FROM VALUES
    ('Completeness', 'customer_data', 98.7, 'percentage', 'high', 'Missing values in 1.3% of records'),
    ('Accuracy', 'customer_data', 96.4, 'percentage', 'high', 'Validation rules passed for 96.4% of records'),
    ('Consistency', 'customer_data', 94.8, 'percentage', 'high', 'Cross-table consistency check passed'),
    ('Timeliness', 'customer_data', 99.2, 'percentage', 'high', 'Data refreshed within 8 hours'),
    ('Validity', 'customer_data', 97.1, 'percentage', 'high', 'Format validation passed'),
    ('Uniqueness', 'customer_data', 99.6, 'percentage', 'high', 'Duplicate detection passed'),
    ('Completeness', 'transaction_data', 99.9, 'percentage', 'high', 'Minimal missing values detected'),
    ('Accuracy', 'transaction_data', 98.2, 'percentage', 'high', 'Financial validation passed'),
    ('Consistency', 'transaction_data', 97.6, 'percentage', 'high', 'Balance reconciliation successful'),
    ('Timeliness', 'transaction_data', 95.8, 'percentage', 'medium', 'Some delays in real-time processing')
AS t(dimension, dataset, score, unit, quality_level, notes);

-- Create indexes for query optimization
CREATE INDEX idx_analysis_insights_category ON analysis_insights(insight_category);
CREATE INDEX idx_analysis_insights_confidence ON analysis_insights(confidence_score);
CREATE INDEX idx_hypothesis_test_pvalue ON hypothesis_test_results(p_value);
CREATE INDEX idx_key_metrics_category ON key_metrics(category);
CREATE INDEX idx_time_series_date ON time_series_data(date_recorded);
CREATE INDEX idx_performance_category ON performance_benchmarks(category);

-- Create views for common analytical queries
CREATE OR REPLACE VIEW high_confidence_insights AS
SELECT * FROM analysis_insights 
WHERE confidence_score >= 0.85 
ORDER BY confidence_score DESC;

CREATE OR REPLACE VIEW significant_tests AS
SELECT * FROM hypothesis_test_results 
WHERE p_value < 0.05 
ORDER BY p_value ASC;

CREATE OR REPLACE VIEW daily_summary AS
SELECT 
    date_recorded,
    COUNT(*) as total_metrics,
    AVG(CASE WHEN category = 'performance' THEN metric_value END) as avg_performance,
    AVG(CASE WHEN category = 'quality' THEN metric_value END) as avg_quality,
    AVG(CASE WHEN category = 'business' THEN metric_value END) as avg_business
FROM key_metrics 
GROUP BY date_recorded
ORDER BY date_recorded DESC;

-- Performance optimization queries
ANALYZE analysis_insights;
ANALYZE hypothesis_test_results;
ANALYZE key_metrics;
ANALYZE time_series_data;
ANALYZE correlation_matrix;
ANALYZE performance_benchmarks;
ANALYZE data_quality_metrics;