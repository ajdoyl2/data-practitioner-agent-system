"""
Cost Optimization Advisor for Data Architect Agent

This module provides intelligent cost optimization recommendations and monitoring
capabilities specifically designed for the data architect agent to make strategic
decisions about warehouse usage, resource allocation, and cost management.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Union
import numpy as np
from collections import defaultdict

logger = logging.getLogger(__name__)


class OptimizationPriority(Enum):
    """Priority levels for optimization recommendations."""
    CRITICAL = "critical"    # Immediate action required, high cost impact
    HIGH = "high"           # Significant cost savings opportunity
    MEDIUM = "medium"       # Moderate cost savings potential
    LOW = "low"            # Minor optimization opportunity


class CostCategory(Enum):
    """Categories of costs for optimization analysis."""
    COMPUTE = "compute"
    STORAGE = "storage"
    DATA_TRANSFER = "data_transfer"
    LICENSING = "licensing"
    OPERATIONS = "operations"


@dataclass
class CostMetrics:
    """Cost metrics for analysis and optimization."""
    daily_cost: float
    monthly_cost: float
    cost_trend: float  # Percentage change over time
    cost_per_gb_processed: float
    cost_per_query: float
    cost_by_category: Dict[CostCategory, float] = field(default_factory=dict)
    cost_attribution: Dict[str, float] = field(default_factory=dict)


@dataclass
class OptimizationRecommendation:
    """Cost optimization recommendation with implementation details."""
    id: str
    title: str
    description: str
    priority: OptimizationPriority
    category: CostCategory
    estimated_monthly_savings: float
    implementation_effort: str  # "low", "medium", "high"
    implementation_time: str    # e.g., "1-2 weeks"
    risk_level: str            # "low", "medium", "high"
    prerequisites: List[str]
    implementation_steps: List[str]
    success_metrics: List[str]
    monitoring_requirements: List[str]
    rollback_plan: Optional[str] = None


@dataclass
class WarehouseUsagePattern:
    """Warehouse usage pattern analysis."""
    warehouse_name: str
    average_utilization: float
    peak_utilization: float
    idle_time_percentage: float
    cost_efficiency_score: float
    usage_pattern: str  # "consistent", "bursty", "peak_hours", "irregular"
    optimization_opportunity: float


class CostOptimizationAdvisor:
    """
    Intelligent cost optimization advisor for data architect agent.
    
    Provides strategic recommendations for cost optimization across the entire
    data platform, focusing on warehouse usage, resource allocation, and
    architectural improvements.
    """
    
    def __init__(self, warehouse_connector, cost_monitor):
        self.warehouse_connector = warehouse_connector
        self.cost_monitor = cost_monitor
        self.logger = logging.getLogger(self.__class__.__name__)
        
        # Optimization thresholds and targets
        self.optimization_thresholds = {
            'warehouse_utilization_low': 0.3,      # Below 30% utilization
            'warehouse_utilization_target': 0.7,    # Target 70% utilization
            'cost_anomaly_threshold': 2.0,          # 100% increase over baseline
            'idle_time_excessive': 0.4,             # More than 40% idle time
            'cost_per_gb_high': 0.10,              # Above $0.10 per GB processed
        }
        
        # Cost optimization targets
        self.optimization_targets = {
            'warehouse_cost_reduction': 0.25,       # 25% reduction target
            'development_cost_reduction': 0.60,     # 60% reduction in dev costs
            'storage_cost_reduction': 0.15,         # 15% storage cost reduction
            'roi_target': 3.0,                      # 3:1 ROI target
        }
    
    def analyze_cost_optimization_opportunities(self, time_period_days: int = 30) -> Dict:
        """
        Comprehensive analysis of cost optimization opportunities.
        
        Args:
            time_period_days: Number of days to analyze for patterns
            
        Returns:
            Dictionary containing optimization analysis and recommendations
        """
        self.logger.info(f"Starting cost optimization analysis for {time_period_days} days")
        
        # Collect cost data and usage patterns
        cost_data = self._collect_cost_data(time_period_days)
        usage_patterns = self._analyze_usage_patterns(time_period_days)
        
        # Perform various optimization analyses
        warehouse_optimization = self._analyze_warehouse_optimization(usage_patterns)
        virtual_env_opportunities = self._analyze_virtual_environment_opportunities(cost_data)
        query_optimization = self._analyze_query_optimization_opportunities(time_period_days)
        storage_optimization = self._analyze_storage_optimization_opportunities(cost_data)
        lifecycle_optimization = self._analyze_data_lifecycle_opportunities(cost_data)
        
        # Generate prioritized recommendations
        recommendations = self._generate_prioritized_recommendations([
            warehouse_optimization,
            virtual_env_opportunities,
            query_optimization,
            storage_optimization,
            lifecycle_optimization
        ])
        
        # Calculate total optimization potential
        optimization_potential = self._calculate_optimization_potential(recommendations)
        
        # Create implementation roadmap
        implementation_roadmap = self._create_implementation_roadmap(recommendations)
        
        analysis_result = {
            'analysis_timestamp': datetime.utcnow(),
            'time_period_analyzed': time_period_days,
            'current_cost_metrics': cost_data,
            'usage_patterns': usage_patterns,
            'optimization_opportunities': {
                'warehouse_optimization': warehouse_optimization,
                'virtual_environment_opportunities': virtual_env_opportunities,
                'query_optimization': query_optimization,
                'storage_optimization': storage_optimization,
                'lifecycle_optimization': lifecycle_optimization
            },
            'recommendations': recommendations,
            'optimization_potential': optimization_potential,
            'implementation_roadmap': implementation_roadmap
        }
        
        self.logger.info(f"Cost optimization analysis completed. Found {len(recommendations)} recommendations.")
        return analysis_result
    
    def _collect_cost_data(self, time_period_days: int) -> CostMetrics:
        """Collect and aggregate cost data for analysis."""
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=time_period_days)
        
        # Get cost data from warehouse
        daily_costs = self.cost_monitor.get_daily_costs(start_date, end_date)
        
        # Calculate metrics
        total_daily_cost = sum(daily_costs) / len(daily_costs)
        total_monthly_cost = total_daily_cost * 30
        
        # Calculate cost trend
        first_week_avg = sum(daily_costs[:7]) / 7 if len(daily_costs) >= 7 else daily_costs[0]
        last_week_avg = sum(daily_costs[-7:]) / 7 if len(daily_costs) >= 7 else daily_costs[-1]
        cost_trend = ((last_week_avg - first_week_avg) / first_week_avg) * 100
        
        # Get detailed cost breakdown
        cost_by_category = self._get_cost_by_category(start_date, end_date)
        cost_attribution = self._get_cost_attribution(start_date, end_date)
        
        # Calculate efficiency metrics
        total_gb_processed = self._get_data_processed(start_date, end_date)
        total_queries = self._get_query_count(start_date, end_date)
        
        cost_per_gb = total_monthly_cost / total_gb_processed if total_gb_processed > 0 else 0
        cost_per_query = total_monthly_cost / total_queries if total_queries > 0 else 0
        
        return CostMetrics(
            daily_cost=total_daily_cost,
            monthly_cost=total_monthly_cost,
            cost_trend=cost_trend,
            cost_per_gb_processed=cost_per_gb,
            cost_per_query=cost_per_query,
            cost_by_category=cost_by_category,
            cost_attribution=cost_attribution
        )
    
    def _analyze_usage_patterns(self, time_period_days: int) -> List[WarehouseUsagePattern]:
        """Analyze warehouse usage patterns for optimization opportunities."""
        
        warehouses = self.warehouse_connector.get_all_warehouses()
        patterns = []
        
        for warehouse in warehouses:
            usage_data = self._get_warehouse_usage_data(warehouse, time_period_days)
            
            # Calculate utilization metrics
            avg_utilization = np.mean(usage_data['utilization_percentages'])
            peak_utilization = np.max(usage_data['utilization_percentages'])
            idle_time_pct = len([u for u in usage_data['utilization_percentages'] if u < 0.1]) / len(usage_data['utilization_percentages'])
            
            # Determine usage pattern
            usage_pattern = self._classify_usage_pattern(usage_data['utilization_percentages'])
            
            # Calculate cost efficiency score
            cost_efficiency = self._calculate_cost_efficiency_score(
                avg_utilization, 
                idle_time_pct, 
                usage_data['cost_per_hour']
            )
            
            # Calculate optimization opportunity
            optimization_opportunity = self._calculate_optimization_opportunity(
                avg_utilization, 
                idle_time_pct, 
                peak_utilization
            )
            
            pattern = WarehouseUsagePattern(
                warehouse_name=warehouse['name'],
                average_utilization=avg_utilization,
                peak_utilization=peak_utilization,
                idle_time_percentage=idle_time_pct,
                cost_efficiency_score=cost_efficiency,
                usage_pattern=usage_pattern,
                optimization_opportunity=optimization_opportunity
            )
            patterns.append(pattern)
        
        return patterns
    
    def _analyze_warehouse_optimization(self, usage_patterns: List[WarehouseUsagePattern]) -> List[OptimizationRecommendation]:
        """Analyze warehouse optimization opportunities."""
        
        recommendations = []
        
        for pattern in usage_patterns:
            # Check for under-utilized warehouses
            if pattern.average_utilization < self.optimization_thresholds['warehouse_utilization_low']:
                recommendations.append(self._create_warehouse_downsizing_recommendation(pattern))
            
            # Check for excessive idle time
            if pattern.idle_time_percentage > self.optimization_thresholds['idle_time_excessive']:
                recommendations.append(self._create_auto_suspend_optimization_recommendation(pattern))
            
            # Check for inefficient usage patterns
            if pattern.usage_pattern == "bursty":
                recommendations.append(self._create_auto_scaling_recommendation(pattern))
            
            # Check for cost efficiency issues
            if pattern.cost_efficiency_score < 0.5:
                recommendations.append(self._create_cost_efficiency_improvement_recommendation(pattern))
        
        return recommendations
    
    def _analyze_virtual_environment_opportunities(self, cost_data: CostMetrics) -> List[OptimizationRecommendation]:
        """Analyze virtual environment optimization opportunities."""
        
        recommendations = []
        
        # Check development environment costs
        dev_cost_percentage = cost_data.cost_attribution.get('development', 0) / cost_data.monthly_cost
        
        if dev_cost_percentage > 0.3:  # More than 30% of costs in development
            recommendations.append(OptimizationRecommendation(
                id="virtual_env_dev_optimization",
                title="Implement Virtual Environment Cost Controls for Development",
                description=(
                    "Development environments are consuming a significant portion of warehouse costs. "
                    "Implementing SQLmesh virtual environments with aggressive auto-suspend and "
                    "right-sizing can reduce development costs by 60-80%."
                ),
                priority=OptimizationPriority.HIGH,
                category=CostCategory.COMPUTE,
                estimated_monthly_savings=cost_data.monthly_cost * 0.6 * dev_cost_percentage,
                implementation_effort="medium",
                implementation_time="2-3 weeks",
                risk_level="low",
                prerequisites=[
                    "SQLmesh virtual environment feature available",
                    "Development team training completed",
                    "Backup procedures for development data"
                ],
                implementation_steps=[
                    "Configure virtual environment templates for development",
                    "Implement aggressive auto-suspend policies (60 seconds)",
                    "Right-size development warehouses to x-small/small",
                    "Set daily budget limits for development environments",
                    "Train development team on virtual environment best practices",
                    "Monitor cost reduction and adjust policies as needed"
                ],
                success_metrics=[
                    "60% reduction in development environment costs",
                    "95% compliance with budget limits",
                    "Developer satisfaction score >8/10"
                ],
                monitoring_requirements=[
                    "Daily cost monitoring by environment",
                    "Budget utilization alerts",
                    "Developer productivity metrics"
                ]
            ))
        
        # Check for environment sprawl
        environment_count = self._get_active_environment_count()
        if environment_count > 15:  # Arbitrary threshold for environment sprawl
            recommendations.append(self._create_environment_cleanup_recommendation(environment_count))
        
        return recommendations
    
    def _analyze_query_optimization_opportunities(self, time_period_days: int) -> List[OptimizationRecommendation]:
        """Analyze query optimization opportunities."""
        
        recommendations = []
        
        # Get expensive queries
        expensive_queries = self._get_expensive_queries(time_period_days)
        
        if expensive_queries:
            total_expensive_cost = sum(q['cost'] for q in expensive_queries)
            
            recommendations.append(OptimizationRecommendation(
                id="query_optimization_expensive",
                title="Optimize High-Cost Queries",
                description=(
                    f"Identified {len(expensive_queries)} queries with high execution costs. "
                    f"These queries account for ${total_expensive_cost:.2f} in monthly costs. "
                    "Optimizing these queries can provide immediate cost reduction."
                ),
                priority=OptimizationPriority.HIGH if total_expensive_cost > 1000 else OptimizationPriority.MEDIUM,
                category=CostCategory.COMPUTE,
                estimated_monthly_savings=total_expensive_cost * 0.4,  # 40% improvement expected
                implementation_effort="medium",
                implementation_time="2-4 weeks",
                risk_level="low",
                prerequisites=[
                    "Query performance analysis tools",
                    "Development environment for testing",
                    "Backup of current query logic"
                ],
                implementation_steps=[
                    "Analyze query execution plans for optimization opportunities",
                    "Implement partition pruning and indexing strategies",
                    "Optimize JOIN operations and reduce data scanning",
                    "Implement result caching for frequently used queries",
                    "Test optimized queries in development environment",
                    "Deploy optimizations with monitoring"
                ],
                success_metrics=[
                    "40% reduction in query execution costs",
                    "30% improvement in average query execution time",
                    "No degradation in data quality or accuracy"
                ],
                monitoring_requirements=[
                    "Query performance monitoring",
                    "Cost tracking by query",
                    "Data quality validation"
                ]
            ))
        
        # Check for query pattern inefficiencies
        query_patterns = self._analyze_query_patterns(time_period_days)
        if query_patterns['full_table_scans'] > 0.2:  # More than 20% full table scans
            recommendations.append(self._create_partition_optimization_recommendation(query_patterns))
        
        return recommendations
    
    def _analyze_storage_optimization_opportunities(self, cost_data: CostMetrics) -> List[OptimizationRecommendation]:
        """Analyze storage optimization opportunities."""
        
        recommendations = []
        
        storage_cost = cost_data.cost_by_category.get(CostCategory.STORAGE, 0)
        
        if storage_cost > cost_data.monthly_cost * 0.15:  # More than 15% storage costs
            # Analyze data lifecycle and retention
            storage_analysis = self._analyze_storage_usage()
            
            recommendations.append(OptimizationRecommendation(
                id="storage_lifecycle_optimization",
                title="Implement Data Lifecycle Management",
                description=(
                    "Storage costs represent a significant portion of total costs. "
                    "Implementing tiered storage and automated lifecycle policies "
                    "can reduce storage costs by 20-40%."
                ),
                priority=OptimizationPriority.MEDIUM,
                category=CostCategory.STORAGE,
                estimated_monthly_savings=storage_cost * 0.3,
                implementation_effort="medium",
                implementation_time="3-4 weeks",
                risk_level="medium",
                prerequisites=[
                    "Data retention policy approval",
                    "Backup and archival procedures",
                    "Business stakeholder agreement"
                ],
                implementation_steps=[
                    "Define data lifecycle policies by table/schema",
                    "Implement automated archival for old data",
                    "Setup tiered storage (hot/warm/cold)",
                    "Configure automated cleanup for temporary data",
                    "Monitor storage cost reduction"
                ],
                success_metrics=[
                    "25% reduction in storage costs",
                    "Improved query performance on active data",
                    "Compliance with data retention policies"
                ],
                monitoring_requirements=[
                    "Storage cost monitoring by tier",
                    "Data accessibility validation",
                    "Compliance audit trails"
                ]
            ))
        
        return recommendations
    
    def _analyze_data_lifecycle_opportunities(self, cost_data: CostMetrics) -> List[OptimizationRecommendation]:
        """Analyze data lifecycle optimization opportunities."""
        
        recommendations = []
        
        # Analyze table usage patterns
        table_usage = self._analyze_table_usage_patterns()
        
        # Find unused or rarely used tables
        unused_tables = [t for t in table_usage if t['last_accessed_days'] > 90]
        
        if unused_tables:
            storage_savings = sum(t['storage_cost_monthly'] for t in unused_tables)
            
            recommendations.append(OptimizationRecommendation(
                id="unused_table_cleanup",
                title="Clean Up Unused Tables and Data",
                description=(
                    f"Identified {len(unused_tables)} tables that haven't been accessed "
                    f"in over 90 days, consuming ${storage_savings:.2f} monthly in storage costs."
                ),
                priority=OptimizationPriority.MEDIUM,
                category=CostCategory.STORAGE,
                estimated_monthly_savings=storage_savings,
                implementation_effort="low",
                implementation_time="1-2 weeks",
                risk_level="medium",
                prerequisites=[
                    "Business approval for data deletion",
                    "Backup procedures for archived data",
                    "Data lineage analysis completed"
                ],
                implementation_steps=[
                    "Validate table usage analysis with business stakeholders",
                    "Create backup/archive of data before deletion",
                    "Implement gradual cleanup with monitoring",
                    "Update data catalogs and documentation",
                    "Monitor for any downstream impact"
                ],
                success_metrics=[
                    f"${storage_savings:.2f} monthly storage cost reduction",
                    "No business impact from deleted data",
                    "Improved data catalog accuracy"
                ],
                monitoring_requirements=[
                    "Storage cost tracking",
                    "Business process impact monitoring",
                    "Data access pattern validation"
                ]
            ))
        
        return recommendations
    
    def _generate_prioritized_recommendations(self, recommendation_lists: List[List[OptimizationRecommendation]]) -> List[OptimizationRecommendation]:
        """Generate prioritized list of all recommendations."""
        
        all_recommendations = []
        for rec_list in recommendation_lists:
            all_recommendations.extend(rec_list)
        
        # Sort by priority and estimated savings
        priority_order = {
            OptimizationPriority.CRITICAL: 4,
            OptimizationPriority.HIGH: 3,
            OptimizationPriority.MEDIUM: 2,
            OptimizationPriority.LOW: 1
        }
        
        sorted_recommendations = sorted(
            all_recommendations,
            key=lambda x: (
                priority_order[x.priority],
                x.estimated_monthly_savings
            ),
            reverse=True
        )
        
        return sorted_recommendations
    
    def _calculate_optimization_potential(self, recommendations: List[OptimizationRecommendation]) -> Dict:
        """Calculate total optimization potential across all recommendations."""
        
        total_potential_savings = sum(rec.estimated_monthly_savings for rec in recommendations)
        
        # Calculate savings by category
        savings_by_category = defaultdict(float)
        for rec in recommendations:
            savings_by_category[rec.category.value] += rec.estimated_monthly_savings
        
        # Calculate savings by priority
        savings_by_priority = defaultdict(float)
        for rec in recommendations:
            savings_by_priority[rec.priority.value] += rec.estimated_monthly_savings
        
        # Calculate implementation effort distribution
        effort_distribution = defaultdict(int)
        for rec in recommendations:
            effort_distribution[rec.implementation_effort] += 1
        
        return {
            'total_monthly_savings_potential': total_potential_savings,
            'total_annual_savings_potential': total_potential_savings * 12,
            'savings_by_category': dict(savings_by_category),
            'savings_by_priority': dict(savings_by_priority),
            'implementation_effort_distribution': dict(effort_distribution),
            'average_savings_per_recommendation': total_potential_savings / len(recommendations) if recommendations else 0,
            'high_impact_recommendations': len([r for r in recommendations if r.priority in [OptimizationPriority.CRITICAL, OptimizationPriority.HIGH]]),
            'quick_wins': len([r for r in recommendations if r.implementation_effort == "low" and r.estimated_monthly_savings > 500])
        }
    
    def _create_implementation_roadmap(self, recommendations: List[OptimizationRecommendation]) -> Dict:
        """Create implementation roadmap for optimization recommendations."""
        
        # Group recommendations by implementation phases
        quick_wins = [r for r in recommendations if r.implementation_effort == "low"]
        medium_term = [r for r in recommendations if r.implementation_effort == "medium"]
        long_term = [r for r in recommendations if r.implementation_effort == "high"]
        
        # Calculate timeline and cumulative savings
        roadmap_phases = {
            'phase_1_quick_wins': {
                'duration': '2-4 weeks',
                'recommendations': quick_wins,
                'total_savings': sum(r.estimated_monthly_savings for r in quick_wins),
                'focus': 'Low-effort, high-impact optimizations'
            },
            'phase_2_medium_term': {
                'duration': '1-3 months',
                'recommendations': medium_term,
                'total_savings': sum(r.estimated_monthly_savings for r in medium_term),
                'focus': 'Structural improvements and process optimization'
            },
            'phase_3_long_term': {
                'duration': '3-6 months',
                'recommendations': long_term,
                'total_savings': sum(r.estimated_monthly_savings for r in long_term),
                'focus': 'Major architectural changes and system optimization'
            }
        }
        
        # Calculate cumulative impact
        cumulative_savings = 0
        for phase in roadmap_phases.values():
            cumulative_savings += phase['total_savings']
            phase['cumulative_savings'] = cumulative_savings
        
        return {
            'roadmap_phases': roadmap_phases,
            'total_implementation_timeline': '6 months',
            'total_savings_potential': cumulative_savings,
            'roi_timeline': self._calculate_roi_timeline(roadmap_phases),
            'risk_mitigation_strategy': self._create_risk_mitigation_strategy(recommendations)
        }
    
    def generate_cost_optimization_report(self, analysis_result: Dict) -> str:
        """Generate comprehensive cost optimization report."""
        
        report = f"""
