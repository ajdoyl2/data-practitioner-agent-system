# BMad Elicitation Workflow for Publication Generation

## Interactive Publication Generation Following BMad Patterns

This workflow implements BMad's conversational elicitation patterns for generating publication-quality documents with Evidence.dev templates.

---

## Workflow Architecture

### BMad Elicitation Principles Applied to Publications

1. **Progressive Disclosure**: Start with high-level requirements, drill down to specifics
2. **Context Awareness**: Understand the business context and audience needs
3. **Iterative Refinement**: Allow users to refine and adjust publication parameters
4. **Intelligent Defaults**: Provide smart defaults based on data analysis context
5. **Validation Gates**: Confirm understanding before proceeding with generation

---

## Phase 1: Publication Requirements Elicitation

### Initial Context Gathering

**Agent Interaction Pattern:**
```yaml
elicitation_sequence:
  1. context_discovery:
      prompt: "I'll help you create a publication-quality document. Let me understand your context first."
      questions:
        - "What type of analysis have you completed?"
        - "Who is the primary audience for this publication?"
        - "What business decisions will this publication support?"
        - "Do you have any specific formatting or style requirements?"
  
  2. data_source_identification:
      prompt: "Now let's identify your data sources and analysis results."
      validation_queries:
        - "SELECT COUNT(*) FROM analysis_insights WHERE confidence_score >= 0.8"
        - "SELECT DISTINCT analysis_engine FROM analysis_results"
        - "SELECT COUNT(*) FROM hypothesis_test_results WHERE p_value < 0.05"
  
  3. template_recommendation:
      prompt: "Based on your context, I recommend the following publication format:"
      logic_tree:
        survey_data: "pew-research-style.md"
        executive_audience: "executive-briefing.md"
        analytical_insights: "insight-document.md"
        default: "insight-document.md"
```

### Progressive Requirement Gathering

```yaml
requirement_elicitation:
  tier_1_essentials:
    - publication_title
    - target_audience
    - key_message
    - publication_urgency
  
  tier_2_details:
    - specific_data_sources
    - required_statistical_tests
    - visualization_preferences
    - branding_requirements
  
  tier_3_refinements:
    - narrative_tone
    - technical_detail_level
    - distribution_method
    - update_frequency
```

---

## Phase 2: Intelligent Template Selection

### Decision Tree Implementation

```yaml
template_selection_logic:
  audience_analysis:
    executives:
      template: "executive-briefing.md"
      characteristics:
        - time_constrained: true
        - decision_focused: true
        - summary_preferred: true
        - action_oriented: true
    
    researchers:
      template: "pew-research-style.md"
      characteristics:
        - methodology_critical: true
        - peer_review_ready: true
        - citation_complete: true
        - statistical_rigorous: true
    
    analysts:
      template: "insight-document.md"
      characteristics:
        - comprehensive_analysis: true
        - technical_detail: true
        - reproducible_results: true
        - actionable_insights: true

  data_type_analysis:
    survey_responses:
      template: "pew-research-style.md"
      required_tables: ["survey_responses", "demographic_analysis", "statistical_tests"]
    
    business_metrics:
      template: "executive-briefing.md"
      required_tables: ["executive_dashboard", "risk_assessment", "roi_calculations"]
    
    analytical_results:
      template: "insight-document.md"
      required_tables: ["analysis_insights", "hypothesis_test_results", "correlation_matrix"]
```

### Dynamic Template Customization

```yaml
customization_workflow:
  1. template_base_selection:
      - analyze_data_availability
      - match_audience_requirements
      - apply_bmad_recommendation_engine
  
  2. section_relevance_filtering:
      prompt: "Which sections are most important for your audience?"
      options:
        - "Executive Summary (always included)"
        - "Detailed Methodology"
        - "Statistical Analysis"
        - "Business Implications"
        - "Technical Appendix"
  
  3. visualization_preferences:
      prompt: "What types of visualizations would be most effective?"
      options:
        - "Data tables for precise numbers"
        - "Charts for trends and comparisons"  
        - "Dashboards for interactive exploration"
        - "Infographics for key highlights"
```

---

## Phase 3: Data Validation and Mapping

### Pre-Generation Data Validation

