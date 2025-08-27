# Narrative Quality Validation Workflows

## Purpose
Comprehensive quality validation and human review workflows for automated narrative generation to ensure publication-ready content.

## Multi-Stage Validation Framework

### Stage 1: Automated Statistical Accuracy Validation

#### Statistical Claims Verification
```yaml
validation_checklist:
  data_accuracy:
    - All percentages sum to 100% (or account for rounding)
    - Sample sizes match across related statistics
    - Confidence intervals mathematically correct
    - P-values align with stated significance levels
    - Effect sizes calculated and interpreted correctly
  
  interpretation_accuracy:
    - Correlation vs. causation appropriately distinguished
    - Statistical significance vs. practical significance noted
    - Confidence levels stated match analysis methods
    - Uncertainty appropriately acknowledged
    - Limitations clearly identified

  consistency_checks:
    - Statistics consistent between executive summary and detailed sections
    - Demographic breakdowns sum to total sample
    - Trend descriptions match underlying data direction
    - Comparative statements supported by appropriate tests
```

#### Validation Process
```markdown
**Step 1: Cross-Reference Data Sources**
1. Compare all narrative statistics against source data tables
2. Verify calculation accuracy for percentages, means, differences
3. Confirm sample sizes and demographics match source data
4. Validate confidence intervals and significance tests

**Step 2: Internal Consistency Check**
1. Executive summary statistics match detailed findings
2. Charts and tables align with narrative descriptions  
3. Demographic breakdowns mathematically consistent
4. Time trends properly describe data direction and magnitude

**Step 3: Statistical Interpretation Review**
1. P-value interpretations follow standard conventions
2. Effect size descriptions appropriate for field/context
3. Confidence interval explanations accurate
4. Uncertainty and limitations appropriately acknowledged
```

### Stage 2: Narrative Quality Assessment

#### Content Quality Rubric
```yaml
content_evaluation:
  clarity_accessibility:
    score_range: 1-5
    criteria:
      - Technical terms defined or avoided appropriately
      - Sentence structure clear and readable
      - Logical flow from findings to implications
      - Key points easily identifiable
    
  professional_tone:
    score_range: 1-5  
    criteria:
      - Authoritative without being academic
      - Appropriate confidence level in statements
      - Balanced presentation of findings
      - Professional language throughout
      
  completeness:
    score_range: 1-5
    criteria:
      - All significant findings addressed
      - Methodology transparently described
      - Limitations and caveats included
      - Actionable insights provided

  audience_appropriateness:
    score_range: 1-5
    criteria:
      - Appropriate detail level for target audience
      - Business/practical implications clear
      - Context relevant to reader needs
      - Takeaways actionable and specific

minimum_passing_score: 4.0_average_across_all_criteria
```

#### Quality Assessment Process
```markdown
**Automated Quality Checks:**
1. **Readability Analysis**: Flesch-Kincaid grade level 9-12 for general business audience
2. **Length Validation**: Section lengths appropriate for content depth
3. **Structure Verification**: Required sections present and properly formatted
4. **Reference Validation**: All charts/tables referenced exist and are described

**Content Review Checklist:**
- [ ] Executive summary can stand alone as complete overview
- [ ] Each key finding supported by specific statistical evidence
- [ ] Methodology section provides sufficient transparency
- [ ] Limitations acknowledge boundaries of conclusions
- [ ] Business implications practical and actionable
- [ ] Professional tone maintained throughout
- [ ] Technical accuracy verified against source data
```

### Stage 3: Template Integration Validation

#### Evidence.dev Compatibility Checks
```yaml
template_validation:
  variable_population:
    - All required template variables populated
    - Variable content appropriate length and format
    - SQL query results align with narrative claims
    - Interactive components properly described
    
  formatting_compliance:
    - Markdown syntax correct for Evidence.dev rendering
    - Chart references link to actual visualizations  
    - Table formatting compatible with Evidence.dev components
    - Interactive elements properly configured

  performance_validation:
    - Content length appropriate for web rendering
    - SQL queries optimized for acceptable load times
    - Image references functional and accessible
    - Mobile responsiveness considerations addressed
```

