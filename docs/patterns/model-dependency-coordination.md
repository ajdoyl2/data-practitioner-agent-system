# Model Dependency Coordination in SQLmesh

## Overview

This document establishes patterns for coordinating dependencies between mixed SQL and Python models in SQLmesh environments, ensuring proper execution order, data consistency, and efficient resource utilization across complex transformation pipelines.

## Dependency Management Architecture

### Core Dependency Types

```yaml
dependency_classifications:
  direct_dependencies:
    description: "Models that directly consume outputs from other models"
    examples:
      - "Python model reading from SQL table"
      - "SQL view built on Python model output"
    coordination_pattern: "Sequential execution with validation"
    
  transitive_dependencies:
    description: "Models dependent on outputs of dependency chain"
    examples:
      - "Model C depends on Model B which depends on Model A"
      - "Aggregation models built on feature engineering pipelines"
    coordination_pattern: "Topological sort with batch optimization"
    
  conditional_dependencies:
    description: "Models with dynamic dependency based on runtime conditions"
    examples:
      - "A/B test variant models"
      - "Environment-specific model selection"
    coordination_pattern: "Runtime dependency resolution"
    
  parallel_dependencies:
    description: "Models that can execute simultaneously with shared resources"
    examples:
      - "Independent feature engineering models"
      - "Parallel aggregation models for different time periods"
    coordination_pattern: "Concurrent execution with resource management"
```

### Dependency Declaration Patterns

```sql
-- SQL Model with Mixed Dependencies
MODEL (
    name analytics.customer_insights,
    kind FULL,
    owner 'data-science@company.com',
    
    -- Dependencies on both SQL and Python models
    depends_on [
        'raw_data.customer_transactions',      -- SQL table
        'analytics.python_feature_engineering', -- Python model
        'analytics.customer_segmentation',      -- SQL model
        'ml_models.churn_prediction'           -- Python ML model
    ],
    
    -- Resource coordination hints
    tags ['high_memory', 'cpu_intensive'],
    
    description '''
    Customer insights combining transactional data with ML-generated features
    and segmentation logic from multiple upstream models.
    '''
);

-- Dependency validation and ordering
WITH validated_inputs AS (
    -- Ensure all upstream models completed successfully
    SELECT 
        model_name,
        last_run_timestamp,
        status,
        row_count
    FROM sqlmesh_model_metadata
    WHERE model_name IN (
        'analytics.python_feature_engineering',
        'analytics.customer_segmentation', 
        'ml_models.churn_prediction'
    )
    AND status = 'SUCCESS'
    AND last_run_timestamp >= @execution_start_time - INTERVAL '1 HOUR'
),

-- Main model logic with dependency checks
customer_features AS (
    SELECT 
        c.customer_id,
        c.signup_date,
        c.customer_segment,
        
        -- From Python feature engineering model
        f.engagement_score,
        f.ltv_prediction,
        f.behavioral_features,
        
        -- From ML churn prediction model  
        p.churn_probability,
        p.churn_tier,
        p.prediction_confidence
        
    FROM analytics.customer_segmentation c
    JOIN analytics.python_feature_engineering f
        ON c.customer_id = f.customer_id
    JOIN ml_models.churn_prediction p
        ON c.customer_id = p.customer_id
        
    -- Ensure data freshness alignment
    WHERE f.processed_date = @execution_date
      AND p.prediction_date = @execution_date
      AND c.segment_date = @execution_date
)

-- Final output with dependency validation
SELECT 
    customer_id,
    customer_segment,
    engagement_score,
    ltv_prediction,
    churn_probability,
    
    -- Dependency metadata for troubleshooting
    STRUCT(
        'analytics.python_feature_engineering' as feature_source,
        'ml_models.churn_prediction' as prediction_source,
        'analytics.customer_segmentation' as segmentation_source,
        @execution_date as coordination_date
    ) as model_lineage
    
FROM customer_features;
```

### Python Model Dependency Management

