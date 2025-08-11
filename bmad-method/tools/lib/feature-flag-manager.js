/**
 * Feature Flag Manager
 * Runtime feature flag checking and management for progressive rollout
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { securityLogger } = require('./security-logger');

// Default feature flags file location
const DEFAULT_FLAGS_FILE = path.join(__dirname, '../../config/feature-flags.yaml');

// In-memory cache of feature flags
let featureFlags = null;
let lastLoadTime = null;
let isLoading = false; // Prevent recursive loading
const CACHE_TTL = 60000; // 1 minute cache

/**
 * Load feature flags from YAML file
 * @param {string} flagsFile - Path to feature flags file
 * @returns {Object} Feature flags configuration
 */
function loadFeatureFlags(flagsFile = DEFAULT_FLAGS_FILE) {
  try {
    const content = fs.readFileSync(flagsFile, 'utf8');
    const config = yaml.load(content);
    
    featureFlags = config;
    lastLoadTime = Date.now();
    
    return config;
  } catch (error) {
    console.error(`Failed to load feature flags from ${flagsFile}:`, error.message);
    
    // Return safe defaults on error and cache them
    const safeDefaults = {
      features: {},
      metadata: { version: '0.0.0', environment: 'error' },
      safety: { require_explicit_enable: true, disable_on_error: true }
    };
    
    featureFlags = safeDefaults;
    lastLoadTime = Date.now();
    
    return safeDefaults;
  }
}

/**
 * Get current feature flags, loading if needed
 * @returns {Object} Feature flags configuration
 */
function getFeatureFlags() {
  // Prevent recursive loading
  if (isLoading) {
    return featureFlags || { features: {}, metadata: { version: '0.0.0' }, safety: {} };
  }
  
  // Reload if cache expired or not loaded
  if (!featureFlags || !lastLoadTime || (Date.now() - lastLoadTime > CACHE_TTL)) {
    isLoading = true;
    loadFeatureFlags();
    isLoading = false;
  }
  
  return featureFlags;
}

/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @param {Set} visited - Set of visited features to prevent circular dependencies
 * @returns {boolean} True if feature is enabled
 */
function isFeatureEnabled(featureName, visited = new Set()) {
  // Prevent circular dependencies
  if (visited.has(featureName)) {
    console.warn(`Circular dependency detected for feature: ${featureName}`);
    return false;
  }
  
  const flags = getFeatureFlags();
  
  if (!flags || !flags.features || !flags.features[featureName]) {
    // Unknown features are disabled by default
    return false;
  }
  
  const feature = flags.features[featureName];
  
  // Check if explicitly enabled
  if (!feature.enabled) {
    return false;
  }
  
  // Check dependencies with circular dependency protection
  if (feature.dependencies && feature.dependencies.length > 0) {
    visited.add(featureName);
    for (const dep of feature.dependencies) {
      if (!isFeatureEnabled(dep, visited)) {
        console.warn(`Feature ${featureName} disabled due to missing dependency: ${dep}`);
        visited.delete(featureName);
        return false;
      }
    }
    visited.delete(featureName);
  }
  
  return true;
}

/**
 * Enable a feature
 * @param {string} featureName - Name of the feature to enable
 * @param {boolean} force - Force enable even with missing dependencies
 * @returns {boolean} True if successfully enabled
 */
function enableFeature(featureName, force = false) {
  const flags = getFeatureFlags();
  
  if (!flags.features[featureName]) {
    throw new Error(`Unknown feature: ${featureName}`);
  }
  
  const feature = flags.features[featureName];
  
  // Check dependencies unless forced
  if (!force && feature.dependencies && feature.dependencies.length > 0) {
    const missingDeps = feature.dependencies.filter(dep => !isFeatureEnabled(dep));
    if (missingDeps.length > 0) {
      throw new Error(
        `Cannot enable ${featureName}. Missing dependencies: ${missingDeps.join(', ')}`
      );
    }
  }
  
  // Update feature flag
  feature.enabled = true;
  
  // Save to file
  saveFeatureFlags(flags);
  
  // Log the change
  securityLogger.logFeatureFlagChange({
    feature: featureName,
    action: 'enabled',
    force,
    timestamp: new Date().toISOString()
  });
  
  return true;
}

/**
 * Disable a feature
 * @param {string} featureName - Name of the feature to disable
 * @param {boolean} cascade - Also disable dependent features
 * @returns {string[]} List of disabled features
 */
