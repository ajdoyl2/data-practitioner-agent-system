# Statistical Explanation Templates

## Purpose
Standardized templates for explaining statistical results and creating visualization descriptions for Evidence.dev publications.

## Statistical Test Explanation Templates

### T-Test Results
```markdown
**Template: Independent Samples T-Test**
"Comparison of [Variable] between [Group 1] and [Group 2] reveals [significant/no significant] difference. 

- Group 1 Mean: [value] (SD = [std dev], n = [sample size])
- Group 2 Mean: [value] (SD = [std dev], n = [sample size])
- Difference: [mean difference] ([CI lower] to [CI upper], 95% CI)
- Statistical Test: t([df]) = [t-value], p = [p-value]

**Interpretation:** [Group with higher mean] shows [magnitude description] higher values than [other group]. [Effect size interpretation: small/medium/large effect]. [Business/practical significance statement]."

**Example:**
"Comparison of customer satisfaction between premium and basic subscribers reveals a significant difference.

- Premium Mean: 8.4 (SD = 1.2, n = 245)  
- Basic Mean: 7.1 (SD = 1.5, n = 198)
- Difference: 1.3 (0.8 to 1.8, 95% CI)
- Statistical Test: t(441) = 5.23, p < 0.001

**Interpretation:** Premium subscribers show substantially higher satisfaction than basic subscribers. This represents a large effect size (Cohen's d = 0.94), indicating meaningful practical difference beyond statistical significance."
```

```markdown
**Template: Paired Samples T-Test**
"Before-and-after analysis of [Variable] shows [significant/no significant] change over [time period].

- Before Mean: [value] (SD = [std dev])
- After Mean: [value] (SD = [std dev])  
- Mean Change: [difference] ([CI lower] to [CI upper], 95% CI)
- Statistical Test: t([df]) = [t-value], p = [p-value]
- Sample Size: n = [number] pairs

**Interpretation:** [Direction] change of [magnitude description]. [Effect size interpretation]. [Practical implications for business/context]."
```

### ANOVA Results
```markdown
**Template: One-Way ANOVA**
"Analysis of [Variable] across [number] groups ([Group names]) reveals [significant/no significant] differences.

- Overall F-test: F([df1], [df2]) = [F-value], p = [p-value]
- Effect Size: η² = [eta-squared] ([effect size interpretation])

**Group Means:**
- [Group 1]: Mean = [value] (SD = [std dev], n = [sample size])
- [Group 2]: Mean = [value] (SD = [std dev], n = [sample size])
- [Group 3]: Mean = [value] (SD = [std dev], n = [sample size])

**Post-hoc Comparisons:** [If significant]
[Pairwise comparison results with Bonferroni correction]

**Interpretation:** [Groups with significant differences] show [practical interpretation]. [Business implications and recommendations]."
```

### Regression Analysis
```markdown
**Template: Linear Regression**
"Regression analysis examining the relationship between [Predictor Variable(s)] and [Outcome Variable].

**Model Summary:**
- R² = [R-squared] ([percentage]% of variance explained)
- Adjusted R² = [adjusted R-squared] 
- F([df1], [df2]) = [F-value], p = [p-value]
- Sample Size: n = [number]

**Coefficients:**
- Intercept: β₀ = [value] (SE = [standard error], p = [p-value])
- [Predictor 1]: β₁ = [coefficient] (SE = [SE], p = [p-value])
  - Interpretation: [One unit increase] in [predictor] associated with [coefficient] [unit] change in [outcome]
- [Predictor 2]: β₂ = [coefficient] (SE = [SE], p = [p-value])

**Model Assumptions:**
[Linearity/Normality/Homoscedasticity/Independence validation results]

**Interpretation:** [Key predictors] significantly predict [outcome variable]. [Practical significance and business applications]. [Model limitations and appropriate use cases]."
```

### Chi-Square Tests
```markdown
**Template: Chi-Square Test of Independence**
"Analysis of association between [Variable 1] and [Variable 2].

**Contingency Table:**
[Table showing observed frequencies]

**Statistical Results:**
- χ²([df]) = [chi-square value], p = [p-value]
- Cramér's V = [effect size] ([effect size interpretation])
- Sample Size: n = [total sample]

**Expected vs. Observed:**
[Notable cells with standardized residuals > |2|]

**Interpretation:** [Significant/No significant] association between [variables]. [Description of the nature of association]. [Practical implications for business decisions]."
```

