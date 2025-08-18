# Model Description Guidelines for SQLmesh Documentation

## Overview

This document provides comprehensive guidelines for writing clear, consistent, and useful model descriptions in SQLmesh transformations. Well-written descriptions improve discoverability, understanding, and maintenance across data engineering teams.

## Description Writing Philosophy

### Core Principles

1. **Audience-First**: Write for the person discovering your model for the first time
2. **Business-Focused**: Lead with business value, follow with technical details  
3. **Action-Oriented**: Use active voice and concrete language
4. **Context-Rich**: Provide enough context for informed decision-making
5. **Maintenance-Friendly**: Keep descriptions current with model evolution

### Description Hierarchy
```yaml
description_levels:
  catalog_description:
    purpose: "High-level model discovery in data catalogs"
    length: "1-2 sentences (150 characters max)"
    audience: "Business users, data consumers"
    focus: "What the model provides and why it matters"
    
  model_header_description:
    purpose: "Comprehensive model understanding"
    length: "2-4 sentences (300-500 characters)"
    audience: "Data engineers, analysts, stakeholders"
    focus: "Business context, data sources, key transformations"
    
  inline_documentation:
    purpose: "Implementation details and complex logic"
    length: "Variable based on complexity"
    audience: "Implementers, maintainers"
    focus: "How transformations work and why specific approaches were chosen"
```

## Catalog Description Standards

### Format Template
```
[Business Domain] [Data Subject] providing [Key Value Proposition] for [Primary Use Cases]. [Update Frequency] refresh from [Primary Sources].
```

### Catalog Description Examples

#### Excellent Examples
```sql
-- EXCELLENT: Clear business value, context, and usage
MODEL (
    name analytics.customer_360_daily,
    description 'Comprehensive daily customer profiles combining transaction history, demographics, and behavioral metrics for segmentation, churn prediction, and personalized marketing campaigns. Daily refresh from CRM, POS, and web analytics.'
);

-- EXCELLENT: Specific domain and clear utility
MODEL (
    name finance.revenue_recognition_monthly,
    description 'Monthly revenue recognition calculations following ASC 606 standards for financial reporting and audit compliance. Automated processing from billing and contract management systems.'
);

-- EXCELLENT: Clear aggregation and business purpose
MODEL (
    name operations.supply_chain_kpis_weekly,
    description 'Weekly supply chain performance metrics including inventory turnover, delivery times, and supplier scorecards for operational decision-making. Sourced from ERP and logistics systems.'
);
```

#### Poor Examples (and how to improve them)
```sql
-- POOR: Too technical, no business context
MODEL (
    name analytics.customer_360_daily,
    description 'Joins customer tables with transaction data using complex window functions and applies segmentation logic.'
);
-- IMPROVED: Lead with business value
description 'Daily customer analytics combining demographics and transaction history for marketing segmentation and retention analysis. Complex aggregations from CRM and transaction systems.'

-- POOR: Vague and uninformative
MODEL (
    name finance.monthly_report,
    description 'Monthly financial data for reporting purposes.'
);
-- IMPROVED: Specific purpose and compliance context
description 'Monthly financial statements including P&L, balance sheet, and cash flow for executive reporting and regulatory compliance. GAAP-compliant calculations from general ledger.'

-- POOR: Implementation details without business context
MODEL (
    name operations.inventory_snapshot,
    description 'Incremental model that processes inventory changes using SCD Type 2 patterns with daily partition refresh.'
);
-- IMPROVED: Business value with technical context
description 'Daily inventory levels and movements for demand planning and reorder optimization. Historical tracking supports trend analysis and forecast accuracy measurement.'
```

### Catalog Description Checklist
- [ ] **Business domain** clearly identified (e.g., "Customer analytics", "Financial reporting")
- [ ] **Data subject** explicitly named (e.g., "customer profiles", "product inventory")  
- [ ] **Primary value** concisely stated (e.g., "for segmentation", "supporting compliance")
- [ ] **Key use cases** mentioned (e.g., "marketing campaigns", "financial audits")
- [ ] **Update frequency** specified (e.g., "daily", "monthly", "real-time")
- [ ] **Main data sources** indicated (e.g., "from CRM and POS systems")
- [ ] **Character count** under 150 for optimal catalog display
- [ ] **No technical jargon** that business users wouldn't understand

