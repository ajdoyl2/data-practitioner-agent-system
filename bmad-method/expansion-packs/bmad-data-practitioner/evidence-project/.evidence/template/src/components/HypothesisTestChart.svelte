<script>
  export let data = [];
  export let title = "Hypothesis Test Results";
  export let xColumn = "test_name";
  export let yColumn = "p_value";
  export let significanceLevel = 0.05;
  export let width = 800;
  export let height = 400;

  import { scaleLinear, scaleBand } from 'd3-scale';
  import { max } from 'd3-array';

  $: xScale = scaleBand()
    .domain(data.map(d => d[xColumn]))
    .range([60, width - 20])
    .padding(0.2);

  $: yScale = scaleLinear()
    .domain([0, max(data, d => d[yColumn]) || 1])
    .range([height - 60, 20]);

  $: significanceLine = yScale(significanceLevel);
</script>

<div class="hypothesis-test-chart">
  <h3>{title}</h3>
  <svg {width} {height}>
    <!-- Significance threshold line -->
    <line 
      x1={60} 
      y1={significanceLine} 
      x2={width - 20} 
      y2={significanceLine} 
      stroke="#e74c3c" 
      stroke-width="2" 
      stroke-dasharray="5,5"
    />
    <text 
      x={width - 25} 
      y={significanceLine - 5} 
      fill="#e74c3c" 
      font-size="12"
      text-anchor="end"
    >
      α = {significanceLevel}
    </text>

    <!-- Bars -->
    {#each data as d}
      <rect
        x={xScale(d[xColumn])}
        y={yScale(d[yColumn])}
        width={xScale.bandwidth()}
        height={height - 60 - yScale(d[yColumn])}
        fill={d[yColumn] < significanceLevel ? '#27ae60' : '#95a5a6'}
        opacity="0.8"
      />
      <text
        x={xScale(d[xColumn]) + xScale.bandwidth() / 2}
        y={yScale(d[yColumn]) - 5}
        text-anchor="middle"
        font-size="10"
        fill="#2c3e50"
      >
        {d[yColumn].toFixed(4)}
      </text>
    {/each}

    <!-- X-axis -->
    <line x1={60} y1={height - 60} x2={width - 20} y2={height - 60} stroke="#2c3e50" />
    {#each data as d}
      <text
        x={xScale(d[xColumn]) + xScale.bandwidth() / 2}
        y={height - 40}
        text-anchor="middle"
        font-size="12"
        fill="#2c3e50"
        transform="rotate(-45, {xScale(d[xColumn]) + xScale.bandwidth() / 2}, {height - 40})"
      >
        {d[xColumn]}
      </text>
    {/each}

    <!-- Y-axis -->
    <line x1={60} y1={20} x2={60} y2={height - 60} stroke="#2c3e50" />
    <text x={20} y={height / 2} text-anchor="middle" fill="#2c3e50" font-size="12" transform="rotate(-90, 20, {height / 2})">
      P-Value
    </text>
  </svg>

  <div class="legend">
    <div class="legend-item">
      <div class="legend-color significant"></div>
      <span>Statistically Significant (p &lt; {significanceLevel})</span>
    </div>
    <div class="legend-item">
      <div class="legend-color not-significant"></div>
      <span>Not Significant (p ≥ {significanceLevel})</span>
    </div>
  </div>
</div>

<style>
  .hypothesis-test-chart {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 20px 0;
  }

  .hypothesis-test-chart h3 {
    margin-top: 0;
    color: #2c3e50;
    font-weight: 600;
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
    border-radius: 2px;
  }

  .legend-color.significant {
    background-color: #27ae60;
  }

  .legend-color.not-significant {
    background-color: #95a5a6;
  }

  @media (max-width: 768px) {
    .hypothesis-test-chart {
      padding: 15px;
    }

    .legend {
      flex-direction: column;
      gap: 10px;
    }
  }
</style>