```python
import sqlmesh
from sqlmesh import ExecutionContext, ModelKind
from sqlmesh.core.model import python_model
import pandas as pd
import time
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import logging

logger = logging.getLogger(__name__)

class DependencyCoordinator:
    """Coordinate dependencies for Python SQLmesh models."""
    
    def __init__(self, context: ExecutionContext):
        self.context = context
        self.dependency_cache = {}
        self.validation_thresholds = {
            'max_staleness_minutes': 60,
            'min_row_count': 100,
            'max_execution_time_minutes': 30
        }
    
    def validate_upstream_dependencies(
        self, 
        dependencies: List[str],
        execution_time: datetime
    ) -> Dict[str, Any]:
        """Validate that upstream dependencies are ready and fresh."""
        
        validation_results = {
            'all_dependencies_ready': True,
            'dependency_status': {},
            'validation_errors': [],
            'coordination_metadata': {}
        }
        
        for dependency in dependencies:
            try:
                status = self._check_dependency_status(dependency, execution_time)
                validation_results['dependency_status'][dependency] = status
                
                # Check for blocking conditions
                if not status['is_ready']:
                    validation_results['all_dependencies_ready'] = False
                    validation_results['validation_errors'].append(
                        f"Dependency {dependency} not ready: {status['reason']}"
                    )
                
                # Check data freshness
                if status['staleness_minutes'] > self.validation_thresholds['max_staleness_minutes']:
                    validation_results['validation_errors'].append(
                        f"Dependency {dependency} is stale: {status['staleness_minutes']} minutes old"
                    )
                
                # Check data volume
                if status['row_count'] < self.validation_thresholds['min_row_count']:
                    validation_results['validation_errors'].append(
                        f"Dependency {dependency} has insufficient data: {status['row_count']} rows"
                    )
                    
            except Exception as e:
                validation_results['all_dependencies_ready'] = False
                validation_results['validation_errors'].append(
                    f"Failed to validate dependency {dependency}: {str(e)}"
                )
                logger.error(f"Dependency validation error for {dependency}: {str(e)}")
        
        return validation_results
    
    def _check_dependency_status(self, dependency: str, execution_time: datetime) -> Dict[str, Any]:
        """Check individual dependency status."""
        
        # Query SQLmesh metadata for dependency status
        metadata_query = f"""
        SELECT 
            model_name,
            last_run_timestamp,
            status,
            row_count,
            execution_time_seconds,
            error_message
        FROM sqlmesh_model_metadata
        WHERE model_name = '{dependency}'
        ORDER BY last_run_timestamp DESC
        LIMIT 1
        """
        
        try:
            result = self.context.engine.execute(metadata_query).fetchone()
            
            if not result:
                return {
                    'is_ready': False,
                    'reason': 'No execution history found',
                    'staleness_minutes': float('inf'),
                    'row_count': 0
                }
            
            last_run = result['last_run_timestamp']
            staleness_minutes = (execution_time - last_run).total_seconds() / 60
            
            return {
                'is_ready': result['status'] == 'SUCCESS',
                'reason': result.get('error_message', 'Success'),
                'staleness_minutes': staleness_minutes,
                'row_count': result.get('row_count', 0),
                'execution_time_seconds': result.get('execution_time_seconds', 0),
                'last_run_timestamp': last_run
            }
            
        except Exception as e:
            logger.error(f"Failed to check dependency status for {dependency}: {str(e)}")
            return {
                'is_ready': False,
                'reason': f'Metadata query failed: {str(e)}',
                'staleness_minutes': float('inf'),
                'row_count': 0
            }
    
    def load_dependency_data(
        self, 
        dependency: str, 
        columns: Optional[List[str]] = None,
        filters: Optional[Dict[str, Any]] = None
    ) -> pd.DataFrame:
        """Load data from upstream dependency with caching and validation."""
        
        # Check cache first
        cache_key = f"{dependency}_{hash(str(columns))}_{hash(str(filters))}"
        if cache_key in self.dependency_cache:
            logger.info(f"Using cached data for dependency {dependency}")
            return self.dependency_cache[cache_key]
        
        # Build query
        select_clause = ', '.join(columns) if columns else '*'
        query = f"SELECT {select_clause} FROM {dependency}"
        
        # Add filters
        if filters:
            where_conditions = []
            for column, value in filters.items():
                if isinstance(value, str):
                    where_conditions.append(f"{column} = '{value}'")
                elif isinstance(value, list):
                    value_str = "', '".join(str(v) for v in value)
                    where_conditions.append(f"{column} IN ('{value_str}')")
                else:
                    where_conditions.append(f"{column} = {value}")
            
            if where_conditions:
                query += " WHERE " + " AND ".join(where_conditions)
        
        try:
            logger.info(f"Loading dependency data: {dependency}")
            df = self.context.engine.execute(query).to_pandas()
            
            # Cache the result
            self.dependency_cache[cache_key] = df
            
            logger.info(f"Loaded {len(df)} rows from dependency {dependency}")
            return df
            
        except Exception as e:
            logger.error(f"Failed to load dependency data from {dependency}: {str(e)}")
            raise

    def coordinate_parallel_execution(
        self, 
        parallel_models: List[str],
        max_concurrent: int = 3
    ) -> Dict[str, Any]:
        """Coordinate parallel execution of independent models."""
        
        import concurrent.futures
        import threading
        
        execution_results = {}
        execution_lock = threading.Lock()
        
        def execute_model(model_name: str) -> Dict[str, Any]:
            """Execute individual model with error handling."""
            try:
                start_time = time.time()
                
                # Simulate model execution (in practice, call actual model)
                logger.info(f"Starting parallel execution of {model_name}")
                
                # Execute model (placeholder - replace with actual execution)
                result = self._execute_individual_model(model_name)
                
                execution_time = time.time() - start_time
                
                with execution_lock:
                    execution_results[model_name] = {
                        'status': 'SUCCESS',
                        'execution_time': execution_time,
                        'row_count': result.get('row_count', 0),
                        'result': result
                    }
                
                logger.info(f"Completed parallel execution of {model_name} in {execution_time:.2f}s")
                return execution_results[model_name]
                
            except Exception as e:
                logger.error(f"Parallel execution failed for {model_name}: {str(e)}")
                
                with execution_lock:
                    execution_results[model_name] = {
                        'status': 'FAILED',
                        'error': str(e),
                        'execution_time': time.time() - start_time if 'start_time' in locals() else 0
                    }
                
                return execution_results[model_name]
        
        # Execute models in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=max_concurrent) as executor:
            future_to_model = {
                executor.submit(execute_model, model): model 
                for model in parallel_models
            }
            
            for future in concurrent.futures.as_completed(future_to_model):
                model_name = future_to_model[future]
                try:
                    result = future.result()
                    logger.info(f"Parallel model {model_name} completed with status: {result['status']}")
                except Exception as e:
                    logger.error(f"Parallel model {model_name} generated exception: {str(e)}")
        
        # Summarize results
        successful_models = [
            model for model, result in execution_results.items() 
            if result['status'] == 'SUCCESS'
        ]
        
        failed_models = [
            model for model, result in execution_results.items() 
            if result['status'] == 'FAILED'
        ]
        
        return {
            'total_models': len(parallel_models),
            'successful_count': len(successful_models),
            'failed_count': len(failed_models),
            'successful_models': successful_models,
            'failed_models': failed_models,
            'detailed_results': execution_results
        }
    
    def _execute_individual_model(self, model_name: str) -> Dict[str, Any]:
        """Execute individual model (placeholder for actual execution)."""
        
        # In practice, this would invoke the actual SQLmesh model execution
        # For now, simulate with a simple query
        try:
            query = f"SELECT COUNT(*) as row_count FROM {model_name}"
            result = self.context.engine.execute(query).fetchone()
            
            return {
                'row_count': result['row_count'] if result else 0,
                'status': 'completed'
            }
        except Exception as e:
            raise Exception(f"Model execution failed: {str(e)}")

@python_model(
    name="analytics.coordinated_customer_analysis",
    kind=ModelKind.INCREMENTAL,
    owner="data-engineering@company.com",
    cron="@daily",
    grain=["customer_id", "analysis_date"],
    description="""
    Coordinated customer analysis model demonstrating dependency management
    patterns for mixed SQL and Python models in complex transformation pipelines.
    """
)
def coordinated_customer_analysis(context: ExecutionContext, **kwargs) -> pd.DataFrame:
    """
    Customer analysis model with sophisticated dependency coordination.
    
    Dependencies:
    - SQL models: customer_transactions, customer_demographics
    - Python models: feature_engineering, churn_prediction
    - ML models: ltv_prediction, segmentation_model
    """
    
    # Initialize dependency coordinator
    coordinator = DependencyCoordinator(context)
    
    # Define model dependencies
    dependencies = [
        'raw_data.customer_transactions',
        'raw_data.customer_demographics', 
        'analytics.python_feature_engineering',
        'ml_models.churn_prediction',
        'ml_models.ltv_prediction',
        'analytics.customer_segmentation'
    ]
    
    execution_time = datetime.now()
    
    try:
        logger.info("Starting coordinated customer analysis execution")
        
        # Step 1: Validate all dependencies
        logger.info("Step 1: Validating upstream dependencies")
        validation_results = coordinator.validate_upstream_dependencies(
            dependencies, execution_time
        )
        
        if not validation_results['all_dependencies_ready']:
            error_msg = f"Dependency validation failed: {validation_results['validation_errors']}"
            logger.error(error_msg)
            raise Exception(error_msg)
        
        logger.info("All dependencies validated successfully")
        
        # Step 2: Load core data with dependency coordination
        logger.info("Step 2: Loading coordinated dependency data")
        
        # Load customer demographics (SQL dependency)
        demographics = coordinator.load_dependency_data(
            'raw_data.customer_demographics',
            columns=['customer_id', 'age_group', 'income_bracket', 'signup_date'],
            filters={'is_active': True}
        )
        
        # Load feature engineering results (Python dependency)
        features = coordinator.load_dependency_data(
            'analytics.python_feature_engineering',
            filters={'processed_date': kwargs.get('start_date', context.start_date)}
        )
        
        # Load ML predictions (Python/ML dependencies)
        churn_predictions = coordinator.load_dependency_data(
            'ml_models.churn_prediction',
            columns=['customer_id', 'churn_probability', 'churn_tier']
        )
        
        ltv_predictions = coordinator.load_dependency_data(
            'ml_models.ltv_prediction', 
            columns=['customer_id', 'predicted_ltv', 'prediction_confidence']
        )
        
        # Load segmentation (SQL dependency)
        segmentation = coordinator.load_dependency_data(
            'analytics.customer_segmentation',
            columns=['customer_id', 'customer_segment', 'segment_score']
        )
        
        # Step 3: Coordinate data integration
        logger.info("Step 3: Coordinating multi-source data integration")
        
        # Start with demographics as the base
        analysis_df = demographics.copy()
        
        # Progressive joining with validation
        analysis_df = analysis_df.merge(
            features, on='customer_id', how='left', 
            suffixes=('', '_features')
        )
        
        analysis_df = analysis_df.merge(
            churn_predictions, on='customer_id', how='left',
            suffixes=('', '_churn')
        )
        
        analysis_df = analysis_df.merge(
            ltv_predictions, on='customer_id', how='left',
            suffixes=('', '_ltv')
        )
        
        analysis_df = analysis_df.merge(
            segmentation, on='customer_id', how='left',
            suffixes=('', '_segment')
        )
        
        # Step 4: Validate data integration quality
        logger.info("Step 4: Validating coordinated data quality")
        
        # Check for missing joins
        total_customers = len(analysis_df)
        features_missing = analysis_df['engagement_score'].isnull().sum()
        churn_missing = analysis_df['churn_probability'].isnull().sum()
        
        if features_missing / total_customers > 0.1:
            logger.warning(f"High feature missing rate: {features_missing}/{total_customers}")
        
        if churn_missing / total_customers > 0.1:
            logger.warning(f"High churn prediction missing rate: {churn_missing}/{total_customers}")
        
        # Step 5: Create coordinated analysis features
        logger.info("Step 5: Creating coordinated analysis features")
        
        # Risk scoring combining multiple dependencies
        analysis_df['combined_risk_score'] = calculate_combined_risk_score(
            analysis_df['churn_probability'].fillna(0.5),
            analysis_df['engagement_score'].fillna(0.5),
            analysis_df['segment_score'].fillna(0.5)
        )
        
        # Value scoring combining LTV and segment
        analysis_df['customer_value_score'] = calculate_customer_value_score(
            analysis_df['predicted_ltv'].fillna(0),
            analysis_df['customer_segment'].fillna('unknown'),
            analysis_df['prediction_confidence'].fillna(0.5)
        )
        
        # Dependency lineage tracking
        analysis_df['dependency_metadata'] = create_dependency_metadata(
            validation_results['dependency_status'],
            execution_time
        )
        
        # Step 6: Final coordination validation
        output_df = validate_coordinated_output(analysis_df)
        
        logger.info(f"Coordinated analysis completed successfully: {len(output_df)} customers analyzed")
        return output_df
        
    except Exception as e:
        logger.error(f"Coordinated customer analysis failed: {str(e)}")
        raise

def calculate_combined_risk_score(churn_prob: pd.Series, engagement: pd.Series, segment_score: pd.Series) -> pd.Series:
    """Calculate combined risk score from multiple model outputs."""
    
    # Weighted combination of risk indicators
    risk_score = (
        churn_prob * 0.5 +          # Churn probability weight
        (1 - engagement) * 0.3 +    # Low engagement as risk
        (1 - segment_score) * 0.2   # Low segment score as risk
    )
    
    return risk_score.clip(0, 1)

def calculate_customer_value_score(ltv: pd.Series, segment: pd.Series, confidence: pd.Series) -> pd.Series:
    """Calculate customer value score incorporating LTV and segment information."""
    
    # Segment value multipliers
    segment_multipliers = {
        'enterprise': 1.5,
        'premium': 1.2,
        'standard': 1.0,
        'basic': 0.8,
        'unknown': 0.6
    }
    
    # Apply segment multipliers
    segment_factor = segment.map(segment_multipliers).fillna(0.6)
    
    # Confidence-weighted value score
    value_score = (ltv * segment_factor * confidence) / 10000  # Normalize to 0-1 range
    
    return value_score.clip(0, 1)

def create_dependency_metadata(dependency_status: Dict, execution_time: datetime) -> pd.Series:
    """Create dependency metadata for lineage tracking."""
    
    metadata = {
        'execution_timestamp': execution_time.isoformat(),
        'dependency_freshness': {
            model: status['staleness_minutes'] 
            for model, status in dependency_status.items()
        },
        'dependency_row_counts': {
            model: status['row_count']
            for model, status in dependency_status.items()
        },
        'coordination_version': '1.0.0'
    }
    
    return pd.Series([metadata] * len(dependency_status))

def validate_coordinated_output(df: pd.DataFrame) -> pd.DataFrame:
    """Validate the final coordinated output."""
    
    required_columns = [
        'customer_id', 'customer_segment', 'combined_risk_score', 
        'customer_value_score', 'dependency_metadata'
    ]
    
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise ValueError(f"Missing required output columns: {missing_columns}")
    
    # Remove records with critical missing data
    df = df.dropna(subset=['customer_id'])
    
    # Add coordination metadata
    df['analysis_date'] = pd.Timestamp.now().date()
    df['coordination_model_version'] = '1.0.0'
    
    return df
```

