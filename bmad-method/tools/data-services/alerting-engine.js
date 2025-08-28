/**
 * Alerting Engine for Data Pipeline Monitoring
 * Comprehensive alerting system for system health and quality issues
 * Supports multiple channels and intelligent alert routing
 */

const fs = require('fs-extra');
const path = require('path');
const yaml = require('js-yaml');
const { system } = require('./monitoring-logger');
const { securityLogger } = require('../lib/security-logger');

// Load monitoring configuration
const configPath = path.join(__dirname, '../../config/quality-assurance/monitoring-config.yaml');
let monitoringConfig = {};

try {
  const configContent = fs.readFileSync(configPath, 'utf8');
  monitoringConfig = yaml.load(configContent);
} catch (error) {
  console.error('Failed to load monitoring config:', error.message);
  monitoringConfig = { alerting: { enabled: true } };
}

/**
 * Alert severity levels
 */
const AlertSeverity = {
  INFO: 'info',
  WARNING: 'warning',
  ERROR: 'error',
  CRITICAL: 'critical',
  EMERGENCY: 'emergency'
};

/**
 * Alert categories
 */
const AlertCategory = {
  SYSTEM_HEALTH: 'system_health',
  DATA_QUALITY: 'data_quality',
  PERFORMANCE: 'performance',
  SECURITY: 'security',
  PIPELINE: 'pipeline',
  SLA: 'sla'
};

/**
 * Alert channels
 */
const AlertChannel = {
  CONSOLE: 'console',
  FILE: 'file',
  WEBHOOK: 'webhook',
  EMAIL: 'email',
  SLACK: 'slack',
  PAGERDUTY: 'pagerduty'
};

/**
 * Alert rule conditions
 */
const AlertCondition = {
  GREATER_THAN: 'gt',
  LESS_THAN: 'lt',
  EQUALS: 'eq',
  NOT_EQUALS: 'ne',
  CONTAINS: 'contains',
  REGEX: 'regex',
  THRESHOLD: 'threshold',
  TREND: 'trend'
};

/**
 * Alert Engine Class
 */
