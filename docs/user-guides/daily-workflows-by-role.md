# Daily Workflows by Role - Data Practitioner Agents

This guide provides specialized daily workflows for each data practitioner role, with specific command sequences, expected outputs, and practical examples for common tasks.

## 🏗️ How to Use This Guide

Each role section includes:
- **Core Responsibilities** - What this role focuses on
- **Daily Workflow Patterns** - Common task sequences  
- **Command Reference** - Specific agent commands
- **Expected Outputs** - What success looks like
- **Collaboration Patterns** - How this role works with others

**💡 Pro Tip:** Most workflows involve multiple agents working together. Use the cross-references to understand handoff points.

---

## 📊 Data Product Manager
### *Strategic Focus: Business Requirements → Technical Specifications*

### Core Responsibilities
- Translate business requirements into technical specifications
- Manage stakeholder alignment and expectations
- Track project progress and delivery milestones
- Ensure data products meet business objectives

### Daily Workflow Patterns

#### Morning Routine: Project Status & Planning

```bash
# Activate Data Product Manager agent
/BMad:agents:data-product-manager

# Daily commands sequence:
*review-project-status    # Check overnight pipeline runs
*update-stakeholder-brief # Prepare daily stakeholder update
*prioritize-requirements  # Review and prioritize feature requests
*plan-sprint-activities   # Plan daily activities and blockers
```

**Expected Outputs:**
- Project status dashboard with key metrics
- Stakeholder briefing document with progress updates
- Prioritized backlog with business value scores
- Daily plan with clear deliverables and dependencies

#### Weekly Business Requirement Gathering

```bash
# Activate Data Product Manager agent
/BMad:agents:data-product-manager

# Weekly workflow:
*conduct-stakeholder-interview  # Interview business stakeholders
*document-requirements          # Create formal requirement documents
*validate-technical-feasibility # Check feasibility with technical team
*create-acceptance-criteria     # Define clear success criteria
*update-product-roadmap        # Update quarterly roadmap
```

**Real-World Example: New Customer Segmentation Feature**

```bash
# 1. Gather requirements
*conduct-stakeholder-interview
# Input: Marketing team wants customer segmentation
# Output: Detailed requirement document with:
#   - Business objective: Increase targeted campaign effectiveness
#   - Success metrics: 25% improvement in campaign conversion
#   - Data requirements: Customer behavior, purchase history, demographics

# 2. Technical validation
*validate-technical-feasibility
# Coordinates with Data Architect to assess:
#   - Data availability and quality
#   - Technical complexity and timeline
#   - Resource requirements and costs

# 3. Create specifications
*create-acceptance-criteria
# Output: Formal acceptance criteria:
#   - System must segment customers into 5 distinct groups
#   - Segmentation must update daily with new customer data
#   - Marketing team must be able to export segments for campaigns
#   - System must handle 100K+ customers with <5 second response time
```

#### Monthly Strategic Planning

```bash
# Monthly strategic activities
*analyze-product-performance    # Review KPIs and success metrics
*conduct-competitive-analysis   # Assess market position
*update-product-strategy       # Refine product direction
*plan-next-quarter            # Set quarterly objectives
```

### Collaboration Patterns

**→ Data Architect Handoff:**
```bash
# After requirement gathering, hand off to Data Architect
*create-technical-brief
# Includes: business requirements, success criteria, constraints
# Next: Data Architect reviews for technical design

# Example handoff document structure:
# - Business Objective: What problem are we solving?
# - Success Metrics: How do we measure success?
# - Data Requirements: What data do we need?
# - User Stories: How will users interact with the solution?
# - Constraints: Timeline, budget, compliance requirements
```

**← Data Analyst Feedback:**
```bash
# Receive insights from Data Analyst for business impact
*review-analytical-insights
# Includes: usage patterns, performance metrics, user feedback
# Action: Update requirements based on real-world usage data
```

### Command Reference

| Command | Purpose | Typical Usage |
|---------|---------|---------------|
| `*review-project-status` | Daily project health check | Every morning |
| `*conduct-stakeholder-interview` | Gather business requirements | Weekly/as needed |
| `*create-technical-brief` | Document requirements for technical team | After requirement gathering |
| `*validate-technical-feasibility` | Check if requirements are technically achievable | Before committing to stakeholders |
| `*track-delivery-milestones` | Monitor project progress | Weekly |
| `*analyze-product-performance` | Review success metrics and KPIs | Monthly |

---

## 🏗️ Data Architect  
### *Design Focus: Technology Selection → Cost Optimization → Integration Design*

### Core Responsibilities
- Design scalable and cost-effective data architectures
- Select appropriate technologies for business requirements
- Ensure integration patterns and data governance
- Optimize costs and performance across the data stack

### Daily Workflow Patterns

#### Morning Architecture Review

```bash
# Activate Data Architect agent
/BMad:agents:data-architect

# Daily architecture assessment:
*review-system-health        # Check overnight performance metrics
*analyze-cost-efficiency     # Review warehouse and compute costs
*validate-data-quality       # Check data quality metrics
*assess-integration-status   # Verify all system integrations working
```

**Expected Outputs:**
- System health dashboard with performance metrics
- Cost analysis with optimization recommendations
- Data quality report with any issues flagged
- Integration status with any failures highlighted

#### Technology Selection Workflow

```bash
# For new requirements from Data Product Manager
*analyze-requirements        # Review business and technical requirements
*evaluate-technology-options # Compare different technical approaches
*design-architecture         # Create comprehensive technical design
*estimate-costs-and-timeline # Provide cost and timeline estimates
*create-implementation-plan  # Design phased implementation approach
```

**Real-World Example: Selecting Transformation Engine**

```bash
# Requirement: Process 10M+ records daily with complex business logic
*evaluate-technology-options

# Agent analyzes multiple factors:
# 1. Data Volume: 10M+ records (favors SQLmesh for performance)
# 2. Business Logic Complexity: Complex transformations (neutral)
# 3. Cost Sensitivity: High (favors SQLmesh virtual environments)
# 4. Team Experience: Mixed dbt/SQLmesh knowledge (favors gradual migration)
# 5. Timeline: 3 months (favors building on existing patterns)

# Recommendation output:
# Primary: SQLmesh for new high-volume transformations
# Secondary: Keep existing dbt models for stability
# Migration: Gradual transition over 6 months
# Cost Impact: 30-40% reduction in warehouse costs
# Implementation: Start with 2-3 pilot models in SQLmesh
```

#### Cost Optimization Analysis

```bash
# Weekly cost optimization review
*analyze-warehouse-usage     # Review warehouse utilization patterns
*identify-cost-optimizations # Find specific optimization opportunities
*simulate-architecture-changes # Model impact of proposed changes
*create-optimization-roadmap  # Plan optimization implementation
```

**Cost Optimization Example:**

```bash
*analyze-warehouse-usage
# Current analysis shows:
#   - Peak usage: 9AM-11AM, 2PM-4PM (business hours)
#   - Off-peak usage: <20% capacity 6PM-6AM
#   - Weekend usage: <5% capacity
#   - Expensive queries: Large table scans during peak hours

*identify-cost-optimizations
# Recommendations:
#   1. Implement auto-suspend for virtual warehouses (60s idle timeout)
#   2. Schedule large batch jobs during off-peak hours
#   3. Add query result caching for repeated analytical queries
#   4. Partition large tables by date for query performance
#   5. Use smaller warehouses for exploratory analysis

# Expected impact: 35-50% cost reduction
```

#### Architecture Design Process

```bash
# For major new features or systems
*design-system-architecture   # Create high-level architecture
*define-data-models          # Design data schemas and relationships
*specify-integration-patterns # Define how components communicate
*document-scalability-plan   # Plan for growth and scale
*review-security-requirements # Ensure compliance and security
```

### Advanced Architecture Patterns

#### Blue-Green Deployment Design

```bash
*design-deployment-strategy
# Creates deployment architecture with:
#   - Production environment (current live system)
#   - Staging environment (exact production replica)
#   - Blue-green switching mechanism
#   - Automated testing and validation gates
#   - Rollback procedures and monitoring

# Output includes:
#   - Infrastructure as code templates
#   - Deployment automation scripts
#   - Monitoring and alerting configuration
#   - Disaster recovery procedures
```

#### Multi-Environment Architecture

