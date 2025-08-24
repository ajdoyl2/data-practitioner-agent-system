# Hypothesis Testing Workflow Template

## Overview
Guided workflow for hypothesis formation, testing, and validation using the BMad data practitioner framework.

## Workflow Structure

### Phase 1: Hypothesis Formation
**Duration**: 15-30 minutes
**Prerequisites**: EDA report and domain knowledge

#### Step 1: Analyze EDA Results
```yaml
elicit: true
format: checkbox
question: "Based on the EDA report, check all patterns that suggest potential hypotheses:"
options:
  - Strong correlations between variables (>0.7)
  - Group differences in distributions
  - Temporal trends or seasonality
  - Outliers or anomalous patterns
  - Non-linear relationships
  - Categorical associations
```

#### Step 2: Domain Context Integration
```yaml
elicit: true
format: text
question: "Describe the business/domain context for this analysis:"
placeholder: "What business question are we trying to answer? What are the practical implications?"
validation:
  required: true
  min_length: 50
```

#### Step 3: Generate Initial Hypotheses
```yaml
elicit: true
format: structured_list
question: "Generate 3-5 initial hypotheses based on the EDA findings:"
structure:
  - hypothesis_statement: "Clear, testable statement"
  - variables_involved: "Primary variables"
  - expected_direction: "Direction of effect (positive/negative/different)"
  - statistical_test_type: "Suggested statistical approach"
  - business_relevance: "Why this matters for the organization"
```

### Phase 2: Hypothesis Refinement
**Duration**: 10-15 minutes

#### Step 4: Hypothesis Prioritization
```yaml
elicit: true
format: ranking
question: "Rank the hypotheses by priority (drag to reorder):"
criteria:
  - Business impact potential
  - Statistical feasibility
  - Data quality for involved variables
  - Actionability of results
```

#### Step 5: Operational Definitions
```yaml
elicit: true
format: structured_form
question: "For your top 3 hypotheses, provide operational definitions:"
fields:
  hypothesis_id: 
    type: select
    options: [from_previous_step]
  null_hypothesis: 
    type: text
    placeholder: "H0: No relationship exists..."
  alternative_hypothesis: 
    type: text  
    placeholder: "H1: A significant relationship exists..."
  success_criteria:
    type: text
    placeholder: "How will we measure success? (effect size, p-value, business metrics)"
  practical_significance_threshold:
    type: number
    placeholder: "Minimum meaningful effect size"
```

### Phase 3: Statistical Test Design
**Duration**: 20-30 minutes

#### Step 6: Test Selection and Validation
```yaml
elicit: true
format: guided_selection
question: "For each hypothesis, select appropriate statistical tests:"
guidance: |
  The system will recommend tests based on:
  - Variable types (continuous, categorical, ordinal)
  - Sample sizes
  - Distribution assumptions
  - Independence assumptions
options_per_hypothesis:
  - parametric_tests: ["t-test", "ANOVA", "linear regression"]
  - non_parametric_tests: ["Mann-Whitney U", "Kruskal-Wallis", "Spearman correlation"]
  - categorical_tests: ["Chi-square", "Fisher's exact", "McNemar"]
  - effect_size_measures: ["Cohen's d", "eta-squared", "Cramér's V"]
```

#### Step 7: Assumptions Verification Plan
```yaml
elicit: true
format: checklist
question: "For each selected test, identify required assumptions to verify:"
assumptions:
  normality:
    tests: ["Shapiro-Wilk", "Kolmogorov-Smirnov", "Q-Q plots"]
    action_if_violated: "Consider transformation or non-parametric alternative"
  homogeneity_of_variance:
    tests: ["Levene's test", "Bartlett's test"]
    action_if_violated: "Use Welch's correction or robust methods"
  independence:
    verification: "Review data collection method and sampling design"
    action_if_violated: "Use clustered or multilevel analysis"
  linearity:
    tests: ["Scatterplots", "residual plots"]
    action_if_violated: "Transform variables or use non-linear models"
```

#### Step 8: Power Analysis and Sample Size
```yaml
elicit: true
format: calculation_form
question: "Conduct power analysis for your primary hypotheses:"
inputs:
  expected_effect_size:
    type: number
    guidance: "Based on literature review or pilot data"
  alpha_level:
    type: select
    options: [0.05, 0.01, 0.001]
    default: 0.05
  desired_power:
    type: select
    options: [0.80, 0.90, 0.95]
    default: 0.80
outputs:
  required_sample_size: "auto_calculated"
  current_sample_adequacy: "auto_assessed"
  recommendation: "auto_generated"
```

### Phase 4: Multiple Comparisons Strategy
**Duration**: 10-15 minutes

