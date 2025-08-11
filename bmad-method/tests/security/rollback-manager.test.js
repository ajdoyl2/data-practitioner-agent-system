/**
 * Rollback Manager Tests
 * Validates rollback procedures and recovery mechanisms
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const {
  rollbackStory,
  rollbackMultipleStories,
  getRollbackStatus,
  generateRollbackDocs
} = require('../../tools/rollback/rollback-manager');

// Mock child_process spawn
jest.mock('child_process');

// Mock feature flag manager
jest.mock('../../tools/lib/feature-flag-manager', () => ({
  disableFeature: jest.fn().mockResolvedValue(['test_feature']),
  isFeatureEnabled: jest.fn().mockReturnValue(false)
}));

// Mock security logger
jest.mock('../../tools/lib/security-logger', () => ({
  securityLogger: {
    logRollbackInitiated: jest.fn(),
    logSecurityEvent: jest.fn()
  }
}));

describe('Rollback Manager', () => {
  const testDir = path.join(__dirname, 'test-rollback');
  
  beforeEach(async () => {
    // Create test directory structure
    await fs.ensureDir(testDir);
    await fs.ensureDir(path.join(testDir, 'tools/rollback'));
    
    // Create mock rollback script
    const mockScript = `#!/bin/bash
echo "Rollback executed"
exit 0`;
    
    await fs.writeFile(
      path.join(testDir, 'tools/rollback/rollback-story-1.2.sh'),
      mockScript,
      { mode: 0o755 }
    );
  });
  
  afterEach(async () => {
    // Clean up
    await fs.remove(testDir);
    jest.clearAllMocks();
  });
  
  describe('rollbackStory', () => {
    test('should successfully rollback a story', async () => {
      // Mock spawn to simulate successful script execution
      const mockProcess = {
        stdout: { on: jest.fn((event, cb) => cb('Success')) },
        stderr: { on: jest.fn() },
        on: jest.fn((event, cb) => {
          if (event === 'close') cb(0);
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      
      // Mock file existence checks
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      jest.spyOn(fs, 'readJson').mockResolvedValue({
        dependencies: { 'test-package': '1.0.0' }
      });
      
      const result = await rollbackStory('1.2', { verbose: false });
      
      expect(result.success).toBe(true);
      expect(result.storyId).toBe('1.2');
      expect(result.feature).toBe('pyairbyte_integration');
    });
    
    test('should handle rollback script not found', async () => {
      jest.spyOn(fs, 'pathExists').mockResolvedValue(false);
      
      await expect(rollbackStory('1.9')).rejects.toThrow('Unknown story ID: 1.9');
    });
    
    test('should handle rollback script failure', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn((event, cb) => cb('Error occurred')) },
        on: jest.fn((event, cb) => {
          if (event === 'close') cb(1);
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      await expect(rollbackStory('1.2')).rejects.toThrow('Script exited with code 1');
    });
    
    test('should support dry run mode', async () => {
      const mockProcess = {
        stdout: { on: jest.fn((event, cb) => cb('[DRY RUN] Success')) },
        stderr: { on: jest.fn() },
        on: jest.fn((event, cb) => {
          if (event === 'close') cb(0);
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      const result = await rollbackStory('1.2', { dryRun: true });
      
      expect(spawn).toHaveBeenCalledWith(
        'bash',
        expect.any(Array),
        expect.objectContaining({
          env: expect.objectContaining({
            ROLLBACK_DRY_RUN: '1'
          })
        })
      );
    });
  });
  
  describe('rollbackMultipleStories', () => {
    test('should rollback multiple stories in reverse order', async () => {
      const mockProcess = {
        stdout: { on: jest.fn((event, cb) => cb('Success')) },
        stderr: { on: jest.fn() },
        on: jest.fn((event, cb) => {
          if (event === 'close') cb(0);
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      const results = await rollbackMultipleStories(['1.2', '1.3', '1.4']);
      
      expect(results).toHaveLength(3);
      expect(results[0].storyId).toBe('1.4'); // Reverse order
      expect(results[1].storyId).toBe('1.3');
      expect(results[2].storyId).toBe('1.2');
    });
    
    test('should continue on error when specified', async () => {
      let callCount = 0;
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn((event, cb) => cb('Error')) },
        on: jest.fn((event, cb) => {
          if (event === 'close') {
            // First call fails, others succeed
            cb(callCount++ === 0 ? 1 : 0);
          }
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      const results = await rollbackMultipleStories(
        ['1.2', '1.3'],
        { continueOnError: true }
      );
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(false);
      expect(results[1].success).toBe(true);
    });
    
    test('should stop on error by default', async () => {
      const mockProcess = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn((event, cb) => cb('Error')) },
        on: jest.fn((event, cb) => {
          if (event === 'close') cb(1);
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      const results = await rollbackMultipleStories(['1.2', '1.3']);
      
      expect(results).toHaveLength(1);
      expect(results[0].success).toBe(false);
    });
  });
  
  describe('getRollbackStatus', () => {
    test('should return status for all stories', async () => {
      jest.spyOn(fs, 'pathExists')
        .mockResolvedValueOnce(true)  // 1.2
        .mockResolvedValueOnce(false) // 1.3
        .mockResolvedValueOnce(true)  // 1.4
        .mockResolvedValueOnce(true)  // 1.5
        .mockResolvedValueOnce(true)  // 1.6
        .mockResolvedValueOnce(true)  // 1.7
        .mockResolvedValueOnce(true); // 1.8
      
      const status = await getRollbackStatus();
      
      expect(status['1.2']).toMatchObject({
        scriptExists: true,
        feature: 'pyairbyte_integration',
        featureEnabled: false
      });
      
      expect(status['1.3']).toMatchObject({
        scriptExists: false,
        feature: 'duckdb_analytics',
        featureEnabled: false
      });
    });
  });
  
  describe('generateRollbackDocs', () => {
    test('should generate rollback documentation', async () => {
      const outputPath = path.join(testDir, 'rollback-docs.md');
      
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      await generateRollbackDocs(outputPath);
      
      const content = await fs.readFile(outputPath, 'utf8');
      
      expect(content).toContain('# Rollback Procedures');
      expect(content).toContain('## Quick Reference');
      expect(content).toContain('| Story | Feature | Script | Status |');
      expect(content).toContain('## Rollback Commands');
    });
  });
  
  describe('Rollback Validation', () => {
    test('should validate feature flag is disabled after rollback', async () => {
      const { isFeatureEnabled } = require('../../tools/lib/feature-flag-manager.js');
      
      const mockProcess = {
        stdout: { on: jest.fn((event, cb) => cb('Success')) },
        stderr: { on: jest.fn() },
        on: jest.fn((event, cb) => {
          if (event === 'close') cb(0);
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      await rollbackStory('1.2');
      
      // Verify feature was checked
      expect(isFeatureEnabled).toHaveBeenCalledWith('pyairbyte_integration');
    });
    
    test('should create rollback report', async () => {
      const mockProcess = {
        stdout: { on: jest.fn((event, cb) => cb('Success')) },
        stderr: { on: jest.fn() },
        on: jest.fn((event, cb) => {
          if (event === 'close') cb(0);
        })
      };
      
      spawn.mockReturnValue(mockProcess);
      jest.spyOn(fs, 'pathExists').mockResolvedValue(true);
      
      const { securityLogger } = require('../../tools/lib/security-logger.js');
      
      await rollbackStory('1.2', { reason: 'Test rollback' });
      
      expect(securityLogger.logRollbackInitiated).toHaveBeenCalledWith(
        expect.objectContaining({
          storyId: '1.2',
          feature: 'pyairbyte_integration',
          reason: 'Test rollback'
        })
      );
      
      expect(securityLogger.logSecurityEvent).toHaveBeenCalledWith(
        'INFO',
        'rollback_completed',
        expect.any(Object)
      );
    });
  });
});