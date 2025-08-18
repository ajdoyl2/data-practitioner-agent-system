# Mixed-Language Model Workflows in SQLmesh

## Overview

This document establishes best practices for implementing SQLmesh models that combine SQL and Python, enabling sophisticated data transformations while maintaining performance, maintainability, and debugging capabilities.

## Mixed-Language Architecture

### Model Types and Use Cases

```yaml
mixed_language_patterns:
  sql_primary_python_enhancement:
    description: "SQL handles main logic, Python adds complex calculations"
    use_cases: 
      - "Statistical analysis on aggregated data"
      - "Custom business logic validation" 
      - "Advanced text processing on string columns"
    performance: "High - minimal Python overhead"
    
  python_primary_sql_integration:
    description: "Python orchestrates, SQL handles data access"
    use_cases:
      - "Machine learning feature engineering"
      - "Complex time series analysis"
      - "Multi-source data integration"
    performance: "Medium - Python processing overhead"
    
  hybrid_workflow:
    description: "Equal partnership between SQL and Python"
    use_cases:
      - "Real-time scoring with batch training"
      - "Dynamic schema generation"
      - "Cross-system data validation"
    performance: "Variable - depends on implementation"
```

### Architecture Decision Framework

```python
def choose_mixed_language_pattern(requirements: Dict) -> str:
    """Decision framework for mixed-language model architecture."""
    
    # Performance requirements
    if requirements.get('latency_sla_ms', 10000) < 1000:
        return 'sql_primary_python_enhancement'
    
    # Data volume considerations
    if requirements.get('daily_row_count', 0) > 100_000_000:
        return 'sql_primary_python_enhancement'
    
    # Complexity requirements
    complexity_indicators = [
        'machine_learning', 'advanced_statistics', 'external_apis',
        'complex_business_rules', 'dynamic_schemas'
    ]
    
    complexity_score = sum(
        1 for indicator in complexity_indicators 
        if requirements.get(indicator, False)
    )
    
    if complexity_score >= 3:
        return 'python_primary_sql_integration'
    elif complexity_score >= 1:
        return 'hybrid_workflow'
    else:
        return 'sql_primary_python_enhancement'
```

## SQL-Primary Python Enhancement Pattern

### Pattern Overview
SQL handles the primary data transformation logic while Python provides specialized functionality for complex calculations, validations, or business rules that are difficult to express in SQL.

### Implementation Structure

```sql
-- SQL-Primary Model with Python Enhancement
MODEL (
    name analytics.customer_risk_scoring,
    kind INCREMENTAL,
    owner 'data-science@company.com',
    cron '@daily',
    grain ['customer_id', 'score_date'],
    
    description '''
    Daily customer risk scores combining SQL-based transaction analysis 
    with Python ML model predictions for comprehensive risk assessment.
    '''
);

-- Main SQL transformation with Python enhancement hooks
WITH customer_transactions AS (
    -- SQL handles bulk data processing efficiently
    SELECT 
        customer_id,
        score_date,
        COUNT(*) as transaction_count,
        SUM(amount) as total_amount,
        AVG(amount) as avg_amount,
        
        -- Aggregate features for Python processing
        ARRAY_AGG(
            STRUCT(
                amount, 
                merchant_category, 
                transaction_time,
                payment_method
            ) ORDER BY transaction_time
        ) as transaction_details
        
    FROM raw_transactions
    WHERE transaction_date >= @start_date
    GROUP BY customer_id, score_date
),

risk_indicators AS (
    -- SQL-based risk calculations
    SELECT 
        *,
        
        -- Traditional SQL risk indicators
        CASE 
            WHEN transaction_count > 50 THEN 'high_activity'
            WHEN transaction_count < 5 THEN 'low_activity'
            ELSE 'normal_activity'
        END as activity_level,
        
        -- Velocity indicators
        total_amount / NULLIF(transaction_count, 0) as spend_per_transaction,
        
        -- Call Python function for complex risk scoring
        @python_risk_score(
            transaction_details, 
            total_amount, 
            transaction_count
        ) as ml_risk_score
        
    FROM customer_transactions
)

-- Final output combines SQL and Python results
SELECT 
    customer_id,
    score_date,
    transaction_count,
    total_amount,
    activity_level,
    ml_risk_score,
    
    -- Composite score combining SQL and Python insights
    CASE 
        WHEN ml_risk_score > 0.8 AND activity_level = 'high_activity' THEN 'HIGH'
        WHEN ml_risk_score > 0.6 OR activity_level = 'low_activity' THEN 'MEDIUM'
        ELSE 'LOW'
    END as final_risk_tier
    
FROM risk_indicators
WHERE ml_risk_score IS NOT NULL;
```

