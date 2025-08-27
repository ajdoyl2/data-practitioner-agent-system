/**
 * Visualization Templates for Common Analysis Patterns
 * Evidence.dev Statistical Components Library
 * 
 * This module provides pre-configured visualization templates for common
 * analytical patterns in data science and business intelligence.
 * 
 * Responsive Design: All templates support mobile-first design with
 * @media (max-width: 768px) breakpoints and flexible grid layouts.
 */

export const VisualizationTemplates = {
  
  // Time Series Analysis Templates
  timeSeries: {
    // Revenue trend over time
    revenueTrend: {
      title: "Revenue Trend Analysis",
      sql: `
        SELECT 
          DATE_TRUNC('{{timeframe}}', order_date) as period,
          SUM(revenue) as total_revenue,
          COUNT(*) as order_count,
          COUNT(DISTINCT customer_id) as unique_customers
        FROM {{table_name}}
        WHERE order_date >= CURRENT_DATE - INTERVAL '{{period}} {{timeframe}}'
        GROUP BY DATE_TRUNC('{{timeframe}}', order_date)
        ORDER BY period
      `,
      visualizationType: "line",
      xColumn: "period",
      yColumn: "total_revenue",
      defaultParams: {
        timeframe: "day",
        period: "30",
        table_name: "customer_data"
      },
      responsive: true,
      width: 800,
      height: 300
    },

    // Seasonal patterns
    seasonalPattern: {
      title: "Seasonal Pattern Analysis",
      sql: `
        SELECT 
          EXTRACT({{season_type}} FROM order_date) as season_period,
          AVG(revenue) as avg_revenue,
          COUNT(*) as frequency
        FROM {{table_name}}
        WHERE order_date >= CURRENT_DATE - INTERVAL '2 years'
        GROUP BY EXTRACT({{season_type}} FROM order_date)
        ORDER BY season_period
      `,
      visualizationType: "bar",
      xColumn: "season_period",
      yColumn: "avg_revenue",
      defaultParams: {
        season_type: "month", // month, dow (day of week), quarter
        table_name: "customer_data"
      },
      responsive: true,
      width: 600,
      height: 250
    },

    // Growth rate analysis
    growthRate: {
      title: "Growth Rate Analysis",
      sql: `
        WITH monthly_data AS (
          SELECT 
            DATE_TRUNC('month', order_date) as month,
            SUM(revenue) as monthly_revenue
          FROM {{table_name}}
          GROUP BY DATE_TRUNC('month', order_date)
        )
        SELECT 
          month,
          monthly_revenue,
          LAG(monthly_revenue) OVER (ORDER BY month) as prev_month_revenue,
          ROUND(
            ((monthly_revenue - LAG(monthly_revenue) OVER (ORDER BY month)) / 
             NULLIF(LAG(monthly_revenue) OVER (ORDER BY month), 0)) * 100, 2
          ) as growth_rate
        FROM monthly_data
        ORDER BY month
      `,
      visualizationType: "line",
      xColumn: "month",
      yColumn: "growth_rate",
      defaultParams: {
        table_name: "customer_data"
      },
      responsive: true,
      width: 800,
      height: 300
    }
  },

  // Distribution Analysis Templates
  distribution: {
    // Revenue distribution histogram
    revenueDistribution: {
      title: "Revenue Distribution Analysis",
      sql: `
        WITH revenue_buckets AS (
          SELECT 
            CASE 
              WHEN revenue < {{bucket_1}} THEN 'Low (< ${{bucket_1}})'
              WHEN revenue < {{bucket_2}} THEN 'Medium (${{bucket_1}} - ${{bucket_2}})'
              WHEN revenue < {{bucket_3}} THEN 'High (${{bucket_2}} - ${{bucket_3}})'
              ELSE 'Premium (${{bucket_3}}+)'
            END as revenue_bracket,
            revenue
          FROM {{table_name}}
          WHERE revenue > 0
        )
        SELECT 
          revenue_bracket,
          COUNT(*) as frequency,
          ROUND(AVG(revenue), 2) as avg_revenue
        FROM revenue_buckets
        GROUP BY revenue_bracket
        ORDER BY MIN(revenue)
      `,
      visualizationType: "bar",
      xColumn: "revenue_bracket",
      yColumn: "frequency",
      defaultParams: {
        bucket_1: 1000,
        bucket_2: 5000,
        bucket_3: 10000,
        table_name: "customer_data"
      },
      responsive: true,
      width: 600,
      height: 300
    },

    // Age distribution
    ageDistribution: {
      title: "Customer Age Distribution",
      sql: `
        WITH age_groups AS (
          SELECT 
            CASE 
              WHEN age < 25 THEN '18-24'
              WHEN age < 35 THEN '25-34'
              WHEN age < 45 THEN '35-44'
              WHEN age < 55 THEN '45-54'
              WHEN age < 65 THEN '55-64'
              ELSE '65+'
            END as age_group,
            customer_id,
            revenue
          FROM {{table_name}}
          WHERE age IS NOT NULL
        )
        SELECT 
          age_group,
          COUNT(DISTINCT customer_id) as customer_count,
          ROUND(AVG(revenue), 2) as avg_revenue
        FROM age_groups
        GROUP BY age_group
        ORDER BY MIN(CASE 
          WHEN age_group = '18-24' THEN 1
          WHEN age_group = '25-34' THEN 2
          WHEN age_group = '35-44' THEN 3
          WHEN age_group = '45-54' THEN 4
          WHEN age_group = '55-64' THEN 5
          ELSE 6
        END)
      `,
      visualizationType: "bar",
      xColumn: "age_group",
      yColumn: "customer_count",
      defaultParams: {
        table_name: "customer_data"
      },
      responsive: true,
      width: 600,
      height: 300
    }
  },

  // Comparison Analysis Templates
  comparison: {
    // Segment comparison
    segmentComparison: {
      title: "Segment Performance Comparison",
      sql: `
        SELECT 
          segment,
          COUNT(*) as total_customers,
          ROUND(AVG(revenue), 2) as avg_revenue,
          ROUND(SUM(revenue), 2) as total_revenue,
          ROUND(AVG(orders_count), 1) as avg_orders,
          ROUND(STDDEV(revenue), 2) as revenue_std
        FROM {{table_name}}
        GROUP BY segment
        ORDER BY total_revenue DESC
      `,
      visualizationType: "bar",
      xColumn: "segment",
      yColumn: "total_revenue",
      defaultParams: {
        table_name: "customer_data"
      },
      responsive: true,
      width: 700,
      height: 300
    },

    // Geographic comparison
    geographicComparison: {
      title: "Geographic Performance Analysis",
      sql: `
        SELECT 
          {{geo_column}} as geography,
          COUNT(DISTINCT customer_id) as customers,
          SUM(revenue) as total_revenue,
          ROUND(AVG(revenue), 2) as avg_revenue_per_order,
          COUNT(*) as total_orders
        FROM {{table_name}}
        WHERE {{geo_column}} IS NOT NULL
        GROUP BY {{geo_column}}
        ORDER BY total_revenue DESC
        LIMIT {{limit}}
      `,
      visualizationType: "bar",
      xColumn: "geography",
      yColumn: "total_revenue",
      defaultParams: {
        geo_column: "city",
        table_name: "customer_data",
        limit: 20
      },
      responsive: true,
      width: 800,
      height: 300
    }
  },

  // Correlation and Relationship Templates
  relationship: {
    // Revenue vs Age scatter plot
    revenueVsAge: {
      title: "Revenue vs Customer Age Analysis",
      sql: `
        SELECT 
          age,
          revenue,
          segment,
          orders_count
        FROM {{table_name}}
        WHERE age IS NOT NULL 
          AND revenue > 0
          AND age BETWEEN {{min_age}} AND {{max_age}}
        ORDER BY RANDOM()
        LIMIT {{sample_size}}
      `,
      visualizationType: "scatter",
      xColumn: "age",
      yColumn: "revenue",
      colorColumn: "segment",
      sizeColumn: "orders_count",
      defaultParams: {
        min_age: 18,
        max_age: 80,
        sample_size: 1000,
        table_name: "customer_data"
      },
      responsive: true,
      width: 700,
      height: 400
    },

    // Orders vs Revenue correlation
    ordersVsRevenue: {
      title: "Order Count vs Revenue Relationship",
      sql: `
        SELECT 
          orders_count as x_value,
          revenue as y_value,
          segment as category,
          customer_id
        FROM {{table_name}}
        WHERE orders_count > 0 
          AND revenue > 0
        ORDER BY RANDOM()
        LIMIT {{sample_size}}
      `,
      visualizationType: "scatter",
      xColumn: "x_value",
      yColumn: "y_value",
      colorColumn: "category",
      defaultParams: {
        sample_size: 1000,
        table_name: "customer_data"
      },
      responsive: true,
      width: 600,
      height: 400
    }
  },

  // Cohort Analysis Templates
  cohort: {
    // Customer acquisition cohorts
    acquisitionCohort: {
      title: "Customer Acquisition Cohort Analysis",
      sql: `
        WITH customer_cohorts AS (
          SELECT 
            customer_id,
            DATE_TRUNC('month', MIN(order_date)) as cohort_month,
            MIN(order_date) as first_order_date
          FROM {{table_name}}
          GROUP BY customer_id
        ),
        cohort_data AS (
          SELECT 
            c.cohort_month,
            DATE_TRUNC('month', o.order_date) as order_month,
            COUNT(DISTINCT o.customer_id) as customers
          FROM customer_cohorts c
          JOIN {{table_name}} o ON c.customer_id = o.customer_id
          GROUP BY c.cohort_month, DATE_TRUNC('month', o.order_date)
        )
        SELECT 
          cohort_month,
          order_month,
          customers,
          EXTRACT(MONTH FROM AGE(order_month, cohort_month)) as month_number
        FROM cohort_data
        WHERE cohort_month >= CURRENT_DATE - INTERVAL '12 months'
        ORDER BY cohort_month, month_number
      `,
      visualizationType: "heatmap",
      xColumn: "month_number",
      yColumn: "cohort_month",
      colorColumn: "customers",
      defaultParams: {
        table_name: "customer_data"
      },
      responsive: true,
      width: 800,
      height: 400
    }
  },

  // Anomaly Detection Templates
  anomaly: {
    // Daily revenue anomalies
    dailyRevenueAnomalies: {
      title: "Daily Revenue Anomaly Detection",
      sql: `
        WITH daily_revenue AS (
          SELECT 
            DATE_TRUNC('day', order_date) as date,
            SUM(revenue) as daily_revenue
          FROM {{table_name}}
          WHERE order_date >= CURRENT_DATE - INTERVAL '{{days}} days'
          GROUP BY DATE_TRUNC('day', order_date)
        ),
        revenue_stats AS (
          SELECT 
            AVG(daily_revenue) as mean_revenue,
            STDDEV(daily_revenue) as std_revenue
          FROM daily_revenue
        )
        SELECT 
          d.date as timestamp,
          d.daily_revenue as value,
          CASE 
            WHEN ABS(d.daily_revenue - s.mean_revenue) > ({{threshold}} * s.std_revenue) 
            THEN TRUE 
            ELSE FALSE 
          END as is_anomaly,
          s.mean_revenue,
          s.std_revenue
        FROM daily_revenue d
        CROSS JOIN revenue_stats s
        ORDER BY d.date
      `,
      visualizationType: "anomaly",
      xColumn: "timestamp",
      yColumn: "value",
      anomalyColumn: "is_anomaly",
      defaultParams: {
        days: 90,
        threshold: 2.5,
        table_name: "customer_data"
      },
      responsive: true,
      width: 800,
      height: 300
    },

    // Order count anomalies
    orderCountAnomalies: {
      title: "Order Count Anomaly Detection",
      sql: `
        WITH hourly_orders AS (
          SELECT 
            DATE_TRUNC('hour', order_date) as hour,
            COUNT(*) as order_count
          FROM {{table_name}}
          WHERE order_date >= CURRENT_DATE - INTERVAL '{{hours}} hours'
          GROUP BY DATE_TRUNC('hour', order_date)
        ),
        order_stats AS (
          SELECT 
            AVG(order_count) as mean_orders,
            STDDEV(order_count) as std_orders
          FROM hourly_orders
        )
        SELECT 
          h.hour as timestamp,
          h.order_count as value,
          CASE 
            WHEN ABS(h.order_count - s.mean_orders) > ({{threshold}} * s.std_orders) 
            THEN TRUE 
            ELSE FALSE 
          END as is_anomaly
        FROM hourly_orders h
        CROSS JOIN order_stats s
        ORDER BY h.hour
      `,
      visualizationType: "anomaly",
      xColumn: "timestamp",
      yColumn: "value",
      anomalyColumn: "is_anomaly",
      defaultParams: {
        hours: 168, // 1 week
        threshold: 2.0,
        table_name: "customer_data"
      },
      responsive: true,
      width: 800,
      height: 300
    }
  },

  // Statistical Analysis Templates
  statistical: {
    // Hypothesis testing results
    hypothesisTests: {
      title: "Hypothesis Testing Results",
      sql: `
        WITH segment_stats AS (
          SELECT 
            segment,
            AVG(revenue) as avg_revenue,
            COUNT(*) as sample_size,
            STDDEV(revenue) as std_revenue
          FROM {{table_name}}
          GROUP BY segment
        ),
        test_results AS (
          SELECT 
            'Revenue by Segment (ANOVA)' as test_name,
            {{p_value_segment}} as p_value,
            'ANOVA' as test_type
          UNION ALL
          SELECT 
            'Age Effect on Revenue (T-Test)' as test_name,
            {{p_value_age}} as p_value,
            'T-Test' as test_type
          UNION ALL
          SELECT 
            'Geographic Distribution (Chi-Square)' as test_name,
            {{p_value_geo}} as p_value,
            'Chi-Square' as test_type
        )
        SELECT 
          test_name,
          p_value,
          test_type,
          CASE WHEN p_value < {{alpha}} THEN 'Significant' ELSE 'Not Significant' END as result
        FROM test_results
      `,
      visualizationType: "hypothesis",
      xColumn: "test_name",
      yColumn: "p_value",
      defaultParams: {
        p_value_segment: 0.0234,
        p_value_age: 0.1872,
        p_value_geo: 0.0089,
        alpha: 0.05,
        table_name: "customer_data"
      },
      responsive: true,
      width: 700,
      height: 300
    }
  }
};

