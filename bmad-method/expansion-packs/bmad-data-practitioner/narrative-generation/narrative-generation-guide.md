# Automated Narrative Generation Guide

## Purpose
This guide provides BMad agents (especially the analyst) with knowledge and templates to generate publication-quality narratives from analytical results for Evidence.dev publications.

## Agent Activation Context
**Primary Agent:** analyst (data analysis and interpretation specialist)
**Secondary Agents:** mentor (explanation and education), scribe (professional writing)
**Usage Context:** Converting analytical results into professional publication narratives

## Narrative Generation Framework

### 1. Pew Research Publication Standards
**Professional Tone:** Clear, accessible, authoritative without being academic
**Structure:** Executive summary → Key findings → Methodology → Statistical analysis → Interpretation
**Language:** Avoid jargon, explain technical terms, focus on practical implications
**Evidence-Based:** All claims supported by statistical evidence with confidence levels

### 2. Statistical Interpretation Patterns

#### Hypothesis Test Results
```markdown
**Template for p < 0.05:**
"Statistical analysis reveals a significant relationship between [variable A] and [variable B] (p = [value], confidence level = [%]). This finding suggests that [practical interpretation] with [confidence level]% certainty."

**Template for p ≥ 0.05:**
"Analysis indicates no statistically significant relationship between [variable A] and [variable B] (p = [value]). While patterns may exist in the sample data, we cannot confidently generalize these findings to the broader population."
```

#### Effect Size Communication
```markdown
**Small Effect:** "While statistically significant, the practical impact appears modest ([effect size metric] = [value]), suggesting [interpretation]."

**Medium Effect:** "Results indicate a meaningful relationship ([effect size metric] = [value]), with practical implications for [context]."

**Large Effect:** "Findings reveal a substantial association ([effect size metric] = [value]), indicating [strong practical interpretation]."
```

#### Confidence Interval Interpretation
```markdown
"We can be [confidence level]% confident that the true [parameter] falls between [lower bound] and [upper bound]. This range [practical interpretation of the range]."
```

### 3. Business Context Generation Patterns

#### Market Impact Framework
```markdown
**Revenue Implications:** "[Finding] suggests potential [revenue impact direction] of approximately [range or estimate] based on [analytical basis]."

**Operational Efficiency:** "This analysis indicates opportunities to [improve/optimize] [process area] with estimated [efficiency gain] improvement in [metric]."

**Risk Assessment:** "Results highlight [risk level] risk in [area], requiring [recommended action level] within [timeframe]."
```

#### Stakeholder Communication
```markdown
**Executive Summary Pattern:**
"Key finding: [main insight in one sentence]
Business impact: [practical implications]
Confidence level: [statistical confidence]
Recommended action: [specific next steps]"

**Technical Audience Pattern:**
"Statistical analysis using [method] on [sample description] reveals [technical finding] with [statistical measures]. [Methodology validation]. [Limitations and assumptions]."
```

### 4. Visualization Description Templates

#### Chart Narratives
```markdown
**Trend Analysis:**
"Figure [X] illustrates the [trend direction] in [variable] over [time period]. The [trend characteristic, e.g., steady increase, seasonal pattern] shows [rate of change] with [notable observations]."

**Comparison Charts:**
"The comparison reveals [key difference] between [groups]. [Group A] shows [performance] while [Group B] demonstrates [contrasting performance], with a [magnitude] difference of [quantified difference]."

**Distribution Analysis:**
"The distribution shows [distribution characteristics] with [central tendency] and [spread characteristics]. [Notable outliers or skewness] suggest [interpretation]."
```

#### Interactive Dashboard Descriptions
```markdown
**Filter Functionality:**
"Interactive filters allow exploration of [variables]. Key patterns emerge when filtering by [important filter], revealing [conditional insights]."

**Drill-down Capabilities:**
"Detailed analysis is available by [interaction method]. [Specific example] shows how [deeper insight] varies across [dimensions]."
```

### 5. Quality Validation Framework

#### Statistical Accuracy Checklist
- [ ] All statistical claims match underlying data
- [ ] P-values and confidence intervals correctly interpreted
- [ ] Effect sizes appropriately contextualized
- [ ] Limitations and assumptions clearly stated
- [ ] Correlation vs. causation appropriately distinguished

#### Narrative Quality Checklist
- [ ] Executive summary accurately reflects detailed findings
- [ ] Technical terms explained for target audience
- [ ] Actionable insights provided where appropriate
- [ ] Uncertain findings appropriately qualified
- [ ] Professional tone maintained throughout

#### Business Relevance Validation
- [ ] Practical implications clearly articulated
- [ ] Business context appropriate for industry/domain
- [ ] Recommendations align with analytical findings
- [ ] Risk factors and limitations acknowledged
- [ ] Timeline and resource implications considered