```bash
*design-environment-strategy
# Environments designed:
#   - Development: Individual developer sandboxes
#   - Testing: Shared testing environment with sample data
#   - Staging: Production-like environment for final validation
#   - Production: Live system with full monitoring and backups

# Configuration management:
#   - Environment-specific configurations
#   - Secrets management and security
#   - Data refresh and synchronization
#   - Access control and permissions
```

### Collaboration Patterns

**← Data Product Manager Requirements:**
```bash
# Receive requirements from Data Product Manager
*review-business-requirements
# Analyze for technical implications:
#   - Data volume and velocity requirements
#   - Performance and scalability needs
#   - Integration complexity
#   - Compliance and security requirements

*provide-technical-feasibility-assessment
# Return to Data Product Manager with:
#   - Technical approach recommendations
#   - Timeline and resource estimates
#   - Risk assessment and mitigation plans
#   - Alternative options if requirements not feasible
```

**→ Data Engineer Implementation:**
```bash
# Hand off design to Data Engineer
*create-implementation-specifications
# Detailed technical specifications including:
#   - Architecture diagrams and component descriptions
#   - Data flow and transformation specifications
#   - Configuration templates and environment setup
#   - Testing requirements and acceptance criteria
#   - Performance benchmarks and monitoring requirements
```

### Command Reference

| Command | Purpose | Typical Usage |
|---------|---------|---------------|
| `*analyze-requirements` | Review business requirements for technical design | When new requirements received |
| `*evaluate-technology-options` | Compare different technical approaches | For major architectural decisions |
| `*design-architecture` | Create comprehensive technical design | For new systems or major changes |
| `*analyze-cost-efficiency` | Review and optimize system costs | Daily/weekly |
| `*validate-integration-patterns` | Ensure system components work together | Before implementation |
| `*create-scalability-plan` | Design for future growth and scale | For production systems |

---

## ⚙️ Data Engineer
### *Implementation Focus: Pipeline Development → Performance Optimization → System Reliability*

### Core Responsibilities
- Implement reliable and performant data pipelines
- Manage transformation logic and data quality
- Optimize system performance and troubleshoot issues
- Ensure monitoring and operational excellence

### Daily Workflow Patterns

#### Morning System Check

```bash
# Activate Data Engineer agent
/BMad:agents:data-engineer

# Daily operational routine:
*check-pipeline-health      # Review overnight pipeline runs
*monitor-data-quality       # Check data quality metrics
*analyze-performance-metrics # Review query and pipeline performance
*review-error-logs          # Check for any system errors or warnings
*validate-data-freshness    # Ensure data is up-to-date
```

**Expected Outputs:**
- Pipeline health dashboard with success/failure rates
- Data quality scorecard with any issues highlighted
- Performance metrics with bottlenecks identified
- Error summary with priority and resolution status
- Data freshness report with SLA compliance

#### Pipeline Development Workflow

```bash
# For new data pipeline implementation
*analyze-data-sources       # Understand source data structure and quality
*design-transformation-logic # Create transformation specifications
*implement-data-pipeline     # Build the actual pipeline code
*create-data-quality-tests   # Implement validation and testing
*setup-monitoring-alerts     # Configure monitoring and alerting
*deploy-to-staging          # Deploy to testing environment
*validate-pipeline-output   # Verify outputs meet requirements
*deploy-to-production       # Promote to production environment
```

**Real-World Example: Customer Order Pipeline**

```bash
# New requirement: Process customer orders from e-commerce system
*analyze-data-sources
# Analysis reveals:
#   - Source: PostgreSQL database with 5 tables
#   - Volume: 50K orders/day, peak 10K orders/hour
#   - Data quality issues: 2% orders missing customer_id
#   - Update frequency: Real-time via CDC
#   - Dependencies: Customer data, product catalog

*design-transformation-logic
# Transformation design:
#   1. Extract: CDC from PostgreSQL using PyAirbyte
#   2. Load: Stream to DuckDB for processing
#   3. Transform: SQLmesh models for business logic
#      - Clean missing customer_ids (lookup by email)
#      - Enrich with customer segment and product category
#      - Calculate order metrics and customer lifetime value
#   4. Output: Analytical tables for reporting

*implement-data-pipeline
# Implementation includes:
#   - PyAirbyte connection configuration
#   - SQLmesh transformation models
#   - Data quality validation rules
#   - Error handling and retry logic
#   - Performance optimization (indexing, partitioning)
```

#### Performance Optimization Workflow

```bash
# For optimizing existing pipelines
*profile-pipeline-performance # Identify bottlenecks and slow queries
*analyze-resource-utilization # Check CPU, memory, and storage usage
*optimize-transformation-logic # Improve query performance
*implement-caching-strategies # Add appropriate caching layers
*test-performance-improvements # Validate optimizations work
*monitor-production-impact    # Track improvement in production
```

**Performance Optimization Example:**

```bash
*profile-pipeline-performance
# Profiling reveals:
#   - Customer enrichment query: 45 minutes (too slow)
#   - Memory usage: 8GB peak (approaching limits)
#   - Disk I/O: High during large table joins
#   - Query pattern: Full table scan on 10M record table

*optimize-transformation-logic
# Optimizations implemented:
#   1. Add indexes on frequently joined columns
#   2. Partition large tables by date for better query performance
#   3. Replace full table scans with incremental processing
#   4. Use columnar storage format for analytical queries
#   5. Implement query result caching for repeated operations

# Results:
#   - Customer enrichment: 45 minutes → 8 minutes (82% improvement)
#   - Memory usage: 8GB → 4GB (50% reduction)
#   - Query response time: 30s → 3s (90% improvement)
```

#### Data Quality Management

```bash
# Daily data quality assurance
*run-data-quality-tests     # Execute automated quality checks
*investigate-quality-issues # Analyze any quality problems
*implement-quality-fixes    # Fix data quality issues
*update-quality-monitoring  # Enhance quality checks based on learnings
```

**Data Quality Test Examples:**

```sql
-- Completeness tests
SELECT 
    COUNT(*) as total_records,
    COUNT(customer_id) as records_with_customer_id,
    ROUND(100.0 * COUNT(customer_id) / COUNT(*), 2) as completeness_rate
FROM orders
WHERE order_date = CURRENT_DATE;

-- Validity tests  
SELECT COUNT(*) as invalid_emails
FROM customers 
WHERE email NOT LIKE '%@%.%'
   OR email IS NULL;

-- Consistency tests
SELECT COUNT(*) as orphaned_orders
FROM orders o
LEFT JOIN customers c ON o.customer_id = c.customer_id
WHERE c.customer_id IS NULL;
```

#### Debugging and Troubleshooting

```bash
# For investigating pipeline issues
*diagnose-pipeline-failure   # Analyze failed pipeline runs
*trace-data-lineage         # Track data flow to identify issues
*analyze-error-patterns     # Look for systematic issues
*implement-monitoring-fixes  # Improve monitoring to catch issues earlier
*test-recovery-procedures   # Validate that fixes work correctly
```

### Advanced Engineering Patterns

#### Real-Time Data Processing

```bash
*design-streaming-pipeline
# Streaming architecture design:
#   - Source: Kafka topics with order events
#   - Processing: Real-time aggregation using DuckDB streaming
#   - Output: Updated dashboards within 30 seconds
#   - Monitoring: Event processing latency and throughput

*implement-stream-processing
# Implementation includes:
#   - Kafka consumer configuration
#   - Streaming SQL transformations
#   - Windowing and aggregation logic
#   - Late-arriving data handling
#   - Exactly-once processing guarantees
```

#### Cross-System Integration

```bash
*design-integration-layer
# Integration design for multiple systems:
#   - Source systems: CRM, E-commerce, Marketing automation
#   - Integration patterns: API polling, webhook receivers, file transfers
#   - Data synchronization: Change data capture and incremental updates
#   - Error handling: Retry logic, dead letter queues, manual intervention

*implement-integration-framework
# Framework includes:
#   - Configurable connector framework
#   - Standardized error handling and logging
#   - Monitoring and alerting for each integration
#   - Data validation and schema evolution handling
```

### Collaboration Patterns

**← Data Architect Design:**
```bash
# Receive technical design from Data Architect
*review-implementation-specifications
# Review includes:
#   - Architecture diagrams and component specifications
#   - Performance requirements and constraints
#   - Integration patterns and data flow
#   - Testing and monitoring requirements

*provide-implementation-feedback
# Feedback may include:
#   - Implementation complexity assessment
#   - Alternative technical approaches
#   - Timeline and resource estimates
#   - Risk factors and mitigation strategies
```

