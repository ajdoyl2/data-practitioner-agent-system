<script>
  export let visualizationType = "scatter";
  export let data = [];
  export let width = 800;
  export let height = 400;
  export let title = "D3 Visualization";
  export let xColumn = "x";
  export let yColumn = "y";
  export let colorColumn = null;
  export let sizeColumn = null;
  export let responsive = true;
  
  import { onMount, afterUpdate } from 'svelte';
  import * as d3 from 'd3';

  let container;
  let svg;
  let mounted = false;

  // Responsive dimensions
  let containerWidth = width;
  let containerHeight = height;

  onMount(() => {
    mounted = true;
    if (responsive) {
      updateDimensions();
      window.addEventListener('resize', updateDimensions);
    }
    createVisualization();
  });

  afterUpdate(() => {
    if (mounted) {
      createVisualization();
    }
  });

  function updateDimensions() {
    if (container && responsive) {
      const rect = container.getBoundingClientRect();
      containerWidth = Math.max(300, rect.width - 40);
      containerHeight = Math.max(200, containerWidth * 0.6);
    }
  }

  function createVisualization() {
    if (!container || !data.length) return;

    // Clear existing SVG
    d3.select(svg).selectAll("*").remove();

    const margin = { top: 60, right: 60, bottom: 80, left: 80 };
    const chartWidth = containerWidth - margin.left - margin.right;
    const chartHeight = containerHeight - margin.top - margin.bottom;

    const svgElement = d3.select(svg)
      .attr('width', containerWidth)
      .attr('height', containerHeight);

    const chartGroup = svgElement.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create scales
    const xExtent = d3.extent(data, d => d[xColumn]);
    const yExtent = d3.extent(data, d => d[yColumn]);
    
    const xScale = d3.scaleLinear()
      .domain(xExtent)
      .range([0, chartWidth])
      .nice();

    const yScale = d3.scaleLinear()
      .domain(yExtent)
      .range([chartHeight, 0])
      .nice();

    // Color scale (if colorColumn specified)
    let colorScale;
    if (colorColumn) {
      const colorExtent = d3.extent(data, d => d[colorColumn]);
      colorScale = d3.scaleSequential(d3.interpolateViridis)
        .domain(colorExtent);
    }

    // Size scale (if sizeColumn specified)
    let sizeScale;
    if (sizeColumn) {
      const sizeExtent = d3.extent(data, d => d[sizeColumn]);
      sizeScale = d3.scaleSqrt()
        .domain(sizeExtent)
        .range([3, 15]);
    }

    // Add axes
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d3.format('.2s'));
    const yAxis = d3.axisLeft(yScale)
      .tickFormat(d3.format('.2s'));

    chartGroup.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0, ${chartHeight})`)
      .call(xAxis);

    chartGroup.append('g')
      .attr('class', 'y-axis')
      .call(yAxis);

    // Add axis labels
    chartGroup.append('text')
      .attr('class', 'x-label')
      .attr('text-anchor', 'middle')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 50)
      .style('font-size', '12px')
      .style('fill', '#2c3e50')
      .text(xColumn);

    chartGroup.append('text')
      .attr('class', 'y-label')
      .attr('text-anchor', 'middle')
      .attr('transform', 'rotate(-90)')
      .attr('x', -chartHeight / 2)
      .attr('y', -50)
      .style('font-size', '12px')
      .style('fill', '#2c3e50')
      .text(yColumn);

    // Add title
    svgElement.append('text')
      .attr('class', 'chart-title')
      .attr('text-anchor', 'middle')
      .attr('x', containerWidth / 2)
      .attr('y', 30)
      .style('font-size', '16px')
      .style('font-weight', '600')
      .style('fill', '#2c3e50')
      .text(title);

    // Create visualization based on type
    switch (visualizationType) {
      case 'scatter':
        createScatterPlot(chartGroup, xScale, yScale, colorScale, sizeScale, chartWidth, chartHeight);
        break;
      case 'line':
        createLinePlot(chartGroup, xScale, yScale, chartWidth, chartHeight);
        break;
      case 'bar':
        createBarChart(chartGroup, xScale, yScale, chartWidth, chartHeight);
        break;
      case 'heatmap':
        createHeatmap(chartGroup, xScale, yScale, colorScale, chartWidth, chartHeight);
        break;
      default:
        createScatterPlot(chartGroup, xScale, yScale, colorScale, sizeScale, chartWidth, chartHeight);
    }

    // Add grid
    addGrid(chartGroup, xScale, yScale, chartWidth, chartHeight);

    // Add interactivity
    addInteractivity(chartGroup);
  }

  function createScatterPlot(g, xScale, yScale, colorScale, sizeScale, width, height) {
    const tooltip = createTooltip();

    g.selectAll('.dot')
      .data(data)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d[xColumn]))
      .attr('cy', d => yScale(d[yColumn]))
      .attr('r', d => sizeScale ? sizeScale(d[sizeColumn]) : 4)
      .style('fill', d => colorScale ? colorScale(d[colorColumn]) : '#3498db')
      .style('opacity', 0.7)
      .style('stroke', '#fff')
      .style('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this).style('opacity', 1).attr('r', d => (sizeScale ? sizeScale(d[sizeColumn]) : 4) + 2);
        showTooltip(tooltip, event, d);
      })
      .on('mouseout', function(event, d) {
        d3.select(this).style('opacity', 0.7).attr('r', d => sizeScale ? sizeScale(d[sizeColumn]) : 4);
        hideTooltip(tooltip);
      });
  }

  function createLinePlot(g, xScale, yScale, width, height) {
    const line = d3.line()
      .x(d => xScale(d[xColumn]))
      .y(d => yScale(d[yColumn]))
      .curve(d3.curveMonotoneX);

    // Sort data by x value for line chart
    const sortedData = [...data].sort((a, b) => a[xColumn] - b[xColumn]);

    g.append('path')
      .datum(sortedData)
      .attr('class', 'line')
      .attr('d', line)
      .style('fill', 'none')
      .style('stroke', '#3498db')
      .style('stroke-width', 2);

    // Add dots
    g.selectAll('.dot')
      .data(sortedData)
      .enter().append('circle')
      .attr('class', 'dot')
      .attr('cx', d => xScale(d[xColumn]))
      .attr('cy', d => yScale(d[yColumn]))
      .attr('r', 3)
      .style('fill', '#3498db')
      .style('stroke', '#fff')
      .style('stroke-width', 2);
  }

  function createBarChart(g, xScale, yScale, width, height) {
    const barWidth = Math.max(5, width / data.length - 5);

    g.selectAll('.bar')
      .data(data)
      .enter().append('rect')
      .attr('class', 'bar')
      .attr('x', d => xScale(d[xColumn]) - barWidth / 2)
      .attr('y', d => yScale(d[yColumn]))
      .attr('width', barWidth)
      .attr('height', d => height - yScale(d[yColumn]))
      .style('fill', '#3498db')
      .style('opacity', 0.8)
      .on('mouseover', function() {
        d3.select(this).style('opacity', 1);
      })
      .on('mouseout', function() {
        d3.select(this).style('opacity', 0.8);
      });
  }

  function addGrid(g, xScale, yScale, width, height) {
    // X grid lines
    g.selectAll('.x-grid')
      .data(xScale.ticks())
      .enter().append('line')
      .attr('class', 'x-grid')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', height)
      .style('stroke', '#ecf0f1')
      .style('stroke-width', 1);

    // Y grid lines
    g.selectAll('.y-grid')
      .data(yScale.ticks())
      .enter().append('line')
      .attr('class', 'y-grid')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .style('stroke', '#ecf0f1')
      .style('stroke-width', 1);
  }

  function createTooltip() {
    return d3.select('body').append('div')
      .attr('class', 'd3-tooltip')
      .style('position', 'absolute')
      .style('background', 'rgba(0, 0, 0, 0.8)')
      .style('color', 'white')
      .style('padding', '8px 12px')
      .style('border-radius', '4px')
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('opacity', 0)
      .style('z-index', 1000);
  }

  function showTooltip(tooltip, event, d) {
    const tooltipContent = Object.entries(d)
      .map(([key, value]) => `${key}: ${typeof value === 'number' ? value.toFixed(2) : value}`)
      .join('<br>');

    tooltip.transition()
      .duration(200)
      .style('opacity', 1);
    
    tooltip.html(tooltipContent)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px');
  }

  function hideTooltip(tooltip) {
    tooltip.transition()
      .duration(200)
      .style('opacity', 0);
  }

  function addInteractivity(g) {
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([0.5, 10])
      .on('zoom', function(event) {
        g.attr('transform', event.transform);
      });

    d3.select(svg).call(zoom);

    // Add reset button
    const resetButton = d3.select(container)
      .append('button')
      .attr('class', 'reset-zoom')
      .style('position', 'absolute')
      .style('top', '10px')
      .style('right', '10px')
      .style('padding', '5px 10px')
      .style('background', '#3498db')
      .style('color', 'white')
      .style('border', 'none')
      .style('border-radius', '4px')
      .style('cursor', 'pointer')
      .style('font-size', '12px')
      .text('Reset Zoom')
      .on('click', function() {
        d3.select(svg).transition().duration(750).call(
          zoom.transform,
          d3.zoomIdentity
        );
      });
  }

  // Cleanup on destroy
  function cleanup() {
    if (responsive) {
      window.removeEventListener('resize', updateDimensions);
    }
    d3.selectAll('.d3-tooltip').remove();
  }

  // Cleanup when component is destroyed
  import { onDestroy } from 'svelte';
  onDestroy(cleanup);
</script>

<div class="d3-visualization-frame" bind:this={container}>
  <svg bind:this={svg}></svg>
</div>

<style>
  .d3-visualization-frame {
    position: relative;
    width: 100%;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 20px 0;
  }

  .d3-visualization-frame svg {
    width: 100%;
    height: auto;
  }

  :global(.reset-zoom:hover) {
    background: #2980b9 !important;
  }

  :global(.d3-tooltip) {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  }

  @media (max-width: 768px) {
    .d3-visualization-frame {
      padding: 15px;
    }
  }
</style>