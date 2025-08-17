"""
Data Pipeline Jobs
Defines jobs that orchestrate assets across the complete data pipeline
"""

from dagster import (
    job,
    Config,
    OpExecutionContext,
    op,
    asset_selection,
    define_asset_job,
    AssetSelection
)
from typing import Dict, Any, Optional, List

# Import asset dependencies
import sys
from pathlib import Path
dagster_project_path = Path(__file__).parent.parent
sys.path.insert(0, str(dagster_project_path))

from assets.ingestion_assets import ingestion_assets
from assets.analytics_assets import analytics_assets
from assets.transformation_assets import transformation_assets
from assets.publication_assets import publication_assets

class PipelineConfig(Config):
    """Configuration for pipeline execution"""
    full_refresh: bool = False
    max_runtime_minutes: int = 60
    environment: str = "dev"
    data_sources: List[str] = []
    skip_validation: bool = False

# Complete data pipeline job - runs all assets in dependency order
complete_data_pipeline_job = define_asset_job(
    name="complete_data_pipeline",
    description="Execute the complete data pipeline from ingestion to publication",
    selection=AssetSelection.all(),
    tags={
        "pipeline": "complete",
        "criticality": "high"
    }
)

# Ingestion-only pipeline job
ingestion_pipeline_job = define_asset_job(
    name="ingestion_pipeline", 
    description="Execute data ingestion pipeline only",
    selection=AssetSelection.groups("infrastructure", "ingestion", "validation"),
    tags={
        "pipeline": "ingestion",
        "criticality": "high"
    }
)

# Analytics-only pipeline job
analytics_pipeline_job = define_asset_job(
    name="analytics_pipeline",
    description="Execute analytics processing pipeline",
    selection=AssetSelection.groups("analytics", "monitoring"),
    tags={
        "pipeline": "analytics", 
        "criticality": "medium"
    }
)

# Monitoring and health check job
monitoring_pipeline_job = define_asset_job(
    name="monitoring_pipeline",
    description="Execute monitoring and health checks",
    selection=AssetSelection.groups("infrastructure", "monitoring"),
    tags={
        "pipeline": "monitoring",
        "criticality": "low"
    }
)

# Data quality validation job
data_quality_job = define_asset_job(
    name="data_quality_pipeline",
    description="Execute data quality validation and profiling",
    selection=AssetSelection.groups("validation", "analytics").downstream(),
    tags={
        "pipeline": "quality",
        "criticality": "medium"
    }
)

# Manual trigger job with flexible asset selection
@job(
    name="manual_pipeline_execution",
    description="Manually triggered pipeline with configurable asset selection",
    tags={"trigger": "manual", "flexibility": "high"}
)
def manual_pipeline_execution():
    """
    Job for manual pipeline execution with flexible configuration
    Can be triggered via API with specific asset selection
    """
    
    @op(
        name="prepare_execution",
        description="Prepare pipeline execution based on configuration"
    )
    def prepare_execution_op(context: OpExecutionContext) -> Dict[str, Any]:
        """Prepare the execution plan based on provided configuration"""
        
        config = context.run_config.get("ops", {}).get("prepare_execution", {}).get("config", {})
        
        execution_plan = {
            "full_refresh": config.get("full_refresh", False),
            "max_runtime_minutes": config.get("max_runtime_minutes", 60),
            "environment": config.get("environment", "dev"),
            "data_sources": config.get("data_sources", []),
            "skip_validation": config.get("skip_validation", False),
            "asset_groups": config.get("asset_groups", ["infrastructure", "ingestion"]),
            "execution_timestamp": context.log_manager.run_id
        }
        
        context.log.info(f"Prepared execution plan: {execution_plan}")
        
        return execution_plan
    
    @op(
        name="execute_assets",
        description="Execute selected assets based on execution plan"
    )
    def execute_assets_op(context: OpExecutionContext, execution_plan: Dict[str, Any]) -> Dict[str, Any]:
        """Execute the selected assets according to the execution plan"""
        
        asset_groups = execution_plan.get("asset_groups", [])
        full_refresh = execution_plan.get("full_refresh", False)
        
        # Log execution details
        context.log.info(f"Executing asset groups: {asset_groups}")
        context.log.info(f"Full refresh mode: {full_refresh}")
        
        # In a real implementation, this would trigger asset materialization
        # For now, we return execution summary
        execution_summary = {
            "status": "completed",
            "asset_groups_executed": asset_groups,
            "full_refresh": full_refresh,
            "execution_time": "placeholder",
            "assets_materialized": len(asset_groups) * 3  # Placeholder calculation
        }
        
        context.log.info(f"Execution completed: {execution_summary}")
        
        return execution_summary
    
    # Job dependency chain
    execution_plan = prepare_execution_op()
    execution_summary = execute_assets_op(execution_plan)

# Incremental update job for real-time processing
incremental_pipeline_job = define_asset_job(
    name="incremental_pipeline",
    description="Execute incremental updates for real-time analytics",
    selection=AssetSelection.groups("ingestion", "analytics") - AssetSelection.keys("profile_data_table"),
    tags={
        "pipeline": "incremental",
        "frequency": "hourly",
        "criticality": "medium"
    }
)

# Emergency recovery job
emergency_recovery_job = define_asset_job(
    name="emergency_recovery_pipeline", 
    description="Emergency recovery pipeline for critical system restoration",
    selection=AssetSelection.groups("infrastructure"),
    tags={
        "pipeline": "recovery",
        "criticality": "critical"
    }
)

# Export job definitions for Dagster workspace
pipeline_jobs = [
    complete_data_pipeline_job,
    ingestion_pipeline_job,
    analytics_pipeline_job,
    monitoring_pipeline_job,
    data_quality_job,
    manual_pipeline_execution,
    incremental_pipeline_job,
    emergency_recovery_job
]