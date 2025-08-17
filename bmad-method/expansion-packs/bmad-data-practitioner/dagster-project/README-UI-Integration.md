# BMad UI Integration for Dagster

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

1. **Dagster Web UI** (Port: 3001)
   - Standard Dagster interface with BMad customizations
   - Asset-centric pipeline visualization
   - Job execution and monitoring

2. **Workflow Orchestrator API** (Port: 3003)
   - RESTful API for pipeline management
   - Real-time monitoring and alerting
   - Asset lineage endpoints

3. **Lineage Web Interface** (Port: 5000)
   - Interactive asset lineage exploration
   - Visualization generation
   - Lineage reporting

### Configuration Files

- `config/ui/navigation.json`: Custom navigation configuration
- `config/ui/quick-actions.json`: Quick action buttons
- `config/ui/asset-metadata.json`: Asset display metadata
- `config/ui/dashboard.json`: Dashboard widget configuration
- `config/ui/workspace-enhancements.json`: Workspace customizations

### Static Assets

- `static/bmad-ui-styles.css`: Custom styling for BMad branding
- `static/bmad-ui-enhancements.js`: JavaScript enhancements

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

- `GET /health`: Service health check
- `POST /api/v1/orchestration/services/start`: Start Dagster services
- `GET /api/v1/orchestration/assets`: List all assets
- `GET /api/v1/orchestration/assets/:id/lineage`: Get asset lineage
- `POST /api/v1/orchestration/runs/launch`: Launch pipeline run
- `GET /api/v1/orchestration/monitoring/pipeline-status`: Pipeline status
- `GET /api/v1/orchestration/lineage/visualization`: Generate lineage visualization

### Lineage Web Interface API

- `GET /api/assets`: List all assets
- `GET /api/assets/:id/lineage`: Get asset lineage
- `GET /api/lineage/visualization`: Generate visualization
- `GET /api/lineage/report`: Generate lineage report
- `GET /api/lineage/summary`: Get lineage summary statistics

## Usage

### Starting the Services

1. **Start Dagster UI**:
   ```bash
   npm run dagster:ui
   ```

2. **Start Workflow Orchestrator**:
   ```bash
   npm run orchestrator:start
   ```

3. **Start Lineage Explorer**:
   ```bash
   npm run lineage:start
   ```

### Accessing the Interfaces

- **Main Dagster UI**: http://localhost:3001
- **Orchestrator Health**: http://localhost:3003/health
- **Lineage Explorer**: http://localhost:5000

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

1. Update `config/ui/navigation.json`
2. Add color mapping in `static/bmad-ui-styles.css`
3. Update asset metadata configuration

### Creating Custom Quick Actions

1. Edit `config/ui/quick-actions.json`
2. Add corresponding job definitions in Dagster
3. Update UI JavaScript if needed

### Modifying Dashboard

1. Update `config/ui/dashboard.json`
2. Configure widget positions and settings
3. Customize refresh intervals

## Troubleshooting

### Common Issues

1. **Port Conflicts**: Ensure ports 3001, 3003, and 5000 are available
2. **Python Environment**: Ensure Dagster is installed in the active Python environment
3. **Asset Loading**: Check that asset files are properly configured in workspace.yaml
4. **Service Dependencies**: Verify all required services are running

### Debug Commands

```bash
# Check Dagster installation
dagster --version

# Validate workspace
dagster workspace show

# Test API endpoints
curl http://localhost:3003/health
curl http://localhost:5000/health

# Check service logs
npm run orchestrator:logs
npm run dagster:logs
```

## Integration Architecture Diagram

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Dagster UI    │    │   Orchestrator  │    │ Lineage Explorer│
│   Port: 3001     │    │   Port: 3003     │    │   Port: 5000     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │  BMad Assets &  │
                    │   Dagster Core  │
                    └─────────────────┘
```

## Security Considerations

- **API Keys**: Configure API keys for orchestrator endpoints
- **CORS**: Configure CORS policies for cross-origin requests
- **Authentication**: Implement authentication for production deployments
- **Network Security**: Use appropriate network security measures

---

For more information, see the BMad Data Practitioner documentation.
