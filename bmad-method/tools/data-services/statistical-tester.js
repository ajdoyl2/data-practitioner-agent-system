#!/usr/bin/env node

/**
 * Statistical Testing Framework
 * Automated statistical test selection and execution for hypothesis validation
 * Supports 50+ statistical tests with intelligent test selection
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const crypto = require('crypto');
const chalk = require('chalk');

const execAsync = promisify(exec);

class StatisticalTester {
    constructor(options = {}) {
        this.alphaLevel = options.alphaLevel || 0.05;
        this.correctionMethod = options.correctionMethod || 'benjamini_hochberg';
        this.maxTestsPerAnalysis = options.maxTestsPerAnalysis || 50;
        this.cacheEnabled = options.cacheEnabled !== false;
        this.cacheTTL = options.cacheTTL || 24 * 60 * 60 * 1000; // 24 hours
        this.pythonPath = options.pythonPath || 'python3';
        this.scriptPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/python-analysis/statistical_testing.py');
        
        // Initialize test catalog
        this.testCatalog = this.initializeTestCatalog();
        
        console.log(chalk.gray(`🧮 Statistical Tester initialized: α=${this.alphaLevel}, correction=${this.correctionMethod}`));
    }
    
    initializeTestCatalog() {
        return {
            // Normality Tests
            normality: [
                { name: 'shapiro_wilk', description: 'Shapiro-Wilk normality test', min_samples: 3, max_samples: 5000 },
                { name: 'kolmogorov_smirnov', description: 'Kolmogorov-Smirnov test', min_samples: 10 },
                { name: 'anderson_darling', description: 'Anderson-Darling test', min_samples: 8 },
                { name: 'jarque_bera', description: 'Jarque-Bera test', min_samples: 2000 },
                { name: 'dagostino_k2', description: "D'Agostino's K-squared test", min_samples: 20 }
            ],
            
            // Comparison Tests (Two Sample)
            two_sample: [
                { name: 't_test_independent', description: 'Independent samples t-test', assumptions: ['normality', 'equal_variance'] },
                { name: 't_test_paired', description: 'Paired samples t-test', assumptions: ['normality'] },
                { name: 'welch_t_test', description: "Welch's t-test (unequal variances)", assumptions: ['normality'] },
                { name: 'mann_whitney_u', description: 'Mann-Whitney U test (non-parametric)', assumptions: [] },
                { name: 'wilcoxon_signed_rank', description: 'Wilcoxon signed-rank test', assumptions: [] },
                { name: 'permutation_test', description: 'Permutation test', assumptions: [] }
            ],
            
            // Multiple Group Tests
            multiple_groups: [
                { name: 'anova_one_way', description: 'One-way ANOVA', assumptions: ['normality', 'equal_variance'] },
                { name: 'kruskal_wallis', description: 'Kruskal-Wallis test', assumptions: [] },
                { name: 'welch_anova', description: "Welch's ANOVA (unequal variances)", assumptions: ['normality'] },
                { name: 'anova_two_way', description: 'Two-way ANOVA', assumptions: ['normality', 'equal_variance'] }
            ],
            
            // Categorical Tests
            categorical: [
                { name: 'chi_square_independence', description: 'Chi-square test of independence', min_expected: 5 },
                { name: 'chi_square_goodness', description: 'Chi-square goodness of fit test', min_expected: 5 },
                { name: 'fisher_exact', description: "Fisher's exact test", max_categories: 2 },
                { name: 'mcnemar', description: "McNemar's test", paired: true },
                { name: 'cochran_q', description: "Cochran's Q test", multiple_binary: true }
            ],
            
            // Correlation Tests
            correlation: [
                { name: 'pearson_correlation', description: 'Pearson product-moment correlation', assumptions: ['normality', 'linear'] },
                { name: 'spearman_correlation', description: 'Spearman rank correlation', assumptions: [] },
                { name: 'kendall_tau', description: "Kendall's tau correlation", assumptions: [] },
                { name: 'point_biserial', description: 'Point-biserial correlation', binary_continuous: true },
                { name: 'partial_correlation', description: 'Partial correlation', control_variables: true }
            ],
            
            // Regression Tests
            regression: [
                { name: 'linear_regression_significance', description: 'Linear regression F-test', assumptions: ['linearity', 'independence', 'homoscedasticity', 'normality'] },
                { name: 'durbin_watson', description: 'Durbin-Watson test for autocorrelation', time_series: true },
                { name: 'breusch_pagan', description: 'Breusch-Pagan test for heteroscedasticity', assumptions: [] },
                { name: 'jarque_bera_residuals', description: 'Jarque-Bera test on residuals', assumptions: [] }
            ],
            
            // Variance Tests
            variance: [
                { name: 'levene_test', description: "Levene's test for equal variances", assumptions: [] },
                { name: 'bartlett_test', description: "Bartlett's test for equal variances", assumptions: ['normality'] },
                { name: 'fligner_killeen', description: 'Fligner-Killeen test', assumptions: [] },
                { name: 'ansari_bradley', description: 'Ansari-Bradley test', assumptions: [] }
            ],
            
            // Time Series Tests
            time_series: [
                { name: 'augmented_dickey_fuller', description: 'Augmented Dickey-Fuller test (stationarity)', time_series: true },
                { name: 'kpss_test', description: 'KPSS test (stationarity)', time_series: true },
                { name: 'ljung_box', description: 'Ljung-Box test (autocorrelation)', time_series: true },
                { name: 'granger_causality', description: 'Granger causality test', multivariate: true }
            ],
            
            // Distribution Tests
            distribution: [
                { name: 'ks_two_sample', description: 'Two-sample Kolmogorov-Smirnov test', assumptions: [] },
                { name: 'epps_singleton', description: 'Epps-Singleton test', multivariate: true },
                { name: 'cramer_von_mises', description: 'Cramér-von Mises test', assumptions: [] }
            ],
            
            // Effect Size Calculations
            effect_size: [
                { name: 'cohens_d', description: "Cohen's d effect size", two_group: true },
                { name: 'hedges_g', description: "Hedges' g effect size", two_group: true },
                { name: 'glass_delta', description: 'Glass delta effect size', two_group: true },
                { name: 'eta_squared', description: 'Eta-squared effect size', anova: true },
                { name: 'omega_squared', description: 'Omega-squared effect size', anova: true },
                { name: 'cramer_v', description: "Cramér's V effect size", categorical: true }
            ]
        };
    }
    
    /**
     * Automatically select appropriate statistical tests based on data characteristics
     * @param {Object} dataCharacteristics - Data structure and properties
     * @param {Array} hypotheses - Generated hypotheses to test
     * @returns {Array} Selected tests with rationale
     */
    selectAppropriatTests(dataCharacteristics, hypotheses) {
        const selectedTests = [];
        
        console.log(chalk.blue('🎯 Selecting appropriate statistical tests...'));
        
        // Analyze data structure
        const {
            sample_size,
            num_variables,
            variable_types,
            normality_likely,
            equal_variances_likely,
            paired_data,
            time_series,
            missing_data_percentage,
            outliers_present
        } = dataCharacteristics;
        
        // Select tests based on hypotheses and data characteristics
        for (const hypothesis of hypotheses) {
            const testSuite = this.selectTestsForHypothesis(hypothesis, dataCharacteristics);
            selectedTests.push(...testSuite);
        }
        
        // Add general exploratory tests
        const exploratoryTests = this.selectExploratoryTests(dataCharacteristics);
        selectedTests.push(...exploratoryTests);
        
        // Remove duplicates and limit to maxTestsPerAnalysis
        const uniqueTests = this.removeDuplicateTests(selectedTests);
        const limitedTests = uniqueTests.slice(0, this.maxTestsPerAnalysis);
        
        console.log(chalk.green(`✅ Selected ${limitedTests.length} statistical tests`));
        return limitedTests;
    }
    
    selectTestsForHypothesis(hypothesis, dataCharacteristics) {
        const tests = [];
        const variables = hypothesis.variables || [];
        
        // Correlation hypotheses
        if (hypothesis.statistical_test?.includes('correlation')) {
            if (dataCharacteristics.normality_likely) {
                tests.push({
                    test: 'pearson_correlation',
                    variables: variables,
                    rationale: 'Testing linear correlation (data appears normally distributed)'
                });
            }
            
            tests.push({
                test: 'spearman_correlation',
                variables: variables,
                rationale: 'Non-parametric correlation test (robust to distribution assumptions)'
            });
        }
        
        // Two-group comparison hypotheses
        if (hypothesis.statistical_test?.includes('t-test') || variables.length === 2) {
            if (dataCharacteristics.normality_likely && dataCharacteristics.equal_variances_likely) {
                tests.push({
                    test: 't_test_independent',
                    variables: variables,
                    rationale: 'Standard t-test (normal data, equal variances assumed)'
                });
            } else if (dataCharacteristics.normality_likely) {
                tests.push({
                    test: 'welch_t_test',
                    variables: variables,
                    rationale: "Welch's t-test (normal data, unequal variances)"
                });
            }
            
            tests.push({
                test: 'mann_whitney_u',
                variables: variables,
                rationale: 'Non-parametric alternative to t-test'
            });
        }
        
        // Regression hypotheses
        if (hypothesis.statistical_test?.includes('regression')) {
            tests.push({
                test: 'linear_regression_significance',
                variables: variables,
                rationale: 'Testing linear relationship significance'
            });
            
            tests.push({
                test: 'breusch_pagan',
                variables: variables,
                rationale: 'Testing for heteroscedasticity in regression'
            });
        }
        
        // Add effect size calculations
        if (variables.length === 2) {
            tests.push({
                test: 'cohens_d',
                variables: variables,
                rationale: 'Effect size calculation for practical significance'
            });
        }
        
        return tests;
    }
    
    selectExploratoryTests(dataCharacteristics) {
        const tests = [];
        
        // Normality tests for numeric variables
        if (dataCharacteristics.variable_types.numeric > 0) {
            if (dataCharacteristics.sample_size < 5000) {
                tests.push({
                    test: 'shapiro_wilk',
                    rationale: 'Testing normality assumption (small to medium sample)'
                });
            } else {
                tests.push({
                    test: 'kolmogorov_smirnov',
                    rationale: 'Testing normality assumption (large sample)'
                });
            }
        }
        
        // Variance equality tests if multiple groups
        if (dataCharacteristics.variable_types.categorical > 0 && dataCharacteristics.variable_types.numeric > 0) {
            tests.push({
                test: 'levene_test',
                rationale: 'Testing equal variance assumption across groups'
            });
        }
        
        // Time series tests if applicable
        if (dataCharacteristics.time_series) {
            tests.push({
                test: 'augmented_dickey_fuller',
                rationale: 'Testing for stationarity in time series data'
            });
            
            tests.push({
                test: 'ljung_box',
                rationale: 'Testing for autocorrelation in time series'
            });
        }
        
        // Categorical association tests
        if (dataCharacteristics.variable_types.categorical >= 2) {
            tests.push({
                test: 'chi_square_independence',
                rationale: 'Testing independence of categorical variables'
            });
        }
        
        return tests;
    }
    
    removeDuplicateTests(tests) {
        const seen = new Set();
        return tests.filter(test => {
            const key = `${test.test}_${JSON.stringify(test.variables || [])}`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }
    
    /**
     * Execute statistical tests using Python subprocess
     * @param {Array} selectedTests - Tests to execute
     * @param {Object} dataInfo - Dataset information
     * @returns {Object} Test results with corrections
     */
    async executeStatisticalTests(selectedTests, dataInfo) {
        console.log(chalk.blue(`📊 Executing ${selectedTests.length} statistical tests...`));
        
        try {
            // Check cache first
            const cacheKey = this.generateCacheKey(selectedTests, dataInfo);
            if (this.cacheEnabled) {
                const cachedResults = await this.getCachedResults(cacheKey);
                if (cachedResults) {
                    console.log(chalk.green('✅ Retrieved results from cache'));
                    return cachedResults;
                }
            }
            
            // Prepare test execution parameters
            const testParams = {
                tests: selectedTests,
                data_source: dataInfo.source,
                alpha_level: this.alphaLevel,
                correction_method: this.correctionMethod,
                max_tests: this.maxTestsPerAnalysis
            };
            
            // Execute Python statistical testing script
            const pythonCommand = [
                this.pythonPath,
                this.scriptPath,
                '--input',
                JSON.stringify(testParams)
            ].join(' ');
            
            console.log(chalk.gray('🐍 Executing Python statistical testing script...'));
            const startTime = Date.now();
            
            const { stdout, stderr } = await execAsync(pythonCommand, {
                maxBuffer: 10 * 1024 * 1024, // 10MB buffer
                timeout: 300000 // 5 minute timeout
            });
            
            const executionTime = Date.now() - startTime;
            
            if (stderr) {
                console.warn(chalk.yellow('⚠️ Python warnings:'), stderr);
            }
            
            // Parse results
            const results = JSON.parse(stdout);
            
            // Enhance results with metadata
            const enhancedResults = {
                ...results,
                execution_metadata: {
                    execution_time_ms: executionTime,
                    timestamp: new Date().toISOString(),
                    alpha_level: this.alphaLevel,
                    correction_method: this.correctionMethod,
                    cache_key: cacheKey
                }
            };
            
            // Cache results
            if (this.cacheEnabled && results.success) {
                await this.cacheResults(cacheKey, enhancedResults);
            }
            
            console.log(chalk.green(`✅ Statistical tests completed in ${executionTime}ms`));
            return enhancedResults;
            
        } catch (error) {
            console.error(chalk.red('❌ Statistical testing failed:'), error.message);
            throw new Error(`Statistical testing execution failed: ${error.message}`);
        }
    }
    
    /**
     * Analyze test results and generate interpretations
     * @param {Object} testResults - Raw statistical test results
     * @param {Array} hypotheses - Original hypotheses being tested
     * @returns {Object} Interpreted results with recommendations
     */
    interpretResults(testResults, hypotheses) {
        console.log(chalk.blue('🔍 Interpreting statistical test results...'));
        
        const interpretations = {
            hypothesis_conclusions: [],
            assumption_checks: [],
            effect_sizes: [],
            recommendations: [],
            significant_findings: [],
            limitations: []
        };
        
        // Process each test result
        for (const result of testResults.test_results || []) {
            const interpretation = this.interpretSingleTest(result, hypotheses);
            this.categorizeInterpretation(interpretation, interpretations);
        }
        
        // Generate overall conclusions
        interpretations.overall_conclusion = this.generateOverallConclusion(interpretations, hypotheses);
        
        // Add methodological recommendations
        interpretations.methodological_recommendations = this.generateMethodologicalRecommendations(testResults, interpretations);
        
        console.log(chalk.green(`✅ Generated interpretations for ${testResults.test_results?.length || 0} tests`));
        return interpretations;
    }
    
    interpretSingleTest(result, hypotheses) {
        const interpretation = {
            test_name: result.test_name,
            result_type: this.classifyResultType(result),
            significance: result.p_value < this.alphaLevel,
            p_value: result.p_value,
            effect_size: result.effect_size,
            confidence_interval: result.confidence_interval,
            interpretation: '',
            recommendation: '',
            related_hypothesis: null
        };
        
        // Find related hypothesis
        interpretation.related_hypothesis = this.findRelatedHypothesis(result, hypotheses);
        
        // Generate interpretation text
        interpretation.interpretation = this.generateTestInterpretation(result, interpretation);
        
        // Generate recommendations
        interpretation.recommendation = this.generateTestRecommendation(result, interpretation);
        
        return interpretation;
    }
    
    classifyResultType(result) {
        const testName = result.test_name?.toLowerCase() || '';
        
        if (testName.includes('normality') || testName.includes('shapiro') || testName.includes('kolmogorov')) {
            return 'assumption_check';
        }
        if (testName.includes('correlation') || testName.includes('pearson') || testName.includes('spearman')) {
            return 'correlation';
        }
        if (testName.includes('t_test') || testName.includes('mann_whitney')) {
            return 'comparison';
        }
        if (testName.includes('regression')) {
            return 'regression';
        }
        if (testName.includes('chi_square') || testName.includes('fisher')) {
            return 'categorical';
        }
        if (testName.includes('effect_size') || testName.includes('cohens') || testName.includes('hedges')) {
            return 'effect_size';
        }
        
        return 'other';
    }
    
    findRelatedHypothesis(result, hypotheses) {
        const testVariables = result.variables || [];
        
        for (const hypothesis of hypotheses) {
            const hypVariables = hypothesis.variables || [];
            
            // Check if test variables match hypothesis variables
            const overlap = testVariables.filter(v => hypVariables.includes(v));
            if (overlap.length > 0) {
                return hypothesis;
            }
        }
        
        return null;
    }
    
    generateTestInterpretation(result, interpretation) {
        const { test_name, p_value, significance, effect_size } = interpretation;
        const alpha = this.alphaLevel;
        
        let text = `${test_name}: `;
        
        if (significance) {
            text += `Statistically significant result (p = ${p_value.toFixed(4)} < α = ${alpha}). `;
        } else {
            text += `Non-significant result (p = ${p_value.toFixed(4)} ≥ α = ${alpha}). `;
        }
        
        // Add effect size interpretation if available
        if (effect_size !== null && effect_size !== undefined) {
            const effectMagnitude = this.interpretEffectSize(effect_size, interpretation.result_type);
            text += `Effect size: ${effect_size.toFixed(3)} (${effectMagnitude}). `;
        }
        
        // Add confidence interval if available
        if (interpretation.confidence_interval) {
            const ci = interpretation.confidence_interval;
            text += `95% CI: [${ci.lower?.toFixed(3)}, ${ci.upper?.toFixed(3)}]. `;
        }
        
        return text.trim();
    }
    
    interpretEffectSize(effectSize, resultType) {
        const absEffect = Math.abs(effectSize);
        
        // Cohen's conventions (adjusted by test type)
        if (resultType === 'correlation') {
            if (absEffect < 0.1) return 'negligible';
            if (absEffect < 0.3) return 'small';
            if (absEffect < 0.5) return 'medium';
            return 'large';
        } else if (resultType === 'comparison') {
            if (absEffect < 0.2) return 'negligible';
            if (absEffect < 0.5) return 'small';
            if (absEffect < 0.8) return 'medium';
            return 'large';
        } else {
            if (absEffect < 0.1) return 'negligible';
            if (absEffect < 0.3) return 'small';
            if (absEffect < 0.5) return 'medium';
            return 'large';
        }
    }
    
    generateTestRecommendation(result, interpretation) {
        const { significance, result_type, related_hypothesis } = interpretation;
        
        let recommendation = '';
        
        if (result_type === 'assumption_check') {
            if (!significance) {
                recommendation = 'Assumption appears to be met. Parametric tests may be appropriate.';
            } else {
                recommendation = 'Assumption violated. Consider non-parametric alternatives or data transformation.';
            }
        } else if (related_hypothesis) {
            if (significance) {
                recommendation = `Evidence supports the hypothesis: "${related_hypothesis.statement}". Consider practical significance and replication.`;
            } else {
                recommendation = `Insufficient evidence for hypothesis: "${related_hypothesis.statement}". Consider alternative explanations or larger sample size.`;
            }
        } else {
            if (significance) {
                recommendation = 'Significant finding warrants further investigation and potential follow-up studies.';
            } else {
                recommendation = 'Non-significant result. Consider power analysis or alternative analytical approaches.';
            }
        }
        
        return recommendation;
    }
    
    categorizeInterpretation(interpretation, interpretations) {
        const { result_type, significance, related_hypothesis } = interpretation;
        
        if (related_hypothesis) {
            interpretations.hypothesis_conclusions.push(interpretation);
        }
        
        if (result_type === 'assumption_check') {
            interpretations.assumption_checks.push(interpretation);
        }
        
        if (result_type === 'effect_size') {
            interpretations.effect_sizes.push(interpretation);
        }
        
        if (significance) {
            interpretations.significant_findings.push(interpretation);
        }
        
        if (interpretation.recommendation) {
            interpretations.recommendations.push(interpretation.recommendation);
        }
    }
    
    generateOverallConclusion(interpretations, hypotheses) {
        const totalTests = interpretations.significant_findings.length + 
                          interpretations.assumption_checks.length + 
                          interpretations.effect_sizes.length;
        
        const significantCount = interpretations.significant_findings.length;
        const hypothesesTested = interpretations.hypothesis_conclusions.length;
        
        let conclusion = `Statistical analysis completed with ${totalTests} tests executed. `;
        conclusion += `${significantCount} significant findings identified. `;
        conclusion += `${hypothesesTested} hypotheses directly tested. `;
        
        // Multiple comparison adjustment note
        if (totalTests > 1) {
            conclusion += `Multiple comparison correction (${this.correctionMethod}) applied to control family-wise error rate.`;
        }
        
        return conclusion;
    }
    
    generateMethodologicalRecommendations(testResults, interpretations) {
        const recommendations = [];
        
        // Power analysis recommendation
        if (interpretations.significant_findings.length < interpretations.hypothesis_conclusions.length * 0.5) {
            recommendations.push('Consider post-hoc power analysis to evaluate if non-significant results are due to insufficient statistical power.');
        }
        
        // Effect size reporting
        if (interpretations.effect_sizes.length === 0) {
            recommendations.push('Report effect sizes alongside statistical significance to assess practical significance.');
        }
        
        // Assumption violations
        const assumptionViolations = interpretations.assumption_checks.filter(check => check.significance);
        if (assumptionViolations.length > 0) {
            recommendations.push('Address assumption violations through data transformation, non-parametric tests, or robust statistical methods.');
        }
        
        // Replication
        if (interpretations.significant_findings.length > 0) {
            recommendations.push('Replicate significant findings with independent datasets to ensure robustness of conclusions.');
        }
        
        return recommendations;
    }
    
    generateCacheKey(selectedTests, dataInfo) {
        const keyData = {
            tests: selectedTests.map(t => ({ test: t.test, variables: t.variables })),
            data_source: dataInfo.source,
            data_hash: dataInfo.hash,
            alpha: this.alphaLevel,
            correction: this.correctionMethod
        };
        
        return crypto
            .createHash('sha256')
            .update(JSON.stringify(keyData))
            .digest('hex');
    }
    
    async getCachedResults(cacheKey) {
        try {
            const cacheDir = path.join(__dirname, '../../../.cache/statistical-tests');
            const cachePath = path.join(cacheDir, `${cacheKey}.json`);
            
            const stats = await fs.stat(cachePath);
            if (Date.now() - stats.mtime.getTime() > this.cacheTTL) {
                return null; // Cache expired
            }
            
            const cached = await fs.readFile(cachePath, 'utf8');
            return JSON.parse(cached);
        } catch (error) {
            return null; // Cache miss or error
        }
    }
    
    async cacheResults(cacheKey, results) {
        try {
            const cacheDir = path.join(__dirname, '../../../.cache/statistical-tests');
            await fs.mkdir(cacheDir, { recursive: true });
            
            const cachePath = path.join(cacheDir, `${cacheKey}.json`);
            await fs.writeFile(cachePath, JSON.stringify(results, null, 2));
        } catch (error) {
            console.warn(chalk.yellow('⚠️ Failed to cache results:'), error.message);
        }
    }
    
    /**
     * Get available test categories and descriptions
     * @returns {Object} Test catalog information
     */
    getTestCatalog() {
        const catalog = {};
        
        for (const [category, tests] of Object.entries(this.testCatalog)) {
            catalog[category] = {
                category_description: this.getCategoryDescription(category),
                tests: tests.map(test => ({
                    name: test.name,
                    description: test.description,
                    assumptions: test.assumptions || [],
                    requirements: this.getTestRequirements(test)
                }))
            };
        }
        
        return catalog;
    }
    
    getCategoryDescription(category) {
        const descriptions = {
            normality: 'Tests for checking if data follows a normal distribution',
            two_sample: 'Tests for comparing means or distributions between two groups',
            multiple_groups: 'Tests for comparing multiple groups simultaneously',
            categorical: 'Tests for analyzing relationships in categorical data',
            correlation: 'Tests for measuring strength and significance of relationships',
            regression: 'Tests for evaluating regression model assumptions and significance',
            variance: 'Tests for comparing variances across groups',
            time_series: 'Tests specialized for time-ordered data analysis',
            distribution: 'Tests for comparing distributions between samples',
            effect_size: 'Measures of practical significance and effect magnitude'
        };
        
        return descriptions[category] || 'Statistical tests for data analysis';
    }
    
    getTestRequirements(test) {
        const requirements = [];
        
        if (test.min_samples) requirements.push(`Minimum samples: ${test.min_samples}`);
        if (test.max_samples) requirements.push(`Maximum samples: ${test.max_samples}`);
        if (test.min_expected) requirements.push(`Minimum expected frequency: ${test.min_expected}`);
        if (test.paired) requirements.push('Requires paired observations');
        if (test.time_series) requirements.push('Requires time-ordered data');
        if (test.multivariate) requirements.push('Requires multiple variables');
        
        return requirements;
    }
}

module.exports = StatisticalTester;