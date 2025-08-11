/**
 * Security Logger Tests
 * Validates security logging and monitoring functionality
 */

const fs = require('fs-extra');
const path = require('path');
const {
  securityLogger,
  SecurityEvents
} = require('../../tools/lib/security-logger');

describe('Security Logger', () => {
  const testLogDir = path.join(__dirname, 'test-logs');
  const securityLog = path.join(testLogDir, 'security.log');
  const auditLog = path.join(testLogDir, 'audit.log');
  
  beforeEach(async () => {
    // Create test log directory
    await fs.ensureDir(testLogDir);
    
    // Mock log paths
    jest.spyOn(path, 'join').mockImplementation((...args) => {
      if (args.includes('logs')) {
        return path.join(testLogDir, args[args.length - 1]);
      }
      return path.join(...args);
    });
  });
  
  afterEach(async () => {
    // Clean up test logs
    await fs.remove(testLogDir);
    jest.restoreAllMocks();
  });
  
  describe('Event Logging', () => {
    test('should log authentication success', async () => {
      const eventData = {
        apiKey: 'bmad_test123...',
        scopes: ['data_read'],
        ip: '192.168.1.1',
        path: '/api/data',
        method: 'GET'
      };
      
      securityLogger.logAuthSuccess(eventData);
      
      // Give time for async write
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const logContent = await fs.readFile(securityLog, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.event).toBe(SecurityEvents.AUTH_SUCCESS);
      expect(logEntry.level).toBe('INFO');
      expect(logEntry.apiKey).toBe(eventData.apiKey);
      expect(logEntry.ip).toBe(eventData.ip);
    });
    
    test('should log authentication failure', async () => {
      const eventData = {
        reason: 'invalid_api_key',
        ip: '192.168.1.2',
        path: '/api/secure',
        method: 'POST'
      };
      
      securityLogger.logAuthFailure(eventData);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const logContent = await fs.readFile(securityLog, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.event).toBe(SecurityEvents.AUTH_FAILURE);
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.reason).toBe(eventData.reason);
    });
    
    test('should log permission denied', async () => {
      const eventData = {
        apiKey: 'bmad_test...',
        requiredScopes: ['admin'],
        userScopes: ['data_read'],
        ip: '192.168.1.3',
        path: '/api/admin',
        method: 'DELETE'
      };
      
      securityLogger.logPermissionDenied(eventData);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const logContent = await fs.readFile(securityLog, 'utf8');
      const logEntry = JSON.parse(logContent.trim());
      
      expect(logEntry.event).toBe(SecurityEvents.PERMISSION_DENIED);
      expect(logEntry.level).toBe('WARN');
      expect(logEntry.requiredScopes).toEqual(eventData.requiredScopes);
      expect(logEntry.userScopes).toEqual(eventData.userScopes);
    });
    
    test('should log feature flag changes', async () => {
      const eventData = {
        feature: 'pyairbyte_integration',
        action: 'enabled',
        timestamp: new Date().toISOString()
      };
      
      securityLogger.logFeatureFlagChange(eventData);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const auditContent = await fs.readFile(auditLog, 'utf8');
      const logEntry = JSON.parse(auditContent.trim());
      
      expect(logEntry.event).toBe(SecurityEvents.FEATURE_FLAG_CHANGED);
      expect(logEntry.feature).toBe(eventData.feature);
      expect(logEntry.action).toBe(eventData.action);
    });
    
    test('should log security violations', async () => {
      const eventData = {
        type: 'SQL_INJECTION',
        pattern: 'SQL Injection Attempt',
        severity: 'critical',
        ip: '192.168.1.4',
        path: '/api/query',
        method: 'GET'
      };
      
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      securityLogger.logSecurityViolation(eventData);
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check console output
      expect(consoleSpy).toHaveBeenCalledWith(
        'SECURITY VIOLATION:',
        expect.objectContaining(eventData)
      );
      
      // Check log files
      const securityContent = await fs.readFile(securityLog, 'utf8');
      const auditContent = await fs.readFile(auditLog, 'utf8');
      
      const securityEntry = JSON.parse(securityContent.trim());
      const auditEntry = JSON.parse(auditContent.trim());
      
      expect(securityEntry.event).toBe(SecurityEvents.SECURITY_VIOLATION);
      expect(securityEntry.level).toBe('ERROR');
      expect(auditEntry.event).toBe(SecurityEvents.SECURITY_VIOLATION);
      
      consoleSpy.mockRestore();
    });
  });
  
  describe('Log Retrieval', () => {
    beforeEach(async () => {
      // Create some test log entries
      const events = [
        { timestamp: new Date().toISOString(), level: 'INFO', event: 'auth_success', ip: '1.1.1.1' },
        { timestamp: new Date().toISOString(), level: 'WARN', event: 'auth_failure', ip: '2.2.2.2' },
        { timestamp: new Date().toISOString(), level: 'ERROR', event: 'security_violation', ip: '3.3.3.3' }
      ];
      
      const logContent = events.map(e => JSON.stringify(e)).join('\n');
      await fs.writeFile(securityLog, logContent);
    });
    
    test('should retrieve recent events', async () => {
      const events = await securityLogger.getRecentEvents(2);
      
      expect(events).toHaveLength(2);
      expect(events[0].event).toBe('auth_failure');
      expect(events[1].event).toBe('security_violation');
    });
    
    test('should filter events by type', async () => {
      const events = await securityLogger.getRecentEvents(100, 'auth_failure');
      
      expect(events).toHaveLength(1);
      expect(events[0].event).toBe('auth_failure');
      expect(events[0].ip).toBe('2.2.2.2');
    });
    
    test('should handle missing log file', async () => {
      await fs.remove(securityLog);
      
      const events = await securityLogger.getRecentEvents();
      
      expect(events).toEqual([]);
    });
  });
  
  describe('Security Analysis', () => {
    beforeEach(async () => {
      // Create events with timestamps
      const now = Date.now();
      const events = [];
      
      // Add various events
      for (let i = 0; i < 5; i++) {
        events.push({
          timestamp: new Date(now - i * 60000).toISOString(), // 1 minute apart
          level: 'WARN',
          event: SecurityEvents.AUTH_FAILURE,
          ip: '192.168.1.1'
        });
      }
      
      // Add some other events
      events.push({
        timestamp: new Date(now - 300000).toISOString(), // 5 minutes ago
        level: 'ERROR',
        event: SecurityEvents.SECURITY_VIOLATION,
        ip: '192.168.1.2'
      });
      
      const logContent = events.map(e => JSON.stringify(e)).join('\n');
      await fs.writeFile(securityLog, logContent);
    });
    
    test('should analyze security events', async () => {
      const analysis = await securityLogger.analyzeSecurityEvents(60);
      
      expect(analysis.totalEvents).toBe(6);
      expect(analysis.byType[SecurityEvents.AUTH_FAILURE]).toBe(5);
      expect(analysis.byType[SecurityEvents.SECURITY_VIOLATION]).toBe(1);
      expect(analysis.byLevel.WARN).toBe(5);
      expect(analysis.byLevel.ERROR).toBe(1);
    });
    
    test('should detect suspicious patterns', async () => {
      const analysis = await securityLogger.analyzeSecurityEvents(60);
      
      expect(analysis.failurePatterns['192.168.1.1']).toBe(5);
      expect(analysis.suspiciousActivity).toHaveLength(0); // Not over threshold
      
      // Add more failures to trigger suspicious activity
      const now = Date.now();
      const moreEvents = [];
      for (let i = 0; i < 10; i++) {
        moreEvents.push({
          timestamp: new Date(now - i * 1000).toISOString(),
          level: 'WARN',
          event: SecurityEvents.AUTH_FAILURE,
          ip: '192.168.1.3'
        });
      }
      
      const existingContent = await fs.readFile(securityLog, 'utf8');
      const newContent = existingContent + '\n' + moreEvents.map(e => JSON.stringify(e)).join('\n');
      await fs.writeFile(securityLog, newContent);
      
      const newAnalysis = await securityLogger.analyzeSecurityEvents(60);
      
      expect(newAnalysis.suspiciousActivity).toHaveLength(1);
      expect(newAnalysis.suspiciousActivity[0]).toMatchObject({
        type: 'excessive_auth_failures',
        ip: '192.168.1.3',
        count: 10,
        severity: 'medium'
      });
    });
  });
  
  describe('Log Rotation', () => {
    test('should rotate logs when size exceeds limit', async () => {
      // Create a large log file
      const largeContent = 'x'.repeat(11 * 1024 * 1024); // 11MB
      await fs.writeFile(securityLog, largeContent);
      
      await securityLogger.rotateLogs(10, 5);
      
      // Check that original file was moved
      const files = await fs.readdir(testLogDir);
      const rotatedFiles = files.filter(f => f.startsWith('security.log.'));
      
      expect(rotatedFiles).toHaveLength(1);
      expect(await fs.pathExists(securityLog)).toBe(false);
    });
    
    test('should remove old archives', async () => {
      // Create multiple archive files
      for (let i = 0; i < 7; i++) {
        const archiveName = `security.log.2024-01-0${i + 1}T00-00-00-000Z`;
        await fs.writeFile(path.join(testLogDir, archiveName), 'archived content');
      }
      
      await securityLogger.rotateLogs(10, 5);
      
      const files = await fs.readdir(testLogDir);
      const archives = files.filter(f => f.startsWith('security.log.'));
      
      expect(archives.length).toBeLessThanOrEqual(5);
    });
  });
});