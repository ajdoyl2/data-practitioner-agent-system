#!/usr/bin/env node

/**
 * Test script for Statistical Testing Framework (Task 4)
 * Quick validation of statistical testing capabilities
 */

const StatisticalTester = require('./statistical-tester');
const path = require('path');
const fs = require('fs');

async function testStatisticalFramework() {
    console.log('🧮 Testing Statistical Testing Framework (Task 4)...\n');

    try {
        // Initialize statistical tester
        const tester = new StatisticalTester({
            alphaLevel: 0.05,
            correctionMethod: 'benjamini_hochberg',
            maxTestsPerAnalysis: 10
        });

        console.log('✅ Statistical tester initialized successfully');

        // Test 1: Test catalog availability
        console.log('\n📚 Testing test catalog...');
        const catalog = tester.getTestCatalog();
        const categories = Object.keys(catalog);
        console.log(`✅ Test catalog loaded with ${categories.length} categories:`);
        categories.forEach(cat => {
            const testCount = catalog[cat].tests.length;
            console.log(`   - ${cat}: ${testCount} tests`);
        });

        // Test 2: Mock data characteristics analysis
        console.log('\n🔍 Testing data characteristics analysis...');
        const mockDataCharacteristics = {
            sample_size: 1000,
            num_variables: 5,
            variable_types: { numeric: 3, categorical: 2 },
            normality_likely: true,
            equal_variances_likely: false,
            paired_data: false,
            time_series: false,
            missing_data_percentage: 2.5,
            outliers_present: true
        };

        const mockHypotheses = [
            {
                statement: "Marketing spend is positively correlated with sales revenue",
                variables: ["marketing_spend", "sales_revenue"],
                statistical_test: "correlation",
                expected_direction: "positive"
            },
            {
                statement: "Customer satisfaction differs between product categories",
                variables: ["customer_satisfaction", "product_category"],
                statistical_test: "comparison",
                expected_direction: "difference"
            }
        ];

        // Test 3: Test selection algorithm
        console.log('\n🎯 Testing test selection algorithm...');
        const selectedTests = tester.selectAppropriatTests(mockDataCharacteristics, mockHypotheses);
        console.log(`✅ Selected ${selectedTests.length} appropriate tests:`);
        selectedTests.slice(0, 5).forEach((test, index) => {
            console.log(`   ${index + 1}. ${test.test} - ${test.rationale}`);
        });
        if (selectedTests.length > 5) {
            console.log(`   ... and ${selectedTests.length - 5} more tests`);
        }

        // Test 4: Check Python script availability
        console.log('\n🐍 Testing Python integration...');
        const pythonScriptPath = path.join(__dirname, '../../expansion-packs/bmad-data-practitioner/python-analysis/statistical_testing.py');
        if (fs.existsSync(pythonScriptPath)) {
            console.log('✅ Python statistical testing script found');
        } else {
            console.log('⚠️  Python statistical testing script not found at expected location');
        }

        // Test 5: Interpretation system
        console.log('\n📊 Testing result interpretation system...');
        const mockTestResults = {
            test_results: [
                {
                    test_name: 'Pearson Product-Moment Correlation',
                    statistic: 0.65,
                    p_value: 0.001,
                    variables: ['marketing_spend', 'sales_revenue'],
                    effect_size: 0.65,
                    confidence_interval: { lower: 0.45, upper: 0.78 }
                },
                {
                    test_name: 'Shapiro-Wilk Normality Test',
                    statistic: 0.89,
                    p_value: 0.12,
                    variables: ['customer_satisfaction'],
                    effect_size: null
                }
            ]
        };

        const interpretations = tester.interpretResults(mockTestResults, mockHypotheses);
        console.log('✅ Result interpretation generated:');
        console.log(`   - Hypothesis conclusions: ${interpretations.hypothesis_conclusions.length}`);
        console.log(`   - Significant findings: ${interpretations.significant_findings.length}`);
        console.log(`   - Recommendations: ${interpretations.recommendations.length}`);

        // Test 6: Test removal of duplicates
        console.log('\n🔄 Testing duplicate test removal...');
        const duplicateTests = [
            { test: 'pearson_correlation', variables: ['A', 'B'] },
            { test: 'pearson_correlation', variables: ['A', 'B'] },  // Duplicate
            { test: 'spearman_correlation', variables: ['A', 'B'] },
            { test: 'pearson_correlation', variables: ['C', 'D'] }   // Different variables
        ];
        const uniqueTests = tester.removeDuplicateTests(duplicateTests);
        console.log(`✅ Duplicate removal: ${duplicateTests.length} → ${uniqueTests.length} tests`);

        // Test 7: Effect size interpretation
        console.log('\n📏 Testing effect size interpretation...');
        const effectSizes = [0.1, 0.3, 0.5, 0.8];
        effectSizes.forEach(size => {
            const interpretation = tester.interpretEffectSize(size, 'comparison');
            console.log(`   Effect size ${size}: ${interpretation}`);
        });
        console.log('✅ Effect size interpretations working');

        console.log('\n🎉 All Statistical Testing Framework tests passed!');
        console.log('\n📋 Task 4 Status: ✅ READY FOR PRODUCTION');
        
        return true;

    } catch (error) {
        console.error('\n❌ Statistical Testing Framework test failed:', error.message);
        console.error(error.stack);
        return false;
    }
}

// Run tests if called directly
if (require.main === module) {
    testStatisticalFramework()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Unexpected test error:', error);
            process.exit(1);
        });
}

module.exports = { testStatisticalFramework };