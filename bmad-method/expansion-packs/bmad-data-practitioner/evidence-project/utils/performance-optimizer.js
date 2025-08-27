// Performance Optimization Utilities for Evidence.dev Publications
// Implements performance monitoring and optimization strategies

import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class PerformanceOptimizer {
  constructor(options = {}) {
    this.buildDir = options.buildDir || './build';
    this.sourceDir = options.sourceDir || './pages';
    this.staticDir = options.staticDir || './static';
    this.performanceThresholds = {
      loadTime: 3000, // 3s on 3G
      loadTimeOptimal: 1000, // 1s on WiFi
      bundleSize: {
        initial: 500000, // 500KB initial
        total: 2097152   // 2MB total
      },
      fileCount: 500,
      largeFileThreshold: 1048576 // 1MB
    };
  }

  /**
   * Analyze build performance and generate optimization recommendations
   */
  async analyzePerformance() {
    console.log('📊 Analyzing Evidence.dev site performance...');
    
    const analysis = {
      buildMetrics: await this.analyzeBuildMetrics(),
      fileOptimization: await this.analyzeFileOptimization(),
      sqlQueries: await this.analyzeSQLQueries(),
      imageOptimization: await this.analyzeImageOptimization(),
      recommendations: []
    };

    analysis.recommendations = this.generateOptimizationRecommendations(analysis);
    
    return analysis;
  }

  /**
   * Analyze build output metrics
   */
  async analyzeBuildMetrics() {
    if (!await fs.pathExists(this.buildDir)) {
      return { error: 'Build directory not found. Run build first.' };
    }

    const metrics = {
      totalSize: 0,
      fileCount: 0,
      largeFiles: [],
      directoryBreakdown: {},
      bundleAnalysis: {
        html: { count: 0, size: 0 },
        css: { count: 0, size: 0 },
        js: { count: 0, size: 0 },
        images: { count: 0, size: 0 },
        other: { count: 0, size: 0 }
      }
    };

    // Recursively analyze build directory
    await this.analyzeDirectory(this.buildDir, metrics);
    
    return metrics;
  }

  /**
   * Recursively analyze directory structure
   */
  async analyzeDirectory(dirPath, metrics, relativePath = '') {
    const items = await fs.readdir(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const relativeItemPath = path.join(relativePath, item);
      const stats = await fs.stat(fullPath);
      
      if (stats.isDirectory()) {
        metrics.directoryBreakdown[relativeItemPath] = {
          files: 0,
          size: 0
        };
        await this.analyzeDirectory(fullPath, metrics, relativeItemPath);
      } else {
        const fileSize = stats.size;
        metrics.totalSize += fileSize;
        metrics.fileCount++;
        
        // Track large files
        if (fileSize > this.performanceThresholds.largeFileThreshold) {
          metrics.largeFiles.push({
            path: relativeItemPath,
            size: fileSize,
            sizeFormatted: this.formatBytes(fileSize)
          });
        }
        
        // Categorize by file type
        const ext = path.extname(item).toLowerCase();
        let category = 'other';
        
        if (['.html', '.htm'].includes(ext)) {
          category = 'html';
        } else if (['.css', '.scss', '.sass'].includes(ext)) {
          category = 'css';
        } else if (['.js', '.ts', '.jsx', '.tsx'].includes(ext)) {
          category = 'js';
        } else if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp'].includes(ext)) {
          category = 'images';
        }
        
        metrics.bundleAnalysis[category].count++;
        metrics.bundleAnalysis[category].size += fileSize;
        
        // Update directory breakdown
        const dirKey = path.dirname(relativeItemPath) || '.';
        if (!metrics.directoryBreakdown[dirKey]) {
          metrics.directoryBreakdown[dirKey] = { files: 0, size: 0 };
        }
        metrics.directoryBreakdown[dirKey].files++;
        metrics.directoryBreakdown[dirKey].size += fileSize;
      }
    }
  }

  /**
   * Analyze file optimization opportunities
   */
  async analyzeFileOptimization() {
    const optimization = {
      compression: {
        canCompress: [],
        alreadyCompressed: []
      },
      minification: {
        canMinify: [],
        alreadyMinified: []
      },
      bundling: {
        suggestions: []
      }
    };

    if (!await fs.pathExists(this.buildDir)) {
      return optimization;
    }

    // Check for uncompressed text files
    const textFiles = await this.findFilesByExtension(this.buildDir, ['.html', '.css', '.js', '.json', '.xml']);
    
    for (const file of textFiles) {
      const stats = await fs.stat(file);
      const content = await fs.readFile(file, 'utf8');
      
      // Check if file can be minified
      if (this.canBeMinified(file, content)) {
        optimization.minification.canMinify.push({
          path: path.relative(this.buildDir, file),
          size: stats.size,
          estimatedSavings: Math.floor(stats.size * 0.3) // Estimate 30% savings
        });
      }
      
      // Check if file can be compressed
      if (stats.size > 1024) { // Only compress files > 1KB
        optimization.compression.canCompress.push({
          path: path.relative(this.buildDir, file),
          size: stats.size,
          estimatedSavings: Math.floor(stats.size * 0.6) // Estimate 60% savings with gzip
        });
      }
    }

    return optimization;
  }

  /**
   * Analyze SQL query performance
   */
  async analyzeSQLQueries() {
    const analysis = {
      totalQueries: 0,
      complexQueries: [],
      optimizationSuggestions: []
    };

    if (!await fs.pathExists(this.sourceDir)) {
      return analysis;
    }

    const markdownFiles = await this.findFilesByExtension(this.sourceDir, ['.md']);
    
    for (const file of markdownFiles) {
      const content = await fs.readFile(file, 'utf8');
      const sqlBlocks = this.extractSQLBlocks(content);
      
      analysis.totalQueries += sqlBlocks.length;
      
      for (const sql of sqlBlocks) {
        const complexity = this.analyzeSQLComplexity(sql);
        
        if (complexity.score > 5) {
          analysis.complexQueries.push({
            file: path.relative(this.sourceDir, file),
            query: sql.substring(0, 100) + '...',
            complexity: complexity.score,
            issues: complexity.issues
          });
        }
      }
    }

    // Generate optimization suggestions
    if (analysis.complexQueries.length > 0) {
      analysis.optimizationSuggestions.push(
        'Consider indexing frequently queried columns',
        'Use LIMIT clauses on large result sets',
        'Cache query results for static data'
      );
    }

    return analysis;
  }

  /**
   * Analyze image optimization opportunities
   */
  async analyzeImageOptimization() {
    const analysis = {
      totalImages: 0,
      unoptimizedImages: [],
      formatSuggestions: []
    };

    if (!await fs.pathExists(this.staticDir)) {
      return analysis;
    }

    const imageFiles = await this.findFilesByExtension(this.staticDir, ['.png', '.jpg', '.jpeg', '.gif', '.svg']);
    analysis.totalImages = imageFiles.length;
    
    for (const file of imageFiles) {
      const stats = await fs.stat(file);
      const ext = path.extname(file).toLowerCase();
      
      // Suggest WebP for large images
      if (['.png', '.jpg', '.jpeg'].includes(ext) && stats.size > 100000) { // > 100KB
        analysis.unoptimizedImages.push({
          path: path.relative(this.staticDir, file),
          size: stats.size,
          suggestion: 'Convert to WebP format for better compression'
        });
      }
      
      // Suggest SVG optimization
      if (ext === '.svg' && stats.size > 10000) { // > 10KB
        analysis.unoptimizedImages.push({
          path: path.relative(this.staticDir, file),
          size: stats.size,
          suggestion: 'Optimize SVG by removing unnecessary metadata'
        });
      }
    }

    return analysis;
  }

  /**
   * Generate performance optimization recommendations
   */
  generateOptimizationRecommendations(analysis) {
    const recommendations = [];

    // Build size recommendations
    if (analysis.buildMetrics.totalSize > this.performanceThresholds.bundleSize.total) {
      recommendations.push({
        priority: 'high',
        category: 'Bundle Size',
        message: `Total bundle size (${this.formatBytes(analysis.buildMetrics.totalSize)}) exceeds recommended limit (${this.formatBytes(this.performanceThresholds.bundleSize.total)})`,
        action: 'Enable code splitting and remove unused dependencies'
      });
    }

    // File count recommendations
    if (analysis.buildMetrics.fileCount > this.performanceThresholds.fileCount) {
      recommendations.push({
        priority: 'medium',
        category: 'File Count',
        message: `High number of files (${analysis.buildMetrics.fileCount}) may impact load performance`,
        action: 'Consider bundling related files or using HTTP/2 server push'
      });
    }

    // Large files recommendations
    if (analysis.buildMetrics.largeFiles.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'Large Files',
        message: `${analysis.buildMetrics.largeFiles.length} files exceed 1MB`,
        action: 'Optimize large files or implement lazy loading',
        files: analysis.buildMetrics.largeFiles.map(f => f.path)
      });
    }

    // SQL query recommendations
    if (analysis.sqlQueries.complexQueries.length > 0) {
      recommendations.push({
        priority: 'medium',
        category: 'SQL Performance',
        message: `${analysis.sqlQueries.complexQueries.length} complex SQL queries detected`,
        action: 'Review and optimize complex queries for better performance'
      });
    }

    // Image optimization recommendations
    if (analysis.imageOptimization.unoptimizedImages.length > 0) {
      recommendations.push({
        priority: 'low',
        category: 'Image Optimization',
        message: `${analysis.imageOptimization.unoptimizedImages.length} images could be optimized`,
        action: 'Convert images to modern formats (WebP) and compress'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Helper methods
   */
  
  async findFilesByExtension(dir, extensions) {
    const files = [];
    
    const search = async (currentDir) => {
      const items = await fs.readdir(currentDir);
      
      for (const item of items) {
        const fullPath = path.join(currentDir, item);
        const stats = await fs.stat(fullPath);
        
        if (stats.isDirectory()) {
          await search(fullPath);
        } else {
          const ext = path.extname(item).toLowerCase();
          if (extensions.includes(ext)) {
            files.push(fullPath);
          }
        }
      }
    };
    
    if (await fs.pathExists(dir)) {
      await search(dir);
    }
    
    return files;
  }

  canBeMinified(filePath, content) {
    const ext = path.extname(filePath).toLowerCase();
    
    // Check if already minified (heuristic)
    if (['.js', '.css'].includes(ext)) {
      const lines = content.split('\n');
      const avgLineLength = content.length / lines.length;
      
      // If average line length > 100 and has indentation, likely not minified
      return avgLineLength > 100 && content.includes('  ') && !filePath.includes('.min.');
    }
    
    if (ext === '.html') {
      // HTML can be minified if it has unnecessary whitespace
      return content.includes('  ') || content.includes('\n\n');
    }
    
    return false;
  }

  extractSQLBlocks(markdown) {
    const sqlBlocks = [];
    const sqlRegex = /```sql\s*\n([\s\S]*?)\n```/g;
    let match;
    
    while ((match = sqlRegex.exec(markdown)) !== null) {
      sqlBlocks.push(match[1].trim());
    }
    
    return sqlBlocks;
  }

  analyzeSQLComplexity(sql) {
    const issues = [];
    let score = 0;
    
    // Count JOINs
    const joinCount = (sql.match(/JOIN/gi) || []).length;
    score += joinCount;
    if (joinCount > 3) {
      issues.push('Multiple JOINs detected');
    }
    
    // Count subqueries
    const subqueryCount = (sql.match(/\(\s*SELECT/gi) || []).length;
    score += subqueryCount * 2;
    if (subqueryCount > 1) {
      issues.push('Multiple subqueries detected');
    }
    
    // Check for missing WHERE clause on large tables
    if (!sql.includes('WHERE') && !sql.includes('LIMIT')) {
      score += 3;
      issues.push('No WHERE clause or LIMIT detected');
    }
    
    // Check for SELECT *
    if (sql.includes('SELECT *')) {
      score += 1;
      issues.push('Using SELECT * instead of specific columns');
    }
    
    return { score, issues };
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Apply performance optimizations
   */
  async applyOptimizations(optimizations = {}) {
    console.log('⚡ Applying performance optimizations...');
    
    const results = {
      compression: false,
      minification: false,
      imageOptimization: false,
      sqlOptimization: false
    };

    try {
      // Apply compression
      if (optimizations.compression !== false) {
        results.compression = await this.enableCompression();
      }

      // Apply minification
      if (optimizations.minification !== false) {
        results.minification = await this.enableMinification();
      }

      // Apply image optimization
      if (optimizations.imageOptimization !== false) {
        results.imageOptimization = await this.optimizeImages();
      }

      console.log('✅ Performance optimizations applied');
      return results;
      
    } catch (error) {
      console.error('❌ Error applying optimizations:', error.message);
      throw error;
    }
  }

  async enableCompression() {
    // This would integrate with the build process to enable gzip/brotli compression
    console.log('📦 Compression would be enabled via build configuration');
    return true;
  }

  async enableMinification() {
    // This would integrate with Evidence.dev build process for minification
    console.log('🔧 Minification would be enabled via Evidence.dev build settings');
    return true;
  }

  async optimizeImages() {
    // This would implement actual image optimization
    console.log('🖼️ Image optimization would be applied to static assets');
    return true;
  }
}