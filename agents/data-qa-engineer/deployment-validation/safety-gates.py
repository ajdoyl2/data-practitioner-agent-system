"""
Safety Gates Implementation for Data QA Engineer Agent

This module implements comprehensive safety gates for SQLmesh deployment validation,
ensuring production deployments meet quality, performance, and safety standards
before being promoted to production environments.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional, Tuple, Any
import numpy as np
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class GateStatus(Enum):
    """Status of a safety gate validation."""
    PENDING = "pending"
    PASSED = "passed"
    FAILED = "failed"
    WARNING = "warning"
    SKIPPED = "skipped"


class GateSeverity(Enum):
    """Severity level of safety gate failures."""
    CRITICAL = "critical"    # Deployment must be blocked
    HIGH = "high"           # Strong recommendation to block
    MEDIUM = "medium"       # Warning with stakeholder decision
    LOW = "low"            # Advisory only


@dataclass
class GateResult:
    """Result of a safety gate validation."""
    gate_name: str
    status: GateStatus
    severity: GateSeverity
    score: float  # 0.0 - 1.0, where 1.0 is perfect
    message: str
    details: Dict[str, Any] = field(default_factory=dict)
    evidence: List[str] = field(default_factory=list)
    recommendations: List[str] = field(default_factory=list)
    execution_time: float = 0.0
    timestamp: datetime = field(default_factory=datetime.utcnow)


@dataclass
class DeploymentContext:
    """Context information for deployment validation."""
    deployment_id: str
    environment: str
    models_changed: List[str]
    deployment_type: str  # "blue_green", "rolling", "canary"
    change_scope: str     # "major", "minor", "patch"
    is_rollback: bool = False
    target_environment: str = "production"
    business_impact: str = "medium"  # "low", "medium", "high", "critical"


class SafetyGate(ABC):
    """Abstract base class for deployment safety gates."""
    
    def __init__(self, name: str, severity: GateSeverity, timeout_seconds: int = 300):
        self.name = name
        self.severity = severity
        self.timeout_seconds = timeout_seconds
        self.logger = logging.getLogger(f"{self.__class__.__name__}.{name}")
    
    @abstractmethod
    def validate(self, context: DeploymentContext) -> GateResult:
        """Validate the safety gate condition."""
        pass
    
    def is_blocking(self) -> bool:
        """Determine if this gate can block deployment."""
        return self.severity in [GateSeverity.CRITICAL, GateSeverity.HIGH]


class DataQualityGate(SafetyGate):
    """Validates data quality metrics before deployment."""
    
    def __init__(self):
        super().__init__("Data Quality Validation", GateSeverity.CRITICAL, 600)
        self.quality_thresholds = {
            'completeness_rate': 0.95,      # 95% completeness required
            'accuracy_rate': 0.98,          # 98% accuracy required
            'consistency_rate': 0.97,       # 97% consistency required
            'freshness_threshold': 3600,    # Data must be < 1 hour old
            'schema_compliance': 0.99       # 99% schema compliance
        }
    
    def validate(self, context: DeploymentContext) -> GateResult:
        """Validate data quality across all changed models."""
        
        start_time = datetime.utcnow()
        quality_results = {}
        overall_score = 1.0
        issues = []
        recommendations = []
        
        try:
            for model in context.models_changed:
                model_quality = self._validate_model_quality(model, context)
                quality_results[model] = model_quality
                
                # Calculate weighted score
                model_weight = self._get_model_weight(model, context)
                overall_score *= (model_quality['overall_score'] ** model_weight)
                
                # Collect issues
                if model_quality['issues']:
                    issues.extend([f"{model}: {issue}" for issue in model_quality['issues']])
                
                # Collect recommendations
                if model_quality['recommendations']:
                    recommendations.extend([f"{model}: {rec}" for rec in model_quality['recommendations']])
            
            # Determine gate status
            if overall_score >= 0.95:
                status = GateStatus.PASSED
                message = f"Data quality validation passed with score {overall_score:.3f}"
            elif overall_score >= 0.85:
                status = GateStatus.WARNING
                message = f"Data quality validation passed with warnings (score: {overall_score:.3f})"
            else:
                status = GateStatus.FAILED
                message = f"Data quality validation failed (score: {overall_score:.3f})"
            
        except Exception as e:
            status = GateStatus.FAILED
            overall_score = 0.0
            message = f"Data quality validation error: {str(e)}"
            issues.append(f"Validation exception: {str(e)}")
        
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        return GateResult(
            gate_name=self.name,
            status=status,
            severity=self.severity,
            score=overall_score,
            message=message,
            details={
                'quality_results': quality_results,
                'thresholds': self.quality_thresholds,
                'models_validated': context.models_changed
            },
            evidence=issues,
            recommendations=recommendations,
            execution_time=execution_time
        )
    
    def _validate_model_quality(self, model: str, context: DeploymentContext) -> Dict:
        """Validate quality metrics for a specific model."""
        
        # Mock implementation - would integrate with actual data quality tools
        quality_metrics = {
            'completeness_rate': np.random.uniform(0.85, 0.99),
            'accuracy_rate': np.random.uniform(0.90, 0.995),
            'consistency_rate': np.random.uniform(0.88, 0.98),
            'freshness_minutes': np.random.uniform(10, 120),
            'schema_compliance': np.random.uniform(0.95, 1.0),
            'record_count': np.random.randint(1000, 1000000),
            'null_percentage': np.random.uniform(0, 0.15)
        }
        
        issues = []
        recommendations = []
        scores = []
        
        # Validate each metric
        for metric, value in quality_metrics.items():
            if metric == 'freshness_minutes':
                threshold = self.quality_thresholds['freshness_threshold'] / 60  # Convert to minutes
                score = max(0, min(1, 1 - (value - threshold) / threshold)) if value > threshold else 1.0
                if value > threshold:
                    issues.append(f"Data freshness {value:.1f} minutes exceeds threshold {threshold:.1f} minutes")
            else:
                threshold = self.quality_thresholds.get(metric, 0.95)
                score = value / threshold if threshold > 0 else 1.0
                if value < threshold:
                    issues.append(f"{metric} {value:.3f} below threshold {threshold:.3f}")
            
            scores.append(min(1.0, score))
        
        overall_score = np.mean(scores)
        
        # Generate recommendations
        if overall_score < 0.90:
            recommendations.append("Review data validation rules and fix quality issues")
        if quality_metrics['null_percentage'] > 0.10:
            recommendations.append("Investigate high null percentage in critical fields")
        
        return {
            'overall_score': overall_score,
            'metrics': quality_metrics,
            'issues': issues,
            'recommendations': recommendations
        }
    
    def _get_model_weight(self, model: str, context: DeploymentContext) -> float:
        """Get the weight of a model for overall quality calculation."""
        # Critical models have higher weight in quality calculation
        critical_models = ['customer_segmentation', 'revenue_calculation', 'compliance_reporting']
        return 0.8 if model in critical_models else 0.5


class PerformanceRegressionGate(SafetyGate):
    """Validates that deployment doesn't introduce performance regressions."""
    
    def __init__(self):
        super().__init__("Performance Regression Check", GateSeverity.HIGH, 900)
        self.performance_thresholds = {
            'max_regression_percentage': 20,    # Max 20% performance regression
            'response_time_p95_ms': 5000,      # 95th percentile < 5 seconds
            'query_timeout_rate': 0.02,        # < 2% timeout rate
            'resource_utilization': 0.85,      # < 85% resource utilization
            'error_rate': 0.005                # < 0.5% error rate
        }
    
    def validate(self, context: DeploymentContext) -> GateResult:
        """Validate performance metrics against baseline."""
        
        start_time = datetime.utcnow()
        performance_results = {}
        overall_score = 1.0
        issues = []
        recommendations = []
        
        try:
            # Get baseline performance metrics
            baseline_metrics = self._get_baseline_metrics(context)
            
            # Get current performance metrics
            current_metrics = self._get_current_metrics(context)
            
            # Compare metrics and calculate regression
            for metric, current_value in current_metrics.items():
                baseline_value = baseline_metrics.get(metric, current_value)
                regression_analysis = self._analyze_regression(metric, baseline_value, current_value)
                performance_results[metric] = regression_analysis
                
                # Update overall score
                overall_score *= regression_analysis['score']
                
                # Collect issues
                if regression_analysis['issues']:
                    issues.extend(regression_analysis['issues'])
                
                # Collect recommendations
                if regression_analysis['recommendations']:
                    recommendations.extend(regression_analysis['recommendations'])
            
            # Determine gate status
            if overall_score >= 0.90:
                status = GateStatus.PASSED
                message = f"Performance validation passed (score: {overall_score:.3f})"
            elif overall_score >= 0.70:
                status = GateStatus.WARNING
                message = f"Performance validation passed with warnings (score: {overall_score:.3f})"
            else:
                status = GateStatus.FAILED
                message = f"Performance regression detected (score: {overall_score:.3f})"
            
        except Exception as e:
            status = GateStatus.FAILED
            overall_score = 0.0
            message = f"Performance validation error: {str(e)}"
            issues.append(f"Performance validation exception: {str(e)}")
        
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        return GateResult(
            gate_name=self.name,
            status=status,
            severity=self.severity,
            score=overall_score,
            message=message,
            details={
                'performance_results': performance_results,
                'baseline_metrics': baseline_metrics,
                'current_metrics': current_metrics,
                'thresholds': self.performance_thresholds
            },
            evidence=issues,
            recommendations=recommendations,
            execution_time=execution_time
        )
    
    def _get_baseline_metrics(self, context: DeploymentContext) -> Dict:
        """Get baseline performance metrics for comparison."""
        # Mock implementation - would integrate with monitoring systems
        return {
            'avg_response_time_ms': 1200,
            'p95_response_time_ms': 3500,
            'p99_response_time_ms': 8000,
            'queries_per_second': 45,
            'error_rate': 0.002,
            'cpu_utilization': 0.65,
            'memory_utilization': 0.70,
            'query_timeout_rate': 0.008
        }
    
    def _get_current_metrics(self, context: DeploymentContext) -> Dict:
        """Get current performance metrics for validation."""
        # Mock implementation - would integrate with monitoring systems
        baseline = self._get_baseline_metrics(context)
        
        # Simulate some performance variation
        return {
            metric: value * np.random.uniform(0.85, 1.25)  # ±15-25% variation
            for metric, value in baseline.items()
        }
    
    def _analyze_regression(self, metric: str, baseline: float, current: float) -> Dict:
        """Analyze performance regression for a specific metric."""
        
        # Calculate regression percentage
        if baseline > 0:
            if metric in ['error_rate', 'query_timeout_rate']:
                # For error metrics, increase is bad
                regression_pct = ((current - baseline) / baseline) * 100
            elif metric in ['queries_per_second']:
                # For throughput metrics, decrease is bad
                regression_pct = ((baseline - current) / baseline) * 100
            else:
                # For latency metrics, increase is bad
                regression_pct = ((current - baseline) / baseline) * 100
        else:
            regression_pct = 0
        
        issues = []
        recommendations = []
        
        # Evaluate regression
        max_regression = self.performance_thresholds['max_regression_percentage']
        
        if regression_pct > max_regression:
            score = max(0, 1 - (regression_pct - max_regression) / max_regression)
            issues.append(f"{metric}: {regression_pct:.1f}% regression (threshold: {max_regression}%)")
            recommendations.append(f"Investigate {metric} performance degradation")
        elif regression_pct > max_regression / 2:
            score = 0.8  # Warning level
            recommendations.append(f"Monitor {metric} closely for further degradation")
        else:
            score = 1.0
        
        return {
            'baseline': baseline,
            'current': current,
            'regression_percentage': regression_pct,
            'score': score,
            'issues': issues,
            'recommendations': recommendations
        }


