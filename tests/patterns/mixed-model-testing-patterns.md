# Mixed-Model Testing Patterns for SQLmesh

## Overview

This document establishes comprehensive testing patterns for SQLmesh models that combine SQL and Python components, ensuring reliability, maintainability, and performance across complex mixed-language transformation pipelines.

## Testing Architecture Framework

### Testing Pyramid for Mixed Models

```yaml
mixed_model_testing_pyramid:
  unit_tests:
    scope: "Individual functions and components"
    coverage_target: "90%+"
    execution_speed: "Fast (< 1s per test)"
    components:
      - "Python function validation"
      - "SQL query logic verification"
      - "Data transformation accuracy"
      - "Error handling robustness"
    
  integration_tests:
    scope: "SQL-Python interaction boundaries"
    coverage_target: "80%+"
    execution_speed: "Medium (1-10s per test)"
    components:
      - "Data passing between SQL and Python"
      - "Dependency coordination"
      - "Model orchestration workflows"
      - "Cross-language data consistency"
    
  end_to_end_tests:
    scope: "Complete model execution workflows"
    coverage_target: "70%+"
    execution_speed: "Slow (10s-5min per test)"
    components:
      - "Full pipeline execution"
      - "Performance benchmarks"
      - "Data quality validation"
      - "Production scenario simulation"
    
  property_based_tests:
    scope: "Invariant validation across data ranges"
    coverage_target: "Key business rules"
    execution_speed: "Variable (1s-1min per test)"
    components:
      - "Business rule consistency"
      - "Data constraint validation"
      - "Edge case discovery"
      - "Regression prevention"
```

### Test Environment Configuration

```python
import pytest
import pandas as pd
import numpy as np
from unittest.mock import Mock, patch, MagicMock
from sqlmesh.core.test import ModelTest
from sqlmesh import ExecutionContext
import tempfile
import os
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
import logging

# Configure test logging
logging.basicConfig(level=logging.DEBUG)
logger = logging.getLogger(__name__)

class MixedModelTestFramework:
    """Comprehensive testing framework for mixed SQL/Python SQLmesh models."""
    
    def __init__(self):
        self.test_data_dir = tempfile.mkdtemp()
        self.mock_context = self._create_mock_context()
        self.test_schemas = self._setup_test_schemas()
        self.sample_data = self._generate_sample_data()
    
    def _create_mock_context(self) -> Mock:
        """Create mock SQLmesh execution context for testing."""
        
        mock_context = Mock(spec=ExecutionContext)
        mock_context.start_date = datetime(2024, 1, 1)
        mock_context.end_date = datetime(2024, 1, 31)
        
        # Mock engine with configurable responses
        mock_engine = Mock()
        mock_context.engine = mock_engine
        
        return mock_context
    
    def _setup_test_schemas(self) -> Dict[str, List[Dict]]:
        """Define test data schemas for consistent testing."""
        
        return {
            'customers': [
                {'name': 'customer_id', 'type': 'string', 'nullable': False},
                {'name': 'email', 'type': 'string', 'nullable': False},
                {'name': 'signup_date', 'type': 'date', 'nullable': False},
                {'name': 'customer_segment', 'type': 'string', 'nullable': True},
                {'name': 'age_group', 'type': 'string', 'nullable': True},
                {'name': 'is_active', 'type': 'boolean', 'nullable': False}
            ],
            'transactions': [
                {'name': 'transaction_id', 'type': 'string', 'nullable': False},
                {'name': 'customer_id', 'type': 'string', 'nullable': False},
                {'name': 'transaction_date', 'type': 'datetime', 'nullable': False},
                {'name': 'amount', 'type': 'float', 'nullable': False},
                {'name': 'merchant_category', 'type': 'string', 'nullable': True},
                {'name': 'payment_method', 'type': 'string', 'nullable': True}
            ],
            'feature_engineering_output': [
                {'name': 'customer_id', 'type': 'string', 'nullable': False},
                {'name': 'engagement_score', 'type': 'float', 'nullable': True},
                {'name': 'ltv_prediction', 'type': 'float', 'nullable': True},
                {'name': 'processed_date', 'type': 'date', 'nullable': False}
            ]
        }
    
    def _generate_sample_data(self) -> Dict[str, pd.DataFrame]:
        """Generate consistent sample data for testing."""
        
        np.random.seed(42)  # Ensure reproducible tests
        
        # Generate sample customers
        customers = pd.DataFrame({
            'customer_id': [f'C{i:06d}' for i in range(1, 101)],
            'email': [f'customer{i}@example.com' for i in range(1, 101)],
            'signup_date': pd.date_range('2023-01-01', periods=100, freq='D'),
            'customer_segment': np.random.choice(['enterprise', 'smb', 'consumer'], 100),
            'age_group': np.random.choice(['18-25', '26-35', '36-50', '51+'], 100),
            'is_active': np.random.choice([True, False], 100, p=[0.8, 0.2])
        })
        
        # Generate sample transactions
        transaction_count = 500
        transactions = pd.DataFrame({
            'transaction_id': [f'T{i:08d}' for i in range(1, transaction_count + 1)],
            'customer_id': np.random.choice(customers['customer_id'], transaction_count),
            'transaction_date': pd.date_range('2024-01-01', periods=transaction_count, freq='H'),
            'amount': np.random.lognormal(4, 1, transaction_count).round(2),
            'merchant_category': np.random.choice(['grocery', 'gas', 'restaurant', 'retail'], transaction_count),
            'payment_method': np.random.choice(['credit', 'debit', 'cash'], transaction_count)
        })
        
        # Generate sample feature engineering output
        feature_output = pd.DataFrame({
            'customer_id': customers['customer_id'],
            'engagement_score': np.random.beta(2, 5, 100).round(3),
            'ltv_prediction': np.random.lognormal(6, 1, 100).round(2),
            'processed_date': pd.Timestamp('2024-01-31').date()
        })
        
        return {
            'customers': customers,
            'transactions': transactions,
            'feature_engineering_output': feature_output
        }
    
    def create_mock_query_result(self, data: pd.DataFrame) -> Mock:
        """Create mock query result object."""
        
        mock_result = Mock()
        mock_result.to_pandas.return_value = data
        mock_result.fetchone.return_value = {
            'row_count': len(data),
            'last_run_timestamp': datetime.now(),
            'status': 'SUCCESS'
        }
        
        return mock_result
    
    def assert_dataframe_schema(self, df: pd.DataFrame, expected_schema: List[Dict]):
        """Assert that DataFrame matches expected schema."""
        
        expected_columns = {col['name'] for col in expected_schema}
        actual_columns = set(df.columns)
        
        # Check for missing columns
        missing_columns = expected_columns - actual_columns
        if missing_columns:
            raise AssertionError(f"Missing columns: {missing_columns}")
        
        # Check for unexpected columns (warning, not error)
        extra_columns = actual_columns - expected_columns
        if extra_columns:
            logger.warning(f"Unexpected columns found: {extra_columns}")
        
        # Check data types (flexible matching)
        for col_def in expected_schema:
            col_name = col_def['name']
            expected_type = col_def['type']
            
            if col_name in df.columns:
                actual_dtype = str(df[col_name].dtype)
                if not self._types_compatible(actual_dtype, expected_type):
                    logger.warning(f"Type mismatch for {col_name}: expected {expected_type}, got {actual_dtype}")
    
    def _types_compatible(self, actual: str, expected: str) -> bool:
        """Check if data types are compatible."""
        
        type_mappings = {
            'string': ['object', 'string'],
            'float': ['float64', 'float32', 'int64', 'int32'],
            'boolean': ['bool', 'boolean'],
            'date': ['datetime64[ns]', 'object'],
            'datetime': ['datetime64[ns]', 'object']
        }
        
        compatible_types = type_mappings.get(expected, [expected])
        return any(compatible in actual for compatible in compatible_types)

# Global test framework instance
test_framework = MixedModelTestFramework()
```

