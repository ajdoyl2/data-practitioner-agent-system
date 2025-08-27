<script>
  export let chartConfig = {};
  export let onConfigChange = () => {};
  export let brandingOptions = {};
  
  import { createEventDispatcher, onMount } from 'svelte';
  
  const dispatch = createEventDispatcher();

  // Default customization options
  let customizations = {
    // Color scheme options
    colorScheme: 'default',
    customColors: ['#3498db', '#e74c3c', '#2ecc71', '#f39c12', '#9b59b6'],
    
    // Typography options
    fontFamily: 'Segoe UI',
    fontSize: 12,
    titleFontSize: 16,
    titleFontWeight: 600,
    
    // Layout options
    showGrid: true,
    gridOpacity: 0.3,
    showLegend: true,
    legendPosition: 'right',
    
    // Chart dimensions
    width: 800,
    height: 400,
    margin: { top: 60, right: 60, bottom: 80, left: 80 },
    
    // Animation options
    enableAnimations: true,
    animationDuration: 750,
    
    // Branding options
    showLogo: false,
    logoPosition: 'top-right',
    logoSize: 'small',
    watermark: '',
    
    // Accessibility options
    highContrast: false,
    colorBlindFriendly: false,
    altText: '',
    
    // Export options
    backgroundColor: '#ffffff',
    exportFormat: 'png',
    exportDPI: 300
  };

  // Color scheme presets
  const colorSchemes = {
    default: {
      name: 'Default Blue',
      colors: ['#3498db', '#2980b9', '#74b9ff', '#0984e3', '#6c5ce7']
    },
    warm: {
      name: 'Warm Sunset',
      colors: ['#e74c3c', '#f39c12', '#e67e22', '#d63031', '#fd79a8']
    },
    cool: {
      name: 'Cool Ocean',
      colors: ['#2ecc71', '#1dd1a1', '#00cec9', '#55a3ff', '#74b9ff']
    },
    corporate: {
      name: 'Corporate Professional',
      colors: ['#2c3e50', '#34495e', '#7f8c8d', '#95a5a6', '#bdc3c7']
    },
    vibrant: {
      name: 'Vibrant Rainbow',
      colors: ['#e74c3c', '#f39c12', '#2ecc71', '#3498db', '#9b59b6']
    },
    colorBlindFriendly: {
      name: 'Colorblind Friendly',
      colors: ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd']
    },
    highContrast: {
      name: 'High Contrast',
      colors: ['#000000', '#ffffff', '#ff0000', '#00ff00', '#0000ff']
    }
  };

  // Font family options
  const fontFamilies = [
    { value: 'Segoe UI', label: 'Segoe UI (Windows)' },
    { value: 'Helvetica, Arial', label: 'Helvetica / Arial' },
    { value: 'Georgia', label: 'Georgia (Serif)' },
    { value: 'Monaco, Courier New', label: 'Monaco / Courier (Monospace)' },
    { value: 'Roboto', label: 'Roboto (Google)' },
    { value: 'Open Sans', label: 'Open Sans (Google)' }
  ];

  // Apply branding options if provided
  onMount(() => {
    if (brandingOptions) {
      customizations = { ...customizations, ...brandingOptions };
    }
    updateConfig();
  });

  function updateConfig() {
    const config = generateChartConfig();
    chartConfig = config;
    onConfigChange(config);
    dispatch('configChanged', config);
  }

  function generateChartConfig() {
    const scheme = colorSchemes[customizations.colorScheme] || colorSchemes.default;
    
    return {
      colors: customizations.colorScheme === 'custom' ? 
        customizations.customColors : 
        scheme.colors,
      
      typography: {
        fontFamily: customizations.fontFamily,
        fontSize: customizations.fontSize,
        titleFontSize: customizations.titleFontSize,
        titleFontWeight: customizations.titleFontWeight
      },
      
      layout: {
        width: customizations.width,
        height: customizations.height,
        margin: customizations.margin,
        showGrid: customizations.showGrid,
        gridOpacity: customizations.gridOpacity,
        showLegend: customizations.showLegend,
        legendPosition: customizations.legendPosition
      },
      
      animation: {
        enabled: customizations.enableAnimations,
        duration: customizations.animationDuration
      },
      
      branding: {
        showLogo: customizations.showLogo,
        logoPosition: customizations.logoPosition,
        logoSize: customizations.logoSize,
        watermark: customizations.watermark
      },
      
      accessibility: {
        highContrast: customizations.highContrast,
        colorBlindFriendly: customizations.colorBlindFriendly,
        altText: customizations.altText
      },
      
      export: {
        backgroundColor: customizations.backgroundColor,
        format: customizations.exportFormat,
        dpi: customizations.exportDPI
      }
    };
  }

  function resetToDefaults() {
    customizations = {
      colorScheme: 'default',
      fontFamily: 'Segoe UI',
      fontSize: 12,
      titleFontSize: 16,
      titleFontWeight: 600,
      showGrid: true,
      gridOpacity: 0.3,
      showLegend: true,
      legendPosition: 'right',
      width: 800,
      height: 400,
      margin: { top: 60, right: 60, bottom: 80, left: 80 },
      enableAnimations: true,
      animationDuration: 750,
      showLogo: false,
      logoPosition: 'top-right',
      logoSize: 'small',
      watermark: '',
      highContrast: false,
      colorBlindFriendly: false,
      altText: '',
      backgroundColor: '#ffffff',
      exportFormat: 'png',
      exportDPI: 300
    };
    updateConfig();
  }

  function exportConfig() {
    const config = generateChartConfig();
    const dataStr = JSON.stringify(config, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'chart-customization.json';
    link.click();
    
    URL.revokeObjectURL(url);
  }

  function importConfig(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedConfig = JSON.parse(e.target.result);
        // Map imported config back to customizations
        customizations = {
          colorScheme: 'custom',
          customColors: importedConfig.colors || customizations.customColors,
          fontFamily: importedConfig.typography?.fontFamily || customizations.fontFamily,
          fontSize: importedConfig.typography?.fontSize || customizations.fontSize,
          titleFontSize: importedConfig.typography?.titleFontSize || customizations.titleFontSize,
          titleFontWeight: importedConfig.typography?.titleFontWeight || customizations.titleFontWeight,
          showGrid: importedConfig.layout?.showGrid ?? customizations.showGrid,
          gridOpacity: importedConfig.layout?.gridOpacity || customizations.gridOpacity,
          showLegend: importedConfig.layout?.showLegend ?? customizations.showLegend,
          legendPosition: importedConfig.layout?.legendPosition || customizations.legendPosition,
          width: importedConfig.layout?.width || customizations.width,
          height: importedConfig.layout?.height || customizations.height,
          margin: importedConfig.layout?.margin || customizations.margin,
          enableAnimations: importedConfig.animation?.enabled ?? customizations.enableAnimations,
          animationDuration: importedConfig.animation?.duration || customizations.animationDuration,
          showLogo: importedConfig.branding?.showLogo ?? customizations.showLogo,
          logoPosition: importedConfig.branding?.logoPosition || customizations.logoPosition,
          logoSize: importedConfig.branding?.logoSize || customizations.logoSize,
          watermark: importedConfig.branding?.watermark || customizations.watermark,
          highContrast: importedConfig.accessibility?.highContrast ?? customizations.highContrast,
          colorBlindFriendly: importedConfig.accessibility?.colorBlindFriendly ?? customizations.colorBlindFriendly,
          altText: importedConfig.accessibility?.altText || customizations.altText,
          backgroundColor: importedConfig.export?.backgroundColor || customizations.backgroundColor,
          exportFormat: importedConfig.export?.format || customizations.exportFormat,
          exportDPI: importedConfig.export?.dpi || customizations.exportDPI
        };
        updateConfig();
      } catch (error) {
        alert('Error importing configuration: ' + error.message);
      }
    };
    reader.readAsText(file);
  }

  // Reactive updates
  $: {
    updateConfig();
  }
