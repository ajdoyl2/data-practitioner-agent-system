/**
 * Version Management Tools Unit Test Suite
 * Tests for version bump, expansion version management, and semantic release sync
 */

const fs = require('fs-extra');
const path = require('path');
const versionBump = require('../../tools/version-bump');

jest.mock('fs-extra');
jest.mock('child_process');

describe('Version Management Tools', () => {
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

  describe('Package.json Version Handling', () => {
    test('should read package.json version correctly', async () => {
      const mockPackageJson = {
        name: 'bmad-method',
        version: '1.0.0',
        dependencies: {}
      };

      fs.readJson.mockResolvedValue(mockPackageJson);

      const version = await versionBump.getCurrentVersion('/test/project');

      expect(fs.readJson).toHaveBeenCalledWith('/test/project/package.json');
      expect(version).toBe('1.0.0');
    });

    test('should handle missing package.json', async () => {
      fs.readJson.mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(versionBump.getCurrentVersion('/test/project')).rejects.toThrow(
        'ENOENT: no such file'
      );
    });

    test('should update package.json version', async () => {
      const mockPackageJson = {
        name: 'bmad-method',
        version: '1.0.0'
      };

      fs.readJson.mockResolvedValue(mockPackageJson);
      fs.writeJson.mockResolvedValue();

      await versionBump.updateVersion('/test/project', '1.1.0');

      expect(fs.writeJson).toHaveBeenCalledWith(
        '/test/project/package.json',
        {
          name: 'bmad-method',
          version: '1.1.0'
        },
        { spaces: 2 }
      );
    });
  });

  describe('Semantic Version Validation', () => {
    test('should validate semantic versions correctly', () => {
      expect(versionBump.isValidSemver('1.0.0')).toBe(true);
      expect(versionBump.isValidSemver('1.2.3')).toBe(true);
      expect(versionBump.isValidSemver('0.1.0')).toBe(true);
      expect(versionBump.isValidSemver('10.20.30')).toBe(true);
    });

    test('should reject invalid semantic versions', () => {
      expect(versionBump.isValidSemver('1.0')).toBe(false);
      expect(versionBump.isValidSemver('1.0.0.0')).toBe(false);
      expect(versionBump.isValidSemver('v1.0.0')).toBe(false);
      expect(versionBump.isValidSemver('1.0.0-alpha')).toBe(false);
      expect(versionBump.isValidSemver('')).toBe(false);
    });

    test('should increment versions correctly', () => {
      expect(versionBump.incrementVersion('1.0.0', 'patch')).toBe('1.0.1');
      expect(versionBump.incrementVersion('1.0.0', 'minor')).toBe('1.1.0');
      expect(versionBump.incrementVersion('1.0.0', 'major')).toBe('2.0.0');
    });

    test('should handle edge cases in version increment', () => {
      expect(versionBump.incrementVersion('1.9.9', 'patch')).toBe('1.9.10');
      expect(versionBump.incrementVersion('1.9.9', 'minor')).toBe('1.10.0');
      expect(versionBump.incrementVersion('9.9.9', 'major')).toBe('10.0.0');
    });
  });

  describe('Expansion Pack Version Management', () => {
    const mockExpansionConfig = {
      packName: 'test-expansion',
      version: '1.0.0',
      dependencies: ['bmad-core']
    };

    beforeEach(() => {
      fs.readJson.mockResolvedValue(mockExpansionConfig);
      fs.writeJson.mockResolvedValue();
    });

    test('should read expansion pack version', async () => {
      const version = await versionBump.getExpansionVersion('/test/expansions/test-pack');

      expect(fs.readJson).toHaveBeenCalledWith('/test/expansions/test-pack/config.yaml');
      expect(version).toBe('1.0.0');
    });

    test('should update expansion pack version', async () => {
      await versionBump.updateExpansionVersion('/test/expansions/test-pack', '1.1.0');

      expect(fs.writeJson).toHaveBeenCalledWith(
        '/test/expansions/test-pack/config.yaml',
        {
          packName: 'test-expansion',
          version: '1.1.0',
          dependencies: ['bmad-core']
        },
        { spaces: 2 }
      );
    });

    test('should handle missing expansion config', async () => {
      fs.readJson.mockRejectedValue(new Error('Config not found'));

      await expect(
        versionBump.getExpansionVersion('/test/expansions/invalid-pack')
      ).rejects.toThrow('Config not found');
    });
  });

  describe('Version Synchronization', () => {
    test('should sync installer version with main package', async () => {
      const mainPackage = { version: '1.2.0' };
      const installerPackage = { version: '1.0.0', name: 'bmad-installer' };

      fs.readJson
        .mockResolvedValueOnce(mainPackage)
        .mockResolvedValueOnce(installerPackage);
      fs.writeJson.mockResolvedValue();

      await versionBump.syncInstallerVersion('/test/project');

      expect(fs.writeJson).toHaveBeenCalledWith(
        '/test/project/tools/installer/package.json',
        {
          version: '1.2.0',
          name: 'bmad-installer'
        },
        { spaces: 2 }
      );
    });

    test('should sync all expansion pack versions', async () => {
      const expansionPacks = ['pack1', 'pack2'];
      fs.readdir.mockResolvedValue(['pack1', 'pack2', '.hidden']);
      fs.stat.mockImplementation((path) => ({
        isDirectory: () => !path.includes('.hidden')
      }));

      const mockConfig1 = { packName: 'pack1', version: '1.0.0' };
      const mockConfig2 = { packName: 'pack2', version: '1.0.0' };

      fs.readJson
        .mockResolvedValueOnce(mockConfig1)
        .mockResolvedValueOnce(mockConfig2);
      fs.writeJson.mockResolvedValue();

      await versionBump.syncAllExpansionVersions('/test/project', '1.2.0');

      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('pack1/config.yaml'),
        { packName: 'pack1', version: '1.2.0' },
        { spaces: 2 }
      );
      expect(fs.writeJson).toHaveBeenCalledWith(
        expect.stringContaining('pack2/config.yaml'),
        { packName: 'pack2', version: '1.2.0' },
        { spaces: 2 }
      );
    });
  });

  describe('Version Bump Workflows', () => {
    test('should perform complete version bump', async () => {
      const currentPackage = { version: '1.0.0', name: 'bmad-method' };
      const installerPackage = { version: '1.0.0', name: 'installer' };

      fs.readJson
        .mockResolvedValueOnce(currentPackage)
        .mockResolvedValueOnce(installerPackage);
      fs.writeJson.mockResolvedValue();
      fs.readdir.mockResolvedValue([]);

      const result = await versionBump.bumpVersion('/test/project', 'minor');

      expect(result.oldVersion).toBe('1.0.0');
      expect(result.newVersion).toBe('1.1.0');
      expect(result.success).toBe(true);
    });

    test('should handle version bump errors', async () => {
      fs.readJson.mockRejectedValue(new Error('Permission denied'));

      const result = await versionBump.bumpVersion('/test/project', 'patch');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    test('should validate bump type', async () => {
      await expect(
        versionBump.bumpVersion('/test/project', 'invalid')
      ).rejects.toThrow('Invalid bump type');
    });
  });

  describe('Git Integration', () => {
    const { spawn } = require('child_process');

    beforeEach(() => {
      const mockSpawn = {
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        stdout: {
          on: jest.fn()
        },
        stderr: {
          on: jest.fn()
        }
      };
      spawn.mockReturnValue(mockSpawn);
    });

    test('should create git tag for version', async () => {
      const result = await versionBump.createGitTag('/test/project', '1.1.0');

      expect(spawn).toHaveBeenCalledWith('git', ['tag', 'v1.1.0'], {
        cwd: '/test/project',
        stdio: 'pipe'
      });
      expect(result.success).toBe(true);
    });

    test('should handle git tag creation failure', async () => {
      const mockSpawn = {
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(1), 10);
          }
        }),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() }
      };
      spawn.mockReturnValue(mockSpawn);

      const result = await versionBump.createGitTag('/test/project', '1.1.0');

      expect(result.success).toBe(false);
    });

    test('should check if version tag exists', async () => {
      const mockSpawn = {
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
        }),
        stdout: {
          on: jest.fn((event, callback) => {
            if (event === 'data') {
              callback('v1.0.0\nv1.1.0\n');
            }
          })
        },
        stderr: { on: jest.fn() }
      };
      spawn.mockReturnValue(mockSpawn);

      const exists = await versionBump.tagExists('/test/project', '1.1.0');

      expect(exists).toBe(true);
      expect(spawn).toHaveBeenCalledWith('git', ['tag', '--list'], {
        cwd: '/test/project',
        stdio: 'pipe'
      });
    });
  });

  describe('CLI Integration', () => {
    test('should process command line arguments correctly', () => {
      const args = ['node', 'version-bump.js', '--type', 'minor', '--tag'];
      const options = versionBump.parseCliArgs(args);

      expect(options.type).toBe('minor');
      expect(options.tag).toBe(true);
      expect(options.dryRun).toBe(false);
    });

    test('should handle dry run mode', () => {
      const args = ['node', 'version-bump.js', '--dry-run'];
      const options = versionBump.parseCliArgs(args);

      expect(options.dryRun).toBe(true);
    });

    test('should provide help information', () => {
      const helpText = versionBump.getHelpText();

      expect(helpText).toContain('Usage:');
      expect(helpText).toContain('--type');
      expect(helpText).toContain('--tag');
      expect(helpText).toContain('--dry-run');
    });
  });
});