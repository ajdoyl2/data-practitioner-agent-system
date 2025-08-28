---
title: Pipeline Overview
---

# Pipeline Overview

Visual representation of all data pipelines.

```sql pipeline_overview
SELECT * FROM documentation.pipelines
```

<DataTable data={pipeline_overview} />

## Pipeline Metrics

```sql pipeline_metrics
SELECT * FROM documentation.pipeline_metrics
```

<LineChart data={pipeline_metrics} x=date y=processing_time />
