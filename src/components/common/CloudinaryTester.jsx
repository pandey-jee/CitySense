import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { uploadImageToCloudinary, batchUploadImages } from '../../services/cloudinaryOptimized';


const CloudinaryTester = () => {
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState({});
  const [testFiles, setTestFiles] = useState([]);

  const tests = [
    {
      id: 'single_upload',
      name: 'Single Image Upload',
      description: 'Test uploading a single image with compression',
      test: async () => {
        if (testFiles.length === 0) throw new Error('No test file selected');
        return await uploadImageToCloudinary(testFiles[0], 'citysense/test');
      }
    },
    {
      id: 'batch_upload',
      name: 'Batch Upload (3 images)',
      description: 'Test uploading multiple images simultaneously',
      test: async () => {
        if (testFiles.length < 3) throw new Error('Need at least 3 test files');
        const files = testFiles.slice(0, 3);
        return await batchUploadImages(files, 'citysense/test');
      }
    },
    {
      id: 'performance',
      name: 'Performance Test',
      description: 'Measure upload speed and compression ratio',
      test: async () => {
        if (testFiles.length === 0) throw new Error('No test file selected');
        
        const startTime = Date.now();
        const file = testFiles[0];
        const originalSize = file.size;
        
        const result = await uploadImageToCloudinary(file, 'citysense/test');
        const uploadTime = Date.now() - startTime;
        
        return {
          ...result,
          performance: {
            originalSize,
            uploadTime,
            speed: (originalSize / 1024 / (uploadTime / 1000)).toFixed(2) + ' KB/s'
          }
        };
      }
    }
  ];

  const runTest = async (test) => {
    setTestResults(prev => ({
      ...prev,
      [test.id]: { status: 'running', startTime: Date.now() }
    }));

    try {
      const result = await test.test();
      const endTime = Date.now();
      
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: 'success',
          result,
          duration: endTime - prev[test.id].startTime,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      setTestResults(prev => ({
        ...prev,
        [test.id]: {
          status: 'error',
          error: error.message,
          duration: Date.now() - prev[test.id].startTime,
          timestamp: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  const runAllTests = async () => {
    setTesting(true);
    setTestResults({});
    
    for (const test of tests) {
      await runTest(test);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setTesting(false);
  };

  const handleFileSelection = (event) => {
    const files = Array.from(event.target.files);
    setTestFiles(files);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <div className="w-4 h-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return 'bg-blue-50 border-blue-200';
      case 'success': return 'bg-green-50 border-green-200';
      case 'error': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <AlertTriangle className="w-5 h-5 text-orange-500" />
        Cloudinary Performance Tester
      </h3>

      {/* File Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Test Images (minimum 3 for batch testing)
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFileSelection}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {testFiles.length > 0 && (
          <p className="text-sm text-gray-600 mt-1">
            {testFiles.length} file(s) selected ({(testFiles.reduce((sum, f) => sum + f.size, 0) / 1024).toFixed(1)}KB total)
          </p>
        )}
      </div>

      {/* Run Tests Button */}
      <div className="mb-6">
        <button
          onClick={runAllTests}
          disabled={testing || testFiles.length === 0}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          <Play className="w-4 h-4" />
          {testing ? 'Running Tests...' : 'Run All Tests'}
        </button>
      </div>

      {/* Test Results */}
      <div className="space-y-4">
        {tests.map((test) => {
          const result = testResults[test.id];
          return (
            <div
              key={test.id}
              className={`border rounded-lg p-4 transition-all ${getStatusColor(result?.status)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result?.status)}
                  <div>
                    <h4 className="font-medium">{test.name}</h4>
                    <p className="text-sm text-gray-600">{test.description}</p>
                  </div>
                </div>
                {result?.duration && (
                  <span className="text-xs text-gray-500">
                    {result.duration}ms
                  </span>
                )}
              </div>

              {/* Success Results */}
              {result?.status === 'success' && result.result && (
                <div className="mt-3 text-sm">
                  {test.id === 'performance' && result.result.performance && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">Original Size:</span>
                        <span className="ml-2 font-medium">
                          {(result.result.performance.originalSize / 1024).toFixed(1)}KB
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Upload Speed:</span>
                        <span className="ml-2 font-medium text-green-600">
                          {result.result.performance.speed}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Upload Time:</span>
                        <span className="ml-2 font-medium">
                          {result.result.performance.uploadTime}ms
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Compression:</span>
                        <span className="ml-2 font-medium">
                          {result.result.metadata?.compressionRatio || 'N/A'}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  {test.id === 'batch_upload' && Array.isArray(result.result) && (
                    <div>
                      <span className="text-gray-600">Batch Results:</span>
                      <span className="ml-2 font-medium text-green-600">
                        {result.result.length} images uploaded successfully
                      </span>
                    </div>
                  )}
                  
                  {result.result.url && test.id !== 'batch_upload' && (
                    <div className="mt-2">
                      <img
                        src={result.result.url}
                        alt="Test upload"
                        className="w-16 h-16 object-cover rounded border"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Error Results */}
              {result?.status === 'error' && (
                <div className="mt-3 text-sm text-red-600">
                  <strong>Error:</strong> {result.error}
                </div>
              )}

              {/* Timestamp */}
              {result?.timestamp && (
                <div className="mt-2 text-xs text-gray-500">
                  Completed at {result.timestamp}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Overall Status */}
      {Object.keys(testResults).length > 0 && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">Test Summary</h4>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Passed:</span>
              <span className="ml-2 font-medium text-green-600">
                {Object.values(testResults).filter(r => r.status === 'success').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Failed:</span>
              <span className="ml-2 font-medium text-red-600">
                {Object.values(testResults).filter(r => r.status === 'error').length}
              </span>
            </div>
            <div>
              <span className="text-gray-600">Running:</span>
              <span className="ml-2 font-medium text-blue-600">
                {Object.values(testResults).filter(r => r.status === 'running').length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryTester;