### Python Enhancement Functions

```python
# Python functions for SQL integration
import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
from typing import List, Dict, Any
import joblib
import logging

logger = logging.getLogger(__name__)

def python_risk_score(
    transaction_details: List[Dict[str, Any]], 
    total_amount: float, 
    transaction_count: int
) -> float:
    """
    Calculate ML-based risk score for customer transactions.
    
    Args:
        transaction_details: Array of transaction records from SQL
        total_amount: Total transaction amount (for validation)
        transaction_count: Total transaction count (for validation)
    
    Returns:
        Risk score between 0.0 (low risk) and 1.0 (high risk)
    """
    
    try:
        # Validate inputs
        if not transaction_details or transaction_count == 0:
            return 0.5  # Neutral score for insufficient data
        
        # Convert SQL array to DataFrame for analysis
        df = pd.DataFrame(transaction_details)
        
        # Feature engineering
        features = extract_behavioral_features(df)
        
        # Load pre-trained anomaly detection model
        model = load_risk_model()
        
        # Calculate risk score
        risk_score = model.predict_proba([features])[0][1]  # Probability of anomaly
        
        # Validate against SQL aggregates
        calculated_total = df['amount'].sum()
        if abs(calculated_total - total_amount) > 0.01:
            logger.warning(f"Amount mismatch: SQL={total_amount}, Python={calculated_total}")
            
        return float(np.clip(risk_score, 0.0, 1.0))
        
    except Exception as e:
        logger.error(f"Risk scoring failed: {str(e)}")
        return 0.5  # Safe default score

def extract_behavioral_features(transactions_df: pd.DataFrame) -> List[float]:
    """Extract behavioral features from transaction data."""
    
    # Time-based features
    transactions_df['hour'] = pd.to_datetime(transactions_df['transaction_time']).dt.hour
    night_transactions = (transactions_df['hour'] < 6) | (transactions_df['hour'] > 22)
    
    # Amount-based features
    amount_std = transactions_df['amount'].std()
    amount_cv = amount_std / transactions_df['amount'].mean() if transactions_df['amount'].mean() > 0 else 0
    
    # Category diversity
    unique_categories = transactions_df['merchant_category'].nunique()
    
    # Payment method patterns
    payment_method_diversity = transactions_df['payment_method'].nunique()
    
    # Temporal patterns
    time_gaps = transactions_df['transaction_time'].diff().dt.total_seconds()
    avg_time_gap = time_gaps.mean() if len(time_gaps) > 1 else 86400  # Default 1 day
    
    return [
        float(night_transactions.mean()),        # Proportion of night transactions
        float(amount_cv),                        # Amount coefficient of variation
        float(unique_categories / len(transactions_df)),  # Category diversity ratio
        float(payment_method_diversity),         # Payment method count
        float(avg_time_gap / 3600),             # Average hours between transactions
        float(len(transactions_df)),            # Transaction frequency
    ]

def load_risk_model():
    """Load pre-trained risk scoring model."""
    try:
        # In production, this would load from model registry
        model = joblib.load('/models/customer_risk_model_v2.pkl')
        return model
    except Exception as e:
        logger.warning(f"Failed to load risk model: {e}")
        # Fallback to simple rule-based model
        return SimpleRiskModel()

class SimpleRiskModel:
    """Fallback rule-based risk model."""
    
    def predict_proba(self, features):
        """Simple risk scoring based on feature thresholds."""
        feature_vector = features[0]
        
        # Simple risk indicators
        night_tx_ratio = feature_vector[0]
        amount_volatility = feature_vector[1]
        category_diversity = feature_vector[2]
        
        risk_score = 0.0
        
        # Night transaction risk
        if night_tx_ratio > 0.3:
            risk_score += 0.3
            
        # Amount volatility risk
        if amount_volatility > 2.0:
            risk_score += 0.4
            
        # Unusual category patterns
        if category_diversity > 0.8:
            risk_score += 0.3
            
        return [[1.0 - risk_score, risk_score]]
```

