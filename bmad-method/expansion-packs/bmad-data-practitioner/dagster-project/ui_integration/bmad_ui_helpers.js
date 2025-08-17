/**
 * BMad UI Integration Helpers
 * Provides utilities for integrating Dagster UI with BMad interfaces
 */

const fs = require('fs-extra');
const path = require('path');

class BMadUIIntegration {
  constructor(options = {}) {
    this.dagsterWebPort = options.dagsterWebPort || 3001;
    this.orchestratorPort = options.orchestratorPort || 3003;
    this.lineageWebPort = options.lineageWebPort || 5000;
    
    this.baseUrls = {
      dagster: `http://localhost:${this.dagsterWebPort}`,
      orchestrator: `http://localhost:${this.orchestratorPort}`,
      lineage: `http://localhost:${this.lineageWebPort}`
    };
  }

  /**
   * Generate BMad-specific navigation config for Dagster UI
   */
  generateNavigationConfig() {
    return {
      title: "BMad Data Practitioner - Workflow Orchestration",
      description: "Asset-centric data pipeline orchestration with Dagster",
      
      // Custom navigation items
      navigation: [
        {
          label: "Pipeline Overview",
          url: `${this.baseUrls.dagster}/overview`,
          description: "Overview of all pipeline assets and jobs"
        },
        {
          label: "Asset Lineage",
          url: `${this.baseUrls.dagster}/asset-lineage`,
          description: "Interactive asset dependency visualization"
        },
        {
          label: "Run History",
          url: `${this.baseUrls.dagster}/runs`,
          description: "Pipeline execution history and logs"
        },
        {
          label: "Schedules & Sensors",
          url: `${this.baseUrls.dagster}/automation`,
          description: "Automated pipeline triggers and schedules"
        }
      ],
      
      // External integrations
      external_links: [
        {
          label: "Orchestrator API",
          url: `${this.baseUrls.orchestrator}/health`,
          description: "Workflow orchestrator service status",
          type: "api"
        },
        {
          label: "Lineage Explorer",
          url: `${this.baseUrls.lineage}`,
          description: "Interactive lineage visualization tool",
          type: "webapp"
        },
        {
          label: "API Documentation",
          url: `${this.baseUrls.orchestrator}/api/docs`,
          description: "REST API documentation",
          type: "docs"
        }
      ],
      
      // Asset groups configuration
      asset_groups: [
        {
          name: "infrastructure",
          color: "#FF6B6B",
          description: "Infrastructure and system health assets"
        },
        {
          name: "ingestion",
          color: "#4ECDC4",
          description: "Data ingestion and source assets"
        },
        {
          name: "analytics",
          color: "#45B7D1",
          description: "Analytical processing and computation assets"
        },
        {
          name: "transformation",
          color: "#96CEB4",
          description: "Data transformation and cleaning assets"
        },
        {
          name: "publication",
          color: "#FECA57",
          description: "Data publication and reporting assets"
        },
        {
          name: "validation",
          color: "#FF9FF3",
          description: "Data quality and validation assets"
        },
        {
          name: "monitoring",
          color: "#A8E6CF",
          description: "Monitoring and alerting assets"
        }
      ]
    };
  }

  /**
   * Generate quick action buttons for Dagster UI
   */
  generateQuickActions() {
    return [
      {
        label: "Run Full Pipeline",
        action: "launch_job",
        job_name: "complete_data_pipeline",
        description: "Execute the complete data pipeline from ingestion to publication",
        icon: "play_arrow",
        color: "primary"
      },
      {
        label: "Incremental Update",
        action: "launch_job", 
        job_name: "incremental_pipeline",
        description: "Run incremental data updates",
        icon: "update",
        color: "secondary"
      },
      {
        label: "Data Quality Check",
        action: "launch_job",
        job_name: "data_quality_pipeline",
        description: "Validate data quality across all assets",
        icon: "check_circle",
        color: "success"
      },
      {
        label: "Generate Lineage Report",
        action: "external_link",
        url: `${this.baseUrls.lineage}/api/lineage/report?format=html`,
        description: "Generate comprehensive lineage report",
        icon: "account_tree",
        color: "info"
      },
      {
        label: "View Monitoring Dashboard",
        action: "external_link",
        url: `${this.baseUrls.orchestrator}/api/v1/orchestration/monitoring/pipeline-status`,
        description: "View real-time pipeline monitoring",
        icon: "dashboard",
        color: "warning"
      }
    ];
  }

