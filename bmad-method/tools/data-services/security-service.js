/**
 * Security Service - MVP API Key Authentication System
 * Provides header-based API key validation with scope-based permissions
 */

const crypto = require('crypto');
const { securityLogger } = require('../lib/security-logger');

// Permission scopes for data services
const SCOPES = {
  DATA_READ: 'data_read',
  DATA_WRITE: 'data_write',
  ADMIN: 'admin'
};

// In-memory API key storage (MVP approach)
// In production, this would be backed by a database
const apiKeyStore = new Map();

/**
 * Generate a new API key with specified scopes
 * @param {string[]} scopes - Array of permission scopes
 * @param {string} description - Description for the API key
 * @returns {Object} Generated API key info
 */
function generateApiKey(scopes = [SCOPES.DATA_READ], description = '') {
  const apiKey = `bmad_${crypto.randomBytes(32).toString('hex')}`;
  const keyInfo = {
    key: apiKey,
    scopes,
    description,
    createdAt: new Date().toISOString(),
    lastUsed: null,
    usageCount: 0
  };
  
  apiKeyStore.set(apiKey, keyInfo);
  return { apiKey, scopes, description };
}

/**
 * Validate an API key from request headers
 * @param {string} apiKey - The API key to validate
 * @returns {Object|null} Key info if valid, null if invalid
 */
function validateApiKey(apiKey) {
  if (!apiKey || !apiKey.startsWith('bmad_')) {
    return null;
  }
  
  const keyInfo = apiKeyStore.get(apiKey);
  if (!keyInfo) {
    return null;
  }
  
  // Update usage statistics
  keyInfo.lastUsed = new Date().toISOString();
  keyInfo.usageCount++;
  
  // Log successful authentication
  securityLogger.logAuthSuccess({
    apiKey: apiKey.substring(0, 12) + '...', // Partial key for security
    scopes: keyInfo.scopes,
    description: keyInfo.description,
    usageCount: keyInfo.usageCount
  });
  
  return {
    valid: true,
    scopes: keyInfo.scopes,
    description: keyInfo.description
  };
}

/**
 * Check if an API key has a specific scope
 * @param {string} apiKey - The API key to check
 * @param {string} requiredScope - The scope to check for
 * @returns {boolean} True if key has the scope
 */
function hasScope(apiKey, requiredScope) {
  const validation = validateApiKey(apiKey);
  if (!validation || !validation.valid) {
    return false;
  }
  
  return validation.scopes.includes(requiredScope) || 
         validation.scopes.includes(SCOPES.ADMIN);
}

/**
 * Express middleware for API key authentication
 * @param {string} requiredScope - Required scope for the endpoint
 * @returns {Function} Express middleware function
 */
function requireAuth(requiredScope = SCOPES.DATA_READ) {
  return (req, res, next) => {
    const apiKey = req.headers['x-api-key'] || req.headers['authorization']?.replace('Bearer ', '');
    
    if (!apiKey) {
      return res.status(401).json({
        error: 'Missing API key',
        message: 'Please provide API key in x-api-key header or Authorization: Bearer header'
      });
    }
    
    const validation = validateApiKey(apiKey);
    if (!validation || !validation.valid) {
      return res.status(401).json({
        error: 'Invalid API key',
        message: 'The provided API key is invalid or expired'
      });
    }
    
    if (!hasScope(apiKey, requiredScope)) {
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This endpoint requires ${requiredScope} scope`,
        userScopes: validation.scopes
      });
    }
    
    // Attach auth info to request
    req.auth = {
      apiKey,
      scopes: validation.scopes,
      description: validation.description
    };
    
    next();
  };
}

/**
 * List all API keys (admin only)
 * @returns {Array} Array of API key summaries
 */
function listApiKeys() {
  const keys = [];
  for (const [key, info] of apiKeyStore.entries()) {
    keys.push({
      key: key.substring(0, 11) + '...',  // Show partial key only (bmad_xxxxxx...)
      scopes: info.scopes,
      description: info.description,
      createdAt: info.createdAt,
      lastUsed: info.lastUsed,
      usageCount: info.usageCount
    });
  }
  return keys;
}

/**
 * Revoke an API key
 * @param {string} apiKey - The API key to revoke
 * @returns {boolean} True if revoked, false if not found
 */
function revokeApiKey(apiKey) {
  return apiKeyStore.delete(apiKey);
}

/**
 * Initialize security service with environment variables
 */
function initializeSecurity() {
  // Load API keys from environment if provided
  const envApiKeys = process.env.BMAD_API_KEYS;
  if (envApiKeys) {
    try {
      const keys = JSON.parse(envApiKeys);
      keys.forEach(keyConfig => {
        apiKeyStore.set(keyConfig.key, {
          ...keyConfig,
          createdAt: keyConfig.createdAt || new Date().toISOString(),
          lastUsed: null,
          usageCount: 0
        });
      });
      console.log(`Loaded ${keys.length} API keys from environment`);
    } catch (error) {
      console.error('Failed to parse BMAD_API_KEYS:', error.message);
    }
  }
  
  // Create a default admin key if none exist (development only)
  if (apiKeyStore.size === 0 && process.env.NODE_ENV !== 'production') {
    const adminKey = generateApiKey([SCOPES.ADMIN], 'Default admin key (dev only)');
    console.log('Generated default admin API key:', adminKey.apiKey);
  }
}

// Export for testing
const _testing = {
  apiKeyStore,
  clearKeys: () => apiKeyStore.clear()
};

// Export all functions and constants
module.exports = {
  SCOPES,
  generateApiKey,
  validateApiKey,
  hasScope,
  requireAuth,
  listApiKeys,
  revokeApiKey,
  initializeSecurity,
  _testing
};