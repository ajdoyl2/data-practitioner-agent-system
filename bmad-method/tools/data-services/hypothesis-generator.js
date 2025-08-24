#!/usr/bin/env node

/**
 * Hypothesis Generator for BMad Data Practitioner
 * Agent-based hypothesis generation from EDA reports and data insights
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const { securityLogger } = require('../lib/security-logger');
const { isFeatureEnabled } = require('../lib/feature-flag-manager');

class HypothesisGenerator {
    constructor(options = {}) {
        this.maxHypotheses = options.maxHypotheses || 10;
        this.confidenceThreshold = options.confidenceThreshold || 0.7;
        this.cachePath = options.cachePath || path.join(process.cwd(), '.cache', 'hypotheses');
        this.featureFlag = 'agent_hypothesis_generation';
        
        // Initialize cache directory
        this.initializeCacheDirectory();
        
        // Hypothesis cache
        this.hypothesisCache = new Map();
        this.maxCacheSize = options.maxCacheSize || 100;
        
        // Default agent to use for hypothesis generation
        this.defaultAgent = options.defaultAgent || 'data-analyst';
        
        // Hypothesis scoring weights
        this.scoringWeights = {
            statistical_significance: 0.3,
            business_relevance: 0.25,
            data_quality: 0.2,
            testability: 0.15,
            novelty: 0.1
        };
    }

    /**
     * Initialize cache directory
     */
    async initializeCacheDirectory() {
        try {
            await fs.mkdir(this.cachePath, { recursive: true });
        } catch (error) {
            console.error('Failed to create hypothesis cache directory:', error.message);
        }
    }

    /**
     * Check if agent-based hypothesis generation is enabled
     */
    async isEnabled() {
        try {
            return isFeatureEnabled(this.featureFlag);
        } catch (error) {
            console.warn('Feature flags not configured, agent hypothesis generation disabled by default');
            return false;
        }
    }

    /**
     * Generate hypotheses (main entry point for integration tests)
     */
    async generateHypotheses(edaResultsOrReport, options = {}) {
        // Handle both EDA results objects and file paths
        let edaReport = edaResultsOrReport;
        
        // If it's a simple EDA results object (from integration tests), wrap it
        if (edaResultsOrReport && !edaResultsOrReport.reports && !edaResultsOrReport.dataset_info) {
            edaReport = {
                dataset_info: {
                    source: 'test_data',
                    n_rows: edaResultsOrReport.summary?.total_rows || 1000,
                    n_columns: edaResultsOrReport.summary?.total_columns || 5
                },
                reports: {
                    pandas_profiling: {
                        insights: edaResultsOrReport
                    }
                }
            };
        }
        
        // For integration tests, return just the hypotheses array
        const result = await this.generateHypothesesFromEDA(edaReport, options);
        return result.hypotheses || [];
    }

    /**
     * Generate hypotheses from EDA report using BMad agents
     */
    async generateHypothesesFromEDA(edaReport, options = {}) {
        // Check feature flag
        if (!await this.isEnabled()) {
            throw new Error('Agent-based hypothesis generation is not enabled. Enable feature flag: agent_hypothesis_generation');
        }

        // Log security event
        securityLogger.logDataIngestion({
            operation: 'agent_hypothesis_generation',
            agent: options.agent || this.defaultAgent,
            dataset: edaReport.dataset_info?.source || 'unknown',
            user: options.user || process.env.USER || 'unknown',
            timestamp: new Date().toISOString()
        });

        try {
            const startTime = Date.now();

            // Check cache first
            const cacheKey = this.generateCacheKey(edaReport, options);
            const cachedResult = await this.getCachedHypotheses(cacheKey);
            if (cachedResult && !options.forceRefresh) {
                console.log(chalk.green('📊 Using cached hypothesis results'));
                return cachedResult;
            }

            // Extract key insights from EDA report
            const insights = this.extractEDAInsights(edaReport);
            
            // Generate analysis prompt for the agent
            const analysisPrompt = this.buildAnalysisPrompt(insights, options);
            
            // Create hypothesis generation task
            const hypothesisTask = await this.createHypothesisTask(analysisPrompt, options);
            
            // Execute the task using BMad agent workflow
            const agentResponse = await this.executeAgentTask(hypothesisTask, options);
            
            // Parse and structure the agent's response
            const rawHypotheses = this.parseAgentResponse(agentResponse);
            
            // Validate and rank hypotheses
            const validatedHypotheses = await this.validateHypothesesInternal(rawHypotheses, insights);
            const rankedHypotheses = this.rankHypotheses(validatedHypotheses, insights);
            
            // Limit to requested number
            const finalHypotheses = rankedHypotheses.slice(0, this.maxHypotheses);

            const result = {
                success: true,
                hypotheses: finalHypotheses,
                metadata: {
                    agent_used: options.agent || this.defaultAgent,
                    dataset_source: edaReport.dataset_info?.source,
                    generation_time_ms: Date.now() - startTime,
                    total_hypotheses: finalHypotheses.length,
                    confidence_threshold: this.confidenceThreshold,
                    timestamp: new Date().toISOString()
                },
                insights_used: insights,
                agent_response: options.includeAgentResponse ? agentResponse : undefined
            };

            // Cache result
            await this.cacheHypotheses(cacheKey, result);

            console.log(chalk.green(`✅ Generated ${finalHypotheses.length} hypotheses using ${options.agent || this.defaultAgent} agent`));

            return result;

        } catch (error) {
            console.error(chalk.red('❌ Agent-based hypothesis generation failed:'), error.message);
            throw new Error(`Failed to generate hypotheses: ${error.message}`);
        }
    }

    /**
     * Extract key insights from EDA report for hypothesis generation
     */
    extractEDAInsights(edaReport) {
        const insights = {
            dataset_overview: {},
            statistical_patterns: [],
            data_quality_issues: [],
            correlations: [],
            anomalies: [],
            distributions: [],
            summary: ''
        };

        // Extract dataset overview
        if (edaReport.dataset_info) {
            insights.dataset_overview = {
                rows: edaReport.dataset_info.n_rows,
                columns: edaReport.dataset_info.n_columns,
                memory_size: edaReport.dataset_info.memory_size,
                missing_percentage: edaReport.dataset_info.missing_percentage
            };
        }

        // Extract insights from different EDA tools
        if (edaReport.reports) {
            // Pandas profiling insights
            if (edaReport.reports.pandas_profiling?.insights) {
                const pp = edaReport.reports.pandas_profiling.insights;
                
                if (pp.correlations) {
                    insights.correlations = pp.correlations;
                }
                
                if (pp.warnings) {
                    insights.data_quality_issues = pp.warnings;
                }
                
                if (pp.summary) {
                    insights.statistical_patterns.push({
                        type: 'summary_statistics',
                        details: pp.summary
                    });
                }
            }

            // Sweetviz insights
            if (edaReport.reports.sweetviz?.insights?.associations) {
                const sv = edaReport.reports.sweetviz.insights;
                
                Object.entries(sv.associations).forEach(([var1, associations]) => {
                    Object.entries(associations).forEach(([var2, strength]) => {
                        if (Math.abs(strength) > 0.5) {
                            insights.correlations.push({
                                variable_1: var1,
                                variable_2: var2,
                                correlation: strength,
                                source: 'sweetviz'
                            });
                        }
                    });
                });
            }

            // AutoViz insights
            if (edaReport.reports.autoviz?.insights?.recommended_plots) {
                insights.distributions = edaReport.reports.autoviz.insights.recommended_plots.map(plot => ({
                    type: plot,
                    source: 'autoviz'
                }));
            }
        }

        // Create summary for agent prompt
        insights.summary = this.createInsightsSummary(insights);

        return insights;
    }

    /**
     * Create a concise summary of insights for agent prompt
     */
    createInsightsSummary(insights) {
        let summary = `Dataset Overview: ${insights.dataset_overview.rows || 'unknown'} rows, ${insights.dataset_overview.columns || 'unknown'} columns`;
        
        if (insights.dataset_overview.missing_percentage > 0) {
            summary += `, ${insights.dataset_overview.missing_percentage.toFixed(1)}% missing data`;
        }

        if (insights.correlations.length > 0) {
            summary += `\n\nKey Correlations Found:`;
            insights.correlations.slice(0, 5).forEach(corr => {
                summary += `\n- ${corr.variable_1} and ${corr.variable_2}: ${corr.correlation.toFixed(3)}`;
            });
        }

        if (insights.data_quality_issues.length > 0) {
            summary += `\n\nData Quality Issues:`;
            insights.data_quality_issues.slice(0, 3).forEach(issue => {
                summary += `\n- ${issue.type}: ${issue.column || 'multiple columns'}`;
            });
        }

        if (insights.distributions.length > 0) {
            summary += `\n\nRecommended Visualizations: ${insights.distributions.map(d => d.type).join(', ')}`;
        }

        return summary;
    }

    /**
     * Build analysis prompt for BMad agent
     */
    buildAnalysisPrompt(insights, options = {}) {
        const domain = options.domain || 'general';
        const businessContext = options.businessContext || '';
        
        const prompt = `Please analyze the following EDA results and generate testable data science hypotheses:

## EDA ANALYSIS RESULTS

${insights.summary}

## DETAILED FINDINGS

**Strong Correlations:** ${insights.correlations.length} correlations found
**Data Quality Issues:** ${insights.data_quality_issues.length} issues identified
**Statistical Patterns:** ${insights.statistical_patterns.length} patterns discovered

${businessContext ? `\n## BUSINESS CONTEXT\n${businessContext}` : ''}

## TASK

Generate 5-${this.maxHypotheses} testable hypotheses that could explain the patterns found in this data analysis. For each hypothesis, please provide:

1. **Hypothesis Statement**: A clear, testable statement
2. **Reasoning**: Why this hypothesis makes sense given the data patterns
3. **Statistical Test**: Which statistical test(s) would validate this hypothesis
4. **Expected Outcome**: What we expect to find if the hypothesis is true
5. **Business Relevance**: How relevant this is to ${domain} (scale 1-10)
6. **Confidence Level**: Your confidence in this hypothesis (0.1-1.0)
7. **Variables**: Which data columns/variables are involved
8. **Requirements**: What additional data or analysis is needed

Please focus on hypotheses that are:
- Statistically testable with the available data
- Practically relevant to the business or research domain
- Specific and actionable (not vague generalizations)
- Based on actual patterns found in the EDA results

Format your response as a structured analysis with clear hypothesis sections.`;

        return prompt;
    }

    /**
     * Create hypothesis generation task for BMad agent
     */
    async createHypothesisTask(analysisPrompt, options = {}) {
        const task = {
            type: 'hypothesis_generation',
            agent: options.agent || this.defaultAgent,
            prompt: analysisPrompt,
            parameters: {
                max_hypotheses: this.maxHypotheses,
                confidence_threshold: this.confidenceThreshold,
                domain: options.domain || 'general',
                business_context: options.businessContext || ''
            },
            metadata: {
                created_at: new Date().toISOString(),
                user: options.user || process.env.USER || 'unknown'
            }
        };

        return task;
    }

    /**
     * Execute agent task using BMad workflow patterns
     */
    async executeAgentTask(task, options = {}) {
        try {
            // This would integrate with existing BMad agent execution patterns
            // For now, we'll create a simplified version that could be enhanced
            // to use the actual BMad agent infrastructure
            
            console.log(chalk.blue(`🤖 Executing hypothesis generation task with ${task.agent} agent...`));
            
            // Simulate agent execution - in reality this would call BMad agent workflow
            // This is a placeholder that would be replaced with actual agent execution
            const mockAgentResponse = this.createMockAgentResponse(task);
            
            // TODO: Replace with actual BMad agent execution
            // const agentResponse = await this.executeBMadAgent(task.agent, task.prompt, task.parameters);
            
            return mockAgentResponse;
            
        } catch (error) {
            throw new Error(`Failed to execute agent task: ${error.message}`);
        }
    }

    /**
     * Create mock agent response (placeholder for actual BMad integration)
     */
    createMockAgentResponse(task) {
        // This is a temporary mock response that demonstrates the expected format
        // In production, this would be replaced with actual agent execution
        
        return {
            success: true,
            agent: task.agent,
            response: `Based on the EDA analysis provided, I've identified several testable hypotheses:

## Hypothesis 1: Variable Relationship Analysis
**Statement**: The strong correlation between variables suggests a causal relationship that could be leveraged for predictive modeling.
**Reasoning**: High correlation coefficients indicate potential dependency relationships.
**Statistical Test**: Pearson correlation test, regression analysis
**Expected Outcome**: Significant correlation (p < 0.05) with R² > 0.5
**Business Relevance**: 8
**Confidence Level**: 0.8
**Variables**: Primary correlated variables from EDA
**Requirements**: Time-series data to establish causality

## Hypothesis 2: Data Quality Impact Assessment
**Statement**: Missing data patterns are not random and may introduce bias in analysis results.
**Reasoning**: Data quality issues identified in EDA could affect model performance.
**Statistical Test**: Little's MCAR test, pattern analysis
**Expected Outcome**: Non-random missing data patterns
**Business Relevance**: 7
**Confidence Level**: 0.75
**Variables**: Columns with missing data
**Requirements**: Complete case analysis and imputation comparison

## Hypothesis 3: Distribution Analysis
**Statement**: Non-normal distributions indicate need for data transformation before statistical analysis.
**Reasoning**: Recommended visualizations suggest skewed or non-standard distributions.
**Statistical Test**: Shapiro-Wilk test, Kolmogorov-Smirnov test
**Expected Outcome**: Rejection of normality assumption (p < 0.05)
**Business Relevance**: 6
**Confidence Level**: 0.85
**Variables**: Numeric variables with recommended plots
**Requirements**: Distribution analysis and transformation testing`,
            metadata: {
                execution_time: 2500,
                timestamp: new Date().toISOString()
            }
        };
    }

    /**
     * Parse agent response and extract structured hypotheses
     */
    parseAgentResponse(agentResponse) {
        const hypotheses = [];
        
        try {
            const responseText = agentResponse.response || '';
            
            // Parse hypothesis sections from agent response
            const hypothesisSections = responseText.split(/## Hypothesis \d+/i).slice(1);
            
            for (let i = 0; i < hypothesisSections.length; i++) {
                const section = hypothesisSections[i];
                const hypothesis = this.extractHypothesisFromSection(section, i + 1);
                
                if (hypothesis) {
                    hypotheses.push(hypothesis);
                }
            }
            
        } catch (error) {
            console.warn('Failed to parse structured agent response, using fallback extraction');
            
            // Fallback: create basic hypotheses from response
            const fallbackHypothesis = {
                id: `h1`,
                statement: 'Agent-generated hypothesis from EDA analysis',
                reasoning: 'Based on patterns identified in exploratory data analysis',
                statistical_tests: ['correlation_test'],
                expected_outcome: 'Statistical significance in data patterns',
                significance_level: 0.05,
                business_relevance: 5,
                confidence: 0.6,
                variables_involved: ['to_be_determined'],
                data_requirements: 'Standard dataset analysis'
            };
            
            hypotheses.push(fallbackHypothesis);
        }
        
        return hypotheses;
    }

    /**
     * Extract hypothesis details from agent response section
     */
    extractHypothesisFromSection(section, index) {
        const hypothesis = {
            id: `h${index}`,
            statement: '',
            reasoning: '',
            statistical_tests: [],
            expected_outcome: '',
            significance_level: 0.05,
            business_relevance: 5,
            confidence: 0.5,
            variables_involved: [],
            data_requirements: ''
        };

        // Extract fields using regex patterns
        const patterns = {
            statement: /\*\*Statement\*\*:?\s*([^\n]+)/i,
            reasoning: /\*\*Reasoning\*\*:?\s*([^\n]+)/i,
            statistical_tests: /\*\*Statistical Test\*\*:?\s*([^\n]+)/i,
            expected_outcome: /\*\*Expected Outcome\*\*:?\s*([^\n]+)/i,
            business_relevance: /\*\*Business Relevance\*\*:?\s*(\d+)/i,
            confidence: /\*\*Confidence Level\*\*:?\s*(0?\.\d+|\d+\.\d+)/i,
            variables_involved: /\*\*Variables\*\*:?\s*([^\n]+)/i,
            data_requirements: /\*\*Requirements\*\*:?\s*([^\n]+)/i
        };

        for (const [field, pattern] of Object.entries(patterns)) {
            const match = section.match(pattern);
            if (match) {
                switch (field) {
                    case 'statistical_tests':
                        hypothesis[field] = match[1].split(',').map(test => test.trim());
                        break;
                    case 'business_relevance':
                        hypothesis[field] = parseInt(match[1]);
                        break;
                    case 'confidence':
                        hypothesis[field] = parseFloat(match[1]);
                        break;
                    case 'variables_involved':
                        hypothesis[field] = match[1].split(',').map(v => v.trim());
                        break;
                    default:
                        hypothesis[field] = match[1].trim();
                }
            }
        }

        // Ensure we have at least a statement
        if (!hypothesis.statement) {
            return null;
        }

        return hypothesis;
    }

    /**
     * Public method to validate hypotheses (for integration tests)
     */
    async validateHypotheses(hypotheses) {
        const mockInsights = { correlations: [], data_quality_issues: [] };
        return this.validateHypothesesInternal(hypotheses, mockInsights);
    }

    /**
     * Validate hypotheses for quality and testability (internal method)
     */
    async validateHypothesesInternal(hypotheses, insights) {
        const validatedHypotheses = [];

        for (const hypothesis of hypotheses) {
            const validation = {
                ...hypothesis,
                validation_score: 0,
                validation_issues: []
            };

            // Check for required fields
            if (!hypothesis.statement || hypothesis.statement.length < 10) {
                validation.validation_issues.push('Statement too short or missing');
                validation.validation_score -= 0.2;
            }

            // Check statistical tests
            if (!hypothesis.statistical_tests || hypothesis.statistical_tests.length === 0) {
                validation.validation_issues.push('No statistical tests specified');
                validation.validation_score -= 0.15;
            }

            // Check confidence level
            if (hypothesis.confidence < this.confidenceThreshold) {
                validation.validation_issues.push(`Confidence ${hypothesis.confidence} below threshold ${this.confidenceThreshold}`);
            } else {
                validation.validation_score += 0.2;
            }

            // Check business relevance
            if (hypothesis.business_relevance >= 7) {
                validation.validation_score += 0.15;
            } else if (hypothesis.business_relevance <= 3) {
                validation.validation_score -= 0.1;
            }

            // Ensure minimum validation score
            validation.validation_score = Math.max(0, validation.validation_score + 0.5);

            validatedHypotheses.push(validation);
        }

        return validatedHypotheses;
    }

    /**
     * Rank hypotheses by multiple criteria
     */
    rankHypotheses(hypotheses, insights) {
        return hypotheses.map(hypothesis => {
            let totalScore = 0;

            // Statistical significance weight
            totalScore += (hypothesis.confidence || 0.5) * this.scoringWeights.statistical_significance;

            // Business relevance weight
            totalScore += ((hypothesis.business_relevance || 5) / 10) * this.scoringWeights.business_relevance;

            // Data quality weight (based on validation score)
            totalScore += (hypothesis.validation_score || 0.5) * this.scoringWeights.data_quality;

            // Testability weight (based on statistical tests availability)
            const testabilityScore = (hypothesis.statistical_tests?.length || 0) > 0 ? 1 : 0;
            totalScore += testabilityScore * this.scoringWeights.testability;

            // Novelty weight (simple heuristic based on statement uniqueness)
            const noveltyScore = Math.min(1, (hypothesis.statement?.length || 0) / 100);
            totalScore += noveltyScore * this.scoringWeights.novelty;

            return {
                ...hypothesis,
                total_score: totalScore,
                ranking_details: {
                    statistical_significance: (hypothesis.confidence || 0.5) * this.scoringWeights.statistical_significance,
                    business_relevance: ((hypothesis.business_relevance || 5) / 10) * this.scoringWeights.business_relevance,
                    data_quality: (hypothesis.validation_score || 0.5) * this.scoringWeights.data_quality,
                    testability: testabilityScore * this.scoringWeights.testability,
                    novelty: noveltyScore * this.scoringWeights.novelty
                }
            };
        }).sort((a, b) => b.total_score - a.total_score);
    }

    /**
     * Generate cache key for hypothesis results
     */
    generateCacheKey(edaReport, options) {
        const hash = require('crypto').createHash('md5');
        const keyData = {
            dataset: edaReport.dataset_info?.source,
            agent: options.agent || this.defaultAgent,
            insights_hash: this.hashInsights(edaReport),
            options_hash: JSON.stringify(options)
        };
        hash.update(JSON.stringify(keyData));
        return hash.digest('hex');
    }

    /**
     * Hash EDA insights for cache key generation
     */
    hashInsights(edaReport) {
        const hash = require('crypto').createHash('md5');
        const relevantData = {
            dataset_info: edaReport.dataset_info,
            correlations: edaReport.reports?.pandas_profiling?.insights?.correlations,
            warnings: edaReport.reports?.pandas_profiling?.insights?.warnings
        };
        hash.update(JSON.stringify(relevantData));
        return hash.digest('hex');
    }

    /**
     * Cache hypotheses results
     */
    async cacheHypotheses(cacheKey, result) {
        try {
            // In-memory cache
            if (this.hypothesisCache.size >= this.maxCacheSize) {
                const oldestKey = this.hypothesisCache.keys().next().value;
                this.hypothesisCache.delete(oldestKey);
            }
            this.hypothesisCache.set(cacheKey, result);

            // File cache
            const cacheFile = path.join(this.cachePath, `${cacheKey}.json`);
            const cacheData = {
                ...result,
                cached_at: new Date().toISOString()
            };
            await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));

        } catch (error) {
            console.warn('Failed to cache hypotheses:', error.message);
        }
    }

    /**
     * Get cached hypotheses
     */
    async getCachedHypotheses(cacheKey) {
        try {
            // Check in-memory cache first
            if (this.hypothesisCache.has(cacheKey)) {
                return this.hypothesisCache.get(cacheKey);
            }

            // Check file cache
            const cacheFile = path.join(this.cachePath, `${cacheKey}.json`);
            const cachedData = JSON.parse(await fs.readFile(cacheFile, 'utf8'));
            
            // Check cache age (24 hours)
            const cacheAge = Date.now() - new Date(cachedData.cached_at).getTime();
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cacheAge < maxCacheAge) {
                this.hypothesisCache.set(cacheKey, cachedData);
                return cachedData;
            }

        } catch (error) {
            // Cache miss
        }

        return null;
    }

    /**
     * Clear hypothesis cache
     */
    async clearCache(maxAgeHours = 168) { // 7 days default
        try {
            // Clear in-memory cache
            this.hypothesisCache.clear();

            // Clear file cache
            const files = await fs.readdir(this.cachePath);
            const maxAge = maxAgeHours * 60 * 60 * 1000;
            let cleanedCount = 0;
            
            for (const file of files) {
                const filePath = path.join(this.cachePath, file);
                const stats = await fs.stat(filePath);
                
                if (Date.now() - stats.mtime.getTime() > maxAge) {
                    await fs.unlink(filePath);
                    cleanedCount++;
                }
            }
            
            if (cleanedCount > 0) {
                console.log(chalk.green(`🧹 Cleaned ${cleanedCount} old hypothesis cache files`));
            }
            
        } catch (error) {
            console.warn('Failed to clean hypothesis cache:', error.message);
        }
    }

    /**
     * Get available agents for hypothesis generation
     */
    getAvailableAgents() {
        return ['data-analyst', 'data-architect', 'ml-engineer', 'data-qa-engineer'];
    }

    /**
     * Switch default agent for hypothesis generation
     */
    switchAgent(newAgent) {
        if (!this.getAvailableAgents().includes(newAgent)) {
            throw new Error(`Unsupported agent: ${newAgent}. Available: ${this.getAvailableAgents().join(', ')}`);
        }

        this.defaultAgent = newAgent;
        console.log(chalk.blue(`🔄 Switched to ${newAgent} agent for hypothesis generation`));
    }
}

module.exports = HypothesisGenerator;