## Unit Testing Patterns

### Python Function Testing

```python
class TestPythonModelFunctions:
    """Unit tests for Python functions used in mixed models."""
    
    def test_risk_scoring_function(self):
        """Test risk scoring function with various input scenarios."""
        
        from docs.patterns.mixed_language_model_workflows import python_risk_score
        
        # Test normal transaction pattern
        normal_transactions = [
            {'amount': 100.0, 'merchant_category': 'grocery', 'transaction_time': '2024-01-01 10:00:00', 'payment_method': 'credit'},
            {'amount': 50.0, 'merchant_category': 'gas', 'transaction_time': '2024-01-01 15:00:00', 'payment_method': 'credit'}
        ]
        
        risk_score = python_risk_score(normal_transactions, 150.0, 2)
        
        assert isinstance(risk_score, float)
        assert 0.0 <= risk_score <= 1.0
        
        # Test suspicious pattern (night transactions, high amounts)
        suspicious_transactions = [
            {'amount': 5000.0, 'merchant_category': 'cash_advance', 'transaction_time': '2024-01-01 02:00:00', 'payment_method': 'debit'},
            {'amount': 3000.0, 'merchant_category': 'cash_advance', 'transaction_time': '2024-01-01 03:00:00', 'payment_method': 'debit'}
        ]
        
        suspicious_score = python_risk_score(suspicious_transactions, 8000.0, 2)
        
        assert suspicious_score > risk_score  # Should have higher risk
        assert suspicious_score <= 1.0
    
    def test_risk_scoring_edge_cases(self):
        """Test risk scoring with edge cases and invalid inputs."""
        
        from docs.patterns.mixed_language_model_workflows import python_risk_score
        
        # Test empty transactions
        empty_score = python_risk_score([], 0.0, 0)
        assert empty_score == 0.5  # Should return neutral score
        
        # Test None input
        none_score = python_risk_score(None, 0.0, 0)
        assert none_score == 0.5
        
        # Test mismatched amounts (data consistency check)
        transactions = [{'amount': 100.0, 'merchant_category': 'grocery', 'transaction_time': '2024-01-01 10:00:00', 'payment_method': 'credit'}]
        
        with patch('docs.patterns.mixed_language_model_workflows.logger') as mock_logger:
            score = python_risk_score(transactions, 200.0, 1)  # Mismatched total
            mock_logger.warning.assert_called_once()  # Should log warning
            assert isinstance(score, float)
    
    def test_feature_engineering_functions(self):
        """Test feature engineering functions for consistency and accuracy."""
        
        from templates.python_model_template import calculate_engagement_score, normalize_column
        
        # Test engagement score calculation
        sample_data = test_framework.sample_data['customers']
        sample_data['transaction_frequency'] = np.random.uniform(0, 10, len(sample_data))
        sample_data['category_diversity'] = np.random.randint(1, 8, len(sample_data))
        sample_data['account_tenure_days'] = np.random.randint(30, 2000, len(sample_data))
        
        engagement_scores = calculate_engagement_score(sample_data)
        
        assert len(engagement_scores) == len(sample_data)
        assert all(0 <= score <= 1 for score in engagement_scores)
        assert not np.isnan(engagement_scores).any()
        
        # Test normalization function
        test_series = pd.Series([1, 2, 3, 4, 5])
        
        # Min-max normalization
        normalized_minmax = normalize_column(test_series, 'min_max')
        assert normalized_minmax.min() == 0.0
        assert normalized_minmax.max() == 1.0
        
        # Z-score normalization
        normalized_zscore = normalize_column(test_series, 'z_score')
        assert abs(normalized_zscore.mean()) < 1e-10  # Should be approximately zero
        assert abs(normalized_zscore.std() - 1.0) < 1e-10  # Should be approximately 1
    
    def test_data_validation_functions(self):
        """Test data quality validation functions."""
        
        from templates.python_model_template import DataQualityValidator, ModelConfig
        
        config = ModelConfig()
        validator = DataQualityValidator(config)
        
        # Test valid customer data
        valid_customers = test_framework.sample_data['customers']
        is_valid, issues = validator.validate_input_data(valid_customers, 'customers')
        
        assert is_valid is True
        assert len(issues) == 0
        
        # Test invalid customer data (missing required fields)
        invalid_customers = valid_customers.copy()
        invalid_customers.loc[0:5, 'customer_id'] = None  # Create null primary keys
        
        is_valid, issues = validator.validate_input_data(invalid_customers, 'customers')
        
        assert is_valid is False
        assert len(issues) > 0
        assert any('duplicate' in issue.lower() or 'null' in issue.lower() for issue in issues)
    
    def test_performance_monitoring(self):
        """Test performance monitoring functionality."""
        
        from templates.python_model_template import PerformanceMonitor, ModelConfig
        
        config = ModelConfig(max_execution_minutes=1, max_memory_mb=1000)
        monitor = PerformanceMonitor(config)
        
        # Test monitoring lifecycle
        monitor.start_monitoring()
        
        # Simulate some work
        import time
        time.sleep(0.1)
        
        # Check performance thresholds
        warnings = monitor.check_performance_thresholds(current_rows=100)
        assert isinstance(warnings, list)
        
        # Get performance summary
        summary = monitor.get_performance_summary(total_rows=100)
        assert 'execution_time_seconds' in summary
        assert 'memory_usage_mb' in summary
        assert summary['total_rows_processed'] == 100
```

