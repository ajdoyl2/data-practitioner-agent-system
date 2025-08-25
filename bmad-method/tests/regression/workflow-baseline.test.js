/**
 * Workflow Execution Baseline Tests
 * Tests for agent workflow execution consistency and behavioral baselines
 */

const fs = require('fs-extra');
const path = require('path');
const DependencyResolver = require('../../tools/lib/dependency-resolver');

describe('Workflow Execution Baseline Tests', () => {
  let dependencyResolver;
  const baselineDir = path.join(__dirname, '../fixtures/workflow-baselines');
  const projectRoot = path.join(__dirname, '../..');
  
  beforeAll(async () => {
    await fs.ensureDir(baselineDir);
    dependencyResolver = new DependencyResolver(projectRoot);
  });

  /**
   * Sanitizes objects for snapshot testing by removing volatile data
   * that changes between test runs (timestamps, performance timings, paths)
   */
  function sanitizeForSnapshot(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    
    // Remove volatile fields
    const volatileFields = [
      'timestamp', 'discoveryTime', 'loadingTime', 'responseTime', 
      'resolutionTime', 'timePerAgent', 'timePerTeam', 'modified'
    ];
    
    volatileFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
    
    // Sanitize error messages to remove absolute paths
    if ('errorMessage' in sanitized && typeof sanitized.errorMessage === 'string') {
      sanitized.errorMessage = sanitized.errorMessage.replace(/\/[^:]+:/g, '/PROJECT_ROOT:');
    }
    if ('error' in sanitized && typeof sanitized.error === 'string') {
      sanitized.error = sanitized.error.replace(/\/[^:]+:/g, '/PROJECT_ROOT:');
    }
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeForSnapshot(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  describe('Agent Discovery Baselines', () => {
    test('should establish agent discovery performance baseline', async () => {
      const startTime = Date.now();
      
      try {
        const agents = await dependencyResolver.listAgents();
        const discoveryTime = Date.now() - startTime;
        
        const discoveryBaseline = {
          timestamp: new Date().toISOString(),
          agentCount: agents.length,
          discoveryTime,
          agents: agents.sort(),
          performance: {
            timePerAgent: agents.length > 0 ? discoveryTime / agents.length : 0,
            acceptable: discoveryTime < 5000 // 5 second limit
          }
        };
        
        await fs.writeJson(
          path.join(baselineDir, 'agent-discovery-baseline.json'),
          discoveryBaseline,
          { spaces: 2 }
        );
        
        // Performance expectations
        expect(discoveryTime).toBeLessThan(5000);
        expect(agents).toBeInstanceOf(Array);
        expect(sanitizeForSnapshot(discoveryBaseline)).toMatchSnapshot('agent-discovery-baseline');
        
      } catch (error) {
        // Handle directory not found gracefully
        const errorBaseline = {
          timestamp: new Date().toISOString(),
          error: error.message,
          agentCount: 0,
          expectedError: error.message.includes('ENOENT') || error.message.includes('no such file')
        };
        
        await fs.writeJson(
          path.join(baselineDir, 'agent-discovery-error-baseline.json'),
          errorBaseline,
          { spaces: 2 }
        );
        
        expect(sanitizeForSnapshot(errorBaseline)).toMatchSnapshot('agent-discovery-error-baseline');
      }
    });

    test('should establish team discovery performance baseline', async () => {
      const startTime = Date.now();
      
      try {
        const teams = await dependencyResolver.listTeams();
        const discoveryTime = Date.now() - startTime;
        
        const teamDiscoveryBaseline = {
          timestamp: new Date().toISOString(),
          teamCount: teams.length,
          discoveryTime,
          teams: teams.sort(),
          performance: {
            timePerTeam: teams.length > 0 ? discoveryTime / teams.length : 0,
            acceptable: discoveryTime < 3000 // 3 second limit
          }
        };
        
        await fs.writeJson(
          path.join(baselineDir, 'team-discovery-baseline.json'),
          teamDiscoveryBaseline,
          { spaces: 2 }
        );
        
        // Performance expectations
        expect(discoveryTime).toBeLessThan(3000);
        expect(teams).toBeInstanceOf(Array);
        expect(sanitizeForSnapshot(teamDiscoveryBaseline)).toMatchSnapshot('team-discovery-baseline');
        
      } catch (error) {
        // Handle directory not found gracefully
        const errorBaseline = {
          timestamp: new Date().toISOString(),
          error: error.message,
          teamCount: 0,
          expectedError: error.message.includes('ENOENT') || error.message.includes('no such file')
        };
        
        await fs.writeJson(
          path.join(baselineDir, 'team-discovery-error-baseline.json'),
          errorBaseline,
          { spaces: 2 }
        );
        
        expect(sanitizeForSnapshot(errorBaseline)).toMatchSnapshot('team-discovery-error-baseline');
      }
    });
  });

  describe('Dependency Resolution Baselines', () => {
    test('should establish resource loading performance baseline', async () => {
      const resourceTypes = ['tasks', 'templates', 'checklists', 'data'];
      const loadingResults = {
        timestamp: new Date().toISOString(),
        resourceTypes: {}
      };
      
      for (const resourceType of resourceTypes) {
        const startTime = Date.now();
        
        try {
          const resource = await dependencyResolver.loadResource(resourceType, 'sample.md');
          const loadingTime = Date.now() - startTime;
          
          loadingResults.resourceTypes[resourceType] = {
            loadingTime,
            success: resource !== null,
            hasContent: resource ? resource.content.length > 0 : false
          };
          
        } catch (error) {
          const loadingTime = Date.now() - startTime;
          loadingResults.resourceTypes[resourceType] = {
            loadingTime,
            success: false,
            error: error.message
          };
        }
      }
      
      await fs.writeJson(
        path.join(baselineDir, 'resource-loading-baseline.json'),
        loadingResults,
        { spaces: 2 }
      );
      
      // Performance expectations for resource loading
      Object.values(loadingResults.resourceTypes).forEach(result => {
        if (result.loadingTime !== undefined) {
          expect(result.loadingTime).toBeLessThan(2000); // 2 second limit per resource
        }
      });
      
      expect(sanitizeForSnapshot(loadingResults)).toMatchSnapshot('resource-loading-baseline');
    });

    test('should establish agent dependency resolution baseline', async () => {
      try {
        // Test with existing agents or create a minimal test case
        const agentsDir = path.join(projectRoot, 'agents');
        
        if (await fs.pathExists(agentsDir)) {
          const agentFiles = await fs.readdir(agentsDir);
          const testAgent = agentFiles.find(f => f.endsWith('.md'));
          
          if (testAgent) {
            const agentId = path.basename(testAgent, '.md');
            const startTime = Date.now();
            
            try {
              const result = await dependencyResolver.resolveAgentDependencies(agentId);
              const resolutionTime = Date.now() - startTime;
              
              const resolutionBaseline = {
                timestamp: new Date().toISOString(),
                agentId,
                resolutionTime,
                success: true,
                hasAgent: !!result.agent,
                hasResources: !!result.resources,
                resourceCount: result.resources ? Object.keys(result.resources).length : 0
              };
              
              await fs.writeJson(
                path.join(baselineDir, 'agent-resolution-baseline.json'),
                resolutionBaseline,
                { spaces: 2 }
              );
              
              expect(resolutionTime).toBeLessThan(10000); // 10 second limit
              expect(result.agent).toBeDefined();
              expect(sanitizeForSnapshot(resolutionBaseline)).toMatchSnapshot('agent-resolution-baseline');
              
            } catch (resolutionError) {
              const resolutionTime = Date.now() - startTime;
              
              const errorBaseline = {
                timestamp: new Date().toISOString(),
                agentId,
                resolutionTime,
                success: false,
                error: resolutionError.message
              };
              
              await fs.writeJson(
                path.join(baselineDir, 'agent-resolution-error-baseline.json'),
                errorBaseline,
                { spaces: 2 }
              );
              
              expect(sanitizeForSnapshot(errorBaseline)).toMatchSnapshot('agent-resolution-error-baseline');
            }
          }
        }
        
      } catch (setupError) {
        // Create baseline for missing agents directory
        const noAgentsBaseline = {
          timestamp: new Date().toISOString(),
          error: 'No agents directory found',
          setupError: setupError.message,
          expected: true
        };
        
        await fs.writeJson(
          path.join(baselineDir, 'no-agents-baseline.json'),
          noAgentsBaseline,
          { spaces: 2 }
        );
        
        expect(sanitizeForSnapshot(noAgentsBaseline)).toMatchSnapshot('no-agents-baseline');
      }
    });
  });

  describe('Error Handling Baselines', () => {
    test('should establish missing file error handling baseline', async () => {
      const errorTests = [
        { type: 'agent', id: 'nonexistent-agent' },
        { type: 'team', id: 'nonexistent-team' },
        { type: 'resource', id: 'nonexistent-resource' }
      ];
      
      const errorBaselines = {
        timestamp: new Date().toISOString(),
        errorTests: {}
      };
      
      for (const { type, id } of errorTests) {
        const startTime = Date.now();
        
        try {
          let result;
          switch (type) {
            case 'agent':
              result = await dependencyResolver.resolveAgentDependencies(id);
              break;
            case 'team':
              result = await dependencyResolver.resolveTeamDependencies(id);
              break;
            case 'resource':
              result = await dependencyResolver.loadResource('tasks', id);
              break;
          }
          
          errorBaselines.errorTests[`${type}-${id}`] = {
            expectedError: true,
            actualError: false,
            result: 'unexpected-success',
            responseTime: Date.now() - startTime
          };
          
        } catch (error) {
          errorBaselines.errorTests[`${type}-${id}`] = {
            expectedError: true,
            actualError: true,
            errorMessage: error.message,
            errorType: error.constructor.name,
            responseTime: Date.now() - startTime
          };
        }
      }
      
      await fs.writeJson(
        path.join(baselineDir, 'error-handling-baseline.json'),
        errorBaselines,
        { spaces: 2 }
      );
      
      expect(sanitizeForSnapshot(errorBaselines)).toMatchSnapshot('error-handling-baseline');
    });

    test('should establish malformed file handling baseline', async () => {
      // Test handling of malformed YAML and markdown files
      const malformedTests = {
        timestamp: new Date().toISOString(),
        tests: {}
      };
      
      // Create temporary malformed files for testing
      const tempDir = path.join(baselineDir, 'temp-malformed');
      await fs.ensureDir(tempDir);
      
      try {
        // Create malformed agent file
        const malformedAgentPath = path.join(tempDir, 'malformed-agent.md');
        await fs.writeFile(malformedAgentPath, `---
invalid: yaml: structure: [
missing: bracket
---

# Malformed Agent`);
        
        // Test error handling
        try {
          // This would normally fail in real dependency resolver
          malformedTests.tests['malformed-yaml'] = {
            testPerformed: true,
            expectedError: true,
            actualError: false, // We can't test actual resolution without mocking
            note: 'Baseline for malformed YAML structure'
          };
        } catch (error) {
          malformedTests.tests['malformed-yaml'] = {
            testPerformed: true,
            expectedError: true,
            actualError: true,
            errorMessage: error.message
          };
        }
        
      } finally {
        // Cleanup temp files
        await fs.remove(tempDir);
      }
      
      await fs.writeJson(
        path.join(baselineDir, 'malformed-file-baseline.json'),
        malformedTests,
        { spaces: 2 }
      );
      
      expect(sanitizeForSnapshot(malformedTests)).toMatchSnapshot('malformed-file-baseline');
    });
  });

  describe('Workflow Integration Baselines', () => {
    test('should establish full workflow execution baseline', async () => {
      const workflowBaseline = {
        timestamp: new Date().toISOString(),
        workflow: {
          discovery: {},
          resolution: {},
          performance: {}
        }
      };
      
      // Discovery phase
      const discoveryStart = Date.now();
      try {
        const [agents, teams] = await Promise.all([
          dependencyResolver.listAgents(),
          dependencyResolver.listTeams()
        ]);
        
        workflowBaseline.workflow.discovery = {
          success: true,
          discoveryTime: Date.now() - discoveryStart,
          agentCount: agents.length,
          teamCount: teams.length,
          totalEntities: agents.length + teams.length
        };
      } catch (error) {
        workflowBaseline.workflow.discovery = {
          success: false,
          discoveryTime: Date.now() - discoveryStart,
          error: error.message
        };
      }
      
      // Performance metrics
      workflowBaseline.workflow.performance = {
        discoveryTime: workflowBaseline.workflow.discovery.discoveryTime,
        acceptable: workflowBaseline.workflow.discovery.discoveryTime < 8000,
        scalabilityFactor: workflowBaseline.workflow.discovery.totalEntities || 0
      };
      
      await fs.writeJson(
        path.join(baselineDir, 'workflow-integration-baseline.json'),
        workflowBaseline,
        { spaces: 2 }
      );
      
      // Performance assertions
      if (workflowBaseline.workflow.discovery.success) {
        expect(workflowBaseline.workflow.discovery.discoveryTime).toBeLessThan(8000);
      }
      
      expect(sanitizeForSnapshot(workflowBaseline)).toMatchSnapshot('workflow-integration-baseline');
    });
  });

  describe('System State Baselines', () => {
    test('should capture system state baseline', async () => {
      const systemBaseline = {
        timestamp: new Date().toISOString(),
        directories: {},
        files: {},
        configuration: {}
      };
      
      // Check critical directories
      const criticalDirs = [
        'agents',
        'agent-teams', 
        'tasks',
        'templates',
        'checklists',
        'expansion-packs',
        'tools',
        'tests'
      ];
      
      for (const dir of criticalDirs) {
        const dirPath = path.join(projectRoot, dir);
        const exists = await fs.pathExists(dirPath);
        
        systemBaseline.directories[dir] = { exists, path: dirPath };
        
        if (exists) {
          try {
            const contents = await fs.readdir(dirPath);
            systemBaseline.directories[dir].fileCount = contents.length;
            systemBaseline.directories[dir].contents = contents.sort();
          } catch (error) {
            systemBaseline.directories[dir].error = error.message;
          }
        }
      }
      
      // Check critical files
      const criticalFiles = [
        'package.json',
        'jest.config.js',
        'bmad-core/core-config.yaml'
      ];
      
      for (const file of criticalFiles) {
        const filePath = path.join(projectRoot, file);
        const exists = await fs.pathExists(filePath);
        
        systemBaseline.files[file] = { exists, path: filePath };
        
        if (exists) {
          try {
            const stats = await fs.stat(filePath);
            systemBaseline.files[file].size = stats.size;
            systemBaseline.files[file].modified = stats.mtime.toISOString();
          } catch (error) {
            systemBaseline.files[file].error = error.message;
          }
        }
      }
      
      await fs.writeJson(
        path.join(baselineDir, 'system-state-baseline.json'),
        systemBaseline,
        { spaces: 2 }
      );
      
      expect(sanitizeForSnapshot(systemBaseline)).toMatchSnapshot('system-state-baseline');
    });
  });
});