**→ Data Analyst/Data QA Engineer:**
```bash
# Hand off implemented pipeline for validation
*prepare-pipeline-documentation
# Documentation includes:
#   - Data schema and transformation logic
#   - Quality checks and validation procedures
#   - Performance characteristics and limitations
#   - Monitoring dashboards and alert procedures

*coordinate-user-acceptance-testing
# Testing coordination:
#   - Provide test data and environments
#   - Support analysts during validation
#   - Address any issues or performance concerns
#   - Document final validation results
```

### Command Reference

| Command | Purpose | Typical Usage |
|---------|---------|---------------|
| `*check-pipeline-health` | Daily operational health check | Every morning |
| `*implement-data-pipeline` | Build new data pipeline | For new requirements |
| `*optimize-pipeline-performance` | Improve existing pipeline performance | Weekly/as needed |
| `*run-data-quality-tests` | Execute quality validation | Daily |
| `*diagnose-pipeline-failure` | Troubleshoot pipeline issues | When issues occur |
| `*setup-monitoring-alerts` | Configure monitoring and alerting | For new pipelines |

---

## 📊 Data Analyst
### *Insight Focus: Data Exploration → Hypothesis Testing → Business Intelligence*

### Core Responsibilities
- Perform exploratory data analysis to understand patterns
- Generate and test hypotheses about business performance
- Create insights and reports for business stakeholders
- Validate data quality and analytical outputs

### Daily Workflow Patterns

#### Morning Data Review

```bash
# Activate Data Analyst agent
/BMad:agents:data-analyst

# Daily analysis routine:
*review-data-freshness      # Check if all data sources updated correctly
*scan-automated-reports     # Review overnight automated analysis
*check-anomaly-alerts       # Investigate any unusual patterns detected
*prioritize-analysis-tasks  # Plan analytical work for the day
*update-key-stakeholders    # Brief stakeholders on important insights
```

**Expected Outputs:**
- Data freshness dashboard with any delays or issues
- Automated report summary with key findings highlighted
- Anomaly investigation with business impact assessment
- Daily analysis plan with priorities and timeline
- Stakeholder brief with actionable insights

#### Exploratory Data Analysis Workflow

```bash
# For new datasets or business questions
*profile-dataset            # Generate comprehensive data profile
*identify-data-patterns     # Discover trends, correlations, outliers
*generate-initial-hypotheses # Create testable business hypotheses
*design-analysis-approach   # Plan detailed analytical methodology
*create-analysis-notebook   # Document analysis process and findings
```

**Real-World Example: Customer Churn Analysis**

```bash
# Business question: Why are premium customers churning?
*profile-dataset
# Dataset profile reveals:
#   - 50K premium customers over 2 years
#   - 8% annual churn rate (higher than expected 5%)
#   - 23 customer attributes available
#   - Data quality: 95% complete (some missing last_login dates)

*identify-data-patterns
# Pattern discovery:
#   - Churn rate varies by signup method: Web 12%, Mobile 4%
#   - Usage frequency drops 60 days before churn
#   - Support ticket volume increases 2x before churn
#   - Customers with <3 feature adoptions churn 3x more

*generate-initial-hypotheses
# Hypotheses to test:
#   1. Customers who signup via web have poor onboarding experience
#   2. Declining usage is an early churn indicator
#   3. Unresolved support issues drive churn
#   4. Low feature adoption correlates with churn
#   5. Seasonal patterns affect churn rates
```

#### Hypothesis Testing and Statistical Analysis

```bash
# For testing specific business hypotheses
*design-statistical-tests   # Choose appropriate statistical methods
*prepare-analysis-datasets  # Clean and prepare data for analysis
*execute-statistical-analysis # Run tests and generate results
*interpret-statistical-results # Explain findings in business terms
*validate-analysis-assumptions # Check if statistical assumptions hold
*document-findings-and-limitations # Create comprehensive analysis report
```

**Statistical Analysis Example:**

```sql
-- Hypothesis: Customers with low feature adoption churn more
WITH customer_features AS (
    SELECT 
        customer_id,
        COUNT(DISTINCT feature_used) as feature_count,
        MAX(last_feature_use_date) as last_feature_use,
        CASE WHEN churned_date IS NOT NULL THEN 1 ELSE 0 END as churned
    FROM customer_feature_usage
    GROUP BY customer_id, churned_date
),
feature_segments AS (
    SELECT 
        customer_id,
        churned,
        CASE 
            WHEN feature_count >= 5 THEN 'High Adoption'
            WHEN feature_count >= 3 THEN 'Medium Adoption'
            ELSE 'Low Adoption'
        END as adoption_segment
    FROM customer_features
)
SELECT 
    adoption_segment,
    COUNT(*) as total_customers,
    SUM(churned) as churned_customers,
    ROUND(100.0 * SUM(churned) / COUNT(*), 2) as churn_rate
FROM feature_segments
GROUP BY adoption_segment
ORDER BY churn_rate DESC;

-- Results:
-- Low Adoption: 15.3% churn rate
-- Medium Adoption: 6.8% churn rate  
-- High Adoption: 2.1% churn rate
-- Statistical significance: p < 0.001 (highly significant)
```

#### Business Intelligence and Reporting

```bash
# For creating business reports and dashboards
*analyze-business-metrics   # Calculate KPIs and performance indicators
*create-trend-analysis     # Identify trends and patterns over time
*generate-executive-summary # Create high-level business insights
*build-interactive-dashboard # Design self-service analytics
*schedule-automated-reporting # Set up recurring analysis
```

**Executive Dashboard Example:**

```bash
*build-interactive-dashboard
# Dashboard includes:
# 1. KPI Overview Section:
#    - Total customers, new acquisitions, churn rate
#    - Revenue metrics: MRR, ARPU, LTV
#    - Product usage: Daily/monthly active users, feature adoption

# 2. Trend Analysis Section:
#    - Customer growth trends over time
#    - Revenue trends by segment and geography
#    - Product usage trends and seasonality

# 3. Segment Analysis Section:
#    - Customer segmentation by value and behavior
#    - Segment-specific churn rates and retention
#    - Segment revenue contribution and growth

# 4. Actionable Insights Section:
#    - Top 3 business opportunities identified
#    - Risk areas requiring immediate attention
#    - Recommended actions with expected impact
```

#### Advanced Analytics and Machine Learning

```bash
# For predictive analytics and ML insights
*identify-prediction-opportunities # Find business use cases for ML
*prepare-ml-datasets               # Clean and feature engineer data
*build-predictive-models          # Create and validate ML models
*interpret-model-results          # Explain model insights to business
*monitor-model-performance        # Track prediction accuracy over time
```

**Predictive Modeling Example:**

```python
# Customer Lifetime Value Prediction Model
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score

# Feature engineering for CLV prediction
def create_clv_features(customer_data):
    features = customer_data.copy()
    
    # Behavioral features
    features['avg_monthly_usage'] = features['total_usage'] / features['tenure_months']
    features['feature_adoption_rate'] = features['features_used'] / features['features_available']
    
    # Engagement features
    features['days_since_last_login'] = (pd.Timestamp.now() - features['last_login_date']).dt.days
    features['support_tickets_per_month'] = features['total_support_tickets'] / features['tenure_months']
    
    # Value features  
    features['current_monthly_spend'] = features['total_revenue'] / features['tenure_months']
    features['spend_trend'] = features['last_3_months_spend'] / features['prev_3_months_spend']
    
    return features

# Model training and evaluation
def train_clv_model(training_data):
    features = ['tenure_months', 'avg_monthly_usage', 'feature_adoption_rate', 
                'days_since_last_login', 'current_monthly_spend', 'spend_trend']
    
    X = training_data[features]
    y = training_data['actual_clv']
    
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    
    predictions = model.predict(X)
    mae = mean_absolute_error(y, predictions)
    r2 = r2_score(y, predictions)
    
    print(f"Model Performance: MAE=${mae:.2f}, R²={r2:.3f}")
    return model

# Business insights from model
def interpret_clv_model(model, feature_names):
    feature_importance = pd.DataFrame({
        'feature': feature_names,
        'importance': model.feature_importances_
    }).sort_values('importance', ascending=False)
    
    print("Top CLV Drivers:")
    for _, row in feature_importance.head().iterrows():
        print(f"- {row['feature']}: {row['importance']:.3f}")
    
    return feature_importance
```

