/**
 * Authentication Service Tests
 * Validates API key generation, validation, and scope checking
 */

const {
  generateApiKey,
  validateApiKey,
  hasScope,
  revokeApiKey,
  listApiKeys,
  initializeSecurity,
  SCOPES,
  _testing
} = require('../../tools/data-services/security-service');

describe('Security Service - Authentication', () => {
  beforeEach(() => {
    // Clear all keys before each test
    _testing.clearKeys();
  });
  
  afterEach(() => {
    // Clean up after each test
    _testing.clearKeys();
  });
  
  describe('API Key Generation', () => {
    test('should generate valid API key with default scope', () => {
      const result = generateApiKey();
      
      expect(result.apiKey).toBeDefined();
      expect(result.apiKey).toMatch(/^bmad_[a-f0-9]{64}$/);
      expect(result.scopes).toEqual([SCOPES.DATA_READ]);
      expect(result.description).toBe('');
    });
    
    test('should generate API key with custom scopes', () => {
      const scopes = [SCOPES.DATA_READ, SCOPES.DATA_WRITE];
      const result = generateApiKey(scopes, 'Test key');
      
      expect(result.apiKey).toMatch(/^bmad_/);
      expect(result.scopes).toEqual(scopes);
      expect(result.description).toBe('Test key');
    });
    
    test('should generate unique API keys', () => {
      const key1 = generateApiKey();
      const key2 = generateApiKey();
      
      expect(key1.apiKey).not.toBe(key2.apiKey);
    });
    
    test('should store generated keys', () => {
      const result = generateApiKey();
      const stored = _testing.apiKeyStore.get(result.apiKey);
      
      expect(stored).toBeDefined();
      expect(stored.scopes).toEqual([SCOPES.DATA_READ]);
      expect(stored.createdAt).toBeDefined();
      expect(stored.lastUsed).toBeNull();
      expect(stored.usageCount).toBe(0);
    });
  });
  
  describe('API Key Validation', () => {
    test('should validate correct API key', () => {
      const { apiKey } = generateApiKey([SCOPES.DATA_WRITE], 'Test');
      const validation = validateApiKey(apiKey);
      
      expect(validation).toBeDefined();
      expect(validation.valid).toBe(true);
      expect(validation.scopes).toEqual([SCOPES.DATA_WRITE]);
      expect(validation.description).toBe('Test');
    });
    
    test('should reject invalid API key', () => {
      const validation = validateApiKey('invalid_key');
      
      expect(validation).toBeNull();
    });
    
    test('should reject malformed API key', () => {
      expect(validateApiKey('')).toBeNull();
      expect(validateApiKey(null)).toBeNull();
      expect(validateApiKey(undefined)).toBeNull();
      expect(validateApiKey('not_bmad_prefix')).toBeNull();
    });
    
    test('should update usage statistics on validation', () => {
      const { apiKey } = generateApiKey();
      
      // First validation
      validateApiKey(apiKey);
      let stored = _testing.apiKeyStore.get(apiKey);
      expect(stored.usageCount).toBe(1);
      expect(stored.lastUsed).not.toBeNull();
      
      // Second validation
      validateApiKey(apiKey);
      stored = _testing.apiKeyStore.get(apiKey);
      expect(stored.usageCount).toBe(2);
    });
  });
  
  describe('Scope Checking', () => {
    test('should validate scope correctly', () => {
      const { apiKey } = generateApiKey([SCOPES.DATA_READ]);
      
      expect(hasScope(apiKey, SCOPES.DATA_READ)).toBe(true);
      expect(hasScope(apiKey, SCOPES.DATA_WRITE)).toBe(false);
      expect(hasScope(apiKey, SCOPES.ADMIN)).toBe(false);
    });
    
    test('should grant all scopes to admin keys', () => {
      const { apiKey } = generateApiKey([SCOPES.ADMIN]);
      
      expect(hasScope(apiKey, SCOPES.DATA_READ)).toBe(true);
      expect(hasScope(apiKey, SCOPES.DATA_WRITE)).toBe(true);
      expect(hasScope(apiKey, SCOPES.ADMIN)).toBe(true);
    });
    
    test('should handle multiple scopes', () => {
      const { apiKey } = generateApiKey([SCOPES.DATA_READ, SCOPES.DATA_WRITE]);
      
      expect(hasScope(apiKey, SCOPES.DATA_READ)).toBe(true);
      expect(hasScope(apiKey, SCOPES.DATA_WRITE)).toBe(true);
      expect(hasScope(apiKey, SCOPES.ADMIN)).toBe(false);
    });
    
    test('should return false for invalid keys', () => {
      expect(hasScope('invalid_key', SCOPES.DATA_READ)).toBe(false);
      expect(hasScope(null, SCOPES.DATA_READ)).toBe(false);
    });
  });
  
  describe('API Key Management', () => {
    test('should list API keys with partial key only', () => {
      generateApiKey([SCOPES.DATA_READ], 'Read key');
      generateApiKey([SCOPES.ADMIN], 'Admin key');
      
      const keys = listApiKeys();
      
      expect(keys).toHaveLength(2);
      expect(keys[0].key).toMatch(/^bmad_[a-f0-9]{6}\.\.\.$/);
      expect(keys[0].description).toBe('Read key');
      expect(keys[1].description).toBe('Admin key');
    });
    
    test('should revoke API key', () => {
      const { apiKey } = generateApiKey();
      
      expect(revokeApiKey(apiKey)).toBe(true);
      expect(validateApiKey(apiKey)).toBeNull();
      expect(_testing.apiKeyStore.has(apiKey)).toBe(false);
    });
    
    test('should return false when revoking non-existent key', () => {
      expect(revokeApiKey('non_existent_key')).toBe(false);
    });
  });
  
  describe('Security Initialization', () => {
    test('should load keys from environment', () => {
      const testKeys = [
        {
          key: 'bmad_test123',
          scopes: ['data_read', 'data_write'],
          description: 'Test key from env'
        }
      ];
      
      process.env.BMAD_API_KEYS = JSON.stringify(testKeys);
      initializeSecurity();
      
      const validation = validateApiKey('bmad_test123');
      expect(validation).toBeDefined();
      expect(validation.scopes).toEqual(['data_read', 'data_write']);
      
      delete process.env.BMAD_API_KEYS;
    });
    
    test('should generate default admin key in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      initializeSecurity();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Generated default admin API key:',
        expect.stringMatching(/^bmad_[a-f0-9]{64}$/)
      );
      
      const keys = listApiKeys();
      expect(keys).toHaveLength(1);
      expect(keys[0].scopes).toEqual([SCOPES.ADMIN]);
      expect(keys[0].description).toContain('dev only');
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });
    
    test('should not generate default key in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      
      initializeSecurity();
      
      const keys = listApiKeys();
      expect(keys).toHaveLength(0);
      
      process.env.NODE_ENV = originalEnv;
    });
    
    test('should handle invalid JSON in environment', () => {
      process.env.BMAD_API_KEYS = 'invalid json';
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      initializeSecurity();
      
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to parse BMAD_API_KEYS:',
        expect.any(String)
      );
      
      consoleSpy.mockRestore();
      delete process.env.BMAD_API_KEYS;
    });
  });
});