"""
Automated Analysis Job for Dagster
Orchestrates EDA, hypothesis generation, statistical testing, and pattern detection
"""

from dagster import (
    job, op, OpExecutionContext, Config, RunRequest, ScheduleDefinition,
    sensor, DefaultSensorStatus, SensorEvaluationContext, SensorResult,
    define_asset_job, AssetSelection, Definitions
)

from ..assets.automated_analysis_assets import (
    eda_analysis, hypothesis_generation, statistical_testing, 
    pattern_detection, comprehensive_analysis_report, AnalysisConfig
)


# Define asset job for automated analysis
automated_analysis_job = define_asset_job(
    name="automated_analysis_pipeline",
    description="Complete automated analysis pipeline: EDA → Hypothesis Generation → Statistical Testing → Pattern Detection → Comprehensive Report",
    selection=AssetSelection.assets(
        eda_analysis,
        hypothesis_generation, 
        statistical_testing,
        pattern_detection,
        comprehensive_analysis_report
    ),
    config={
        "ops": {
            "eda_analysis": {
                "config": {
                    "eda_depth": "comprehensive",
                    "cache_enabled": True
                }
            },
            "hypothesis_generation": {
                "config": {
                    "max_hypotheses": 15,
                    "statistical_alpha": 0.05
                }
            },
            "statistical_testing": {
                "config": {
                    "statistical_alpha": 0.05
                }
            },
            "pattern_detection": {
                "config": {
                    "pattern_analysis_type": "comprehensive",
                    "cache_enabled": True
                }
            }
        }
    }
)

# Define EDA-only job for quick analysis
eda_only_job = define_asset_job(
    name="eda_analysis_only",
    description="Quick EDA analysis for initial data understanding",
    selection=AssetSelection.assets(eda_analysis),
    config={
        "ops": {
            "eda_analysis": {
                "config": {
                    "eda_depth": "standard",
                    "cache_enabled": True
                }
            }
        }
    }
)

# Define hypothesis testing job for focused statistical analysis
hypothesis_testing_job = define_asset_job(
    name="hypothesis_testing_pipeline",
    description="Focused pipeline for hypothesis generation and testing",
    selection=AssetSelection.assets(
        eda_analysis,
        hypothesis_generation,
        statistical_testing
    ),
    config={
        "ops": {
            "eda_analysis": {
                "config": {
                    "eda_depth": "standard"
                }
            },
            "hypothesis_generation": {
                "config": {
                    "max_hypotheses": 10,
                    "statistical_alpha": 0.01  # More stringent for focused testing
                }
            },
            "statistical_testing": {
                "config": {
                    "statistical_alpha": 0.01
                }
            }
        }
    }
)

# Define pattern detection job for anomaly monitoring
pattern_detection_job = define_asset_job(
    name="pattern_detection_monitoring",
    description="Pattern detection and anomaly monitoring pipeline",
    selection=AssetSelection.assets(pattern_detection),
    config={
        "ops": {
            "pattern_detection": {
                "config": {
                    "pattern_analysis_type": "comprehensive",
                    "cache_enabled": True
                }
            }
        }
    }
)


# Schedule for daily comprehensive analysis
daily_analysis_schedule = ScheduleDefinition(
    job=automated_analysis_job,
    cron_schedule="0 2 * * *",  # 2 AM daily
    name="daily_automated_analysis",
    description="Daily comprehensive automated analysis of ingested data"
)

# Schedule for hourly pattern detection (for anomaly monitoring)
hourly_pattern_detection_schedule = ScheduleDefinition(
    job=pattern_detection_job,
    cron_schedule="0 * * * *",  # Every hour
    name="hourly_pattern_detection", 
    description="Hourly pattern detection for real-time anomaly monitoring"
)

# Schedule for weekly comprehensive analysis with detailed reporting
weekly_comprehensive_schedule = ScheduleDefinition(
    job=automated_analysis_job,
    cron_schedule="0 1 * * 0",  # 1 AM every Sunday
    name="weekly_comprehensive_analysis",
    description="Weekly comprehensive analysis with detailed reporting",
    execution_timezone="UTC"
)


