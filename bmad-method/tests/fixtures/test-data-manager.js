/**
 * Test Data Management System
 * Manages test data fixtures, cleanup, and isolation mechanisms
 */

const path = require('path');
const fs = require('fs-extra');
const crypto = require('crypto');

class TestDataManager {
  constructor(options = {}) {
    this.testSuiteId = options.testSuiteId || crypto.randomBytes(4).toString('hex');
    this.fixturesDir = options.fixturesDir || path.join(__dirname);
    this.tempDir = path.join(this.fixturesDir, 'temp', this.testSuiteId);
    this.cleanup = options.cleanup !== false;
    this.isolate = options.isolate !== false;
    this.managedFiles = [];
    this.managedDirs = [];
  }

  /**
   * Initialize test data manager
   */
  async initialize() {
    if (this.isolate) {
      await fs.ensureDir(this.tempDir);
      this.managedDirs.push(this.tempDir);
    }
    
    return {
      testSuiteId: this.testSuiteId,
      tempDir: this.tempDir,
      isolated: this.isolate
    };
  }

  /**
   * Create sample user data
   */
  async createUserData(count = 100, format = 'json') {
    const users = [];
    const domains = ['example.com', 'test.org', 'demo.net', 'sample.io'];
    const firstNames = ['Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry', 'Iris', 'Jack'];
    const lastNames = ['Smith', 'Johnson', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas'];

    for (let i = 1; i <= count; i++) {
      const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
      const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
      const domain = domains[Math.floor(Math.random() * domains.length)];
      
      users.push({
        id: i,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@${domain}`,
        age: Math.floor(Math.random() * 50) + 18, // 18-67 years old
        city: ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'][Math.floor(Math.random() * 5)],
        active: Math.random() > 0.1, // 90% active
        created_at: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        last_login: Math.random() > 0.2 ? new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)).toISOString() : null
      });
    }

    return this._saveTestData('users', users, format);
  }

  /**
   * Create sample order data
   */
  async createOrderData(userCount = 100, avgOrdersPerUser = 3, format = 'json') {
    const orders = [];
    const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
    const products = [
      { name: 'Laptop Pro', price: 1299.99 },
      { name: 'Wireless Mouse', price: 29.99 },
      { name: 'Bluetooth Keyboard', price: 79.99 },
      { name: 'Monitor 27"', price: 399.99 },
      { name: 'Webcam HD', price: 89.99 },
      { name: 'Headphones', price: 149.99 },
      { name: 'Phone Case', price: 19.99 },
      { name: 'Charging Cable', price: 24.99 }
    ];

    let orderId = 1;
    
    for (let userId = 1; userId <= userCount; userId++) {
      const numOrders = Math.floor(Math.random() * (avgOrdersPerUser * 2)) + 1; // 1 to avgOrdersPerUser*2
      
      for (let i = 0; i < numOrders; i++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 3) + 1; // 1-3 items
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        
        orders.push({
          id: orderId++,
          user_id: userId,
          product_name: product.name,
          unit_price: product.price,
          quantity: quantity,
          total_amount: Math.round(product.price * quantity * 100) / 100,
          status: status,
          order_date: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
          shipped_date: status === 'shipped' || status === 'delivered' ? 
            new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString() : null,
          tracking_number: status === 'shipped' || status === 'delivered' ? 
            `TRK${Math.random().toString(36).substr(2, 9).toUpperCase()}` : null
        });
      }
    }

    return this._saveTestData('orders', orders, format);
  }

  /**
   * Create sample product catalog data
   */
  async createProductData(count = 50, format = 'json') {
    const categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports', 'Toys', 'Beauty', 'Automotive'];
    const brands = ['TechCorp', 'StyleBrand', 'HomeLife', 'SportsPro', 'BeautyPlus', 'AutoMax', 'BookWorld', 'ToyLand'];
    const products = [];

    for (let i = 1; i <= count; i++) {
      const category = categories[Math.floor(Math.random() * categories.length)];
      const brand = brands[Math.floor(Math.random() * brands.length)];
      const price = Math.round((Math.random() * 500 + 10) * 100) / 100; // $10-$510

      products.push({
        id: i,
        name: `${brand} Product ${i}`,
        description: `High-quality ${category.toLowerCase()} product from ${brand}`,
        category: category,
        brand: brand,
        price: price,
        cost: Math.round(price * 0.6 * 100) / 100, // 60% of price
        sku: `SKU${i.toString().padStart(6, '0')}`,
        barcode: `${Math.random().toString().substr(2, 12)}`,
        weight_kg: Math.round((Math.random() * 5 + 0.1) * 100) / 100, // 0.1-5.1 kg
        dimensions_cm: {
          length: Math.floor(Math.random() * 50) + 5,
          width: Math.floor(Math.random() * 30) + 5,
          height: Math.floor(Math.random() * 20) + 2
        },
        in_stock: Math.random() > 0.05, // 95% in stock
        stock_quantity: Math.floor(Math.random() * 1000),
        supplier_id: Math.floor(Math.random() * 20) + 1,
        created_at: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        updated_at: new Date(2023, Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString()
      });
    }

    return this._saveTestData('products', products, format);
  }

  /**
   * Create sample analytics events data
   */
  async createAnalyticsData(count = 1000, format = 'json') {
    const events = [];
    const eventTypes = ['page_view', 'click', 'purchase', 'search', 'signup', 'login', 'logout', 'download'];
    const pages = ['/home', '/products', '/about', '/contact', '/blog', '/help', '/pricing', '/features'];
    const devices = ['desktop', 'mobile', 'tablet'];
    const browsers = ['chrome', 'firefox', 'safari', 'edge'];
    const countries = ['US', 'CA', 'GB', 'DE', 'FR', 'AU', 'JP', 'BR'];

    for (let i = 1; i <= count; i++) {
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
      const timestamp = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)); // Last 30 days

      events.push({
        id: i,
        event_type: eventType,
        user_id: Math.floor(Math.random() * 100) + 1, // 1-100
        session_id: `sess_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: timestamp.toISOString(),
        page_url: pages[Math.floor(Math.random() * pages.length)],
        referrer: Math.random() > 0.3 ? `https://example.com${pages[Math.floor(Math.random() * pages.length)]}` : null,
        user_agent: `Mozilla/5.0 (${devices[Math.floor(Math.random() * devices.length)]})`,
        device_type: devices[Math.floor(Math.random() * devices.length)],
        browser: browsers[Math.floor(Math.random() * browsers.length)],
        ip_address: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country: countries[Math.floor(Math.random() * countries.length)],
        duration_seconds: eventType === 'page_view' ? Math.floor(Math.random() * 300) + 5 : null, // 5-305 seconds
        value: eventType === 'purchase' ? Math.round((Math.random() * 500 + 10) * 100) / 100 : null, // $10-$510
        properties: {
          campaign: Math.random() > 0.7 ? `campaign_${Math.floor(Math.random() * 5) + 1}` : null,
          source: Math.random() > 0.5 ? ['google', 'facebook', 'twitter', 'email'][Math.floor(Math.random() * 4)] : 'direct'
        }
      });
    }

    return this._saveTestData('analytics_events', events, format);
  }

  /**
   * Create mock external service responses
   */
  async createMockServiceResponses() {
    const responses = {
      // API Gateway responses
      api_gateway: {
        success: {
          status: 200,
          data: { message: 'Success', timestamp: new Date().toISOString() },
          headers: { 'content-type': 'application/json' }
        },
        error: {
          status: 500,
          data: { error: 'Internal Server Error', code: 'INTERNAL_ERROR' },
          headers: { 'content-type': 'application/json' }
        },
        unauthorized: {
          status: 401,
          data: { error: 'Unauthorized', code: 'AUTH_ERROR' },
          headers: { 'content-type': 'application/json' }
        }
      },

      // Database responses
      database: {
        connection_success: {
          status: 'connected',
          connection_id: 'conn_12345',
          server_version: '13.7',
          timestamp: new Date().toISOString()
        },
        connection_error: {
          status: 'error',
          error_code: 'CONNECTION_REFUSED',
          message: 'Could not connect to database server',
          timestamp: new Date().toISOString()
        },
        query_result: {
          status: 'success',
          rows: 42,
          execution_time_ms: 125,
          query_hash: 'hash_67890'
        }
      },

      // File storage responses
      file_storage: {
        upload_success: {
          status: 'uploaded',
          file_id: 'file_abc123',
          size_bytes: 2048576,
          url: 'https://storage.example.com/files/file_abc123',
          checksum: 'sha256:abcdef123456'
        },
        download_success: {
          status: 'downloaded',
          size_bytes: 2048576,
          content_type: 'application/json',
          last_modified: new Date().toISOString()
        }
      },

      // Email service responses
      email_service: {
        send_success: {
          status: 'sent',
          message_id: 'msg_xyz789',
          recipients: ['user@example.com'],
          timestamp: new Date().toISOString()
        },
        send_error: {
          status: 'failed',
          error_code: 'INVALID_RECIPIENT',
          message: 'Invalid email address',
          timestamp: new Date().toISOString()
        }
      }
    };

    const filePath = this._getFilePath('mock_service_responses', 'json');
    await fs.writeJson(filePath, responses, { spaces: 2 });
    this.managedFiles.push(filePath);

    return filePath;
  }

  /**
   * Create data quality validation datasets
   */
  async createDataQualityTestSets() {
    const testSets = {
      // Clean data - no issues
      clean_data: {
        description: 'High-quality data with no issues',
        data: [
          { id: 1, name: 'John Doe', email: 'john.doe@example.com', age: 30, salary: 50000 },
          { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', age: 28, salary: 55000 },
          { id: 3, name: 'Bob Johnson', email: 'bob.johnson@example.com', age: 35, salary: 60000 }
        ],
        quality_score: 1.0,
        issues: []
      },

      // Data with missing values
      missing_values: {
        description: 'Data with various missing values',
        data: [
          { id: 1, name: 'John Doe', email: 'john.doe@example.com', age: null, salary: 50000 },
          { id: 2, name: '', email: 'jane.smith@example.com', age: 28, salary: 55000 },
          { id: 3, name: 'Bob Johnson', email: null, age: 35, salary: null }
        ],
        quality_score: 0.6,
        issues: ['missing_age', 'missing_name', 'missing_email', 'missing_salary']
      },

      // Data with duplicates
      duplicate_data: {
        description: 'Data with duplicate records',
        data: [
          { id: 1, name: 'John Doe', email: 'john.doe@example.com', age: 30, salary: 50000 },
          { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', age: 28, salary: 55000 },
          { id: 1, name: 'John Doe', email: 'john.doe@example.com', age: 30, salary: 50000 } // Duplicate
        ],
        quality_score: 0.7,
        issues: ['duplicate_ids', 'duplicate_records']
      },

      // Data with format issues
      format_issues: {
        description: 'Data with format and validation issues',
        data: [
          { id: 'abc', name: 'John Doe', email: 'invalid-email', age: -5, salary: 50000 },
          { id: 2, name: 'Jane Smith', email: 'jane.smith@example.com', age: 150, salary: -1000 },
          { id: 3, name: 'Bob123', email: 'bob@', age: 35, salary: 'not_a_number' }
        ],
        quality_score: 0.3,
        issues: ['invalid_id_format', 'invalid_email_format', 'invalid_age_range', 'invalid_salary_format', 'invalid_name_characters']
      },

      // Large dataset for performance testing
      large_dataset: {
        description: 'Large dataset for performance testing',
        data: this._generateLargeDataset(10000),
        quality_score: 0.95,
        issues: ['occasional_missing_values']
      }
    };

    const filePath = this._getFilePath('data_quality_test_sets', 'json');
    await fs.writeJson(filePath, testSets, { spaces: 2 });
    this.managedFiles.push(filePath);

    return filePath;
  }

  /**
   * Load test data by name
   */
  async loadTestData(dataName, format = 'json') {
    const filePath = this._getFilePath(dataName, format);
    
    if (!(await fs.pathExists(filePath))) {
      throw new Error(`Test data file not found: ${filePath}`);
    }

    if (format === 'json') {
      return fs.readJson(filePath);
    } else if (format === 'csv') {
      return fs.readFile(filePath, 'utf8');
    } else {
      return fs.readFile(filePath, 'utf8');
    }
  }

  /**
   * Get test data file paths
   */
  getTestDataPaths() {
    return {
      managedFiles: [...this.managedFiles],
      managedDirs: [...this.managedDirs],
      tempDir: this.tempDir,
      fixturesDir: this.fixturesDir
    };
  }

  /**
   * Clean up all managed test data
   */
  async cleanup() {
    if (!this.cleanup) return;

    // Remove managed files
    for (const file of this.managedFiles) {
      try {
        await fs.remove(file);
      } catch (error) {
        console.warn(`Failed to remove test file ${file}:`, error.message);
      }
    }

    // Remove managed directories
    for (const dir of this.managedDirs) {
      try {
        await fs.remove(dir);
      } catch (error) {
        console.warn(`Failed to remove test directory ${dir}:`, error.message);
      }
    }

    this.managedFiles = [];
    this.managedDirs = [];
  }

  /**
   * Private helper methods
   */
  async _saveTestData(name, data, format) {
    const filePath = this._getFilePath(name, format);
    
    await fs.ensureDir(path.dirname(filePath));

    if (format === 'json') {
      await fs.writeJson(filePath, data, { spaces: 2 });
    } else if (format === 'csv') {
      const csvContent = this._convertToCSV(data);
      await fs.writeFile(filePath, csvContent, 'utf8');
    } else {
      throw new Error(`Unsupported format: ${format}`);
    }

    this.managedFiles.push(filePath);
    return filePath;
  }

  _getFilePath(name, format) {
    const fileName = `${name}_${this.testSuiteId}.${format}`;
    return this.isolate ? 
      path.join(this.tempDir, fileName) : 
      path.join(this.fixturesDir, fileName);
  }

  _convertToCSV(data) {
    if (!Array.isArray(data) || data.length === 0) {
      return '';
    }

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const csvRow = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return '';
        }
        const stringValue = String(value);
        return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
      }).join(',');
      csvRows.push(csvRow);
    }

    return csvRows.join('\n');
  }

  _generateLargeDataset(count) {
    const data = [];
    for (let i = 1; i <= count; i++) {
      data.push({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
        age: Math.floor(Math.random() * 50) + 18,
        salary: Math.floor(Math.random() * 100000) + 30000,
        department: ['Engineering', 'Sales', 'Marketing', 'HR', 'Finance'][Math.floor(Math.random() * 5)],
        created_at: new Date(Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)).toISOString()
      });
    }
    return data;
  }
}

module.exports = TestDataManager;