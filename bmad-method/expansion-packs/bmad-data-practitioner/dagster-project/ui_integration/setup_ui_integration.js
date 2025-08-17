#!/usr/bin/env node

/**
 * Setup UI Integration Script
 * Configures Dagster UI with BMad-specific customizations and integrations
 */

const path = require('path');
const fs = require('fs-extra');
const BMadUIIntegration = require('./bmad_ui_helpers');

async function setupUIIntegration() {
  console.log('🎨 Setting up BMad UI Integration for Dagster...');
  
  try {
    // Create UI integration instance
    const uiIntegration = new BMadUIIntegration({
      dagsterWebPort: process.env.DAGSTER_WEB_PORT || 3001,
      orchestratorPort: process.env.ORCHESTRATOR_PORT || 3003,
      lineageWebPort: process.env.LINEAGE_WEB_PORT || 5000
    });
    
    // Setup directories
    const configDir = path.join(__dirname, '../config/ui');
    const staticDir = path.join(__dirname, '../static');
    
    await fs.ensureDir(configDir);
    await fs.ensureDir(staticDir);
    
    console.log('📁 Created configuration directories');
    
    // Save UI configurations
    const savedFiles = await uiIntegration.saveUIConfigurations(configDir);
    console.log('💾 Saved UI configuration files:');
    savedFiles.forEach(file => console.log(`   - ${path.basename(file)}`));
    
    // Generate and save HTML snippets
    const htmlSnippets = uiIntegration.generateHTMLSnippets();
    
    await fs.writeFile(
      path.join(staticDir, 'bmad-ui-styles.css'),
      htmlSnippets.css
    );
    
    await fs.writeFile(
      path.join(staticDir, 'bmad-ui-enhancements.js'),
      htmlSnippets.javascript
    );
    
    console.log('🎨 Generated UI styling and enhancement files');
    
    // Create integration documentation
    const documentation = generateIntegrationDocumentation(uiIntegration);
    await fs.writeFile(
      path.join(__dirname, '../README-UI-Integration.md'),
      documentation
    );
    
    console.log('📚 Created UI integration documentation');
    
    // Update Dagster configuration with UI customizations
    await updateDagsterConfig(configDir);
    
    console.log('⚙️  Updated Dagster configuration');
    
    console.log('✅ BMad UI Integration setup complete!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Start the Dagster web UI: npm run dagster:ui');
    console.log('2. Start the Workflow Orchestrator: npm run orchestrator:start');
    console.log('3. Start the Lineage Web Interface: npm run lineage:start');
    console.log('');
    console.log('Access points:');
    console.log(`- Dagster UI: http://localhost:${uiIntegration.dagsterWebPort}`);
    console.log(`- Orchestrator API: http://localhost:${uiIntegration.orchestratorPort}/health`);
    console.log(`- Lineage Explorer: http://localhost:${uiIntegration.lineageWebPort}`);
    
  } catch (error) {
    console.error('❌ Failed to setup UI integration:', error);
    process.exit(1);
  }
}

