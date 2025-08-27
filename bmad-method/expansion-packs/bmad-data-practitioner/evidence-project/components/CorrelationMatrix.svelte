<script>
  export let data = [];
  export let title = "Correlation Matrix";
  export let width = 600;
  export let height = 600;

  import { scaleLinear, scaleBand } from 'd3-scale';
  import { interpolateRdYlBu } from 'd3-scale-chromatic';

  // Extract variable names from first data row
  $: variables = data.length > 0 ? Object.keys(data[0]).filter(key => key !== 'variable') : [];
  
  // Convert data to correlation matrix format
  $: correlationMatrix = data.reduce((acc, row) => {
    const varName = row.variable;
    acc[varName] = {};
    variables.forEach(variable => {
      acc[varName][variable] = row[variable] || 0;
    });
    return acc;
  }, {});

  $: cellSize = Math.min((width - 100) / variables.length, (height - 100) / variables.length);
  $: matrixWidth = cellSize * variables.length;
  $: matrixHeight = cellSize * variables.length;

  $: colorScale = scaleLinear()
    .domain([-1, 0, 1])
    .range([0, 0.5, 1]);

  function getCorrelationColor(correlation) {
    return interpolateRdYlBu(1 - colorScale(correlation));
  }

  function getTextColor(correlation) {
    return Math.abs(correlation) > 0.5 ? '#ffffff' : '#2c3e50';
  }
</script>

<div class="correlation-matrix">
  <h3>{title}</h3>
  <svg width={matrixWidth + 100} height={matrixHeight + 100}>
    <!-- Variable labels (Y-axis) -->
    {#each variables as variable, i}
      <text
        x={90}
        y={50 + i * cellSize + cellSize / 2}
        text-anchor="end"
        font-size={Math.min(12, cellSize * 0.3)}
        fill="#2c3e50"
        dominant-baseline="middle"
      >
        {variable}
      </text>
    {/each}

    <!-- Variable labels (X-axis) -->
    {#each variables as variable, i}
      <text
        x={100 + i * cellSize + cellSize / 2}
        y={45}
        text-anchor="middle"
        font-size={Math.min(12, cellSize * 0.3)}
        fill="#2c3e50"
        transform="rotate(-45, {100 + i * cellSize + cellSize / 2}, 45)"
      >
        {variable}
      </text>
    {/each}

    <!-- Correlation cells -->
    {#each variables as rowVar, i}
      {#each variables as colVar, j}
        {@const correlation = correlationMatrix[rowVar] ? correlationMatrix[rowVar][colVar] || 0 : 0}
        <g>
          <rect
            x={100 + j * cellSize}
            y={50 + i * cellSize}
            width={cellSize - 1}
            height={cellSize - 1}
            fill={getCorrelationColor(correlation)}
            stroke="#fff"
            stroke-width="1"
          />
          <text
            x={100 + j * cellSize + cellSize / 2}
            y={50 + i * cellSize + cellSize / 2}
            text-anchor="middle"
            font-size={Math.min(10, cellSize * 0.25)}
            fill={getTextColor(correlation)}
            dominant-baseline="middle"
          >
            {correlation.toFixed(2)}
          </text>
        </g>
      {/each}
    {/each}
  </svg>

  <!-- Color scale legend -->
  <div class="color-legend">
    <div class="legend-title">Correlation Coefficient</div>
    <div class="legend-scale">
      <div class="scale-bar">
        {#each Array(21) as _, i}
          {@const value = (i - 10) / 10}
          <div 
            class="scale-segment"
            style="background-color: {getCorrelationColor(value)}"
          ></div>
        {/each}
      </div>
      <div class="scale-labels">
        <span>-1.0</span>
        <span>-0.5</span>
        <span>0.0</span>
        <span>0.5</span>
        <span>1.0</span>
      </div>
    </div>
  </div>

  <div class="interpretation-guide">
    <h4>Interpretation Guide:</h4>
    <div class="guide-items">
      <div class="guide-item">
        <span class="guide-color strong-positive"></span>
        <span>Strong Positive (0.7 to 1.0)</span>
      </div>
      <div class="guide-item">
        <span class="guide-color moderate-positive"></span>
        <span>Moderate Positive (0.3 to 0.7)</span>
      </div>
      <div class="guide-item">
        <span class="guide-color weak"></span>
        <span>Weak (-0.3 to 0.3)</span>
      </div>
      <div class="guide-item">
        <span class="guide-color moderate-negative"></span>
        <span>Moderate Negative (-0.7 to -0.3)</span>
      </div>
      <div class="guide-item">
        <span class="guide-color strong-negative"></span>
        <span>Strong Negative (-1.0 to -0.7)</span>
      </div>
    </div>
  </div>
</div>

<style>
  .correlation-matrix {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 20px 0;
  }

  .correlation-matrix h3 {
    margin-top: 0;
    color: #2c3e50;
    font-weight: 600;
  }

  .color-legend {
    margin: 20px 0;
    text-align: center;
  }

  .legend-title {
    font-weight: 600;
    margin-bottom: 10px;
    color: #2c3e50;
    font-size: 14px;
  }

  .legend-scale {
    display: inline-block;
  }

  .scale-bar {
    display: flex;
    border: 1px solid #ddd;
    height: 20px;
    width: 300px;
    margin-bottom: 5px;
  }

  .scale-segment {
    flex: 1;
    height: 100%;
  }

  .scale-labels {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #7f8c8d;
    width: 100%;
  }

  .interpretation-guide {
    margin-top: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 4px;
  }

  .interpretation-guide h4 {
    margin-top: 0;
    margin-bottom: 10px;
    color: #2c3e50;
    font-size: 14px;
  }

  .guide-items {
    display: flex;
    flex-wrap: wrap;
    gap: 15px;
  }

  .guide-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: #2c3e50;
  }

  .guide-color {
    width: 16px;
    height: 16px;
    border-radius: 2px;
    border: 1px solid #ddd;
  }

  .guide-color.strong-positive { background-color: #d73027; }
  .guide-color.moderate-positive { background-color: #fc8d59; }
  .guide-color.weak { background-color: #ffffbf; }
  .guide-color.moderate-negative { background-color: #91bfdb; }
  .guide-color.strong-negative { background-color: #4575b4; }

  @media (max-width: 768px) {
    .correlation-matrix {
      padding: 15px;
      overflow-x: auto;
    }

    .guide-items {
      flex-direction: column;
      gap: 8px;
    }

    .scale-bar {
      width: 250px;
    }
  }
</style>