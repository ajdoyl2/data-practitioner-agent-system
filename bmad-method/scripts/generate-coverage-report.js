#!/usr/bin/env node

/**
 * Coverage Report Generator
 * Generates comprehensive test coverage reports and badges
 */

const fs = require('fs-extra');
const path = require('path');
const { execSync } = require('child_process');

class CoverageReportGenerator {
  constructor() {
    this.projectRoot = process.cwd();
    this.coverageDir = path.join(this.projectRoot, 'coverage');
    this.reportsDir = path.join(this.projectRoot, 'coverage', 'reports');
  }

  async generateReports() {
    try {
      console.log('🚀 Generating comprehensive test coverage reports...');
      
      // Ensure coverage directory exists
      await fs.ensureDir(this.coverageDir);
      await fs.ensureDir(this.reportsDir);
      
      // Run tests with coverage
      console.log('📊 Running tests with coverage collection...');
      execSync('npm test -- --coverage --passWithNoTests', { 
        stdio: 'inherit',
        cwd: this.projectRoot 
      });
      
      // Generate additional reports
      await this.generateSummaryReport();
      await this.generateBadges();
      await this.generateTrendData();
      
      console.log('✅ Coverage reports generated successfully!');
      console.log(`📁 Reports available in: ${this.reportsDir}`);
      
    } catch (error) {
      console.error('❌ Failed to generate coverage reports:', error.message);
      process.exit(1);
    }
  }

  async generateSummaryReport() {
    try {
      const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
      
      if (await fs.pathExists(coverageSummaryPath)) {
        const coverageData = await fs.readJson(coverageSummaryPath);
        
        const summary = {
          timestamp: new Date().toISOString(),
          total: coverageData.total,
          byCategory: this.categorizeCoverage(coverageData),
          thresholds: {
            global: { lines: 80, functions: 80, branches: 80, statements: 80 },
            tools: { lines: 85, functions: 85, branches: 85, statements: 85 }
          }
        };
        
        await fs.writeJson(
          path.join(this.reportsDir, 'coverage-summary-enhanced.json'),
          summary,
          { spaces: 2 }
        );
        
        // Generate human-readable report
        await this.generateReadableReport(summary);
        
        console.log('📝 Enhanced coverage summary generated');
      }
    } catch (error) {
      console.warn('⚠️  Could not generate summary report:', error.message);
    }
  }

  categorizeCoverage(coverageData) {
    const categories = {
      tools: {},
      agents: {},
      storage: {},
      integration: {},
      other: {}
    };

    Object.entries(coverageData).forEach(([file, data]) => {
      if (file === 'total') return;
      
      if (file.includes('tools/')) {
        categories.tools[file] = data;
      } else if (file.includes('agent') || file.includes('bmad-core/')) {
        categories.agents[file] = data;
      } else if (file.includes('storage') || file.includes('config')) {
        categories.storage[file] = data;
      } else if (file.includes('integration') || file.includes('test')) {
        categories.integration[file] = data;
      } else {
        categories.other[file] = data;
      }
    });

    return categories;
  }

  async generateReadableReport(summary) {
    const report = `# Test Coverage Report

Generated: ${new Date(summary.timestamp).toLocaleString()}

## Overall Coverage

| Metric | Coverage | Threshold | Status |
|--------|----------|-----------|--------|
| Lines | ${summary.total.lines.pct}% | 80% | ${summary.total.lines.pct >= 80 ? '✅' : '❌'} |
| Functions | ${summary.total.functions.pct}% | 80% | ${summary.total.functions.pct >= 80 ? '✅' : '❌'} |
| Branches | ${summary.total.branches.pct}% | 80% | ${summary.total.branches.pct >= 80 ? '✅' : '❌'} |
| Statements | ${summary.total.statements.pct}% | 80% | ${summary.total.statements.pct >= 80 ? '✅' : '❌'} |

## Coverage by Category

### Tools (Target: 85%)
${this.formatCategoryTable(summary.byCategory.tools, 85)}

### Agents & Workflows (Target: 80%)
${this.formatCategoryTable(summary.byCategory.agents, 80)}

### Storage & Configuration (Target: 80%)
${this.formatCategoryTable(summary.byCategory.storage, 80)}

### Integration Tests (Target: 70%)
${this.formatCategoryTable(summary.byCategory.integration, 70)}

## Files Below Threshold

${this.findFilesBelowThreshold(summary.byCategory)}

## Recommendations

${this.generateRecommendations(summary)}
`;

    await fs.writeFile(
      path.join(this.reportsDir, 'coverage-report.md'),
      report,
      'utf8'
    );
  }

