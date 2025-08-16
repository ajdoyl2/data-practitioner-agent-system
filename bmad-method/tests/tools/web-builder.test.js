/**
 * Web Builder Comprehensive Unit Test Suite
 * Tests for tools/builders/web-builder.js - Web bundle generation
 */

const fs = require('fs').promises;
const path = require('path');
const WebBuilder = require('../../tools/builders/web-builder');
const DependencyResolver = require('../../tools/lib/dependency-resolver');
const yamlUtils = require('../../tools/lib/yaml-utils');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn(),
    rm: jest.fn()
  }
}));

jest.mock('../../tools/lib/dependency-resolver');
jest.mock('../../tools/lib/yaml-utils');

describe('WebBuilder Unit Tests', () => {
  let webBuilder;
  let mockResolver;
  const mockRootDir = '/test/project';

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock DependencyResolver
    mockResolver = {
      listAgents: jest.fn(),
      listTeams: jest.fn(),
      resolveAgentDependencies: jest.fn(),
      resolveTeamDependencies: jest.fn(),
      loadAgent: jest.fn(),
      loadTeam: jest.fn()
    };
    DependencyResolver.mockImplementation(() => mockResolver);

    webBuilder = new WebBuilder({
      rootDir: mockRootDir,
      outputDirs: [path.join(mockRootDir, 'dist')]
    });
  });

  describe('Constructor', () => {
    test('should initialize with default values', () => {
      const builder = new WebBuilder();
      
      expect(builder.rootDir).toBe(process.cwd());
      expect(builder.outputDirs).toEqual([path.join(process.cwd(), 'dist')]);
      expect(builder.resolver).toBeInstanceOf(DependencyResolver);
    });

    test('should initialize with custom options', () => {
      const customOptions = {
        rootDir: '/custom/path',
        outputDirs: ['/custom/output']
      };
      
      const builder = new WebBuilder(customOptions);
      
      expect(builder.rootDir).toBe('/custom/path');
      expect(builder.outputDirs).toEqual(['/custom/output']);
    });

    test('should set correct template path', () => {
      expect(webBuilder.templatePath).toBe(
        path.join(mockRootDir, 'tools', 'md-assets', 'web-agent-startup-instructions.md')
      );
    });
  });

  describe('parseYaml', () => {
    test('should parse valid YAML content', () => {
      const yamlContent = 'key: value\nlist:\n  - item1\n  - item2';
      const result = webBuilder.parseYaml(yamlContent);
      
      expect(result).toEqual({
        key: 'value',
        list: ['item1', 'item2']
      });
    });

    test('should handle empty YAML content', () => {
      const result = webBuilder.parseYaml('');
      expect(result).toBeUndefined();
    });
  });

  describe('convertToWebPath', () => {
    test('should convert bmad-core paths correctly', () => {
      const filePath = path.join(mockRootDir, 'bmad-core', 'agents', 'test.md');
      const result = webBuilder.convertToWebPath(filePath);
      
      expect(result).toBe('.bmad-core/agents/test.md');
    });

    test('should convert expansion pack paths correctly', () => {
      const filePath = path.join(mockRootDir, 'expansion-packs', 'test-pack', 'agents', 'test.md');
      const result = webBuilder.convertToWebPath(filePath);
      
      expect(result).toBe('.bmad-core/agents/test.md');
    });

    test('should convert common paths correctly', () => {
      const filePath = path.join(mockRootDir, 'common', 'tasks', 'test.md');
      const result = webBuilder.convertToWebPath(filePath);
      
      expect(result).toBe('.bmad-core/tasks/test.md');
    });

    test('should handle custom bundle root', () => {
      const filePath = path.join(mockRootDir, 'bmad-core', 'agents', 'test.md');
      const result = webBuilder.convertToWebPath(filePath, 'custom-pack');
      
      expect(result).toBe('.custom-pack/agents/test.md');
    });
  });

  describe('generateWebInstructions', () => {
    test('should generate instructions for bmad-core bundle', () => {
      const result = webBuilder.generateWebInstructions('agent');
      
      expect(result).toContain('.bmad-core');
      expect(result).not.toContain('.test-pack');
    });

    test('should generate instructions for expansion pack bundle', () => {
      const result = webBuilder.generateWebInstructions('agent', 'test-pack');
      
      expect(result).toContain('.test-pack');
      expect(result).not.toContain('.bmad-core');
    });

    test('should include proper file path examples', () => {
      const result = webBuilder.generateWebInstructions('agent', 'test-pack');
      
      expect(result).toContain('.test-pack/folder/filename.md');
      expect(result).toContain('.test-pack/personas/analyst.md');
      expect(result).toContain('.test-pack/tasks/create-story.md');
    });
  });

  describe('buildAgents', () => {
    beforeEach(() => {
      mockResolver.listAgents.mockResolvedValue(['agent1', 'agent2']);
      mockResolver.loadAgent.mockResolvedValue({
        content: 'Agent content',
        filePath: '/test/path/agent.md'
      });
      mockResolver.resolveAgentDependencies.mockResolvedValue([
        { content: 'Dependency content', filePath: '/test/dep.md' }
      ]);
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
    });

    test('should build all agents successfully', async () => {
      await webBuilder.buildAgents();
      
      expect(mockResolver.listAgents).toHaveBeenCalledTimes(1);
      expect(mockResolver.loadAgent).toHaveBeenCalledTimes(2);
      expect(mockResolver.loadAgent).toHaveBeenCalledWith('agent1');
      expect(mockResolver.loadAgent).toHaveBeenCalledWith('agent2');
    });

    test('should resolve dependencies for each agent', async () => {
      await webBuilder.buildAgents();
      
      expect(mockResolver.resolveAgentDependencies).toHaveBeenCalledTimes(2);
      expect(mockResolver.resolveAgentDependencies).toHaveBeenCalledWith('agent1');
      expect(mockResolver.resolveAgentDependencies).toHaveBeenCalledWith('agent2');
    });

    test('should create output directories', async () => {
      await webBuilder.buildAgents();
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(mockRootDir, 'dist', 'agents'),
        { recursive: true }
      );
    });

    test('should write agent bundle files', async () => {
      await webBuilder.buildAgents();
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockRootDir, 'dist', 'agents', 'agent1.md'),
        expect.stringContaining('Agent content')
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join(mockRootDir, 'dist', 'agents', 'agent2.md'),
        expect.stringContaining('Agent content')
      );
    });
  });

  describe('buildTeams', () => {
    beforeEach(() => {
      mockResolver.listTeams.mockResolvedValue(['team1', 'team2']);
      mockResolver.loadTeam.mockResolvedValue({
        content: 'Team content',
        filePath: '/test/path/team.yaml'
      });
      mockResolver.resolveTeamDependencies.mockResolvedValue([
        { content: 'Team dependency', filePath: '/test/team-dep.md' }
      ]);
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
    });

    test('should build all teams successfully', async () => {
      await webBuilder.buildTeams();
      
      expect(mockResolver.listTeams).toHaveBeenCalledTimes(1);
      expect(mockResolver.loadTeam).toHaveBeenCalledTimes(2);
      expect(mockResolver.loadTeam).toHaveBeenCalledWith('team1');
      expect(mockResolver.loadTeam).toHaveBeenCalledWith('team2');
    });

    test('should resolve dependencies for each team', async () => {
      await webBuilder.buildTeams();
      
      expect(mockResolver.resolveTeamDependencies).toHaveBeenCalledTimes(2);
      expect(mockResolver.resolveTeamDependencies).toHaveBeenCalledWith('team1');
      expect(mockResolver.resolveTeamDependencies).toHaveBeenCalledWith('team2');
    });
  });

  describe('listExpansionPacks', () => {
    beforeEach(() => {
      fs.readdir.mockResolvedValue(['pack1', 'pack2', '.hidden', 'README.md']);
      fs.stat.mockImplementation((filepath) => {
        const filename = path.basename(filepath);
        return Promise.resolve({
          isDirectory: () => !filename.startsWith('.') && !filename.endsWith('.md')
        });
      });
    });

    test('should list expansion packs correctly', async () => {
      const packs = await webBuilder.listExpansionPacks();
      
      expect(packs).toEqual(['pack1', 'pack2']);
      expect(fs.readdir).toHaveBeenCalledWith(
        path.join(mockRootDir, 'expansion-packs')
      );
    });

    test('should filter out non-directories', async () => {
      const packs = await webBuilder.listExpansionPacks();
      
      expect(packs).not.toContain('.hidden');
      expect(packs).not.toContain('README.md');
    });

    test('should handle missing expansion-packs directory', async () => {
      fs.readdir.mockRejectedValue(new Error('ENOENT'));
      
      const packs = await webBuilder.listExpansionPacks();
      
      expect(packs).toEqual([]);
    });
  });

  describe('cleanOutputDirs', () => {
    beforeEach(() => {
      fs.rm.mockResolvedValue();
      fs.mkdir.mockResolvedValue();
    });

    test('should clean and recreate output directories', async () => {
      await webBuilder.cleanOutputDirs();
      
      expect(fs.rm).toHaveBeenCalledWith(
        path.join(mockRootDir, 'dist'),
        { recursive: true, force: true }
      );
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(mockRootDir, 'dist'),
        { recursive: true }
      );
    });

    test('should handle multiple output directories', async () => {
      webBuilder.outputDirs = ['/dir1', '/dir2'];
      
      await webBuilder.cleanOutputDirs();
      
      expect(fs.rm).toHaveBeenCalledTimes(2);
      expect(fs.rm).toHaveBeenCalledWith('/dir1', { recursive: true, force: true });
      expect(fs.rm).toHaveBeenCalledWith('/dir2', { recursive: true, force: true });
      
      expect(fs.mkdir).toHaveBeenCalledTimes(2);
      expect(fs.mkdir).toHaveBeenCalledWith('/dir1', { recursive: true });
      expect(fs.mkdir).toHaveBeenCalledWith('/dir2', { recursive: true });
    });
  });

  describe('buildExpansionPack', () => {
    beforeEach(() => {
      fs.stat.mockResolvedValue({ isDirectory: () => true });
      fs.readdir.mockResolvedValue(['config.yaml']);
      fs.readFile.mockResolvedValue('packName: test-pack\nversion: 1.0.0');
      yamlUtils.loadYaml.mockReturnValue({
        packName: 'test-pack',
        version: '1.0.0'
      });
      
      mockResolver.listAgents.mockResolvedValue(['pack-agent']);
      mockResolver.listTeams.mockResolvedValue(['pack-team']);
      mockResolver.loadAgent.mockResolvedValue({
        content: 'Pack agent content',
        filePath: '/test/pack/agent.md'
      });
      mockResolver.loadTeam.mockResolvedValue({
        content: 'Pack team content',
        filePath: '/test/pack/team.yaml'
      });
      mockResolver.resolveAgentDependencies.mockResolvedValue([]);
      mockResolver.resolveTeamDependencies.mockResolvedValue([]);
      
      fs.mkdir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
    });

    test('should build expansion pack successfully', async () => {
      await webBuilder.buildExpansionPack('test-pack');
      
      expect(fs.stat).toHaveBeenCalledWith(
        path.join(mockRootDir, 'expansion-packs', 'test-pack')
      );
      expect(yamlUtils.loadYaml).toHaveBeenCalledWith(
        path.join(mockRootDir, 'expansion-packs', 'test-pack', 'config.yaml')
      );
    });

    test('should create pack-specific output directory', async () => {
      await webBuilder.buildExpansionPack('test-pack');
      
      expect(fs.mkdir).toHaveBeenCalledWith(
        path.join(mockRootDir, 'dist', 'expansion-packs', 'test-pack'),
        { recursive: true }
      );
    });

    test('should handle missing expansion pack', async () => {
      fs.stat.mockRejectedValue(new Error('ENOENT'));
      
      await expect(webBuilder.buildExpansionPack('nonexistent')).rejects.toThrow(
        'Expansion pack "nonexistent" not found'
      );
    });

    test('should handle missing config.yaml', async () => {
      yamlUtils.loadYaml.mockImplementation(() => {
        throw new Error('Config file not found');
      });
      
      await expect(webBuilder.buildExpansionPack('test-pack')).rejects.toThrow(
        'Failed to load expansion pack config'
      );
    });
  });

  describe('Error Handling', () => {
    test('should handle filesystem errors gracefully', async () => {
      mockResolver.listAgents.mockResolvedValue(['agent1']);
      mockResolver.loadAgent.mockRejectedValue(new Error('File not found'));
      
      await expect(webBuilder.buildAgents()).rejects.toThrow('File not found');
    });

    test('should handle dependency resolution errors', async () => {
      mockResolver.listAgents.mockResolvedValue(['agent1']);
      mockResolver.loadAgent.mockResolvedValue({
        content: 'Agent content',
        filePath: '/test/agent.md'
      });
      mockResolver.resolveAgentDependencies.mockRejectedValue(
        new Error('Dependency error')
      );
      
      await expect(webBuilder.buildAgents()).rejects.toThrow('Dependency error');
    });
  });
});