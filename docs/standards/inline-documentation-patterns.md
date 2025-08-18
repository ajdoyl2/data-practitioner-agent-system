# Inline Documentation Patterns for SQLmesh Models

## Overview

This document establishes standardized patterns for inline documentation within SQLmesh models to ensure consistency, maintainability, and knowledge transfer across data engineering teams.

## Documentation Philosophy

### Core Principles
1. **Code as Documentation**: Code should be self-documenting through clear naming and structure
2. **Contextual Comments**: Comments should explain WHY, not WHAT
3. **Business Focus**: Prioritize business logic explanation over technical implementation
4. **Maintenance Burden**: Keep documentation close to code to reduce maintenance drift
5. **Searchability**: Use consistent patterns to enable easy searching and navigation

### Documentation Levels
```yaml
documentation_hierarchy:
  level_1_model_header:
    scope: "Entire model purpose and context"
    detail: "High-level business problem and solution"
    audience: "Business users, new team members"
    
  level_2_section_blocks:
    scope: "Major query sections (CTEs, transformations)"
    detail: "Section purpose and logic approach"
    audience: "Data engineers, analysts"
    
  level_3_complex_logic:
    scope: "Specific calculations and business rules"
    detail: "Algorithm explanation and edge cases"
    audience: "Implementation team, maintainers"
    
  level_4_field_annotations:
    scope: "Individual columns and metrics"
    detail: "Field meaning and calculation method"
    audience: "Data consumers, downstream teams"
```

## Model Header Documentation

### Standard Model Header
```sql
/*
==============================================================================
MODEL: [schema].[model_name]
==============================================================================

PURPOSE:
[Concise explanation of what this model does and why it exists]

BUSINESS CONTEXT:
[Business domain, key questions answered, stakeholder impact]

DEPENDENCIES:
- Input: [upstream_model] - [brief description]
- Input: [upstream_table] - [brief description]

OUTPUTS:
- Used by: [downstream_model] - [usage description]
- Reports: [dashboard/report] - [consumption pattern]

GRAIN: [Primary key columns that define uniqueness]

REFRESH: [Schedule and rationale - e.g., @daily for overnight batch processing]

OWNER: [Team/Individual responsible for maintenance]
LAST_UPDATED: [Date of last significant change]

NOTES:
[Important considerations, limitations, or special handling requirements]

==============================================================================
*/
MODEL (
    name [schema].[model_name],
    kind [FULL/INCREMENTAL/SCD_TYPE_2],
    owner '[owner_email]',
    cron '@daily',
    grain '[grain_columns]',
    description '''
    [Single line business description for catalog]
    '''
);
```

### Example Model Header
```sql
/*
==============================================================================
MODEL: analytics.customer_360_daily
==============================================================================

PURPOSE:
Creates a comprehensive daily snapshot of customer data combining transaction
history, demographic information, and behavioral metrics for customer analytics
and machine learning feature engineering.

BUSINESS CONTEXT:
Serves the Customer Analytics team for customer segmentation, lifetime value
analysis, and churn prediction. Critical for daily marketing campaign targeting
and customer success interventions.

DEPENDENCIES:
- Input: staging.customer_transactions - Daily transaction data from POS systems
- Input: staging.customer_profiles - Customer demographic and account information
- Input: staging.customer_interactions - Support and engagement touchpoints

OUTPUTS:
- Used by: ml_features.customer_churn_features - Feeds ML pipeline
- Reports: Customer 360 Dashboard - Executive daily reporting
- API: Customer Intelligence Service - Real-time customer insights

GRAIN: customer_id, snapshot_date

REFRESH: @daily at 06:00 UTC - After upstream data refresh completes

OWNER: Data Engineering Team (data-eng@company.com)
LAST_UPDATED: 2024-01-15

NOTES:
- Revenue calculations use UTC timezone for consistency across regions
- Customer classification logic updated quarterly based on business strategy
- Performance optimized with customer_id clustering for fast lookups

==============================================================================
*/
```

## CTE and Section Documentation