## Extended Model Description Standards

### Comprehensive Description Template
```sql
/*
MODEL DESCRIPTION: [Model Name]

BUSINESS PURPOSE:
[2-3 sentences explaining the business problem this model solves and its strategic value]

DATA SOURCES & SCOPE:
[1-2 sentences identifying key data sources and the scope/coverage of data included]

KEY TRANSFORMATIONS:
[1-2 sentences highlighting the most important data transformations or business logic applied]

PRIMARY USE CASES:
[Bullet points of main ways this model is consumed]
- Use case 1
- Use case 2  
- Use case 3

REFRESH & AVAILABILITY:
[Schedule information and data freshness expectations]

QUALITY & RELIABILITY:
[Key quality measures and reliability characteristics]
*/
```

### Extended Description Examples

#### Customer Analytics Model
```sql
/*
MODEL DESCRIPTION: Customer 360 Daily Profiles

BUSINESS PURPOSE:
Creates comprehensive daily customer snapshots that combine transactional behavior, demographic data, and engagement metrics to enable data-driven customer relationship management. This model serves as the foundation for customer segmentation, lifetime value analysis, and churn prediction initiatives that directly impact retention and revenue growth.

DATA SOURCES & SCOPE:
Integrates customer data from CRM (Salesforce), transaction history from POS systems, digital engagement from web analytics, and support interactions from Zendesk. Covers all active customers with at least one interaction in the past 24 months, representing approximately 2.5M customer profiles updated daily.

KEY TRANSFORMATIONS:
Applies advanced customer segmentation logic using RFM analysis (Recency, Frequency, Monetary), calculates predictive lifetime value using cohort-based retention curves, and derives behavioral indicators through time-series analysis of engagement patterns across all touchpoints.

PRIMARY USE CASES:
- Marketing campaign targeting and personalization engine
- Customer success risk identification and intervention workflows  
- Executive dashboards for customer health and growth metrics
- Machine learning feature engineering for churn and upsell models
- Business intelligence reporting for customer analytics initiatives

REFRESH & AVAILABILITY:
Updates daily at 6:00 AM UTC following completion of overnight ETL processes. Data reflects customer state as of previous business day with typical 6-hour freshness SLA. Peak query performance optimized for business hours (9 AM - 6 PM EST).

QUALITY & RELIABILITY:
Maintains 99.7% uptime with automated data quality checks ensuring >95% completeness on critical fields. Includes referential integrity validation, business rule compliance monitoring, and automated alerting for anomalies exceeding ±20% of historical patterns.
*/
```

#### Financial Reporting Model
```sql
/*
MODEL DESCRIPTION: Revenue Recognition Monthly

BUSINESS PURPOSE:
Automates monthly revenue recognition calculations in compliance with ASC 606 standards to ensure accurate financial reporting and support audit requirements. This model eliminates manual Excel-based processes, reduces month-end close time by 3 days, and provides auditable trail for revenue accounting decisions.

DATA SOURCES & SCOPE:
Sources data from billing system (NetSuite), contract management (Salesforce CPQ), and customer payment history spanning all revenue streams including subscription, professional services, and one-time fees. Processes approximately $50M in monthly revenue across 15,000+ customer contracts.

KEY TRANSFORMATIONS:
Implements ASC 606 five-step revenue recognition methodology including contract identification, performance obligation allocation, transaction price determination, and progress-based recognition for multi-year agreements. Handles complex scenarios including contract modifications, variable consideration, and multi-element arrangements.

PRIMARY USE CASES:
- Monthly financial close and SEC reporting requirements
- Revenue forecasting and pipeline analysis for finance team
- Sales commission calculations based on recognized revenue
- Audit support documentation and compliance reporting
- Executive financial dashboards and board reporting

REFRESH & AVAILABILITY:
Processes monthly on the 2nd business day following month-end, typically completing by 10:00 AM EST. Includes preliminary estimates available within 24 hours of month-end for early insights, with final reconciled numbers following accounts receivable close.

QUALITY & RELIABILITY:
Achieves 100% accuracy requirement for financial reporting with comprehensive reconciliation controls. Includes automated variance analysis against prior months, contract-level audit trails, and integration validation with general ledger systems ensuring penny-perfect accuracy.
*/
```

