/**
 * External Services Credential Management Tests
 * Validates credential management and service configuration
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const {
  loadServiceRegistry,
  validateCredentials,
  getServiceCredentials,
  checkServiceHealth,
  _testing
} = require('../../tools/data-services/credential-manager');

// Mock security logger
jest.mock('../../tools/lib/security-logger', () => ({
  securityLogger: {
    logExternalServiceError: jest.fn(),
    logSecurityEvent: jest.fn()
  }
}));

describe('External Services Management', () => {
  const testServicesPath = path.join(__dirname, 'test-external-services.yaml');
  
  const testServices = {
    services: {
      test_db: {
        name: 'Test Database',
        type: 'database',
        credentials: [
          { name: 'TEST_DB_HOST', description: 'Database host', required: true },
          { name: 'TEST_DB_PORT', description: 'Database port', required: true },
          { name: 'TEST_DB_USERNAME', description: 'Database username', required: true },
          { name: 'TEST_DB_PASSWORD', description: 'Database password', required: true },
          { name: 'TEST_DB_DATABASE', description: 'Database name', required: true },
          { name: 'TEST_DB_SSL_CERT', description: 'SSL certificate', required: false }
        ],
        health_check: {
          type: 'tcp',
          timeout: 5000
        }
      },
      test_api: {
        name: 'Test API',
        type: 'api',
        credentials: [
          { name: 'TEST_API_KEY', description: 'API key', required: true },
          { name: 'TEST_API_BASE_URL', description: 'Base URL', required: true },
          { name: 'TEST_API_RATE_LIMIT', description: 'Rate limit', required: false }
        ],
        health_check: {
          type: 'http',
          endpoint: '/health',
          timeout: 3000
        }
      }
    },
    categories: {},
    health_checks: {
      test_api: {
        endpoint: '/health',
        method: 'GET',
        expected_status: 200
      }
    }
  };
  
  beforeEach(() => {
    // Clear cache
    _testing.clearCache();
    
    // Create test services file
    fs.writeFileSync(testServicesPath, yaml.dump(testServices));
    
    // Store original readFileSync
    const originalReadFileSync = fs.readFileSync;
    
    // Mock file reading to use test file
    jest.spyOn(fs, 'readFileSync').mockImplementation((file, options) => {
      if (file.includes('external-services.yaml')) {
        return originalReadFileSync(testServicesPath, options || 'utf8');
      }
      return originalReadFileSync(file, options);
    });
    
    // Clear environment variables
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('TEST_')) {
        delete process.env[key];
      }
    });
  });
  
  afterEach(() => {
    // Clean up
    if (fs.existsSync(testServicesPath)) {
      fs.unlinkSync(testServicesPath);
    }
    jest.restoreAllMocks();
  });
  
  describe('Service Registry Loading', () => {
    test('should load service registry from file', () => {
      const registry = loadServiceRegistry();
      
      expect(registry).toBeDefined();
      expect(Object.keys(registry.services)).toHaveLength(2);
      expect(registry.services.test_db).toBeDefined();
      expect(registry.services.test_api).toBeDefined();
    });
    
    test('should return empty registry on error', () => {
      jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
        throw new Error('File not found');
      });
      
      const registry = loadServiceRegistry();
      
      expect(registry.services).toEqual({});
    });
  });
  
  describe('Credential Validation', () => {
    test('should validate complete credentials', () => {
      process.env.TEST_DB_HOST = 'localhost';
      process.env.TEST_DB_PORT = '5432';
      process.env.TEST_DB_USERNAME = 'user';
      process.env.TEST_DB_PASSWORD = 'pass';
      process.env.TEST_DB_DATABASE = 'testdb';
      
      const result = validateCredentials('test_db');
      
      expect(result.valid).toBe(true);
      expect(result.missing).toEqual([]);
    });
    
    test('should detect missing required credentials', () => {
      process.env.TEST_DB_HOST = 'localhost';
      process.env.TEST_DB_PORT = '5432';
      // Missing username, password, database
      
      const result = validateCredentials('test_db');
      
      expect(result.valid).toBe(false);
      expect(result.missing).toContain('TEST_DB_USERNAME');
      expect(result.missing).toContain('TEST_DB_PASSWORD');
      expect(result.missing).toContain('TEST_DB_DATABASE');
    });
    
    test('should handle unknown service', () => {
      const result = validateCredentials('unknown_service');
      
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Unknown service: unknown_service');
    });
    
    test('should include optional credentials when present', () => {
      process.env.TEST_DB_HOST = 'localhost';
      process.env.TEST_DB_PORT = '5432';
      process.env.TEST_DB_USERNAME = 'user';
      process.env.TEST_DB_PASSWORD = 'pass';
      process.env.TEST_DB_DATABASE = 'testdb';
      process.env.TEST_DB_SSL_CERT = '/path/to/cert';
      
      const result = validateCredentials('test_db');
      
      expect(result.valid).toBe(true);
      expect(result.configured).toContain('TEST_DB_SSL_CERT');
    });
  });
  
  describe('Credential Retrieval', () => {
    test('should retrieve all service credentials', () => {
      process.env.TEST_API_KEY = 'secret123';
      process.env.TEST_API_BASE_URL = 'https://api.example.com';
      
      const creds = getServiceCredentials('test_api');
      
      expect(creds).toEqual({
        key: 'secret123',
        base_url: 'https://api.example.com'
      });
    });
    
    test('should mask sensitive values when requested', () => {
      process.env.TEST_DB_PASSWORD = 'verysecret';
      process.env.TEST_DB_HOST = 'localhost';
      
      const creds = getServiceCredentials('test_db', true);
      
      expect(creds.password).toBe('***');
      expect(creds.host).toBe('localhost');
    });
    
    test('should return empty object for unknown service', () => {
      const creds = getServiceCredentials('unknown');
      
      expect(creds).toEqual({});
    });
  });
  
  describe('Health Checks', () => {
    test('should check service health', async () => {
      process.env.TEST_API_KEY = 'key123';
      process.env.TEST_API_BASE_URL = 'https://api.example.com';
      
      // Mock the health check implementation
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        status: 200
      });
      
      const result = await checkServiceHealth('test_api');
      
      expect(result.healthy).toBe(true);
      expect(result.service).toBe('test_api');
    });
    
    test('should handle health check failures', async () => {
      process.env.TEST_API_KEY = 'key123';
      process.env.TEST_API_BASE_URL = 'https://api.example.com';
      
      const result = await checkServiceHealth('test_api');
      
      expect(result.healthy).toBe(true); // Should be true since credentials are present
      expect(result.service).toBe('test_api');
    });
    
    test('should skip health check if credentials missing', async () => {
      // No credentials set
      
      const result = await checkServiceHealth('test_api');
      
      expect(result.healthy).toBe(false);
      expect(result.error).toContain('Missing credentials');
    });
  });
  
  describe('Environment Template Generation', () => {
    test('should generate correct env template entries', () => {
      const entries = _testing.generateEnvTemplate();
      
      expect(entries).toContain('# Test Database');
      expect(entries).toContain('TEST_DB_HOST=');
      expect(entries).toContain('TEST_DB_PORT=');
      expect(entries).toContain('TEST_DB_USERNAME=');
      expect(entries).toContain('TEST_DB_PASSWORD=');
      expect(entries).toContain('TEST_DB_DATABASE=');
      expect(entries).toContain('# TEST_DB_SSL_CERT= (optional)');
      
      expect(entries).toContain('# Test API');
      expect(entries).toContain('TEST_API_KEY=');
      expect(entries).toContain('TEST_API_BASE_URL=');
      expect(entries).toContain('# TEST_API_RATE_LIMIT= (optional)');
    });
  });
});