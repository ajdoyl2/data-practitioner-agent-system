// Evidence.dev Configuration for BMad Data Practitioner Agent System
// This configuration integrates Evidence.dev with DuckDB for publication-quality reporting

module.exports = {
  // Development server configuration
  dev: {
    port: 3001,
    host: 'localhost',
    open: false // Don't auto-open browser during development
  },

  // Build configuration for static site generation
  build: {
    strict: true,
    adapter: 'static',
    outDir: './build'
  },

  // Performance monitoring
  performance: {
    // Load time requirements
    loadTimeTarget: 3000, // 3s on 3G
    // Interactivity requirements
    interactivityTarget: 100, // 100ms for UI interactions
    // Build time limits
    buildTimeTarget: 300000 // 5 minutes
  },

  // Integration with BMad systems
  bmadIntegration: {
    // Web-builder integration
    webBuilderIntegration: true,
    // Asset coordination
    assetCoordination: true,
    // Build process separation
    separateBuildProcess: true
  }
};