class SecurityValidationGate(SafetyGate):
    """Validates security compliance and vulnerability checks."""
    
    def __init__(self):
        super().__init__("Security Validation", GateSeverity.CRITICAL, 450)
        self.security_checks = [
            'sql_injection_vulnerability',
            'access_control_validation',
            'encryption_compliance',
            'audit_trail_verification',
            'data_privacy_compliance',
            'authentication_verification'
        ]
    
    def validate(self, context: DeploymentContext) -> GateResult:
        """Validate security compliance."""
        
        start_time = datetime.utcnow()
        security_results = {}
        overall_score = 1.0
        issues = []
        recommendations = []
        
        try:
            for check in self.security_checks:
                check_result = self._execute_security_check(check, context)
                security_results[check] = check_result
                
                overall_score *= check_result['score']
                
                if check_result['issues']:
                    issues.extend(check_result['issues'])
                
                if check_result['recommendations']:
                    recommendations.extend(check_result['recommendations'])
            
            # Determine gate status
            if overall_score >= 0.95:
                status = GateStatus.PASSED
                message = f"Security validation passed (score: {overall_score:.3f})"
            elif overall_score >= 0.80:
                status = GateStatus.WARNING
                message = f"Security validation passed with warnings (score: {overall_score:.3f})"
            else:
                status = GateStatus.FAILED
                message = f"Security validation failed (score: {overall_score:.3f})"
            
        except Exception as e:
            status = GateStatus.FAILED
            overall_score = 0.0
            message = f"Security validation error: {str(e)}"
            issues.append(f"Security validation exception: {str(e)}")
        
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        return GateResult(
            gate_name=self.name,
            status=status,
            severity=self.severity,
            score=overall_score,
            message=message,
            details={
                'security_results': security_results,
                'checks_performed': self.security_checks
            },
            evidence=issues,
            recommendations=recommendations,
            execution_time=execution_time
        )
    
    def _execute_security_check(self, check_name: str, context: DeploymentContext) -> Dict:
        """Execute a specific security check."""
        
        # Mock implementation - would integrate with security scanning tools
        check_score = np.random.uniform(0.8, 1.0)  # Simulate security check results
        
        issues = []
        recommendations = []
        
        if check_score < 0.90:
            issues.append(f"{check_name} failed security standards")
            recommendations.append(f"Review and fix {check_name} security issues")
        
        return {
            'score': check_score,
            'passed': check_score >= 0.90,
            'issues': issues,
            'recommendations': recommendations,
            'details': f"{check_name} validation result"
        }


