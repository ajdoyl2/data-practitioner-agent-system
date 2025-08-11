# Security Architecture - Story 1.1.5 Technical Design

## Architecture Overview

The Security & Risk Management Foundation implements a **Security Bridge Pattern** that provides essential security controls between the completed infrastructure (Story 1.1) and external integrations (Stories 1.2-1.8).

### Core Architecture Principles

1. **Layered Defense**: Multiple security controls at different layers
2. **Fail-Safe Defaults**: Secure by default, explicit allow patterns
3. **Progressive Enhancement**: MVP security now, advanced features later
4. **Audit Everything**: Comprehensive logging and monitoring
5. **Recovery-Oriented**: Robust rollback and recovery capabilities

## Component Architecture

### 1. Authentication Service Architecture

#### **SecurityService Class Design**
```javascript
// tools/data-services/security-service.js
class DataSecurityService {
  constructor(config = {}) {
    this.config = this.loadSecurityConfig();
    this.logger = new SecurityLogger();
    this.apiKeys = new ApiKeyManager();
    this.permissions = new PermissionManager();
  }

  // Core Authentication Methods
  async validateApiKey(request) {
    try {
      const apiKey = this.extractApiKey(request);
      const isValid = await this.apiKeys.validate(apiKey);
      
      if (!isValid) {
        await this.logger.logSecurityEvent('AUTH_FAILURE', { 
          ip: request.ip, 
          endpoint: request.path 
        });
        return { valid: false, error: 'Invalid API key' };
      }

      const scopes = await this.apiKeys.getScopes(apiKey);
      await this.logger.logSecurityEvent('AUTH_SUCCESS', { 
        ip: request.ip, 
        endpoint: request.path,
        scopes: scopes 
      });

      return { valid: true, scopes: scopes };
    } catch (error) {
      await this.logger.logSecurityEvent('AUTH_ERROR', { error: error.message });
      return { valid: false, error: 'Authentication system error' };
    }
  }

  async checkPermission(scopes, requiredPermission) {
    return this.permissions.hasPermission(scopes, requiredPermission);
  }

  // Security Configuration
  loadSecurityConfig() {
    return {
      apiKeyHeader: process.env.DATA_API_KEY_HEADER || 'X-Data-API-Key',
      encryptionKey: process.env.DATA_ENCRYPTION_KEY,
      tokenExpiry: process.env.DATA_TOKEN_EXPIRY || '24h',
      rateLimits: {
        perMinute: parseInt(process.env.DATA_RATE_LIMIT_MINUTE) || 60,
        perHour: parseInt(process.env.DATA_RATE_LIMIT_HOUR) || 1000
      }
    };
  }

  // API Key Extraction
  extractApiKey(request) {
    return request.headers[this.config.apiKeyHeader.toLowerCase()] ||
           request.headers['authorization']?.replace('Bearer ', '') ||
           request.query.apiKey;
  }
}
```

#### **API Key Manager**
```javascript
// tools/lib/api-key-manager.js
class ApiKeyManager {
  constructor() {
    this.keys = new Map();
    this.loadApiKeys();
  }

  async validate(apiKey) {
    if (!apiKey) return false;
    
    const keyData = this.keys.get(apiKey);
    if (!keyData) return false;
    
    // Check expiration
    if (keyData.expires && Date.now() > keyData.expires) {
      return false;
    }
    
    // Check if key is active
    return keyData.active === true;
  }

  async getScopes(apiKey) {
    const keyData = this.keys.get(apiKey);
    return keyData ? keyData.scopes : [];
  }

  loadApiKeys() {
    // Load from environment variables
    const masterKey = process.env.DATA_MASTER_API_KEY;
    const readKey = process.env.DATA_READ_API_KEY;
    const writeKey = process.env.DATA_WRITE_API_KEY;

    if (masterKey) {
      this.keys.set(masterKey, {
        scopes: ['admin', 'data_read', 'data_write'],
        active: true,
        expires: null
      });
    }

    if (readKey) {
      this.keys.set(readKey, {
        scopes: ['data_read'],
        active: true,
        expires: null
      });
    }

    if (writeKey) {
      this.keys.set(writeKey, {
        scopes: ['data_read', 'data_write'],
        active: true,
        expires: null
      });
    }
  }
}
```