### Collaboration Patterns

**← Data Engineer Pipeline Validation:**
```bash
# Validate data pipeline outputs from Data Engineer
*validate-pipeline-outputs
# Validation includes:
#   - Data schema matches expectations
#   - Data quality meets analytical requirements
#   - Historical data loads correctly
#   - Performance meets analytical needs

*provide-pipeline-feedback
# Feedback includes:
#   - Data quality issues or concerns
#   - Performance bottlenecks in analytical queries
#   - Additional data requirements for analysis
#   - Recommendations for analytical optimizations
```

**→ Data Product Manager Business Insights:**
```bash
# Share analytical insights with Data Product Manager
*create-business-impact-analysis
# Analysis includes:
#   - Key findings and business implications
#   - Quantified business impact (revenue, cost, risk)
#   - Recommendations for product strategy
#   - Supporting data and statistical evidence

*present-stakeholder-findings
# Presentation includes:
#   - Executive summary with key takeaways
#   - Detailed analysis methodology and results
#   - Actionable recommendations with priority
#   - Next steps and follow-up analysis plans
```

### Command Reference

| Command | Purpose | Typical Usage |
|---------|---------|---------------|
| `*profile-dataset` | Generate comprehensive data profile | For new datasets |
| `*identify-data-patterns` | Discover trends and correlations | Daily exploration |
| `*generate-initial-hypotheses` | Create testable business questions | For new analysis |
| `*execute-statistical-analysis` | Run statistical tests and models | Weekly analysis |
| `*build-interactive-dashboard` | Create self-service analytics | Monthly reporting |
| `*validate-pipeline-outputs` | Check data engineer pipeline results | For new pipelines |

---

## 🤖 ML Engineer
### *Model Focus: Feature Engineering → Model Development → Production Deployment*

### Core Responsibilities
- Design and implement machine learning models for business use cases
- Build feature engineering pipelines and model training workflows
- Deploy models to production with proper monitoring and maintenance
- Integrate ML models with existing data infrastructure

### Daily Workflow Patterns

#### Morning Model Monitoring

```bash
# Activate ML Engineer agent  
/BMad:agents:ml-engineer

# Daily ML operations routine:
*check-model-performance     # Review model accuracy and drift metrics
*monitor-feature-pipelines   # Check feature engineering pipeline health
*review-prediction-quality   # Analyze recent prediction accuracy
*validate-data-quality      # Ensure training data quality remains high
*update-model-monitoring    # Review and update monitoring dashboards
```

**Expected Outputs:**
- Model performance dashboard with accuracy trends
- Feature pipeline health with any processing issues
- Prediction quality analysis with accuracy metrics
- Data quality report for training and inference data
- Updated monitoring configuration and alerts

#### Model Development Workflow

```bash
# For new ML use cases or model improvements
*analyze-business-problem    # Understand ML requirements and success criteria
*explore-feature-engineering # Design and test feature transformations
*design-model-architecture   # Select appropriate ML algorithms and approaches
*implement-training-pipeline # Build model training and validation workflows
*evaluate-model-performance  # Test model accuracy and business impact
*prepare-production-deployment # Ready model for production environment
```

**Real-World Example: Customer Churn Prediction Model**

```bash
# Business goal: Predict customer churn 60 days in advance
*analyze-business-problem
# Analysis reveals:
#   - Business impact: $500K annual revenue at risk from churn
#   - Success criteria: Identify 80% of churning customers with <20% false positives
#   - Timeline: 6 weeks to production deployment
#   - Constraints: Must work with existing customer data
#   - Integration: Results feed into marketing automation system

*explore-feature-engineering
# Feature engineering strategy:
#   1. Behavioral features: Login frequency, feature usage patterns
#   2. Engagement features: Support ticket volume, product feedback
#   3. Value features: Spending patterns, subscription changes
#   4. Temporal features: Trends in the past 30/60/90 days
#   5. Comparative features: Customer vs. segment averages

# Feature pipeline implementation:
from datetime import datetime, timedelta
import pandas as pd

def create_churn_features(customer_id, as_of_date):
    """Generate churn prediction features for a customer"""
    
    # Behavioral features (past 60 days)
    behavior_window = pd.Timestamp(as_of_date) - timedelta(days=60)
    
    features = {}
    
    # Login patterns
    features['login_frequency_60d'] = get_login_count(customer_id, behavior_window, as_of_date)
    features['days_since_last_login'] = get_days_since_last_login(customer_id, as_of_date)
    
    # Feature usage
    features['active_features_60d'] = get_active_features_count(customer_id, behavior_window, as_of_date)
    features['feature_adoption_rate'] = features['active_features_60d'] / get_total_features_available()
    
    # Support engagement
    features['support_tickets_60d'] = get_support_ticket_count(customer_id, behavior_window, as_of_date)
    features['avg_ticket_resolution_time'] = get_avg_resolution_time(customer_id, behavior_window, as_of_date)
    
    # Value patterns
    features['revenue_60d'] = get_revenue_sum(customer_id, behavior_window, as_of_date)
    features['revenue_trend'] = calculate_revenue_trend(customer_id, behavior_window, as_of_date)
    
    # Comparative features
    segment = get_customer_segment(customer_id)
    features['login_vs_segment_avg'] = features['login_frequency_60d'] / get_segment_avg_logins(segment)
    features['revenue_vs_segment_avg'] = features['revenue_60d'] / get_segment_avg_revenue(segment)
    
    return features
```

#### Model Training and Validation

```bash
*implement-training-pipeline
# Training pipeline includes:
#   1. Data extraction and feature engineering
#   2. Train/validation/test split with temporal considerations
#   3. Model training with hyperparameter optimization
#   4. Cross-validation and performance evaluation
#   5. Model selection and final validation
```

**Model Training Implementation:**

```python
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import precision_recall_curve, roc_auc_score, classification_report
from sklearn.model_selection import TimeSeriesSplit, GridSearchCV
import joblib

def train_churn_model(training_data, validation_data):
    """Train and validate churn prediction model"""
    
    # Prepare features and target
    feature_columns = [col for col in training_data.columns if col.startswith('feature_')]
    X_train = training_data[feature_columns]
    y_train = training_data['churned_within_60_days']
    
    X_val = validation_data[feature_columns]
    y_val = validation_data['churned_within_60_days']
    
    # Model candidates with hyperparameter grids
    models = {
        'random_forest': {
            'model': RandomForestClassifier(random_state=42),
            'params': {
                'n_estimators': [100, 200, 300],
                'max_depth': [10, 20, None],
                'min_samples_split': [2, 5, 10],
                'min_samples_leaf': [1, 2, 4]
            }
        },
        'gradient_boosting': {
            'model': GradientBoostingClassifier(random_state=42),
            'params': {
                'n_estimators': [100, 200],
                'learning_rate': [0.01, 0.1, 0.2],
                'max_depth': [3, 5, 7]
            }
        },
        'logistic_regression': {
            'model': LogisticRegression(random_state=42, max_iter=1000),
            'params': {
                'C': [0.01, 0.1, 1, 10, 100],
                'penalty': ['l1', 'l2'],
                'solver': ['liblinear', 'saga']
            }
        }
    }
    
    # Train and evaluate each model
    best_model = None
    best_score = 0
    model_results = {}
    
    for model_name, model_config in models.items():
        print(f"Training {model_name}...")
        
        # Hyperparameter optimization
        tscv = TimeSeriesSplit(n_splits=3)
        grid_search = GridSearchCV(
            model_config['model'],
            model_config['params'],
            cv=tscv,
            scoring='roc_auc',
            n_jobs=-1
        )
        
        grid_search.fit(X_train, y_train)
        
        # Validate on holdout set
        y_pred = grid_search.predict(X_val)
        y_pred_proba = grid_search.predict_proba(X_val)[:, 1]
        
        # Calculate metrics
        auc_score = roc_auc_score(y_val, y_pred_proba)
        precision, recall, _ = precision_recall_curve(y_val, y_pred_proba)
        
        model_results[model_name] = {
            'model': grid_search.best_estimator_,
            'best_params': grid_search.best_params_,
            'auc_score': auc_score,
            'classification_report': classification_report(y_val, y_pred)
        }
        
        print(f"{model_name} AUC: {auc_score:.3f}")
        
        if auc_score > best_score:
            best_score = auc_score
            best_model = grid_search.best_estimator_
    
    return best_model, model_results

# Feature importance analysis
def analyze_feature_importance(model, feature_names):
    """Analyze and visualize feature importance"""
    
    if hasattr(model, 'feature_importances_'):
        importance_df = pd.DataFrame({
            'feature': feature_names,
            'importance': model.feature_importances_
        }).sort_values('importance', ascending=False)
        
        print("Top 10 Most Important Features:")
        for _, row in importance_df.head(10).iterrows():
            print(f"- {row['feature']}: {row['importance']:.3f}")
        
        return importance_df
    else:
        print("Model does not support feature importance analysis")
        return None
```