class BusinessValidationGate(SafetyGate):
    """Validates business logic and critical business metrics."""
    
    def __init__(self):
        super().__init__("Business Logic Validation", GateSeverity.HIGH, 600)
        self.business_checks = [
            'revenue_calculation_accuracy',
            'customer_segmentation_consistency',
            'compliance_reporting_completeness',
            'key_metric_validation',
            'business_rule_compliance'
        ]
    
    def validate(self, context: DeploymentContext) -> GateResult:
        """Validate business logic and metrics."""
        
        start_time = datetime.utcnow()
        business_results = {}
        overall_score = 1.0
        issues = []
        recommendations = []
        
        try:
            for check in self.business_checks:
                check_result = self._execute_business_check(check, context)
                business_results[check] = check_result
                
                overall_score *= check_result['score']
                
                if check_result['issues']:
                    issues.extend(check_result['issues'])
                
                if check_result['recommendations']:
                    recommendations.extend(check_result['recommendations'])
            
            # Determine gate status
            if overall_score >= 0.95:
                status = GateStatus.PASSED
                message = f"Business validation passed (score: {overall_score:.3f})"
            elif overall_score >= 0.85:
                status = GateStatus.WARNING
                message = f"Business validation passed with warnings (score: {overall_score:.3f})"
            else:
                status = GateStatus.FAILED
                message = f"Business validation failed (score: {overall_score:.3f})"
            
        except Exception as e:
            status = GateStatus.FAILED
            overall_score = 0.0
            message = f"Business validation error: {str(e)}"
            issues.append(f"Business validation exception: {str(e)}")
        
        execution_time = (datetime.utcnow() - start_time).total_seconds()
        
        return GateResult(
            gate_name=self.name,
            status=status,
            severity=self.severity,
            score=overall_score,
            message=message,
            details={
                'business_results': business_results,
                'checks_performed': self.business_checks
            },
            evidence=issues,
            recommendations=recommendations,
            execution_time=execution_time
        )
    
    def _execute_business_check(self, check_name: str, context: DeploymentContext) -> Dict:
        """Execute a specific business validation check."""
        
        # Mock implementation - would integrate with business validation tools
        check_score = np.random.uniform(0.85, 1.0)
        
        issues = []
        recommendations = []
        
        if check_score < 0.90:
            issues.append(f"{check_name} validation concerns identified")
            recommendations.append(f"Review {check_name} business logic")
        
        return {
            'score': check_score,
            'passed': check_score >= 0.90,
            'issues': issues,
            'recommendations': recommendations,
            'validation_details': f"{check_name} business validation"
        }


