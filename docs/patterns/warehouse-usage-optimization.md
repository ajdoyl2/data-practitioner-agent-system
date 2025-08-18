# Warehouse Usage Optimization Patterns

## Overview

This guide provides comprehensive patterns and strategies for optimizing data warehouse usage in SQLmesh environments, focusing on cost efficiency, performance optimization, and resource management while maintaining data quality and service level agreements.

## Warehouse Optimization Framework

### Core Optimization Principles

1. **Right-sizing**: Match compute resources to actual workload requirements
2. **Auto-scaling**: Dynamically adjust resources based on demand
3. **Intelligent Scheduling**: Optimize workload timing for cost efficiency
4. **Resource Pooling**: Share resources efficiently across teams and workloads
5. **Performance Monitoring**: Continuous monitoring and optimization
6. **Cost Attribution**: Transparent cost allocation and chargeback

### Optimization Targets

```yaml
optimization_targets:
  cost_reduction:
    warehouse_costs: "25-40%"
    development_costs: "60-80%"
    idle_time_reduction: "50%+"
    resource_utilization: ">70%"
    
  performance_improvement:
    query_execution_time: "20-35%"
    data_freshness: "30-50%"
    deployment_frequency: "100%+"
    error_rate_reduction: "80%+"
    
  operational_efficiency:
    deployment_time: "60%+"
    manual_intervention: "90%+"
    monitoring_coverage: "95%+"
    automation_level: "80%+"
```

## Warehouse Sizing Strategies

### Dynamic Sizing Framework

#### Workload Classification
```python
class WorkloadClassifier:
    """Classify workloads for optimal warehouse sizing."""
    
    def __init__(self):
        self.classification_criteria = {
            'data_volume': {
                'small': '<1GB',
                'medium': '1-100GB',
                'large': '100GB-1TB',
                'xlarge': '>1TB'
            },
            'query_complexity': {
                'simple': 'Simple SELECT, basic aggregations',
                'moderate': 'JOINs, window functions',
                'complex': 'Complex analytics, ML operations',
                'intensive': 'Large-scale transformations'
            },
            'concurrency_needs': {
                'low': '1-5 concurrent users',
                'medium': '5-15 concurrent users',
                'high': '15-50 concurrent users',
                'very_high': '>50 concurrent users'
            },
            'sla_requirements': {
                'relaxed': '>30 minutes acceptable',
                'standard': '5-30 minutes',
                'fast': '1-5 minutes',
                'real_time': '<1 minute'
            }
        }
    
    def classify_workload(self, workload_characteristics):
        """Classify workload and recommend warehouse size."""
        
        # Calculate workload score
        scores = {
            'data_volume': self._score_data_volume(workload_characteristics['data_gb']),
            'complexity': self._score_complexity(workload_characteristics['query_type']),
            'concurrency': self._score_concurrency(workload_characteristics['concurrent_users']),
            'sla': self._score_sla(workload_characteristics['sla_minutes'])
        }
        
        # Weighted scoring
        weights = {'data_volume': 0.3, 'complexity': 0.25, 'concurrency': 0.25, 'sla': 0.2}
        weighted_score = sum(scores[key] * weights[key] for key in scores)
        
        # Map score to warehouse size
        return self._map_score_to_size(weighted_score)
    
    def _map_score_to_size(self, score):
        """Map weighted score to warehouse size recommendation."""
        size_mapping = {
            (0.0, 2.0): 'x-small',
            (2.0, 4.0): 'small',
            (4.0, 6.0): 'medium',
            (6.0, 8.0): 'large',
            (8.0, 10.0): 'x-large'
        }
        
        for (min_score, max_score), size in size_mapping.items():
            if min_score <= score < max_score:
                return size
        
        return 'x-large'  # Default for highest scores
```