### Section Block Patterns
```sql
-- =============================================================================
-- SECTION: [Section Name]
-- PURPOSE: [What this section accomplishes]
-- INPUT: [Data sources for this section]
-- OUTPUT: [What this section produces]
-- BUSINESS LOGIC: [Key business rules applied]
-- =============================================================================

WITH section_name AS (
    -- [Detailed explanation if complex logic follows]
    SELECT 
        column1,
        column2
    FROM source_table
    WHERE condition
),
```

### Example CTE Documentation
```sql
-- =============================================================================
-- SECTION: Transaction Aggregation
-- PURPOSE: Calculate daily customer transaction metrics and spending patterns
-- INPUT: staging.customer_transactions (filtered to last 90 days)
-- OUTPUT: Daily spending totals, transaction counts, and category breakdowns
-- BUSINESS LOGIC: 
--   - Excludes refunds and cancelled transactions
--   - Groups by customer and transaction date
--   - Applies currency conversion to USD using daily rates
-- =============================================================================

WITH daily_transactions AS (
    /*
    AGGREGATION STRATEGY:
    We aggregate at daily level first to optimize downstream joins and
    reduce memory usage in window functions. This approach provides 
    better performance than row-level aggregation.
    
    CURRENCY HANDLING:
    All amounts converted to USD using the exchange rate from the 
    transaction date. Historical rates are immutable to ensure
    consistent reporting across time periods.
    */
    SELECT 
        customer_id,
        transaction_date::DATE as txn_date,
        
        -- Transaction volume metrics
        COUNT(*) as daily_transaction_count,
        COUNT(DISTINCT merchant_id) as unique_merchants,
        
        -- Revenue metrics (converted to USD)
        SUM(amount_local * exchange_rate_to_usd) as daily_spend_usd,
        AVG(amount_local * exchange_rate_to_usd) as avg_transaction_usd,
        
        -- Category breakdown for behavioral analysis
        SUM(CASE WHEN category = 'grocery' THEN amount_local * exchange_rate_to_usd ELSE 0 END) as grocery_spend_usd,
        SUM(CASE WHEN category = 'dining' THEN amount_local * exchange_rate_to_usd ELSE 0 END) as dining_spend_usd,
        SUM(CASE WHEN category = 'retail' THEN amount_local * exchange_rate_to_usd ELSE 0 END) as retail_spend_usd
        
    FROM staging.customer_transactions t
    JOIN staging.exchange_rates e ON t.transaction_date = e.rate_date AND t.currency = e.from_currency
    WHERE 
        -- Data quality filters
        t.transaction_date >= CURRENT_DATE - 90  -- Rolling 90-day window
        AND t.status = 'completed'               -- Exclude pending/failed transactions
        AND t.amount_local > 0                   -- Exclude refunds (handled separately)
        AND t.customer_id IS NOT NULL           -- Ensure referential integrity
        
    GROUP BY customer_id, transaction_date::DATE
),
```

## Complex Logic Documentation

### Business Rule Documentation
```sql
-- BUSINESS RULE: Customer Tier Classification
-- UPDATED: 2024-01-15 (Quarterly business review)
-- RATIONALE: Risk-adjusted customer value segmentation for targeted marketing
--
-- TIER LOGIC:
--   PLATINUM: >$10K annual spend + >50 transactions + <2% dispute rate
--   GOLD:     >$5K annual spend + >25 transactions + <5% dispute rate  
--   SILVER:   >$1K annual spend + >10 transactions + <10% dispute rate
--   BRONZE:   All other active customers
--   INACTIVE: No transactions in last 180 days
--
-- BUSINESS IMPACT:
--   - PLATINUM/GOLD: Premium customer service, exclusive offers
--   - SILVER: Standard service, targeted campaigns
--   - BRONZE: Retention campaigns, onboarding improvements
--   - INACTIVE: Win-back campaigns, account closure consideration

CASE 
    WHEN days_since_last_transaction > 180 THEN 'INACTIVE'
    WHEN (
        annual_spend_usd >= 10000 
        AND annual_transaction_count >= 50 
        AND dispute_rate <= 0.02
    ) THEN 'PLATINUM'
    WHEN (
        annual_spend_usd >= 5000 
        AND annual_transaction_count >= 25 
        AND dispute_rate <= 0.05
    ) THEN 'GOLD'
    WHEN (
        annual_spend_usd >= 1000 
        AND annual_transaction_count >= 10 
        AND dispute_rate <= 0.10
    ) THEN 'SILVER'
    ELSE 'BRONZE'
END AS customer_tier,
```

