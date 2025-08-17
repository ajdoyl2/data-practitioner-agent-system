-- Custom data quality tests for sample source data
-- Validates business rules and data quality standards

-- Test 1: Ensure all source IDs are positive integers
select
    source_id,
    'source_id must be positive integer' as violation_reason
from {{ ref('stg_sample_source') }}
where source_id <= 0 or source_id is null

union all

-- Test 2: Verify source names are not empty after cleaning
select
    source_id,
    'source_name cannot be empty after cleaning' as violation_reason
from {{ ref('stg_sample_source') }}
where trim(source_name) = '' or source_name is null

union all

-- Test 3: Check that processed_at is within reasonable time range (last 30 days)
select
    source_id,
    'processed_at timestamp is outside acceptable range' as violation_reason
from {{ ref('stg_sample_source') }}
where 
    processed_at < current_timestamp - interval '30 days'
    or processed_at > current_timestamp + interval '1 hour'

union all

-- Test 4: Validate created_timestamp is before updated_timestamp when both exist
select
    source_id,
    'created_timestamp must be before or equal to updated_timestamp' as violation_reason
from {{ ref('stg_sample_source') }}
where 
    created_timestamp is not null 
    and updated_timestamp is not null
    and created_timestamp > updated_timestamp