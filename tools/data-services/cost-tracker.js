#!/usr/bin/env node

/**
 * Cost Tracker for SQLmesh Virtual Environments
 * Calculates and tracks warehouse cost savings from virtual execution
 */

const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');
const { logger } = require('../logger');

class CostTracker {
    constructor(options = {}) {
        this.projectPath = options.projectPath || 
            path.join(process.cwd(), 'bmad-data-practitioner', 'sqlmesh-project');
        this.metricsPath = path.join(this.projectPath, '.sqlmesh', 'cost_metrics.json');
        this.costPerHour = options.costPerHour || 2.0; // Default $2/hour for compute
        this.currency = options.currency || 'USD';
    }

    /**
     * Track execution metrics
     */
    async trackExecution(environment, executionData) {
        const metrics = await this.loadMetrics();
        
        const timestamp = new Date().toISOString();
        const isVirtual = this.isVirtualEnvironment(environment);
        
        const execution = {
            timestamp,
            environment,
            isVirtual,
            physicalComputeHours: isVirtual ? 0 : executionData.computeHours || 0,
            virtualComputeHours: isVirtual ? executionData.computeHours || 0 : 0,
            dataSizeGB: executionData.dataSizeGB || 0,
            modelsProcessed: executionData.modelsProcessed || 0,
            cost: isVirtual ? 0 : (executionData.computeHours || 0) * this.costPerHour,
            savedCost: isVirtual ? (executionData.computeHours || 0) * this.costPerHour : 0
        };

        // Add to metrics
        if (!metrics.executions) {
            metrics.executions = [];
        }
        metrics.executions.push(execution);

        // Update aggregates
        await this.updateAggregates(metrics);
        
        // Save metrics
        await this.saveMetrics(metrics);
        
        return execution;
    }

    /**
     * Calculate cost savings
     */
    async calculateSavings(period = 'month') {
        const metrics = await this.loadMetrics();
        const executions = metrics.executions || [];
        
        // Filter by period
        const cutoffDate = this.getCutoffDate(period);
        const periodExecutions = executions.filter(e => 
            new Date(e.timestamp) >= cutoffDate
        );

        // Calculate totals
        const physicalHours = periodExecutions.reduce((sum, e) => 
            sum + e.physicalComputeHours, 0
        );
        const virtualHours = periodExecutions.reduce((sum, e) => 
            sum + e.virtualComputeHours, 0
        );
        const totalCost = periodExecutions.reduce((sum, e) => 
            sum + e.cost, 0
        );
        const savedCost = periodExecutions.reduce((sum, e) => 
            sum + e.savedCost, 0
        );

        // Calculate savings percentage
        const potentialCost = (physicalHours + virtualHours) * this.costPerHour;
        const savingsPercentage = potentialCost > 0 ? 
            ((savedCost / potentialCost) * 100).toFixed(1) : 0;

        return {
            period,
            physicalComputeHours: physicalHours,
            virtualComputeHours: virtualHours,
            actualCost: totalCost,
            savedCost: savedCost,
            potentialCost: potentialCost,
            savingsPercentage: parseFloat(savingsPercentage),
            currency: this.currency,
            calculatedAt: new Date().toISOString()
        };
    }

    /**
     * Generate savings report
     */
    async generateReport(options = {}) {
        const daily = await this.calculateSavings('day');
        const weekly = await this.calculateSavings('week');
        const monthly = await this.calculateSavings('month');
        const quarterly = await this.calculateSavings('quarter');

        const report = {
            summary: {
                totalSavings: monthly.savedCost,
                savingsPercentage: monthly.savingsPercentage,
                currency: this.currency
            },
            periods: {
                daily,
                weekly,
                monthly,
                quarterly
            },
            environmentBreakdown: await this.getEnvironmentBreakdown(),
            recommendations: this.generateRecommendations(monthly),
            generatedAt: new Date().toISOString()
        };

        if (options.display) {
            this.displayReport(report);
        }

        if (options.save) {
            const reportPath = path.join(this.projectPath, '.sqlmesh', 'cost_report.json');
            await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf8');
            logger.info(`Report saved to ${reportPath}`);
        }

        return report;
    }

    /**
     * Display report in console
     */
    displayReport(report) {
        console.log(chalk.bold.cyan('\n════════════════════════════════════════'));
        console.log(chalk.bold.cyan('     SQLmesh Cost Optimization Report    '));
        console.log(chalk.bold.cyan('════════════════════════════════════════\n'));

        // Summary
        console.log(chalk.bold('Summary:'));
        console.log(chalk.green(`  Total Monthly Savings: ${this.currency}${report.summary.totalSavings.toFixed(2)}`));
        console.log(chalk.green(`  Savings Percentage: ${report.summary.savingsPercentage}%`));
        console.log();

        // Period breakdown
        console.log(chalk.bold('Period Breakdown:'));
        for (const [period, data] of Object.entries(report.periods)) {
            console.log(chalk.yellow(`  ${period.charAt(0).toUpperCase() + period.slice(1)}:`));
            console.log(`    Virtual Hours: ${data.virtualComputeHours.toFixed(1)}`);
            console.log(`    Physical Hours: ${data.physicalComputeHours.toFixed(1)}`);
            console.log(`    Saved: ${this.currency}${data.savedCost.toFixed(2)} (${data.savingsPercentage}%)`);
        }
        console.log();

        // Environment breakdown
        console.log(chalk.bold('Environment Usage:'));
        for (const [env, data] of Object.entries(report.environmentBreakdown)) {
            console.log(chalk.magenta(`  ${env}:`));
            console.log(`    Executions: ${data.count}`);
            console.log(`    Compute Hours: ${data.computeHours.toFixed(1)}`);
            console.log(`    Cost: ${this.currency}${data.cost.toFixed(2)}`);
        }
        console.log();

        // Recommendations
        if (report.recommendations.length > 0) {
            console.log(chalk.bold('Recommendations:'));
            report.recommendations.forEach(rec => {
                console.log(chalk.blue(`  • ${rec}`));
            });
        }

        console.log(chalk.bold.cyan('\n════════════════════════════════════════\n'));
    }

