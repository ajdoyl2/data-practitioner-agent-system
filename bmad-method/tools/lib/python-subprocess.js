/**
 * Python Subprocess Manager
 * Manages Python process execution with JSON communication
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs-extra');
const { securityLogger } = require('./security-logger');

class PythonSubprocessManager {
  constructor(options = {}) {
    this.pythonExecutable = options.pythonExecutable || this.detectPythonExecutable();
    this.venvPath = options.venvPath || path.join(process.cwd(), '.venv');
    this.timeout = options.timeout || 30000; // 30 seconds default
    this.maxMemory = options.maxMemory || 512 * 1024 * 1024; // 512MB default
  }

  /**
   * Detect the appropriate Python executable
   */
  detectPythonExecutable() {
    const candidates = ['python3', 'python', 'py'];
    
    // Check if we're in a virtual environment
    const venvPython = this.getVenvPython();
    if (venvPython && fs.existsSync(venvPython)) {
      return venvPython;
    }

    // Fall back to system Python
    return candidates[0];
  }

  /**
   * Get the Python executable path in virtual environment
   */
  getVenvPython() {
    if (!this.venvPath) return null;
    
    const isWindows = os.platform() === 'win32';
    const pythonPath = isWindows
      ? path.join(this.venvPath, 'Scripts', 'python.exe')
      : path.join(this.venvPath, 'bin', 'python');
    
    return pythonPath;
  }

  /**
   * Execute a Python script with arguments
   * @param {string} scriptPath - Path to Python script
   * @param {Array} args - Script arguments
   * @param {Object} options - Execution options
   * @returns {Promise} Promise resolving to execution result
   */
  async execute(scriptPath, args = [], options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      try {
        // Validate script exists
        if (!fs.existsSync(scriptPath)) {
          throw new Error(`Python script not found: ${scriptPath}`);
        }

        // Prepare command
        const command = [scriptPath, ...args];
        const execOptions = {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: options.timeout || this.timeout,
          maxBuffer: options.maxBuffer || 10 * 1024 * 1024, // 10MB
          ...options.execOptions
        };

        // Log execution attempt
        securityLogger.logPythonExecution({
          script: path.basename(scriptPath),
          args: args.length,
          timeout: execOptions.timeout,
          timestamp: new Date().toISOString()
        });

        // Spawn Python process
        const child = spawn(this.pythonExecutable, command, execOptions);
        
        let stdout = '';
        let stderr = '';
        let killed = false;

        // Handle stdout
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        // Handle stderr
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle process exit
        child.on('exit', (code, signal) => {
          const duration = Date.now() - startTime;
          
          if (killed) {
            return; // Already handled by timeout
          }

          if (code === 0) {
            try {
              // Try to parse JSON output
              let result = stdout;
              if (options.parseJson && stdout.trim()) {
                result = JSON.parse(stdout);
              }
              
              securityLogger.logPythonExecution({
                script: path.basename(scriptPath),
                status: 'success',
                duration,
                timestamp: new Date().toISOString()
              });
              
              resolve({
                success: true,
                data: result,
                stderr: stderr || null,
                duration,
                code
              });
            } catch (parseError) {
              reject(new Error(`Failed to parse Python output as JSON: ${parseError.message}`));
            }
          } else {
            securityLogger.logPythonExecution({
              script: path.basename(scriptPath),
              status: 'error',
              code,
              signal,
              error: stderr,
              duration,
              timestamp: new Date().toISOString()
            });
            
            reject(new Error(
              `Python script failed with code ${code}${signal ? ` (${signal})` : ''}: ${stderr}`
            ));
          }
        });

        // Handle process errors
        child.on('error', (error) => {
          const duration = Date.now() - startTime;
          
          securityLogger.logPythonExecution({
            script: path.basename(scriptPath),
            status: 'spawn_error',
            error: error.message,
            duration,
            timestamp: new Date().toISOString()
          });
          
          reject(new Error(`Failed to spawn Python process: ${error.message}`));
        });

        // Set up timeout
        if (execOptions.timeout > 0) {
          setTimeout(() => {
            if (!killed && !child.killed) {
              killed = true;
              child.kill('SIGTERM');
              
              // Force kill after 5 seconds
              setTimeout(() => {
                if (!child.killed) {
                  child.kill('SIGKILL');
                }
              }, 5000);
              
              reject(new Error(`Python script timed out after ${execOptions.timeout}ms`));
            }
          }, execOptions.timeout);
        }

        // Send input data if provided
        if (options.input) {
          child.stdin.write(JSON.stringify(options.input));
          child.stdin.end();
        }

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Execute Python code directly (for simple operations)
   * @param {string} code - Python code to execute
   * @param {Object} options - Execution options
   * @returns {Promise} Promise resolving to execution result
   */
  async executeCode(code, options = {}) {
    return new Promise((resolve, reject) => {
      const tempScript = path.join(os.tmpdir(), `bmad-temp-${Date.now()}.py`);
      
      try {
        // Write temporary Python file
        fs.writeFileSync(tempScript, code);
        
        // Execute the temporary script
        this.execute(tempScript, [], options)
          .then(result => {
            // Clean up temporary file
            fs.unlink(tempScript).catch(() => {}); // Ignore cleanup errors
            resolve(result);
          })
          .catch(error => {
            // Clean up temporary file
            fs.unlink(tempScript).catch(() => {}); // Ignore cleanup errors
            reject(error);
          });
          
      } catch (error) {
        // Clean up temporary file if it was created
        if (fs.existsSync(tempScript)) {
          fs.unlink(tempScript).catch(() => {});
        }
        reject(error);
      }
    });
  }

  /**
   * Check if Python and required packages are available
   * @returns {Promise} Promise resolving to availability status
   */
  async checkAvailability() {
    try {
      const result = await this.executeCode(`
import sys
import json

def check_package(package_name):
    try:
        __import__(package_name)
        return True
    except ImportError:
        return False

info = {
    "python_version": sys.version,
    "executable": sys.executable,
    "packages": {
        "pyairbyte": check_package("airbyte"),
        "pandas": check_package("pandas"),
        "numpy": check_package("numpy"),
        "sqlalchemy": check_package("sqlalchemy"),
        "yaml": check_package("yaml")
    }
}

print(json.dumps(info, indent=2))
`, { parseJson: true, timeout: 10000 });

      return {
        available: true,
        ...result.data
      };
    } catch (error) {
      return {
        available: false,
        error: error.message
      };
    }
  }

  /**
   * Install Python packages using pip
   * @param {Array} packages - Packages to install
   * @param {Object} options - Installation options
   * @returns {Promise} Promise resolving to installation result
   */
  async installPackages(packages, options = {}) {
    const args = [
      '-m', 'pip', 'install',
      ...(options.upgrade ? ['--upgrade'] : []),
      ...(options.userInstall ? ['--user'] : []),
      ...packages
    ];

    securityLogger.logPythonPackageInstall({
      packages,
      options,
      timestamp: new Date().toISOString()
    });

    return this._executeCommand(args, {
      timeout: options.timeout || 120000, // 2 minutes for package installation
      ...options
    });
  }

  /**
   * Execute Python command with arguments (not a script)
   * @param {Array} args - Command arguments 
   * @param {Object} options - Execution options
   * @returns {Promise} Promise resolving to execution result
   */
  async _executeCommand(args, options = {}) {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      try {
        const execOptions = {
          stdio: ['pipe', 'pipe', 'pipe'],
          timeout: options.timeout || this.timeout,
          maxBuffer: options.maxBuffer || 10 * 1024 * 1024, // 10MB
          ...options.execOptions
        };

        // Spawn Python process with command arguments
        const child = spawn(this.pythonExecutable, args, execOptions);
        
        let stdout = '';
        let stderr = '';
        let killed = false;

        // Handle stdout
        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        // Handle stderr  
        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        // Handle process exit
        child.on('exit', (code, signal) => {
          const duration = Date.now() - startTime;
          
          if (killed) {
            return; // Already handled by timeout
          }

          if (code === 0) {
            resolve({
              success: true,
              stdout,
              stderr: stderr || null,
              duration,
              code
            });
          } else {
            reject(new Error(
              `Python command failed with code ${code}${signal ? ` (${signal})` : ''}: ${stderr || stdout}`
            ));
          }
        });

        // Handle process errors
        child.on('error', (error) => {
          reject(new Error(`Failed to spawn Python process: ${error.message}`));
        });

        // Set up timeout
        if (execOptions.timeout > 0) {
          setTimeout(() => {
            if (!killed && !child.killed) {
              killed = true;
              child.kill('SIGTERM');
              
              // Force kill after 5 seconds
              setTimeout(() => {
                if (!child.killed) {
                  child.kill('SIGKILL');
                }
              }, 5000);
              
              reject(new Error(`Python command timed out after ${execOptions.timeout}ms`));
            }
          }, execOptions.timeout);
        }

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Create virtual environment
   * @param {string} venvPath - Path for virtual environment
   * @returns {Promise} Promise resolving to creation result
   */
  async createVirtualEnvironment(venvPath = this.venvPath) {
    const args = ['-m', 'venv', venvPath];
    
    securityLogger.logPythonVenvCreation({
      path: venvPath,
      timestamp: new Date().toISOString()
    });

    return this._executeCommand(args, {
      timeout: 60000 // 1 minute
    });
  }
}

module.exports = PythonSubprocessManager;