### Performance Optimization Strategies

```yaml
sql_primary_optimizations:
  data_volume_management:
    - "Process aggregations in SQL before Python"
    - "Use ARRAY_AGG sparingly for Python input"
    - "Implement incremental processing patterns"
    - "Partition data for parallel Python processing"
    
  python_function_efficiency:
    - "Cache model loading and initialization"
    - "Use vectorized operations where possible"
    - "Implement circuit breaker patterns"
    - "Add comprehensive error handling"
    
  memory_management:
    - "Stream large datasets rather than loading all"
    - "Use appropriate data types in Python"
    - "Clean up intermediate objects"
    - "Monitor memory usage in complex functions"
```

## Python-Primary SQL Integration Pattern

### Pattern Overview
Python orchestrates the workflow and handles complex logic while leveraging SQL for efficient data access and basic transformations.

### Implementation Structure

```python
# Python-Primary Model with SQL Integration
import sqlmesh
from sqlmesh import ExecutionContext, ModelKind
from sqlmesh.core.model import python_model
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict, Any

@python_model(
    name="analytics.customer_ltv_prediction",
    kind=ModelKind.INCREMENTAL,
    owner="data-science@company.com",
    cron="@daily",
    grain=["customer_id", "prediction_date"],
    description="""
    Python-driven customer lifetime value prediction combining multiple 
    data sources with advanced ML techniques for accurate LTV forecasting.
    """
)
def customer_ltv_prediction(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Calculate customer lifetime value predictions using Python ML pipeline
    with SQL-based data access for optimal performance.
    """
    
    # Get execution parameters
    start_date = kwargs.get('start_date', context.start_date)
    end_date = kwargs.get('end_date', context.end_date)
    
    logger.info(f"Processing LTV predictions for {start_date} to {end_date}")
    
    try:
        # Step 1: SQL-based data extraction and basic aggregation
        customer_features = extract_customer_features(context, start_date, end_date)
        
        # Step 2: Python-based feature engineering
        enhanced_features = engineer_ltv_features(customer_features)
        
        # Step 3: ML prediction pipeline
        predictions = generate_ltv_predictions(enhanced_features)
        
        # Step 4: Business rule validation and adjustments
        validated_predictions = validate_and_adjust_predictions(predictions)
        
        # Step 5: Format output for SQLmesh
        output_df = format_prediction_output(validated_predictions, end_date)
        
        logger.info(f"Generated {len(output_df)} LTV predictions")
        return output_df
        
    except Exception as e:
        logger.error(f"LTV prediction failed: {str(e)}")
        raise

def extract_customer_features(
    context: ExecutionContext, 
    start_date: str, 
    end_date: str
) -> pd.DataFrame:
    """Extract customer features using optimized SQL queries."""
    
    # Customer transaction features
    transaction_query = f"""
    WITH transaction_metrics AS (
        SELECT 
            customer_id,
            COUNT(*) as total_transactions,
            SUM(amount) as total_spend,
            AVG(amount) as avg_transaction,
            MAX(transaction_date) as last_transaction_date,
            MIN(transaction_date) as first_transaction_date,
            COUNT(DISTINCT merchant_category) as category_diversity,
            STDDEV(amount) as spend_volatility
        FROM raw_transactions
        WHERE transaction_date BETWEEN '{start_date}' AND '{end_date}'
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
            account_tenure_days
        FROM dim_customers
        WHERE is_active = true
    )
    
    SELECT 
        c.*,
        COALESCE(t.total_transactions, 0) as total_transactions,
        COALESCE(t.total_spend, 0) as total_spend,
        COALESCE(t.avg_transaction, 0) as avg_transaction,
        t.last_transaction_date,
        t.first_transaction_date,
        COALESCE(t.category_diversity, 0) as category_diversity,
        COALESCE(t.spend_volatility, 0) as spend_volatility
    FROM customer_demographics c
    LEFT JOIN transaction_metrics t ON c.customer_id = t.customer_id
    """
    
    return context.engine.execute(transaction_query).to_pandas()

def engineer_ltv_features(customer_data: pd.DataFrame) -> pd.DataFrame:
    """Advanced feature engineering using Python analytics."""
    
    df = customer_data.copy()
    
    # Temporal features
    df['days_since_last_transaction'] = (
        pd.Timestamp.now() - pd.to_datetime(df['last_transaction_date'])
    ).dt.days.fillna(9999)
    
    df['customer_lifespan_days'] = (
        pd.to_datetime(df['last_transaction_date']) - 
        pd.to_datetime(df['first_transaction_date'])
    ).dt.days.fillna(0)
    
    # Behavioral features
    df['transaction_frequency'] = (
        df['total_transactions'] / np.maximum(df['customer_lifespan_days'], 1) * 365
    )
    
    df['spend_consistency'] = np.where(
        df['avg_transaction'] > 0,
        df['spend_volatility'] / df['avg_transaction'],
        0
    )
    
    # Engagement scoring
    df['engagement_score'] = calculate_engagement_score(df)
    
    # Seasonal adjustments
    df['seasonal_factor'] = calculate_seasonal_factors(df)
    
    # Risk indicators
    df['churn_risk'] = calculate_churn_risk(df)
    
    return df

def calculate_engagement_score(df: pd.DataFrame) -> pd.Series:
    """Calculate customer engagement score using multiple indicators."""
    
    # Normalize features for scoring
    features = ['transaction_frequency', 'category_diversity', 'account_tenure_days']
    
    normalized_features = {}
    for feature in features:
        if feature in df.columns:
            min_val = df[feature].quantile(0.05)
            max_val = df[feature].quantile(0.95)
            normalized_features[feature] = np.clip(
                (df[feature] - min_val) / (max_val - min_val), 0, 1
            )
    
    # Weighted engagement score
    weights = {'transaction_frequency': 0.4, 'category_diversity': 0.3, 'account_tenure_days': 0.3}
    
    engagement_score = sum(
        normalized_features.get(feature, 0) * weight 
        for feature, weight in weights.items()
    )
    
    return engagement_score

def generate_ltv_predictions(features_df: pd.DataFrame) -> pd.DataFrame:
    """Generate LTV predictions using ML pipeline."""
    
    # Feature selection for ML model
    ml_features = [
        'total_spend', 'transaction_frequency', 'engagement_score',
        'spend_consistency', 'churn_risk', 'seasonal_factor'
    ]
    
    # Prepare feature matrix
    X = features_df[ml_features].fillna(0)
    
    # Load trained models (in production, from model registry)
    try:
        ltv_model = load_ltv_model()
        confidence_model = load_confidence_model()
        
        # Generate predictions
        ltv_predictions = ltv_model.predict(X)
        confidence_scores = confidence_model.predict_proba(X)[:, 1]
        
    except Exception as e:
        logger.warning(f"ML model loading failed: {e}. Using fallback.")
        # Fallback to rule-based predictions
        ltv_predictions = generate_rule_based_ltv(features_df)
        confidence_scores = np.full(len(features_df), 0.6)  # Medium confidence
    
    # Combine predictions with customer data
    result_df = features_df.copy()
    result_df['predicted_ltv'] = ltv_predictions
    result_df['prediction_confidence'] = confidence_scores
    
    return result_df

def validate_and_adjust_predictions(predictions_df: pd.DataFrame) -> pd.DataFrame:
    """Apply business rules and validation to ML predictions."""
    
    df = predictions_df.copy()
    
    # Business rule validations
    
    # 1. LTV cannot exceed reasonable maximums based on segment
    segment_max_ltv = {
        'enterprise': 500000,
        'smb': 50000,
        'consumer': 5000
    }
    
    for segment, max_ltv in segment_max_ltv.items():
        mask = df['customer_segment'] == segment
        df.loc[mask, 'predicted_ltv'] = np.minimum(
            df.loc[mask, 'predicted_ltv'], max_ltv
        )
    
    # 2. Recently churned customers get reduced LTV
    recent_churn_mask = df['days_since_last_transaction'] > 180
    df.loc[recent_churn_mask, 'predicted_ltv'] *= 0.5
    df.loc[recent_churn_mask, 'prediction_confidence'] *= 0.7
    
    # 3. High-risk customers get conservative estimates
    high_risk_mask = df['churn_risk'] > 0.7
    df.loc[high_risk_mask, 'predicted_ltv'] *= 0.8
    
    # 4. Ensure minimum viable LTV for active customers
    active_mask = df['days_since_last_transaction'] <= 30
    df.loc[active_mask, 'predicted_ltv'] = np.maximum(
        df.loc[active_mask, 'predicted_ltv'], df.loc[active_mask, 'total_spend'] * 0.1
    )
    
    return df

def format_prediction_output(predictions_df: pd.DataFrame, prediction_date: str) -> pd.DataFrame:
    """Format predictions for SQLmesh output schema."""
    
    output_columns = [
        'customer_id',
        'predicted_ltv',
        'prediction_confidence',
        'engagement_score',
        'churn_risk',
        'customer_segment',
        'total_spend',
        'transaction_frequency'
    ]
    
    output_df = predictions_df[output_columns].copy()
    output_df['prediction_date'] = pd.to_datetime(prediction_date)
    output_df['model_version'] = '2.1.0'
    output_df['prediction_timestamp'] = pd.Timestamp.now()
    
    # Data quality validations
    output_df = output_df.dropna(subset=['customer_id', 'predicted_ltv'])
    output_df['predicted_ltv'] = output_df['predicted_ltv'].round(2)
    output_df['prediction_confidence'] = output_df['prediction_confidence'].round(3)
    
    return output_df
```