#### Model Deployment and Monitoring

```bash
*prepare-production-deployment
# Deployment preparation includes:
#   1. Model serialization and versioning
#   2. Inference pipeline implementation
#   3. A/B testing framework setup
#   4. Performance monitoring configuration
#   5. Automated retraining pipeline

*deploy-model-to-production
# Production deployment includes:
#   - Model artifact storage and versioning
#   - Real-time inference API endpoints
#   - Batch prediction job scheduling
#   - Model performance monitoring
#   - Automated rollback capabilities
```

**Production Deployment Implementation:**

```python
# Model serving infrastructure
from flask import Flask, request, jsonify
import joblib
import pandas as pd
from datetime import datetime
import logging

app = Flask(__name__)

# Load production model
MODEL_VERSION = "v1.2.0"
model = joblib.load(f'models/churn_model_{MODEL_VERSION}.pkl')
feature_transformer = joblib.load(f'models/feature_transformer_{MODEL_VERSION}.pkl')

# Model monitoring
prediction_log = []

@app.route('/predict/churn', methods=['POST'])
def predict_churn():
    """Real-time churn prediction endpoint"""
    try:
        # Parse request
        data = request.get_json()
        customer_id = data['customer_id']
        as_of_date = data.get('as_of_date', datetime.now().isoformat())
        
        # Generate features
        features = create_churn_features(customer_id, as_of_date)
        feature_df = pd.DataFrame([features])
        
        # Transform features
        feature_df_transformed = feature_transformer.transform(feature_df)
        
        # Make prediction
        prediction_proba = model.predict_proba(feature_df_transformed)[0]
        churn_probability = prediction_proba[1]
        
        # Classification based on threshold
        churn_threshold = 0.3  # Optimized for business requirements
        will_churn = churn_probability > churn_threshold
        
        # Log prediction for monitoring
        prediction_log.append({
            'timestamp': datetime.now().isoformat(),
            'customer_id': customer_id,
            'churn_probability': float(churn_probability),
            'prediction': bool(will_churn),
            'model_version': MODEL_VERSION
        })
        
        # Return result
        return jsonify({
            'customer_id': customer_id,
            'churn_probability': float(churn_probability),
            'will_churn': bool(will_churn),
            'model_version': MODEL_VERSION,
            'prediction_timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        logging.error(f"Prediction error for customer {customer_id}: {str(e)}")
        return jsonify({'error': 'Prediction failed'}), 500

@app.route('/model/health', methods=['GET'])
def model_health():
    """Model health check endpoint"""
    try:
        # Test prediction with dummy data
        test_features = {f'feature_{i}': 0.5 for i in range(10)}
        test_df = pd.DataFrame([test_features])
        test_df_transformed = feature_transformer.transform(test_df)
        test_prediction = model.predict_proba(test_df_transformed)
        
        return jsonify({
            'status': 'healthy',
            'model_version': MODEL_VERSION,
            'test_prediction_successful': True,
            'recent_predictions': len(prediction_log),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
```

#### Model Monitoring and Maintenance

```bash
*monitor-model-performance
# Monitoring includes:
#   1. Prediction accuracy tracking over time
#   2. Data drift detection (feature distributions)
#   3. Model drift detection (prediction distributions)
#   4. Business impact measurement
#   5. Automated retraining triggers

*maintain-model-lifecycle
# Maintenance includes:
#   - Regular model retraining on new data
#   - Feature pipeline updates and improvements
#   - Model performance optimization
#   - Documentation and knowledge transfer
```

**Model Monitoring Dashboard:**

```python
def generate_model_monitoring_report():
    """Generate comprehensive model monitoring report"""
    
    # Load recent predictions and actual outcomes
    predictions_df = load_recent_predictions(days=30)
    actuals_df = load_actual_outcomes(days=30)
    
    # Merge predictions with actuals
    monitoring_df = predictions_df.merge(
        actuals_df, 
        on=['customer_id', 'prediction_date'], 
        how='inner'
    )
    
    # Calculate performance metrics
    from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score
    
    accuracy = accuracy_score(monitoring_df['actual_churn'], monitoring_df['predicted_churn'])
    precision = precision_score(monitoring_df['actual_churn'], monitoring_df['predicted_churn'])
    recall = recall_score(monitoring_df['actual_churn'], monitoring_df['predicted_churn'])
    f1 = f1_score(monitoring_df['actual_churn'], monitoring_df['predicted_churn'])
    
    # Data drift analysis
    current_features = load_current_feature_distributions()
    training_features = load_training_feature_distributions()
    
    drift_scores = calculate_drift_scores(current_features, training_features)
    high_drift_features = [f for f, score in drift_scores.items() if score > 0.1]
    
    # Business impact calculation
    true_positives = len(monitoring_df[(monitoring_df['predicted_churn'] == 1) & 
                                      (monitoring_df['actual_churn'] == 1)])
    prevented_churn_value = true_positives * AVERAGE_CUSTOMER_VALUE
    
    # Generate report
    report = {
        'model_performance': {
            'accuracy': accuracy,
            'precision': precision,
            'recall': recall,
            'f1_score': f1,
            'predictions_analyzed': len(monitoring_df)
        },
        'data_drift': {
            'high_drift_features': high_drift_features,
            'max_drift_score': max(drift_scores.values()) if drift_scores else 0
        },
        'business_impact': {
            'prevented_churn_customers': true_positives,
            'prevented_churn_value': prevented_churn_value,
            'roi_estimate': prevented_churn_value / MODEL_DEVELOPMENT_COST
        },
        'recommendations': []
    }
    
    # Add recommendations based on monitoring results
    if accuracy < 0.8:
        report['recommendations'].append("Model accuracy below threshold - schedule retraining")
    
    if len(high_drift_features) > 3:
        report['recommendations'].append("Significant data drift detected - update feature engineering")
    
    if prevented_churn_value < MONTHLY_TARGET:
        report['recommendations'].append("Business impact below target - review model threshold")
    
    return report
```

### Collaboration Patterns

**← Data Analyst Business Requirements:**
```bash
# Receive ML requirements from Data Analyst
*review-analytical-findings
# Analysis includes:
#   - Business problem definition and success criteria
#   - Available data and feature possibilities
#   - Expected model performance requirements
#   - Integration and deployment constraints

*validate-ml-feasibility
# Feasibility assessment:
#   - Data quality and quantity sufficiency
#   - Problem complexity and algorithm suitability
#   - Timeline and resource requirements
#   - Expected business impact and ROI
```

**→ Data Engineer Integration:**
```bash
# Coordinate with Data Engineer for ML infrastructure
*design-ml-pipeline-integration
# Integration design includes:
#   - Feature engineering pipeline requirements
#   - Model training data preparation
#   - Real-time inference infrastructure
#   - Batch prediction job scheduling
#   - Model monitoring and alerting integration

*coordinate-production-deployment
# Deployment coordination:
#   - Model artifact storage and versioning
#   - API endpoint configuration and scaling
#   - Monitoring dashboard integration
#   - Automated retraining pipeline setup
```

### Command Reference

| Command | Purpose | Typical Usage |
|---------|---------|---------------|
| `*check-model-performance` | Daily model health and accuracy check | Every morning |
| `*explore-feature-engineering` | Design and test feature transformations | For new models |
| `*implement-training-pipeline` | Build model training workflows | For new ML projects |
| `*deploy-model-to-production` | Production model deployment | After model validation |
| `*monitor-model-drift` | Track model and data drift over time | Weekly monitoring |
| `*maintain-model-lifecycle` | Model updates and maintenance | Monthly maintenance |

