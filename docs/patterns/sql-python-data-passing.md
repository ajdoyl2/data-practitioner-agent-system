# SQL-Python Data Passing Patterns in SQLmesh

## Overview

This document establishes efficient patterns for passing data between SQL and Python in SQLmesh models, optimizing for performance, memory usage, and data integrity while maintaining clear boundaries between language responsibilities.

## Data Passing Architecture

### Pattern Classification

```yaml
data_passing_patterns:
  sql_to_python:
    - bulk_data_transfer
    - streaming_data_transfer
    - aggregated_data_transfer
    - structured_data_objects
    
  python_to_sql:
    - table_valued_functions
    - temporary_table_creation
    - batch_insert_operations
    - result_set_returns
    
  bidirectional:
    - iterative_processing
    - feedback_loops
    - real_time_scoring
    - progressive_enhancement
```

### Performance Considerations

```yaml
performance_guidelines:
  memory_optimization:
    - "Use SQL aggregation before Python processing"
    - "Stream large datasets rather than loading all at once"
    - "Implement chunked processing for memory efficiency"
    - "Use appropriate data types to minimize memory footprint"
    
  processing_efficiency:
    - "Minimize data transfers between languages"
    - "Use vectorized operations in Python"
    - "Leverage SQL's set-based operations"
    - "Cache expensive computations appropriately"
    
  scalability_patterns:
    - "Design for horizontal scaling"
    - "Implement partition-aware processing"
    - "Use parallel processing where appropriate"
    - "Consider incremental processing patterns"
```

## SQL-to-Python Data Transfer

### Bulk Data Transfer Pattern

Used when Python needs access to complete datasets for complex analytics or machine learning operations.

```sql
-- SQL Model: Bulk data preparation for Python processing
MODEL (
    name analytics.customer_feature_engineering,
    kind INCREMENTAL,
    description 'Prepares customer data for Python-based feature engineering'
);

-- Efficient bulk data preparation
WITH customer_transaction_summary AS (
    -- SQL efficiently aggregates large transaction datasets
    SELECT 
        customer_id,
        
        -- Pre-aggregate metrics to reduce Python processing
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        STDDEV(amount) as amount_volatility,
        
        -- Date-based metrics
        MIN(transaction_date) as first_transaction,
        MAX(transaction_date) as last_transaction,
        COUNT(DISTINCT DATE(transaction_date)) as active_days,
        
        -- Category analysis
        COUNT(DISTINCT merchant_category) as category_diversity,
        MODE(merchant_category) as primary_category,
        
        -- Time-based patterns (for Python time series analysis)
        ARRAY_AGG(
            STRUCT(
                transaction_date,
                amount,
                merchant_category
            ) ORDER BY transaction_date
        ) as transaction_timeline
        
    FROM raw_transactions
    WHERE transaction_date >= @start_date
      AND transaction_date < @end_date
    GROUP BY customer_id
),

customer_demographics AS (
    SELECT 
        customer_id,
        age_group,
        income_bracket,
        geographic_region,
        customer_segment,
        signup_date,
        
        -- Calculate tenure in SQL for efficiency
        DATE_DIFF(@end_date, signup_date, DAY) as account_tenure_days
        
    FROM dim_customers
    WHERE is_active = true
)

-- Optimized join and data structure for Python consumption
SELECT 
    -- Core identifiers
    c.customer_id,
    c.customer_segment,
    c.age_group,
    c.income_bracket,
    c.geographic_region,
    c.account_tenure_days,
    
    -- Pre-calculated metrics (reduce Python computation)
    COALESCE(t.transaction_count, 0) as transaction_count,
    COALESCE(t.total_amount, 0) as total_amount,
    COALESCE(t.avg_amount, 0) as avg_amount,
    COALESCE(t.amount_volatility, 0) as amount_volatility,
    COALESCE(t.category_diversity, 0) as category_diversity,
    COALESCE(t.active_days, 0) as active_days,
    
    -- Calculate derived metrics in SQL when possible
    CASE 
        WHEN t.active_days > 0 THEN t.transaction_count / t.active_days
        ELSE 0
    END as transaction_frequency,
    
    -- Pass structured data for Python complex analysis
    t.transaction_timeline,
    
    -- Metadata for Python processing
    @start_date as analysis_start_date,
    @end_date as analysis_end_date,
    CURRENT_TIMESTAMP() as data_extraction_time
    
FROM customer_demographics c
LEFT JOIN customer_transaction_summary t ON c.customer_id = t.customer_id

-- Optimize data transfer with filters and sorting
WHERE (
    t.transaction_count > 0  -- Only customers with transactions
    OR c.account_tenure_days < 30  -- Or new customers for analysis
)
ORDER BY c.customer_id;  -- Consistent ordering for Python processing
```