#### Warehouse Sizing Matrix
```yaml
warehouse_sizing_matrix:
  x_small:
    cpu_cores: 1
    memory_gb: 8
    cost_per_hour: "$2"
    use_cases:
      - individual_development
      - small_analytics_queries
      - testing_and_validation
      - data_exploration
    data_volume_limit: "1GB"
    concurrent_users: "1-2"
    recommended_for:
      - feature_development
      - ad_hoc_analysis
      - proof_of_concepts
      
  small:
    cpu_cores: 2
    memory_gb: 16
    cost_per_hour: "$4"
    use_cases:
      - team_development
      - moderate_analytics
      - integration_testing
      - small_production_workloads
    data_volume_limit: "10GB"
    concurrent_users: "2-5"
    recommended_for:
      - shared_development_environments
      - departmental_analytics
      - staging_environments
      
  medium:
    cpu_cores: 4
    memory_gb: 32
    cost_per_hour: "$8"
    use_cases:
      - production_workloads
      - batch_processing
      - business_intelligence
      - real_time_analytics
    data_volume_limit: "100GB"
    concurrent_users: "5-15"
    recommended_for:
      - production_environments
      - business_critical_analytics
      - real_time_dashboards
      
  large:
    cpu_cores: 8
    memory_gb: 64
    cost_per_hour: "$16"
    use_cases:
      - high_volume_production
      - complex_analytics
      - machine_learning
      - enterprise_reporting
    data_volume_limit: "1TB"
    concurrent_users: "15-50"
    recommended_for:
      - enterprise_production
      - ml_model_training
      - complex_transformations
      
  x_large:
    cpu_cores: 16
    memory_gb: 128
    cost_per_hour: "$32"
    use_cases:
      - massive_data_processing
      - real_time_streaming
      - advanced_analytics
      - mission_critical_workloads
    data_volume_limit: ">1TB"
    concurrent_users: ">50"
    recommended_for:
      - enterprise_scale_processing
      - real_time_streaming_analytics
      - mission_critical_operations
```

### Auto-Scaling Implementation

#### Intelligent Auto-Scaling
```python
class IntelligentAutoScaler:
    """Intelligent auto-scaling for warehouse resources."""
    
    def __init__(self):
        self.scaling_policies = {
            'scale_up_thresholds': {
                'cpu_utilization': 80,      # %
                'memory_utilization': 85,   # %
                'queue_wait_time': 120,     # seconds
                'query_execution_time': 300 # seconds (5 minutes)
            },
            'scale_down_thresholds': {
                'cpu_utilization': 30,      # %
                'memory_utilization': 40,   # %
                'idle_time': 600,          # seconds (10 minutes)
                'low_activity_period': 1800 # seconds (30 minutes)
            },
            'scaling_constraints': {
                'max_scale_up_steps': 2,    # Max size jumps
                'min_stable_time': 300,     # seconds before next scaling
                'cooldown_period': 900,     # seconds after scaling
                'business_hours_protection': True
            }
        }
    
    def evaluate_scaling_decision(self, current_metrics, warehouse_config):
        """Evaluate whether to scale warehouse up or down."""
        
        current_size = warehouse_config['size']
        scaling_decision = {
            'action': 'no_change',
            'target_size': current_size,
            'reason': '',
            'confidence': 0.0
        }
        
        # Check for scale-up conditions
        scale_up_score = self._calculate_scale_up_score(current_metrics)
        if scale_up_score > 0.7:
            target_size = self._calculate_target_size_up(current_size, scale_up_score)
            scaling_decision = {
                'action': 'scale_up',
                'target_size': target_size,
                'reason': f'High resource utilization detected (score: {scale_up_score:.2f})',
                'confidence': scale_up_score
            }
        
        # Check for scale-down conditions (only if not scaling up)
        elif self._is_eligible_for_scale_down(current_metrics, warehouse_config):
            scale_down_score = self._calculate_scale_down_score(current_metrics)
            if scale_down_score > 0.6:
                target_size = self._calculate_target_size_down(current_size, scale_down_score)
                scaling_decision = {
                    'action': 'scale_down',
                    'target_size': target_size,
                    'reason': f'Low resource utilization detected (score: {scale_down_score:.2f})',
                    'confidence': scale_down_score
                }
        
        # Apply business rules and constraints
        scaling_decision = self._apply_scaling_constraints(scaling_decision, warehouse_config)
        
        return scaling_decision
    
    def _calculate_scale_up_score(self, metrics):
        """Calculate scale-up necessity score."""
        scores = []
        
        # CPU utilization score
        if metrics['cpu_utilization'] > self.scaling_policies['scale_up_thresholds']['cpu_utilization']:
            scores.append(min(1.0, metrics['cpu_utilization'] / 100))
        
        # Memory utilization score
        if metrics['memory_utilization'] > self.scaling_policies['scale_up_thresholds']['memory_utilization']:
            scores.append(min(1.0, metrics['memory_utilization'] / 100))
        
        # Queue wait time score
        if metrics['avg_queue_wait_time'] > self.scaling_policies['scale_up_thresholds']['queue_wait_time']:
            scores.append(min(1.0, metrics['avg_queue_wait_time'] / 300))  # Normalize to 5 minutes
        
        # Query execution time score
        if metrics['avg_query_time'] > self.scaling_policies['scale_up_thresholds']['query_execution_time']:
            scores.append(min(1.0, metrics['avg_query_time'] / 600))  # Normalize to 10 minutes
        
        return max(scores) if scores else 0.0
    
    def _is_eligible_for_scale_down(self, metrics, config):
        """Check if warehouse is eligible for scale-down."""
        
        # Don't scale down during business hours for production
        if config.get('business_hours_protection') and self._is_business_hours():
            return False
        
        # Don't scale down if recently scaled
        if self._recently_scaled(config):
            return False
        
        # Don't scale down below minimum size
        if config['size'] == 'x-small':
            return False
        
        return True
```