### Error Handling and Resilience

```python
class PythonModelExecutor:
    """Robust executor for Python-primary models with comprehensive error handling."""
    
    def __init__(self):
        self.retry_config = {
            'max_attempts': 3,
            'backoff_seconds': [1, 5, 15],
            'recoverable_errors': [ConnectionError, TimeoutError]
        }
        
        self.fallback_strategies = {
            'ml_model_failure': 'use_rule_based_predictions',
            'data_source_failure': 'use_cached_features',
            'memory_exhaustion': 'process_in_batches'
        }
    
    def execute_with_resilience(self, model_function, context, **kwargs):
        """Execute Python model with retry logic and fallback strategies."""
        
        for attempt in range(self.retry_config['max_attempts']):
            try:
                return model_function(context, **kwargs)
                
            except Exception as e:
                logger.warning(f"Attempt {attempt + 1} failed: {str(e)}")
                
                # Check if error is recoverable
                if attempt < self.retry_config['max_attempts'] - 1:
                    if any(isinstance(e, err_type) for err_type in self.retry_config['recoverable_errors']):
                        time.sleep(self.retry_config['backoff_seconds'][attempt])
                        continue
                
                # Apply fallback strategy
                fallback_result = self.apply_fallback_strategy(e, context, **kwargs)
                if fallback_result is not None:
                    logger.info(f"Fallback strategy successful for {type(e).__name__}")
                    return fallback_result
                
                # Re-raise if no fallback worked
                raise
    
    def apply_fallback_strategy(self, error, context, **kwargs):
        """Apply appropriate fallback strategy based on error type."""
        
        error_type = type(error).__name__
        
        if 'model' in str(error).lower():
            return self.fallback_rule_based_processing(context, **kwargs)
        elif 'memory' in str(error).lower():
            return self.fallback_batch_processing(context, **kwargs)
        elif 'connection' in str(error).lower():
            return self.fallback_cached_processing(context, **kwargs)
        
        return None
```

