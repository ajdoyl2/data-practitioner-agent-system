"""
Fallback Strategies for Transformation Engine Selection System

This module provides comprehensive fallback and error recovery mechanisms for the
transformation engine selection system. It handles various failure scenarios including
recommendation engine failures, constraint conflicts, system errors, and resource issues.

Key Features:
- Intelligent fallback decision trees
- Multi-level recovery strategies
- Context-aware error handling
- User guidance and alternative suggestions
- System health monitoring and recovery
"""

import os
import sys
import time
import logging
import traceback
from dataclasses import dataclass, field
from typing import Dict, List, Optional, Tuple, Any, Union, Callable
from pathlib import Path
from datetime import datetime, timedelta
from enum import Enum
import json
import yaml

logger = logging.getLogger(__name__)

class FallbackReason(Enum):
    """Enumeration of fallback trigger reasons."""
    
    PRIMARY_RECOMMENDATION_FAILED = "primary_recommendation_failed"
    CONSTRAINTS_TOO_RESTRICTIVE = "constraints_too_restrictive"
    USER_OVERRIDE_CONFLICTS = "user_override_conflicts"
    SYSTEM_ERROR = "system_error"
    RESOURCE_UNAVAILABLE = "resource_unavailable"
    TIMEOUT_EXCEEDED = "timeout_exceeded"
    CONFIGURATION_INVALID = "configuration_invalid"
    DEPENDENCY_FAILURE = "dependency_failure"
    PERMISSION_DENIED = "permission_denied"
    DATA_CORRUPTION = "data_corruption"

class FallbackSeverity(Enum):
    """Fallback severity levels."""
    
    LOW = "low"           # Minor issues, graceful degradation
    MEDIUM = "medium"     # Significant issues, alternative approaches needed
    HIGH = "high"         # Major issues, safe mode required
    CRITICAL = "critical" # System failure, emergency procedures

class RecoveryStrategy(Enum):
    """Available recovery strategies."""
    
    RETRY_WITH_BACKOFF = "retry_with_backoff"
    USE_ALTERNATIVE_ENGINE = "use_alternative_engine"
    RELAX_CONSTRAINTS = "relax_constraints"
    USE_DEFAULT_CONFIGURATION = "use_default_configuration"
    ENTER_SAFE_MODE = "enter_safe_mode"
    GRACEFUL_DEGRADATION = "graceful_degradation"
    MANUAL_INTERVENTION = "manual_intervention"
    SYSTEM_SHUTDOWN = "system_shutdown"

@dataclass
class FallbackContext:
    """Context information for fallback processing."""
    
    # Trigger information
    reason: FallbackReason
    severity: FallbackSeverity
    error_message: str
    original_error: Optional[Exception] = None
    
    # System state
    system_health: Dict[str, Any] = field(default_factory=dict)
    resource_availability: Dict[str, bool] = field(default_factory=dict)
    configuration_state: Dict[str, Any] = field(default_factory=dict)
    
    # Context preservation
    original_request: Optional[Dict[str, Any]] = None
    partial_results: Optional[Dict[str, Any]] = None
    user_context: Optional[Dict[str, Any]] = None
    
    # Recovery tracking
    recovery_attempts: int = 0
    max_recovery_attempts: int = 3
    attempted_strategies: List[RecoveryStrategy] = field(default_factory=list)
    
    # Timing information
    failure_timestamp: datetime = field(default_factory=datetime.now)
    timeout_deadline: Optional[datetime] = None

@dataclass
class FallbackResult:
    """Result of fallback processing."""
    
    success: bool
    recovery_strategy: Optional[RecoveryStrategy]
    fallback_recommendation: Optional[Any] = None
    
    # Alternative options
    alternative_options: List[Any] = field(default_factory=list)
    suggested_actions: List[str] = field(default_factory=list)
    
    # Error information
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    
    # Recovery metrics
    recovery_time_seconds: float = 0.0
    confidence_reduction: float = 0.0
    
    # User guidance
    user_message: str = ""
    technical_details: Dict[str, Any] = field(default_factory=dict)