#### Step 9: Multiple Testing Correction
```yaml
elicit: true
format: decision_tree
question: "How many statistical tests will you be conducting?"
branches:
  single_test:
    condition: "== 1"
    action: "No correction needed"
  few_tests:
    condition: "2-5"
    correction_options: ["Bonferroni", "Holm-Bonferroni"]
    recommendation: "Holm-Bonferroni for better power"
  many_tests:
    condition: "> 5"
    correction_options: ["Benjamini-Hochberg", "Benjamini-Yekutieli"]
    recommendation: "Benjamini-Hochberg for FDR control"
```

#### Step 10: Family-wise Error Control
```yaml
elicit: true
format: structured_planning
question: "Define your analysis families for error control:"
families:
  - family_name: "Primary confirmatory analyses"
    hypotheses: [list from previous steps]
    error_control: "Family-wise error rate"
    correction_method: [from step 9]
  - family_name: "Secondary exploratory analyses"  
    hypotheses: [additional analyses]
    error_control: "False discovery rate"
    correction_method: "Benjamini-Hochberg"
```

### Phase 5: Analysis Execution
**Duration**: 30-60 minutes

#### Step 11: Pre-analysis Data Verification
```yaml
elicit: false
automatic: true
tasks:
  - Verify data quality for hypothesis variables
  - Check for missing data patterns
  - Identify and handle outliers according to plan
  - Validate data transformations if required
  - Confirm sample size adequacy
```

#### Step 12: Assumption Testing
```yaml
elicit: false  
automatic: true
tasks:
  - Execute assumption tests identified in Step 7
  - Generate diagnostic plots
  - Document assumption violations
  - Apply corrections or alternative methods as planned
```

#### Step 13: Primary Statistical Testing
```yaml
elicit: false
automatic: true
tasks:
  - Execute selected statistical tests
  - Calculate effect sizes
  - Apply multiple comparison corrections
  - Generate confidence intervals
  - Compute power post-hoc if needed
```

### Phase 6: Results Interpretation
**Duration**: 30-45 minutes

#### Step 14: Statistical Interpretation
```yaml
elicit: true
format: guided_interpretation
question: "For each test result, provide interpretations:"
template:
  hypothesis: [auto-populated]
  test_result: [auto-populated]
  p_value: [auto-populated]
  effect_size: [auto-populated]
  statistical_interpretation:
    type: text
    guidance: "Interpret significance, effect size, and confidence intervals"
  assumption_notes:
    type: text
    guidance: "Note any assumption violations and their impact"
```

#### Step 15: Practical Significance Assessment
```yaml
elicit: true
format: assessment_matrix
question: "Assess practical significance of findings:"
dimensions:
  statistical_significance: [auto-populated]
  effect_size_magnitude: 
    scale: ["negligible", "small", "medium", "large"]
    context: "Based on domain standards"
  confidence_interval_precision:
    assessment: "Narrow/wide relative to practical needs"
  business_impact_potential:
    scale: ["low", "medium", "high"]
    justification: "required"
```

#### Step 16: Limitations and Caveats
```yaml
elicit: true
format: structured_documentation
question: "Document limitations and caveats:"
categories:
  methodological_limitations:
    examples: ["Sample representativeness", "Measurement error", "Confounding variables"]
  statistical_limitations:
    examples: ["Multiple testing", "Assumption violations", "Power limitations"]
  generalizability_concerns:
    examples: ["Population scope", "Temporal validity", "Context specificity"]
  data_quality_issues:
    examples: ["Missing data", "Outliers", "Measurement precision"]
```

### Phase 7: Recommendations and Next Steps
**Duration**: 15-20 minutes

#### Step 17: Actionable Recommendations
```yaml
elicit: true
format: recommendation_framework
question: "Generate actionable recommendations based on findings:"
structure:
  finding_summary: "Brief summary of key result"
  confidence_level: 
    scale: ["low", "medium", "high"]
    justification: "Based on statistical and practical significance"
  recommended_actions:
    immediate: "Actions to take within 30 days"
    short_term: "Actions for next 3-6 months"
    long_term: "Strategic considerations"
  success_metrics: "How to measure implementation success"
  risk_considerations: "Potential downsides or implementation challenges"
```

#### Step 18: Follow-up Research Needs
```yaml
elicit: true
format: research_planning
question: "Identify follow-up research opportunities:"
types:
  replication_studies:
    priority: ["high", "medium", "low"]
    rationale: "Why replication is needed"
  mechanism_exploration:
    questions: "What underlying mechanisms need investigation?"
  boundary_condition_testing:
    conditions: "Under what conditions do results hold?"
  intervention_testing:
    experiments: "What interventions could be tested based on findings?"
```

### Phase 8: Reporting and Documentation
**Duration**: 45-60 minutes

