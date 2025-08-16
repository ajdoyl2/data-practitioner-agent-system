/**
 * Asset Manager
 * Manages Dagster asset definitions and dependencies
 */

const fs = require('fs-extra');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

class AssetManager {
  constructor(options = {}) {
    this.projectPath = options.projectPath;
    this.assetsPath = path.join(this.projectPath, 'assets');
    
    // Cache for asset metadata
    this.assetCache = new Map();
    this.cacheTimeout = options.cacheTimeout || 300000; // 5 minutes
  }

  /**
   * Initialize the asset manager
   */
  async initialize() {
    console.log('🚀 Initializing Asset Manager...');
    
    // Ensure assets directory exists
    fs.ensureDirSync(this.assetsPath);
    
    // Load initial asset metadata
    await this.loadAssetMetadata();
    
    console.log('✅ Asset Manager initialized');
  }

  /**
   * Load asset metadata from Python files
   */
  async loadAssetMetadata() {
    try {
      const assetFiles = await fs.readdir(this.assetsPath);
      const pythonFiles = assetFiles.filter(file => file.endsWith('.py'));
      
      for (const file of pythonFiles) {
        await this.parseAssetFile(file);
      }
      
      console.log(`📊 Loaded metadata for ${this.assetCache.size} assets`);
    } catch (error) {
      console.error('Failed to load asset metadata:', error);
    }
  }

