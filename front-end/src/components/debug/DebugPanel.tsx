// src/components/debug/DebugPanel.tsx - COMPLETE DEBUG COMPONENT
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import {
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw,
  Database,
  Globe,
  Key,
  Activity,
  Code,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useArticlesDebug } from '../../hooks/api/useArticlesDebug';
import { useAuth } from '../../hooks/auth/useAuth';

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'ERROR';
  details: any;
  timestamp?: string;
}

const DebugPanel: React.FC = () => {
  const { user } = useAuth();
  const debug = useArticlesDebug();
  const [isExpanded, setIsExpanded] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showDetails, setShowDetails] = useState<Record<string, boolean>>({});

  // Manual API tests
  const runManualTests = async () => {
    setIsRunningTests(true);
    setTestResults([]);
    const results: TestResult[] = [];
    const timestamp = new Date().toLocaleTimeString();

    // Test 1: Backend Health
    try {
      const healthResponse = await fetch('http://localhost:8000/api/articles/health');
      const healthData = await healthResponse.json();

      results.push({
        test: 'Backend Health',
        status: healthResponse.ok ? 'PASS' : 'FAIL',
        details: {
          status: healthResponse.status,
          ...healthData
        },
        timestamp
      });
    } catch (error: any) {
      results.push({
        test: 'Backend Health',
        status: 'ERROR',
        details: { error: error.message },
        timestamp
      });
    }

    // Test 2: Auth Health
    try {
      const authResponse = await fetch('http://localhost:8000/api/auth/health');
      const authData = await authResponse.json();

      results.push({
        test: 'Auth Health',
        status: authResponse.ok ? 'PASS' : 'FAIL',
        details: {
          status: authResponse.status,
          ...authData
        },
        timestamp
      });
    } catch (error: any) {
      results.push({
        test: 'Auth Health',
        status: 'ERROR',
        details: { error: error.message },
        timestamp
      });
    }

    // Test 3: Comments Health
    try {
      const commentsResponse = await fetch('http://localhost:8000/api/v1/comments/health');
      const commentsData = await commentsResponse.json();

      results.push({
        test: 'Comments Health',
        status: commentsResponse.ok ? 'PASS' : 'FAIL',
        details: {
          status: commentsResponse.status,
          ...commentsData
        },
        timestamp
      });
    } catch (error: any) {
      results.push({
        test: 'Comments Health',
        status: 'ERROR',
        details: { error: error.message },
        timestamp
      });
    }

    // Test 4: Authenticated API call (chỉ chạy khi có user)
    if (user) {
      try {
        const token = localStorage.getItem('auth_token');
        const articlesResponse = await fetch('http://localhost:8000/api/articles?limit=1', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        const articlesData = await articlesResponse.json();

        results.push({
          test: 'Authenticated API',
          status: articlesResponse.ok ? 'PASS' : 'FAIL',
          details: {
            status: articlesResponse.status,
            success: articlesData.success,
            dataLength: articlesData.data?.length,
            error: articlesData.error,
            hasToken: !!token
          },
          timestamp
        });
      } catch (error: any) {
        results.push({
          test: 'Authenticated API',
          status: 'ERROR',
          details: { error: error.message },
          timestamp
        });
      }
    } else {
      results.push({
        test: 'Authenticated API',
        status: 'FAIL',
        details: { error: 'No user logged in' },
        timestamp
      });
    }

    // Test 5: Upload Service Health
    try {
      const uploadResponse = await fetch('http://localhost:8000/api/uploads/health');
      const uploadData = await uploadResponse.json();

      results.push({
        test: 'Upload Service',
        status: uploadResponse.ok ? 'PASS' : 'FAIL',
        details: {
          status: uploadResponse.status,
          ...uploadData
        },
        timestamp
      });
    } catch (error: any) {
      results.push({
        test: 'Upload Service',
        status: 'ERROR',
        details: { error: error.message },
        timestamp
      });
    }

    setTestResults(results);
    setIsRunningTests(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
      case 'connected':
      case 'authenticated':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'FAIL':
      case 'failed':
      case 'not-authenticated':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variant =
      status === 'PASS' || status === 'connected' || status === 'authenticated' ? 'default' :
      status === 'FAIL' || status === 'failed' || status === 'not-authenticated' ? 'destructive' :
      'secondary';

    return (
      <Badge variant={variant} className="ml-2 text-xs">
        {status}
      </Badge>
    );
  };

  const toggleDetails = (testName: string) => {
    setShowDetails(prev => ({
      ...prev,
      [testName]: !prev[testName]
    }));
  };

  // Only show in development
  if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Toggle Button */}
      <Button
        onClick={() => setIsExpanded(!isExpanded)}
        variant="outline"
        size="sm"
        className="mb-2 bg-blue-50 border-blue-200 hover:bg-blue-100"
      >
        <Code className="h-4 w-4 mr-1" />
        Debug
        {isExpanded ? (
          <ChevronUp className="h-3 w-3 ml-1" />
        ) : (
          <ChevronDown className="h-3 w-3 ml-1" />
        )}
      </Button>

      {/* Debug Panel */}
      {isExpanded && (
        <Card className="w-96 max-h-[600px] overflow-auto bg-white shadow-lg border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center justify-between">
              <span>🔍 API Debug Panel</span>
              <Button
                onClick={debug.runHealthCheck}
                variant="ghost"
                size="sm"
                disabled={isRunningTests}
              >
                <RefreshCw className={`h-3 w-3 ${isRunningTests ? 'animate-spin' : ''}`} />
              </Button>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4 text-xs">
            {/* System Status */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Globe className="h-3 w-3 mr-1" />
                System Status
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Backend</span>
                  <div className="flex items-center">
                    {getStatusIcon(debug.debugInfo.apiConnection)}
                    {getStatusBadge(debug.debugInfo.apiConnection)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Authentication</span>
                  <div className="flex items-center">
                    {getStatusIcon(debug.debugInfo.authStatus)}
                    {getStatusBadge(debug.debugInfo.authStatus)}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span>Backend URL</span>
                  <code className="text-xs bg-gray-100 px-1 rounded">
                    {debug.debugInfo.backendUrl}
                  </code>
                </div>
              </div>
            </div>

            {/* Authentication Info */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Key className="h-3 w-3 mr-1" />
                Authentication
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Has Token</span>
                  <Badge variant={debug.debugInfo.hasToken ? 'default' : 'destructive'}>
                    {debug.debugInfo.hasToken ? 'Yes' : 'No'}
                  </Badge>
                </div>

                {debug.debugInfo.tokenPreview && (
                  <div className="flex items-center justify-between">
                    <span>Token Preview</span>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {debug.debugInfo.tokenPreview}
                    </code>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span>Current User</span>
                  <span className="text-right max-w-32 truncate">
                    {user?.full_name || 'Not logged in'}
                  </span>
                </div>

                {user && (
                  <div className="flex items-center justify-between">
                    <span>User ID</span>
                    <code className="text-xs bg-gray-100 px-1 rounded">
                      {user.user_id}
                    </code>
                  </div>
                )}
              </div>
            </div>

            {/* Database Info */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Database className="h-3 w-3 mr-1" />
                Database
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>Articles Count</span>
                  <Badge variant="secondary">
                    {debug.debugInfo.articlesCount}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Performance */}
            <div>
              <h4 className="font-semibold mb-2 flex items-center">
                <Activity className="h-3 w-3 mr-1" />
                Performance
              </h4>
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span>API Calls</span>
                  <span>{debug.apiCalls.total} ({debug.apiCalls.successful} success)</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Success Rate</span>
                  <span>
                    {debug.apiCalls.total > 0
                      ? ((debug.apiCalls.successful / debug.apiCalls.total) * 100).toFixed(1)
                      : 0}%
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Avg Response</span>
                  <span>{debug.performance.averageResponseTime || 0}ms</span>
                </div>

                <div className="flex items-center justify-between">
                  <span>Cache Size</span>
                  <span>{debug.cacheStatus.size} items</span>
                </div>

                {debug.cacheStatus.hitRate !== undefined && (
                  <div className="flex items-center justify-between">
                    <span>Cache Hit Rate</span>
                    <span>{debug.cacheStatus.hitRate}%</span>
                  </div>
                )}
              </div>
            </div>

            {/* Error Info */}
            {debug.debugInfo.lastError && (
              <div>
                <h4 className="font-semibold mb-2 flex items-center text-red-600">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Last Error
                </h4>
                <div className="text-xs bg-red-50 p-2 rounded text-red-700 break-words">
                  {debug.debugInfo.lastError}
                </div>
              </div>
            )}

            {/* Manual Tests */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Manual Tests
                </h4>
                <Button
                  onClick={runManualTests}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                  disabled={isRunningTests}
                >
                  {isRunningTests ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Run Tests'
                  )}
                </Button>
              </div>

              {testResults.length > 0 && (
                <div className="space-y-1">
                  {testResults.map((result, index) => (
                    <div key={index} className="border rounded p-2">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleDetails(result.test)}
                      >
                        <span className="flex items-center">
                          {result.test}
                          {result.timestamp && (
                            <span className="ml-1 text-gray-400">
                              ({result.timestamp})
                            </span>
                          )}
                        </span>
                        <div className="flex items-center">
                          {getStatusIcon(result.status)}
                          {getStatusBadge(result.status)}
                        </div>
                      </div>

                      {showDetails[result.test] && (
                        <div className="mt-2 text-xs bg-gray-50 p-2 rounded">
                          <pre className="whitespace-pre-wrap break-words">
                            {JSON.stringify(result.details, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Cache Information */}
            {debug.cacheStatus.keys.length > 0 && (
              <div>
                <h4 className="font-semibold mb-2">Cache Keys</h4>
                <div className="space-y-1 text-xs">
                  {debug.cacheStatus.keys.slice(0, 5).map((key, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <code className="text-xs bg-gray-100 px-1 rounded truncate max-w-48">
                        {key}
                      </code>
                      {debug.cacheStatus.lastAccess?.[key] && (
                        <span className="text-gray-400 text-xs">
                          {debug.cacheStatus.lastAccess[key]}
                        </span>
                      )}
                    </div>
                  ))}
                  {debug.cacheStatus.keys.length > 5 && (
                    <div className="text-gray-400 text-xs">
                      ... and {debug.cacheStatus.keys.length - 5} more
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div>
              <h4 className="font-semibold mb-2">Quick Actions</h4>
              <div className="flex gap-1 flex-wrap">
                <Button
                  onClick={debug.clearCache}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                >
                  Clear Cache
                </Button>

                <Button
                  onClick={debug.resetPerformance}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs"
                >
                  Reset Stats
                </Button>

                <Button
                  onClick={() => {
                    if (window.confirm('Are you sure? This will clear all local storage and reload the page.')) {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="h-6 text-xs text-red-600 hover:text-red-700"
                >
                  Clear Storage
                </Button>
              </div>
            </div>

            {/* Developer Info */}
            <div className="pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-500 space-y-1">
                <div className="flex items-center justify-between">
                  <span>React Version</span>
                  <code>{React.version}</code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Environment</span>
                  <Badge variant="secondary">{process.env.NODE_ENV}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>API Base URL</span>
                  <code className="text-xs bg-gray-100 px-1 rounded">
                    {process.env.REACT_APP_API_BASE_URL || 'default'}
                  </code>
                </div>
                <div className="flex items-center justify-between">
                  <span>Build Time</span>
                  <span>{new Date().toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Close Button */}
            <div className="pt-2 border-t border-gray-200">
              <Button
                onClick={() => setIsExpanded(false)}
                variant="ghost"
                size="sm"
                className="w-full h-6 text-xs"
              >
                Close Debug Panel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DebugPanel;