### Python Processing with Bulk Data

```python
@python_model(
    name="analytics.advanced_customer_features",
    description="Advanced feature engineering using bulk customer data"
)
def advanced_customer_features(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Process bulk customer data for advanced feature engineering.
    Demonstrates efficient data handling patterns for large datasets.
    """
    
    # Extract bulk data using optimized SQL
    bulk_data_query = """
    SELECT * FROM analytics.customer_feature_engineering
    WHERE analysis_end_date = @end_date
    """
    
    try:
        # Load data efficiently
        df = context.engine.execute(bulk_data_query).to_pandas()
        logger.info(f"Loaded {len(df)} customer records for processing")
        
        # Process data in chunks for memory efficiency
        chunk_size = 10000
        processed_chunks = []
        
        for i in range(0, len(df), chunk_size):
            chunk = df.iloc[i:i + chunk_size].copy()
            
            # Process transaction timelines using vectorized operations
            chunk = process_transaction_timelines(chunk)
            
            # Calculate advanced behavioral features
            chunk = calculate_behavioral_features(chunk)
            
            # Add ML-based features
            chunk = add_ml_features(chunk)
            
            processed_chunks.append(chunk)
            
            # Log progress for monitoring
            if (i // chunk_size) % 10 == 0:
                logger.info(f"Processed {i + len(chunk)}/{len(df)} records")
        
        # Combine processed chunks
        result_df = pd.concat(processed_chunks, ignore_index=True)
        
        # Final data quality checks
        result_df = validate_and_clean_features(result_df)
        
        logger.info(f"Feature engineering completed: {len(result_df)} records with {len(result_df.columns)} features")
        return result_df
        
    except Exception as e:
        logger.error(f"Bulk data processing failed: {str(e)}")
        raise

def process_transaction_timelines(df: pd.DataFrame) -> pd.DataFrame:
    """Process transaction timeline data efficiently."""
    
    def extract_timeline_features(timeline):
        """Extract features from transaction timeline array."""
        if not timeline or len(timeline) == 0:
            return {
                'spending_trend': 0.0,
                'seasonal_pattern': 0.0,
                'spending_acceleration': 0.0,
                'category_switching_rate': 0.0
            }
        
        try:
            # Convert to DataFrame for analysis
            timeline_df = pd.DataFrame(timeline)
            timeline_df['transaction_date'] = pd.to_datetime(timeline_df['transaction_date'])
            timeline_df = timeline_df.sort_values('transaction_date')
            
            # Calculate spending trend using linear regression
            if len(timeline_df) >= 3:
                x = np.arange(len(timeline_df))
                y = timeline_df['amount'].values
                slope, _ = np.polyfit(x, y, 1)
                spending_trend = slope
            else:
                spending_trend = 0.0
            
            # Calculate seasonal patterns (simplified)
            timeline_df['month'] = timeline_df['transaction_date'].dt.month
            monthly_spend = timeline_df.groupby('month')['amount'].mean()
            seasonal_pattern = monthly_spend.std() / monthly_spend.mean() if monthly_spend.mean() > 0 else 0.0
            
            # Calculate spending acceleration (second derivative)
            if len(timeline_df) >= 5:
                amounts = timeline_df['amount'].rolling(window=3).mean().dropna()
                if len(amounts) >= 3:
                    first_diff = amounts.diff().dropna()
                    second_diff = first_diff.diff().dropna()
                    spending_acceleration = second_diff.mean()
                else:
                    spending_acceleration = 0.0
            else:
                spending_acceleration = 0.0
            
            # Calculate category switching rate
            if len(timeline_df) > 1:
                category_changes = (timeline_df['merchant_category'] != timeline_df['merchant_category'].shift()).sum()
                category_switching_rate = category_changes / len(timeline_df)
            else:
                category_switching_rate = 0.0
            
            return {
                'spending_trend': float(spending_trend),
                'seasonal_pattern': float(seasonal_pattern),
                'spending_acceleration': float(spending_acceleration),
                'category_switching_rate': float(category_switching_rate)
            }
            
        except Exception as e:
            logger.warning(f"Timeline processing error: {str(e)}")
            return {
                'spending_trend': 0.0,
                'seasonal_pattern': 0.0,
                'spending_acceleration': 0.0,
                'category_switching_rate': 0.0
            }
    
    # Apply timeline processing using vectorized operations
    timeline_features = df['transaction_timeline'].apply(extract_timeline_features)
    timeline_features_df = pd.DataFrame(timeline_features.tolist(), index=df.index)
    
    # Merge with original DataFrame
    return pd.concat([df.drop(columns=['transaction_timeline']), timeline_features_df], axis=1)
```

