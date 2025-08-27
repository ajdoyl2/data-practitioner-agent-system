<script>
  export let data = [];
  export let title = "";
  export let columns = [];
  export let sortable = true;
  export let filterable = true;
  export let paginated = true;
  export let pageSize = 10;
  export let mobileBreakpoint = 768;

  import { writable } from 'svelte/store';
  import { onMount } from 'svelte';

  let sortColumn = '';
  let sortDirection = 'asc';
  let filterText = '';
  let currentPage = 1;
  let isMobile = false;
  let container;

  // Auto-generate columns if not provided
  $: if (columns.length === 0 && data.length > 0) {
    columns = Object.keys(data[0]).map(key => ({
      key,
      label: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      type: typeof data[0][key] === 'number' ? 'number' : 'text',
      format: typeof data[0][key] === 'number' ? (val) => val?.toLocaleString() : (val) => val
    }));
  }

  // Filtered and sorted data
  $: filteredData = data.filter(row => 
    !filterText || Object.values(row).some(value => 
      String(value).toLowerCase().includes(filterText.toLowerCase())
    )
  );

  $: sortedData = sortColumn ? 
    [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn];
      const bVal = b[sortColumn];
      const multiplier = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return (aVal - bVal) * multiplier;
      }
      
      return String(aVal).localeCompare(String(bVal)) * multiplier;
    }) : filteredData;

  // Paginated data
  $: totalPages = Math.ceil(sortedData.length / pageSize);
  $: paginatedData = paginated ? 
    sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize) : 
    sortedData;

  function handleSort(column) {
    if (!sortable) return;
    
    if (sortColumn === column) {
      sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      sortColumn = column;
      sortDirection = 'asc';
    }
  }

  function handlePageChange(page) {
    currentPage = Math.max(1, Math.min(page, totalPages));
  }

  function checkMobile() {
    if (typeof window !== 'undefined') {
      isMobile = window.innerWidth < mobileBreakpoint;
    }
  }

  onMount(() => {
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  });
</script>