## Dependency Resolution Strategies

### Topological Sorting for Complex Dependencies

```python
class DependencyGraph:
    """Manage complex dependency relationships with topological sorting."""
    
    def __init__(self):
        self.graph = {}
        self.in_degree = {}
        self.model_metadata = {}
    
    def add_model(self, model_name: str, dependencies: List[str], metadata: Dict = None):
        """Add model with its dependencies to the graph."""
        
        if model_name not in self.graph:
            self.graph[model_name] = []
            self.in_degree[model_name] = 0
        
        self.model_metadata[model_name] = metadata or {}
        
        for dep in dependencies:
            if dep not in self.graph:
                self.graph[dep] = []
                self.in_degree[dep] = 0
            
            self.graph[dep].append(model_name)
            self.in_degree[model_name] += 1
    
    def get_execution_order(self) -> List[List[str]]:
        """Get execution order using topological sort with parallelization."""
        
        import queue
        from collections import defaultdict
        
        # Initialize in-degree counts
        in_degree_copy = self.in_degree.copy()
        result_levels = []
        
        # Find models with no dependencies (level 0)
        current_level = [
            model for model, degree in in_degree_copy.items() 
            if degree == 0
        ]
        
        while current_level:
            result_levels.append(current_level.copy())
            next_level = []
            
            # Process current level
            for model in current_level:
                # Reduce in-degree for dependent models
                for dependent in self.graph[model]:
                    in_degree_copy[dependent] -= 1
                    if in_degree_copy[dependent] == 0:
                        next_level.append(dependent)
            
            current_level = next_level
        
        # Check for circular dependencies
        remaining_models = [
            model for model, degree in in_degree_copy.items() 
            if degree > 0
        ]
        
        if remaining_models:
            raise ValueError(f"Circular dependencies detected: {remaining_models}")
        
        return result_levels
    
    def optimize_execution_plan(self, resource_constraints: Dict = None) -> Dict[str, Any]:
        """Optimize execution plan based on resource constraints."""
        
        execution_levels = self.get_execution_order()
        
        # Default resource constraints
        constraints = {
            'max_parallel_models': 5,
            'max_memory_gb': 16,
            'max_cpu_cores': 8,
            **(resource_constraints or {})
        }
        
        optimized_plan = {
            'execution_levels': [],
            'estimated_duration': 0,
            'resource_usage': {},
            'optimization_notes': []
        }
        
        cumulative_time = 0
        
        for level_idx, level_models in enumerate(execution_levels):
            level_plan = {
                'level': level_idx,
                'models': level_models,
                'parallel_groups': [],
                'estimated_duration': 0
            }
            
            # Group models based on resource requirements
            parallel_groups = self._create_parallel_groups(
                level_models, constraints
            )
            
            level_plan['parallel_groups'] = parallel_groups
            
            # Calculate level duration (max of all parallel groups)
            max_group_duration = max(
                group['estimated_duration'] for group in parallel_groups
            )
            
            level_plan['estimated_duration'] = max_group_duration
            cumulative_time += max_group_duration
            
            optimized_plan['execution_levels'].append(level_plan)
        
        optimized_plan['estimated_duration'] = cumulative_time
        
        return optimized_plan
    
    def _create_parallel_groups(self, models: List[str], constraints: Dict) -> List[Dict]:
        """Create parallel execution groups based on resource constraints."""
        
        # Sort models by estimated resource requirements
        model_resources = []
        for model in models:
            metadata = self.model_metadata.get(model, {})
            model_resources.append({
                'model': model,
                'memory_gb': metadata.get('memory_gb', 2),
                'cpu_cores': metadata.get('cpu_cores', 1),
                'duration_minutes': metadata.get('duration_minutes', 10)
            })
        
        # Sort by resource intensity (memory + CPU)
        model_resources.sort(
            key=lambda x: x['memory_gb'] + x['cpu_cores'], 
            reverse=True
        )
        
        parallel_groups = []
        current_group = {
            'models': [],
            'total_memory_gb': 0,
            'total_cpu_cores': 0,
            'estimated_duration': 0
        }
        
        for model_info in model_resources:
            # Check if model fits in current group
            new_memory = current_group['total_memory_gb'] + model_info['memory_gb']
            new_cpu = current_group['total_cpu_cores'] + model_info['cpu_cores']
            
            if (new_memory <= constraints['max_memory_gb'] and 
                new_cpu <= constraints['max_cpu_cores'] and
                len(current_group['models']) < constraints['max_parallel_models']):
                
                # Add to current group
                current_group['models'].append(model_info['model'])
                current_group['total_memory_gb'] = new_memory
                current_group['total_cpu_cores'] = new_cpu
                current_group['estimated_duration'] = max(
                    current_group['estimated_duration'],
                    model_info['duration_minutes']
                )
            else:
                # Start new group
                if current_group['models']:
                    parallel_groups.append(current_group)
                
                current_group = {
                    'models': [model_info['model']],
                    'total_memory_gb': model_info['memory_gb'],
                    'total_cpu_cores': model_info['cpu_cores'],
                    'estimated_duration': model_info['duration_minutes']
                }
        
        # Add final group
        if current_group['models']:
            parallel_groups.append(current_group)
        
        return parallel_groups
```

