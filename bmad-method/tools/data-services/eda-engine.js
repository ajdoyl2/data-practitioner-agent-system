#!/usr/bin/env node

/**
 * EDA Engine for BMad Data Practitioner
 * Automated Exploratory Data Analysis using pandas-profiling, Sweetviz, and AutoViz
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const chalk = require('chalk');
const { securityLogger } = require('../lib/security-logger');

class EDAEngine {
    constructor(options = {}) {
        this.pythonPath = options.pythonPath || 'python3';
        this.timeout = options.timeout || 600000; // 10 minutes default for EDA
        this.cachePath = options.cachePath || path.join(process.cwd(), '.cache', 'eda-reports');
        this.maxDatasetSize = options.maxDatasetSize || 1000000; // 1M rows default
        this.samplingThreshold = options.samplingThreshold || 500000; // 500K rows
        this.outputFormats = options.outputFormats || ['html', 'json'];
        this.featureFlag = 'automated_eda';
        
        // EDA tool configurations
        this.edaTools = {
            pandas_profiling: {
                enabled: true,
                explorative: true,
                title: 'BMad Data Analysis Report'
            },
            sweetviz: {
                enabled: true,
                target_feat: null,
                feat_cfg: null
            },
            autoviz: {
                enabled: true,
                max_rows: 150000,
                max_cols: 30
            }
        };

        // Initialize cache directory
        this.initializeCacheDirectory();
    }

    /**
     * Initialize cache directory
     */
    async initializeCacheDirectory() {
        try {
            await fs.mkdir(this.cachePath, { recursive: true });
        } catch (error) {
            console.error('Failed to create EDA cache directory:', error.message);
        }
    }

    /**
     * Check if automated EDA feature is enabled
     */
    async isEnabled() {
        try {
            const configPath = path.join(process.cwd(), 'config', 'feature-flags.yaml');
            const { loadYaml } = require('../lib/yaml-utils');
            const config = await loadYaml(configPath);
            return config.features && config.features[this.featureFlag] && config.features[this.featureFlag].enabled === true;
        } catch (error) {
            console.warn('Feature flags not configured, automated EDA disabled by default');
            return false;
        }
    }

    /**
     * Generate cache key for dataset
     */
    generateCacheKey(dataSourceInfo, toolName) {
        const hash = require('crypto').createHash('md5');
        hash.update(JSON.stringify(dataSourceInfo) + toolName);
        return hash.digest('hex');
    }

    /**
     * Check if cached report exists and is valid
     */
    async getCachedReport(cacheKey) {
        try {
            const cachedReportPath = path.join(this.cachePath, `${cacheKey}.json`);
            const cachedReport = JSON.parse(await fs.readFile(cachedReportPath, 'utf8'));
            
            // Check if cache is still valid (24 hours)
            const cacheAge = Date.now() - cachedReport.timestamp;
            const maxCacheAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (cacheAge < maxCacheAge) {
                console.log(chalk.green('📊 Using cached EDA report'));
                return cachedReport;
            }
        } catch (error) {
            // Cache miss or invalid cache
            return null;
        }
        
        return null;
    }

    /**
     * Save report to cache
     */
    async saveReportToCache(cacheKey, reportData) {
        try {
            const cacheFile = path.join(this.cachePath, `${cacheKey}.json`);
            const cacheData = {
                ...reportData,
                timestamp: Date.now()
            };
            await fs.writeFile(cacheFile, JSON.stringify(cacheData, null, 2));
        } catch (error) {
            console.warn('Failed to save EDA report to cache:', error.message);
        }
    }

    /**
     * Determine if dataset needs sampling
     */
    needsSampling(datasetInfo) {
        return datasetInfo.rowCount && datasetInfo.rowCount > this.samplingThreshold;
    }

    /**
     * Calculate optimal sample size
     */
    calculateSampleSize(totalRows) {
        if (totalRows <= this.samplingThreshold) {
            return totalRows;
        }
        
        // Use statistical sampling formula with 95% confidence level
        const confidenceLevel = 1.96; // 95% confidence
        const marginOfError = 0.05; // 5% margin
        const proportion = 0.5; // Maximum variance
        
        const sampleSize = Math.ceil(
            (confidenceLevel * confidenceLevel * proportion * (1 - proportion)) / 
            (marginOfError * marginOfError)
        );
        
        // Ensure we don't exceed our maximum threshold
        return Math.min(sampleSize, this.samplingThreshold);
    }

    /**
     * Execute EDA tool through Python subprocess
     */
    async executeEDATool(toolName, dataConfig, options = {}) {
        // Check feature flag
        if (!await this.isEnabled()) {
            throw new Error('Automated EDA is not enabled. Enable feature flag: automated_eda');
        }

        // Log security event
        securityLogger.logDataIngestion({
            operation: 'eda_analysis',
            tool: toolName,
            dataset: dataConfig.source,
            user: process.env.USER || 'unknown',
            timestamp: new Date().toISOString()
        });

        // Prepare Python script path
        const pythonScriptPath = path.join(
            process.cwd(), 
            'expansion-packs', 
            'bmad-data-practitioner', 
            'python-analysis', 
            'eda_automation.py'
        );

        // Prepare input configuration
        const inputConfig = {
            tool: toolName,
            data_config: dataConfig,
            tool_config: this.edaTools[toolName] || {},
            output_formats: this.outputFormats,
            cache_path: this.cachePath,
            sampling: {
                enabled: this.needsSampling(dataConfig),
                sample_size: this.calculateSampleSize(dataConfig.rowCount || this.maxDatasetSize),
                method: 'random'
            },
            ...options
        };

        return new Promise((resolve, reject) => {
            const pythonProcess = spawn(this.pythonPath, [pythonScriptPath], {
                timeout: this.timeout,
                env: { 
                    ...process.env, 
                    EDA_CONFIG: JSON.stringify(inputConfig)
                }
            });

            let stdout = '';
            let stderr = '';

            pythonProcess.stdout.on('data', (data) => {
                stdout += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                stderr += data.toString();
            });

            pythonProcess.on('error', (error) => {
                console.error(`EDA tool execution error: ${error.message}`);
                reject(new Error(`Failed to execute EDA tool ${toolName}: ${error.message}`));
            });

            pythonProcess.on('close', (code) => {
                try {
                    if (code === 0 && stdout.trim()) {
                        const result = JSON.parse(stdout);
                        
                        if (result.success) {
                            console.log(chalk.green(`✅ EDA analysis completed with ${toolName}`));
                            resolve(result);
                        } else {
                            console.error(`EDA analysis failed: ${result.error || result.stderr}`);
                            reject(new Error(result.error || result.stderr || 'Unknown error'));
                        }
                    } else {
                        reject(new Error(`EDA tool ${toolName} failed with code ${code}: ${stderr || stdout}`));
                    }
                } catch (parseError) {
                    reject(new Error(`Failed to parse EDA tool output: ${parseError.message}`));
                }
            });
        });
    }

    /**
     * Generate comprehensive EDA report using multiple tools
     */
    async generateComprehensiveReport(dataConfig, options = {}) {
        console.log(chalk.blue('🔍 Starting comprehensive EDA analysis...'));

        const cacheKey = this.generateCacheKey(dataConfig, 'comprehensive');
        
        // Check cache first
        const cachedReport = await this.getCachedReport(cacheKey);
        if (cachedReport && !options.forceRefresh) {
            return cachedReport;
        }

        const reports = {};
        const errors = {};
        const startTime = Date.now();

        // Execute enabled EDA tools in parallel
        const toolPromises = Object.keys(this.edaTools)
            .filter(tool => this.edaTools[tool].enabled)
            .map(async (tool) => {
                try {
                    console.log(chalk.yellow(`📊 Running ${tool} analysis...`));
                    const result = await this.executeEDATool(tool, dataConfig, options);
                    reports[tool] = result;
                } catch (error) {
                    console.error(chalk.red(`❌ ${tool} analysis failed: ${error.message}`));
                    errors[tool] = error.message;
                }
            });

        await Promise.all(toolPromises);

        const comprehensiveReport = {
            success: Object.keys(reports).length > 0,
            dataset_info: dataConfig,
            reports,
            errors,
            metadata: {
                generated_at: new Date().toISOString(),
                execution_time_ms: Date.now() - startTime,
                tools_executed: Object.keys(reports),
                tools_failed: Object.keys(errors),
                cache_key: cacheKey
            }
        };

        // Save to cache
        await this.saveReportToCache(cacheKey, comprehensiveReport);

        if (comprehensiveReport.success) {
            console.log(chalk.green('✅ Comprehensive EDA report generated successfully'));
        } else {
            console.warn(chalk.yellow('⚠️ EDA report generated with some tool failures'));
        }

        return comprehensiveReport;
    }

    /**
     * Extract insights from EDA reports
     */
    extractInsights(comprehensiveReport) {
        const insights = {
            key_findings: [],
            data_quality_issues: [],
            recommendations: [],
            statistical_summary: {}
        };

        // Process pandas-profiling insights
        if (comprehensiveReport.reports.pandas_profiling) {
            const ppReport = comprehensiveReport.reports.pandas_profiling;
            
            if (ppReport.insights) {
                insights.key_findings.push(...(ppReport.insights.correlations || []));
                insights.data_quality_issues.push(...(ppReport.insights.warnings || []));
                insights.statistical_summary = ppReport.insights.summary || {};
            }
        }

        // Process Sweetviz insights
        if (comprehensiveReport.reports.sweetviz) {
            const svReport = comprehensiveReport.reports.sweetviz;
            
            if (svReport.insights && svReport.insights.associations) {
                insights.key_findings.push({
                    type: 'association_analysis',
                    details: svReport.insights.associations
                });
            }
        }

        // Process AutoViz insights
        if (comprehensiveReport.reports.autoviz) {
            const avReport = comprehensiveReport.reports.autoviz;
            
            if (avReport.insights && avReport.insights.recommended_plots) {
                insights.recommendations.push({
                    type: 'visualization_recommendations',
                    details: avReport.insights.recommended_plots
                });
            }
        }

        return insights;
    }

    /**
     * Validate EDA tool installation
     */
    async validateInstallation() {
        console.log(chalk.blue('🔧 Validating EDA tool installation...'));
        
        const results = {};
        
        for (const tool of Object.keys(this.edaTools)) {
            try {
                // Try to import the Python package
                let importName = tool.replace('_', '-');
                if (tool === 'pandas_profiling') {
                    importName = 'ydata_profiling'; // pandas-profiling was renamed
                }
                
                const testProcess = spawn(this.pythonPath, ['-c', `import ${importName}; print('OK')`], {
                    timeout: 30000
                });
                
                const result = await new Promise((resolve, reject) => {
                    let stdout = '';
                    let stderr = '';
                    
                    testProcess.stdout.on('data', (data) => stdout += data.toString());
                    testProcess.stderr.on('data', (data) => stderr += data.toString());
                    
                    testProcess.on('close', (code) => {
                        resolve({ code, stdout: stdout.trim(), stderr: stderr.trim() });
                    });
                    
                    testProcess.on('error', reject);
                });
                
                results[tool] = result.code === 0 && result.stdout === 'OK';
                
                if (results[tool]) {
                    console.log(chalk.green(`✅ ${tool} is available`));
                } else {
                    console.warn(chalk.yellow(`⚠️ ${tool} is not available: ${result.stderr}`));
                }
                
            } catch (error) {
                results[tool] = false;
                console.error(chalk.red(`❌ Failed to validate ${tool}: ${error.message}`));
            }
        }
        
        const allInstalled = Object.values(results).every(installed => installed);
        
        if (allInstalled) {
            console.log(chalk.green('✅ All EDA tools are properly installed'));
        } else {
            console.warn(chalk.yellow('⚠️ Some EDA tools are missing. Run: pip install -r requirements.txt'));
        }
        
        return results;
    }

    /**
     * Run EDA analysis (alias for generateComprehensiveReport)
     */
    async runEdaAnalysis(dataConfig, options = {}) {
        if (!dataConfig) {
            throw new Error('Data configuration is required for EDA analysis');
        }
        return this.generateComprehensiveReport(dataConfig, options);
    }

    /**
     * Generate EDA report (alias for generateComprehensiveReport)
     */
    async generateEdaReport(dataConfig, options = {}) {
        return this.generateComprehensiveReport(dataConfig, options);
    }

    /**
     * Clean old cache files
     */
    async cleanCache(maxAgeHours = 168) { // 7 days default
        try {
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
                console.log(chalk.green(`🧹 Cleaned ${cleanedCount} old EDA cache files`));
            }
            
        } catch (error) {
            console.warn('Failed to clean EDA cache:', error.message);
        }
    }
}

module.exports = EDAEngine;