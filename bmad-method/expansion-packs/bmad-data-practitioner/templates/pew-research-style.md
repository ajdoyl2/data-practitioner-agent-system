---
title: "{{study_title}}"
subtitle: "{{study_subtitle}}"
date: "{{publication_date}}"
author: "{{organization_name}}"
study_type: "{{study_type}}"
template_style: "pew-research"
template_version: "1.0"
methodology: "{{methodology_summary}}"
sample_size: "{{sample_size}}"
margin_of_error: "{{margin_of_error}}"
---

# {{study_title}}

*{{study_subtitle}}*

---

## About This Study

This analysis is based on {{methodology_summary}} conducted {{study_period}}. The findings are based on {{sample_size}} {{sample_description}} with a margin of sampling error of {{margin_of_error}} percentage points.

```sql study_overview
SELECT 
  'Total Sample Size' as metric,
  {{sample_size}} as value,
  'respondents' as unit
UNION ALL
SELECT 
  'Data Collection Period',
  '{{study_period}}',
  'timeframe'
UNION ALL
SELECT 
  'Margin of Error',
  '±{{margin_of_error}}',
  'percentage points'
```

<DataTable data={study_overview} />

---

## Key Findings

### {{key_finding_1_title}}

{{key_finding_1_narrative}}

```sql finding_1_breakdown
SELECT 
  demographic_category,
  response_option,
  percentage,
  sample_count,
  margin_of_error
FROM survey_responses
WHERE question_id = '{{finding_1_question_id}}'
  AND demographic_category = '{{finding_1_demographic}}'
ORDER BY percentage DESC
```

<Chart data={finding_1_breakdown} x="response_option" y="percentage" type="bar" />

### {{key_finding_2_title}}

{{key_finding_2_narrative}}

```sql demographic_comparison
SELECT 
  demographic_group,
  response_category,
  percentage,
  confidence_interval_lower,
  confidence_interval_upper
FROM demographic_analysis
WHERE question_category = '{{finding_2_category}}'
ORDER BY demographic_group, percentage DESC
```

**Demographic Breakdown:**
<DataTable data={demographic_comparison} />

### {{key_finding_3_title}}

{{key_finding_3_narrative}}

```sql trend_analysis
SELECT 
  survey_year,
  response_option,
  percentage,
  year_over_year_change
FROM longitudinal_trends
WHERE question_topic = '{{finding_3_topic}}'
  AND survey_year >= {{trend_start_year}}
ORDER BY survey_year, percentage DESC
```

**Trends Over Time:**
<Chart data={trend_analysis} x="survey_year" y="percentage" series="response_option" type="line" />

---

## Detailed Analysis

### Demographic Deep Dive

The survey reveals notable differences across demographic groups:

```sql demographic_crosstab
SELECT 
  age_group,
  gender,
  education_level,
  income_bracket,
  response_percentage,
  weighted_count
FROM demographic_crosstab
WHERE question_id = '{{primary_question_id}}'
  AND response_option = '{{primary_response}}'
ORDER BY response_percentage DESC
```

<DataTable data={demographic_crosstab} />

**Key Demographic Patterns:**

- **Age:** {{age_pattern_description}}
- **Gender:** {{gender_pattern_description}}  
- **Education:** {{education_pattern_description}}
- **Income:** {{income_pattern_description}}
- **Region:** {{region_pattern_description}}

### Statistical Significance Testing

```sql significance_tests
SELECT 
  comparison_groups,
  chi_square_statistic,
  p_value,
  degrees_of_freedom,
  is_significant,
  effect_size
FROM statistical_tests
WHERE test_type = 'chi_square'
  AND p_value <= 0.05
ORDER BY p_value ASC
```

**Statistically Significant Differences:**
<DataTable data={significance_tests} />

### Correlation Analysis

```sql correlations
SELECT 
  variable_1,
  variable_2,
  correlation_coefficient,
  p_value,
  sample_size,
  interpretation
FROM correlation_analysis
WHERE ABS(correlation_coefficient) >= 0.3
  AND p_value < 0.05
ORDER BY ABS(correlation_coefficient) DESC
```

**Notable Correlations:**
<DataTable data={correlations} />

---

## Methodology

### Survey Design

