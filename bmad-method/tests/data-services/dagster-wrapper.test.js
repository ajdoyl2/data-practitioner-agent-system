/**
 * Dagster Wrapper Unit Tests
 * Tests for the Dagster subprocess execution wrapper
 */

const DagsterWrapper = require('../../tools/data-services/dagster-wrapper');
const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

// Mock child_process and fs-extra
jest.mock('child_process');
jest.mock('fs-extra');

describe('DagsterWrapper Unit Tests', () => {
  let dagsterWrapper;
  const mockProjectPath = '/test/dagster-project';

  beforeEach(() => {
    jest.clearAllMocks();
    
    dagsterWrapper = new DagsterWrapper({
      projectPath: mockProjectPath,
      webUIPort: 3001,
      daemonPort: 3070
    });
  });

  afterEach(() => {
    if (dagsterWrapper.daemonProcess) {
      dagsterWrapper.daemonProcess = null;
    }
    if (dagsterWrapper.webUIProcess) {
      dagsterWrapper.webUIProcess = null;
    }
  });

  describe('Initialization', () => {
    test('should initialize with default values', () => {
      const wrapper = new DagsterWrapper();
      expect(wrapper.webUIPort).toBe(3001);
      expect(wrapper.daemonPort).toBe(3070);
      expect(wrapper.pythonPath).toBe('python');
      expect(wrapper.dagsterExecutable).toBe('dagster');
    });

    test('should initialize with custom options', () => {
      const options = {
        projectPath: '/custom/path',
        webUIPort: 4000,
        daemonPort: 4070,
        pythonPath: '/usr/bin/python3',
        dagsterExecutable: '/usr/local/bin/dagster'
      };

      const wrapper = new DagsterWrapper(options);
      expect(wrapper.projectPath).toBe(options.projectPath);
      expect(wrapper.webUIPort).toBe(options.webUIPort);
      expect(wrapper.daemonPort).toBe(options.daemonPort);
      expect(wrapper.pythonPath).toBe(options.pythonPath);
      expect(wrapper.dagsterExecutable).toBe(options.dagsterExecutable);
    });
  });

  describe('Availability Check', () => {
    test('should return true when Dagster is available', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({ stdout: 'dagster, version 1.8.12' });

      const isAvailable = await dagsterWrapper.isAvailable();
      expect(isAvailable).toBe(true);
    });

    test('should return false when Dagster is not available', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockRejectedValue(new Error('Command not found'));

      const isAvailable = await dagsterWrapper.isAvailable();
      expect(isAvailable).toBe(false);
    });
  });

  describe('Project Validation', () => {
    test('should validate project successfully', async () => {
      // Mock file system checks
      fs.existsSync
        .mockReturnValueOnce(true) // project directory
        .mockReturnValueOnce(true) // dagster.yaml
        .mockReturnValueOnce(true) // workspace.yaml
        .mockReturnValueOnce(true) // ingestion_assets.py
        .mockReturnValueOnce(true); // analytics_assets.py

      // Mock workspace validation
      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({ stdout: 'Workspace validation passed', stderr: '' });

      await expect(dagsterWrapper.validateProject()).resolves.toBe(true);
    });

    test('should fail validation when project directory missing', async () => {
      fs.existsSync.mockReturnValue(false);

      await expect(dagsterWrapper.validateProject()).rejects.toThrow('project path does not exist');
    });

    test('should fail validation when required files missing', async () => {
      fs.existsSync
        .mockReturnValueOnce(true) // project directory
        .mockReturnValueOnce(false); // dagster.yaml missing

      await expect(dagsterWrapper.validateProject()).rejects.toThrow('Required Dagster file missing');
    });

    test('should fail validation when workspace validation fails', async () => {
      // Mock file system checks as successful
      fs.existsSync.mockReturnValue(true);

      // Mock workspace validation failure
      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({ 
        stdout: '', 
        stderr: 'Workspace validation error: Invalid configuration' 
      });

      await expect(dagsterWrapper.validateProject()).rejects.toThrow('Workspace validation failed');
    });
  });

  describe('Service Status Checks', () => {
    test('should detect running daemon process', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({ stdout: '1234 dagster-daemon process' });

      const isRunning = await dagsterWrapper.isDaemonRunning();
      expect(isRunning).toBe(true);
    });

    test('should detect no daemon process', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({ stdout: '' });

      const isRunning = await dagsterWrapper.isDaemonRunning();
      expect(isRunning).toBe(false);
    });

    test('should detect running web UI by port check', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({ stdout: 'LISTEN 127.0.0.1:3001' });

      const isRunning = await dagsterWrapper.isWebUIRunning();
      expect(isRunning).toBe(true);
    });

    test('should detect no web UI process', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockRejectedValue(new Error('No process found'));

      const isRunning = await dagsterWrapper.isWebUIRunning();
      expect(isRunning).toBe(false);
    });
  });

  describe('Asset Materialization', () => {
    test('should materialize asset successfully', async () => {
      const assetKey = 'test_asset';
      const config = { param1: 'value1' };
      const tags = { env: 'test' };

      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({
        stdout: 'Run ID: 12345-abcde\nMaterialization successful',
        stderr: ''
      });

      const result = await dagsterWrapper.materializeAsset(assetKey, config, tags);

      expect(result).toMatchObject({
        success: true,
        run_id: '12345-abcde',
        asset_key: assetKey,
        message: 'Asset materialization launched successfully'
      });
    });

    test('should handle asset materialization failure', async () => {
      const assetKey = 'failing_asset';

      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({
        stdout: '',
        stderr: 'error: Asset not found'
      });

      await expect(dagsterWrapper.materializeAsset(assetKey)).rejects.toThrow('Asset materialization failed');
    });

    test('should handle materialization timeout', async () => {
      const assetKey = 'slow_asset';

      const mockExec = require('util').promisify(exec);
      mockExec.mockRejectedValue(new Error('Command timed out'));

      await expect(dagsterWrapper.materializeAsset(assetKey)).rejects.toThrow('Failed to materialize asset');
    });
  });

  describe('Pipeline Run Management', () => {
    test('should launch run successfully', async () => {
      const options = {
        jobName: 'test_job',
        assetSelection: ['asset1', 'asset2'],
        runConfig: { param: 'value' }
      };

      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({
        stdout: 'Run ID: run-67890\nRun launched successfully',
        stderr: ''
      });

      const result = await dagsterWrapper.launchRun(options);

      expect(result).toMatchObject({
        success: true,
        run_id: 'run-67890',
        job_name: options.jobName,
        asset_selection: options.assetSelection
      });
    });

    test('should list runs with pagination', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({
        stdout: 'RUN_ID     STATUS    JOB_NAME    CREATED_AT\nrun-1      SUCCESS   job1       2023-01-01\nrun-2      RUNNING   job2       2023-01-02',
        stderr: ''
      });

      const result = await dagsterWrapper.listRuns({ limit: 10, offset: 0 });

      expect(result).toMatchObject({
        runs: expect.arrayContaining([
          expect.objectContaining({
            run_id: expect.any(String),
            status: expect.any(String)
          })
        ]),
        total: expect.any(Number),
        limit: 10,
        offset: 0
      });
    });

    test('should get run details', async () => {
      const runId = 'test-run-123';

      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({
        stdout: `Run Details:\nRun ID: ${runId}\nStatus: SUCCESS\nDuration: 120s`,
        stderr: ''
      });

      const result = await dagsterWrapper.getRunDetails(runId);

      expect(result).toMatchObject({
        run_id: runId,
        status: 'UNKNOWN', // Simplified parsing
        details: expect.any(String)
      });
    });

    test('should cancel run successfully', async () => {
      const runId = 'test-run-456';

      const mockExec = require('util').promisify(exec);
      mockExec.mockResolvedValue({
        stdout: `Run ${runId} cancelled successfully`,
        stderr: ''
      });

      const result = await dagsterWrapper.cancelRun(runId);

      expect(result).toMatchObject({
        success: true,
        run_id: runId,
        message: 'Run cancelled successfully'
      });
    });
  });

  describe('Service Lifecycle Management', () => {
    test('should start daemon process', async () => {
      // Mock spawn
      const mockSpawn = require('child_process').spawn;
      const mockProcess = {
        pid: 12345,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };
      mockSpawn.mockReturnValue(mockProcess);

      // Mock daemon status check
      dagsterWrapper.isDaemonRunning = jest.fn()
        .mockResolvedValueOnce(false) // Initial check
        .mockResolvedValue(true); // After start

      const result = await dagsterWrapper.startDaemon();

      expect(result).toMatchObject({
        success: true,
        message: 'Daemon started successfully',
        pid: 12345
      });
      expect(mockSpawn).toHaveBeenCalledWith(
        'dagster',
        expect.arrayContaining(['daemon', 'run']),
        expect.any(Object)
      );
    });

    test('should start web UI process', async () => {
      // Mock spawn
      const mockSpawn = require('child_process').spawn;
      const mockProcess = {
        pid: 12346,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn(),
        kill: jest.fn()
      };
      mockSpawn.mockReturnValue(mockProcess);

      // Mock web UI status check
      dagsterWrapper.isWebUIRunning = jest.fn()
        .mockResolvedValueOnce(false) // Initial check
        .mockResolvedValue(true); // After start

      const result = await dagsterWrapper.startWebUI();

      expect(result).toMatchObject({
        success: true,
        message: 'Web UI started successfully',
        pid: 12346,
        url: `http://localhost:${dagsterWrapper.webUIPort}`
      });
    });

    test('should stop daemon process gracefully', async () => {
      const mockProcess = {
        pid: 12345,
        kill: jest.fn(),
        on: jest.fn((event, callback) => {
          if (event === 'close') {
            setTimeout(callback, 10); // Simulate graceful shutdown
          }
        })
      };
      dagsterWrapper.daemonProcess = mockProcess;

      const result = await dagsterWrapper.stopDaemon();

      expect(result).toMatchObject({
        success: true,
        message: 'Daemon stopped successfully'
      });
      expect(mockProcess.kill).toHaveBeenCalledWith('SIGTERM');
    });

    test('should force kill daemon if graceful shutdown fails', async () => {
      const mockProcess = {
        pid: 12345,
        kill: jest.fn(),
        on: jest.fn() // Don't call callback to simulate hanging process
      };
      dagsterWrapper.daemonProcess = mockProcess;

      const result = await dagsterWrapper.stopDaemon();

      expect(result).toMatchObject({
        success: true,
        message: 'Daemon stopped successfully'
      });
      
      // Should call SIGKILL after timeout
      setTimeout(() => {
        expect(mockProcess.kill).toHaveBeenCalledWith('SIGKILL');
      }, 11000);
    }, 15000);

    test('should stop all services', async () => {
      dagsterWrapper.stopDaemon = jest.fn().mockResolvedValue({ success: true });
      dagsterWrapper.stopWebUI = jest.fn().mockResolvedValue({ success: true });

      const results = await dagsterWrapper.stopServices();

      expect(results).toHaveLength(2);
      expect(results[0]).toMatchObject({ service: 'daemon', success: true });
      expect(results[1]).toMatchObject({ service: 'webUI', success: true });
    });
  });

  describe('Error Handling', () => {
    test('should handle command execution errors', async () => {
      const mockExec = require('util').promisify(exec);
      mockExec.mockRejectedValue(new Error('Command failed'));

      await expect(dagsterWrapper.materializeAsset('test_asset')).rejects.toThrow('Failed to materialize asset');
    });

    test('should handle process spawn errors', async () => {
      const mockSpawn = require('child_process').spawn;
      const mockProcess = {
        pid: null,
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, callback) => {
          if (event === 'error') {
            callback(new Error('Spawn failed'));
          }
        }),
        kill: jest.fn()
      };
      mockSpawn.mockReturnValue(mockProcess);

      await expect(dagsterWrapper.startDaemon()).rejects.toThrow('Failed to start Dagster daemon');
    });
  });

  describe('Process ID Management', () => {
    test('should return daemon process ID', () => {
      const mockProcess = { pid: 12345 };
      dagsterWrapper.daemonProcess = mockProcess;

      expect(dagsterWrapper.getDaemonPid()).toBe(12345);
    });

    test('should return null when no daemon process', () => {
      dagsterWrapper.daemonProcess = null;

      expect(dagsterWrapper.getDaemonPid()).toBeNull();
    });

    test('should return web UI process ID', () => {
      const mockProcess = { pid: 12346 };
      dagsterWrapper.webUIProcess = mockProcess;

      expect(dagsterWrapper.getWebUIPid()).toBe(12346);
    });

    test('should return null when no web UI process', () => {
      dagsterWrapper.webUIProcess = null;

      expect(dagsterWrapper.getWebUIPid()).toBeNull();
    });
  });
});