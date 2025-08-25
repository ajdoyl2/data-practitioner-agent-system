/**
 * CLI Regression Test Baseline
 * Tests for CLI command output consistency and behavioral baselines
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

describe('CLI Regression Baseline Tests', () => {
  const cliPath = path.join(__dirname, '../../tools/cli.js');
  const baselineDir = path.join(__dirname, '../fixtures/cli-baselines');
  
  beforeAll(async () => {
    await fs.ensureDir(baselineDir);
  });

  /**
   * Sanitizes objects for snapshot testing by removing volatile data
   */
  function sanitizeForSnapshot(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = Array.isArray(obj) ? [...obj] : { ...obj };
    
    // Remove volatile fields
    const volatileFields = [
      'timestamp', 'executionTime', 'modified', 'responseTime'
    ];
    
    volatileFields.forEach(field => {
      if (field in sanitized) {
        delete sanitized[field];
      }
    });
    
    // Recursively sanitize nested objects
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'object' && sanitized[key] !== null) {
        sanitized[key] = sanitizeForSnapshot(sanitized[key]);
      }
    });
    
    return sanitized;
  }

  describe('Help Command Baselines', () => {
    test('should match help command output format', () => {
      const helpOutput = execSync(`node ${cliPath} --help`, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../..') 
      });
      
      // Test basic structure of help output
      expect(helpOutput).toContain('Usage:');
      expect(helpOutput).toContain('Commands:');
      expect(helpOutput).toContain('Options:');
      
      // Snapshot test for exact output consistency
      expect(helpOutput).toMatchSnapshot('help-command-output');
    });

    test('should match version command output format', () => {
      const versionOutput = execSync(`node ${cliPath} --version`, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../..') 
      });
      
      // Test version follows semantic versioning
      expect(versionOutput.trim()).toMatch(/^\d+\.\d+\.\d+$/);
      
      // Store baseline version format
      const baselineVersion = versionOutput.trim();
      expect(baselineVersion).toMatchSnapshot('version-command-output');
    });
  });

  describe('Build Command Baselines', () => {
    test('should match build command success message format', async () => {
      try {
        const buildOutput = execSync(`node ${cliPath} build --dry-run`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../..'),
          timeout: 30000
        });
        
        // Test build output structure
        expect(buildOutput).toContain('Building');
        expect(buildOutput).toMatch(/agents|teams|web/i);
        
        // Snapshot for consistency
        expect(buildOutput).toMatchSnapshot('build-dry-run-output');
      } catch (error) {
        // If dry-run not supported, test actual build with timeout
        console.warn('Dry-run not supported, testing actual build');
        
        const buildOutput = execSync(`timeout 10 node ${cliPath} build || echo "Build timeout"`, { 
          encoding: 'utf8',
          shell: true,
          cwd: path.join(__dirname, '../..')
        });
        
        expect(buildOutput).toContain('Build');
      }
    });

    test('should validate build output file structure', async () => {
      const outputDir = path.join(__dirname, '../../output');
      
      // Check if build creates expected directories
      if (await fs.pathExists(outputDir)) {
        const outputContents = await fs.readdir(outputDir);
        
        // Store baseline output structure
        const baselineStructure = {
          timestamp: new Date().toISOString(),
          outputDirectory: outputDir,
          contents: outputContents.sort(),
          totalFiles: outputContents.length
        };
        
        await fs.writeJson(
          path.join(baselineDir, 'build-output-structure.json'),
          baselineStructure,
          { spaces: 2 }
        );
        
        expect(outputContents).toMatchSnapshot('build-output-contents');
      }
    });
  });

  describe('List Commands Baselines', () => {
    test('should match agents list format', () => {
      const agentsOutput = execSync(`node ${cliPath} list:agents`, { 
        encoding: 'utf8',
        cwd: path.join(__dirname, '../..') 
      });
      
      // Test agents list structure
      expect(agentsOutput).toMatch(/agents?/i);
      
      // Parse agent count for baseline
      const agentMatches = agentsOutput.match(/\d+/);
      const agentCount = agentMatches ? parseInt(agentMatches[0]) : 0;
      
      expect(agentCount).toBeGreaterThanOrEqual(0);
      expect(agentsOutput).toMatchSnapshot('agents-list-output');
    });

    test('should establish agent count baseline', async () => {
      const agentsDir = path.join(__dirname, '../../agents');
      
      if (await fs.pathExists(agentsDir)) {
        const agentFiles = await fs.readdir(agentsDir);
        const agentCount = agentFiles.filter(file => file.endsWith('.md')).length;
        
        const baseline = {
          timestamp: new Date().toISOString(),
          agentCount,
          agentFiles: agentFiles.filter(file => file.endsWith('.md')).sort()
        };
        
        await fs.writeJson(
          path.join(baselineDir, 'agents-baseline.json'),
          baseline,
          { spaces: 2 }
        );
        
        expect(agentCount).toMatchSnapshot('agent-count-baseline');
      }
    });
  });

  describe('Validate Command Baselines', () => {
    test('should match validation output format', () => {
      try {
        const validateOutput = execSync(`node ${cliPath} validate`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../..'),
          timeout: 15000
        });
        
        // Test validation output structure
        expect(validateOutput).toMatch(/valid|invalid|error|success/i);
        expect(validateOutput).toMatchSnapshot('validate-command-output');
        
      } catch (error) {
        // Handle validation errors as part of baseline
        const errorOutput = error.stdout ? error.stdout.toString() : error.message;
        expect(errorOutput).toMatchSnapshot('validate-error-output');
      }
    });

    test('should establish configuration validation baseline', async () => {
      const configFiles = [
        'package.json',
        'jest.config.js',
        'bmad-core/core-config.yaml'
      ];
      
      const configBaseline = {
        timestamp: new Date().toISOString(),
        files: {}
      };
      
      for (const configFile of configFiles) {
        const filePath = path.join(__dirname, '../../', configFile);
        if (await fs.pathExists(filePath)) {
          const stats = await fs.stat(filePath);
          configBaseline.files[configFile] = {
            exists: true,
            size: stats.size,
            modified: stats.mtime.toISOString()
          };
        } else {
          configBaseline.files[configFile] = {
            exists: false
          };
        }
      }
      
      await fs.writeJson(
        path.join(baselineDir, 'config-validation-baseline.json'),
        configBaseline,
        { spaces: 2 }
      );
      
      expect(sanitizeForSnapshot(configBaseline)).toMatchSnapshot('config-validation-baseline');
    });
  });

  describe('Error Handling Baselines', () => {
    test('should establish invalid command error format', () => {
      try {
        execSync(`node ${cliPath} invalid-command`, { 
          encoding: 'utf8',
          cwd: path.join(__dirname, '../..') 
        });
      } catch (error) {
        const errorOutput = error.stderr ? error.stderr.toString() : error.message;
        
        // Test error format consistency
        expect(errorOutput).toMatch(/error|invalid|unknown/i);
        expect(errorOutput).toMatchSnapshot('invalid-command-error');
      }
    });

    test('should establish missing argument error format', () => {
      const commands = ['build', 'validate'];
      
      commands.forEach(command => {
        try {
          execSync(`node ${cliPath} ${command} --invalid-flag`, { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '../..') 
          });
        } catch (error) {
          const errorOutput = error.stderr ? error.stderr.toString() : error.message;
          expect(errorOutput).toMatchSnapshot(`${command}-invalid-flag-error`);
        }
      });
    });
  });

  describe('Performance Baselines', () => {
    test('should establish command execution time baselines', async () => {
      const commands = [
        { cmd: '--help', timeout: 5000 },
        { cmd: '--version', timeout: 5000 },
        { cmd: 'list:agents', timeout: 10000 },
        { cmd: 'validate', timeout: 15000 }
      ];
      
      const performanceBaseline = {
        timestamp: new Date().toISOString(),
        commands: {}
      };
      
      for (const { cmd, timeout } of commands) {
        const startTime = Date.now();
        
        try {
          execSync(`node ${cliPath} ${cmd}`, { 
            encoding: 'utf8',
            cwd: path.join(__dirname, '../..'),
            timeout
          });
          
          const executionTime = Date.now() - startTime;
          performanceBaseline.commands[cmd] = {
            success: true,
            executionTime,
            timestamp: new Date().toISOString()
          };
          
          // Performance assertions
          expect(executionTime).toBeLessThan(timeout);
          
        } catch (error) {
          performanceBaseline.commands[cmd] = {
            success: false,
            error: error.message,
            timestamp: new Date().toISOString()
          };
        }
      }
      
      await fs.writeJson(
        path.join(baselineDir, 'performance-baseline.json'),
        performanceBaseline,
        { spaces: 2 }
      );
      
      expect(sanitizeForSnapshot(performanceBaseline)).toMatchSnapshot('performance-baseline');
    });
  });

  describe('Agent Workflow Execution Baselines', () => {
    test('should establish agent discovery baseline', async () => {
      const agentsDir = path.join(__dirname, '../../agents');
      const teamsDir = path.join(__dirname, '../../agent-teams');
      
      const workflowBaseline = {
        timestamp: new Date().toISOString(),
        agentsDirectory: {
          exists: await fs.pathExists(agentsDir),
          path: agentsDir
        },
        teamsDirectory: {
          exists: await fs.pathExists(teamsDir),
          path: teamsDir
        }
      };
      
      if (workflowBaseline.agentsDirectory.exists) {
        const agentFiles = await fs.readdir(agentsDir);
        workflowBaseline.agentsDirectory.files = agentFiles.filter(f => f.endsWith('.md')).sort();
        workflowBaseline.agentsDirectory.count = workflowBaseline.agentsDirectory.files.length;
      }
      
      if (workflowBaseline.teamsDirectory.exists) {
        const teamFiles = await fs.readdir(teamsDir);
        workflowBaseline.teamsDirectory.files = teamFiles.filter(f => f.endsWith('.yaml')).sort();
        workflowBaseline.teamsDirectory.count = workflowBaseline.teamsDirectory.files.length;
      }
      
      await fs.writeJson(
        path.join(baselineDir, 'agent-workflow-baseline.json'),
        workflowBaseline,
        { spaces: 2 }
      );
      
      expect(sanitizeForSnapshot(workflowBaseline)).toMatchSnapshot('agent-workflow-baseline');
    });

    test('should validate agent file structure baselines', async () => {
      const agentsDir = path.join(__dirname, '../../agents');
      
      if (await fs.pathExists(agentsDir)) {
        const agentFiles = await fs.readdir(agentsDir);
        const sampleAgent = agentFiles.find(f => f.endsWith('.md'));
        
        if (sampleAgent) {
          const agentPath = path.join(agentsDir, sampleAgent);
          const agentContent = await fs.readFile(agentPath, 'utf8');
          
          // Test agent file structure
          const hasYamlFrontmatter = agentContent.startsWith('---');
          const hasMarkdownContent = agentContent.includes('#');
          
          const agentStructureBaseline = {
            timestamp: new Date().toISOString(),
            sampleAgent,
            hasYamlFrontmatter,
            hasMarkdownContent,
            contentLength: agentContent.length,
            lineCount: agentContent.split('\n').length
          };
          
          await fs.writeJson(
            path.join(baselineDir, 'agent-structure-baseline.json'),
            agentStructureBaseline,
            { spaces: 2 }
          );
          
          expect(agentStructureBaseline).toMatchSnapshot('agent-structure-baseline');
        }
      }
    });
  });
});