### SQL Logic Testing

```python
class TestSQLLogic:
    """Unit tests for SQL logic components in mixed models."""
    
    def test_sql_aggregation_logic(self):
        """Test SQL aggregation logic with known inputs and outputs."""
        
        # Test transaction aggregation query
        test_transactions = test_framework.sample_data['transactions']
        
        # Simulate the SQL aggregation logic in Python for testing
        aggregated = test_transactions.groupby('customer_id').agg({
            'transaction_id': 'count',
            'amount': ['sum', 'mean', 'std'],
            'merchant_category': 'nunique'
        }).round(2)
        
        # Flatten column names to match SQL output
        aggregated.columns = [
            'transaction_count', 'total_spend', 'avg_transaction', 
            'spend_volatility', 'category_diversity'
        ]
        
        # Validate aggregation results
        assert len(aggregated) > 0
        assert all(aggregated['transaction_count'] > 0)
        assert all(aggregated['total_spend'] >= 0)
        assert all(aggregated['avg_transaction'] >= 0)
        assert all(aggregated['category_diversity'] >= 1)
    
    def test_sql_window_functions(self):
        """Test SQL window function logic."""
        
        test_transactions = test_framework.sample_data['transactions'].copy()
        test_transactions = test_transactions.sort_values(['customer_id', 'transaction_date'])
        
        # Simulate LAG window function
        test_transactions['prev_transaction_date'] = test_transactions.groupby('customer_id')['transaction_date'].shift(1)
        
        # Calculate time between transactions
        test_transactions['time_diff_hours'] = (
            test_transactions['transaction_date'] - test_transactions['prev_transaction_date']
        ).dt.total_seconds() / 3600
        
        # Validate window function results
        non_null_diffs = test_transactions['time_diff_hours'].dropna()
        assert all(non_null_diffs >= 0)  # Time differences should be positive
        
        # Check that first transaction per customer has null prev_transaction_date
        first_transactions = test_transactions.groupby('customer_id').first()
        assert all(pd.isna(first_transactions['prev_transaction_date']))
    
    def test_sql_join_logic(self):
        """Test SQL join logic and data consistency."""
        
        customers = test_framework.sample_data['customers']
        transactions = test_framework.sample_data['transactions']
        
        # Simulate INNER JOIN
        inner_join = customers.merge(transactions, on='customer_id', how='inner')
        
        # Validate join results
        assert len(inner_join) > 0
        assert len(inner_join) <= len(transactions)  # Should not exceed transaction count
        assert all(inner_join['customer_id'].isin(customers['customer_id']))
        
        # Simulate LEFT JOIN to preserve all customers
        left_join = customers.merge(transactions, on='customer_id', how='left')
        
        # Validate that all customers are preserved
        assert len(left_join) >= len(customers)
        assert set(left_join['customer_id'].unique()) == set(customers['customer_id'])
    
    def test_sql_conditional_logic(self):
        """Test SQL CASE statements and conditional logic."""
        
        customers = test_framework.sample_data['customers']
        transactions = test_framework.sample_data['transactions']
        
        # Calculate transaction metrics per customer
        customer_metrics = transactions.groupby('customer_id').agg({
            'transaction_id': 'count',
            'amount': 'sum'
        }).rename(columns={'transaction_id': 'transaction_count', 'amount': 'total_spend'})
        
        # Simulate SQL CASE logic for customer tiers
        def calculate_customer_tier(row):
            if row['total_spend'] >= 10000 and row['transaction_count'] >= 50:
                return 'PLATINUM'
            elif row['total_spend'] >= 5000 and row['transaction_count'] >= 25:
                return 'GOLD'
            elif row['total_spend'] >= 1000 and row['transaction_count'] >= 10:
                return 'SILVER'
            elif row['total_spend'] > 0:
                return 'BRONZE'
            else:
                return 'INACTIVE'
        
        customer_metrics['tier'] = customer_metrics.apply(calculate_customer_tier, axis=1)
        
        # Validate tier assignment logic
        assert all(customer_metrics['tier'].isin(['PLATINUM', 'GOLD', 'SILVER', 'BRONZE', 'INACTIVE']))
        
        # Validate tier consistency
        platinum_customers = customer_metrics[customer_metrics['tier'] == 'PLATINUM']
        if len(platinum_customers) > 0:
            assert all(platinum_customers['total_spend'] >= 10000)
            assert all(platinum_customers['transaction_count'] >= 50)
```