  formatCategoryTable(categoryData, threshold) {
    if (Object.keys(categoryData).length === 0) {
      return 'No files in this category.';
    }

    let table = '| File | Lines | Functions | Branches | Statements |\n';
    table += '|------|-------|-----------|----------|------------|\n';

    Object.entries(categoryData).forEach(([file, data]) => {
      const fileName = path.basename(file);
      const linesStatus = data.lines.pct >= threshold ? '✅' : '❌';
      const functionsStatus = data.functions.pct >= threshold ? '✅' : '❌';
      const branchesStatus = data.branches.pct >= threshold ? '✅' : '❌';
      const statementsStatus = data.statements.pct >= threshold ? '✅' : '❌';
      
      table += `| ${fileName} | ${data.lines.pct}% ${linesStatus} | ${data.functions.pct}% ${functionsStatus} | ${data.branches.pct}% ${branchesStatus} | ${data.statements.pct}% ${statementsStatus} |\n`;
    });

    return table;
  }

  findFilesBelowThreshold(categories) {
    const belowThreshold = [];
    
    Object.entries(categories).forEach(([category, files]) => {
      const threshold = category === 'tools' ? 85 : 80;
      
      Object.entries(files).forEach(([file, data]) => {
        if (data.lines.pct < threshold || data.functions.pct < threshold) {
          belowThreshold.push({
            file: path.basename(file),
            category,
            lines: data.lines.pct,
            functions: data.functions.pct,
            threshold
          });
        }
      });
    });

    if (belowThreshold.length === 0) {
      return 'All files meet their coverage thresholds! 🎉';
    }

    let table = '| File | Category | Lines | Functions | Threshold |\n';
    table += '|------|----------|-------|-----------|----------|\n';

    belowThreshold.forEach(file => {
      table += `| ${file.file} | ${file.category} | ${file.lines}% | ${file.functions}% | ${file.threshold}% |\n`;
    });

    return table;
  }

  generateRecommendations(summary) {
    const recommendations = [];
    
    if (summary.total.lines.pct < 80) {
      recommendations.push('📈 **Increase line coverage**: Add more unit tests to cover uncovered code paths');
    }
    
    if (summary.total.functions.pct < 80) {
      recommendations.push('🔧 **Improve function coverage**: Ensure all public functions have corresponding tests');
    }
    
    if (summary.total.branches.pct < 80) {
      recommendations.push('🌿 **Test edge cases**: Add tests for conditional branches and error handling paths');
    }

    // Category-specific recommendations
    const toolsCoverage = this.calculateCategoryCoverage(summary.byCategory.tools);
    if (toolsCoverage.lines < 85) {
      recommendations.push('🛠️ **Tools coverage priority**: CLI tools should maintain 85% coverage minimum');
    }

    if (recommendations.length === 0) {
      return 'Excellent coverage! Consider:\n- Adding integration tests\n- Testing error scenarios\n- Performance testing';
    }

    return recommendations.join('\n');
  }

