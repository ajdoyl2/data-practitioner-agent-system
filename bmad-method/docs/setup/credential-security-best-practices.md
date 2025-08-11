# Credential Security Best Practices

## Overview

This document outlines security best practices for managing credentials in the BMad Data Practitioner system.

## Core Principles

1. **Never Store Credentials in Code**
2. **Use Environment Variables**
3. **Implement Least Privilege**
4. **Rotate Credentials Regularly**
5. **Monitor Access and Usage**

## Environment Variable Management

### Local Development

1. **Use .env Files**
   ```bash
   # Create .env from template
   cp .env.template .env
   
   # Set restrictive permissions
   chmod 600 .env
   ```

2. **Never Commit .env**
   ```gitignore
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

### Production Environment

1. **Use Secret Management Services**
   - AWS Secrets Manager
   - HashiCorp Vault
   - Azure Key Vault
   - Google Secret Manager

2. **Example: AWS Secrets Manager**
   ```javascript
   import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";
   
   async function getSecret(secretName) {
     const client = new SecretsManagerClient({ region: "us-east-1" });
     const response = await client.send(
       new GetSecretValueCommand({ SecretId: secretName })
     );
     return JSON.parse(response.SecretString);
   }
   ```

## API Key Management

### Generation Best Practices

1. **Use Cryptographically Secure Random Generation**
   ```javascript
   import crypto from 'crypto';
   
   function generateApiKey() {
     const prefix = 'bmad_';
     const randomBytes = crypto.randomBytes(32);
     return prefix + randomBytes.toString('hex');
   }
   ```

2. **Include Metadata**
   - Creation date
   - Expiration date
   - Scope/permissions
   - Description

### Storage Best Practices

1. **Hash API Keys**
   ```javascript
   import crypto from 'crypto';
   
   function hashApiKey(apiKey) {
     return crypto
       .createHash('sha256')
       .update(apiKey)
       .digest('hex');
   }
   ```

2. **Store Only Hashes**
   - Never store plain text API keys
   - Show key only once during creation

## Database Credentials

### Connection String Security

1. **Separate Credentials from URLs**
   ```javascript
   // Bad
   const dbUrl = "postgresql://admin:password123@db.example.com/mydb";
   
   // Good
   const dbUrl = `postgresql://${DB_USER}:${DB_PASS}@${DB_HOST}/${DB_NAME}`;
   ```

2. **Use SSL/TLS**
   ```bash
   DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require
   ```

### User Permissions

1. **Create Role-Based Users**
   ```sql
   -- Read-only user for analytics
   CREATE USER analytics_readonly WITH PASSWORD 'secure_password';
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
   
   -- Write user for ETL
   CREATE USER etl_writer WITH PASSWORD 'secure_password';
   GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO etl_writer;
   ```

2. **Limit Connection Sources**
   ```sql
   -- PostgreSQL pg_hba.conf
   host    mydb    analytics_readonly    10.0.0.0/24    md5
   ```

## Cloud Service Credentials

### AWS Best Practices

1. **Use IAM Roles When Possible**
   ```javascript
   // No credentials needed when using IAM roles
   import { S3Client } from "@aws-sdk/client-s3";
   const s3 = new S3Client({ region: "us-east-1" });
   ```

2. **Temporary Credentials**
   ```javascript
   import { STSClient, AssumeRoleCommand } from "@aws-sdk/client-sts";
   
   async function getTemporaryCredentials() {
     const sts = new STSClient({ region: "us-east-1" });
     const response = await sts.send(new AssumeRoleCommand({
       RoleArn: "arn:aws:iam::123456789012:role/DataRole",
       RoleSessionName: "bmad-session"
     }));
     return response.Credentials;
   }
   ```

### Service Account Best Practices

1. **Minimal Permissions**
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "s3:GetObject",
           "s3:ListBucket"
         ],
         "Resource": [
           "arn:aws:s3:::my-data-bucket/*"
         ]
       }
     ]
   }
   ```

## Credential Rotation

### Rotation Schedule

| Credential Type | Rotation Frequency | Notes |
|----------------|-------------------|-------|
| API Keys | 90 days | Automated rotation preferred |
| Database Passwords | 90 days | Coordinate with DBAs |
| Cloud API Keys | 180 days | Use IAM roles when possible |
| Service Tokens | 30 days | Short-lived tokens preferred |

### Rotation Process

1. **Generate New Credential**
2. **Update Application Configuration**
3. **Test New Credential**
4. **Revoke Old Credential**
5. **Document Rotation**

### Automated Rotation Example

```javascript
async function rotateApiKey(userId) {
  // Generate new key
  const newKey = generateApiKey();
  
  // Store new key (hashed)
  await storeApiKey(userId, hashApiKey(newKey));
  
  // Notify user
  await notifyKeyRotation(userId, newKey);
  
  // Schedule old key revocation
  await scheduleRevocation(userId, 24 * 60 * 60 * 1000); // 24 hours
  
  // Log rotation
  securityLogger.logSecurityEvent('INFO', 'api_key_rotated', {
    userId,
    timestamp: new Date().toISOString()
  });
}
```

## Monitoring and Auditing

### Access Logging

1. **Log All Credential Usage**
   ```javascript
   function logCredentialAccess(credentialType, action, result) {
     securityLogger.logSecurityEvent('INFO', 'credential_access', {
       type: credentialType,
       action,
       result,
       timestamp: new Date().toISOString(),
       ip: request.ip,
       userAgent: request.headers['user-agent']
     });
   }
   ```

2. **Monitor for Anomalies**
   - Unusual access patterns
   - Failed authentication attempts
   - Access from new locations

### Security Alerts

Set up alerts for:
- Multiple failed authentication attempts
- Credential access from new IPs
- Expired credential usage
- High-frequency API usage

## Incident Response

### Credential Compromise Response

1. **Immediate Actions**
   - Revoke compromised credential
   - Generate new credential
   - Update all systems
   - Review access logs

2. **Investigation**
   - Determine scope of compromise
   - Identify affected systems
   - Review audit logs
   - Check for unauthorized access

3. **Prevention**
   - Implement additional monitoring
   - Review security policies
   - Update access controls
   - Employee training

## Development Guidelines

### Code Reviews

Check for:
- Hardcoded credentials
- Credentials in comments
- Insecure credential storage
- Missing encryption
- Weak key generation

### Security Testing

1. **Credential Scanning**
   ```bash
   # Use tools like git-secrets
   git secrets --install
   git secrets --register-aws
   git secrets --scan
   ```

2. **Dependency Scanning**
   ```bash
   # Check for vulnerable dependencies
   npm audit
   ```

## Compliance Considerations

### Data Protection Regulations

- **GDPR**: Encrypt personal data
- **HIPAA**: Implement access controls
- **PCI-DSS**: Secure payment data
- **SOC 2**: Document security controls

### Audit Requirements

Maintain records of:
- Credential creation/deletion
- Access attempts
- Rotation history
- Security incidents

## Quick Reference Checklist

- [ ] Use environment variables for all credentials
- [ ] Set restrictive file permissions on .env files
- [ ] Never commit credentials to version control
- [ ] Use strong, random credential generation
- [ ] Implement credential rotation
- [ ] Monitor credential usage
- [ ] Use SSL/TLS for all connections
- [ ] Implement least privilege access
- [ ] Maintain audit logs
- [ ] Have incident response plan
- [ ] Regular security reviews
- [ ] Employee security training