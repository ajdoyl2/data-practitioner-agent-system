/**
 * Connection Manager
 * Manages database connections and connection pooling for data sources
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { securityLogger } = require('../lib/security-logger');

class ConnectionManager {
  constructor(options = {}) {
    this.connections = new Map();
    this.connectionConfigs = new Map();
    this.maxConnections = options.maxConnections || 10;
    this.connectionTimeout = options.connectionTimeout || 30000; // 30 seconds
    this.cleanupInterval = options.cleanupInterval || 300000; // 5 minutes
    
    // Start cleanup timer
    this.startCleanupTimer();
  }

  /**
   * Create a unique connection ID
   * @param {Object} config - Connection configuration
   * @returns {string} Connection ID
   */
  createConnectionId(config) {
    const hash = crypto.createHash('md5');
    hash.update(JSON.stringify({
      type: config.type,
      host: config.host,
      port: config.port,
      database: config.database,
      username: config.username
    }));
    return hash.digest('hex');
  }

  /**
   * Validate connection configuration
   * @param {Object} config - Connection configuration
   * @returns {Object} Validation result
   */
  validateConfig(config) {
    const errors = [];
    
    // Required fields for all connection types
    if (!config.type) {
      errors.push('Connection type is required');
    }
    
    // Database-specific validation
    if (['postgres', 'mysql', 'sqlite'].includes(config.type)) {
      if (!config.host && config.type !== 'sqlite') {
        errors.push('Host is required for database connections');
      }
      if (!config.database) {
        errors.push('Database name is required');
      }
      if (!config.username && config.type !== 'sqlite') {
        errors.push('Username is required for database connections');
      }
    }
    
    // File-specific validation
    if (config.type === 'file') {
      if (!config.path) {
        errors.push('File path is required for file connections');
      } else if (!fs.existsSync(config.path)) {
        errors.push('File does not exist');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Register a connection configuration
   * @param {string} name - Connection name
   * @param {Object} config - Connection configuration
   * @returns {Object} Registration result
   */
  registerConnection(name, config) {
    const validation = this.validateConfig(config);
    
    if (!validation.valid) {
      return {
        success: false,
        errors: validation.errors
      };
    }

    const connectionId = this.createConnectionId(config);
    
    // Store configuration
    this.connectionConfigs.set(name, {
      id: connectionId,
      name,
      config: this.sanitizeConfig(config),
      created: new Date().toISOString(),
      lastUsed: null,
      useCount: 0
    });

    securityLogger.logConnectionRegistration({
      name,
      connection_id: connectionId,
      type: config.type,
      timestamp: new Date().toISOString()
    });

    return {
      success: true,
      connectionId,
      name
    };
  }

  /**
   * Get connection configuration by name
   * @param {string} name - Connection name
   * @returns {Object|null} Connection configuration
   */
  getConnection(name) {
    const connection = this.connectionConfigs.get(name);
    if (connection) {
      // Update usage statistics
      connection.lastUsed = new Date().toISOString();
      connection.useCount += 1;
      
      return {
        ...connection,
        // Return config without sensitive data
        config: this.sanitizeConfig(connection.config, true)
      };
    }
    return null;
  }

  /**
   * List all registered connections
   * @returns {Array} List of connections
   */
  listConnections() {
    const connections = [];
    
    for (const [name, connection] of this.connectionConfigs.entries()) {
      connections.push({
        name: connection.name,
        id: connection.id,
        type: connection.config.type,
        created: connection.created,
        lastUsed: connection.lastUsed,
        useCount: connection.useCount,
        status: this.getConnectionStatus(connection.id)
      });
    }
    
    return connections.sort((a, b) => b.useCount - a.useCount);
  }

  /**
   * Remove a connection
   * @param {string} name - Connection name
   * @returns {boolean} Success status
   */
  removeConnection(name) {
    const connection = this.connectionConfigs.get(name);
    
    if (connection) {
      // Close any active connections
      if (this.connections.has(connection.id)) {
        this.closeConnection(connection.id);
      }
      
      // Remove configuration
      this.connectionConfigs.delete(name);
      
      securityLogger.logConnectionRemoval({
        name,
        connection_id: connection.id,
        timestamp: new Date().toISOString()
      });
      
      return true;
    }
    
    return false;
  }

  /**
   * Test a connection
   * @param {string} name - Connection name
   * @returns {Promise<Object>} Test result
   */
  async testConnection(name) {
    const connection = this.getConnection(name);
    
    if (!connection) {
      return {
        success: false,
        error: 'Connection not found'
      };
    }

    const startTime = Date.now();
    
    try {
      const result = await this.performConnectionTest(connection.config);
      const duration = Date.now() - startTime;
      
      securityLogger.logConnectionTest({
        name,
        connection_id: connection.id,
        success: result.success,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: true,
        result,
        duration,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      
      securityLogger.logConnectionTest({
        name,
        connection_id: connection.id,
        success: false,
        error: error.message,
        duration,
        timestamp: new Date().toISOString()
      });
      
      return {
        success: false,
        error: error.message,
        duration
      };
    }
  }

  /**
   * Perform the actual connection test (placeholder for different connection types)
   * @param {Object} config - Connection configuration
   * @returns {Promise<Object>} Test result
   */
  async performConnectionTest(config) {
    // This is a placeholder implementation
    // In a real implementation, this would connect to actual databases/services
    
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (config.type === 'file') {
          // For file connections, just check if file exists and is readable
          if (fs.existsSync(config.path)) {
            resolve({
              success: true,
              type: config.type,
              message: 'File is accessible'
            });
          } else {
            reject(new Error('File not found or not accessible'));
          }
        } else {
          // For database connections, return a mock successful result
          resolve({
            success: true,
            type: config.type,
            message: 'Connection test successful (mock)'
          });
        }
      }, Math.random() * 1000 + 500); // Random delay between 500-1500ms
    });
  }

  /**
   * Get connection status
   * @param {string} connectionId - Connection ID
   * @returns {string} Connection status
   */
  getConnectionStatus(connectionId) {
    if (this.connections.has(connectionId)) {
      return 'active';
    }
    return 'inactive';
  }

  /**
   * Close a connection
   * @param {string} connectionId - Connection ID
   */
  closeConnection(connectionId) {
    if (this.connections.has(connectionId)) {
      const connection = this.connections.get(connectionId);
      
      // Close the actual connection (implementation would depend on connection type)
      if (connection && typeof connection.close === 'function') {
        connection.close();
      }
      
      this.connections.delete(connectionId);
      
      securityLogger.logConnectionClose({
        connection_id: connectionId,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Clean up inactive connections
   */
  cleanupConnections() {
    const now = Date.now();
    const connectionsToClose = [];
    
    for (const [connectionId, connection] of this.connections.entries()) {
      const lastActivity = connection.lastActivity || connection.created;
      const timeSinceActivity = now - new Date(lastActivity).getTime();
      
      if (timeSinceActivity > this.connectionTimeout) {
        connectionsToClose.push(connectionId);
      }
    }
    
    connectionsToClose.forEach(connectionId => {
      this.closeConnection(connectionId);
    });
    
    if (connectionsToClose.length > 0) {
      securityLogger.logConnectionCleanup({
        closed_connections: connectionsToClose.length,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Start the cleanup timer
   */
  startCleanupTimer() {
    this.cleanupTimer = setInterval(() => {
      this.cleanupConnections();
    }, this.cleanupInterval);
  }

  /**
   * Stop the cleanup timer
   */
  stopCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }

  /**
   * Sanitize configuration by removing or masking sensitive data
   * @param {Object} config - Original configuration
   * @param {boolean} forDisplay - Whether this is for display purposes
   * @returns {Object} Sanitized configuration
   */
  sanitizeConfig(config, forDisplay = false) {
    const sanitized = { ...config };
    
    // Remove or mask sensitive fields
    if (sanitized.password) {
      if (forDisplay) {
        sanitized.password = '***masked***';
      } else {
        // Keep password for actual use but don't log it
        sanitized.password = config.password;
      }
    }
    
    if (sanitized.api_key) {
      if (forDisplay) {
        sanitized.api_key = '***masked***';
      } else {
        sanitized.api_key = config.api_key;
      }
    }
    
    if (sanitized.secret) {
      if (forDisplay) {
        sanitized.secret = '***masked***';
      } else {
        sanitized.secret = config.secret;
      }
    }
    
    return sanitized;
  }

  /**
   * Export connection configurations to file
   * @param {string} filePath - Export file path
   * @param {Object} options - Export options
   * @returns {Promise<Object>} Export result
   */
  async exportConnections(filePath, options = {}) {
    try {
      const connections = [];
      
      for (const [name, connection] of this.connectionConfigs.entries()) {
        connections.push({
          name: connection.name,
          type: connection.config.type,
          config: this.sanitizeConfig(connection.config, true), // Mask sensitive data
          created: connection.created,
          useCount: connection.useCount
        });
      }
      
      const exportData = {
        exported: new Date().toISOString(),
        version: '1.0.0',
        connections
      };
      
      if (options.format === 'json') {
        await fs.writeFile(filePath, JSON.stringify(exportData, null, 2));
      } else {
        // Default to YAML
        const yaml = require('js-yaml');
        await fs.writeFile(filePath, yaml.dump(exportData, { indent: 2 }));
      }
      
      return {
        success: true,
        exported: connections.length,
        filePath
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Import connection configurations from file
   * @param {string} filePath - Import file path
   * @returns {Promise<Object>} Import result
   */
  async importConnections(filePath) {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Import file not found');
      }
      
      const content = await fs.readFile(filePath, 'utf8');
      let importData;
      
      if (filePath.endsWith('.json')) {
        importData = JSON.parse(content);
      } else {
        const yaml = require('js-yaml');
        importData = yaml.load(content);
      }
      
      let imported = 0;
      const errors = [];
      
      for (const connection of importData.connections || []) {
        try {
          const result = this.registerConnection(connection.name, connection.config);
          if (result.success) {
            imported++;
          } else {
            errors.push({
              name: connection.name,
              errors: result.errors
            });
          }
        } catch (error) {
          errors.push({
            name: connection.name,
            error: error.message
          });
        }
      }
      
      return {
        success: true,
        imported,
        errors,
        total: importData.connections?.length || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Destroy the connection manager and clean up resources
   */
  destroy() {
    // Stop cleanup timer
    this.stopCleanupTimer();
    
    // Close all active connections
    for (const connectionId of this.connections.keys()) {
      this.closeConnection(connectionId);
    }
    
    // Clear all data
    this.connections.clear();
    this.connectionConfigs.clear();
    
    securityLogger.logConnectionManagerDestroy({
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = ConnectionManager;