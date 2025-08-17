/**
 * Dagster Wrapper
 * Python subprocess execution wrapper for Dagster operations
 */

const { spawn, exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(exec);

class DagsterWrapper {
  constructor(options = {}) {
    this.projectPath = this._validatePath(options.projectPath);
    this.webUIPort = this._validatePort(options.webUIPort || 3001);
    this.daemonPort = this._validatePort(options.daemonPort || 3070);
    
    // Process management
    this.daemonProcess = null;
    this.webUIProcess = null;
    
    // Python environment settings
    this.pythonPath = options.pythonPath || 'python';
    this.dagsterExecutable = options.dagsterExecutable || 'dagster';
  }

  /**
   * Validate and sanitize file paths to prevent path injection
   */
  _validatePath(inputPath) {
    if (!inputPath) return null;
    
    const resolvedPath = path.resolve(inputPath);
    
    // Prevent path traversal attacks
    if (resolvedPath.includes('..')) {
      throw new Error('Invalid path: path traversal detected');
    }
    
    return resolvedPath;
  }

  /**
   * Validate port numbers
   */
  _validatePort(port) {
    const portNum = parseInt(port);
    if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
      throw new Error(`Invalid port number: ${port}`);
    }
    return portNum;
  }

  /**
   * Check if Dagster is available in the environment
   */
  async isAvailable() {
    try {
      const { stdout } = await execAsync(`${this.dagsterExecutable} --version`);
      return stdout.includes('dagster');
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Dagster daemon is running
   */
  async isDaemonRunning() {
    try {
      if (!this.daemonProcess) {
        // Check for existing daemon process
        const { stdout } = await execAsync('ps aux | grep "dagster-daemon" | grep -v grep');
        return stdout.length > 0;
      }
      return this.daemonProcess && !this.daemonProcess.killed;
    } catch (error) {
      return false;
    }
  }

  /**
   * Check if Dagster web UI is running
   */
  async isWebUIRunning() {
    try {
      if (!this.webUIProcess) {
        // Check if port is in use
        const { stdout } = await execAsync(`lsof -i :${this.webUIPort}`);
        return stdout.includes(`${this.webUIPort}`);
      }
      return this.webUIProcess && !this.webUIProcess.killed;
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate Dagster project setup
   */
  async validateProject() {
    // Check if project directory exists
    if (!fs.existsSync(this.projectPath)) {
      throw new Error(`Dagster project path does not exist: ${this.projectPath}`);
    }

    // Check for required files
    const requiredFiles = [
      'dagster.yaml',
      'workspace.yaml',
      'assets/ingestion_assets.py',
      'assets/analytics_assets.py'
    ];

    for (const file of requiredFiles) {
      const filePath = path.join(this.projectPath, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Required Dagster file missing: ${file}`);
      }
    }

    // Validate workspace configuration
    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${this.dagsterExecutable} workspace validate`,
        { timeout: 30000 }
      );
      
      if (stderr && stderr.includes('error')) {
        throw new Error(`Workspace validation failed: ${stderr}`);
      }
      
      console.log('✅ Dagster workspace validation passed');
      return true;
    } catch (error) {
      throw new Error(`Workspace validation failed: ${error.message}`);
    }
  }

  /**
   * Start Dagster daemon
   */
  async startDaemon() {
    try {
      if (await this.isDaemonRunning()) {
        return { success: true, message: 'Daemon already running', pid: this.getDaemonPid() };
      }

      console.log('🚀 Starting Dagster daemon...');
      
      const daemonArgs = [
        'daemon', 'run',
        '--workspace-file', path.join(this.projectPath, 'workspace.yaml'),
        '--dagster-home', this.projectPath
      ];

      this.daemonProcess = spawn(this.dagsterExecutable, daemonArgs, {
        cwd: this.projectPath,
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          DAGSTER_HOME: this.projectPath,
          PYTHONPATH: `${process.env.PYTHONPATH || ''}:${path.dirname(this.projectPath)}`
        }
      });

      // Handle process events
      this.daemonProcess.stdout.on('data', (data) => {
        console.log(`[Dagster Daemon] ${data.toString()}`);
      });

      this.daemonProcess.stderr.on('data', (data) => {
        console.error(`[Dagster Daemon Error] ${data.toString()}`);
      });

      this.daemonProcess.on('close', (code) => {
        console.log(`Dagster daemon exited with code ${code}`);
        this.daemonProcess = null;
      });

      this.daemonProcess.on('error', (error) => {
        console.error('Dagster daemon process error:', error);
        this.daemonProcess = null;
      });

      // Give the daemon time to start
      await this.waitForDaemon(30000);

      return {
        success: true,
        message: 'Daemon started successfully',
        pid: this.daemonProcess.pid,
        port: this.daemonPort
      };
      
    } catch (error) {
      throw new Error(`Failed to start Dagster daemon: ${error.message}`);
    }
  }

  /**
   * Start Dagster web UI
   */
  async startWebUI() {
    try {
      if (await this.isWebUIRunning()) {
        return { success: true, message: 'Web UI already running', pid: this.getWebUIPid() };
      }

      console.log(`🚀 Starting Dagster web UI on port ${this.webUIPort}...`);
      
      const webUIArgs = [
        'dev',
        '--workspace-file', path.join(this.projectPath, 'workspace.yaml'),
        '--port', this.webUIPort.toString(),
        '--host', '0.0.0.0'
      ];

      this.webUIProcess = spawn(this.dagsterExecutable, webUIArgs, {
        cwd: this.projectPath,
        detached: false,
        stdio: ['pipe', 'pipe', 'pipe'],
        env: {
          ...process.env,
          DAGSTER_HOME: this.projectPath,
          PYTHONPATH: `${process.env.PYTHONPATH || ''}:${path.dirname(this.projectPath)}`
        }
      });

      // Handle process events
      this.webUIProcess.stdout.on('data', (data) => {
        console.log(`[Dagster Web UI] ${data.toString()}`);
      });

      this.webUIProcess.stderr.on('data', (data) => {
        console.error(`[Dagster Web UI Error] ${data.toString()}`);
      });

      this.webUIProcess.on('close', (code) => {
        console.log(`Dagster web UI exited with code ${code}`);
        this.webUIProcess = null;
      });

      this.webUIProcess.on('error', (error) => {
        console.error('Dagster web UI process error:', error);
        this.webUIProcess = null;
      });

      // Give the web UI time to start
      await this.waitForWebUI(30000);

      return {
        success: true,
        message: 'Web UI started successfully',
        pid: this.webUIProcess.pid,
        port: this.webUIPort,
        url: `http://localhost:${this.webUIPort}`
      };
      
    } catch (error) {
      throw new Error(`Failed to start Dagster web UI: ${error.message}`);
    }
  }

  /**
   * Stop Dagster daemon
   */
  async stopDaemon() {
    try {
      if (this.daemonProcess) {
        this.daemonProcess.kill('SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (this.daemonProcess) {
              this.daemonProcess.kill('SIGKILL');
            }
            resolve();
          }, 10000);
          
          this.daemonProcess.on('close', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        
        this.daemonProcess = null;
      }

      return { success: true, message: 'Daemon stopped successfully' };
    } catch (error) {
      throw new Error(`Failed to stop Dagster daemon: ${error.message}`);
    }
  }

  /**
   * Stop Dagster web UI
   */
  async stopWebUI() {
    try {
      if (this.webUIProcess) {
        this.webUIProcess.kill('SIGTERM');
        
        // Wait for graceful shutdown
        await new Promise((resolve) => {
          const timeout = setTimeout(() => {
            if (this.webUIProcess) {
              this.webUIProcess.kill('SIGKILL');
            }
            resolve();
          }, 10000);
          
          this.webUIProcess.on('close', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
        
        this.webUIProcess = null;
      }

      return { success: true, message: 'Web UI stopped successfully' };
    } catch (error) {
      throw new Error(`Failed to stop Dagster web UI: ${error.message}`);
    }
  }

  /**
   * Stop all Dagster services
   */
  async stopServices() {
    const results = [];
    
    try {
      const daemonResult = await this.stopDaemon();
      results.push({ service: 'daemon', ...daemonResult });
    } catch (error) {
      results.push({ service: 'daemon', success: false, error: error.message });
    }

    try {
      const webUIResult = await this.stopWebUI();
      results.push({ service: 'webUI', ...webUIResult });
    } catch (error) {
      results.push({ service: 'webUI', success: false, error: error.message });
    }

    return results;
  }

  /**
   * Materialize a specific asset
   */
  async materializeAsset(assetKey, config = {}, tags = {}) {
    try {
      const command = [
        'asset', 'materialize',
        '--workspace-file', path.join(this.projectPath, 'workspace.yaml'),
        assetKey
      ];

      if (Object.keys(config).length > 0) {
        command.push('--config', JSON.stringify(config));
      }

      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${this.dagsterExecutable} ${command.join(' ')}`,
        { timeout: 300000 }
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(`Asset materialization failed: ${stderr}`);
      }

      // Parse the output to extract run information
      const runIdMatch = stdout.match(/Run ID: ([a-f0-9-]+)/);
      const runId = runIdMatch ? runIdMatch[1] : null;

      return {
        success: true,
        run_id: runId,
        asset_key: assetKey,
        message: 'Asset materialization launched successfully',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Failed to materialize asset: ${error.message}`);
    }
  }

  /**
   * Launch a pipeline run
   */
  async launchRun(options = {}) {
    try {
      const {
        jobName,
        assetSelection = [],
        config = {},
        tags = {},
        runConfig = {}
      } = options;

      const command = [
        'run', 'launch',
        '--workspace-file', path.join(this.projectPath, 'workspace.yaml')
      ];

      if (jobName) {
        command.push('--job', jobName);
      }

      if (assetSelection.length > 0) {
        command.push('--asset-selection', assetSelection.join(','));
      }

      if (Object.keys(runConfig).length > 0) {
        command.push('--config', JSON.stringify(runConfig));
      }

      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${this.dagsterExecutable} ${command.join(' ')}`,
        { timeout: 300000 }
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(`Run launch failed: ${stderr}`);
      }

      const runIdMatch = stdout.match(/Run ID: ([a-f0-9-]+)/);
      const runId = runIdMatch ? runIdMatch[1] : null;

      return {
        success: true,
        run_id: runId,
        job_name: jobName,
        asset_selection: assetSelection,
        message: 'Run launched successfully',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Failed to launch run: ${error.message}`);
    }
  }

  /**
   * List pipeline runs
   */
  async listRuns(options = {}) {
    try {
      const { limit = 50, offset = 0 } = options;

      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${this.dagsterExecutable} run list --limit ${limit}`,
        { timeout: 60000 }
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(`Failed to list runs: ${stderr}`);
      }

      // Parse the tabular output (simplified parsing)
      const lines = stdout.split('\n').filter(line => line.trim());
      const runs = [];

      for (let i = 1; i < lines.length; i++) { // Skip header
        const line = lines[i];
        const parts = line.split(/\s+/);
        
        if (parts.length >= 4) {
          runs.push({
            run_id: parts[0],
            status: parts[1],
            job_name: parts[2],
            created_at: parts.slice(3).join(' ')
          });
        }
      }

      return {
        runs: runs.slice(offset, offset + limit),
        total: runs.length,
        limit,
        offset
      };
      
    } catch (error) {
      // Return empty list if command fails
      return { runs: [], total: 0, limit, offset };
    }
  }

  /**
   * Get run details
   */
  async getRunDetails(runId) {
    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${this.dagsterExecutable} run show ${runId}`,
        { timeout: 60000 }
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(`Failed to get run details: ${stderr}`);
      }

      // Parse run details (simplified)
      return {
        run_id: runId,
        status: 'UNKNOWN',
        details: stdout,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Failed to get run details: ${error.message}`);
    }
  }

  /**
   * Cancel a pipeline run
   */
  async cancelRun(runId) {
    try {
      const { stdout, stderr } = await execAsync(
        `cd "${this.projectPath}" && ${this.dagsterExecutable} run cancel ${runId}`,
        { timeout: 60000 }
      );

      if (stderr && stderr.includes('error')) {
        throw new Error(`Failed to cancel run: ${stderr}`);
      }

      return {
        success: true,
        run_id: runId,
        message: 'Run cancelled successfully',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      throw new Error(`Failed to cancel run: ${error.message}`);
    }
  }

  /**
   * Get daemon process ID
   */
  getDaemonPid() {
    return this.daemonProcess ? this.daemonProcess.pid : null;
  }

  /**
   * Get web UI process ID
   */
  getWebUIPid() {
    return this.webUIProcess ? this.webUIProcess.pid : null;
  }

  /**
   * Wait for daemon to be ready
   */
  async waitForDaemon(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        if (await this.isDaemonRunning()) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Continue waiting
      }
    }
    
    throw new Error('Timeout waiting for Dagster daemon to start');
  }

  /**
   * Wait for web UI to be ready
   */
  async waitForWebUI(timeout = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeout) {
      try {
        if (await this.isWebUIRunning()) {
          return true;
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        // Continue waiting
      }
    }
    
    throw new Error('Timeout waiting for Dagster web UI to start');
  }
}

module.exports = DagsterWrapper;