```yaml
data_validation_workflow:
  1. completeness_check:
      validation_queries:
        - "SELECT COUNT(*) FROM analysis_insights WHERE key_metric IS NOT NULL"
        - "SELECT COUNT(*) FROM hypothesis_test_results WHERE p_value IS NOT NULL"
        - "SELECT COUNT(*) FROM time_series_data WHERE metric_value IS NOT NULL"
      
      success_criteria:
        - minimum_insights: 3
        - minimum_statistical_tests: 1
        - minimum_time_series_points: 7
  
  2. quality_assessment:
      quality_gates:
        - data_freshness: "< 7 days old"
        - confidence_threshold: "> 0.8"
        - statistical_significance: "p < 0.05"
        - completeness_ratio: "> 95%"
  
  3. narrative_preparedness:
      narrative_requirements:
        - executive_summary_data: "key findings identified"
        - methodology_documentation: "analysis steps recorded"
        - conclusions_support: "statistical evidence available"
```

### Intelligent Data Mapping

```yaml
data_mapping_engine:
  automated_mapping:
    key_findings:
      source_query: "SELECT * FROM analysis_insights WHERE confidence_score >= {{confidence_threshold}} ORDER BY confidence_score DESC LIMIT 5"
      template_variables: 
        - "{{primary_finding_title}}"
        - "{{secondary_finding_title}}"
        - "{{key_insights_narrative}}"
    
    statistical_results:
      source_query: "SELECT * FROM hypothesis_test_results WHERE p_value < 0.05 ORDER BY p_value ASC"
      template_variables:
        - "{{statistical_interpretation}}"
        - "{{hypothesis_results_narrative}}"
        - "{{significance_level_summary}}"
    
    performance_metrics:
      source_query: "SELECT * FROM key_metrics WHERE category = 'performance' AND date_recorded = CURRENT_DATE"
      template_variables:
        - "{{performance_summary}}"
        - "{{kpi_dashboard_narrative}}"
        - "{{benchmarking_results}}"
```

---

## Phase 4: Interactive Narrative Generation

### BMad Conversational Pattern for Content Creation

```yaml
narrative_elicitation:
  1. executive_summary_crafting:
      agent_prompt: "Let's create your executive summary. I'll draft content based on your data, then we'll refine it together."
      
      draft_generation:
        - extract_top_insights
        - summarize_key_findings
        - highlight_business_impact
        - create_initial_draft
      
      user_interaction:
        prompt: "Here's the executive summary I've drafted. What aspects would you like to emphasize or adjust?"
        refinement_options:
          - "Focus more on business impact"
          - "Add more statistical detail"
          - "Simplify for non-technical audience"
          - "Emphasize urgency of findings"
  
  2. finding_narrative_development:
      iterative_refinement:
        initial_draft: "Generate narrative from statistical results"
        user_feedback: "Collect feedback on tone, detail level, focus areas"
        refined_version: "Adjust narrative based on feedback"
        final_approval: "Confirm narrative meets requirements"
  
  3. recommendation_formulation:
      collaborative_process:
        data_insights: "Present what the data shows"
        business_context: "Elicit business context and constraints"
        action_items: "Co-create specific recommendations"
        implementation_plan: "Develop actionable next steps"
```

### Content Quality Assurance

```yaml
quality_assurance_process:
  1. accuracy_validation:
      statistical_checks:
        - "Verify all percentages sum correctly"
        - "Confirm statistical significance claims"
        - "Validate confidence intervals"
        - "Check correlation interpretations"
  
  2. narrative_consistency:
      consistency_checks:
        - "Executive summary aligns with detailed findings"
        - "Conclusions supported by statistical evidence"
        - "Recommendations follow logically from insights"
        - "Technical terms used consistently"
  
  3. audience_appropriateness:
      audience_validation:
        - "Language appropriate for target audience"
        - "Detail level matches audience expertise"
        - "Visual complexity suitable for audience"
        - "Action items match audience authority level"
```

---

## Phase 5: Publication Configuration

### BMad-Style Configuration Elicitation

