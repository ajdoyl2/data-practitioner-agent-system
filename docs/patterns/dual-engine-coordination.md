# Dual-Engine Coordination Patterns

## Overview

This guide establishes patterns for successfully operating SQLmesh and dbt in parallel, managing dependencies, deployments, and ensuring optimal performance across both transformation engines.

## Architecture Patterns

### Pattern 1: Engine Specialization by Use Case
**Strategy**: Assign engines based on model characteristics and requirements

#### SQLmesh Specialization
- **High-Cost Models**: Models with expensive warehouse operations
- **Complex Logic**: Models requiring Python integration or advanced transformations
- **Production-Critical**: Models requiring zero-downtime deployment
- **Real-Time Processing**: Models with strict latency requirements

#### dbt Specialization
- **Simple Transformations**: Basic aggregations and joins
- **Rapid Development**: Models requiring quick iteration
- **Legacy Models**: Existing models with established patterns
- **Reporting Models**: Final-layer models consumed by BI tools

```yaml
engine_assignment_rules:
  sqlmesh_criteria:
    - monthly_cost > 1000  # USD
    - python_functions: true
    - zero_downtime_required: true
    - complexity_score > 7  # 1-10 scale
    - execution_time > 30  # minutes
    
  dbt_criteria:
    - monthly_cost < 500   # USD
    - simple_transformations: true
    - rapid_iteration_needed: true
    - existing_dbt_model: true
    - bi_tool_dependency: true
```

### Pattern 2: Layer-Based Separation
**Strategy**: Assign engines based on data transformation layers

#### Layer Assignment
```
┌─────────────────────────────────────────┐
│             Presentation Layer          │
│                  (dbt)                  │ ← BI-friendly, simple aggregations
├─────────────────────────────────────────┤
│              Business Layer             │
│            (SQLmesh + dbt)              │ ← Mixed based on complexity
├─────────────────────────────────────────┤
│             Integration Layer           │
│               (SQLmesh)                 │ ← Cost optimization critical
├─────────────────────────────────────────┤
│               Raw Layer                 │
│               (SQLmesh)                 │ ← Heavy processing, Python logic
└─────────────────────────────────────────┘
```

### Pattern 3: Domain-Based Separation
**Strategy**: Assign engines based on business domains or teams

#### Domain Examples
- **Finance Domain**: SQLmesh (complex calculations, compliance requirements)
- **Marketing Domain**: dbt (rapid iteration, campaign analysis)
- **Operations Domain**: SQLmesh (real-time processing, cost optimization)
- **Analytics Domain**: dbt (exploratory analysis, BI integration)

## Dependency Management

### Cross-Engine Dependencies

#### Approach 1: Shared Staging Layer
```sql
-- SQLmesh model producing shared staging data
MODEL staging.customer_enhanced (
  name customer_enhanced,
  kind FULL,
  dialect postgres
);

SELECT 
  customer_id,
  customer_name,
  customer_tier,
  -- Complex Python logic for customer scoring
  {{ calculate_customer_score(customer_data) }} as customer_score
FROM raw.customers;
```

```sql
-- dbt model consuming SQLmesh output
{{ config(materialized='table') }}

SELECT 
  customer_id,
  customer_score,
  sum(order_amount) as total_orders
FROM {{ ref('staging.customer_enhanced') }}  -- Cross-engine reference
GROUP BY customer_id, customer_score
```

#### Approach 2: Data Contract Interface
```yaml
# data_contracts/customer_enhanced.yml
version: 2
models:
  - name: staging.customer_enhanced
    description: "Customer data enhanced with scoring logic"
    columns:
      - name: customer_id
        data_type: integer
        constraints:
          - type: not_null
          - type: unique
      - name: customer_score
        data_type: float
        constraints:
          - type: not_null
          - type: check
            expression: "customer_score >= 0 AND customer_score <= 100"
    producer: sqlmesh
    consumers: [dbt, downstream_systems]
    sla:
      freshness: "< 1 hour"
      availability: "99.9%"
```

### Dependency Resolution Strategies

