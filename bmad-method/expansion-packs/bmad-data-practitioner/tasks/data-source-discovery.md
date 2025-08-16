# Data Source Discovery Task Template

## Overview
This template guides you through discovering and configuring data sources using PyAirbyte connectors for the BMad-Method data practitioner framework.

## Prerequisites
- PyAirbyte integration feature enabled (`bmad enable-feature pyairbyte_integration`)
- Python environment setup complete (`npm run setup:python`)
- Data ingestion service available

## Task Categories

### 1. File-Based Data Sources

#### CSV Files
**Scenario:** Connect to CSV data files for analysis
**Steps:**
1. **Upload File**: Use the file upload API endpoint or CLI
2. **Configure Connector**: Set format options (delimiter, encoding, etc.)
3. **Discover Streams**: Identify available data tables/sheets
4. **Validate Data**: Check data types and sample records
5. **Save Configuration**: Store connection settings for reuse

**Example Configuration:**
```yaml
type: file
connector: source-file
format: csv
config:
  dataset_name: "customer_data"
  format: "csv"
  url: "/path/to/data.csv"
  provider:
    storage: "local"
  format_options:
    delimiter: ","
    quote_char: "\""
    encoding: "utf-8"
```

#### JSON/JSONL Files
**Scenario:** Connect to JSON or JSON Lines data files
**Steps:**
1. **Upload File**: Upload JSON/JSONL file
2. **Configure Connector**: Set JSON parsing options
3. **Discover Streams**: Identify nested data structures
4. **Validate Schema**: Check JSON schema and data types
5. **Save Configuration**: Store settings for future use

**Example Configuration:**
```yaml
type: file
connector: source-file
format: json
config:
  dataset_name: "api_logs"
  format: "jsonl"
  url: "/path/to/data.jsonl"
  provider:
    storage: "local"
```

#### Excel Files
**Scenario:** Connect to Excel workbooks with multiple sheets
**Steps:**
1. **Upload File**: Upload .xlsx or .xls file
2. **Discover Sheets**: Identify available worksheets
3. **Select Streams**: Choose which sheets to include
4. **Validate Data**: Check data types and headers
5. **Save Configuration**: Store sheet selection preferences

### 2. Database Data Sources

#### PostgreSQL
**Scenario:** Connect to PostgreSQL database tables
**Steps:**
1. **Configure Connection**: Set host, port, database, credentials
2. **Test Connection**: Verify connectivity and permissions
3. **Discover Tables**: List available tables and views
4. **Select Streams**: Choose tables to include in data pipeline
5. **Save Configuration**: Store connection for reuse

**Example Configuration:**
```yaml
type: database
connector: source-postgres
config:
  host: "localhost"
  port: 5432
  database: "analytics"
  username: "data_user"
  password: "${POSTGRES_PASSWORD}"
  ssl: false
  ssl_mode: "prefer"
```

#### MySQL
**Scenario:** Connect to MySQL database for data extraction
**Steps:**
1. **Configure Connection**: Set MySQL connection parameters
2. **Test Connection**: Verify database accessibility
3. **Discover Tables**: Identify available data tables
4. **Stream Selection**: Choose relevant tables and columns
5. **Save Configuration**: Store connection settings

**Example Configuration:**
```yaml
type: database
connector: source-mysql
config:
  host: "mysql.example.com"
  port: 3306
  database: "production"
  username: "readonly_user"
  password: "${MYSQL_PASSWORD}"
```

### 3. API Data Sources

#### REST APIs
**Scenario:** Connect to REST API endpoints for data ingestion
**Steps:**
1. **Configure API**: Set base URL and authentication
2. **Discover Endpoints**: Identify available data endpoints
3. **Test Requests**: Verify API accessibility and response format
4. **Stream Configuration**: Configure pagination and filtering
5. **Save Configuration**: Store API connection settings

### 4. Cloud Storage Data Sources

#### AWS S3
**Scenario:** Connect to files stored in AWS S3 buckets
**Steps:**
1. **Configure AWS Credentials**: Set access key and secret
2. **Specify Bucket**: Define S3 bucket and file paths
3. **Discover Files**: List available data files
4. **Stream Selection**: Choose files to include
5. **Save Configuration**: Store S3 connection settings

## Data Discovery Workflow

### Phase 1: Source Identification
1. **Inventory Data Sources**: List all potential data sources
2. **Assess Accessibility**: Check connection requirements and permissions
3. **Prioritize Sources**: Rank sources by business value and complexity
4. **Document Requirements**: Record specific data needs and constraints

### Phase 2: Connection Setup
1. **Configure Connectors**: Set up PyAirbyte connectors for each source
2. **Test Connections**: Verify connectivity and data access
3. **Handle Authentication**: Set up secure credential management
4. **Document Configurations**: Save connection settings for team use