### Streaming Data Transfer Pattern

Used for processing large datasets that don't fit in memory or for real-time processing scenarios.

```python
def streaming_data_processor(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Demonstrate streaming data processing pattern for memory efficiency.
    Processes data in batches without loading entire dataset into memory.
    """
    
    # Define batch processing parameters
    batch_size = 50000
    offset = 0
    all_results = []
    
    while True:
        # Get batch of data
        batch_query = f"""
        SELECT 
            customer_id,
            transaction_date,
            amount,
            merchant_category,
            -- Include row number for pagination
            ROW_NUMBER() OVER (ORDER BY customer_id, transaction_date) as row_num
        FROM raw_transactions
        WHERE transaction_date >= @start_date
          AND transaction_date < @end_date
        QUALIFY row_num > {offset} AND row_num <= {offset + batch_size}
        """
        
        try:
            batch_df = context.engine.execute(batch_query).to_pandas()
            
            # Break if no more data
            if len(batch_df) == 0:
                break
                
            logger.info(f"Processing batch: rows {offset + 1} to {offset + len(batch_df)}")
            
            # Process batch
            processed_batch = process_transaction_batch(batch_df)
            
            # Store results (or write to intermediate table)
            all_results.append(processed_batch)
            
            # Update offset for next batch
            offset += batch_size
            
            # Memory management: limit number of batches in memory
            if len(all_results) > 10:  # Keep only last 10 batches
                # In production, write to intermediate storage
                logger.info("Memory threshold reached - writing intermediate results")
                write_intermediate_results(all_results[:-5])
                all_results = all_results[-5:]
            
        except Exception as e:
            logger.error(f"Batch processing failed at offset {offset}: {str(e)}")
            break
    
    # Combine all results
    if all_results:
        final_result = pd.concat(all_results, ignore_index=True)
        logger.info(f"Streaming processing completed: {len(final_result)} records processed")
        return final_result
    else:
        logger.warning("No data processed")
        return pd.DataFrame()

def process_transaction_batch(batch_df: pd.DataFrame) -> pd.DataFrame:
    """Process a batch of transaction data."""
    
    # Customer-level aggregations within batch
    customer_metrics = batch_df.groupby('customer_id').agg({
        'amount': ['count', 'sum', 'mean', 'std'],
        'merchant_category': 'nunique',
        'transaction_date': ['min', 'max']
    }).round(2)
    
    # Flatten columns
    customer_metrics.columns = [
        'batch_transaction_count',
        'batch_total_spend',
        'batch_avg_spend',
        'batch_spend_volatility',
        'batch_category_diversity',
        'batch_first_transaction',
        'batch_last_transaction'
    ]
    
    return customer_metrics.reset_index()
```

### Aggregated Data Transfer Pattern

Optimal for scenarios where Python needs summarized data rather than raw records.

