#!/usr/bin/env node

/**
 * Simple test for EDA Engine
 */

const EDAEngine = require('./eda-engine');
const chalk = require('chalk');

async function simpleTest() {
    try {
        console.log(chalk.blue('🧪 Testing EDA Engine initialization...'));
        
        const edaEngine = new EDAEngine({
            timeout: 60000,
            maxDatasetSize: 1000
        });
        
        console.log(chalk.green('✅ EDA Engine initialized successfully'));
        
        // Test cache key generation
        const cacheKey = edaEngine.generateCacheKey({ test: 'data' }, 'test_tool');
        console.log(chalk.green(`✅ Cache key generated: ${cacheKey.substring(0, 8)}...`));
        
        // Test sampling logic
        const needsSampling = edaEngine.needsSampling({ rowCount: 600000 });
        const sampleSize = edaEngine.calculateSampleSize(1000000);
        console.log(chalk.green(`✅ Sampling logic: needsSampling=${needsSampling}, sampleSize=${sampleSize}`));
        
        // Test feature flag check (will be false, but should not error)
        const isEnabled = await edaEngine.isEnabled();
        console.log(chalk.yellow(`⚠️ Feature enabled: ${isEnabled} (expected false without config)`));
        
        console.log(chalk.green('🎉 Basic EDA Engine tests passed!'));
        return true;
        
    } catch (error) {
        console.error(chalk.red('❌ Test failed:'), error.message);
        return false;
    }
}

simpleTest().then(success => {
    process.exit(success ? 0 : 1);
});