class SystemHealthMonitor:
    """Monitor system health and resource availability."""
    
    def __init__(self):
        self.health_checks = {
            'memory': self._check_memory,
            'disk_space': self._check_disk_space,
            'network': self._check_network,
            'dependencies': self._check_dependencies,
            'configuration': self._check_configuration
        }
        
    def check_system_health(self) -> Dict[str, Any]:
        """Comprehensive system health check."""
        
        health_status = {
            'overall': 'healthy',
            'timestamp': datetime.now().isoformat(),
            'checks': {}
        }
        
        failed_checks = 0
        
        for check_name, check_function in self.health_checks.items():
            try:
                check_result = check_function()
                health_status['checks'][check_name] = check_result
                
                if not check_result.get('healthy', True):
                    failed_checks += 1
                    
            except Exception as e:
                logger.error(f"Health check {check_name} failed: {e}")
                health_status['checks'][check_name] = {
                    'healthy': False,
                    'error': str(e)
                }
                failed_checks += 1
        
        # Determine overall health
        total_checks = len(self.health_checks)
        if failed_checks == 0:
            health_status['overall'] = 'healthy'
        elif failed_checks <= total_checks * 0.3:
            health_status['overall'] = 'degraded'
        elif failed_checks <= total_checks * 0.7:
            health_status['overall'] = 'unhealthy'
        else:
            health_status['overall'] = 'critical'
        
        return health_status
    
    def _check_memory(self) -> Dict[str, Any]:
        """Check available memory."""
        
        try:
            import psutil
            
            memory = psutil.virtual_memory()
            return {
                'healthy': memory.percent < 90,
                'usage_percent': memory.percent,
                'available_gb': memory.available / (1024**3),
                'details': f"Memory usage: {memory.percent:.1f}%"
            }
        except ImportError:
            # Fallback without psutil
            return {
                'healthy': True,
                'details': "Memory monitoring not available (psutil not installed)"
            }
    
    def _check_disk_space(self) -> Dict[str, Any]:
        """Check available disk space."""
        
        try:
            import shutil
            
            current_path = Path.cwd()
            total, used, free = shutil.disk_usage(current_path)
            
            usage_percent = (used / total) * 100
            free_gb = free / (1024**3)
            
            return {
                'healthy': usage_percent < 95,
                'usage_percent': usage_percent,
                'free_gb': free_gb,
                'details': f"Disk usage: {usage_percent:.1f}%, {free_gb:.1f}GB free"
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': f"Disk check failed: {e}"
            }
    
    def _check_network(self) -> Dict[str, Any]:
        """Check network connectivity."""
        
        try:
            import socket
            
            # Try to connect to a reliable host
            socket.create_connection(("8.8.8.8", 53), timeout=5)
            return {
                'healthy': True,
                'details': "Network connectivity available"
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': f"Network check failed: {e}"
            }
    
    def _check_dependencies(self) -> Dict[str, Any]:
        """Check required dependencies."""
        
        required_modules = ['yaml', 'pathlib', 'dataclasses', 'typing']
        missing_modules = []
        
        for module in required_modules:
            try:
                __import__(module)
            except ImportError:
                missing_modules.append(module)
        
        return {
            'healthy': len(missing_modules) == 0,
            'missing_modules': missing_modules,
            'details': f"Dependencies check: {len(missing_modules)} missing modules"
        }
    
    def _check_configuration(self) -> Dict[str, Any]:
        """Check configuration validity."""
        
        try:
            # Check if configuration files are accessible and valid
            config_paths = [
                'config/feature-flags/transformation-engine-flags.yaml',
                '.agent-config.yml'
            ]
            
            config_issues = []
            
            for config_path in config_paths:
                if os.path.exists(config_path):
                    try:
                        with open(config_path, 'r') as f:
                            yaml.safe_load(f)
                    except Exception as e:
                        config_issues.append(f"{config_path}: {e}")
            
            return {
                'healthy': len(config_issues) == 0,
                'issues': config_issues,
                'details': f"Configuration check: {len(config_issues)} issues found"
            }
        except Exception as e:
            return {
                'healthy': False,
                'error': f"Configuration check failed: {e}"
            }

