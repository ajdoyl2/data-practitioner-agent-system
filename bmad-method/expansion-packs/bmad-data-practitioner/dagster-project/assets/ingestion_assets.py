"""
Dagster Assets for Data Ingestion Pipeline
Integrates with PyAirbyte data ingestion service from Story 1.2
"""

from dagster import (
    asset,
    AssetExecutionContext,
    Config,
    AssetIn,
    MetadataValue,
    MaterializeResult
)
import os
import sys
import json
import requests
from typing import Dict, List, Any, Optional
from pathlib import Path
import subprocess
import time

# Add the BMad tools directory to Python path for imports
bmad_tools_path = Path(__file__).parent.parent.parent.parent.parent / "tools"
sys.path.insert(0, str(bmad_tools_path))

from data_services.data_ingestion_service import DataIngestionService
from data_services.security_service import SecurityService

class IngestionConfig(Config):
    """Configuration for data ingestion assets"""
    api_key: Optional[str] = None
    service_port: int = 3001
    timeout: int = 300
    retry_attempts: int = 3
    
class DataSourceConfig(Config):
    """Configuration for specific data source"""
    source_type: str
    connection_config: Dict[str, Any]
    destination_table: str
    sync_mode: str = "full_refresh"
    schedule_interval: Optional[str] = None

@asset(
    description="Health check for the data ingestion service",
    group_name="infrastructure",
    compute_kind="health_check"
)
def ingestion_service_health(context: AssetExecutionContext, config: IngestionConfig) -> Dict[str, Any]:
    """Check if the data ingestion service is running and healthy"""
    
    try:
        # Check service health endpoint
        response = requests.get(
            f"http://localhost:{config.service_port}/health",
            timeout=config.timeout,
            headers={"X-API-Key": config.api_key} if config.api_key else {}
        )
        
        if response.status_code == 200:
            health_data = response.json()
            
            context.log.info(f"Data ingestion service is healthy: {health_data}")
            
            return MaterializeResult(
                metadata={
                    "status": MetadataValue.text(health_data.get("status", "unknown")),
                    "service": MetadataValue.text("data-ingestion-service"),
                    "timestamp": MetadataValue.text(health_data.get("timestamp", "")),
                    "features": MetadataValue.json(health_data.get("features", {})),
                    "pyairbyte_available": MetadataValue.bool(
                        health_data.get("pyairbyte", {}).get("available", False)
                    )
                },
                asset_key="ingestion_service_health"
            )
        else:
            raise Exception(f"Service health check failed with status {response.status_code}")
            
    except Exception as e:
        context.log.error(f"Failed to check ingestion service health: {e}")
        raise e

@asset(
    description="List of available data sources for ingestion",
    deps=[ingestion_service_health],
    group_name="ingestion",
    compute_kind="catalog"
)
def available_data_sources(context: AssetExecutionContext, config: IngestionConfig) -> Dict[str, Any]:
    """Get list of available data sources that can be ingested"""
    
    try:
        # Get available sources from the ingestion service
        response = requests.get(
            f"http://localhost:{config.service_port}/api/v1/ingestion/sources",
            timeout=config.timeout,
            headers={"X-API-Key": config.api_key} if config.api_key else {}
        )
        
        if response.status_code == 200:
            sources_data = response.json()
            sources = sources_data.get("data", {}).get("sources", [])
            
            context.log.info(f"Found {len(sources)} available data sources")
            
            return MaterializeResult(
                metadata={
                    "total_sources": MetadataValue.int(len(sources)),
                    "source_types": MetadataValue.json([s.get("type") for s in sources]),
                    "timestamp": MetadataValue.text(sources_data.get("timestamp", "")),
                },
                asset_key="available_data_sources"
            )
        else:
            raise Exception(f"Failed to fetch data sources: {response.status_code}")
            
    except Exception as e:
        context.log.error(f"Failed to get available data sources: {e}")
        raise e