#### Strategy 1: Sequential Execution
```yaml
# Orchestration DAG
dependency_graph:
  stage_1_sqlmesh:
    engine: sqlmesh
    models: [raw_processing, data_enrichment]
    depends_on: [source_data]
    
  stage_2_mixed:
    engine: both
    sqlmesh_models: [complex_transformations]
    dbt_models: [simple_aggregations]
    depends_on: [stage_1_sqlmesh]
    
  stage_3_dbt:
    engine: dbt
    models: [presentation_layer, bi_marts]
    depends_on: [stage_2_mixed]
```

#### Strategy 2: Event-Driven Updates
```python
# Event-driven dependency management
class CrossEngineOrchestrator:
    def on_sqlmesh_completion(self, model_name):
        dependent_dbt_models = self.get_dbt_dependencies(model_name)
        for dbt_model in dependent_dbt_models:
            self.trigger_dbt_run(dbt_model)
    
    def on_dbt_completion(self, model_name):
        dependent_sqlmesh_models = self.get_sqlmesh_dependencies(model_name)
        for sqlmesh_model in dependent_sqlmesh_models:
            self.trigger_sqlmesh_run(sqlmesh_model)
```

## Deployment Coordination

### Unified Deployment Pipeline

#### Deployment Stages
```yaml
deployment_pipeline:
  validation_stage:
    sqlmesh_validation:
      - syntax_check
      - unit_tests
      - integration_tests
      - cost_estimation
    dbt_validation:
      - syntax_check
      - data_tests
      - freshness_tests
      - documentation_check
      
  staging_deployment:
    sequence:
      1. deploy_sqlmesh_models
      2. validate_cross_engine_dependencies
      3. deploy_dbt_models
      4. run_end_to_end_tests
      
  production_deployment:
    blue_green_strategy:
      sqlmesh: native_blue_green
      dbt: custom_blue_green_wrapper
    rollback_strategy:
      coordinated_rollback: true
      dependency_aware: true
```

#### Blue-Green Coordination
```python
class DualEngineBlueGreenDeployment:
    def deploy(self):
        # 1. Deploy SQLmesh using native blue-green
        sqlmesh_deployment = self.deploy_sqlmesh_blue_green()
        
        # 2. Update dbt references to new SQLmesh environment
        self.update_dbt_references(sqlmesh_deployment.green_env)
        
        # 3. Deploy dbt models to staging
        dbt_deployment = self.deploy_dbt_to_staging()
        
        # 4. Validate cross-engine integration
        if self.validate_integration():
            # 5. Promote both to production
            self.promote_sqlmesh(sqlmesh_deployment)
            self.promote_dbt(dbt_deployment)
        else:
            # Rollback both engines
            self.rollback_coordinated()
```

### Deployment Safety Checks

#### Pre-Deployment Validation
```yaml
safety_checks:
  cross_engine_compatibility:
    - schema_compatibility_check
    - data_type_validation
    - column_presence_verification
    - referential_integrity_check
    
  performance_validation:
    - execution_time_regression_test
    - resource_usage_validation
    - cost_impact_assessment
    - concurrency_impact_test
    
  data_quality_validation:
    - row_count_comparison
    - data_distribution_analysis
    - business_rule_validation
    - historical_trend_consistency
```

#### Rollback Procedures
```python
class CoordinatedRollback:
    def execute_rollback(self, failure_point):
        if failure_point == "sqlmesh_deployment":
            self.rollback_sqlmesh()
        elif failure_point == "dbt_deployment":
            self.rollback_dbt()
            # SQLmesh remains in new state
        elif failure_point == "integration_validation":
            self.rollback_dbt()
            self.rollback_sqlmesh()
        elif failure_point == "production_promotion":
            self.rollback_both_engines()
            
    def rollback_both_engines(self):
        # Coordinate rollback to previous stable state
        self.rollback_dbt_to_previous()
        self.rollback_sqlmesh_to_previous()
        self.validate_rollback_success()
```

## Resource Management

### Compute Resource Allocation