### Phase 3: Stream Discovery
1. **Discover Available Streams**: Use PyAirbyte to identify data streams
2. **Analyze Data Structure**: Examine schemas, data types, and relationships
3. **Assess Data Quality**: Check for completeness, consistency, and accuracy
4. **Document Findings**: Record stream metadata and characteristics

### Phase 4: Stream Selection
1. **Evaluate Business Relevance**: Choose streams aligned with analysis goals
2. **Consider Data Volume**: Assess performance implications of large datasets
3. **Check Dependencies**: Identify relationships between streams
4. **Document Selection**: Record chosen streams and rationale

### Phase 5: Configuration Validation
1. **Test Data Extraction**: Verify ability to read selected streams
2. **Validate Data Types**: Confirm correct data type interpretation
3. **Check Performance**: Monitor extraction speed and resource usage
4. **Save Configurations**: Store validated settings for production use

## CLI Commands Reference

### Setup and Management
```bash
# Setup Python environment
npm run setup:python

# Start data ingestion service
npm run data:service

# List available connectors
npm run data:connectors

# Enable PyAirbyte integration
bmad enable-feature pyairbyte_integration
```

### API Endpoints for Data Discovery
```bash
# List available connectors
GET /api/v1/data-sources/connectors

# Discover streams from a source
POST /api/v1/data-sources/discover
{
  "connector_type": "file",
  "config": {...}
}

# Read sample data from a stream
POST /api/v1/data-sources/read
{
  "connector_type": "file",
  "config": {...},
  "stream_name": "customers",
  "limit": 100
}

# Upload files for processing
POST /api/v1/data-sources/upload
# (multipart form data)

# Configure database connection
POST /api/v1/data-sources/database
{
  "database_type": "postgres",
  "connection": {...}
}
```

## Configuration Management

### Saving Configurations
Use the configuration API to save connection settings:
```bash
POST /api/v1/data-sources/config
{
  "name": "customer_db_prod",
  "configuration": {
    "type": "database",
    "connector": "source-postgres",
    "config": {...}
  }
}
```

### Loading Configurations
Retrieve saved configurations:
```bash
GET /api/v1/data-sources/config
```

### Environment Variables
Store sensitive credentials as environment variables:
```bash
export POSTGRES_PASSWORD="secure_password"
export AWS_ACCESS_KEY_ID="your_access_key"
export AWS_SECRET_ACCESS_KEY="your_secret_key"
```

## Security Considerations

### Authentication
- All API endpoints require API key authentication
- Use `X-API-Key` header with valid API key
- API keys must have `data_write` scope for write operations

### Credential Management
- Store database passwords in environment variables
- Use secure credential storage for production deployments
- Rotate credentials regularly

### Data Privacy
- Ensure compliance with data protection regulations
- Implement data masking for sensitive information
- Log all data access operations for audit trails

## Troubleshooting

### Common Issues

#### PyAirbyte Not Available
**Problem**: "PyAirbyte integration is disabled" error
**Solution**: Enable the feature flag: `bmad enable-feature pyairbyte_integration`

#### Python Environment Issues
**Problem**: Python packages not found
**Solution**: 
1. Run `npm run setup:python --reinstall`
2. Manually activate virtual environment and install packages
3. Check Python version compatibility (requires 3.10+)

#### Connection Failures
**Problem**: Cannot connect to database/API
**Solution**:
1. Verify network connectivity
2. Check credentials and permissions
3. Validate configuration parameters
4. Review security logs for authentication issues

#### Memory Issues
**Problem**: Out of memory during large data processing
**Solution**:
1. Use stream limits to process data in chunks
2. Increase system memory allocation
3. Optimize PyAirbyte cache settings
4. Process data in smaller batches

## Best Practices

### Configuration Management
- Use descriptive names for saved configurations
- Document the purpose and scope of each data source
- Version control configuration files
- Test configurations in development before production use

### Performance Optimization
- Set appropriate limits for initial data exploration
- Use PyAirbyte caching for frequently accessed data
- Monitor memory usage during large data operations
- Implement incremental data loading where possible

### Data Quality
- Validate data types and formats during discovery
- Check for missing values and data consistency
- Document data quality issues and limitations
- Implement data validation rules

### Security
- Use least-privilege access principles
- Regularly rotate database credentials
- Monitor data access patterns
- Implement proper logging and auditing

## Integration with BMad-Method

### Agent Integration
Data source configurations can be used by BMad-Method agents for:
- Automated data analysis tasks
- Report generation workflows
- Data pipeline monitoring
- Quality assurance processes

### Workflow Integration
Integrate data discovery tasks with:
- Story development workflows
- Sprint planning processes  
- Data governance procedures
- Quality assurance cycles

### Documentation Integration
Link data source configurations to:
- Story documentation
- Technical specifications
- Data lineage documentation
- Operational runbooks