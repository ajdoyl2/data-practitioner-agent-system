"""
Manual Trigger Integration
Provides manual pipeline trigger mechanisms through BMad agent interfaces
"""

from dagster import (
    job,
    op,
    Config,
    OpExecutionContext,
    In,
    Out,
    DependsOn
)
import json
import time
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List

class ManualTriggerConfig(Config):
    """Configuration for manual triggers"""
    trigger_type: str = "full_pipeline"  # full_pipeline, incremental, analytics_only, custom
    asset_selection: List[str] = []
    priority: str = "normal"  # low, normal, high, critical
    max_runtime_minutes: int = 60
    notification_channels: List[str] = []
    requester: str = "unknown"
    reason: str = "manual_execution"

@job(
    name="bmad_agent_trigger",
    description="Pipeline execution triggered by BMad agent interfaces",
    tags={"trigger": "bmad_agent", "manual": "true", "integration": "api"}
)
def bmad_agent_trigger_job():
    """
    Job specifically designed for BMad agent integration
    Supports manual triggers from CLI, web interface, or agent workflows
    """
    
    @op(
        name="validate_trigger_request",
        description="Validate and process manual trigger request",
        out=Out(Dict[str, Any], description="Validated trigger configuration")
    )
    def validate_trigger_request_op(context: OpExecutionContext) -> Dict[str, Any]:
        """Validate the manual trigger request and prepare execution config"""
        
        # Get configuration from run config
        trigger_config = context.run_config.get("ops", {}).get("validate_trigger_request", {}).get("config", {})
        
        # Extract trigger details
        trigger_type = trigger_config.get("trigger_type", "full_pipeline")
        requester = trigger_config.get("requester", "unknown")
        reason = trigger_config.get("reason", "manual_execution")
        priority = trigger_config.get("priority", "normal")
        
        # Validate trigger type
        valid_trigger_types = ["full_pipeline", "incremental", "analytics_only", "ingestion_only", "monitoring_only", "custom"]
        if trigger_type not in valid_trigger_types:
            raise ValueError(f"Invalid trigger type: {trigger_type}. Must be one of: {valid_trigger_types}")
        
        # Validate priority
        valid_priorities = ["low", "normal", "high", "critical"]
        if priority not in valid_priorities:
            raise ValueError(f"Invalid priority: {priority}. Must be one of: {valid_priorities}")
        
        # Create validated configuration
        validated_config = {
            "trigger_type": trigger_type,
            "requester": requester,
            "reason": reason,
            "priority": priority,
            "max_runtime_minutes": trigger_config.get("max_runtime_minutes", 60),
            "asset_selection": trigger_config.get("asset_selection", []),
            "notification_channels": trigger_config.get("notification_channels", []),
            "execution_id": context.run_id,
            "trigger_time": datetime.now().isoformat(),
            "estimated_duration": estimate_execution_duration(trigger_type),
            "resource_requirements": get_resource_requirements(trigger_type)
        }
        
        context.log.info(f"Manual trigger validated - Type: {trigger_type}, Requester: {requester}, Priority: {priority}")
        context.log.info(f"Estimated duration: {validated_config['estimated_duration']} minutes")
        
        return validated_config
    
    @op(
        name="check_system_readiness",
        description="Check if system is ready for pipeline execution",
        ins={"trigger_config": In(Dict[str, Any])},
        out=Out(Dict[str, Any], description="System readiness status")
    )
    def check_system_readiness_op(context: OpExecutionContext, trigger_config: Dict[str, Any]) -> Dict[str, Any]:
        """Check system readiness before executing pipeline"""
        
        readiness_checks = {
            "services_healthy": check_services_health(context),
            "resource_availability": check_resource_availability(context, trigger_config),
            "no_conflicting_runs": check_conflicting_runs(context, trigger_config),
            "data_sources_accessible": check_data_sources(context, trigger_config)
        }
        
        all_ready = all(readiness_checks.values())
        
        readiness_status = {
            "ready": all_ready,
            "checks": readiness_checks,
            "check_time": datetime.now().isoformat(),
            "trigger_approved": all_ready
        }
        
        if not all_ready:
            failed_checks = [check for check, status in readiness_checks.items() if not status]
            context.log.warning(f"System not ready for execution. Failed checks: {failed_checks}")
            readiness_status["failed_checks"] = failed_checks
        else:
            context.log.info("System is ready for pipeline execution")
        
        return readiness_status
    
    @op(
        name="execute_pipeline_trigger",
        description="Execute the requested pipeline based on validated configuration",
        ins={
            "trigger_config": In(Dict[str, Any]),
            "readiness_status": In(Dict[str, Any])
        },
        out=Out(Dict[str, Any], description="Execution result")
    )
    def execute_pipeline_trigger_op(
        context: OpExecutionContext, 
        trigger_config: Dict[str, Any], 
        readiness_status: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Execute the pipeline based on the trigger configuration"""
        
        if not readiness_status.get("ready", False):
            raise Exception(f"System not ready for execution. Failed checks: {readiness_status.get('failed_checks', [])}")
        
        trigger_type = trigger_config["trigger_type"]
        execution_id = trigger_config["execution_id"]
        
        context.log.info(f"Starting pipeline execution - Type: {trigger_type}, ID: {execution_id}")
        
        # Map trigger types to asset selections
        asset_mapping = {
            "full_pipeline": ["infrastructure", "ingestion", "analytics", "transformation", "publication", "monitoring"],
            "incremental": ["ingestion", "analytics"],
            "analytics_only": ["analytics", "monitoring"],
            "ingestion_only": ["infrastructure", "ingestion", "validation"],
            "monitoring_only": ["infrastructure", "monitoring"],
            "custom": trigger_config.get("asset_selection", [])
        }
        
        assets_to_execute = asset_mapping.get(trigger_type, [])
        
        # Execute pipeline (placeholder - actual execution would trigger Dagster assets)
        execution_start = time.time()
        
        execution_result = {
            "status": "completed",
            "trigger_type": trigger_type,
            "execution_id": execution_id,
            "assets_executed": assets_to_execute,
            "start_time": trigger_config["trigger_time"],
            "end_time": datetime.now().isoformat(),
            "duration_seconds": time.time() - execution_start,
            "requester": trigger_config["requester"],
            "reason": trigger_config["reason"],
            "priority": trigger_config["priority"],
            "success": True
        }
        
        context.log.info(f"Pipeline execution completed successfully in {execution_result['duration_seconds']:.2f} seconds")
        
        # Send notifications if configured
        if trigger_config.get("notification_channels"):
            send_completion_notifications(context, execution_result, trigger_config["notification_channels"])
        
        return execution_result
    
    # Job execution flow
    trigger_config = validate_trigger_request_op()
    readiness_status = check_system_readiness_op(trigger_config)
    execution_result = execute_pipeline_trigger_op(trigger_config, readiness_status)

def estimate_execution_duration(trigger_type: str) -> int:
    """Estimate execution duration in minutes based on trigger type"""
    
    duration_estimates = {
        "full_pipeline": 45,
        "incremental": 10,
        "analytics_only": 15,
        "ingestion_only": 20,
        "monitoring_only": 5,
        "custom": 30
    }
    
    return duration_estimates.get(trigger_type, 30)

def get_resource_requirements(trigger_type: str) -> Dict[str, Any]:
    """Get resource requirements for different trigger types"""
    
    resource_requirements = {
        "full_pipeline": {"memory_gb": 4, "cpu_cores": 2, "disk_gb": 10},
        "incremental": {"memory_gb": 2, "cpu_cores": 1, "disk_gb": 2},
        "analytics_only": {"memory_gb": 3, "cpu_cores": 2, "disk_gb": 5},
        "ingestion_only": {"memory_gb": 2, "cpu_cores": 1, "disk_gb": 5},
        "monitoring_only": {"memory_gb": 1, "cpu_cores": 1, "disk_gb": 1},
        "custom": {"memory_gb": 2, "cpu_cores": 1, "disk_gb": 3}
    }
    
    return resource_requirements.get(trigger_type, {"memory_gb": 2, "cpu_cores": 1, "disk_gb": 3})

def check_services_health(context: OpExecutionContext) -> bool:
    """Check if required services are healthy"""
    
    # Placeholder - would check actual service health endpoints
    context.log.info("Checking service health...")
    return True

def check_resource_availability(context: OpExecutionContext, trigger_config: Dict[str, Any]) -> bool:
    """Check if sufficient resources are available"""
    
    # Placeholder - would check actual resource usage
    context.log.info("Checking resource availability...")
    return True

def check_conflicting_runs(context: OpExecutionContext, trigger_config: Dict[str, Any]) -> bool:
    """Check for conflicting pipeline runs"""
    
    # Placeholder - would check Dagster for running jobs
    context.log.info("Checking for conflicting runs...")
    return True

def check_data_sources(context: OpExecutionContext, trigger_config: Dict[str, Any]) -> bool:
    """Check if data sources are accessible"""
    
    # Placeholder - would check data source connectivity
    context.log.info("Checking data source accessibility...")
    return True

def send_completion_notifications(context: OpExecutionContext, result: Dict[str, Any], channels: List[str]):
    """Send completion notifications to specified channels"""
    
    context.log.info(f"Sending completion notifications to channels: {channels}")
    # Placeholder - would send actual notifications