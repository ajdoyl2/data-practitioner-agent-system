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

# Story 1.7 Task 8: Publication refresh schedules

@job(
    name="daily_publication_refresh",
    description="Daily publication refresh following data pipeline updates",
    tags={"schedule": "daily", "story": "1.7", "pipeline": "publication"}
)
def daily_publication_refresh_job():
    """
    Job definition for daily publication refresh
    Refreshes Evidence.dev publications after data pipeline completes
    """
    pass

@schedule(
    job=daily_publication_refresh_job,
    cron_schedule="0 4 * * *",  # 4 AM daily, 2 hours after data refresh
    default_status=DefaultScheduleStatus.STOPPED,
    description="Daily publication refresh at 4 AM, after data pipeline completion",
    execution_timezone="UTC"
)
def daily_publication_refresh_schedule(context: ScheduleEvaluationContext):
    """
    Schedule for daily publication refresh
    Runs 2 hours after data pipeline to ensure fresh analysis results are available
    """
    
    current_time = context.scheduled_execution_time
    day_of_week = current_time.weekday()
    
    # Skip on Sundays if data refresh was skipped
    skip_sundays = os.getenv('SKIP_SUNDAY_REFRESH', 'false').lower() == 'true'
    if skip_sundays and day_of_week == 6:
        return SkipReason("Skipping Sunday publication refresh - no new data")
    
    # Check if this is after a full refresh
    day_of_month = current_time.day
    is_after_full_refresh = day_of_month == 1
    
    config = {
        "ops": {
            "daily_publication_refresh": {
                "config": {
                    "full_regeneration": is_after_full_refresh,
                    "template_refresh": True,
                    "deploy_to_staging": True,
                    "deploy_to_production": False,  # Only on manual approval
                    "execution_date": current_time.isoformat(),
                    "schedule_name": "daily_publication_refresh"
                }
            }
        }
    }
    
    tags = {
        "schedule": "daily_publication_refresh",
        "story": "1.7",
        "execution_date": current_time.strftime("%Y-%m-%d"),
        "full_regeneration": str(is_after_full_refresh),
        "trigger": "scheduled"
    }
    
    return RunRequest(
        run_key=f"publication_refresh_{current_time.strftime('%Y%m%d')}",
        run_config=config,
        tags=tags
    )

# Weekly publication deployment schedule for production
@job(
    name="weekly_publication_deployment",
    description="Weekly publication deployment to production",
    tags={"schedule": "weekly", "story": "1.7", "environment": "production"}
)
def weekly_publication_deployment_job():
    """
    Job for weekly production deployment of publications
    Deploys staging publications to production after review
    """
    pass

@schedule(
    job=weekly_publication_deployment_job,
    cron_schedule="0 6 * * 1",  # 6 AM every Monday
    default_status=DefaultScheduleStatus.STOPPED,
    description="Weekly publication deployment to production every Monday at 6 AM",
    execution_timezone="UTC"
)  
def weekly_publication_deployment_schedule(context: ScheduleEvaluationContext):
    """
    Schedule for weekly production deployment
    Deploys reviewed publications from staging to production
    """
    
    current_time = context.scheduled_execution_time
    
    config = {
        "ops": {
            "weekly_publication_deployment": {
                "config": {
                    "deploy_to_production": True,
                    "source_environment": "staging", 
                    "backup_current": True,
                    "rollback_on_failure": True,
                    "execution_date": current_time.isoformat(),
                    "schedule_name": "weekly_publication_deployment"
                }
            }
        }
    }
    
    tags = {
        "schedule": "weekly_publication_deployment",
        "story": "1.7",
        "execution_date": current_time.strftime("%Y-%m-%d"),
        "environment": "production",
        "trigger": "scheduled"
    }
    
    return RunRequest(
        run_key=f"production_deploy_{current_time.strftime('%Y%m%d')}",
        run_config=config,
        tags=tags
    )