    /**
     * Get environment breakdown
     */
    async getEnvironmentBreakdown() {
        const metrics = await this.loadMetrics();
        const executions = metrics.executions || [];
        
        const breakdown = {};
        
        for (const execution of executions) {
            const env = execution.environment;
            if (!breakdown[env]) {
                breakdown[env] = {
                    count: 0,
                    computeHours: 0,
                    cost: 0,
                    savedCost: 0
                };
            }
            
            breakdown[env].count++;
            breakdown[env].computeHours += execution.physicalComputeHours + execution.virtualComputeHours;
            breakdown[env].cost += execution.cost;
            breakdown[env].savedCost += execution.savedCost;
        }
        
        return breakdown;
    }

    /**
     * Generate recommendations based on usage patterns
     */
    generateRecommendations(monthlyData) {
        const recommendations = [];
        
        // Check savings percentage
        if (monthlyData.savingsPercentage < 30) {
            recommendations.push('Consider moving more development to virtual environments to increase savings');
        } else if (monthlyData.savingsPercentage > 50) {
            recommendations.push('Excellent cost optimization! Consider documenting your strategy for other teams');
        }
        
        // Check virtual vs physical ratio
        const virtualRatio = monthlyData.virtualComputeHours / 
            (monthlyData.virtualComputeHours + monthlyData.physicalComputeHours);
        
        if (virtualRatio < 0.5) {
            recommendations.push('Increase use of virtual environments for development and testing');
        }
        
        // Check absolute costs
        if (monthlyData.actualCost > 1000) {
            recommendations.push('High compute costs detected. Review model efficiency and consider optimization');
        }
        
        // Feature branch recommendations
        if (monthlyData.physicalComputeHours > 100) {
            recommendations.push('Use feature branch environments with auto-cleanup to reduce costs');
        }
        
        return recommendations;
    }

    /**
     * Track cost for specific model
     */
    async trackModelCost(modelName, environment, computeTime) {
        const execution = {
            model: modelName,
            computeHours: computeTime / 3600, // Convert seconds to hours
            modelsProcessed: 1
        };
        
        return await this.trackExecution(environment, execution);
    }

    /**
     * Calculate ROI for SQLmesh implementation
     */
    async calculateROI(implementationCost = 10000) {
        const quarterly = await this.calculateSavings('quarter');
        const yearlySavings = quarterly.savedCost * 4;
        
        const roi = ((yearlySavings - implementationCost) / implementationCost) * 100;
        const paybackPeriod = implementationCost / (quarterly.savedCost / 3); // Months
        
        return {
            implementationCost,
            yearlySavings,
            roi: roi.toFixed(1),
            paybackPeriodMonths: paybackPeriod.toFixed(1),
            breakEven: paybackPeriod <= 12,
            currency: this.currency
        };
    }

    /**
     * Update aggregate metrics
     */
    async updateAggregates(metrics) {
        if (!metrics.aggregates) {
            metrics.aggregates = {};
        }
        
        const executions = metrics.executions || [];
        
        metrics.aggregates.totalExecutions = executions.length;
        metrics.aggregates.totalPhysicalHours = executions.reduce((sum, e) => 
            sum + e.physicalComputeHours, 0
        );
        metrics.aggregates.totalVirtualHours = executions.reduce((sum, e) => 
            sum + e.virtualComputeHours, 0
        );
        metrics.aggregates.totalCost = executions.reduce((sum, e) => 
            sum + e.cost, 0
        );
        metrics.aggregates.totalSaved = executions.reduce((sum, e) => 
            sum + e.savedCost, 0
        );
        metrics.aggregates.lastUpdated = new Date().toISOString();
    }

    /**
     * Check if environment is virtual
     */
    isVirtualEnvironment(environment) {
        return environment === 'dev' || environment.startsWith('feature');
    }

    /**
     * Get cutoff date for period
     */
    getCutoffDate(period) {
        const now = new Date();
        
        switch(period) {
            case 'day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'quarter':
                return new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }

    /**
     * Load metrics from file
     */
    async loadMetrics() {
        try {
            const data = await fs.readFile(this.metricsPath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            // Return empty metrics if file doesn't exist
            return {
                executions: [],
                aggregates: {},
                createdAt: new Date().toISOString()
            };
        }
    }

    /**
     * Save metrics to file
     */
    async saveMetrics(metrics) {
        await fs.mkdir(path.dirname(this.metricsPath), { recursive: true });
        await fs.writeFile(this.metricsPath, JSON.stringify(metrics, null, 2), 'utf8');
    }

    /**
     * Clear metrics (for testing)
     */
    async clearMetrics() {
        const emptyMetrics = {
            executions: [],
            aggregates: {},
            createdAt: new Date().toISOString()
        };
        await this.saveMetrics(emptyMetrics);
        logger.info('Cost metrics cleared');
    }
}

module.exports = CostTracker;