## Integration with Evidence.dev Templates

### Template Variable Substitution
When generating narratives for Evidence.dev templates, use these variable patterns:

```markdown
{{executive_summary}} → Generated using executive summary pattern
{{key_findings}} → List of 3-5 primary insights with statistical backing
{{methodology_description}} → Clear explanation of analytical approach
{{statistical_interpretation}} → Technical results explained for business audience
{{business_implications}} → Practical next steps and recommendations
```

### SQL Query Result Interpretation
For Evidence.dev Universal SQL results:

```markdown
**Pattern for Query Results:**
"Analysis of [data source] using [query description] reveals [primary finding]. [Statistical summary with sample size, confidence measures]. [Practical interpretation]."

**Example:**
"Analysis of customer transaction data over the past 12 months reveals a 23% increase in average order value among premium subscribers. With 95% confidence, the true increase falls between 18% and 28% (n=15,847). This suggests that premium features effectively drive higher-value purchases, supporting continued investment in premium tier development."
```

## Agent Workflow Integration

### Step 1: Data Analysis Completion
**Analyst Agent Input Required:**
- Statistical test results with p-values, confidence intervals, effect sizes
- Sample sizes and data quality assessments  
- Key pattern discoveries and anomaly detection results
- Hypothesis validation outcomes from Story 1.6 integration

### Step 2: Narrative Generation
**Analyst Agent Process:**
1. Apply statistical interpretation patterns
2. Generate business context using frameworks above
3. Create visualization descriptions for charts/dashboards
4. Validate narrative accuracy against source data
5. Format for Evidence.dev template integration

### Step 3: Quality Review
**Human Review Integration Points:**
- Statistical interpretation accuracy validation
- Business context relevance confirmation
- Publication tone and style approval
- Final narrative quality assessment

## Story 1.6 Integration Patterns

### Hypothesis Results Integration
```markdown
**Hypothesis Validation Pattern:**
"Initial hypothesis: [hypothesis statement]
Analytical outcome: [supported/rejected/inconclusive]
Statistical evidence: [test results with significance levels]
Business interpretation: [practical implications of validation outcome]
Recommended next steps: [actions based on hypothesis outcome]"
```

### Automated EDA Integration
```markdown
**Pattern Discovery:**
"Exploratory data analysis identified [number] significant patterns:
1. [Pattern 1]: [description] with [statistical backing]
2. [Pattern 2]: [description] with [statistical backing]
These patterns suggest [overarching insight] requiring [recommended investigation/action]."
```

## Advanced Narrative Techniques

### Multi-Audience Adaptation
**Executive Audience:** Focus on business impact, ROI, strategic implications
**Technical Audience:** Include methodology details, statistical measures, limitations  
**Operational Audience:** Emphasize actionable insights, process improvements, implementation steps

### Uncertainty Communication
```markdown
**High Confidence (p < 0.01):** "Evidence strongly indicates..."
**Moderate Confidence (p < 0.05):** "Analysis suggests..."  
**Low Confidence (p < 0.10):** "Data indicates a possible trend..."
**No Significance (p ≥ 0.10):** "No clear evidence supports..."
```

### Longitudinal Analysis Narratives
```markdown
**Trend Analysis:** "[Trend direction] observed over [time period] with [trend strength] consistency. [Seasonal/cyclical patterns]. [Projection implications]."

**Before/After Analysis:** "Comparing periods [before] and [after] reveals [magnitude] change in [metric]. [Statistical significance]. [Practical implications]."
```

## Template Integration Examples

### Example 1: Executive Briefing Narrative
```markdown
# Executive Summary
Analysis of Q3 customer engagement data reveals significant opportunities for revenue optimization. Customer satisfaction scores increased 15% (p < 0.01), directly correlating with 23% higher retention rates among premium subscribers.

## Key Business Implications
- Premium tier effectiveness validated with statistical significance
- Customer satisfaction investment ROI confirmed at 3.2:1 ratio
- Recommended expansion of premium features based on engagement patterns

## Statistical Foundation
Analysis based on 47,293 customer interactions with 95% confidence intervals. Effect sizes indicate medium to large practical significance across all measured dimensions.
```

### Example 2: Technical Report Integration
```markdown
## Methodology
Statistical analysis employed multiple regression modeling with bootstrapped confidence intervals (n=10,000 iterations). Hypothesis testing used Bonferroni correction for multiple comparisons (α = 0.05/5 = 0.01).

## Results Interpretation  
Primary hypothesis (H₁) supported with strong evidence (p = 0.003, Cohen's d = 0.67). Effect size indicates medium practical significance with confidence interval [0.34, 0.89].
```

This guide enables BMad agents to generate professional, statistically accurate narratives that integrate seamlessly with Evidence.dev publication templates while maintaining publication quality standards.