```sql
-- Aggregated data preparation for Python ML models
WITH customer_monthly_metrics AS (
    SELECT 
        customer_id,
        DATE_TRUNC('month', transaction_date) as month,
        
        -- Monthly aggregations
        COUNT(*) as monthly_transactions,
        SUM(amount) as monthly_spend,
        AVG(amount) as monthly_avg_spend,
        COUNT(DISTINCT merchant_category) as monthly_categories,
        COUNT(DISTINCT DATE(transaction_date)) as monthly_active_days
        
    FROM raw_transactions
    WHERE transaction_date >= DATE_SUB(@end_date, INTERVAL 12 MONTH)
      AND transaction_date < @end_date
    GROUP BY customer_id, DATE_TRUNC('month', transaction_date)
),

customer_feature_matrix AS (
    -- Pivot monthly data into feature matrix
    SELECT 
        customer_id,
        
        -- Statistical features across months
        AVG(monthly_spend) as avg_monthly_spend,
        STDDEV(monthly_spend) as monthly_spend_volatility,
        MIN(monthly_spend) as min_monthly_spend,
        MAX(monthly_spend) as max_monthly_spend,
        
        -- Trend analysis features
        CORR(
            EXTRACT(MONTH FROM month), 
            monthly_spend
        ) as spending_trend_correlation,
        
        -- Consistency features
        AVG(monthly_active_days) as avg_monthly_active_days,
        STDDEV(monthly_active_days) as activity_consistency,
        
        -- Behavioral patterns
        AVG(monthly_categories) as avg_category_diversity,
        COUNT(DISTINCT month) as months_active,
        
        -- Array of monthly values for time series analysis
        ARRAY_AGG(monthly_spend ORDER BY month) as monthly_spend_series,
        ARRAY_AGG(monthly_transactions ORDER BY month) as monthly_transaction_series
        
    FROM customer_monthly_metrics
    GROUP BY customer_id
    HAVING COUNT(DISTINCT month) >= 3  -- Require minimum history
)

-- Final aggregated dataset optimized for Python ML
SELECT 
    customer_id,
    avg_monthly_spend,
    monthly_spend_volatility,
    spending_trend_correlation,
    avg_monthly_active_days,
    activity_consistency,
    avg_category_diversity,
    months_active,
    
    -- Compact time series data
    monthly_spend_series,
    monthly_transaction_series,
    
    -- Metadata
    CURRENT_DATE() as feature_extraction_date
    
FROM customer_feature_matrix
ORDER BY avg_monthly_spend DESC;
```

## Python-to-SQL Data Transfer

### Table-Valued Functions Pattern

Allows Python to return structured data that SQL can immediately consume.

```python
def python_customer_scoring(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Python function that returns structured data for SQL consumption.
    Demonstrates table-valued function pattern.
    """
    
    # Load input data
    input_query = """
    SELECT customer_id, features_json
    FROM analytics.customer_features
    WHERE extraction_date = CURRENT_DATE()
    """
    
    input_df = context.engine.execute(input_query).to_pandas()
    
    # Process with ML model
    scores_df = pd.DataFrame({
        'customer_id': input_df['customer_id'],
        'ml_score': generate_ml_scores(input_df['features_json']),
        'confidence_level': calculate_confidence_levels(input_df['features_json']),
        'risk_category': categorize_risk_levels(input_df['features_json']),
        'model_version': '2.1.0',
        'scoring_timestamp': pd.Timestamp.now()
    })
    
    return scores_df

# SQL can immediately consume Python output
@sql_model("""
SELECT 
    s.customer_id,
    s.ml_score,
    s.confidence_level,
    s.risk_category,
    
    -- SQL can enhance Python results
    c.customer_segment,
    c.account_tenure_days,
    
    -- Business rules on top of ML scores
    CASE 
        WHEN s.ml_score > 0.8 AND s.confidence_level > 0.9 THEN 'HIGH_VALUE'
        WHEN s.ml_score > 0.6 AND s.confidence_level > 0.8 THEN 'MEDIUM_VALUE'
        ELSE 'STANDARD'
    END as customer_priority,
    
    -- Combine ML insights with business logic
    CASE 
        WHEN s.risk_category = 'HIGH' THEN false
        WHEN s.ml_score > 0.7 AND c.account_tenure_days > 365 THEN true
        ELSE false
    END as eligible_for_premium_offer
    
FROM python_customer_scoring() s
JOIN dim_customers c ON s.customer_id = c.customer_id
WHERE s.confidence_level >= 0.7  -- Filter low confidence predictions
""")
def enhanced_customer_scoring(context: ExecutionContext, **kwargs):
    pass
```

### Temporary Table Creation Pattern

Python creates intermediate tables that SQL can reference in subsequent operations.

