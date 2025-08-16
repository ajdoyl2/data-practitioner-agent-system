"""
Daily Data Refresh Schedule
Schedules regular data pipeline execution for daily reporting
"""

from dagster import (
    schedule,
    ScheduleEvaluationContext,
    DefaultScheduleStatus,
    RunRequest,
    SkipReason,
    job,
    Config
)
from datetime import datetime
import os

class DailyRefreshConfig(Config):
    """Configuration for daily data refresh"""
    full_refresh: bool = False
    max_runtime_minutes: int = 60
    notification_email: str = None

@job(
    name="daily_data_pipeline",
    description="Daily execution of complete data pipeline",
    tags={"schedule": "daily", "environment": "production"}
)
def daily_data_pipeline_job():
    """
    Job definition for daily data pipeline execution
    This job will orchestrate the complete data pipeline from ingestion to analytics
    """
    # Job implementation will reference assets from asset files
    pass

@schedule(
    job=daily_data_pipeline_job,
    cron_schedule="0 2 * * *",  # 2 AM daily
    default_status=DefaultScheduleStatus.STOPPED,
    description="Daily data refresh at 2 AM",
    execution_timezone="UTC"
)
def daily_data_refresh_schedule(context: ScheduleEvaluationContext):
    """
    Schedule for daily data refresh
    Runs the complete data pipeline daily at 2 AM UTC
    """
    
    # Check if we should skip execution (e.g., weekends for some data sources)
    current_time = context.scheduled_execution_time
    day_of_week = current_time.weekday()  # 0 = Monday, 6 = Sunday
    
    # Skip on Sundays for certain data sources that don't update
    skip_sundays = os.getenv('SKIP_SUNDAY_REFRESH', 'false').lower() == 'true'
    if skip_sundays and day_of_week == 6:
        return SkipReason("Skipping Sunday refresh - data sources not updated")
    
    # Determine if this should be a full refresh
    day_of_month = current_time.day
    is_first_of_month = day_of_month == 1
    
    config = {
        "ops": {
            "daily_data_pipeline": {
                "config": {
                    "full_refresh": is_first_of_month,
                    "max_runtime_minutes": 120 if is_first_of_month else 60,
                    "execution_date": current_time.isoformat(),
                    "schedule_name": "daily_data_refresh"
                }
            }
        }
    }
    
    tags = {
        "schedule": "daily_data_refresh",
        "execution_date": current_time.strftime("%Y-%m-%d"),
        "full_refresh": str(is_first_of_month),
        "day_of_week": current_time.strftime("%A")
    }
    
    return RunRequest(
        run_key=f"daily_refresh_{current_time.strftime('%Y%m%d')}",
        run_config=config,
        tags=tags
    )