### 2. Feature Flag System Architecture

#### **Feature Flag Manager**
```javascript
// tools/lib/feature-flag-manager.js
const yaml = require('js-yaml');
const fs = require('fs-extra');
const path = require('path');

class FeatureFlagManager {
  constructor(configPath = 'config/feature-flags.yaml') {
    this.configPath = configPath;
    this.flags = new Map();
    this.watchers = new Map();
    this.loadFlags();
    this.setupFileWatcher();
  }

  // Feature Flag Checking
  isEnabled(featureName) {
    return this.flags.get(featureName) || false;
  }

  async checkFeatureFlag(featureName) {
    const enabled = this.isEnabled(featureName);
    
    // Log feature flag check
    console.log(`Feature flag check: ${featureName} = ${enabled}`);
    
    return enabled;
  }

  // Feature Flag Management
  async enableFeature(featureName) {
    await this.setFeature(featureName, true);
  }

  async disableFeature(featureName) {
    await this.setFeature(featureName, false);
  }

  async setFeature(featureName, enabled) {
    this.flags.set(featureName, enabled);
    await this.saveFlags();
    
    // Notify watchers
    const callbacks = this.watchers.get(featureName) || [];
    callbacks.forEach(callback => callback(enabled));
  }

  // Configuration Management
  loadFlags() {
    try {
      const configFile = path.resolve(this.configPath);
      
      if (fs.existsSync(configFile)) {
        const content = fs.readFileSync(configFile, 'utf8');
        const config = yaml.load(content);
        
        if (config && config.features) {
          Object.entries(config.features).forEach(([key, value]) => {
            this.flags.set(key, value);
          });
        }
      } else {
        // Create default configuration
        this.createDefaultConfig();
      }
    } catch (error) {
      console.error('Error loading feature flags:', error);
      this.createDefaultConfig();
    }
  }

  async saveFlags() {
    try {
      const config = {
        features: Object.fromEntries(this.flags)
      };
      
      const configFile = path.resolve(this.configPath);
      const yamlContent = yaml.dump(config, { 
        indent: 2,
        lineWidth: -1 
      });
      
      await fs.ensureDir(path.dirname(configFile));
      await fs.writeFile(configFile, yamlContent, 'utf8');
    } catch (error) {
      console.error('Error saving feature flags:', error);
    }
  }

  createDefaultConfig() {
    // Default: All features disabled for safe rollout
    const defaultFlags = {
      pyairbyte_integration: false,
      duckdb_analytics: false,
      dbt_transformations: false,
      dagster_orchestration: false,
      eda_automation: false,
      evidence_publishing: false
    };

    Object.entries(defaultFlags).forEach(([key, value]) => {
      this.flags.set(key, value);
    });

    this.saveFlags();
  }

  // File Watching
  setupFileWatcher() {
    if (fs.existsSync(this.configPath)) {
      fs.watchFile(this.configPath, () => {
        console.log('Feature flags configuration changed, reloading...');
        this.loadFlags();
      });
    }
  }

  // Event System
  onFeatureChange(featureName, callback) {
    if (!this.watchers.has(featureName)) {
      this.watchers.set(featureName, []);
    }
    this.watchers.get(featureName).push(callback);
  }
}

// Singleton instance
module.exports = new FeatureFlagManager();
```

### 3. Rollback Manager Architecture

