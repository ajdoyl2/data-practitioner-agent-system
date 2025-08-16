"""
Data Source Change Sensor
Event-driven sensor for detecting data source changes
"""

from dagster import (
    sensor,
    SensorEvaluationContext,
    DefaultSensorStatus,
    RunRequest,
    SkipReason,
    job
)
import os
import requests
import json
from datetime import datetime, timedelta
from typing import List, Dict, Any
import hashlib

@job(
    name="data_source_change_pipeline",
    description="Pipeline triggered by data source changes",
    tags={"trigger": "data_change", "type": "event_driven"}
)
def data_source_change_pipeline_job():
    """
    Job definition for data source change triggered pipeline
    Responds to changes in upstream data sources
    """
    pass

@sensor(
    job=data_source_change_pipeline_job,
    default_status=DefaultSensorStatus.STOPPED,
    description="Monitors data sources for changes and triggers pipeline execution",
    minimum_interval_seconds=300  # Check every 5 minutes
)
def data_source_change_sensor(context: SensorEvaluationContext):
    """
    Sensor that monitors data sources for changes
    Triggers pipeline execution when changes are detected
    """
    
    try:
        # Get list of monitored data sources from environment or config
        monitored_sources = get_monitored_sources()
        
        if not monitored_sources:
            return SkipReason("No data sources configured for monitoring")
        
        # Check each data source for changes
        changes_detected = []
        
        for source in monitored_sources:
            change_info = check_data_source_change(context, source)
            if change_info:
                changes_detected.append(change_info)
        
        if not changes_detected:
            return SkipReason("No changes detected in monitored data sources")
        
        # Generate run requests for detected changes
        run_requests = []
        
        for change in changes_detected:
            config = {
                "ops": {
                    "data_source_change_pipeline": {
                        "config": {
                            "triggered_by": "data_source_change",
                            "source_type": change["source_type"],
                            "source_id": change["source_id"], 
                            "change_type": change["change_type"],
                            "detection_time": change["detection_time"],
                            "incremental_only": change.get("incremental_only", True)
                        }
                    }
                }
            }
            
            tags = {
                "trigger": "data_source_change",
                "source_type": change["source_type"],
                "source_id": change["source_id"],
                "change_type": change["change_type"],
                "detection_time": change["detection_time"]
            }
            
            run_requests.append(RunRequest(
                run_key=f"data_change_{change['source_id']}_{change['detection_time']}",
                run_config=config,
                tags=tags
            ))
        
        context.log.info(f"Detected {len(changes_detected)} data source changes, triggering {len(run_requests)} pipeline runs")
        
        return run_requests
        
    except Exception as e:
        context.log.error(f"Error in data source change sensor: {str(e)}")
        return SkipReason(f"Sensor error: {str(e)}")

def get_monitored_sources() -> List[Dict[str, Any]]:
    """
    Get list of data sources to monitor for changes
    This could be loaded from configuration file or environment variables
    """
    
    # Default monitored sources configuration
    default_sources = [
        {
            "source_id": "api_data_source_1",
            "source_type": "rest_api",
            "endpoint": "http://localhost:3001/api/v1/ingestion/sources",
            "auth_required": True,
            "check_method": "last_modified"
        },
        {
            "source_id": "file_system_source",
            "source_type": "file_system",
            "path": "/data/incoming",
            "check_method": "file_modification_time"
        }
    ]
    
    # Try to load from environment variable
    sources_config = os.getenv('DAGSTER_MONITORED_SOURCES')
    if sources_config:
        try:
            return json.loads(sources_config)
        except json.JSONDecodeError:
            print("Warning: Invalid JSON in DAGSTER_MONITORED_SOURCES, using defaults")
    
    return default_sources

def check_data_source_change(context: SensorEvaluationContext, source: Dict[str, Any]) -> Dict[str, Any]:
    """
    Check if a specific data source has changed
    Returns change information if change is detected, None otherwise
    """
    
    source_id = source["source_id"]
    source_type = source["source_type"]
    check_method = source.get("check_method", "last_modified")
    
    try:
        current_state = None
        
        if source_type == "rest_api":
            current_state = check_api_source_change(source)
        elif source_type == "file_system":
            current_state = check_file_system_change(source)
        elif source_type == "database":
            current_state = check_database_change(source)
        else:
            context.log.warning(f"Unknown source type: {source_type}")
            return None
        
        if current_state is None:
            return None
        
        # Get last known state from cursor
        cursor_key = f"data_source_state_{source_id}"
        last_state = context.cursor or "{}"
        last_state_dict = json.loads(last_state) if last_state else {}
        last_known_state = last_state_dict.get(source_id)
        
        # Compare states
        if last_known_state != current_state:
            # Update cursor with new state
            last_state_dict[source_id] = current_state
            context.update_cursor(json.dumps(last_state_dict))
            
            # Determine change type
            change_type = "initial" if last_known_state is None else "update"
            
            return {
                "source_id": source_id,
                "source_type": source_type,
                "change_type": change_type,
                "detection_time": datetime.now().isoformat(),
                "current_state": current_state,
                "previous_state": last_known_state,
                "incremental_only": change_type == "update"
            }
        
        return None  # No change detected
        
    except Exception as e:
        context.log.error(f"Error checking data source {source_id}: {str(e)}")
        return None

def check_api_source_change(source: Dict[str, Any]) -> str:
    """
    Check API data source for changes by calling endpoint
    """
    
    endpoint = source["endpoint"]
    auth_required = source.get("auth_required", False)
    
    headers = {}
    if auth_required:
        api_key = os.getenv('DATA_SOURCE_API_KEY')
        if api_key:
            headers['X-API-Key'] = api_key
    
    try:
        response = requests.get(endpoint, headers=headers, timeout=30)
        
        if response.status_code == 200:
            # Use response hash as state indicator
            content_hash = hashlib.md5(response.content).hexdigest()
            return content_hash
        else:
            print(f"API source check failed: HTTP {response.status_code}")
            return None
            
    except requests.RequestException as e:
        print(f"API source check error: {e}")
        return None

def check_file_system_change(source: Dict[str, Any]) -> str:
    """
    Check file system data source for changes
    """
    
    path = source["path"]
    
    try:
        if not os.path.exists(path):
            return None
        
        # Get modification time of directory or file
        stat_info = os.stat(path)
        modification_time = stat_info.st_mtime
        
        return str(modification_time)
        
    except OSError as e:
        print(f"File system source check error: {e}")
        return None

def check_database_change(source: Dict[str, Any]) -> str:
    """
    Check database data source for changes
    This would typically query a metadata table or use database-specific change tracking
    """
    
    # Placeholder implementation
    # In a real scenario, this would:
    # 1. Connect to the database
    # 2. Query a metadata table with last update timestamps
    # 3. Check for new records or modifications
    # 4. Return a state hash or timestamp
    
    return None