```yaml
configuration_workflow:
  1. visual_preferences:
      elicitation_prompt: "Let's configure the visual aspects of your publication."
      guided_questions:
        - "Do you prefer data tables or charts for presenting numbers?"
        - "Should we use your organization's brand colors?"
        - "What level of interactivity do you want in the final publication?"
        - "Do you need the publication in multiple formats (PDF, HTML, etc.)?"
  
  2. distribution_planning:
      distribution_questions:
        - "How will you share this publication?"
        - "Do you need access controls or authentication?"
        - "Should the publication auto-update when data changes?"
        - "Do you need to track who accesses the publication?"
  
  3. maintenance_schedule:
      maintenance_elicitation:
        - "How often should this publication be regenerated?"
        - "What data changes would trigger a publication update?"
        - "Who should be notified when the publication is updated?"
        - "Do you need version control for publication changes?"
```

### Publication Build Configuration

```yaml
build_configuration:
  evidence_settings:
    theme_selection:
      based_on: "audience_formality_level"
      options:
        professional: "corporate_theme"
        academic: "research_theme"
        public: "accessible_theme"
    
    component_preferences:
      data_presentation:
        executives: ["BigValue", "simplified_charts"]
        analysts: ["DataTable", "detailed_charts"]
        public: ["infographic_style", "interactive_elements"]
    
    performance_optimization:
      audience_size:
        small_team: "full_interactivity"
        organization_wide: "balanced_performance"
        public_facing: "static_optimization"
```

---

## Phase 6: Review and Refinement Cycle

### Iterative Improvement Pattern

```yaml
review_cycle:
  1. initial_generation:
      - generate_publication_draft
      - populate_all_template_sections
      - create_visualizations
      - build_evidence_site
  
  2. structured_review:
      review_dimensions:
        content_accuracy:
          - "Do the findings accurately reflect the data?"
          - "Are the statistical interpretations correct?"
          - "Do the recommendations follow from the analysis?"
        
        presentation_effectiveness:
          - "Is the narrative clear and compelling?"
          - "Are the visualizations informative?"
          - "Does the structure serve the audience needs?"
        
        completeness_assessment:
          - "Are all key findings addressed?"
          - "Is the methodology sufficiently described?"
          - "Are the business implications clear?"
  
  3. refinement_implementation:
      bmad_feedback_pattern:
        present_options: "Here are three ways we could address your feedback..."
        explain_tradeoffs: "Each option has these implications..."
        confirm_direction: "Which approach best meets your needs?"
        implement_changes: "I'll make those adjustments now..."
```

### Publication Approval Workflow

```yaml
approval_process:
  1. stakeholder_review:
      review_stages:
        technical_review: 
          reviewer: "data_analyst"
          focus: "statistical_accuracy"
        
        business_review:
          reviewer: "domain_expert"
          focus: "business_relevance"
        
        editorial_review:
          reviewer: "communications_team"
          focus: "clarity_and_style"
  
  2. final_validation:
      validation_checklist:
        - "All data sources properly cited"
        - "Statistical claims verified"
        - "Recommendations actionable"
        - "Visualizations accessible"
        - "Publication format optimized"
  
  3. publication_release:
      release_process:
        - generate_final_version
        - create_distribution_links
        - notify_stakeholders
        - schedule_update_reminders
```

---

## Implementation Guidelines

### Agent Behavior Patterns

```yaml
agent_interaction_style:
  discovery_phase:
    approach: "curious_and_thorough"
    questions: "open_ended_then_specific"
    validation: "confirm_understanding"
  
  recommendation_phase:
    approach: "confident_but_flexible"
    presentation: "options_with_reasoning"
    decision_support: "explain_tradeoffs"
  
  refinement_phase:
    approach: "collaborative_and_responsive"
    feedback_handling: "acknowledge_and_clarify"
    implementation: "explain_changes_made"
```

### Success Metrics

```yaml
workflow_success_indicators:
  user_satisfaction:
    - "User completes workflow without abandonment"
    - "Final publication meets stated requirements"
    - "User indicates satisfaction with process"
  
  publication_quality:
    - "Statistical accuracy verified"
    - "Narrative coherence confirmed"
    - "Audience appropriateness validated"
  
  process_efficiency:
    - "Time to publication under target"
    - "Minimal back-and-forth iterations"
    - "Successful automated data mapping"
```

This elicitation workflow ensures that BMad's conversational intelligence is fully applied to the publication generation process, resulting in high-quality, audience-appropriate documents that effectively communicate analytical insights.