### Calculation Documentation
```sql
-- METRIC: Customer Lifetime Value (CLV) Calculation
-- METHOD: Predictive CLV using 12-month historical average with growth adjustment
-- FORMULA: (avg_monthly_spend * retention_months * growth_factor) - acquisition_cost
--
-- ASSUMPTIONS:
--   - Retention estimated using cohort analysis (updated monthly)
--   - Growth factor based on customer tier and market segment
--   - Acquisition cost allocated from marketing spend attribution
--
-- EDGE CASES:
--   - New customers (<3 months): Use segment average with confidence penalty
--   - Inactive customers: CLV = 0 (excluded from marketing calculations)
--   - High-dispute customers: Apply risk discount factor

-- Base CLV calculation
(avg_monthly_spend_usd * estimated_retention_months * growth_factor) - estimated_acquisition_cost_usd AS customer_lifetime_value_usd,

-- Confidence score for CLV estimate (higher is better)
CASE 
    WHEN months_active >= 12 THEN 0.95  -- High confidence: full year of data
    WHEN months_active >= 6 THEN 0.80   -- Medium confidence: partial year
    WHEN months_active >= 3 THEN 0.60   -- Low confidence: limited history
    ELSE 0.30                           -- Very low confidence: new customer
END AS clv_confidence_score,
```

## Column and Field Documentation

### Field Annotation Patterns
```sql
SELECT 
    -- IDENTITY: Core customer identification
    customer_id,                          -- Primary key, immutable customer identifier
    snapshot_date,                        -- Partition key, daily snapshot timestamp
    
    -- DEMOGRAPHICS: Customer profile information
    customer_age_years,                   -- Calculated from birth_date, updated daily
    customer_segment,                     -- Business-defined segment (Enterprise/SMB/Consumer)
    account_tenure_days,                  -- Days since account creation, for lifecycle analysis
    
    -- TRANSACTION METRICS: Rolling 30-day aggregations
    txn_count_30d,                       -- Transaction count, excludes refunds and disputes
    txn_amount_usd_30d,                  -- Total USD spend, currency-converted at transaction date
    avg_txn_amount_usd_30d,              -- Average transaction size, basis for spending behavior
    
    -- BEHAVIORAL INDICATORS: ML feature engineering
    days_since_last_txn,                 -- Recency metric for churn prediction models
    txn_frequency_score,                 -- Normalized frequency score (0-100, 100=most frequent)
    spending_volatility,                 -- Coefficient of variation for spending patterns
    
    -- RISK METRICS: Fraud and credit risk indicators  
    dispute_rate_90d,                    -- Dispute rate over 90 days, credit risk signal
    failed_payment_count_30d,            -- Failed payment attempts, liquidity indicator
    risk_score,                          -- Composite risk score (0-1000, higher=riskier)
    
    -- ENGAGEMENT: Customer interaction metrics
    support_contact_count_30d,           -- Support touchpoints, satisfaction driver
    login_frequency_30d,                 -- Digital engagement, product adoption metric
    feature_adoption_score,              -- Weighted score of feature usage (0-100)
    
    -- DERIVED ATTRIBUTES: Business intelligence
    customer_tier,                       -- Calculated tier (PLATINUM/GOLD/SILVER/BRONZE/INACTIVE)
    clv_12m_usd,                        -- 12-month predicted customer lifetime value
    churn_probability,                   -- ML-predicted churn probability (0-1)
    next_best_action                     -- Recommended action (UPSELL/RETAIN/RECOVER/NURTURE)
    
FROM customer_metrics_base
```

