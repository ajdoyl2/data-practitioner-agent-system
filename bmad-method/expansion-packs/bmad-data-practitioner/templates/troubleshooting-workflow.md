# Troubleshooting Workflow Template

## Overview
Structured workflow for diagnosing, resolving, and documenting system issues in the BMad Data Practitioner System.

## When to Use This Template
- System component failures
- Data quality issues
- Performance problems
- Integration failures
- User-reported errors
- Unexpected behavior patterns

## Workflow Phases

### Phase 1: Issue Identification and Triage
**Purpose**: Quickly assess and categorize the issue for appropriate response

#### Issue Classification
```yaml
issue_types:
  system_failure:
    severity: critical
    response_time: immediate
    escalation: system_admin
    
  data_quality:
    severity: high
    response_time: 2 hours
    escalation: data_team_lead
    
  performance_degradation:
    severity: medium
    response_time: 4 hours
    escalation: performance_team
    
  user_error:
    severity: low
    response_time: 1 business_day
    escalation: support_team
```

#### Initial Assessment Checklist
- [ ] **Issue Description**: What is happening?
- [ ] **Expected Behavior**: What should happen?
- [ ] **Impact Assessment**: Who/what is affected?
- [ ] **Urgency Level**: How quickly must this be resolved?
- [ ] **Reproducibility**: Can the issue be consistently reproduced?

#### Triage Decision Matrix
```markdown
| Severity | Impact | Urgency | Response |
|----------|---------|---------|----------|
| Critical | System down | Immediate | All hands response |
| High | Major feature broken | 2 hours | Senior engineer assigned |
| Medium | Minor feature impacted | 4 hours | Regular engineer assigned |
| Low | Cosmetic/usability | 1 day | Support team handles |
```

### Phase 2: Information Gathering
**Purpose**: Collect comprehensive information needed for diagnosis

#### System State Capture
```bash
# Automated system diagnostics script
#!/bin/bash
echo "=== BMad Data Practitioner System Diagnostics ==="
echo "Timestamp: $(date)"
echo "Reporter: $USER"
echo

# System resources
echo "=== System Resources ==="
free -h
df -h
top -bn1 | head -10

# Service status
echo "=== Service Status ==="
npm run health:check
node tools/data-services/monitoring-engine.js --status

# Recent logs
echo "=== Recent Error Logs ==="
tail -n 50 logs/error.log
tail -n 50 logs/system.log

# Component-specific diagnostics
echo "=== DuckDB Status ==="
node tools/data-services/duckdb-wrapper.js --health-check

echo "=== Dagster Status ==="
dagster-daemon status

echo "=== Evidence.dev Status ==="
cd evidence-project && npm run build:status
```

#### Issue Context Documentation
```markdown
## Issue Report Template

### Basic Information
- **Issue ID**: BMAD-[YYYY]-[MMM]-[###]
- **Reporter**: [Name and contact]
- **Date/Time**: [When issue occurred]
- **Environment**: [Development/Staging/Production]
- **Component**: [Affected system component]

### Issue Details
- **Description**: [Detailed description of the issue]
- **Steps to Reproduce**:
  1. [Step 1]
  2. [Step 2]
  3. [Step 3]

- **Expected Result**: [What should happen]
- **Actual Result**: [What actually happened]
- **Error Messages**: [Any error messages or codes]

### Environment Information
- **System Version**: [BMad version]
- **Node.js Version**: [Version]
- **Python Version**: [Version]
- **Database Version**: [DuckDB version]
- **Operating System**: [OS and version]

### Supporting Evidence
- [ ] Log files attached
- [ ] Screenshots included
- [ ] System diagnostics run
- [ ] Performance metrics captured
- [ ] Configuration files reviewed
```

### Phase 3: Root Cause Analysis
**Purpose**: Systematically identify the underlying cause of the issue

#### Diagnostic Methodology
```markdown
## 5 Whys Analysis
1. **Why did the issue occur?**
   - [Initial symptom analysis]

2. **Why did that happen?**
   - [First level cause identification]

3. **Why did that happen?**
   - [Second level cause analysis]

4. **Why did that happen?**
   - [Third level cause analysis]

5. **Why did that happen?**
   - [Root cause identification]

## Fishbone Diagram Categories
- **People**: Human factors, training, procedures
- **Process**: Workflow, methodology, standards
- **Technology**: Software, hardware, configuration
- **Environment**: External factors, dependencies
```

#### Component-Specific Diagnostics

##### DuckDB Issues
```sql
-- DuckDB diagnostic queries
PRAGMA version;
PRAGMA database_list;
PRAGMA table_info('problematic_table');

-- Check for locks
PRAGMA busy_timeout;

-- Memory usage
PRAGMA memory_limit;

-- Performance analysis
EXPLAIN ANALYZE SELECT * FROM slow_query_here;
```