```python
def create_ml_features_table(context: ExecutionContext, **kwargs) -> None:
    """
    Python function that creates temporary tables for SQL consumption.
    Useful for complex feature engineering that feeds into SQL models.
    """
    
    # Load raw data
    raw_data = context.engine.execute("""
        SELECT customer_id, transaction_history_json, demographic_data
        FROM raw_customer_data
        WHERE last_updated >= @start_date
    """).to_pandas()
    
    # Complex feature engineering in Python
    features_df = perform_complex_feature_engineering(raw_data)
    
    # Create temporary table for SQL consumption
    temp_table_name = f"temp_ml_features_{int(time.time())}"
    
    # Write features to temporary table
    context.engine.create_table_from_dataframe(
        table_name=temp_table_name,
        dataframe=features_df,
        temporary=True
    )
    
    logger.info(f"Created temporary table {temp_table_name} with {len(features_df)} features")
    
    # Store table name for SQL models to reference
    context.set_variable('ml_features_table', temp_table_name)

# SQL model can reference the temporary table
@sql_model(f"""
SELECT 
    f.*,
    c.customer_segment,
    c.geographic_region,
    
    -- SQL-based feature combinations
    f.feature_1 * f.feature_2 as interaction_feature_1_2,
    CASE 
        WHEN f.feature_3 > f.feature_4 THEN 'pattern_a'
        ELSE 'pattern_b'
    END as behavioral_pattern
    
FROM {{ var('ml_features_table') }} f
JOIN dim_customers c ON f.customer_id = c.customer_id
""")
def final_feature_set(context: ExecutionContext, **kwargs):
    pass
```

### Batch Insert Operations Pattern

Efficient pattern for Python to insert large amounts of processed data back to SQL tables.

```python
def batch_prediction_updates(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Demonstrate efficient batch insertion pattern for large prediction datasets.
    """
    
    # Load customers needing predictions
    customers_query = """
    SELECT customer_id, last_prediction_date
    FROM dim_customers
    WHERE (last_prediction_date IS NULL 
           OR last_prediction_date < DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY))
      AND is_active = true
    """
    
    customers_df = context.engine.execute(customers_query).to_pandas()
    logger.info(f"Generating predictions for {len(customers_df)} customers")
    
    # Process predictions in batches
    batch_size = 5000
    all_predictions = []
    
    for i in range(0, len(customers_df), batch_size):
        batch = customers_df.iloc[i:i + batch_size]
        
        # Generate predictions for batch
        batch_predictions = generate_customer_predictions(batch)
        
        # Prepare for batch insert
        batch_predictions['prediction_date'] = pd.Timestamp.now().date()
        batch_predictions['model_version'] = '3.2.1'
        batch_predictions['batch_id'] = f"batch_{i // batch_size + 1}"
        
        all_predictions.append(batch_predictions)
        
        # Insert batch to database (efficient bulk insert)
        insert_batch_predictions(context, batch_predictions)
        
        logger.info(f"Inserted batch {i // batch_size + 1}/{len(customers_df) // batch_size + 1}")
    
    # Return summary for SQLmesh
    summary_df = pd.concat(all_predictions, ignore_index=True)
    return summary_df.groupby(['prediction_date', 'model_version']).agg({
        'customer_id': 'count',
        'prediction_score': ['mean', 'std', 'min', 'max']
    }).round(3).reset_index()

def insert_batch_predictions(context: ExecutionContext, predictions_df: pd.DataFrame):
    """Efficiently insert batch predictions using bulk operations."""
    
    # Use database-specific bulk insert for performance
    try:
        # Method 1: Direct bulk insert (fastest)
        context.engine.bulk_insert(
            table_name='customer_predictions',
            dataframe=predictions_df,
            if_exists='append'
        )
        
    except AttributeError:
        # Method 2: Fallback to batch INSERT statements
        batch_insert_sql = """
        INSERT INTO customer_predictions 
        (customer_id, prediction_score, confidence_level, prediction_date, model_version, batch_id)
        VALUES 
        """ + ",".join([
            f"('{row.customer_id}', {row.prediction_score}, {row.confidence_level}, "
            f"'{row.prediction_date}', '{row.model_version}', '{row.batch_id}')"
            for _, row in predictions_df.iterrows()
        ])
        
        context.engine.execute(batch_insert_sql)
        
    except Exception as e:
        # Method 3: Individual inserts (slowest, most reliable)
        logger.warning(f"Bulk insert failed, using individual inserts: {str(e)}")
        for _, row in predictions_df.iterrows():
            insert_sql = f"""
            INSERT INTO customer_predictions 
            (customer_id, prediction_score, confidence_level, prediction_date, model_version, batch_id)
            VALUES ('{row.customer_id}', {row.prediction_score}, {row.confidence_level}, 
                   '{row.prediction_date}', '{row.model_version}', '{row.batch_id}')
            """
            context.engine.execute(insert_sql)
```

## Bidirectional Data Passing

### Iterative Processing Pattern

Combines SQL and Python in feedback loops for progressive data refinement.