### Extended Description Checklist
- [ ] **Business purpose** explains strategic value and problem solved
- [ ] **Data sources** identifies specific systems and scope
- [ ] **Key transformations** highlights important business logic
- [ ] **Primary use cases** lists main consumption patterns
- [ ] **Refresh schedule** provides specific timing and SLA information
- [ ] **Quality measures** describes reliability and accuracy standards
- [ ] **Context richness** sufficient for informed decision-making
- [ ] **Technical accuracy** reflects actual implementation
- [ ] **Stakeholder relevance** addresses various audience needs

## Domain-Specific Description Patterns

### Customer Analytics Domain
```yaml
customer_analytics_pattern:
  business_focus:
    - customer_behavior_insights
    - segmentation_and_targeting
    - lifetime_value_optimization
    - churn_prevention
    
  common_sources:
    - crm_systems
    - transaction_databases
    - web_analytics
    - customer_support_systems
    
  typical_transformations:
    - rfm_analysis
    - cohort_calculations
    - behavioral_scoring
    - predictive_modeling
    
  key_metrics:
    - customer_lifetime_value
    - churn_probability
    - engagement_scores
    - segmentation_classifications
```

#### Customer Analytics Description Template
```
[Customer data type] analytics providing [specific business insights] for [customer management activities]. Combines [data sources] to calculate [key metrics] supporting [business outcomes]. [Refresh frequency] updates enable [time-sensitive decisions].
```

#### Customer Analytics Examples
```sql
-- Customer segmentation model
description 'Customer behavioral segmentation using RFM analysis and purchase patterns for targeted marketing campaigns. Combines transaction history, engagement data, and demographic profiles to identify high-value prospects and at-risk customers.'

-- Customer lifetime value model  
description 'Predictive customer lifetime value calculations for customer acquisition and retention investment decisions. Integrates purchase history, subscription data, and engagement metrics using cohort-based modeling and churn prediction algorithms.'

-- Customer health scoring
description 'Daily customer health scores combining product usage, support interactions, and billing status for customer success team prioritization. Real-time risk identification enables proactive intervention and renewal optimization.'
```

### Financial Reporting Domain
```yaml
financial_reporting_pattern:
  business_focus:
    - regulatory_compliance
    - audit_preparation
    - management_reporting
    - financial_planning
    
  common_sources:
    - general_ledger
    - billing_systems
    - payroll_systems
    - expense_management
    
  typical_transformations:
    - gaap_adjustments
    - consolidation_logic
    - variance_analysis
    - trend_calculations
    
  compliance_considerations:
    - sox_requirements
    - gaap_standards
    - audit_trails
    - approval_workflows
```

#### Financial Reporting Description Template
```
[Financial statement type] following [accounting standards] for [reporting purpose]. Processes [financial data sources] with [compliance requirements] supporting [stakeholder needs]. [Timing requirements] for [regulatory deadlines].
```

#### Financial Reporting Examples
```sql
-- Monthly P&L model
description 'Monthly profit and loss statements following GAAP standards for SEC reporting and management analysis. Automates revenue recognition, expense allocation, and variance analysis from general ledger and billing systems.'

-- Cash flow model
description 'Weekly cash flow projections combining actual receipts, committed payments, and forecasted transactions for treasury management. Enables working capital optimization and credit facility planning with 13-week rolling forecasts.'

-- Budget variance model
description 'Monthly budget-to-actual variance analysis with drill-down capabilities for department-level performance management. Integrates financial actuals with approved budgets providing automated variance explanations and trend analysis.'
```

