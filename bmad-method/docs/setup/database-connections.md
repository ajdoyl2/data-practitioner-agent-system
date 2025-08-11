# Database Connection Setup

## Overview

This guide covers setting up database connections for the data practitioner expansion pack, used by Stories 1.2 (PyAirbyte) and 1.3 (DuckDB).

## Connection String Format

### PostgreSQL

```bash
DATABASE_URL=postgresql://username:password@hostname:5432/database_name
ANALYTICS_DATABASE_URL=postgresql://analytics_user:pass@analytics.example.com:5432/analytics_db
```

### MySQL

```bash
DATABASE_URL=mysql://username:password@hostname:3306/database_name
```

### SQLite

```bash
DATABASE_URL=sqlite:///path/to/database.db
# Or for in-memory
DATABASE_URL=sqlite:///:memory:
```

### SQL Server

```bash
DATABASE_URL=mssql://username:password@hostname:1433/database_name
```

## Environment Variables

Add to your `.env` file:

```bash
# Primary operational database
DATABASE_URL=postgresql://user:pass@localhost:5432/bmad_data

# Analytics database (for read-heavy queries)
ANALYTICS_DATABASE_URL=postgresql://readonly:pass@analytics.example.com:5432/analytics

# Data warehouse (for historical data)
WAREHOUSE_DATABASE_URL=postgresql://warehouse:pass@warehouse.example.com:5432/warehouse
```

## Connection Pooling

For production environments, configure connection pooling:

```bash
# Connection pool settings
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10
DATABASE_POOL_IDLE_TIMEOUT=30000
```

## SSL/TLS Configuration

### PostgreSQL with SSL

```bash
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# With certificate
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=verify-full&sslcert=/path/to/client-cert.pem&sslkey=/path/to/client-key.pem&sslrootcert=/path/to/ca-cert.pem
```

### MySQL with SSL

```bash
DATABASE_URL=mysql://user:pass@host:3306/db?ssl={"rejectUnauthorized":true}
```

## Read Replicas

Configure read replicas for analytics workloads:

```javascript
// In your configuration
const databases = {
  primary: process.env.DATABASE_URL,
  replicas: [
    process.env.DATABASE_REPLICA_1,
    process.env.DATABASE_REPLICA_2
  ]
};
```

## Connection Testing

### Basic Connection Test

```bash
# PostgreSQL
psql $DATABASE_URL -c "SELECT 1"

# MySQL
mysql --host=hostname --user=username --password=password database_name -e "SELECT 1"
```

### BMad Connection Test

```bash
# Validate credentials
bmad validate-credentials databases

# Health check
bmad health-check databases
```

## Security Best Practices

1. **Use Read-Only Users** for analytics connections
   ```sql
   CREATE USER analytics_readonly WITH PASSWORD 'secure_password';
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO analytics_readonly;
   ```

2. **IP Whitelisting**
   - Restrict database access to specific IP addresses
   - Use VPN or SSH tunnels for remote access

3. **Connection Encryption**
   - Always use SSL/TLS in production
   - Verify server certificates

4. **Credential Rotation**
   ```bash
   # Rotate database passwords quarterly
   ALTER USER username WITH PASSWORD 'new_secure_password';
   ```

5. **Audit Logging**
   - Enable database audit logs
   - Monitor for suspicious activity

## Performance Optimization

### Connection Pooling

```javascript
// Example pool configuration
const poolConfig = {
  min: 2,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};
```

### Query Optimization

1. **Use Indexes**
   ```sql
   CREATE INDEX idx_created_at ON events(created_at);
   ```

2. **Analyze Tables**
   ```sql
   ANALYZE events;
   ```

3. **Monitor Slow Queries**
   ```sql
   -- PostgreSQL
   SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;
   ```

## Troubleshooting

### Connection Refused

1. Check database is running
2. Verify hostname and port
3. Check firewall rules
4. Verify credentials

### SSL Certificate Errors

1. Ensure certificates are valid
2. Check certificate paths
3. Verify SSL mode settings

### Connection Timeout

1. Check network connectivity
2. Verify security groups/firewall
3. Increase connection timeout
4. Check database load

### Authentication Failed

1. Verify username/password
2. Check user permissions
3. Verify authentication method
4. Check pg_hba.conf (PostgreSQL)

## Database-Specific Setup

### PostgreSQL Extensions

```sql
-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
```

### MySQL Configuration

```ini
# my.cnf optimizations
[mysqld]
max_connections = 200
innodb_buffer_pool_size = 1G
query_cache_size = 32M
```

### DuckDB Integration

DuckDB can connect to external databases:

```sql
-- Connect to PostgreSQL from DuckDB
INSTALL postgres_scanner;
LOAD postgres_scanner;

CALL postgres_attach('host=localhost dbname=mydb user=postgres');
```