### Correlation Analysis
```markdown
**Template: Pearson Correlation**
"Correlation analysis between [Variable 1] and [Variable 2].

- Correlation Coefficient: r = [correlation value]
- 95% Confidence Interval: [CI lower] to [CI upper]
- Statistical Test: t([df]) = [t-value], p = [p-value]  
- Sample Size: n = [number] pairs

**Effect Size Interpretation:**
[Small (|r| ≈ 0.10) / Medium (|r| ≈ 0.30) / Large (|r| ≈ 0.50)]

**Interpretation:** [Positive/Negative] [strength description] correlation between [variables]. [Percentage of shared variance]. **Important:** This analysis shows association, not causation. [Practical implications and next steps for investigation]."
```

## Visualization Description Templates

### Line Charts / Trend Analysis
```markdown
**Template: Time Series Trend**
"Figure [X] displays [variable name] over [time period]. The trend shows [overall pattern description]:

- **Initial Period** ([start date] to [milestone date]): [trend description] with [rate/slope]
- **Middle Period** ([date] to [date]): [trend change] characterized by [pattern]
- **Recent Period** ([date] to [end date]): [current trend] at [rate/slope]

**Notable Features:**
- Peak: [highest point] reached in [time period] at [value]
- Trough: [lowest point] occurred in [time period] at [value]  
- Volatility: [stability description] with [measure if available]

**Statistical Trend:** [Trend test results if applicable]
**Business Interpretation:** [What this trend means for the organization/context]"

**Example:**
"Figure 1 displays monthly customer acquisition over 24 months. The trend shows steady growth with seasonal variations:

- **Initial Period** (Jan 2022 to Jun 2022): Steady growth averaging 2.3% monthly increase
- **Middle Period** (Jul 2022 to Dec 2022): Accelerated growth during holiday season, 4.1% average monthly increase  
- **Recent Period** (Jan 2023 to Dec 2023): Sustained growth with reduced volatility, 2.8% average monthly increase

**Notable Features:**
- Peak: Highest acquisition (1,247 customers) reached in November 2022
- Trough: Lowest point (823 customers) in February 2022
- Volatility: Decreased substantially after Q1 2023

**Statistical Trend:** Mann-Kendall test confirms significant upward trend (p < 0.001)
**Business Interpretation:** Customer acquisition shows sustainable growth pattern with successful retention of holiday season gains, indicating effective marketing strategy implementation."
```

### Bar Charts / Category Comparisons
```markdown
**Template: Categorical Comparison**
"Figure [X] compares [variable] across [categories]. Key findings include:

**Highest Performers:**
1. [Category 1]: [value] ([percentage of total])
2. [Category 2]: [value] ([percentage of total])

**Lowest Performers:**
1. [Category]: [value] ([percentage of total])
2. [Category]: [value] ([percentage of total])

**Distribution Characteristics:**
- Range: [highest value] to [lowest value] ([difference])
- [Statistical measure]: [median/mean] = [value]
- Notable outliers: [any extreme values]

**Statistical Analysis:** [ANOVA/Chi-square results if applicable]
**Business Implications:** [What these differences mean for decision-making]"
```

### Scatter Plots / Correlation Visualizations
```markdown
**Template: Correlation Visualization**
"Figure [X] illustrates the relationship between [X-axis variable] and [Y-axis variable]. The scatter plot reveals:

**Overall Pattern:** [Positive/Negative/No clear] relationship with [strength description]
**Correlation Statistics:** r = [correlation], p = [p-value] (see statistical analysis)

**Notable Features:**
- **Outliers:** [Description of any extreme points]
- **Clustering:** [Any grouping patterns visible]
- **Non-linear patterns:** [Any curved or complex relationships]

**Practical Interpretation:** [What this relationship means in business/practical terms]. [Implications for prediction or decision-making]. [Cautions about causation vs. correlation]"
```

### Distribution Plots / Histograms
```markdown
**Template: Distribution Analysis**
"Figure [X] shows the distribution of [variable]. Key characteristics include:

**Central Tendency:**
- Mean: [value] 
- Median: [value]
- Mode: [value] (if relevant)

**Spread and Shape:**
- Standard Deviation: [value]
- Range: [minimum] to [maximum]
- Distribution Shape: [normal/skewed/bimodal/etc.]
- Skewness: [direction and degree if applicable]

**Notable Features:**
- Outliers: [extreme values and their implications]
- Gaps: [any missing ranges in the data]
- Multiple peaks: [if multimodal, description of each peak]

**Statistical Tests:** [Normality tests if relevant]
**Business Interpretation:** [What this distribution tells us about the underlying process/phenomenon]"
```