## Integration Testing Patterns

### SQL-Python Integration Tests

```python
class TestSQLPythonIntegration:
    """Integration tests for SQL and Python interaction boundaries."""
    
    def test_data_passing_sql_to_python(self):
        """Test data transfer from SQL queries to Python functions."""
        
        # Mock SQL execution to return test data
        mock_context = test_framework.mock_context
        mock_context.engine.execute.return_value = test_framework.create_mock_query_result(
            test_framework.sample_data['transactions']
        )
        
        # Test data loading function
        from templates.python_model_template import DataLoader, ModelConfig
        
        config = ModelConfig()
        loader = DataLoader(mock_context, config)
        
        query = "SELECT * FROM transactions WHERE transaction_date >= '2024-01-01'"
        result_df = loader.load_data_with_sql(query, "test_query")
        
        # Validate data transfer
        assert isinstance(result_df, pd.DataFrame)
        assert len(result_df) > 0
        assert 'transaction_id' in result_df.columns
        assert 'customer_id' in result_df.columns
        
        # Verify mock was called correctly
        mock_context.engine.execute.assert_called_once_with(query)
    
    def test_python_function_in_sql_context(self):
        """Test Python functions called from SQL queries."""
        
        # Test the risk scoring function as it would be called from SQL
        from docs.patterns.mixed_language_model_workflows import python_risk_score
        
        # Simulate SQL passing aggregated transaction data to Python function
        sql_aggregated_data = [
            {
                'amount': 150.0,
                'merchant_category': 'grocery',
                'transaction_time': '2024-01-01 10:00:00',
                'payment_method': 'credit'
            },
            {
                'amount': 75.0,
                'merchant_category': 'gas',
                'transaction_time': '2024-01-01 15:00:00',
                'payment_method': 'credit'
            }
        ]
        
        # Call Python function with SQL-formatted data
        risk_score = python_risk_score(sql_aggregated_data, 225.0, 2)
        
        # Validate that function handles SQL data format correctly
        assert isinstance(risk_score, (float, int))
        assert 0.0 <= risk_score <= 1.0
    
    def test_model_dependency_coordination(self):
        """Test coordination between dependent models."""
        
        from docs.patterns.model_dependency_coordination import DependencyCoordinator
        
        mock_context = test_framework.mock_context
        coordinator = DependencyCoordinator(mock_context)
        
        # Mock dependency status checks
        with patch.object(coordinator, '_check_dependency_status') as mock_check:
            mock_check.return_value = {
                'is_ready': True,
                'staleness_minutes': 15,
                'row_count': 1000,
                'reason': 'Success'
            }
            
            # Test dependency validation
            dependencies = ['model_a', 'model_b', 'model_c']
            validation_result = coordinator.validate_upstream_dependencies(
                dependencies, datetime.now()
            )
            
            assert validation_result['all_dependencies_ready'] is True
            assert len(validation_result['dependency_status']) == 3
            assert len(validation_result['validation_errors']) == 0
    
    def test_mixed_model_execution_workflow(self):
        """Test complete mixed model execution workflow."""
        
        from templates.python_model_template import CustomerAnalyticsModel, ModelConfig
        
        # Setup test configuration
        config = ModelConfig(
            model_name="test_customer_analytics",
            batch_size=100,
            min_expected_rows=10
        )
        
        model = CustomerAnalyticsModel(config)
        
        # Mock execution context
        mock_context = test_framework.mock_context
        
        # Mock data extraction
        with patch.object(model, 'extract_data') as mock_extract:
            mock_extract.return_value = {
                'customers': test_framework.sample_data['customers'],
                'transactions': test_framework.sample_data['transactions']
            }
            
            # Test data transformation
            transformed_data = model.transform_data(mock_extract.return_value)
            
            # Validate transformation results
            assert isinstance(transformed_data, pd.DataFrame)
            assert len(transformed_data) > 0
            assert 'customer_id' in transformed_data.columns
            assert 'customer_value_tier' in transformed_data.columns
            assert 'engagement_score' in transformed_data.columns
            
            # Test output validation
            validated_output = model.validate_output(transformed_data)
            
            assert isinstance(validated_output, pd.DataFrame)
            assert len(validated_output) > 0
    
    def test_error_propagation_across_boundaries(self):
        """Test error handling across SQL-Python boundaries."""
        
        from docs.patterns.model_dependency_coordination import DependencyCoordinator
        
        mock_context = test_framework.mock_context
        coordinator = DependencyCoordinator(mock_context)
        
        # Test SQL error propagation
        mock_context.engine.execute.side_effect = Exception("SQL connection failed")
        
        with pytest.raises(Exception) as excinfo:
            coordinator.load_dependency_data('failing_model')
        
        assert "SQL connection failed" in str(excinfo.value)
        
        # Test Python error handling
        from templates.python_model_template import python_risk_score
        
        # Test with invalid data structure
        invalid_data = "not_a_list"
        
        with pytest.raises(Exception):
            python_risk_score(invalid_data, 100.0, 1)
```

## End-to-End Testing Patterns

### Complete Pipeline Testing

