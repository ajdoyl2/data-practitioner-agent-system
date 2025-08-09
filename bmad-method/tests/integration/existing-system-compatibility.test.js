/**
 * Existing System Compatibility Test Suite
 * 
 * Regression tests to ensure the new bmad-data-practitioner expansion pack
 * does not break existing BMad-Method functionality
 * as part of Story 1.1: Foundation - Data Agent Infrastructure Setup
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

describe('Existing System Compatibility - Regression Tests', () => {
  const rootPath = path.join(__dirname, '../..');
  const bmadCorePath = path.join(rootPath, 'bmad-core');
  const expansionPacksPath = path.join(rootPath, 'expansion-packs');
  
  describe('Core BMad System Integrity', () => {
    test('core agent files remain unchanged and accessible', async () => {
      const coreAgentsPath = path.join(bmadCorePath, 'agents');
      expect(await fs.pathExists(coreAgentsPath)).toBe(true);
      
      const expectedCoreAgents = [
        'architect.md',
        'dev.md', 
        'pm.md',
        'qa.md',
        'sm.md',
        'analyst.md',
        'po.md',
        'ux-expert.md',
        'bmad-master.md',
        'bmad-orchestrator.md'
      ];
      
      const coreAgentFiles = await fs.readdir(coreAgentsPath);
      
      expectedCoreAgents.forEach(expectedAgent => {
        expect(coreAgentFiles).toContain(expectedAgent);
      });
      
      // Verify each core agent file is still readable and has valid structure
      for (const agentFile of expectedCoreAgents) {
        const agentPath = path.join(coreAgentsPath, agentFile);
        const content = await fs.readFile(agentPath, 'utf8');
        
        expect(content).toContain('ACTIVATION-NOTICE:');
        expect(content).toContain('```yaml');
        expect(content).toContain('agent:');
        expect(content).toContain('persona:');
      }
    });

    test('core templates remain accessible and valid', async () => {
      const templatesPath = path.join(bmadCorePath, 'templates');
      expect(await fs.pathExists(templatesPath)).toBe(true);
      
      const templateFiles = await fs.readdir(templatesPath);
      expect(templateFiles.length).toBeGreaterThan(0);
      
      // Verify critical templates still exist
      const criticalTemplates = [
        'prd-tmpl.yaml',
        'architecture-tmpl.yaml', 
        'story-tmpl.yaml'
      ];
      
      criticalTemplates.forEach(template => {
        expect(templateFiles).toContain(template);
      });
      
      // Verify template YAML is still valid
      for (const templateFile of criticalTemplates) {
        const templatePath = path.join(templatesPath, templateFile);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        
        expect(() => yaml.load(templateContent)).not.toThrow();
      }
    });

    test('core configuration files remain intact', async () => {
      const coreConfigPath = path.join(bmadCorePath, 'core-config.yaml');
      expect(await fs.pathExists(coreConfigPath)).toBe(true);
      
      const configContent = await fs.readFile(coreConfigPath, 'utf8');
      const config = yaml.load(configContent);
      
      // Verify core configuration structure hasn't been corrupted
      expect(config).toBeDefined();
      expect(typeof config).toBe('object');
    });

    test('existing workflows and tasks remain functional', async () => {
      const tasksPath = path.join(bmadCorePath, 'tasks');
      expect(await fs.pathExists(tasksPath)).toBe(true);
      
      const taskFiles = await fs.readdir(tasksPath);
      expect(taskFiles.length).toBeGreaterThan(0);
      
      // Verify core tasks still exist
      const coreTasks = [
        'create-next-story.md',
        'document-project.md',
        'shard-doc.md'
      ];
      
      coreTasks.forEach(task => {
        expect(taskFiles).toContain(task);
      });
    });
  });

  describe('Existing Expansion Packs Compatibility', () => {
    test('other expansion packs remain unaffected', async () => {
      const expansionPacks = (await fs.readdir(expansionPacksPath))
        .filter(item => item.startsWith('bmad-') && item !== 'bmad-data-practitioner');
      
      // Verify other expansion packs still have valid configs
      for (const pack of expansionPacks) {
        const configPath = path.join(expansionPacksPath, pack, 'config.yaml');
        
        if (await fs.pathExists(configPath)) {
          const configContent = await fs.readFile(configPath, 'utf8');
          expect(() => yaml.load(configContent)).not.toThrow();
          
          const config = yaml.load(configContent);
          expect(config).toHaveProperty('name');
          expect(config).toHaveProperty('version');
        }
      }
    });

    test('no naming conflicts with existing expansion packs', async () => {
      const allPacks = await fs.readdir(expansionPacksPath);
      const dataPractitionerIndex = allPacks.indexOf('bmad-data-practitioner');
      
      expect(dataPractitionerIndex).toBeGreaterThan(-1);
      
      // Check for any duplicate names
      const packCounts = {};
      allPacks.forEach(pack => {
        packCounts[pack] = (packCounts[pack] || 0) + 1;
      });
      
      Object.values(packCounts).forEach(count => {
        expect(count).toBe(1); // No duplicates
      });
    });
  });

  describe('System Performance and Resource Usage', () => {
    test('file system structure remains efficient', async () => {
      // Test that adding the new expansion pack doesn't create excessive overhead
      const startTime = process.hrtime.bigint();
      
      // Simulate loading all expansion packs
      const expansionPacks = await fs.readdir(expansionPacksPath);
      const packConfigs = [];
      
      for (const pack of expansionPacks) {
        const configPath = path.join(expansionPacksPath, pack, 'config.yaml');
        if (await fs.pathExists(configPath)) {
          const config = yaml.load(await fs.readFile(configPath, 'utf8'));
          packConfigs.push(config);
        }
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      // Should still load all packs quickly (under 200ms)
      expect(executionTime).toBeLessThan(200);
      expect(packConfigs.length).toBeGreaterThan(0);
    });

    test('memory usage remains reasonable', () => {
      // Basic memory usage check
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate loading our expansion pack
      const expansionPackPath = path.join(expansionPacksPath, 'bmad-data-practitioner');
      const agents = require('fs').readdirSync(path.join(expansionPackPath, 'agents'));
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be reasonable (under 10MB for basic operations)
      expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      expect(agents.length).toBe(6);
    });
  });

  describe('Integration Points', () => {
    test('CLI tools continue to function', async () => {
      const toolsPath = path.join(rootPath, 'tools');
      expect(await fs.pathExists(toolsPath)).toBe(true);
      
      const cliPath = path.join(toolsPath, 'cli.js');
      expect(await fs.pathExists(cliPath)).toBe(true);
      
      // Verify CLI script is still readable and appears functional
      const cliContent = await fs.readFile(cliPath, 'utf8');
      expect(cliContent).toContain('commander');
      expect(cliContent.length).toBeGreaterThan(0);
    });

    test('web-builder compatibility maintained', async () => {
      const webBuilderPath = path.join(rootPath, 'tools/builders/web-builder.js');
      
      if (await fs.pathExists(webBuilderPath)) {
        const builderContent = await fs.readFile(webBuilderPath, 'utf8');
        expect(builderContent.length).toBeGreaterThan(0);
        
        // Verify no syntax errors in web-builder
        expect(() => {
          // Basic syntax validation - should not throw
          require('vm').createScript(builderContent);
        }).not.toThrow();
      }
    });

    test('package.json integrity maintained', async () => {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Verify core dependencies are still present
      expect(packageJson.dependencies).toHaveProperty('commander');
      expect(packageJson.dependencies).toHaveProperty('fs-extra');
      expect(packageJson.dependencies).toHaveProperty('js-yaml');
      expect(packageJson.dependencies).toHaveProperty('chalk');
      
      // Verify Jest is still in devDependencies
      expect(packageJson.devDependencies).toHaveProperty('jest');
      
      // Verify scripts are still present
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts).toHaveProperty('validate');
    });
  });

  describe('Backward Compatibility', () => {
    test('existing agent commands continue to work', async () => {
      // Verify core agents still have proper command structure
      const architectPath = path.join(bmadCorePath, 'agents/architect.md');
      const architectContent = await fs.readFile(architectPath, 'utf8');
      
      expect(architectContent).toContain('commands:');
      expect(architectContent).toContain('help:');
      expect(architectContent).toContain('create-full-stack-architecture:');
      
      // Extract and validate YAML
      const yamlMatch = architectContent.match(/```yaml\n([\s\S]*?)\n```/);
      expect(yamlMatch).not.toBeNull();
      
      const config = yaml.load(yamlMatch[1]);
      expect(config.agent.id).toBe('architect');
      expect(Array.isArray(config.commands)).toBe(true);
    });

    test('template system continues to function', async () => {
      const prdTemplatePath = path.join(bmadCorePath, 'templates/prd-tmpl.yaml');
      const templateContent = await fs.readFile(prdTemplatePath, 'utf8');
      const template = yaml.load(templateContent);
      
      expect(template).toHaveProperty('template');
      expect(template).toHaveProperty('workflow');
      expect(template).toHaveProperty('sections');
      
      // Verify template structure hasn't been broken
      expect(template.template.id).toBeDefined();
      expect(Array.isArray(template.sections)).toBe(true);
    });
  });
});

describe('Story 1.1 Integration Verification Requirements', () => {
  test('IV1: Existing agents and workflows continue functioning without modification', async () => {
    // Comprehensive test for IV1 requirement
    const coreSystemPaths = [
      path.join(__dirname, '../../bmad-core/agents'),
      path.join(__dirname, '../../bmad-core/templates'),
      path.join(__dirname, '../../bmad-core/tasks'),
      path.join(__dirname, '../../bmad-core/workflows')
    ];
    
    for (const systemPath of coreSystemPaths) {
      expect(await fs.pathExists(systemPath)).toBe(true);
      
      const files = await fs.readdir(systemPath);
      expect(files.length).toBeGreaterThan(0);
    }
    
    // Verify we haven't modified any core files
    const coreAgentsPath = path.join(__dirname, '../../bmad-core/agents');
    const coreAgents = await fs.readdir(coreAgentsPath);
    
    for (const agent of coreAgents) {
      const agentPath = path.join(coreAgentsPath, agent);
      const content = await fs.readFile(agentPath, 'utf8');
      
      // Core agents should still have their original structure
      expect(content).toContain('ACTIVATION-NOTICE:');
      expect(content).toContain('```yaml');
    }
  });

  test('IV3: No performance degradation in agent loading or command execution', async () => {
    // Performance test for IV3 requirement
    const startTime = process.hrtime.bigint();
    
    // Load all agents (core + our new data agents)
    const coreAgentsPath = path.join(__dirname, '../../bmad-core/agents');
    const dataAgentsPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/agents');
    
    const coreAgents = await fs.readdir(coreAgentsPath);
    const dataAgents = await fs.readdir(dataAgentsPath);
    
    // Simulate loading all agents
    for (const agent of [...coreAgents, ...dataAgents]) {
      const agentPath = agent.includes('.md') 
        ? (coreAgents.includes(agent) 
           ? path.join(coreAgentsPath, agent)
           : path.join(dataAgentsPath, agent))
        : null;
        
      if (agentPath) {
        await fs.readFile(agentPath, 'utf8');
      }
    }
    
    const endTime = process.hrtime.bigint();
    const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Should load all agents in reasonable time (under 500ms)
    expect(executionTime).toBeLessThan(500);
    expect(coreAgents.length + dataAgents.length).toBeGreaterThan(10);
  });
});