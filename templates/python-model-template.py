"""
SQLmesh Python Model Template

This template provides a standardized structure for implementing Python-based
SQLmesh models with best practices for performance, error handling, testing,
and maintainability.

Usage:
    1. Copy this template for new Python models
    2. Replace placeholder values with actual implementation
    3. Follow the established patterns for consistency
    4. Add model-specific business logic in designated sections
"""

import logging
import time
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union, Tuple
import pandas as pd
import numpy as np
from dataclasses import dataclass
from abc import ABC, abstractmethod

# SQLmesh imports
import sqlmesh
from sqlmesh import ExecutionContext, ModelKind
from sqlmesh.core.model import python_model

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ModelConfig:
    """Configuration class for model parameters."""
    
    # Model metadata
    model_name: str = "analytics.template_model"
    model_owner: str = "data-engineering@company.com"
    model_description: str = "Template model for SQLmesh Python implementations"
    
    # Execution parameters
    batch_size: int = 10000
    max_retries: int = 3
    timeout_seconds: int = 1800  # 30 minutes
    
    # Data quality thresholds
    min_completeness_rate: float = 0.95
    max_error_rate: float = 0.01
    min_expected_rows: int = 100
    
    # Performance thresholds
    max_memory_mb: int = 8192
    max_execution_minutes: int = 30
    target_rows_per_second: int = 1000


class DataQualityValidator:
    """Validate data quality at model boundaries."""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        
    def validate_input_data(self, df: pd.DataFrame, data_source: str) -> Tuple[bool, List[str]]:
        """Validate input data quality and return issues found."""
        issues = []
        
        # Check for minimum row count
        if len(df) < self.config.min_expected_rows:
            issues.append(f"{data_source}: Row count {len(df)} below minimum {self.config.min_expected_rows}")
        
        # Check for completeness on critical columns
        critical_columns = self._get_critical_columns(data_source)
        for col in critical_columns:
            if col in df.columns:
                null_rate = df[col].isnull().mean()
                if null_rate > (1 - self.config.min_completeness_rate):
                    issues.append(f"{data_source}.{col}: Null rate {null_rate:.2%} exceeds threshold")
        
        # Check for duplicate primary keys
        pk_columns = self._get_primary_key_columns(data_source)
        if pk_columns and all(col in df.columns for col in pk_columns):
            duplicate_count = df[pk_columns].duplicated().sum()
            if duplicate_count > 0:
                issues.append(f"{data_source}: {duplicate_count} duplicate primary keys found")
        
        # Data type validation
        type_issues = self._validate_data_types(df, data_source)
        issues.extend(type_issues)
        
        return len(issues) == 0, issues
    
    def validate_output_data(self, df: pd.DataFrame) -> Tuple[bool, List[str]]:
        """Validate output data quality before returning results."""
        issues = []
        
        # Required columns check
        required_columns = self._get_required_output_columns()
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            issues.append(f"Missing required output columns: {missing_columns}")
        
        # Data range validation
        range_issues = self._validate_output_ranges(df)
        issues.extend(range_issues)
        
        # Business rule validation
        business_issues = self._validate_business_rules(df)
        issues.extend(business_issues)
        
        return len(issues) == 0, issues
    
    def _get_critical_columns(self, data_source: str) -> List[str]:
        """Get critical columns that must not be null for each data source."""
        critical_columns_map = {
            'customers': ['customer_id', 'signup_date'],
            'transactions': ['transaction_id', 'customer_id', 'amount', 'transaction_date'],
            'products': ['product_id', 'product_name', 'category']
        }
        return critical_columns_map.get(data_source, [])
    
    def _get_primary_key_columns(self, data_source: str) -> List[str]:
        """Get primary key columns for each data source."""
        pk_columns_map = {
            'customers': ['customer_id'],
            'transactions': ['transaction_id'],
            'products': ['product_id']
        }
        return pk_columns_map.get(data_source, [])
    
    def _get_required_output_columns(self) -> List[str]:
        """Get required columns for output data."""
        # Override in specific model implementations
        return ['id', 'created_at']
    
    def _validate_data_types(self, df: pd.DataFrame, data_source: str) -> List[str]:
        """Validate data types for each column."""
        issues = []
        
        # Define expected data types per source
        expected_types = {
            'customers': {
                'customer_id': 'object',
                'signup_date': 'datetime64[ns]',
                'age': 'int64'
            },
            'transactions': {
                'transaction_id': 'object',
                'amount': 'float64',
                'transaction_date': 'datetime64[ns]'
            }
        }
        
        source_types = expected_types.get(data_source, {})
        for col, expected_type in source_types.items():
            if col in df.columns:
                actual_type = str(df[col].dtype)
                if not self._types_compatible(actual_type, expected_type):
                    issues.append(f"{data_source}.{col}: Expected {expected_type}, got {actual_type}")
        
        return issues
    
    def _types_compatible(self, actual: str, expected: str) -> bool:
        """Check if data types are compatible."""
        # Simplified type compatibility check
        if expected == actual:
            return True
        
        # Allow some flexibility for numeric types
        numeric_types = ['int64', 'float64', 'int32', 'float32']
        if expected in numeric_types and actual in numeric_types:
            return True
        
        return False
    
    def _validate_output_ranges(self, df: pd.DataFrame) -> List[str]:
        """Validate that output values are within expected ranges."""
        issues = []
        
        # Override in specific implementations with business-specific validations
        # Example:
        # if 'score' in df.columns:
        #     out_of_range = ((df['score'] < 0) | (df['score'] > 1)).sum()
        #     if out_of_range > 0:
        #         issues.append(f"Score values out of range [0,1]: {out_of_range} records")
        
        return issues
    
    def _validate_business_rules(self, df: pd.DataFrame) -> List[str]:
        """Validate business-specific rules."""
        issues = []
        
        # Override in specific implementations with business-specific validations
        # Example:
        # if 'customer_tier' in df.columns:
        #     invalid_tiers = ~df['customer_tier'].isin(['bronze', 'silver', 'gold', 'platinum'])
        #     if invalid_tiers.sum() > 0:
        #         issues.append(f"Invalid customer tiers: {invalid_tiers.sum()} records")
        
        return issues