</script>

<div class="chart-customization">
  <div class="customization-header">
    <h3>Chart Customization</h3>
    <div class="header-actions">
      <button class="action-button" on:click={resetToDefaults}>Reset to Defaults</button>
      <button class="action-button" on:click={exportConfig}>Export Config</button>
      <label class="file-input-label">
        Import Config
        <input type="file" accept=".json" on:change={importConfig} style="display: none;">
      </label>
    </div>
  </div>

  <div class="customization-tabs">
    <div class="tabs-nav">
      <button class="tab-button active" data-tab="colors">Colors</button>
      <button class="tab-button" data-tab="typography">Typography</button>
      <button class="tab-button" data-tab="layout">Layout</button>
      <button class="tab-button" data-tab="animation">Animation</button>
      <button class="tab-button" data-tab="branding">Branding</button>
      <button class="tab-button" data-tab="accessibility">Accessibility</button>
      <button class="tab-button" data-tab="export">Export</button>
    </div>

    <!-- Colors Tab -->
    <div class="tab-content active" data-tab="colors">
      <div class="section">
        <h4>Color Scheme</h4>
        <div class="color-schemes-grid">
          {#each Object.entries(colorSchemes) as [key, scheme]}
            <div 
              class="color-scheme-option" 
              class:selected={customizations.colorScheme === key}
              on:click={() => { customizations.colorScheme = key; }}
            >
              <div class="scheme-colors">
                {#each scheme.colors.slice(0, 5) as color}
                  <div class="color-swatch" style="background-color: {color}"></div>
                {/each}
              </div>
              <div class="scheme-name">{scheme.name}</div>
            </div>
          {/each}
        </div>

        {#if customizations.colorScheme === 'custom'}
          <div class="custom-colors-section">
            <h5>Custom Colors</h5>
            <div class="custom-colors-grid">
              {#each customizations.customColors as color, i}
                <div class="custom-color-input">
                  <input 
                    type="color" 
                    bind:value={customizations.customColors[i]}
                    id="color-{i}"
                  >
                  <label for="color-{i}">Color {i + 1}</label>
                </div>
              {/each}
            </div>
            <button class="add-color-button" on:click={() => customizations.customColors = [...customizations.customColors, '#333333']}>
              Add Color
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Typography Tab -->
    <div class="tab-content" data-tab="typography">
      <div class="section">
        <div class="form-group">
          <label>Font Family</label>
          <select bind:value={customizations.fontFamily}>
            {#each fontFamilies as font}
              <option value={font.value}>{font.label}</option>
            {/each}
          </select>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Base Font Size</label>
            <input type="range" min="8" max="20" bind:value={customizations.fontSize}>
            <span class="value-display">{customizations.fontSize}px</span>
          </div>

          <div class="form-group">
            <label>Title Font Size</label>
            <input type="range" min="12" max="32" bind:value={customizations.titleFontSize}>
            <span class="value-display">{customizations.titleFontSize}px</span>
          </div>
        </div>

        <div class="form-group">
          <label>Title Font Weight</label>
          <select bind:value={customizations.titleFontWeight}>
            <option value={400}>Normal</option>
            <option value={500}>Medium</option>
            <option value={600}>Semi-bold</option>
            <option value={700}>Bold</option>
          </select>
        </div>
      </div>
    </div>

    <!-- Layout Tab -->
    <div class="tab-content" data-tab="layout">
      <div class="section">
        <div class="form-row">
          <div class="form-group">
            <label>Width</label>
            <input type="number" min="200" max="1600" bind:value={customizations.width}>
          </div>

          <div class="form-group">
            <label>Height</label>
            <input type="number" min="150" max="1200" bind:value={customizations.height}>
          </div>
        </div>

        <div class="form-group">
          <label>Margins</label>
          <div class="margin-inputs">
            <input type="number" min="0" max="200" bind:value={customizations.margin.top} placeholder="Top">
            <input type="number" min="0" max="200" bind:value={customizations.margin.right} placeholder="Right">
            <input type="number" min="0" max="200" bind:value={customizations.margin.bottom} placeholder="Bottom">
            <input type="number" min="0" max="200" bind:value={customizations.margin.left} placeholder="Left">
          </div>
        </div>

        <div class="checkbox-group">
          <label>
            <input type="checkbox" bind:checked={customizations.showGrid}>
            Show Grid Lines
          </label>
        </div>

        {#if customizations.showGrid}
          <div class="form-group">
            <label>Grid Opacity</label>
            <input type="range" min="0.1" max="1" step="0.1" bind:value={customizations.gridOpacity}>
            <span class="value-display">{customizations.gridOpacity}</span>
          </div>
        {/if}

        <div class="checkbox-group">
          <label>
            <input type="checkbox" bind:checked={customizations.showLegend}>
            Show Legend
          </label>
        </div>

        {#if customizations.showLegend}
          <div class="form-group">
            <label>Legend Position</label>
            <select bind:value={customizations.legendPosition}>
              <option value="right">Right</option>
              <option value="left">Left</option>
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        {/if}
      </div>
    </div>

    <!-- Animation Tab -->
    <div class="tab-content" data-tab="animation">
      <div class="section">
        <div class="checkbox-group">
          <label>
            <input type="checkbox" bind:checked={customizations.enableAnimations}>
            Enable Animations
          </label>
        </div>

        {#if customizations.enableAnimations}
          <div class="form-group">
            <label>Animation Duration</label>
            <input type="range" min="100" max="2000" step="100" bind:value={customizations.animationDuration}>
            <span class="value-display">{customizations.animationDuration}ms</span>
          </div>
        {/if}
      </div>
    </div>

    <!-- Branding Tab -->
    <div class="tab-content" data-tab="branding">
      <div class="section">
        <div class="checkbox-group">
          <label>
            <input type="checkbox" bind:checked={customizations.showLogo}>
            Show Logo
          </label>
        </div>

        {#if customizations.showLogo}
          <div class="form-row">
            <div class="form-group">
              <label>Logo Position</label>
              <select bind:value={customizations.logoPosition}>
                <option value="top-left">Top Left</option>
                <option value="top-right">Top Right</option>
                <option value="bottom-left">Bottom Left</option>
                <option value="bottom-right">Bottom Right</option>
              </select>
            </div>

            <div class="form-group">
              <label>Logo Size</label>
              <select bind:value={customizations.logoSize}>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        {/if}

        <div class="form-group">
          <label>Watermark Text</label>
          <input type="text" bind:value={customizations.watermark} placeholder="Optional watermark text">
        </div>
      </div>
    </div>

    <!-- Accessibility Tab -->
    <div class="tab-content" data-tab="accessibility">
      <div class="section">
        <div class="checkbox-group">
          <label>
            <input 
              type="checkbox" 
              bind:checked={customizations.highContrast}
              on:change={() => {
                if (customizations.highContrast) {
                  customizations.colorScheme = 'highContrast';
                }
              }}
            >
            High Contrast Mode
          </label>
        </div>

        <div class="checkbox-group">
          <label>
            <input 
              type="checkbox" 
              bind:checked={customizations.colorBlindFriendly}
              on:change={() => {
                if (customizations.colorBlindFriendly) {
                  customizations.colorScheme = 'colorBlindFriendly';
                }
              }}
            >
            Colorblind Friendly Colors
          </label>
        </div>

        <div class="form-group">
          <label>Alt Text Description</label>
          <textarea 
            bind:value={customizations.altText} 
            placeholder="Describe the chart for screen readers and alt text accessibility..."
            rows="3"
          ></textarea>
          <small>This alt text will be used for screen reader accessibility and chart descriptions.</small>
        </div>
      </div>
    </div>

    <!-- Export Tab -->
    <div class="tab-content" data-tab="export">
      <div class="section">
        <div class="form-group">
          <label>Background Color</label>
          <input type="color" bind:value={customizations.backgroundColor}>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Export Format</label>
            <select bind:value={customizations.exportFormat}>
              <option value="png">PNG</option>
              <option value="jpg">JPG</option>
              <option value="svg">SVG</option>
              <option value="pdf">PDF</option>
            </select>
          </div>

          <div class="form-group">
            <label>Export DPI</label>
            <select bind:value={customizations.exportDPI}>
              <option value={72}>72 DPI (Web)</option>
              <option value={150}>150 DPI (Medium)</option>
              <option value={300}>300 DPI (Print)</option>
              <option value={600}>600 DPI (High Quality)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>

<style>
  .chart-customization {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 20px 0;
  }

  .customization-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 25px;
    padding-bottom: 15px;
    border-bottom: 2px solid #ecf0f1;
    flex-wrap: wrap;
    gap: 15px;
  }

  .customization-header h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }

  .header-actions {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .action-button, .file-input-label {
    padding: 8px 16px;
    border: 1px solid #3498db;
    background: white;
    color: #3498db;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    text-decoration: none;
  }

  .action-button:hover, .file-input-label:hover {
    background: #3498db;
    color: white;
  }

  .tabs-nav {
    display: flex;
    gap: 2px;
    margin-bottom: 20px;
    border-bottom: 1px solid #ecf0f1;
    flex-wrap: wrap;
  }

  .tab-button {
    padding: 12px 20px;
    border: none;
    background: #f8f9fa;
    color: #7f8c8d;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    border-radius: 6px 6px 0 0;
    transition: all 0.3s ease;
  }

  .tab-button:hover {
    background: #e9ecef;
    color: #2c3e50;
  }

  .tab-button.active {
    background: white;
    color: #2c3e50;
    border-bottom: 2px solid #3498db;
  }

  .tab-content {
    display: none;
    padding: 20px 0;
  }

  .tab-content.active {
    display: block;
  }

  .section {
    margin-bottom: 25px;
  }

  .section h4 {
    margin-top: 0;
    margin-bottom: 15px;
    color: #2c3e50;
    font-size: 18px;
    font-weight: 600;
  }

  .section h5 {
    margin-top: 15px;
    margin-bottom: 10px;
    color: #2c3e50;
    font-size: 16px;
    font-weight: 500;
  }

  .color-schemes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
  }

  .color-scheme-option {
    border: 2px solid #ecf0f1;
    border-radius: 6px;
    padding: 15px;
    cursor: pointer;
    transition: all 0.3s ease;
    text-align: center;
  }

  .color-scheme-option:hover {
    border-color: #3498db;
  }

  .color-scheme-option.selected {
    border-color: #3498db;
    background: #f8f9fa;
  }

  .scheme-colors {
    display: flex;
    justify-content: center;
    gap: 4px;
    margin-bottom: 10px;
  }

  .color-swatch {
    width: 20px;
    height: 20px;
    border-radius: 3px;
    border: 1px solid #ddd;
  }

  .scheme-name {
    font-size: 12px;
    color: #2c3e50;
    font-weight: 500;
  }

  .custom-colors-section {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 6px;
    margin-top: 20px;
  }

  .custom-colors-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
    gap: 15px;
    margin-bottom: 15px;
  }

  .custom-color-input {
    text-align: center;
  }

  .custom-color-input input[type="color"] {
    width: 50px;
    height: 50px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    margin-bottom: 5px;
  }

  .custom-color-input label {
    display: block;
    font-size: 12px;
    color: #7f8c8d;
  }

  .add-color-button {
    padding: 8px 16px;
    border: 1px dashed #3498db;
    background: white;
    color: #3498db;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
  }

  .add-color-button:hover {
    background: #f8f9fa;
  }

  .form-group {
    margin-bottom: 15px;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .form-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
    color: #2c3e50;
    font-size: 14px;
  }

  .form-group input[type="text"],
  .form-group input[type="number"],
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 8px 12px;
    border: 2px solid #ecf0f1;
    border-radius: 4px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .form-group input[type="range"] {
    width: calc(100% - 60px);
    margin-right: 10px;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
    outline: none;
    border-color: #3498db;
  }

  .value-display {
    font-size: 12px;
    color: #7f8c8d;
    font-weight: 500;
    min-width: 50px;
    display: inline-block;
  }

  .margin-inputs {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
  }

  .checkbox-group {
    margin-bottom: 15px;
  }

  .checkbox-group label {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 500;
    color: #2c3e50;
    cursor: pointer;
  }

  .checkbox-group input[type="checkbox"] {
    width: 16px;
    height: 16px;
  }

  /* Responsive Design */
  @media (max-width: 768px) {
    .chart-customization {
      padding: 15px;
    }

    .customization-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .tabs-nav {
      flex-direction: column;
    }

    .tab-button {
      border-radius: 4px;
      margin-bottom: 2px;
    }

    .form-row {
      grid-template-columns: 1fr;
      gap: 15px;
    }

    .color-schemes-grid {
      grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
      gap: 10px;
    }

    .custom-colors-grid {
      grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
    }

    .margin-inputs {
      grid-template-columns: repeat(2, 1fr);
    }
  }
</style>

<script>
  // Tab functionality
  function initializeTabs() {
    const tabButtons = document.querySelectorAll('.tab-button');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        // Remove active class from all buttons and contents
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));

        // Add active class to clicked button
        button.classList.add('active');

        // Show corresponding content
        const tabId = button.getAttribute('data-tab');
        const targetContent = document.querySelector(`[data-tab="${tabId}"].tab-content`);
        if (targetContent) {
          targetContent.classList.add('active');
        }
      });
    });
  }

  // Initialize tabs on mount
  onMount(() => {
    initializeTabs();
  });
</script>