function disableFeature(featureName, cascade = true) {
  const flags = getFeatureFlags();
  
  if (!flags.features[featureName]) {
    throw new Error(`Unknown feature: ${featureName}`);
  }
  
  const disabledFeatures = [featureName];
  
  // Disable the feature
  flags.features[featureName].enabled = false;
  
  // Find and disable dependent features if cascading
  if (cascade) {
    for (const [name, feature] of Object.entries(flags.features)) {
      if (feature.dependencies && feature.dependencies.includes(featureName)) {
        if (feature.enabled) {
          feature.enabled = false;
          disabledFeatures.push(name);
        }
      }
    }
  }
  
  // Save to file
  saveFeatureFlags(flags);
  
  // Log the changes
  disabledFeatures.forEach(feature => {
    securityLogger.logFeatureFlagChange({
      feature,
      action: 'disabled',
      cascade,
      timestamp: new Date().toISOString()
    });
  });
  
  return disabledFeatures;
}

/**
 * Save feature flags to file
 * @param {Object} flags - Feature flags configuration
 */
function saveFeatureFlags(flags) {
  try {
    // Ensure metadata exists
    if (!flags.metadata) {
      flags.metadata = {};
    }
    
    // Update metadata
    flags.metadata.last_modified = new Date().toISOString();
    
    // Convert to YAML
    const yamlContent = yaml.dump(flags, {
      indent: 2,
      lineWidth: 80,
      noRefs: true
    });
    
    // Write to file
    fs.writeFileSync(DEFAULT_FLAGS_FILE, yamlContent, 'utf8');
    
    // Clear cache to force reload
    featureFlags = null;
    lastLoadTime = null;
  } catch (error) {
    console.error('Failed to save feature flags:', error.message);
    throw error;
  }
}

/**
 * Get all feature statuses
 * @returns {Object} Map of feature names to their status
 */
function getAllFeatureStatuses() {
  const flags = getFeatureFlags();
  const statuses = {};
  
  for (const [name, feature] of Object.entries(flags.features)) {
    statuses[name] = {
      enabled: isFeatureEnabled(name),
      description: feature.description,
      dependencies: feature.dependencies || [],
      explicitlyEnabled: feature.enabled
    };
  }
  
  return statuses;
}

/**
 * Validate feature flag configuration
 * @returns {Object} Validation result
 */
function validateFeatureFlags() {
  const flags = getFeatureFlags();
  const errors = [];
  const warnings = [];
  
  // Check for circular dependencies
  const visited = new Set();
  const recursionStack = new Set();
  
  function checkCircular(featureName) {
    if (recursionStack.has(featureName)) {
      errors.push(`Circular dependency detected involving ${featureName}`);
      return;
    }
    
    if (visited.has(featureName)) {
      return;
    }
    
    visited.add(featureName);
    recursionStack.add(featureName);
    
    const feature = flags.features[featureName];
    if (feature && feature.dependencies) {
      for (const dep of feature.dependencies) {
        if (!flags.features[dep]) {
          errors.push(`Feature ${featureName} depends on unknown feature ${dep}`);
        } else {
          checkCircular(dep);
        }
      }
    }
    
    recursionStack.delete(featureName);
  }
  
  // Check all features
  for (const featureName of Object.keys(flags.features)) {
    checkCircular(featureName);
  }
  
  // Check for missing metadata
  if (!flags.metadata || !flags.metadata.version) {
    warnings.push('Missing metadata.version in feature flags');
  }
  
  // Check safety settings
  if (!flags.safety || !flags.safety.require_explicit_enable) {
    warnings.push('Safety setting require_explicit_enable is not true');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Create a feature flag guard for use in code
 * @param {string} featureName - Name of the feature
 * @returns {Function} Guard function that throws if feature disabled
 */
function requireFeature(featureName) {
  return () => {
    if (!isFeatureEnabled(featureName)) {
      throw new Error(
        `Feature '${featureName}' is not enabled. ` +
        `Enable it using: bmad enable-feature ${featureName}`
      );
    }
  };
}

/**
 * Express middleware for feature flag checking
 * @param {string} featureName - Required feature
 * @returns {Function} Express middleware
 */
function requireFeatureMiddleware(featureName) {
  return (req, res, next) => {
    if (!isFeatureEnabled(featureName)) {
      return res.status(503).json({
        error: 'Feature not available',
        message: `The feature '${featureName}' is currently disabled`,
        feature: featureName
      });
    }
    next();
  };
}

// Export for testing
const _testing = {
  clearCache: () => {
    featureFlags = null;
    lastLoadTime = null;
  },
  setFlags: (flags) => {
    featureFlags = flags;
    lastLoadTime = Date.now();
  }
};

// Export all functions
module.exports = {
  loadFeatureFlags,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  getAllFeatureStatuses,
  validateFeatureFlags,
  requireFeature,
  requireFeatureMiddleware,
  _testing
};