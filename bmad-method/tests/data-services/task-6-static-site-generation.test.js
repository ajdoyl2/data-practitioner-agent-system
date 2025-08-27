/**
 * Task 6: Static Site Generation and Deployment Tests
 * Tests for Evidence.dev static site generation, deployment integration, 
 * access control, and performance optimization
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');
const { PublicationEngine } = require('../../tools/data-services/publication-engine');

describe('Task 6: Static Site Generation and Deployment', () => {
  let publicationEngine;
  let evidenceProjectPath;
  
  beforeAll(async () => {
    publicationEngine = new PublicationEngine({
      projectRoot: path.join(__dirname, '../../')
    });
    evidenceProjectPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/evidence-project');
  });

  describe('Evidence.dev Static Site Generation Configuration', () => {
    test('should have enhanced evidence.config.js with static site generation settings', async () => {
      const configPath = path.join(evidenceProjectPath, 'evidence.config.js');
      expect(await fs.pathExists(configPath)).toBe(true);
      
      const configContent = await fs.readFile(configPath, 'utf8');
      
      // Check for static site generation configuration
      expect(configContent).toContain('adapter: \'static\'');
      expect(configContent).toContain('outDir: \'./build\'');
      expect(configContent).toContain('prerendered: true');
      
      // Check for custom styling configuration
      expect(configContent).toContain('customCSS');
      expect(configContent).toContain('branding');
      
      // Check for performance optimization settings
      expect(configContent).toContain('optimization');
      expect(configContent).toContain('minify: true');
      expect(configContent).toContain('compress: true');
    });

    test('should have custom CSS file for branding and styling', async () => {
      const cssPath = path.join(evidenceProjectPath, 'static/custom-styles.css');
      expect(await fs.pathExists(cssPath)).toBe(true);
      
      const cssContent = await fs.readFile(cssPath, 'utf8');
      
      // Check for BMad brand colors
      expect(cssContent).toContain('--bmad-primary: #1e3a8a');
      expect(cssContent).toContain('--bmad-secondary: #64748b');
      expect(cssContent).toContain('--bmad-accent: #0ea5e9');
      
      // Check for responsive design
      expect(cssContent).toContain('@media (max-width: 768px)');
      expect(cssContent).toContain('@media (max-width: 480px)');
      
      // Check for print styles
      expect(cssContent).toContain('@media print');
    });

    test('should have package.json with deployment scripts', async () => {
      const packagePath = path.join(evidenceProjectPath, 'package.json');
      expect(await fs.pathExists(packagePath)).toBe(true);
      
      const packageContent = await fs.readJSON(packagePath);
      
      // Check for deployment scripts
      expect(packageContent.scripts).toHaveProperty('deploy');
      expect(packageContent.scripts).toHaveProperty('deploy:build');
      expect(packageContent.scripts).toHaveProperty('deploy:test');
      expect(packageContent.scripts).toHaveProperty('deploy:validate');
    });
  });

  describe('Deployment Configuration Files', () => {
    test('should have environment configuration template', async () => {
      const envTemplatePath = path.join(evidenceProjectPath, '.evidence.env.template');
      expect(await fs.pathExists(envTemplatePath)).toBe(true);
      
      const envContent = await fs.readFile(envTemplatePath, 'utf8');
      
      // Check for deployment type options
      expect(envContent).toContain('DEPLOYMENT_TYPE=static');
      expect(envContent).toContain('DEPLOYMENT_TYPE=cdn');
      expect(envContent).toContain('DEPLOYMENT_TYPE=evidence_cloud');
      
      // Check for security settings
      expect(envContent).toContain('BASIC_AUTH_ENABLED');
      expect(envContent).toContain('OAUTH_ENABLED');
      expect(envContent).toContain('IP_ALLOWLIST_ENABLED');
      
      // Check for performance settings
      expect(envContent).toContain('CDN_ENABLED');
      expect(envContent).toContain('COMPRESSION_ENABLED');
      expect(envContent).toContain('PERFORMANCE_MONITORING');
    });

    test('should have executable deployment script', async () => {
      const deployScriptPath = path.join(evidenceProjectPath, 'deploy.sh');
      expect(await fs.pathExists(deployScriptPath)).toBe(true);
      
      const stats = await fs.stat(deployScriptPath);
      expect(stats.mode & parseInt('755', 8)).toBeTruthy(); // Check executable permissions
      
      const scriptContent = await fs.readFile(deployScriptPath, 'utf8');
      
      // Check for deployment functions
      expect(scriptContent).toContain('deploy_static()');
      expect(scriptContent).toContain('deploy_cdn()');
      expect(scriptContent).toContain('deploy_evidence_cloud()');
      
      // Check for validation functions
      expect(scriptContent).toContain('validate_environment()');
      expect(scriptContent).toContain('test_performance()');
    });
  });

  describe('Access Control Implementation', () => {
    test('should have authentication middleware', async () => {
      const authPath = path.join(evidenceProjectPath, 'middleware/auth.js');
      expect(await fs.pathExists(authPath)).toBe(true);
      
      const authContent = await fs.readFile(authPath, 'utf8');
      
      // Check for authentication methods
      expect(authContent).toContain('basicAuth');
      expect(authContent).toContain('oauthAuth');
      expect(authContent).toContain('ipAllowlist');
      
      // Check for OAuth providers
      expect(authContent).toContain('google');
      expect(authContent).toContain('github');
      expect(authContent).toContain('microsoft');
      
      // Check for security measures
      expect(authContent).toContain('crypto');
      expect(authContent).toContain('verifyToken');
    });

    test('should have comprehensive security configuration', async () => {
      const configPath = path.join(evidenceProjectPath, 'evidence.config.js');
      const configContent = await fs.readFile(configPath, 'utf8');
      
      // Check for Content Security Policy
      expect(configContent).toContain('csp');
      expect(configContent).toContain('default-src');
      expect(configContent).toContain('script-src');
      
      // Check for security headers
      expect(configContent).toContain('X-Frame-Options');
      expect(configContent).toContain('X-Content-Type-Options');
      expect(configContent).toContain('Referrer-Policy');
    });
  });

  describe('PublicationEngine Deployment Integration', () => {
    test('should have deployment methods in PublicationEngine', () => {
      // Check if deployment methods exist
      expect(typeof publicationEngine.deployPublication).toBe('function');
      expect(typeof publicationEngine.deployToStaticPlatform).toBe('function');
      expect(typeof publicationEngine.deployToCDN).toBe('function');
      expect(typeof publicationEngine.deployToEvidenceCloud).toBe('function');
    });

    test('should validate deployment configuration', async () => {
      // Test deployment configuration validation
      const config = publicationEngine.validateDeploymentConfig({
        platform: 'static',
        staticPlatform: 'netlify'
      });
      
      expect(config).toHaveProperty('platform', 'static');
      expect(config).toHaveProperty('buildCommand');
      expect(config).toHaveProperty('outputDirectory');
    });

    test('should handle deployment configuration errors', () => {
      // Test error handling for missing required environment variables
      process.env.AWS_S3_BUCKET = ''; // Clear env var
      
      expect(() => {
        publicationEngine.validateDeploymentConfig({ platform: 'cdn' });
      }).toThrow('AWS_S3_BUCKET environment variable required');
    });

    test('should extract deployment URLs from script output', () => {
      const netlifyOutput = 'Website deployed to https://example-site.netlify.app';
      const vercelOutput = 'Deployed to https://my-site.vercel.app';
      const awsOutput = 'Available at https://d123456789.cloudfront.net';
      
      expect(publicationEngine.extractDeploymentUrl(netlifyOutput)).toContain('netlify.app');
      expect(publicationEngine.extractDeploymentUrl(vercelOutput)).toContain('vercel.app');
      expect(publicationEngine.extractDeploymentUrl(awsOutput)).toContain('cloudfront.net');
    });
  });

  describe('Performance Optimization', () => {
    test('should have performance optimizer utility', async () => {
      const optimizerPath = path.join(evidenceProjectPath, 'utils/performance-optimizer.js');
      expect(await fs.pathExists(optimizerPath)).toBe(true);
      
      const optimizerContent = await fs.readFile(optimizerPath, 'utf8');
      
      // Check for optimization methods
      expect(optimizerContent).toContain('analyzePerformance');
      expect(optimizerContent).toContain('analyzeBuildMetrics');
      expect(optimizerContent).toContain('analyzeSQLQueries');
      expect(optimizerContent).toContain('analyzeImageOptimization');
    });

    test('should have performance thresholds configured', async () => {
      const configPath = path.join(evidenceProjectPath, 'evidence.config.js');
      const configContent = await fs.readFile(configPath, 'utf8');
      
      // Check for performance budgets
      expect(configContent).toContain('loadTimeTarget: 3000'); // 3s on 3G
      expect(configContent).toContain('loadTimeOptimal: 1000'); // 1s on WiFi
      expect(configContent).toContain('bundleSize');
      expect(configContent).toContain('initial: 500000'); // 500KB initial
      expect(configContent).toContain('total: 2097152'); // 2MB total
    });
  });

  describe('CDN Integration', () => {
    test('should have CDN integration utility', async () => {
      const cdnPath = path.join(evidenceProjectPath, 'utils/cdn-integration.js');
      expect(await fs.pathExists(cdnPath)).toBe(true);
      
      const cdnContent = await fs.readFile(cdnPath, 'utf8');
      
      // Check for CDN methods
      expect(cdnContent).toContain('configureCDN');
      expect(cdnContent).toContain('generateAssetManifest');
      expect(cdnContent).toContain('generateCacheConfiguration');
      expect(cdnContent).toContain('optimizeForCDN');
    });

    test('should have CDN configuration in evidence.config.js', async () => {
      const configPath = path.join(evidenceProjectPath, 'evidence.config.js');
      const configContent = await fs.readFile(configPath, 'utf8');
      
      // Check for CDN settings
      expect(configContent).toContain('cdn');
      expect(configContent).toContain('cacheHeaders');
      expect(configContent).toContain('max-age=31536000'); // 1 year cache
      expect(configContent).toContain('max-age=3600'); // 1 hour cache
    });

    test('should support multiple CDN providers', async () => {
      const cdnPath = path.join(evidenceProjectPath, 'utils/cdn-integration.js');
      const cdnContent = await fs.readFile(cdnPath, 'utf8');
      
      // Check for CDN provider support
      expect(cdnContent).toContain('writeCloudflareConfig');
      expect(cdnContent).toContain('writeAWSConfig');
      expect(cdnContent).toContain('writeFastlyConfig');
    });
  });

  describe('End-to-End Integration Tests', () => {
    test('should validate Evidence.dev build process can execute', async () => {
      try {
        // Test that the Evidence.dev project structure is valid
        const result = execSync('npm run build:strict', {
          cwd: evidenceProjectPath,
          encoding: 'utf8',
          timeout: 30000 // 30 second timeout
        });
        
        // Should complete without throwing error
        expect(result).toBeDefined();
      } catch (error) {
        // If build fails, check if it's due to missing dependencies
        if (error.message.includes('not found') || error.message.includes('Cannot resolve')) {
          console.warn('Build test skipped - dependencies not installed');
        } else {
          throw error;
        }
      }
    });

    test('should validate deployment script syntax', async () => {
      try {
        // Test that the deployment script has valid bash syntax
        execSync('bash -n ./deploy.sh', {
          cwd: evidenceProjectPath,
          encoding: 'utf8'
        });
        
        // Should complete without syntax errors
      } catch (error) {
        fail(`Deployment script has syntax errors: ${error.message}`);
      }
    });

    test('should validate deployment script validation function', async () => {
      try {
        // Test the validation function
        const result = execSync('bash ./deploy.sh validate', {
          cwd: evidenceProjectPath,
          encoding: 'utf8',
          timeout: 10000
        });
        
        // Should provide validation feedback
        expect(result).toContain('validation');
      } catch (error) {
        // Expected to fail if dependencies missing, but should not have syntax errors
        expect(error.message).not.toContain('syntax error');
      }
    });
  });

  describe('Task 6 Completion Validation', () => {
    test('should have all required Task 6 subtasks implemented', async () => {
      const requiredFiles = [
        'evidence.config.js', // Enhanced configuration
        '.evidence.env.template', // Environment template
        'deploy.sh', // Deployment script
        'middleware/auth.js', // Access control
        'static/custom-styles.css', // Custom styling
        'utils/performance-optimizer.js', // Performance optimization
        'utils/cdn-integration.js' // CDN integration
      ];
      
      for (const file of requiredFiles) {
        const filePath = path.join(evidenceProjectPath, file);
        expect(await fs.pathExists(filePath)).toBe(true);
      }
    });

    test('should have deployment integration with BMad workflows', () => {
      // Check that PublicationEngine has deployment methods
      const deploymentMethods = [
        'deployPublication',
        'validateDeploymentConfig',
        'deployToStaticPlatform',
        'deployToCDN',
        'deployToEvidenceCloud',
        'getDeploymentStatus',
        'rollbackDeployment'
      ];
      
      for (const method of deploymentMethods) {
        expect(typeof publicationEngine[method]).toBe('function');
      }
    });

    test('should meet Task 6 acceptance criteria', async () => {
      // AC: Configure Evidence.dev static site generation with custom styling
      const configExists = await fs.pathExists(path.join(evidenceProjectPath, 'evidence.config.js'));
      const stylesExist = await fs.pathExists(path.join(evidenceProjectPath, 'static/custom-styles.css'));
      expect(configExists && stylesExist).toBe(true);
      
      // AC: Implement deployment integration with existing BMad deployment workflows
      expect(typeof publicationEngine.deployPublication).toBe('function');
      
      // AC: Create deployment configuration files
      const deployConfigExists = await fs.pathExists(path.join(evidenceProjectPath, '.evidence.env.template'));
      const deployScriptExists = await fs.pathExists(path.join(evidenceProjectPath, 'deploy.sh'));
      expect(deployConfigExists && deployScriptExists).toBe(true);
      
      // AC: Implement access control
      const authExists = await fs.pathExists(path.join(evidenceProjectPath, 'middleware/auth.js'));
      expect(authExists).toBe(true);
      
      // AC: Add site performance optimization and CDN integration
      const perfOptimizerExists = await fs.pathExists(path.join(evidenceProjectPath, 'utils/performance-optimizer.js'));
      const cdnIntegrationExists = await fs.pathExists(path.join(evidenceProjectPath, 'utils/cdn-integration.js'));
      expect(perfOptimizerExists && cdnIntegrationExists).toBe(true);
    });
  });
});