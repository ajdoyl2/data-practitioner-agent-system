"""
Dagster Assets for Analytics Pipeline
Integrates with DuckDB analytical engine from Story 1.3
"""

from dagster import (
    asset,
    AssetExecutionContext,
    Config,
    AssetIn,
    MetadataValue,
    MaterializeResult,
    DependsOn
)
import os
import sys
import json
import requests
from typing import Dict, List, Any, Optional
from pathlib import Path
import time

# Add the BMad tools directory to Python path for imports
bmad_tools_path = Path(__file__).parent.parent.parent.parent.parent / "tools"
sys.path.insert(0, str(bmad_tools_path))

class AnalyticsConfig(Config):
    """Configuration for analytics assets"""
    api_key: Optional[str] = None
    service_port: int = 3002
    timeout: int = 300
    cache_enabled: bool = True

class QueryConfig(Config):
    """Configuration for analytical queries"""
    query: str
    output_table: Optional[str] = None
    parameters: Dict[str, Any] = {}
    cache_enabled: bool = True
    max_rows: int = 10000

@asset(
    description="Health check for the analytical engine service",
    group_name="infrastructure",
    compute_kind="health_check"
)
def analytics_service_health(context: AssetExecutionContext, config: AnalyticsConfig) -> Dict[str, Any]:
    """Check if the analytical engine service is running and healthy"""
    
    try:
        # Check service health endpoint
        response = requests.get(
            f"http://localhost:{config.service_port}/health",
            timeout=config.timeout,
            headers={"X-API-Key": config.api_key} if config.api_key else {}
        )
        
        if response.status_code == 200:
            health_data = response.json()
            
            context.log.info(f"Analytical engine service is healthy: {health_data}")
            
            return MaterializeResult(
                metadata={
                    "status": MetadataValue.text(health_data.get("status", "unknown")),
                    "service": MetadataValue.text("analytical-engine"),
                    "timestamp": MetadataValue.text(health_data.get("timestamp", "")),
                    "features": MetadataValue.json(health_data.get("features", {})),
                    "duckdb_available": MetadataValue.bool(
                        health_data.get("duckdb", {}).get("available", False)
                    ),
                    "duckdb_version": MetadataValue.text(
                        health_data.get("duckdb", {}).get("version", "unknown")
                    )
                },
                asset_key="analytics_service_health"
            )
        else:
            raise Exception(f"Service health check failed with status {response.status_code}")
            
    except Exception as e:
        context.log.error(f"Failed to check analytical engine health: {e}")
        raise e

@asset(
    description="List of available tables in the analytical database",
    deps=[analytics_service_health],
    group_name="analytics",
    compute_kind="catalog"
)
def available_tables(context: AssetExecutionContext, config: AnalyticsConfig) -> Dict[str, Any]:
    """Get list of available tables in DuckDB for analysis"""
    
    try:
        # Get available tables from the analytics service
        response = requests.get(
            f"http://localhost:{config.service_port}/api/v1/analytics/tables",
            timeout=config.timeout,
            headers={"X-API-Key": config.api_key} if config.api_key else {}
        )
        
        if response.status_code == 200:
            tables_data = response.json()
            tables = tables_data.get("data", {}).get("tables", [])
            
            context.log.info(f"Found {len(tables)} available tables for analysis")
            
            return MaterializeResult(
                metadata={
                    "total_tables": MetadataValue.int(len(tables)),
                    "table_names": MetadataValue.json(tables),
                    "timestamp": MetadataValue.text(tables_data.get("timestamp", "")),
                },
                asset_key="available_tables"
            )
        else:
            raise Exception(f"Failed to fetch available tables: {response.status_code}")
            
    except Exception as e:
        context.log.error(f"Failed to get available tables: {e}")
        raise e

@asset(
    description="Execute analytical query and materialize results",
    deps=[available_tables],
    group_name="analytics",
    compute_kind="query"
)
def execute_analytical_query(
    context: AssetExecutionContext,
    config: QueryConfig
) -> Dict[str, Any]:
    """Execute an analytical query using DuckDB"""
    
    try:
        start_time = time.time()
        
        # Prepare query request
        query_request = {
            "query": config.query,
            "parameters": config.parameters,
            "options": {
                "useCache": config.cache_enabled,
                "maxRows": config.max_rows,
                "timeout": 60000
            }
        }
        
        context.log.info(f"Executing analytical query")
        context.log.debug(f"Query: {config.query}")
        
        # Execute query via API
        response = requests.post(
            f"http://localhost:3002/api/v1/analytics/query",
            json=query_request,
            timeout=300,
            headers={"X-API-Key": config.api_key} if hasattr(config, 'api_key') and config.api_key else {}
        )
        
        if response.status_code == 200:
            result = response.json()
            execution_time = time.time() - start_time
            
            data = result.get("data", [])
            metadata = result.get("metadata", {})
            
            context.log.info(f"Query executed successfully in {execution_time:.2f}s")
            context.log.info(f"Returned {len(data)} rows")
            
            # Optionally save results to a new table
            if config.output_table:
                context.log.info(f"Results would be saved to table: {config.output_table}")
            
            return MaterializeResult(
                metadata={
                    "query_hash": MetadataValue.text(str(hash(config.query))[:16]),
                    "row_count": MetadataValue.int(len(data)),
                    "execution_time": MetadataValue.float(execution_time),
                    "cached": MetadataValue.bool(result.get("cached", False)),
                    "success": MetadataValue.bool(result.get("success", False)),
                    "timestamp": MetadataValue.text(result.get("timestamp", "")),
                    "output_table": MetadataValue.text(config.output_table or "query_result")
                },
                asset_key=f"query_result_{config.output_table or 'default'}"
            )
        else:
            raise Exception(f"Query execution failed with status {response.status_code}: {response.text}")
            
    except Exception as e:
        context.log.error(f"Analytical query execution failed: {e}")
        raise e

