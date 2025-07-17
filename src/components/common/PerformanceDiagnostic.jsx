// Performance diagnostic component for CitySense
import React, { useState, useEffect } from 'react';
import { performanceMonitor, testNetworkSpeed, testFirebasePerformance } from '../utils/performance';

const PerformanceDiagnostic = () => {
  const [networkSpeed, setNetworkSpeed] = useState(null);
  const [firebaseSpeed, setFirebaseSpeed] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState([]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    try {
      // Test network speed
      const networkResult = await testNetworkSpeed();
      setNetworkSpeed(networkResult);
      
      // Test Firebase performance
      const firebaseResult = await testFirebasePerformance();
      setFirebaseSpeed(firebaseResult);
      
      // Get recent performance logs
      const summary = performanceMonitor.getSummary();
      setLogs(summary.recentLogs);
      
    } catch (error) {
      console.error('Diagnostic failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  const getSpeedStatus = (duration) => {
    if (!duration) return 'Unknown';
    if (duration < 500) return 'Excellent';
    if (duration < 1000) return 'Good';
    if (duration < 2000) return 'Fair';
    return 'Poor';
  };

  const getSpeedColor = (duration) => {
    if (!duration) return 'text-gray-500';
    if (duration < 500) return 'text-green-500';
    if (duration < 1000) return 'text-yellow-500';
    if (duration < 2000) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded-lg p-4 w-80 border border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800">Performance Monitor</h3>
        <button
          onClick={runDiagnostics}
          disabled={isRunning}
          className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Refresh'}
        </button>
      </div>
      
      {/* Network Speed */}
      <div className="mb-3">
        <div className="text-sm text-gray-600">Network Speed</div>
        <div className={`font-medium ${getSpeedColor(networkSpeed?.duration)}`}>
          {networkSpeed?.success ? (
            <>
              {networkSpeed.duration.toFixed(0)}ms - {getSpeedStatus(networkSpeed.duration)}
            </>
          ) : (
            'Failed'
          )}
        </div>
      </div>
      
      {/* Firebase Performance */}
      <div className="mb-3">
        <div className="text-sm text-gray-600">Firebase Speed</div>
        <div className={`font-medium ${getSpeedColor(firebaseSpeed?.duration)}`}>
          {firebaseSpeed?.success ? (
            <>
              {firebaseSpeed.duration.toFixed(0)}ms - {getSpeedStatus(firebaseSpeed.duration)}
            </>
          ) : (
            'Failed'
          )}
        </div>
      </div>
      
      {/* Recent Operations */}
      <div className="mb-3">
        <div className="text-sm text-gray-600 mb-1">Recent Operations</div>
        <div className="max-h-32 overflow-y-auto text-xs">
          {logs.map((log, index) => (
            <div key={index} className="flex justify-between py-1 border-b border-gray-100">
              <span className="truncate">{log.operation}</span>
              <span className={`font-medium ${getSpeedColor(log.duration)}`}>
                {log.duration.toFixed(0)}ms
              </span>
            </div>
          ))}
        </div>
      </div>
      
      {/* Tips */}
      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">Tips for better performance:</div>
        <ul className="list-disc list-inside space-y-1">
          <li>Compress images before upload</li>
          <li>Use stable internet connection</li>
          <li>Clear browser cache if slow</li>
          <li>Check Firebase service status</li>
        </ul>
      </div>
    </div>
  );
};

export default PerformanceDiagnostic;
