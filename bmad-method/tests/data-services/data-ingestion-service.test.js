/**
 * Tests for DataIngestionService
 */

const request = require('supertest');
const express = require('express');
const { isFeatureEnabled, requireFeatureMiddleware } = require('../../tools/lib/feature-flag-manager');

// Mock dependencies
jest.mock('../../tools/lib/feature-flag-manager');
jest.mock('../../tools/data-services/pyairbyte-wrapper');
jest.mock('../../tools/data-services/auth-middleware');
jest.mock('../../tools/lib/security-logger', () => ({
  securityLogger: {
    logApiRequest: jest.fn(),
    logApiError: jest.fn(),
    logSecurityEvent: jest.fn()
  }
}));

// Mock fs-extra with Jest functions
jest.mock('fs-extra', () => ({
  ensureDirSync: jest.fn(),
  existsSync: jest.fn(),
  readdir: jest.fn(),
  writeFileSync: jest.fn(),
  readFileSync: jest.fn(),
  mkdirSync: jest.fn(),
  rmSync: jest.fn(),
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  copyFileSync: jest.fn(),
  pathExistsSync: jest.fn(),
  readFile: jest.fn(),
  writeFile: jest.fn(),
  ensureDir: jest.fn(),
  copy: jest.fn(),
  remove: jest.fn(),
  pathExists: jest.fn(),
  unlink: jest.fn(),
  appendFile: jest.fn()
}));

const fs = require('fs-extra');