@asset(
    description="Execute data ingestion from configured source",
    deps=[available_data_sources],
    group_name="ingestion",
    compute_kind="ingestion"
)
def ingest_data_source(
    context: AssetExecutionContext, 
    config: DataSourceConfig
) -> Dict[str, Any]:
    """Ingest data from a specific source using PyAirbyte"""
    
    try:
        start_time = time.time()
        
        # Prepare ingestion request
        ingestion_request = {
            "source_type": config.source_type,
            "connection_config": config.connection_config,
            "destination": {
                "type": "duckdb",
                "table_name": config.destination_table
            },
            "sync_mode": config.sync_mode,
            "options": {
                "timeout": 300,
                "validate_data": True
            }
        }
        
        context.log.info(f"Starting ingestion from {config.source_type} to {config.destination_table}")
        
        # Execute ingestion via API
        response = requests.post(
            f"http://localhost:3001/api/v1/ingestion/sync",
            json=ingestion_request,
            timeout=300,
            headers={"X-API-Key": config.api_key} if hasattr(config, 'api_key') and config.api_key else {}
        )
        
        if response.status_code == 200:
            result = response.json()
            execution_time = time.time() - start_time
            
            context.log.info(f"Data ingestion completed successfully in {execution_time:.2f}s")
            context.log.info(f"Ingested {result.get('data', {}).get('records_processed', 0)} records")
            
            return MaterializeResult(
                metadata={
                    "source_type": MetadataValue.text(config.source_type),
                    "destination_table": MetadataValue.text(config.destination_table),
                    "records_processed": MetadataValue.int(
                        result.get("data", {}).get("records_processed", 0)
                    ),
                    "execution_time": MetadataValue.float(execution_time),
                    "sync_mode": MetadataValue.text(config.sync_mode),
                    "success": MetadataValue.bool(result.get("success", False)),
                    "timestamp": MetadataValue.text(result.get("timestamp", ""))
                },
                asset_key=f"ingested_{config.destination_table}"
            )
        else:
            raise Exception(f"Ingestion failed with status {response.status_code}: {response.text}")
            
    except Exception as e:
        context.log.error(f"Data ingestion failed: {e}")
        raise e

@asset(
    description="Validation of ingested data quality",
    deps=[ingest_data_source],
    group_name="validation", 
    compute_kind="validation"
)
def validate_ingested_data(
    context: AssetExecutionContext,
    config: DataSourceConfig
) -> Dict[str, Any]:
    """Validate the quality and integrity of ingested data"""
    
    try:
        # Run data quality checks via analytics service
        validation_request = {
            "table_name": config.destination_table,
            "checks": [
                "row_count",
                "null_values",
                "data_types",
                "duplicate_records"
            ]
        }
        
        response = requests.post(
            "http://localhost:3002/api/v1/analytics/validate",
            json=validation_request,
            timeout=60,
            headers={"X-API-Key": config.api_key} if hasattr(config, 'api_key') and config.api_key else {}
        )
        
        if response.status_code == 200:
            validation_result = response.json()
            data = validation_result.get("data", {})
            
            # Extract validation metrics
            row_count = data.get("row_count", 0)
            null_percentage = data.get("null_percentage", 0)
            duplicate_count = data.get("duplicate_count", 0)
            
            # Determine data quality score
            quality_score = 100.0
            if null_percentage > 10:
                quality_score -= null_percentage
            if duplicate_count > 0:
                quality_score -= min(duplicate_count / row_count * 100, 20)
            
            quality_passed = quality_score >= 80.0
            
            context.log.info(f"Data validation completed. Quality score: {quality_score:.1f}%")
            
            return MaterializeResult(
                metadata={
                    "table_name": MetadataValue.text(config.destination_table),
                    "row_count": MetadataValue.int(row_count),
                    "null_percentage": MetadataValue.float(null_percentage),
                    "duplicate_count": MetadataValue.int(duplicate_count),
                    "quality_score": MetadataValue.float(quality_score),
                    "quality_passed": MetadataValue.bool(quality_passed),
                    "timestamp": MetadataValue.text(validation_result.get("timestamp", ""))
                },
                asset_key=f"validated_{config.destination_table}"
            )
        else:
            raise Exception(f"Data validation failed with status {response.status_code}")
            
    except Exception as e:
        context.log.error(f"Data validation failed: {e}")
        raise e

# Asset group definition for better organization
ingestion_assets = [
    ingestion_service_health,
    available_data_sources, 
    ingest_data_source,
    validate_ingested_data
]