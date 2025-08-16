/**
 * Installer Functionality Unit Test Suite
 * Tests for tools/installer/ - Installation and module management
 */

const fs = require('fs-extra');
const path = require('path');
const IdeSetup = require('../../tools/installer/lib/ide-setup');
const ConfigLoader = require('../../tools/installer/lib/config-loader');
const FileManager = require('../../tools/installer/lib/file-manager');
const ModuleManager = require('../../tools/installer/lib/module-manager');
const Installer = require('../../tools/installer/lib/installer');

jest.mock('fs-extra');
jest.mock('../../tools/installer/lib/config-loader');
jest.mock('../../tools/installer/lib/file-manager');
jest.mock('../../tools/installer/lib/module-manager');

describe('Installer Unit Tests', () => {
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

  describe('IdeSetup', () => {
    let ideSetup;
    let mockConfigLoader;
    let mockFileManager;
    let mockModuleManager;

    beforeEach(() => {
      mockConfigLoader = {
        loadConfig: jest.fn(),
        saveConfig: jest.fn(),
        getConfigPath: jest.fn()
      };
      mockFileManager = {
        copyFiles: jest.fn(),
        createDirectories: jest.fn(),
        validatePaths: jest.fn()
      };
      mockModuleManager = {
        installModules: jest.fn(),
        validateModules: jest.fn(),
        listInstalledModules: jest.fn()
      };

      ConfigLoader.mockImplementation(() => mockConfigLoader);
      FileManager.mockImplementation(() => mockFileManager);
      ModuleManager.mockImplementation(() => mockModuleManager);

      ideSetup = new IdeSetup();
    });

    test('should initialize with proper dependencies', () => {
      expect(ConfigLoader).toHaveBeenCalledTimes(1);
      expect(FileManager).toHaveBeenCalledTimes(1);
      expect(ModuleManager).toHaveBeenCalledTimes(1);
    });

    test('should setup IDE configuration successfully', async () => {
      const mockConfig = {
        targetPath: '/test/path',
        modules: ['test-module'],
        files: ['test-file.md']
      };
      
      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);
      mockFileManager.validatePaths.mockResolvedValue(true);
      mockFileManager.createDirectories.mockResolvedValue();
      mockFileManager.copyFiles.mockResolvedValue();
      mockModuleManager.installModules.mockResolvedValue();

      const result = await ideSetup.setup({
        targetPath: '/test/path',
        config: 'test-config'
      });

      expect(result).toBe(true);
      expect(mockConfigLoader.loadConfig).toHaveBeenCalledWith('test-config');
      expect(mockFileManager.validatePaths).toHaveBeenCalledWith(mockConfig);
      expect(mockFileManager.createDirectories).toHaveBeenCalledWith(mockConfig);
      expect(mockFileManager.copyFiles).toHaveBeenCalledWith(mockConfig);
      expect(mockModuleManager.installModules).toHaveBeenCalledWith(mockConfig);
    });

    test('should handle setup errors gracefully', async () => {
      mockConfigLoader.loadConfig.mockRejectedValue(new Error('Config not found'));

      const result = await ideSetup.setup({
        targetPath: '/test/path',
        config: 'invalid-config'
      });

      expect(result).toBe(false);
      expect(mockConsoleError).toHaveBeenCalledWith(
        expect.stringContaining('Setup failed: Config not found')
      );
    });

    test('should validate installation correctly', async () => {
      const mockConfig = {
        modules: ['module1', 'module2'],
        files: ['file1.md', 'file2.md']
      };

      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);
      mockModuleManager.validateModules.mockResolvedValue(['module1', 'module2']);
      fs.pathExists.mockImplementation((filePath) => {
        return Promise.resolve(filePath.includes('file1') || filePath.includes('file2'));
      });

      const result = await ideSetup.validate('/test/path');

      expect(result.valid).toBe(true);
      expect(result.missingModules).toEqual([]);
      expect(result.missingFiles).toEqual([]);
    });

    test('should detect missing modules and files', async () => {
      const mockConfig = {
        modules: ['module1', 'module2'],
        files: ['file1.md', 'file2.md']
      };

      mockConfigLoader.loadConfig.mockResolvedValue(mockConfig);
      mockModuleManager.validateModules.mockResolvedValue(['module1']); // module2 missing
      fs.pathExists.mockImplementation((filePath) => {
        return Promise.resolve(filePath.includes('file1')); // file2 missing
      });

      const result = await ideSetup.validate('/test/path');

      expect(result.valid).toBe(false);
      expect(result.missingModules).toEqual(['module2']);
      expect(result.missingFiles).toEqual([expect.stringContaining('file2.md')]);
    });
  });

  describe('ConfigLoader', () => {
    let configLoader;

    beforeEach(() => {
      ConfigLoader.mockRestore();
      configLoader = new ConfigLoader();
    });

    test('should load configuration from file', async () => {
      const mockConfig = {
        name: 'test-config',
        version: '1.0.0',
        modules: ['test-module']
      };
      
      fs.readFile.mockResolvedValue(JSON.stringify(mockConfig));

      const result = await configLoader.loadConfig('test-config.json');

      expect(result).toEqual(mockConfig);
      expect(fs.readFile).toHaveBeenCalledWith('test-config.json', 'utf8');
    });

    test('should handle invalid JSON configuration', async () => {
      fs.readFile.mockResolvedValue('invalid json {');

      await expect(configLoader.loadConfig('invalid.json')).rejects.toThrow();
    });

    test('should save configuration to file', async () => {
      const config = {
        name: 'test-config',
        modules: ['test-module']
      };

      fs.writeFile.mockResolvedValue();

      await configLoader.saveConfig('config.json', config);

      expect(fs.writeFile).toHaveBeenCalledWith(
        'config.json',
        JSON.stringify(config, null, 2),
        'utf8'
      );
    });

    test('should get correct config path', () => {
      const configName = 'test-config';
      const result = configLoader.getConfigPath(configName);

      expect(result).toContain(configName);
      expect(path.isAbsolute(result)).toBe(true);
    });
  });

  describe('FileManager', () => {
    let fileManager;

    beforeEach(() => {
      FileManager.mockRestore();
      fileManager = new FileManager();
    });

    test('should create directories successfully', async () => {
      const config = {
        targetPath: '/test/target',
        directories: ['dir1', 'dir2']
      };

      fs.ensureDir.mockResolvedValue();

      await fileManager.createDirectories(config);

      expect(fs.ensureDir).toHaveBeenCalledWith('/test/target/dir1');
      expect(fs.ensureDir).toHaveBeenCalledWith('/test/target/dir2');
    });

    test('should copy files successfully', async () => {
      const config = {
        sourcePath: '/test/source',
        targetPath: '/test/target',
        files: ['file1.md', 'file2.md']
      };

      fs.copy.mockResolvedValue();

      await fileManager.copyFiles(config);

      expect(fs.copy).toHaveBeenCalledWith(
        '/test/source/file1.md',
        '/test/target/file1.md'
      );
      expect(fs.copy).toHaveBeenCalledWith(
        '/test/source/file2.md',
        '/test/target/file2.md'
      );
    });

    test('should validate paths correctly', async () => {
      const config = {
        sourcePath: '/test/source',
        targetPath: '/test/target'
      };

      fs.pathExists.mockImplementation((path) => {
        return Promise.resolve(path === '/test/source');
      });
      fs.access.mockResolvedValue();

      const result = await fileManager.validatePaths(config);

      expect(result).toBe(true);
      expect(fs.pathExists).toHaveBeenCalledWith('/test/source');
    });

    test('should handle invalid source path', async () => {
      const config = {
        sourcePath: '/invalid/source',
        targetPath: '/test/target'
      };

      fs.pathExists.mockResolvedValue(false);

      await expect(fileManager.validatePaths(config)).rejects.toThrow(
        'Source path does not exist'
      );
    });
  });

  describe('ModuleManager', () => {
    let moduleManager;

    beforeEach(() => {
      ModuleManager.mockRestore();
      moduleManager = new ModuleManager();
    });

    test('should install modules successfully', async () => {
      const config = {
        modules: ['module1', 'module2'],
        targetPath: '/test/target'
      };

      const mockInstallModule = jest.fn().mockResolvedValue();
      moduleManager.installModule = mockInstallModule;

      await moduleManager.installModules(config);

      expect(mockInstallModule).toHaveBeenCalledTimes(2);
      expect(mockInstallModule).toHaveBeenCalledWith('module1', '/test/target');
      expect(mockInstallModule).toHaveBeenCalledWith('module2', '/test/target');
    });

    test('should validate installed modules', async () => {
      const modules = ['module1', 'module2'];
      
      fs.pathExists.mockImplementation((path) => {
        return Promise.resolve(path.includes('module1') || path.includes('module2'));
      });

      const result = await moduleManager.validateModules(modules, '/test/target');

      expect(result).toEqual(['module1', 'module2']);
    });

    test('should detect missing modules', async () => {
      const modules = ['module1', 'module2'];
      
      fs.pathExists.mockImplementation((path) => {
        return Promise.resolve(path.includes('module1')); // only module1 exists
      });

      const result = await moduleManager.validateModules(modules, '/test/target');

      expect(result).toEqual(['module1']);
    });

    test('should list installed modules', async () => {
      fs.readdir.mockResolvedValue(['module1', 'module2', '.hidden']);
      fs.stat.mockImplementation((path) => ({
        isDirectory: () => !path.includes('.hidden')
      }));

      const result = await moduleManager.listInstalledModules('/test/target');

      expect(result).toEqual(['module1', 'module2']);
    });
  });

  describe('Installer Integration', () => {
    let installer;

    beforeEach(() => {
      Installer.mockRestore();
      installer = new Installer();
    });

    test('should perform complete installation', async () => {
      const installOptions = {
        targetPath: '/test/install',
        config: 'test-config',
        modules: ['test-module'],
        force: false
      };

      const mockSetup = jest.fn().mockResolvedValue(true);
      const mockValidate = jest.fn().mockResolvedValue({ valid: true });
      
      installer.setup = mockSetup;
      installer.validate = mockValidate;

      const result = await installer.install(installOptions);

      expect(result.success).toBe(true);
      expect(mockSetup).toHaveBeenCalledWith(installOptions);
      expect(mockValidate).toHaveBeenCalledWith(installOptions.targetPath);
    });

    test('should handle installation failure', async () => {
      const installOptions = {
        targetPath: '/test/install',
        config: 'test-config'
      };

      const mockSetup = jest.fn().mockResolvedValue(false);
      installer.setup = mockSetup;

      const result = await installer.install(installOptions);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    test('should handle force installation', async () => {
      const installOptions = {
        targetPath: '/test/install',
        config: 'test-config',
        force: true
      };

      fs.pathExists.mockResolvedValue(true);
      fs.remove.mockResolvedValue();
      
      const mockSetup = jest.fn().mockResolvedValue(true);
      installer.setup = mockSetup;

      await installer.install(installOptions);

      expect(fs.remove).toHaveBeenCalledWith('/test/install');
      expect(mockSetup).toHaveBeenCalledWith(installOptions);
    });
  });
});