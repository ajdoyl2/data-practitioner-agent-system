<script>
  export let title = "Interactive Analytics Dashboard";
  export let dataSource = "duckdb";
  
  import { onMount } from 'svelte';
  import ResponsiveDataTable from './ResponsiveDataTable.svelte';
  import D3VisualizationFrame from './D3VisualizationFrame.svelte';
  import HypothesisTestChart from './HypothesisTestChart.svelte';
  import AnomalyDetectionPlot from './AnomalyDetectionPlot.svelte';
  
  // Filter state
  let selectedSegment = 'all';
  let selectedDateRange = '30';
  let selectedMetric = 'revenue';
  let refreshInterval;
  let lastRefresh = new Date();
  
  // Reactive filter parameters for SQL queries
  $: segmentFilter = selectedSegment !== 'all' ? `AND segment = '${selectedSegment}'` : '';
  $: dateFilter = `AND order_date >= CURRENT_DATE - INTERVAL '${selectedDateRange} days'`;
  
  onMount(() => {
    // Auto-refresh every 5 minutes
    refreshInterval = setInterval(() => {
      lastRefresh = new Date();
      // Trigger data refresh by updating a reactive variable
      selectedMetric = selectedMetric; // This will trigger reactive SQL queries
    }, 300000);

    return () => {
      if (refreshInterval) {
        clearInterval(refreshInterval);
      }
    };
  });

  function handleRefresh() {
    try {
      lastRefresh = new Date();
      selectedMetric = selectedMetric; // Trigger reactive updates
    } catch (error) {
      console.error('Error refreshing dashboard:', error);
    }
  }
</script>

