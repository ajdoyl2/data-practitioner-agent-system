<script>
  export let data = [];
  export let title = "Anomaly Detection Results";
  export let xColumn = "timestamp";
  export let yColumn = "value";
  export let anomalyColumn = "is_anomaly";
  export let width = 800;
  export let height = 400;

  import { scaleLinear, scaleTime } from 'd3-scale';
  import { extent, max, min } from 'd3-array';
  import { line, curveMonotoneX } from 'd3-shape';
  import { timeParse, timeFormat } from 'd3-time-format';

  // Parse timestamps if they're strings
  $: parsedData = data.map(d => ({
    ...d,
    parsedTime: typeof d[xColumn] === 'string' ? new Date(d[xColumn]) : d[xColumn]
  }));

  $: xScale = scaleTime()
    .domain(extent(parsedData, d => d.parsedTime))
    .range([60, width - 20]);

  $: yScale = scaleLinear()
    .domain(extent(parsedData, d => d[yColumn]))
    .range([height - 60, 20]);

  $: lineGenerator = line()
    .x(d => xScale(d.parsedTime))
    .y(d => yScale(d[yColumn]))
    .curve(curveMonotoneX);

  $: normalPoints = parsedData.filter(d => !d[anomalyColumn]);
  $: anomalyPoints = parsedData.filter(d => d[anomalyColumn]);

  $: formatTime = timeFormat("%m/%d %H:%M");
</script>

<div class="anomaly-detection-plot">
  <h3>{title}</h3>
  <svg {width} {height}>
    <!-- Background grid -->
    {#each yScale.ticks(5) as tick}
      <line 
        x1={60} 
        y1={yScale(tick)} 
        x2={width - 20} 
        y2={yScale(tick)} 
        stroke="#ecf0f1" 
        stroke-width="1"
      />
    {/each}

    <!-- Main trend line -->
    <path
      d={lineGenerator(normalPoints)}
      fill="none"
      stroke="#3498db"
      stroke-width="2"
      opacity="0.8"
    />

    <!-- Normal data points -->
    {#each normalPoints as d}
      <circle
        cx={xScale(d.parsedTime)}
        cy={yScale(d[yColumn])}
        r="3"
        fill="#3498db"
        opacity="0.6"
      />
    {/each}

    <!-- Anomaly points -->
    {#each anomalyPoints as d}
      <circle
        cx={xScale(d.parsedTime)}
        cy={yScale(d[yColumn])}
        r="5"
        fill="#e74c3c"
        stroke="#fff"
        stroke-width="2"
        opacity="0.9"
      />
      <!-- Anomaly highlight ring -->
      <circle
        cx={xScale(d.parsedTime)}
        cy={yScale(d[yColumn])}
        r="8"
        fill="none"
        stroke="#e74c3c"
        stroke-width="1"
        opacity="0.5"
      />
    {/each}

    <!-- X-axis -->
    <line x1={60} y1={height - 60} x2={width - 20} y2={height - 60} stroke="#2c3e50" />
    {#each xScale.ticks(5) as tick}
      <text
        x={xScale(tick)}
        y={height - 40}
        text-anchor="middle"
        font-size="10"
        fill="#2c3e50"
      >
        {formatTime(tick)}
      </text>
    {/each}

    <!-- Y-axis -->
    <line x1={60} y1={20} x2={60} y2={height - 60} stroke="#2c3e50" />
    {#each yScale.ticks(5) as tick}
      <text x={50} y={yScale(tick) + 4} text-anchor="end" font-size="10" fill="#2c3e50">
        {tick.toFixed(1)}
      </text>
    {/each}
    
    <text x={20} y={height / 2} text-anchor="middle" fill="#2c3e50" font-size="12" transform="rotate(-90, 20, {height / 2})">
      Value
    </text>
  </svg>

  <div class="anomaly-stats">
    <div class="stat-item">
      <span class="stat-label">Total Points:</span>
      <span class="stat-value">{data.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Anomalies:</span>
      <span class="stat-value anomaly-count">{anomalyPoints.length}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Anomaly Rate:</span>
      <span class="stat-value">{((anomalyPoints.length / data.length) * 100).toFixed(2)}%</span>
    </div>
  </div>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-color normal"></div>
      <span>Normal Values</span>
    </div>
    <div class="legend-item">
      <div class="legend-color anomaly"></div>
      <span>Detected Anomalies</span>
    </div>
  </div>
</div>

<style>
  .anomaly-detection-plot {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 20px 0;
  }

  .anomaly-detection-plot h3 {
    margin-top: 0;
    color: #2c3e50;
    font-weight: 600;
  }

  .anomaly-stats {
    display: flex;
    gap: 20px;
    margin: 15px 0;
    flex-wrap: wrap;
    padding: 10px;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .stat-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .stat-label {
    font-size: 12px;
    color: #7f8c8d;
    font-weight: 500;
  }

  .stat-value {
    font-size: 16px;
    color: #2c3e50;
    font-weight: 600;
  }

  .stat-value.anomaly-count {
    color: #e74c3c;
  }

  .legend {
    display: flex;
    gap: 20px;
    margin-top: 15px;
    flex-wrap: wrap;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #2c3e50;
  }

  .legend-color {
    width: 16px;
    height: 16px;
    border-radius: 50%;
  }

  .legend-color.normal {
    background-color: #3498db;
  }

  .legend-color.anomaly {
    background-color: #e74c3c;
  }

  @media (max-width: 768px) {
    .anomaly-detection-plot {
      padding: 15px;
    }

    .anomaly-stats {
      flex-direction: column;
      gap: 10px;
    }

    .stat-item {
      flex-direction: row;
      justify-content: space-between;
    }
  }
</style>