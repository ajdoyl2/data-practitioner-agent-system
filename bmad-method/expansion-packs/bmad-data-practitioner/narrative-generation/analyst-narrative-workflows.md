# Analyst Agent Narrative Generation Workflows

## Purpose
Structured workflows for the analyst agent to generate publication-quality narratives from analytical results.

## Workflow 1: Statistical Results to Executive Summary

### Input Requirements
- Statistical test results (p-values, confidence intervals, effect sizes)
- Sample sizes and data quality metrics
- Business context and domain information
- Target audience specification

### Process Steps
1. **Statistical Validation**
   - Verify all statistical claims against source data
   - Confirm appropriate statistical tests were used
   - Validate assumption compliance

2. **Executive Summary Generation**
   ```
   Prompt Template:
   "Based on the following statistical analysis results, generate an executive summary that:
   - Leads with the most important business finding
   - Includes confidence level and statistical backing
   - Provides clear business implications
   - Suggests specific next steps
   
   Statistical Results: [insert results]
   Business Context: [insert context]
   Target Audience: [executive/technical/operational]
   
   Use professional, accessible language avoiding statistical jargon."
   ```

3. **Quality Validation**
   - Confirm statistical accuracy
   - Verify business relevance
   - Check tone appropriateness

### Output Format
```markdown
## Executive Summary
[Primary business finding with statistical backing]

### Key Insights
1. [First insight] with [confidence level]% certainty
2. [Second insight] based on [statistical evidence]
3. [Third insight] indicating [practical implications]

### Business Implications
[Practical next steps and recommendations]

### Statistical Foundation
Based on analysis of [sample size] with [confidence level]% confidence intervals.
```

## Workflow 2: Hypothesis Test Results to Publication Narrative

### Input Requirements
- Hypothesis test outcomes from Story 1.6 integration
- Statistical measures (p-values, effect sizes, confidence intervals)
- Original hypothesis statements
- Business research questions

### Process Steps
1. **Hypothesis Outcome Classification**
   - Supported (p < 0.05 with meaningful effect size)
   - Rejected (p ≥ 0.05 or negligible effect size)
   - Inconclusive (borderline significance or conflicting measures)

2. **Narrative Generation**
   ```
   Prompt Template:
   "Convert the following hypothesis test results into a professional research narrative:
   
   Original Hypothesis: [hypothesis statement]
   Statistical Results: [p-value, effect size, confidence interval]
   Sample Information: [sample size, data quality]
   Business Context: [research question background]
   
   Generate a narrative that:
   - Clearly states whether hypothesis was supported/rejected
   - Explains statistical evidence in accessible terms
   - Discusses practical significance and business implications
   - Acknowledges limitations and suggests next steps
   - Follows Pew Research publication style"
   ```

3. **Evidence Integration**
   - Link to supporting visualizations
   - Reference data tables and statistical outputs
   - Include methodology transparency

### Output Format
```markdown
## Hypothesis Analysis Results

### Research Question
[Original research question or hypothesis]

### Key Finding
[Primary outcome: supported/rejected/inconclusive]

### Statistical Evidence
Our analysis [reveals/indicates/suggests] [finding description]. With [sample size] observations, we found [statistical result] (p = [value], 95% CI: [range]). 

[For supported hypotheses:]
This provides [strong/moderate] evidence supporting [hypothesis], with practical implications for [business area].

[For rejected hypotheses:]
The data does not support [hypothesis]. While [sample patterns may exist], we cannot confidently generalize beyond the observed sample.

### Methodology Notes
[Brief methodology explanation and key limitations]

### Business Implications
[Practical recommendations based on findings]
```

## Workflow 3: Exploratory Analysis to Insights Narrative

### Input Requirements
- EDA results and pattern discoveries
- Statistical summaries and anomaly detection
- Data visualization outputs
- Domain expertise context

### Process Steps
1. **Pattern Prioritization**
   - Rank discoveries by statistical significance
   - Assess business relevance and actionability
   - Identify unexpected or counterintuitive findings

2. **Insight Generation**
   ```
   Prompt Template:
   "Generate publication-quality insights from exploratory data analysis:
   
   Key Patterns Discovered:
   [List of patterns with statistical backing]
   
   Data Characteristics:
   [Sample size, time period, data quality indicators]
   
   Business Domain: [context and industry]
   
   Create a narrative that:
   - Highlights 3-5 most significant findings
   - Explains what makes each finding important
   - Discusses business implications and opportunities
   - Suggests areas requiring deeper investigation
   - Uses engaging, accessible language while maintaining statistical accuracy"
   ```

3. **Visualization Integration**
   - Reference specific charts and tables
   - Describe visual patterns in text
   - Guide readers through data interpretation