```python
class TestEndToEndPipelines:
    """End-to-end tests for complete mixed model pipelines."""
    
    def test_customer_analytics_pipeline(self):
        """Test complete customer analytics pipeline from start to finish."""
        
        # Setup pipeline components
        from templates.python_model_template import customer_analytics_template
        
        mock_context = test_framework.mock_context
        
        # Mock all external dependencies
        with patch('templates.python_model_template.DataLoader') as mock_loader_class:
            mock_loader = Mock()
            mock_loader_class.return_value = mock_loader
            
            # Configure mock data loader responses
            mock_loader.load_data_with_sql.side_effect = [
                test_framework.sample_data['customers'],
                test_framework.sample_data['transactions']
            ]
            
            # Execute complete pipeline
            result = customer_analytics_template(
                mock_context,
                start_date='2024-01-01',
                end_date='2024-01-31'
            )
            
            # Validate end-to-end results
            assert isinstance(result, pd.DataFrame)
            assert len(result) > 0
            
            # Check required output columns
            required_columns = [
                'customer_id', 'customer_segment', 'total_spend',
                'transaction_count', 'customer_value_tier', 'engagement_score'
            ]
            
            for col in required_columns:
                assert col in result.columns, f"Missing required column: {col}"
            
            # Validate data quality
            assert result['customer_id'].notna().all()
            assert (result['total_spend'] >= 0).all()
            assert (result['transaction_count'] >= 0).all()
            assert result['engagement_score'].between(0, 1).all()
    
    def test_coordinated_model_execution(self):
        """Test coordinated execution of multiple dependent models."""
        
        from docs.patterns.model_dependency_coordination import coordinated_customer_analysis
        
        mock_context = test_framework.mock_context
        
        # Mock all dependency data
        dependency_data = {
            'raw_data.customer_demographics': test_framework.sample_data['customers'],
            'analytics.python_feature_engineering': test_framework.sample_data['feature_engineering_output'],
            'ml_models.churn_prediction': pd.DataFrame({
                'customer_id': test_framework.sample_data['customers']['customer_id'],
                'churn_probability': np.random.beta(2, 8, len(test_framework.sample_data['customers'])),
                'churn_tier': np.random.choice(['LOW', 'MEDIUM', 'HIGH'], len(test_framework.sample_data['customers']))
            }),
            'ml_models.ltv_prediction': pd.DataFrame({
                'customer_id': test_framework.sample_data['customers']['customer_id'],
                'predicted_ltv': np.random.lognormal(6, 1, len(test_framework.sample_data['customers'])),
                'prediction_confidence': np.random.beta(5, 2, len(test_framework.sample_data['customers']))
            }),
            'analytics.customer_segmentation': pd.DataFrame({
                'customer_id': test_framework.sample_data['customers']['customer_id'],
                'customer_segment': np.random.choice(['enterprise', 'smb', 'consumer'], len(test_framework.sample_data['customers'])),
                'segment_score': np.random.beta(3, 2, len(test_framework.sample_data['customers']))
            })
        }
        
        # Mock dependency coordinator
        with patch('docs.patterns.model_dependency_coordination.DependencyCoordinator') as mock_coordinator_class:
            mock_coordinator = Mock()
            mock_coordinator_class.return_value = mock_coordinator
            
            # Configure mock responses
            mock_coordinator.validate_upstream_dependencies.return_value = {
                'all_dependencies_ready': True,
                'dependency_status': {},
                'validation_errors': []
            }
            
            mock_coordinator.load_dependency_data.side_effect = lambda dep, **kwargs: dependency_data[dep]
            
            # Execute coordinated model
            result = coordinated_customer_analysis(
                mock_context,
                start_date='2024-01-01'
            )
            
            # Validate coordinated results
            assert isinstance(result, pd.DataFrame)
            assert len(result) > 0
            
            # Check that all data sources were integrated
            assert 'customer_id' in result.columns
            assert 'combined_risk_score' in result.columns
            assert 'customer_value_score' in result.columns
            assert 'dependency_metadata' in result.columns
    
    def test_performance_requirements(self):
        """Test that pipeline meets performance requirements."""
        
        import time
        from templates.python_model_template import CustomerAnalyticsModel, ModelConfig
        
        # Create larger test dataset
        large_customers = pd.concat([test_framework.sample_data['customers']] * 10, ignore_index=True)
        large_customers['customer_id'] = large_customers.index.astype(str)
        
        large_transactions = pd.concat([test_framework.sample_data['transactions']] * 10, ignore_index=True)
        large_transactions['customer_id'] = np.random.choice(large_customers['customer_id'], len(large_transactions))
        
        # Test performance with larger dataset
        config = ModelConfig(batch_size=1000, max_execution_minutes=5)
        model = CustomerAnalyticsModel(config)
        
        # Mock data extraction
        with patch.object(model, 'extract_data') as mock_extract:
            mock_extract.return_value = {
                'customers': large_customers,
                'transactions': large_transactions
            }
            
            # Measure execution time
            start_time = time.time()
            result = model.transform_data(mock_extract.return_value)
            execution_time = time.time() - start_time
            
            # Validate performance requirements
            assert execution_time < 60  # Should complete within 1 minute
            assert len(result) > 0
            
            # Check memory efficiency (basic validation)
            assert result.memory_usage(deep=True).sum() < 100 * 1024 * 1024  # Less than 100MB
    
    def test_data_quality_end_to_end(self):
        """Test data quality throughout the entire pipeline."""
        
        from templates.python_model_template import customer_analytics_template
        
        # Create test data with known quality issues
        dirty_customers = test_framework.sample_data['customers'].copy()
        dirty_customers.loc[0:2, 'customer_id'] = None  # Introduce null IDs
        dirty_customers.loc[5:7, 'email'] = 'invalid_email'  # Invalid emails
        
        dirty_transactions = test_framework.sample_data['transactions'].copy()
        dirty_transactions.loc[0:5, 'amount'] = -100  # Negative amounts
        dirty_transactions.loc[10:15, 'customer_id'] = 'INVALID_ID'  # Invalid customer references
        
        mock_context = test_framework.mock_context
        
        with patch('templates.python_model_template.DataLoader') as mock_loader_class:
            mock_loader = Mock()
            mock_loader_class.return_value = mock_loader
            
            mock_loader.load_data_with_sql.side_effect = [dirty_customers, dirty_transactions]
            
            # Execute pipeline with dirty data
            result = customer_analytics_template(mock_context)
            
            # Validate that data quality issues were handled
            assert len(result) > 0  # Pipeline should still produce results
            assert result['customer_id'].notna().all()  # No null customer IDs in output
            assert (result['total_spend'] >= 0).all()  # No negative spend values
```