#### Step 19: Executive Summary
```yaml
elicit: true
format: executive_template
question: "Create executive summary for stakeholders:"
template: |
  ## Key Findings
  - [3-5 bullet points of main results]
  
  ## Business Implications
  - [Impact on business objectives]
  
  ## Recommended Actions
  - [Priority-ordered action items]
  
  ## Confidence and Limitations
  - [Brief assessment of result reliability]
  
  ## Next Steps
  - [Immediate follow-up actions]
word_limit: 500
audience: "Senior management and key stakeholders"
```

#### Step 20: Technical Documentation
```yaml
elicit: false
automatic: true
outputs:
  - Statistical analysis report with full methodology
  - Assumption testing results and diagnostic plots
  - Effect size calculations and confidence intervals
  - Multiple comparison correction details
  - Reproducible analysis code and parameters
  - Data quality assessment summary
```

## Quality Assurance Checklist

### Pre-Analysis QA
- [ ] Hypotheses are clearly stated and testable
- [ ] Statistical tests match data types and research questions
- [ ] Sample size is adequate for desired power
- [ ] Multiple comparison strategy is appropriate
- [ ] Analysis plan is documented before seeing results

### Post-Analysis QA
- [ ] All statistical assumptions were tested
- [ ] Effect sizes were calculated and interpreted
- [ ] Multiple comparisons were properly corrected
- [ ] Confidence intervals were reported
- [ ] Limitations were honestly assessed
- [ ] Practical significance was evaluated
- [ ] Results are reproducible with provided code

## Integration Points

### EDA Integration
- Automatically import findings from EDA reports
- Use EDA insights to suggest potential hypotheses
- Validate data quality findings from EDA phase

### Statistical Testing Integration
- Seamless handoff to statistical-tester.js framework
- Automatic test selection based on workflow inputs
- Integration with power analysis calculations

### Pattern Detection Integration
- Cross-reference findings with pattern-detector.js results
- Use anomaly detection to identify potential confounders
- Integrate pattern findings into hypothesis generation

### Reporting Integration
- Auto-generate technical reports
- Create stakeholder-friendly summaries
- Export results to business intelligence platforms

## Best Practices

### Hypothesis Formation
1. **Start with business questions** - Ensure statistical analyses serve business needs
2. **Be specific and testable** - Vague hypotheses lead to inconclusive results  
3. **Consider practical significance** - Statistical significance isn't always meaningful
4. **Document assumptions** - Make your reasoning transparent

### Statistical Testing
1. **Plan before peeking** - Pre-register analysis plans when possible
2. **Test assumptions** - Don't assume your data meets test requirements
3. **Report effect sizes** - Magnitude matters more than just significance
4. **Control error rates** - Use appropriate corrections for multiple testing

### Interpretation
1. **Consider the whole picture** - Statistical + practical + business significance
2. **Be honest about limitations** - Every analysis has constraints
3. **Think about generalizability** - Can results apply beyond this sample?
4. **Focus on actionability** - What can stakeholders do with these findings?

## Common Pitfalls to Avoid

### Statistical Pitfalls
- **P-hacking** - Testing multiple variations until you find significance
- **HARKing** - Hypothesizing after results are known  
- **Assumption violations** - Ignoring test requirements
- **Effect size neglect** - Focusing only on p-values
- **Multiple comparison ignorance** - Not correcting for multiple tests

### Business Pitfalls
- **Analysis for analysis sake** - Testing hypotheses with no business relevance
- **Overinterpretation** - Making claims beyond what data supports
- **Actionability gap** - Findings that can't be implemented
- **Communication failure** - Technical results that stakeholders can't use

## Templates and Examples

### Hypothesis Statement Templates
```
Correlation Hypothesis:
"There is a [positive/negative] correlation between [variable A] and [variable B] 
in [population], with effect size of at least [minimum meaningful correlation]."

Comparison Hypothesis:  
"[Group A] has [higher/lower] [outcome variable] than [Group B] 
in [population], with effect size of at least [minimum meaningful difference]."

Intervention Hypothesis:
"[Intervention] will [increase/decrease] [outcome variable] by at least [amount] 
compared to [control condition] in [population]."
```

### Results Interpretation Template
```
Statistical Result: [Test name] = [statistic], p [</>/=] [value], 95% CI [range]
Effect Size: [Measure] = [value] ([interpretation])
Practical Significance: [Assessment based on domain knowledge]
Business Implication: [What this means for organization]
Recommended Action: [Specific next steps]
Confidence Level: [High/Medium/Low based on study quality]
```

This workflow template provides a comprehensive, guided approach to hypothesis testing that integrates with the BMad framework and ensures rigorous, actionable results.