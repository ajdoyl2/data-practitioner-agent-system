# External Service Credential Acquisition Checklist

## Overview
This checklist guides users through obtaining all required credentials for the Data Practitioner Agent System expansion pack. Complete this BEFORE starting Story 1.1.5 development.

## Required Credentials

### 1. PyPI/Python Package Access
- [ ] **PyPI Account** (if using private packages)
  - Create account at: https://pypi.org/account/register/
  - Generate API token: Account Settings → API tokens
  - Save token as: `PYPI_API_TOKEN`
  - Scope: Read-only access sufficient

### 2. Database Connections (for data sources)
- [ ] **PostgreSQL Credentials** (if applicable)
  - Host: `_________________`
  - Port: `_________________`
  - Database: `_________________`
  - Username: `_________________`
  - Password: Save as `POSTGRES_PASSWORD`
  
- [ ] **MySQL Credentials** (if applicable)
  - Host: `_________________`
  - Port: `_________________`
  - Database: `_________________`
  - Username: `_________________`
  - Password: Save as `MYSQL_PASSWORD`

### 3. External Data API Keys
- [ ] **Primary Data API** (specify your API)
  - API Name: `_________________`
  - API Key: Save as `DATA_API_KEY`
  - Documentation URL: `_________________`
  - Rate Limits: `_________________`

### 4. Cloud Service Credentials (Optional)
- [ ] **AWS** (if using S3, RDS, etc.)
  - Access Key ID: Save as `AWS_ACCESS_KEY_ID`
  - Secret Access Key: Save as `AWS_SECRET_ACCESS_KEY`
  - Default Region: `_________________`
  
- [ ] **Google Cloud** (if using BigQuery, GCS, etc.)
  - Service Account JSON: Save as `GOOGLE_APPLICATION_CREDENTIALS`
  - Project ID: `_________________`
  
- [ ] **Azure** (if using Azure services)
  - Tenant ID: Save as `AZURE_TENANT_ID`  
  - Client ID: Save as `AZURE_CLIENT_ID`
  - Client Secret: Save as `AZURE_CLIENT_SECRET`

### 5. Optional Service Integrations
- [ ] **dbt Cloud** (optional - for cloud features)
  - Account ID: `_________________`
  - API Token: Save as `DBT_CLOUD_API_TOKEN`
  - Region: `_________________`
  
- [ ] **Dagster Cloud** (optional - for cloud deployment)
  - Organization: `_________________`
  - Deployment: `_________________`
  - User Token: Save as `DAGSTER_CLOUD_API_TOKEN`
  
- [ ] **Evidence.dev Deployment**
  - Deployment Platform: `_________________`
  - Deploy Token: Save as `EVIDENCE_DEPLOY_TOKEN`
  - Custom Domain (if applicable): `_________________`

## Credential Storage Instructions

### Step 1: Create `.env` file
```bash
# In project root
cp .env.template .env
chmod 600 .env  # Restrict file permissions
```

### Step 2: Add credentials to `.env`
```bash
# Data Source Credentials
POSTGRES_PASSWORD=your_password_here
MYSQL_PASSWORD=your_password_here
DATA_API_KEY=your_api_key_here

# Cloud Credentials (if applicable)
AWS_ACCESS_KEY_ID=your_key_here
AWS_SECRET_ACCESS_KEY=your_secret_here
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Optional Services
DBT_CLOUD_API_TOKEN=your_token_here
DAGSTER_CLOUD_API_TOKEN=your_token_here
EVIDENCE_DEPLOY_TOKEN=your_token_here
```

### Step 3: Secure the credentials
- [ ] Add `.env` to `.gitignore` (should already be there)
- [ ] Never commit credentials to version control
- [ ] Use environment-specific `.env` files for different environments
- [ ] Rotate credentials regularly (every 90 days recommended)

## Testing Credentials

After obtaining all credentials, test them using the validation script (available after Story 1.1.5):
```bash
npm run validate-credentials
```

## Security Best Practices

1. **Principle of Least Privilege**: Request minimal permissions needed
2. **Credential Rotation**: Set calendar reminders for rotation
3. **Audit Trail**: Document who has access to which credentials
4. **Encryption at Rest**: Ensure `.env` file is on encrypted disk
5. **No Sharing**: Never share credentials via email/chat

## Troubleshooting

### Common Issues:
- **Invalid API Key**: Check for extra spaces or special characters
- **Permission Denied**: Ensure service account has required permissions
- **Connection Timeout**: Verify firewall rules and network access
- **Rate Limiting**: Check API quotas and implement backoff

### Support Resources:
- PyAirbyte Connectors: https://docs.airbyte.com/integrations
- DuckDB Connections: https://duckdb.org/docs/sql/statements/attach
- dbt Cloud API: https://docs.getdbt.com/dbt-cloud/api-v2
- Dagster Cloud: https://docs.dagster.io/dagster-cloud

## Completion Confirmation

- [ ] All required credentials obtained
- [ ] Credentials stored securely in `.env`
- [ ] `.env` file permissions set to 600
- [ ] Team members aware of credential locations
- [ ] Rotation schedule established

**Date Completed**: _________________  
**Completed By**: _________________

---

Once this checklist is complete, you're ready to begin Story 1.1.5 implementation!