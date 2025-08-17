-- Data Quality Test Macros for BMad Data Practitioner
-- Custom macros for comprehensive data quality testing

-- Test for completeness percentage
{% macro test_completeness_threshold(model, column_name, threshold=0.95) %}
    select
        '{{ column_name }}' as column_name,
        count(*) as total_records,
        count({{ column_name }}) as non_null_records,
        round(count({{ column_name }}) / count(*)::float, 3) as completeness_ratio,
        {{ threshold }} as required_threshold
    from {{ model }}
    having completeness_ratio < {{ threshold }}
{% endmacro %}

-- Test for data freshness
{% macro test_data_freshness(model, timestamp_column, max_age_hours=24) %}
    select
        '{{ timestamp_column }}' as timestamp_column,
        max({{ timestamp_column }}) as latest_timestamp,
        current_timestamp as current_time,
        extract(epoch from (current_timestamp - max({{ timestamp_column }}))) / 3600 as age_hours,
        {{ max_age_hours }} as max_allowed_hours
    from {{ model }}
    having age_hours > {{ max_age_hours }}
{% endmacro %}

-- Test for expected row count range
{% macro test_row_count_range(model, min_rows=1, max_rows=null) %}
    select
        count(*) as actual_count,
        {{ min_rows }} as min_expected,
        {% if max_rows %}{{ max_rows }}{% else %}null{% endif %} as max_expected
    from {{ model }}
    having 
        count(*) < {{ min_rows }}
        {% if max_rows %}
        or count(*) > {{ max_rows }}
        {% endif %}
{% endmacro %}

-- Test for duplicate records based on multiple columns
{% macro test_composite_unique(model, columns) %}
    select
        {% for column in columns -%}
        {{ column }}{% if not loop.last %},{% endif %}
        {%- endfor %},
        count(*) as duplicate_count
    from {{ model }}
    group by {% for column in columns -%}
        {{ column }}{% if not loop.last %},{% endif %}
    {%- endfor %}
    having count(*) > 1
{% endmacro %}

-- Test for referential integrity
{% macro test_referential_integrity(model, column_name, parent_model, parent_column) %}
    select
        child.{{ column_name }} as orphaned_value,
        'Missing in {{ parent_model }}.{{ parent_column }}' as error_message
    from {{ model }} child
    left join {{ parent_model }} parent
        on child.{{ column_name }} = parent.{{ parent_column }}
    where 
        child.{{ column_name }} is not null
        and parent.{{ parent_column }} is null
{% endmacro %}

-- Test for acceptable values in a column with percentage threshold
{% macro test_accepted_values_threshold(model, column_name, values, threshold=0.95) %}
    with value_counts as (
        select
            sum(case when {{ column_name }} in ({{ "'" + values | join("','") + "'" }}) then 1 else 0 end) as acceptable_count,
            count(*) as total_count
        from {{ model }}
        where {{ column_name }} is not null
    )
    select
        acceptable_count,
        total_count,
        round(acceptable_count / total_count::float, 3) as acceptable_ratio,
        {{ threshold }} as required_threshold
    from value_counts
    having acceptable_ratio < {{ threshold }}
{% endmacro %}

-- Test for numeric range validation
{% macro test_numeric_range(model, column_name, min_value=null, max_value=null) %}
    select
        {{ column_name }} as out_of_range_value,
        {% if min_value %}{{ min_value }}{% else %}null{% endif %} as min_allowed,
        {% if max_value %}{{ max_value }}{% else %}null{% endif %} as max_allowed
    from {{ model }}
    where 
        {{ column_name }} is not null
        {% if min_value %}
        and {{ column_name }} < {{ min_value }}
        {% endif %}
        {% if max_value %}
        and {{ column_name }} > {{ max_value }}
        {% endif %}
{% endmacro %}

-- Test for statistical outliers using IQR method
{% macro test_outliers_iqr(model, column_name, multiplier=1.5) %}
    with quartiles as (
        select
            percentile_cont(0.25) within group (order by {{ column_name }}) as q1,
            percentile_cont(0.75) within group (order by {{ column_name }}) as q3
        from {{ model }}
        where {{ column_name }} is not null
    ),
    outlier_bounds as (
        select
            q1,
            q3,
            q3 - q1 as iqr,
            q1 - ({{ multiplier }} * (q3 - q1)) as lower_bound,
            q3 + ({{ multiplier }} * (q3 - q1)) as upper_bound
        from quartiles
    )
    select
        model_data.{{ column_name }} as outlier_value,
        bounds.lower_bound,
        bounds.upper_bound
    from {{ model }} model_data
    cross join outlier_bounds bounds
    where 
        model_data.{{ column_name }} is not null
        and (
            model_data.{{ column_name }} < bounds.lower_bound
            or model_data.{{ column_name }} > bounds.upper_bound
        )
{% endmacro %}

-- Test for pattern matching (regex)
{% macro test_pattern_match(model, column_name, pattern, should_match=true) %}
    select
        {{ column_name }} as invalid_value,
        '{{ pattern }}' as expected_pattern
    from {{ model }}
    where 
        {{ column_name }} is not null
        {% if should_match %}
        and not regexp_matches({{ column_name }}::text, '{{ pattern }}')
        {% else %}
        and regexp_matches({{ column_name }}::text, '{{ pattern }}')
        {% endif %}
{% endmacro %}

-- Test for business rule validation
{% macro test_business_rule(model, rule_expression, rule_description) %}
    select
        *,
        '{{ rule_description }}' as violated_rule
    from {{ model }}
    where not ({{ rule_expression }})
{% endmacro %}

-- Test for data consistency between related tables
{% macro test_data_consistency(model_a, model_b, join_condition, consistency_check) %}
    select
        a.*,
        b.*,
        'Data consistency violation' as error_message
    from {{ model_a }} a
    join {{ model_b }} b on {{ join_condition }}
    where not ({{ consistency_check }})
{% endmacro %}

-- Generate comprehensive data quality report
{% macro generate_dq_report(model) %}
    select
        '{{ model }}' as model_name,
        count(*) as total_records,
        count(distinct *) as unique_records,
        round((count(distinct *) / count(*)::float) * 100, 2) as uniqueness_percentage,
        current_timestamp as report_generated_at
    from {{ model }}
{% endmacro %}