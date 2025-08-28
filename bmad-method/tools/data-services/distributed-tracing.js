/**
 * Distributed Tracing for Data Pipeline
 * Provides end-to-end tracing across all data pipeline components
 * Enables debugging and performance analysis of complex workflows
 */

const fs = require('fs-extra');
const path = require('path');
const crypto = require('crypto');
const { system } = require('./monitoring-logger');

/**
 * Trace context for correlation across components
 */
class TraceContext {
  constructor(traceId = null, spanId = null, parentSpanId = null) {
    this.traceId = traceId || this.generateTraceId();
    this.spanId = spanId || this.generateSpanId();
    this.parentSpanId = parentSpanId;
    this.baggage = new Map(); // Additional metadata to carry across spans
  }
  
  /**
   * Generate unique trace ID
   */
  generateTraceId() {
    return crypto.randomBytes(16).toString('hex');
  }
  
  /**
   * Generate unique span ID
   */
  generateSpanId() {
    return crypto.randomBytes(8).toString('hex');
  }
  
  /**
   * Create child context
   */
  createChild() {
    const childContext = new TraceContext(this.traceId, null, this.spanId);
    // Copy baggage to child
    for (const [key, value] of this.baggage.entries()) {
      childContext.baggage.set(key, value);
    }
    return childContext;
  }
  
  /**
   * Set baggage item
   */
  setBaggage(key, value) {
    this.baggage.set(key, value);
  }
  
  /**
   * Get baggage item
   */
  getBaggage(key) {
    return this.baggage.get(key);
  }
  
  /**
   * Convert to header format for HTTP propagation
   */
  toHeaders() {
    return {
      'x-trace-id': this.traceId,
      'x-span-id': this.spanId,
      'x-parent-span-id': this.parentSpanId || '',
      'x-baggage': JSON.stringify(Object.fromEntries(this.baggage))
    };
  }
  
  /**
   * Create from headers
   */
  static fromHeaders(headers) {
    const context = new TraceContext(
      headers['x-trace-id'],
      headers['x-span-id'],
      headers['x-parent-span-id'] || null
    );
    
    if (headers['x-baggage']) {
      try {
        const baggage = JSON.parse(headers['x-baggage']);
        for (const [key, value] of Object.entries(baggage)) {
          context.setBaggage(key, value);
        }
      } catch (error) {
        // Ignore malformed baggage
      }
    }
    
    return context;
  }
}

/**
 * Span represents a unit of work in the trace
 */
class Span {
  constructor(context, operationName, options = {}) {
    this.context = context;
    this.operationName = operationName;
    this.startTime = Date.now();
    this.endTime = null;
    this.duration = null;
    this.status = 'started';
    this.tags = new Map();
    this.logs = [];
    this.component = options.component || 'unknown';
    this.service = options.service || 'data-pipeline';
    
    // Set default tags
    this.setTag('component', this.component);
    this.setTag('service', this.service);
    
    if (options.tags) {
      for (const [key, value] of Object.entries(options.tags)) {
        this.setTag(key, value);
      }
    }
  }
  
  /**
   * Set a tag on the span
   */
  setTag(key, value) {
    this.tags.set(key, value);
    return this;
  }
  
  /**
   * Log an event during span execution
   */
  log(message, fields = {}) {
    this.logs.push({
      timestamp: Date.now(),
      message,
      fields
    });
    return this;
  }
  
  /**
   * Set error status and details
   */
  setError(error) {
    this.status = 'error';
    this.setTag('error', true);
    this.setTag('error.message', error.message);
    this.setTag('error.stack', error.stack);
    this.log('error', {
      message: error.message,
      stack: error.stack
    });
    return this;
  }
  
  /**
   * Finish the span
   */
  finish() {
    if (this.endTime) {
      return; // Already finished
    }
    
    this.endTime = Date.now();
    this.duration = this.endTime - this.startTime;
    
    if (this.status === 'started') {
      this.status = 'completed';
    }
    
    // Submit to tracer
    tracer.recordSpan(this);
    
    return this;
  }
  
