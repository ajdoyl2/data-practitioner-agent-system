#!/usr/bin/env node

/**
 * Baseline Generation Script
 * Generates regression test baselines for CLI commands and workflows
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

class BaselineGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.baselineDir = path.join(this.projectRoot, 'tests', 'fixtures');
    this.testDir = path.join(this.projectRoot, 'tests', 'regression');
  }

  async generateBaselines() {
    try {
      console.log('🚀 Generating regression test baselines...');
      
      // Ensure baseline directories exist
      await fs.ensureDir(this.baselineDir);
      await fs.ensureDir(path.join(this.baselineDir, 'cli-baselines'));
      await fs.ensureDir(path.join(this.baselineDir, 'workflow-baselines'));
      
      // Run regression tests to generate baselines
      console.log('📊 Running CLI baseline tests...');
      this.runBaselineTests('cli-baseline.test.js');
      
      console.log('🔄 Running workflow baseline tests...');
      this.runBaselineTests('workflow-baseline.test.js');
      
      // Generate summary report
      await this.generateBaselineSummary();
      
      console.log('✅ Regression baselines generated successfully!');
      console.log(`📁 Baselines stored in: ${this.baselineDir}`);
      
    } catch (error) {
      console.error('❌ Failed to generate baselines:', error.message);
      process.exit(1);
    }
  }

  runBaselineTests(testFile) {
    try {
      const testPath = path.join(this.testDir, testFile);
      
      if (fs.pathExistsSync(testPath)) {
        execSync(`npx jest ${testPath} --passWithNoTests --updateSnapshot`, {
          stdio: 'inherit',
          cwd: this.projectRoot
        });
      } else {
        console.warn(`⚠️  Test file not found: ${testFile}`);
      }
    } catch (error) {
      console.warn(`⚠️  Failed to run ${testFile}:`, error.message);
    }
  }

  async generateBaselineSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      generator: 'BMad-Method Baseline Generator',
      version: '1.0.0',
      baselines: {
        cli: {},
        workflow: {},
        system: {}
      }
    };

    // Collect CLI baselines
    const cliBaselinesDir = path.join(this.baselineDir, 'cli-baselines');
    if (await fs.pathExists(cliBaselinesDir)) {
      const cliFiles = await fs.readdir(cliBaselinesDir);
      summary.baselines.cli = {
        count: cliFiles.length,
        files: cliFiles.sort()
      };
    }

    // Collect workflow baselines
    const workflowBaselinesDir = path.join(this.baselineDir, 'workflow-baselines');
    if (await fs.pathExists(workflowBaselinesDir)) {
      const workflowFiles = await fs.readdir(workflowBaselinesDir);
      summary.baselines.workflow = {
        count: workflowFiles.length,
        files: workflowFiles.sort()
      };
    }

    // System information
    summary.baselines.system = {
      nodeVersion: process.version,
      platform: process.platform,
      architecture: process.arch,
      projectRoot: this.projectRoot
    };

    await fs.writeJson(
      path.join(this.baselineDir, 'baseline-summary.json'),
      summary,
      { spaces: 2 }
    );

    console.log('📋 Baseline Summary:');
    console.log(`   CLI Baselines: ${summary.baselines.cli.count || 0}`);
    console.log(`   Workflow Baselines: ${summary.baselines.workflow.count || 0}`);
    console.log(`   Node Version: ${summary.baselines.system.nodeVersion}`);
  }

  async validateBaselines() {
    console.log('🔍 Validating existing baselines...');
    
    const validationResults = {
      timestamp: new Date().toISOString(),
      validations: {}
    };

    // Check if baseline files exist and are readable
    const expectedBaselines = [
      'cli-baselines/performance-baseline.json',
      'workflow-baselines/agent-discovery-baseline.json',
      'baseline-summary.json'
    ];

    for (const baseline of expectedBaselines) {
      const baselinePath = path.join(this.baselineDir, baseline);
      
      try {
        if (await fs.pathExists(baselinePath)) {
          const content = await fs.readJson(baselinePath);
          validationResults.validations[baseline] = {
            exists: true,
            readable: true,
            hasTimestamp: !!content.timestamp,
            fileSize: (await fs.stat(baselinePath)).size
          };
        } else {
          validationResults.validations[baseline] = {
            exists: false,
            readable: false
          };
        }
      } catch (error) {
        validationResults.validations[baseline] = {
          exists: true,
          readable: false,
          error: error.message
        };
      }
    }

    await fs.writeJson(
      path.join(this.baselineDir, 'baseline-validation.json'),
      validationResults,
      { spaces: 2 }
    );

    const validCount = Object.values(validationResults.validations)
      .filter(v => v.exists && v.readable).length;
    
    console.log(`✅ Validated ${validCount}/${expectedBaselines.length} baselines`);
    
    return validationResults;
  }
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);
  const command = args[0] || 'generate';
  
  const generator = new BaselineGenerator();
  
  switch (command) {
    case 'generate':
      generator.generateBaselines().catch(error => {
        console.error('Failed to generate baselines:', error);
        process.exit(1);
      });
      break;
      
    case 'validate':
      generator.validateBaselines().catch(error => {
        console.error('Failed to validate baselines:', error);
        process.exit(1);
      });
      break;
      
    default:
      console.log('Usage: node scripts/generate-baselines.js [generate|validate]');
      console.log('  generate - Generate new regression baselines');
      console.log('  validate - Validate existing baselines');
      process.exit(1);
  }
}

module.exports = BaselineGenerator;