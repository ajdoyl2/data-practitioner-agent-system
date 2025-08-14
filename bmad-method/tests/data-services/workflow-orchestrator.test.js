/**
 * Workflow Orchestrator Integration Tests
 * Tests for the Dagster workflow orchestration service
 */

const request = require('supertest');
const WorkflowOrchestrator = require('../../tools/data-services/workflow-orchestrator');
const { generateTestApiKey } = require('../helpers/test-auth-helper');
const { cleanupTestServices } = require('../helpers/test-cleanup-helper');

describe('WorkflowOrchestrator Integration Tests', () => {
  let orchestrator;
  let apiKey;
  let server;

  beforeAll(async () => {
    // Generate test API key
    apiKey = await generateTestApiKey('orchestration_manage');
    
    // Create orchestrator instance with test configuration
    orchestrator = new WorkflowOrchestrator({
      port: 0, // Use random available port
      dagsterProjectPath: './test-fixtures/dagster-project',
      dagsterWebPort: 0, // Use random available port for web UI
      dagsterDaemonPort: 0 // Use random available port for daemon
    });

    // Mock Dagster wrapper for testing
    orchestrator.dagsterWrapper = {
      isAvailable: jest.fn().mockResolvedValue(true),
      isDaemonRunning: jest.fn().mockResolvedValue(false),
      isWebUIRunning: jest.fn().mockResolvedValue(false),
      validateProject: jest.fn().mockResolvedValue(true),
      startDaemon: jest.fn().mockResolvedValue({ 
        success: true, 
        message: 'Daemon started', 
        pid: 12345 
      }),
      startWebUI: jest.fn().mockResolvedValue({ 
        success: true, 
        message: 'Web UI started', 
        pid: 12346,
        url: 'http://localhost:3001'
      }),
      stopDaemon: jest.fn().mockResolvedValue({ success: true }),
      stopWebUI: jest.fn().mockResolvedValue({ success: true }),
      getDaemonPid: jest.fn().mockReturnValue(12345),
      getWebUIPid: jest.fn().mockReturnValue(12346),
      materializeAsset: jest.fn().mockResolvedValue({
        success: true,
        run_id: 'test-run-123',
        asset_key: 'test_asset'
      }),
      launchRun: jest.fn().mockResolvedValue({
        success: true,
        run_id: 'test-run-456'
      }),
      listRuns: jest.fn().mockResolvedValue({
        runs: [
          { run_id: 'test-run-1', status: 'SUCCESS' },
          { run_id: 'test-run-2', status: 'RUNNING' }
        ],
        total: 2
      }),
      getRunDetails: jest.fn().mockResolvedValue({
        run_id: 'test-run-123',
        status: 'SUCCESS'
      }),
      cancelRun: jest.fn().mockResolvedValue({ success: true })
    };

    // Mock asset manager
    orchestrator.assetManager = {
      initialize: jest.fn().mockResolvedValue(true),
      listAssets: jest.fn().mockResolvedValue({
        total: 5,
        by_group: {
          ingestion: [{ name: 'test_ingestion_asset' }],
          analytics: [{ name: 'test_analytics_asset' }]
        }
      }),
      getAssetDetails: jest.fn().mockResolvedValue({
        name: 'test_asset',
        description: 'Test asset',
        group_name: 'test'
      }),
      getAssetLineage: jest.fn().mockResolvedValue({
        asset_key: 'test_asset',
        upstream: [],
        downstream: []
      })
    };

    // Mock pipeline monitor
    orchestrator.pipelineMonitor = {
      getPipelineStatus: jest.fn().mockResolvedValue({
        monitoring_active: true,
        metrics: { pipeline_runs: { total: 10, successful: 8 } }
      }),
      getPerformanceMetrics: jest.fn().mockResolvedValue({
        pipeline_performance: { avg_execution_time: 120000 }
      }),
      getAlerts: jest.fn().mockResolvedValue([])
    };

    await orchestrator.start();
    server = orchestrator.server;
  }, 30000);

  afterAll(async () => {
    if (orchestrator) {
      await orchestrator.stop();
    }
    await cleanupTestServices();
  });

  describe('Health Check', () => {
    test('should return healthy status', async () => {
      const response = await request(server)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        service: 'workflow-orchestrator',
        features: {
          dagster_orchestration: expect.any(Boolean)
        },
        dagster: {
          available: true,
          daemon_running: false,
          webui_running: false
        }
      });
    });
  });

  describe('Service Management', () => {
    test('should start Dagster services', async () => {
      const response = await request(server)
        .post('/api/v1/orchestration/services/start')
        .set('X-API-Key', apiKey)
        .send({ daemon: true, webUI: true })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Dagster services started successfully',
        results: expect.arrayContaining([
          expect.objectContaining({ service: 'daemon', success: true }),
          expect.objectContaining({ service: 'webUI', success: true })
        ])
      });

      expect(orchestrator.dagsterWrapper.startDaemon).toHaveBeenCalled();
      expect(orchestrator.dagsterWrapper.startWebUI).toHaveBeenCalled();
    });

    test('should get services status', async () => {
      const response = await request(server)
        .get('/api/v1/orchestration/services/status')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          daemon: expect.objectContaining({
            running: expect.any(Boolean),
            port: expect.any(Number)
          }),
          webUI: expect.objectContaining({
            running: expect.any(Boolean),
            port: expect.any(Number),
            url: expect.any(String)
          }),
          orchestrator: expect.objectContaining({
            running: expect.any(Boolean),
            uptime: expect.any(Number)
          })
        }
      });
    });

    test('should stop Dagster services', async () => {
      const response = await request(server)
        .post('/api/v1/orchestration/services/stop')
        .set('X-API-Key', apiKey)
        .send({ daemon: true, webUI: true })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        message: 'Dagster services stopped successfully'
      });

      expect(orchestrator.dagsterWrapper.stopDaemon).toHaveBeenCalled();
      expect(orchestrator.dagsterWrapper.stopWebUI).toHaveBeenCalled();
    });
  });

  describe('Asset Management', () => {
    test('should list all assets', async () => {
      const response = await request(server)
        .get('/api/v1/orchestration/assets')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          assets: expect.objectContaining({
            total: expect.any(Number),
            by_group: expect.any(Object)
          })
        }
      });

      expect(orchestrator.assetManager.listAssets).toHaveBeenCalled();
    });

    test('should get asset details', async () => {
      const assetKey = 'test_asset';
      
      const response = await request(server)
        .get(`/api/v1/orchestration/assets/${assetKey}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          name: assetKey,
          description: expect.any(String)
        })
      });

      expect(orchestrator.assetManager.getAssetDetails).toHaveBeenCalledWith(assetKey);
    });

    test('should materialize asset', async () => {
      const assetKey = 'test_asset';
      const config = { test: 'config' };
      const tags = { environment: 'test' };
      
      const response = await request(server)
        .post(`/api/v1/orchestration/assets/${assetKey}/materialize`)
        .set('X-API-Key', apiKey)
        .send({ config, tags })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          success: true,
          run_id: expect.any(String),
          asset_key: assetKey
        })
      });

      expect(orchestrator.dagsterWrapper.materializeAsset).toHaveBeenCalledWith(assetKey, config, tags);
    });

    test('should get asset lineage', async () => {
      const assetKey = 'test_asset';
      
      const response = await request(server)
        .get(`/api/v1/orchestration/assets/${assetKey}/lineage`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          asset_key: assetKey,
          upstream: expect.any(Array),
          downstream: expect.any(Array)
        })
      });

      expect(orchestrator.assetManager.getAssetLineage).toHaveBeenCalledWith(assetKey);
    });
  });

  describe('Pipeline Execution', () => {
    test('should launch pipeline run', async () => {
      const runConfig = {
        job_name: 'test_job',
        asset_selection: ['asset1', 'asset2'],
        config: { test: 'config' },
        tags: { environment: 'test' }
      };
      
      const response = await request(server)
        .post('/api/v1/orchestration/runs/launch')
        .set('X-API-Key', apiKey)
        .send(runConfig)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          success: true,
          run_id: expect.any(String)
        })
      });

      expect(orchestrator.dagsterWrapper.launchRun).toHaveBeenCalledWith({
        jobName: runConfig.job_name,
        assetSelection: runConfig.asset_selection,
        config: runConfig.config,
        tags: runConfig.tags,
        runConfig: {}
      });
    });

    test('should list pipeline runs', async () => {
      const response = await request(server)
        .get('/api/v1/orchestration/runs')
        .set('X-API-Key', apiKey)
        .query({ limit: 10, offset: 0 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          runs: expect.any(Array),
          total: expect.any(Number)
        })
      });

      expect(orchestrator.dagsterWrapper.listRuns).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        statusFilter: undefined,
        jobNameFilter: undefined
      });
    });

    test('should get run details', async () => {
      const runId = 'test-run-123';
      
      const response = await request(server)
        .get(`/api/v1/orchestration/runs/${runId}`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          run_id: runId,
          status: expect.any(String)
        })
      });

      expect(orchestrator.dagsterWrapper.getRunDetails).toHaveBeenCalledWith(runId);
    });

    test('should cancel pipeline run', async () => {
      const runId = 'test-run-123';
      
      const response = await request(server)
        .post(`/api/v1/orchestration/runs/${runId}/cancel`)
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          success: true
        })
      });

      expect(orchestrator.dagsterWrapper.cancelRun).toHaveBeenCalledWith(runId);
    });
  });

  describe('Monitoring', () => {
    test('should get pipeline status', async () => {
      const response = await request(server)
        .get('/api/v1/orchestration/monitoring/pipeline-status')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          monitoring_active: expect.any(Boolean),
          metrics: expect.any(Object)
        })
      });

      expect(orchestrator.pipelineMonitor.getPipelineStatus).toHaveBeenCalled();
    });

    test('should get performance metrics', async () => {
      const response = await request(server)
        .get('/api/v1/orchestration/monitoring/performance')
        .set('X-API-Key', apiKey)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          pipeline_performance: expect.any(Object)
        })
      });

      expect(orchestrator.pipelineMonitor.getPerformanceMetrics).toHaveBeenCalled();
    });

    test('should get alerts', async () => {
      const response = await request(server)
        .get('/api/v1/orchestration/monitoring/alerts')
        .set('X-API-Key', apiKey)
        .query({ severity: 'warning', limit: 50 })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: expect.objectContaining({
          alerts: expect.any(Array)
        })
      });

      expect(orchestrator.pipelineMonitor.getAlerts).toHaveBeenCalledWith({
        severity: 'warning',
        limit: 50
      });
    });
  });

  describe('Authentication and Authorization', () => {
    test('should reject requests without API key', async () => {
      await request(server)
        .get('/api/v1/orchestration/assets')
        .expect(401);
    });

    test('should reject requests with invalid API key', async () => {
      await request(server)
        .get('/api/v1/orchestration/assets')
        .set('X-API-Key', 'invalid-key')
        .expect(401);
    });
  });

  describe('Error Handling', () => {
    test('should handle service start failures gracefully', async () => {
      // Mock service start failure
      orchestrator.dagsterWrapper.startDaemon.mockRejectedValueOnce(new Error('Daemon start failed'));
      
      const response = await request(server)
        .post('/api/v1/orchestration/services/start')
        .set('X-API-Key', apiKey)
        .send({ daemon: true, webUI: false })
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Failed to start Dagster services',
        details: expect.any(String)
      });
    });

    test('should handle asset materialization failures', async () => {
      const assetKey = 'failing_asset';
      orchestrator.dagsterWrapper.materializeAsset.mockRejectedValueOnce(new Error('Materialization failed'));
      
      const response = await request(server)
        .post(`/api/v1/orchestration/assets/${assetKey}/materialize`)
        .set('X-API-Key', apiKey)
        .send({})
        .expect(500);

      expect(response.body).toMatchObject({
        error: 'Failed to materialize asset',
        details: expect.any(String)
      });
    });
  });

  describe('Integration with Data Services', () => {
    test('should handle asset materialization with dependency on data ingestion service', async () => {
      // This test would verify that the orchestrator properly coordinates
      // with the data ingestion and analytics services
      const assetKey = 'analytics_asset';
      
      const response = await request(server)
        .post(`/api/v1/orchestration/assets/${assetKey}/materialize`)
        .set('X-API-Key', apiKey)
        .send({
          config: {
            upstream_service_check: true,
            data_quality_validation: true
          }
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});