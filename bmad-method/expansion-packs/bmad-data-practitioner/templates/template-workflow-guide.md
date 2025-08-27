# Publication Template Workflows Guide

## Standard Publication Patterns for BMad Data Practitioner Agent System

This guide defines standard workflows for generating publication-quality documents using Evidence.dev templates and Universal SQL integration.

---

## Template Categories

### 1. Analytical Insights (`insight-document.md`)

**Use Case:** Comprehensive data analysis reports with statistical findings  
**Audience:** Data teams, stakeholders, decision makers  
**Typical Length:** 8-15 pages  
**Data Requirements:** Analysis results, hypothesis tests, correlation data

**Workflow Pattern:**
```yaml
workflow_steps:
  1. data_validation:
      - verify_analysis_completeness
      - check_statistical_significance
      - validate_confidence_thresholds
  2. narrative_generation:
      - extract_key_findings
      - generate_executive_summary
      - create_methodology_section
  3. template_population:
      - map_data_to_sql_queries
      - populate_template_variables
      - generate_visualizations
  4. quality_assurance:
      - validate_statistical_accuracy
      - check_narrative_consistency
      - verify_citation_completeness
```

**Required Data Tables:**
- `analysis_insights` (primary findings)
- `hypothesis_test_results` (statistical tests)
- `key_metrics` (performance indicators)
- `time_series_data` (trends)
- `correlation_matrix` (relationships)

### 2. Survey Research (`pew-research-style.md`)

**Use Case:** Survey-based research publications with demographic analysis  
**Audience:** Public, policymakers, researchers  
**Typical Length:** 12-25 pages  
**Data Requirements:** Survey responses, demographic breakdowns, statistical tests

**Workflow Pattern:**
```yaml
workflow_steps:
  1. survey_validation:
      - verify_response_rates
      - check_weighting_procedures
      - validate_margin_of_error
  2. demographic_analysis:
      - generate_crosstabs
      - calculate_significance_tests
      - create_trend_analysis
  3. narrative_construction:
      - write_methodology_section
      - craft_findings_narrative
      - develop_demographic_insights
  4. publication_formatting:
      - apply_pew_style_guidelines
      - format_tables_and_charts
      - finalize_appendix_materials
```

**Required Data Tables:**
- `survey_responses` (raw survey data)
- `demographic_analysis` (cross-tabulations)
- `statistical_tests` (significance testing)
- `longitudinal_trends` (time series)
- `sampling_design` (methodology data)

### 3. Executive Briefings (`executive-briefing.md`)

**Use Case:** High-level summaries for executive decision making  
**Audience:** C-suite, board members, senior stakeholders  
**Typical Length:** 3-6 pages  
**Data Requirements:** KPIs, risk assessments, ROI projections

**Workflow Pattern:**
```yaml
workflow_steps:
  1. executive_summary:
      - create_bluf_statement
      - identify_critical_issues
      - highlight_decision_points
  2. metrics_dashboard:
      - extract_key_performance_indicators
      - calculate_trend_directions
      - assess_risk_levels
  3. recommendations:
      - prioritize_actions
      - estimate_resource_requirements
      - project_expected_outcomes
  4. decision_support:
      - present_options_analysis
      - define_success_metrics
      - establish_review_schedule
```

**Required Data Tables:**
- `executive_dashboard` (KPIs)
- `risk_assessment` (risk indicators)
- `strategic_initiatives` (planned actions)
- `roi_calculations` (financial projections)

---

## Universal Template Variables

### Common Variables Across All Templates

```yaml
metadata_variables:
  title: "{{analysis_title}}"
  subtitle: "{{analysis_subtitle}}"
  date: "{{generation_date}}"
  author: "{{organization_name}}"
  version: "{{version}}"
  
data_variables:
  data_sources: "{{data_sources}}"
  analysis_period: "{{analysis_period}}"
  sample_size: "{{sample_size}}"
  confidence_threshold: "{{confidence_threshold}}"
  
quality_variables:
  data_quality_score: "{{data_quality_score}}"
  analysis_engine: "{{analysis_engine}}"
  validation_status: "{{validation_status}}"
```

### Template-Specific Variables

#### Insight Document Variables
```yaml
insight_variables:
  primary_finding_title: "{{primary_finding_title}}"
  secondary_finding_title: "{{secondary_finding_title}}"
  correlation_finding_title: "{{correlation_finding_title}}"
  methodology_description: "{{methodology_description}}"
  statistical_interpretation: "{{statistical_interpretation}}"
  strategic_recommendations: "{{strategic_recommendations}}"
```

#### Survey Research Variables
```yaml
survey_variables:
  study_type: "{{study_type}}"
  methodology_summary: "{{methodology_summary}}"
  margin_of_error: "{{margin_of_error}}"
  survey_method: "{{survey_method}}"
  target_population: "{{target_population}}"
  weighting_description: "{{weighting_description}}"
```

