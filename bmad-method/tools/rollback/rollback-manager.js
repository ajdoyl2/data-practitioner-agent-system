/**
 * Rollback Manager
 * Orchestrates rollback procedures for data practitioner stories
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');
const { disableFeature, isFeatureEnabled } = require('../lib/feature-flag-manager');
const { securityLogger } = require('../lib/security-logger');

// Rollback script mapping
const ROLLBACK_SCRIPTS = {
  '1.2': 'rollback-story-1.2.sh',
  '1.3': 'rollback-story-1.3.sh',
  '1.4': 'rollback-story-1.4.sh',
  '1.5': 'rollback-story-1.5.sh',
  '1.6': 'rollback-story-1.6.sh',
  '1.7': 'rollback-story-1.7.sh',
  '1.8': 'rollback-story-1.8.sh'
};

// Feature flag mapping
const STORY_FEATURES = {
  '1.2': 'pyairbyte_integration',
  '1.3': 'duckdb_analytics',
  '1.4': 'dbt_transformations',
  '1.5': 'dagster_orchestration',
  '1.6': 'eda_automation',
  '1.7': 'evidence_publishing',
  '1.8': 'qa_framework'
};

/**
 * Execute a rollback script
 * @param {string} scriptPath - Path to rollback script
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} Execution result
 */