### Complex Field Documentation
```sql
-- ADVANCED METRIC: Cross-Channel Engagement Score
-- CALCULATION: Weighted composite of digital and physical touchpoints
-- WEIGHTS: Mobile app (40%), Web (30%), In-store (20%), Call center (10%)
-- NORMALIZATION: Min-max scaled to 0-100 range within customer segment
-- UPDATE FREQUENCY: Daily, with 7-day smoothing to reduce noise
-- BUSINESS USE: Customer experience optimization and channel investment decisions

(
    -- Digital engagement (70% weight)
    (COALESCE(mobile_app_sessions_7d, 0) * 0.40) +
    (COALESCE(web_sessions_7d, 0) * 0.30) +
    
    -- Physical engagement (30% weight)  
    (COALESCE(store_visits_7d, 0) * 0.20) +
    (COALESCE(call_center_contacts_7d, 0) * 0.10)
    
) / GREATEST(segment_max_engagement_score, 1) * 100 AS cross_channel_engagement_score,
```

## Window Function Documentation

### Window Function Patterns
```sql
-- WINDOW FUNCTION: Customer Ranking and Percentiles
-- PURPOSE: Rank customers within their segment for comparative analysis
-- PARTITION: customer_segment (ensures fair comparison within peer group)
-- ORDER: annual_spend_usd DESC (highest spenders ranked first)
-- BUSINESS USE: Identify top performers and outliers for targeted campaigns

-- Customer ranking within segment
ROW_NUMBER() OVER (
    PARTITION BY customer_segment 
    ORDER BY annual_spend_usd DESC
) AS spending_rank_in_segment,

-- Percentile ranking for more robust comparison
PERCENT_RANK() OVER (
    PARTITION BY customer_segment 
    ORDER BY annual_spend_usd
) AS spending_percentile_in_segment,

-- WINDOW FUNCTION: Trend Analysis
-- PURPOSE: Calculate period-over-period changes for trend identification
-- LAG: Compare current month to previous month
-- LEAD: Preview next month for forecasting
-- BUSINESS USE: Identify growth/decline trends for proactive account management

-- Month-over-month spending change
LAG(monthly_spend_usd, 1) OVER (
    PARTITION BY customer_id 
    ORDER BY snapshot_date
) AS prev_month_spend_usd,

-- Growth calculation with null handling for new customers
CASE 
    WHEN LAG(monthly_spend_usd, 1) OVER (PARTITION BY customer_id ORDER BY snapshot_date) IS NULL 
    THEN NULL  -- New customer, no comparison possible
    WHEN LAG(monthly_spend_usd, 1) OVER (PARTITION BY customer_id ORDER BY snapshot_date) = 0 
    THEN NULL  -- Avoid division by zero
    ELSE (
        (monthly_spend_usd - LAG(monthly_spend_usd, 1) OVER (PARTITION BY customer_id ORDER BY snapshot_date)) 
        / LAG(monthly_spend_usd, 1) OVER (PARTITION BY customer_id ORDER BY snapshot_date)
    ) * 100
END AS monthly_spend_growth_pct,
```

## Conditional Logic Documentation

### CASE Statement Documentation
```sql
-- CONDITIONAL LOGIC: Customer Risk Classification
-- LAST UPDATED: 2024-01-10 (Risk committee review)
-- REVIEW FREQUENCY: Monthly
-- 
-- RISK FACTORS CONSIDERED:
--   1. Payment history (35% weight) - Historical payment reliability
--   2. Account age (20% weight) - Tenure reduces risk over time  
--   3. Transaction patterns (25% weight) - Spending consistency and growth
--   4. External signals (20% weight) - Credit bureau and fraud indicators
--
-- CLASSIFICATION THRESHOLDS:
--   HIGH: Risk score >= 750 (requires manual review)
--   MEDIUM: Risk score 500-749 (automated monitoring)
--   LOW: Risk score < 500 (standard processing)
--
-- BUSINESS IMPACT:
--   - HIGH: Manual underwriting, enhanced monitoring, higher pricing
--   - MEDIUM: Automated rules with periodic review
--   - LOW: Standard automated processing

CASE 
    -- High risk: Multiple negative indicators
    WHEN (
        failed_payment_rate_90d > 0.15        -- >15% payment failure rate
        OR days_since_last_payment > 60       -- Payment delinquency
        OR dispute_rate_12m > 0.10            -- High dispute rate
        OR account_tenure_days < 30           -- Very new account
        OR external_credit_score < 600        -- Poor credit history
    ) THEN 'HIGH'
    
    -- Medium risk: Some concerning patterns
    WHEN (
        failed_payment_rate_90d > 0.05        -- 5-15% payment failure rate
        OR days_since_last_payment > 30       -- Some payment delays
        OR dispute_rate_12m > 0.05            -- Moderate dispute rate
        OR (account_tenure_days < 90 AND external_credit_score < 700)  -- New + marginal credit
    ) THEN 'MEDIUM'
    
    -- Low risk: Good standing customer
    ELSE 'LOW'
    
END AS risk_classification,
```

