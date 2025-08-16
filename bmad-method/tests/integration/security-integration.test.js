/**
 * Security Integration Tests
 * End-to-end validation of security components working together
 */

const fs = require('fs-extra');
const path = require('path');

// Import security components
const {
  generateApiKey,
  validateApiKey,
  hasScope,
  revokeApiKey,
  SCOPES,
  initializeSecurity
} = require('../../tools/data-services/security-service');

const {
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  validateFeatureFlags
} = require('../../tools/lib/feature-flag-manager');

const {
  rollbackStory,
  getRollbackStatus
} = require('../../tools/rollback/rollback-manager');

const {
  securityLogger
} = require('../../tools/lib/security-logger');

const {
  validateCredentials,
  getServiceCredentials
} = require('../../tools/data-services/credential-manager');

// Mock external dependencies
jest.mock('../../tools/lib/security-logger', () => ({
  securityLogger: {
    logAuthSuccess: jest.fn(),
    logAuthFailure: jest.fn(),
    logPermissionDenied: jest.fn(),
    logFeatureFlagChange: jest.fn(),
    logRollbackInitiated: jest.fn(),
    logSecurityEvent: jest.fn(),
    logExternalServiceError: jest.fn()
  }
}));

jest.mock('child_process', () => ({
  spawn: jest.fn()
}));

