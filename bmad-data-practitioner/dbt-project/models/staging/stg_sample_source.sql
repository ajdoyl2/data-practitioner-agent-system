{{
  config(
    materialized='view',
    alias='sample_source_staging'
  )
}}

-- Sample staging model for testing dbt configuration
-- One-to-one mapping with raw source data

with source_data as (
    select
        id,
        name,
        created_at,
        updated_at
    from {{ source('raw_data', 'sample_source') }}
),

cleaned_data as (
    select
        id::integer as source_id,
        trim(upper(name)) as source_name,
        created_at::timestamp as created_timestamp,
        updated_at::timestamp as updated_timestamp,
        current_timestamp as processed_at
    from source_data
    where id is not null
)

select * from cleaned_data