#### Executive Briefing Variables
```yaml
executive_variables:
  classification_level: "{{classification_level}}"
  urgency_level: "{{urgency_level}}"
  distribution_list: "{{distribution_list}}"
  executive_summary_bluf: "{{executive_summary_bluf}}"
  critical_issue_1: "{{critical_issue_1}}"
  decision_1_recommendation: "{{decision_1_recommendation}}"
```

---

## SQL Query Patterns

### Standard Query Templates

#### Key Metrics Query
```sql
-- Standard pattern for key performance indicators
SELECT 
  metric_name,
  metric_value,
  unit,
  category,
  description,
  CASE 
    WHEN category = 'performance' AND metric_value > 90 THEN 'excellent'
    WHEN category = 'quality' AND metric_value > 95 THEN 'excellent'
    ELSE 'review_needed'
  END as status
FROM key_metrics
WHERE date_recorded = CURRENT_DATE
  AND metric_value IS NOT NULL
ORDER BY category, metric_name;
```

#### Time Series Analysis Query
```sql
-- Standard pattern for trend analysis
SELECT 
  date_recorded,
  metric_name,
  metric_value,
  LAG(metric_value) OVER (PARTITION BY metric_name ORDER BY date_recorded) as previous_value,
  CASE 
    WHEN metric_value > LAG(metric_value) OVER (PARTITION BY metric_name ORDER BY date_recorded) THEN 'increasing'
    WHEN metric_value < LAG(metric_value) OVER (PARTITION BY metric_name ORDER BY date_recorded) THEN 'decreasing'
    ELSE 'stable'
  END as trend_direction
FROM time_series_data
WHERE date_recorded >= CURRENT_DATE - INTERVAL 30 DAYS
ORDER BY metric_name, date_recorded;
```

#### Statistical Significance Query
```sql
-- Standard pattern for hypothesis testing results
SELECT 
  test_name,
  p_value,
  test_statistic,
  CASE 
    WHEN p_value < 0.01 THEN 'highly_significant'
    WHEN p_value < 0.05 THEN 'significant'
    ELSE 'not_significant'
  END as significance_level,
  interpretation,
  confidence_level
FROM hypothesis_test_results
WHERE p_value <= 0.05
ORDER BY p_value ASC;
```

### Advanced Query Patterns

#### Correlation Analysis
```sql
-- Pattern for correlation matrix analysis
SELECT 
  variable_1,
  variable_2,
  correlation_coefficient,
  CASE 
    WHEN ABS(correlation_coefficient) >= 0.8 THEN 'very_strong'
    WHEN ABS(correlation_coefficient) >= 0.6 THEN 'strong'
    WHEN ABS(correlation_coefficient) >= 0.4 THEN 'moderate'
    WHEN ABS(correlation_coefficient) >= 0.2 THEN 'weak'
    ELSE 'negligible'
  END as correlation_strength,
  CASE 
    WHEN correlation_coefficient > 0 THEN 'positive'
    ELSE 'negative'
  END as correlation_direction
FROM correlation_matrix
WHERE ABS(correlation_coefficient) >= 0.3
ORDER BY ABS(correlation_coefficient) DESC;
```

#### Performance Benchmarking
```sql
-- Pattern for performance comparison
SELECT 
  category,
  operation,
  value,
  unit,
  benchmark,
  CASE 
    WHEN performance_rating = 'excellent' THEN '✅'
    WHEN performance_rating = 'good' THEN '✅'
    WHEN performance_rating = 'fair' THEN '⚠️'
    ELSE '❌'
  END as status_icon,
  performance_rating
FROM performance_benchmarks
ORDER BY category, 
  CASE performance_rating 
    WHEN 'excellent' THEN 1
    WHEN 'good' THEN 2
    WHEN 'fair' THEN 3
    ELSE 4
  END;
```

---

## Evidence.dev Component Patterns

### Standard Component Usage

#### Data Tables
```markdown
<!-- Basic data table -->
<DataTable data={query_result} />

<!-- Data table with formatting -->
<DataTable 
  data={query_result} 
  rows=10
  search=true
  sort=true
/>

<!-- Data table with conditional formatting -->
<DataTable 
  data={performance_data}
  formatColumnTitles=true
>
  <Column id="status" contentType="colorscale" />
  <Column id="performance_rating" contentType="delta" />
</DataTable>
```