### Operations and Supply Chain Domain
```yaml
operations_pattern:
  business_focus:
    - operational_efficiency
    - performance_monitoring
    - process_optimization
    - supply_chain_management
    
  common_sources:
    - erp_systems
    - manufacturing_systems
    - logistics_platforms
    - quality_management
    
  typical_transformations:
    - kpi_calculations
    - efficiency_metrics
    - trend_analysis
    - exception_identification
    
  key_measurements:
    - throughput_metrics
    - quality_indicators
    - cost_analysis
    - performance_benchmarks
```

#### Operations Description Template
```
[Operational process] performance metrics tracking [key indicators] for [operational decisions]. Monitors [process areas] using [data sources] to identify [optimization opportunities]. [Frequency] analysis supports [management activities].
```

#### Operations Examples
```sql
-- Manufacturing efficiency model
description 'Daily production line efficiency metrics including throughput, quality rates, and downtime analysis for operational optimization. Integrates MES data with maintenance schedules to identify improvement opportunities and capacity constraints.'

-- Supply chain KPIs model  
description 'Weekly supply chain performance dashboard tracking inventory turns, delivery performance, and supplier scorecards for procurement and logistics decision-making. Combines ERP data with logistics tracking for end-to-end visibility.'

-- Quality metrics model
description 'Real-time quality control metrics aggregating defect rates, inspection results, and customer complaints for continuous improvement initiatives. Enables rapid response to quality issues and supplier performance management.'
```

## Technical Implementation Guidelines

### Description Integration with SQLmesh

#### Model Configuration Integration
```sql
-- STANDARD PATTERN: Short catalog description + detailed header documentation
MODEL (
    name analytics.customer_churn_prediction,
    kind INCREMENTAL,
    owner 'data-science@company.com',
    cron '@daily',
    grain ['customer_id', 'prediction_date'],
    
    -- CATALOG DESCRIPTION: Optimized for discovery and quick understanding
    description '''
    Daily customer churn risk predictions using machine learning for retention 
    campaigns. Combines behavioral data, transaction patterns, and engagement 
    metrics to identify at-risk customers with 85% accuracy.
    ''',
    
    -- TECHNICAL METADATA
    cluster_by ['customer_id'],
    partition_by ['prediction_date'],
    
    -- EXTENDED METADATA
    meta={
        'business_domain': 'customer_analytics',
        'model_type': 'ml_predictions',
        'accuracy_target': 0.85,
        'prediction_window': '30_days',
        'feature_count': 47,
        'model_algorithm': 'gradient_boosting',
        'last_retrained': '2024-01-15'
    }
);

/*
DETAILED MODEL DESCRIPTION: Customer Churn Prediction

BUSINESS PURPOSE:
Identifies customers at high risk of churning within the next 30 days to enable 
proactive retention interventions. This predictive model supports customer success 
teams and marketing campaigns with prioritized outreach lists, contributing to 
15% improvement in retention rates and $2.3M annual revenue protection.

MODEL METHODOLOGY:
Implements gradient boosting ensemble trained on 18 months of historical churn 
patterns using 47 engineered features including transaction velocity, engagement 
decline, support interaction patterns, and product usage trends. Model achieves 
85% precision and 78% recall on validation datasets with monthly retraining cycles.

PREDICTION OUTPUTS:
- churn_probability: 0-1 score indicating likelihood of churn in next 30 days
- risk_tier: HIGH (>0.7), MEDIUM (0.3-0.7), LOW (<0.3) categorical classification  
- confidence_score: Model confidence in prediction based on feature completeness
- primary_risk_factors: Top 3 contributing factors from feature importance analysis

BUSINESS INTEGRATION:
Predictions automatically trigger customer success workflows for high-risk accounts,
populate retention campaign target lists in marketing automation, and feed 
customer health dashboards for proactive account management strategies.
*/
```

