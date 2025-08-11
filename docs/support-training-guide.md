# Support Team Training Guide

## Overview
Comprehensive training for supporting the Data Practitioner Agent System.

## Module 1: System Basics

### Components
- **6 Data Agents**: data-product-manager, data-architect, data-engineer, data-analyst, ml-engineer, data-qa-engineer
- **Core Tools**: PyAirbyte (ingestion), DuckDB (analytics), dbt-core (transforms), Dagster (orchestration), Evidence.dev (reporting)

### Architecture
```
User → BMad Agents → Node.js → Python Subprocess → Data Tools
```

## Module 2: Common Issues & Solutions

### Installation Issues

**Python Not Found**
```bash
# Check Python version
python --version  # Need 3.10+

# Create virtual environment
python -m venv .venv

# Activate (Mac/Linux)
source .venv/bin/activate

# Activate (Windows)
.venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

**Missing Node.js Dependencies**
```bash
# Reinstall packages
npm install

# Clear cache if needed
npm cache clean --force
```

### Data Ingestion Problems

**PyAirbyte Connection Failed**
1. Check credentials in `.env` file
2. Verify network connectivity
3. Test with simple CSV first
4. Check firewall settings

**Memory Errors**
1. Reduce batch size in config
2. Check available RAM
3. Use streaming mode for large files
4. Monitor with: `npm run monitor:memory`

### Query Issues

**Slow DuckDB Queries**
1. Check query complexity
2. Add WHERE clauses to limit data
3. Use EXPLAIN to analyze query plan
4. Increase memory allocation

**Query Timeouts**
1. Simplify query logic
2. Break into smaller queries
3. Increase timeout in config
4. Check for missing indexes

## Module 3: Troubleshooting Workflow

### Step 1: Gather Information
```markdown
**User**: [name]
**Issue**: [description]
**When Started**: [time]
**Error Message**: [exact text]
**Steps to Reproduce**: [1, 2, 3...]
```

### Step 2: Initial Checks
1. System status: `npm run status`
2. Check logs: `tail -f logs/error.log`
3. Verify environment: `npm run verify:env`
4. Test connectivity: `npm run test:connection`

### Step 3: Common Fixes
- Restart services: `npm run restart:all`
- Clear cache: `npm run cache:clear`
- Reset feature flags: `npm run feature:reset`
- Repair installation: `npm run repair`

## Module 4: Escalation Guide

### When to Escalate

**To L2 Support**:
- Issue persists after basic troubleshooting
- Multiple users affected
- Performance degraded >50%
- Security concerns

**To L3/Engineering**:
- System-wide outage
- Data corruption risk
- Security breach suspected
- Architecture changes needed

### Escalation Template
```
Ticket: #[number]
Severity: [Low/Medium/High/Critical]
Users Affected: [count]
Issue: [description]

Tried:
1. [Action - Result]
2. [Action - Result]

Blocked by: [reason]
Logs: [attached/location]
```

## Module 5: Quick Reference

### Essential Commands
```bash
# Status checks
npm run status
npm run health:check

# Diagnostics
npm run diagnose
npm run test:all

# Fixes
npm run restart:all
npm run cache:clear
npm run repair

# Monitoring
npm run logs:tail
npm run monitor:performance
```

### Feature Flags
```bash
# List all flags
npm run feature:list

# Enable/disable
npm run feature:toggle [flag] on
npm run feature:toggle [flag] off

# Reset to defaults
npm run feature:reset
```

### Log Locations
- Application: `/logs/app.log`
- Errors: `/logs/error.log`
- Security: `/logs/security.log`
- Performance: `/logs/performance.log`

## Module 6: User Communication

### Response Templates

**Initial Response**:
```
Hi [User],

I see you're having trouble with [issue]. I'll help you resolve this.

Can you please provide:
1. Exact error message
2. What you were trying to do
3. When it last worked

I'll start investigating meanwhile.

Thanks,
[Your name]
```

**Resolution**:
```
Hi [User],

Good news - I found the issue and have a fix:

Problem: [cause]
Solution: [steps]

Please try this and let me know if it works.

To prevent this: [tips]

Thanks,
[Your name]
```

## Module 7: Security Protocols

### Handling Sensitive Data
1. Never log passwords or API keys
2. Use secure channels for credentials
3. Rotate keys if compromised
4. Report security issues immediately

### Access Control
- Verify user permissions before changes
- Use principle of least privilege
- Document all access grants
- Review permissions quarterly

## Assessment Checklist

- [ ] Can identify all 6 data agents
- [ ] Know how to check system status
- [ ] Can troubleshoot Python environment
- [ ] Understand escalation criteria
- [ ] Know security protocols
- [ ] Can use diagnostic commands
- [ ] Understand rollback procedures
- [ ] Can read and interpret logs

## Resources

- Docs: `/docs/`
- KB: `#support-knowledge-base`
- Team: `#support-team`
- Emergency: [on-call phone]

---
*Version: 1.0*
*Updated: 2025-08-09*