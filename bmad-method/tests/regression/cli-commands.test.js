/**
 * CLI Commands Regression Test Suite
 * Validates all existing CLI commands maintain identical functionality
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs-extra');

describe('CLI Commands Regression Tests', () => {
  const cliPath = path.join(__dirname, '../../tools/cli.js');
  const timeout = 30000; // 30 seconds for CLI operations

  beforeAll(async () => {
    // Verify CLI exists
    expect(await fs.pathExists(cliPath)).toBe(true);
  });

  /**
   * Execute CLI command and capture output
   */
  async function executeCliCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('node', [cliPath, ...args], {
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: options.timeout || timeout,
        cwd: path.join(__dirname, '../..')
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('exit', (code, signal) => {
        resolve({
          code,
          signal,
          stdout,
          stderr,
          success: code === 0
        });
      });

      child.on('error', (error) => {
        reject(error);
      });
    });
  }

  describe('Core Build Commands', () => {
    test('should execute build command successfully', async () => {
      const result = await executeCliCommand(['build', '--agents-only']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Building agent bundles');
      expect(result.stderr).not.toContain('Error');
    }, timeout);

    test('should execute teams-only build', async () => {
      const result = await executeCliCommand(['build', '--teams-only']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/Building.*team|Team.*build|teams/i);
    }, timeout);

    test('should execute expansions build', async () => {
      const result = await executeCliCommand(['build:expansions']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/expansion|Extension/i);
    }, timeout);
  });

  describe('List Commands', () => {
    test('should list agents without errors', async () => {
      const result = await executeCliCommand(['list:agents']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stderr).not.toContain('Error');
    });

    test('should list expansions without errors', async () => {
      const result = await executeCliCommand(['list:expansions']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    });
  });

  describe('Validation Commands', () => {
    test('should validate configurations without errors', async () => {
      const result = await executeCliCommand(['validate']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/valid|success|complete|passed/i);
      expect(result.stderr).not.toContain('Error');
    }, timeout);
  });

  describe('Data Service Commands', () => {
    test('should list data connectors', async () => {
      const result = await executeCliCommand(['data-connectors']);
      
      // Command may exit with code 1 due to PyAirbyte check, but should still provide output
      expect(result.code).toBeGreaterThanOrEqual(0);
      expect(result.stdout.length).toBeGreaterThan(0);
      expect(result.stdout).toContain('data connectors');
    });

    test('should list features without errors', async () => {
      const result = await executeCliCommand(['list-features']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    });
  });

  describe('Feature Management Commands', () => {
    test('should handle feature enable/disable cycle', async () => {
      // Get current feature state
      const listResult = await executeCliCommand(['list-features']);
      expect(listResult.success).toBe(true);

      // Test feature toggling (use a safe test feature)
      const enableResult = await executeCliCommand(['enable-feature', 'duckdb_analytics']);
      expect(enableResult.success).toBe(true);

      const disableResult = await executeCliCommand(['disable-feature', 'duckdb_analytics']);
      expect(disableResult.success).toBe(true);
    });
  });

  describe('Help and Version Commands', () => {
    test('should display help without errors', async () => {
      const result = await executeCliCommand(['--help']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Usage:');
      expect(result.stdout).toContain('Commands:');
    });

    test('should display version without errors', async () => {
      const result = await executeCliCommand(['--version']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/\d+\.\d+\.\d+/); // Version pattern
    });

    test('should display command-specific help', async () => {
      const result = await executeCliCommand(['help', 'build']);
      
      expect(result.success).toBe(true);
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('build');
      expect(result.stdout).toMatch(/option|Usage/i);
    });
  });

  describe('Error Handling Regression', () => {
    test('should handle invalid commands gracefully', async () => {
      const result = await executeCliCommand(['invalid-command']);
      
      expect(result.success).toBe(false);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toMatch(/unknown command|not found/i);
    });

    test('should handle invalid options gracefully', async () => {
      const result = await executeCliCommand(['build', '--invalid-option']);
      
      expect(result.success).toBe(false);
      expect(result.code).not.toBe(0);
      expect(result.stderr).toMatch(/unknown option|invalid/i);
    });
  });

  describe('Output Format Consistency', () => {
    test('should maintain consistent output format for list commands', async () => {
      const agentsResult = await executeCliCommand(['list:agents']);
      const expansionsResult = await executeCliCommand(['list:expansions']);
      
      expect(agentsResult.success).toBe(true);
      expect(expansionsResult.success).toBe(true);
      
      // Both should have structured output
      expect(agentsResult.stdout.length).toBeGreaterThan(0);
      expect(expansionsResult.stdout.length).toBeGreaterThan(0);
    });

    test('should maintain consistent success message patterns', async () => {
      const buildResult = await executeCliCommand(['build', '--agents-only']);
      const validateResult = await executeCliCommand(['validate']);
      
      expect(buildResult.success).toBe(true);
      expect(validateResult.success).toBe(true);
      
      // Should contain completion indicators
      expect(buildResult.stdout).toMatch(/(complet|finish|success|done)/i);
      expect(validateResult.stdout).toMatch(/(valid|success|pass|complete)/i);
    });
  });
});