## Property-Based Testing Patterns

### Business Rule Validation

```python
import hypothesis
from hypothesis import given, strategies as st
from hypothesis.extra.pandas import column, data_frames

class TestBusinessRuleProperties:
    """Property-based tests for business rule invariants."""
    
    @given(st.data())
    def test_engagement_score_properties(self, data):
        """Test engagement score calculation invariants."""
        
        from templates.python_model_template import calculate_engagement_score
        
        # Generate random customer data
        n_customers = data.draw(st.integers(min_value=10, max_value=100))
        
        customer_data = pd.DataFrame({
            'transaction_frequency': data.draw(st.lists(
                st.floats(min_value=0, max_value=100), min_size=n_customers, max_size=n_customers
            )),
            'category_diversity': data.draw(st.lists(
                st.integers(min_value=1, max_value=10), min_size=n_customers, max_size=n_customers
            )),
            'account_tenure_days': data.draw(st.lists(
                st.integers(min_value=1, max_value=3000), min_size=n_customers, max_size=n_customers
            ))
        })
        
        engagement_scores = calculate_engagement_score(customer_data)
        
        # Invariant: All engagement scores should be between 0 and 1
        assert all(0 <= score <= 1 for score in engagement_scores), "Engagement scores must be between 0 and 1"
        
        # Invariant: Higher transaction frequency should generally lead to higher engagement
        if len(customer_data) >= 2:
            high_freq_mask = customer_data['transaction_frequency'] > customer_data['transaction_frequency'].median()
            low_freq_mask = customer_data['transaction_frequency'] <= customer_data['transaction_frequency'].median()
            
            if high_freq_mask.any() and low_freq_mask.any():
                high_freq_avg = engagement_scores[high_freq_mask].mean()
                low_freq_avg = engagement_scores[low_freq_mask].mean()
                
                # This is a tendency, not a strict rule due to other factors
                assert high_freq_avg >= low_freq_avg - 0.1, "Higher frequency should generally increase engagement"
    
    @given(st.data())
    def test_customer_tier_assignment_properties(self, data):
        """Test customer tier assignment business rules."""
        
        # Generate random spend and transaction data
        n_customers = data.draw(st.integers(min_value=5, max_value=50))
        
        spend_data = data.draw(st.lists(
            st.floats(min_value=0, max_value=50000), min_size=n_customers, max_size=n_customers
        ))
        
        transaction_counts = data.draw(st.lists(
            st.integers(min_value=0, max_value=200), min_size=n_customers, max_size=n_customers
        ))
        
        # Apply tier assignment logic
        tiers = []
        for spend, count in zip(spend_data, transaction_counts):
            if spend >= 10000 and count >= 50:
                tier = 'PLATINUM'
            elif spend >= 5000 and count >= 25:
                tier = 'GOLD'
            elif spend >= 1000 and count >= 10:
                tier = 'SILVER'
            elif spend > 0:
                tier = 'BRONZE'
            else:
                tier = 'INACTIVE'
            tiers.append(tier)
        
        # Invariant: All platinum customers must have high spend and transactions
        for i, tier in enumerate(tiers):
            if tier == 'PLATINUM':
                assert spend_data[i] >= 10000, "Platinum customers must have >= $10,000 spend"
                assert transaction_counts[i] >= 50, "Platinum customers must have >= 50 transactions"
        
        # Invariant: Inactive customers must have zero spend
        for i, tier in enumerate(tiers):
            if tier == 'INACTIVE':
                assert spend_data[i] == 0, "Inactive customers must have zero spend"
    
    @given(st.data())
    def test_risk_score_monotonicity(self, data):
        """Test that risk scores behave monotonically with risk indicators."""
        
        from docs.patterns.mixed_language_model_workflows import python_risk_score
        
        # Generate base transaction pattern
        amount = data.draw(st.floats(min_value=10, max_value=1000))
        transaction_count = data.draw(st.integers(min_value=1, max_value=20))
        
        normal_transaction = {
            'amount': amount,
            'merchant_category': 'grocery',
            'transaction_time': '2024-01-01 12:00:00',
            'payment_method': 'credit'
        }
        
        risky_transaction = {
            'amount': amount * 5,  # Much higher amount
            'merchant_category': 'cash_advance',
            'transaction_time': '2024-01-01 02:00:00',  # Late night
            'payment_method': 'debit'
        }
        
        normal_score = python_risk_score([normal_transaction], amount, 1)
        risky_score = python_risk_score([risky_transaction], amount * 5, 1)
        
        # Invariant: Risky patterns should have higher risk scores
        assert risky_score >= normal_score, "Risky transaction patterns should have higher risk scores"
    
    @given(
        data_frames([
            column('customer_id', st.text(min_size=1, max_size=10)),
            column('amount', st.floats(min_value=0, max_value=10000)),
            column('churn_probability', st.floats(min_value=0, max_value=1))
        ], min_size=1, max_size=50)
    )
    def test_aggregation_consistency(self, df):
        """Test that aggregations maintain mathematical consistency."""
        
        # Assume no nulls for this test
        df = df.dropna()
        
        if len(df) == 0:
            return  # Skip empty dataframes
        
        # Test sum consistency
        total_amount = df['amount'].sum()
        grouped_sum = df.groupby('customer_id')['amount'].sum().sum()
        
        assert abs(total_amount - grouped_sum) < 1e-6, "Grouped sum should equal total sum"
        
        # Test average consistency  
        if len(df) > 1:
            overall_avg = df['amount'].mean()
            customer_counts = df['customer_id'].value_counts()
            customer_avgs = df.groupby('customer_id')['amount'].mean()
            
            # Weighted average should equal overall average
            weighted_avg = sum(customer_avgs[cid] * customer_counts[cid] for cid in customer_avgs.index) / len(df)
            
            assert abs(overall_avg - weighted_avg) < 1e-6, "Weighted average should equal overall average"
```

