<script>
  export let notebookUrl = "";
  export let cellNames = [];
  export let data = {};
  export let title = "Observable Notebook";
  export let height = 500;
  export let responsive = true;

  import { onMount } from 'svelte';
  import { Runtime, Inspector } from '@observablehq/runtime';

  let container;
  let notebook;
  let runtime;
  let main;

  onMount(async () => {
    if (!notebookUrl) {
      container.innerHTML = '<div class="error-message">No notebook URL provided</div>';
      return;
    }

    try {
      // Load Observable runtime
      runtime = new Runtime();
      
      // Dynamically import the notebook
      const notebookModule = await import(notebookUrl);
      main = runtime.module(notebookModule.default, Inspector.into(container));

      // If specific cells are requested, only render those
      if (cellNames.length > 0) {
        cellNames.forEach(cellName => {
          const cellContainer = document.createElement('div');
          cellContainer.className = 'observable-cell';
          container.appendChild(cellContainer);
          main.variable(Inspector.into(cellContainer)).define(cellName);
        });
      }

      // Pass data to the notebook if provided
      if (Object.keys(data).length > 0) {
        Object.entries(data).forEach(([key, value]) => {
          main.variable().define(key, value);
        });
      }

    } catch (error) {
      console.error('Error loading Observable notebook:', error);
      container.innerHTML = `
        <div class="error-message">
          <h4>Unable to load Observable notebook</h4>
          <p>Error: ${error.message}</p>
          <p>Please check the notebook URL: <code>${notebookUrl}</code></p>
        </div>
      `;
    }
  });

  // Cleanup function
  function cleanup() {
    if (runtime) {
      runtime.dispose();
    }
  }

  import { onDestroy } from 'svelte';
  onDestroy(cleanup);
</script>

<div class="observable-notebook-container">
  <div class="notebook-header">
    <h3>{title}</h3>
    {#if notebookUrl}
      <a href={notebookUrl} target="_blank" rel="noopener noreferrer" class="notebook-link">
        View on Observable →
      </a>
    {/if}
  </div>

  <div 
    class="notebook-content" 
    bind:this={container}
    style="height: {height}px; {responsive ? 'width: 100%;' : ''}"
  >
    <!-- Observable notebook cells will be inserted here -->
  </div>

  <div class="notebook-footer">
    <span class="notebook-info">
      Powered by <a href="https://observablehq.com" target="_blank">Observable</a>
    </span>
  </div>
</div>

<style>
  .observable-notebook-container {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 20px 0;
  }

  .notebook-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #ecf0f1;
  }

  .notebook-header h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }

  .notebook-link {
    color: #3498db;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
  }

  .notebook-link:hover {
    color: #2980b9;
    text-decoration: underline;
  }

  .notebook-content {
    overflow: auto;
    border: 1px solid #ecf0f1;
    border-radius: 4px;
    padding: 15px;
    background: #fafbfc;
  }

  :global(.observable-cell) {
    margin-bottom: 20px;
    padding: 15px;
    background: white;
    border-radius: 4px;
    border: 1px solid #e1e8ed;
  }

  :global(.observable-cell:last-child) {
    margin-bottom: 0;
  }

  .notebook-footer {
    margin-top: 15px;
    text-align: center;
    font-size: 12px;
    color: #7f8c8d;
  }

  .notebook-footer a {
    color: #3498db;
    text-decoration: none;
  }

  .notebook-footer a:hover {
    text-decoration: underline;
  }

  .error-message {
    text-align: center;
    color: #e74c3c;
    padding: 40px 20px;
  }

  .error-message h4 {
    margin-top: 0;
    font-size: 18px;
  }

  .error-message p {
    margin: 10px 0;
  }

  .error-message code {
    background: #f1f2f6;
    padding: 2px 6px;
    border-radius: 3px;
    font-family: 'Monaco', 'Menlo', monospace;
    font-size: 12px;
  }

  @media (max-width: 768px) {
    .observable-notebook-container {
      padding: 15px;
      display: grid;
      grid-template-columns: 1fr;
    }

    .notebook-header {
      flex-direction: column;
      align-items: flex-start;
      gap: 10px;
    }

    .notebook-content {
      height: 400px !important;
    }
  }
</style>