### Automated Description Validation

#### Description Quality Metrics
```python
class DescriptionQualityValidator:
    """Validate model description quality against standards."""
    
    def __init__(self):
        self.quality_checks = [
            'character_length_check',
            'business_context_check', 
            'jargon_detection',
            'completeness_assessment',
            'clarity_scoring'
        ]
    
    def validate_catalog_description(self, description: str) -> Dict:
        """Validate catalog description against standards."""
        validation_result = {
            'overall_score': 0.0,
            'checks_passed': 0,
            'total_checks': len(self.quality_checks),
            'issues': [],
            'recommendations': []
        }
        
        # Character length check (target: 100-150 characters)
        char_count = len(description)
        if 100 <= char_count <= 150:
            validation_result['checks_passed'] += 1
        elif char_count < 100:
            validation_result['issues'].append('Description too short - missing context')
            validation_result['recommendations'].append('Add business value and data sources')
        else:
            validation_result['issues'].append('Description too long for catalog display')
            validation_result['recommendations'].append('Simplify and focus on core value')
        
        # Business context check
        business_keywords = ['for', 'supporting', 'enabling', 'providing']
        if any(keyword in description.lower() for keyword in business_keywords):
            validation_result['checks_passed'] += 1
        else:
            validation_result['issues'].append('Missing business context or purpose')
            validation_result['recommendations'].append('Explain business value and use cases')
        
        # Technical jargon detection
        technical_terms = ['join', 'aggregate', 'transform', 'etl', 'partition']
        jargon_count = sum(1 for term in technical_terms if term in description.lower())
        if jargon_count <= 1:  # Allow minimal technical terms
            validation_result['checks_passed'] += 1
        else:
            validation_result['issues'].append('Too much technical jargon for business users')
            validation_result['recommendations'].append('Use business language, avoid implementation details')
        
        # Data source mention
        source_indicators = ['from', 'sourced', 'combining', 'integrating']
        if any(indicator in description.lower() for indicator in source_indicators):
            validation_result['checks_passed'] += 1
        else:
            validation_result['issues'].append('Data sources not mentioned')
            validation_result['recommendations'].append('Include primary data sources for context')
        
        # Update frequency mention
        frequency_keywords = ['daily', 'weekly', 'monthly', 'real-time', 'hourly']
        if any(freq in description.lower() for freq in frequency_keywords):
            validation_result['checks_passed'] += 1
        else:
            validation_result['issues'].append('Update frequency not specified')
            validation_result['recommendations'].append('Include refresh schedule information')
        
        validation_result['overall_score'] = validation_result['checks_passed'] / validation_result['total_checks']
        
        return validation_result
```

## Best Practices and Anti-Patterns

### Description Best Practices

#### Do's ✅
- **Lead with business value**: Start with what the model provides, not how it works
- **Use active voice**: "Provides customer insights" vs "Customer insights are provided"
- **Include concrete metrics**: "85% accuracy" vs "high accuracy"
- **Specify refresh frequency**: "Daily updates" vs "regular updates"
- **Mention primary sources**: "from CRM and POS systems" vs "from various systems"
- **Define abbreviations**: "Customer Lifetime Value (CLV)" vs "CLV"
- **Use parallel structure**: Consistent format across similar models
- **Update with changes**: Keep descriptions current with model evolution

#### Don'ts ❌
- **Avoid implementation details**: Don't describe joins, window functions, or SQL specifics
- **Skip obvious statements**: Don't say "This model contains data" or "Uses SQL"
- **Use undefined acronyms**: Avoid TLA (Three Letter Acronyms) without definition
- **Be vague about purpose**: "For analysis" vs "For customer segmentation analysis"
- **Ignore your audience**: Consider who will read this in 6 months
- **Copy-paste descriptions**: Each model should have unique, specific description
- **Use outdated information**: Remove references to deprecated systems or processes

### Common Anti-Patterns

