/**
 * Tests for Cost Tracker
 */

const CostTracker = require('../../tools/data-services/cost-tracker');
const fs = require('fs').promises;
const path = require('path');

// Mock dependencies
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

describe('CostTracker', () => {
    let tracker;
    let mockMetrics;

    beforeEach(() => {
        tracker = new CostTracker({
            projectPath: '/test/sqlmesh-project',
            costPerHour: 2.0
        });

        // Default mock metrics
        mockMetrics = {
            executions: [],
            aggregates: {},
            createdAt: '2024-01-01T00:00:00.000Z'
        };

        // Mock fs operations
        fs.readFile = jest.fn().mockResolvedValue(JSON.stringify(mockMetrics));
        fs.writeFile = jest.fn().mockResolvedValue();
        fs.mkdir = jest.fn().mockResolvedValue();
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('trackExecution', () => {
        it('should track virtual execution with zero cost', async () => {
            const executionData = {
                computeHours: 5,
                dataSizeGB: 100,
                modelsProcessed: 10
            };

            const result = await tracker.trackExecution('dev', executionData);

            expect(result.isVirtual).toBe(true);
            expect(result.physicalComputeHours).toBe(0);
            expect(result.virtualComputeHours).toBe(5);
            expect(result.cost).toBe(0);
            expect(result.savedCost).toBe(10); // 5 hours * $2/hour
        });

        it('should track physical execution with actual cost', async () => {
            const executionData = {
                computeHours: 3,
                dataSizeGB: 50,
                modelsProcessed: 5
            };

            const result = await tracker.trackExecution('prod', executionData);

            expect(result.isVirtual).toBe(false);
            expect(result.physicalComputeHours).toBe(3);
            expect(result.virtualComputeHours).toBe(0);
            expect(result.cost).toBe(6); // 3 hours * $2/hour
            expect(result.savedCost).toBe(0);
        });

        it('should identify feature branches as virtual', async () => {
            const result = await tracker.trackExecution('feature_test', {
                computeHours: 2
            });

            expect(result.isVirtual).toBe(true);
            expect(result.cost).toBe(0);
            expect(result.savedCost).toBe(4);
        });
    });

    describe('calculateSavings', () => {
        beforeEach(() => {
            // Mock metrics with sample executions
            mockMetrics.executions = [
                {
                    timestamp: new Date().toISOString(),
                    environment: 'dev',
                    isVirtual: true,
                    physicalComputeHours: 0,
                    virtualComputeHours: 10,
                    cost: 0,
                    savedCost: 20
                },
                {
                    timestamp: new Date().toISOString(),
                    environment: 'staging',
                    isVirtual: false,
                    physicalComputeHours: 5,
                    virtualComputeHours: 0,
                    cost: 10,
                    savedCost: 0
                },
                {
                    timestamp: new Date().toISOString(),
                    environment: 'dev',
                    isVirtual: true,
                    physicalComputeHours: 0,
                    virtualComputeHours: 15,
                    cost: 0,
                    savedCost: 30
                }
            ];

            fs.readFile = jest.fn().mockResolvedValue(JSON.stringify(mockMetrics));
        });

        it('should calculate correct savings percentage', async () => {
            const savings = await tracker.calculateSavings('month');

            expect(savings.physicalComputeHours).toBe(5);
            expect(savings.virtualComputeHours).toBe(25);
            expect(savings.actualCost).toBe(10);
            expect(savings.savedCost).toBe(50);
            expect(savings.potentialCost).toBe(60); // (5 + 25) * $2
            expect(savings.savingsPercentage).toBe(83.3); // 50/60 * 100
        });

        it('should validate 30-50% savings calculation formula', async () => {
            // Test scenario with typical usage pattern
            mockMetrics.executions = [
                // Dev environment (virtual) - 100 hours
                {
                    timestamp: new Date().toISOString(),
                    environment: 'dev',
                    isVirtual: true,
                    physicalComputeHours: 0,
                    virtualComputeHours: 100,
                    cost: 0,
                    savedCost: 200
                },
                // Staging with sampling - 50 hours physical (90% reduction)
                {
                    timestamp: new Date().toISOString(),
                    environment: 'staging',
                    isVirtual: false,
                    physicalComputeHours: 50,
                    virtualComputeHours: 0,
                    cost: 100,
                    savedCost: 0
                },
                // Prod - 50 hours physical
                {
                    timestamp: new Date().toISOString(),
                    environment: 'prod',
                    isVirtual: false,
                    physicalComputeHours: 50,
                    virtualComputeHours: 0,
                    cost: 100,
                    savedCost: 0
                }
            ];

            fs.readFile = jest.fn().mockResolvedValue(JSON.stringify(mockMetrics));

            const savings = await tracker.calculateSavings('month');

            // Total potential cost: (100 + 50 + 50) * $2 = $400
            // Actual cost: $200 (100 + 100)
            // Saved: $200
            // Savings percentage: 50%
            expect(savings.savingsPercentage).toBe(50);
        });

        it('should filter executions by period', async () => {
            // Add old execution
            mockMetrics.executions.push({
                timestamp: new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago
                environment: 'prod',
                isVirtual: false,
                physicalComputeHours: 100,
                virtualComputeHours: 0,
                cost: 200,
                savedCost: 0
            });

            fs.readFile = jest.fn().mockResolvedValue(JSON.stringify(mockMetrics));

            const monthly = await tracker.calculateSavings('month');
            const quarterly = await tracker.calculateSavings('quarter');

            // Monthly should not include old execution
            expect(monthly.physicalComputeHours).toBe(5);
            
            // Quarterly should include old execution
            expect(quarterly.physicalComputeHours).toBe(105);
        });
    });

    describe('generateRecommendations', () => {
        it('should recommend more virtual usage when savings are low', () => {
            const monthlyData = {
                savingsPercentage: 20,
                virtualComputeHours: 10,
                physicalComputeHours: 40,
                actualCost: 80
            };

            const recommendations = tracker.generateRecommendations(monthlyData);

            expect(recommendations).toContain(
                'Consider moving more development to virtual environments to increase savings'
            );
            expect(recommendations).toContain(
                'Increase use of virtual environments for development and testing'
            );
        });

        it('should congratulate when savings are excellent', () => {
            const monthlyData = {
                savingsPercentage: 55,
                virtualComputeHours: 60,
                physicalComputeHours: 40,
                actualCost: 80
            };

            const recommendations = tracker.generateRecommendations(monthlyData);

            expect(recommendations).toContain(
                'Excellent cost optimization! Consider documenting your strategy for other teams'
            );
        });

        it('should warn about high compute costs', () => {
            const monthlyData = {
                savingsPercentage: 35,
                virtualComputeHours: 50,
                physicalComputeHours: 600,
                actualCost: 1200
            };

            const recommendations = tracker.generateRecommendations(monthlyData);

            expect(recommendations).toContain(
                'High compute costs detected. Review model efficiency and consider optimization'
            );
            expect(recommendations).toContain(
                'Use feature branch environments with auto-cleanup to reduce costs'
            );
        });
    });

    describe('calculateROI', () => {
        beforeEach(() => {
            mockMetrics.executions = [
                // Quarterly savings of $3000
                {
                    timestamp: new Date().toISOString(),
                    environment: 'dev',
                    isVirtual: true,
                    physicalComputeHours: 0,
                    virtualComputeHours: 1500,
                    cost: 0,
                    savedCost: 3000
                }
            ];

            fs.readFile = jest.fn().mockResolvedValue(JSON.stringify(mockMetrics));
        });

        it('should calculate positive ROI when savings exceed implementation cost', async () => {
            const roi = await tracker.calculateROI(10000);

            expect(roi.implementationCost).toBe(10000);
            expect(roi.yearlySavings).toBe(12000); // $3000 * 4 quarters
            expect(roi.roi).toBe('20.0'); // ((12000 - 10000) / 10000) * 100
            expect(roi.paybackPeriodMonths).toBe('10.0'); // 10000 / (3000/3)
            expect(roi.breakEven).toBe(true);
        });

        it('should identify when payback period exceeds 12 months', async () => {
            const roi = await tracker.calculateROI(50000);

            expect(roi.yearlySavings).toBe(12000);
            expect(roi.roi).toBe('-76.0'); // Negative ROI
            expect(parseFloat(roi.paybackPeriodMonths)).toBeGreaterThan(12);
            expect(roi.breakEven).toBe(false);
        });
    });

    describe('getEnvironmentBreakdown', () => {
        beforeEach(() => {
            mockMetrics.executions = [
                {
                    environment: 'dev',
                    physicalComputeHours: 0,
                    virtualComputeHours: 10,
                    cost: 0,
                    savedCost: 20
                },
                {
                    environment: 'dev',
                    physicalComputeHours: 0,
                    virtualComputeHours: 15,
                    cost: 0,
                    savedCost: 30
                },
                {
                    environment: 'staging',
                    physicalComputeHours: 5,
                    virtualComputeHours: 0,
                    cost: 10,
                    savedCost: 0
                },
                {
                    environment: 'prod',
                    physicalComputeHours: 20,
                    virtualComputeHours: 0,
                    cost: 40,
                    savedCost: 0
                }
            ];

            fs.readFile = jest.fn().mockResolvedValue(JSON.stringify(mockMetrics));
        });

        it('should correctly aggregate by environment', async () => {
            const breakdown = await tracker.getEnvironmentBreakdown();

            expect(breakdown.dev).toEqual({
                count: 2,
                computeHours: 25,
                cost: 0,
                savedCost: 50
            });

            expect(breakdown.staging).toEqual({
                count: 1,
                computeHours: 5,
                cost: 10,
                savedCost: 0
            });

            expect(breakdown.prod).toEqual({
                count: 1,
                computeHours: 20,
                cost: 40,
                savedCost: 0
            });
        });
    });

    describe('virtual environment detection', () => {
        it('should correctly identify virtual environments', () => {
            expect(tracker.isVirtualEnvironment('dev')).toBe(true);
            expect(tracker.isVirtualEnvironment('feature_branch')).toBe(true);
            expect(tracker.isVirtualEnvironment('feature_test')).toBe(true);
            expect(tracker.isVirtualEnvironment('staging')).toBe(false);
            expect(tracker.isVirtualEnvironment('prod')).toBe(false);
        });
    });
});