# Data Source Discovery Task

## Purpose
Discover and configure data sources for ingestion into the BMad Data Practitioner system using PyAirbyte connectors.

## Elicitation Required
true

## Task Workflow

### Step 1: Identify Data Source Type
*Determine the type of data source to configure*

elicit: 
- prompt: "What type of data source would you like to configure?"
- options:
  - CSV/Excel file
  - JSON file
  - PostgreSQL database
  - MySQL database
  - SQLite database
  - Test data (Faker)
- variable: SOURCE_TYPE

### Step 2: Gather Source Configuration

#### For File Sources (CSV/Excel/JSON)
elicit:
- prompt: "Please provide the file path or upload location:"
- variable: FILE_PATH
- validation: file_exists

elicit:
- prompt: "What name should we use for this dataset?"
- variable: DATASET_NAME
- default: filename_without_extension

#### For CSV Files
elicit:
- prompt: "What delimiter is used in the CSV file?"
- options:
  - "," (comma)
  - ";" (semicolon)
  - "\t" (tab)
  - "|" (pipe)
  - Other
- variable: CSV_DELIMITER
- default: ","

elicit:
- prompt: "What character encoding is used?"
- options:
  - utf-8
  - latin1
  - utf-16
  - ascii
- variable: ENCODING
- default: utf-8

#### For Database Sources
elicit:
- prompt: "Database host (e.g., localhost, 192.168.1.100):"
- variable: DB_HOST
- validation: required

elicit:
- prompt: "Database port:"
- variable: DB_PORT
- default: 
  - PostgreSQL: 5432
  - MySQL: 3306

elicit:
- prompt: "Database name:"
- variable: DB_NAME
- validation: required

elicit:
- prompt: "Database username:"
- variable: DB_USERNAME
- validation: required

elicit:
- prompt: "Database password:"
- variable: DB_PASSWORD
- type: password
- validation: required

elicit:
- prompt: "Use SSL connection?"
- type: boolean
- variable: USE_SSL
- default: false

### Step 3: Test Connection
*Validate the data source configuration*

```bash
bmad data-connectors test --type {{SOURCE_TYPE}} --config {{GENERATED_CONFIG}}
```

### Step 4: Discover Available Streams
*List all available data streams/tables from the source*

```bash
bmad data-connectors discover --type {{SOURCE_TYPE}} --config {{GENERATED_CONFIG}}
```

elicit:
- prompt: "Which streams/tables would you like to ingest? (comma-separated or 'all')"
- variable: SELECTED_STREAMS
- default: all

### Step 5: Configure Ingestion Options

elicit:
- prompt: "Set a limit on the number of records to ingest (leave empty for all):"
- variable: RECORD_LIMIT
- type: number
- optional: true

elicit:
- prompt: "Would you like to save this configuration for future use?"
- type: boolean
- variable: SAVE_CONFIG
- default: true

if SAVE_CONFIG:
  elicit:
  - prompt: "Configuration name:"
  - variable: CONFIG_NAME
  - default: {{SOURCE_TYPE}}_{{DATASET_NAME}}

### Step 6: Execute Initial Ingestion
*Perform the first data ingestion*

```bash
bmad data-connectors ingest \
  --type {{SOURCE_TYPE}} \
  --config {{GENERATED_CONFIG}} \
  --streams {{SELECTED_STREAMS}} \
  {{RECORD_LIMIT ? '--limit ' + RECORD_LIMIT : ''}}
```

### Step 7: Verify Ingestion Results
*Check that data was successfully ingested*

```bash
bmad data-connectors cache-info
```

## Output Configuration

### File Source Configuration Template
```yaml
type: file
dataset_name: {{DATASET_NAME}}
format: {{FILE_FORMAT}}
url: {{FILE_PATH}}
provider:
  storage: local
format_options:
  delimiter: {{CSV_DELIMITER}}
  encoding: {{ENCODING}}
  quote_char: '"'
  escape_char: '"'
```

### Database Source Configuration Template
```yaml
type: {{SOURCE_TYPE}}
host: {{DB_HOST}}
port: {{DB_PORT}}
database: {{DB_NAME}}
username: {{DB_USERNAME}}
password: {{DB_PASSWORD}}
ssl: {{USE_SSL}}
ssl_mode: {{USE_SSL ? 'require' : 'disable'}}
```

## Success Criteria
- [ ] Data source connection established successfully
- [ ] Available streams/tables discovered
- [ ] Selected streams ingested into cache
- [ ] Configuration saved (if requested)
- [ ] Data available for downstream processing

## Common Issues and Solutions

### Issue: File Not Found
**Solution**: Ensure the file path is absolute and the file exists. Check permissions.

### Issue: Database Connection Failed
**Solution**: Verify host, port, and credentials. Check firewall rules and network connectivity.

### Issue: SSL Certificate Error
**Solution**: Either disable SSL for local/test databases or provide proper SSL certificates.

### Issue: Memory Error During Ingestion
**Solution**: Use the RECORD_LIMIT option to ingest data in smaller batches.

## Next Steps
After successful data source configuration:
1. Explore the ingested data using DuckDB analytics
2. Create transformation workflows with dbt
3. Build data pipelines with Dagster
4. Generate automated EDA reports

## Related Tasks
- data-exploration.md
- data-transformation.md
- pipeline-creation.md
- eda-automation.md