## Resource Utilization Optimization

### Utilization Monitoring and Analytics

#### Comprehensive Utilization Tracking
```python
class WarehouseUtilizationAnalyzer:
    """Analyze warehouse utilization patterns for optimization."""
    
    def __init__(self, metrics_collector):
        self.metrics = metrics_collector
        self.utilization_targets = {
            'cpu_utilization_target': 70,      # %
            'memory_utilization_target': 75,   # %
            'io_utilization_target': 65,       # %
            'network_utilization_target': 60,  # %
            'overall_efficiency_target': 70    # %
        }
    
    def analyze_utilization_patterns(self, warehouse_name, time_period_days=30):
        """Analyze utilization patterns and identify optimization opportunities."""
        
        # Collect utilization data
        utilization_data = self._collect_utilization_data(warehouse_name, time_period_days)
        
        # Analyze patterns
        patterns = {
            'hourly_patterns': self._analyze_hourly_patterns(utilization_data),
            'daily_patterns': self._analyze_daily_patterns(utilization_data),
            'weekly_patterns': self._analyze_weekly_patterns(utilization_data),
            'utilization_efficiency': self._calculate_utilization_efficiency(utilization_data),
            'idle_time_analysis': self._analyze_idle_time(utilization_data),
            'peak_usage_analysis': self._analyze_peak_usage(utilization_data)
        }
        
        # Generate optimization recommendations
        recommendations = self._generate_utilization_recommendations(patterns, warehouse_name)
        
        return {
            'warehouse_name': warehouse_name,
            'analysis_period': time_period_days,
            'utilization_patterns': patterns,
            'optimization_recommendations': recommendations,
            'efficiency_score': self._calculate_overall_efficiency_score(patterns),
            'cost_optimization_potential': self._calculate_cost_optimization_potential(patterns)
        }
    
    def _analyze_hourly_patterns(self, utilization_data):
        """Analyze hourly utilization patterns."""
        
        hourly_avg = {}
        for hour in range(24):
            hour_data = [d for d in utilization_data if d['hour'] == hour]
            if hour_data:
                hourly_avg[hour] = {
                    'cpu_utilization': np.mean([d['cpu_util'] for d in hour_data]),
                    'memory_utilization': np.mean([d['memory_util'] for d in hour_data]),
                    'query_count': np.mean([d['query_count'] for d in hour_data]),
                    'cost_per_hour': np.mean([d['cost'] for d in hour_data])
                }
        
        # Identify peak and off-peak hours
        peak_hours = self._identify_peak_hours(hourly_avg)
        off_peak_hours = self._identify_off_peak_hours(hourly_avg)
        
        return {
            'hourly_averages': hourly_avg,
            'peak_hours': peak_hours,
            'off_peak_hours': off_peak_hours,
            'utilization_variance': self._calculate_hourly_variance(hourly_avg)
        }
    
    def _generate_utilization_recommendations(self, patterns, warehouse_name):
        """Generate utilization optimization recommendations."""
        
        recommendations = []
        
        # Check for low utilization
        if patterns['utilization_efficiency']['average_utilization'] < 50:
            recommendations.append({
                'type': 'warehouse_downsizing',
                'priority': 'high',
                'description': f'Average utilization is {patterns["utilization_efficiency"]["average_utilization"]:.1f}%. Consider downsizing warehouse.',
                'estimated_savings': self._calculate_downsizing_savings(warehouse_name),
                'implementation': 'Reduce warehouse size by 1-2 levels'
            })
        
        # Check for excessive idle time
        if patterns['idle_time_analysis']['idle_percentage'] > 40:
            recommendations.append({
                'type': 'auto_suspend_optimization',
                'priority': 'medium',
                'description': f'Warehouse is idle {patterns["idle_time_analysis"]["idle_percentage"]:.1f}% of the time.',
                'estimated_savings': self._calculate_auto_suspend_savings(patterns['idle_time_analysis']),
                'implementation': 'Implement aggressive auto-suspend policies'
            })
        
        # Check for peak hour optimization
        if patterns['hourly_patterns']['utilization_variance'] > 0.3:
            recommendations.append({
                'type': 'peak_hour_scaling',
                'priority': 'medium',
                'description': 'High utilization variance suggests opportunity for time-based scaling.',
                'estimated_savings': self._calculate_peak_scaling_savings(patterns['hourly_patterns']),
                'implementation': 'Implement time-based auto-scaling policies'
            })
        
        return recommendations
```