## Human Review Workflow Integration

### Review Stage Assignment
```yaml
review_assignments:
  statistical_accuracy_review:
    reviewer_type: "Technical specialist (data analyst/statistician)"
    focus_areas:
      - Mathematical accuracy of all calculations
      - Appropriate statistical test selection and interpretation
      - Confidence interval and p-value accuracy
      - Effect size calculation and interpretation
    
  content_quality_review:
    reviewer_type: "Content specialist (communications/writing)"
    focus_areas:
      - Clarity and accessibility of language
      - Logical flow and narrative structure
      - Audience appropriateness
      - Professional tone and style
      
  business_context_review:
    reviewer_type: "Domain expert (business stakeholder)"
    focus_areas:
      - Practical relevance of insights
      - Accuracy of business context and implications
      - Actionability of recommendations
      - Strategic alignment with organizational goals
      
  final_publication_review:
    reviewer_type: "Publication editor (final approval authority)"
    focus_areas:
      - Overall publication quality and readiness
      - Brand/style guide compliance
      - Legal/compliance considerations
      - Final approval for publication
```

### Review Process Workflow

#### Stage 1: Technical Statistical Review
```markdown
**Reviewer Instructions:**
"Review this narrative for statistical accuracy and appropriate interpretation. Focus on:

1. **Data Accuracy**: Verify all statistics match source data
2. **Statistical Interpretation**: Confirm appropriate interpretation of tests, confidence intervals, significance levels
3. **Technical Precision**: Check calculation accuracy and methodological descriptions
4. **Professional Standards**: Ensure analysis meets professional statistical communication standards

**Review Form:**
- [ ] All statistics verified against source data
- [ ] Statistical tests appropriately selected and interpreted
- [ ] Confidence intervals and p-values accurate
- [ ] Effect sizes calculated and contextualized appropriately
- [ ] Limitations and assumptions clearly stated
- [ ] Technical accuracy: PASS/FAIL (if FAIL, specify issues)

**Comments/Corrections Needed:** [Detailed feedback on any issues]"
```

#### Stage 2: Content Quality Review  
```markdown
**Reviewer Instructions:**
"Evaluate this narrative for clarity, accessibility, and professional communication quality:

1. **Accessibility**: Can target audience understand without statistical background?
2. **Clarity**: Is information presented logically and clearly?
3. **Completeness**: Are all important findings and implications addressed?
4. **Professional Tone**: Does it meet publication standards?

**Review Form:**
- [ ] Language appropriate for target audience
- [ ] Key findings clearly highlighted and explained
- [ ] Executive summary comprehensive and standalone
- [ ] Professional tone maintained throughout
- [ ] Practical implications clearly articulated
- [ ] Content quality: PASS/FAIL (if FAIL, specify improvements needed)

**Specific Feedback:** [Detailed suggestions for improvement]"
```

#### Stage 3: Business Context Review
```markdown
**Reviewer Instructions:**
"Assess the business relevance and practical value of this analysis:

1. **Business Relevance**: Are findings meaningful for organizational decisions?
2. **Contextual Accuracy**: Is business context accurate and appropriate?
3. **Actionable Insights**: Are recommendations practical and implementable?
4. **Strategic Alignment**: Do conclusions align with business objectives?

**Review Form:**
- [ ] Findings relevant to business objectives
- [ ] Business context accurate and appropriate
- [ ] Recommendations practical and actionable
- [ ] Insights valuable for decision-making
- [ ] Strategic alignment confirmed
- [ ] Business value: PASS/FAIL (if FAIL, specify concerns)

**Business Feedback:** [Comments on relevance, accuracy, actionability]"
```

### Review Management System

#### Review Tracking
```yaml
review_workflow_management:
  stages:
    - technical_review: 
        status_options: [pending, in_review, approved, needs_revision]
        required_for_progression: true
        estimated_time: "2-4 hours"
        
    - content_review:
        status_options: [pending, in_review, approved, needs_revision]  
        required_for_progression: true
        estimated_time: "1-2 hours"
        
    - business_review:
        status_options: [pending, in_review, approved, needs_revision]
        required_for_progression: true  
        estimated_time: "1-2 hours"
        
    - final_approval:
        status_options: [pending, approved, rejected]
        required_for_publication: true
        estimated_time: "30 minutes"

  escalation_rules:
    technical_disagreement: "Escalate to senior statistician"
    content_disagreement: "Escalate to communications director"
    business_disagreement: "Escalate to stakeholder committee"
    timeline_concerns: "Escalate to project manager"
```