## Hybrid Workflow Pattern

### Pattern Overview
Balanced approach where SQL and Python work together as equal partners, with each handling the operations they're best suited for.

### Implementation Structure

```sql
-- Hybrid Model: Dynamic Feature Engineering with Real-time Scoring
MODEL (
    name analytics.real_time_personalization,
    kind INCREMENTAL,
    owner 'product-analytics@company.com',
    cron '@hourly',
    grain ['user_id', 'session_id', 'event_timestamp'],
    
    description '''
    Real-time personalization features combining SQL-based event processing
    with Python ML models for dynamic content recommendations.
    '''
);

-- SQL handles high-volume event processing
WITH session_events AS (
    SELECT 
        user_id,
        session_id,
        event_timestamp,
        event_type,
        page_url,
        product_id,
        
        -- Window functions for session analysis
        LAG(event_timestamp) OVER (
            PARTITION BY user_id, session_id 
            ORDER BY event_timestamp
        ) as prev_event_time,
        
        COUNT(*) OVER (
            PARTITION BY user_id, session_id
        ) as session_event_count
        
    FROM raw_events
    WHERE event_timestamp >= @start_time
      AND event_timestamp < @end_time
),

session_features AS (
    SELECT 
        user_id,
        session_id,
        MIN(event_timestamp) as session_start,
        MAX(event_timestamp) as session_end,
        COUNT(*) as total_events,
        COUNT(DISTINCT page_url) as pages_visited,
        COUNT(DISTINCT product_id) as products_viewed,
        
        -- Behavioral patterns
        COUNTIF(event_type = 'add_to_cart') as cart_additions,
        COUNTIF(event_type = 'purchase') as purchases,
        
        -- Engagement metrics
        AVG(
            TIMESTAMP_DIFF(
                event_timestamp, 
                prev_event_time, 
                SECOND
            )
        ) as avg_time_between_events
        
    FROM session_events
    WHERE prev_event_time IS NOT NULL
    GROUP BY user_id, session_id
),

-- Hybrid processing: Python for complex scoring, SQL for aggregation
scored_sessions AS (
    SELECT 
        *,
        
        -- Python function for ML-based scoring
        @python_engagement_score(
            total_events,
            pages_visited,
            products_viewed,
            cart_additions,
            avg_time_between_events,
            user_id  -- For personalized model selection
        ) as ml_engagement_score,
        
        -- SQL-based business rules
        CASE 
            WHEN purchases > 0 THEN 'converter'
            WHEN cart_additions > 0 THEN 'interested'
            WHEN pages_visited >= 5 THEN 'browsing'
            ELSE 'casual'
        END as session_type
        
    FROM session_features
)

-- Final hybrid output
SELECT 
    user_id,
    session_id,
    session_start,
    session_end,
    total_events,
    session_type,
    ml_engagement_score,
    
    -- Hybrid recommendation logic
    @python_content_recommendations(
        user_id,
        session_type,
        ml_engagement_score,
        products_viewed
    ) as recommended_content,
    
    -- SQL-based targeting flags
    CASE 
        WHEN ml_engagement_score > 0.8 AND session_type = 'interested' THEN true
        ELSE false
    END as show_premium_offer,
    
    CURRENT_TIMESTAMP() as processed_at
    
FROM scored_sessions;
```

