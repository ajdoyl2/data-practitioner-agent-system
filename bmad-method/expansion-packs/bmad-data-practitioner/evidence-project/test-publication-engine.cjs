#!/usr/bin/env node

/**
 * Test script for PublicationEngine
 * Tests the complete publication generation workflow
 */

const { PublicationEngine } = require('../../../tools/data-services/publication-engine.js');
const path = require('path');

async function testPublicationEngine() {
    try {
        console.log('🔄 Initializing PublicationEngine...');
        const publicationEngine = new PublicationEngine({
            evidenceProjectPath: process.cwd(),
            duckdbPath: '.duckdb/analytics.db'
        });

        // Sample analysis results (mimics output from data analysis pipeline)
        const sampleAnalysisResults = {
            metrics: {
                totalRecords: 1250000,
                accuracyScore: 94.5,
                processingTime: 45.2
            },
            insights: [
                {
                    category: 'Automated EDA',
                    metric: 'Sample Data Pattern',
                    significance: 'High',
                    businessImpact: 'Positive trend detected in key metrics',
                    confidenceScore: 0.85
                }
            ],
            statisticalTests: [
                {
                    testName: 'T-Test: Group Comparison',
                    pValue: 0.03,
                    testStatistic: 2.45,
                    result: 'Reject null hypothesis',
                    interpretation: 'Significant difference detected between groups'
                }
            ],
            timestamp: new Date().toISOString()
        };

        // Publication configuration
        const publicationConfig = {
            title: 'BMad Data Practitioner Analysis Report',
            author: 'BMad Data Practitioner Agent System',
            template: 'publication-quality',
            exportFormats: ['html', 'pdf'],
            includeInteractive: true,
            theme: 'professional'
        };

        console.log('📊 Testing data validation...');
        const validatedData = await publicationEngine.validateAndPrepareData(sampleAnalysisResults);
        console.log('✅ Data validation successful');

        console.log('✍️  Testing narrative generation...');
        const narrative = await publicationEngine.generateNarrativeContent(validatedData, publicationConfig);
        console.log('✅ Narrative generation successful');
        console.log('📝 Narrative excerpt:', narrative.executiveSummary ? narrative.executiveSummary.substring(0, 150) + '...' : 'Template narrative generated');

        console.log('📄 Testing Evidence.dev page generation...');
        const evidencePages = await publicationEngine.generateEvidencePages(validatedData, narrative, publicationConfig);
        console.log('✅ Evidence.dev pages generated successfully');
        console.log('📁 Generated pages:', evidencePages.pages ? evidencePages.pages.length : 0, 'pages');

        console.log('🏗️  Testing static site generation...');
        const siteGeneration = await publicationEngine.executeStaticSiteGeneration(evidencePages, publicationConfig);
        console.log('✅ Static site generation successful');
        console.log('📍 Site output:', siteGeneration.buildPath);

        console.log('📦 Testing multi-format export...');
        const exports = await publicationEngine.generateMultiFormatExports(siteGeneration, publicationConfig);
        console.log('✅ Multi-format export successful');
        console.log('📁 Export formats:', Object.keys(exports.formats));

        console.log('\n🎉 PublicationEngine test completed successfully!');
        console.log('\n📋 Test Results Summary:');
        console.log(`✅ Data Validation: ${validatedData.recordCount} records validated`);
        console.log(`✅ Narrative Generation: ${narrative.sections ? narrative.sections.length : 0} sections generated`);
        console.log(`✅ Evidence Pages: ${evidencePages.pages ? evidencePages.pages.length : 0} pages created`);
        console.log(`✅ Static Site: Generated at ${siteGeneration.buildPath}`);
        console.log(`✅ Exports: ${Object.keys(exports.formats).length} formats available`);

        return {
            success: true,
            validatedData,
            narrative,
            evidencePages,
            siteGeneration,
            exports
        };

    } catch (error) {
        console.error('❌ PublicationEngine test failed:', error.message);
        console.error(error.stack);
        return { success: false, error: error.message };
    }
}

// Run test if this file is executed directly
if (require.main === module) {
    testPublicationEngine().then(result => {
        process.exit(result.success ? 0 : 1);
    });
}

module.exports = { testPublicationEngine };