---

## 🔍 Data QA Engineer
### *Quality Focus: Testing Automation → Validation Framework → Reliability Assurance*

### Core Responsibilities
- Design and implement comprehensive data quality testing frameworks
- Validate data pipeline outputs and analytical results
- Ensure system reliability and error recovery procedures
- Monitor data quality metrics and SLA compliance

### Daily Workflow Patterns

#### Morning Quality Assurance Check

```bash
# Activate Data QA Engineer agent
/BMad:agents:data-qa-engineer

# Daily quality assurance routine:
*run-automated-quality-tests    # Execute comprehensive quality test suite
*review-quality-metrics         # Analyze data quality trends and issues
*validate-pipeline-outputs      # Check overnight pipeline results
*monitor-sla-compliance        # Verify data freshness and availability SLAs
*investigate-quality-alerts    # Address any quality issues or anomalies
```

**Expected Outputs:**
- Quality test results with pass/fail status for all critical tests
- Quality metrics dashboard showing trends over time
- Pipeline validation report with any data issues identified
- SLA compliance report with any breaches highlighted
- Quality alert investigation with root cause analysis

#### Comprehensive Testing Framework

```bash
# For implementing robust data testing
*design-quality-testing-framework # Create comprehensive testing architecture
*implement-automated-tests         # Build automated quality validation
*create-quality-monitoring        # Set up continuous quality monitoring
*establish-quality-standards      # Define quality thresholds and SLAs
*document-testing-procedures      # Create testing documentation and runbooks
```

**Real-World Example: E-commerce Data Quality Framework**

```bash
# Business requirement: Ensure 99.5% data quality for e-commerce analytics
*design-quality-testing-framework

# Framework design includes:
# 1. Data Completeness Tests (are all expected records present?)
# 2. Data Validity Tests (do values meet business rules?)
# 3. Data Consistency Tests (are relationships maintained?)
# 4. Data Accuracy Tests (do values match expected reality?)
# 5. Data Timeliness Tests (is data available when expected?)
# 6. Data Uniqueness Tests (are there unexpected duplicates?)
```

**Automated Quality Testing Implementation:**

```python
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import Dict, List, Tuple
import logging

class DataQualityTestSuite:
    """Comprehensive data quality testing framework"""
    
    def __init__(self, connection_string: str):
        self.connection = create_connection(connection_string)
        self.test_results = []
        self.quality_metrics = {}
        
    def run_completeness_tests(self, table_name: str, required_columns: List[str]) -> Dict:
        """Test for missing values in critical columns"""
        
        test_results = {
            'test_category': 'completeness',
            'table_name': table_name,
            'tests': []
        }
        
        for column in required_columns:
            query = f"""
                SELECT 
                    COUNT(*) as total_rows,
                    COUNT({column}) as non_null_rows,
                    ROUND(100.0 * COUNT({column}) / COUNT(*), 2) as completeness_rate
                FROM {table_name}
                WHERE DATE(created_at) = CURRENT_DATE
            """
            
            result = self.connection.execute(query).fetchone()
            
            completeness_rate = result['completeness_rate']
            passed = completeness_rate >= 99.0  # 99% completeness threshold
            
            test_results['tests'].append({
                'test_name': f'{column}_completeness',
                'completeness_rate': completeness_rate,
                'threshold': 99.0,
                'passed': passed,
                'total_rows': result['total_rows'],
                'missing_rows': result['total_rows'] - result['non_null_rows']
            })
            
            if not passed:
                logging.warning(f"Completeness test failed for {table_name}.{column}: {completeness_rate}%")
        
        return test_results
    
    def run_validity_tests(self, table_name: str, validity_rules: Dict) -> Dict:
        """Test for values that meet business rules"""
        
        test_results = {
            'test_category': 'validity',
            'table_name': table_name,
            'tests': []
        }
        
        for rule_name, rule_config in validity_rules.items():
            query = f"""
                SELECT 
                    COUNT(*) as total_rows,
                    COUNT(CASE WHEN {rule_config['condition']} THEN 1 END) as valid_rows,
                    ROUND(100.0 * COUNT(CASE WHEN {rule_config['condition']} THEN 1 END) / COUNT(*), 2) as validity_rate
                FROM {table_name}
                WHERE DATE(created_at) = CURRENT_DATE
            """
            
            result = self.connection.execute(query).fetchone()
            
            validity_rate = result['validity_rate']
            threshold = rule_config.get('threshold', 95.0)
            passed = validity_rate >= threshold
            
            test_results['tests'].append({
                'test_name': rule_name,
                'validity_rate': validity_rate,
                'threshold': threshold,
                'passed': passed,
                'total_rows': result['total_rows'],
                'invalid_rows': result['total_rows'] - result['valid_rows'],
                'rule_condition': rule_config['condition']
            })
            
            if not passed:
                logging.warning(f"Validity test failed for {rule_name}: {validity_rate}%")
        
        return test_results
    
    def run_consistency_tests(self, consistency_rules: List[Dict]) -> Dict:
        """Test for referential integrity and cross-table consistency"""
        
        test_results = {
            'test_category': 'consistency',
            'tests': []
        }
        
        for rule in consistency_rules:
            query = rule['query']
            result = self.connection.execute(query).fetchone()
            
            consistency_rate = result.get('consistency_rate', 0)
            threshold = rule.get('threshold', 99.0)
            passed = consistency_rate >= threshold
            
            test_results['tests'].append({
                'test_name': rule['name'],
                'consistency_rate': consistency_rate,
                'threshold': threshold,
                'passed': passed,
                'inconsistent_records': result.get('inconsistent_records', 0),
                'description': rule['description']
            })
            
            if not passed:
                logging.warning(f"Consistency test failed for {rule['name']}: {consistency_rate}%")
        
        return test_results
    
    def run_timeliness_tests(self, timeliness_rules: Dict) -> Dict:
        """Test for data freshness and availability"""
        
        test_results = {
            'test_category': 'timeliness',
            'tests': []
        }
        
        current_time = datetime.now()
        
        for table_name, rules in timeliness_rules.items():
            query = f"""
                SELECT 
                    MAX(created_at) as latest_record,
                    MIN(created_at) as earliest_record,
                    COUNT(*) as total_records
                FROM {table_name}
                WHERE DATE(created_at) = CURRENT_DATE
            """
            
            result = self.connection.execute(query).fetchone()
            
            if result['latest_record']:
                latest_record = pd.to_datetime(result['latest_record'])
                minutes_old = (current_time - latest_record).total_seconds() / 60
                
                max_age_minutes = rules.get('max_age_minutes', 60)
                passed = minutes_old <= max_age_minutes
                
                test_results['tests'].append({
                    'test_name': f'{table_name}_freshness',
                    'latest_record': latest_record.isoformat(),
                    'minutes_old': round(minutes_old, 2),
                    'max_age_minutes': max_age_minutes,
                    'passed': passed,
                    'total_records': result['total_records']
                })
                
                if not passed:
                    logging.warning(f"Timeliness test failed for {table_name}: {minutes_old} minutes old")
            else:
                test_results['tests'].append({
                    'test_name': f'{table_name}_freshness',
                    'latest_record': None,
                    'passed': False,
                    'error': 'No records found for today'
                })
        
        return test_results
    
    def generate_quality_report(self) -> Dict:
        """Generate comprehensive data quality report"""
        
        total_tests = sum(len(result['tests']) for result in self.test_results)
        passed_tests = sum(
            sum(1 for test in result['tests'] if test['passed'])
            for result in self.test_results
        )
        
        overall_quality_score = round(100.0 * passed_tests / total_tests, 2) if total_tests > 0 else 0
        
        # Categorize issues by severity
        critical_failures = []
        warnings = []
        
        for result in self.test_results:
            for test in result['tests']:
                if not test['passed']:
                    issue = {
                        'category': result['test_category'],
                        'table': result.get('table_name'),
                        'test_name': test['test_name'],
                        'metric_value': test.get('completeness_rate') or test.get('validity_rate') or test.get('consistency_rate'),
                        'threshold': test.get('threshold'),
                        'impact': 'critical' if test.get('metric_value', 0) < 90 else 'warning'
                    }
                    
                    if issue['impact'] == 'critical':
                        critical_failures.append(issue)
                    else:
                        warnings.append(issue)
        
        report = {
            'quality_summary': {
                'overall_quality_score': overall_quality_score,
                'total_tests_run': total_tests,
                'tests_passed': passed_tests,
                'tests_failed': total_tests - passed_tests,
                'report_timestamp': datetime.now().isoformat()
            },
            'critical_failures': critical_failures,
            'warnings': warnings,
            'detailed_results': self.test_results,
            'recommendations': self._generate_recommendations(critical_failures, warnings)
        }
        
        return report
    
    def _generate_recommendations(self, critical_failures: List, warnings: List) -> List[str]:
        """Generate actionable recommendations based on test results"""
        
        recommendations = []
        
        if critical_failures:
            recommendations.append(f"URGENT: {len(critical_failures)} critical data quality issues require immediate attention")
            
            # Group by category for specific recommendations
            completeness_issues = [f for f in critical_failures if f['category'] == 'completeness']
            if completeness_issues:
                recommendations.append("Investigate data source connectivity and extraction processes for completeness issues")
            
            validity_issues = [f for f in critical_failures if f['category'] == 'validity']
            if validity_issues:
                recommendations.append("Review data transformation logic and business rule implementation for validity issues")
            
            consistency_issues = [f for f in critical_failures if f['category'] == 'consistency']
            if consistency_issues:
                recommendations.append("Check referential integrity and cross-system data synchronization for consistency issues")
        
        if warnings:
            recommendations.append(f"Monitor {len(warnings)} data quality warnings for trending issues")
        
        if not critical_failures and not warnings:
            recommendations.append("All data quality tests passed - maintain current quality standards")
        
        return recommendations

# Quality testing configuration
QUALITY_TEST_CONFIG = {
    'customers': {
        'required_columns': ['customer_id', 'email', 'signup_date', 'subscription_tier'],
        'validity_rules': {
            'valid_email_format': {
                'condition': "email LIKE '%@%.%' AND email IS NOT NULL",
                'threshold': 99.5
            },
            'valid_subscription_tier': {
                'condition': "subscription_tier IN ('basic', 'premium', 'enterprise')",
                'threshold': 100.0
            },
            'reasonable_signup_date': {
                'condition': "signup_date >= '2020-01-01' AND signup_date <= CURRENT_DATE",
                'threshold': 99.9
            }
        },
        'timeliness': {
            'max_age_minutes': 30  # Customer data should be no more than 30 minutes old
        }
    },
    'orders': {
        'required_columns': ['order_id', 'customer_id', 'order_date', 'amount'],
        'validity_rules': {
            'positive_amount': {
                'condition': "amount > 0",
                'threshold': 99.9
            },
            'reasonable_order_date': {
                'condition': "order_date >= '2020-01-01' AND order_date <= CURRENT_DATE",
                'threshold': 99.9
            }
        },
        'timeliness': {
            'max_age_minutes': 15  # Order data should be no more than 15 minutes old
        }
    }
}

CONSISTENCY_RULES = [
    {
        'name': 'orders_have_valid_customers',
        'description': 'All orders must reference existing customers',
        'query': """
            SELECT 
                COUNT(*) as total_orders,
                COUNT(c.customer_id) as orders_with_customers,
                ROUND(100.0 * COUNT(c.customer_id) / COUNT(*), 2) as consistency_rate,
                COUNT(*) - COUNT(c.customer_id) as inconsistent_records
            FROM orders o
            LEFT JOIN customers c ON o.customer_id = c.customer_id
            WHERE DATE(o.order_date) = CURRENT_DATE
        """,
        'threshold': 99.9
    }
]

# Daily quality testing execution
def run_daily_quality_tests():
    """Execute comprehensive daily quality tests"""
    
    quality_suite = DataQualityTestSuite('duckdb://data/analytics.duckdb')
    
    # Run completeness tests
    for table_name, config in QUALITY_TEST_CONFIG.items():
        if 'required_columns' in config:
            result = quality_suite.run_completeness_tests(table_name, config['required_columns'])
            quality_suite.test_results.append(result)
    
    # Run validity tests
    for table_name, config in QUALITY_TEST_CONFIG.items():
        if 'validity_rules' in config:
            result = quality_suite.run_validity_tests(table_name, config['validity_rules'])
            quality_suite.test_results.append(result)
    
    # Run consistency tests
    consistency_result = quality_suite.run_consistency_tests(CONSISTENCY_RULES)
    quality_suite.test_results.append(consistency_result)
    
    # Run timeliness tests
    timeliness_config = {table: config['timeliness'] for table, config in QUALITY_TEST_CONFIG.items() if 'timeliness' in config}
    timeliness_result = quality_suite.run_timeliness_tests(timeliness_config)
    quality_suite.test_results.append(timeliness_result)
    
    # Generate comprehensive report
    quality_report = quality_suite.generate_quality_report()
    
    # Save report and send alerts if needed
    save_quality_report(quality_report)
    
    if quality_report['critical_failures']:
        send_quality_alert(quality_report)
    
    return quality_report
```

