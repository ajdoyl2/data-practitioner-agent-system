#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Generates and analyzes test coverage reports for CI/CD integration
 */

const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class CoverageReporter {
  constructor() {
    this.coverageDir = path.join(process.cwd(), 'coverage');
    this.coverageFile = path.join(this.coverageDir, 'coverage-summary.json');
  }

  /**
   * Run tests with coverage
   */
  async runCoverage() {
    console.log(chalk.blue('Running tests with coverage...'));
    
    try {
      execSync('npm test -- --coverage --coverageReporters=json-summary --silent', {
        stdio: 'inherit'
      });
    } catch (error) {
      console.error(chalk.red('Test execution failed'));
      process.exit(1);
    }
  }

  /**
   * Load coverage summary
   */
  async loadCoverageSummary() {
    if (!await fs.pathExists(this.coverageFile)) {
      throw new Error('Coverage summary file not found');
    }
    
    return await fs.readJson(this.coverageFile);
  }

  /**
   * Generate coverage badge
   */
  generateBadge(percentage) {
    let color;
    if (percentage >= 90) color = 'brightgreen';
    else if (percentage >= 80) color = 'green';
    else if (percentage >= 70) color = 'yellow';
    else if (percentage >= 60) color = 'orange';
    else color = 'red';
    
    return {
      schemaVersion: 1,
      label: 'coverage',
      message: `${percentage}%`,
      color
    };
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(summary) {
    const total = summary.total;
    const lines = total.lines.pct;
    const statements = total.statements.pct;
    const functions = total.functions.pct;
    const branches = total.branches.pct;
    
    const report = `# Test Coverage Report

## Summary
- **Lines**: ${lines}%
- **Statements**: ${statements}%
- **Functions**: ${functions}%
- **Branches**: ${branches}%

## Detailed Coverage

| Metric | Covered | Total | Percentage |
|--------|---------|-------|------------|
| Lines | ${total.lines.covered} | ${total.lines.total} | ${lines}% |
| Statements | ${total.statements.covered} | ${total.statements.total} | ${statements}% |
| Functions | ${total.functions.covered} | ${total.functions.total} | ${functions}% |
| Branches | ${total.branches.covered} | ${total.branches.total} | ${branches}% |

Generated: ${new Date().toISOString()}
`;
    
    return report;
  }

  /**
   * Check coverage thresholds
   */
  checkThresholds(summary) {
    const thresholds = {
      lines: 80,
      statements: 80,
      functions: 80,
      branches: 80
    };
    
    const total = summary.total;
    const failures = [];
    
    Object.keys(thresholds).forEach(key => {
      if (total[key].pct < thresholds[key]) {
        failures.push(`${key}: ${total[key].pct}% (threshold: ${thresholds[key]}%)`);
      }
    });
    
    return failures;
  }

  /**
   * Generate coverage trend
   */
  async generateTrend() {
    const trendFile = path.join(this.coverageDir, 'coverage-trend.json');
    let trend = [];
    
    if (await fs.pathExists(trendFile)) {
      trend = await fs.readJson(trendFile);
    }
    
    const summary = await this.loadCoverageSummary();
    const entry = {
      date: new Date().toISOString(),
      lines: summary.total.lines.pct,
      statements: summary.total.statements.pct,
      functions: summary.total.functions.pct,
      branches: summary.total.branches.pct
    };
    
    trend.push(entry);
    
    // Keep only last 30 entries
    if (trend.length > 30) {
      trend = trend.slice(-30);
    }
    
    await fs.writeJson(trendFile, trend, { spaces: 2 });
    
    return trend;
  }

  /**
   * Generate PR comment
   */
  generatePRComment(summary, previousSummary = null) {
    const current = summary.total;
    let comment = '## 📊 Coverage Report\n\n';
    
    if (previousSummary) {
      const previous = previousSummary.total;
      
      comment += '### Coverage Changes\n\n';
      comment += '| Metric | Previous | Current | Change |\n';
      comment += '|--------|----------|---------|--------|\n';
      
      ['lines', 'statements', 'functions', 'branches'].forEach(key => {
        const prev = previous[key].pct;
        const curr = current[key].pct;
        const diff = curr - prev;
        const emoji = diff > 0 ? '📈' : diff < 0 ? '📉' : '➡️';
        const sign = diff > 0 ? '+' : '';
        
        comment += `| ${key} | ${prev}% | ${curr}% | ${emoji} ${sign}${diff.toFixed(2)}% |\n`;
      });
    } else {
      comment += '### Current Coverage\n\n';
      comment += '| Metric | Coverage |\n';
      comment += '|--------|----------|\n';
      
      ['lines', 'statements', 'functions', 'branches'].forEach(key => {
        comment += `| ${key} | ${current[key].pct}% |\n`;
      });
    }
    
    return comment;
  }

  /**
   * Main execution
   */
  async run() {
    try {
      // Run coverage
      await this.runCoverage();
      
      // Load summary
      const summary = await this.loadCoverageSummary();
      
      // Check thresholds
      const failures = this.checkThresholds(summary);
      if (failures.length > 0) {
        console.error(chalk.red('\n❌ Coverage thresholds not met:'));
        failures.forEach(f => console.error(chalk.red(`  - ${f}`)));
        process.exit(1);
      }
      
      // Generate reports
      const badge = this.generateBadge(summary.total.lines.pct);
      await fs.writeJson(path.join(this.coverageDir, 'badge.json'), badge, { spaces: 2 });
      
      const markdown = this.generateMarkdownReport(summary);
      await fs.writeFile(path.join(this.coverageDir, 'coverage-report.md'), markdown);
      
      // Generate trend
      await this.generateTrend();
      
      console.log(chalk.green('\n✅ Coverage report generated successfully'));
      console.log(chalk.blue(`   Lines: ${summary.total.lines.pct}%`));
      console.log(chalk.blue(`   Statements: ${summary.total.statements.pct}%`));
      console.log(chalk.blue(`   Functions: ${summary.total.functions.pct}%`));
      console.log(chalk.blue(`   Branches: ${summary.total.branches.pct}%`));
      
    } catch (error) {
      console.error(chalk.red('Error generating coverage report:'), error.message);
      process.exit(1);
    }
  }
}

// Run if executed directly
if (require.main === module) {
  const reporter = new CoverageReporter();
  reporter.run();
}

module.exports = CoverageReporter;