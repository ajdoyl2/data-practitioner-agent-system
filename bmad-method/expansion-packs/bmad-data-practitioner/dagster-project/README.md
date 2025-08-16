# BMad Data Practitioner - Dagster Orchestration

This directory contains the Dagster workflow orchestration configuration for the BMad Data Practitioner expansion pack.

## Overview

The Dagster orchestration layer provides asset-centric workflow management that coordinates data pipeline execution across:

- **Data Ingestion** (PyAirbyte integration)
- **Analytics Processing** (DuckDB integration) 
- **Data Transformation** (Future dbt integration)
- **Publication** (Future Evidence.dev integration)

## Project Structure

```
dagster-project/
├── assets/                    # Asset definitions
│   ├── ingestion_assets.py    # PyAirbyte data ingestion assets
│   ├── analytics_assets.py    # DuckDB analytics assets
│   ├── transformation_assets.py # dbt transformation assets (placeholder)
│   └── publication_assets.py  # Evidence.dev publication assets (placeholder)
├── schedules/                 # Time-based scheduling
│   ├── daily_data_refresh.py  # Daily pipeline execution
│   └── hourly_incremental.py  # Hourly incremental updates
├── sensors/                   # Event-driven triggers
│   └── data_source_sensor.py  # Data source change detection
├── jobs/                      # Job definitions (auto-generated)
├── resources/                 # Resource definitions
├── dagster.yaml              # Dagster instance configuration
├── workspace.yaml            # Workspace and code location definitions
└── README.md                 # This file
```

## Asset Groups

### Infrastructure Assets
- Service health checks for data ingestion and analytics services
- System monitoring and resource usage tracking

### Ingestion Assets
- Data source availability catalog
- PyAirbyte-based data ingestion execution
- Data quality validation for ingested data

### Analytics Assets  
- DuckDB table catalog management
- SQL query execution and result materialization
- Data profiling and quality metrics
- Performance monitoring

### Transformation Assets (Placeholder)
- Future dbt model execution
- Data quality test execution
- Model dependency management

### Publication Assets (Placeholder)
- Future Evidence.dev site generation
- Documentation and report publishing
- Deployment and hosting management

## Scheduling

### Daily Data Refresh (2 AM UTC)
- Full pipeline execution for daily reporting
- Complete data refresh with validation
- First-of-month full refresh mode

### Hourly Incremental (Every hour)
- Incremental data updates for real-time analytics
- Reduced frequency during off-peak hours
- Maintenance window awareness (3-4 AM UTC)

## Event-Driven Processing

### Data Source Change Sensor
- Monitors configured data sources for changes
- Supports REST API, file system, and database sources
- Triggers pipeline execution when changes detected
- Configurable through environment variables

## Configuration

### Environment Variables
```bash
# API Authentication
DATA_SOURCE_API_KEY=your_api_key_here

# Monitoring Configuration
SKIP_SUNDAY_REFRESH=false
MAINTENANCE_HOUR_START=3
MAINTENANCE_HOUR_END=4

# Data Source Monitoring
DAGSTER_MONITORED_SOURCES='[{"source_id": "api_source", "source_type": "rest_api", "endpoint": "http://localhost:3001/api/v1/ingestion/sources"}]'
```

### Service Integration
The Dagster assets integrate with existing BMad Data Practitioner services:

- **Data Ingestion Service** (Port 3001): PyAirbyte connector management
- **Analytics Engine** (Port 3002): DuckDB query execution
- **Workflow Orchestrator** (Port 3003): Dagster service management

## Getting Started

1. **Install Dependencies**:
   ```bash
   pip install -r ../../requirements.txt
   ```

2. **Start Dagster Services** (via Workflow Orchestrator):
   ```bash
   # Start the workflow orchestrator service
   node ../../tools/data-services/workflow-orchestrator.js
   
   # Use API to start Dagster daemon and web UI
   curl -X POST http://localhost:3003/api/v1/orchestration/services/start \
        -H "X-API-Key: your-api-key" \
        -H "Content-Type: application/json" \
        -d '{"daemon": true, "webUI": true}'
   ```

3. **Access Dagster Web UI**:
   - URL: http://localhost:3001 (configurable)
   - View asset lineage, execution history, and monitoring dashboards

4. **Materialize Assets**:
   ```bash
   # Via API
   curl -X POST http://localhost:3003/api/v1/orchestration/assets/ingestion_service_health/materialize \
        -H "X-API-Key: your-api-key"
   
   # Via Dagster CLI
   dagster asset materialize --workspace-file workspace.yaml ingestion_service_health
   ```

## Monitoring and Alerting

### Pipeline Monitor
- Real-time pipeline status monitoring
- Performance metrics collection
- Resource usage tracking
- Automated alerting for failures and performance issues

### Available Metrics
- Pipeline execution success/failure rates
- Asset materialization statistics
- Resource utilization (memory, CPU, disk)
- Service health status

### Alert Conditions
- High failure rate (>10%)
- Slow execution times (>5 minutes)
- High memory usage (>80%)
- Service unavailability

## Development

### Adding New Assets
1. Create asset definition in appropriate `assets/*.py` file
2. Define dependencies using `deps` parameter
3. Add appropriate metadata and documentation
4. Update workspace.yaml if needed

### Testing
```bash
# Run Dagster wrapper tests
npm test -- tests/data-services/dagster-wrapper.test.js

# Run workflow orchestrator tests  
npm test -- tests/data-services/workflow-orchestrator.test.js

# Validate Dagster workspace
dagster workspace validate --workspace-file workspace.yaml
```

## Future Enhancements

- **dbt Integration**: Replace transformation placeholders with actual dbt model execution
- **Evidence.dev Integration**: Replace publication placeholders with Evidence.dev site generation
- **Advanced Monitoring**: Integration with external monitoring systems
- **Custom Resources**: Database connections, external service integrations
- **Dynamic Assets**: Runtime asset generation based on configuration
- **Multi-environment Support**: Development, staging, production configurations

## Troubleshooting

### Common Issues

1. **Dagster daemon won't start**
   - Check Python environment and Dagster installation
   - Verify workspace.yaml configuration
   - Check port availability

2. **Assets fail to materialize**
   - Verify dependent services are running (data-ingestion, analytics-engine)
   - Check API key configuration
   - Review Dagster logs in the web UI

3. **Web UI inaccessible**
   - Confirm web UI process is running
   - Check port conflicts
   - Verify firewall settings

4. **Sensor not triggering**
   - Check monitored data source configuration
   - Verify sensor is enabled and running
   - Review sensor logs for errors

For additional support, check the Dagster web UI logs and the workflow orchestrator service logs.