# Sensor for triggering analysis when new data arrives
@sensor(
    job=automated_analysis_job,
    name="new_data_analysis_trigger",
    description="Trigger automated analysis when new data is detected",
    default_status=DefaultSensorStatus.RUNNING
)
def new_data_sensor(context: SensorEvaluationContext):
    """
    Sensor that triggers automated analysis when new data is detected
    """
    # In a real implementation, this would check for new files, database changes, etc.
    # For now, this is a placeholder that would be customized based on data sources
    
    # Example: Check for new files in data directory
    import os
    from pathlib import Path
    
    data_dir = Path("/tmp/data_ingestion")  # Placeholder path
    
    if not data_dir.exists():
        return
    
    # Check for recent files (within last hour)
    import time
    current_time = time.time()
    recent_files = []
    
    for file_path in data_dir.iterdir():
        if file_path.is_file():
            file_age = current_time - file_path.stat().st_mtime
            if file_age < 3600:  # Files newer than 1 hour
                recent_files.append(file_path)
    
    if recent_files:
        context.log.info(f"Detected {len(recent_files)} new data files, triggering analysis")
        return SensorResult(
            run_requests=[
                RunRequest(
                    run_key=f"new_data_{int(current_time)}",
                    tags={
                        "source": "sensor",
                        "trigger": "new_data_detected",
                        "files_detected": len(recent_files)
                    }
                )
            ]
        )


# Sensor for triggering pattern detection on data quality issues
@sensor(
    job=pattern_detection_job,
    name="data_quality_anomaly_trigger",
    description="Trigger pattern detection when data quality issues are detected"
)
def data_quality_sensor(context: SensorEvaluationContext):
    """
    Sensor that triggers pattern detection when data quality issues are detected
    """
    # This would integrate with data quality monitoring systems
    # For now, placeholder logic
    
    # Example: Check data quality metrics from ingestion
    try:
        # In real implementation, this would check actual DQ metrics
        # from ingestion assets or external monitoring systems
        
        # Placeholder logic - trigger if certain conditions are met
        import random
        if random.random() < 0.1:  # 10% chance for testing
            context.log.info("Data quality anomaly detected, triggering pattern detection")
            return SensorResult(
                run_requests=[
                    RunRequest(
                        run_key=f"dq_anomaly_{int(time.time())}",
                        tags={
                            "source": "data_quality_sensor",
                            "trigger": "anomaly_detected"
                        }
                    )
                ]
            )
    except Exception as e:
        context.log.error(f"Data quality sensor error: {e}")
        return


# Manual trigger operations for ad-hoc analysis
@op(
    name="trigger_comprehensive_analysis",
    description="Manually trigger comprehensive analysis with custom parameters"
)
def trigger_comprehensive_analysis_op(context: OpExecutionContext):
    """Manual trigger for comprehensive analysis"""
    context.log.info("Triggering comprehensive automated analysis")
    return "comprehensive_analysis_triggered"


@op(
    name="trigger_hypothesis_focused_analysis", 
    description="Manually trigger hypothesis-focused analysis"
)
def trigger_hypothesis_analysis_op(context: OpExecutionContext):
    """Manual trigger for hypothesis-focused analysis"""
    context.log.info("Triggering hypothesis-focused analysis")
    return "hypothesis_analysis_triggered"


# Manual trigger jobs
@job(
    name="manual_comprehensive_analysis",
    description="Manual trigger for comprehensive analysis"
)
def manual_comprehensive_analysis():
    trigger_comprehensive_analysis_op()


@job(
    name="manual_hypothesis_analysis", 
    description="Manual trigger for hypothesis analysis"
)
def manual_hypothesis_analysis():
    trigger_hypothesis_analysis_op()


# Export definitions for Dagster
automated_analysis_definitions = Definitions(
    assets=[
        eda_analysis,
        hypothesis_generation,
        statistical_testing, 
        pattern_detection,
        comprehensive_analysis_report
    ],
    jobs=[
        automated_analysis_job,
        eda_only_job,
        hypothesis_testing_job,
        pattern_detection_job,
        manual_comprehensive_analysis,
        manual_hypothesis_analysis
    ],
    schedules=[
        daily_analysis_schedule,
        hourly_pattern_detection_schedule,
        weekly_comprehensive_schedule
    ],
    sensors=[
        new_data_sensor,
        data_quality_sensor
    ]
)