  /**
   * Convert span to JSON for storage
   */
  toJSON() {
    return {
      traceId: this.context.traceId,
      spanId: this.context.spanId,
      parentSpanId: this.context.parentSpanId,
      operationName: this.operationName,
      startTime: this.startTime,
      endTime: this.endTime,
      duration: this.duration,
      status: this.status,
      component: this.component,
      service: this.service,
      tags: Object.fromEntries(this.tags),
      logs: this.logs
    };
  }
}

/**
 * Distributed Tracer
 */
class DistributedTracer {
  constructor(options = {}) {
    this.config = {
      enabled: options.enabled !== false,
      serviceName: options.serviceName || 'data-pipeline',
      samplingRate: options.samplingRate || 1.0, // 100% sampling by default
      maxSpansPerTrace: options.maxSpansPerTrace || 1000,
      traceRetentionHours: options.traceRetentionHours || 24
    };
    
    this.state = {
      isRunning: false,
      traces: new Map(), // traceId -> [spans]
      activeSpans: new Map(), // spanId -> span
      spanCount: 0,
      traceCount: 0
    };
    
    this.tracesDir = path.join(__dirname, '../../logs/traces');
    fs.ensureDirSync(this.tracesDir);
  }
  
  /**
   * Start the tracer
   */
  async start() {
    if (this.state.isRunning) {
      console.log('Distributed tracer already running');
      return;
    }
    
    if (!this.config.enabled) {
      console.log('Distributed tracing is disabled');
      return;
    }
    
    console.log('🔍 Starting distributed tracing...');
    
    await system.monitoringStarted({
      component: 'distributed-tracer',
      service_name: this.config.serviceName,
      sampling_rate: this.config.samplingRate
    });
    
    // Start cleanup interval
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldTraces();
    }, 60000); // Clean up every minute
    
    this.state.isRunning = true;
    
    console.log(`✅ Distributed tracing started (service: ${this.config.serviceName})`);
  }
  
  /**
   * Stop the tracer
   */
  async stop() {
    if (!this.state.isRunning) {
      return;
    }
    
    console.log('⏹️ Stopping distributed tracing...');
    
    // Finish all active spans
    for (const span of this.state.activeSpans.values()) {
      span.finish();
    }
    
    // Save remaining traces
    await this.flushTraces();
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    await system.monitoringStopped({
      component: 'distributed-tracer',
      total_spans: this.state.spanCount,
      total_traces: this.state.traceCount
    });
    
    this.state.isRunning = false;
    console.log('✅ Distributed tracing stopped');
  }
  
  /**
   * Create a new trace context
   */
  createTraceContext() {
    return new TraceContext();
  }
  
  /**
   * Start a new span
   */
  startSpan(operationName, context = null, options = {}) {
    if (!this.config.enabled || !this.state.isRunning) {
      return this.createNoOpSpan();
    }
    
    // Apply sampling
    if (Math.random() > this.config.samplingRate) {
      return this.createNoOpSpan();
    }
    
    // Create context if not provided
    if (!context) {
      context = this.createTraceContext();
    }
    
    const span = new Span(context, operationName, options);
    
    // Track active span
    this.state.activeSpans.set(span.context.spanId, span);
    this.state.spanCount++;
    
    return span;
  }
  
  /**
   * Create a no-op span for when tracing is disabled or sampled out
   */
  createNoOpSpan() {
    return {
      context: new TraceContext(),
      setTag: () => this,
      log: () => this,
      setError: () => this,
      finish: () => this
    };
  }
  
  /**
   * Start a child span
   */
  startChildSpan(operationName, parentSpan, options = {}) {
    const childContext = parentSpan.context.createChild();
    return this.startSpan(operationName, childContext, options);
  }
  
  /**
   * Record a finished span
   */
  recordSpan(span) {
    if (!this.config.enabled || !this.state.isRunning) {
      return;
    }
    
    // Remove from active spans
    this.state.activeSpans.delete(span.context.spanId);
    
    // Add to trace
    if (!this.state.traces.has(span.context.traceId)) {
      this.state.traces.set(span.context.traceId, []);
      this.state.traceCount++;
    }
    
    const spans = this.state.traces.get(span.context.traceId);
    spans.push(span);
    
    // Check if trace is complete and should be flushed
    if (spans.length >= this.config.maxSpansPerTrace || this.isTraceComplete(span.context.traceId)) {
      this.flushTrace(span.context.traceId);
    }
  }
  
  /**
   * Check if a trace is complete (no more active spans)
   */
  isTraceComplete(traceId) {
    for (const span of this.state.activeSpans.values()) {
      if (span.context.traceId === traceId) {
        return false;
      }
    }
    return true;
  }
  
  /**
   * Flush a specific trace to storage
   */
  async flushTrace(traceId) {
    const spans = this.state.traces.get(traceId);
    if (!spans || spans.length === 0) {
      return;
    }
    
    try {
      const trace = {
        traceId,
        spans: spans.map(span => span.toJSON()),
        startTime: Math.min(...spans.map(s => s.startTime)),
        endTime: Math.max(...spans.map(s => s.endTime || s.startTime)),
        duration: null,
        spanCount: spans.length,
        service: this.config.serviceName
      };
      
      trace.duration = trace.endTime - trace.startTime;
      
      const traceFile = path.join(this.tracesDir, `trace-${traceId}.json`);
      await fs.writeFile(traceFile, JSON.stringify(trace, null, 2));
      
      // Remove from memory
      this.state.traces.delete(traceId);
      
      console.log(`📝 Flushed trace ${traceId} (${spans.length} spans, ${trace.duration}ms)`);
      
    } catch (error) {
      console.error(`Failed to flush trace ${traceId}:`, error.message);
    }
  }
  
  /**
   * Flush all traces to storage
   */
  async flushTraces() {
    const traceIds = Array.from(this.state.traces.keys());
    
    for (const traceId of traceIds) {
      await this.flushTrace(traceId);
    }
    
    console.log(`📝 Flushed ${traceIds.length} traces to storage`);
  }
  
  /**
   * Clean up old traces
   */
  cleanupOldTraces() {
    const cutoffTime = Date.now() - (this.config.traceRetentionHours * 60 * 60 * 1000);
    
    // Clean up memory
    for (const [traceId, spans] of this.state.traces.entries()) {
      const oldestSpan = Math.min(...spans.map(s => s.startTime));
      if (oldestSpan < cutoffTime) {
        this.state.traces.delete(traceId);
      }
    }
    
    // Clean up files
    this.cleanupTraceFiles(cutoffTime);
  }
  
  /**
   * Clean up old trace files
   */
  async cleanupTraceFiles(cutoffTime) {
    try {
      const files = await fs.readdir(this.tracesDir);
      const traceFiles = files.filter(f => f.startsWith('trace-') && f.endsWith('.json'));
      
      for (const file of traceFiles) {
        const filePath = path.join(this.tracesDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          await fs.remove(filePath);
          console.log(`🗑️ Removed old trace file: ${file}`);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup trace files:', error.message);
    }
  }
  
  /**
   * Get trace by ID
   */
  async getTrace(traceId) {
    // Check memory first
    const spans = this.state.traces.get(traceId);
    if (spans) {
      return {
        traceId,
        spans: spans.map(span => span.toJSON()),
        startTime: Math.min(...spans.map(s => s.startTime)),
        endTime: Math.max(...spans.map(s => s.endTime || s.startTime)),
        spanCount: spans.length,
        service: this.config.serviceName
      };
    }
    
    // Check file storage
    const traceFile = path.join(this.tracesDir, `trace-${traceId}.json`);
    
    try {
      const content = await fs.readFile(traceFile, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }
  
  /**
   * Search traces
   */
  async searchTraces(options = {}) {
    const {
      service = null,
      operation = null,
      minDuration = null,
      maxDuration = null,
      status = null,
      startTime = null,
      endTime = null,
      limit = 50
    } = options;
    
    const results = [];
    
    // Search memory
    for (const [traceId, spans] of this.state.traces.entries()) {
      if (this.matchesTraceFilters(traceId, spans, options)) {
        results.push({
          traceId,
          spans: spans.map(span => span.toJSON()),
          spanCount: spans.length
        });
      }
    }
    
    // Search files if needed
    if (results.length < limit) {
      const fileResults = await this.searchTraceFiles(options, limit - results.length);
      results.push(...fileResults);
    }
    
    return results.slice(0, limit);
  }
  
  /**
   * Check if trace matches filters
   */
  matchesTraceFilters(traceId, spans, filters) {
    if (filters.service && !spans.some(s => s.service === filters.service)) {
      return false;
    }
    
    if (filters.operation && !spans.some(s => s.operationName === filters.operation)) {
      return false;
    }
    
    if (filters.status && !spans.some(s => s.status === filters.status)) {
      return false;
    }
    
    const traceDuration = Math.max(...spans.map(s => s.endTime || s.startTime)) - 
                         Math.min(...spans.map(s => s.startTime));
    
    if (filters.minDuration && traceDuration < filters.minDuration) {
      return false;
    }
    
    if (filters.maxDuration && traceDuration > filters.maxDuration) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Search trace files
   */
  async searchTraceFiles(options, limit) {
    // This is a simplified implementation
    // In a production system, you'd want indexing
    return [];
  }
  
  /**
   * Get tracer statistics
   */
  getStats() {
    return {
      enabled: this.config.enabled,
      running: this.state.isRunning,
      total_spans: this.state.spanCount,
      total_traces: this.state.traceCount,
      active_spans: this.state.activeSpans.size,
      traces_in_memory: this.state.traces.size,
      sampling_rate: this.config.samplingRate,
      service_name: this.config.serviceName
    };
  }
}

// Global tracer instance
const tracer = new DistributedTracer();

/**
 * Convenience functions for common tracing patterns
 */
const tracing = {
  /**
   * Trace a function execution
   */
  async traceFunction(operationName, fn, context = null, options = {}) {
    const span = tracer.startSpan(operationName, context, options);
    
    try {
      const result = await fn(span);
      span.finish();
      return result;
    } catch (error) {
      span.setError(error);
      span.finish();
      throw error;
    }
  },
  
  /**
   * Trace a pipeline operation
   */
  async tracePipelineOperation(operation, component, fn, context = null) {
    return this.traceFunction(
      operation,
      fn,
      context,
      {
        component,
        tags: {
          'pipeline.operation': operation,
          'pipeline.component': component
        }
      }
    );
  },
  
  /**
   * Trace data ingestion
   */
  async traceIngestion(source, fn, context = null) {
    return this.tracePipelineOperation(
      'data_ingestion',
      'ingestion',
      async (span) => {
        span.setTag('data.source', source);
        return fn(span);
      },
      context
    );
  },
  
  /**
   * Trace data transformation
   */
  async traceTransformation(model, fn, context = null) {
    return this.tracePipelineOperation(
      'data_transformation',
      'transformation',
      async (span) => {
        span.setTag('transformation.model', model);
        return fn(span);
      },
      context
    );
  },
  
  /**
   * Trace analytics query
   */
  async traceAnalytics(query, fn, context = null) {
    return this.tracePipelineOperation(
      'analytics_query',
      'analytics',
      async (span) => {
        span.setTag('query.type', query);
        return fn(span);
      },
      context
    );
  },
  
  /**
   * Trace orchestration
   */
  async traceOrchestration(jobName, fn, context = null) {
    return this.tracePipelineOperation(
      'pipeline_orchestration',
      'orchestration',
      async (span) => {
        span.setTag('orchestration.job', jobName);
        return fn(span);
      },
      context
    );
  },
  
  /**
   * Trace publication
   */
  async tracePublication(target, fn, context = null) {
    return this.tracePipelineOperation(
      'data_publication',
      'publication',
      async (span) => {
        span.setTag('publication.target', target);
        return fn(span);
      },
      context
    );
  }
};

/**
 * Console interface for distributed tracing
 */
const tracingCLI = {
  /**
   * Start tracing
   */
  async start() {
    await tracer.start();
  },
  
  /**
   * Stop tracing
   */
  async stop() {
    await tracer.stop();
  },
  
  /**
   * Show tracing statistics
   */
  stats() {
    const stats = tracer.getStats();
    
    console.log('\n🔍 Distributed Tracing Statistics:');
    console.log('═'.repeat(45));
    console.log(`Enabled: ${stats.enabled ? '✅' : '❌'}`);
    console.log(`Running: ${stats.running ? '✅' : '❌'}`);
    console.log(`Service: ${stats.service_name}`);
    console.log(`Sampling Rate: ${(stats.sampling_rate * 100).toFixed(1)}%`);
    console.log(`Total Spans: ${stats.total_spans}`);
    console.log(`Total Traces: ${stats.total_traces}`);
    console.log(`Active Spans: ${stats.active_spans}`);
    console.log(`Traces in Memory: ${stats.traces_in_memory}`);
  },
  
  /**
   * Get trace by ID
   */
  async trace(traceId) {
    const trace = await tracer.getTrace(traceId);
    
    if (!trace) {
      console.log(`❌ Trace not found: ${traceId}`);
      return;
    }
    
    console.log(`\n📊 Trace: ${traceId}`);
    console.log('═'.repeat(60));
    console.log(`Duration: ${trace.duration}ms`);
    console.log(`Spans: ${trace.spanCount}`);
    console.log(`Service: ${trace.service}`);
    
    // Show span hierarchy
    console.log('\nSpan Hierarchy:');
    const spanMap = new Map(trace.spans.map(s => [s.spanId, s]));
    const rootSpans = trace.spans.filter(s => !s.parentSpanId);
    
    for (const rootSpan of rootSpans) {
      this.printSpanTree(rootSpan, spanMap, 0);
    }
  },
  
  /**
   * Print span tree
   */
  printSpanTree(span, spanMap, depth) {
    const indent = '  '.repeat(depth);
    const duration = span.duration || 0;
    const status = span.status === 'completed' ? '✅' :
                  span.status === 'error' ? '❌' : '🔄';
    
    console.log(`${indent}${status} ${span.operationName} (${duration}ms)`);
    
    if (span.tags && Object.keys(span.tags).length > 0) {
      console.log(`${indent}   Tags: ${JSON.stringify(span.tags)}`);
    }
    
    // Print child spans
    const children = Array.from(spanMap.values()).filter(s => s.parentSpanId === span.spanId);
    for (const child of children) {
      this.printSpanTree(child, spanMap, depth + 1);
    }
  },
  
  /**
   * Search traces
   */
  async search(options = {}) {
    const traces = await tracer.searchTraces(options);
    
    console.log(`\n📋 Found ${traces.length} traces:`);
    console.log('═'.repeat(60));
    
    for (const trace of traces) {
      const duration = trace.spans.length > 0 ? 
        Math.max(...trace.spans.map(s => s.endTime || s.startTime)) - 
        Math.min(...trace.spans.map(s => s.startTime)) : 0;
      
      console.log(`${trace.traceId}: ${trace.spanCount} spans, ${duration}ms`);
    }
  },
  
  /**
   * Flush traces
   */
  async flush() {
    await tracer.flushTraces();
    console.log('✅ All traces flushed to storage');
  }
};

module.exports = {
  DistributedTracer,
  TraceContext,
  Span,
  tracer,
  tracing,
  tracingCLI
};