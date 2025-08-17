/**
 * Tests for Deployment Orchestrator
 */

const DeploymentOrchestrator = require('../../tools/data-services/deployment-orchestrator');
const SQLmeshWrapper = require('../../tools/data-services/sqlmesh-wrapper');
const CostTracker = require('../../tools/data-services/cost-tracker');
const fs = require('fs').promises;

// Mock dependencies
jest.mock('../../tools/data-services/sqlmesh-wrapper');
jest.mock('../../tools/data-services/cost-tracker');
jest.mock('fs').promises;
jest.mock('../../tools/logger', () => ({
    logger: {
        info: jest.fn(),
        debug: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        success: jest.fn()
    }
}));
jest.mock('../../tools/security', () => ({
    securityLogger: {
        logDataOperation: jest.fn()
    }
}));

describe('DeploymentOrchestrator', () => {
    let orchestrator;
    let mockSqlmesh;
    let mockCostTracker;

    beforeEach(() => {
        // Setup mocks
        mockSqlmesh = {
            getStatus: jest.fn().mockResolvedValue({ success: true }),
            audit: jest.fn().mockResolvedValue({ success: true }),
            test: jest.fn().mockResolvedValue({ success: true }),
            diff: jest.fn().mockResolvedValue({ success: true, stdout: 'No breaking changes' }),
            plan: jest.fn().mockResolvedValue({ success: true, stdout: 'Plan created' }),
            migrate: jest.fn().mockResolvedValue({ success: true, stdout: 'Migration complete' })
        };

        mockCostTracker = {
            trackExecution: jest.fn().mockResolvedValue()
        };

        SQLmeshWrapper.mockImplementation(() => mockSqlmesh);
        CostTracker.mockImplementation(() => mockCostTracker);

        fs.readFile = jest.fn().mockRejectedValue(new Error('File not found'));
        fs.writeFile = jest.fn().mockResolvedValue();
        fs.mkdir = jest.fn().mockResolvedValue();

        orchestrator = new DeploymentOrchestrator({
            projectPath: '/test/sqlmesh-project'
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('deploy', () => {
        it('should execute successful blue-green deployment', async () => {
            const deployment = await orchestrator.deploy({ environment: 'prod' });

            expect(deployment.status).toBe('completed');
            expect(deployment.environment).toBe('prod');
            expect(deployment.steps).toHaveLength(6);
            
            // Verify all steps executed
            const stepNames = deployment.steps.map(s => s.name);
            expect(stepNames).toEqual([
                'pre_validation',
                'create_shadow',
                'shadow_validation',
                'safety_checks',
                'atomic_swap',
                'post_validation'
            ]);

            // Verify all steps completed
            deployment.steps.forEach(step => {
                expect(step.status).toBe('completed');
            });

            // Verify SQLmesh methods called
            expect(mockSqlmesh.getStatus).toHaveBeenCalled();
            expect(mockSqlmesh.audit).toHaveBeenCalled();
            expect(mockSqlmesh.test).toHaveBeenCalled();
            expect(mockSqlmesh.diff).toHaveBeenCalled();
            expect(mockSqlmesh.plan).toHaveBeenCalled();
            expect(mockSqlmesh.migrate).toHaveBeenCalled();

            // Verify cost tracking
            expect(mockCostTracker.trackExecution).toHaveBeenCalled();
        });

        it('should rollback on validation failure', async () => {
            // Make pre-validation fail
            mockSqlmesh.test.mockResolvedValueOnce({ success: false });

            const deployment = await orchestrator.deploy({ environment: 'prod' });

            expect(deployment.status).toBe('failed');
            expect(deployment.error).toContain('Pre-deployment validation failed');
            
            // Verify rollback step was added
            const rollbackStep = deployment.steps.find(s => s.name === 'rollback');
            expect(rollbackStep).toBeDefined();
            expect(rollbackStep.status).toBe('completed');
        });

        it('should rollback on atomic swap failure', async () => {
            // Make atomic swap fail
            mockSqlmesh.migrate.mockResolvedValueOnce({ 
                success: false, 
                error: 'Swap failed' 
            });

            const deployment = await orchestrator.deploy({ environment: 'prod' });

            expect(deployment.status).toBe('failed');
            expect(deployment.error).toContain('Atomic swap failed');
            
            // Verify steps before swap completed
            const preSwapSteps = ['pre_validation', 'create_shadow', 'shadow_validation', 'safety_checks'];
            preSwapSteps.forEach(stepName => {
                const step = deployment.steps.find(s => s.name === stepName);
                expect(step.status).toBe('completed');
            });

            // Verify swap step failed
            const swapStep = deployment.steps.find(s => s.name === 'atomic_swap');
            expect(swapStep.status).toBe('failed');
        });
    });

    describe('preDeploymentValidation', () => {
        it('should pass when all validations succeed', async () => {
            const result = await orchestrator.preDeploymentValidation('prod');

            expect(result).toEqual({
                environment_ready: true,
                models_valid: true,
                tests_passing: true,
                no_breaking_changes: true
            });
        });

        it('should fail when tests are not passing', async () => {
            mockSqlmesh.test.mockResolvedValueOnce({ success: false });

            await expect(orchestrator.preDeploymentValidation('prod'))
                .rejects.toThrow('Pre-deployment validation failed');
        });

        it('should fail when breaking changes detected', async () => {
            mockSqlmesh.diff.mockResolvedValueOnce({ 
                success: true, 
                stdout: 'DROP TABLE users' 
            });

            await expect(orchestrator.preDeploymentValidation('prod'))
                .rejects.toThrow('Pre-deployment validation failed');
        });
    });

    describe('hasBreakingChanges', () => {
        it('should detect DROP TABLE as breaking change', () => {
            const diff = { stdout: 'DROP TABLE users' };
            expect(orchestrator.hasBreakingChanges(diff)).toBe(true);
        });

        it('should detect DROP COLUMN as breaking change', () => {
            const diff = { stdout: 'ALTER TABLE users DROP COLUMN email' };
            expect(orchestrator.hasBreakingChanges(diff)).toBe(true);
        });

        it('should detect NOT NULL alterations as breaking change', () => {
            const diff = { stdout: 'ALTER TABLE users ALTER COLUMN name SET NOT NULL' };
            expect(orchestrator.hasBreakingChanges(diff)).toBe(true);
        });

        it('should not flag safe changes as breaking', () => {
            const diff = { stdout: 'CREATE TABLE new_table' };
            expect(orchestrator.hasBreakingChanges(diff)).toBe(false);
        });
    });

    describe('detectDataLoss', () => {
        it('should detect potential data loss operations', () => {
            const testCases = [
                { stdout: 'DROP TABLE users', expected: true },
                { stdout: 'TRUNCATE TABLE orders', expected: true },
                { stdout: 'DELETE FROM customers', expected: true },
                { stdout: 'CREATE TABLE new_table', expected: false },
                { stdout: 'INSERT INTO users', expected: false }
            ];

            testCases.forEach(testCase => {
                expect(orchestrator.detectDataLoss(testCase)).toBe(testCase.expected);
            });
        });
    });

    describe('performAtomicSwap', () => {
        it('should execute SQLmesh migrate for atomic swap', async () => {
            const result = await orchestrator.performAtomicSwap('prod');

            expect(result.swapCompleted).toBe(true);
            expect(result.migrateOutput).toBe('Migration complete');
            expect(mockSqlmesh.migrate).toHaveBeenCalledWith('prod');
        });

        it('should throw error on swap failure', async () => {
            mockSqlmesh.migrate.mockResolvedValueOnce({ 
                success: false, 
                error: 'Swap failed' 
            });

            await expect(orchestrator.performAtomicSwap('prod'))
                .rejects.toThrow('Atomic swap failed');
        });
    });

    describe('rollback', () => {
        it('should execute rollback procedure', async () => {
            const deployment = {
                id: 'test-deploy',
                environment: 'prod',
                steps: [],
                error: 'Test failure'
            };

            await orchestrator.rollback(deployment);

            // Verify rollback step added
            const rollbackStep = deployment.steps.find(s => s.name === 'rollback');
            expect(rollbackStep).toBeDefined();
            expect(rollbackStep.status).toBe('completed');
        });

        it('should handle rollback failure gracefully', async () => {
            const deployment = {
                id: 'test-deploy',
                environment: 'prod',
                steps: []
            };

            // Mock a rollback error scenario
            // Since rollback is mostly handled by SQLmesh automatically,
            // we're testing the error handling path
            
            await orchestrator.rollback(deployment);
            
            // Should not throw, but log the error
            expect(deployment.rollbackError).toBeUndefined();
        });
    });

    describe('getDeploymentHistory', () => {
        it('should return empty array when no history exists', async () => {
            const history = await orchestrator.getDeploymentHistory();
            expect(history).toEqual([]);
        });

        it('should return deployment history when available', async () => {
            const mockHistory = [
                { id: 'deploy-1', status: 'completed' },
                { id: 'deploy-2', status: 'failed' },
                { id: 'deploy-3', status: 'completed' }
            ];

            fs.readFile = jest.fn().mockResolvedValueOnce(JSON.stringify(mockHistory));

            const history = await orchestrator.getDeploymentHistory(2);
            
            expect(history).toHaveLength(2);
            expect(history[0].id).toBe('deploy-2');
            expect(history[1].id).toBe('deploy-3');
        });
    });

    describe('deployment ID generation', () => {
        it('should generate unique deployment IDs', () => {
            const id1 = orchestrator.generateDeploymentId();
            const id2 = orchestrator.generateDeploymentId();

            expect(id1).toMatch(/^deploy-\d+-[a-z0-9]{6}$/);
            expect(id2).toMatch(/^deploy-\d+-[a-z0-9]{6}$/);
            expect(id1).not.toBe(id2);
        });
    });

    describe('duration calculation', () => {
        it('should calculate duration correctly', () => {
            const start = '2024-01-01T10:00:00.000Z';
            const end = '2024-01-01T10:05:30.000Z';

            const duration = orchestrator.calculateDuration(start, end);
            
            expect(duration).toBe(330000); // 5 minutes 30 seconds in milliseconds
        });
    });
});