## Error Handling Documentation

### Null Handling Patterns
```sql
-- NULL HANDLING: Defensive programming for data quality
-- STRATEGY: Explicit null handling with business-appropriate defaults
-- RATIONALE: Upstream data quality issues should not break downstream analytics

-- Safe division with null propagation
CASE 
    WHEN COALESCE(total_orders, 0) = 0 THEN NULL  -- No orders = no meaningful ratio
    ELSE COALESCE(successful_orders, 0)::FLOAT / COALESCE(total_orders, 0)
END AS order_success_rate,

-- Date handling with fallbacks
COALESCE(
    actual_delivery_date,           -- Preferred: actual delivery when available
    estimated_delivery_date,        -- Fallback: estimated date for pending orders
    order_date + INTERVAL '7 days'  -- Default: conservative estimate for data gaps
) AS effective_delivery_date,

-- Amount aggregation with zero defaults (preserves mathematical operations)
COALESCE(SUM(order_amount), 0) AS total_order_amount,

-- String handling with meaningful defaults
COALESCE(
    NULLIF(TRIM(customer_segment), ''),  -- Clean whitespace-only values
    'UNCLASSIFIED'                       -- Business-meaningful default
) AS customer_segment_clean,
```

## Performance Documentation

### Optimization Comments
```sql
-- PERFORMANCE OPTIMIZATION: Query structure for warehouse efficiency
-- 
-- JOIN ORDER: Fact table first, then dimensions by cardinality (smallest first)
-- FILTERING: Predicate pushdown applied before joins to reduce data volume
-- PARTITIONING: Date-based partitioning leveraged in WHERE clause
-- CLUSTERING: customer_id clustering improves join performance
-- 
-- ESTIMATED COST: $2.50 per run (Medium warehouse, 5-minute execution)
-- COST DRIVERS: Large fact table scan, multiple joins, window functions
-- OPTIMIZATION OPPORTUNITIES: Consider materialized intermediate tables for complex calculations

SELECT 
    f.customer_id,
    f.transaction_date,
    -- ... other columns
FROM (
    -- SUBQUERY: Pre-filter fact table to reduce join volume
    -- PERFORMANCE GAIN: 70% reduction in data processed by downstream joins
    SELECT *
    FROM fact_transactions
    WHERE 
        transaction_date >= CURRENT_DATE - 30  -- Partition elimination
        AND status = 'completed'               -- Selective filter first
        AND amount > 0                         -- Exclude zero/negative amounts
) f

-- DIMENSION JOINS: Order by cardinality (smallest tables first)
JOIN dim_customers c ON f.customer_id = c.customer_id          -- ~1M records
JOIN dim_merchants m ON f.merchant_id = m.merchant_id          -- ~10K records  
JOIN dim_categories cat ON m.category_id = cat.category_id     -- ~100 records

-- FINAL FILTER: Applied after joins for business logic
WHERE c.account_status = 'ACTIVE'
```

## Testing and Validation Documentation

