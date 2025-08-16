"""
Hourly Incremental Update Schedule
Schedules incremental data updates for real-time analytics
"""

from dagster import (
    schedule,
    ScheduleEvaluationContext,
    DefaultScheduleStatus,
    RunRequest,
    SkipReason,
    job
)
from datetime import datetime, time
import os

@job(
    name="hourly_incremental_pipeline",
    description="Hourly incremental updates for real-time analytics",
    tags={"schedule": "hourly", "type": "incremental"}
)
def hourly_incremental_pipeline_job():
    """
    Job definition for hourly incremental pipeline execution
    Focuses on incremental updates and real-time data processing
    """
    pass

@schedule(
    job=hourly_incremental_pipeline_job,
    cron_schedule="0 * * * *",  # Every hour at minute 0
    default_status=DefaultScheduleStatus.STOPPED,
    description="Hourly incremental data updates",
    execution_timezone="UTC"
)
def hourly_incremental_schedule(context: ScheduleEvaluationContext):
    """
    Schedule for hourly incremental updates
    Runs incremental data processing every hour
    """
    
    current_time = context.scheduled_execution_time
    hour = current_time.hour
    
    # Skip during maintenance window (3-4 AM UTC)
    maintenance_start = int(os.getenv('MAINTENANCE_HOUR_START', '3'))
    maintenance_end = int(os.getenv('MAINTENANCE_HOUR_END', '4'))
    
    if maintenance_start <= hour < maintenance_end:
        return SkipReason(f"Skipping during maintenance window ({maintenance_start}-{maintenance_end} UTC)")
    
    # Reduce frequency during off-peak hours (midnight to 6 AM UTC)
    off_peak_start = 0
    off_peak_end = 6
    
    if off_peak_start <= hour < off_peak_end and hour % 2 != 0:
        return SkipReason("Skipping odd hours during off-peak period")
    
    config = {
        "ops": {
            "hourly_incremental_pipeline": {
                "config": {
                    "incremental_only": True,
                    "max_runtime_minutes": 15,
                    "execution_hour": hour,
                    "lookback_hours": 2,  # Process data from last 2 hours
                    "schedule_name": "hourly_incremental"
                }
            }
        }
    }
    
    tags = {
        "schedule": "hourly_incremental",
        "execution_datetime": current_time.isoformat(),
        "hour": str(hour),
        "incremental_only": "true"
    }
    
    return RunRequest(
        run_key=f"hourly_incremental_{current_time.strftime('%Y%m%d_%H')}",
        run_config=config,
        tags=tags
    )