  calculateCategoryCoverage(categoryData) {
    if (Object.keys(categoryData).length === 0) {
      return { lines: 0, functions: 0, branches: 0, statements: 0 };
    }

    const totals = Object.values(categoryData).reduce((acc, data) => {
      acc.lines += data.lines.covered;
      acc.linesTotal += data.lines.total;
      acc.functions += data.functions.covered;
      acc.functionsTotal += data.functions.total;
      acc.branches += data.branches.covered;
      acc.branchesTotal += data.branches.total;
      acc.statements += data.statements.covered;
      acc.statementsTotal += data.statements.total;
      return acc;
    }, {
      lines: 0, linesTotal: 0,
      functions: 0, functionsTotal: 0,
      branches: 0, branchesTotal: 0,
      statements: 0, statementsTotal: 0
    });

    return {
      lines: Math.round((totals.lines / totals.linesTotal) * 100),
      functions: Math.round((totals.functions / totals.functionsTotal) * 100),
      branches: Math.round((totals.branches / totals.branchesTotal) * 100),
      statements: Math.round((totals.statements / totals.statementsTotal) * 100)
    };
  }

  async generateBadges() {
    try {
      const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
      
      if (await fs.pathExists(coverageSummaryPath)) {
        const coverageData = await fs.readJson(coverageSummaryPath);
        const { total } = coverageData;
        
        const badges = {
          lines: this.createBadgeData('coverage-lines', total.lines.pct, 80),
          functions: this.createBadgeData('coverage-functions', total.functions.pct, 80),
          branches: this.createBadgeData('coverage-branches', total.branches.pct, 80),
          statements: this.createBadgeData('coverage-statements', total.statements.pct, 80)
        };
        
        await fs.writeJson(
          path.join(this.reportsDir, 'coverage-badges.json'),
          badges,
          { spaces: 2 }
        );
        
        // Generate badge URLs for README
        const badgeUrls = Object.entries(badges).map(([type, data]) => {
          const color = data.color;
          const percentage = data.message;
          return `![${type}](https://img.shields.io/badge/${type}-${percentage}-${color})`;
        }).join('\n');
        
        await fs.writeFile(
          path.join(this.reportsDir, 'coverage-badges.md'),
          `# Coverage Badges\n\n${badgeUrls}`,
          'utf8'
        );
        
        console.log('🏆 Coverage badges generated');
      }
    } catch (error) {
      console.warn('⚠️  Could not generate badges:', error.message);
    }
  }

  createBadgeData(label, percentage, threshold) {
    let color;
    if (percentage >= 90) color = 'brightgreen';
    else if (percentage >= threshold) color = 'green';
    else if (percentage >= threshold - 10) color = 'yellow';
    else color = 'red';

    return {
      schemaVersion: 1,
      label,
      message: `${percentage}%`,
      color
    };
  }

  async generateTrendData() {
    try {
      const coverageSummaryPath = path.join(this.coverageDir, 'coverage-summary.json');
      const trendPath = path.join(this.reportsDir, 'coverage-trend.json');
      
      if (await fs.pathExists(coverageSummaryPath)) {
        const coverageData = await fs.readJson(coverageSummaryPath);
        
        let trendData = [];
        if (await fs.pathExists(trendPath)) {
          trendData = await fs.readJson(trendPath);
        }
        
        const newEntry = {
          timestamp: new Date().toISOString(),
          coverage: coverageData.total
        };
        
        trendData.push(newEntry);
        
        // Keep only last 30 entries
        if (trendData.length > 30) {
          trendData = trendData.slice(-30);
        }
        
        await fs.writeJson(trendPath, trendData, { spaces: 2 });
        
        console.log('📈 Coverage trend data updated');
      }
    } catch (error) {
      console.warn('⚠️  Could not update trend data:', error.message);
    }
  }
}

// CLI execution
if (require.main === module) {
  const generator = new CoverageReportGenerator();
  generator.generateReports().catch(error => {
    console.error('Failed to generate coverage reports:', error);
    process.exit(1);
  });
}

module.exports = CoverageReportGenerator;