### Query Performance Optimization

#### Query Optimization Framework
```yaml
query_optimization_framework:
  performance_categories:
    execution_time:
      excellent: "<30 seconds"
      good: "30 seconds - 2 minutes"
      acceptable: "2 minutes - 10 minutes"
      poor: ">10 minutes"
      
    resource_usage:
      efficient: "<$0.10 per query"
      moderate: "$0.10 - $1.00 per query"
      expensive: "$1.00 - $10.00 per query"
      very_expensive: ">$10.00 per query"
      
    data_scanned:
      optimized: "<10% of table data"
      acceptable: "10% - 50% of table data"
      inefficient: "50% - 90% of table data"
      poor: ">90% of table data (full scan)"
      
  optimization_techniques:
    indexing_strategies:
      - clustered_indexes
      - covering_indexes
      - filtered_indexes
      - columnstore_indexes
      
    partitioning_strategies:
      - date_based_partitioning
      - hash_partitioning
      - range_partitioning
      - composite_partitioning
      
    query_rewriting:
      - predicate_pushdown
      - join_optimization
      - subquery_optimization
      - window_function_optimization
      
    caching_strategies:
      - result_set_caching
      - materialized_views
      - query_plan_caching
      - metadata_caching
```

#### Automated Query Optimization
```python
class QueryOptimizationEngine:
    """Automated query optimization for warehouse efficiency."""
    
    def __init__(self):
        self.optimization_rules = {
            'partition_pruning': {
                'description': 'Add partition filters to reduce data scanned',
                'impact': 'high',
                'complexity': 'low'
            },
            'index_optimization': {
                'description': 'Add or optimize indexes for frequent queries',
                'impact': 'medium',
                'complexity': 'medium'
            },
            'join_optimization': {
                'description': 'Optimize join order and conditions',
                'impact': 'medium',
                'complexity': 'medium'
            },
            'aggregation_optimization': {
                'description': 'Pre-aggregate frequently used calculations',
                'impact': 'high',
                'complexity': 'high'
            }
        }
    
    def analyze_query_performance(self, query_log, time_period_days=7):
        """Analyze query performance and identify optimization opportunities."""
        
        # Parse and categorize queries
        query_analysis = self._categorize_queries(query_log)
        
        # Identify expensive queries
        expensive_queries = self._identify_expensive_queries(query_analysis)
        
        # Analyze patterns
        patterns = self._analyze_query_patterns(query_analysis)
        
        # Generate optimization recommendations
        optimizations = self._generate_query_optimizations(expensive_queries, patterns)
        
        return {
            'analysis_summary': {
                'total_queries': len(query_log),
                'expensive_queries': len(expensive_queries),
                'optimization_opportunities': len(optimizations),
                'potential_cost_savings': sum(opt['estimated_savings'] for opt in optimizations)
            },
            'expensive_queries': expensive_queries,
            'query_patterns': patterns,
            'optimization_recommendations': optimizations
        }
    
    def _identify_expensive_queries(self, query_analysis):
        """Identify queries that consume significant resources."""
        
        expensive_queries = []
        
        for query in query_analysis:
            cost_score = self._calculate_cost_score(query)
            if cost_score > 0.7:  # High cost threshold
                expensive_queries.append({
                    'query_id': query['id'],
                    'query_text': query['text'][:200] + '...',  # Truncated for display
                    'execution_time_avg': query['avg_execution_time'],
                    'cost_per_execution': query['cost_per_execution'],
                    'execution_frequency': query['execution_count'],
                    'total_monthly_cost': query['total_monthly_cost'],
                    'cost_score': cost_score,
                    'optimization_potential': self._assess_optimization_potential(query)
                })
        
        return sorted(expensive_queries, key=lambda x: x['total_monthly_cost'], reverse=True)
    
    def _generate_query_optimizations(self, expensive_queries, patterns):
        """Generate specific optimization recommendations."""
        
        optimizations = []
        
        for query in expensive_queries:
            query_optimizations = []
            
            # Check for partition pruning opportunities
            if self._can_benefit_from_partition_pruning(query):
                query_optimizations.append({
                    'type': 'partition_pruning',
                    'description': 'Add date/time filters to enable partition pruning',
                    'estimated_improvement': '50-80%',
                    'estimated_savings': query['total_monthly_cost'] * 0.65,
                    'implementation_effort': 'low'
                })
            
            # Check for indexing opportunities
            if self._can_benefit_from_indexing(query):
                query_optimizations.append({
                    'type': 'indexing',
                    'description': 'Add indexes on frequently filtered columns',
                    'estimated_improvement': '30-60%',
                    'estimated_savings': query['total_monthly_cost'] * 0.45,
                    'implementation_effort': 'medium'
                })
            
            # Check for materialized view opportunities
            if self._can_benefit_from_materialized_views(query, patterns):
                query_optimizations.append({
                    'type': 'materialized_view',
                    'description': 'Create materialized view for frequently accessed data',
                    'estimated_improvement': '70-90%',
                    'estimated_savings': query['total_monthly_cost'] * 0.80,
                    'implementation_effort': 'high'
                })
            
            if query_optimizations:
                optimizations.append({
                    'query_id': query['query_id'],
                    'current_monthly_cost': query['total_monthly_cost'],
                    'optimizations': query_optimizations,
                    'total_potential_savings': sum(opt['estimated_savings'] for opt in query_optimizations),
                    'recommended_priority': self._calculate_optimization_priority(query, query_optimizations)
                })
        
        return optimizations
```