### Performance Monitoring and Optimization

```python
class HybridModelMonitor:
    """Monitor performance of hybrid SQL/Python models."""
    
    def __init__(self):
        self.performance_metrics = {
            'sql_execution_time': [],
            'python_function_time': [],
            'total_model_time': [],
            'row_processing_rate': [],
            'memory_usage_mb': []
        }
    
    def monitor_execution(self, model_name: str):
        """Monitor and log performance metrics during execution."""
        
        def decorator(func):
            def wrapper(*args, **kwargs):
                start_time = time.time()
                start_memory = self.get_memory_usage()
                
                try:
                    result = func(*args, **kwargs)
                    
                    end_time = time.time()
                    end_memory = self.get_memory_usage()
                    
                    # Log performance metrics
                    execution_time = end_time - start_time
                    memory_delta = end_memory - start_memory
                    row_count = len(result) if hasattr(result, '__len__') else 0
                    
                    self.log_performance_metrics(
                        model_name=model_name,
                        execution_time=execution_time,
                        memory_usage=memory_delta,
                        row_count=row_count
                    )
                    
                    return result
                    
                except Exception as e:
                    self.log_execution_error(model_name, str(e))
                    raise
            
            return wrapper
        return decorator
    
    def analyze_performance_trends(self, model_name: str, days: int = 7) -> Dict:
        """Analyze performance trends for optimization opportunities."""
        
        metrics = self.get_historical_metrics(model_name, days)
        
        analysis = {
            'avg_execution_time': np.mean(metrics['execution_times']),
            'p95_execution_time': np.percentile(metrics['execution_times'], 95),
            'memory_trend': self.calculate_trend(metrics['memory_usage']),
            'throughput_trend': self.calculate_trend(metrics['row_processing_rates']),
            'optimization_recommendations': []
        }
        
        # Generate optimization recommendations
        if analysis['avg_execution_time'] > 300:  # 5 minutes
            analysis['optimization_recommendations'].append(
                "Consider implementing incremental processing or data partitioning"
            )
        
        if analysis['memory_trend'] == 'increasing':
            analysis['optimization_recommendations'].append(
                "Memory usage trending upward - investigate potential memory leaks"
            )
        
        return analysis
```

