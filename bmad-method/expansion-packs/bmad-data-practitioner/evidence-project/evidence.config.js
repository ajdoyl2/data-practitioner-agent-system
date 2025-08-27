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
    outDir: './build',
    prerendered: true,
    // Custom styling and theming
    theme: {
      customCSS: './static/custom-styles.css',
      branding: {
        logo: '/static/bmad-logo.png',
        favicon: '/static/favicon.ico',
        colors: {
          primary: '#1e3a8a',
          secondary: '#64748b',
          accent: '#0ea5e9'
        }
      }
    },
    // Static site optimization
    optimization: {
      minify: true,
      compress: true,
      splitChunks: true,
      treeshake: true
    }
  },

  // Performance monitoring and optimization
  performance: {
    // Load time requirements
    loadTimeTarget: 3000, // 3s on 3G
    loadTimeOptimal: 1000, // 1s on WiFi
    // Interactivity requirements
    interactivityTarget: 100, // 100ms for UI interactions
    // Build time limits
    buildTimeTarget: 300000, // 5 minutes
    // Resource budgets
    bundleSize: {
      initial: 500000, // 500KB initial
      total: 2097152   // 2MB total
    }
  },

  // CDN and deployment optimization
  cdn: {
    enabled: process.env.NODE_ENV === 'production',
    // Assets that should be served from CDN
    assets: {
      images: true,
      fonts: true,
      css: true,
      js: true
    },
    // Cache headers
    cacheHeaders: {
      static: 'public, max-age=31536000, immutable', // 1 year
      dynamic: 'public, max-age=3600' // 1 hour
    }
  },

  // Security and access control
  security: {
    // Content Security Policy
    csp: {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'"],
      'style-src': ["'self'", "'unsafe-inline'"],
      'img-src': ["'self'", "data:", "https:"],
      'connect-src': ["'self'"]
    },
    // HTTP headers
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin'
    }
  },

  // Integration with BMad systems
  bmadIntegration: {
    // Web-builder integration
    webBuilderIntegration: true,
    // Asset coordination
    assetCoordination: true,
    // Build process separation
    separateBuildProcess: true,
    // Deployment workflow integration
    deploymentIntegration: {
      enabled: true,
      buildCommand: 'npm run build',
      outputDirectory: './build',
      environmentConfig: './.evidence.env'
    }
  }
};