class DeploymentSafetyGateManager:
    """Manages execution of all safety gates for deployment validation."""
    
    def __init__(self):
        self.safety_gates = [
            DataQualityGate(),
            PerformanceRegressionGate(),
            SecurityValidationGate(),
            BusinessValidationGate()
        ]
        
        self.gate_execution_order = [
            "Security Validation",           # Security first
            "Data Quality Validation",      # Data quality before performance
            "Performance Regression Check", # Performance before business logic
            "Business Logic Validation"     # Business validation last
        ]
        
        self.logger = logging.getLogger(self.__class__.__name__)
    
    def execute_safety_gates(self, context: DeploymentContext) -> Dict:
        """Execute all safety gates for deployment validation."""
        
        self.logger.info(f"Starting safety gate validation for deployment {context.deployment_id}")
        
        gate_results = {}
        overall_status = GateStatus.PASSED
        blocking_failures = []
        warnings = []
        overall_score = 1.0
        
        # Execute gates in defined order
        for gate_name in self.gate_execution_order:
            gate = self._get_gate_by_name(gate_name)
            if not gate:
                continue
                
            self.logger.info(f"Executing safety gate: {gate_name}")
            
            try:
                result = gate.validate(context)
                gate_results[gate_name] = result
                
                # Update overall score
                overall_score *= result.score
                
                # Check for blocking failures
                if result.status == GateStatus.FAILED and gate.is_blocking():
                    blocking_failures.append(gate_name)
                    overall_status = GateStatus.FAILED
                elif result.status == GateStatus.WARNING:
                    warnings.append(gate_name)
                    if overall_status != GateStatus.FAILED:
                        overall_status = GateStatus.WARNING
                
                self.logger.info(f"Gate {gate_name} completed with status: {result.status.value}")
                
            except Exception as e:
                self.logger.error(f"Gate {gate_name} execution failed: {str(e)}")
                gate_results[gate_name] = GateResult(
                    gate_name=gate_name,
                    status=GateStatus.FAILED,
                    severity=gate.severity,
                    score=0.0,
                    message=f"Gate execution failed: {str(e)}",
                    details={'error': str(e)}
                )
                
                if gate.is_blocking():
                    blocking_failures.append(gate_name)
                    overall_status = GateStatus.FAILED
        
        # Generate deployment recommendation
        deployment_recommendation = self._generate_deployment_recommendation(
            overall_status, 
            blocking_failures, 
            warnings, 
            overall_score
        )
        
        validation_summary = {
            'deployment_id': context.deployment_id,
            'overall_status': overall_status,
            'overall_score': overall_score,
            'gate_results': gate_results,
            'blocking_failures': blocking_failures,
            'warnings': warnings,
            'deployment_recommendation': deployment_recommendation,
            'validation_timestamp': datetime.utcnow(),
            'execution_summary': self._create_execution_summary(gate_results)
        }
        
        self.logger.info(f"Safety gate validation completed with overall status: {overall_status.value}")
        
        return validation_summary
    
    def _get_gate_by_name(self, gate_name: str) -> Optional[SafetyGate]:
        """Get safety gate instance by name."""
        for gate in self.safety_gates:
            if gate.name == gate_name:
                return gate
        return None
    
    def _generate_deployment_recommendation(
        self, 
        overall_status: GateStatus, 
        blocking_failures: List[str], 
        warnings: List[str],
        overall_score: float
    ) -> Dict:
        """Generate deployment recommendation based on gate results."""
        
        if overall_status == GateStatus.FAILED:
            recommendation = "BLOCK_DEPLOYMENT"
            rationale = f"Deployment blocked due to {len(blocking_failures)} critical gate failures"
            required_actions = [
                f"Resolve critical issues in: {', '.join(blocking_failures)}",
                "Re-run safety gate validation after fixes",
                "Obtain stakeholder approval for deployment"
            ]
        elif overall_status == GateStatus.WARNING:
            recommendation = "PROCEED_WITH_CAUTION"
            rationale = f"Deployment can proceed with {len(warnings)} warnings (score: {overall_score:.3f})"
            required_actions = [
                f"Review warning conditions in: {', '.join(warnings)}",
                "Increase monitoring during deployment",
                "Have rollback plan ready"
            ]
        else:
            recommendation = "APPROVE_DEPLOYMENT"
            rationale = f"All safety gates passed successfully (score: {overall_score:.3f})"
            required_actions = [
                "Proceed with standard deployment process",
                "Monitor deployment progress",
                "Validate post-deployment metrics"
            ]
        
        return {
            'recommendation': recommendation,
            'rationale': rationale,
            'required_actions': required_actions,
            'confidence_score': overall_score,
            'stakeholder_approval_required': overall_status == GateStatus.FAILED
        }
    
    def _create_execution_summary(self, gate_results: Dict) -> Dict:
        """Create execution summary for reporting."""
        
        total_execution_time = sum(
            result.execution_time for result in gate_results.values()
        )
        
        status_counts = {}
        for status in GateStatus:
            status_counts[status.value] = sum(
                1 for result in gate_results.values() 
                if result.status == status
            )
        
        return {
            'total_gates_executed': len(gate_results),
            'total_execution_time_seconds': total_execution_time,
            'status_distribution': status_counts,
            'average_score': np.mean([result.score for result in gate_results.values()]),
            'min_score': min([result.score for result in gate_results.values()]),
            'max_score': max([result.score for result in gate_results.values()])
        }