# Cost Optimization Analysis Report

**Generated**: {analysis_result['analysis_timestamp'].strftime('%Y-%m-%d %H:%M:%S')}
**Analysis Period**: {analysis_result['time_period_analyzed']} days

## Executive Summary

### Current Cost Position
- **Monthly Cost**: ${analysis_result['current_cost_metrics'].monthly_cost:,.2f}
- **Daily Cost**: ${analysis_result['current_cost_metrics'].daily_cost:,.2f}
- **Cost Trend**: {analysis_result['current_cost_metrics'].cost_trend:+.1f}%
- **Cost per GB Processed**: ${analysis_result['current_cost_metrics'].cost_per_gb_processed:.3f}

### Optimization Potential
- **Total Monthly Savings**: ${analysis_result['optimization_potential']['total_monthly_savings_potential']:,.2f}
- **Annual Savings Potential**: ${analysis_result['optimization_potential']['total_annual_savings_potential']:,.2f}
- **Number of Recommendations**: {len(analysis_result['recommendations'])}
- **High Priority Opportunities**: {analysis_result['optimization_potential']['high_impact_recommendations']}

## Priority Recommendations

"""
        
        # Add top 5 recommendations
        for i, rec in enumerate(analysis_result['recommendations'][:5], 1):
            report += f"""