## Cost Management Strategies

### Multi-Tier Cost Optimization

#### Cost Tier Framework
```yaml
cost_tier_framework:
  tier_1_immediate_wins:
    timeframe: "1-2 weeks"
    effort: "low"
    impact: "medium"
    strategies:
      - auto_suspend_optimization
      - warehouse_right_sizing
      - idle_time_reduction
      - basic_query_optimization
    expected_savings: "15-25%"
    
  tier_2_operational_improvements:
    timeframe: "1-3 months"
    effort: "medium"
    impact: "high"
    strategies:
      - virtual_environment_implementation
      - intelligent_auto_scaling
      - workload_scheduling_optimization
      - result_caching_implementation
    expected_savings: "25-40%"
    
  tier_3_strategic_optimization:
    timeframe: "3-6 months"
    effort: "high"
    impact: "very_high"
    strategies:
      - data_lifecycle_management
      - advanced_query_optimization
      - predictive_scaling
      - cross_region_optimization
    expected_savings: "40-60%"
```

#### Dynamic Pricing Optimization
```python
class DynamicPricingOptimizer:
    """Optimize warehouse usage based on dynamic pricing models."""
    
    def __init__(self):
        self.pricing_tiers = {
            'on_demand': {
                'cost_multiplier': 1.0,
                'availability': 'immediate',
                'commitment': 'none'
            },
            'reserved': {
                'cost_multiplier': 0.7,  # 30% discount
                'availability': 'planned',
                'commitment': '1_year'
            },
            'spot': {
                'cost_multiplier': 0.3,  # 70% discount
                'availability': 'variable',
                'commitment': 'none'
            }
        }
    
    def optimize_workload_placement(self, workloads, cost_constraints):
        """Optimize workload placement across pricing tiers."""
        
        optimized_placement = {}
        
        for workload in workloads:
            # Analyze workload characteristics
            workload_profile = self._analyze_workload_profile(workload)
            
            # Determine optimal pricing tier
            optimal_tier = self._select_optimal_tier(workload_profile, cost_constraints)
            
            # Calculate cost savings
            cost_savings = self._calculate_tier_savings(workload, optimal_tier)
            
            optimized_placement[workload['id']] = {
                'current_tier': workload.get('current_tier', 'on_demand'),
                'recommended_tier': optimal_tier,
                'cost_savings': cost_savings,
                'implementation_strategy': self._create_implementation_strategy(workload, optimal_tier)
            }
        
        return {
            'optimized_placement': optimized_placement,
            'total_cost_savings': sum(p['cost_savings'] for p in optimized_placement.values()),
            'implementation_timeline': self._create_implementation_timeline(optimized_placement)
        }
```