## Advanced Coordination Patterns

### Event-Driven Dependency Management

```python
class EventDrivenCoordinator:
    """Event-driven coordination for dynamic dependency resolution."""
    
    def __init__(self):
        self.event_handlers = {}
        self.model_states = {}
        self.coordination_events = []
    
    def register_event_handler(self, event_type: str, handler_func):
        """Register event handler for specific coordination events."""
        
        if event_type not in self.event_handlers:
            self.event_handlers[event_type] = []
        
        self.event_handlers[event_type].append(handler_func)
    
    def emit_coordination_event(self, event_type: str, event_data: Dict):
        """Emit coordination event and trigger registered handlers."""
        
        event = {
            'type': event_type,
            'timestamp': datetime.now(),
            'data': event_data
        }
        
        self.coordination_events.append(event)
        
        # Trigger registered handlers
        if event_type in self.event_handlers:
            for handler in self.event_handlers[event_type]:
                try:
                    handler(event)
                except Exception as e:
                    logger.error(f"Event handler failed for {event_type}: {str(e)}")
    
    def setup_model_coordination(self, model_config: Dict):
        """Setup event-driven coordination for model execution."""
        
        # Register standard coordination events
        self.register_event_handler('model_started', self._handle_model_started)
        self.register_event_handler('model_completed', self._handle_model_completed)
        self.register_event_handler('model_failed', self._handle_model_failed)
        self.register_event_handler('dependency_ready', self._handle_dependency_ready)
        
        # Setup model-specific event handlers
        for model_name, config in model_config.items():
            if 'custom_events' in config:
                for event_type, handler_name in config['custom_events'].items():
                    handler_func = getattr(self, handler_name, None)
                    if handler_func:
                        self.register_event_handler(event_type, handler_func)
    
    def _handle_model_started(self, event: Dict):
        """Handle model execution start event."""
        model_name = event['data']['model_name']
        self.model_states[model_name] = 'RUNNING'
        
        logger.info(f"Model coordination: {model_name} started execution")
    
    def _handle_model_completed(self, event: Dict):
        """Handle model execution completion event."""
        model_name = event['data']['model_name']
        self.model_states[model_name] = 'COMPLETED'
        
        # Check if this completion enables downstream models
        self._check_downstream_dependencies(model_name)
        
        logger.info(f"Model coordination: {model_name} completed successfully")
    
    def _handle_model_failed(self, event: Dict):
        """Handle model execution failure event."""
        model_name = event['data']['model_name']
        error_message = event['data'].get('error', 'Unknown error')
        
        self.model_states[model_name] = 'FAILED'
        
        # Emit failure event for dependent models
        self.emit_coordination_event('dependency_failed', {
            'failed_model': model_name,
            'error': error_message
        })
        
        logger.error(f"Model coordination: {model_name} failed - {error_message}")
    
    def _check_downstream_dependencies(self, completed_model: str):
        """Check if downstream models can now execute."""
        
        # This would integrate with the dependency graph to trigger
        # ready downstream models
        pass
```