#### Advanced Testing Strategies

```bash
*implement-regression-testing   # Ensure changes don't break existing functionality
*create-performance-tests      # Validate system performance under load
*design-chaos-testing         # Test system resilience and recovery
*establish-integration-tests  # Validate cross-system data flows
```

**Performance Testing Implementation:**

```python
def run_performance_tests():
    """Test system performance under various load conditions"""
    
    performance_results = {}
    
    # Test 1: Query response time under normal load
    start_time = time.time()
    result = connection.execute("""
        SELECT 
            customer_segment,
            COUNT(*) as customer_count,
            AVG(total_spent) as avg_spent
        FROM customer_summary
        GROUP BY customer_segment
    """).fetchall()
    normal_load_time = time.time() - start_time
    
    performance_results['normal_load_query_time'] = {
        'duration_seconds': round(normal_load_time, 3),
        'threshold_seconds': 5.0,
        'passed': normal_load_time < 5.0
    }
    
    # Test 2: Large dataset processing time
    start_time = time.time()
    result = connection.execute("""
        SELECT 
            DATE(order_date) as order_date,
            COUNT(*) as order_count,
            SUM(amount) as total_revenue
        FROM orders
        WHERE order_date >= CURRENT_DATE - INTERVAL 90 DAY
        GROUP BY DATE(order_date)
        ORDER BY order_date
    """).fetchall()
    large_dataset_time = time.time() - start_time
    
    performance_results['large_dataset_processing'] = {
        'duration_seconds': round(large_dataset_time, 3),
        'threshold_seconds': 30.0,
        'passed': large_dataset_time < 30.0
    }
    
    # Test 3: Concurrent query performance
    import concurrent.futures
    import threading
    
    def run_concurrent_query():
        thread_connection = create_connection()
        start = time.time()
        result = thread_connection.execute("SELECT COUNT(*) FROM customers").fetchone()
        return time.time() - start
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        concurrent_times = list(executor.map(lambda _: run_concurrent_query(), range(10)))
    
    avg_concurrent_time = sum(concurrent_times) / len(concurrent_times)
    max_concurrent_time = max(concurrent_times)
    
    performance_results['concurrent_query_performance'] = {
        'avg_duration_seconds': round(avg_concurrent_time, 3),
        'max_duration_seconds': round(max_concurrent_time, 3),
        'threshold_seconds': 10.0,
        'passed': max_concurrent_time < 10.0
    }
    
    return performance_results
```

#### SLA Monitoring and Compliance

```bash
*monitor-data-freshness-slas   # Track data availability against SLA commitments
*validate-system-uptime       # Ensure system availability meets requirements
*track-quality-metrics        # Monitor quality trends over time
*generate-compliance-reports  # Create reports for stakeholders and audits
```

**SLA Monitoring Implementation:**

