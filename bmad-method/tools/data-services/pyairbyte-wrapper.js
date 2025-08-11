/**
 * PyAirbyte Wrapper Service
 * Node.js interface for PyAirbyte data connectors
 */

const path = require('path');
const fs = require('fs-extra');
const PythonSubprocessManager = require('../lib/python-subprocess');
const { securityLogger } = require('../lib/security-logger');
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

class PyAirbyteWrapper {
  constructor(options = {}) {
    this.pythonManager = new PythonSubprocessManager(options);
    this.scriptsPath = path.join(__dirname, '../../scripts/python');
    this.cacheDirectory = options.cacheDirectory || path.join(process.cwd(), '.cache', 'pyairbyte');
    
    // Ensure scripts and cache directories exist
    fs.ensureDirSync(this.scriptsPath);
    fs.ensureDirSync(this.cacheDirectory);
  }

  /**
   * Check if PyAirbyte integration is enabled and available
   * @returns {Promise<Object>} Availability status
   */
  async checkAvailability() {
    // Check feature flag first
    if (!isFeatureEnabled('pyairbyte_integration')) {
      return {
        available: false,
        reason: 'PyAirbyte integration is disabled via feature flag'
      };
    }

    // Check Python environment
    return await this.pythonManager.checkAvailability();
  }

  /**
   * Initialize PyAirbyte environment
   * @returns {Promise<Object>} Initialization result
   */
  async initialize() {
    const availability = await this.checkAvailability();
    if (!availability.available) {
      throw new Error(`PyAirbyte not available: ${availability.reason || availability.error}`);
    }

    // Create Python scripts if they don't exist
    await this.createPythonScripts();

    return {
      success: true,
      cacheDirectory: this.cacheDirectory,
      scriptsPath: this.scriptsPath
    };
  }

  /**
   * Create Python scripts for PyAirbyte operations
   */
  async createPythonScripts() {
    const connectorScript = path.join(this.scriptsPath, 'airbyte_connector.py');
    
    if (!fs.existsSync(connectorScript)) {
      const scriptContent = `#!/usr/bin/env python3
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
`;

      await fs.writeFile(connectorScript, scriptContent);
      await fs.chmod(connectorScript, '755');
    }
  }

  /**
   * List available connectors
   * @returns {Promise<Object>} Available connectors
   */
  async listConnectors() {
    await this.initialize();
    
    const script = path.join(this.scriptsPath, 'airbyte_connector.py');
    const result = await this.pythonManager.execute(script, [
      'list_connectors',
      this.cacheDirectory
    ], { parseJson: true });

    securityLogger.logDataIngestion({
      operation: 'list_connectors',
      success: result.data.success,
      timestamp: new Date().toISOString()
    });

    return result.data;
  }

  /**
   * Discover streams from a data source
   * @param {string} connectorType - Type of connector (file, postgres, etc.)
   * @param {Object} config - Connector configuration
   * @returns {Promise<Object>} Available streams
   */
  async discoverStreams(connectorType, config) {
    await this.initialize();
    
    const script = path.join(this.scriptsPath, 'airbyte_connector.py');
    const result = await this.pythonManager.execute(script, [
      'discover_streams',
      this.cacheDirectory,
      connectorType,
      JSON.stringify(config)
    ], { parseJson: true });

    securityLogger.logDataIngestion({
      operation: 'discover_streams',
      connector_type: connectorType,
      success: result.data.success,
      stream_count: result.data.streams?.length || 0,
      timestamp: new Date().toISOString()
    });

    return result.data;
  }

  /**
   * Read data from a specific stream
   * @param {string} connectorType - Type of connector
   * @param {Object} config - Connector configuration
   * @param {string} streamName - Name of the stream to read
   * @param {number} limit - Optional limit on records
   * @returns {Promise<Object>} Stream data
   */
  async readStream(connectorType, config, streamName, limit = null) {
    await this.initialize();
    
    const script = path.join(this.scriptsPath, 'airbyte_connector.py');
    const args = [
      'read_stream',
      this.cacheDirectory,
      connectorType,
      JSON.stringify(config),
      streamName
    ];
    
    if (limit) {
      args.push(limit.toString());
    }

    const result = await this.pythonManager.execute(script, args, { 
      parseJson: true,
      timeout: 120000 // 2 minutes for data reading
    });

    securityLogger.logDataIngestion({
      operation: 'read_stream',
      connector_type: connectorType,
      stream_name: streamName,
      success: result.data.success,
      record_count: result.data.data?.metadata?.total_records || 0,
      limited: result.data.data?.metadata?.limited || false,
      timestamp: new Date().toISOString()
    });

    return result.data;
  }

  /**
   * Create a file-based connector configuration
   * @param {string} filePath - Path to the data file
   * @param {string} format - File format (csv, json, excel, etc.)
   * @param {Object} options - Additional options
   * @returns {Object} Connector configuration
   */
  createFileConfig(filePath, format, options = {}) {
    const config = {
      dataset_name: options.dataset_name || path.basename(filePath, path.extname(filePath)),
      format: format.toLowerCase(),
      url: filePath,
      provider: {
        storage: "local"
      }
    };

    // Add format-specific options
    if (format.toLowerCase() === 'csv') {
      config.format_options = {
        delimiter: options.delimiter || ',',
        quote_char: options.quote_char || '"',
        escape_char: options.escape_char || '"',
        encoding: options.encoding || 'utf-8',
        newlines_in_values: options.newlines_in_values || false,
        ...options.format_options
      };
    }

    return config;
  }

  /**
   * Create a database connector configuration
   * @param {string} database - Database type (postgres, mysql)
   * @param {Object} connection - Database connection details
   * @returns {Object} Connector configuration
   */
  createDatabaseConfig(database, connection) {
    const config = {
      host: connection.host,
      port: connection.port,
      database: connection.database,
      username: connection.username,
      password: connection.password
    };

    // Add database-specific options
    if (database === 'postgres') {
      config.ssl = connection.ssl || false;
      config.ssl_mode = connection.ssl_mode || 'prefer';
    }

    return config;
  }

  /**
   * Clear cache for a specific connector or all caches
   * @param {string} pattern - Cache pattern to clear (optional)
   * @returns {Promise<Object>} Clear operation result
   */
  async clearCache(pattern = null) {
    try {
      if (pattern) {
        // Clear specific pattern
        const files = await fs.readdir(this.cacheDirectory);
        const matchingFiles = files.filter(file => file.includes(pattern));
        
        for (const file of matchingFiles) {
          await fs.remove(path.join(this.cacheDirectory, file));
        }
        
        return {
          success: true,
          cleared: matchingFiles.length,
          pattern
        };
      } else {
        // Clear entire cache directory
        await fs.emptyDir(this.cacheDirectory);
        
        return {
          success: true,
          cleared: 'all',
          directory: this.cacheDirectory
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get cache information
   * @returns {Promise<Object>} Cache information
   */
  async getCacheInfo() {
    try {
      const stats = await fs.stat(this.cacheDirectory);
      const files = await fs.readdir(this.cacheDirectory);
      
      let totalSize = 0;
      const fileDetails = [];
      
      for (const file of files) {
        const filePath = path.join(this.cacheDirectory, file);
        const fileStat = await fs.stat(filePath);
        
        totalSize += fileStat.size;
        fileDetails.push({
          name: file,
          size: fileStat.size,
          modified: fileStat.mtime
        });
      }
      
      return {
        success: true,
        cache_directory: this.cacheDirectory,
        total_files: files.length,
        total_size: totalSize,
        created: stats.birthtime,
        files: fileDetails
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PyAirbyteWrapper;