#### Resource Isolation Strategy
```yaml
resource_allocation:
  sqlmesh_resources:
    development:
      warehouse_size: "small"
      auto_suspend: 60  # seconds
      max_concurrent_queries: 2
    production:
      warehouse_size: "large"
      auto_suspend: 300
      max_concurrent_queries: 10
      
  dbt_resources:
    development:
      threads: 2
      warehouse_size: "x-small"
    production:
      threads: 8
      warehouse_size: "medium"
      
  shared_resources:
    staging_warehouse:
      used_by: [sqlmesh, dbt]
      scheduling: coordinated
      cost_allocation: proportional
```

#### Cost Monitoring and Allocation
```python
class DualEngineCostMonitor:
    def track_costs(self):
        sqlmesh_costs = self.get_sqlmesh_warehouse_costs()
        dbt_costs = self.get_dbt_warehouse_costs()
        shared_costs = self.get_shared_resource_costs()
        
        total_costs = sqlmesh_costs + dbt_costs + shared_costs
        
        cost_breakdown = {
            'sqlmesh_percentage': sqlmesh_costs / total_costs * 100,
            'dbt_percentage': dbt_costs / total_costs * 100,
            'shared_percentage': shared_costs / total_costs * 100,
            'total_monthly': total_costs
        }
        
        self.alert_if_threshold_exceeded(cost_breakdown)
        return cost_breakdown
```

### Performance Optimization

#### Execution Scheduling
```yaml
execution_schedule:
  peak_hours: "8am-6pm"
  off_peak_hours: "6pm-8am"
  
  scheduling_rules:
    peak_hours:
      priority: dbt_models  # Faster execution for BI needs
      sqlmesh_execution: limited
      resource_allocation: 70% dbt, 30% sqlmesh
      
    off_peak_hours:
      priority: sqlmesh_models  # Heavy processing
      dbt_execution: maintenance_only
      resource_allocation: 80% sqlmesh, 20% dbt
```

#### Query Optimization
```python
class DualEngineOptimizer:
    def optimize_execution_plan(self, models_to_run):
        # Analyze cross-engine dependencies
        dependency_graph = self.build_dependency_graph(models_to_run)
        
        # Optimize execution order
        execution_plan = self.create_optimal_plan(dependency_graph)
        
        # Resource allocation optimization
        resource_plan = self.optimize_resource_allocation(execution_plan)
        
        return {
            'execution_order': execution_plan,
            'resource_allocation': resource_plan,
            'estimated_cost': self.estimate_total_cost(execution_plan),
            'estimated_duration': self.estimate_duration(execution_plan)
        }
```

## Monitoring and Observability

### Unified Monitoring Dashboard

#### Key Metrics
```yaml
monitoring_metrics:
  performance_metrics:
    - engine_execution_times
    - cross_engine_dependency_lag
    - resource_utilization_by_engine
    - query_performance_trends
    
  reliability_metrics:
    - deployment_success_rate
    - data_quality_scores
    - sla_compliance_rate
    - error_rate_by_engine
    
  cost_metrics:
    - cost_per_model_by_engine
    - resource_efficiency_trends
    - cost_optimization_opportunities
    - budget_variance_tracking
```

#### Alerting Strategy
```python
class DualEngineAlerting:
    def setup_alerts(self):
        alerts = [
            # Cross-engine dependency failures
            Alert(
                name="cross_engine_dependency_failure",
                condition="dependency_lag > 1 hour",
                severity="high",
                actions=["notify_on_call", "auto_retry"]
            ),
            
            # Cost anomalies
            Alert(
                name="cost_anomaly_detection",
                condition="daily_cost > 1.5 * baseline",
                severity="medium",
                actions=["notify_team", "cost_analysis"]
            ),
            
            # Performance degradation
            Alert(
                name="performance_degradation",
                condition="avg_execution_time > 2 * baseline",
                severity="medium",
                actions=["performance_analysis", "notify_team"]
            )
        ]
        return alerts
```

### Data Lineage Tracking

