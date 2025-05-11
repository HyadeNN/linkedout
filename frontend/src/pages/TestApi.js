import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const TestApi = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState('');

  const addResult = (message, success = true) => {
    setResults(prev => [
      ...prev,
      {
        id: Date.now(),
        message,
        success,
        timestamp: new Date().toLocaleTimeString()
      }
    ]);
  };

  // Test GET request
  const testGet = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${API_URL}/test/hello`);
      addResult(`GET successful: ${JSON.stringify(response.data)}`);
    } catch (err) {
      setError(err.message);
      addResult(`GET failed: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test POST request
  const testPost = async () => {
    setLoading(true);
    setError(null);

    try {
      let dataToSend = {};

      try {
        dataToSend = JSON.parse(testData);
      } catch (err) {
        dataToSend = { message: testData };
      }

      const response = await axios.post(`${API_URL}/test/echo`, dataToSend);
      addResult(`POST successful: ${JSON.stringify(response.data)}`);
    } catch (err) {
      setError(err.message);
      addResult(`POST failed: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test root endpoint
  const testRoot = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:8000/`);
      addResult(`Root endpoint successful: ${JSON.stringify(response.data)}`);
    } catch (err) {
      setError(err.message);
      addResult(`Root endpoint failed: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  // Test CORS
  const testCors = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`http://localhost:8000/test-cors`);
      addResult(`CORS test successful: ${JSON.stringify(response.data)}`);
    } catch (err) {
      setError(err.message);
      addResult(`CORS test failed: ${err.message}`, false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-api-page">
      <h1>API Connection Test</h1>

      <div className="test-controls">
        <button
          onClick={testRoot}
          disabled={loading}
          className="test-button"
        >
          Test Root Endpoint
        </button>

        <button
          onClick={testCors}
          disabled={loading}
          className="test-button"
        >
          Test CORS
        </button>

        <button
          onClick={testGet}
          disabled={loading}
          className="test-button"
        >
          Test GET
        </button>

        <div className="post-test-container">
          <textarea
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            placeholder='{"key": "value"}'
            className="test-textarea"
          />

          <button
            onClick={testPost}
            disabled={loading}
            className="test-button"
          >
            Test POST
          </button>
        </div>
      </div>

      {error && (
        <div className="error-message">
          Error: {error}
        </div>
      )}

      <div className="results-container">
        <h2>Test Results</h2>

        {results.length === 0 ? (
          <p>No tests run yet</p>
        ) : (
          <ul className="results-list">
            {results.map(result => (
              <li
                key={result.id}
                className={`result-item ${result.success ? 'success' : 'failure'}`}
              >
                <span className="result-timestamp">[{result.timestamp}]</span>
                <span className="result-message">{result.message}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <style jsx>{`
        .test-api-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        
        .test-controls {
          display: flex;
          flex-direction: column;
          gap: 10px;
          margin-bottom: 20px;
        }
        
        .test-button {
          padding: 10px 15px;
          background-color: #0a66c2;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        
        .test-button:disabled {
          background-color: #cccccc;
        }
        
        .post-test-container {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        
        .test-textarea {
          height: 100px;
          padding: 10px;
          border: 1px solid #cccccc;
          border-radius: 4px;
        }
        
        .error-message {
          padding: 10px;
          background-color: #ffebee;
          color: #c62828;
          border-radius: 4px;
          margin-bottom: 20px;
        }
        
        .results-list {
          list-style: none;
          padding: 0;
        }
        
        .result-item {
          padding: 10px;
          margin-bottom: 5px;
          border-radius: 4px;
        }
        
        .success {
          background-color: #e8f5e9;
          color: #2e7d32;
        }
        
        .failure {
          background-color: #ffebee;
          color: #c62828;
        }
        
        .result-timestamp {
          display: inline-block;
          margin-right: 10px;
          font-weight: bold;
        }
      `}</style>
    </div>
  );
};

export default TestApi;