<div class="interactive-dashboard">
  <header class="dashboard-header">
    <div class="header-content">
      <h1>{title}</h1>
      <div class="dashboard-metadata">
        <span class="data-source">Source: {dataSource}</span>
        <span class="last-refresh">Updated: {lastRefresh.toLocaleTimeString()}</span>
        <button class="refresh-button" on:click={handleRefresh}>🔄 Refresh</button>
      </div>
    </div>
  </header>

  <!-- Interactive Controls -->
  <section class="controls-section">
    <div class="controls-grid">
      <div class="control-group">
        <label for="segment-filter">Customer Segment:</label>
        ```sql segment_options
        SELECT DISTINCT segment as value, segment as label
        FROM customer_data
        ORDER BY segment
        ```
        <select id="segment-filter" bind:value={selectedSegment}>
          <option value="all">All Segments</option>
          {#each segment_options as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>

      <div class="control-group">
        <label for="date-range">Time Period:</label>
        <select id="date-range" bind:value={selectedDateRange}>
          <option value="7">Last 7 Days</option>
          <option value="30">Last 30 Days</option>
          <option value="90">Last 90 Days</option>
          <option value="365">Last Year</option>
        </select>
      </div>

      <div class="control-group">
        <label for="metric-selector">Primary Metric:</label>
        <select id="metric-selector" bind:value={selectedMetric}>
          <option value="revenue">Revenue</option>
          <option value="orders_count">Order Count</option>
          <option value="customer_count">Customer Count</option>
          <option value="avg_order_value">Average Order Value</option>
        </select>
      </div>
    </div>
  </section>

  <!-- Key Metrics Cards -->
  <section class="metrics-section">
    <h2>Key Performance Indicators</h2>
    ```sql kpi_metrics
    SELECT 
      'Total Revenue' as metric,
      ROUND(SUM(revenue), 2) as value,
      'USD' as unit,
      ROUND(
        (SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN revenue ELSE 0 END) /
         NULLIF(SUM(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{parseInt(selectedDateRange) * 2} days' 
                             AND order_date < CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN revenue ELSE 0 END), 0) - 1) * 100, 
        2
      ) as change_percent
    FROM customer_data 
    WHERE 1=1 {segmentFilter} {dateFilter}
    UNION ALL
    SELECT 
      'Total Orders' as metric,
      COUNT(*) as value,
      'orders' as unit,
      ROUND(
        (COUNT(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN 1 ELSE NULL END)::float /
         NULLIF(COUNT(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{parseInt(selectedDateRange) * 2} days' 
                             AND order_date < CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN 1 ELSE NULL END), 0) - 1) * 100, 
        2
      ) as change_percent
    FROM customer_data 
    WHERE 1=1 {segmentFilter} {dateFilter}
    UNION ALL
    SELECT 
      'Unique Customers' as metric,
      COUNT(DISTINCT customer_id) as value,
      'customers' as unit,
      ROUND(
        (COUNT(DISTINCT CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN customer_id ELSE NULL END)::float /
         NULLIF(COUNT(DISTINCT CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{parseInt(selectedDateRange) * 2} days' 
                                       AND order_date < CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN customer_id ELSE NULL END), 0) - 1) * 100, 
        2
      ) as change_percent
    FROM customer_data 
    WHERE 1=1 {segmentFilter} {dateFilter}
    UNION ALL
    SELECT 
      'Average Order Value' as metric,
      ROUND(AVG(revenue), 2) as value,
      'USD' as unit,
      ROUND(
        (AVG(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN revenue ELSE NULL END) /
         NULLIF(AVG(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '{parseInt(selectedDateRange) * 2} days' 
                             AND order_date < CURRENT_DATE - INTERVAL '{selectedDateRange} days' THEN revenue ELSE NULL END), 0) - 1) * 100, 
        2
      ) as change_percent
    FROM customer_data 
    WHERE 1=1 {segmentFilter} {dateFilter}
    ```

    <div class="kpi-grid">
      {#each kpi_metrics as kpi}
        <div class="kpi-card">
          <div class="kpi-header">
            <h3>{kpi.metric}</h3>
            <div class="kpi-change" class:positive={kpi.change_percent > 0} class:negative={kpi.change_percent < 0}>
              {kpi.change_percent > 0 ? '+' : ''}{kpi.change_percent}%
            </div>
          </div>
          <div class="kpi-value">
            {typeof kpi.value === 'number' ? kpi.value.toLocaleString() : kpi.value}
            <span class="kpi-unit">{kpi.unit}</span>
          </div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Trend Visualization -->
  <section class="visualization-section">
    <h2>Trend Analysis</h2>
    ```sql trend_data
    SELECT 
      DATE_TRUNC('day', order_date) as date,
      SUM(CASE WHEN '{selectedMetric}' = 'revenue' THEN revenue 
               WHEN '{selectedMetric}' = 'orders_count' THEN 1 
               ELSE 0 END) as value,
      COUNT(DISTINCT CASE WHEN '{selectedMetric}' = 'customer_count' THEN customer_id ELSE NULL END) as customer_value
    FROM customer_data 
    WHERE 1=1 {segmentFilter} {dateFilter}
    GROUP BY DATE_TRUNC('day', order_date)
    ORDER BY date
    ```

    <D3VisualizationFrame
      data={trend_data.map(d => ({
        x: new Date(d.date),
        y: selectedMetric === 'customer_count' ? d.customer_value : d.value
      }))}
      visualizationType="line"
      title="{selectedMetric.replace('_', ' ').toUpperCase()} Trend - {selectedSegment === 'all' ? 'All Segments' : selectedSegment}"
      xColumn="x"
      yColumn="y"
      width={800}
      height={300}
    />
  </section>

  <!-- Segment Analysis -->
  <section class="segment-analysis-section">
    <h2>Segment Performance Breakdown</h2>
    ```sql segment_analysis
    SELECT 
      segment,
      COUNT(*) as total_orders,
      COUNT(DISTINCT customer_id) as unique_customers,
      ROUND(SUM(revenue), 2) as total_revenue,
      ROUND(AVG(revenue), 2) as avg_order_value,
      ROUND(AVG(orders_count), 1) as avg_orders_per_customer,
      ROUND(AVG(age), 1) as avg_customer_age
    FROM customer_data 
    WHERE 1=1 {dateFilter}
    GROUP BY segment
    ORDER BY total_revenue DESC
    ```

    <ResponsiveDataTable 
      data={segment_analysis}
      title="Segment Performance Details"
      sortable={true}
      filterable={false}
      paginated={false}
    />
  </section>

  <!-- Statistical Analysis -->
  <section class="stats-section">
    <div class="stats-grid">
      <div class="stat-panel">
        <h3>Revenue Distribution by Segment</h3>
        ```sql revenue_by_segment
        SELECT 
          segment as x,
          SUM(revenue) as y
        FROM customer_data 
        WHERE 1=1 {segmentFilter} {dateFilter}
        GROUP BY segment
        ORDER BY y DESC
        ```

        <D3VisualizationFrame
          data={revenue_by_segment}
          visualizationType="bar"
          title="Revenue by Segment"
          xColumn="x"
          yColumn="y"
          width={400}
          height={250}
        />
      </div>

      <div class="stat-panel">
        <h3>Customer Age vs Revenue</h3>
        ```sql age_revenue_scatter
        SELECT 
          age as x,
          revenue as y,
          segment as category
        FROM customer_data 
        WHERE 1=1 {segmentFilter} {dateFilter}
          AND age IS NOT NULL
        LIMIT 500
        ```

        <D3VisualizationFrame
          data={age_revenue_scatter}
          visualizationType="scatter"
          title="Customer Age vs Revenue"
          xColumn="x"
          yColumn="y"
          colorColumn="category"
          width={400}
          height={250}
        />
      </div>
    </div>
  </section>

  <!-- Anomaly Detection -->
  <section class="anomaly-section">
    <h2>Anomaly Detection</h2>
    ```sql daily_anomalies
    WITH daily_metrics AS (
      SELECT 
        DATE_TRUNC('day', order_date) as timestamp,
        SUM(revenue) as value,
        COUNT(*) as order_count
      FROM customer_data 
      WHERE 1=1 {segmentFilter} {dateFilter}
      GROUP BY DATE_TRUNC('day', order_date)
    ),
    stats AS (
      SELECT 
        AVG(value) as mean_val,
        STDDEV(value) as std_val
      FROM daily_metrics
    )
    SELECT 
      d.timestamp,
      d.value,
      CASE 
        WHEN ABS(d.value - s.mean_val) > (2.5 * s.std_val) THEN TRUE 
        ELSE FALSE 
      END as is_anomaly
    FROM daily_metrics d
    CROSS JOIN stats s
    ORDER BY d.timestamp
    ```

    <AnomalyDetectionPlot 
      data={daily_anomalies} 
      title="Daily Revenue Anomaly Detection - {selectedSegment === 'all' ? 'All Segments' : selectedSegment}"
      xColumn="timestamp"
      yColumn="value"
      anomalyColumn="is_anomaly"
      width={800}
      height={300}
    />
  </section>

  <!-- Real-time Insights -->
  <section class="insights-section">
    <h2>Automated Insights</h2>
    ```sql insights_data
    WITH insights AS (
      SELECT 
        'growth_trend' as insight_type,
        CASE 
          WHEN AVG(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '7 days' THEN revenue END) >
               AVG(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '14 days' AND order_date < CURRENT_DATE - INTERVAL '7 days' THEN revenue END)
          THEN 'Revenue is trending upward over the last week'
          ELSE 'Revenue has declined in the last week compared to the previous week'
        END as message,
        ROUND(
          (AVG(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '7 days' THEN revenue END) /
           NULLIF(AVG(CASE WHEN order_date >= CURRENT_DATE - INTERVAL '14 days' AND order_date < CURRENT_DATE - INTERVAL '7 days' THEN revenue END), 0) - 1) * 100, 
          2
        ) as value
      FROM customer_data
      WHERE 1=1 {segmentFilter}
      
      UNION ALL
      
      SELECT 
        'segment_performance' as insight_type,
        'Top performing segment: ' || 
        (SELECT segment FROM customer_data WHERE 1=1 {segmentFilter} {dateFilter} GROUP BY segment ORDER BY SUM(revenue) DESC LIMIT 1) as message,
        (SELECT SUM(revenue) FROM customer_data WHERE 1=1 {segmentFilter} {dateFilter} GROUP BY segment ORDER BY SUM(revenue) DESC LIMIT 1) as value
        
      UNION ALL
      
      SELECT 
        'customer_insights' as insight_type,
        'Average customer lifetime value: $' || ROUND(AVG(revenue * orders_count), 2) as message,
        ROUND(AVG(revenue * orders_count), 2) as value
      FROM customer_data
      WHERE 1=1 {segmentFilter}
    )
    SELECT * FROM insights
    ```

    <div class="insights-grid">
      {#each insights_data as insight}
        <div class="insight-card">
          <div class="insight-type">{insight.insight_type.replace('_', ' ').toUpperCase()}</div>
          <div class="insight-message">{insight.message}</div>
          {#if insight.value}
            <div class="insight-value">{typeof insight.value === 'number' ? insight.value.toLocaleString() : insight.value}</div>
          {/if}
        </div>
      {/each}
    </div>
  </section>
</div>

<style>
  .interactive-dashboard {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f8f9fa;
    min-height: 100vh;
    padding: 20px;
  }

  .dashboard-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 30px;
    border-radius: 12px;
    margin-bottom: 30px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .dashboard-header h1 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }

  .dashboard-metadata {
    display: flex;
    align-items: center;
    gap: 15px;
    font-size: 14px;
    flex-wrap: wrap;
  }

  .refresh-button {
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border: 1px solid rgba(255, 255, 255, 0.3);
    padding: 8px 16px;
    border-radius: 6px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .refresh-button:hover {
    background: rgba(255, 255, 255, 0.3);
  }

  /* Controls Section */
  .controls-section {
    background: white;
    padding: 25px;
    border-radius: 8px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .controls-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
  }

  .control-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .control-group label {
    font-weight: 500;
    color: #2c3e50;
    font-size: 14px;
  }

  .control-group select {
    padding: 10px;
    border: 2px solid #ecf0f1;
    border-radius: 6px;
    font-size: 14px;
    background: white;
    transition: border-color 0.3s ease;
  }

  .control-group select:focus {
    outline: none;
    border-color: #3498db;
  }

  /* Metrics Section */
  .metrics-section {
    background: white;
    padding: 25px;
    border-radius: 8px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .metrics-section h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2c3e50;
    font-size: 22px;
    font-weight: 600;
  }

  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
  }

  .kpi-card {
    background: linear-gradient(135deg, #74b9ff 0%, #0984e3 100%);
    color: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .kpi-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 15px;
  }

  .kpi-header h3 {
    margin: 0;
    font-size: 16px;
    font-weight: 500;
  }

  .kpi-change {
    background: rgba(255, 255, 255, 0.2);
    padding: 4px 8px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }

  .kpi-change.positive {
    background: rgba(39, 174, 96, 0.8);
  }

  .kpi-change.negative {
    background: rgba(231, 76, 60, 0.8);
  }

  .kpi-value {
    font-size: 32px;
    font-weight: 700;
    line-height: 1;
  }

  .kpi-unit {
    font-size: 14px;
    opacity: 0.8;
    margin-left: 5px;
  }

  /* Section Styles */
  .visualization-section, .segment-analysis-section, .anomaly-section {
    background: white;
    padding: 25px;
    border-radius: 8px;
    margin-bottom: 30px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .visualization-section h2, .segment-analysis-section h2, .anomaly-section h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2c3e50;
    font-size: 22px;
    font-weight: 600;
  }

  /* Stats Grid */
  .stats-section {
    margin-bottom: 30px;
  }

  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
  }

  .stat-panel {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .stat-panel h3 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  /* Insights Section */
  .insights-section {
    background: white;
    padding: 25px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .insights-section h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2c3e50;
    font-size: 22px;
    font-weight: 600;
  }

  .insights-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
  }

  .insight-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    border-left: 4px solid #3498db;
  }

  .insight-type {
    font-size: 12px;
    font-weight: 600;
    color: #7f8c8d;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .insight-message {
    font-size: 14px;
    color: #2c3e50;
    margin-bottom: 8px;
    line-height: 1.4;
  }

  .insight-value {
    font-size: 18px;
    font-weight: 600;
    color: #3498db;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .interactive-dashboard {
      padding: 15px;
    }

    .dashboard-header {
      padding: 20px;
    }

    .header-content {
      flex-direction: column;
      text-align: center;
    }

    .dashboard-header h1 {
      font-size: 24px;
    }

    .controls-grid {
      grid-template-columns: 1fr;
    }

    .kpi-grid {
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    }

    .stats-grid {
      grid-template-columns: 1fr;
    }

    .insights-grid {
      grid-template-columns: 1fr;
    }
  }
</style>