### {i}. {rec.title} ({rec.priority.value.upper()})
**Estimated Monthly Savings**: ${rec.estimated_monthly_savings:,.2f}
**Implementation Effort**: {rec.implementation_effort}
**Timeline**: {rec.implementation_time}

{rec.description}

**Key Implementation Steps**:
{chr(10).join(f"- {step}" for step in rec.implementation_steps[:3])}
"""
        
        # Add implementation roadmap
        report += f"""
## Implementation Roadmap

### Phase 1: Quick Wins (2-4 weeks)
- **Focus**: {analysis_result['implementation_roadmap']['roadmap_phases']['phase_1_quick_wins']['focus']}
- **Savings Potential**: ${analysis_result['implementation_roadmap']['roadmap_phases']['phase_1_quick_wins']['total_savings']:,.2f}/month
- **Recommendations**: {len(analysis_result['implementation_roadmap']['roadmap_phases']['phase_1_quick_wins']['recommendations'])}

### Phase 2: Medium-term Improvements (1-3 months)
- **Focus**: {analysis_result['implementation_roadmap']['roadmap_phases']['phase_2_medium_term']['focus']}
- **Savings Potential**: ${analysis_result['implementation_roadmap']['roadmap_phases']['phase_2_medium_term']['total_savings']:,.2f}/month
- **Recommendations**: {len(analysis_result['implementation_roadmap']['roadmap_phases']['phase_2_medium_term']['recommendations'])}