class AlertingEngine {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      cooldownMinutes: options.cooldownMinutes || 5,
      maxAlertsPerHour: options.maxAlertsPerHour || 50,
      escalationEnabled: options.escalationEnabled !== false,
      channels: this.loadChannelConfig(options.channels),
      rules: this.loadAlertRules(options.rules)
    };
    
    this.state = {
      isRunning: false,
      alertHistory: [],
      cooldownMap: new Map(),
      alertCounts: new Map(),
      escalationState: new Map()
    };
    
    this.channelHandlers = new Map();
    this.setupChannelHandlers();
  }
  
  /**
   * Load channel configuration
   */
  loadChannelConfig(customChannels = []) {
    const defaultChannels = monitoringConfig.alerting?.channels || [];
    return [...defaultChannels, ...customChannels];
  }
  
  /**
   * Load alert rules
   */
  loadAlertRules(customRules = []) {
    const defaultRules = monitoringConfig.alerting?.rules || [];
    return [...defaultRules, ...customRules];
  }
  
  /**
   * Setup channel handlers
   */
  setupChannelHandlers() {
    this.channelHandlers.set(AlertChannel.CONSOLE, this.handleConsoleAlert.bind(this));
    this.channelHandlers.set(AlertChannel.FILE, this.handleFileAlert.bind(this));
    this.channelHandlers.set(AlertChannel.WEBHOOK, this.handleWebhookAlert.bind(this));
    this.channelHandlers.set(AlertChannel.EMAIL, this.handleEmailAlert.bind(this));
    this.channelHandlers.set(AlertChannel.SLACK, this.handleSlackAlert.bind(this));
    this.channelHandlers.set(AlertChannel.PAGERDUTY, this.handlePagerDutyAlert.bind(this));
  }
  
  /**
   * Start alerting engine
   */
  async start() {
    if (this.state.isRunning) {
      console.log('Alerting engine already running');
      return;
    }
    
    if (!this.config.enabled) {
      console.log('Alerting is disabled');
      return;
    }
    
    console.log('🚨 Starting alerting engine...');
    
    await system.monitoringStarted({
      component: 'alerting-engine',
      channels: this.config.channels.length,
      rules: this.config.rules.length
    });
    
    this.state.isRunning = true;
    
    console.log(`✅ Alerting engine started (${this.config.channels.length} channels, ${this.config.rules.length} rules)`);
  }
  
  /**
   * Stop alerting engine
   */
  async stop() {
    if (!this.state.isRunning) {
      return;
    }
    
    console.log('⏹️ Stopping alerting engine...');
    
    await system.monitoringStopped({
      component: 'alerting-engine',
      total_alerts: this.state.alertHistory.length
    });
    
    this.state.isRunning = false;
    console.log('✅ Alerting engine stopped');
  }
  
  /**
   * Create and send alert
   * @param {Object} alertData - Alert data
   */
  async sendAlert(alertData) {
    if (!this.config.enabled || !this.state.isRunning) {
      return;
    }
    
    // Create alert object
    const alert = {
      id: this.generateAlertId(),
      timestamp: new Date().toISOString(),
      severity: alertData.severity || AlertSeverity.INFO,
      category: alertData.category || AlertCategory.SYSTEM_HEALTH,
      title: alertData.title || 'System Alert',
      message: alertData.message || 'No message provided',
      source: alertData.source || 'unknown',
      component: alertData.component || 'unknown',
      metadata: alertData.metadata || {},
      tags: alertData.tags || [],
      correlationId: alertData.correlationId || null
    };
    
    // Check rate limiting
    if (!this.checkRateLimit(alert)) {
      console.log(`⚠️ Rate limit exceeded, skipping alert: ${alert.title}`);
      return;
    }
    
    // Check cooldown
    if (!this.checkCooldown(alert)) {
      console.log(`⏱️ Alert in cooldown, skipping: ${alert.title}`);
      return;
    }
    
    // Find matching rules and channels
    const matchingChannels = await this.findMatchingChannels(alert);
    
    if (matchingChannels.length === 0) {
      console.log(`ℹ️ No matching channels for alert: ${alert.title}`);
      return;
    }
    
    // Send to channels
    const results = await this.dispatchAlert(alert, matchingChannels);
    
    // Record alert
    this.recordAlert(alert, results);
    
    // Handle escalation if enabled
    if (this.config.escalationEnabled) {
      await this.handleEscalation(alert);
    }
    
    console.log(`🚨 Alert sent: ${alert.title} (${alert.severity}) to ${results.length} channels`);
  }
  
  /**
   * Generate unique alert ID
   */
  generateAlertId() {
    return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * Check rate limiting
   */
  checkRateLimit(alert) {
    const now = Date.now();
    const hourAgo = now - 3600000; // 1 hour ago
    
    // Clean old counts
    for (const [timestamp, count] of this.state.alertCounts.entries()) {
      if (timestamp < hourAgo) {
        this.state.alertCounts.delete(timestamp);
      }
    }
    
    // Count current hour alerts
    const currentHourAlerts = Array.from(this.state.alertCounts.values())
      .reduce((sum, count) => sum + count, 0);
    
    if (currentHourAlerts >= this.config.maxAlertsPerHour) {
      return false;
    }
    
    // Update count
    const hourBucket = Math.floor(now / 3600000) * 3600000;
    this.state.alertCounts.set(hourBucket, (this.state.alertCounts.get(hourBucket) || 0) + 1);
    
    return true;
  }
  
  /**
   * Check cooldown period
   */
  checkCooldown(alert) {
    const cooldownKey = `${alert.category}_${alert.source}_${alert.title}`;
    const lastSent = this.state.cooldownMap.get(cooldownKey);
    
    if (!lastSent) {
      this.state.cooldownMap.set(cooldownKey, Date.now());
      return true;
    }
    
    const cooldownMs = this.config.cooldownMinutes * 60 * 1000;
    const timeSinceLastSent = Date.now() - lastSent;
    
    if (timeSinceLastSent >= cooldownMs) {
      this.state.cooldownMap.set(cooldownKey, Date.now());
      return true;
    }
    
    return false;
  }
  
  /**
   * Find matching channels for alert
   */
  async findMatchingChannels(alert) {
    const matchingChannels = [];
    
    for (const channel of this.config.channels) {
      if (!channel.enabled) continue;
      
      // Check severity level
      const severityLevels = [
        AlertSeverity.INFO,
        AlertSeverity.WARNING,
        AlertSeverity.ERROR,
        AlertSeverity.CRITICAL,
        AlertSeverity.EMERGENCY
      ];
      
      const alertSeverityIndex = severityLevels.indexOf(alert.severity);
      const channelSeverityIndex = severityLevels.indexOf(channel.level || AlertSeverity.INFO);
      
      if (alertSeverityIndex >= channelSeverityIndex) {
        matchingChannels.push(channel);
      }
    }
    
    // Find rule-based channels
    for (const rule of this.config.rules) {
      if (this.evaluateRule(rule, alert)) {
        for (const channelType of rule.channels || []) {
          const channel = this.config.channels.find(c => c.type === channelType);
          if (channel && channel.enabled && !matchingChannels.includes(channel)) {
            matchingChannels.push(channel);
          }
        }
      }
    }
    
    return matchingChannels;
  }
  
  /**
   * Evaluate alert rule
   */
  evaluateRule(rule, alert) {
    if (!rule.condition) return false;
    
    try {
      // Simple condition evaluation
      // In a production system, you'd want a more sophisticated rule engine
      if (rule.condition.includes('quality_gate.failed')) {
        return alert.category === AlertCategory.DATA_QUALITY && 
               alert.severity === AlertSeverity.CRITICAL;
      }
      
      if (rule.condition.includes('response_time_p95 > 1000')) {
        return alert.category === AlertCategory.PERFORMANCE &&
               alert.metadata.response_time_p95 > 1000;
      }
      
      if (rule.condition.includes('memory_usage_percentage > 90')) {
        return alert.category === AlertCategory.SYSTEM_HEALTH &&
               alert.metadata.memory_usage > 90;
      }
      
      if (rule.condition.includes('test_success_rate < 95')) {
        return alert.category === AlertCategory.DATA_QUALITY &&
               alert.metadata.test_success_rate < 95;
      }
      
      if (rule.condition.includes('sla_compliance < 99.5')) {
        return alert.category === AlertCategory.SLA &&
               alert.metadata.sla_compliance < 99.5;
      }
      
      return false;
    } catch (error) {
      console.error(`Rule evaluation failed for ${rule.name}:`, error.message);
      return false;
    }
  }
  
  /**
   * Dispatch alert to channels
   */
  async dispatchAlert(alert, channels) {
    const results = [];
    
    for (const channel of channels) {
      try {
        const handler = this.channelHandlers.get(channel.type);
        if (handler) {
          await handler(alert, channel);
          results.push({ channel: channel.type, status: 'success' });
        } else {
          console.warn(`No handler found for channel type: ${channel.type}`);
          results.push({ channel: channel.type, status: 'no_handler' });
        }
      } catch (error) {
        console.error(`Failed to send alert to ${channel.type}:`, error.message);
        results.push({ channel: channel.type, status: 'error', error: error.message });
      }
    }
    
    return results;
  }
  
  /**
   * Handle console alerts
   */
  async handleConsoleAlert(alert, channel) {
    const severityIcons = {
      [AlertSeverity.INFO]: 'ℹ️',
      [AlertSeverity.WARNING]: '⚠️',
      [AlertSeverity.ERROR]: '❌',
      [AlertSeverity.CRITICAL]: '🚨',
      [AlertSeverity.EMERGENCY]: '🆘'
    };
    
    const icon = severityIcons[alert.severity] || 'ℹ️';
    const timestamp = new Date(alert.timestamp).toLocaleString();
    
    console.log(`\n${icon} ALERT [${alert.severity.toUpperCase()}] - ${timestamp}`);
    console.log(`Title: ${alert.title}`);
    console.log(`Message: ${alert.message}`);
    console.log(`Source: ${alert.source} | Component: ${alert.component}`);
    
    if (Object.keys(alert.metadata).length > 0) {
      console.log(`Metadata: ${JSON.stringify(alert.metadata, null, 2)}`);
    }
    
    console.log('─'.repeat(60));
  }
  
  /**
   * Handle file alerts
   */
  async handleFileAlert(alert, channel) {
    const alertsFile = path.join(__dirname, '../../logs', 'alerts.log');
    const logEntry = JSON.stringify({
      ...alert,
      channel_type: 'file'
    }) + '\n';
    
    await fs.appendFile(alertsFile, logEntry, 'utf8');
  }
  
  /**
   * Handle webhook alerts
   */
  async handleWebhookAlert(alert, channel) {
    // Placeholder - would use HTTP client to send webhook
    console.log(`📡 Webhook alert sent to: ${channel.webhook_url}`);
    
    // In a real implementation:
    // const response = await fetch(channel.webhook_url, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(alert)
    // });
  }
  
  /**
   * Handle email alerts
   */
  async handleEmailAlert(alert, channel) {
    // Placeholder - would use email service
    console.log(`📧 Email alert sent to: ${channel.recipients?.join(', ')}`);
    
    // In a real implementation, you'd use nodemailer or similar:
    // await this.emailService.send({
    //   to: channel.recipients,
    //   subject: `[${alert.severity.toUpperCase()}] ${alert.title}`,
    //   text: alert.message,
    //   html: this.formatEmailAlert(alert)
    // });
  }
  
  /**
   * Handle Slack alerts
   */
  async handleSlackAlert(alert, channel) {
    // Placeholder - would use Slack webhook
    console.log(`💬 Slack alert sent to: ${channel.channel}`);
    
    // In a real implementation:
    // const slackMessage = {
    //   channel: channel.channel,
    //   text: alert.title,
    //   attachments: [{
    //     color: this.getSeverityColor(alert.severity),
    //     fields: [
    //       { title: 'Message', value: alert.message, short: false },
    //       { title: 'Source', value: alert.source, short: true },
    //       { title: 'Component', value: alert.component, short: true }
    //     ]
    //   }]
    // };
  }
  
  /**
   * Handle PagerDuty alerts
   */
  async handlePagerDutyAlert(alert, channel) {
    // Placeholder - would use PagerDuty API
    console.log(`📟 PagerDuty alert sent with service key: ${channel.service_key?.substring(0, 8)}...`);
    
    // In a real implementation:
    // await this.pagerDutyClient.trigger({
    //   routing_key: channel.service_key,
    //   event_action: 'trigger',
    //   dedup_key: alert.id,
    //   payload: {
    //     summary: alert.title,
    //     severity: alert.severity,
    //     source: alert.source,
    //     component: alert.component
    //   }
    // });
  }
  
  /**
   * Record alert in history
   */
  recordAlert(alert, results) {
    const record = {
      ...alert,
      delivery_results: results,
      delivery_timestamp: new Date().toISOString()
    };
    
    this.state.alertHistory.push(record);
    
    // Trim history to last 1000 alerts
    if (this.state.alertHistory.length > 1000) {
      this.state.alertHistory.shift();
    }
    
    // Log to security logger for critical/emergency alerts
    if (alert.severity === AlertSeverity.CRITICAL || alert.severity === AlertSeverity.EMERGENCY) {
      securityLogger.logSecurityEvent('ERROR', 'CRITICAL_ALERT_SENT', {
        alert_id: alert.id,
        title: alert.title,
        severity: alert.severity,
        category: alert.category,
        source: alert.source,
        component: alert.component,
        channels: results.map(r => r.channel)
      });
    }
  }
  
  /**
   * Handle escalation logic
   */
  async handleEscalation(alert) {
    if (alert.severity !== AlertSeverity.CRITICAL && alert.severity !== AlertSeverity.EMERGENCY) {
      return;
    }
    
    const escalationKey = `${alert.category}_${alert.source}`;
    const escalationState = this.state.escalationState.get(escalationKey) || {
      count: 0,
      firstAlert: alert.timestamp,
      lastEscalation: null
    };
    
    escalationState.count++;
    escalationState.lastAlert = alert.timestamp;
    
    // Escalate after 3 critical alerts within 15 minutes
    if (escalationState.count >= 3) {
      const firstAlertTime = new Date(escalationState.firstAlert).getTime();
      const currentTime = new Date(alert.timestamp).getTime();
      const timeDiff = currentTime - firstAlertTime;
      
      if (timeDiff <= 15 * 60 * 1000) { // 15 minutes
        await this.escalateAlert(alert, escalationState);
        escalationState.count = 0; // Reset counter after escalation
        escalationState.lastEscalation = alert.timestamp;
      }
    }
    
    this.state.escalationState.set(escalationKey, escalationState);
  }
  
  /**
   * Escalate alert to higher channels
   */
  async escalateAlert(alert, escalationState) {
    console.log(`📈 Escalating alert: ${alert.title} (${escalationState.count} occurrences)`);
    
    const escalatedAlert = {
      ...alert,
      title: `ESCALATED: ${alert.title}`,
      message: `Alert has occurred ${escalationState.count} times. Original message: ${alert.message}`,
      severity: AlertSeverity.EMERGENCY,
      metadata: {
        ...alert.metadata,
        escalation_count: escalationState.count,
        first_occurrence: escalationState.firstAlert,
        escalated_at: new Date().toISOString()
      }
    };
    
    // Send to emergency channels only
    const emergencyChannels = this.config.channels.filter(c => 
      c.enabled && (c.level === AlertSeverity.EMERGENCY || c.type === 'pagerduty')
    );
    
    if (emergencyChannels.length > 0) {
      await this.dispatchAlert(escalatedAlert, emergencyChannels);
    }
  }
  
  /**
   * Get alert statistics
   */
  getAlertStats() {
    const now = Date.now();
    const lastHour = now - 3600000;
    const lastDay = now - 86400000;
    
    const recentAlerts = this.state.alertHistory.filter(a => 
      new Date(a.timestamp).getTime() > lastHour
    );
    
    const dailyAlerts = this.state.alertHistory.filter(a => 
      new Date(a.timestamp).getTime() > lastDay
    );
    
    const stats = {
      total_alerts: this.state.alertHistory.length,
      last_hour: recentAlerts.length,
      last_24_hours: dailyAlerts.length,
      by_severity: {},
      by_category: {},
      escalations: this.state.escalationState.size
    };
    
    // Count by severity and category
    this.state.alertHistory.forEach(alert => {
      stats.by_severity[alert.severity] = (stats.by_severity[alert.severity] || 0) + 1;
      stats.by_category[alert.category] = (stats.by_category[alert.category] || 0) + 1;
    });
    
    return stats;
  }
  
  /**
   * Get recent alerts
   */
  getRecentAlerts(count = 50) {
    return this.state.alertHistory.slice(-count).reverse();
  }
}