##### Dagster Issues
```python
# Dagster diagnostic script
from dagster import DagsterInstance

def diagnose_dagster_issues():
    instance = DagsterInstance.get()
    
    # Check recent runs
    runs = instance.get_runs(limit=10)
    failed_runs = [run for run in runs if run.status.value == 'FAILURE']
    
    # Check daemon status
    daemon_status = instance.get_daemon_statuses()
    
    # Check asset status
    asset_keys = instance.get_asset_keys()
    
    return {
        'recent_failures': len(failed_runs),
        'daemon_healthy': all(status.healthy for status in daemon_status.values()),
        'total_assets': len(asset_keys)
    }
```

##### Evidence.dev Issues
```javascript
// Evidence.dev diagnostic script
const fs = require('fs');
const path = require('path');

function diagnoseEvidenceIssues() {
    const buildDir = './evidence-project/build';
    const configPath = './evidence-project/evidence.config.yaml';
    
    return {
        buildExists: fs.existsSync(buildDir),
        configValid: validateConfig(configPath),
        sourcesConnectable: testSourceConnections(),
        componentsValid: validateComponents()
    };
}
```

### Phase 4: Solution Development
**Purpose**: Develop and test solutions to resolve the root cause

#### Solution Planning
```markdown
## Solution Development Template

### Proposed Solutions
1. **Solution Option 1**:
   - Description: [What will be done]
   - Pros: [Benefits of this approach]
   - Cons: [Risks or drawbacks]
   - Effort: [Time/resource estimate]
   - Risk: [Implementation risk level]

2. **Solution Option 2**:
   - [Same format as above]

### Recommended Solution
- **Choice**: [Selected solution and rationale]
- **Implementation Plan**: [Step-by-step approach]
- **Rollback Plan**: [How to undo if needed]
- **Testing Strategy**: [How to verify solution works]
- **Timeline**: [Expected completion time]
```

#### Testing Framework
```javascript
// Solution testing framework
class SolutionTester {
    constructor(issueContext) {
        this.issueContext = issueContext;
        this.testResults = [];
    }
    
    async testSolution(solution) {
        const testSuite = this.createTestSuite(solution);
        
        for (const test of testSuite) {
            const result = await this.runTest(test);
            this.testResults.push(result);
        }
        
        return this.evaluateResults();
    }
    
    createTestSuite(solution) {
        return [
            this.createRegressionTest(),
            this.createPerformanceTest(),
            this.createIntegrationTest(),
            this.createUserAcceptanceTest()
        ];
    }
}
```

### Phase 5: Solution Implementation
**Purpose**: Apply the solution safely with proper validation

#### Implementation Checklist
- [ ] **Backup Created**: System state backed up before changes
- [ ] **Testing Completed**: Solution tested in non-production environment
- [ ] **Documentation Updated**: Relevant documentation reflects changes
- [ ] **Rollback Plan Ready**: Clear process to undo changes if needed
- [ ] **Stakeholders Notified**: Affected users informed of maintenance
- [ ] **Monitoring Prepared**: Enhanced monitoring during implementation

#### Implementation Process
```bash
#!/bin/bash
# Solution implementation script template

echo "Starting solution implementation for issue: $ISSUE_ID"
echo "Implementation by: $IMPLEMENTER"
echo "Timestamp: $(date)"

# Pre-implementation checks
echo "Running pre-implementation checks..."
npm run health:check
if [ $? -ne 0 ]; then
    echo "Pre-implementation check failed. Aborting."
    exit 1
fi

# Create backup
echo "Creating system backup..."
npm run backup:create --tag="pre-fix-$ISSUE_ID"

# Apply solution
echo "Applying solution..."
# [Implementation steps here]

# Post-implementation validation
echo "Running post-implementation validation..."
npm run health:check
npm run test:regression

# Document results
echo "Documenting implementation results..."
echo "Implementation completed at: $(date)" >> "logs/implementation_log_$ISSUE_ID.txt"
```

### Phase 6: Solution Validation
**Purpose**: Verify the solution resolves the issue without creating new problems

#### Validation Tests
```yaml
validation_tests:
  functional_tests:
    - name: "Core functionality restored"
      command: "npm run test:functional"
      expected: "all_pass"
      
    - name: "Integration points working"
      command: "npm run test:integration" 
      expected: "all_pass"
      
  performance_tests:
    - name: "Response times acceptable"
      command: "npm run test:performance"
      expected: "within_baseline"
      
    - name: "Resource usage normal"
      command: "npm run monitor:resources --duration=300"
      expected: "within_limits"
      
  user_acceptance_tests:
    - name: "User workflows functional"
      command: "npm run test:user-workflows"
      expected: "all_pass"
      
    - name: "UI rendering correctly"
      command: "npm run test:ui-regression"
      expected: "no_visual_changes"
```

