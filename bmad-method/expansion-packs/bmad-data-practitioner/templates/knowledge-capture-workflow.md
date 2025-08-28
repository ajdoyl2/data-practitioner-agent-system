# Knowledge Capture Workflow Template

## Overview
Standardized workflow for capturing, documenting, and maintaining institutional knowledge in the BMad Data Practitioner System.

## When to Use This Template
- New data source integration
- Analysis methodology documentation  
- System configuration changes
- Troubleshooting procedure discovery
- Best practice identification
- Architectural decision documentation

## Workflow Steps

### Step 1: Knowledge Identification
**Purpose**: Identify and categorize the knowledge to be captured

#### Information Gathering
- [ ] **Knowledge Type**: Select category
  - [ ] Technical procedure
  - [ ] Analysis methodology
  - [ ] Configuration guide
  - [ ] Troubleshooting solution
  - [ ] Best practice
  - [ ] Architectural decision

- [ ] **Knowledge Source**: Identify origin
  - [ ] Team member expertise
  - [ ] Project discovery
  - [ ] External research
  - [ ] Problem resolution
  - [ ] System documentation

- [ ] **Priority Level**: Assess importance
  - [ ] Critical (system-breaking if lost)
  - [ ] High (significant impact on productivity)
  - [ ] Medium (useful but not essential)
  - [ ] Low (nice to have)

#### Stakeholder Identification
- [ ] **Knowledge Owner**: Who possesses this knowledge?
- [ ] **Primary Users**: Who will use this knowledge?
- [ ] **Reviewers**: Who should validate accuracy?
- [ ] **Maintainers**: Who will keep it updated?

### Step 2: Knowledge Extraction
**Purpose**: Extract and structure the knowledge systematically

#### Content Structure
```markdown
# [Knowledge Title]

## Summary
Brief overview of what this knowledge covers

## Context
- When is this knowledge applicable?
- What situations require this information?
- Prerequisites or dependencies

## Detailed Information
[Comprehensive explanation of the knowledge]

## Step-by-Step Procedures
1. [If applicable, provide sequential steps]
2. [Include decision points and alternatives]
3. [Note potential issues and solutions]

## Examples
[Practical examples with real data/scenarios]

## Related Knowledge
- Links to related documentation
- Dependencies on other procedures
- Connected systems or components

## Validation Criteria
- How to verify this knowledge is correct
- Success indicators
- Common failure modes
```

#### Capture Methods
- [ ] **Documentation Session**: Scheduled interview with knowledge holder
- [ ] **Screen Recording**: Capture procedural knowledge visually
- [ ] **Code Review**: Extract knowledge from code and comments
- [ ] **Post-Mortem**: Capture lessons learned from incidents
- [ ] **Pair Programming**: Document knowledge during collaboration

### Step 3: Knowledge Structuring
**Purpose**: Organize knowledge for maximum accessibility and usefulness

#### Content Organization
- [ ] **Clear Title**: Descriptive and searchable
- [ ] **Tags/Categories**: For discovery and grouping
- [ ] **Difficulty Level**: Beginner/Intermediate/Advanced
- [ ] **Estimated Time**: Time required to apply this knowledge
- [ ] **Tools/Systems**: Required tools or system access

#### Quality Checklist
- [ ] **Completeness**: All necessary information included
- [ ] **Accuracy**: Information is correct and up-to-date
- [ ] **Clarity**: Easy to understand and follow
- [ ] **Actionability**: Provides clear next steps
- [ ] **Examples**: Includes concrete examples
- [ ] **Context**: Explains when and why to use

### Step 4: Knowledge Validation
**Purpose**: Ensure knowledge is accurate and complete before publication

#### Validation Process
- [ ] **Technical Review**: Expert validates technical accuracy
- [ ] **Usability Test**: New team member follows instructions
- [ ] **Peer Review**: Team members provide feedback
- [ ] **Stakeholder Approval**: Relevant stakeholders sign off

#### Validation Criteria
```yaml
validation_checklist:
  technical_accuracy:
    - Information is factually correct
    - Procedures work as described
    - Code examples execute successfully
    - Links and references are valid
  
  completeness:
    - All necessary steps are included
    - Prerequisites are clearly stated
    - Expected outcomes are defined
    - Error handling is covered
  
  usability:
    - Instructions are clear and unambiguous
    - Examples are relevant and helpful
    - Navigation is intuitive
    - Search terms are appropriate
  
  consistency:
    - Follows organizational standards
    - Uses consistent terminology
    - Aligns with related documentation
    - Maintains style guidelines
```

### Step 5: Knowledge Publication
**Purpose**: Make knowledge accessible to intended audiences

#### Publication Locations
- [ ] **Internal Wiki**: General team knowledge
- [ ] **Technical Documentation**: System-specific information
- [ ] **Training Materials**: Educational content
- [ ] **Troubleshooting Guide**: Problem-solving information
- [ ] **Best Practices Collection**: Methodology documentation

#### Metadata Assignment
```yaml
knowledge_metadata:
  title: "Knowledge Title"
  author: "Knowledge Creator"
  reviewers: ["Reviewer 1", "Reviewer 2"]
  created_date: "YYYY-MM-DD"
  last_updated: "YYYY-MM-DD"
  version: "1.0"
  tags: ["tag1", "tag2", "tag3"]
  category: "Technical Procedure"
  difficulty: "Intermediate"
  estimated_time: "30 minutes"
  systems: ["DuckDB", "Evidence.dev"]
  related_documents: ["doc1.md", "doc2.md"]
```

### Step 6: Knowledge Maintenance
**Purpose**: Keep knowledge current and accurate over time