#### Charts and Visualizations
```markdown
<!-- Line chart for trends -->
<Chart 
  data={time_series_data} 
  x="date_recorded" 
  y="metric_value" 
  series="metric_name"
  type="line"
/>

<!-- Bar chart for comparisons -->
<Chart 
  data={category_data}
  x="category"
  y="value"
  type="bar"
  title="Performance by Category"
/>

<!-- Scatter plot for correlations -->
<Chart 
  data={correlation_data}
  x="variable_1_value"
  y="variable_2_value"
  type="scatter"
  size="sample_size"
/>
```

#### Key Performance Indicators
```markdown
<!-- Big value display -->
<BigValue 
  data={key_metric} 
  value="metric_value"
  title="Key Performance Indicator"
  comparison="previous_period"
/>

<!-- Gauge chart -->
<Chart 
  data={performance_score}
  type="gauge"
  value="current_score"
  min=0
  max=100
/>
```

---

## Workflow Automation

### Template Selection Logic

```yaml
template_selection_rules:
  insight_document:
    triggers:
      - analysis_type: "statistical_analysis"
      - data_sources: ["analysis_insights", "hypothesis_test_results"]
      - audience: ["analysts", "stakeholders"]
    
  pew_research_style:
    triggers:
      - analysis_type: "survey_research"
      - data_sources: ["survey_responses", "demographic_analysis"]
      - publication_format: "public_research"
    
  executive_briefing:
    triggers:
      - analysis_type: "executive_summary"
      - audience: ["executives", "board_members"]
      - urgency: ["high", "critical"]
```

### Quality Gates

```yaml
quality_checkpoints:
  data_validation:
    - check_data_completeness: ">= 95%"
    - verify_statistical_significance: "p < 0.05"
    - validate_sample_size: ">= minimum_required"
    
  narrative_quality:
    - check_executive_summary_length: "<= 200_words"
    - verify_findings_alignment: "data_matches_narrative"
    - validate_citation_completeness: "all_sources_cited"
    
  template_compliance:
    - verify_sql_query_syntax: "valid_sql"
    - check_variable_population: "no_empty_placeholders"
    - validate_evidence_components: "proper_component_usage"
```

### Publication Pipeline

```yaml
publication_workflow:
  1. template_selection:
      - analyze_data_sources
      - determine_audience_needs
      - select_appropriate_template
      
  2. data_preparation:
      - validate_data_quality
      - execute_sql_queries
      - generate_summary_statistics
      
  3. narrative_generation:
      - create_automated_narratives
      - populate_template_variables
      - format_tables_and_charts
      
  4. quality_assurance:
      - run_automated_checks
      - validate_statistical_accuracy
      - review_narrative_consistency
      
  5. publication_build:
      - generate_evidence_pages
      - build_static_site
      - export_multiple_formats
      
  6. distribution:
      - deploy_to_hosting_platform
      - generate_sharing_links
      - notify_stakeholders
```

---

## Best Practices

### Template Design Principles

1. **Consistency:** Use standard variable naming conventions across all templates
2. **Flexibility:** Design templates to handle various data scenarios gracefully
3. **Accessibility:** Ensure templates generate accessible content (WCAG compliance)
4. **Performance:** Optimize SQL queries for Evidence.dev rendering speed
5. **Maintainability:** Use modular template sections that can be updated independently

### SQL Query Optimization

1. **Indexing:** Ensure frequently queried columns are indexed
2. **Filtering:** Apply WHERE clauses early to reduce dataset size
3. **Aggregation:** Pre-calculate complex aggregations in views
4. **Caching:** Use Evidence.dev caching for expensive queries
5. **Performance:** Test queries with realistic data volumes

### Narrative Quality Standards

1. **Clarity:** Write in clear, accessible language appropriate for the audience
2. **Accuracy:** Ensure all statistical interpretations are mathematically correct
3. **Completeness:** Include all necessary context for understanding findings
4. **Objectivity:** Present findings objectively without bias
5. **Actionability:** Provide clear recommendations based on data insights

---

## Template Customization Framework

### Branding Options

```yaml
branding_variables:
  organization:
    name: "{{organization_name}}"
    logo_url: "{{organization_logo}}"
    color_palette: "{{brand_colors}}"
    
  styling:
    primary_color: "{{primary_color}}"
    secondary_color: "{{secondary_color}}"
    font_family: "{{brand_font}}"
    
  contact_information:
    website: "{{organization_website}}"
    email: "{{contact_email}}"
    phone: "{{contact_phone}}"
```

### Layout Variations

```yaml
layout_options:
  compact:
    description: "Condensed format for executive consumption"
    page_limit: 5
    detail_level: "summary"
    
  standard:
    description: "Balanced detail for general stakeholders"
    page_limit: 15
    detail_level: "moderate"
    
  comprehensive:
    description: "Full detail for technical audiences"
    page_limit: 25
    detail_level: "complete"
```

This workflow guide ensures consistent, high-quality publication generation across all BMad Data Practitioner Agent System outputs.