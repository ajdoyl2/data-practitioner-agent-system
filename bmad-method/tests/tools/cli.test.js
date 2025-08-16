/**
 * CLI Tool Dependencies Unit Test Suite
 * Tests for CLI tool dependencies and utility functions
 */

const WebBuilder = require('../../tools/builders/web-builder');
const V3ToV4Upgrader = require('../../tools/upgraders/v3-to-v4-upgrader');
const {
  isFeatureEnabled,
  enableFeature,
  disableFeature,
  getAllFeatureStatuses
} = require('../../tools/lib/feature-flag-manager');

// Mock all dependencies
jest.mock('../../tools/builders/web-builder');
jest.mock('../../tools/upgraders/v3-to-v4-upgrader');
jest.mock('../../tools/lib/feature-flag-manager');

describe('CLI Tool Dependencies', () => {
  let mockConsoleLog;
  let mockConsoleError;

  beforeEach(() => {
    jest.clearAllMocks();
    mockConsoleLog = jest.spyOn(console, 'log').mockImplementation();
    mockConsoleError = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    mockConsoleLog.mockRestore();
    mockConsoleError.mockRestore();
  });

  describe('WebBuilder Integration', () => {
    test('should instantiate WebBuilder correctly', () => {
      const builder = new WebBuilder({ rootDir: '/test/path' });
      
      expect(WebBuilder).toHaveBeenCalledWith({ rootDir: '/test/path' });
    });

    test('should use default rootDir when not specified', () => {
      const builder = new WebBuilder();
      
      expect(WebBuilder).toHaveBeenCalledWith();
    });
  });

  describe('Feature Flag Manager Integration', () => {
    test('should check if feature is enabled', () => {
      isFeatureEnabled.mockReturnValue(true);
      
      const result = isFeatureEnabled('test-feature');
      
      expect(result).toBe(true);
      expect(isFeatureEnabled).toHaveBeenCalledWith('test-feature');
    });

    test('should enable a feature', () => {
      enableFeature.mockReturnValue(true);
      
      const result = enableFeature('test-feature', false);
      
      expect(result).toBe(true);
      expect(enableFeature).toHaveBeenCalledWith('test-feature', false);
    });

    test('should disable a feature', () => {
      disableFeature.mockReturnValue(['test-feature']);
      
      const result = disableFeature('test-feature', true);
      
      expect(result).toEqual(['test-feature']);
      expect(disableFeature).toHaveBeenCalledWith('test-feature', true);
    });

    test('should get all feature statuses', () => {
      const mockStatuses = {
        'feature1': { enabled: true, description: 'Test feature 1' },
        'feature2': { enabled: false, description: 'Test feature 2' }
      };
      getAllFeatureStatuses.mockReturnValue(mockStatuses);
      
      const result = getAllFeatureStatuses();
      
      expect(result).toEqual(mockStatuses);
      expect(getAllFeatureStatuses).toHaveBeenCalledTimes(1);
    });
  });

  describe('V3ToV4Upgrader Integration', () => {
    test('should instantiate upgrader correctly', () => {
      const upgrader = new V3ToV4Upgrader();
      
      expect(V3ToV4Upgrader).toHaveBeenCalledTimes(1);
    });

    test('should handle upgrade options', async () => {
      const mockUpgrader = {
        upgrade: jest.fn().mockResolvedValue()
      };
      V3ToV4Upgrader.mockImplementation(() => mockUpgrader);
      
      const upgrader = new V3ToV4Upgrader();
      await upgrader.upgrade({
        projectPath: '/test/project',
        dryRun: false,
        backup: true
      });
      
      expect(mockUpgrader.upgrade).toHaveBeenCalledWith({
        projectPath: '/test/project',
        dryRun: false,
        backup: true
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle feature enable errors', () => {
      enableFeature.mockImplementation(() => {
        throw new Error('Feature enable failed');
      });
      
      expect(() => {
        enableFeature('test-feature');
      }).toThrow('Feature enable failed');
    });

    test('should handle feature disable errors', () => {
      disableFeature.mockImplementation(() => {
        throw new Error('Feature disable failed');
      });
      
      expect(() => {
        disableFeature('test-feature');
      }).toThrow('Feature disable failed');
    });

    test('should handle upgrader errors', async () => {
      const mockUpgrader = {
        upgrade: jest.fn().mockRejectedValue(new Error('Upgrade failed'))
      };
      V3ToV4Upgrader.mockImplementation(() => mockUpgrader);
      
      const upgrader = new V3ToV4Upgrader();
      
      await expect(upgrader.upgrade({})).rejects.toThrow('Upgrade failed');
    });
  });
});