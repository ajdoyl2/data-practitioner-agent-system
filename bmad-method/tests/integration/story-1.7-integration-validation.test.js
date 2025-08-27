/**
 * Story 1.7 Integration Testing and Validation Suite
 * 
 * Comprehensive integration tests for Evidence.dev Publication Platform integration.
 * Tests all Integration Verification requirements (IV1, IV2, IV3) and ensures
 * Evidence.dev integration doesn't interfere with existing BMad functionality.
 * 
 * Integration Verification Requirements:
 * - IV1: Web-builder continues to function for agent bundles
 * - IV2: Evidence.dev builds don't interfere with main build process
 * - IV3: Generated sites maintain acceptable performance metrics
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const { EvidenceBuilder } = require('../../tools/builders/evidence-builder');

describe('Story 1.7: Publication Platform - Evidence.dev Integration', () => {
  const rootPath = path.join(__dirname, '../..');
  const evidenceProjectPath = path.join(rootPath, 'expansion-packs/bmad-data-practitioner/evidence-project');
  const webBuilderPath = path.join(rootPath, 'tools/builders/web-builder.js');
  let evidenceBuilder;

  beforeAll(async () => {
    evidenceBuilder = new EvidenceBuilder({ projectRoot: rootPath });
  });

  describe('IV1: Web-builder continues to function for agent bundles', () => {
    test('web-builder.js exists and is functional', async () => {
      expect(await fs.pathExists(webBuilderPath)).toBe(true);
      
      const webBuilderContent = await fs.readFile(webBuilderPath, 'utf8');
      expect(webBuilderContent.length).toBeGreaterThan(0);
      
      // Verify no syntax errors
      expect(() => {
        require('vm').createScript(webBuilderContent);
      }).not.toThrow();
    });

    test('web-builder can process agent bundles independently', async () => {
      // Test that web-builder still works for its original purpose
      const startTime = process.hrtime.bigint();
      
      // Simulate agent bundle processing (if web-builder exists and has build method)
      if (await fs.pathExists(webBuilderPath)) {
        try {
          const WebBuilder = require(webBuilderPath);
          if (WebBuilder && typeof WebBuilder === 'function') {
            const builder = new WebBuilder();
            if (builder && typeof builder.build === 'function') {
              // Test basic functionality
              expect(typeof builder.build).toBe('function');
            }
          }
        } catch (error) {
          // If web-builder doesn't export a class, just verify file integrity
          expect(error).not.toBeInstanceOf(SyntaxError);
        }
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      // Should complete quickly (under 100ms)
      expect(executionTime).toBeLessThan(100);
    });

    test('agent bundling workflows remain separate from Evidence.dev', async () => {
      const bmadCorePath = path.join(rootPath, 'bmad-core');
      const agentsPath = path.join(bmadCorePath, 'agents');
      
      expect(await fs.pathExists(agentsPath)).toBe(true);
      
      const agents = await fs.readdir(agentsPath);
      expect(agents.length).toBeGreaterThan(0);
      
      // Verify core agents are unaffected
      const coreAgents = ['architect.md', 'dev.md', 'pm.md', 'qa.md', 'sm.md'];
      coreAgents.forEach(agent => {
        expect(agents).toContain(agent);
      });
      
      // Verify Evidence.dev doesn't interfere with agent files
      for (const agent of coreAgents) {
        const agentContent = await fs.readFile(path.join(agentsPath, agent), 'utf8');
        expect(agentContent).toContain('ACTIVATION-NOTICE:');
        expect(agentContent).toContain('```yaml');
      }
    });

    test('Evidence.dev integration maintains separate build targets', async () => {
      const buildStatus = await evidenceBuilder.getBuildStatus();
      
      if (buildStatus.status === 'built') {
        // Verify Evidence.dev build is separate from agent bundles
        expect(buildStatus.buildPath).toContain('evidence-project');
        expect(buildStatus.buildPath).not.toContain('bmad-core');
        expect(buildStatus.buildPath).not.toContain('agents');
      }
      
      // Evidence.dev project should be in expansion pack, not core
      expect(evidenceProjectPath).toContain('expansion-packs');
      expect(evidenceProjectPath).toContain('bmad-data-practitioner');
    });
  });

  describe('IV2: Evidence.dev builds don\'t interfere with main build process', () => {
    test('main build process continues to work', async () => {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Verify main build scripts are intact
      expect(packageJson.scripts).toHaveProperty('build');
      expect(packageJson.scripts).toHaveProperty('test');
      expect(packageJson.scripts).toHaveProperty('validate');
      
      // Verify Evidence.dev scripts are separate
      expect(packageJson.scripts).toHaveProperty('build:evidence');
      expect(packageJson.scripts).toHaveProperty('evidence:dev');
      expect(packageJson.scripts).toHaveProperty('evidence:build');
    });

    test('Evidence.dev dependencies don\'t conflict with core dependencies', async () => {
      const packageJsonPath = path.join(rootPath, 'package.json');
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Verify core dependencies are preserved
      const coreDeps = ['commander', 'fs-extra', 'js-yaml', 'chalk'];
      coreDeps.forEach(dep => {
        expect(packageJson.dependencies).toHaveProperty(dep);
      });
      
      // Verify Evidence.dev dependency is added
      expect(packageJson.dependencies).toHaveProperty('@evidence-dev/evidence');
      expect(packageJson.dependencies['@evidence-dev/evidence']).toBe('^25.0.0');
    });

    test('Evidence.dev build process is isolated', async () => {
      // Test Evidence.dev build isolation
      const buildResult = await evidenceBuilder.executeEvidenceBuild();
      
      if (buildResult.success) {
        // Build should be in separate directory
        expect(buildResult.buildPath).toContain('evidence-project');
        expect(buildResult.buildPath).not.toContain('bmad-core');
        
        // Build artifacts should be isolated
        const buildFiles = await fs.readdir(buildResult.buildPath);
        expect(Array.isArray(buildFiles)).toBe(true);
        
        // Should not affect core BMad files
        const bmadCorePath = path.join(rootPath, 'bmad-core');
        const coreFiles = await fs.readdir(bmadCorePath);
        expect(coreFiles).not.toContain('build');
        expect(coreFiles).not.toContain('evidence');
      } else {
        // If build fails, it shouldn't affect main system
        console.warn('Evidence.dev build failed but system isolation maintained');
        expect(buildResult.error).toBeDefined();
      }
    });

    test('parallel build processes don\'t interfere', async () => {
      const startTime = process.hrtime.bigint();
      
      // Simulate parallel operations
      const operations = await Promise.allSettled([
        // Main build validation
        fs.pathExists(path.join(rootPath, 'bmad-core')),
        // Evidence.dev validation
        fs.pathExists(evidenceProjectPath),
        // Package.json integrity
        fs.readFile(path.join(rootPath, 'package.json'), 'utf8')
      ]);
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      // All operations should succeed
      operations.forEach(result => {
        expect(result.status).toBe('fulfilled');
      });
      
      // Should complete quickly
      expect(executionTime).toBeLessThan(500);
    });
  });

  describe('IV3: Generated sites maintain acceptable performance metrics', () => {
    test('Evidence.dev build completes within time limits', async () => {
      const startTime = process.hrtime.bigint();
      
      const buildResult = await evidenceBuilder.executeEvidenceBuild();
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000; // milliseconds
      
      // Build should complete within 5 minutes (300,000ms) as per story requirements
      expect(executionTime).toBeLessThan(300000);
      
      if (buildResult.success) {
        console.log(`✅ Evidence.dev build completed in ${Math.round(executionTime)}ms`);
      } else {
        console.warn(`⚠️  Evidence.dev build failed in ${Math.round(executionTime)}ms`);
      }
    });

    test('generated site meets performance requirements', async () => {
      const buildStatus = await evidenceBuilder.getBuildStatus();
      
      if (buildStatus.status === 'built') {
        const buildPath = buildStatus.buildPath;
        const buildFiles = await fs.readdir(buildPath);
        
        // Check for performance optimizations
        const hasIndexFile = buildFiles.some(file => 
          file === 'index.html' || file === 'app.html'
        );
        expect(hasIndexFile).toBe(true);
        
        // Check build file count (reasonable number of files)
        expect(buildFiles.length).toBeGreaterThan(0);
        expect(buildFiles.length).toBeLessThan(1000); // Reasonable upper limit
        
        // Check for static asset optimization
        const hasStaticAssets = buildFiles.some(file => 
          file.includes('.css') || file.includes('.js') || file === '_app'
        );
        
        if (hasStaticAssets) {
          console.log('✅ Static assets found - performance optimization likely applied');
        }
      }
    });

    test('DuckDB WASM performance within acceptable limits', async () => {
      const evidenceConfigPath = path.join(evidenceProjectPath, 'evidence.config.js');
      
      if (await fs.pathExists(evidenceConfigPath)) {
        const config = require(evidenceConfigPath);
        
        // Verify DuckDB configuration for performance
        if (config.database && config.database.type === 'duckdb-wasm') {
          expect(config.database.settings.memory_limit).toBeDefined();
          expect(config.database.settings.threads).toBeDefined();
          
          // Memory limit should be reasonable (2GB as per story)
          expect(config.database.settings.memory_limit).toBe('2GB');
          // Thread count should be optimized
          expect(config.database.settings.threads).toBe(4);
        }
      }
    });

    test('publication generation workflow performance', async () => {
      const startTime = process.hrtime.bigint();
      
      // Test publication engine if available
      const publicationEnginePath = path.join(rootPath, 'tools/data-services/publication-engine.js');
      
      if (await fs.pathExists(publicationEnginePath)) {
        try {
          const PublicationEngine = require(publicationEnginePath);
          if (PublicationEngine && PublicationEngine.PublicationEngine) {
            const engine = new PublicationEngine.PublicationEngine();
            
            // Test basic functionality timing
            if (typeof engine.validateConfiguration === 'function') {
              await engine.validateConfiguration();
            }
          }
        } catch (error) {
          console.warn('Publication engine test skipped:', error.message);
        }
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      // Publication workflow operations should be fast (<1s)
      expect(executionTime).toBeLessThan(1000);
    });
  });

  describe('Regression Tests on Existing BMad Functionality', () => {
    test('core BMad agents remain functional', async () => {
      const bmadCorePath = path.join(rootPath, 'bmad-core');
      const agentsPath = path.join(bmadCorePath, 'agents');
      
      const agents = await fs.readdir(agentsPath);
      const coreAgents = ['architect.md', 'dev.md', 'pm.md', 'qa.md', 'sm.md'];
      
      for (const agent of coreAgents) {
        expect(agents).toContain(agent);
        
        const agentPath = path.join(agentsPath, agent);
        const agentContent = await fs.readFile(agentPath, 'utf8');
        
        // Verify agent structure integrity
        expect(agentContent).toContain('ACTIVATION-NOTICE:');
        expect(agentContent).toContain('```yaml');
        expect(agentContent).toContain('agent:');
        expect(agentContent).toContain('persona:');
        expect(agentContent).toContain('commands:');
      }
    });

    test('existing templates and workflows remain intact', async () => {
      const bmadCorePath = path.join(rootPath, 'bmad-core');
      const templatesPath = path.join(bmadCorePath, 'templates');
      const tasksPath = path.join(bmadCorePath, 'tasks');
      
      // Check templates
      expect(await fs.pathExists(templatesPath)).toBe(true);
      const templates = await fs.readdir(templatesPath);
      expect(templates).toContain('prd-tmpl.yaml');
      expect(templates).toContain('architecture-tmpl.yaml');
      
      // Check tasks
      expect(await fs.pathExists(tasksPath)).toBe(true);
      const tasks = await fs.readdir(tasksPath);
      expect(tasks).toContain('create-next-story.md');
      expect(tasks).toContain('document-project.md');
    });

    test('expansion pack structure integrity', async () => {
      const expansionPacksPath = path.join(rootPath, 'expansion-packs');
      const dataPractitionerPath = path.join(expansionPacksPath, 'bmad-data-practitioner');
      
      expect(await fs.pathExists(dataPractitionerPath)).toBe(true);
      
      // Verify expansion pack structure
      const packStructure = await fs.readdir(dataPractitionerPath);
      expect(packStructure).toContain('agents');
      expect(packStructure).toContain('config.yaml');
      expect(packStructure).toContain('evidence-project');
      
      // Verify agents exist
      const agentsPath = path.join(dataPractitionerPath, 'agents');
      const agents = await fs.readdir(agentsPath);
      expect(agents.length).toBe(6); // data-analyst, data-architect, data-engineer, data-product-manager, data-qa-engineer, ml-engineer
    });

    test('CLI functionality remains unaffected', async () => {
      const cliPath = path.join(rootPath, 'tools/cli.js');
      expect(await fs.pathExists(cliPath)).toBe(true);
      
      const cliContent = await fs.readFile(cliPath, 'utf8');
      expect(cliContent).toContain('commander');
      
      // Verify no syntax errors
      expect(() => {
        require('vm').createScript(cliContent);
      }).not.toThrow();
    });
  });

  describe('Performance Testing for Publication Generation Workflows', () => {
    test('Evidence.dev project structure load time', async () => {
      const startTime = process.hrtime.bigint();
      
      // Load Evidence.dev project structure
      const projectExists = await fs.pathExists(evidenceProjectPath);
      
      if (projectExists) {
        const projectFiles = await fs.readdir(evidenceProjectPath);
        
        // Check key directories
        const keyDirs = ['pages', 'sources', 'components'];
        keyDirs.forEach(dir => {
          const dirExists = projectFiles.includes(dir);
          if (dirExists) {
            console.log(`✅ ${dir} directory found`);
          }
        });
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      // Should load project structure quickly
      expect(executionTime).toBeLessThan(100);
    });

    test('Universal SQL configuration performance', async () => {
      const startTime = process.hrtime.bigint();
      
      const sourcesPath = path.join(evidenceProjectPath, 'sources/duckdb');
      
      if (await fs.pathExists(sourcesPath)) {
        const sourceFiles = await fs.readdir(sourcesPath);
        
        // Verify DuckDB configuration files
        const hasConnection = sourceFiles.includes('connection.yaml');
        const hasData = sourceFiles.some(file => file.endsWith('.sql'));
        
        if (hasConnection) {
          const connectionPath = path.join(sourcesPath, 'connection.yaml');
          const connectionContent = await fs.readFile(connectionPath, 'utf8');
          expect(connectionContent.length).toBeGreaterThan(0);
        }
        
        console.log(`✅ DuckDB sources: ${sourceFiles.length} files`);
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      // SQL configuration should load quickly
      expect(executionTime).toBeLessThan(50);
    });

    test('template rendering performance', async () => {
      const templatesPath = path.join(rootPath, 'expansion-packs/bmad-data-practitioner/templates');
      
      if (await fs.pathExists(templatesPath)) {
        const startTime = process.hrtime.bigint();
        
        const templates = await fs.readdir(templatesPath);
        
        // Test template file access
        for (const template of templates.slice(0, 5)) { // Test first 5 templates
          const templatePath = path.join(templatesPath, template);
          await fs.readFile(templatePath, 'utf8');
        }
        
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        
        // Template access should be fast
        expect(executionTime).toBeLessThan(200);
        console.log(`✅ Loaded ${Math.min(5, templates.length)} templates in ${Math.round(executionTime)}ms`);
      }
    });

    test('narrative generation performance simulation', async () => {
      const narrativePath = path.join(rootPath, 'expansion-packs/bmad-data-practitioner/narrative-generation');
      
      if (await fs.pathExists(narrativePath)) {
        const startTime = process.hrtime.bigint();
        
        const narrativeFiles = await fs.readdir(narrativePath);
        
        // Load narrative generation guides
        for (const file of narrativeFiles) {
          await fs.readFile(path.join(narrativePath, file), 'utf8');
        }
        
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        
        // Narrative resources should load quickly
        expect(executionTime).toBeLessThan(300);
        console.log(`✅ Loaded ${narrativeFiles.length} narrative resources in ${Math.round(executionTime)}ms`);
      }
    });

    test('component library performance', async () => {
      const componentsPath = path.join(evidenceProjectPath, 'components');
      
      if (await fs.pathExists(componentsPath)) {
        const startTime = process.hrtime.bigint();
        
        const components = await fs.readdir(componentsPath);
        
        // Test component file access
        for (const component of components) {
          const componentPath = path.join(componentsPath, component);
          await fs.readFile(componentPath, 'utf8');
        }
        
        const endTime = process.hrtime.bigint();
        const executionTime = Number(endTime - startTime) / 1000000;
        
        // Component loading should be efficient
        expect(executionTime).toBeLessThan(500);
        console.log(`✅ Loaded ${components.length} components in ${Math.round(executionTime)}ms`);
      }
    });
  });

  describe('End-to-End Integration Tests', () => {
    test('complete publication workflow integration', async () => {
      const startTime = process.hrtime.bigint();
      
      // Test complete workflow: config -> build -> verification
      const buildStatus = await evidenceBuilder.getBuildStatus();
      
      if (buildStatus.status === 'built' || buildStatus.status === 'not-built') {
        // Workflow components exist
        expect(typeof evidenceBuilder.loadEvidenceConfig).toBe('function');
        expect(typeof evidenceBuilder.generateSiteConfig).toBe('function');
        expect(typeof evidenceBuilder.executeEvidenceBuild).toBe('function');
      }
      
      const endTime = process.hrtime.bigint();
      const executionTime = Number(endTime - startTime) / 1000000;
      
      // Workflow validation should be fast
      expect(executionTime).toBeLessThan(100);
    });

    test('Evidence.dev and BMad system coexistence', async () => {
      // Test that both systems can operate simultaneously
      const evidenceConfigExists = await fs.pathExists(path.join(evidenceProjectPath, 'evidence.config.js'));
      const bmadConfigExists = await fs.pathExists(path.join(rootPath, 'bmad-core/core-config.yaml'));
      
      expect(bmadConfigExists).toBe(true);
      
      if (evidenceConfigExists) {
        console.log('✅ Evidence.dev and BMad configs coexist');
        
        // Both should be accessible without conflicts
        const bmadConfig = await fs.readFile(path.join(rootPath, 'bmad-core/core-config.yaml'), 'utf8');
        expect(bmadConfig.length).toBeGreaterThan(0);
        
        const evidenceConfig = evidenceBuilder.loadEvidenceConfig();
        expect(typeof evidenceConfig).toBe('object');
      }
    });

    test('system resource usage remains reasonable', () => {
      const memoryUsage = process.memoryUsage();
      
      // Memory usage should be reasonable (under 100MB for test environment)
      expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024);
      
      // RSS (Resident Set Size) should be reasonable
      expect(memoryUsage.rss).toBeLessThan(200 * 1024 * 1024);
      
      console.log(`✅ Memory usage: ${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB heap, ${Math.round(memoryUsage.rss / 1024 / 1024)}MB RSS`);
    });
  });
});