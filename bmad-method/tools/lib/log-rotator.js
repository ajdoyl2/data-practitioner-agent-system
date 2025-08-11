/**
 * Log Rotation Service
 * Handles log rotation and retention based on configuration
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const zlib = require('zlib');
const { promisify } = require('util');
// const cron = require('node-cron'); // Optional dependency

const gzip = promisify(zlib.gzip);
const CONFIG_PATH = path.join(__dirname, '../../config/log-rotation.yaml');

let rotationConfig = null;
let rotationTask = null;

/**
 * Load rotation configuration
 */
function loadRotationConfig() {
  try {
    const content = fs.readFileSync(CONFIG_PATH, 'utf8');
    rotationConfig = yaml.load(content);
    return rotationConfig;
  } catch (error) {
    console.error('Failed to load rotation config:', error.message);
    return null;
  }
}

/**
 * Get file size in MB
 */
async function getFileSizeMB(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size / (1024 * 1024);
  } catch {
    return 0;
  }
}

/**
 * Compress a file
 */
async function compressFile(filePath) {
  const compressedPath = filePath + '.gz';
  
  try {
    const fileContent = await fs.readFile(filePath);
    const compressed = await gzip(fileContent);
    await fs.writeFile(compressedPath, compressed);
    await fs.remove(filePath);
    
    return compressedPath;
  } catch (error) {
    console.error(`Failed to compress ${filePath}:`, error.message);
    return null;
  }
}

/**
 * Generate archived filename
 */
function getArchivedFilename(filePath, format = '{name}.{date}.{ext}') {
  const dir = path.dirname(filePath);
  const ext = path.extname(filePath);
  const name = path.basename(filePath, ext);
  const date = new Date().toISOString().replace(/[:.]/g, '-');
  
  const filename = format
    .replace('{name}', name)
    .replace('{date}', date)
    .replace('{ext}', ext.slice(1));
  
  return path.join(dir, filename);
}

/**
 * Rotate a single log file
 */
async function rotateLogFile(filePath, config) {
  try {
    // Check if file exists and needs rotation
    if (!await fs.pathExists(filePath)) {
      return { status: 'skipped', reason: 'file not found' };
    }
    
    const sizeMB = await getFileSizeMB(filePath);
    if (sizeMB < config.max_size_mb) {
      return { status: 'skipped', reason: 'size below threshold' };
    }
    
    // Generate archive name
    const archivePath = getArchivedFilename(filePath);
    
    // Move current file to archive
    await fs.move(filePath, archivePath);
    
    // Compress if enabled
    let finalPath = archivePath;
    if (config.compress) {
      finalPath = await compressFile(archivePath) || archivePath;
    }
    
    // Clean up old files
    await cleanupOldFiles(path.dirname(filePath), config);
    
    return {
      status: 'rotated',
      originalSize: sizeMB,
      archivePath: finalPath
    };
    
  } catch (error) {
    return {
      status: 'error',
      error: error.message
    };
  }
}

/**
 * Clean up old log files
 */