class FallbackDecisionEngine:
    """Engine for making intelligent fallback decisions."""
    
    def __init__(self):
        self.health_monitor = SystemHealthMonitor()
        
        # Strategy priority matrix based on reason and severity
        self.strategy_matrix = {
            FallbackReason.PRIMARY_RECOMMENDATION_FAILED: {
                FallbackSeverity.LOW: [RecoveryStrategy.USE_ALTERNATIVE_ENGINE],
                FallbackSeverity.MEDIUM: [RecoveryStrategy.RETRY_WITH_BACKOFF, RecoveryStrategy.USE_ALTERNATIVE_ENGINE],
                FallbackSeverity.HIGH: [RecoveryStrategy.USE_DEFAULT_CONFIGURATION, RecoveryStrategy.ENTER_SAFE_MODE],
                FallbackSeverity.CRITICAL: [RecoveryStrategy.ENTER_SAFE_MODE, RecoveryStrategy.MANUAL_INTERVENTION]
            },
            FallbackReason.CONSTRAINTS_TOO_RESTRICTIVE: {
                FallbackSeverity.LOW: [RecoveryStrategy.RELAX_CONSTRAINTS],
                FallbackSeverity.MEDIUM: [RecoveryStrategy.RELAX_CONSTRAINTS, RecoveryStrategy.USE_ALTERNATIVE_ENGINE],
                FallbackSeverity.HIGH: [RecoveryStrategy.USE_DEFAULT_CONFIGURATION],
                FallbackSeverity.CRITICAL: [RecoveryStrategy.MANUAL_INTERVENTION]
            },
            FallbackReason.USER_OVERRIDE_CONFLICTS: {
                FallbackSeverity.LOW: [RecoveryStrategy.GRACEFUL_DEGRADATION],
                FallbackSeverity.MEDIUM: [RecoveryStrategy.USE_ALTERNATIVE_ENGINE],
                FallbackSeverity.HIGH: [RecoveryStrategy.USE_DEFAULT_CONFIGURATION],
                FallbackSeverity.CRITICAL: [RecoveryStrategy.MANUAL_INTERVENTION]
            },
            FallbackReason.SYSTEM_ERROR: {
                FallbackSeverity.LOW: [RecoveryStrategy.RETRY_WITH_BACKOFF],
                FallbackSeverity.MEDIUM: [RecoveryStrategy.RETRY_WITH_BACKOFF, RecoveryStrategy.GRACEFUL_DEGRADATION],
                FallbackSeverity.HIGH: [RecoveryStrategy.ENTER_SAFE_MODE],
                FallbackSeverity.CRITICAL: [RecoveryStrategy.SYSTEM_SHUTDOWN, RecoveryStrategy.MANUAL_INTERVENTION]
            },
            FallbackReason.RESOURCE_UNAVAILABLE: {
                FallbackSeverity.LOW: [RecoveryStrategy.GRACEFUL_DEGRADATION],
                FallbackSeverity.MEDIUM: [RecoveryStrategy.USE_ALTERNATIVE_ENGINE, RecoveryStrategy.GRACEFUL_DEGRADATION],
                FallbackSeverity.HIGH: [RecoveryStrategy.ENTER_SAFE_MODE],
                FallbackSeverity.CRITICAL: [RecoveryStrategy.MANUAL_INTERVENTION]
            }
        }
        
    def analyze_failure(self, error: Exception, context: Dict[str, Any]) -> FallbackContext:
        """Analyze failure and create fallback context."""
        
        # Determine fallback reason
        reason = self._classify_error(error, context)
        
        # Assess severity
        severity = self._assess_severity(error, context, reason)
        
        # Check system health
        system_health = self.health_monitor.check_system_health()
        
        # Create fallback context
        fallback_context = FallbackContext(
            reason=reason,
            severity=severity,
            error_message=str(error),
            original_error=error,
            system_health=system_health,
            resource_availability=self._check_resource_availability(),
            configuration_state=self._get_configuration_state(),
            original_request=context.get('original_request'),
            user_context=context.get('user_context'),
            timeout_deadline=self._calculate_timeout_deadline(severity)
        )
        
        logger.error(
            f"Fallback analysis: reason={reason.value}, severity={severity.value}, "
            f"error={str(error)[:100]}..."
        )
        
        return fallback_context
    
    def select_recovery_strategy(self, context: FallbackContext) -> List[RecoveryStrategy]:
        """Select appropriate recovery strategies based on context."""
        
        # Get base strategies from matrix
        strategies = self.strategy_matrix.get(
            context.reason, 
            {context.severity: [RecoveryStrategy.MANUAL_INTERVENTION]}
        ).get(
            context.severity, 
            [RecoveryStrategy.MANUAL_INTERVENTION]
        )
        
        # Filter out already attempted strategies if max attempts not reached
        if context.recovery_attempts < context.max_recovery_attempts:
            available_strategies = [
                s for s in strategies 
                if s not in context.attempted_strategies
            ]
            if available_strategies:
                strategies = available_strategies
        
        # Adjust based on system health
        if context.system_health.get('overall') == 'critical':
            strategies = [RecoveryStrategy.ENTER_SAFE_MODE, RecoveryStrategy.MANUAL_INTERVENTION]
        elif context.system_health.get('overall') == 'unhealthy':
            # Prefer safer strategies
            safe_strategies = [
                RecoveryStrategy.USE_DEFAULT_CONFIGURATION,
                RecoveryStrategy.ENTER_SAFE_MODE,
                RecoveryStrategy.GRACEFUL_DEGRADATION
            ]
            strategies = [s for s in strategies if s in safe_strategies] or strategies
        
        # Adjust based on timeout constraints
        if context.timeout_deadline and datetime.now() > context.timeout_deadline:
            # Use fastest recovery strategies
            fast_strategies = [
                RecoveryStrategy.USE_DEFAULT_CONFIGURATION,
                RecoveryStrategy.ENTER_SAFE_MODE
            ]
            strategies = [s for s in fast_strategies if s in strategies] or [RecoveryStrategy.ENTER_SAFE_MODE]
        
        return strategies
    
    def _classify_error(self, error: Exception, context: Dict[str, Any]) -> FallbackReason:
        """Classify the error to determine fallback reason."""
        
        error_type = type(error).__name__
        error_message = str(error).lower()
        
        # Classification rules
        if 'timeout' in error_message or error_type == 'TimeoutError':
            return FallbackReason.TIMEOUT_EXCEEDED
        elif 'permission' in error_message or error_type == 'PermissionError':
            return FallbackReason.PERMISSION_DENIED
        elif 'configuration' in error_message or 'config' in error_message:
            return FallbackReason.CONFIGURATION_INVALID
        elif 'constraint' in error_message or 'no valid' in error_message:
            return FallbackReason.CONSTRAINTS_TOO_RESTRICTIVE
        elif 'override' in error_message or 'conflict' in error_message:
            return FallbackReason.USER_OVERRIDE_CONFLICTS
        elif 'resource' in error_message or 'memory' in error_message or 'disk' in error_message:
            return FallbackReason.RESOURCE_UNAVAILABLE
        elif error_type in ['ImportError', 'ModuleNotFoundError']:
            return FallbackReason.DEPENDENCY_FAILURE
        elif error_type in ['FileNotFoundError', 'IsADirectoryError']:
            return FallbackReason.DATA_CORRUPTION
        else:
            return FallbackReason.SYSTEM_ERROR
    
    def _assess_severity(self, error: Exception, context: Dict[str, Any], reason: FallbackReason) -> FallbackSeverity:
        """Assess the severity of the failure."""
        
        # Base severity by error type
        critical_errors = ['SystemExit', 'KeyboardInterrupt', 'MemoryError']
        high_errors = ['OSError', 'RuntimeError', 'ValueError']
        medium_errors = ['TypeError', 'AttributeError', 'ImportError']
        
        error_type = type(error).__name__
        
        if error_type in critical_errors:
            return FallbackSeverity.CRITICAL
        elif error_type in high_errors:
            return FallbackSeverity.HIGH
        elif error_type in medium_errors:
            return FallbackSeverity.MEDIUM
        
        # Adjust based on reason
        high_severity_reasons = [
            FallbackReason.DATA_CORRUPTION,
            FallbackReason.DEPENDENCY_FAILURE,
            FallbackReason.SYSTEM_ERROR
        ]
        
        if reason in high_severity_reasons:
            return FallbackSeverity.HIGH
        
        # Adjust based on context
        if context.get('critical_operation', False):
            return FallbackSeverity.HIGH
        elif context.get('user_facing', True):
            return FallbackSeverity.MEDIUM
        else:
            return FallbackSeverity.LOW
    
    def _check_resource_availability(self) -> Dict[str, bool]:
        """Check availability of various resources."""
        
        return {
            'memory': True,  # Simplified - would check actual memory
            'disk': True,    # Simplified - would check actual disk space  
            'network': True, # Simplified - would check actual network
            'cpu': True      # Simplified - would check actual CPU usage
        }
    
    def _get_configuration_state(self) -> Dict[str, Any]:
        """Get current configuration state."""
        
        return {
            'feature_flags_loaded': True,  # Would check actual state
            'user_preferences_loaded': True,
            'system_config_valid': True,
            'environment': os.environ.get('ENVIRONMENT', 'development')
        }
    
    def _calculate_timeout_deadline(self, severity: FallbackSeverity) -> datetime:
        """Calculate timeout deadline based on severity."""
        
        timeout_seconds = {
            FallbackSeverity.LOW: 300,     # 5 minutes
            FallbackSeverity.MEDIUM: 120,  # 2 minutes
            FallbackSeverity.HIGH: 60,     # 1 minute
            FallbackSeverity.CRITICAL: 30  # 30 seconds
        }
        
        return datetime.now() + timedelta(seconds=timeout_seconds[severity])

