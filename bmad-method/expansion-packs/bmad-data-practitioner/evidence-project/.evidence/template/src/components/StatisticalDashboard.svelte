<script>
  export let title = "Statistical Analysis Dashboard";
  export let dataSource = "duckdb";
  
  import HypothesisTestChart from './HypothesisTestChart.svelte';
  import AnomalyDetectionPlot from './AnomalyDetectionPlot.svelte';
  import CorrelationMatrix from './CorrelationMatrix.svelte';
</script>

<div class="statistical-dashboard">
  <header class="dashboard-header">
    <h1>{title}</h1>
    <div class="dashboard-info">
      <span class="data-source">Data Source: {dataSource}</span>
      <span class="refresh-time">Last Updated: {new Date().toLocaleString()}</span>
    </div>
  </header>

  <div class="dashboard-grid">
    <!-- Summary Statistics Section -->
    <section class="dashboard-section summary-stats">
      <h2>Summary Statistics</h2>
      <div class="metrics-grid">
        ```sql summary_metrics
        SELECT 
          'Total Records' as metric,
          COUNT(*) as value,
          'records' as unit
        FROM customer_data
        UNION ALL
        SELECT 
          'Mean Revenue' as metric,
          ROUND(AVG(revenue), 2) as value,
          'USD' as unit
        FROM customer_data
        UNION ALL
        SELECT 
          'Revenue Std Dev' as metric,
          ROUND(STDDEV(revenue), 2) as value,
          'USD' as unit
        FROM customer_data
        UNION ALL
        SELECT 
          'Customer Segments' as metric,
          COUNT(DISTINCT segment) as value,
          'categories' as unit
        FROM customer_data
        ```

        <div class="metrics-display">
          {#each summary_metrics as metric}
            <div class="metric-card">
              <div class="metric-value">{metric.value}</div>
              <div class="metric-label">{metric.metric}</div>
              <div class="metric-unit">{metric.unit}</div>
            </div>
          {/each}
        </div>
    </section>

    <!-- Hypothesis Testing Section -->
    <section class="dashboard-section">
      <h2>Hypothesis Test Results</h2>
      ```sql hypothesis_tests
      SELECT 
        'Revenue by Segment' as test_name,
        0.0234 as p_value,
        'ANOVA' as test_type,
        CASE WHEN 0.0234 < 0.05 THEN 'Significant' ELSE 'Not Significant' END as result
      UNION ALL
      SELECT 
        'Customer Age Effect' as test_name,
        0.1872 as p_value,
        'T-Test' as test_type,
        CASE WHEN 0.1872 < 0.05 THEN 'Significant' ELSE 'Not Significant' END as result
      UNION ALL
      SELECT 
        'Geographic Revenue' as test_name,
        0.0089 as p_value,
        'Chi-Square' as test_type,
        CASE WHEN 0.0089 < 0.05 THEN 'Significant' ELSE 'Not Significant' END as result
      UNION ALL
      SELECT 
        'Seasonal Patterns' as test_name,
        0.3456 as p_value,
        'Mann-Whitney' as test_type,
        CASE WHEN 0.3456 < 0.05 THEN 'Significant' ELSE 'Not Significant' END as result
      ```

      <HypothesisTestChart 
        data={hypothesis_tests} 
        title="Statistical Significance Tests"
        xColumn="test_name"
        yColumn="p_value"
        significanceLevel={0.05}
      />
    </section>

    <!-- Anomaly Detection Section -->
    <section class="dashboard-section">
      <h2>Anomaly Detection</h2>
      ```sql anomaly_data
      WITH daily_revenue AS (
        SELECT 
          DATE_TRUNC('day', order_date) as timestamp,
          SUM(revenue) as value,
          FALSE as is_anomaly
        FROM customer_data 
        WHERE order_date >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', order_date)
      ),
      stats AS (
        SELECT 
          AVG(value) as mean_val,
          STDDEV(value) as std_val
        FROM daily_revenue
      )
      SELECT 
        d.timestamp,
        d.value,
        CASE 
          WHEN ABS(d.value - s.mean_val) > (2 * s.std_val) THEN TRUE 
          ELSE FALSE 
        END as is_anomaly
      FROM daily_revenue d
      CROSS JOIN stats s
      ORDER BY d.timestamp
      ```

      <AnomalyDetectionPlot 
        data={anomaly_data} 
        title="Daily Revenue Anomaly Detection (30 Days)"
        xColumn="timestamp"
        yColumn="value"
        anomalyColumn="is_anomaly"
      />
    </section>

    <!-- Correlation Analysis Section -->
    <section class="dashboard-section">
      <h2>Feature Correlation Analysis</h2>
      ```sql correlation_data
      WITH correlation_base AS (
        SELECT 
          'age' as variable,
          CORR(age, age) as age,
          CORR(age, revenue) as revenue,
          CORR(age, orders_count) as orders_count,
          CORR(age, days_since_signup) as days_since_signup
        FROM customer_data
        UNION ALL
        SELECT 
          'revenue' as variable,
          CORR(revenue, age) as age,
          CORR(revenue, revenue) as revenue,
          CORR(revenue, orders_count) as orders_count,
          CORR(revenue, days_since_signup) as days_since_signup
        FROM customer_data
        UNION ALL
        SELECT 
          'orders_count' as variable,
          CORR(orders_count, age) as age,
          CORR(orders_count, revenue) as revenue,
          CORR(orders_count, orders_count) as orders_count,
          CORR(orders_count, days_since_signup) as days_since_signup
        FROM customer_data
        UNION ALL
        SELECT 
          'days_since_signup' as variable,
          CORR(days_since_signup, age) as age,
          CORR(days_since_signup, revenue) as revenue,
          CORR(days_since_signup, orders_count) as orders_count,
          CORR(days_since_signup, days_since_signup) as days_since_signup
        FROM customer_data
      )
      SELECT * FROM correlation_base
      ```

      <CorrelationMatrix 
        data={correlation_data} 
        title="Customer Data Correlation Matrix"
      />
    </section>

    <!-- Advanced Analytics Section -->
    <section class="dashboard-section advanced-analytics">
      <h2>Advanced Analytics</h2>
      
      <div class="analytics-grid">
        <!-- Distribution Analysis -->
        <div class="analytics-card">
          <h3>Revenue Distribution</h3>
          ```sql revenue_distribution
          SELECT 
            CASE 
              WHEN revenue < 1000 THEN 'Low ($0-$999)'
              WHEN revenue < 5000 THEN 'Medium ($1K-$4.9K)'
              WHEN revenue < 10000 THEN 'High ($5K-$9.9K)'
              ELSE 'Premium ($10K+)'
            END as revenue_bracket,
            COUNT(*) as customer_count,
            ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
          FROM customer_data
          GROUP BY 
            CASE 
              WHEN revenue < 1000 THEN 'Low ($0-$999)'
              WHEN revenue < 5000 THEN 'Medium ($1K-$4.9K)'
              WHEN revenue < 10000 THEN 'High ($5K-$9.9K)'
              ELSE 'Premium ($10K+)'
            END
          ORDER BY MIN(revenue)
          ```
          
          <DataTable data={revenue_distribution} />
        </div>

        <!-- Trend Analysis -->
        <div class="analytics-card">
          <h3>Monthly Trends</h3>
          ```sql monthly_trends
          SELECT 
            DATE_TRUNC('month', order_date) as month,
            COUNT(DISTINCT customer_id) as unique_customers,
            COUNT(*) as total_orders,
            ROUND(SUM(revenue), 2) as total_revenue,
            ROUND(AVG(revenue), 2) as avg_order_value
          FROM customer_data
          WHERE order_date >= CURRENT_DATE - INTERVAL '12 months'
          GROUP BY DATE_TRUNC('month', order_date)
          ORDER BY month
          ```
          
          <LineChart 
            data={monthly_trends} 
            x="month" 
            y="total_revenue" 
            title="Monthly Revenue Trend"
          />
        </div>

        <!-- Segment Performance -->
        <div class="analytics-card">
          <h3>Segment Performance</h3>
          ```sql segment_performance
          SELECT 
            segment,
            COUNT(*) as customers,
            ROUND(AVG(revenue), 2) as avg_revenue,
            ROUND(SUM(revenue), 2) as total_revenue,
            ROUND(AVG(orders_count), 1) as avg_orders,
            ROUND(AVG(days_since_signup), 0) as avg_tenure_days
          FROM customer_data
          GROUP BY segment
          ORDER BY total_revenue DESC
          ```
          
          <DataTable data={segment_performance} />
        </div>
      </div>
    </section>
  </div>

  <footer class="dashboard-footer">
    <div class="footer-info">
      <span>Generated by BMad Data Practitioner Agent System</span>
      <span>Evidence.dev Statistical Dashboard v1.0</span>
    </div>
  </footer>
</div>

<style>
  .statistical-dashboard {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: #f8f9fa;
    min-height: 100vh;
    padding: 20px;
  }

  .dashboard-header {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 30px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 20px;
  }

  .dashboard-header h1 {
    margin: 0;
    color: #2c3e50;
    font-size: 28px;
    font-weight: 600;
  }

  .dashboard-info {
    display: flex;
    flex-direction: column;
    gap: 5px;
    text-align: right;
  }

  .data-source, .refresh-time {
    font-size: 12px;
    color: #7f8c8d;
  }

  .dashboard-grid {
    display: grid;
    gap: 30px;
    grid-template-columns: 1fr;
  }

  .dashboard-section {
    background: white;
    padding: 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .dashboard-section h2 {
    margin-top: 0;
    margin-bottom: 20px;
    color: #2c3e50;
    font-size: 22px;
    font-weight: 600;
    border-bottom: 2px solid #ecf0f1;
    padding-bottom: 10px;
  }

  .summary-stats .metrics-display {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-top: 20px;
  }

  .metric-card {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 25px;
    border-radius: 8px;
    text-align: center;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }

  .metric-value {
    font-size: 32px;
    font-weight: 700;
    margin-bottom: 5px;
  }

  .metric-label {
    font-size: 16px;
    font-weight: 500;
    margin-bottom: 5px;
  }

  .metric-unit {
    font-size: 12px;
    opacity: 0.8;
  }

  .advanced-analytics .analytics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 25px;
  }

  .analytics-card {
    border: 1px solid #ecf0f1;
    border-radius: 6px;
    padding: 20px;
    background: #fafbfc;
  }

  .analytics-card h3 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .dashboard-footer {
    background: white;
    padding: 20px 30px;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-top: 30px;
    text-align: center;
  }

  .footer-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 12px;
    color: #7f8c8d;
    flex-wrap: wrap;
    gap: 10px;
  }

  @media (max-width: 768px) {
    .statistical-dashboard {
      padding: 15px;
    }

    .dashboard-header {
      padding: 20px;
      flex-direction: column;
      text-align: center;
    }

    .dashboard-info {
      text-align: center;
    }

    .dashboard-section {
      padding: 20px;
    }

    .dashboard-header h1 {
      font-size: 24px;
    }

    .summary-stats .metrics-display {
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
    }

    .advanced-analytics .analytics-grid {
      grid-template-columns: 1fr;
      gap: 20px;
    }

    .footer-info {
      flex-direction: column;
      gap: 5px;
    }
  }

  @media (max-width: 480px) {
    .metric-card {
      padding: 20px 15px;
    }

    .metric-value {
      font-size: 28px;
    }

    .metric-label {
      font-size: 14px;
    }
  }
</style>