**Survey Method:** {{survey_method}}  
**Population:** {{target_population}}  
**Sample Frame:** {{sample_frame}}  
**Data Collection Period:** {{collection_period}}  
**Languages:** {{survey_languages}}

### Sampling Methodology

{{sampling_methodology_description}}

```sql sampling_breakdown
SELECT 
  stratum,
  target_proportion,
  achieved_proportion,
  sample_size,
  response_rate
FROM sampling_design
ORDER BY stratum
```

**Sample Composition:**
<DataTable data={sampling_breakdown} />

### Weighting Procedures

{{weighting_description}}

```sql weighting_summary
SELECT 
  demographic_variable,
  unweighted_distribution,
  weighted_distribution,
  population_benchmark,
  weighting_efficiency
FROM weighting_summary
ORDER BY demographic_variable
```

<DataTable data={weighting_summary} />

### Question Wording

**Key Questions Asked:**

1. **{{question_1_topic}}:** "{{question_1_text}}"
2. **{{question_2_topic}}:** "{{question_2_text}}"
3. **{{question_3_topic}}:** "{{question_3_text}}"

### Data Quality Indicators

```sql quality_metrics
SELECT 
  quality_indicator,
  value,
  benchmark,
  assessment
FROM data_quality_assessment
ORDER BY quality_indicator
```

<DataTable data={quality_metrics} />

---

## About the Data

### Response Rates

```sql response_rates
SELECT 
  contact_method,
  attempted_contacts,
  completed_interviews,
  response_rate,
  cooperation_rate
FROM response_rate_analysis
ORDER BY response_rate DESC
```

<DataTable data={response_rates} />

### Margin of Error

The margin of sampling error for the full sample is ±{{overall_margin_of_error}} percentage points. For subgroups, the margin of error is larger:

```sql margin_of_error_by_group
SELECT 
  demographic_group,
  sample_size,
  margin_of_error,
  confidence_level
FROM margin_of_error_calculations
WHERE confidence_level = 95
ORDER BY sample_size DESC
```

<DataTable data={margin_of_error_by_group} />

### Confidence Intervals

All percentages shown in this report include 95% confidence intervals:

```sql confidence_intervals
SELECT 
  finding_description,
  point_estimate,
  lower_bound,
  upper_bound,
  interpretation
FROM confidence_intervals
WHERE confidence_level = 95
ORDER BY point_estimate DESC
```

<DataTable data={confidence_intervals} />

---

## Appendix: Additional Tables

### Complete Response Distributions

```sql full_response_distribution
SELECT 
  question_text,
  response_option,
  percentage,
  unweighted_count,
  weighted_count
FROM full_survey_responses
ORDER BY question_text, percentage DESC
```

<DataTable data={full_response_distribution} />

### Regional Breakdown

```sql regional_analysis
SELECT 
  region,
  metro_status,
  key_response_percentage,
  sample_size,
  margin_of_error
FROM regional_breakdown
ORDER BY region, metro_status
```

<DataTable data={regional_analysis} />

### Longitudinal Comparisons

```sql historical_comparison
SELECT 
  survey_date,
  question_topic,
  response_category,
  percentage,
  significant_change_from_previous
FROM historical_trends
WHERE question_topic = '{{trend_topic}}'
ORDER BY survey_date DESC
```

**Historical Trends:**
<Chart data={historical_comparison} x="survey_date" y="percentage" series="response_category" type="line" />

---

## About {{organization_name}}

{{organization_description}}

**Survey Methodology:** {{methodology_statement}}

**Data Collection:** {{data_collection_statement}}

**Analysis:** {{analysis_statement}}

---

*© {{copyright_year}} {{organization_name}}. All rights reserved.*

**Citation:** {{author_names}} ({{publication_year}}). *{{study_title}}: {{study_subtitle}}*. {{organization_name}}. Retrieved from {{publication_url}}

**For methodology questions:** {{methodology_contact}}  
**For media inquiries:** {{media_contact}}  
**For data requests:** {{data_contact}}

**Publication Details:**
- Study ID: {{study_id}}
- Publication Date: {{publication_date}}
- Template Version: 1.0 (Pew Research Style)
- Analysis Platform: BMad Data Practitioner Agent System