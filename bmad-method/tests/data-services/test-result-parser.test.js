/**
 * test-result-parser.test.js
 * Tests for dbt test result parsing and BMad integration
 */

const { TestResultParser } = require('../../tools/data-services/test-result-parser');
const path = require('path');
const fs = require('fs').promises;

// Mock dependencies
jest.mock('../../tools/lib/security-logger', () => ({
    logger: {
        logSecurityEvent: jest.fn().mockResolvedValue(true)
    }
}));

describe('TestResultParser', () => {
    let testParser;
    const testProjectPath = path.join(process.cwd(), '..', 'bmad-data-practitioner', 'dbt-project');
    const mockRunResults = {
        generated_at: '2024-01-01T12:00:00Z',
        elapsed_time: 45.5,
        results: [
            {
                resource_type: 'test',
                unique_id: 'test.unique_source_id',
                status: 'pass',
                execution_time: 1.2,
                message: '',
                failures: 0,
                relation_name: 'stg_sample_source'
            },
            {
                resource_type: 'test',
                unique_id: 'test.not_null_source_name',
                status: 'pass',
                execution_time: 0.8,
                message: '',
                failures: 0,
                relation_name: 'stg_sample_source'
            },
            {
                resource_type: 'test',
                unique_id: 'test.data_quality_check',
                status: 'fail',
                execution_time: 2.1,
                message: 'Test failed with 5 violations',
                failures: 5,
                relation_name: 'stg_sample_source'
            },
            {
                resource_type: 'model',
                unique_id: 'model.stg_sample_source',
                status: 'success',
                execution_time: 3.2
            }
        ]
    };

    beforeEach(() => {
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        
        testParser = new TestResultParser(testProjectPath);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Constructor', () => {
        test('should initialize with correct paths', () => {
            expect(testParser.projectPath).toBe(testProjectPath);
            expect(testParser.resultsPath).toContain('target');
        });

        test('should use default project path when none provided', () => {
            const defaultParser = new TestResultParser();
            expect(defaultParser.projectPath).toContain('bmad-data-practitioner/dbt-project');
        });
    });

    describe('Test Summary Extraction', () => {
        test('should extract correct test summary', () => {
            const summary = testParser.extractTestSummary(mockRunResults);
            
            expect(summary).toEqual({
                total: 3,
                passed: 2,
                failed: 1,
                skipped: 0,
                error: 0,
                runtime: 45.5
            });
        });

        test('should handle empty results', () => {
            const emptyResults = {
                generated_at: '2024-01-01T12:00:00Z',
                elapsed_time: 0,
                results: []
            };
            
            const summary = testParser.extractTestSummary(emptyResults);
            
            expect(summary.total).toBe(0);
            expect(summary.passed).toBe(0);
            expect(summary.failed).toBe(0);
        });

        test('should filter non-test results', () => {
            const summary = testParser.extractTestSummary(mockRunResults);
            
            // Should only count test results, not model results
            expect(summary.total).toBe(3);
        });
    });

    describe('Test Details Extraction', () => {
        test('should extract test details correctly', () => {
            const details = testParser.extractTestDetails(mockRunResults);
            
            expect(details).toHaveLength(3);
            expect(details[0]).toMatchObject({
                name: 'test.unique_source_id',
                status: 'pass',
                runtime: 1.2,
                failures: 0
            });
            
            expect(details[2]).toMatchObject({
                name: 'test.data_quality_check',
                status: 'fail',
                runtime: 2.1,
                failures: 5,
                message: 'Test failed with 5 violations'
            });
        });

        test('should handle missing optional fields', () => {
            const minimalResults = {
                results: [{
                    resource_type: 'test',
                    unique_id: 'test.minimal',
                    status: 'pass',
                    execution_time: 1.0
                }]
            };
            
            const details = testParser.extractTestDetails(minimalResults);
            
            expect(details[0]).toMatchObject({
                name: 'test.minimal',
                status: 'pass',
                runtime: 1.0,
                message: '',
                failures: 0
            });
        });
    });

    describe('Test Report Generation', () => {
        test('should format test report correctly', () => {
            const testResults = {
                summary: {
                    total: 3,
                    passed: 2,
                    failed: 1,
                    skipped: 0,
                    error: 0,
                    runtime: 45.5
                },
                details: [
                    {
                        name: 'test.unique_source_id',
                        status: 'pass',
                        runtime: 1.2,
                        failures: 0,
                        message: ''
                    },
                    {
                        name: 'test.data_quality_check',
                        status: 'fail',
                        runtime: 2.1,
                        failures: 5,
                        message: 'Test failed with 5 violations'
                    }
                ],
                timestamp: '2024-01-01T12:00:00Z'
            };
            
            const report = testParser.formatTestReport(testResults);
            
            expect(report).toContain('# dbt Test Report - BMad Data Practitioner');
            expect(report).toContain('**Total Tests:** 3');
            expect(report).toContain('**Passed:** 2');
            expect(report).toContain('**Failed:** 1');
            expect(report).toContain('### ❌ Failed Tests (1)');
            expect(report).toContain('test.data_quality_check');
            expect(report).toContain('Test failed with 5 violations');
        });

        test('should handle all-passing tests report', () => {
            const allPassingResults = {
                summary: {
                    total: 2,
                    passed: 2,
                    failed: 0,
                    skipped: 0,
                    error: 0,
                    runtime: 15.2
                },
                details: [
                    { name: 'test.one', status: 'pass', runtime: 1.0 },
                    { name: 'test.two', status: 'pass', runtime: 1.2 }
                ],
                timestamp: '2024-01-01T12:00:00Z'
            };
            
            const report = testParser.formatTestReport(allPassingResults);
            
            expect(report).toContain('## Overall Status: ✅ PASS');
            expect(report).toContain('### All Tests Passing! 🎉');
            expect(report).toContain('### ✅ Passed Tests (2)');
        });
    });

    describe('BMad Integration', () => {
        test('should create BMad validation format', async () => {
            const { logger } = require('../../tools/lib/security-logger');
            
            const testResults = {
                success: false,
                summary: {
                    total: 3,
                    passed: 2,
                    failed: 1,
                    error: 0,
                    runtime: 45.5
                },
                details: [
                    {
                        name: 'test.failed_test',
                        status: 'fail',
                        message: 'Data quality violation'
                    }
                ],
                timestamp: '2024-01-01T12:00:00Z'
            };
            
            // Mock file system operations
            jest.spyOn(fs, 'writeFile').mockResolvedValue();
            
            const bmadValidation = await testParser.integrateBMadValidation(testResults);
            
            expect(bmadValidation).toMatchObject({
                type: 'dbt_data_quality',
                status: 'FAIL',
                timestamp: '2024-01-01T12:00:00Z',
                metrics: {
                    total_tests: 3,
                    pass_rate: 2/3,
                    failure_rate: 1/3
                }
            });
            
            expect(bmadValidation.details).toHaveLength(1);
            expect(bmadValidation.details[0]).toMatchObject({
                test_name: 'test.failed_test',
                status: 'fail',
                issue: 'Data quality violation',
                severity: 'MEDIUM'
            });
            
            expect(logger.logSecurityEvent).toHaveBeenCalledWith(
                'dbt_test_execution',
                expect.objectContaining({
                    total_tests: 3,
                    passed_tests: 2,
                    failed_tests: 1,
                    success: false
                })
            );
        });

        test('should handle successful test integration', async () => {
            const successfulResults = {
                success: true,
                summary: {
                    total: 2,
                    passed: 2,
                    failed: 0,
                    error: 0,
                    runtime: 15.0
                },
                details: [],
                timestamp: '2024-01-01T12:00:00Z'
            };
            
            jest.spyOn(fs, 'writeFile').mockResolvedValue();
            
            const bmadValidation = await testParser.integrateBMadValidation(successfulResults);
            
            expect(bmadValidation.status).toBe('PASS');
            expect(bmadValidation.details).toHaveLength(0);
            expect(bmadValidation.metrics.pass_rate).toBe(1);
        });
    });

    describe('Performance Scoring', () => {
        test('should calculate performance scores correctly', () => {
            expect(testParser.calculatePerformanceScore(15)).toBe('EXCELLENT');
            expect(testParser.calculatePerformanceScore(45)).toBe('GOOD');
            expect(testParser.calculatePerformanceScore(75)).toBe('FAIR');
            expect(testParser.calculatePerformanceScore(150)).toBe('POOR');
        });
    });

    describe('Test Suggestions', () => {
        test('should generate test suggestions', async () => {
            const suggestions = await testParser.generateTestSuggestions('/path/to/model');
            
            expect(suggestions).toHaveProperty('generic_tests');
            expect(suggestions).toHaveProperty('custom_tests');
            expect(suggestions).toHaveProperty('performance_tests');
            
            expect(Array.isArray(suggestions.generic_tests)).toBe(true);
            expect(suggestions.generic_tests.length).toBeGreaterThan(0);
        });
    });

    describe('Error Handling', () => {
        test('should handle missing results file', async () => {
            jest.spyOn(fs, 'access').mockRejectedValue(new Error('File not found'));
            
            await expect(testParser.parseTestResults()).rejects.toThrow('No test results found');
        });

        test('should handle invalid JSON', async () => {
            jest.spyOn(fs, 'access').mockResolvedValue();
            jest.spyOn(fs, 'readFile').mockResolvedValue('invalid json');
            
            await expect(testParser.parseTestResults()).rejects.toThrow();
        });

        test('should handle BMad integration errors gracefully', async () => {
            const { logger } = require('../../tools/lib/security-logger');
            logger.logSecurityEvent.mockRejectedValue(new Error('Logging failed'));
            
            const testResults = {
                success: true,
                summary: { total: 1, passed: 1, failed: 0, error: 0, runtime: 1.0 },
                details: [],
                timestamp: '2024-01-01T12:00:00Z'
            };
            
            await expect(testParser.integrateBMadValidation(testResults))
                .rejects.toThrow('Logging failed');
        });
    });
});