@asset(
    description="Generate data profiling report for a table",
    deps=[available_tables],
    group_name="analytics",
    compute_kind="profiling"
)
def profile_data_table(
    context: AssetExecutionContext,
    config: AnalyticsConfig,
    table_name: str = "default_table"
) -> Dict[str, Any]:
    """Generate comprehensive data profiling for a specific table"""
    
    try:
        # Get table schema first
        schema_response = requests.get(
            f"http://localhost:{config.service_port}/api/v1/analytics/schema/{table_name}",
            timeout=config.timeout,
            headers={"X-API-Key": config.api_key} if config.api_key else {}
        )
        
        if schema_response.status_code != 200:
            raise Exception(f"Failed to get table schema: {schema_response.status_code}")
        
        schema_data = schema_response.json()
        columns = schema_data.get("data", {}).get("columns", [])
        
        # Generate profiling queries
        profiling_queries = {
            "row_count": f"SELECT COUNT(*) as count FROM {table_name}",
            "null_counts": f"SELECT {', '.join([f'SUM(CASE WHEN {col['name']} IS NULL THEN 1 ELSE 0 END) as {col['name']}_nulls' for col in columns])} FROM {table_name}",
            "basic_stats": f"SELECT {', '.join([f'MIN({col['name']}) as {col['name']}_min, MAX({col['name']}) as {col['name']}_max' for col in columns if col['type'] in ['INTEGER', 'DOUBLE', 'DECIMAL']])} FROM {table_name}" if any(col['type'] in ['INTEGER', 'DOUBLE', 'DECIMAL'] for col in columns) else None
        }
        
        profile_results = {}
        
        # Execute each profiling query
        for query_name, query_sql in profiling_queries.items():
            if query_sql is None:
                continue
                
            query_request = {
                "query": query_sql,
                "options": {
                    "useCache": config.cache_enabled,
                    "maxRows": 1,
                    "timeout": 30000
                }
            }
            
            response = requests.post(
                f"http://localhost:{config.service_port}/api/v1/analytics/query",
                json=query_request,
                timeout=60,
                headers={"X-API-Key": config.api_key} if config.api_key else {}
            )
            
            if response.status_code == 200:
                result = response.json()
                profile_results[query_name] = result.get("data", [])
        
        context.log.info(f"Data profiling completed for table: {table_name}")
        
        # Extract key metrics
        row_count = profile_results.get("row_count", [{}])[0].get("count", 0)
        column_count = len(columns)
        
        return MaterializeResult(
            metadata={
                "table_name": MetadataValue.text(table_name),
                "row_count": MetadataValue.int(row_count),
                "column_count": MetadataValue.int(column_count),
                "column_types": MetadataValue.json({col['name']: col['type'] for col in columns}),
                "profiling_complete": MetadataValue.bool(True),
                "timestamp": MetadataValue.text(schema_data.get("timestamp", ""))
            },
            asset_key=f"profile_{table_name}"
        )
        
    except Exception as e:
        context.log.error(f"Data profiling failed for table {table_name}: {e}")
        raise e

@asset(
    description="Performance monitoring for analytical queries",
    deps=[analytics_service_health],
    group_name="monitoring",
    compute_kind="monitoring"
)
def analytics_performance_metrics(
    context: AssetExecutionContext,
    config: AnalyticsConfig
) -> Dict[str, Any]:
    """Monitor performance metrics of the analytical engine"""
    
    try:
        # Get performance metrics from analytics service
        response = requests.get(
            f"http://localhost:{config.service_port}/api/v1/analytics/performance",
            timeout=config.timeout,
            headers={"X-API-Key": config.api_key} if config.api_key else {}
        )
        
        if response.status_code == 200:
            metrics_data = response.json()
            metrics = metrics_data.get("data", {})
            
            memory_usage = metrics.get("memory_usage", 0)
            active_connections = metrics.get("active_connections", 0)
            cache_hit_rate = metrics.get("cache_hit_rate", 0)
            uptime = metrics.get("uptime", 0)
            
            context.log.info(f"Analytics performance - Memory: {memory_usage}MB, Connections: {active_connections}, Cache Hit Rate: {cache_hit_rate:.2%}")
            
            return MaterializeResult(
                metadata={
                    "memory_usage_mb": MetadataValue.float(memory_usage),
                    "active_connections": MetadataValue.int(active_connections),
                    "cache_hit_rate": MetadataValue.float(cache_hit_rate),
                    "uptime_seconds": MetadataValue.float(uptime),
                    "timestamp": MetadataValue.text(metrics_data.get("timestamp", ""))
                },
                asset_key="analytics_performance_metrics"
            )
        else:
            raise Exception(f"Failed to fetch performance metrics: {response.status_code}")
            
    except Exception as e:
        context.log.error(f"Failed to get performance metrics: {e}")
        raise e

# Asset group definition for better organization
analytics_assets = [
    analytics_service_health,
    available_tables,
    execute_analytical_query,
    profile_data_table,
    analytics_performance_metrics
]