/**
 * Task 7: Visualization and Dashboard Components Test Suite
 * Evidence.dev Integration Story 1.7
 * 
 * Tests for statistical visualization components, D3 integration,
 * responsive design, and chart customization workflows.
 */

const fs = require('fs');
const path = require('path');

describe('Task 7: Visualization Components', () => {
  const componentsPath = path.join(process.cwd(), 'expansion-packs', 'bmad-data-practitioner', 'evidence-project', 'components');

  describe('Evidence.dev Component Library', () => {
    test('HypothesisTestChart component exists and has correct structure', () => {
      const componentPath = path.join(componentsPath, 'HypothesisTestChart.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for essential Svelte component structure
      expect(content).toContain('<script>');
      expect(content).toContain('</script>');
      expect(content).toContain('<style>');
      expect(content).toContain('</style>');
      
      // Check for required props
      expect(content).toContain('export let data');
      expect(content).toContain('export let title');
      expect(content).toContain('export let significanceLevel');
      
      // Check for D3 scale imports
      expect(content).toContain('import { scaleLinear, scaleBand }');
      expect(content).toContain('from \'d3-scale\'');
      
      // Check for responsive design elements
      expect(content).toContain('@media (max-width: 768px)');
      
      // Check for accessibility features
      expect(content).toContain('text-anchor');
      expect(content).toContain('legend');
    });

    test('AnomalyDetectionPlot component has correct D3 integration', () => {
      const componentPath = path.join(componentsPath, 'AnomalyDetectionPlot.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for D3 time scale integration
      expect(content).toContain('import { scaleLinear, scaleTime }');
      expect(content).toContain('import { line, curveMonotoneX }');
      expect(content).toContain('import { timeParse, timeFormat }');
      
      // Check for anomaly detection logic
      expect(content).toContain('anomalyColumn');
      expect(content).toContain('anomalyPoints');
      expect(content).toContain('normalPoints');
      
      // Check for statistical information display
      expect(content).toContain('anomaly-stats');
      expect(content).toContain('Anomaly Rate');
    });

    test('CorrelationMatrix component has proper matrix visualization', () => {
      const componentPath = path.join(componentsPath, 'CorrelationMatrix.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for D3 color scale integration
      expect(content).toContain('import { interpolateRdYlBu }');
      expect(content).toContain('scaleBand');
      
      // Check for correlation matrix structure
      expect(content).toContain('correlationMatrix');
      expect(content).toContain('variables');
      
      // Check for interpretation guide
      expect(content).toContain('interpretation-guide');
      expect(content).toContain('Strong Positive');
      expect(content).toContain('Strong Negative');
    });

    test('StatisticalDashboard integrates Universal SQL queries', () => {
      const componentPath = path.join(componentsPath, 'StatisticalDashboard.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for Universal SQL query blocks
      expect(content).toContain('```sql summary_metrics');
      expect(content).toContain('```sql hypothesis_tests');
      expect(content).toContain('```sql anomaly_data');
      expect(content).toContain('```sql correlation_data');
      
      // Check for component imports
      expect(content).toContain('import HypothesisTestChart');
      expect(content).toContain('import AnomalyDetectionPlot');
      expect(content).toContain('import CorrelationMatrix');
      
      // Check for responsive dashboard grid
      expect(content).toContain('dashboard-grid');
      expect(content).toContain('dashboard-section');
    });
  });

  describe('D3 and Observable Integration', () => {
    test('D3VisualizationFrame supports multiple chart types', () => {
      const componentPath = path.join(componentsPath, 'D3VisualizationFrame.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for D3 imports
      expect(content).toContain('import * as d3 from \'d3\'');
      
      // Check for multiple visualization types
      expect(content).toContain('case \'scatter\'');
      expect(content).toContain('case \'line\'');
      expect(content).toContain('case \'bar\'');
      expect(content).toContain('case \'heatmap\'');
      
      // Check for interactive features
      expect(content).toContain('createTooltip');
      expect(content).toContain('addInteractivity');
      expect(content).toContain('zoom');
      
      // Check for responsive dimensions
      expect(content).toContain('updateDimensions');
      expect(content).toContain('resize');
    });

    test('ObservableNotebook component integrates Observable runtime', () => {
      const componentPath = path.join(componentsPath, 'ObservableNotebook.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for Observable runtime imports
      expect(content).toContain('import { Runtime, Inspector }');
      expect(content).toContain('from \'@observablehq/runtime\'');
      
      // Check for notebook integration
      expect(content).toContain('notebookUrl');
      expect(content).toContain('cellNames');
      expect(content).toContain('runtime.module');
      
      // Check for error handling
      expect(content).toContain('catch (error)');
      expect(content).toContain('error-message');
    });
  });

  describe('Responsive Design', () => {
    test('ResponsiveDataTable adapts to mobile and desktop', () => {
      const componentPath = path.join(componentsPath, 'ResponsiveDataTable.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for mobile-specific components
      expect(content).toContain('mobile-card-container');
      expect(content).toContain('mobile-card');
      expect(content).toContain('isMobile');
      
      // Check for responsive breakpoint
      expect(content).toContain('mobileBreakpoint');
      expect(content).toContain('@media (max-width: 768px)');
      
      // Check for desktop table view
      expect(content).toContain('table-container');
      expect(content).toContain('data-table');
      
      // Check for sorting and filtering
      expect(content).toContain('sortable');
      expect(content).toContain('filterable');
      expect(content).toContain('handleSort');
      expect(content).toContain('filterText');
    });

    test('All Svelte components have mobile-responsive CSS', () => {
      const componentFiles = [
        'HypothesisTestChart.svelte',
        'AnomalyDetectionPlot.svelte',
        'CorrelationMatrix.svelte',
        'StatisticalDashboard.svelte',
        'D3VisualizationFrame.svelte',
        'InteractiveDashboard.svelte',
        'ResponsiveDataTable.svelte',
        'ChartCustomization.svelte'
      ];

      componentFiles.forEach(fileName => {
        const componentPath = path.join(componentsPath, fileName);
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for mobile responsiveness
        expect(content).toContain('@media (max-width: 768px)');
        
        // Check for responsive styling approach
        const hasResponsiveDesign = 
          content.includes('grid-template-columns: repeat(auto-fit') ||
          content.includes('flex-wrap: wrap') ||
          content.includes('flex-direction: column') ||
          content.includes('grid-template-columns: 1fr') ||
          content.includes('width: 100%') ||
          content.includes('responsive') ||
          content.includes('mobile');
        
        expect(hasResponsiveDesign).toBe(true);
      });
    });
  });

  describe('Interactive Dashboard Elements', () => {
    test('InteractiveDashboard has Universal SQL integration', () => {
      const componentPath = path.join(componentsPath, 'InteractiveDashboard.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for reactive SQL queries
      expect(content).toContain('```sql kpi_metrics');
      expect(content).toContain('```sql trend_data');
      expect(content).toContain('```sql segment_analysis');
      expect(content).toContain('```sql insights_data');
      
      // Check for interactive filters
      expect(content).toContain('selectedSegment');
      expect(content).toContain('selectedDateRange');
      expect(content).toContain('selectedMetric');
      
      // Check for real-time updates
      expect(content).toContain('refreshInterval');
      expect(content).toContain('handleRefresh');
      
      // Check for dashboard sections
      expect(content).toContain('controls-section');
      expect(content).toContain('metrics-section');
      expect(content).toContain('visualization-section');
    });

    test('Dashboard has proper KPI cards and visualizations', () => {
      const componentPath = path.join(componentsPath, 'InteractiveDashboard.svelte');
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for KPI display
      expect(content).toContain('kpi-grid');
      expect(content).toContain('kpi-card');
      expect(content).toContain('kpi-value');
      
      // Check for trend analysis
      expect(content).toContain('D3VisualizationFrame');
      expect(content).toContain('visualizationType="line"');
      expect(content).toContain('visualizationType="bar"');
      expect(content).toContain('visualizationType="scatter"');
      
      // Check for anomaly detection integration
      expect(content).toContain('AnomalyDetectionPlot');
      expect(content).toContain('anomaly-section');
    });
  });

  describe('Visualization Templates', () => {
    test('VisualizationTemplates.js has comprehensive template library', () => {
      const templatesPath = path.join(componentsPath, 'VisualizationTemplates.js');
      
      expect(fs.existsSync(templatesPath)).toBe(true);
      
      const content = fs.readFileSync(templatesPath, 'utf8');
      
      // Check for template categories
      expect(content).toContain('timeSeries:');
      expect(content).toContain('distribution:');
      expect(content).toContain('comparison:');
      expect(content).toContain('relationship:');
      expect(content).toContain('cohort:');
      expect(content).toContain('anomaly:');
      expect(content).toContain('statistical:');
      
      // Check for TemplateGenerator class
      expect(content).toContain('class TemplateGenerator');
      expect(content).toContain('getTemplate(');
      expect(content).toContain('generateSQL(');
      expect(content).toContain('generateVisualization(');
      expect(content).toContain('listTemplates(');
    });

    test('Templates have proper SQL parameterization', () => {
      const templatesPath = path.join(componentsPath, 'VisualizationTemplates.js');
      const content = fs.readFileSync(templatesPath, 'utf8');
      
      // Check for parameterized SQL templates
      expect(content).toContain('{{timeframe}}');
      expect(content).toContain('{{table_name}}');
      expect(content).toContain('{{period}}');
      
      // Check for default parameters
      expect(content).toContain('defaultParams:');
      expect(content).toContain('timeframe: "day"');
      expect(content).toContain('table_name: "customer_data"');
      
      // Check for parameter replacement logic
      expect(content).toContain('Object.entries(params).forEach');
      expect(content).toContain('new RegExp(`{{${key}}}`, \'g\')');
    });

    test('Templates cover common analysis patterns', () => {
      const templatesPath = path.join(componentsPath, 'VisualizationTemplates.js');
      const content = fs.readFileSync(templatesPath, 'utf8');
      
      const expectedTemplates = [
        'revenueTrend',
        'seasonalPattern',
        'growthRate',
        'revenueDistribution',
        'ageDistribution',
        'segmentComparison',
        'geographicComparison',
        'revenueVsAge',
        'ordersVsRevenue',
        'acquisitionCohort',
        'dailyRevenueAnomalies',
        'orderCountAnomalies',
        'hypothesisTests'
      ];
      
      expectedTemplates.forEach(template => {
        expect(content).toContain(`${template}:`);
      });
    });
  });

  describe('Chart Customization and Branding', () => {
    test('ChartCustomization component has comprehensive options', () => {
      const componentPath = path.join(componentsPath, 'ChartCustomization.svelte');
      
      expect(fs.existsSync(componentPath)).toBe(true);
      
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for customization categories
      expect(content).toContain('data-tab="colors"');
      expect(content).toContain('data-tab="typography"');
      expect(content).toContain('data-tab="layout"');
      expect(content).toContain('data-tab="animation"');
      expect(content).toContain('data-tab="branding"');
      expect(content).toContain('data-tab="accessibility"');
      expect(content).toContain('data-tab="export"');
      
      // Check for color scheme options
      expect(content).toContain('colorSchemes');
      expect(content).toContain('default:');
      expect(content).toContain('warm:');
      expect(content).toContain('cool:');
      expect(content).toContain('corporate:');
      expect(content).toContain('colorBlindFriendly:');
      expect(content).toContain('highContrast:');
    });

    test('Customization supports export and import', () => {
      const componentPath = path.join(componentsPath, 'ChartCustomization.svelte');
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for export functionality
      expect(content).toContain('exportConfig');
      expect(content).toContain('JSON.stringify');
      expect(content).toContain('download');
      
      // Check for import functionality
      expect(content).toContain('importConfig');
      expect(content).toContain('JSON.parse');
      expect(content).toContain('FileReader');
      
      // Check for reset functionality
      expect(content).toContain('resetToDefaults');
    });

    test('Accessibility options are comprehensive', () => {
      const componentPath = path.join(componentsPath, 'ChartCustomization.svelte');
      const content = fs.readFileSync(componentPath, 'utf8');
      
      // Check for accessibility features
      expect(content).toContain('highContrast');
      expect(content).toContain('colorBlindFriendly');
      expect(content).toContain('altText');
      
      // Check for accessibility color schemes
      expect(content).toContain('colorBlindFriendly:');
      expect(content).toContain('highContrast:');
      
      // Check for ARIA and semantic markup considerations
      expect(content).toContain('alt text');
      expect(content).toContain('screen readers');
    });
  });

  describe('Integration and Performance', () => {
    test('All components follow Evidence.dev patterns', () => {
      const componentFiles = fs.readdirSync(componentsPath).filter(file => file.endsWith('.svelte'));
      
      componentFiles.forEach(fileName => {
        const componentPath = path.join(componentsPath, fileName);
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for Svelte component structure
        expect(content).toContain('<script>');
        expect(content).toContain('</script>');
        expect(content).toContain('<style>');
        expect(content).toContain('</style>');
        
        // Check for proper export patterns
        expect(content).toContain('export let');
        
        // Check for responsive design
        expect(content).toContain('@media');
        
        // Check for Evidence.dev compatible styling
        const hasEvidencePatterns = 
          content.includes('font-family: \'Segoe UI\'') ||
          content.includes('border-radius:') ||
          content.includes('box-shadow:');
        
        expect(hasEvidencePatterns).toBe(true);
      });
    });

    test('Components have proper error handling', () => {
      const componentFiles = [
        'D3VisualizationFrame.svelte',
        'ObservableNotebook.svelte',
        'InteractiveDashboard.svelte'
      ];

      componentFiles.forEach(fileName => {
        const componentPath = path.join(componentsPath, fileName);
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for error handling patterns
        const hasErrorHandling = 
          content.includes('try {') ||
          content.includes('catch') ||
          content.includes('error') ||
          content.includes('if (!') ||
          content.includes('return;');
        
        expect(hasErrorHandling).toBe(true);
      });
    });

    test('Performance optimizations are implemented', () => {
      const componentFiles = [
        'D3VisualizationFrame.svelte',
        'InteractiveDashboard.svelte',
        'ResponsiveDataTable.svelte'
      ];

      componentFiles.forEach(fileName => {
        const componentPath = path.join(componentsPath, fileName);
        const content = fs.readFileSync(componentPath, 'utf8');
        
        // Check for performance patterns
        const hasPerformanceOptimizations = 
          content.includes('onMount') ||
          content.includes('onDestroy') ||
          content.includes('cleanup') ||
          content.includes('removeEventListener') ||
          content.includes('transition') ||
          content.includes('debounce') ||
          content.includes('throttle');
        
        expect(hasPerformanceOptimizations).toBe(true);
      });
    });
  });

  describe('File Completeness', () => {
    test('All required visualization components exist', () => {
      const requiredComponents = [
        'HypothesisTestChart.svelte',
        'AnomalyDetectionPlot.svelte',
        'CorrelationMatrix.svelte',
        'StatisticalDashboard.svelte',
        'D3VisualizationFrame.svelte',
        'ObservableNotebook.svelte',
        'ResponsiveDataTable.svelte',
        'InteractiveDashboard.svelte',
        'VisualizationTemplates.js',
        'ChartCustomization.svelte'
      ];

      requiredComponents.forEach(component => {
        const componentPath = path.join(componentsPath, component);
        expect(fs.existsSync(componentPath)).toBe(true);
      });
    });

    test('Components have reasonable file sizes', () => {
      const componentFiles = fs.readdirSync(componentsPath);
      
      componentFiles.forEach(fileName => {
        const componentPath = path.join(componentsPath, fileName);
        const stats = fs.statSync(componentPath);
        
        // Check file is not empty and not unreasonably large
        expect(stats.size).toBeGreaterThan(100); // At least 100 bytes
        expect(stats.size).toBeLessThan(50000); // Less than 50KB per component
      });
    });
  });
});

// Integration test helper functions
function validateSvelteComponent(content) {
  const hasScript = content.includes('<script>') && content.includes('</script>');
  const hasStyle = content.includes('<style>') && content.includes('</style>');
  const hasTemplate = content.includes('<') && content.includes('>');
  
  return hasScript && hasStyle && hasTemplate;
}

function validateResponsiveDesign(content) {
  return content.includes('@media (max-width: 768px)') ||
         content.includes('responsive') ||
         content.includes('mobile');
}

function validateAccessibility(content) {
  return content.includes('alt') ||
         content.includes('aria-') ||
         content.includes('role=') ||
         content.includes('text-anchor') ||
         content.includes('screen reader');
}

module.exports = {
  validateSvelteComponent,
  validateResponsiveDesign,
  validateAccessibility
};