```python
def iterative_customer_segmentation(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Demonstrate iterative processing between SQL and Python.
    SQL provides data, Python refines segmentation, SQL validates results.
    """
    
    max_iterations = 5
    convergence_threshold = 0.05
    
    # Initial customer data from SQL
    customers_df = get_initial_customer_data(context)
    previous_segments = None
    
    for iteration in range(max_iterations):
        logger.info(f"Starting iteration {iteration + 1}")
        
        # Python: Update segmentation using ML
        updated_segments = update_customer_segments(customers_df, iteration)
        
        # SQL: Validate segments against business rules
        validation_query = f"""
        WITH segment_validation AS (
            SELECT 
                segment_name,
                COUNT(*) as customer_count,
                AVG(total_spend) as avg_spend,
                AVG(transaction_frequency) as avg_frequency,
                
                -- Business rule validations
                CASE 
                    WHEN COUNT(*) < 100 THEN 'too_small'
                    WHEN AVG(total_spend) < 100 THEN 'low_value'
                    WHEN AVG(transaction_frequency) < 0.1 THEN 'inactive'
                    ELSE 'valid'
                END as validation_status
                
            FROM temp_segments_{iteration}
            GROUP BY segment_name
        )
        
        SELECT * FROM segment_validation
        WHERE validation_status != 'valid'
        """
        
        # Create temporary table with updated segments
        temp_table = f"temp_segments_{iteration}"
        context.engine.create_table_from_dataframe(temp_table, updated_segments, temporary=True)
        
        # Validate segments
        validation_issues = context.engine.execute(validation_query).to_pandas()
        
        if len(validation_issues) > 0:
            logger.warning(f"Validation issues in iteration {iteration + 1}: {len(validation_issues)} segments")
            # Adjust segments based on validation
            updated_segments = adjust_segments_for_validation(updated_segments, validation_issues)
        
        # Check convergence
        if previous_segments is not None:
            convergence_score = calculate_segment_convergence(previous_segments, updated_segments)
            logger.info(f"Convergence score: {convergence_score:.3f}")
            
            if convergence_score < convergence_threshold:
                logger.info(f"Converged after {iteration + 1} iterations")
                break
        
        previous_segments = updated_segments.copy()
        customers_df = merge_segments_with_customers(customers_df, updated_segments)
    
    # Final SQL processing for output
    final_query = f"""
    SELECT 
        customer_id,
        segment_name,
        segment_confidence,
        
        -- Add SQL-based segment characteristics
        CASE segment_name
            WHEN 'high_value' THEN 'premium_service'
            WHEN 'growing' THEN 'growth_programs'
            WHEN 'at_risk' THEN 'retention_campaigns'
            ELSE 'standard_service'
        END as recommended_treatment,
        
        CURRENT_TIMESTAMP() as segmentation_timestamp,
        {iteration + 1} as iterations_to_convergence
        
    FROM temp_segments_{iteration}
    ORDER BY segment_confidence DESC
    """
    
    return context.engine.execute(final_query).to_pandas()
```

### Real-Time Scoring Pattern

Implements real-time data flow between SQL and Python for dynamic scoring.

