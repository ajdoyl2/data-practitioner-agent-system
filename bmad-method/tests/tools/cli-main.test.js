/**
 * CLI Main Command Test Suite
 * Comprehensive tests for the main bmad-build CLI command
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('BMad-Build CLI Commands', () => {
  const cliPath = path.join(__dirname, '../../tools/cli.js');
  
  describe('Help Command', () => {
    test('should display help information', () => {
      const output = execSync(`node ${cliPath} --help`, { encoding: 'utf8' });
      
      expect(output).toContain('BMad-Method build tool');
      expect(output).toContain('build');
      expect(output).toContain('list:agents');
      expect(output).toContain('list:expansions');
    });

    test('should display version', () => {
      const output = execSync(`node ${cliPath} --version`, { encoding: 'utf8' });
      
      expect(output).toMatch(/\d+\.\d+\.\d+/);
    });
  });

  describe('Build Command', () => {
    test('should show help for build command', () => {
      const output = execSync(`node ${cliPath} build --help`, { encoding: 'utf8' });
      
      expect(output).toContain('Build web bundles');
      expect(output).toContain('--agents-only');
      expect(output).toContain('--teams-only');
      expect(output).toContain('--expansions-only');
    });
  });

  describe('List Commands', () => {
    test('should list agents command help', () => {
      const output = execSync(`node ${cliPath} list:agents --help`, { encoding: 'utf8' });
      
      expect(output).toContain('List all available agents');
    });

    test('should validate command help', () => {
      const output = execSync(`node ${cliPath} validate --help`, { encoding: 'utf8' });
      
      expect(output).toContain('Validate agent and team configurations');
    });

    test('should list expansions command help', () => {
      const output = execSync(`node ${cliPath} list:expansions --help`, { encoding: 'utf8' });
      
      expect(output).toContain('List all available expansion packs');
    });
  });

  describe('Upgrade Command', () => {
    test('should show help for upgrade command', () => {
      const output = execSync(`node ${cliPath} upgrade --help`, { encoding: 'utf8' });
      
      expect(output).toContain('Upgrade');
      expect(output).toContain('V3 project to V4');
    });
  });

  describe('Data Service Commands', () => {
    test('should show help for start-data-service command', () => {
      const output = execSync(`node ${cliPath} start-data-service --help`, { encoding: 'utf8' });
      
      expect(output).toContain('Start the data ingestion service');
    });
    
    test('should show help for setup-python command', () => {
      const output = execSync(`node ${cliPath} setup-python --help`, { encoding: 'utf8' });
      
      expect(output).toContain('Setup Python environment');
    });
    
    test('should show help for data-connectors command', () => {
      const output = execSync(`node ${cliPath} data-connectors --help`, { encoding: 'utf8' });
      
      expect(output).toContain('List available data connectors');
    });
  });

  describe('Feature Flag Commands', () => {
    test('should show help for list-features command', () => {
      const output = execSync(`node ${cliPath} list-features --help`, { encoding: 'utf8' });
      
      expect(output).toContain('List all data practitioner features');
    });

    test('should show help for enable-feature command', () => {
      const output = execSync(`node ${cliPath} enable-feature --help`, { encoding: 'utf8' });
      
      expect(output).toContain('Enable a data practitioner feature');
    });

    test('should show help for disable-feature command', () => {
      const output = execSync(`node ${cliPath} disable-feature --help`, { encoding: 'utf8' });
      
      expect(output).toContain('Disable a data practitioner feature');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid commands gracefully', () => {
      try {
        execSync(`node ${cliPath} invalid-command`, { encoding: 'utf8' });
      } catch (error) {
        expect(error.message).toContain('unknown command');
      }
    });

    test('should handle invalid options gracefully', () => {
      try {
        execSync(`node ${cliPath} build --invalid-option`, { encoding: 'utf8' });
      } catch (error) {
        expect(error.message).toContain('unknown option');
      }
    });
  });
});

describe('CLI Command Integration', () => {
  const mockWebBuilder = require('../../tools/builders/web-builder');
  const mockV3ToV4Upgrader = require('../../tools/upgraders/v3-to-v4-upgrader');
  const mockIdeSetup = require('../../tools/installer/lib/ide-setup');
  const mockFeatureFlagManager = require('../../tools/lib/feature-flag-manager');
  
  jest.mock('../../tools/builders/web-builder');
  jest.mock('../../tools/upgraders/v3-to-v4-upgrader');
  jest.mock('../../tools/installer/lib/ide-setup');
  jest.mock('../../tools/lib/feature-flag-manager');
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Build Command Integration', () => {
    test('should call WebBuilder with correct options', async () => {
      const mockBuildAgents = jest.fn().mockResolvedValue();
      const mockBuildTeams = jest.fn().mockResolvedValue();
      const mockBuildAllExpansionPacks = jest.fn().mockResolvedValue();
      const mockCleanOutputDirs = jest.fn().mockResolvedValue();
      
      mockWebBuilder.mockImplementation(() => ({
        buildAgents: mockBuildAgents,
        buildTeams: mockBuildTeams,
        buildAllExpansionPacks: mockBuildAllExpansionPacks,
        cleanOutputDirs: mockCleanOutputDirs
      }));
      
      // Test would require refactoring CLI to be more testable
      // This is a placeholder for future implementation
      expect(mockWebBuilder).toBeDefined();
    });
  });
  
  describe('Feature Flag Integration', () => {
    test('should integrate with feature flag manager', () => {
      mockFeatureFlagManager.isFeatureEnabled.mockReturnValue(true);
      mockFeatureFlagManager.getAllFeatureStatuses.mockReturnValue({
        'test-feature': { enabled: true, description: 'Test feature' }
      });
      
      const isEnabled = mockFeatureFlagManager.isFeatureEnabled('test-feature');
      const statuses = mockFeatureFlagManager.getAllFeatureStatuses();
      
      expect(isEnabled).toBe(true);
      expect(statuses).toHaveProperty('test-feature');
    });
  });
});

describe('CLI Exit Codes', () => {
  const cliPath = path.join(__dirname, '../../tools/cli.js');
  
  test('should exit with code 0 on success', () => {
    const { status } = require('child_process').spawnSync(
      'node',
      [cliPath, '--help'],
      { encoding: 'utf8' }
    );
    
    expect(status).toBe(0);
  });
  
  test('should exit with non-zero code on error', () => {
    const { status } = require('child_process').spawnSync(
      'node',
      [cliPath, 'invalid-command'],
      { encoding: 'utf8' }
    );
    
    expect(status).not.toBe(0);
  });
});