### Resource Pooling and Sharing

#### Shared Resource Management
```yaml
shared_resource_strategies:
  development_pool:
    strategy: "shared_virtual_environments"
    participants: ["development_teams", "qa_teams", "data_analysts"]
    resource_allocation:
      peak_hours: "team_priority_based"
      off_peak: "first_come_first_served"
    cost_allocation: "usage_based_chargeback"
    expected_savings: "40-60%"
    
  analytics_pool:
    strategy: "shared_analytics_warehouse"
    participants: ["business_analysts", "data_scientists", "reporting_teams"]
    resource_allocation:
      business_hours: "sla_based_priority"
      after_hours: "batch_processing_priority"
    cost_allocation: "departmental_split"
    expected_savings: "30-50%"
    
  staging_pool:
    strategy: "shared_staging_environment"
    participants: ["all_development_teams"]
    resource_allocation:
      deployment_windows: "scheduled_slots"
      testing_periods: "concurrent_access"
    cost_allocation: "project_based"
    expected_savings: "50-70%"
```

#### Resource Pool Implementation
```python
class ResourcePoolManager:
    """Manage shared resource pools for cost optimization."""
    
    def __init__(self):
        self.pool_configurations = {
            'development_pool': {
                'max_warehouses': 5,
                'auto_scaling': True,
                'priority_levels': 3,
                'cost_allocation': 'usage_based'
            },
            'analytics_pool': {
                'max_warehouses': 3,
                'auto_scaling': True,
                'priority_levels': 2,
                'cost_allocation': 'time_based'
            },
            'staging_pool': {
                'max_warehouses': 2,
                'auto_scaling': False,
                'priority_levels': 1,
                'cost_allocation': 'equal_split'
            }
        }
    
    def optimize_resource_allocation(self, pool_name, current_demand, forecast_demand):
        """Optimize resource allocation within a resource pool."""
        
        pool_config = self.pool_configurations[pool_name]
        
        # Analyze current utilization
        utilization_analysis = self._analyze_pool_utilization(pool_name, current_demand)
        
        # Forecast future needs
        demand_forecast = self._forecast_demand(forecast_demand)
        
        # Optimize allocation
        optimized_allocation = {
            'current_allocation': utilization_analysis['current_allocation'],
            'recommended_allocation': self._calculate_optimal_allocation(
                current_demand, 
                demand_forecast, 
                pool_config
            ),
            'scaling_recommendations': self._generate_scaling_recommendations(
                utilization_analysis, 
                demand_forecast
            ),
            'cost_impact': self._calculate_allocation_cost_impact(
                utilization_analysis, 
                demand_forecast
            )
        }
        
        return optimized_allocation
    
    def implement_cost_allocation(self, pool_name, usage_data, allocation_method):
        """Implement cost allocation for shared resources."""
        
        allocation_strategies = {
            'usage_based': self._allocate_by_usage,
            'time_based': self._allocate_by_time,
            'equal_split': self._allocate_equally,
            'priority_weighted': self._allocate_by_priority
        }
        
        allocation_function = allocation_strategies.get(allocation_method, self._allocate_by_usage)
        
        cost_allocation = allocation_function(usage_data)
        
        return {
            'allocation_method': allocation_method,
            'cost_breakdown': cost_allocation,
            'total_cost': sum(cost_allocation.values()),
            'allocation_report': self._generate_allocation_report(cost_allocation)
        }
```

## Monitoring and Alerting

### Comprehensive Monitoring Framework