#### **Rollback Orchestration System**
```javascript
// tools/rollback/rollback-manager.js
const { spawn, exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class RollbackManager {
  constructor() {
    this.rollbackScripts = new Map();
    this.rollbackHistory = [];
    this.loadRollbackScripts();
  }

  // Main Rollback Execution
  async executeStoryRollback(storyNumber, options = {}) {
    const storyId = `story-${storyNumber}`;
    
    try {
      // Create rollback point
      const rollbackPoint = await this.createRollbackPoint(storyId);
      
      // Execute rollback script
      const result = await this.runRollbackScript(storyId, options);
      
      // Validate rollback success
      const validation = await this.validateRollback(storyId);
      
      // Record rollback
      await this.recordRollback(storyId, rollbackPoint, result, validation);
      
      return {
        success: result.success && validation.success,
        rollbackPoint: rollbackPoint,
        details: result,
        validation: validation
      };
      
    } catch (error) {
      console.error(`Rollback failed for ${storyId}:`, error);
      return {
        success: false,
        error: error.message,
        rollbackPoint: null
      };
    }
  }

  // Rollback Script Execution
  async runRollbackScript(storyId, options = {}) {
    const scriptPath = this.rollbackScripts.get(storyId);
    
    if (!scriptPath) {
      throw new Error(`No rollback script found for ${storyId}`);
    }

    return new Promise((resolve, reject) => {
      const process = spawn('bash', [scriptPath], {
        env: { ...process.env, ...options.env },
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      process.stdout.on('data', (data) => {
        stdout += data.toString();
        if (options.onProgress) {
          options.onProgress(data.toString());
        }
      });

      process.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      process.on('close', (code) => {
        resolve({
          success: code === 0,
          exitCode: code,
          stdout: stdout,
          stderr: stderr
        });
      });

      process.on('error', (error) => {
        reject(error);
      });
    });
  }

  // Rollback Validation
  async validateRollback(storyId) {
    const validationScript = `tools/rollback/validate-${storyId}.sh`;
    
    if (!fs.existsSync(validationScript)) {
      return { success: true, message: 'No validation script provided' };
    }

    return new Promise((resolve) => {
      exec(`bash ${validationScript}`, (error, stdout, stderr) => {
        resolve({
          success: !error,
          exitCode: error ? error.code : 0,
          stdout: stdout,
          stderr: stderr,
          message: error ? 'Validation failed' : 'Validation successful'
        });
      });
    });
  }

  // Rollback Point Management
  async createRollbackPoint(storyId) {
    const timestamp = new Date().toISOString();
    const rollbackPoint = {
      id: `${storyId}-${Date.now()}`,
      storyId: storyId,
      timestamp: timestamp,
      systemState: await this.captureSystemState(storyId)
    };

    // Save rollback point
    const rollbackDir = 'backups/rollback-points';
    await fs.ensureDir(rollbackDir);
    
    const rollbackFile = path.join(rollbackDir, `${rollbackPoint.id}.json`);
    await fs.writeJSON(rollbackFile, rollbackPoint, { spaces: 2 });

    return rollbackPoint;
  }

  async captureSystemState(storyId) {
    // Capture relevant system state based on story
    const state = {
      timestamp: new Date().toISOString(),
      nodeVersion: process.version,
      packageJson: await this.safeReadJSON('package.json'),
      featureFlags: await this.safeReadJSON('config/feature-flags.yaml'),
      expansionPackConfig: await this.safeReadJSON('expansion-packs/bmad-data-practitioner/config.yaml')
    };

    // Story-specific state capture
    switch (storyId) {
      case 'story-1.2':
        state.pythonPackages = await this.capturePythonPackages();
        break;
      case 'story-1.3':
        state.duckdbFiles = await this.captureDuckDBFiles();
        break;
      case 'story-1.4':
        state.dbtProject = await this.captureDBTProject();
        break;
      // Add more cases as needed
    }

    return state;
  }

  // Utility Methods
  loadRollbackScripts() {
    const rollbackDir = 'tools/rollback';
    
    if (!fs.existsSync(rollbackDir)) {
      return;
    }

    const scripts = fs.readdirSync(rollbackDir)
      .filter(file => file.startsWith('rollback-story-') && file.endsWith('.sh'));

    scripts.forEach(script => {
      const storyMatch = script.match(/rollback-story-(\d+\.\d+)\.sh/);
      if (storyMatch) {
        const storyId = `story-${storyMatch[1]}`;
        this.rollbackScripts.set(storyId, path.join(rollbackDir, script));
      }
    });
  }

  async safeReadJSON(filePath) {
    try {
      return await fs.readJSON(filePath);
    } catch (error) {
      return null;
    }
  }

  async capturePythonPackages() {
    return new Promise((resolve) => {
      exec('pip list --format=json', (error, stdout) => {
        if (error) {
          resolve(null);
        } else {
          try {
            resolve(JSON.parse(stdout));
          } catch {
            resolve(null);
          }
        }
      });
    });
  }

  async captureDuckDBFiles() {
    try {
      const duckdbDir = '.duckdb';
      if (fs.existsSync(duckdbDir)) {
        return fs.readdirSync(duckdbDir);
      }
      return [];
    } catch {
      return [];
    }
  }

  async captureDBTProject() {
    try {
      const dbtProjectPath = 'dbt_project.yml';
      if (fs.existsSync(dbtProjectPath)) {
        return await fs.readFile(dbtProjectPath, 'utf8');
      }
      return null;
    } catch {
      return null;
    }
  }
}

module.exports = RollbackManager;
```