#### Cross-Engine Lineage
```python
class CrossEngineLineageTracker:
    def track_lineage(self):
        sqlmesh_lineage = self.extract_sqlmesh_lineage()
        dbt_lineage = self.extract_dbt_lineage()
        
        # Merge lineage graphs
        unified_lineage = self.merge_lineage_graphs(
            sqlmesh_lineage, 
            dbt_lineage
        )
        
        # Identify cross-engine dependencies
        cross_engine_deps = self.identify_cross_engine_dependencies(
            unified_lineage
        )
        
        return {
            'unified_lineage': unified_lineage,
            'cross_engine_dependencies': cross_engine_deps,
            'impact_analysis': self.calculate_change_impact(unified_lineage)
        }
```

## Configuration Management

### Engine Selection Configuration

#### Decision Rules Configuration
```yaml
# config/engine_selection_rules.yml
engine_selection:
  default_engine: dbt
  
  sqlmesh_conditions:
    cost_threshold:
      monthly_cost_usd: 1000
      execution_time_minutes: 30
    
    complexity_indicators:
      python_required: true
      complex_window_functions: true
      ml_model_integration: true
    
    reliability_requirements:
      zero_downtime_deployment: true
      sla_availability: "> 99.9%"
  
  override_rules:
    force_sqlmesh:
      models: ["customer_scoring", "fraud_detection"]
      reason: "Business critical, performance sensitive"
    
    force_dbt:
      models: ["simple_reporting.*", "bi_mart.*"]
      reason: "BI tool integration, rapid iteration"
```

#### Environment Configuration
```yaml
# config/dual_engine_environments.yml
environments:
  development:
    sqlmesh:
      gateway: dev_gateway
      environment_suffix: "_dev"
      virtual_environment: true
    dbt:
      target: dev
      profiles_dir: "./profiles"
      
  staging:
    sqlmesh:
      gateway: staging_gateway
      environment_suffix: "_staging"
      virtual_environment: true
    dbt:
      target: staging
      profiles_dir: "./profiles"
      
  production:
    sqlmesh:
      gateway: prod_gateway
      environment_suffix: ""
      virtual_environment: false
    dbt:
      target: prod
      profiles_dir: "./profiles"
```

## Testing Strategies

### Cross-Engine Integration Testing

#### Test Categories
```python
class CrossEngineTestSuite:
    def run_integration_tests(self):
        test_results = {}
        
        # Schema compatibility tests
        test_results['schema_compatibility'] = self.test_schema_compatibility()
        
        # Data consistency tests
        test_results['data_consistency'] = self.test_data_consistency()
        
        # Performance regression tests
        test_results['performance_regression'] = self.test_performance_regression()
        
        # Cross-engine dependency tests
        test_results['dependency_validation'] = self.test_dependency_validation()
        
        return test_results
    
    def test_schema_compatibility(self):
        """Validate that cross-engine model schemas are compatible."""
        compatibility_tests = []
        
        for interface in self.get_cross_engine_interfaces():
            schema_test = self.validate_interface_schema(interface)
            compatibility_tests.append(schema_test)
        
        return all(compatibility_tests)
```

#### Test Automation
```yaml
# .github/workflows/dual_engine_tests.yml
name: Dual Engine Integration Tests

on: [push, pull_request]

jobs:
  test_cross_engine_integration:
    runs-on: ubuntu-latest
    steps:
      - name: Setup SQLmesh
        run: |
          pip install sqlmesh
          sqlmesh init test_project
          
      - name: Setup dbt
        run: |
          pip install dbt-core
          dbt init test_project
          
      - name: Run Cross-Engine Tests
        run: |
          python tests/cross_engine_integration.py
          
      - name: Validate Data Contracts
        run: |
          python tests/data_contract_validation.py
```

## Best Practices

### Model Organization