```python
@python_model(
    name="analytics.real_time_customer_scoring",
    kind=ModelKind.INCREMENTAL,
    description="Real-time customer scoring with SQL-Python data flow"
)
def real_time_customer_scoring(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Real-time scoring pattern with efficient data flow.
    SQL provides recent events, Python scores, SQL applies business rules.
    """
    
    # SQL: Get recent customer events (efficient windowed query)
    recent_events_query = f"""
    WITH recent_customer_events AS (
        SELECT 
            customer_id,
            event_timestamp,
            event_type,
            event_value,
            
            -- Window functions for real-time context
            LAG(event_timestamp) OVER (
                PARTITION BY customer_id 
                ORDER BY event_timestamp
            ) as prev_event_time,
            
            COUNT(*) OVER (
                PARTITION BY customer_id 
                ORDER BY event_timestamp
                RANGE BETWEEN INTERVAL 1 HOUR PRECEDING AND CURRENT ROW
            ) as events_last_hour,
            
            SUM(event_value) OVER (
                PARTITION BY customer_id 
                ORDER BY event_timestamp
                RANGE BETWEEN INTERVAL 1 DAY PRECEDING AND CURRENT ROW
            ) as value_last_day
            
        FROM customer_events
        WHERE event_timestamp >= TIMESTAMP_SUB(@end_time, INTERVAL 2 HOUR)
          AND event_timestamp < @end_time
    ),
    
    customer_context AS (
        SELECT 
            e.customer_id,
            MAX(e.event_timestamp) as last_event_time,
            COUNT(*) as recent_event_count,
            AVG(e.events_last_hour) as avg_hourly_activity,
            MAX(e.value_last_day) as current_daily_value,
            
            -- Current customer state
            c.customer_segment,
            c.current_tier,
            c.account_tenure_days,
            
            -- Behavioral indicators
            TIMESTAMP_DIFF(@end_time, MAX(e.event_timestamp), MINUTE) as minutes_since_last_event
            
        FROM recent_customer_events e
        JOIN dim_customers c ON e.customer_id = c.customer_id
        WHERE c.is_active = true
        GROUP BY e.customer_id, c.customer_segment, c.current_tier, c.account_tenure_days
    )
    
    SELECT * FROM customer_context
    WHERE recent_event_count > 0
    ORDER BY last_event_time DESC
    """
    
    # Load recent customer context
    customer_context_df = context.engine.execute(recent_events_query).to_pandas()
    
    if len(customer_context_df) == 0:
        logger.info("No recent customer activity found")
        return pd.DataFrame()
    
    logger.info(f"Scoring {len(customer_context_df)} customers with recent activity")
    
    # Python: Generate real-time scores
    customer_context_df['real_time_score'] = calculate_real_time_scores(customer_context_df)
    customer_context_df['engagement_momentum'] = calculate_engagement_momentum(customer_context_df)
    customer_context_df['next_best_action'] = suggest_next_best_actions(customer_context_df)
    
    # Prepare for SQL business rule application
    scored_customers = customer_context_df[[
        'customer_id', 'customer_segment', 'current_tier',
        'real_time_score', 'engagement_momentum', 'next_best_action',
        'recent_event_count', 'minutes_since_last_event'
    ]]
    
    return scored_customers

# SQL model applies business rules to Python scores
@sql_model("""
WITH python_scores AS (
    SELECT * FROM analytics.real_time_customer_scoring
    WHERE last_updated >= TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 10 MINUTE)
),

business_rules_applied AS (
    SELECT 
        *,
        
        -- Business rule: Immediate action triggers
        CASE 
            WHEN real_time_score > 0.9 AND customer_segment = 'enterprise' THEN 'immediate_vip_outreach'
            WHEN real_time_score > 0.8 AND minutes_since_last_event < 5 THEN 'real_time_engagement'
            WHEN engagement_momentum > 0.7 AND current_tier != 'platinum' THEN 'tier_upgrade_offer'
            ELSE next_best_action
        END as prioritized_action,
        
        -- Business rule: Timing constraints
        CASE 
            WHEN EXTRACT(HOUR FROM CURRENT_TIMESTAMP()) BETWEEN 9 AND 17 THEN 'business_hours'
            WHEN EXTRACT(DAYOFWEEK FROM CURRENT_TIMESTAMP()) IN (1, 7) THEN 'weekend'
            ELSE 'after_hours'
        END as contact_timing,
        
        -- Business rule: Channel selection
        CASE 
            WHEN real_time_score > 0.8 THEN 'phone'
            WHEN engagement_momentum > 0.6 THEN 'email'
            WHEN recent_event_count > 5 THEN 'in_app_notification'
            ELSE 'scheduled_campaign'
        END as recommended_channel
        
    FROM python_scores
)

SELECT 
    customer_id,
    real_time_score,
    engagement_momentum,
    prioritized_action,
    recommended_channel,
    contact_timing,
    
    -- Action priority for operations team
    CASE 
        WHEN prioritized_action = 'immediate_vip_outreach' THEN 1
        WHEN prioritized_action = 'real_time_engagement' THEN 2
        WHEN prioritized_action = 'tier_upgrade_offer' THEN 3
        ELSE 4
    END as action_priority,
    
    CURRENT_TIMESTAMP() as scoring_timestamp
    
FROM business_rules_applied
ORDER BY action_priority, real_time_score DESC
""")
def actionable_customer_insights(context: ExecutionContext, **kwargs):
    pass
```

## Performance Optimization Strategies

### Memory Management