### 4. External Service Management Architecture

#### **External Service Registry**
```javascript
// tools/lib/external-service-manager.js
const yaml = require('js-yaml');
const fs = require('fs-extra');

class ExternalServiceManager {
  constructor(configPath = 'config/external-services.yaml') {
    this.configPath = configPath;
    this.services = new Map();
    this.credentials = new Map();
    this.loadConfiguration();
  }

  // Service Management
  async registerService(serviceName, config) {
    this.services.set(serviceName, {
      ...config,
      registeredAt: new Date().toISOString(),
      status: 'registered'
    });

    await this.saveConfiguration();
  }

  async validateService(serviceName) {
    const service = this.services.get(serviceName);
    if (!service) {
      return { valid: false, error: 'Service not registered' };
    }

    try {
      // Perform service-specific validation
      const validation = await this.performServiceValidation(serviceName, service);
      
      // Update service status
      service.status = validation.valid ? 'active' : 'error';
      service.lastValidated = new Date().toISOString();
      
      if (!validation.valid) {
        service.lastError = validation.error;
      }

      return validation;
      
    } catch (error) {
      service.status = 'error';
      service.lastError = error.message;
      
      return {
        valid: false,
        error: error.message
      };
    }
  }

  async performServiceValidation(serviceName, service) {
    switch (service.type) {
      case 'database':
        return await this.validateDatabaseConnection(service);
      
      case 'api':
        return await this.validateAPIAccess(service);
      
      case 'python_package':
        return await this.validatePythonPackage(service);
      
      case 'web_service':
        return await this.validateWebService(service);
      
      default:
        return { valid: true, message: 'No validation required' };
    }
  }

  // Service-Specific Validations
  async validateDatabaseConnection(service) {
    // Database connection validation logic
    const connectionString = this.getCredential(service.credentialKey);
    if (!connectionString) {
      return { valid: false, error: 'Database credentials not found' };
    }

    // Try to connect (implement based on database type)
    return { valid: true, message: 'Database connection successful' };
  }

  async validateAPIAccess(service) {
    const apiKey = this.getCredential(service.credentialKey);
    if (!apiKey) {
      return { valid: false, error: 'API key not found' };
    }

    // Test API endpoint
    try {
      const response = await fetch(service.testEndpoint, {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return {
        valid: response.ok,
        statusCode: response.status,
        message: response.ok ? 'API access successful' : 'API access failed'
      };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  async validatePythonPackage(service) {
    return new Promise((resolve) => {
      const { exec } = require('child_process');
      exec(`python -c "import ${service.packageName}"`, (error) => {
        resolve({
          valid: !error,
          error: error ? `Package ${service.packageName} not installed` : null,
          message: error ? null : `Package ${service.packageName} available`
        });
      });
    });
  }

  // Credential Management
  getCredential(credentialKey) {
    // First check environment variables
    const envValue = process.env[credentialKey];
    if (envValue) {
      return envValue;
    }

    // Check stored credentials (encrypted)
    return this.credentials.get(credentialKey);
  }

  setCredential(credentialKey, value, options = {}) {
    if (options.environment) {
      // Set as environment variable recommendation
      console.log(`Set environment variable: export ${credentialKey}="${value}"`);
    } else {
      // Store encrypted credential
      this.credentials.set(credentialKey, this.encryptCredential(value));
    }
  }

  encryptCredential(value) {
    // Simple encryption - would use proper encryption in production
    return Buffer.from(value).toString('base64');
  }

  decryptCredential(encryptedValue) {
    return Buffer.from(encryptedValue, 'base64').toString('utf8');
  }

  // Configuration Management
  loadConfiguration() {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, 'utf8');
        const config = yaml.load(content);
        
        if (config && config.services) {
          Object.entries(config.services).forEach(([key, value]) => {
            this.services.set(key, value);
          });
        }
      }
    } catch (error) {
      console.error('Error loading external services configuration:', error);
    }
  }

  async saveConfiguration() {
    try {
      const config = {
        services: Object.fromEntries(this.services),
        lastUpdated: new Date().toISOString()
      };

      const yamlContent = yaml.dump(config, { indent: 2 });
      await fs.ensureDir(path.dirname(this.configPath));
      await fs.writeFile(this.configPath, yamlContent, 'utf8');
    } catch (error) {
      console.error('Error saving external services configuration:', error);
    }
  }
}

module.exports = ExternalServiceManager;
```

