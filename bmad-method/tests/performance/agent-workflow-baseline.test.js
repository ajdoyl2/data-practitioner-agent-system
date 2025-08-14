/**
 * Agent Workflow Performance Baseline Test Suite
 * Measures performance of agent loading and workflow execution
 */

const path = require('path');
const fs = require('fs-extra');
const { performance } = require('perf_hooks');

describe('Agent Workflow Performance Baseline', () => {
  const bmadCorePath = path.join(__dirname, '../../bmad-core');
  const agentsPath = path.join(bmadCorePath, 'agents');
  const performanceMetrics = {};

  beforeAll(async () => {
    // Verify BMad core structure exists
    expect(await fs.pathExists(bmadCorePath)).toBe(true);
    expect(await fs.pathExists(agentsPath)).toBe(true);
  });

  afterAll(() => {
    // Log performance metrics
    console.log('\n=== Agent Workflow Performance Baselines ===');
    Object.entries(performanceMetrics).forEach(([metric, value]) => {
      console.log(`${metric}: ${value}ms`);
    });
  });

  /**
   * Measure execution time of a function
   */
  async function measureExecution(name, fn) {
    const startTime = performance.now();
    const result = await fn();
    const endTime = performance.now();
    const duration = Math.round(endTime - startTime);
    
    performanceMetrics[name] = duration;
    return { result, duration };
  }

  describe('Agent Definition Loading Performance', () => {
    test('should measure agent file discovery time', async () => {
      const { duration } = await measureExecution('agent_file_discovery', async () => {
        const agentFiles = await fs.readdir(agentsPath);
        return agentFiles.filter(file => file.endsWith('.md'));
      });

      expect(duration).toBeGreaterThanOrEqual(0);
      expect(duration).toBeLessThan(100); // Should be very fast (< 100ms)
    });

    test('should measure individual agent file reading', async () => {
      const agentFiles = await fs.readdir(agentsPath);
      const mdFiles = agentFiles.filter(file => file.endsWith('.md'));
      
      expect(mdFiles.length).toBeGreaterThan(0);

      const readTimes = [];
      
      for (const file of mdFiles.slice(0, 5)) { // Test first 5 agents
        const { duration } = await measureExecution(`read_agent_${file}`, async () => {
          return fs.readFile(path.join(agentsPath, file), 'utf8');
        });
        readTimes.push(duration);
      }

      const avgReadTime = readTimes.reduce((sum, time) => sum + time, 0) / readTimes.length;
      performanceMetrics['avg_agent_read_time'] = Math.round(avgReadTime);

      expect(avgReadTime).toBeLessThan(50); // Individual file reads should be < 50ms
    });

    test('should measure YAML frontmatter parsing performance', async () => {
      const agentFiles = await fs.readdir(agentsPath);
      const mdFiles = agentFiles.filter(file => file.endsWith('.md'));
      
      const { duration } = await measureExecution('yaml_parsing_bulk', async () => {
        const parseResults = [];
        
        for (const file of mdFiles.slice(0, 3)) {
          const content = await fs.readFile(path.join(agentsPath, file), 'utf8');
          
          // Simple YAML frontmatter extraction (without full parser)
          const yamlMatch = content.match(/^---\n(.*?)\n---/s);
          if (yamlMatch) {
            parseResults.push({
              file,
              yamlLength: yamlMatch[1].length,
              hasYaml: true
            });
          }
        }
        
        return parseResults;
      });

      expect(duration).toBeLessThan(200); // YAML parsing should be reasonable
    });
  });

  describe('Configuration Loading Performance', () => {
    test('should measure core config loading time', async () => {
      const coreConfigPath = path.join(bmadCorePath, 'core-config.yaml');
      
      if (await fs.pathExists(coreConfigPath)) {
        const { duration } = await measureExecution('core_config_load', async () => {
          return fs.readFile(coreConfigPath, 'utf8');
        });

        expect(duration).toBeLessThan(50); // Config loading should be fast
      } else {
        // Test with the project's core config
        const projectConfigPath = path.join(__dirname, '../../../.bmad-core/core-config.yaml');
        if (await fs.pathExists(projectConfigPath)) {
          const { duration } = await measureExecution('project_config_load', async () => {
            return fs.readFile(projectConfigPath, 'utf8');
          });

          expect(duration).toBeLessThan(50);
        }
      }
    });

    test('should measure template directory scanning', async () => {
      const templatesPath = path.join(bmadCorePath, 'templates');
      
      if (await fs.pathExists(templatesPath)) {
        const { duration } = await measureExecution('template_scan', async () => {
          const templates = await fs.readdir(templatesPath);
          return templates.filter(file => file.endsWith('.yaml') || file.endsWith('.yml'));
        });

        expect(duration).toBeLessThan(100);
      }
    });

    test('should measure task directory scanning', async () => {
      const tasksPath = path.join(bmadCorePath, 'tasks');
      
      if (await fs.pathExists(tasksPath)) {
        const { duration } = await measureExecution('task_scan', async () => {
          const tasks = await fs.readdir(tasksPath);
          return tasks.filter(file => file.endsWith('.md'));
        });

        expect(duration).toBeLessThan(100);
      }
    });
  });

  describe('File System Performance', () => {
    test('should measure directory traversal performance', async () => {
      const { duration } = await measureExecution('directory_traversal', async () => {
        async function walkDirectory(dir) {
          const items = [];
          try {
            const entries = await fs.readdir(dir, { withFileTypes: true });
            
            for (const entry of entries) {
              const fullPath = path.join(dir, entry.name);
              items.push({
                name: entry.name,
                path: fullPath,
                isDirectory: entry.isDirectory()
              });
              
              if (entry.isDirectory() && !entry.name.startsWith('.') && items.length < 50) {
                const subItems = await walkDirectory(fullPath);
                items.push(...subItems);
              }
            }
          } catch (error) {
            // Skip directories we can't read
          }
          
          return items;
        }

        return walkDirectory(bmadCorePath);
      });

      expect(duration).toBeLessThan(1000); // Directory traversal should complete within 1 second
    });

    test('should measure file stat operations performance', async () => {
      const { duration } = await measureExecution('file_stats', async () => {
        const agentFiles = await fs.readdir(agentsPath);
        const stats = [];
        
        for (const file of agentFiles.slice(0, 10)) {
          const filePath = path.join(agentsPath, file);
          const stat = await fs.stat(filePath);
          stats.push({
            file,
            size: stat.size,
            modified: stat.mtime
          });
        }
        
        return stats;
      });

      expect(duration).toBeLessThan(200); // File stats should be fast
    });
  });

  describe('Memory Usage Patterns', () => {
    test('should measure memory usage during agent processing', async () => {
      const initialMemory = process.memoryUsage();
      
      const { duration } = await measureExecution('agent_processing_memory', async () => {
        const agentFiles = await fs.readdir(agentsPath);
        const processedAgents = [];
        
        for (const file of agentFiles.filter(f => f.endsWith('.md')).slice(0, 5)) {
          const content = await fs.readFile(path.join(agentsPath, file), 'utf8');
          processedAgents.push({
            file,
            contentLength: content.length,
            lineCount: content.split('\n').length
          });
        }
        
        return processedAgents;
      });

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      performanceMetrics['agent_processing_memory_mb'] = Math.round(memoryIncrease / 1024 / 1024);
      
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Should use less than 50MB
      expect(duration).toBeLessThan(500);
    });

    test('should verify no significant memory accumulation in repeated operations', async () => {
      const measurements = [];
      
      for (let i = 0; i < 5; i++) {
        const beforeMemory = process.memoryUsage().heapUsed;
        
        await measureExecution(`memory_test_iteration_${i}`, async () => {
          const agentFiles = await fs.readdir(agentsPath);
          const content = await fs.readFile(path.join(agentsPath, agentFiles[0]), 'utf8');
          return content.length;
        });
        
        const afterMemory = process.memoryUsage().heapUsed;
        measurements.push(afterMemory - beforeMemory);
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      const maxMemoryIncrease = Math.max(...measurements);
      performanceMetrics['max_iteration_memory_mb'] = Math.round(maxMemoryIncrease / 1024 / 1024);
      
      // No single iteration should use more than 10MB
      expect(maxMemoryIncrease).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('Baseline Performance Summary', () => {
    test('should generate performance baseline summary', async () => {
      const summary = {
        timestamp: new Date().toISOString(),
        environment: {
          nodeVersion: process.version,
          platform: process.platform,
          arch: process.arch,
          cpus: require('os').cpus().length
        },
        metrics: performanceMetrics,
        benchmarks: {
          agent_file_operations: {
            target: '<100ms',
            critical_threshold: '500ms'
          },
          memory_usage: {
            target: '<50MB for agent processing',
            critical_threshold: '200MB'
          },
          directory_operations: {
            target: '<1000ms for full traversal',
            critical_threshold: '5000ms'
          }
        }
      };

      const summaryPath = path.join(__dirname, '../fixtures/agent-workflow-baseline.json');
      await fs.writeJson(summaryPath, summary, { spaces: 2 });

      console.log(`\nAgent workflow baseline saved to: ${summaryPath}`);
      
      // Verify all measurements are within reasonable bounds
      expect(performanceMetrics.agent_file_discovery).toBeLessThan(100);
      expect(performanceMetrics.directory_traversal).toBeLessThan(1000);
      expect(performanceMetrics.agent_processing_memory_mb || 0).toBeLessThan(50);
    });
  });
});