### Test Case Documentation
```sql
-- DATA VALIDATION: Inline quality checks
-- PURPOSE: Catch data anomalies early in the pipeline
-- ACTION: Log warnings for investigation, fail hard on critical issues

-- BUSINESS RULE VALIDATION: Revenue calculations must balance
-- CRITICAL: This check prevents financial reporting errors
-- ESCALATION: Immediate alert to finance team if validation fails
SELECT 
    *,
    -- Validation: Transaction totals must equal line item sums
    CASE 
        WHEN ABS(transaction_total - line_item_sum) > 0.01 THEN 
            'ERROR: Transaction total mismatch - ' || 
            'Expected: ' || transaction_total::TEXT || 
            ', Calculated: ' || line_item_sum::TEXT
        ELSE NULL 
    END AS validation_error
    
FROM transactions_with_line_items
WHERE validation_error IS NOT NULL;  -- This should return zero rows

-- REFERENTIAL INTEGRITY: Foreign key validation
-- PURPOSE: Ensure joins will not drop data unexpectedly
-- ACTION: Document orphaned records for data governance team
SELECT 
    'Customer orphans' as check_type,
    COUNT(*) as orphan_count
FROM fact_orders f
LEFT JOIN dim_customers c ON f.customer_id = c.customer_id
WHERE c.customer_id IS NULL
HAVING COUNT(*) > 0;  -- Alert if orphaned records found
```

## Documentation Maintenance

### Change Documentation
```sql
-- CHANGE LOG: Inline change tracking
-- VERSION: 2.1.0
-- DATE: 2024-01-15
-- AUTHOR: Data Engineering Team
-- CHANGE TYPE: Enhancement
-- 
-- CHANGES:
--   - Added customer tier recalculation logic (lines 145-165)
--   - Updated CLV formula to include retention probability (lines 200-220)
--   - Fixed null handling in risk score calculation (lines 250-275)
-- 
-- BACKWARDS COMPATIBILITY: Yes
-- DOWNSTREAM IMPACT: Customer tier changes will affect marketing campaigns
-- ROLLBACK PLAN: Revert to v2.0.0 if tier classification issues detected
-- 
-- TESTING COMPLETED:
--   ✓ Unit tests for tier logic
--   ✓ Integration test with marketing system
--   ✓ Performance regression test
--   ✓ Data quality validation

-- Updated tier calculation (v2.1.0)
CASE 
    WHEN annual_spend_usd >= 10000 AND retention_probability > 0.8 THEN 'PLATINUM'
    -- ... rest of logic
END AS customer_tier_v2,
```

### Review and Maintenance
```yaml
maintenance_schedule:
  weekly_review:
    - "Check for TODO comments requiring action"
    - "Validate example data is current"
    - "Verify business logic comments match implementation"
    
  monthly_review:
    - "Review business rule documentation with stakeholders"
    - "Update performance metrics and cost estimates"
    - "Validate foreign key and dependency documentation"
    
  quarterly_review:
    - "Complete documentation accuracy audit"
    - "Update change log and version history"
    - "Review and update business context sections"
    
  annual_review:
    - "Comprehensive documentation overhaul"
    - "Align with updated business processes"
    - "Archive outdated patterns and examples"
```

## Best Practices Summary

### Do's
- ✅ Explain business WHY before technical HOW
- ✅ Document assumptions and edge cases explicitly
- ✅ Include examples with realistic data
- ✅ Maintain consistent formatting and patterns
- ✅ Update documentation with code changes
- ✅ Focus on complex logic that isn't self-evident
- ✅ Include performance implications for expensive operations

### Don'ts  
- ❌ Document obvious code (e.g., "SELECT selects columns")
- ❌ Use vague terms like "business logic" without specifics
- ❌ Let documentation drift from actual implementation
- ❌ Over-document simple transformations
- ❌ Include sensitive data in examples
- ❌ Use inline comments for complex explanations (use blocks)
- ❌ Assume future maintainers have context you do

### Quality Checklist
- [ ] Business purpose clearly stated
- [ ] Complex calculations explained
- [ ] Assumptions documented
- [ ] Edge cases covered
- [ ] Performance implications noted
- [ ] Dependencies identified
- [ ] Change history maintained
- [ ] Examples provided where helpful