### Dashboard / Interactive Visualizations
```markdown
**Template: Dashboard Component Description**
"The [Component Name] dashboard provides interactive analysis of [data domain]. 

**Key Features:**
- **Primary Metric:** [Main KPI] displayed as [visualization type]
- **Time Controls:** Filter by [time periods] using [control type]
- **Dimensional Analysis:** Break down by [categories] via [filter/dropdown/etc.]
- **Drill-Down:** Click [elements] to explore [detailed view]

**How to Use:**
1. [First interaction step]: [Expected outcome]
2. [Second interaction step]: [Expected outcome]
3. [Advanced features]: [How to access and interpret]

**Interpretation Guide:**
- **Green indicators:** [meaning and threshold]
- **Yellow indicators:** [meaning and threshold]  
- **Red indicators:** [meaning and threshold]

**Data Notes:** [Refresh frequency, data sources, known limitations]"
```

### Heat Maps / Matrix Visualizations
```markdown
**Template: Heat Map Analysis**
"Figure [X] presents a heat map of [variables/relationships]. Color intensity represents [metric] with [scale description].

**Intensity Patterns:**
- **Highest Values** (darkest): [location/cells] indicating [interpretation]
- **Lowest Values** (lightest): [location/cells] indicating [interpretation]
- **Moderate Values**: [pattern description]

**Row/Column Analysis:**
- Rows represent: [dimension description]
- Columns represent: [dimension description]
- Notable row patterns: [any consistent patterns across rows]
- Notable column patterns: [any consistent patterns across columns]

**Key Insights:**
[Most important findings from the heat map]
[Business implications of the patterns observed]"
```

## Statistical Uncertainty Communication

### Confidence Interval Explanations
```markdown
**Template: Confidence Interval Interpretation**
"The 95% confidence interval for [parameter] is [lower bound] to [upper bound]. This means:

**Technical Interpretation:** If we repeated this study 100 times with similar samples, approximately 95 of those studies would produce confidence intervals containing the true [parameter] value.

**Practical Interpretation:** We can be reasonably confident that the true [parameter] value falls within this range. [Business implications of this range].

**Precision Assessment:** [Wide/Narrow] interval indicates [high/low] precision in our estimate. [Implications for decision-making confidence]."
```

### P-Value Communication
```markdown
**Template: P-Value Explanation**  
"The p-value of [value] indicates [interpretation]:

**For p < 0.001:** Very strong evidence against the null hypothesis. The observed result would be extremely unlikely (less than 1 in 1,000 chance) if there were truly no [effect/difference].

**For p < 0.01:** Strong evidence against the null hypothesis. Less than 1% chance of observing this result if no true [effect/difference] exists.

**For p < 0.05:** Moderate evidence against the null hypothesis. Less than 5% chance this result occurred by random chance alone.

**For p ≥ 0.05:** Insufficient evidence to conclude [effect/difference] exists. Cannot rule out random chance as explanation for observed results.

**Important Notes:** P-values indicate strength of evidence, not practical importance. [Additional context about effect size and practical significance]."
```

### Effect Size Interpretations
```markdown
**Cohen's d Effect Size Guidelines:**
- Small effect (d ≈ 0.2): [Practical interpretation for context]
- Medium effect (d ≈ 0.5): [Practical interpretation for context]  
- Large effect (d ≈ 0.8): [Practical interpretation for context]

**R-squared Interpretations:**
- Small effect (R² ≈ 0.01): Explains about 1% of variance
- Medium effect (R² ≈ 0.09): Explains about 9% of variance
- Large effect (R² ≈ 0.25): Explains about 25% of variance

**Business Translation:** [Context-specific explanation of what these effect sizes mean for practical decision-making]
```

## Integration with Evidence.dev Templates

### SQL Query Result Narration
```markdown
**Template: SQL Result Interpretation**
"The analysis query returned [number] records with the following key findings:

```sql
[SQL query used]
```

**Results Summary:**
- Sample size: n = [records]
- Key metric: [primary finding]
- Statistical significance: [test results if applicable]

**Data Quality Notes:**
- Missing values: [percentage] ([handling strategy])
- Date range: [time period covered]
- Filters applied: [any exclusions or conditions]

**Business Interpretation:**
[Translation of query results into business insights]"
```

### Template Variable Population
When populating Evidence.dev template variables, use these structured formats:

```markdown
{{statistical_interpretation}}: 
[Primary statistical finding] with [confidence statement]. [Effect size context]. [Business implications].

{{visualization_descriptions}}:
Figure 1: [Chart description using appropriate template]
Figure 2: [Chart description using appropriate template]

{{methodology_transparency}}:
Analysis conducted using [statistical methods]. [Sample description]. [Key assumptions]. [Limitations and caveats].
```

This comprehensive template library ensures consistent, accurate, and accessible statistical communication across all Evidence.dev publications.