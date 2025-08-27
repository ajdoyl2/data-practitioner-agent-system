/**
 * Evidence.dev Builder Integration
 * 
 * Integrates Evidence.dev build process with the existing BMad web-builder
 * system while maintaining separation from agent bundling workflows.
 */

const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const chalk = require('chalk');

class EvidenceBuilder {
  constructor(options = {}) {
    this.projectRoot = options.projectRoot || process.cwd();
    this.evidenceProjectPath = path.join(
      this.projectRoot, 
      'expansion-packs/bmad-data-practitioner/evidence-project'
    );
    this.buildOutputPath = path.join(this.evidenceProjectPath, 'build');
    this.webBuilderIntegration = options.webBuilderIntegration ?? true;
    this.separateBuildProcess = options.separateBuildProcess ?? true;
  }

  /**
   * Load Evidence.dev configuration from evidence.config.js
   */
  loadEvidenceConfig() {
    try {
      const configPath = path.join(this.evidenceProjectPath, 'evidence.config.js');
      if (fs.existsSync(configPath)) {
        // Clear require cache to get fresh config
        delete require.cache[require.resolve(configPath)];
        return require(configPath);
      }
      return {};
    } catch (error) {
      console.warn(chalk.yellow('Warning: Could not load evidence.config.js, using defaults'));
      return {};
    }
  }

  /**
   * Generate site configuration for Evidence.dev build
   */
  async generateSiteConfig(analysisProject = {}) {
    const baseConfig = this.loadEvidenceConfig();
    
    return {
      ...baseConfig,
      // Dynamic configuration based on analysis project
      project: analysisProject,
      // Build-specific overrides
      build: {
        ...baseConfig.build,
        outDir: this.buildOutputPath,
        timestamp: new Date().toISOString()
      },
      // Integration settings
      integration: {
        bmadWebBuilder: this.webBuilderIntegration,
        separateProcess: this.separateBuildProcess
      }
    };
  }

  /**
   * Execute Evidence.dev build process
   */
  async executeEvidenceBuild(siteConfig = {}) {
    console.log(chalk.blue('🔨 Starting Evidence.dev build process...'));
    
    try {
      // Ensure Evidence.dev project directory exists
      if (!fs.existsSync(this.evidenceProjectPath)) {
        throw new Error(`Evidence.dev project not found at: ${this.evidenceProjectPath}`);
      }

      // Change to Evidence.dev project directory
      process.chdir(this.evidenceProjectPath);

      // Execute Evidence.dev build
      const buildResult = await this.runEvidenceBuildCommand();
      
      if (buildResult.success) {
        console.log(chalk.green('✅ Evidence.dev build completed successfully'));
        
        // Verify build output
        const buildVerified = await this.verifyBuildOutput();
        if (!buildVerified) {
          throw new Error('Build output verification failed');
        }

        return {
          success: true,
          buildPath: this.buildOutputPath,
          config: siteConfig,
          timestamp: new Date().toISOString()
        };
      } else {
        throw new Error(`Evidence.dev build failed: ${buildResult.error}`);
      }
    } catch (error) {
      console.error(chalk.red('❌ Evidence.dev build failed:'), error.message);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Run Evidence.dev build command
   */
  async runEvidenceBuildCommand() {
    return new Promise((resolve) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true
      });

      let stdout = '';
      let stderr = '';

      buildProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        // Stream output for debugging
        if (process.env.EVIDENCE_BUILD_VERBOSE) {
          process.stdout.write(data);
        }
      });

      buildProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        // Stream errors for debugging
        if (process.env.EVIDENCE_BUILD_VERBOSE) {
          process.stderr.write(data);
        }
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, stdout, stderr });
        } else {
          resolve({ 
            success: false, 
            error: `Build process exited with code ${code}`,
            stdout,
            stderr
          });
        }
      });

      buildProcess.on('error', (error) => {
        resolve({ 
          success: false, 
          error: error.message,
          stdout,
          stderr
        });
      });
    });
  }

  /**
   * Verify Evidence.dev build output
   */
  async verifyBuildOutput() {
    try {
      // Check if build directory exists
      if (!fs.existsSync(this.buildOutputPath)) {
        console.warn(chalk.yellow('Warning: Build output directory not found'));
        return false;
      }

      // Check for essential build files
      const buildFiles = await fs.readdir(this.buildOutputPath);
      const hasIndexFile = buildFiles.some(file => 
        file === 'index.html' || file === 'app.html'
      );

      if (!hasIndexFile) {
        console.warn(chalk.yellow('Warning: No index.html found in build output'));
        return false;
      }

      console.log(chalk.green(`✅ Build verification passed - ${buildFiles.length} files generated`));
      return true;
    } catch (error) {
      console.error(chalk.red('Build verification failed:'), error.message);
      return false;
    }
  }

  /**
   * Integrate with existing BMad web-builder
   */
  async integrateWithBMadBuilder(evidenceBuild) {
    if (!this.webBuilderIntegration) {
      console.log(chalk.blue('ℹ️  BMad web-builder integration disabled'));
      return evidenceBuild;
    }

    console.log(chalk.blue('🔗 Integrating Evidence.dev build with BMad web-builder...'));

    try {
      // Extend existing web-builder patterns
      const webBuilderPath = path.join(this.projectRoot, 'tools/builders/web-builder.js');
      
      if (fs.existsSync(webBuilderPath)) {
        // Add Evidence.dev sites as separate build targets
        const integration = {
          type: 'evidence-publication',
          buildPath: evidenceBuild.buildPath,
          timestamp: evidenceBuild.timestamp,
          // Maintain separation from agent bundling workflows
          separateFromAgentBundles: true,
          // Integration metadata
          metadata: {
            framework: 'evidence-dev',
            version: '25.0.0',
            buildSuccess: evidenceBuild.success
          }
        };

        console.log(chalk.green('✅ BMad web-builder integration completed'));
        return { ...evidenceBuild, integration };
      } else {
        console.warn(chalk.yellow('Warning: BMad web-builder not found, skipping integration'));
        return evidenceBuild;
      }
    } catch (error) {
      console.error(chalk.red('BMad web-builder integration failed:'), error.message);
      return { ...evidenceBuild, integrationError: error.message };
    }
  }

  /**
   * Build publication from analysis project
   */
  async buildPublication(analysisProject = {}) {
    console.log(chalk.blue('🚀 Starting Evidence.dev publication build...'));

    try {
      // Generate site configuration
      const siteConfig = await this.generateSiteConfig(analysisProject);
      console.log(chalk.blue('📋 Site configuration generated'));

      // Execute Evidence.dev build
      const evidenceBuild = await this.executeEvidenceBuild(siteConfig);
      
      if (!evidenceBuild.success) {
        throw new Error(`Evidence.dev build failed: ${evidenceBuild.error}`);
      }

      // Integrate with existing BMad web-builder
      const finalBuild = await this.integrateWithBMadBuilder(evidenceBuild);

      console.log(chalk.green('🎉 Publication build completed successfully!'));
      return finalBuild;
    } catch (error) {
      console.error(chalk.red('❌ Publication build failed:'), error.message);
      throw error;
    }
  }

  /**
   * Get build status and metadata
   */
  async getBuildStatus() {
    try {
      const buildExists = fs.existsSync(this.buildOutputPath);
      const projectExists = fs.existsSync(this.evidenceProjectPath);

      if (!projectExists) {
        return { status: 'not-initialized', message: 'Evidence.dev project not found' };
      }

      if (!buildExists) {
        return { status: 'not-built', message: 'No build output found' };
      }

      const buildFiles = await fs.readdir(this.buildOutputPath);
      const buildStats = await fs.stat(this.buildOutputPath);

      return {
        status: 'built',
        buildPath: this.buildOutputPath,
        fileCount: buildFiles.length,
        lastBuilt: buildStats.mtime,
        config: this.loadEvidenceConfig()
      };
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Clean build artifacts
   */
  async cleanBuild() {
    try {
      if (fs.existsSync(this.buildOutputPath)) {
        await fs.remove(this.buildOutputPath);
        console.log(chalk.green('✅ Build artifacts cleaned'));
      }
      
      // Clean Evidence.dev template directory
      const templatePath = path.join(this.evidenceProjectPath, '.evidence');
      if (fs.existsSync(templatePath)) {
        await fs.remove(templatePath);
        console.log(chalk.green('✅ Evidence.dev template directory cleaned'));
      }
    } catch (error) {
      console.error(chalk.red('Failed to clean build artifacts:'), error.message);
      throw error;
    }
  }
}

// CLI interface when run directly
if (require.main === module) {
  const builder = new EvidenceBuilder();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'build':
      builder.buildPublication()
        .then(result => {
          console.log(chalk.green('Build completed:'), result);
          process.exit(0);
        })
        .catch(error => {
          console.error(chalk.red('Build failed:'), error.message);
          process.exit(1);
        });
      break;
      
    case 'status':
      builder.getBuildStatus()
        .then(status => {
          console.log('Build status:', status);
          process.exit(0);
        })
        .catch(error => {
          console.error(chalk.red('Status check failed:'), error.message);
          process.exit(1);
        });
      break;
      
    case 'clean':
      builder.cleanBuild()
        .then(() => {
          console.log(chalk.green('Clean completed'));
          process.exit(0);
        })
        .catch(error => {
          console.error(chalk.red('Clean failed:'), error.message);
          process.exit(1);
        });
      break;
      
    default:
      console.log(`Usage: node evidence-builder.js <command>
      
Commands:
  build   - Build Evidence.dev publication
  status  - Check build status
  clean   - Clean build artifacts
      `);
      break;
  }
}

module.exports = { EvidenceBuilder };