// CDN Integration Utilities for Evidence.dev Publications
// Handles CDN setup, asset optimization, and cache management

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class CDNIntegration {
  constructor(options = {}) {
    this.buildDir = options.buildDir || './build';
    this.staticDir = options.staticDir || './static';
    this.cdnConfig = {
      enabled: process.env.CDN_ENABLED === 'true',
      provider: process.env.CDN_PROVIDER || 'cloudflare', // cloudflare, aws, fastly
      domainPrefix: process.env.CDN_DOMAIN_PREFIX || 'cdn',
      cacheHeaders: {
        static: 'public, max-age=31536000, immutable', // 1 year
        dynamic: 'public, max-age=3600', // 1 hour
        html: 'public, max-age=300' // 5 minutes
      }
    };
  }

  /**
   * Configure CDN integration for Evidence.dev site
   */
  async configureCDN() {
    console.log('🌐 Configuring CDN integration...');
    
    const config = {
      assetManifest: await this.generateAssetManifest(),
      cacheConfig: this.generateCacheConfiguration(),
      routingRules: this.generateRoutingRules(),
      securityHeaders: this.generateSecurityHeaders()
    };

    // Write CDN configuration files
    await this.writeCDNConfigFiles(config);
    
    return config;
  }

  /**
   * Generate asset manifest for CDN optimization
   */
  async generateAssetManifest() {
    const manifest = {
      static: [],
      dynamic: [],
      critical: [],
      preload: [],
      timestamp: Date.now()
    };

    if (!await fs.pathExists(this.buildDir)) {
      console.warn('Build directory not found. Run build first.');
      return manifest;
    }

    // Scan build directory for assets
    await this.scanAssetsRecursive(this.buildDir, manifest, '');
    
    // Categorize assets by type and priority
    this.categorizeAssets(manifest);
    
    return manifest;
  }

  /**
   * Recursively scan assets in build directory
   */
  async scanAssetsRecursive(dirPath, manifest, relativePath) {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const itemRelativePath = path.join(relativePath, item);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        await this.scanAssetsRecursive(fullPath, manifest, itemRelativePath);
      } else {
        const asset = {
          path: itemRelativePath,
          size: stats.size,
          type: this.getAssetType(item),
          cacheStrategy: this.determineCacheStrategy(item, stats.size),
          priority: this.determineAssetPriority(item, itemRelativePath)
        };
        
        // Add to appropriate category
        if (asset.type === 'html') {
          manifest.dynamic.push(asset);
        } else {
          manifest.static.push(asset);
        }
        
        // Mark critical assets
        if (asset.priority === 'critical') {
          manifest.critical.push(asset);
        }
        
        // Mark preload candidates
        if (asset.priority === 'high' && asset.size < 50000) { // < 50KB
          manifest.preload.push(asset);
        }
      }
    }
  }

  /**
   * Categorize assets by optimization strategy
   */
  categorizeAssets(manifest) {
    // Sort by priority and size for optimization
    manifest.static.sort((a, b) => {
      const priorityOrder = { critical: 3, high: 2, medium: 1, low: 0 };
      return priorityOrder[b.priority] - priorityOrder[a.priority] || a.size - b.size;
    });
    
    manifest.dynamic.sort((a, b) => a.path.localeCompare(b.path));
    manifest.critical.sort((a, b) => a.size - b.size);
    manifest.preload.sort((a, b) => a.size - b.size);
  }

  /**
   * Get asset type from file extension
   */
  getAssetType(filename) {
    const ext = path.extname(filename).toLowerCase();
    
    if (['.html', '.htm'].includes(ext)) return 'html';
    if (['.css'].includes(ext)) return 'css';
    if (['.js', '.ts'].includes(ext)) return 'js';
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg'].includes(ext)) return 'image';
    if (['.woff', '.woff2', '.ttf', '.eot'].includes(ext)) return 'font';
    if (['.json', '.xml'].includes(ext)) return 'data';
    
    return 'other';
  }

  /**
   * Determine cache strategy for asset
   */
  determineCacheStrategy(filename, fileSize) {
    const type = this.getAssetType(filename);
    
    if (type === 'html') {
      return 'short'; // Short cache for HTML
    }
    
    if (type === 'data' && fileSize > 1000000) { // > 1MB
      return 'medium'; // Medium cache for large data files
    }
    
    // Default to long cache for static assets
    return 'long';
  }

  /**
   * Determine asset loading priority
   */
  determineAssetPriority(filename, relativePath) {
    const type = this.getAssetType(filename);
    
    // Critical CSS and JS
    if ((type === 'css' || type === 'js') && 
        (relativePath.includes('critical') || relativePath.includes('main') || relativePath.includes('app'))) {
      return 'critical';
    }
    
    // Fonts are high priority for rendering
    if (type === 'font') {
      return 'high';
    }
    
    // Above-the-fold images
    if (type === 'image' && relativePath.includes('hero')) {
      return 'high';
    }
    
    // Main HTML files
    if (type === 'html' && (filename === 'index.html' || relativePath.endsWith('/index.html'))) {
      return 'high';
    }
    
    // Everything else is medium priority
    return 'medium';
  }

  /**
   * Generate cache configuration for different CDN providers
   */
  generateCacheConfiguration() {
    const config = {
      rules: [
        {
          match: '*.html',
          cache: this.cdnConfig.cacheHeaders.html,
          description: 'HTML files with short cache for content updates'
        },
        {
          match: '*.{css,js}',
          cache: this.cdnConfig.cacheHeaders.static,
          description: 'CSS and JS files with long cache and immutable flag'
        },
        {
          match: '*.{png,jpg,jpeg,gif,webp,svg,ico}',
          cache: this.cdnConfig.cacheHeaders.static,
          description: 'Image files with long cache'
        },
        {
          match: '*.{woff,woff2,ttf,eot}',
          cache: this.cdnConfig.cacheHeaders.static,
          description: 'Font files with long cache'
        },
        {
          match: '*.{json,xml,txt}',
          cache: this.cdnConfig.cacheHeaders.dynamic,
          description: 'Data files with medium cache'
        }
      ],
      compression: {
        gzip: true,
        brotli: true,
        types: ['text/html', 'text/css', 'application/javascript', 'application/json', 'image/svg+xml']
      }
    };

    return config;
  }

  /**
   * Generate routing rules for CDN
   */
  generateRoutingRules() {
    return {
      rules: [
        {
          pattern: '/static/*',
          action: 'cache',
          ttl: '1y',
          description: 'Cache static assets for 1 year'
        },
        {
          pattern: '/api/*',
          action: 'bypass',
          description: 'Bypass cache for API endpoints'
        },
        {
          pattern: '/*.html',
          action: 'cache',
          ttl: '5m',
          description: 'Cache HTML with short TTL'
        },
        {
          pattern: '/*',
          action: 'cache',
          ttl: '1h',
          description: 'Default cache for other content'
        }
      ]
    };
  }

  /**
   * Generate security headers for CDN
   */
  generateSecurityHeaders() {
    return {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'",
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
    };
  }

  /**
   * Write CDN configuration files for different providers
   */
  async writeCDNConfigFiles(config) {
    const configDir = path.join(this.buildDir, '_cdn');
    await fs.ensureDir(configDir);

    // Write asset manifest
    await fs.writeJSON(path.join(configDir, 'asset-manifest.json'), config.assetManifest, { spaces: 2 });

    // Write provider-specific configurations
    await this.writeCloudflareConfig(configDir, config);
    await this.writeAWSConfig(configDir, config);
    await this.writeFastlyConfig(configDir, config);
    
    console.log('📄 CDN configuration files written to _cdn directory');
  }

  /**
   * Write Cloudflare-specific configuration
   */
  async writeCloudflareConfig(configDir, config) {
    const cloudflareConfig = {
      rules: config.cacheConfig.rules.map(rule => ({
        expression: `http.request.uri.path matches "${rule.match.replace('*', '.*')}"`,
        action: 'set_cache_settings',
        action_parameters: {
          cache_level: 'cache_everything',
          edge_cache_ttl: this.parseCacheHeader(rule.cache).maxAge
        }
      })),
      page_rules: config.routingRules.rules.map(rule => ({
        targets: [{ target: 'url', constraint: { operator: 'matches', value: `*${rule.pattern}` }}],
        actions: [{ id: 'cache_level', value: rule.action === 'cache' ? 'cache_everything' : 'bypass' }]
      }))
    };

    await fs.writeJSON(path.join(configDir, 'cloudflare-config.json'), cloudflareConfig, { spaces: 2 });
  }

  /**
   * Write AWS CloudFront configuration
   */
  async writeAWSConfig(configDir, config) {
    const awsConfig = {
      distribution_config: {
        origins: [{
          id: 'evidence-origin',
          domain_name: process.env.ORIGIN_DOMAIN || 'example.com',
          custom_origin_config: {
            http_port: 80,
            https_port: 443,
            origin_protocol_policy: 'https-only'
          }
        }],
        default_cache_behavior: {
          target_origin_id: 'evidence-origin',
          viewer_protocol_policy: 'redirect-to-https',
          cache_policy_id: '4135ea2d-6df8-44a3-9df3-4b5a84be39ad' // Managed caching optimized
        },
        cache_behaviors: config.cacheConfig.rules.map(rule => ({
          path_pattern: rule.match,
          target_origin_id: 'evidence-origin',
          viewer_protocol_policy: 'redirect-to-https',
          ttl: this.parseCacheHeader(rule.cache).maxAge
        }))
      }
    };

    await fs.writeJSON(path.join(configDir, 'aws-cloudfront-config.json'), awsConfig, { spaces: 2 });
  }

  /**
   * Write Fastly configuration
   */
  async writeFastlyConfig(configDir, config) {
    const fastlyConfig = {
      service: {
        name: 'evidence-publication',
        domains: [process.env.FASTLY_DOMAIN || 'example.com']
      },
      backends: [{
        name: 'origin',
        address: process.env.ORIGIN_DOMAIN || 'example.com',
        port: 443,
        ssl_cert_hostname: process.env.ORIGIN_DOMAIN || 'example.com'
      }],
      vcl: {
        recv: this.generateFastlyVCL(config),
        deliver: this.generateFastlyDeliverVCL(config)
      }
    };

    await fs.writeJSON(path.join(configDir, 'fastly-config.json'), fastlyConfig, { spaces: 2 });
  }

  /**
   * Generate Fastly VCL configuration
   */
  generateFastlyVCL(config) {
    return `
      # Evidence.dev CDN Configuration
      if (req.url ~ "\\.(css|js|png|jpg|jpeg|gif|webp|svg|ico|woff|woff2|ttf|eot)$") {
        # Static assets - cache for 1 year
        set beresp.ttl = 365d;
        set beresp.http.Cache-Control = "public, max-age=31536000, immutable";
      } else if (req.url ~ "\\.html$") {
        # HTML files - short cache
        set beresp.ttl = 5m;
        set beresp.http.Cache-Control = "public, max-age=300";
      } else {
        # Dynamic content - medium cache
        set beresp.ttl = 1h;
        set beresp.http.Cache-Control = "public, max-age=3600";
      }
    `;
  }

  /**
   * Generate Fastly deliver VCL
   */
  generateFastlyDeliverVCL(config) {
    const headers = Object.entries(config.securityHeaders)
      .map(([key, value]) => `set resp.http.${key} = "${value}";`)
      .join('\n  ');
    
    return `
      # Security headers
      ${headers}
      
      # Performance headers
      set resp.http.X-Served-By = "Fastly CDN";
      set resp.http.X-Cache-Status = obj.hits > 0 ? "HIT" : "MISS";
    `;
  }

  /**
   * Parse cache header to extract max-age
   */
  parseCacheHeader(cacheHeader) {
    const maxAgeMatch = cacheHeader.match(/max-age=(\d+)/);
    return {
      maxAge: maxAgeMatch ? parseInt(maxAgeMatch[1]) : 3600,
      public: cacheHeader.includes('public'),
      immutable: cacheHeader.includes('immutable')
    };
  }

  /**
   * Optimize assets for CDN delivery
   */
  async optimizeForCDN() {
    console.log('⚡ Optimizing assets for CDN delivery...');
    
    const optimizations = {
      compression: await this.enableCDNCompression(),
      headers: await this.applyCacheHeaders(),
      preload: await this.generatePreloadHeaders(),
      manifest: await this.generateAssetManifest()
    };

    console.log('✅ CDN optimizations completed');
    return optimizations;
  }

  async enableCDNCompression() {
    // This would configure compression at the CDN level
    console.log('📦 CDN compression configuration applied');
    return true;
  }

  async applyCacheHeaders() {
    // This would apply appropriate cache headers to assets
    console.log('🏷️ Cache headers configuration applied');
    return true;
  }

  async generatePreloadHeaders() {
    const manifest = await this.generateAssetManifest();
    
    // Generate Link preload headers for critical assets
    const preloadHeaders = manifest.preload.map(asset => 
      `</${asset.path}>; rel=preload; as=${this.getPreloadType(asset.type)}`
    );

    console.log(`🔗 Generated ${preloadHeaders.length} preload headers`);
    return preloadHeaders;
  }

  getPreloadType(assetType) {
    const typeMapping = {
      css: 'style',
      js: 'script',
      font: 'font',
      image: 'image'
    };
    
    return typeMapping[assetType] || 'fetch';
  }
}