## Performance Testing Patterns

### Load and Stress Testing

```python
class TestPerformanceCharacteristics:
    """Performance tests for mixed model components."""
    
    def test_model_scalability(self):
        """Test model performance scaling with data volume."""
        
        import time
        from templates.python_model_template import CustomerAnalyticsModel, ModelConfig
        
        # Test different data volumes
        data_volumes = [100, 500, 1000, 2500]
        execution_times = []
        
        for volume in data_volumes:
            # Generate scaled test data
            scaled_customers = pd.concat([test_framework.sample_data['customers']] * (volume // 100), ignore_index=True)
            scaled_customers['customer_id'] = scaled_customers.index.astype(str)
            
            scaled_transactions = pd.concat([test_framework.sample_data['transactions']] * (volume // 100), ignore_index=True)
            scaled_transactions['customer_id'] = np.random.choice(scaled_customers['customer_id'], len(scaled_transactions))
            
            # Test model performance
            config = ModelConfig(batch_size=min(1000, volume))
            model = CustomerAnalyticsModel(config)
            
            with patch.object(model, 'extract_data') as mock_extract:
                mock_extract.return_value = {
                    'customers': scaled_customers,
                    'transactions': scaled_transactions
                }
                
                start_time = time.time()
                result = model.transform_data(mock_extract.return_value)
                execution_time = time.time() - start_time
                
                execution_times.append(execution_time)
                
                # Validate results at each scale
                assert len(result) > 0
                assert isinstance(result, pd.DataFrame)
        
        # Analyze scaling characteristics
        logger.info(f"Execution times for volumes {data_volumes}: {execution_times}")
        
        # Performance should scale reasonably (not exponentially)
        for i in range(1, len(execution_times)):
            volume_ratio = data_volumes[i] / data_volumes[i-1]
            time_ratio = execution_times[i] / execution_times[i-1]
            
            # Time increase should not be more than 2x the volume increase
            assert time_ratio <= volume_ratio * 2, f"Performance degradation too severe at volume {data_volumes[i]}"
    
    def test_memory_efficiency(self):
        """Test memory usage patterns of mixed models."""
        
        import psutil
        import gc
        from templates.python_model_template import CustomerAnalyticsModel, ModelConfig
        
        # Monitor memory usage
        process = psutil.Process()
        initial_memory = process.memory_info().rss / 1024 / 1024  # MB
        
        # Create large dataset
        large_customers = pd.concat([test_framework.sample_data['customers']] * 50, ignore_index=True)
        large_customers['customer_id'] = large_customers.index.astype(str)
        
        large_transactions = pd.concat([test_framework.sample_data['transactions']] * 50, ignore_index=True)
        large_transactions['customer_id'] = np.random.choice(large_customers['customer_id'], len(large_transactions))
        
        # Execute model with memory monitoring
        config = ModelConfig(batch_size=2000)
        model = CustomerAnalyticsModel(config)
        
        with patch.object(model, 'extract_data') as mock_extract:
            mock_extract.return_value = {
                'customers': large_customers,
                'transactions': large_transactions
            }
            
            result = model.transform_data(mock_extract.return_value)
            
            peak_memory = process.memory_info().rss / 1024 / 1024  # MB
            memory_usage = peak_memory - initial_memory
            
            # Clean up
            del result, large_customers, large_transactions
            gc.collect()
            
            final_memory = process.memory_info().rss / 1024 / 1024  # MB
            
        # Validate memory efficiency
        logger.info(f"Memory usage - Initial: {initial_memory:.1f}MB, Peak: {peak_memory:.1f}MB, Final: {final_memory:.1f}MB")
        
        # Memory should not exceed reasonable limits
        assert memory_usage < 500, f"Memory usage too high: {memory_usage:.1f}MB"
        
        # Memory should be properly released
        memory_leak = final_memory - initial_memory
        assert memory_leak < 50, f"Potential memory leak detected: {memory_leak:.1f}MB"
    
    def test_concurrent_execution_performance(self):
        """Test performance under concurrent execution scenarios."""
        
        import concurrent.futures
        import time
        from docs.patterns.model_dependency_coordination import DependencyCoordinator
        
        mock_context = test_framework.mock_context
        
        def execute_model_simulation(model_id: str) -> Dict[str, Any]:
            """Simulate model execution."""
            coordinator = DependencyCoordinator(mock_context)
            
            start_time = time.time()
            
            # Simulate some work
            time.sleep(0.1)  # 100ms simulation
            
            execution_time = time.time() - start_time
            
            return {
                'model_id': model_id,
                'execution_time': execution_time,
                'success': True
            }
        
        # Test concurrent execution
        model_ids = [f'model_{i}' for i in range(10)]
        
        # Sequential execution baseline
        start_time = time.time()
        sequential_results = [execute_model_simulation(mid) for mid in model_ids]
        sequential_time = time.time() - start_time
        
        # Concurrent execution
        start_time = time.time()
        with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
            future_to_model = {executor.submit(execute_model_simulation, mid): mid for mid in model_ids}
            concurrent_results = []
            
            for future in concurrent.futures.as_completed(future_to_model):
                result = future.result()
                concurrent_results.append(result)
        
        concurrent_time = time.time() - start_time
        
        # Validate concurrency benefits
        speedup = sequential_time / concurrent_time
        logger.info(f"Sequential time: {sequential_time:.2f}s, Concurrent time: {concurrent_time:.2f}s, Speedup: {speedup:.2f}x")
        
        assert speedup > 2.0, f"Insufficient speedup from concurrency: {speedup:.2f}x"
        assert len(concurrent_results) == len(model_ids)
        assert all(result['success'] for result in concurrent_results)
```

## Test Configuration and Utilities

### Test Data Management

