/**
 * Feature Flag System Tests
 * Validates feature flag functionality and dependency management
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const {
  loadFeatureFlags,
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  getAllFeatureStatuses,
  validateFeatureFlags,
  requireFeature,
  _testing
} = require('../../tools/lib/feature-flag-manager');

// Mock the security logger
jest.mock('../../tools/lib/security-logger', () => ({
  securityLogger: {
    logFeatureFlagChange: jest.fn()
  }
}));

describe('Feature Flag Manager', () => {
  const testFlagsPath = path.join(__dirname, 'test-feature-flags.yaml');
  
  const testFlags = {
    features: {
      feature_a: {
        enabled: false,
        description: 'Feature A',
        dependencies: []
      },
      feature_b: {
        enabled: false,
        description: 'Feature B',
        dependencies: ['feature_a']
      },
      feature_c: {
        enabled: false,
        description: 'Feature C',
        dependencies: ['feature_b']
      },
      feature_d: {
        enabled: true,
        description: 'Feature D',
        dependencies: []
      }
    },
    metadata: {
      version: '1.0.0',
      environment: 'test'
    },
    safety: {
      require_explicit_enable: true,
      disable_on_error: true
    }
  };
  
  beforeEach(() => {
    // Clear cache
    _testing.clearCache();
    
    // Create test flags file
    fs.writeFileSync(testFlagsPath, yaml.dump(testFlags));
    
    // Mock file reading to use test file
    jest.spyOn(fs, 'readFileSync').mockImplementation((file) => {
      if (file.includes('feature-flags.yaml')) {
        return fs.readFileSync(testFlagsPath, 'utf8');
      }
      return fs.readFileSync(file, 'utf8');
    });
  });
  
  afterEach(() => {
    // Clean up
    if (fs.existsSync(testFlagsPath)) {
      fs.unlinkSync(testFlagsPath);
    }
    jest.restoreAllMocks();
  });
  
  describe('Feature Flag Loading', () => {
    test('should load feature flags from file', () => {
      const flags = loadFeatureFlags();
      
      expect(flags).toBeDefined();
      expect(flags.features).toBeDefined();
      expect(Object.keys(flags.features)).toHaveLength(4);
    });
    
    test('should return safe defaults on error', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const flags = loadFeatureFlags();
      
      expect(flags.features).toEqual({});
      expect(flags.safety.require_explicit_enable).toBe(true);
    });
    
    test('should cache loaded flags', () => {
      const spy = jest.spyOn(fs, 'readFileSync');
      
      loadFeatureFlags();
      isFeatureEnabled('feature_a');
      isFeatureEnabled('feature_b');
      
      // Should only read once due to caching
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });
  
  describe('Feature Enabled Checking', () => {
    test('should return false for disabled features', () => {
      expect(isFeatureEnabled('feature_a')).toBe(false);
      expect(isFeatureEnabled('feature_b')).toBe(false);
    });
    
    test('should return true for enabled features', () => {
      expect(isFeatureEnabled('feature_d')).toBe(true);
    });
    
    test('should return false for unknown features', () => {
      expect(isFeatureEnabled('unknown_feature')).toBe(false);
    });
    
    test('should check dependencies recursively', () => {
      // Enable feature_a but not its dependency
      _testing.setFlags({
        features: {
          feature_a: { enabled: false, dependencies: [] },
          feature_b: { enabled: true, dependencies: ['feature_a'] }
        }
      });
      
      expect(isFeatureEnabled('feature_b')).toBe(false);
    });
    
    test('should handle circular dependencies gracefully', () => {
      _testing.setFlags({
        features: {
          feature_x: { enabled: true, dependencies: ['feature_y'] },
          feature_y: { enabled: true, dependencies: ['feature_x'] }
        }
      });
      
      // Should not cause infinite loop
      expect(() => isFeatureEnabled('feature_x')).not.toThrow();
    });
  });
  
  describe('Feature Enabling', () => {
    test('should enable feature without dependencies', () => {
      const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      expect(enableFeature('feature_a')).toBe(true);
      expect(mockWrite).toHaveBeenCalled();
    });
    
    test('should fail to enable feature with missing dependencies', () => {
      expect(() => enableFeature('feature_b')).toThrow(
        'Cannot enable feature_b. Missing dependencies: feature_a'
      );
    });
    
    test('should enable feature with force flag', () => {
      const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      expect(enableFeature('feature_b', true)).toBe(true);
      expect(mockWrite).toHaveBeenCalled();
    });
    
    test('should enable feature when dependencies are met', () => {
      const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      // First enable dependency
      _testing.setFlags({
        features: {
          feature_a: { enabled: true, dependencies: [] },
          feature_b: { enabled: false, dependencies: ['feature_a'] }
        }
      });
      
      expect(enableFeature('feature_b')).toBe(true);
    });
    
    test('should throw for unknown features', () => {
      expect(() => enableFeature('unknown_feature')).toThrow(
        'Unknown feature: unknown_feature'
      );
    });
  });
  
  describe('Feature Disabling', () => {
    test('should disable single feature', () => {
      const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      const disabled = disableFeature('feature_d', false);
      
      expect(disabled).toEqual(['feature_d']);
      expect(mockWrite).toHaveBeenCalled();
    });
    
    test('should cascade disable dependent features', () => {
      const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      _testing.setFlags({
        features: {
          feature_a: { enabled: true, dependencies: [] },
          feature_b: { enabled: true, dependencies: ['feature_a'] },
          feature_c: { enabled: true, dependencies: ['feature_b'] }
        }
      });
      
      const disabled = disableFeature('feature_a', true);
      
      expect(disabled).toEqual(['feature_a', 'feature_b', 'feature_c']);
    });
    
    test('should not cascade when disabled', () => {
      const mockWrite = jest.spyOn(fs, 'writeFileSync').mockImplementation();
      
      _testing.setFlags({
        features: {
          feature_a: { enabled: true, dependencies: [] },
          feature_b: { enabled: true, dependencies: ['feature_a'] }
        }
      });
      
      const disabled = disableFeature('feature_a', false);
      
      expect(disabled).toEqual(['feature_a']);
    });
  });
  
  describe('Feature Status Reporting', () => {
    test('should get all feature statuses', () => {
      const statuses = getAllFeatureStatuses();
      
      expect(Object.keys(statuses)).toHaveLength(4);
      expect(statuses.feature_a).toMatchObject({
        enabled: false,
        description: 'Feature A',
        dependencies: []
      });
    });
    
    test('should reflect dependency-based disabling', () => {
      _testing.setFlags({
        features: {
          feature_a: { enabled: false, dependencies: [] },
          feature_b: { enabled: true, dependencies: ['feature_a'] }
        }
      });
      
      const statuses = getAllFeatureStatuses();
      
      expect(statuses.feature_b.enabled).toBe(false);
      expect(statuses.feature_b.explicitlyEnabled).toBe(true);
    });
  });
  
  describe('Feature Flag Validation', () => {
    test('should validate correct configuration', () => {
      const result = validateFeatureFlags();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
    
    test('should detect circular dependencies', () => {
      _testing.setFlags({
        features: {
          feature_x: { enabled: true, dependencies: ['feature_y'] },
          feature_y: { enabled: true, dependencies: ['feature_x'] }
        }
      });
      
      const result = validateFeatureFlags();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringMatching(/Circular dependency/)
      );
    });
    
    test('should detect unknown dependencies', () => {
      _testing.setFlags({
        features: {
          feature_a: { enabled: true, dependencies: ['feature_unknown'] }
        }
      });
      
      const result = validateFeatureFlags();
      
      expect(result.valid).toBe(false);
      expect(result.errors).toContain(
        expect.stringMatching(/depends on unknown feature/)
      );
    });
    
    test('should warn about missing metadata', () => {
      _testing.setFlags({
        features: {},
        metadata: {}
      });
      
      const result = validateFeatureFlags();
      
      expect(result.warnings).toContain(
        expect.stringMatching(/Missing metadata.version/)
      );
    });
  });
  
  describe('Feature Requirements', () => {
    test('should create working feature guard', () => {
      _testing.setFlags({
        features: {
          test_feature: { enabled: true, dependencies: [] }
        }
      });
      
      const guard = requireFeature('test_feature');
      expect(() => guard()).not.toThrow();
    });
    
    test('should throw when feature disabled', () => {
      _testing.setFlags({
        features: {
          test_feature: { enabled: false, dependencies: [] }
        }
      });
      
      const guard = requireFeature('test_feature');
      expect(() => guard()).toThrow(
        expect.objectContaining({
          message: expect.stringContaining('test_feature')
        })
      );
    });
  });
});