class PerformanceMonitor:
    """Monitor model performance and resource usage."""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.start_time = None
        self.start_memory = None
        
    def start_monitoring(self):
        """Start performance monitoring."""
        self.start_time = time.time()
        self.start_memory = self._get_memory_usage()
        logger.info("Performance monitoring started")
    
    def check_performance_thresholds(self, current_rows: int = 0) -> List[str]:
        """Check if performance is within acceptable thresholds."""
        warnings = []
        
        if self.start_time:
            elapsed_minutes = (time.time() - self.start_time) / 60
            if elapsed_minutes > self.config.max_execution_minutes:
                warnings.append(f"Execution time {elapsed_minutes:.1f}m exceeds limit {self.config.max_execution_minutes}m")
        
        current_memory = self._get_memory_usage()
        if current_memory > self.config.max_memory_mb:
            warnings.append(f"Memory usage {current_memory}MB exceeds limit {self.config.max_memory_mb}MB")
        
        if current_rows > 0 and self.start_time:
            elapsed_seconds = time.time() - self.start_time
            rows_per_second = current_rows / elapsed_seconds if elapsed_seconds > 0 else 0
            if rows_per_second < self.config.target_rows_per_second:
                warnings.append(f"Processing rate {rows_per_second:.0f} rows/sec below target {self.config.target_rows_per_second}")
        
        return warnings
    
    def get_performance_summary(self, total_rows: int = 0) -> Dict[str, Any]:
        """Get performance summary for logging."""
        if not self.start_time:
            return {}
        
        elapsed_time = time.time() - self.start_time
        current_memory = self._get_memory_usage()
        memory_delta = current_memory - self.start_memory if self.start_memory else 0
        
        return {
            'execution_time_seconds': elapsed_time,
            'execution_time_minutes': elapsed_time / 60,
            'memory_usage_mb': current_memory,
            'memory_delta_mb': memory_delta,
            'total_rows_processed': total_rows,
            'rows_per_second': total_rows / elapsed_time if elapsed_time > 0 else 0
        }
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB."""
        try:
            import psutil
            process = psutil.Process()
            return process.memory_info().rss / 1024 / 1024
        except ImportError:
            logger.warning("psutil not available for memory monitoring")
            return 0.0


class RetryHandler:
    """Handle retries with exponential backoff."""
    
    def __init__(self, max_retries: int = 3, base_delay: float = 1.0):
        self.max_retries = max_retries
        self.base_delay = base_delay
    
    def execute_with_retry(self, func, *args, **kwargs):
        """Execute function with retry logic."""
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if attempt < self.max_retries:
                    delay = self.base_delay * (2 ** attempt)
                    logger.warning(f"Attempt {attempt + 1} failed: {str(e)}. Retrying in {delay}s...")
                    time.sleep(delay)
                else:
                    logger.error(f"All {self.max_retries + 1} attempts failed")
        
        raise last_exception


class DataLoader:
    """Handle data loading from various sources."""
    
    def __init__(self, context: ExecutionContext, config: ModelConfig):
        self.context = context
        self.config = config
        self.retry_handler = RetryHandler(config.max_retries)
    
    def load_data_with_sql(self, query: str, query_name: str = "query") -> pd.DataFrame:
        """Load data using SQL query with error handling."""
        
        def _execute_query():
            logger.info(f"Executing {query_name}")
            result = self.context.engine.execute(query)
            df = result.to_pandas()
            logger.info(f"{query_name} returned {len(df)} rows")
            return df
        
        try:
            return self.retry_handler.execute_with_retry(_execute_query)
        except Exception as e:
            logger.error(f"Failed to execute {query_name}: {str(e)}")
            logger.debug(f"Query: {query}")
            raise
    
    def load_batch_data(self, query_template: str, batch_column: str, batch_values: List[Any]) -> pd.DataFrame:
        """Load data in batches to manage memory usage."""
        
        all_data = []
        
        for i in range(0, len(batch_values), self.config.batch_size):
            batch = batch_values[i:i + self.config.batch_size]
            
            # Format batch values for SQL IN clause
            if isinstance(batch[0], str):
                batch_str = "', '".join(batch)
                batch_clause = f"'{batch_str}'"
            else:
                batch_clause = ", ".join(str(v) for v in batch)
            
            batch_query = query_template.format(
                batch_column=batch_column,
                batch_values=batch_clause
            )
            
            batch_data = self.load_data_with_sql(batch_query, f"batch_{i//self.config.batch_size + 1}")
            all_data.append(batch_data)
            
            logger.info(f"Loaded batch {i//self.config.batch_size + 1}/{len(batch_values)//self.config.batch_size + 1}")
        
        if all_data:
            return pd.concat(all_data, ignore_index=True)
        else:
            return pd.DataFrame()


class ModelTemplate(ABC):
    """Abstract base class for SQLmesh Python models."""
    
    def __init__(self, config: ModelConfig):
        self.config = config
        self.validator = DataQualityValidator(config)
        self.monitor = PerformanceMonitor(config)
        
    @abstractmethod
    def extract_data(self, context: ExecutionContext, **kwargs) -> Dict[str, pd.DataFrame]:
        """Extract data from source systems."""
        pass
    
    @abstractmethod
    def transform_data(self, data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Transform data using business logic."""
        pass
    
    @abstractmethod
    def validate_output(self, output_data: pd.DataFrame) -> pd.DataFrame:
        """Validate and clean output data."""
        pass
    
    def execute(self, context: ExecutionContext, **kwargs) -> pd.DataFrame:
        """Main execution method following template pattern."""
        
        self.monitor.start_monitoring()
        logger.info(f"Starting execution of {self.config.model_name}")
        
        try:
            # Step 1: Extract data
            logger.info("Step 1: Extracting data")
            raw_data = self.extract_data(context, **kwargs)
            
            # Step 2: Validate input data
            logger.info("Step 2: Validating input data")
            self._validate_input_data(raw_data)
            
            # Step 3: Transform data
            logger.info("Step 3: Transforming data")
            transformed_data = self.transform_data(raw_data)
            
            # Step 4: Validate output
            logger.info("Step 4: Validating output")
            output_data = self.validate_output(transformed_data)
            
            # Step 5: Performance summary
            performance = self.monitor.get_performance_summary(len(output_data))
            logger.info(f"Execution completed successfully: {performance}")
            
            return output_data
            
        except Exception as e:
            logger.error(f"Model execution failed: {str(e)}")
            performance = self.monitor.get_performance_summary()
            logger.error(f"Performance at failure: {performance}")
            raise
    
    def _validate_input_data(self, data: Dict[str, pd.DataFrame]):
        """Validate all input data sources."""
        for source_name, df in data.items():
            is_valid, issues = self.validator.validate_input_data(df, source_name)
            if not is_valid:
                error_msg = f"Input validation failed for {source_name}: {'; '.join(issues)}"
                logger.error(error_msg)
                raise ValueError(error_msg)
            else:
                logger.info(f"Input validation passed for {source_name}")


