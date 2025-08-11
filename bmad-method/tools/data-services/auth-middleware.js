/**
 * Authentication Middleware Integration
 * Provides Express middleware for data service authentication
 */

const { validateApiKey, hasScope, SCOPES } = require('./security-service');
const { securityLogger } = require('../lib/security-logger');

/**
 * Extract API key from request
 * @param {Object} req - Express request object
 * @returns {string|null} API key or null
 */
function extractApiKey(req) {
  // Check x-api-key header first
  if (req.headers['x-api-key']) {
    return req.headers['x-api-key'];
  }
  
  // Check Authorization header
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check query parameter (for webhooks/callbacks only)
  if (req.query.api_key && req.path.includes('/callback')) {
    return req.query.api_key;
  }
  
  return null;
}

/**
 * Basic authentication middleware
 * Validates API key but doesn't check specific scopes
 */
function authenticate(req, res, next) {
  const apiKey = extractApiKey(req);
  
  if (!apiKey) {
    securityLogger.logAuthFailure({
      reason: 'missing_api_key',
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please provide a valid API key'
    });
  }
  
  const validation = validateApiKey(apiKey);
  if (!validation || !validation.valid) {
    securityLogger.logAuthFailure({
      reason: 'invalid_api_key',
      apiKey: apiKey.substring(0, 10) + '...',
      ip: req.ip,
      path: req.path,
      method: req.method
    });
    
    return res.status(401).json({
      error: 'Invalid API key',
      message: 'The provided API key is invalid or has been revoked'
    });
  }
  
  // Attach auth info to request
  req.auth = {
    apiKey,
    scopes: validation.scopes,
    description: validation.description
  };
  
  securityLogger.logAuthSuccess({
    apiKey: apiKey.substring(0, 10) + '...',
    scopes: validation.scopes,
    ip: req.ip,
    path: req.path,
    method: req.method
  });
  
  next();
}

/**
 * Create scope-based authorization middleware
 * @param {string|string[]} requiredScopes - Required scope(s)
 * @returns {Function} Express middleware
 */
function authorize(requiredScopes) {
  const scopes = Array.isArray(requiredScopes) ? requiredScopes : [requiredScopes];
  
  return (req, res, next) => {
    // Ensure authenticated first
    if (!req.auth || !req.auth.apiKey) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'This endpoint requires authentication'
      });
    }
    
    // Check if user has any of the required scopes
    const hasRequiredScope = scopes.some(scope => 
      hasScope(req.auth.apiKey, scope)
    );
    
    if (!hasRequiredScope) {
      securityLogger.logPermissionDenied({
        apiKey: req.auth.apiKey.substring(0, 10) + '...',
        requiredScopes: scopes,
        userScopes: req.auth.scopes,
        ip: req.ip,
        path: req.path,
        method: req.method
      });
      
      return res.status(403).json({
        error: 'Insufficient permissions',
        message: `This endpoint requires one of: ${scopes.join(', ')}`,
        userScopes: req.auth.scopes
      });
    }
    
    next();
  };
}

/**
 * Rate limiting middleware
 * Simple in-memory rate limiting for MVP
 */
const rateLimitStore = new Map();

function rateLimit(options = {}) {
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
  const max = options.max || 100;
  
  return (req, res, next) => {
    const key = req.auth?.apiKey || req.ip;
    const now = Date.now();
    
    // Clean up old entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k);
      }
    }
    
    // Get or create rate limit entry
    let entry = rateLimitStore.get(key);
    if (!entry || entry.resetTime < now) {
      entry = {
        count: 0,
        resetTime: now + windowMs
      };
      rateLimitStore.set(key, entry);
    }
    
    entry.count++;
    
    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', max);
    res.setHeader('X-RateLimit-Remaining', Math.max(0, max - entry.count));
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());
    
    if (entry.count > max) {
      securityLogger.logRateLimitExceeded({
        key,
        count: entry.count,
        limit: max,
        ip: req.ip,
        path: req.path
      });
      
      return res.status(429).json({
        error: 'Too many requests',
        message: `Rate limit exceeded. Please wait until ${new Date(entry.resetTime).toISOString()}`
      });
    }
    
    next();
  };
}

/**
 * Security headers middleware
 */
function securityHeaders(req, res, next) {
  // Basic security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  
  // API-specific headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Response-Time', Date.now());
  
  next();
}

/**
 * CORS middleware for data services
 */
function cors(options = {}) {
  const origins = options.origins || ['http://localhost:3000'];
  
  return (req, res, next) => {
    const origin = req.headers.origin;
    
    if (origins.includes(origin) || origins.includes('*')) {
      res.setHeader('Access-Control-Allow-Origin', origin || '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
      res.setHeader('Access-Control-Max-Age', '86400');
    }
    
    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }
    
    next();
  };
}

// Convenience aliases for compatibility
const verifyApiKey = authenticate;
const requireScope = (scope) => [authenticate, authorize(scope)];

// Export all middleware
module.exports = {
  authenticate,
  authorize,
  rateLimit,
  securityHeaders,
  cors,
  verifyApiKey,
  requireScope,
  SCOPES
};