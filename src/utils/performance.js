// Performance monitoring utility for CitySense
export class PerformanceMonitor {
  constructor() {
    this.timers = new Map();
    this.logs = [];
  }
  
  // Start timing an operation
  start(operation) {
    this.timers.set(operation, performance.now());
    console.log(`🚀 Starting: ${operation}`);
  }
  
  // End timing and log results
  end(operation, details = '') {
    const startTime = this.timers.get(operation);
    if (!startTime) {
      console.warn(`⚠️ No start time found for: ${operation}`);
      return;
    }
    
    const duration = performance.now() - startTime;
    const logEntry = {
      operation,
      duration,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.logs.push(logEntry);
    this.timers.delete(operation);
    
    // Color code based on duration
    const color = duration > 3000 ? '🔴' : duration > 1000 ? '🟡' : '🟢';
    console.log(`${color} Completed: ${operation} (${duration.toFixed(2)}ms) ${details}`);
    
    // Alert for slow operations
    if (duration > 5000) {
      console.warn(`🐌 Slow operation detected: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    return duration;
  }
  
  // Get performance summary
  getSummary() {
    const summary = {
      totalOperations: this.logs.length,
      averageTime: this.logs.reduce((sum, log) => sum + log.duration, 0) / this.logs.length,
      slowestOperation: this.logs.reduce((slowest, log) => 
        !slowest || log.duration > slowest.duration ? log : slowest, null),
      recentLogs: this.logs.slice(-10)
    };
    
    console.table(summary.recentLogs);
    return summary;
  }
  
  // Clear logs
  clear() {
    this.logs = [];
    this.timers.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for common operations
export const measureAsync = async (operation, asyncFunction) => {
  performanceMonitor.start(operation);
  try {
    const result = await asyncFunction();
    performanceMonitor.end(operation, 'Success');
    return result;
  } catch (error) {
    performanceMonitor.end(operation, `Error: ${error.message}`);
    throw error;
  }
};

// Network speed test
export const testNetworkSpeed = async () => {
  const testUrl = 'https://httpbin.org/json';
  const startTime = performance.now();
  
  try {
    const response = await fetch(testUrl);
    const data = await response.json();
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`🌐 Network speed test: ${duration.toFixed(2)}ms`);
    return { duration, success: true };
  } catch (error) {
    console.error('🌐 Network speed test failed:', error);
    return { duration: null, success: false, error: error.message };
  }
};

// Firebase performance test
export const testFirebasePerformance = async () => {
  const { db } = await import('./firebase');
  const { collection, getDocs, limit, query } = await import('firebase/firestore');
  
  const startTime = performance.now();
  
  try {
    const q = query(collection(db, 'issues'), limit(1));
    const snapshot = await getDocs(q);
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    console.log(`🔥 Firebase performance test: ${duration.toFixed(2)}ms`);
    return { duration, success: true, docCount: snapshot.size };
  } catch (error) {
    console.error('🔥 Firebase performance test failed:', error);
    return { duration: null, success: false, error: error.message };
  }
};

export default performanceMonitor;
