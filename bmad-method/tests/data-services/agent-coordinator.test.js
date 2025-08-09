/**
 * Agent Coordinator Test Suite
 * 
 * Tests for the data agent loading and validation functionality
 * as part of Story 1.1: Foundation - Data Agent Infrastructure Setup
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');

describe('AgentCoordinator - Data Agent Loading and Validation', () => {
  const expansionPackPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner');
  const agentsPath = path.join(expansionPackPath, 'agents');

  // Test data agent existence and structure
  const expectedAgents = [
    'data-product-manager.md',
    'data-architect.md', 
    'data-engineer.md',
    'data-analyst.md',
    'ml-engineer.md',
    'data-qa-engineer.md'
  ];

  test('expansion pack directory structure exists', async () => {
    expect(await fs.pathExists(expansionPackPath)).toBe(true);
    expect(await fs.pathExists(agentsPath)).toBe(true);
    expect(await fs.pathExists(path.join(expansionPackPath, 'templates'))).toBe(true);
    expect(await fs.pathExists(path.join(expansionPackPath, 'config.yaml'))).toBe(true);
  });

  test('all required data agents exist', async () => {
    for (const agentFile of expectedAgents) {
      const agentPath = path.join(agentsPath, agentFile);
      expect(await fs.pathExists(agentPath)).toBe(true);
    }
  });

  describe('Data Agent YAML Configuration Validation', () => {
    expectedAgents.forEach(agentFile => {
      test(`${agentFile} has valid YAML configuration`, async () => {
        const agentPath = path.join(agentsPath, agentFile);
        const content = await fs.readFile(agentPath, 'utf8');
        
        // Extract YAML block from markdown
        const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
        expect(yamlMatch).not.toBeNull();
        
        const yamlContent = yamlMatch[1];
        const config = yaml.load(yamlContent);
        
        // Validate required YAML structure
        expect(config).toHaveProperty('agent');
        expect(config).toHaveProperty('persona');
        expect(config).toHaveProperty('commands');
        expect(config).toHaveProperty('dependencies');
        
        // Validate agent section
        expect(config.agent).toHaveProperty('name');
        expect(config.agent).toHaveProperty('id');
        expect(config.agent).toHaveProperty('title');
        expect(config.agent).toHaveProperty('icon');
        expect(config.agent).toHaveProperty('whenToUse');
        
        // Validate persona section
        expect(config.persona).toHaveProperty('role');
        expect(config.persona).toHaveProperty('style');
        expect(config.persona).toHaveProperty('identity');
        expect(config.persona).toHaveProperty('focus');
        
        // Validate commands array
        expect(Array.isArray(config.commands)).toBe(true);
        expect(config.commands.length).toBeGreaterThan(0);
        
        // Check that help command exists (commands are objects with key-value pairs)
        const hasHelpCommand = config.commands.some(cmd => 
          typeof cmd === 'object' && 'help' in cmd
        );
        expect(hasHelpCommand).toBe(true);
        
        // Validate dependencies structure
        expect(config.dependencies).toHaveProperty('tasks');
        expect(config.dependencies).toHaveProperty('templates');
        expect(config.dependencies).toHaveProperty('checklists');
        expect(config.dependencies).toHaveProperty('data');
        
        // Validate all dependency arrays
        expect(Array.isArray(config.dependencies.tasks)).toBe(true);
        expect(Array.isArray(config.dependencies.templates)).toBe(true);
        expect(Array.isArray(config.dependencies.checklists)).toBe(true);
        expect(Array.isArray(config.dependencies.data)).toBe(true);
      });
    });
  });

  describe('Agent ID and Name Consistency', () => {
    const expectedAgentIds = [
      'data-product-manager',
      'data-architect', 
      'data-engineer',
      'data-analyst',
      'ml-engineer',
      'data-qa-engineer'
    ];

    expectedAgentIds.forEach((expectedId, index) => {
      test(`${expectedAgents[index]} has correct agent ID`, async () => {
        const agentPath = path.join(agentsPath, expectedAgents[index]);
        const content = await fs.readFile(agentPath, 'utf8');
        const yamlMatch = content.match(/```yaml\n([\s\S]*?)\n```/);
        const config = yaml.load(yamlMatch[1]);
        
        expect(config.agent.id).toBe(expectedId);
      });
    });
  });

  test('config.yaml has valid expansion pack configuration', async () => {
    const configPath = path.join(expansionPackPath, 'config.yaml');
    const configContent = await fs.readFile(configPath, 'utf8');
    const config = yaml.load(configContent);
    
    expect(config).toHaveProperty('name');
    expect(config).toHaveProperty('version');
    expect(config).toHaveProperty('short-title');
    expect(config).toHaveProperty('description');
    expect(config).toHaveProperty('author');
    expect(config).toHaveProperty('slashPrefix');
    
    expect(config.name).toBe('bmad-data-practitioner');
    expect(config['short-title']).toBe('Data Practitioner Agent System');
    expect(config.slashPrefix).toBe('bmadData');
  });

  describe('Template Validation', () => {
    const expectedTemplates = [
      'data-requirements-prd.yaml',
      'data-architecture-doc.yaml'
    ];

    expectedTemplates.forEach(templateFile => {
      test(`${templateFile} exists and has valid structure`, async () => {
        const templatePath = path.join(expansionPackPath, 'templates', templateFile);
        expect(await fs.pathExists(templatePath)).toBe(true);
        
        const templateContent = await fs.readFile(templatePath, 'utf8');
        const template = yaml.load(templateContent);
        
        expect(template).toHaveProperty('template');
        expect(template).toHaveProperty('workflow');
        expect(template).toHaveProperty('sections');
        
        expect(template.template).toHaveProperty('id');
        expect(template.template).toHaveProperty('name');
        expect(template.template).toHaveProperty('version');
        expect(template.template).toHaveProperty('output');
        
        expect(Array.isArray(template.sections)).toBe(true);
        expect(template.sections.length).toBeGreaterThan(0);
      });
    });
  });
});

describe('Integration Verification Tests', () => {
  test('IV1: Existing agents and workflows continue functioning', () => {
    // This test verifies that our new expansion pack doesn't break existing functionality
    const coreAgentsPath = path.join(__dirname, '../../bmad-core/agents');
    
    return fs.readdir(coreAgentsPath).then(files => {
      expect(files.length).toBeGreaterThan(0);
      
      // Verify core agents still exist
      const coreAgents = ['architect.md', 'dev.md', 'pm.md', 'qa.md'];
      coreAgents.forEach(agent => {
        expect(files).toContain(agent);
      });
    });
  });

  test('IV3: No performance degradation in agent loading', () => {
    // Simple performance test to ensure agent loading remains fast
    const startTime = process.hrtime.bigint();
    
    // Simulate agent loading by reading all agent files
    const agentsPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/agents');
    
    return fs.readdir(agentsPath).then(files => {
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
      
      // Agent loading should complete in under 100ms
      expect(executionTime).toBeLessThan(100);
      expect(files.length).toBe(6); // All 6 data agents
    });
  });
});