def create_deployment_validation_report(validation_summary: Dict) -> str:
    """Create formatted deployment validation report."""
    
    report = f"""
# Deployment Safety Gate Validation Report

**Deployment ID**: {validation_summary['deployment_id']}
**Validation Time**: {validation_summary['validation_timestamp'].strftime('%Y-%m-%d %H:%M:%S')}
**Overall Status**: {validation_summary['overall_status'].value.upper()}
**Overall Score**: {validation_summary['overall_score']:.3f}/1.000

## Recommendation: {validation_summary['deployment_recommendation']['recommendation']}

{validation_summary['deployment_recommendation']['rationale']}

### Required Actions:
{chr(10).join(f"- {action}" for action in validation_summary['deployment_recommendation']['required_actions'])}

## Safety Gate Results

"""
    
    for gate_name, result in validation_summary['gate_results'].items():
        status_icon = "✅" if result.status == GateStatus.PASSED else "⚠️" if result.status == GateStatus.WARNING else "❌"
        
        report += f"""
### {status_icon} {gate_name}
- **Status**: {result.status.value.upper()}
- **Score**: {result.score:.3f}
- **Severity**: {result.severity.value}
- **Message**: {result.message}
- **Execution Time**: {result.execution_time:.2f}s

"""
        
        if result.evidence:
            report += "**Issues Found:**\n"
            for issue in result.evidence[:3]:  # Limit to top 3 issues
                report += f"- {issue}\n"
            
        if result.recommendations:
            report += "**Recommendations:**\n"
            for rec in result.recommendations[:3]:  # Limit to top 3 recommendations
                report += f"- {rec}\n"
        
        report += "\n"
    
    # Add execution summary
    summary = validation_summary['execution_summary']
    report += f"""
## Execution Summary

- **Total Gates**: {summary['total_gates_executed']}
- **Total Time**: {summary['total_execution_time_seconds']:.2f}s
- **Average Score**: {summary['average_score']:.3f}
- **Status Distribution**: {summary['status_distribution']}

---
*Report generated by Data QA Engineer Agent Safety Gates*
"""
    
    return report


# Example usage and testing
if __name__ == "__main__":
    # Configure logging
    logging.basicConfig(level=logging.INFO)
    
    # Create deployment context
    context = DeploymentContext(
        deployment_id="deploy-20231201-143022",
        environment="staging",
        models_changed=["customer_segmentation", "order_analytics", "revenue_calculation"],
        deployment_type="blue_green",
        change_scope="minor",
        business_impact="medium"
    )
    
    # Execute safety gates
    gate_manager = DeploymentSafetyGateManager()
    validation_result = gate_manager.execute_safety_gates(context)
    
    # Generate report
    report = create_deployment_validation_report(validation_result)
    
    print("=== DEPLOYMENT SAFETY GATE VALIDATION ===")
    print(f"Overall Status: {validation_result['overall_status'].value}")
    print(f"Overall Score: {validation_result['overall_score']:.3f}")
    print(f"Recommendation: {validation_result['deployment_recommendation']['recommendation']}")
    
    if validation_result['blocking_failures']:
        print(f"Blocking Failures: {', '.join(validation_result['blocking_failures'])}")
    
    if validation_result['warnings']:
        print(f"Warnings: {', '.join(validation_result['warnings'])}")
    
    print(f"\n{report}")