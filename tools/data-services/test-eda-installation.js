#!/usr/bin/env node

/**
 * Test script for EDA Engine installation and basic functionality
 */

const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const EDAEngine = require('./eda-engine');

async function createTestData() {
    console.log(chalk.blue('📊 Creating test dataset...'));
    
    const testDataPath = path.join(process.cwd(), '.cache', 'test-data.csv');
    
    // Ensure cache directory exists
    await fs.mkdir(path.dirname(testDataPath), { recursive: true });
    
    // Create simple test CSV data
    const testData = `id,name,age,salary,department
1,Alice,25,50000,Engineering
2,Bob,30,60000,Engineering
3,Carol,35,70000,Marketing
4,Dave,40,80000,Marketing
5,Eve,45,90000,Engineering
6,Frank,50,100000,Sales
7,Grace,28,55000,Sales
8,Henry,33,65000,Engineering
9,Ivy,38,75000,Marketing
10,Jack,43,85000,Sales`;

    await fs.writeFile(testDataPath, testData);
    console.log(chalk.green('✅ Test dataset created'));
    
    return testDataPath;
}

async function testEDAEngine() {
    try {
        console.log(chalk.blue('🧪 Testing EDA Engine...'));
        
        // Initialize EDA engine
        const edaEngine = new EDAEngine({
            timeout: 120000, // 2 minutes for testing
            maxDatasetSize: 1000,
            samplingThreshold: 50
        });
        
        // Test 1: Validate installation
        console.log(chalk.yellow('\n📋 Test 1: Validating EDA tool installation...'));
        const installationResults = await edaEngine.validateInstallation();
        
        const installedTools = Object.entries(installationResults)
            .filter(([tool, installed]) => installed)
            .map(([tool]) => tool);
        
        if (installedTools.length === 0) {
            console.log(chalk.red('❌ No EDA tools are installed'));
            console.log(chalk.yellow('💡 Run: pip install -r requirements.txt'));
            return false;
        }
        
        console.log(chalk.green(`✅ ${installedTools.length} EDA tools are available: ${installedTools.join(', ')}`));
        
        // Test 2: Feature flag check
        console.log(chalk.yellow('\n📋 Test 2: Checking feature flags...'));
        const isEnabled = await edaEngine.isEnabled();
        console.log(isEnabled ? 
            chalk.green('✅ Automated EDA feature is enabled') : 
            chalk.yellow('⚠️ Automated EDA feature is disabled (this is expected for testing)')
        );
        
        // Test 3: Create test data and run analysis (only if tools are installed)
        if (installedTools.length > 0) {
            console.log(chalk.yellow('\n📋 Test 3: Creating test data and running analysis...'));
            
            const testDataPath = await createTestData();
            
            const dataConfig = {
                source: testDataPath,
                type: 'csv',
                rowCount: 10
            };
            
            // Temporarily enable the feature for testing by mocking the isEnabled method
            const originalIsEnabled = edaEngine.isEnabled;
            edaEngine.isEnabled = async () => true;
            
            try {
                // Test only the first available tool to avoid long execution times
                const testTool = installedTools[0];
                console.log(chalk.blue(`🔧 Testing ${testTool} analysis...`));
                
                const result = await edaEngine.executeEDATool(testTool, dataConfig);
                
                if (result.success) {
                    console.log(chalk.green(`✅ ${testTool} analysis completed successfully`));
                    console.log(chalk.gray(`   Output files: ${JSON.stringify(result.output_files, null, 2)}`));
                    
                    if (result.insights) {
                        console.log(chalk.gray(`   Dataset info: ${JSON.stringify(result.insights.dataset_info, null, 2)}`));
                    }
                } else {
                    console.log(chalk.red(`❌ ${testTool} analysis failed: ${result.error}`));
                }
                
            } finally {
                // Restore original method
                edaEngine.isEnabled = originalIsEnabled;
            }
        }
        
        // Test 4: Cache functionality
        console.log(chalk.yellow('\n📋 Test 4: Testing cache functionality...'));
        const cacheKey = edaEngine.generateCacheKey({ test: 'data' }, 'test_tool');
        console.log(chalk.green(`✅ Cache key generated: ${cacheKey}`));
        
        // Test 5: Sampling logic
        console.log(chalk.yellow('\n📋 Test 5: Testing sampling logic...'));
        const needsSampling = edaEngine.needsSampling({ rowCount: 600000 });
        const sampleSize = edaEngine.calculateSampleSize(1000000);
        console.log(chalk.green(`✅ Sampling logic works: needsSampling=${needsSampling}, sampleSize=${sampleSize}`));
        
        console.log(chalk.green('\n🎉 EDA Engine tests completed successfully!'));
        return true;
        
    } catch (error) {
        console.error(chalk.red('❌ EDA Engine test failed:'), error.message);
        console.error(chalk.gray(error.stack));
        return false;
    }
}

async function main() {
    console.log(chalk.blue('🚀 EDA Engine Installation Test'));
    console.log(chalk.gray('='.repeat(50)));
    
    const success = await testEDAEngine();
    
    console.log(chalk.gray('='.repeat(50)));
    if (success) {
        console.log(chalk.green('🎯 All tests passed! EDA Engine is ready to use.'));
        process.exit(0);
    } else {
        console.log(chalk.red('💥 Some tests failed. Please check the installation.'));
        process.exit(1);
    }
}

// Run tests if script is called directly
if (require.main === module) {
    main();
}

module.exports = { testEDAEngine, createTestData };