# Example implementation of the template
class CustomerAnalyticsModel(ModelTemplate):
    """Example implementation for customer analytics."""
    
    def extract_data(self, context: ExecutionContext, **kwargs) -> Dict[str, pd.DataFrame]:
        """Extract customer and transaction data."""
        
        # Get date parameters
        start_date = kwargs.get('start_date', context.start_date)
        end_date = kwargs.get('end_date', context.end_date)
        
        loader = DataLoader(context, self.config)
        
        # Load customer data
        customer_query = """
        SELECT 
            customer_id,
            email,
            signup_date,
            customer_segment,
            age_group,
            geographic_region
        FROM dim_customers
        WHERE is_active = true
        """
        
        customers = loader.load_data_with_sql(customer_query, "customer_data")
        
        # Load transaction data
        transaction_query = f"""
        SELECT 
            customer_id,
            transaction_id,
            transaction_date,
            amount,
            merchant_category,
            payment_method
        FROM fact_transactions
        WHERE transaction_date >= '{start_date}'
          AND transaction_date < '{end_date}'
          AND status = 'completed'
        """
        
        transactions = loader.load_data_with_sql(transaction_query, "transaction_data")
        
        return {
            'customers': customers,
            'transactions': transactions
        }
    
    def transform_data(self, data: Dict[str, pd.DataFrame]) -> pd.DataFrame:
        """Transform customer and transaction data into analytics features."""
        
        customers = data['customers']
        transactions = data['transactions']
        
        # Aggregate transaction metrics
        transaction_metrics = transactions.groupby('customer_id').agg({
            'transaction_id': 'count',
            'amount': ['sum', 'mean', 'std'],
            'merchant_category': 'nunique',
            'transaction_date': ['min', 'max']
        }).round(2)
        
        # Flatten column names
        transaction_metrics.columns = [
            'transaction_count',
            'total_spend',
            'avg_transaction',
            'spend_volatility',
            'category_diversity',
            'first_transaction',
            'last_transaction'
        ]
        
        transaction_metrics = transaction_metrics.reset_index()
        
        # Calculate derived metrics
        transaction_metrics['days_active'] = (
            pd.to_datetime(transaction_metrics['last_transaction']) - 
            pd.to_datetime(transaction_metrics['first_transaction'])
        ).dt.days + 1
        
        transaction_metrics['spend_per_day'] = (
            transaction_metrics['total_spend'] / transaction_metrics['days_active']
        ).round(2)
        
        # Merge with customer data
        result = customers.merge(
            transaction_metrics,
            on='customer_id',
            how='left'
        )
        
        # Fill missing values for customers with no transactions
        numeric_cols = ['transaction_count', 'total_spend', 'avg_transaction', 
                       'spend_volatility', 'category_diversity', 'days_active', 'spend_per_day']
        result[numeric_cols] = result[numeric_cols].fillna(0)
        
        # Add calculated features
        result['customer_value_tier'] = self._calculate_value_tier(result)
        result['engagement_score'] = self._calculate_engagement_score(result)
        
        # Add metadata
        result['model_version'] = '1.0.0'
        result['processed_at'] = pd.Timestamp.now()
        
        return result
    
    def validate_output(self, output_data: pd.DataFrame) -> pd.DataFrame:
        """Validate and clean output data."""
        
        # Standard validation
        is_valid, issues = self.validator.validate_output_data(output_data)
        if not is_valid:
            logger.warning(f"Output validation issues: {'; '.join(issues)}")
        
        # Business-specific validations
        output_data = self._apply_business_validations(output_data)
        
        # Ensure required columns exist
        required_columns = [
            'customer_id', 'customer_segment', 'total_spend',
            'transaction_count', 'customer_value_tier', 'engagement_score'
        ]
        
        missing_columns = [col for col in required_columns if col not in output_data.columns]
        if missing_columns:
            raise ValueError(f"Missing required output columns: {missing_columns}")
        
        # Sort output for consistency
        output_data = output_data.sort_values(['customer_value_tier', 'total_spend'], ascending=[False, False])
        
        logger.info(f"Output validation completed: {len(output_data)} records")
        return output_data
    
    def _calculate_value_tier(self, df: pd.DataFrame) -> pd.Series:
        """Calculate customer value tier based on spend and activity."""
        
        conditions = [
            (df['total_spend'] >= 10000) & (df['transaction_count'] >= 50),
            (df['total_spend'] >= 5000) & (df['transaction_count'] >= 25),
            (df['total_spend'] >= 1000) & (df['transaction_count'] >= 10),
            df['total_spend'] > 0
        ]
        
        choices = ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE']
        
        return pd.Series(
            np.select(conditions, choices, default='INACTIVE'),
            index=df.index
        )
    
    def _calculate_engagement_score(self, df: pd.DataFrame) -> pd.Series:
        """Calculate customer engagement score (0-1)."""
        
        # Normalize features
        spend_score = np.clip(df['total_spend'] / 10000, 0, 1)
        frequency_score = np.clip(df['transaction_count'] / 100, 0, 1)
        diversity_score = np.clip(df['category_diversity'] / 10, 0, 1)
        
        # Weighted engagement score
        engagement = (
            spend_score * 0.4 +
            frequency_score * 0.4 +
            diversity_score * 0.2
        ).round(3)
        
        return engagement
    
    def _apply_business_validations(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply business-specific validation rules."""
        
        # Remove customers with negative spend (data quality issue)
        df = df[df['total_spend'] >= 0]
        
        # Cap extreme values
        df['total_spend'] = np.clip(df['total_spend'], 0, 1000000)  # Cap at $1M
        df['engagement_score'] = np.clip(df['engagement_score'], 0, 1)
        
        return df


# SQLmesh model definition using the template
@python_model(
    name="analytics.customer_analytics_template",
    kind=ModelKind.INCREMENTAL,
    owner="data-engineering@company.com",
    cron="@daily",
    grain=["customer_id"],
    description="""
    Template-based customer analytics model demonstrating best practices
    for Python SQLmesh models including error handling, validation, and monitoring.
    """
)
def customer_analytics_template(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Main entry point for SQLmesh Python model using template pattern.
    
    Args:
        context: SQLmesh execution context
        **kwargs: Additional parameters including start_date, end_date
    
    Returns:
        DataFrame with customer analytics features
    """
    
    # Initialize model configuration
    config = ModelConfig(
        model_name="analytics.customer_analytics_template",
        batch_size=5000,
        max_retries=2,
        min_expected_rows=1000,
        max_execution_minutes=15
    )
    
    # Create and execute model
    model = CustomerAnalyticsModel(config)
    return model.execute(context, **kwargs)


# Utility functions for common operations
def safe_divide(numerator: pd.Series, denominator: pd.Series, default_value: float = 0.0) -> pd.Series:
    """Safely divide two series, handling division by zero."""
    return np.where(denominator != 0, numerator / denominator, default_value)


def normalize_column(series: pd.Series, method: str = 'min_max') -> pd.Series:
    """Normalize a series using specified method."""
    
    if method == 'min_max':
        min_val = series.min()
        max_val = series.max()
        if max_val > min_val:
            return (series - min_val) / (max_val - min_val)
        else:
            return pd.Series(0.5, index=series.index)
    
    elif method == 'z_score':
        mean_val = series.mean()
        std_val = series.std()
        if std_val > 0:
            return (series - mean_val) / std_val
        else:
            return pd.Series(0.0, index=series.index)
    
    else:
        raise ValueError(f"Unknown normalization method: {method}")


def calculate_percentile_rank(series: pd.Series) -> pd.Series:
    """Calculate percentile rank for each value in series."""
    return series.rank(pct=True)


def create_time_features(date_column: pd.Series) -> pd.DataFrame:
    """Create time-based features from date column."""
    
    df = pd.DataFrame(index=date_column.index)
    dt = pd.to_datetime(date_column)
    
    df['year'] = dt.dt.year
    df['month'] = dt.dt.month
    df['day'] = dt.dt.day
    df['dayofweek'] = dt.dt.dayofweek
    df['quarter'] = dt.dt.quarter
    df['is_weekend'] = dt.dt.dayofweek.isin([5, 6])
    df['is_month_start'] = dt.dt.is_month_start
    df['is_month_end'] = dt.dt.is_month_end
    
    return df


# Testing utilities
def create_test_data(n_customers: int = 1000, n_transactions: int = 5000) -> Dict[str, pd.DataFrame]:
    """Create synthetic test data for model development."""
    
    np.random.seed(42)
    
    # Generate customer data
    customers = pd.DataFrame({
        'customer_id': [f'C{i:06d}' for i in range(1, n_customers + 1)],
        'email': [f'customer{i}@example.com' for i in range(1, n_customers + 1)],
        'signup_date': pd.date_range('2020-01-01', periods=n_customers, freq='D'),
        'customer_segment': np.random.choice(['enterprise', 'smb', 'consumer'], n_customers),
        'age_group': np.random.choice(['18-25', '26-35', '36-50', '51+'], n_customers),
        'geographic_region': np.random.choice(['north', 'south', 'east', 'west'], n_customers)
    })
    
    # Generate transaction data
    transactions = pd.DataFrame({
        'customer_id': np.random.choice(customers['customer_id'], n_transactions),
        'transaction_id': [f'T{i:08d}' for i in range(1, n_transactions + 1)],
        'transaction_date': pd.date_range('2023-01-01', periods=n_transactions, freq='H'),
        'amount': np.random.lognormal(4, 1, n_transactions).round(2),
        'merchant_category': np.random.choice(['grocery', 'gas', 'restaurant', 'retail'], n_transactions),
        'payment_method': np.random.choice(['credit', 'debit', 'cash'], n_transactions)
    })
    
    return {'customers': customers, 'transactions': transactions}


if __name__ == "__main__":
    # Example usage for testing
    
    # Create test data
    test_data = create_test_data(100, 500)
    print(f"Created test data: {len(test_data['customers'])} customers, {len(test_data['transactions'])} transactions")
    
    # Test model components
    config = ModelConfig(model_name="test_model", batch_size=100)
    
    # Test data validation
    validator = DataQualityValidator(config)
    is_valid, issues = validator.validate_input_data(test_data['customers'], 'customers')
    print(f"Customer data validation: {'PASSED' if is_valid else 'FAILED'}")
    if issues:
        print(f"Issues: {issues}")
    
    # Test model instantiation
    model = CustomerAnalyticsModel(config)
    print("Model instantiated successfully")
    
    # Test data transformation
    try:
        transformed = model.transform_data(test_data)
        print(f"Data transformation successful: {len(transformed)} records")
        print(f"Columns: {list(transformed.columns)}")
    except Exception as e:
        print(f"Data transformation failed: {str(e)}")