```python
class MemoryEfficientDataProcessor:
    """Optimized data processing with memory management."""
    
    def __init__(self, max_memory_mb: int = 4096):
        self.max_memory_mb = max_memory_mb
        self.current_memory = 0
        
    def process_with_memory_management(self, df: pd.DataFrame, processing_func) -> pd.DataFrame:
        """Process data with automatic memory management."""
        
        # Estimate memory usage
        estimated_memory = df.memory_usage(deep=True).sum() / 1024 / 1024
        
        if estimated_memory > self.max_memory_mb:
            # Process in chunks
            chunk_size = int(len(df) * self.max_memory_mb / estimated_memory)
            logger.info(f"Processing {len(df)} rows in chunks of {chunk_size}")
            
            results = []
            for i in range(0, len(df), chunk_size):
                chunk = df.iloc[i:i + chunk_size].copy()
                chunk_result = processing_func(chunk)
                results.append(chunk_result)
                
                # Explicit memory cleanup
                del chunk
                if i % (chunk_size * 10) == 0:  # Periodic garbage collection
                    import gc
                    gc.collect()
            
            return pd.concat(results, ignore_index=True)
        else:
            return processing_func(df)
    
    def optimize_dataframe_memory(self, df: pd.DataFrame) -> pd.DataFrame:
        """Optimize DataFrame memory usage through type optimization."""
        
        optimized_df = df.copy()
        
        for col in optimized_df.columns:
            col_type = optimized_df[col].dtype
            
            if col_type == 'object':
                # Try to convert to category if few unique values
                unique_ratio = optimized_df[col].nunique() / len(optimized_df)
                if unique_ratio < 0.5:
                    optimized_df[col] = optimized_df[col].astype('category')
            
            elif col_type == 'int64':
                # Downcast integers
                min_val = optimized_df[col].min()
                max_val = optimized_df[col].max()
                
                if min_val >= 0 and max_val < 255:
                    optimized_df[col] = optimized_df[col].astype('uint8')
                elif min_val >= -128 and max_val < 127:
                    optimized_df[col] = optimized_df[col].astype('int8')
                elif min_val >= -32768 and max_val < 32767:
                    optimized_df[col] = optimized_df[col].astype('int16')
                elif min_val >= -2147483648 and max_val < 2147483647:
                    optimized_df[col] = optimized_df[col].astype('int32')
            
            elif col_type == 'float64':
                # Downcast floats
                optimized_df[col] = pd.to_numeric(optimized_df[col], downcast='float')
        
        return optimized_df
```

### Caching Strategies

```python
class DataPassingCache:
    """Intelligent caching for SQL-Python data passing."""
    
    def __init__(self, cache_dir: str = "/tmp/sqlmesh_cache"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(exist_ok=True)
        
    def cache_sql_result(self, query_hash: str, df: pd.DataFrame, ttl_hours: int = 24):
        """Cache SQL query results for reuse."""
        
        cache_file = self.cache_dir / f"sql_result_{query_hash}.parquet"
        metadata_file = self.cache_dir / f"sql_result_{query_hash}.json"
        
        # Save data
        df.to_parquet(cache_file, compression='snappy')
        
        # Save metadata
        metadata = {
            'created_at': datetime.now().isoformat(),
            'ttl_hours': ttl_hours,
            'row_count': len(df),
            'column_count': len(df.columns),
            'memory_usage_mb': df.memory_usage(deep=True).sum() / 1024 / 1024
        }
        
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f)
    
    def get_cached_sql_result(self, query_hash: str) -> Optional[pd.DataFrame]:
        """Retrieve cached SQL result if valid."""
        
        cache_file = self.cache_dir / f"sql_result_{query_hash}.parquet"
        metadata_file = self.cache_dir / f"sql_result_{query_hash}.json"
        
        if not cache_file.exists() or not metadata_file.exists():
            return None
        
        # Check TTL
        with open(metadata_file, 'r') as f:
            metadata = json.load(f)
        
        created_at = datetime.fromisoformat(metadata['created_at'])
        ttl_hours = metadata['ttl_hours']
        
        if datetime.now() - created_at > timedelta(hours=ttl_hours):
            # Cache expired
            cache_file.unlink()
            metadata_file.unlink()
            return None
        
        return pd.read_parquet(cache_file)
    
    def cache_python_model(self, model_name: str, model_object, version: str):
        """Cache Python ML models for reuse."""
        
        cache_file = self.cache_dir / f"python_model_{model_name}_{version}.pkl"
        
        import joblib
        joblib.dump(model_object, cache_file)
        
        logger.info(f"Cached Python model {model_name} version {version}")
```

This comprehensive guide provides efficient patterns for data passing between SQL and Python in SQLmesh, optimizing for performance while maintaining data integrity and clear separation of concerns.