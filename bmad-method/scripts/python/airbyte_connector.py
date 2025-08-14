#!/usr/bin/env python3
"""
PyAirbyte Connector Script
Handles data source connections and stream operations
"""

import json
import sys
import traceback
from pathlib import Path
from typing import Dict, Any, List, Optional

try:
    import airbyte as ab
    import pandas as pd
except ImportError as e:
    print(json.dumps({
        "error": f"Missing required packages: {e}",
        "suggestion": "Run: pip install pyairbyte pandas"
    }))
    sys.exit(1)

class AirbyteConnector:
    def __init__(self, cache_dir: str = ".cache/pyairbyte"):
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        
        # Set Airbyte cache directory
        ab.set_cache_dir(str(self.cache_dir))
    
    def list_available_connectors(self) -> Dict[str, Any]:
        """List all available Airbyte connectors"""
        try:
            # Get commonly used connectors
            connectors = {
                "file": {
                    "name": "source-file",
                    "description": "Read data from CSV, JSON, Excel, and other file formats",
                    "formats": ["csv", "json", "jsonl", "excel", "parquet"]
                },
                "postgres": {
                    "name": "source-postgres",
                    "description": "Connect to PostgreSQL databases"
                },
                "mysql": {
                    "name": "source-mysql", 
                    "description": "Connect to MySQL databases"
                },
                "faker": {
                    "name": "source-faker",
                    "description": "Generate fake data for testing"
                }
            }
            
            return {
                "success": True,
                "connectors": connectors
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def create_source(self, connector_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Create and configure a data source"""
        try:
            if connector_type == "file":
                source = ab.get_source(
                    "source-file",
                    config=config,
                    install_if_missing=True
                )
            elif connector_type == "postgres":
                source = ab.get_source(
                    "source-postgres",
                    config=config,
                    install_if_missing=True
                )
            elif connector_type == "mysql":
                source = ab.get_source(
                    "source-mysql",
                    config=config,
                    install_if_missing=True
                )
            elif connector_type == "faker":
                source = ab.get_source(
                    "source-faker",
                    config=config,
                    install_if_missing=True
                )
            else:
                raise ValueError(f"Unsupported connector type: {connector_type}")
            
            # Test the connection
            source.check()
            
            return {
                "success": True,
                "source_id": id(source),
                "connector_type": connector_type
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def discover_streams(self, connector_type: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Discover available data streams from a source"""
        try:
            # Create source temporarily to discover streams
            if connector_type == "file":
                source = ab.get_source("source-file", config=config)
            elif connector_type == "postgres":
                source = ab.get_source("source-postgres", config=config)
            elif connector_type == "mysql":
                source = ab.get_source("source-mysql", config=config)
            elif connector_type == "faker":
                source = ab.get_source("source-faker", config=config)
            else:
                raise ValueError(f"Unsupported connector type: {connector_type}")
            
            # Get catalog (available streams)
            catalog = source.get_available_streams()
            
            streams = []
            for stream in catalog:
                stream_info = {
                    "name": stream,
                    "supported_sync_modes": getattr(catalog[stream], 'supported_sync_modes', []),
                    "json_schema": getattr(catalog[stream], 'json_schema', {})
                }
                streams.append(stream_info)
            
            return {
                "success": True,
                "streams": streams,
                "count": len(streams)
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }
    
    def read_stream(self, connector_type: str, config: Dict[str, Any], 
                   stream_name: str, limit: Optional[int] = None) -> Dict[str, Any]:
        """Read data from a specific stream"""
        try:
            # Create source
            if connector_type == "file":
                source = ab.get_source("source-file", config=config)
            elif connector_type == "postgres":
                source = ab.get_source("source-postgres", config=config)
            elif connector_type == "mysql":
                source = ab.get_source("source-mysql", config=config)
            elif connector_type == "faker":
                source = ab.get_source("source-faker", config=config)
            else:
                raise ValueError(f"Unsupported connector type: {connector_type}")
            
            # Select specific stream
            source.select_streams([stream_name])
            
            # Read to cache
            cache_result = source.read(cache=ab.get_default_cache())
            
            # Convert to DataFrame
            df = cache_result[stream_name].to_pandas()
            
            # Apply limit if specified
            if limit and len(df) > limit:
                df = df.head(limit)
            
            # Convert DataFrame to JSON-serializable format
            data = {
                "records": df.to_dict('records'),
                "schema": {
                    "columns": list(df.columns),
                    "dtypes": df.dtypes.astype(str).to_dict(),
                    "shape": df.shape
                },
                "metadata": {
                    "total_records": len(df),
                    "stream_name": stream_name,
                    "limited": limit is not None and len(df) >= limit
                }
            }
            
            return {
                "success": True,
                "data": data
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "traceback": traceback.format_exc()
            }

def main():
    """Main entry point for the script"""
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Operation not specified"}))
        sys.exit(1)
    
    operation = sys.argv[1]
    
    # Initialize connector
    cache_dir = sys.argv[2] if len(sys.argv) > 2 else ".cache/pyairbyte"
    connector = AirbyteConnector(cache_dir)
    
    try:
        if operation == "list_connectors":
            result = connector.list_available_connectors()
        
        elif operation == "discover_streams":
            if len(sys.argv) < 5:
                raise ValueError("Missing arguments: connector_type, config")
            
            connector_type = sys.argv[3]
            config = json.loads(sys.argv[4])
            result = connector.discover_streams(connector_type, config)
        
        elif operation == "read_stream":
            if len(sys.argv) < 6:
                raise ValueError("Missing arguments: connector_type, config, stream_name")
            
            connector_type = sys.argv[3]
            config = json.loads(sys.argv[4])
            stream_name = sys.argv[5]
            limit = int(sys.argv[6]) if len(sys.argv) > 6 else None
            
            result = connector.read_stream(connector_type, config, stream_name, limit)
        
        else:
            result = {"success": False, "error": f"Unknown operation: {operation}"}
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        print(json.dumps(error_result))
        sys.exit(1)

if __name__ == "__main__":
    main()