class RecoveryExecutor:
    """Execute recovery strategies."""
    
    def __init__(self):
        self.strategy_handlers = {
            RecoveryStrategy.RETRY_WITH_BACKOFF: self._retry_with_backoff,
            RecoveryStrategy.USE_ALTERNATIVE_ENGINE: self._use_alternative_engine,
            RecoveryStrategy.RELAX_CONSTRAINTS: self._relax_constraints,
            RecoveryStrategy.USE_DEFAULT_CONFIGURATION: self._use_default_configuration,
            RecoveryStrategy.ENTER_SAFE_MODE: self._enter_safe_mode,
            RecoveryStrategy.GRACEFUL_DEGRADATION: self._graceful_degradation,
            RecoveryStrategy.MANUAL_INTERVENTION: self._manual_intervention,
            RecoveryStrategy.SYSTEM_SHUTDOWN: self._system_shutdown
        }
    
    def execute_recovery(
        self, 
        strategy: RecoveryStrategy, 
        context: FallbackContext,
        original_operation: Callable
    ) -> FallbackResult:
        """Execute a specific recovery strategy."""
        
        start_time = time.time()
        
        logger.info(f"Executing recovery strategy: {strategy.value}")
        
        try:
            handler = self.strategy_handlers.get(strategy)
            if not handler:
                raise ValueError(f"Unknown recovery strategy: {strategy}")
            
            result = handler(context, original_operation)
            
            # Update result metrics
            result.recovery_time_seconds = time.time() - start_time
            
            if result.success:
                logger.info(f"Recovery strategy {strategy.value} succeeded")
            else:
                logger.warning(f"Recovery strategy {strategy.value} failed: {result.errors}")
            
            return result
            
        except Exception as e:
            logger.error(f"Recovery strategy {strategy.value} execution failed: {e}")
            
            return FallbackResult(
                success=False,
                recovery_strategy=strategy,
                errors=[f"Recovery execution failed: {str(e)}"],
                recovery_time_seconds=time.time() - start_time,
                user_message="Recovery attempt failed. Please try again or contact support."
            )
    
    def _retry_with_backoff(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Retry the original operation with exponential backoff."""
        
        max_attempts = 3
        base_delay = 1.0
        
        for attempt in range(max_attempts):
            if attempt > 0:
                delay = base_delay * (2 ** (attempt - 1))
                logger.info(f"Retrying in {delay} seconds (attempt {attempt + 1}/{max_attempts})")
                time.sleep(delay)
            
            try:
                result = original_operation()
                
                return FallbackResult(
                    success=True,
                    recovery_strategy=RecoveryStrategy.RETRY_WITH_BACKOFF,
                    fallback_recommendation=result,
                    user_message=f"Operation succeeded after {attempt + 1} attempt(s)",
                    technical_details={'attempts': attempt + 1, 'delay_used': delay if attempt > 0 else 0}
                )
                
            except Exception as e:
                last_error = str(e)
                logger.warning(f"Retry attempt {attempt + 1} failed: {last_error}")
                
                if attempt == max_attempts - 1:
                    break
        
        return FallbackResult(
            success=False,
            recovery_strategy=RecoveryStrategy.RETRY_WITH_BACKOFF,
            errors=[f"All {max_attempts} retry attempts failed. Last error: {last_error}"],
            user_message="Operation failed after multiple retries. Please check system status.",
            technical_details={'max_attempts': max_attempts, 'final_error': last_error}
        )
    
    def _use_alternative_engine(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Use an alternative transformation engine."""
        
        # Define engine alternatives priority
        engine_alternatives = {
            'sqlmesh': ['dbt', 'dual_engine'],
            'dbt': ['sqlmesh', 'dual_engine'],
            'dual_engine': ['sqlmesh', 'dbt']
        }
        
        # Try to determine original engine from context
        original_engine = None
        if context.original_request:
            original_engine = context.original_request.get('recommended_engine')
        
        if not original_engine:
            # Default fallback sequence
            alternatives = ['dbt', 'sqlmesh']  # dbt as most stable fallback
        else:
            alternatives = engine_alternatives.get(original_engine, ['dbt'])
        
        for alternative_engine in alternatives:
            try:
                logger.info(f"Trying alternative engine: {alternative_engine}")
                
                # Create modified request with alternative engine
                modified_request = context.original_request.copy() if context.original_request else {}
                modified_request['force_engine'] = alternative_engine
                
                # Execute operation with alternative
                result = original_operation(**modified_request)
                
                return FallbackResult(
                    success=True,
                    recovery_strategy=RecoveryStrategy.USE_ALTERNATIVE_ENGINE,
                    fallback_recommendation=result,
                    confidence_reduction=0.2,  # Reduced confidence due to fallback
                    user_message=f"Using alternative engine '{alternative_engine}' due to issues with original recommendation",
                    alternative_options=[f"Alternative engine: {alternative_engine}"],
                    technical_details={
                        'original_engine': original_engine,
                        'selected_alternative': alternative_engine,
                        'available_alternatives': alternatives
                    }
                )
                
            except Exception as e:
                logger.warning(f"Alternative engine {alternative_engine} also failed: {e}")
                continue
        
        return FallbackResult(
            success=False,
            recovery_strategy=RecoveryStrategy.USE_ALTERNATIVE_ENGINE,
            errors=[f"All alternative engines failed"],
            user_message="No suitable alternative transformation engine found. Manual intervention required.",
            technical_details={'attempted_alternatives': alternatives}
        )
    
    def _relax_constraints(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Relax constraints to find viable options."""
        
        if not context.original_request:
            return FallbackResult(
                success=False,
                recovery_strategy=RecoveryStrategy.RELAX_CONSTRAINTS,
                errors=["No original request context available for constraint relaxation"],
                user_message="Unable to relax constraints - missing context information"
            )
        
        # Define constraint relaxation strategies
        relaxation_strategies = [
            {'name': 'Remove engine exclusions', 'action': lambda req: req.pop('exclude_engines', None)},
            {'name': 'Increase budget tolerance', 'action': self._relax_budget_constraints},
            {'name': 'Extend timeline', 'action': self._relax_timeline_constraints},
            {'name': 'Reduce feature requirements', 'action': self._relax_feature_requirements}
        ]
        
        original_request = context.original_request.copy()
        
        for strategy in relaxation_strategies:
            try:
                logger.info(f"Trying constraint relaxation: {strategy['name']}")
                
                modified_request = original_request.copy()
                strategy['action'](modified_request)
                
                result = original_operation(**modified_request)
                
                return FallbackResult(
                    success=True,
                    recovery_strategy=RecoveryStrategy.RELAX_CONSTRAINTS,
                    fallback_recommendation=result,
                    confidence_reduction=0.3,  # Higher reduction due to constraint relaxation
                    user_message=f"Found solution by relaxing constraints: {strategy['name']}",
                    suggested_actions=[
                        f"Constraint relaxation applied: {strategy['name']}",
                        "Review if the relaxed constraints are acceptable for your project",
                        "Consider adjusting project requirements if needed"
                    ],
                    technical_details={
                        'relaxation_strategy': strategy['name'],
                        'original_constraints': original_request,
                        'relaxed_constraints': modified_request
                    }
                )
                
            except Exception as e:
                logger.warning(f"Constraint relaxation '{strategy['name']}' failed: {e}")
                continue
        
        return FallbackResult(
            success=False,
            recovery_strategy=RecoveryStrategy.RELAX_CONSTRAINTS,
            errors=["All constraint relaxation strategies failed"],
            user_message="Unable to find solution even with relaxed constraints. Consider reviewing project requirements.",
            suggested_actions=[
                "Review project constraints for feasibility",
                "Consider manual engine selection",
                "Consult with technical team for guidance"
            ]
        )
    
    def _use_default_configuration(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Use default system configuration."""
        
        default_config = {
            'recommended_engine': 'dbt',  # Most stable default
            'constraints': {
                'max_implementation_weeks': 16,
                'cost_optimization_priority': 'medium',
                'risk_tolerance': 'medium'
            },
            'technical_preferences': {
                'prefer_stable_technologies': True,
                'innovation_tolerance': 'low'
            }
        }
        
        try:
            logger.info("Using default configuration for recovery")
            
            result = original_operation(**default_config)
            
            return FallbackResult(
                success=True,
                recovery_strategy=RecoveryStrategy.USE_DEFAULT_CONFIGURATION,
                fallback_recommendation=result,
                confidence_reduction=0.4,  # Significant reduction due to default fallback
                user_message="Using default system configuration due to issues with custom settings",
                suggested_actions=[
                    "Review and validate your custom configuration",
                    "Consider using default settings as a starting point",
                    "Gradually introduce custom requirements"
                ],
                warnings=[
                    "Default configuration may not match your specific requirements",
                    "Consider customizing settings once system is stable"
                ],
                technical_details={
                    'default_config_used': default_config,
                    'original_config_issues': str(context.original_error)
                }
            )
            
        except Exception as e:
            logger.error(f"Default configuration also failed: {e}")
            
            return FallbackResult(
                success=False,
                recovery_strategy=RecoveryStrategy.USE_DEFAULT_CONFIGURATION,
                errors=[f"Default configuration failed: {str(e)}"],
                user_message="System unable to operate even with default configuration. Critical issue detected.",
                technical_details={'default_config_error': str(e)}
            )
    
    def _enter_safe_mode(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Enter safe mode with minimal functionality."""
        
        safe_mode_config = {
            'recommended_engine': 'dbt',  # Most reliable engine
            'confidence_score': 0.5,     # Conservative confidence
            'reasoning': ['Safe mode activated due to system issues'],
            'migration_complexity': 'medium',
            'estimated_implementation_weeks': 12,
            'warnings': [
                'System operating in safe mode',
                'Limited functionality available',
                'Recommendation may be suboptimal'
            ],
            'alternative_engines': [],  # No alternatives in safe mode
            'fallback_recommendation': 'dbt'
        }
        
        logger.warning("Entering safe mode operation")
        
        return FallbackResult(
            success=True,
            recovery_strategy=RecoveryStrategy.ENTER_SAFE_MODE,
            fallback_recommendation=safe_mode_config,
            confidence_reduction=0.5,
            user_message="System operating in safe mode with basic functionality",
            warnings=[
                "Safe mode provides basic functionality only",
                "Advanced features and optimizations disabled",
                "Consider resolving underlying issues for full functionality"
            ],
            suggested_actions=[
                "Use basic dbt setup as recommended",
                "Monitor system for stability",
                "Contact support for assistance with full functionality"
            ],
            technical_details={
                'safe_mode_reason': context.reason.value,
                'system_health': context.system_health.get('overall', 'unknown'),
                'safe_mode_config': safe_mode_config
            }
        )
    
    def _graceful_degradation(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Provide graceful degradation with reduced functionality."""
        
        # Provide basic recommendation with limited analysis
        degraded_recommendation = {
            'recommended_engine': 'dbt',  # Safe default
            'confidence_score': 0.3,     # Low confidence due to limited analysis
            'reasoning': [
                'Limited analysis available due to system constraints',
                'Recommendation based on general best practices',
                'dbt selected as most widely supported option'
            ],
            'technical_score': 6.0,
            'cost_score': 6.0,
            'team_readiness_score': 7.0,
            'risk_score': 8.0,
            'migration_complexity': 'medium',
            'estimated_implementation_weeks': 10,
            'warnings': [
                'Recommendation based on limited analysis',
                'Consider full analysis when system issues are resolved'
            ],
            'considerations': [
                'This is a conservative recommendation',
                'Full analysis recommended when possible'
            ]
        }
        
        return FallbackResult(
            success=True,
            recovery_strategy=RecoveryStrategy.GRACEFUL_DEGRADATION,
            fallback_recommendation=degraded_recommendation,
            confidence_reduction=0.6,  # Significant reduction due to limited analysis
            user_message="Providing basic recommendation with limited analysis due to system constraints",
            warnings=[
                "Analysis capabilities temporarily limited",
                "Recommendation may not be fully optimized",
                "Consider re-running analysis when system is stable"
            ],
            suggested_actions=[
                "Use provided recommendation as starting point",
                "Monitor system stability",
                "Re-run analysis when full functionality is available"
            ],
            technical_details={
                'degradation_reason': context.reason.value,
                'analysis_limitations': 'Full project analysis unavailable',
                'confidence_impact': 'Significantly reduced due to limited data'
            }
        )
    
    def _manual_intervention(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Require manual intervention."""
        
        # Collect diagnostic information for manual review
        diagnostic_info = {
            'failure_reason': context.reason.value,
            'severity': context.severity.value,
            'error_message': context.error_message,
            'system_health': context.system_health,
            'resource_availability': context.resource_availability,
            'timestamp': context.failure_timestamp.isoformat(),
            'recovery_attempts': context.recovery_attempts,
            'attempted_strategies': [s.value for s in context.attempted_strategies]
        }
        
        return FallbackResult(
            success=False,
            recovery_strategy=RecoveryStrategy.MANUAL_INTERVENTION,
            errors=[
                "Automated recovery failed - manual intervention required",
                f"Root cause: {context.reason.value}",
                f"Severity: {context.severity.value}"
            ],
            user_message="System requires manual intervention to resolve current issues",
            suggested_actions=[
                "Contact system administrator or technical support",
                "Review system logs for detailed error information",
                "Consider temporary manual engine selection",
                "Wait for system issues to be resolved"
            ],
            technical_details=diagnostic_info
        )
    
    def _system_shutdown(
        self, 
        context: FallbackContext, 
        original_operation: Callable
    ) -> FallbackResult:
        """Emergency system shutdown."""
        
        logger.critical(f"Emergency system shutdown initiated: {context.reason.value}")
        
        return FallbackResult(
            success=False,
            recovery_strategy=RecoveryStrategy.SYSTEM_SHUTDOWN,
            errors=[
                "Critical system failure detected",
                "Emergency shutdown initiated",
                f"Failure reason: {context.reason.value}"
            ],
            user_message="Critical system failure detected. System shutdown initiated for safety.",
            technical_details={
                'shutdown_reason': context.reason.value,
                'severity': context.severity.value,
                'system_health': context.system_health.get('overall', 'unknown'),
                'shutdown_timestamp': datetime.now().isoformat()
            }
        )
    
    def _relax_budget_constraints(self, request: Dict[str, Any]) -> None:
        """Relax budget-related constraints."""
        
        if 'budget_constraints' in request:
            budget = request['budget_constraints']
            if 'annual_limit_usd' in budget:
                budget['annual_limit_usd'] *= 1.5  # Increase by 50%
            if 'cost_optimization_priority' in budget:
                # Lower priority to allow more options
                priority_map = {'critical': 'high', 'high': 'medium', 'medium': 'low'}
                budget['cost_optimization_priority'] = priority_map.get(
                    budget['cost_optimization_priority'], 'low'
                )
    
    def _relax_timeline_constraints(self, request: Dict[str, Any]) -> None:
        """Relax timeline-related constraints."""
        
        if 'timeline_constraints' in request:
            timeline = request['timeline_constraints']
            if 'max_implementation_weeks' in timeline:
                timeline['max_implementation_weeks'] = int(timeline['max_implementation_weeks'] * 1.5)
    
    def _relax_feature_requirements(self, request: Dict[str, Any]) -> None:
        """Relax feature requirements."""
        
        if 'technical_preferences' in request:
            tech_prefs = request['technical_preferences']
            if 'required_features' in tech_prefs:
                # Convert some required features to preferred
                required = tech_prefs['required_features']
                if len(required) > 1:
                    tech_prefs['preferred_features'] = tech_prefs.get('preferred_features', [])
                    tech_prefs['preferred_features'].extend(required[1:])  # Move all but first to preferred
                    tech_prefs['required_features'] = required[:1]  # Keep only first as required

class FallbackOrchestrator:
    """Main orchestrator for fallback processing."""
    
    def __init__(self):
        self.decision_engine = FallbackDecisionEngine()
        self.recovery_executor = RecoveryExecutor()
        
    def handle_failure(
        self, 
        error: Exception, 
        context: Dict[str, Any],
        original_operation: Callable
    ) -> FallbackResult:
        """Main entry point for fallback handling."""
        
        logger.info(f"Initiating fallback handling for error: {type(error).__name__}")
        
        # Analyze the failure
        fallback_context = self.decision_engine.analyze_failure(error, context)
        
        # Select recovery strategies
        strategies = self.decision_engine.select_recovery_strategy(fallback_context)
        
        # Attempt recovery with each strategy
        for strategy in strategies:
            fallback_context.attempted_strategies.append(strategy)
            fallback_context.recovery_attempts += 1
            
            try:
                result = self.recovery_executor.execute_recovery(
                    strategy, 
                    fallback_context, 
                    original_operation
                )
                
                if result.success:
                    logger.info(f"Recovery successful using strategy: {strategy.value}")
                    return result
                else:
                    logger.warning(f"Recovery strategy {strategy.value} failed: {result.errors}")
                    
                    # Check if we should try more strategies
                    if (fallback_context.timeout_deadline and 
                        datetime.now() > fallback_context.timeout_deadline):
                        logger.warning("Timeout exceeded during recovery attempts")
                        break
                        
            except Exception as recovery_error:
                logger.error(f"Recovery strategy {strategy.value} raised exception: {recovery_error}")
                
        # All strategies failed
        logger.error("All recovery strategies failed")
        
        return FallbackResult(
            success=False,
            recovery_strategy=None,
            errors=[
                "All recovery strategies exhausted",
                f"Original error: {str(error)}",
                f"Attempted strategies: {[s.value for s in fallback_context.attempted_strategies]}"
            ],
            user_message="System unable to recover automatically. Manual intervention required.",
            suggested_actions=[
                "Contact technical support",
                "Review system status and logs",
                "Consider manual workaround procedures"
            ],
            technical_details={
                'original_error': str(error),
                'fallback_context': {
                    'reason': fallback_context.reason.value,
                    'severity': fallback_context.severity.value,
                    'recovery_attempts': fallback_context.recovery_attempts,
                    'attempted_strategies': [s.value for s in fallback_context.attempted_strategies]
                }
            }
        )

# Convenience functions for easy integration

def create_fallback_orchestrator() -> FallbackOrchestrator:
    """Create and configure a fallback orchestrator."""
    return FallbackOrchestrator()

def handle_engine_selection_failure(
    error: Exception,
    project_path: str,
    user_overrides: Optional[Dict[str, Any]] = None,
    original_operation: Optional[Callable] = None
) -> FallbackResult:
    """
    Handle engine selection failures with intelligent fallback.
    
    Args:
        error: The original error that triggered fallback
        project_path: Path to the project being analyzed
        user_overrides: Optional user override parameters
        original_operation: Optional original operation to retry
        
    Returns:
        FallbackResult with recovery recommendation or error details
    """
    
    orchestrator = create_fallback_orchestrator()
    
    context = {
        'project_path': project_path,
        'original_request': {
            'project_path': project_path,
            'user_overrides': user_overrides
        },
        'user_context': {
            'user_overrides': user_overrides
        },
        'operation_type': 'engine_selection'
    }
    
    # Default operation if none provided
    if original_operation is None:
        def default_operation(**kwargs):
            # Import here to avoid circular imports
            from agents.shared.auto_detection.engine_detection_algorithm import detect_and_recommend_engine
            return detect_and_recommend_engine(
                project_path=kwargs.get('project_path', project_path),
                user_overrides=kwargs.get('user_overrides', user_overrides)
            )
        original_operation = default_operation
    
    return orchestrator.handle_failure(error, context, original_operation)

# Example usage and testing functions

if __name__ == "__main__":
    # Example usage
    import sys
    
    def example_operation():
        """Example operation that might fail."""
        raise ValueError("Example failure for testing")
    
    def test_fallback_strategies():
        """Test various fallback strategies."""
        
        print("Testing Fallback Strategies\n" + "=" * 50)
        
        orchestrator = create_fallback_orchestrator()
        
        # Test different error scenarios
        test_errors = [
            (ValueError("No valid engine option"), "Constraint conflict scenario"),
            (TimeoutError("Operation timeout"), "Timeout scenario"),
            (ImportError("Required module not found"), "Dependency failure scenario"),
            (PermissionError("Access denied"), "Permission scenario"),
            (RuntimeError("System resource exhausted"), "Resource scenario")
        ]
        
        for error, description in test_errors:
            print(f"\n--- Testing: {description} ---")
            
            context = {
                'project_path': './test_project',
                'operation_type': 'engine_selection'
            }
            
            result = orchestrator.handle_failure(error, context, example_operation)
            
            print(f"Success: {result.success}")
            print(f"Strategy: {result.recovery_strategy.value if result.recovery_strategy else 'None'}")
            print(f"User Message: {result.user_message}")
            
            if result.errors:
                print(f"Errors: {result.errors}")
            if result.warnings:
                print(f"Warnings: {result.warnings}")
            if result.suggested_actions:
                print(f"Suggested Actions: {result.suggested_actions}")
    
    if len(sys.argv) > 1 and sys.argv[1] == "test":
        test_fallback_strategies()
    else:
        print("Fallback Strategies Module Loaded")
        print("Use 'python fallback-strategies.py test' to run tests")
        print("\nAvailable functions:")
        print("- create_fallback_orchestrator()")
        print("- handle_engine_selection_failure()")
        print("\nExample:")
        print("from agents.shared.error_handling.fallback_strategies import handle_engine_selection_failure")
        print("result = handle_engine_selection_failure(error, './project')")