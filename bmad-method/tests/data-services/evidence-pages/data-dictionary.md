---
title: Data Dictionary
---

# Data Dictionary

Interactive data dictionary for all schemas and tables.

```sql data_schemas
SELECT * FROM documentation.data_schemas
```

<DataTable data={data_schemas} />

## Field Definitions

```sql data_fields  
SELECT * FROM documentation.data_fields
```

<DataTable data={data_fields} />