## Performance Optimization Strategies

### Caching and Memoization

```yaml
dependency_caching_strategies:
  result_caching:
    description: "Cache model outputs for reuse across dependent models"
    implementation:
      - "In-memory caching for small frequently-used datasets"
      - "Disk-based caching for large intermediate results"
      - "Distributed caching for multi-node environments"
    cache_invalidation:
      - "Time-based expiration for time-sensitive data"
      - "Version-based invalidation for model updates"
      - "Dependency-based invalidation for upstream changes"
      
  computation_memoization:
    description: "Memoize expensive computations within dependency chains"
    use_cases:
      - "Feature engineering functions"
      - "ML model predictions"
      - "Complex aggregations"
    implementation:
      - "Function-level memoization decorators"
      - "Persistent storage for cross-session reuse"
      - "Intelligent cache key generation"
      
  metadata_caching:
    description: "Cache dependency metadata to reduce coordination overhead"
    cached_information:
      - "Model execution status"
      - "Data freshness timestamps"
      - "Row counts and data quality metrics"
    refresh_strategies:
      - "Lazy refresh on access"
      - "Proactive refresh on upstream changes"
      - "Periodic refresh for long-running processes"
```

### Resource-Aware Scheduling

```python
class ResourceAwareScheduler:
    """Schedule model execution based on resource availability and constraints."""
    
    def __init__(self, resource_limits: Dict):
        self.resource_limits = resource_limits
        self.current_usage = {
            'memory_gb': 0,
            'cpu_cores': 0,
            'gpu_count': 0
        }
        self.execution_queue = []
        self.running_models = {}
    
    def schedule_model_execution(
        self, 
        model_name: str, 
        resource_requirements: Dict,
        priority: int = 5
    ) -> str:
        """Schedule model for execution based on resource availability."""
        
        execution_request = {
            'model_name': model_name,
            'resource_requirements': resource_requirements,
            'priority': priority,
            'queued_at': datetime.now(),
            'status': 'QUEUED'
        }
        
        # Check if resources are immediately available
        if self._can_execute_now(resource_requirements):
            return self._start_model_execution(execution_request)
        else:
            # Add to queue with priority ordering
            self.execution_queue.append(execution_request)
            self.execution_queue.sort(key=lambda x: x['priority'], reverse=True)
            
            logger.info(f"Model {model_name} queued for execution (queue position: {len(self.execution_queue)})")
            return 'QUEUED'
    
    def _can_execute_now(self, requirements: Dict) -> bool:
        """Check if model can execute with current resource availability."""
        
        for resource, required in requirements.items():
            available = self.resource_limits[resource] - self.current_usage[resource]
            if required > available:
                return False
        
        return True
    
    def _start_model_execution(self, execution_request: Dict) -> str:
        """Start model execution and allocate resources."""
        
        model_name = execution_request['model_name']
        requirements = execution_request['resource_requirements']
        
        # Allocate resources
        for resource, required in requirements.items():
            self.current_usage[resource] += required
        
        # Track running model
        self.running_models[model_name] = {
            'started_at': datetime.now(),
            'resource_allocation': requirements,
            'status': 'RUNNING'
        }
        
        logger.info(f"Started execution of {model_name} with resources: {requirements}")
        return 'RUNNING'
    
    def complete_model_execution(self, model_name: str):
        """Complete model execution and free resources."""
        
        if model_name in self.running_models:
            # Free allocated resources
            allocation = self.running_models[model_name]['resource_allocation']
            for resource, allocated in allocation.items():
                self.current_usage[resource] -= allocated
            
            # Remove from running models
            del self.running_models[model_name]
            
            # Check queue for models that can now run
            self._process_execution_queue()
            
            logger.info(f"Completed execution of {model_name}, resources freed")
    
    def _process_execution_queue(self):
        """Process execution queue and start models that can now run."""
        
        models_to_start = []
        remaining_queue = []
        
        for request in self.execution_queue:
            if self._can_execute_now(request['resource_requirements']):
                models_to_start.append(request)
            else:
                remaining_queue.append(request)
        
        self.execution_queue = remaining_queue
        
        # Start queued models
        for request in models_to_start:
            self._start_model_execution(request)
```