### 5. Security Logging Architecture

#### **Security Logger**
```javascript
// tools/lib/security-logger.js
const fs = require('fs-extra');
const path = require('path');

class SecurityLogger {
  constructor(options = {}) {
    this.logDir = options.logDir || 'logs/security';
    this.maxLogSize = options.maxLogSize || 50 * 1024 * 1024; // 50MB
    this.maxLogFiles = options.maxLogFiles || 10;
    this.currentLogFile = null;
    
    this.setupLogDirectory();
  }

  async logSecurityEvent(eventType, data = {}) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType: eventType,
      data: data,
      process: process.pid,
      node_version: process.version
    };

    try {
      await this.writeLogEntry(logEntry);
      
      // Also log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[SECURITY] ${eventType}:`, data);
      }
      
    } catch (error) {
      console.error('Failed to write security log:', error);
    }
  }

  async writeLogEntry(logEntry) {
    const logFile = await this.getCurrentLogFile();
    const logLine = JSON.stringify(logEntry) + '\n';
    
    await fs.appendFile(logFile, logLine, 'utf8');
    
    // Check if log rotation is needed
    const stats = await fs.stat(logFile);
    if (stats.size > this.maxLogSize) {
      await this.rotateLogFile();
    }
  }

  async getCurrentLogFile() {
    if (!this.currentLogFile) {
      const date = new Date().toISOString().split('T')[0];
      this.currentLogFile = path.join(this.logDir, `security-${date}.log`);
    }
    
    return this.currentLogFile;
  }

  async rotateLogFile() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const currentFile = await this.getCurrentLogFile();
    const rotatedFile = currentFile.replace('.log', `-${timestamp}.log`);
    
    try {
      await fs.rename(currentFile, rotatedFile);
      this.currentLogFile = null; // Force new log file creation
      
      // Clean up old log files
      await this.cleanupOldLogs();
      
    } catch (error) {
      console.error('Failed to rotate log file:', error);
    }
  }

  async cleanupOldLogs() {
    try {
      const files = await fs.readdir(this.logDir);
      const logFiles = files
        .filter(file => file.startsWith('security-') && file.endsWith('.log'))
        .map(file => ({
          name: file,
          path: path.join(this.logDir, file),
          stat: fs.statSync(path.join(this.logDir, file))
        }))
        .sort((a, b) => b.stat.mtime - a.stat.mtime);

      // Keep only the most recent files
      const filesToDelete = logFiles.slice(this.maxLogFiles);
      
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
      }
      
    } catch (error) {
      console.error('Failed to cleanup old logs:', error);
    }
  }

  setupLogDirectory() {
    fs.ensureDirSync(this.logDir);
  }

  // Security Event Types
  static get Events() {
    return {
      AUTH_SUCCESS: 'auth_success',
      AUTH_FAILURE: 'auth_failure',
      AUTH_ERROR: 'auth_error',
      PERMISSION_DENIED: 'permission_denied',
      FEATURE_FLAG_CHANGED: 'feature_flag_changed',
      ROLLBACK_INITIATED: 'rollback_initiated',
      ROLLBACK_COMPLETED: 'rollback_completed',
      ROLLBACK_FAILED: 'rollback_failed',
      EXTERNAL_SERVICE_ERROR: 'external_service_error',
      CREDENTIAL_ACCESS: 'credential_access',
      SYSTEM_STATE_CHANGE: 'system_state_change'
    };
  }
}

module.exports = SecurityLogger;
```

This completes the detailed technical architecture for all security components. Each component is designed to work together cohesively while maintaining independence and following security best practices.