<div class="responsive-data-table" bind:this={container}>
  {#if title}
    <div class="table-header">
      <h3>{title}</h3>
      <div class="table-info">
        Showing {paginatedData.length} of {sortedData.length} records
      </div>
    </div>
  {/if}

  {#if filterable}
    <div class="table-controls">
      <div class="search-container">
        <input 
          type="text" 
          placeholder="Search all columns..." 
          bind:value={filterText}
          class="search-input"
        >
        <span class="search-icon">🔍</span>
      </div>
    </div>
  {/if}

  {#if isMobile}
    <!-- Mobile Card View -->
    <div class="mobile-card-container">
      {#each paginatedData as row, index}
        <div class="mobile-card">
          <div class="card-header">
            <span class="card-index">#{(currentPage - 1) * pageSize + index + 1}</span>
          </div>
          <div class="card-body">
            {#each columns as column}
              <div class="card-row">
                <div class="card-label">{column.label}:</div>
                <div class="card-value" class:number={column.type === 'number'}>
                  {column.format ? column.format(row[column.key]) : row[column.key]}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Desktop Table View -->
    <div class="table-container">
      <table class="data-table">
        <thead>
          <tr>
            {#each columns as column}
              <th 
                class:sortable={sortable}
                class:sorted={sortColumn === column.key}
                class:asc={sortColumn === column.key && sortDirection === 'asc'}
                class:desc={sortColumn === column.key && sortDirection === 'desc'}
                on:click={() => handleSort(column.key)}
              >
                {column.label}
                {#if sortable}
                  <span class="sort-indicator">
                    {sortColumn === column.key ? 
                      (sortDirection === 'asc' ? '↑' : '↓') : 
                      '↕'}
                  </span>
                {/if}
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each paginatedData as row}
            <tr>
              {#each columns as column}
                <td class:number={column.type === 'number'}>
                  {column.format ? column.format(row[column.key]) : row[column.key]}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}

  {#if paginated && totalPages > 1}
    <div class="pagination">
      <button 
        class="pagination-button" 
        disabled={currentPage === 1}
        on:click={() => handlePageChange(1)}
      >
        First
      </button>
      
      <button 
        class="pagination-button" 
        disabled={currentPage === 1}
        on:click={() => handlePageChange(currentPage - 1)}
      >
        Previous
      </button>

      <div class="pagination-info">
        Page {currentPage} of {totalPages}
      </div>

      <button 
        class="pagination-button" 
        disabled={currentPage === totalPages}
        on:click={() => handlePageChange(currentPage + 1)}
      >
        Next
      </button>

      <button 
        class="pagination-button" 
        disabled={currentPage === totalPages}
        on:click={() => handlePageChange(totalPages)}
      >
        Last
      </button>
    </div>
  {/if}
</div>

<style>
  .responsive-data-table {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: white;
    border-radius: 8px;
    padding: 20px;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin: 20px 0;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 2px solid #ecf0f1;
    flex-wrap: wrap;
    gap: 10px;
  }

  .table-header h3 {
    margin: 0;
    color: #2c3e50;
    font-weight: 600;
  }

  .table-info {
    font-size: 14px;
    color: #7f8c8d;
  }

  .table-controls {
    margin-bottom: 20px;
  }

  .search-container {
    position: relative;
    max-width: 300px;
  }

  .search-input {
    width: 100%;
    padding: 10px 40px 10px 15px;
    border: 2px solid #ecf0f1;
    border-radius: 6px;
    font-size: 14px;
    transition: border-color 0.3s ease;
  }

  .search-input:focus {
    outline: none;
    border-color: #3498db;
  }

  .search-icon {
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: #7f8c8d;
  }

  /* Desktop Table Styles */
  .table-container {
    overflow-x: auto;
    border: 1px solid #ecf0f1;
    border-radius: 6px;
  }

  .data-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
  }

  .data-table th {
    background: #f8f9fa;
    padding: 12px 15px;
    text-align: left;
    font-weight: 600;
    color: #2c3e50;
    border-bottom: 2px solid #ecf0f1;
    white-space: nowrap;
  }

  .data-table th.sortable {
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  .data-table th.sortable:hover {
    background: #e9ecef;
  }

  .sort-indicator {
    margin-left: 5px;
    color: #7f8c8d;
    font-size: 12px;
  }

  .data-table th.sorted .sort-indicator {
    color: #3498db;
  }

  .data-table td {
    padding: 12px 15px;
    border-bottom: 1px solid #ecf0f1;
    color: #2c3e50;
  }

  .data-table td.number {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }

  .data-table tbody tr:hover {
    background: #f8f9fa;
  }

  /* Mobile Card Styles */
  .mobile-card-container {
    display: grid;
    gap: 15px;
  }

  .mobile-card {
    border: 1px solid #ecf0f1;
    border-radius: 6px;
    overflow: hidden;
  }

  .card-header {
    background: #f8f9fa;
    padding: 10px 15px;
    border-bottom: 1px solid #ecf0f1;
  }

  .card-index {
    font-weight: 600;
    color: #7f8c8d;
    font-size: 12px;
  }

  .card-body {
    padding: 15px;
  }

  .card-row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 10px;
    align-items: center;
  }

  .card-row:last-child {
    margin-bottom: 0;
  }

  .card-label {
    font-weight: 500;
    color: #7f8c8d;
    font-size: 13px;
    flex: 0 0 40%;
  }

  .card-value {
    color: #2c3e50;
    font-size: 14px;
    text-align: right;
    flex: 1;
  }

  .card-value.number {
    font-variant-numeric: tabular-nums;
  }

  /* Pagination Styles */
  .pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
    padding-top: 20px;
    border-top: 1px solid #ecf0f1;
    flex-wrap: wrap;
  }

  .pagination-button {
    padding: 8px 16px;
    border: 1px solid #ecf0f1;
    background: white;
    color: #2c3e50;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
  }

  .pagination-button:hover:not(:disabled) {
    background: #f8f9fa;
    border-color: #3498db;
  }

  .pagination-button:disabled {
    background: #f8f9fa;
    color: #bdc3c7;
    cursor: not-allowed;
  }

  .pagination-info {
    font-size: 14px;
    color: #7f8c8d;
    margin: 0 10px;
  }

  /* Responsive Adjustments */
  @media (max-width: 768px) {
    .responsive-data-table {
      padding: 15px;
    }

    .table-header {
      flex-direction: column;
      align-items: flex-start;
    }

    .search-container {
      max-width: 100%;
    }

    .pagination {
      flex-wrap: wrap;
      gap: 5px;
    }

    .pagination-button {
      padding: 6px 12px;
      font-size: 13px;
    }
  }
</style>