#### Maintenance Schedule
- [ ] **Regular Reviews**: Quarterly accuracy checks
- [ ] **Update Triggers**: System changes, process changes
- [ ] **Deprecation Process**: Remove outdated information
- [ ] **Version Control**: Track changes and maintain history

#### Maintenance Tasks
```markdown
## Monthly Maintenance
- [ ] Check all links and references
- [ ] Verify system screenshots and examples
- [ ] Review usage analytics
- [ ] Update based on user feedback

## Quarterly Maintenance  
- [ ] Comprehensive accuracy review
- [ ] Update for system changes
- [ ] Refresh examples with current data
- [ ] Validate against current best practices

## Annual Maintenance
- [ ] Full content audit
- [ ] Reorganization if needed
- [ ] Archive outdated information
- [ ] Update training materials
```

## Template Examples

### Example 1: Technical Procedure
```markdown
# Configuring DuckDB Memory Management

## Summary
Guide for optimizing DuckDB memory allocation and performance tuning in the BMad Data Practitioner System.

## Context
- Use when experiencing memory issues with large datasets
- Required for datasets >1GB or complex analytical queries
- Prerequisites: System administrator access, understanding of memory concepts

## Configuration Steps
1. **Assess Current Usage**
   ```bash
   node tools/data-services/memory-manager.js --status
   ```

2. **Calculate Optimal Settings**
   - Available system memory
   - Concurrent user load
   - Dataset size requirements

3. **Update Configuration**
   ```yaml
   duckdb:
     memory_limit: "8GB"
     buffer_pool_size: "4GB"
     threads: 4
   ```

## Examples
- Small team (2-3 users): 4GB memory limit
- Medium team (5-10 users): 8GB memory limit  
- Large datasets (>5GB): 16GB memory limit

## Validation
- Query performance improved by >50%
- Memory usage stable under load
- No out-of-memory errors during operation
```

### Example 2: Analysis Methodology
```markdown
# Customer Segmentation Analysis Workflow

## Summary
Standard methodology for performing RFM (Recency, Frequency, Monetary) customer segmentation analysis.

## Context
- Monthly customer analysis reports
- Customer marketing campaign planning
- Customer lifetime value assessment
- Prerequisites: Customer transaction data, DuckDB access

## Analysis Steps
1. **Data Preparation**
   - Validate transaction data quality
   - Define analysis timeframe (typically 12 months)
   - Identify customer identifiers

2. **RFM Calculation**
   ```sql
   WITH customer_rfm AS (
     SELECT 
       customer_id,
       DATE_DIFF('day', MAX(purchase_date), CURRENT_DATE) as recency,
       COUNT(*) as frequency,
       SUM(purchase_amount) as monetary
     FROM customer_transactions
     WHERE purchase_date >= CURRENT_DATE - INTERVAL 365 DAYS
     GROUP BY customer_id
   )
   SELECT * FROM customer_rfm;
   ```

3. **Segmentation Logic**
   - Score each dimension (1-5 scale)
   - Apply business rules for segment assignment
   - Validate segment distributions

## Expected Outcomes
- 5-8 distinct customer segments
- Clear segment definitions and characteristics
- Actionable insights for marketing teams
```

## Quality Assurance

### Knowledge Quality Metrics
```yaml
quality_metrics:
  completeness_score:
    calculation: "Required sections completed / Total required sections"
    target: "> 90%"
    
  accuracy_score:
    calculation: "Validation tests passed / Total validation tests"
    target: "100%"
    
  usability_score:
    calculation: "User success rate following instructions"
    target: "> 85%"
    
  freshness_score:
    calculation: "Days since last update / Maximum allowed age"
    target: "< 90 days for critical knowledge"
```

### Knowledge Review Process
```markdown
## Review Cycle
1. **Initial Review**: Within 48 hours of creation
2. **Technical Review**: Within 1 week of creation
3. **User Testing**: Within 2 weeks of creation
4. **Final Approval**: Within 3 weeks of creation
5. **Periodic Review**: Every 6 months for critical knowledge

## Review Checklist
- [ ] Technical accuracy verified
- [ ] Instructions tested by independent user
- [ ] Related documentation updated
- [ ] Search metadata optimized
- [ ] Access permissions configured
```

## Integration with BMad Method

### Template Integration
```yaml
bmad_integration:
  agent_workflows:
    - Create knowledge capture tasks automatically
    - Integrate with existing elicitation patterns
    - Link to BMad template system
    
  documentation_generation:
    - Auto-generate documentation from templates
    - Create cross-references between documents
    - Maintain documentation lineage
    
  quality_gates:
    - Validate knowledge completeness before publication
    - Check for consistency with existing documentation
    - Ensure proper categorization and tagging
```

### Workflow Automation
```javascript
// Automated knowledge capture workflow
class KnowledgeCaptureWorkflow {
    constructor(config) {
        this.config = config;
        this.templateEngine = new TemplateEngine();
    }
    
    async initiateCapture(knowledgeType, context) {
        // Create knowledge capture task
        const task = await this.createCaptureTask(knowledgeType, context);
        
        // Assign appropriate template
        const template = await this.selectTemplate(knowledgeType);
        
        // Initialize workflow
        return await this.startWorkflow(task, template);
    }
    
    async validateKnowledge(knowledgeId) {
        // Run validation checks
        const validationResults = await this.runValidations(knowledgeId);
        
        // Generate quality score
        const qualityScore = this.calculateQualityScore(validationResults);
        
        return {
            valid: qualityScore >= this.config.minimumQualityScore,
            score: qualityScore,
            issues: validationResults.issues
        };
    }
}
```

## Change Log
| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2024-01-XX | 1.0 | Initial knowledge capture workflow template | Dev Agent |