### Phase 3: Strategic Optimization (3-6 months)
- **Focus**: {analysis_result['implementation_roadmap']['roadmap_phases']['phase_3_long_term']['focus']}
- **Savings Potential**: ${analysis_result['implementation_roadmap']['roadmap_phases']['phase_3_long_term']['total_savings']:,.2f}/month
- **Recommendations**: {len(analysis_result['implementation_roadmap']['roadmap_phases']['phase_3_long_term']['recommendations'])}

## Next Steps

1. **Immediate Actions** (This Week):
   - Review and approve quick-win recommendations
   - Assign implementation owners for Phase 1 items
   - Set up cost monitoring and alerting

2. **Short-term Planning** (Next Month):
   - Detailed planning for medium-term improvements
   - Resource allocation for implementation teams
   - Stakeholder alignment on optimization priorities

3. **Long-term Strategy** (Next Quarter):
   - Architectural planning for major optimizations
   - ROI measurement and success criteria definition
   - Continuous optimization process establishment

---
*Report generated by Data Architect Agent Cost Optimization Advisor*
"""
        
        return report
    
    # Helper methods for creating specific recommendation types
    def _create_warehouse_downsizing_recommendation(self, pattern: WarehouseUsagePattern) -> OptimizationRecommendation:
        """Create recommendation for warehouse downsizing."""
        
        current_cost = self._estimate_warehouse_monthly_cost(pattern.warehouse_name)
        potential_savings = current_cost * 0.5  # Assume 50% reduction from downsizing
        
        return OptimizationRecommendation(
            id=f"warehouse_downsize_{pattern.warehouse_name}",
            title=f"Downsize Under-Utilized Warehouse: {pattern.warehouse_name}",
            description=(
                f"Warehouse {pattern.warehouse_name} shows low utilization "
                f"({pattern.average_utilization:.1%}) with {pattern.idle_time_percentage:.1%} idle time. "
                f"Downsizing can reduce costs while maintaining performance."
            ),
            priority=OptimizationPriority.HIGH,
            category=CostCategory.COMPUTE,
            estimated_monthly_savings=potential_savings,
            implementation_effort="low",
            implementation_time="1 week",
            risk_level="low",
            prerequisites=["Performance impact analysis", "Stakeholder approval"],
            implementation_steps=[
                "Analyze performance impact of smaller warehouse size",
                "Test downsized warehouse in non-production environment",
                "Implement gradual downsizing with monitoring",
                "Monitor performance and adjust if needed"
            ],
            success_metrics=[
                f"50% cost reduction for {pattern.warehouse_name}",
                "No performance degradation >10%",
                "Maintained SLA compliance"
            ],
            monitoring_requirements=[
                "Query performance monitoring",
                "Cost tracking",
                "SLA compliance tracking"
            ]
        )
    
    # Additional helper methods would be implemented here...
    # These are placeholder implementations for the example
    
    def _get_cost_by_category(self, start_date, end_date) -> Dict[CostCategory, float]:
        """Get cost breakdown by category."""
        return {
            CostCategory.COMPUTE: 8000,
            CostCategory.STORAGE: 1200,
            CostCategory.DATA_TRANSFER: 300,
            CostCategory.LICENSING: 500,
            CostCategory.OPERATIONS: 200
        }
    
    def _get_cost_attribution(self, start_date, end_date) -> Dict[str, float]:
        """Get cost attribution by team/project."""
        return {
            'production': 6000,
            'development': 2500,
            'testing': 800,
            'analytics': 700
        }
    
    def _get_data_processed(self, start_date, end_date) -> float:
        """Get total data processed in GB."""
        return 50000  # 50TB
    
    def _get_query_count(self, start_date, end_date) -> int:
        """Get total query count."""
        return 15000
    
    def _get_warehouse_usage_data(self, warehouse, time_period_days):
        """Get warehouse usage data."""
        # Mock implementation
        return {
            'utilization_percentages': np.random.normal(0.4, 0.2, time_period_days * 24),
            'cost_per_hour': 8.0
        }
    
    def _classify_usage_pattern(self, utilization_data):
        """Classify usage pattern."""
        std_dev = np.std(utilization_data)
        if std_dev > 0.3:
            return "bursty"
        elif np.mean(utilization_data) > 0.7:
            return "consistent"
        else:
            return "irregular"
    
    def _calculate_cost_efficiency_score(self, avg_util, idle_time, cost_per_hour):
        """Calculate cost efficiency score."""
        return max(0, min(1, avg_util - idle_time))
    
    def _calculate_optimization_opportunity(self, avg_util, idle_time, peak_util):
        """Calculate optimization opportunity score."""
        return min(1, (1 - avg_util) + idle_time)
    
    def _estimate_warehouse_monthly_cost(self, warehouse_name):
        """Estimate monthly cost for warehouse."""
        return 2000  # Mock value
    
    def _get_expensive_queries(self, time_period_days):
        """Get list of expensive queries."""
        return [
            {'id': 'query_1', 'cost': 150, 'execution_time': 45},
            {'id': 'query_2', 'cost': 120, 'execution_time': 38}
        ]
    
    def _analyze_query_patterns(self, time_period_days):
        """Analyze query patterns for optimization."""
        return {
            'full_table_scans': 0.25,
            'inefficient_joins': 0.15,
            'missing_indexes': 0.10
        }
    
    def _analyze_storage_usage(self):
        """Analyze storage usage patterns."""
        return {
            'total_storage_gb': 100000,
            'unused_tables_gb': 15000,
            'archival_candidates_gb': 25000
        }
    
    def _analyze_table_usage_patterns(self):
        """Analyze table usage patterns."""
        return [
            {'table_name': 'old_logs', 'last_accessed_days': 120, 'storage_cost_monthly': 200},
            {'table_name': 'temp_analysis', 'last_accessed_days': 95, 'storage_cost_monthly': 150}
        ]
    
    def _get_active_environment_count(self):
        """Get count of active environments."""
        return 18
    
    def _create_environment_cleanup_recommendation(self, env_count):
        """Create environment cleanup recommendation."""
        return OptimizationRecommendation(
            id="environment_cleanup",
            title="Implement Environment Cleanup Policies",
            description=f"Found {env_count} active environments. Implement cleanup policies to reduce environment sprawl.",
            priority=OptimizationPriority.MEDIUM,
            category=CostCategory.COMPUTE,
            estimated_monthly_savings=500,
            implementation_effort="low",
            implementation_time="1-2 weeks",
            risk_level="low",
            prerequisites=["Environment inventory", "Cleanup policy approval"],
            implementation_steps=["Audit environments", "Implement cleanup automation"],
            success_metrics=["50% reduction in unused environments"],
            monitoring_requirements=["Environment usage tracking"]
        )
    
    def _create_partition_optimization_recommendation(self, query_patterns):
        """Create partition optimization recommendation."""
        return OptimizationRecommendation(
            id="partition_optimization",
            title="Implement Partition Optimization",
            description="High rate of full table scans detected. Implement partitioning for cost reduction.",
            priority=OptimizationPriority.MEDIUM,
            category=CostCategory.COMPUTE,
            estimated_monthly_savings=800,
            implementation_effort="medium",
            implementation_time="2-3 weeks",
            risk_level="medium",
            prerequisites=["Schema analysis", "Query pattern analysis"],
            implementation_steps=["Design partition strategy", "Implement partitioning"],
            success_metrics=["50% reduction in full table scans"],
            monitoring_requirements=["Query performance monitoring"]
        )
    
    def _calculate_roi_timeline(self, roadmap_phases):
        """Calculate ROI timeline for implementation phases."""
        return {
            'breakeven_months': 3,
            'full_roi_months': 12,
            'cumulative_savings_by_month': {}  # Would be calculated based on phases
        }
    
    def _create_risk_mitigation_strategy(self, recommendations):
        """Create risk mitigation strategy for implementations."""
        return {
            'testing_strategy': 'All changes tested in staging environment',
            'rollback_procedures': 'Automated rollback for performance degradation',
            'monitoring_requirements': 'Real-time performance and cost monitoring',
            'stakeholder_communication': 'Regular updates on optimization impact'
        }


# Example usage and testing
if __name__ == "__main__":
    # Mock warehouse connector and cost monitor for testing
    class MockWarehouseConnector:
        def get_all_warehouses(self):
            return [{'name': 'PROD_WH'}, {'name': 'DEV_WH'}, {'name': 'TEST_WH'}]
    
    class MockCostMonitor:
        def get_daily_costs(self, start_date, end_date):
            days = (end_date - start_date).days
            return [300 + np.random.normal(0, 50) for _ in range(days)]
    
    # Create advisor and run analysis
    advisor = CostOptimizationAdvisor(
        warehouse_connector=MockWarehouseConnector(),
        cost_monitor=MockCostMonitor()
    )
    
    # Perform cost optimization analysis
    analysis = advisor.analyze_cost_optimization_opportunities(time_period_days=30)
    
    # Generate report
    report = advisor.generate_cost_optimization_report(analysis)
    
    print("=== COST OPTIMIZATION ANALYSIS ===")
    print(f"Total recommendations: {len(analysis['recommendations'])}")
    print(f"Potential monthly savings: ${analysis['optimization_potential']['total_monthly_savings_potential']:,.2f}")
    print(f"High priority recommendations: {analysis['optimization_potential']['high_impact_recommendations']}")
    
    print("\n=== TOP 3 RECOMMENDATIONS ===")
    for i, rec in enumerate(analysis['recommendations'][:3], 1):
        print(f"{i}. {rec.title} - ${rec.estimated_monthly_savings:,.2f}/month ({rec.priority.value})")
    
    print(f"\n=== FULL REPORT ===")
    print(report[:2000] + "..." if len(report) > 2000 else report)