## Testing and Validation Patterns

### Unit Testing Framework

```python
import pytest
import pandas as pd
from unittest.mock import Mock, patch
from sqlmesh.core.test import ModelTest

class TestMixedLanguageModels:
    """Test framework for mixed-language SQLmesh models."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.sample_customer_data = pd.DataFrame({
            'customer_id': ['C001', 'C002', 'C003'],
            'total_spend': [1000.0, 5000.0, 200.0],
            'transaction_count': [10, 50, 3],
            'account_tenure_days': [365, 730, 90]
        })
        
        self.expected_schema = [
            'customer_id', 'predicted_ltv', 'prediction_confidence',
            'prediction_date', 'model_version'
        ]
    
    def test_python_function_output_format(self):
        """Test that Python functions return expected data types."""
        
        # Test risk scoring function
        transaction_details = [
            {'amount': 100.0, 'merchant_category': 'grocery', 'transaction_time': '2024-01-01 10:00:00'},
            {'amount': 50.0, 'merchant_category': 'gas', 'transaction_time': '2024-01-01 15:00:00'}
        ]
        
        risk_score = python_risk_score(transaction_details, 150.0, 2)
        
        assert isinstance(risk_score, float)
        assert 0.0 <= risk_score <= 1.0
    
    def test_feature_engineering_consistency(self):
        """Test that feature engineering produces consistent results."""
        
        # Test with sample data
        features = engineer_ltv_features(self.sample_customer_data)
        
        # Validate feature engineering consistency
        assert 'engagement_score' in features.columns
        assert 'transaction_frequency' in features.columns
        assert all(features['engagement_score'] >= 0)
        assert all(features['engagement_score'] <= 1)
    
    def test_sql_python_data_consistency(self):
        """Test data consistency between SQL and Python processing."""
        
        # Mock SQL execution context
        mock_context = Mock()
        mock_context.engine.execute.return_value.to_pandas.return_value = self.sample_customer_data
        
        # Test data extraction
        features = extract_customer_features(mock_context, '2024-01-01', '2024-01-31')
        
        # Validate data consistency
        assert len(features) == len(self.sample_customer_data)
        assert all(col in features.columns for col in self.sample_customer_data.columns)
    
    def test_error_handling_resilience(self):
        """Test error handling and fallback mechanisms."""
        
        # Test with invalid input
        with patch('__main__.load_ltv_model', side_effect=Exception("Model not found")):
            predictions = generate_ltv_predictions(self.sample_customer_data)
            
            # Should fallback gracefully
            assert 'predicted_ltv' in predictions.columns
            assert len(predictions) == len(self.sample_customer_data)
    
    def test_performance_requirements(self):
        """Test that models meet performance requirements."""
        
        import time
        
        # Test with larger dataset
        large_dataset = pd.concat([self.sample_customer_data] * 1000, ignore_index=True)
        large_dataset['customer_id'] = large_dataset.index.astype(str)
        
        start_time = time.time()
        features = engineer_ltv_features(large_dataset)
        execution_time = time.time() - start_time
        
        # Should process 3000 records in under 10 seconds
        assert execution_time < 10.0
        assert len(features) == len(large_dataset)

class TestHybridModelIntegration:
    """Integration tests for hybrid SQL/Python models."""
    
    def test_sql_python_integration(self):
        """Test SQL and Python integration points."""
        
        # Test that Python functions can be called from SQL
        # This would typically use SQLmesh testing framework
        
        model_test = ModelTest(
            model_name="analytics.customer_ltv_prediction",
            inputs={
                "raw_transactions": [
                    {"customer_id": "C001", "amount": 100.0, "transaction_date": "2024-01-01"},
                    {"customer_id": "C001", "amount": 150.0, "transaction_date": "2024-01-02"},
                ],
                "dim_customers": [
                    {"customer_id": "C001", "age_group": "25-34", "customer_segment": "consumer"}
                ]
            },
            expected_outputs=[
                {"customer_id": "C001", "predicted_ltv": pytest.approx(500.0, rel=0.1)}
            ]
        )
        
        # Execute test
        assert model_test.run()
```

