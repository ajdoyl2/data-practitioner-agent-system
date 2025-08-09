/**
 * Expansion Pack Installer Test Suite
 * 
 * Tests for the installation process of the bmad-data-practitioner expansion pack
 * as part of Story 1.1: Foundation - Data Agent Infrastructure Setup
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

describe('Expansion Pack Installer - bmad-data-practitioner', () => {
  const expansionPackPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner');
  
  describe('Installation Process Validation', () => {
    test('expansion pack config.yaml is properly formatted for installer', async () => {
      const configPath = path.join(expansionPackPath, 'config.yaml');
      expect(await fs.pathExists(configPath)).toBe(true);
      
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = yaml.load(configContent);
      
      // Validate all required installer fields are present
      expect(config.name).toBeDefined();
      expect(config.version).toBeDefined();
      expect(config['short-title']).toBeDefined();
      expect(config.description).toBeDefined();
      expect(config.author).toBeDefined();
      expect(config.slashPrefix).toBeDefined();
      
      // Validate specific values for installer compatibility
      expect(config.name).toBe('bmad-data-practitioner');
      expect(typeof config.version).toBe('string');
      expect(config.version).toMatch(/^\d+\.\d+\.\d+$/); // Semantic versioning
      expect(config.slashPrefix).toBe('bmadData');
    });

    test('directory structure matches installer expectations', async () => {
      // Verify all required directories exist
      const requiredDirs = ['agents', 'templates', 'tasks', 'checklists', 'data', 'workflows'];
      
      for (const dir of requiredDirs) {
        const dirPath = path.join(expansionPackPath, dir);
        expect(await fs.pathExists(dirPath)).toBe(true);
        
        // Verify directory is readable
        const stats = await fs.stat(dirPath);
        expect(stats.isDirectory()).toBe(true);
      }
    });

    test('expansion pack follows naming conventions', () => {
      // Validate expansion pack name follows kebab-case convention
      expect('bmad-data-practitioner').toMatch(/^bmad-[a-z0-9-]+$/);
      
      // Validate directory structure follows conventions
      const dirName = path.basename(expansionPackPath);
      expect(dirName).toBe('bmad-data-practitioner');
    });

    test('agent files are properly structured for installation', async () => {
      const agentsPath = path.join(expansionPackPath, 'agents');
      const agentFiles = await fs.readdir(agentsPath);
      
      expect(agentFiles.length).toBe(6);
      
      // Verify all agent files follow naming convention
      agentFiles.forEach(file => {
        expect(file).toMatch(/^[a-z-]+\.md$/);
        expect(file).toMatch(/^(data-product-manager|data-architect|data-engineer|data-analyst|ml-engineer|data-qa-engineer)\.md$/);
      });
    });

    test('template files are installer-ready', async () => {
      const templatesPath = path.join(expansionPackPath, 'templates');
      const templateFiles = await fs.readdir(templatesPath);
      
      expect(templateFiles.length).toBe(2);
      expect(templateFiles).toContain('data-requirements-prd.yaml');
      expect(templateFiles).toContain('data-architecture-doc.yaml');
      
      // Verify templates are valid YAML
      for (const templateFile of templateFiles) {
        const templatePath = path.join(templatesPath, templateFile);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        
        // Should not throw on valid YAML
        expect(() => yaml.load(templateContent)).not.toThrow();
      }
    });
  });

  describe('Installer Integration Compatibility', () => {
    test('expansion pack structure matches existing patterns', async () => {
      // Compare with existing expansion pack to ensure consistency
      const existingPackPath = path.join(__dirname, '../../expansion-packs/bmad-infrastructure-devops');
      
      if (await fs.pathExists(existingPackPath)) {
        const existingConfigPath = path.join(existingPackPath, 'config.yaml');
        const existingConfig = yaml.load(await fs.readFile(existingConfigPath, 'utf8'));
        
        const newConfigPath = path.join(expansionPackPath, 'config.yaml');
        const newConfig = yaml.load(await fs.readFile(newConfigPath, 'utf8'));
        
        // Verify same config structure
        expect(Object.keys(newConfig).sort()).toEqual(Object.keys(existingConfig).sort());
        
        // Verify naming convention consistency
        expect(newConfig.name).toMatch(/^bmad-[a-z-]+$/);
        expect(newConfig.slashPrefix).toMatch(/^bmad[A-Z]/);
      }
    });

    test('no conflicts with existing expansion packs', async () => {
      const expansionPacksPath = path.join(__dirname, '../../expansion-packs');
      const existingPacks = (await fs.readdir(expansionPacksPath))
        .filter(item => item.startsWith('bmad-') && item !== 'README.md');
      
      // Verify our pack name is unique
      const packNames = [];
      for (const pack of existingPacks) {
        const configPath = path.join(expansionPacksPath, pack, 'config.yaml');
        if (await fs.pathExists(configPath)) {
          const config = yaml.load(await fs.readFile(configPath, 'utf8'));
          packNames.push(config.name);
        }
      }
      
      // Should have no duplicates (our pack should be unique)
      const uniqueNames = [...new Set(packNames)];
      expect(uniqueNames.length).toBe(packNames.length);
      expect(packNames).toContain('bmad-data-practitioner');
    });

    test('slash prefix is unique across expansion packs', async () => {
      const expansionPacksPath = path.join(__dirname, '../../expansion-packs');
      const existingPacks = (await fs.readdir(expansionPacksPath))
        .filter(item => item.startsWith('bmad-') && item !== 'README.md');
      
      const slashPrefixes = [];
      for (const pack of existingPacks) {
        const configPath = path.join(expansionPacksPath, pack, 'config.yaml');
        if (await fs.pathExists(configPath)) {
          const config = yaml.load(await fs.readFile(configPath, 'utf8'));
          if (config.slashPrefix) {
            slashPrefixes.push(config.slashPrefix);
          }
        }
      }
      
      // Should have no duplicate slash prefixes
      const uniquePrefixes = [...new Set(slashPrefixes)];
      expect(uniquePrefixes.length).toBe(slashPrefixes.length);
      expect(slashPrefixes).toContain('bmadData');
    });
  });

  describe('File Permissions and Access', () => {
    test('all files are readable by installer', async () => {
      const checkReadable = async (dirPath) => {
        const items = await fs.readdir(dirPath);
        
        for (const item of items) {
          const itemPath = path.join(dirPath, item);
          const stats = await fs.stat(itemPath);
          
          if (stats.isDirectory()) {
            await checkReadable(itemPath);
          } else {
            // Verify file is readable
            expect(async () => await fs.access(itemPath, fs.constants.R_OK)).not.toThrow();
          }
        }
      };
      
      await checkReadable(expansionPackPath);
    });

    test('config.yaml has proper encoding', async () => {
      const configPath = path.join(expansionPackPath, 'config.yaml');
      const configBuffer = await fs.readFile(configPath);
      
      // Should be valid UTF-8
      const configString = configBuffer.toString('utf8');
      expect(configString).toBeDefined();
      expect(configString.length).toBeGreaterThan(0);
      
      // Should not have BOM or other encoding issues
      expect(configString.charCodeAt(0)).not.toBe(0xFEFF); // No BOM
    });
  });

  describe('Validation and Error Handling', () => {
    test('missing required fields are detectable', async () => {
      const configPath = path.join(expansionPackPath, 'config.yaml');
      const config = yaml.load(await fs.readFile(configPath, 'utf8'));
      
      const requiredFields = ['name', 'version', 'short-title', 'description', 'author', 'slashPrefix'];
      
      requiredFields.forEach(field => {
        expect(config).toHaveProperty(field);
        expect(config[field]).toBeDefined();
        expect(config[field]).not.toBe('');
      });
    });

    test('version format is valid', async () => {
      const configPath = path.join(expansionPackPath, 'config.yaml');
      const config = yaml.load(await fs.readFile(configPath, 'utf8'));
      
      // Should follow semantic versioning
      expect(config.version).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Should be parseable by semver logic
      const versionParts = config.version.split('.');
      expect(versionParts).toHaveLength(3);
      versionParts.forEach(part => {
        expect(parseInt(part)).not.toBeNaN();
        expect(parseInt(part)).toBeGreaterThanOrEqual(0);
      });
    });
  });
});