#### Directory Structure
```
transforms/
├── sqlmesh/
│   ├── models/
│   │   ├── staging/          # High-cost, complex staging
│   │   ├── intermediate/     # Python-heavy processing
│   │   └── shared/          # Cross-engine interfaces
│   ├── tests/
│   └── macros/
├── dbt/
│   ├── models/
│   │   ├── marts/           # BI-friendly final models
│   │   ├── staging/         # Simple staging models
│   │   └── intermediate/    # Basic transformations
│   ├── tests/
│   └── macros/
├── shared/
│   ├── schemas/             # Data contracts
│   ├── tests/              # Cross-engine tests
│   └── documentation/      # Unified documentation
└── config/
    ├── engine_selection.yml
    ├── environments.yml
    └── monitoring.yml
```

#### Naming Conventions
```yaml
naming_conventions:
  sqlmesh_models:
    prefix: "sqlm_"
    example: "sqlm_customer_scoring"
    
  dbt_models:
    prefix: "dbt_"
    example: "dbt_sales_summary"
    
  shared_interfaces:
    prefix: "shared_"
    example: "shared_customer_base"
    
  cross_engine_refs:
    format: "engine.model_name"
    example: "sqlmesh.customer_enhanced"
```

### Documentation Standards

#### Unified Documentation
```yaml
# docs/model_metadata.yml
models:
  - name: customer_enhanced
    engine: sqlmesh
    description: "Customer data with ML-based scoring"
    consumers:
      - engine: dbt
        models: ["customer_segmentation", "sales_analysis"]
    sla:
      freshness: "< 2 hours"
      availability: "99.9%"
    cost_impact: "high"
    
  - name: sales_summary
    engine: dbt
    description: "Aggregated sales metrics for BI consumption"
    dependencies:
      - engine: sqlmesh
        models: ["customer_enhanced", "product_scoring"]
    sla:
      freshness: "< 30 minutes"
      availability: "99.5%"
    cost_impact: "low"
```

### Change Management

#### Change Impact Analysis
```python
class DualEngineChangeImpact:
    def analyze_change_impact(self, changed_models):
        impact_analysis = {}
        
        for model in changed_models:
            # Identify downstream dependencies across engines
            downstream_deps = self.get_downstream_dependencies(model)
            
            # Assess impact scope
            impact_scope = self.calculate_impact_scope(downstream_deps)
            
            # Estimate testing effort
            testing_effort = self.estimate_testing_effort(impact_scope)
            
            impact_analysis[model] = {
                'downstream_dependencies': downstream_deps,
                'impact_scope': impact_scope,
                'testing_effort': testing_effort,
                'risk_level': self.assess_risk_level(impact_scope)
            }
        
        return impact_analysis
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue 1: Cross-Engine Dependency Failures
**Symptoms**: dbt models fail because SQLmesh models haven't completed
**Solution**:
```python
# Implement dependency checking
def check_sqlmesh_dependencies(dbt_model):
    required_sqlmesh_models = get_sqlmesh_dependencies(dbt_model)
    
    for model in required_sqlmesh_models:
        if not is_sqlmesh_model_fresh(model):
            wait_for_sqlmesh_completion(model)
```

#### Issue 2: Schema Evolution Conflicts
**Symptoms**: Schema changes in SQLmesh break downstream dbt models
**Solution**:
```yaml
# Implement schema versioning and validation
schema_evolution:
  versioning_strategy: semantic_versioning
  breaking_change_detection: true
  backward_compatibility_checks: true
  deprecation_warnings: true
```

#### Issue 3: Resource Contention
**Symptoms**: Both engines competing for warehouse resources
**Solution**:
```python
# Implement intelligent resource scheduling
class ResourceScheduler:
    def schedule_execution(self, models_to_run):
        # Prioritize based on business impact and resource requirements
        schedule = self.optimize_resource_allocation(models_to_run)
        return schedule
```

## References

- [Transformation Engine Decision Matrix](./transformation-engine-decision-matrix.md)
- [SQLmesh vs dbt Comparison](./sqlmesh-vs-dbt-comparison.md)
- [Migration Path Guide](./migration-path-guide.md)
- [Cost Optimization Strategies](./cost-optimization-strategies.md)
- [Blue-Green Deployment Workflows](../workflows/blue-green-deployment-checklist.md)