function generateIntegrationDocumentation(uiIntegration) {
  return `# BMad UI Integration for Dagster

This document describes the UI integration between BMad Data Practitioner system and Dagster.

## Overview

The BMad UI integration enhances the standard Dagster web interface with:

- **Custom Navigation**: BMad-specific navigation and quick actions
- **Asset Group Visualization**: Color-coded asset groups with BMad branding
- **External Integrations**: Links to orchestrator API and lineage explorer
- **Real-time Monitoring**: Live pipeline status and notifications
- **Enhanced Metadata**: Custom asset metadata display

## Architecture

### Components

1. **Dagster Web UI** (Port: ${uiIntegration.dagsterWebPort})
   - Standard Dagster interface with BMad customizations
   - Asset-centric pipeline visualization
   - Job execution and monitoring

2. **Workflow Orchestrator API** (Port: ${uiIntegration.orchestratorPort})
   - RESTful API for pipeline management
   - Real-time monitoring and alerting
   - Asset lineage endpoints

3. **Lineage Web Interface** (Port: ${uiIntegration.lineageWebPort})
   - Interactive asset lineage exploration
   - Visualization generation
   - Lineage reporting

### Configuration Files

- \`config/ui/navigation.json\`: Custom navigation configuration
- \`config/ui/quick-actions.json\`: Quick action buttons
- \`config/ui/asset-metadata.json\`: Asset display metadata
- \`config/ui/dashboard.json\`: Dashboard widget configuration
- \`config/ui/workspace-enhancements.json\`: Workspace customizations

### Static Assets

- \`static/bmad-ui-styles.css\`: Custom styling for BMad branding
- \`static/bmad-ui-enhancements.js\`: JavaScript enhancements

## Asset Groups

The system defines the following asset groups with color coding:

| Group | Color | Description |
|-------|-------|-------------|
| Infrastructure | Red (#FF6B6B) | System health and infrastructure assets |
| Ingestion | Teal (#4ECDC4) | Data ingestion and source assets |
| Analytics | Blue (#45B7D1) | Analytical processing assets |
| Transformation | Green (#96CEB4) | Data transformation assets |
| Publication | Yellow (#FECA57) | Data publication and reporting |
| Validation | Pink (#FF9FF3) | Data quality validation assets |
| Monitoring | Light Green (#A8E6CF) | Monitoring and alerting assets |

## Quick Actions

Pre-configured quick actions available in the UI:

- **Run Full Pipeline**: Execute complete data pipeline
- **Incremental Update**: Run incremental data updates
- **Data Quality Check**: Validate data quality
- **Generate Lineage Report**: Create comprehensive lineage report
- **View Monitoring Dashboard**: Access real-time monitoring

## API Endpoints

### Workflow Orchestrator API

- \`GET /health\`: Service health check
- \`POST /api/v1/orchestration/services/start\`: Start Dagster services
- \`GET /api/v1/orchestration/assets\`: List all assets
- \`GET /api/v1/orchestration/assets/:id/lineage\`: Get asset lineage
- \`POST /api/v1/orchestration/runs/launch\`: Launch pipeline run
- \`GET /api/v1/orchestration/monitoring/pipeline-status\`: Pipeline status
- \`GET /api/v1/orchestration/lineage/visualization\`: Generate lineage visualization

### Lineage Web Interface API

- \`GET /api/assets\`: List all assets
- \`GET /api/assets/:id/lineage\`: Get asset lineage
- \`GET /api/lineage/visualization\`: Generate visualization
- \`GET /api/lineage/report\`: Generate lineage report
- \`GET /api/lineage/summary\`: Get lineage summary statistics

## Usage

### Starting the Services

1. **Start Dagster UI**:
   \`\`\`bash
   npm run dagster:ui
   \`\`\`

2. **Start Workflow Orchestrator**:
   \`\`\`bash
   npm run orchestrator:start
   \`\`\`

3. **Start Lineage Explorer**:
   \`\`\`bash
   npm run lineage:start
   \`\`\`

### Accessing the Interfaces

- **Main Dagster UI**: http://localhost:${uiIntegration.dagsterWebPort}
- **Orchestrator Health**: http://localhost:${uiIntegration.orchestratorPort}/health
- **Lineage Explorer**: http://localhost:${uiIntegration.lineageWebPort}

### Running Pipelines

1. **Via Dagster UI**: Use the "Launchpad" to execute jobs with custom configuration
2. **Via Quick Actions**: Use pre-configured quick action buttons
3. **Via API**: Send HTTP requests to orchestrator endpoints
4. **Via Schedules**: Automatic execution based on configured schedules

### Monitoring and Alerts

- **Real-time Status**: View live pipeline status in the dashboard
- **Performance Metrics**: Monitor execution times and resource usage
- **Alert Notifications**: Receive alerts for failures and performance issues
- **Historical Analysis**: Review past runs and performance trends

### Asset Lineage

1. **Interactive Visualization**: Explore asset dependencies in the lineage explorer
2. **Focused Views**: Generate lineage focused on specific assets
3. **Export Reports**: Create HTML or JSON lineage reports
4. **API Integration**: Access lineage data programmatically

## Customization

### Adding New Asset Groups

1. Update \`config/ui/navigation.json\`
2. Add color mapping in \`static/bmad-ui-styles.css\`
3. Update asset metadata configuration

### Creating Custom Quick Actions

1. Edit \`config/ui/quick-actions.json\`
2. Add corresponding job definitions in Dagster
3. Update UI JavaScript if needed

### Modifying Dashboard

1. Update \`config/ui/dashboard.json\`
2. Configure widget positions and settings
3. Customize refresh intervals

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports ${uiIntegration.dagsterWebPort}, ${uiIntegration.orchestratorPort}, and ${uiIntegration.lineageWebPort} are available
2. **Python Environment**: Ensure Dagster is installed in the active Python environment
3. **Asset Loading**: Check that asset files are properly configured in workspace.yaml
4. **Service Dependencies**: Verify all required services are running

### Debug Commands

\`\`\`bash
# Check Dagster installation
dagster --version

# Validate workspace
dagster workspace show

# Test API endpoints
curl http://localhost:${uiIntegration.orchestratorPort}/health
curl http://localhost:${uiIntegration.lineageWebPort}/health

# Check service logs
npm run orchestrator:logs
npm run dagster:logs
\`\`\`

## Integration Architecture Diagram

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dagster UI    │    │   Orchestrator  │    │ Lineage Explorer│
│   Port: ${uiIntegration.dagsterWebPort}     │    │   Port: ${uiIntegration.orchestratorPort}     │    │   Port: ${uiIntegration.lineageWebPort}     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  BMad Assets &  │
                    │   Dagster Core  │
                    └─────────────────┘
\`\`\`

## Security Considerations

- **API Keys**: Configure API keys for orchestrator endpoints
- **CORS**: Configure CORS policies for cross-origin requests
- **Authentication**: Implement authentication for production deployments
- **Network Security**: Use appropriate network security measures

---

For more information, see the BMad Data Practitioner documentation.
`;
}

async function updateDagsterConfig(configDir) {
  // Create a dagster.yaml configuration that includes UI customizations
  const dagsterConfig = {
    telemetry: {
      enabled: false
    },
    
    // Custom UI configuration (if supported by Dagster version)
    ui: {
      title: "BMad Data Practitioner",
      theme: {
        primaryColor: "#667eea",
        secondaryColor: "#764ba2"
      }
    },
    
    // Logging configuration
    python_logs: {
      python_log_level: "INFO",
      dagster_handler_config: {
        handlers: {
          console: {
            class: "logging.StreamHandler",
            level: "INFO",
            formatter: "colored"
          }
        }
      }
    }
  };
  
  const yaml = require('js-yaml');
  const configPath = path.join(configDir, '../dagster.yaml');
  
  await fs.writeFile(configPath, yaml.dump(dagsterConfig));
}

// Run the setup if this script is executed directly
if (require.main === module) {
  setupUIIntegration().catch(console.error);
}

module.exports = { setupUIIntegration };