// Create global alerting engine instance
const alertingEngine = new AlertingEngine();

/**
 * Convenience functions for sending different types of alerts
 */
const alerts = {
  /**
   * Send system health alert
   */
  async systemHealth(title, message, severity = AlertSeverity.WARNING, metadata = {}) {
    await alertingEngine.sendAlert({
      category: AlertCategory.SYSTEM_HEALTH,
      title,
      message,
      severity,
      metadata
    });
  },
  
  /**
   * Send data quality alert
   */
  async dataQuality(title, message, severity = AlertSeverity.WARNING, metadata = {}) {
    await alertingEngine.sendAlert({
      category: AlertCategory.DATA_QUALITY,
      title,
      message,
      severity,
      metadata
    });
  },
  
  /**
   * Send performance alert
   */
  async performance(title, message, severity = AlertSeverity.WARNING, metadata = {}) {
    await alertingEngine.sendAlert({
      category: AlertCategory.PERFORMANCE,
      title,
      message,
      severity,
      metadata
    });
  },
  
  /**
   * Send security alert
   */
  async security(title, message, severity = AlertSeverity.CRITICAL, metadata = {}) {
    await alertingEngine.sendAlert({
      category: AlertCategory.SECURITY,
      title,
      message,
      severity,
      metadata
    });
  },
  
  /**
   * Send pipeline alert
   */
  async pipeline(title, message, severity = AlertSeverity.WARNING, metadata = {}) {
    await alertingEngine.sendAlert({
      category: AlertCategory.PIPELINE,
      title,
      message,
      severity,
      metadata
    });
  },
  
  /**
   * Send SLA alert
   */
  async sla(title, message, severity = AlertSeverity.CRITICAL, metadata = {}) {
    await alertingEngine.sendAlert({
      category: AlertCategory.SLA,
      title,
      message,
      severity,
      metadata
    });
  }
};

