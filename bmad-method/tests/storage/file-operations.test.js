/**
 * File-Based Storage Operations Test Suite
 * Tests for YAML configuration loading, Markdown processing, and file system operations
 */

const fs = require('fs-extra');
const path = require('path');
const yamlUtils = require('../../tools/lib/yaml-utils');

jest.mock('fs-extra');

describe('File-Based Storage Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('YAML Configuration Loading', () => {
    test('should load YAML configuration correctly', async () => {
      const mockYamlContent = `
name: test-config
version: 1.0
settings:
  debug: true
  port: 3000
`;
      
      fs.readFile.mockResolvedValue(mockYamlContent);
      
      const result = await yamlUtils.loadYaml('/test/config.yaml');
      
      expect(result).toEqual({
        name: 'test-config',
        version: 1.0,
        settings: {
          debug: true,
          port: 3000
        }
      });
      expect(fs.readFile).toHaveBeenCalledWith('/test/config.yaml', 'utf8');
    });

    test('should handle missing YAML files', async () => {
      fs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));
      
      await expect(yamlUtils.loadYaml('/test/missing.yaml')).rejects.toThrow(
        'ENOENT: no such file'
      );
    });

    test('should handle invalid YAML syntax', async () => {
      const invalidYaml = `
name: test
invalid: yaml: content: [
  - missing bracket
`;
      
      fs.readFile.mockResolvedValue(invalidYaml);
      
      await expect(yamlUtils.loadYaml('/test/invalid.yaml')).rejects.toThrow();
    });

    test('should save YAML configuration correctly', async () => {
      const config = {
        name: 'test-config',
        settings: {
          enabled: true,
          timeout: 5000
        }
      };
      
      fs.writeFile.mockResolvedValue();
      
      await yamlUtils.saveYaml('/test/config.yaml', config);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/config.yaml',
        expect.stringContaining('name: test-config'),
        'utf8'
      );
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/config.yaml',
        expect.stringContaining('enabled: true'),
        'utf8'
      );
    });
  });

  describe('Markdown Document Parsing', () => {
    test('should extract YAML frontmatter from markdown', () => {
      const markdownContent = `---
title: Test Document
author: Test Author
tags:
  - test
  - markdown
---

# Test Document

This is the content of the test document.

## Section 1

Some content here.`;

      const result = yamlUtils.extractYamlFrontmatter(markdownContent);
      
      expect(result.frontmatter).toEqual({
        title: 'Test Document',
        author: 'Test Author',
        tags: ['test', 'markdown']
      });
      expect(result.content).toContain('# Test Document');
      expect(result.content).toContain('This is the content');
    });

    test('should handle markdown without frontmatter', () => {
      const markdownContent = `# Simple Document

This document has no YAML frontmatter.`;

      const result = yamlUtils.extractYamlFrontmatter(markdownContent);
      
      expect(result.frontmatter).toBeNull();
      expect(result.content).toBe(markdownContent);
    });

    test('should extract YAML from agent files', () => {
      const agentContent = `---
name: Test Agent
commands:
  - help
  - build
dependencies:
  tasks:
    - test-task.md
---

# Test Agent

Agent instructions here.`;

      const result = yamlUtils.extractYamlFromAgent(agentContent);
      
      expect(result).toContain('name: Test Agent');
      expect(result).toContain('commands:');
      expect(result).toContain('dependencies:');
    });

    test('should handle agent files without YAML', () => {
      const agentContent = `# Simple Agent

No YAML configuration here.`;

      const result = yamlUtils.extractYamlFromAgent(agentContent);
      
      expect(result).toBeNull();
    });

    test('should parse markdown sections', () => {
      const markdownContent = `# Main Title

## Section 1
Content for section 1.

## Section 2
Content for section 2.

### Subsection 2.1
Nested content.`;

      const sections = yamlUtils.parseMarkdownSections(markdownContent);
      
      expect(sections).toHaveLength(3);
      expect(sections[0]).toEqual({
        level: 1,
        title: 'Main Title',
        content: expect.any(String)
      });
      expect(sections[1]).toEqual({
        level: 2,
        title: 'Section 1',
        content: 'Content for section 1.'
      });
      expect(sections[2]).toEqual({
        level: 2,
        title: 'Section 2',
        content: expect.stringContaining('Content for section 2')
      });
    });
  });

  describe('File System Operations', () => {
    test('should validate file paths correctly', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.access.mockResolvedValue();
      
      const isValid = await yamlUtils.validatePath('/test/valid/path');
      
      expect(isValid).toBe(true);
      expect(fs.pathExists).toHaveBeenCalledWith('/test/valid/path');
    });

    test('should detect invalid file paths', async () => {
      fs.pathExists.mockResolvedValue(false);
      
      const isValid = await yamlUtils.validatePath('/test/invalid/path');
      
      expect(isValid).toBe(false);
    });

    test('should handle path traversal attempts', async () => {
      const maliciousPath = '/test/../../../etc/passwd';
      
      const isValid = await yamlUtils.validatePath(maliciousPath, '/test');
      
      expect(isValid).toBe(false);
    });

    test('should resolve relative paths correctly', () => {
      const basePath = '/test/project';
      const relativePath = './config/settings.yaml';
      
      const resolved = yamlUtils.resolvePath(basePath, relativePath);
      
      expect(resolved).toBe(path.join(basePath, relativePath));
      expect(path.isAbsolute(resolved)).toBe(true);
    });

    test('should handle absolute paths', () => {
      const basePath = '/test/project';
      const absolutePath = '/etc/config.yaml';
      
      const resolved = yamlUtils.resolvePath(basePath, absolutePath);
      
      expect(resolved).toBe(absolutePath);
    });

    test('should ensure directory exists before writing', async () => {
      const filePath = '/test/deep/nested/config.yaml';
      const dirPath = '/test/deep/nested';
      
      fs.ensureDir.mockResolvedValue();
      fs.writeFile.mockResolvedValue();
      
      await yamlUtils.ensureFileDir(filePath);
      
      expect(fs.ensureDir).toHaveBeenCalledWith(dirPath);
    });
  });

  describe('Technical Preferences Management', () => {
    test('should load technical preferences correctly', async () => {
      const mockPreferences = `# Technical Preferences

## Framework Preferences
- React for frontend
- Node.js for backend
- PostgreSQL for database

## Code Standards
- ESLint for linting
- Prettier for formatting
- Jest for testing`;

      fs.readFile.mockResolvedValue(mockPreferences);
      
      const preferences = await yamlUtils.loadTechnicalPreferences('/test/project');
      
      expect(preferences).toContain('Framework Preferences');
      expect(preferences).toContain('React for frontend');
      expect(preferences).toContain('Code Standards');
      expect(fs.readFile).toHaveBeenCalledWith(
        expect.stringContaining('technical-preferences.md'),
        'utf8'
      );
    });

    test('should handle missing technical preferences', async () => {
      fs.readFile.mockRejectedValue(new Error('ENOENT: no such file'));
      
      const preferences = await yamlUtils.loadTechnicalPreferences('/test/project');
      
      expect(preferences).toBe('');
    });

    test('should save technical preferences', async () => {
      const preferences = `# Updated Technical Preferences

## New Standards
- TypeScript preferred
- Tailwind CSS for styling`;

      fs.writeFile.mockResolvedValue();
      
      await yamlUtils.saveTechnicalPreferences('/test/project', preferences);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('technical-preferences.md'),
        preferences,
        'utf8'
      );
    });
  });

  describe('Core Configuration Management', () => {
    test('should load core config correctly', async () => {
      const mockCoreConfig = `
prd:
  prdFile: docs/prd.md
  prdVersion: v4
architecture:
  architectureFile: docs/architecture.md
  architectureVersion: v4
devLoadAlwaysFiles:
  - docs/standards.md
  - docs/tech-stack.md
`;

      fs.readFile.mockResolvedValue(mockCoreConfig);
      
      const config = await yamlUtils.loadCoreConfig('/test/project');
      
      expect(config).toHaveProperty('prd');
      expect(config).toHaveProperty('architecture');
      expect(config).toHaveProperty('devLoadAlwaysFiles');
      expect(config.prd.prdFile).toBe('docs/prd.md');
      expect(config.devLoadAlwaysFiles).toContain('docs/standards.md');
    });

    test('should save core config correctly', async () => {
      const config = {
        prd: {
          prdFile: 'docs/prd.md',
          prdVersion: 'v4'
        },
        architecture: {
          architectureFile: 'docs/architecture.md'
        }
      };
      
      fs.writeFile.mockResolvedValue();
      
      await yamlUtils.saveCoreConfig('/test/project', config);
      
      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('core-config.yaml'),
        expect.stringContaining('prdFile: docs/prd.md'),
        'utf8'
      );
    });

    test('should validate core config structure', () => {
      const validConfig = {
        prd: { prdFile: 'docs/prd.md' },
        architecture: { architectureFile: 'docs/arch.md' },
        devLoadAlwaysFiles: []
      };
      
      const invalidConfig = {
        prd: { invalidField: 'test' }
      };
      
      expect(yamlUtils.validateCoreConfig(validConfig)).toBe(true);
      expect(yamlUtils.validateCoreConfig(invalidConfig)).toBe(false);
    });
  });

  describe('Expansion Pack File Structure', () => {
    test('should validate expansion pack structure', async () => {
      const packPath = '/test/expansion-packs/test-pack';
      
      fs.pathExists.mockImplementation((path) => {
        const requiredDirs = ['agents', 'tasks', 'templates', 'checklists', 'data'];
        return Promise.resolve(requiredDirs.some(dir => path.includes(dir)));
      });
      
      const isValid = await yamlUtils.validateExpansionPackStructure(packPath);
      
      expect(isValid).toBe(true);
    });

    test('should detect missing expansion pack directories', async () => {
      const packPath = '/test/expansion-packs/incomplete-pack';
      
      fs.pathExists.mockResolvedValue(false);
      
      const isValid = await yamlUtils.validateExpansionPackStructure(packPath);
      
      expect(isValid).toBe(false);
    });

    test('should load expansion pack config', async () => {
      const mockConfig = `
packName: test-expansion
version: 1.0.0
description: Test expansion pack
dependencies:
  - bmad-core
agents:
  - test-agent
`;

      fs.readFile.mockResolvedValue(mockConfig);
      
      const config = await yamlUtils.loadExpansionConfig('/test/expansion-packs/test-pack');
      
      expect(config).toHaveProperty('packName');
      expect(config).toHaveProperty('version');
      expect(config.packName).toBe('test-expansion');
      expect(config.agents).toContain('test-agent');
    });
  });

  describe('Backup and Recovery', () => {
    test('should create backup of configuration files', async () => {
      const filePath = '/test/config.yaml';
      const backupPath = '/test/config.yaml.backup';
      
      fs.copy.mockResolvedValue();
      
      await yamlUtils.createBackup(filePath);
      
      expect(fs.copy).toHaveBeenCalledWith(
        filePath,
        expect.stringContaining('.backup')
      );
    });

    test('should restore from backup', async () => {
      const filePath = '/test/config.yaml';
      const backupPath = '/test/config.yaml.backup';
      
      fs.pathExists.mockResolvedValue(true);
      fs.copy.mockResolvedValue();
      
      await yamlUtils.restoreFromBackup(filePath);
      
      expect(fs.pathExists).toHaveBeenCalledWith(
        expect.stringContaining('.backup')
      );
      expect(fs.copy).toHaveBeenCalledWith(
        expect.stringContaining('.backup'),
        filePath
      );
    });

    test('should handle missing backup files', async () => {
      const filePath = '/test/config.yaml';
      
      fs.pathExists.mockResolvedValue(false);
      
      await expect(yamlUtils.restoreFromBackup(filePath)).rejects.toThrow(
        'Backup file not found'
      );
    });

    test('should clean old backup files', async () => {
      const configDir = '/test/config';
      const backupFiles = [
        'config.yaml.backup.1',
        'config.yaml.backup.2',
        'config.yaml.backup.3',
        'config.yaml.backup.4',
        'config.yaml.backup.5'
      ];
      
      fs.readdir.mockResolvedValue(backupFiles);
      fs.remove.mockResolvedValue();
      
      await yamlUtils.cleanOldBackups(configDir, 3);
      
      expect(fs.remove).toHaveBeenCalledTimes(2); // Remove 2 oldest backups
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle concurrent file access', async () => {
      let readCount = 0;
      fs.readFile.mockImplementation(() => {
        readCount++;
        if (readCount === 1) {
          return new Promise(resolve => setTimeout(() => resolve('content'), 100));
        }
        return Promise.resolve('content');
      });
      
      const [result1, result2] = await Promise.all([
        yamlUtils.loadYaml('/test/config.yaml'),
        yamlUtils.loadYaml('/test/config.yaml')
      ]);
      
      expect(result1).toBe('content');
      expect(result2).toBe('content');
    });

    test('should handle large file operations', async () => {
      const largeContent = 'x'.repeat(10 * 1024 * 1024); // 10MB string
      
      fs.readFile.mockResolvedValue(largeContent);
      fs.writeFile.mockResolvedValue();
      
      const content = await yamlUtils.loadYaml('/test/large-config.yaml');
      await yamlUtils.saveYaml('/test/large-output.yaml', { content });
      
      expect(content).toBe(largeContent);
      expect(fs.writeFile).toHaveBeenCalledWith(
        '/test/large-output.yaml',
        expect.stringContaining('content:'),
        'utf8'
      );
    });

    test('should handle file system permission errors', async () => {
      fs.readFile.mockRejectedValue(new Error('EACCES: permission denied'));
      
      await expect(yamlUtils.loadYaml('/protected/config.yaml')).rejects.toThrow(
        'EACCES: permission denied'
      );
    });

    test('should handle disk space errors', async () => {
      fs.writeFile.mockRejectedValue(new Error('ENOSPC: no space left on device'));
      
      await expect(yamlUtils.saveYaml('/test/config.yaml', {})).rejects.toThrow(
        'ENOSPC: no space left on device'
      );
    });
  });
});