async function cleanupOldFiles(directory, config) {
  try {
    const files = await fs.readdir(directory);
    const logFiles = files
      .filter(f => f.includes('.log'))
      .map(f => ({
        name: f,
        path: path.join(directory, f),
        stats: fs.statSync(path.join(directory, f))
      }))
      .sort((a, b) => b.stats.mtime - a.stats.mtime);
    
    // Remove files exceeding max_files limit
    const filesToRemove = logFiles.slice(config.max_files);
    
    for (const file of filesToRemove) {
      await fs.remove(file.path);
      console.log(`Removed old log file: ${file.name}`);
    }
    
    // Remove files older than retention days
    if (config.retention_days) {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - config.retention_days);
      
      for (const file of logFiles) {
        if (file.stats.mtime < cutoffDate) {
          await fs.remove(file.path);
          console.log(`Removed expired log file: ${file.name}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Cleanup error:', error.message);
  }
}

/**
 * Rotate all configured logs
 */
async function rotateAllLogs() {
  if (!rotationConfig) {
    loadRotationConfig();
  }
  
  const results = {};
  
  // Rotate security log
  if (rotationConfig.rotation.security_log) {
    const securityLogPath = path.join(__dirname, '../..', rotationConfig.rotation.security_log.file);
    results.security = await rotateLogFile(securityLogPath, rotationConfig.rotation.security_log);
  }
  
  // Rotate audit log
  if (rotationConfig.rotation.audit_log) {
    const auditLogPath = path.join(__dirname, '../..', rotationConfig.rotation.audit_log.file);
    results.audit = await rotateLogFile(auditLogPath, rotationConfig.rotation.audit_log);
  }
  
  // Rotate service logs
  if (rotationConfig.rotation.service_logs) {
    const pattern = rotationConfig.rotation.service_logs.pattern;
    const baseDir = path.join(__dirname, '../..');
    
    // Find all matching log files
    const glob = require('glob');
    const files = await new Promise((resolve, reject) => {
      glob(pattern, { cwd: baseDir }, (err, files) => {
        if (err) reject(err);
        else resolve(files);
      });
    });
    
    results.services = {};
    for (const file of files) {
      const filePath = path.join(baseDir, file);
      results.services[file] = await rotateLogFile(
        filePath,
        rotationConfig.rotation.service_logs
      );
    }
  }
  
  return results;
}

/**
 * Check disk usage
 */
async function checkDiskUsage() {
  const logDir = path.join(__dirname, '../../logs');
  
  try {
    // This is a simplified check - in production, use proper disk usage tools
    const files = await fs.readdir(logDir, { withFileTypes: true });
    let totalSize = 0;
    
    for (const file of files) {
      if (file.isFile()) {
        const filePath = path.join(logDir, file.name);
        const stats = await fs.stat(filePath);
        totalSize += stats.size;
      }
    }
    
    const totalSizeMB = totalSize / (1024 * 1024);
    
    return {
      totalSizeMB,
      warning: totalSizeMB > 1000, // Warn at 1GB
      critical: totalSizeMB > 5000  // Critical at 5GB
    };
    
  } catch (error) {
    return {
      error: error.message,
      warning: false,
      critical: false
    };
  }
}

/**
 * Start scheduled rotation
 */
function startScheduledRotation() {
  if (!rotationConfig) {
    loadRotationConfig();
  }
  
  if (!rotationConfig || !rotationConfig.cleanup || !rotationConfig.cleanup.schedule) {
    console.error('No rotation schedule configured');
    return;
  }
  
  // Stop existing task if any
  if (rotationTask) {
    rotationTask.stop();
  }
  
  // Schedule rotation task
  // Note: node-cron is optional dependency
  if (typeof cron !== 'undefined' && cron.schedule) {
    rotationTask = cron.schedule(rotationConfig.cleanup.schedule, async () => {
    console.log('Starting scheduled log rotation...');
    
    try {
      const results = await rotateAllLogs();
      console.log('Log rotation completed:', results);
      
      // Check disk usage
      const usage = await checkDiskUsage();
      if (usage.warning) {
        console.warn('Log directory size warning:', usage.totalSizeMB, 'MB');
      }
      if (usage.critical) {
        console.error('Log directory size critical:', usage.totalSizeMB, 'MB');
      }
      
    } catch (error) {
      console.error('Log rotation failed:', error.message);
    }
  });
  
    rotationTask.start();
    console.log('Log rotation scheduled:', rotationConfig.cleanup.schedule);
  } else {
    console.warn('node-cron not available - scheduled rotation disabled');
  }
}

/**
 * Stop scheduled rotation
 */
function stopScheduledRotation() {
  if (rotationTask) {
    rotationTask.stop();
    rotationTask = null;
    console.log('Log rotation stopped');
  }
}

/**
 * Archive logs to S3 (optional)
 */
async function archiveToS3(filePath) {
  if (!rotationConfig.archive.s3.enabled) {
    return null;
  }
  
  // This would require AWS SDK
  // Implementation placeholder
  console.log('S3 archival not implemented yet');
  return null;
}

// Export for CLI and testing
module.exports = {
  loadRotationConfig,
  rotateAllLogs,
  checkDiskUsage,
  startScheduledRotation,
  stopScheduledRotation,
  archiveToS3
};