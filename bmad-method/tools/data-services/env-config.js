/**
 * Environment Configuration Management
 * Centralized environment variable handling for data services
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

/**
 * Security-related environment configuration
 */
export const securityConfig = {
  // API Key configuration
  apiKeys: process.env.BMAD_API_KEYS ? JSON.parse(process.env.BMAD_API_KEYS) : [],
  defaultScopes: process.env.BMAD_DEFAULT_SCOPES?.split(',') || ['data_read'],
  
  // Session configuration
  sessionSecret: process.env.BMAD_SESSION_SECRET || 'bmad-dev-secret-change-in-production',
  sessionTimeout: parseInt(process.env.BMAD_SESSION_TIMEOUT || '3600', 10),
  
  // Security headers
  corsOrigins: process.env.BMAD_CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  
  // Rate limiting
  rateLimitWindow: parseInt(process.env.BMAD_RATE_LIMIT_WINDOW || '900000', 10), // 15 minutes
  rateLimitMax: parseInt(process.env.BMAD_RATE_LIMIT_MAX || '100', 10)
};

/**
 * External service credentials configuration
 */
export const externalServicesConfig = {
  // PyPI configuration (Story 1.2)
  pypi: {
    indexUrl: process.env.PYPI_INDEX_URL,
    username: process.env.PYPI_USERNAME,
    password: process.env.PYPI_PASSWORD,
    apiToken: process.env.PYPI_API_TOKEN
  },
  
  // Database connections (Stories 1.2, 1.3)
  databases: {
    primary: process.env.DATABASE_URL,
    analytics: process.env.ANALYTICS_DATABASE_URL,
    warehouse: process.env.WAREHOUSE_DATABASE_URL
  },
  
  // Cloud services
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1'
  },
  
  gcp: {
    projectId: process.env.GCP_PROJECT_ID,
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS
  },
  
  azure: {
    tenantId: process.env.AZURE_TENANT_ID,
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET
  },
  
  // dbt Cloud (Story 1.4)
  dbtCloud: {
    apiToken: process.env.DBT_CLOUD_API_TOKEN,
    accountId: process.env.DBT_CLOUD_ACCOUNT_ID,
    projectId: process.env.DBT_CLOUD_PROJECT_ID
  },
  
  // Dagster Cloud (Story 1.5)
  dagsterCloud: {
    apiToken: process.env.DAGSTER_CLOUD_API_TOKEN,
    organization: process.env.DAGSTER_CLOUD_ORG,
    deployment: process.env.DAGSTER_CLOUD_DEPLOYMENT
  },
  
  // Evidence.dev (Story 1.7)
  evidence: {
    deploymentToken: process.env.EVIDENCE_DEPLOYMENT_TOKEN,
    siteUrl: process.env.EVIDENCE_SITE_URL
  }
};

/**
 * General application configuration
 */
export const appConfig = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || 'localhost',
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // Feature flags are loaded from YAML, this is just the default state
  featureFlagsFile: process.env.FEATURE_FLAGS_FILE || 'config/feature-flags.yaml'
};

/**
 * Validate required environment variables
 * @param {string[]} required - Array of required variable names
 * @throws {Error} If any required variables are missing
 */
export function validateEnvVars(required = []) {
  const missing = required.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check .env.template for required variables.'
    );
  }
}

/**
 * Check if a service is configured
 * @param {string} service - Service name
 * @returns {boolean} True if service has credentials
 */
export function isServiceConfigured(service) {
  const serviceConfig = externalServicesConfig[service];
  if (!serviceConfig) return false;
  
  // Check if any credential is set
  return Object.values(serviceConfig).some(value => 
    value !== undefined && value !== null && value !== ''
  );
}

export default {
  security: securityConfig,
  external: externalServicesConfig,
  app: appConfig,
  validateEnvVars,
  isServiceConfigured
};