## Best Practices and Guidelines

### Development Guidelines

```yaml
mixed_language_best_practices:
  architecture_decisions:
    - "Use SQL for bulk data processing and aggregations"
    - "Use Python for complex business logic and ML"
    - "Minimize data transfer between SQL and Python"
    - "Cache expensive Python operations"
    
  performance_optimization:
    - "Process data in SQL before Python when possible"
    - "Use vectorized operations in Python"
    - "Implement proper error handling and fallbacks"
    - "Monitor memory usage and execution time"
    
  maintainability:
    - "Document SQL-Python interaction points clearly"
    - "Use consistent naming conventions across languages"
    - "Implement comprehensive testing for both languages"
    - "Version control Python dependencies explicitly"
    
  debugging_strategies:
    - "Log intermediate results for troubleshooting"
    - "Use consistent error handling patterns"
    - "Implement data validation at language boundaries"
    - "Provide fallback mechanisms for production resilience"
```

### Code Organization Standards

```
mixed_language_project_structure:
  models/
    analytics/
      customer_ltv_prediction.py        # Python-primary model
      customer_risk_scoring.sql         # SQL-primary with Python UDFs
      real_time_personalization.sql     # Hybrid model
      
  python/
    shared/
      feature_engineering.py           # Reusable feature functions
      model_loading.py                 # ML model management
      data_validation.py               # Cross-language validation
      
    models/
      ltv/
        predictor.py                   # LTV-specific logic
        features.py                    # LTV feature engineering
        
  sql/
    udfs/
      risk_scoring_functions.sql       # SQL UDF definitions
      feature_extraction.sql           # SQL feature functions
      
  tests/
    unit/
      test_python_functions.py         # Python unit tests
      test_sql_logic.sql              # SQL unit tests
      
    integration/
      test_mixed_models.py             # End-to-end integration tests
```

This comprehensive guide provides the foundation for implementing robust, maintainable, and performant mixed-language models in SQLmesh environments.