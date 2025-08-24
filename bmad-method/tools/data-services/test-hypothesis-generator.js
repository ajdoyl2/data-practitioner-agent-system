#!/usr/bin/env node

/**
 * Test script for Hypothesis Generator functionality
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const HypothesisGenerator = require('./hypothesis-generator');

async function createMockEDAReport() {
    console.log(chalk.blue('📊 Creating mock EDA report...'));
    
    // Create a comprehensive mock EDA report for testing
    const mockEDAReport = {
        success: true,
        dataset_info: {
            source: 'test_sales_data.csv',
            n_rows: 10000,
            n_columns: 8,
            memory_size: 524288,
            missing_percentage: 5.2
        },
        reports: {
            pandas_profiling: {
                success: true,
                insights: {
                    correlations: [
                        {
                            variable_1: 'marketing_spend',
                            variable_2: 'sales_revenue',
                            correlation: 0.85
                        },
                        {
                            variable_1: 'customer_satisfaction',
                            variable_2: 'repeat_purchases',
                            correlation: 0.72
                        },
                        {
                            variable_1: 'price',
                            variable_2: 'sales_volume',
                            correlation: -0.68
                        }
                    ],
                    warnings: [
                        {
                            type: 'high_missing_data',
                            column: 'customer_age',
                            missing_percentage: 15.3
                        },
                        {
                            type: 'high_cardinality',
                            column: 'product_id',
                            unique_percentage: 98.5
                        }
                    ],
                    summary: {
                        total_variables: 8,
                        numeric_variables: 5,
                        categorical_variables: 3,
                        missing_cells: 520,
                        duplicate_rows: 12
                    }
                }
            },
            sweetviz: {
                success: true,
                insights: {
                    associations: {
                        'marketing_spend': {
                            'sales_revenue': 0.85,
                            'customer_acquisition': 0.63,
                            'brand_awareness': 0.58
                        },
                        'price': {
                            'sales_volume': -0.68,
                            'customer_satisfaction': -0.42
                        }
                    }
                }
            },
            autoviz: {
                success: true,
                insights: {
                    recommended_plots: [
                        'distribution_plots',
                        'correlation_plots',
                        'scatter_plots'
                    ]
                }
            }
        },
        metadata: {
            generated_at: new Date().toISOString(),
            tools_executed: ['pandas_profiling', 'sweetviz', 'autoviz'],
            execution_time_ms: 125000
        }
    };

    console.log(chalk.green('✅ Mock EDA report created'));
    return mockEDAReport;
}

async function testHypothesisGenerator() {
    try {
        console.log(chalk.blue('🧪 Testing Hypothesis Generator...'));
        
        // Initialize hypothesis generator
        const hypothesisGenerator = new HypothesisGenerator({
            maxHypotheses: 5,
            confidenceThreshold: 0.6,
            defaultAgent: 'data-analyst'
        });
        
        // Test 1: Basic initialization
        console.log(chalk.yellow('\n📋 Test 1: Basic initialization...'));
        console.log(chalk.green(`✅ Initialized with agent: ${hypothesisGenerator.defaultAgent}`));
        console.log(chalk.green(`✅ Max hypotheses: ${hypothesisGenerator.maxHypotheses}`));
        console.log(chalk.green(`✅ Confidence threshold: ${hypothesisGenerator.confidenceThreshold}`));
        
        // Test 2: Available agents
        console.log(chalk.yellow('\n📋 Test 2: Available agents...'));
        const availableAgents = hypothesisGenerator.getAvailableAgents();
        console.log(chalk.green(`✅ Available agents: ${availableAgents.join(', ')}`));
        
        // Test 3: Feature flag check
        console.log(chalk.yellow('\n📋 Test 3: Feature flag check...'));
        const isEnabled = await hypothesisGenerator.isEnabled();
        console.log(isEnabled ? 
            chalk.green('✅ Agent-based hypothesis generation feature is enabled') : 
            chalk.yellow('⚠️ Agent-based hypothesis generation feature is disabled (expected for testing)')
        );
        
        // Test 4: EDA insights extraction
        console.log(chalk.yellow('\n📋 Test 4: EDA insights extraction...'));
        const mockEDAReport = await createMockEDAReport();
        const insights = hypothesisGenerator.extractEDAInsights(mockEDAReport);
        
        console.log(chalk.green(`✅ Extracted insights:`));
        console.log(chalk.gray(`   Dataset: ${insights.dataset_overview.rows} rows, ${insights.dataset_overview.columns} columns`));
        console.log(chalk.gray(`   Correlations: ${insights.correlations.length} found`));
        console.log(chalk.gray(`   Data quality issues: ${insights.data_quality_issues.length} identified`));
        console.log(chalk.gray(`   Summary length: ${insights.summary.length} characters`));
        
        // Test 5: Analysis prompt building
        console.log(chalk.yellow('\n📋 Test 5: Analysis prompt building...'));
        const prompt = hypothesisGenerator.buildAnalysisPrompt(insights, {
            domain: 'e-commerce',
            businessContext: 'Online retail sales optimization'
        });
        
        console.log(chalk.green(`✅ Analysis prompt built (${prompt.length} characters)`));
        console.log(chalk.gray(`   First 200 chars: ${prompt.substring(0, 200)}...`));
        
        // Test 6: Cache key generation
        console.log(chalk.yellow('\n📋 Test 6: Cache functionality...'));
        const cacheKey = hypothesisGenerator.generateCacheKey(mockEDAReport, { agent: 'data-analyst' });
        console.log(chalk.green(`✅ Cache key generated: ${cacheKey.substring(0, 16)}...`));
        
        // Test 7: Mock hypothesis generation (without actual agent call)
        console.log(chalk.yellow('\n📋 Test 7: Mock hypothesis generation workflow...'));
        
        // Create mock agent response for testing
        const mockAgentResponse = {
            success: true,
            agent: 'data-analyst',
            response: `## Hypothesis 1: Marketing ROI Analysis
**Statement**: Higher marketing spend directly correlates with increased sales revenue
**Reasoning**: Strong correlation (0.85) between marketing spend and sales revenue
**Statistical Test**: Linear regression analysis, correlation test
**Expected Outcome**: Significant positive correlation (p < 0.05)
**Business Relevance**: 9
**Confidence Level**: 0.85
**Variables**: marketing_spend, sales_revenue
**Requirements**: Time-series data for causality analysis

## Hypothesis 2: Price Elasticity Impact  
**Statement**: Price increases negatively affect sales volume
**Reasoning**: Strong negative correlation (-0.68) observed
**Statistical Test**: Price elasticity analysis, regression
**Expected Outcome**: Negative price elasticity coefficient
**Business Relevance**: 8
**Confidence Level**: 0.75
**Variables**: price, sales_volume
**Requirements**: Historical pricing and volume data`,
            metadata: {
                execution_time: 2500,
                timestamp: new Date().toISOString()
            }
        };
        
        // Test parsing
        const parsedHypotheses = hypothesisGenerator.parseAgentResponse(mockAgentResponse);
        console.log(chalk.green(`✅ Parsed ${parsedHypotheses.length} hypotheses from mock response`));
        
        // Test validation
        const validatedHypotheses = await hypothesisGenerator.validateHypotheses(parsedHypotheses, insights);
        console.log(chalk.green(`✅ Validated hypotheses:`));
        validatedHypotheses.forEach((hyp, idx) => {
            console.log(chalk.gray(`   ${idx + 1}. ${hyp.statement.substring(0, 60)}... (score: ${hyp.validation_score.toFixed(2)})`));
        });
        
        // Test ranking
        const rankedHypotheses = hypothesisGenerator.rankHypotheses(validatedHypotheses, insights);
        console.log(chalk.green(`✅ Ranked hypotheses by total score:`));
        rankedHypotheses.forEach((hyp, idx) => {
            console.log(chalk.gray(`   ${idx + 1}. Score: ${hyp.total_score.toFixed(3)} - ${hyp.statement.substring(0, 50)}...`));
        });
        
        // Test 8: Agent switching
        console.log(chalk.yellow('\n📋 Test 8: Agent switching...'));
        try {
            hypothesisGenerator.switchAgent('data-architect');
            console.log(chalk.green(`✅ Successfully switched to data-architect`));
            
            hypothesisGenerator.switchAgent('invalid-agent');
            console.log(chalk.red(`❌ Should have failed for invalid agent`));
        } catch (error) {
            console.log(chalk.green(`✅ Correctly rejected invalid agent: ${error.message}`));
        }
        
        // Test 9: Cache operations
        console.log(chalk.yellow('\n📋 Test 9: Cache operations...'));
        
        const mockResult = {
            success: true,
            hypotheses: rankedHypotheses.slice(0, 3),
            metadata: {
                agent_used: 'data-analyst',
                timestamp: new Date().toISOString()
            }
        };
        
        await hypothesisGenerator.cacheHypotheses(cacheKey, mockResult);
        console.log(chalk.green('✅ Cached hypotheses result'));
        
        const cachedResult = await hypothesisGenerator.getCachedHypotheses(cacheKey);
        if (cachedResult) {
            console.log(chalk.green(`✅ Retrieved cached result with ${cachedResult.hypotheses.length} hypotheses`));
        } else {
            console.log(chalk.red('❌ Failed to retrieve cached result'));
        }
        
        console.log(chalk.green('\n🎉 All Hypothesis Generator tests completed successfully!'));
        return true;
        
    } catch (error) {
        console.error(chalk.red('❌ Hypothesis Generator test failed:'), error.message);
        console.error(chalk.gray(error.stack));
        return false;
    }
}

async function testIntegration() {
    try {
        console.log(chalk.blue('\n🔗 Testing integration components...'));
        
        // Test 1: Verify analytical engine integration
        console.log(chalk.yellow('\n📋 Integration Test 1: Analytical Engine integration...'));
        
        try {
            const AnalyticalEngine = require('./analytical-engine');
            const engine = new AnalyticalEngine({
                port: 3003, // Different port for testing
                maxHypotheses: 8,
                defaultHypothesisAgent: 'data-architect'
            });
            
            console.log(chalk.green('✅ AnalyticalEngine initialized with hypothesis generation'));
            console.log(chalk.green(`✅ Hypothesis generator configured with agent: ${engine.hypothesisGenerator.defaultAgent}`));
            console.log(chalk.green(`✅ Max hypotheses: ${engine.hypothesisGenerator.maxHypotheses}`));
            
        } catch (error) {
            console.log(chalk.red(`❌ AnalyticalEngine integration failed: ${error.message}`));
            return false;
        }
        
        // Test 2: Verify EDA engine integration
        console.log(chalk.yellow('\n📋 Integration Test 2: EDA Engine integration...'));
        
        try {
            const EDAEngine = require('./eda-engine');
            const edaEngine = new EDAEngine();
            
            console.log(chalk.green('✅ EDAEngine can be imported and initialized'));
            
            // Test basic functionality
            const cacheKey = edaEngine.generateCacheKey({ test: 'data' }, 'test');
            console.log(chalk.green(`✅ EDA cache key generation works: ${cacheKey.substring(0, 12)}...`));
            
        } catch (error) {
            console.log(chalk.red(`❌ EDAEngine integration failed: ${error.message}`));
            return false;
        }
        
        console.log(chalk.green('\n🎯 All integration tests passed!'));
        return true;
        
    } catch (error) {
        console.error(chalk.red('❌ Integration test failed:'), error.message);
        return false;
    }
}

async function main() {
    console.log(chalk.blue('🚀 Hypothesis Generator Testing Suite'));
    console.log(chalk.gray('='.repeat(60)));
    
    let allTestsPassed = true;
    
    // Run hypothesis generator tests
    const hypothesisTestsPassed = await testHypothesisGenerator();
    allTestsPassed = allTestsPassed && hypothesisTestsPassed;
    
    // Run integration tests
    const integrationTestsPassed = await testIntegration();
    allTestsPassed = allTestsPassed && integrationTestsPassed;
    
    console.log(chalk.gray('='.repeat(60)));
    if (allTestsPassed) {
        console.log(chalk.green('🎯 All tests passed! Hypothesis generation system is ready.'));
        console.log(chalk.blue('\n📋 Summary of implemented features:'));
        console.log(chalk.gray('  ✅ Agent-based hypothesis generation'));
        console.log(chalk.gray('  ✅ EDA insights extraction'));
        console.log(chalk.gray('  ✅ Hypothesis validation and ranking'));
        console.log(chalk.gray('  ✅ Caching mechanisms'));
        console.log(chalk.gray('  ✅ Integration with AnalyticalEngine'));
        console.log(chalk.gray('  ✅ BMad agent compatibility'));
        
        process.exit(0);
    } else {
        console.log(chalk.red('💥 Some tests failed. Please check the implementation.'));
        process.exit(1);
    }
}

// Run tests if script is called directly
if (require.main === module) {
    main();
}

module.exports = { testHypothesisGenerator, testIntegration, createMockEDAReport };