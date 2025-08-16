/**
 * Agent Workflow Test Suite
 * Tests for agent YAML definition loading, processing, and workflow execution
 */

const fs = require('fs');
const path = require('path');
const DependencyResolver = require('../../tools/lib/dependency-resolver');
const yamlUtils = require('../../tools/lib/yaml-utils');

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
    stat: jest.fn()
  }
}));
jest.mock('../../tools/lib/yaml-utils');

describe('Agent Workflow Test Suite', () => {
  let dependencyResolver;
  const mockRootDir = '/test/bmad-project';

  beforeEach(() => {
    jest.clearAllMocks();
    dependencyResolver = new DependencyResolver(mockRootDir);
  });

  describe('Agent YAML Loading and Processing', () => {
    test('should resolve agent dependencies correctly', async () => {
      const mockAgentContent = `---
dependencies:
  tasks:
    - test-task.md
  templates:
    - test-template.yaml
---

# Test Agent

This is a test agent.`;

      const mockTaskContent = '# Test Task\n\nTask instructions here.';
      const mockTemplateContent = 'name: Test Template\nversion: 1.0';

      fs.promises.readFile.mockImplementation((filePath) => {
        if (filePath.includes('test-agent.md')) {
          return Promise.resolve(mockAgentContent);
        }
        if (filePath.includes('test-task.md')) {
          return Promise.resolve(mockTaskContent);
        }
        if (filePath.includes('test-template.yaml')) {
          return Promise.resolve(mockTemplateContent);
        }
        return Promise.reject(new Error('File not found'));
      });

      yamlUtils.extractYamlFromAgent.mockReturnValue(`dependencies:
  tasks:
    - test-task.md
  templates:
    - test-template.yaml`);

      const result = await dependencyResolver.resolveAgentDependencies('test-agent');

      expect(result).toHaveProperty('agent');
      expect(result).toHaveProperty('resources');
      expect(result.agent.id).toBe('test-agent');
      expect(result.agent.content).toBe(mockAgentContent);
      expect(fs.promises.readFile).toHaveBeenCalledWith(
        expect.stringContaining('test-agent.md'),
        'utf8'
      );
    });

    test('should handle agent with no YAML configuration', async () => {
      const mockAgentContent = `# Simple Agent

This agent has no YAML configuration.`;

      fs.promises.readFile.mockResolvedValue(mockAgentContent);
      yamlUtils.extractYamlFromAgent.mockReturnValue(null);

      await expect(dependencyResolver.resolveAgentDependencies('simple-agent')).rejects.toThrow(
        'No YAML configuration found in agent simple-agent'
      );
    });

    test('should handle missing agent file', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(dependencyResolver.resolveAgentDependencies('nonexistent-agent')).rejects.toThrow(
        'ENOENT: no such file'
      );
    });

    test('should extract YAML from agent content', () => {
      const agentContent = `---
name: Test Agent
commands:
  - help
  - build
---

# Agent Content`;

      yamlUtils.extractYamlFromAgent.mockReturnValue(`name: Test Agent
commands:
  - help
  - build`);

      const result = yamlUtils.extractYamlFromAgent(agentContent, true);

      expect(result).toContain('name: Test Agent');
      expect(result).toContain('commands:');
      expect(yamlUtils.extractYamlFromAgent).toHaveBeenCalledWith(agentContent, true);
    });
  });

  describe('Team Dependencies Resolution', () => {
    test('should resolve team dependencies correctly', async () => {
      const mockTeamContent = `teamName: test-team
agents:
  - dev
  - qa`;

      const mockAgentContent = `---
dependencies:
  tasks:
    - test-task.md
---

# Dev Agent`;

      fs.promises.readFile.mockImplementation((filePath) => {
        if (filePath.includes('test-team.yaml')) {
          return Promise.resolve(mockTeamContent);
        }
        if (filePath.includes('bmad-orchestrator.md')) {
          return Promise.resolve('# BMad Orchestrator');
        }
        if (filePath.includes('dev.md') || filePath.includes('qa.md')) {
          return Promise.resolve(mockAgentContent);
        }
        if (filePath.includes('test-task.md')) {
          return Promise.resolve('# Test Task Content');
        }
        return Promise.reject(new Error('File not found'));
      });

      yamlUtils.extractYamlFromAgent.mockReturnValue(`dependencies:
  tasks:
    - test-task.md`);

      const result = await dependencyResolver.resolveTeamDependencies('test-team');

      expect(result).toHaveProperty('team');
      expect(result).toHaveProperty('agents');
      expect(result).toHaveProperty('resources');
      expect(result.team.id).toBe('test-team');
      expect(result.agents.length).toBeGreaterThan(0);
    });

    test('should handle team with wildcard agents', async () => {
      const mockTeamContent = `teamName: wildcard-team
agents:
  - "*"`;

      fs.promises.readFile.mockImplementation((filePath) => {
        if (filePath.includes('wildcard-team.yaml')) {
          return Promise.resolve(mockTeamContent);
        }
        if (filePath.includes('bmad-orchestrator.md')) {
          return Promise.resolve('# BMad Orchestrator');
        }
        return Promise.resolve('# Generic Agent');
      });

      fs.promises.readdir.mockResolvedValue(['dev.md', 'qa.md', 'bmad-master.md']);
      yamlUtils.extractYamlFromAgent.mockReturnValue('dependencies: {}');

      // Mock listAgents method
      dependencyResolver.listAgents = jest.fn().mockResolvedValue(['dev', 'qa', 'bmad-master']);

      const result = await dependencyResolver.resolveTeamDependencies('wildcard-team');

      expect(result.agents.length).toBeGreaterThan(1);
      expect(dependencyResolver.listAgents).toHaveBeenCalled();
    });

    test('should handle missing team file', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      await expect(dependencyResolver.resolveTeamDependencies('nonexistent-team')).rejects.toThrow(
        'ENOENT: no such file'
      );
    });
  });

  describe('Utility Functions', () => {
    test('should list agents correctly', async () => {
      fs.promises.readdir.mockResolvedValue(['dev.md', 'qa.md', 'analyst.md', '.hidden']);
      fs.promises.stat.mockImplementation((filePath) => ({
        isFile: () => !filePath.includes('.hidden')
      }));

      const agents = await dependencyResolver.listAgents();

      expect(agents).toEqual(['dev', 'qa', 'analyst']);
      expect(fs.promises.readdir).toHaveBeenCalledWith(
        expect.stringContaining('agents')
      );
    });

    test('should list teams correctly', async () => {
      fs.promises.readdir.mockResolvedValue(['fullstack.yaml', 'gamedev.yaml', 'README.md']);
      fs.promises.stat.mockImplementation((filePath) => ({
        isFile: () => !filePath.includes('README')
      }));

      const teams = await dependencyResolver.listTeams();

      expect(teams).toEqual(['fullstack', 'gamedev']);
      expect(fs.promises.readdir).toHaveBeenCalledWith(
        expect.stringContaining('agent-teams')
      );
    });

    test('should handle empty directories', async () => {
      fs.promises.readdir.mockResolvedValue([]);

      const agents = await dependencyResolver.listAgents();
      const teams = await dependencyResolver.listTeams();

      expect(agents).toEqual([]);
      expect(teams).toEqual([]);
    });

    test('should handle readdir errors gracefully', async () => {
      fs.promises.readdir.mockRejectedValue(new Error('Permission denied'));

      await expect(dependencyResolver.listAgents()).rejects.toThrow('Permission denied');
    });
  });

  describe('Resource Loading', () => {
    test('should load resource by type and ID', async () => {
      const mockTaskContent = '# Test Task\n\nTask instructions here.';
      
      fs.promises.readFile.mockResolvedValue(mockTaskContent);

      const resource = await dependencyResolver.loadResource('tasks', 'test-task.md');

      expect(resource).toEqual({
        type: 'tasks',
        id: 'test-task.md',
        path: expect.stringContaining('tasks/test-task.md'),
        content: mockTaskContent
      });
    });

    test('should handle missing resources', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const resource = await dependencyResolver.loadResource('tasks', 'missing-task.md');

      expect(resource).toBeNull();
    });

    test('should try multiple search paths', async () => {
      fs.promises.readFile
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockRejectedValueOnce(new Error('ENOENT'))
        .mockResolvedValueOnce('# Found in expansion pack');

      const resource = await dependencyResolver.loadResource('tasks', 'expansion-task.md');

      expect(resource).not.toBeNull();
      expect(resource.content).toBe('# Found in expansion pack');
      expect(fs.promises.readFile).toHaveBeenCalledTimes(3);
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed YAML in agent', async () => {
      const malformedContent = `---
invalid: yaml: content: [
---

# Agent with bad YAML`;

      fs.promises.readFile.mockResolvedValue(malformedContent);
      yamlUtils.extractYamlFromAgent.mockReturnValue('invalid: yaml: content: [');

      await expect(dependencyResolver.resolveAgentDependencies('bad-agent')).rejects.toThrow();
    });

    test('should handle file system permissions errors', async () => {
      fs.promises.readFile.mockRejectedValue(new Error('EACCES: permission denied'));

      await expect(dependencyResolver.resolveAgentDependencies('protected-agent')).rejects.toThrow(
        'EACCES: permission denied'
      );
    });

    test('should handle concurrent access to same agent', async () => {
      let callCount = 0;
      fs.promises.readFile.mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return new Promise(resolve => setTimeout(() => resolve('# Agent Content'), 100));
        }
        return Promise.resolve('# Agent Content');
      });

      yamlUtils.extractYamlFromAgent.mockReturnValue('dependencies: {}');

      const [result1, result2] = await Promise.all([
        dependencyResolver.resolveAgentDependencies('concurrent-agent'),
        dependencyResolver.resolveAgentDependencies('concurrent-agent')
      ]);

      expect(result1.agent.id).toBe('concurrent-agent');
      expect(result2.agent.id).toBe('concurrent-agent');
    });
  });
});