/**
 * Template Generator Class
 * Handles parameterization and SQL generation for visualization templates
 */
export class TemplateGenerator {
  constructor(templates = VisualizationTemplates) {
    this.templates = templates;
  }

  /**
   * Get a template by category and name
   */
  getTemplate(category, templateName) {
    if (!this.templates[category] || !this.templates[category][templateName]) {
      throw new Error(`Template ${category}.${templateName} not found`);
    }
    return { ...this.templates[category][templateName] };
  }

  /**
   * Generate SQL with custom parameters
   */
  generateSQL(category, templateName, customParams = {}) {
    const template = this.getTemplate(category, templateName);
    const params = { ...template.defaultParams, ...customParams };
    
    let sql = template.sql;
    
    // Replace parameters in SQL template
    Object.entries(params).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g');
      sql = sql.replace(regex, value);
    });

    return sql;
  }

  /**
   * Generate complete visualization configuration
   */
  generateVisualization(category, templateName, customParams = {}) {
    const template = this.getTemplate(category, templateName);
    const sql = this.generateSQL(category, templateName, customParams);
    
    return {
      ...template,
      sql,
      params: { ...template.defaultParams, ...customParams }
    };
  }

  /**
   * List all available templates
   */
  listTemplates() {
    const templateList = [];
    
    Object.entries(this.templates).forEach(([category, templates]) => {
      Object.entries(templates).forEach(([templateName, template]) => {
        templateList.push({
          category,
          name: templateName,
          title: template.title,
          visualizationType: template.visualizationType,
          description: `${category} analysis using ${template.visualizationType} visualization`
        });
      });
    });
    
    return templateList;
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category) {
    if (!this.templates[category]) {
      return [];
    }
    
    return Object.entries(this.templates[category]).map(([name, template]) => ({
      name,
      title: template.title,
      visualizationType: template.visualizationType,
      description: template.description || `${category} analysis template`
    }));
  }

  /**
   * Get templates by visualization type
   */
  getTemplatesByType(visualizationType) {
    const matchingTemplates = [];
    
    Object.entries(this.templates).forEach(([category, templates]) => {
      Object.entries(templates).forEach(([templateName, template]) => {
        if (template.visualizationType === visualizationType) {
          matchingTemplates.push({
            category,
            name: templateName,
            title: template.title,
            visualizationType: template.visualizationType
          });
        }
      });
    });
    
    return matchingTemplates;
  }
}

// Export default instance
export default new TemplateGenerator();