#### Success Criteria
```markdown
## Resolution Success Criteria

### Primary Success Indicators
- [ ] Original issue no longer reproducible
- [ ] System functionality fully restored
- [ ] Performance within acceptable parameters
- [ ] No new issues introduced

### Secondary Success Indicators  
- [ ] User satisfaction confirmed
- [ ] Documentation updated
- [ ] Team knowledge enhanced
- [ ] Preventive measures implemented

### Monitoring Metrics
- [ ] Error rate returned to normal
- [ ] Response times within SLA
- [ ] Resource usage stable
- [ ] User activity patterns normal
```

### Phase 7: Knowledge Capture and Documentation
**Purpose**: Document the issue and resolution for future reference

#### Documentation Templates

##### Issue Resolution Report
```markdown
# Issue Resolution Report: [Issue ID]

## Executive Summary
- **Issue**: [Brief description]
- **Impact**: [Business/technical impact]
- **Resolution Time**: [Time to resolution]
- **Root Cause**: [Primary cause identified]
- **Solution**: [Solution implemented]

## Detailed Timeline
| Time | Event | Action Taken | Result |
|------|-------|-------------|--------|
| [Time] | Issue reported | [Action] | [Outcome] |
| [Time] | Investigation started | [Action] | [Outcome] |
| [Time] | Root cause identified | [Action] | [Outcome] |
| [Time] | Solution implemented | [Action] | [Outcome] |
| [Time] | Resolution confirmed | [Action] | [Outcome] |

## Root Cause Analysis
[Detailed explanation of why the issue occurred]

## Solution Details
[Complete description of the solution implemented]

## Prevention Measures
[Steps taken to prevent similar issues in the future]

## Lessons Learned
[Key insights gained from this incident]

## Follow-up Actions
- [ ] [Action item 1]
- [ ] [Action item 2]
- [ ] [Action item 3]
```

##### Knowledge Base Entry
```markdown
# [Issue Type] Troubleshooting Guide

## Symptoms
- [List of symptoms that indicate this issue]

## Quick Diagnosis
```bash
# Quick diagnostic commands
[Commands to quickly identify this issue]
```

## Resolution Steps
1. [Step 1 with explanation]
2. [Step 2 with explanation]
3. [Step 3 with explanation]

## Prevention
- [Preventive measures]
- [Monitoring recommendations]
- [Configuration changes]

## Related Issues
- [Links to similar issues]
- [Common variations]
```

### Phase 8: Process Improvement
**Purpose**: Learn from the incident to improve systems and processes

#### Post-Incident Review
```markdown
## Post-Incident Review Template

### What Went Well?
- [Positive aspects of the response]

### What Could Be Improved?
- [Areas for improvement]

### Action Items
| Action | Owner | Due Date | Priority |
|--------|-------|----------|----------|
| [Action] | [Person] | [Date] | [High/Med/Low] |

### Process Changes
- [Changes to procedures]
- [Tool improvements needed]
- [Training requirements]

### System Improvements
- [Technical improvements]
- [Monitoring enhancements]
- [Architecture changes]
```

## Quality Assurance

### Troubleshooting Quality Metrics
```yaml
quality_metrics:
  resolution_time:
    target: "< 4 hours for high priority issues"
    measurement: "time from report to resolution"
    
  first_time_fix_rate:
    target: "> 80%"
    measurement: "issues resolved without reopening"
    
  documentation_completeness:
    target: "> 95%"
    measurement: "required fields completed in issue reports"
    
  knowledge_capture_rate:
    target: "100% for critical issues"
    measurement: "issues with proper knowledge base entries"
```

### Review Process
```markdown
## Weekly Troubleshooting Review
- [ ] Review all resolved issues from past week
- [ ] Identify patterns and trends
- [ ] Update troubleshooting guides
- [ ] Schedule team training if needed
- [ ] Update prevention measures

## Monthly Process Improvement
- [ ] Analyze resolution time trends
- [ ] Review effectiveness of solutions
- [ ] Update troubleshooting workflows
- [ ] Enhance diagnostic tools
- [ ] Team feedback collection
```

## Integration with BMad Method

### Workflow Automation
```javascript
// Automated troubleshooting workflow integration
class TroubleshootingWorkflow extends BMadWorkflow {
    constructor() {
        super();
        this.templateEngine = new TemplateEngine();
        this.knowledgeBase = new KnowledgeBase();
    }
    
    async initiateIssueResponse(issueReport) {
        // Auto-classify issue
        const classification = await this.classifyIssue(issueReport);
        
        // Create troubleshooting task
        const task = await this.createTroubleshootingTask(classification);
        
        // Assign appropriate resources
        await this.assignResources(task, classification.severity);
        
        // Start monitoring
        return await this.startIssueMonitoring(task);
    }
    
    async captureResolutionKnowledge(issueId, resolution) {
        // Extract knowledge from resolution
        const knowledge = await this.extractKnowledge(resolution);
        
        // Update knowledge base
        await this.knowledgeBase.addEntry(knowledge);
        
        // Update troubleshooting guides
        await this.updateTroubleshootingGuides(knowledge);
    }
}
```

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial troubleshooting workflow template | Dev Agent |