```python
class TestDataManager:
    """Manage test data generation and validation."""
    
    def __init__(self):
        self.data_generators = {}
        self.validation_schemas = {}
    
    def register_data_generator(self, data_type: str, generator_func):
        """Register a data generator for specific data types."""
        self.data_generators[data_type] = generator_func
    
    def generate_test_data(self, data_type: str, **kwargs) -> pd.DataFrame:
        """Generate test data of specified type."""
        if data_type not in self.data_generators:
            raise ValueError(f"No generator registered for data type: {data_type}")
        
        return self.data_generators[data_type](**kwargs)
    
    def create_data_quality_issues(self, df: pd.DataFrame, issue_type: str, proportion: float = 0.1) -> pd.DataFrame:
        """Introduce specific data quality issues for testing."""
        
        df_copy = df.copy()
        n_issues = int(len(df_copy) * proportion)
        
        if issue_type == 'missing_values':
            # Introduce random missing values
            for col in df_copy.select_dtypes(include=[np.number]).columns:
                indices = np.random.choice(df_copy.index, n_issues, replace=False)
                df_copy.loc[indices, col] = np.nan
        
        elif issue_type == 'duplicate_keys':
            # Create duplicate primary keys
            if 'customer_id' in df_copy.columns:
                indices = np.random.choice(df_copy.index, n_issues, replace=False)
                df_copy.loc[indices, 'customer_id'] = df_copy.loc[indices[0], 'customer_id']
        
        elif issue_type == 'invalid_values':
            # Introduce invalid values
            for col in df_copy.select_dtypes(include=[np.number]).columns:
                indices = np.random.choice(df_copy.index, n_issues, replace=False)
                df_copy.loc[indices, col] = -999  # Invalid negative values
        
        elif issue_type == 'inconsistent_formats':
            # Introduce format inconsistencies
            if 'email' in df_copy.columns:
                indices = np.random.choice(df_copy.index, n_issues, replace=False)
                df_copy.loc[indices, 'email'] = 'invalid_email_format'
        
        return df_copy

# Global test data manager
test_data_manager = TestDataManager()

# Register standard data generators
test_data_manager.register_data_generator(
    'customers',
    lambda n=100: test_framework.sample_data['customers'][:n]
)

test_data_manager.register_data_generator(
    'transactions', 
    lambda n=500: test_framework.sample_data['transactions'][:n]
)
```

### Test Fixtures and Helpers

```python
@pytest.fixture
def sample_customers():
    """Fixture providing sample customer data."""
    return test_framework.sample_data['customers'].copy()

@pytest.fixture
def sample_transactions():
    """Fixture providing sample transaction data."""
    return test_framework.sample_data['transactions'].copy()

@pytest.fixture
def mock_sqlmesh_context():
    """Fixture providing mock SQLmesh context."""
    return test_framework.mock_context

@pytest.fixture
def temp_model_config():
    """Fixture providing temporary model configuration."""
    from templates.python_model_template import ModelConfig
    
    return ModelConfig(
        model_name="test_model",
        batch_size=100,
        max_retries=1,
        min_expected_rows=10,
        max_execution_minutes=5
    )

def assert_model_output_quality(df: pd.DataFrame, required_columns: List[str]):
    """Helper function to assert model output quality."""
    
    # Check required columns exist
    missing_columns = [col for col in required_columns if col not in df.columns]
    assert not missing_columns, f"Missing required columns: {missing_columns}"
    
    # Check for null primary keys
    if 'customer_id' in df.columns:
        assert df['customer_id'].notna().all(), "Primary keys cannot be null"
    
    # Check for reasonable data ranges
    numeric_columns = df.select_dtypes(include=[np.number]).columns
    for col in numeric_columns:
        if col.endswith('_score') or col.endswith('_probability'):
            assert df[col].between(0, 1).all(), f"Score/probability column {col} must be between 0 and 1"
        
        if col.startswith('total_') or col.endswith('_amount'):
            assert (df[col] >= 0).all(), f"Amount column {col} cannot be negative"

def benchmark_function_performance(func, *args, iterations: int = 100, **kwargs):
    """Benchmark function performance over multiple iterations."""
    
    import time
    
    execution_times = []
    
    for _ in range(iterations):
        start_time = time.time()
        func(*args, **kwargs)
        execution_time = time.time() - start_time
        execution_times.append(execution_time)
    
    return {
        'mean_time': np.mean(execution_times),
        'median_time': np.median(execution_times),
        'std_time': np.std(execution_times),
        'min_time': np.min(execution_times),
        'max_time': np.max(execution_times),
        'p95_time': np.percentile(execution_times, 95)
    }
```

## Best Practices and Guidelines

### Testing Standards

```yaml
mixed_model_testing_standards:
  test_organization:
    - "Group tests by model type and complexity level"
    - "Use descriptive test names that explain the scenario"
    - "Organize test data and fixtures consistently"
    - "Maintain test independence and isolation"
    
  coverage_requirements:
    unit_tests: "90%+ code coverage for Python functions"
    integration_tests: "80%+ coverage of SQL-Python boundaries"
    end_to_end_tests: "70%+ coverage of complete workflows"
    property_tests: "100% coverage of critical business rules"
    
  performance_standards:
    unit_tests: "< 1 second execution time"
    integration_tests: "< 10 seconds execution time"
    end_to_end_tests: "< 5 minutes execution time"
    test_suite_total: "< 30 minutes for complete test suite"
    
  data_quality_validation:
    - "Test with both clean and dirty data scenarios"
    - "Validate error handling and recovery mechanisms"
    - "Check boundary conditions and edge cases"
    - "Ensure consistent data formats across boundaries"
    
  test_maintenance:
    - "Update tests when model logic changes"
    - "Maintain test data freshness and relevance"
    - "Regular review of test effectiveness and coverage"
    - "Automate test execution in CI/CD pipelines"
```

This comprehensive testing framework provides robust validation patterns for mixed-language SQLmesh models, ensuring reliability, performance, and maintainability across complex transformation pipelines.