#### Anti-Pattern: Technical Implementation Focus
```sql
-- BAD: Technical details without business context
description 'Uses LEFT JOIN between customer and transaction tables with ROW_NUMBER() window function to deduplicate records and calculate monthly aggregations using SUM() and COUNT() functions.'

-- GOOD: Business purpose with minimal technical context
description 'Monthly customer spending summaries for sales performance analysis and territory planning. Aggregates transaction history to identify spending trends and high-value customer segments.'
```

#### Anti-Pattern: Vague Business Speak
```sql
-- BAD: Generic business language without specifics
description 'Customer data model for business intelligence and analytics purposes providing insights for strategic decision making and operational excellence.'

-- GOOD: Specific business outcomes and use cases
description 'Customer demographic and transaction profiles for marketing segmentation and retention campaigns. Enables personalized email targeting and churn risk identification with daily refresh from CRM systems.'
```

#### Anti-Pattern: Missing Context
```sql
-- BAD: No indication of scope, sources, or frequency
description 'Revenue calculations for financial reporting.'

-- GOOD: Complete context for informed usage
description 'Monthly revenue recognition following ASC 606 standards for SEC reporting and audit compliance. Processes subscription and professional services revenue from billing and contract management systems.'
```

## Quality Assurance and Maintenance

### Description Review Process

#### Review Checklist
```yaml
review_checklist:
  content_quality:
    - [ ] Business purpose clearly stated
    - [ ] Primary data sources identified  
    - [ ] Update frequency specified
    - [ ] Key use cases mentioned
    - [ ] Technical jargon minimized
    - [ ] Appropriate length for context
    
  technical_accuracy:
    - [ ] Description matches actual implementation
    - [ ] Data sources correctly identified
    - [ ] Refresh schedule accurate
    - [ ] Business logic properly described
    - [ ] Dependencies correctly stated
    
  stakeholder_value:
    - [ ] Useful for business users discovering model
    - [ ] Sufficient context for data consumers
    - [ ] Clear value proposition stated
    - [ ] Appropriate for governance review
    - [ ] Supports impact analysis needs
```

#### Automated Maintenance
```python
class DescriptionMaintenanceManager:
    """Automate description quality maintenance."""
    
    def schedule_description_reviews(self):
        """Schedule regular description quality reviews."""
        return {
            'monthly_tasks': [
                'validate_description_accuracy',
                'check_for_outdated_references',
                'review_new_model_descriptions'
            ],
            'quarterly_tasks': [
                'comprehensive_description_audit',
                'stakeholder_feedback_collection',
                'description_standard_updates'
            ],
            'ad_hoc_triggers': [
                'model_schema_changes',
                'business_logic_updates',
                'data_source_modifications'
            ]
        }
    
    def identify_description_improvement_opportunities(self) -> List[Dict]:
        """Identify models needing description improvements."""
        opportunities = []
        
        for model in self.get_all_models():
            quality_score = self.assess_description_quality(model.description)
            
            if quality_score < 0.7:  # Below acceptable threshold
                opportunities.append({
                    'model_name': model.name,
                    'current_score': quality_score,
                    'primary_issues': self.identify_main_issues(model.description),
                    'recommended_actions': self.generate_improvement_recommendations(model),
                    'priority': self.calculate_improvement_priority(model)
                })
        
        return sorted(opportunities, key=lambda x: x['priority'], reverse=True)
```

### Continuous Improvement

#### Feedback Integration
```yaml
improvement_framework:
  feedback_sources:
    - user_analytics_data
    - stakeholder_surveys  
    - documentation_usage_metrics
    - model_discovery_patterns
    
  improvement_metrics:
    - description_discovery_success_rate
    - time_to_understand_new_models
    - stakeholder_satisfaction_scores
    - documentation_maintenance_burden
    
  evolution_triggers:
    - new_business_domains
    - technology_stack_changes
    - organizational_structure_updates
    - regulatory_requirement_changes
```

These comprehensive model description guidelines ensure that SQLmesh models are discoverable, understandable, and valuable to all stakeholders across the data platform ecosystem.