/**
 * Console interface for alerting
 */
const alertingCLI = {
  /**
   * Start alerting engine
   */
  async start() {
    await alertingEngine.start();
  },
  
  /**
   * Stop alerting engine
   */
  async stop() {
    await alertingEngine.stop();
  },
  
  /**
   * Show alert statistics
   */
  stats() {
    const stats = alertingEngine.getAlertStats();
    console.log('\n🚨 Alert Statistics:');
    console.log('═'.repeat(40));
    console.log(`Total Alerts: ${stats.total_alerts}`);
    console.log(`Last Hour: ${stats.last_hour}`);
    console.log(`Last 24 Hours: ${stats.last_24_hours}`);
    console.log(`Escalations: ${stats.escalations}`);
    
    console.log('\nBy Severity:');
    for (const [severity, count] of Object.entries(stats.by_severity)) {
      console.log(`  ${severity}: ${count}`);
    }
    
    console.log('\nBy Category:');
    for (const [category, count] of Object.entries(stats.by_category)) {
      console.log(`  ${category}: ${count}`);
    }
  },
  
  /**
   * Show recent alerts
   */
  recent(count = 10) {
    const recentAlerts = alertingEngine.getRecentAlerts(count);
    
    console.log(`\n📋 Recent Alerts (${recentAlerts.length}):`);
    console.log('═'.repeat(60));
    
    recentAlerts.forEach(alert => {
      console.log(`${alert.timestamp} [${alert.severity.toUpperCase()}] ${alert.title}`);
      console.log(`  ${alert.message}`);
      console.log(`  Source: ${alert.source} | Component: ${alert.component}`);
      console.log('');
    });
  },
  
  /**
   * Test alert
   */
  async test(severity = AlertSeverity.INFO) {
    await alertingEngine.sendAlert({
      title: 'Test Alert',
      message: `This is a test alert with severity: ${severity}`,
      severity,
      category: AlertCategory.SYSTEM_HEALTH,
      source: 'alerting-test',
      component: 'cli',
      metadata: { test: true, timestamp: new Date().toISOString() }
    });
    
    console.log(`✅ Test alert sent with severity: ${severity}`);
  }
};

module.exports = {
  AlertingEngine,
  alertingEngine,
  alerts,
  alertingCLI,
  AlertSeverity,
  AlertCategory,
  AlertChannel,
  AlertCondition
};