  /**
   * Parse a Python asset file to extract metadata
   */
  async parseAssetFile(filename) {
    try {
      const filePath = path.join(this.assetsPath, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Extract asset definitions using regex (simplified approach)
      const assetMatches = content.matchAll(/@asset\(([\s\S]*?)\)\s*def\s+(\w+)/g);
      
      for (const match of assetMatches) {
        const assetName = match[2];
        const decoratorContent = match[1];
        
        // Parse asset metadata from decorator
        const metadata = this.parseAssetDecorator(decoratorContent);
        
        this.assetCache.set(assetName, {
          name: assetName,
          file: filename,
          ...metadata,
          lastUpdated: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error(`Failed to parse asset file ${filename}:`, error);
    }
  }

  /**
   * Parse asset decorator to extract metadata
   */
  parseAssetDecorator(decoratorContent) {
    const metadata = {
      description: null,
      group_name: null,
      compute_kind: null,
      dependencies: []
    };

    // Extract description
    const descMatch = decoratorContent.match(/description=["']([^"']+)["']/);
    if (descMatch) {
      metadata.description = descMatch[1];
    }

    // Extract group name
    const groupMatch = decoratorContent.match(/group_name=["']([^"']+)["']/);
    if (groupMatch) {
      metadata.group_name = groupMatch[1];
    }

    // Extract compute kind
    const computeMatch = decoratorContent.match(/compute_kind=["']([^"']+)["']/);
    if (computeMatch) {
      metadata.compute_kind = computeMatch[1];
    }

    // Extract dependencies (simplified)
    const depsMatch = decoratorContent.match(/deps=\[([^\]]+)\]/);
    if (depsMatch) {
      const depsStr = depsMatch[1];
      const deps = depsStr.split(',').map(dep => dep.trim().replace(/[^\w]/g, ''));
      metadata.dependencies = deps.filter(dep => dep.length > 0);
    }

    return metadata;
  }

  /**
   * List all available assets
   */
  async listAssets() {
    // Check if cache is stale
    const cacheAge = Date.now() - (this.lastCacheUpdate || 0);
    if (cacheAge > this.cacheTimeout) {
      await this.loadAssetMetadata();
      this.lastCacheUpdate = Date.now();
    }

    const assets = Array.from(this.assetCache.values());
    
    // Group assets by category
    const grouped = {
      infrastructure: assets.filter(a => a.group_name === 'infrastructure'),
      ingestion: assets.filter(a => a.group_name === 'ingestion'),
      analytics: assets.filter(a => a.group_name === 'analytics'),
      transformation: assets.filter(a => a.group_name === 'transformation'),
      publication: assets.filter(a => a.group_name === 'publication'),
      validation: assets.filter(a => a.group_name === 'validation'),
      monitoring: assets.filter(a => a.group_name === 'monitoring'),
      other: assets.filter(a => !a.group_name || !['infrastructure', 'ingestion', 'analytics', 'transformation', 'publication', 'validation', 'monitoring'].includes(a.group_name))
    };

    return {
      total: assets.length,
      by_group: grouped,
      all: assets
    };
  }

  /**
   * Get details for a specific asset
   */
  async getAssetDetails(assetKey) {
    const asset = this.assetCache.get(assetKey);
    
    if (!asset) {
      throw new Error(`Asset not found: ${assetKey}`);
    }

    // Get additional runtime details from Dagster
    try {
      const runtimeDetails = await this.getAssetRuntimeDetails(assetKey);
      return {
        ...asset,
        runtime: runtimeDetails
      };
    } catch (error) {
      console.warn(`Failed to get runtime details for asset ${assetKey}:`, error);
      return asset;
    }
  }

  /**
   * Get asset runtime details from Dagster
   */
  async getAssetRuntimeDetails(assetKey) {
    try {
      // Use Dagster CLI to get asset info (simplified)
      const { stdout } = await execAsync(
        `cd "${this.projectPath}" && dagster asset show ${assetKey}`,
        { timeout: 30000 }
      );

      return {
        last_materialization: null,
        materialization_count: 0,
        status: 'unknown',
        details: stdout
      };
    } catch (error) {
      return {
        last_materialization: null,
        materialization_count: 0,
        status: 'error',
        error: error.message
      };
    }
  }

  /**
   * Get asset lineage (dependencies and dependents)
   */
  async getAssetLineage(assetKey) {
    const asset = this.assetCache.get(assetKey);
    
    if (!asset) {
      throw new Error(`Asset not found: ${assetKey}`);
    }

    // Find upstream dependencies
    const upstream = asset.dependencies || [];
    
    // Find downstream dependents
    const downstream = [];
    for (const [name, otherAsset] of this.assetCache) {
      if (otherAsset.dependencies && otherAsset.dependencies.includes(assetKey)) {
        downstream.push(name);
      }
    }

    // Build lineage graph
    const lineage = {
      asset_key: assetKey,
      upstream: upstream.map(dep => ({
        asset_key: dep,
        metadata: this.assetCache.get(dep) || { name: dep, status: 'unknown' }
      })),
      downstream: downstream.map(dep => ({
        asset_key: dep,
        metadata: this.assetCache.get(dep) || { name: dep, status: 'unknown' }
      })),
      depth_upstream: this.calculateUpstreamDepth(assetKey),
      depth_downstream: this.calculateDownstreamDepth(assetKey)
    };

    return lineage;
  }

  /**
   * Calculate upstream dependency depth
   */
  calculateUpstreamDepth(assetKey, visited = new Set()) {
    if (visited.has(assetKey)) {
      return 0; // Circular dependency protection
    }
    
    visited.add(assetKey);
    const asset = this.assetCache.get(assetKey);
    
    if (!asset || !asset.dependencies || asset.dependencies.length === 0) {
      return 0;
    }

    let maxDepth = 0;
    for (const dep of asset.dependencies) {
      const depthThroughDep = 1 + this.calculateUpstreamDepth(dep, new Set(visited));
      maxDepth = Math.max(maxDepth, depthThroughDep);
    }

    return maxDepth;
  }

  /**
   * Calculate downstream dependency depth
   */
  calculateDownstreamDepth(assetKey, visited = new Set()) {
    if (visited.has(assetKey)) {
      return 0; // Circular dependency protection
    }
    
    visited.add(assetKey);
    
    // Find all assets that depend on this one
    const dependents = [];
    for (const [name, asset] of this.assetCache) {
      if (asset.dependencies && asset.dependencies.includes(assetKey)) {
        dependents.push(name);
      }
    }

    if (dependents.length === 0) {
      return 0;
    }

    let maxDepth = 0;
    for (const dependent of dependents) {
      const depthThroughDependent = 1 + this.calculateDownstreamDepth(dependent, new Set(visited));
      maxDepth = Math.max(maxDepth, depthThroughDependent);
    }

    return maxDepth;
  }

  /**
   * Register a new asset dynamically
   */
  async registerAsset(assetDefinition) {
    const {
      name,
      description,
      group_name,
      compute_kind,
      dependencies = [],
      code
    } = assetDefinition;

    // Validate asset definition
    if (!name || !code) {
      throw new Error('Asset name and code are required');
    }

    // Add to cache
    this.assetCache.set(name, {
      name,
      description,
      group_name,
      compute_kind,
      dependencies,
      file: 'dynamic',
      dynamic: true,
      lastUpdated: new Date().toISOString()
    });

    console.log(`✅ Registered dynamic asset: ${name}`);
    
    return {
      success: true,
      asset_name: name,
      message: 'Asset registered successfully'
    };
  }

  /**
   * Get asset execution statistics
   */
  async getAssetStats() {
    const assets = Array.from(this.assetCache.values());
    
    const stats = {
      total_assets: assets.length,
      by_group: {},
      by_compute_kind: {},
      dependency_stats: {
        assets_with_dependencies: 0,
        total_dependencies: 0,
        max_dependencies: 0,
        avg_dependencies: 0
      }
    };

    // Group statistics
    for (const asset of assets) {
      if (asset.group_name) {
        stats.by_group[asset.group_name] = (stats.by_group[asset.group_name] || 0) + 1;
      }
      
      if (asset.compute_kind) {
        stats.by_compute_kind[asset.compute_kind] = (stats.by_compute_kind[asset.compute_kind] || 0) + 1;
      }

      // Dependency statistics
      if (asset.dependencies && asset.dependencies.length > 0) {
        stats.dependency_stats.assets_with_dependencies++;
        stats.dependency_stats.total_dependencies += asset.dependencies.length;
        stats.dependency_stats.max_dependencies = Math.max(
          stats.dependency_stats.max_dependencies,
          asset.dependencies.length
        );
      }
    }

    // Calculate average dependencies
    if (stats.dependency_stats.assets_with_dependencies > 0) {
      stats.dependency_stats.avg_dependencies = 
        stats.dependency_stats.total_dependencies / stats.dependency_stats.assets_with_dependencies;
    }

    return stats;
  }

  /**
   * Validate asset dependencies
   */
  async validateDependencies() {
    const issues = [];
    
    for (const [assetName, asset] of this.assetCache) {
      if (asset.dependencies) {
        for (const dep of asset.dependencies) {
          if (!this.assetCache.has(dep)) {
            issues.push({
              asset: assetName,
              type: 'missing_dependency',
              dependency: dep,
              message: `Asset '${assetName}' depends on '${dep}' which does not exist`
            });
          }
        }
      }
    }

    // Check for circular dependencies
    for (const [assetName] of this.assetCache) {
      if (this.hasCircularDependency(assetName)) {
        issues.push({
          asset: assetName,
          type: 'circular_dependency',
          message: `Asset '${assetName}' has circular dependency`
        });
      }
    }

    return {
      valid: issues.length === 0,
      issues,
      total_issues: issues.length
    };
  }

  /**
   * Check for circular dependencies
   */
  hasCircularDependency(assetKey, visited = new Set(), path = []) {
    if (path.includes(assetKey)) {
      return true; // Found a cycle
    }
    
    if (visited.has(assetKey)) {
      return false; // Already explored this path
    }

    visited.add(assetKey);
    const asset = this.assetCache.get(assetKey);
    
    if (!asset || !asset.dependencies) {
      return false;
    }

    for (const dep of asset.dependencies) {
      if (this.hasCircularDependency(dep, new Set(visited), [...path, assetKey])) {
        return true;
      }
    }

    return false;
  }
}

module.exports = AssetManager;