#### Quality Gate Requirements
```yaml
publication_approval_gates:
  gate_1_technical_accuracy:
    requirements:
      - All statistical claims verified
      - Technical reviewer approval
      - No mathematical errors identified
      - Appropriate uncertainty acknowledgment
      
  gate_2_communication_quality:
    requirements:  
      - Content reviewer approval
      - Readability standards met
      - Professional tone confirmed
      - Audience appropriateness validated
      
  gate_3_business_value:
    requirements:
      - Business reviewer approval
      - Practical insights confirmed  
      - Actionable recommendations provided
      - Strategic alignment validated
      
  gate_4_publication_readiness:
    requirements:
      - All previous gates passed
      - Template integration confirmed
      - Evidence.dev compatibility verified
      - Final approval authority sign-off
```

## Automated Quality Monitoring

### Continuous Quality Metrics
```yaml
quality_metrics_tracking:
  accuracy_metrics:
    - Statistical claim accuracy rate (target: 99.5%+)
    - Internal consistency score (target: 95%+)
    - Data source alignment rate (target: 100%)
    
  readability_metrics:
    - Flesch-Kincaid grade level (target: 9-12)
    - Average sentence length (target: 15-20 words)
    - Technical term definition rate (target: 100%)
    
  completeness_metrics:
    - Required section presence (target: 100%)
    - Key finding coverage rate (target: 95%+)
    - Limitation acknowledgment rate (target: 100%)
    
  reviewer_satisfaction:
    - First-pass approval rate (target: 80%+)
    - Average revision cycles (target: <2)
    - Review completion time (target: within SLA)
```

### Quality Improvement Feedback Loop
```markdown
**Monthly Quality Review Process:**
1. **Aggregate Quality Metrics**: Compile accuracy, readability, and satisfaction scores
2. **Identify Improvement Opportunities**: Analyze patterns in reviewer feedback and revision requests
3. **Update Templates and Guidelines**: Incorporate learnings into narrative generation templates
4. **Reviewer Training**: Address common issues through targeted reviewer education
5. **Process Optimization**: Streamline workflow based on efficiency metrics
```

## Integration with BMad Agent Workflows

### Agent-Specific Quality Responsibilities

#### Analyst Agent Quality Tasks
```markdown
**Pre-Review Preparation:**
1. Verify all statistical claims against source data
2. Confirm appropriate statistical test selection
3. Validate calculation accuracy
4. Ensure uncertainty appropriately communicated

**Self-Assessment Checklist:**
- [ ] All statistics independently verified
- [ ] Statistical interpretations follow professional standards  
- [ ] Confidence intervals and significance levels accurate
- [ ] Effect sizes properly contextualized
- [ ] Limitations clearly acknowledged
```

#### Scribe Agent Quality Tasks
```markdown
**Narrative Quality Enhancement:**
1. Review language clarity and accessibility
2. Ensure professional tone throughout
3. Verify logical flow and structure
4. Confirm audience appropriateness

**Style and Clarity Checklist:**
- [ ] Technical terms defined appropriately
- [ ] Sentence structure clear and readable
- [ ] Key points easily identifiable
- [ ] Professional tone maintained
- [ ] Practical implications clearly stated
```

### Quality Validation Integration Points
```yaml
evidence_dev_integration:
  pre_publication_validation:
    - Template variable population verification
    - SQL query result alignment confirmation
    - Interactive component functionality testing
    - Mobile responsiveness validation
    
  post_publication_monitoring:
    - User engagement metrics tracking
    - Page load performance monitoring  
    - Content accuracy feedback collection
    - Reader satisfaction assessment
```

This comprehensive quality validation framework ensures that all automated narrative generation meets professional publication standards while maintaining efficiency and scalability.