function executeScript(scriptPath, options = {}) {
  return new Promise((resolve, reject) => {
    const env = { ...process.env, ...options.env };
    const child = spawn('bash', [scriptPath], {
      env,
      cwd: options.cwd || __dirname
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
      if (options.verbose) {
        process.stdout.write(data);
      }
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
      if (options.verbose) {
        process.stderr.write(data);
      }
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve({ success: true, stdout, stderr });
      } else {
        reject(new Error(`Script exited with code ${code}\n${stderr}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Capture current state before rollback
 * @param {string} storyId - Story identifier
 * @returns {Promise<Object>} State snapshot
 */
async function capturePreRollbackState(storyId) {
  const snapshot = {
    timestamp: new Date().toISOString(),
    storyId,
    feature: STORY_FEATURES[storyId],
    environment: process.env.NODE_ENV || 'development',
    files: [],
    packages: []
  };
  
  // Capture installed packages
  try {
    const packageJson = await fs.readJson(path.join(__dirname, '../../package.json'));
    snapshot.packages = Object.keys(packageJson.dependencies || {});
  } catch (error) {
    console.warn('Could not capture package.json state:', error.message);
  }
  
  // Capture story-specific files (will be enhanced per story)
  const storyFiles = await getStoryFiles(storyId);
  for (const file of storyFiles) {
    if (await fs.pathExists(file)) {
      snapshot.files.push({
        path: file,
        exists: true,
        size: (await fs.stat(file)).size
      });
    }
  }
  
  return snapshot;
}

/**
 * Get files associated with a story
 * @param {string} storyId - Story identifier
 * @returns {Promise<string[]>} List of file paths
 */
async function getStoryFiles(storyId) {
  // This will be expanded based on each story's implementation
  const storyFileMap = {
    '1.2': [
      path.join(__dirname, '../data-services/pyairbyte-service.js'),
      path.join(__dirname, '../../config/pyairbyte-connectors.yaml')
    ],
    '1.3': [
      path.join(__dirname, '../data-services/duckdb-service.js'),
      path.join(__dirname, '../../data/duckdb/')
    ],
    '1.4': [
      path.join(__dirname, '../data-services/dbt-service.js'),
      path.join(__dirname, '../../dbt_project/')
    ],
    '1.5': [
      path.join(__dirname, '../data-services/dagster-service.js'),
      path.join(__dirname, '../../dagster_home/')
    ],
    '1.6': [
      path.join(__dirname, '../data-services/eda-service.js'),
      path.join(__dirname, '../../notebooks/')
    ],
    '1.7': [
      path.join(__dirname, '../data-services/evidence-service.js'),
      path.join(__dirname, '../../evidence_project/')
    ],
    '1.8': [
      path.join(__dirname, '../data-services/qa-service.js'),
      path.join(__dirname, '../../tests/data-services/')
    ]
  };
  
  return storyFileMap[storyId] || [];
}

/**
 * Validate rollback success
 * @param {string} storyId - Story identifier
 * @param {Object} preState - Pre-rollback state
 * @returns {Promise<Object>} Validation result
 */
async function validateRollback(storyId, preState) {
  const validation = {
    success: true,
    errors: [],
    warnings: []
  };
  
  // Check feature flag is disabled
  const feature = STORY_FEATURES[storyId];
  if (isFeatureEnabled(feature)) {
    validation.success = false;
    validation.errors.push(`Feature ${feature} is still enabled`);
  }
  
  // Check files are removed
  const storyFiles = await getStoryFiles(storyId);
  for (const file of storyFiles) {
    if (await fs.pathExists(file)) {
      const stat = await fs.stat(file);
      if (stat.isFile()) {
        validation.warnings.push(`File still exists: ${file}`);
      }
    }
  }
  
  // Run story-specific validation
  const validationScript = path.join(__dirname, `validate-rollback-${storyId}.sh`);
  if (await fs.pathExists(validationScript)) {
    try {
      await executeScript(validationScript);
    } catch (error) {
      validation.success = false;
      validation.errors.push(`Validation script failed: ${error.message}`);
    }
  }
  
  return validation;
}

/**
 * Rollback a specific story
 * @param {string} storyId - Story identifier (e.g., '1.2')
 * @param {Object} options - Rollback options
 * @returns {Promise<Object>} Rollback result
 */
async function rollbackStory(storyId, options = {}) {
  const scriptName = ROLLBACK_SCRIPTS[storyId];
  if (!scriptName) {
    throw new Error(`Unknown story ID: ${storyId}`);
  }
  
  const scriptPath = path.join(__dirname, scriptName);
  if (!await fs.pathExists(scriptPath)) {
    throw new Error(`Rollback script not found: ${scriptPath}`);
  }
  
  console.log(`Starting rollback for Story ${storyId}...`);
  
  // Capture pre-rollback state
  const preState = await capturePreRollbackState(storyId);
  
  // Log rollback initiation
  securityLogger.logRollbackInitiated({
    storyId,
    feature: STORY_FEATURES[storyId],
    reason: options.reason || 'Manual rollback',
    preState: preState
  });
  
  try {
    // Disable feature flag first
    const feature = STORY_FEATURES[storyId];
    let featuresDisabled = [];
    if (feature) {
      console.log(`Disabling feature: ${feature}`);
      featuresDisabled = await disableFeature(feature, true);
    }
    
    // Execute rollback script
    console.log(`Executing rollback script: ${scriptName}`);
    const result = await executeScript(scriptPath, {
      verbose: options.verbose,
      env: {
        ROLLBACK_REASON: options.reason || 'Manual rollback',
        ROLLBACK_DRY_RUN: options.dryRun ? '1' : '0'
      }
    });
    
    // Validate rollback
    console.log('Validating rollback...');
    const validation = await validateRollback(storyId, preState);
    
    if (!validation.success) {
      throw new Error(`Rollback validation failed: ${validation.errors.join(', ')}`);
    }
    
    // Log successful rollback
    securityLogger.logSecurityEvent('INFO', 'rollback_completed', {
      storyId,
      feature,
      validation
    });
    
    return {
      success: true,
      storyId,
      feature,
      featuresDisabled,
      validation,
      output: result.stdout
    };
    
  } catch (error) {
    // Log rollback failure
    securityLogger.logSecurityEvent('ERROR', 'rollback_failed', {
      storyId,
      feature: STORY_FEATURES[storyId],
      error: error.message
    });
    
    throw error;
  }
}

/**
 * Rollback multiple stories in sequence
 * @param {string[]} storyIds - Array of story IDs
 * @param {Object} options - Rollback options
 * @returns {Promise<Object[]>} Rollback results
 */
async function rollbackMultipleStories(storyIds, options = {}) {
  const results = [];
  
  // Sort in reverse order to handle dependencies
  const sortedIds = [...storyIds].sort().reverse();
  
  for (const storyId of sortedIds) {
    try {
      const result = await rollbackStory(storyId, options);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        storyId,
        error: error.message
      });
      
      if (!options.continueOnError) {
        break;
      }
    }
  }
  
  return results;
}

/**
 * Get rollback status for all stories
 * @returns {Promise<Object>} Status map
 */
async function getRollbackStatus() {
  const status = {};
  
  for (const [storyId, scriptName] of Object.entries(ROLLBACK_SCRIPTS)) {
    const scriptPath = path.join(__dirname, scriptName);
    const feature = STORY_FEATURES[storyId];
    
    status[storyId] = {
      scriptExists: await fs.pathExists(scriptPath),
      feature,
      featureEnabled: false
    };
    
    if (feature) {
      status[storyId].featureEnabled = isFeatureEnabled(feature);
    }
  }
  
  return status;
}

/**
 * Create rollback documentation
 * @param {string} outputPath - Path for documentation
 */
async function generateRollbackDocs(outputPath) {
  const docs = [
    '# Rollback Procedures',
    '',
    'This document describes the rollback procedures for each data practitioner story.',
    '',
    '## Quick Reference',
    ''
  ];
  
  // Add status table
  docs.push('| Story | Feature | Script | Status |');
  docs.push('|-------|---------|--------|--------|');
  
  const status = await getRollbackStatus();
  for (const [storyId, info] of Object.entries(status)) {
    const scriptStatus = info.scriptExists ? '✓' : '✗';
    const featureStatus = info.featureEnabled ? 'Enabled' : 'Disabled';
    docs.push(`| ${storyId} | ${info.feature} | ${scriptStatus} | ${featureStatus} |`);
  }
  
  docs.push('');
  docs.push('## Rollback Commands');
  docs.push('');
  docs.push('```bash');
  docs.push('# Rollback a single story');
  docs.push('bmad rollback-story 1.2');
  docs.push('');
  docs.push('# Rollback with verbose output');
  docs.push('bmad rollback-story 1.3 --verbose');
  docs.push('');
  docs.push('# Dry run (preview changes)');
  docs.push('bmad rollback-story 1.4 --dry-run');
  docs.push('');
  docs.push('# Rollback multiple stories');
  docs.push('bmad rollback-story 1.5,1.6,1.7');
  docs.push('```');
  
  await fs.writeFile(outputPath, docs.join('\n'), 'utf8');
}

// Export for CLI integration
module.exports = {
  rollbackStory,
  rollbackMultipleStories,
  getRollbackStatus,
  generateRollbackDocs
};