#### Performance Monitoring
```yaml
performance_monitoring:
  warehouse_metrics:
    - cpu_utilization_percentage
    - memory_utilization_percentage
    - io_throughput_mbps
    - network_utilization_percentage
    - query_queue_length
    - active_sessions_count
    
  query_metrics:
    - average_execution_time
    - query_success_rate
    - queries_per_second
    - data_scanned_per_query
    - cost_per_query
    - cache_hit_ratio
    
  cost_metrics:
    - hourly_warehouse_cost
    - daily_cost_trend
    - cost_per_gb_processed
    - cost_variance_from_budget
    - cost_efficiency_ratio
    - resource_utilization_cost
    
  sla_metrics:
    - query_response_time_p95
    - system_availability_percentage
    - data_freshness_minutes
    - error_rate_percentage
    - deployment_success_rate
    - recovery_time_objective
```

#### Intelligent Alerting System
```python
class IntelligentAlertingSystem:
    """Intelligent alerting for warehouse optimization."""
    
    def __init__(self):
        self.alert_thresholds = {
            'performance_alerts': {
                'high_cpu_utilization': {'threshold': 85, 'duration': 300},
                'high_memory_utilization': {'threshold': 90, 'duration': 300},
                'long_query_execution': {'threshold': 1800, 'count': 5},
                'high_queue_length': {'threshold': 10, 'duration': 180}
            },
            'cost_alerts': {
                'budget_exceeded': {'threshold': 100, 'period': 'daily'},
                'cost_anomaly': {'threshold': 150, 'baseline': 'weekly_average'},
                'expensive_query': {'threshold': 50, 'frequency': 'per_execution'},
                'idle_warehouse': {'threshold': 3600, 'cost_impact': 10}
            },
            'optimization_alerts': {
                'under_utilized_warehouse': {'threshold': 30, 'duration': 7200},
                'scaling_opportunity': {'threshold': 80, 'duration': 1800},
                'auto_suspend_failure': {'threshold': 1, 'impact': 'cost'},
                'optimization_opportunity': {'savings': 100, 'confidence': 80}
            }
        }
    
    def evaluate_alerts(self, metrics, warehouse_config):
        """Evaluate current metrics against alert thresholds."""
        
        active_alerts = []
        
        # Performance alerts
        performance_alerts = self._check_performance_alerts(metrics)
        active_alerts.extend(performance_alerts)
        
        # Cost alerts
        cost_alerts = self._check_cost_alerts(metrics, warehouse_config)
        active_alerts.extend(cost_alerts)
        
        # Optimization alerts
        optimization_alerts = self._check_optimization_alerts(metrics, warehouse_config)
        active_alerts.extend(optimization_alerts)
        
        # Prioritize and deduplicate alerts
        prioritized_alerts = self._prioritize_alerts(active_alerts)
        
        return {
            'active_alerts': prioritized_alerts,
            'alert_summary': self._create_alert_summary(prioritized_alerts),
            'recommended_actions': self._generate_recommended_actions(prioritized_alerts)
        }
    
    def _check_cost_alerts(self, metrics, warehouse_config):
        """Check for cost-related alerts."""
        
        alerts = []
        
        # Budget exceeded alert
        if metrics['daily_cost'] > warehouse_config.get('daily_budget', float('inf')):
            alerts.append({
                'type': 'budget_exceeded',
                'severity': 'high',
                'message': f'Daily cost ${metrics["daily_cost"]:.2f} exceeds budget ${warehouse_config["daily_budget"]:.2f}',
                'recommended_action': 'Review warehouse usage and consider downsizing',
                'cost_impact': metrics['daily_cost'] - warehouse_config['daily_budget']
            })
        
        # Cost anomaly detection
        if metrics['cost_variance'] > 50:  # 50% above baseline
            alerts.append({
                'type': 'cost_anomaly',
                'severity': 'medium',
                'message': f'Cost is {metrics["cost_variance"]:.1f}% above baseline',
                'recommended_action': 'Investigate unusual usage patterns',
                'cost_impact': metrics['anomaly_cost_impact']
            })
        
        # Expensive query alert
        expensive_queries = [q for q in metrics.get('recent_queries', []) if q['cost'] > 50]
        if expensive_queries:
            alerts.append({
                'type': 'expensive_queries',
                'severity': 'medium',
                'message': f'{len(expensive_queries)} expensive queries detected',
                'recommended_action': 'Review and optimize expensive queries',
                'cost_impact': sum(q['cost'] for q in expensive_queries)
            })
        
        return alerts
```