```python
def monitor_sla_compliance():
    """Monitor and report on SLA compliance across all data services"""
    
    sla_results = {
        'data_freshness': {},
        'system_availability': {},
        'quality_standards': {},
        'performance_standards': {}
    }
    
    # Data Freshness SLAs
    freshness_slas = {
        'customer_data': {'max_delay_minutes': 30, 'target_availability': 99.5},
        'order_data': {'max_delay_minutes': 15, 'target_availability': 99.8},
        'product_data': {'max_delay_minutes': 60, 'target_availability': 99.0}
    }
    
    for dataset, sla in freshness_slas.items():
        query = f"""
            SELECT 
                COUNT(*) as total_expected_updates,
                COUNT(CASE WHEN DATEDIFF('minute', expected_time, actual_time) <= {sla['max_delay_minutes']} THEN 1 END) as on_time_updates,
                ROUND(100.0 * COUNT(CASE WHEN DATEDIFF('minute', expected_time, actual_time) <= {sla['max_delay_minutes']} THEN 1 END) / COUNT(*), 2) as sla_compliance_rate
            FROM data_update_log
            WHERE dataset_name = '{dataset}'
            AND update_date >= CURRENT_DATE - INTERVAL 30 DAY
        """
        
        result = connection.execute(query).fetchone()
        
        compliance_rate = result['sla_compliance_rate'] if result['total_expected_updates'] > 0 else 0
        
        sla_results['data_freshness'][dataset] = {
            'sla_target': sla['target_availability'],
            'actual_compliance': compliance_rate,
            'sla_met': compliance_rate >= sla['target_availability'],
            'total_updates': result['total_expected_updates'],
            'on_time_updates': result['on_time_updates'],
            'late_updates': result['total_expected_updates'] - result['on_time_updates']
        }
    
    # Quality Standards SLAs
    quality_slas = {
        'overall_quality_score': {'minimum_score': 95.0},
        'critical_test_failures': {'maximum_failures': 0},
        'data_completeness': {'minimum_rate': 99.0}
    }
    
    recent_quality_reports = load_recent_quality_reports(days=30)
    
    for metric, sla in quality_slas.items():
        if metric == 'overall_quality_score':
            scores = [report['quality_summary']['overall_quality_score'] for report in recent_quality_reports]
            avg_score = sum(scores) / len(scores) if scores else 0
            
            sla_results['quality_standards'][metric] = {
                'sla_target': sla['minimum_score'],
                'actual_value': round(avg_score, 2),
                'sla_met': avg_score >= sla['minimum_score'],
                'trend': calculate_trend(scores)
            }
    
    return sla_results

def generate_sla_compliance_report(sla_results):
    """Generate executive SLA compliance report"""
    
    report = {
        'executive_summary': {},
        'detailed_compliance': sla_results,
        'recommendations': [],
        'action_items': []
    }
    
    # Calculate overall compliance score
    all_metrics = []
    for category, metrics in sla_results.items():
        for metric_name, metric_data in metrics.items():
            if isinstance(metric_data, dict) and 'sla_met' in metric_data:
                all_metrics.append(metric_data['sla_met'])
    
    overall_compliance = round(100.0 * sum(all_metrics) / len(all_metrics), 1) if all_metrics else 0
    
    report['executive_summary'] = {
        'overall_sla_compliance': overall_compliance,
        'total_slas_monitored': len(all_metrics),
        'slas_met': sum(all_metrics),
        'slas_missed': len(all_metrics) - sum(all_metrics),
        'report_period': '30 days',
        'report_generated': datetime.now().isoformat()
    }
    
    # Generate recommendations
    if overall_compliance < 95:
        report['recommendations'].append("Overall SLA compliance below target - immediate action required")
    
    # Identify specific action items
    for category, metrics in sla_results.items():
        for metric_name, metric_data in metrics.items():
            if isinstance(metric_data, dict) and not metric_data.get('sla_met', True):
                report['action_items'].append({
                    'category': category,
                    'metric': metric_name,
                    'current_value': metric_data.get('actual_value') or metric_data.get('actual_compliance'),
                    'target_value': metric_data.get('sla_target'),
                    'priority': 'high' if category == 'data_freshness' else 'medium'
                })
    
    return report
```

### Collaboration Patterns

**← All Roles Quality Validation:**
```bash
# Receive outputs from all other roles for quality validation
*validate-data-pipeline-outputs  # From Data Engineer
*validate-analytical-results     # From Data Analyst
*validate-model-predictions      # From ML Engineer
*validate-architecture-compliance # From Data Architect

# Quality validation includes:
#   - Data schema and format validation
#   - Business rule compliance checking
#   - Performance and reliability testing
#   - Integration and end-to-end validation
```

**→ All Roles Quality Feedback:**
```bash
# Provide quality feedback to all roles
*create-quality-feedback-report
# Feedback includes:
#   - Quality test results and recommendations
#   - Performance bottlenecks and optimization suggestions
#   - Reliability issues and improvement opportunities
#   - Compliance status and remediation requirements

*recommend-quality-improvements
# Recommendations include:
#   - Process improvements for better quality
#   - Tool and technology recommendations
#   - Training and knowledge transfer needs
#   - Monitoring and alerting enhancements
```

### Command Reference

| Command | Purpose | Typical Usage |
|---------|---------|---------------|
| `*run-automated-quality-tests` | Execute comprehensive quality test suite | Daily |
| `*validate-pipeline-outputs` | Check data pipeline results for quality | For each pipeline run |
| `*monitor-sla-compliance` | Track SLA performance and compliance | Daily/weekly |
| `*investigate-quality-alerts` | Analyze and resolve quality issues | When alerts occur |
| `*create-quality-monitoring` | Set up quality monitoring and alerting | For new data sources |
| `*generate-compliance-reports` | Create quality reports for stakeholders | Weekly/monthly |

---

## 🤝 Cross-Role Collaboration Workflows

### Project Kickoff: New Data Initiative

**Sequential Collaboration Pattern:**

1. **Data Product Manager** → Requirements Gathering
2. **Data Architect** → Technical Design  
3. **Data Engineer** → Implementation
4. **Data Analyst** → Validation & Insights
5. **ML Engineer** → Advanced Analytics (if needed)
6. **Data QA Engineer** → Quality Assurance (throughout process)

### Daily Stand-up Workflow

**Parallel Information Sharing:**

```bash
# Each role reports daily status
Data Product Manager: *review-project-status
Data Architect: *review-system-health  
Data Engineer: *check-pipeline-health
Data Analyst: *review-data-freshness
ML Engineer: *check-model-performance
Data QA Engineer: *run-automated-quality-tests

# Cross-role coordination:
*coordinate-daily-priorities
*identify-blockers-and-dependencies
*plan-collaboration-touchpoints
```

### Production Issue Response

**Emergency Collaboration Pattern:**

1. **Data QA Engineer** → Issue Detection & Initial Triage
2. **Data Engineer** → Technical Investigation & Fix
3. **Data Architect** → Root Cause Analysis & Prevention
4. **Data Product Manager** → Stakeholder Communication
5. **Data Analyst** → Business Impact Assessment
6. **ML Engineer** → Model Impact Analysis (if relevant)

---

## 📈 Success Metrics by Role

### Data Product Manager
- **Stakeholder Satisfaction**: ≥8/10 satisfaction score
- **Requirements Clarity**: <10% scope changes after approval
- **Delivery Predictability**: ±10% of estimated timelines
- **Business Value Delivery**: Measurable ROI within 6 months

### Data Architect  
- **Cost Optimization**: 20-40% reduction in infrastructure costs
- **System Reliability**: 99.9% uptime for critical systems
- **Performance Standards**: <5 second response for analytical queries
- **Architecture Compliance**: 95% adherence to design standards

### Data Engineer
- **Pipeline Reliability**: 99.5% successful pipeline execution
- **Data Quality**: 99% data quality score maintenance
- **Performance Optimization**: <30 second average pipeline runtime
- **Issue Resolution**: <2 hour MTTR for critical issues

### Data Analyst
- **Insight Generation**: 3-5 actionable insights per week
- **Analysis Accuracy**: 95% accuracy in predictive analysis
- **Stakeholder Engagement**: Weekly insight delivery to business teams
- **Data Discovery**: Identification of 2-3 new opportunities monthly

### ML Engineer
- **Model Performance**: Maintain >80% accuracy for production models
- **Model Deployment**: <1 week from validation to production
- **Business Impact**: Quantifiable business value from ML models
- **System Integration**: Seamless integration with existing data infrastructure

### Data QA Engineer
- **Quality Standards**: 99% overall data quality score
- **Issue Detection**: 100% critical issue detection within 1 hour
- **SLA Compliance**: 95% compliance with all data SLAs
- **Testing Coverage**: 90% test coverage for all critical data flows

---

**🚀 Ready to master your role?** Use this guide as your daily reference and explore the [End-to-End Pipeline Masterclass](end-to-end-data-pipeline-guide.md) for comprehensive project workflows!