### Output Format
```markdown
## Key Discoveries from Data Analysis

### Overview
Exploratory analysis of [data description] revealed [number] significant patterns with important business implications.

### Primary Findings

#### Finding 1: [Pattern Name]
[Description of pattern with statistical backing]
**Business Relevance:** [Why this matters to the organization]
**Statistical Foundation:** [Supporting evidence]

#### Finding 2: [Pattern Name]
[Description with evidence]
**Business Relevance:** [Implications]
**Statistical Foundation:** [Evidence]

### Unexpected Discoveries
[Surprising or counterintuitive findings]

### Recommended Deep-Dive Areas
Based on these exploratory findings, we recommend further investigation into:
1. [Area 1] to understand [specific question]
2. [Area 2] to validate [hypothesis]
3. [Area 3] to explore [opportunity]
```

## Workflow 4: Performance Metrics to Dashboard Narrative

### Input Requirements
- KPI and performance metric calculations
- Trend analysis results
- Comparative analysis outcomes
- Business performance targets

### Process Steps
1. **Metric Contextualization**
   - Compare against targets, benchmarks, historical performance
   - Calculate percentage changes and growth rates
   - Identify significant deviations or trends

2. **Dashboard Narrative Creation**
   ```
   Prompt Template:
   "Create dashboard narrative text for performance metrics:
   
   Current Metrics: [KPI values and calculations]
   Historical Comparison: [trend data]
   Target Performance: [goals and benchmarks]
   Time Period: [reporting period]
   
   Generate narrative sections that:
   - Summarize overall performance status
   - Highlight key achievements and concerns
   - Explain significant changes or trends
   - Provide context for metric interpretation
   - Suggest actionable insights for stakeholders"
   ```

3. **Interactive Element Descriptions**
   - Explain filter functionality
   - Describe drill-down capabilities
   - Guide users through dashboard interaction

### Output Format
```markdown
## Performance Dashboard Overview

### Current Status
[Overall performance summary with key metrics]

### Key Highlights
- **Achievement:** [Positive metric with context]
- **Concern:** [Issue requiring attention]
- **Trend:** [Significant change with implications]

### Metric Deep Dive

#### [Metric 1 Name]: [Current Value]
[Trend direction] of [percentage] compared to [comparison period]. This [positive/concerning] trend [business interpretation].

#### [Metric 2 Name]: [Current Value]  
[Performance against target]: [over/under/meeting] target by [amount]. [Contextual explanation].

### Interactive Features
Use the filters above to explore performance by [dimensions]. The trend charts show [time period] data with [notable patterns].
```

## Workflow 5: Evidence.dev Template Integration

### Input Requirements
- Completed analytical results
- Evidence.dev template requirements
- Publication audience specification
- Branding and style guidelines

### Process Steps
1. **Template Variable Mapping**
   - Map analytical results to template variables
   - Ensure all required fields have content
   - Validate variable format compatibility

2. **Template-Specific Narrative Generation**
   ```
   Prompt Template:
   "Generate Evidence.dev template content:
   
   Template Type: [insight-document/pew-research-style/executive-briefing]
   Analytical Results: [comprehensive results summary]
   Target Variables: [list of template variables to populate]
   Audience: [target reader profile]
   
   Create professional narrative content that:
   - Fits the template structure and style
   - Maintains statistical accuracy
   - Matches audience sophistication level
   - Integrates with Evidence.dev SQL queries
   - Supports interactive visualization components"
   ```

3. **Quality Assurance**
   - Verify template variable population
   - Confirm SQL query alignment
   - Test narrative flow and coherence

### Output Format
Template variables populated according to Evidence.dev requirements:

```markdown
{{executive_summary}}: [Generated executive summary]
{{key_findings}}: [List of primary insights]
{{methodology_description}}: [Clear methodology explanation]
{{statistical_interpretation}}: [Technical results for business audience]
{{business_implications}}: [Actionable recommendations]
{{chart_descriptions}}: [Visualization narrative text]
{{interactive_guidance}}: [Dashboard usage instructions]
```

## Quality Assurance Framework

### Statistical Accuracy Validation
Before finalizing any narrative:
1. Cross-reference all statistical claims with source data
2. Verify p-values, confidence intervals, and effect sizes
3. Confirm appropriate interpretation of statistical tests
4. Check for correlation vs. causation accuracy

### Narrative Quality Review
1. **Clarity:** Can target audience understand without statistics background?
2. **Completeness:** Are all important findings addressed?
3. **Balance:** Are limitations and uncertainties acknowledged?
4. **Actionability:** Are practical next steps provided?

### Template Integration Testing
1. Confirm all template variables populated correctly
2. Test SQL query alignment with narrative claims
3. Verify Evidence.dev rendering compatibility
4. Validate interactive component descriptions

## Integration Points

### Story 1.6 Hypothesis Results
- Import hypothesis test outcomes
- Reference original research questions
- Build narrative continuity from hypothesis to conclusion

### Evidence.dev Publication System
- Ensure narrative formats match template requirements
- Support Universal SQL query result interpretation
- Integrate with visualization and dashboard components

### BMad Agent Coordination
- **Analyst:** Primary narrative generation responsibility
- **Scribe:** Professional writing review and enhancement
- **Mentor:** Explanation and educational content development
- **QA:** Quality validation and accuracy verification