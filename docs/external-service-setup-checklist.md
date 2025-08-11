# External Service Setup Checklist

## Overview

This checklist guides users through setting up external service accounts and credentials required for the Data Practitioner Agent System. Each service has specific requirements that must be completed before the corresponding story can function properly.

## PyAirbyte Setup (Required for Story 1.2)

### Prerequisites Checklist

- [ ] **Python Environment**
  - [ ] Python 3.10 or higher installed
  - [ ] pip package manager updated to latest version
  - [ ] Virtual environment capability (venv or conda)

- [ ] **System Requirements**
  - [ ] Minimum 4GB RAM available
  - [ ] 10GB free disk space for data caching
  - [ ] Network connectivity for API access

### PyAirbyte Configuration Steps

#### 1. Local Setup (No External Account Required)
- [ ] PyAirbyte will be installed automatically via pip
- [ ] No cloud account needed for local file sources (CSV, JSON)
- [ ] Local database connections use existing credentials

#### 2. Cloud Data Sources (If Needed)

**For Database Connections:**
- [ ] **PostgreSQL Source**
  - [ ] Database host and port
  - [ ] Database name
  - [ ] Username and password
  - [ ] SSL certificate (if required)
  - [ ] Network firewall rules allow connection

- [ ] **MySQL Source**
  - [ ] Database host and port
  - [ ] Database name
  - [ ] Username and password
  - [ ] Connection parameters (timezone, charset)

- [ ] **Cloud Warehouse Sources**
  - [ ] Snowflake: Account identifier, username, password, warehouse, database, schema
  - [ ] BigQuery: Service account JSON key, project ID, dataset ID
  - [ ] Redshift: Endpoint, port, database, username, password

**For API Sources:**
- [ ] **Common API Requirements**
  - [ ] API endpoint URL
  - [ ] Authentication method (API key, OAuth, Basic Auth)
  - [ ] Rate limit information
  - [ ] Data retention policies understood

### Credential Storage Preparation

- [ ] Create `.env` file in project root (git-ignored)
- [ ] Use this template for credentials:

```bash
# PyAirbyte Source Credentials
# PostgreSQL Example
POSTGRES_HOST=your-host.com
POSTGRES_PORT=5432
POSTGRES_DB=your_database
POSTGRES_USER=your_username
POSTGRES_PASSWORD=your_password

# MySQL Example
MYSQL_HOST=your-mysql-host.com
MYSQL_PORT=3306
MYSQL_DB=your_database
MYSQL_USER=your_username
MYSQL_PASSWORD=your_password

# API Sources
API_KEY_SERVICE1=your-api-key-here
API_SECRET_SERVICE1=your-secret-here
```

## DuckDB Setup (Required for Story 1.3)

### Local Installation Only
- [ ] No external accounts required
- [ ] DuckDB installed automatically via Node.js bindings
- [ ] Default storage location: `.duckdb/` directory
- [ ] No cloud services needed for MVP

## dbt-core Setup (Required for Story 1.4)

### Prerequisites
- [ ] **dbt Core** (not dbt Cloud)
  - [ ] Installed via pip automatically
  - [ ] No cloud account required for MVP
  - [ ] Local development only

- [ ] **Configuration Preparation**
  - [ ] Understand source data structure
  - [ ] Plan transformation layers (staging, intermediate, marts)
  - [ ] No external accounts needed

## Dagster Setup (Required for Story 1.5)

### Local Dagster Instance
- [ ] **No Dagster Cloud account required**
- [ ] Dagster installed via pip automatically
- [ ] Web UI runs locally on http://localhost:3000
- [ ] No external credentials needed

### Optional Cloud Features (Post-MVP)
- [ ] Dagster Cloud account (if desired)
- [ ] Deployment tokens
- [ ] Cloud storage for artifacts

## Evidence.dev Setup (Required for Story 1.7)

### Local Development
- [ ] **No Evidence Cloud account required**
- [ ] Evidence.dev installed via npm automatically
- [ ] Static site generation locally
- [ ] No external hosting needed for MVP

### Optional Deployment (Post-MVP)
- [ ] Vercel account (free tier available)
- [ ] Netlify account (alternative)
- [ ] GitHub Pages (if using GitHub)

## LLM Provider Setup (Required for Story 1.6)

### Choose One Provider

#### Option A: OpenAI
- [ ] Create account at https://platform.openai.com
- [ ] Generate API key
- [ ] Add billing method (usage-based)
- [ ] Note rate limits for your tier
- [ ] Add to `.env`: `OPENAI_API_KEY=sk-...`

#### Option B: Anthropic Claude
- [ ] Create account at https://console.anthropic.com
- [ ] Generate API key
- [ ] Add billing method
- [ ] Note rate limits
- [ ] Add to `.env`: `ANTHROPIC_API_KEY=sk-ant-...`

#### Option C: Google AI (Gemini)
- [ ] Create Google Cloud account
- [ ] Enable Vertex AI or AI Platform
- [ ] Create service account
- [ ] Download JSON key
- [ ] Add to `.env`: `GOOGLE_AI_KEY_PATH=/path/to/key.json`

#### Option D: Local LLM (Ollama)
- [ ] Install Ollama locally
- [ ] Download preferred model (e.g., `ollama pull llama2`)
- [ ] No API key required
- [ ] Add to `.env`: `LLM_PROVIDER=ollama` and `OLLAMA_MODEL=llama2`

## Security Configuration Checklist

### API Key Management (Story 1.1.5)
- [ ] Generate master API key for data services
- [ ] Store securely (not in code)
- [ ] Set appropriate scopes (data_read, data_write, admin)
- [ ] Document key rotation policy

### Feature Flags
- [ ] Review default feature flags (all disabled)
- [ ] Plan rollout strategy
- [ ] Document feature dependencies

## Validation Steps

### After External Service Setup
1. [ ] All required credentials collected
2. [ ] Credentials stored securely in `.env`
3. [ ] Network connectivity verified
4. [ ] Rate limits documented
5. [ ] Backup authentication methods identified

### Before Starting Each Story
1. [ ] Verify story-specific services configured
2. [ ] Test authentication works
3. [ ] Confirm rate limits acceptable
4. [ ] Document any special requirements

## Troubleshooting Guide

### Common Issues

**PyAirbyte Connection Failures:**
- Check network firewall rules
- Verify credentials are correct
- Ensure database/API is accessible
- Check SSL/TLS requirements

**LLM API Errors:**
- Verify API key is active
- Check billing/credits available
- Confirm rate limits not exceeded
- Try alternative provider

**Permission Errors:**
- Ensure user has required database permissions
- Check file system permissions for cache directories
- Verify API scopes include needed operations

## Support Resources

### Official Documentation
- PyAirbyte: https://docs.airbyte.com/pyairbyte/
- DuckDB: https://duckdb.org/docs/
- dbt: https://docs.getdbt.com/
- Dagster: https://docs.dagster.io/
- Evidence: https://docs.evidence.dev/

### Community Support
- GitHub Issues for each project
- Stack Overflow tags
- Discord/Slack communities

---
*Created: 2025-08-09*
*Purpose: Guide users through external service setup requirements*