  /**
   * Generate asset metadata for enhanced UI display
   */
  generateAssetMetadata() {
    return {
      // Custom metadata fields to display in UI
      display_fields: [
        {
          field: "group_name",
          label: "Asset Group",
          type: "badge",
          color_map: {
            "infrastructure": "red",
            "ingestion": "teal", 
            "analytics": "blue",
            "transformation": "green",
            "publication": "yellow",
            "validation": "pink",
            "monitoring": "lightgreen"
          }
        },
        {
          field: "compute_kind",
          label: "Compute Type",
          type: "text"
        },
        {
          field: "description",
          label: "Description",
          type: "text"
        },
        {
          field: "last_updated",
          label: "Last Updated",
          type: "datetime"
        }
      ],
      
      // Status indicators
      status_indicators: [
        {
          status: "materialized",
          color: "green",
          icon: "check_circle",
          label: "Materialized"
        },
        {
          status: "failed",
          color: "red", 
          icon: "error",
          label: "Failed"
        },
        {
          status: "in_progress",
          color: "blue",
          icon: "hourglass_empty",
          label: "In Progress"
        },
        {
          status: "stale",
          color: "orange",
          icon: "warning",
          label: "Stale"
        }
      ]
    };
  }

  /**
   * Generate custom dashboard configuration
   */
  generateDashboardConfig() {
    return {
      dashboard_title: "BMad Data Practitioner Pipeline",
      
      // Widget configuration
      widgets: [
        {
          type: "pipeline_status",
          title: "Pipeline Health",
          position: { row: 1, col: 1, width: 2, height: 1 },
          config: {
            show_success_rate: true,
            show_last_run: true,
            time_window: "24h"
          }
        },
        {
          type: "asset_groups",
          title: "Asset Groups",
          position: { row: 1, col: 3, width: 2, height: 1 },
          config: {
            show_counts: true,
            color_coded: true
          }
        },
        {
          type: "recent_runs",
          title: "Recent Pipeline Runs",
          position: { row: 2, col: 1, width: 4, height: 2 },
          config: {
            limit: 10,
            show_duration: true,
            show_status: true
          }
        },
        {
          type: "lineage_preview",
          title: "Asset Lineage Preview",
          position: { row: 4, col: 1, width: 4, height: 2 },
          config: {
            focus_asset: null,
            interactive: true,
            link_to_full_view: `${this.baseUrls.lineage}`
          }
        }
      ],
      
      // Refresh configuration
      auto_refresh: {
        enabled: true,
        interval: 30000, // 30 seconds
        widgets: ["pipeline_status", "recent_runs"]
      }
    };
  }

  /**
   * Generate workspace configuration enhancements
   */
  generateWorkspaceEnhancements() {
    return {
      // UI customizations
      ui_customization: {
        theme: {
          primary_color: "#667eea",
          secondary_color: "#764ba2",
          accent_color: "#4ECDC4"
        },
        
        branding: {
          title: "BMad Data Practitioner",
          subtitle: "Asset-Centric Data Pipeline Orchestration",
          logo_url: "/static/bmad-logo.png"
        },
        
        layout: {
          sidebar_width: 280,
          header_height: 64,
          compact_mode: false
        }
      },
      
      // Feature flags
      features: {
        asset_lineage_enabled: true,
        monitoring_dashboard_enabled: true,
        custom_metadata_enabled: true,
        external_integrations_enabled: true
      },
      
      // Notification settings
      notifications: {
        pipeline_failures: {
          enabled: true,
          channels: ["ui", "webhook"],
          webhook_url: `${this.baseUrls.orchestrator}/api/v1/orchestration/webhooks/notifications`
        },
        
        asset_materialization: {
          enabled: true,
          channels: ["ui"],
          filter_by_group: ["analytics", "publication"]
        }
      }
    };
  }