describe('DataIngestionService', () => {
  let service;
  let app;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock feature flag as enabled
    isFeatureEnabled.mockReturnValue(true);
    
    // Mock fs-extra functions
    fs.ensureDirSync.mockImplementation(() => {});
    fs.existsSync.mockReturnValue(true);
    fs.readdir.mockResolvedValue([]);
    fs.writeFileSync.mockImplementation(() => {});
    fs.readFileSync.mockReturnValue('{}');
    fs.readdirSync.mockReturnValue([]);
    fs.statSync.mockReturnValue({ isDirectory: () => false, size: 1024 });
    fs.pathExistsSync.mockReturnValue(true);
    fs.readFile.mockResolvedValue('{}');
    fs.writeFile.mockResolvedValue();
    fs.ensureDir.mockResolvedValue();
    fs.pathExists.mockResolvedValue(true);
    fs.unlink.mockResolvedValue();
    fs.appendFile.mockResolvedValue();
    
    // Mock auth middleware
    const authMiddleware = require('../../tools/data-services/auth-middleware');
    authMiddleware.verifyApiKey = jest.fn((req, res, next) => next());
    authMiddleware.requireScope = jest.fn(() => (req, res, next) => next());
    
    // Mock feature flag middleware
    requireFeatureMiddleware.mockImplementation(() => (req, res, next) => next());

    // Import DataIngestionService after setting up mocks
    const DataIngestionService = require('../../tools/data-services/data-ingestion-service');
    
    // Create service instance
    service = new DataIngestionService({
      port: 3001,
      configPath: '/test/config',
      dataDirectory: '/test/data'
    });
    
    app = service.app;
    
    // Mock PyAirbyte wrapper
    service.pyairbyte.checkAvailability = jest.fn().mockResolvedValue({
      available: true
    });
    service.pyairbyte.listConnectors = jest.fn().mockResolvedValue({
      success: true,
      connectors: {
        file: { name: 'source-file', description: 'File connector' }
      }
    });
  });

  describe('Health Check', () => {
    it('should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toEqual({
        status: 'healthy',
        service: 'data-ingestion',
        timestamp: expect.any(String),
        features: {
          pyairbyte_integration: true
        }
      });
    });
  });

  describe('List Connectors', () => {
    it('should return available connectors', async () => {
      const response = await request(app)
        .get('/api/v1/data-sources/connectors')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          success: true,
          connectors: {
            file: { name: 'source-file', description: 'File connector' }
          }
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 503 when PyAirbyte is not available', async () => {
      service.pyairbyte.checkAvailability.mockResolvedValue({
        available: false,
        reason: 'Python not found'
      });

      const response = await request(app)
        .get('/api/v1/data-sources/connectors')
        .set('X-API-Key', 'test-key')
        .expect(503);

      expect(response.body).toEqual({
        error: 'PyAirbyte not available',
        reason: 'Python not found'
      });
    });
  });

  describe('Discover Streams', () => {
    it('should discover streams successfully', async () => {
      const mockStreams = {
        success: true,
        streams: [
          { name: 'customers', supported_sync_modes: ['full_refresh'] }
        ]
      };
      
      service.pyairbyte.discoverStreams = jest.fn().mockResolvedValue(mockStreams);

      const response = await request(app)
        .post('/api/v1/data-sources/discover')
        .set('X-API-Key', 'test-key')
        .send({
          connector_type: 'file',
          config: { url: '/path/to/file.csv' }
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockStreams,
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/data-sources/discover')
        .set('X-API-Key', 'test-key')
        .send({
          connector_type: 'file'
          // missing config
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required fields: connector_type, config'
      });
    });

    it('should return 400 when stream discovery fails', async () => {
      service.pyairbyte.discoverStreams = jest.fn().mockResolvedValue({
        success: false,
        error: 'File not found'
      });

      const response = await request(app)
        .post('/api/v1/data-sources/discover')
        .set('X-API-Key', 'test-key')
        .send({
          connector_type: 'file',
          config: { url: '/path/to/missing.csv' }
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Failed to discover streams',
        details: 'File not found'
      });
    });
  });

  describe('Read Stream', () => {
    it('should read stream data successfully', async () => {
      const mockData = {
        success: true,
        data: {
          records: [{ id: 1, name: 'John' }],
          metadata: { total_records: 1, stream_name: 'customers' }
        }
      };
      
      service.pyairbyte.readStream = jest.fn().mockResolvedValue(mockData);

      const response = await request(app)
        .post('/api/v1/data-sources/read')
        .set('X-API-Key', 'test-key')
        .send({
          connector_type: 'file',
          config: { url: '/path/to/file.csv' },
          stream_name: 'customers',
          limit: 10
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockData.data,
        metadata: mockData.data.metadata,
        timestamp: expect.any(String)
      });
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/v1/data-sources/read')
        .set('X-API-Key', 'test-key')
        .send({
          connector_type: 'file',
          config: { url: '/path/to/file.csv' }
          // missing stream_name
        })
        .expect(400);

      expect(response.body).toEqual({
        error: 'Missing required fields: connector_type, config, stream_name'
      });
    });
  });

  describe('Upload Files', () => {
    it('should handle file upload successfully', async () => {
      // Mock multer middleware behavior
      const mockFile = {
        originalname: 'test.csv',
        path: '/uploads/test.csv',
        size: 1000
      };
      
      // Mock request with files
      const mockReq = { files: [mockFile] };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      service.pyairbyte.discoverStreams = jest.fn().mockResolvedValue({
        success: true,
        streams: [{ name: 'data' }]
      });
      
      await service.uploadFiles(mockReq, mockRes);
      
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: expect.objectContaining({
          uploaded_files: 1,
          results: expect.arrayContaining([
            expect.objectContaining({
              filename: 'test.csv',
              format: 'csv',
              size: 1000
            })
          ])
        }),
        timestamp: expect.any(String)
      });
    });

    it('should return 400 when no files uploaded', async () => {
      const mockReq = { files: [] };
      const mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
      
      await service.uploadFiles(mockReq, mockRes);
      
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'No files uploaded'
      });
    });
  });

  describe('Cache Management', () => {
    it('should get cache info successfully', async () => {
      const mockCacheInfo = {
        success: true,
        cache_directory: '/test/cache',
        total_files: 2,
        total_size: 1000
      };
      
      service.pyairbyte.getCacheInfo = jest.fn().mockResolvedValue(mockCacheInfo);

      const response = await request(app)
        .get('/api/v1/data-sources/cache')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockCacheInfo,
        timestamp: expect.any(String)
      });
    });

    it('should clear cache successfully', async () => {
      const mockResult = {
        success: true,
        cleared: 'all',
        directory: '/test/cache'
      };
      
      service.pyairbyte.clearCache = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .delete('/api/v1/data-sources/cache')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: mockResult,
        timestamp: expect.any(String)
      });
    });

    it('should clear cache with pattern', async () => {
      const mockResult = {
        success: true,
        cleared: 2,
        pattern: 'file'
      };
      
      service.pyairbyte.clearCache = jest.fn().mockResolvedValue(mockResult);

      const response = await request(app)
        .delete('/api/v1/data-sources/cache?pattern=file')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(service.pyairbyte.clearCache).toHaveBeenCalledWith('file');
    });
  });

  describe('Configuration Management', () => {
    it('should get configurations successfully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.readdir.mockResolvedValue(['config1.yaml']);
      fs.readFile.mockResolvedValue('type: file\nconfig: {}\ncreated: 2024-01-01');
      
      // Mock yaml.load
      const yaml = require('js-yaml');
      yaml.load = jest.fn().mockReturnValue({
        type: 'file',
        config: {},
        created: '2024-01-01'
      });

      const response = await request(app)
        .get('/api/v1/data-sources/config')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          configurations: [
            expect.objectContaining({
              name: 'config1',
              type: 'file'
            })
          ]
        },
        timestamp: expect.any(String)
      });
    });

    it('should save configuration successfully', async () => {
      fs.writeFile.mockResolvedValue();
      
      const response = await request(app)
        .post('/api/v1/data-sources/config')
        .set('X-API-Key', 'test-key')
        .send({
          name: 'test_config',
          configuration: {
            type: 'file',
            config: { url: '/path/to/file.csv' }
          }
        })
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          name: 'test_config',
          saved: true
        },
        timestamp: expect.any(String)
      });
    });

    it('should delete configuration successfully', async () => {
      fs.existsSync.mockReturnValue(true);
      fs.unlink.mockResolvedValue();

      const response = await request(app)
        .delete('/api/v1/data-sources/config/test_config')
        .set('X-API-Key', 'test-key')
        .expect(200);

      expect(response.body).toEqual({
        success: true,
        data: {
          name: 'test_config',
          deleted: true
        },
        timestamp: expect.any(String)
      });
    });

    it('should return 404 for non-existent configuration', async () => {
      fs.existsSync.mockReturnValue(false);

      const response = await request(app)
        .delete('/api/v1/data-sources/config/missing_config')
        .set('X-API-Key', 'test-key')
        .expect(404);

      expect(response.body).toEqual({
        error: 'Configuration not found'
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle internal server errors', async () => {
      service.pyairbyte.checkAvailability.mockRejectedValue(new Error('Internal error'));

      const response = await request(app)
        .get('/api/v1/data-sources/connectors')
        .set('X-API-Key', 'test-key')
        .expect(500);

      expect(response.body).toEqual({
        error: 'Failed to list connectors',
        details: 'Internal error',
        timestamp: expect.any(String)
      });
    });
  });
});