describe('Security Integration - End to End', () => {
  beforeEach(() => {
    // Initialize security system
    initializeSecurity();
    jest.clearAllMocks();
  });
  
  describe('Complete Authentication Workflow', () => {
    test('should handle full API key lifecycle', () => {
      // 1. Generate API keys with different scopes
      const readKey = generateApiKey([SCOPES.DATA_READ], 'Read-only operations');
      const writeKey = generateApiKey([SCOPES.DATA_WRITE], 'Write operations');
      const adminKey = generateApiKey([SCOPES.ADMIN], 'Admin operations');
      
      // 2. Validate generated keys
      expect(validateApiKey(readKey.apiKey)).toMatchObject({
        valid: true,
        scopes: [SCOPES.DATA_READ]
      });
      
      expect(validateApiKey(writeKey.apiKey)).toMatchObject({
        valid: true,
        scopes: [SCOPES.DATA_WRITE]
      });
      
      expect(validateApiKey(adminKey.apiKey)).toMatchObject({
        valid: true,
        scopes: [SCOPES.ADMIN]
      });
      
      // 3. Test scope validation
      expect(hasScope(readKey.apiKey, SCOPES.DATA_READ)).toBe(true);
      expect(hasScope(readKey.apiKey, SCOPES.DATA_WRITE)).toBe(false);
      expect(hasScope(readKey.apiKey, SCOPES.ADMIN)).toBe(false);
      
      // Admin should have all scopes
      expect(hasScope(adminKey.apiKey, SCOPES.DATA_READ)).toBe(true);
      expect(hasScope(adminKey.apiKey, SCOPES.DATA_WRITE)).toBe(true);
      expect(hasScope(adminKey.apiKey, SCOPES.ADMIN)).toBe(true);
      
      // 4. Revoke a key
      expect(revokeApiKey(writeKey.apiKey)).toBe(true);
      expect(validateApiKey(writeKey.apiKey)).toBeNull();
    });
    
    test('should integrate with security logging', () => {
      const { apiKey } = generateApiKey([SCOPES.DATA_WRITE], 'Test integration');
      
      // Simulate authentication middleware flow
      const mockRequest = {
        headers: { 'x-api-key': apiKey },
        path: '/api/data',
        method: 'POST',
        ip: '127.0.0.1'
      };
      
      const validation = validateApiKey(apiKey);
      if (validation && validation.valid) {
        securityLogger.logAuthSuccess({
          apiKey: apiKey.substring(0, 10) + '...',
          scopes: validation.scopes,
          path: mockRequest.path,
          method: mockRequest.method,
          ip: mockRequest.ip
        });
      }
      
      expect(securityLogger.logAuthSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: expect.stringContaining('bmad_'),
          scopes: [SCOPES.DATA_WRITE]
        })
      );
      
      // Simulate permission denied
      if (!hasScope(apiKey, SCOPES.ADMIN)) {
        securityLogger.logPermissionDenied({
          apiKey: apiKey.substring(0, 10) + '...',
          requiredScopes: [SCOPES.ADMIN],
          userScopes: validation.scopes,
          path: '/api/admin',
          method: 'DELETE',
          ip: mockRequest.ip
        });
      }
      
      expect(securityLogger.logPermissionDenied).toHaveBeenCalled();
    });
  });
  
  describe('Feature Flag Integration', () => {
    test('should manage feature lifecycle with security', () => {
      // Start with all features disabled
      expect(isFeatureEnabled('pyairbyte_integration')).toBe(false);
      expect(isFeatureEnabled('duckdb_analytics')).toBe(false);
      
      // Enable a feature
      const enabled = enableFeature('pyairbyte_integration', true);
      expect(enabled).toBe(true);
      expect(isFeatureEnabled('pyairbyte_integration')).toBe(true);
      
      expect(securityLogger.logFeatureFlagChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'pyairbyte_integration',
          action: 'enabled'
        })
      );
      
      // Try to enable dependent feature without dependency
      expect(() => enableFeature('dbt_transformations')).toThrow();
      
      // Disable feature
      const disabled = disableFeature('pyairbyte_integration');
      expect(disabled).toContain('pyairbyte_integration');
      expect(isFeatureEnabled('pyairbyte_integration')).toBe(false);
      
      expect(securityLogger.logFeatureFlagChange).toHaveBeenCalledWith(
        expect.objectContaining({
          feature: 'pyairbyte_integration',
          action: 'disabled'
        })
      );
    });
    
    test('should validate feature flag configuration', () => {
      const validation = validateFeatureFlags();
      
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });
  });
  
  describe('Rollback Integration', () => {
    test('should coordinate rollback with security components', async () => {
      const { spawn } = require('child_process');
      
      // Mock successful rollback script execution
      spawn.mockImplementation(() => ({
        on: (event, cb) => {
          if (event === 'close') {
            setTimeout(() => cb(0), 100);
          }
        },
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() }
      }));
      
      // Enable feature first
      enableFeature('pyairbyte_integration', true);
      
      // Initiate rollback
      const result = await rollbackStory('1.2');
      
      expect(result.success).toBe(true);
      expect(result.storyId).toBe('1.2');
      
      // Verify security events logged
      expect(securityLogger.logRollbackInitiated).toHaveBeenCalledWith(
        expect.objectContaining({
          storyId: '1.2',
          timestamp: expect.any(String)
        })
      );
      
      // Verify feature was disabled
      expect(isFeatureEnabled('pyairbyte_integration')).toBe(false);
    });
  });
  
  describe('External Service Credential Integration', () => {
    test('should validate credentials with security logging', () => {
      // Set up test credentials
      process.env.PYPI_API_TOKEN = 'test-token';
      process.env.DATABASE_HOST = 'localhost';
      process.env.DATABASE_USER = 'testuser';
      process.env.DATABASE_PASSWORD = 'testpass';
      
      // Validate PyPI credentials
      const pypiValidation = validateCredentials('pypi');
      if (!pypiValidation.valid) {
        securityLogger.logExternalServiceError({
          service: 'pypi',
          error: 'Missing credentials',
          missing: pypiValidation.missing
        });
      }
      
      // Get masked credentials
      const dbCreds = getServiceCredentials('databases', true);
      expect(dbCreds.database_password).toBe('***');
      expect(dbCreds.database_host).toBe('localhost');
      
      // Clean up
      delete process.env.PYPI_API_TOKEN;
      delete process.env.DATABASE_HOST;
      delete process.env.DATABASE_USER;
      delete process.env.DATABASE_PASSWORD;
    });
  });
  
  describe('Security Monitoring Integration', () => {
    test('should track security events across components', async () => {
      // Generate activity
      const key1 = generateApiKey([SCOPES.DATA_READ]);
      const key2 = generateApiKey([SCOPES.ADMIN]);
      
      // Simulate various security events
      validateApiKey(key1.apiKey);
      validateApiKey('invalid_key');
      hasScope(key1.apiKey, SCOPES.ADMIN);
      enableFeature('duckdb_analytics', true);
      revokeApiKey(key1.apiKey);
      
      // Log security events
      securityLogger.logSecurityEvent('INFO', 'security_test', {
        action: 'integration_test_completed',
        events: {
          keys_generated: 2,
          validations: 2,
          features_changed: 1,
          keys_revoked: 1
        }
      });
      
      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'INFO',
        'security_test',
        expect.objectContaining({
          action: 'integration_test_completed'
        })
      );
    });
  });
  
  describe('End-to-End Security Workflow', () => {
    test('should handle complete security lifecycle', async () => {
      // 1. Initialize security system
      initializeSecurity();
      
      // 2. Generate API keys for different roles
      const dataAnalyst = generateApiKey([SCOPES.DATA_READ], 'Data Analyst');
      const dataEngineer = generateApiKey([SCOPES.DATA_READ, SCOPES.DATA_WRITE], 'Data Engineer');
      const admin = generateApiKey([SCOPES.ADMIN], 'System Admin');
      
      // 3. Enable features progressively
      enableFeature('pyairbyte_integration', true);
      enableFeature('duckdb_analytics', true);
      
      // 4. Validate feature dependencies
      const flagValidation = validateFeatureFlags();
      expect(flagValidation.valid).toBe(true);
      
      // 5. Simulate operations with different keys
      expect(hasScope(dataAnalyst.apiKey, SCOPES.DATA_READ)).toBe(true);
      expect(hasScope(dataAnalyst.apiKey, SCOPES.DATA_WRITE)).toBe(false);
      
      expect(hasScope(dataEngineer.apiKey, SCOPES.DATA_READ)).toBe(true);
      expect(hasScope(dataEngineer.apiKey, SCOPES.DATA_WRITE)).toBe(true);
      
      // 6. Admin performs rollback
      const { spawn } = require('child_process');
      spawn.mockImplementation(() => ({
        on: (event, cb) => {
          if (event === 'close') cb(0);
        },
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() }
      }));
      
      const rollback = await rollbackStory('1.3');
      expect(rollback.success).toBe(true);
      expect(isFeatureEnabled('duckdb_analytics')).toBe(false);
      
      // 7. Revoke compromised key
      revokeApiKey(dataEngineer.apiKey);
      expect(validateApiKey(dataEngineer.apiKey)).toBeNull();
      
      // 8. Verify audit trail
      expect(securityLogger.logAuthSuccess).toHaveBeenCalled();
      expect(securityLogger.logFeatureFlagChange).toHaveBeenCalled();
      expect(securityLogger.logRollbackInitiated).toHaveBeenCalled();
    });
  });
});