  /**
   * Save all UI configuration files
   */
  async saveUIConfigurations(outputDir) {
    const configs = {
      'navigation.json': this.generateNavigationConfig(),
      'quick-actions.json': this.generateQuickActions(),
      'asset-metadata.json': this.generateAssetMetadata(),
      'dashboard.json': this.generateDashboardConfig(),
      'workspace-enhancements.json': this.generateWorkspaceEnhancements()
    };

    await fs.ensureDir(outputDir);

    const savedFiles = [];
    for (const [filename, config] of Object.entries(configs)) {
      const filePath = path.join(outputDir, filename);
      await fs.writeJson(filePath, config, { spaces: 2 });
      savedFiles.push(filePath);
    }

    return savedFiles;
  }

  /**
   * Generate HTML integration snippets
   */
  generateHTMLSnippets() {
    return {
      // Custom CSS for BMad styling
      css: `
        .bmad-asset-group {
          display: inline-block;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          text-transform: uppercase;
        }
        
        .bmad-asset-group.infrastructure { background-color: #FF6B6B; color: white; }
        .bmad-asset-group.ingestion { background-color: #4ECDC4; color: white; }
        .bmad-asset-group.analytics { background-color: #45B7D1; color: white; }
        .bmad-asset-group.transformation { background-color: #96CEB4; color: white; }
        .bmad-asset-group.publication { background-color: #FECA57; color: black; }
        .bmad-asset-group.validation { background-color: #FF9FF3; color: black; }
        .bmad-asset-group.monitoring { background-color: #A8E6CF; color: black; }
        
        .bmad-quick-actions {
          display: flex;
          gap: 10px;
          margin: 15px 0;
          flex-wrap: wrap;
        }
        
        .bmad-quick-action {
          padding: 8px 16px;
          border-radius: 6px;
          border: none;
          cursor: pointer;
          font-weight: 500;
          transition: background-color 0.2s;
        }
        
        .bmad-quick-action.primary { background: #667eea; color: white; }
        .bmad-quick-action.secondary { background: #6c757d; color: white; }
        .bmad-quick-action.success { background: #28a745; color: white; }
        .bmad-quick-action.info { background: #17a2b8; color: white; }
        .bmad-quick-action.warning { background: #ffc107; color: black; }
      `,
      
      // JavaScript for enhanced interactions
      javascript: `
        class BMadUIEnhancer {
          constructor() {
            this.init();
          }
          
          init() {
            this.addQuickActions();
            this.enhanceAssetDisplay();
            this.setupNotifications();
          }
          
          addQuickActions() {
            const quickActions = ${JSON.stringify(this.generateQuickActions())};
            // Implementation would add quick action buttons to Dagster UI
          }
          
          enhanceAssetDisplay() {
            // Add custom metadata display to asset cards
            document.querySelectorAll('.asset-card').forEach(card => {
              this.addAssetGroupBadge(card);
            });
          }
          
          addAssetGroupBadge(card) {
            const groupName = card.dataset.group || 'other';
            const badge = document.createElement('span');
            badge.className = \`bmad-asset-group \${groupName}\`;
            badge.textContent = groupName;
            card.appendChild(badge);
          }
          
          setupNotifications() {
            // Setup real-time notifications from orchestrator
            const eventSource = new EventSource('${this.baseUrls.orchestrator}/api/v1/orchestration/events');
            eventSource.onmessage = (event) => {
              const data = JSON.parse(event.data);
              this.showNotification(data);
            };
          }
          
          showNotification(data) {
            // Display notification in Dagster UI
            console.log('Pipeline notification:', data);
          }
        }
        
        // Initialize BMad UI enhancements when DOM is loaded
        document.addEventListener('DOMContentLoaded', () => {
          new BMadUIEnhancer();
        });
      `
    };
  }
}

module.exports = BMadUIIntegration;