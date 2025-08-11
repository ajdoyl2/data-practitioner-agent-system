/**
 * Tests for PyAirbyteWrapper
 */

const PyAirbyteWrapper = require('../../tools/data-services/pyairbyte-wrapper');
const { isFeatureEnabled } = require('../../tools/lib/feature-flag-manager');
const fs = require('fs-extra');
const path = require('path');

// Mock feature flag manager
jest.mock('../../tools/lib/feature-flag-manager');

// Mock fs-extra
jest.mock('fs-extra');

describe('PyAirbyteWrapper', () => {
  let wrapper;
  let mockPythonManager;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Mock feature flag as enabled
    isFeatureEnabled.mockReturnValue(true);
    
    // Mock fs-extra methods
    fs.ensureDirSync.mockImplementation(() => {});
    fs.existsSync.mockReturnValue(false);
    fs.writeFile.mockResolvedValue();
    fs.chmod.mockResolvedValue();

    // Create wrapper instance
    wrapper = new PyAirbyteWrapper({
      cacheDirectory: '/test/cache'
    });
  });

  describe('checkAvailability', () => {
    it('should return unavailable when feature flag is disabled', async () => {
      isFeatureEnabled.mockReturnValue(false);
      
      const result = await wrapper.checkAvailability();
      
      expect(result.available).toBe(false);
      expect(result.reason).toContain('PyAirbyte integration is disabled');
    });

    it('should check Python environment when feature flag is enabled', async () => {
      const mockAvailability = {
        available: true,
        python_version: '3.10.0',
        packages: { pyairbyte: true }
      };
      
      // Mock Python manager
      wrapper.pythonManager = {
        checkAvailability: jest.fn().mockResolvedValue(mockAvailability)
      };
      
      const result = await wrapper.checkAvailability();
      
      expect(result).toEqual(mockAvailability);
      expect(wrapper.pythonManager.checkAvailability).toHaveBeenCalled();
    });
  });

  describe('initialize', () => {
    it('should throw error when PyAirbyte is not available', async () => {
      wrapper.pythonManager = {
        checkAvailability: jest.fn().mockResolvedValue({
          available: false,
          error: 'Python not found'
        })
      };

      await expect(wrapper.initialize()).rejects.toThrow('PyAirbyte not available: Python not found');
    });

    it('should initialize successfully when PyAirbyte is available', async () => {
      wrapper.pythonManager = {
        checkAvailability: jest.fn().mockResolvedValue({
          available: true
        })
      };

      wrapper.createPythonScripts = jest.fn().mockResolvedValue();

      const result = await wrapper.initialize();

      expect(result.success).toBe(true);
      expect(result.cacheDirectory).toBe('/test/cache');
      expect(wrapper.createPythonScripts).toHaveBeenCalled();
    });
  });

  describe('createFileConfig', () => {
    it('should create proper CSV file configuration', () => {
      const config = wrapper.createFileConfig('/path/to/data.csv', 'csv', {
        delimiter: ';',
        encoding: 'latin1'
      });

      expect(config).toEqual({
        dataset_name: 'data',
        format: 'csv',
        url: '/path/to/data.csv',
        provider: { storage: 'local' },
        format_options: {
          delimiter: ';',
          quote_char: '"',
          escape_char: '"',
          encoding: 'latin1',
          newlines_in_values: false
        }
      });
    });

    it('should create proper JSON file configuration', () => {
      const config = wrapper.createFileConfig('/path/to/data.json', 'json');

      expect(config).toEqual({
        dataset_name: 'data',
        format: 'json',
        url: '/path/to/data.json',
        provider: { storage: 'local' }
      });
    });
  });

  describe('createDatabaseConfig', () => {
    it('should create proper PostgreSQL configuration', () => {
      const connection = {
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
        ssl: true,
        ssl_mode: 'require'
      };

      const config = wrapper.createDatabaseConfig('postgres', connection);

      expect(config).toEqual({
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
        ssl: true,
        ssl_mode: 'require'
      });
    });

    it('should create proper MySQL configuration', () => {
      const connection = {
        host: 'mysql.example.com',
        port: 3306,
        database: 'prod',
        username: 'admin',
        password: 'secret'
      };

      const config = wrapper.createDatabaseConfig('mysql', connection);

      expect(config).toEqual({
        host: 'mysql.example.com',
        port: 3306,
        database: 'prod',
        username: 'admin',
        password: 'secret'
      });
    });
  });

  describe('listConnectors', () => {
    it('should successfully list connectors', async () => {
      const mockResult = {
        data: {
          success: true,
          connectors: {
            file: { name: 'source-file', description: 'File connector' }
          }
        }
      };

      wrapper.initialize = jest.fn().mockResolvedValue();
      wrapper.pythonManager = {
        execute: jest.fn().mockResolvedValue(mockResult)
      };

      const result = await wrapper.listConnectors();

      expect(result).toEqual(mockResult.data);
      expect(wrapper.pythonManager.execute).toHaveBeenCalledWith(
        expect.stringContaining('airbyte_connector.py'),
        ['list_connectors', '/test/cache'],
        { parseJson: true }
      );
    });
  });

  describe('clearCache', () => {
    it('should clear entire cache when no pattern provided', async () => {
      fs.emptyDir.mockResolvedValue();

      const result = await wrapper.clearCache();

      expect(result.success).toBe(true);
      expect(result.cleared).toBe('all');
      expect(fs.emptyDir).toHaveBeenCalledWith('/test/cache');
    });

    it('should clear specific pattern when provided', async () => {
      fs.readdir.mockResolvedValue(['file1.cache', 'file2.cache', 'other.data']);
      fs.remove.mockResolvedValue();

      const result = await wrapper.clearCache('file');

      expect(result.success).toBe(true);
      expect(result.cleared).toBe(2);
      expect(result.pattern).toBe('file');
    });

    it('should handle errors gracefully', async () => {
      fs.emptyDir.mockRejectedValue(new Error('Permission denied'));

      const result = await wrapper.clearCache();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Permission denied');
    });
  });

  describe('getCacheInfo', () => {
    it('should return cache information successfully', async () => {
      const mockStats = {
        size: 1000,
        birthtime: new Date('2024-01-01')
      };
      
      const mockFiles = ['cache1.db', 'cache2.db'];
      const mockFileStat = {
        size: 500,
        mtime: new Date('2024-01-02')
      };

      fs.stat.mockResolvedValue(mockStats);
      fs.readdir.mockResolvedValue(mockFiles);
      fs.stat.mockResolvedValue(mockFileStat);

      const result = await wrapper.getCacheInfo();

      expect(result.success).toBe(true);
      expect(result.cache_directory).toBe('/test/cache');
      expect(result.total_files).toBe(2);
    });

    it('should handle errors gracefully', async () => {
      fs.stat.mockRejectedValue(new Error('Directory not found'));

      const result = await wrapper.getCacheInfo();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Directory not found');
    });
  });
});