## Testing and Validation Framework

### Dependency Testing Patterns

```python
import pytest
from unittest.mock import Mock, patch
import pandas as pd

class TestDependencyCoordination:
    """Test framework for dependency coordination patterns."""
    
    def setup_method(self):
        """Setup test fixtures."""
        self.mock_context = Mock()
        self.sample_dependencies = [
            'raw_data.customers',
            'analytics.feature_engineering',
            'ml_models.predictions'
        ]
        
        self.sample_dependency_status = {
            'raw_data.customers': {
                'is_ready': True,
                'staleness_minutes': 15,
                'row_count': 10000
            },
            'analytics.feature_engineering': {
                'is_ready': True,
                'staleness_minutes': 30,
                'row_count': 10000
            },
            'ml_models.predictions': {
                'is_ready': True,
                'staleness_minutes': 45,
                'row_count': 10000
            }
        }
    
    def test_dependency_validation_success(self):
        """Test successful dependency validation."""
        
        coordinator = DependencyCoordinator(self.mock_context)
        
        with patch.object(coordinator, '_check_dependency_status') as mock_check:
            mock_check.side_effect = lambda dep, time: self.sample_dependency_status[dep]
            
            result = coordinator.validate_upstream_dependencies(
                self.sample_dependencies, 
                datetime.now()
            )
            
            assert result['all_dependencies_ready'] is True
            assert len(result['validation_errors']) == 0
            assert len(result['dependency_status']) == 3
    
    def test_dependency_validation_failure(self):
        """Test dependency validation with failures."""
        
        coordinator = DependencyCoordinator(self.mock_context)
        
        # Simulate failed dependency
        failed_status = self.sample_dependency_status.copy()
        failed_status['ml_models.predictions']['is_ready'] = False
        failed_status['ml_models.predictions']['reason'] = 'Execution failed'
        
        with patch.object(coordinator, '_check_dependency_status') as mock_check:
            mock_check.side_effect = lambda dep, time: failed_status[dep]
            
            result = coordinator.validate_upstream_dependencies(
                self.sample_dependencies,
                datetime.now()
            )
            
            assert result['all_dependencies_ready'] is False
            assert len(result['validation_errors']) > 0
            assert 'ml_models.predictions' in str(result['validation_errors'])
    
    def test_dependency_graph_topological_sort(self):
        """Test dependency graph topological sorting."""
        
        graph = DependencyGraph()
        
        # Add models with dependencies
        graph.add_model('raw_data', [])
        graph.add_model('feature_eng', ['raw_data'])
        graph.add_model('ml_model', ['feature_eng'])
        graph.add_model('analytics', ['ml_model', 'feature_eng'])
        
        execution_order = graph.get_execution_order()
        
        # Validate execution order
        assert len(execution_order) == 4
        assert execution_order[0] == ['raw_data']
        assert execution_order[1] == ['feature_eng']
        assert execution_order[2] == ['ml_model']
        assert execution_order[3] == ['analytics']
    
    def test_parallel_execution_coordination(self):
        """Test parallel execution coordination."""
        
        coordinator = DependencyCoordinator(self.mock_context)
        
        parallel_models = ['model_a', 'model_b', 'model_c']
        
        with patch.object(coordinator, '_execute_individual_model') as mock_execute:
            mock_execute.return_value = {'row_count': 1000, 'status': 'completed'}
            
            result = coordinator.coordinate_parallel_execution(
                parallel_models, max_concurrent=2
            )
            
            assert result['total_models'] == 3
            assert result['successful_count'] == 3
            assert result['failed_count'] == 0
            assert len(result['successful_models']) == 3
    
    def test_resource_aware_scheduling(self):
        """Test resource-aware scheduling functionality."""
        
        resource_limits = {
            'memory_gb': 16,
            'cpu_cores': 8,
            'gpu_count': 2
        }
        
        scheduler = ResourceAwareScheduler(resource_limits)
        
        # Schedule model that fits
        small_requirements = {'memory_gb': 4, 'cpu_cores': 2, 'gpu_count': 0}
        status1 = scheduler.schedule_model_execution('small_model', small_requirements)
        
        assert status1 == 'RUNNING'
        
        # Schedule model that doesn't fit
        large_requirements = {'memory_gb': 16, 'cpu_cores': 8, 'gpu_count': 1}
        status2 = scheduler.schedule_model_execution('large_model', large_requirements)
        
        assert status2 == 'QUEUED'
        
        # Complete first model and check if second starts
        scheduler.complete_model_execution('small_model')
        
        assert 'large_model' in scheduler.running_models
```

## Best Practices and Guidelines

### Coordination Best Practices

```yaml
dependency_coordination_guidelines:
  design_principles:
    - "Minimize coupling between models while ensuring data consistency"
    - "Use explicit dependency declaration for better visibility"
    - "Implement graceful degradation for dependency failures"
    - "Design for parallel execution where possible"
    
  performance_optimization:
    - "Cache frequently accessed dependency data"
    - "Use incremental processing to reduce dependency load"
    - "Implement resource-aware scheduling for large models"
    - "Monitor and optimize dependency resolution overhead"
    
  error_handling:
    - "Validate dependencies before model execution"
    - "Implement retry logic for transient dependency failures"
    - "Provide fallback strategies for critical dependencies"
    - "Log comprehensive dependency status for debugging"
    
  monitoring_and_observability:
    - "Track dependency resolution times and success rates"
    - "Monitor resource utilization during coordinated execution"
    - "Alert on dependency validation failures"
    - "Maintain lineage tracking for all dependency relationships"
```

This comprehensive guide provides robust patterns for coordinating complex dependencies between mixed SQL and Python models in SQLmesh environments, enabling scalable and reliable transformation pipelines.