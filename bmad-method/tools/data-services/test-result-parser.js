/**
 * test-result-parser.js
 * Parses and reports dbt test results with BMad integration
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { logger } = require('../lib/security-logger');

class TestResultParser {
    constructor(projectPath = null) {
        this.projectPath = projectPath || path.join(process.cwd(), '..', 'bmad-data-practitioner', 'dbt-project');
        this.resultsPath = path.join(this.projectPath, 'target');
    }

    /**
     * Parse dbt test results from run_results.json
     */
    async parseTestResults(runResultsPath = null) {
        try {
            const resultsFile = runResultsPath || path.join(this.resultsPath, 'run_results.json');
            
            // Check if results file exists
            try {
                await fs.access(resultsFile);
            } catch (error) {
                throw new Error('No test results found. Run dbt test first.');
            }

            const resultsContent = await fs.readFile(resultsFile, 'utf8');
            const results = JSON.parse(resultsContent);

            const testSummary = this.extractTestSummary(results);
            const testDetails = this.extractTestDetails(results);

            await this.logTestResults(testSummary, testDetails);

            return {
                success: testSummary.failed === 0,
                summary: testSummary,
                details: testDetails,
                timestamp: results.generated_at
            };
        } catch (error) {
            console.error(chalk.red('✗ Failed to parse test results:'), error.message);
            throw error;
        }
    }

    /**
     * Extract test summary statistics
     */
    extractTestSummary(results) {
        const testResults = results.results.filter(r => r.resource_type === 'test');
        
        const summary = {
            total: testResults.length,
            passed: 0,
            failed: 0,
            skipped: 0,
            error: 0,
            runtime: results.elapsed_time
        };

        testResults.forEach(test => {
            switch (test.status) {
                case 'pass':
                    summary.passed++;
                    break;
                case 'fail':
                    summary.failed++;
                    break;
                case 'skipped':
                    summary.skipped++;
                    break;
                case 'error':
                    summary.error++;
                    break;
                default:
                    console.warn(chalk.yellow(`Unknown test status: ${test.status}`));
            }
        });

        return summary;
    }

    /**
     * Extract detailed test results
     */
    extractTestDetails(results) {
        const testResults = results.results.filter(r => r.resource_type === 'test');
        
        return testResults.map(test => ({
            name: test.unique_id,
            status: test.status,
            runtime: test.execution_time,
            message: test.message || '',
            failures: test.failures || 0,
            compiled_code: test.compiled_code || '',
            relation_name: test.relation_name || '',
            adapter_response: test.adapter_response || {}
        }));
    }

    /**
     * Generate test report in BMad format
     */
    async generateTestReport(testResults, outputPath = null) {
        try {
            const reportPath = outputPath || path.join(this.resultsPath, 'bmad_test_report.md');
            
            const reportContent = this.formatTestReport(testResults);
            await fs.writeFile(reportPath, reportContent);

            console.log(chalk.green(`✓ Test report generated: ${reportPath}`));
            
            return {
                success: true,
                reportPath,
                summary: testResults.summary
            };
        } catch (error) {
            console.error(chalk.red('✗ Failed to generate test report:'), error.message);
            throw error;
        }
    }

    /**
     * Format test report in markdown
     */
    formatTestReport(testResults) {
        const { summary, details, timestamp } = testResults;
        
        let report = `# dbt Test Report - BMad Data Practitioner

## Summary

**Generated:** ${timestamp}  
**Total Tests:** ${summary.total}  
**Passed:** ${chalk.green(summary.passed)}  
**Failed:** ${summary.failed > 0 ? chalk.red(summary.failed) : summary.failed}  
**Skipped:** ${summary.skipped}  
**Errors:** ${summary.error > 0 ? chalk.red(summary.error) : summary.error}  
**Runtime:** ${summary.runtime}s  

## Overall Status: ${summary.failed === 0 ? '✅ PASS' : '❌ FAIL'}

---

## Test Details

`;

        // Group tests by status
        const testsByStatus = {
            pass: details.filter(t => t.status === 'pass'),
            fail: details.filter(t => t.status === 'fail'),
            error: details.filter(t => t.status === 'error'),
            skipped: details.filter(t => t.status === 'skipped')
        };

        // Failed tests first
        if (testsByStatus.fail.length > 0) {
            report += `### ❌ Failed Tests (${testsByStatus.fail.length})

`;
            testsByStatus.fail.forEach(test => {
                report += `#### ${test.name}
- **Status:** FAIL
- **Runtime:** ${test.runtime}s
- **Failures:** ${test.failures}
- **Message:** ${test.message}
- **Relation:** ${test.relation_name}

`;
            });
        }

        // Error tests
        if (testsByStatus.error.length > 0) {
            report += `### 🚨 Error Tests (${testsByStatus.error.length})

`;
            testsByStatus.error.forEach(test => {
                report += `#### ${test.name}
- **Status:** ERROR
- **Runtime:** ${test.runtime}s
- **Message:** ${test.message}

`;
            });
        }

        // Passed tests summary
        if (testsByStatus.pass.length > 0) {
            report += `### ✅ Passed Tests (${testsByStatus.pass.length})

`;
            testsByStatus.pass.forEach(test => {
                report += `- ${test.name} (${test.runtime}s)\n`;
            });
            report += '\n';
        }

        // Skipped tests
        if (testsByStatus.skipped.length > 0) {
            report += `### ⏭️ Skipped Tests (${testsByStatus.skipped.length})

`;
            testsByStatus.skipped.forEach(test => {
                report += `- ${test.name}\n`;
            });
            report += '\n';
        }

        report += `---

## Recommendations

`;

        if (summary.failed > 0) {
            report += `### Fix Failed Tests
- Review the failed test details above
- Check source data quality
- Verify business rule implementations
- Update model logic if needed

`;
        }

        if (summary.error > 0) {
            report += `### Resolve Errors
- Check test SQL syntax
- Verify model dependencies exist
- Review dbt configuration

`;
        }

        if (summary.passed === summary.total) {
            report += `### All Tests Passing! 🎉
- Consider adding more comprehensive tests
- Review test coverage for new models
- Update documentation

`;
        }

        report += `### Data Quality Metrics
- **Test Coverage:** ${Math.round((summary.total / this.getModelCount()) * 100)}%
- **Success Rate:** ${Math.round((summary.passed / summary.total) * 100)}%
- **Performance:** ${summary.runtime < 60 ? 'Good' : 'Needs Optimization'}

---

*Report generated by BMad Data Practitioner dbt integration*
`;

        return report;
    }

    /**
     * Integrate with BMad validation systems
     */
    async integrateBMadValidation(testResults) {
        try {
            // Log test results to BMad security logging
            await logger.logSecurityEvent('dbt_test_execution', {
                timestamp: new Date().toISOString(),
                total_tests: testResults.summary.total,
                passed_tests: testResults.summary.passed,
                failed_tests: testResults.summary.failed,
                error_tests: testResults.summary.error,
                runtime: testResults.summary.runtime,
                success: testResults.success
            });

            // Create BMad-compatible validation report
            const bmadValidation = {
                type: 'dbt_data_quality',
                status: testResults.success ? 'PASS' : 'FAIL',
                timestamp: testResults.timestamp,
                metrics: {
                    total_tests: testResults.summary.total,
                    pass_rate: testResults.summary.passed / testResults.summary.total,
                    failure_rate: testResults.summary.failed / testResults.summary.total,
                    performance_score: this.calculatePerformanceScore(testResults.summary.runtime)
                },
                details: testResults.details.filter(t => t.status !== 'pass').map(test => ({
                    test_name: test.name,
                    status: test.status,
                    issue: test.message,
                    severity: test.status === 'error' ? 'HIGH' : 'MEDIUM'
                }))
            };

            // Write to BMad validation format
            const validationPath = path.join(this.resultsPath, 'bmad_validation.json');
            await fs.writeFile(validationPath, JSON.stringify(bmadValidation, null, 2));

            console.log(chalk.blue('✓ BMad validation integration completed'));
            
            return bmadValidation;
        } catch (error) {
            console.error(chalk.red('✗ BMad validation integration failed:'), error.message);
            throw error;
        }
    }

    /**
     * Generate automated test suggestions
     */
    async generateTestSuggestions(modelPath) {
        try {
            // This would analyze model structure and suggest appropriate tests
            const suggestions = {
                generic_tests: [
                    'unique tests for primary keys',
                    'not_null tests for required fields',
                    'accepted_values tests for categorical fields',
                    'relationships tests for foreign keys'
                ],
                custom_tests: [
                    'business rule validations',
                    'data quality thresholds',
                    'referential integrity checks',
                    'statistical outlier detection'
                ],
                performance_tests: [
                    'execution time thresholds',
                    'row count validations',
                    'data freshness checks'
                ]
            };

            return suggestions;
        } catch (error) {
            console.error(chalk.red('✗ Failed to generate test suggestions:'), error.message);
            throw error;
        }
    }

    /**
     * Private helper methods
     */

    async logTestResults(summary, details) {
        console.log(chalk.blue('\n📊 Test Results Summary:'));
        console.log(`Total: ${summary.total}`);
        console.log(chalk.green(`Passed: ${summary.passed}`));
        
        if (summary.failed > 0) {
            console.log(chalk.red(`Failed: ${summary.failed}`));
        }
        
        if (summary.error > 0) {
            console.log(chalk.red(`Errors: ${summary.error}`));
        }
        
        if (summary.skipped > 0) {
            console.log(chalk.yellow(`Skipped: ${summary.skipped}`));
        }
        
        console.log(`Runtime: ${summary.runtime}s\n`);

        // Show failed test details
        if (summary.failed > 0 || summary.error > 0) {
            const problemTests = details.filter(t => t.status === 'fail' || t.status === 'error');
            console.log(chalk.red('🚨 Problem Tests:'));
            problemTests.forEach(test => {
                console.log(chalk.red(`  ✗ ${test.name}: ${test.message}`));
            });
            console.log('');
        }
    }

    calculatePerformanceScore(runtime) {
        // Score based on runtime thresholds
        if (runtime < 30) return 'EXCELLENT';
        if (runtime < 60) return 'GOOD';
        if (runtime < 120) return 'FAIR';
        return 'POOR';
    }

    async getModelCount() {
        // This would count the number of models in the project
        // For now, return a default value
        return 10;
    }
}

module.exports = { TestResultParser };