## Implementation Guidelines

### Optimization Implementation Roadmap

#### Phase 1: Foundation (Weeks 1-4)
```yaml
phase_1_foundation:
  objectives:
    - establish_baseline_metrics
    - implement_basic_monitoring
    - configure_auto_suspend_policies
    - setup_cost_tracking
    
  deliverables:
    - warehouse_utilization_dashboard
    - cost_monitoring_alerts
    - auto_suspend_configurations
    - baseline_performance_report
    
  success_criteria:
    - 100% warehouse monitoring coverage
    - Auto-suspend policies active on all non-production warehouses
    - Cost tracking implemented with daily reports
    - Baseline metrics established for all warehouses
```

#### Phase 2: Optimization (Weeks 5-12)
```yaml
phase_2_optimization:
  objectives:
    - implement_intelligent_auto_scaling
    - optimize_query_performance
    - establish_resource_pools
    - deploy_cost_optimization_strategies
    
  deliverables:
    - auto_scaling_policies
    - query_optimization_recommendations
    - shared_resource_pools
    - cost_optimization_dashboard
    
  success_criteria:
    - 25% reduction in warehouse costs
    - 30% improvement in query performance
    - Resource utilization >70%
    - Automated scaling operational
```

#### Phase 3: Advanced Optimization (Weeks 13-24)
```yaml
phase_3_advanced:
  objectives:
    - implement_predictive_scaling
    - deploy_advanced_cost_controls
    - establish_continuous_optimization
    - create_self_healing_systems
    
  deliverables:
    - predictive_scaling_engine
    - advanced_cost_controls
    - continuous_optimization_workflows
    - self_healing_automation
    
  success_criteria:
    - 40% total cost reduction achieved
    - 95% automation of optimization tasks
    - Predictive scaling accuracy >85%
    - Self-healing systems operational
```

### Best Practices and Guidelines

#### Warehouse Management Best Practices
```yaml
warehouse_best_practices:
  sizing_guidelines:
    - start_small_scale_up: "Begin with smallest viable size"
    - monitor_before_scaling: "Collect 1-2 weeks of data before changes"
    - gradual_scaling: "Scale in single size increments"
    - peak_capacity_planning: "Size for 80% of peak load"
    
  auto_suspend_policies:
    - development_environments: "60 seconds idle time"
    - testing_environments: "120 seconds idle time"
    - staging_environments: "300 seconds idle time"
    - production_environments: "600 seconds idle time"
    
  cost_control_measures:
    - daily_budget_limits: "Set for all non-production warehouses"
    - cost_anomaly_alerts: "Alert on 50% cost increase"
    - resource_utilization_targets: "Maintain 70%+ utilization"
    - regular_cost_reviews: "Weekly cost review meetings"
    
  performance_optimization:
    - query_timeout_limits: "Set maximum query execution times"
    - result_caching: "Enable for frequently accessed data"
    - materialized_views: "Use for complex aggregations"
    - partition_pruning: "Implement date-based partitioning"
```

#### Success Measurement Framework
```yaml
success_measurement:
  financial_metrics:
    cost_reduction_percentage: "Target: 30-50%"
    roi_achievement: "Target: 300%+ within 12 months"
    cost_per_gb_processed: "Target: <$0.05/GB"
    budget_variance: "Target: <5% variance"
    
  operational_metrics:
    warehouse_utilization: "Target: >70%"
    query_performance_improvement: "Target: 25%+"
    deployment_frequency: "Target: 2x improvement"
    incident_reduction: "Target: 50%+ reduction"
    
  user_satisfaction:
    developer_satisfaction: "Target: >8/10"
    query_response_time: "Target: <2 minutes p95"
    system_availability: "Target: >99.9%"
    support_ticket_reduction: "Target: 60%+"
```

## References

- [Cost Optimization Strategies](./cost-optimization-strategies.md)
- [Virtual Environment Guidelines](./virtual-environment-guidelines.md)
- [Transformation Engine Decision Matrix](./transformation-engine-decision-matrix.md)
- [SQLmesh vs dbt Comparison](./sqlmesh-vs-dbt-comparison.md)
- [Blue-Green Deployment Workflows](../workflows/blue-green-deployment-checklist.md)