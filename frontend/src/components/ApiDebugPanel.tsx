import React, { useState } from 'react';
import { detectNetworkAndGetApiServiceSync } from '../services/compatibleApi';

const ApiDebugPanel: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  
  const checkApiService = () => {
    const apiService = detectNetworkAndGetApiServiceSync();
    
    const localStorage_info = {
      isDemo: localStorage.getItem('isDemo'),
      currentUser: localStorage.getItem('currentUser'),
      user_email: localStorage.getItem('user_email'),
      auth_token: localStorage.getItem('auth_token')?.substring(0, 50),
      use_compatible_api: localStorage.getItem('use_compatible_api'),
      api_mode: localStorage.getItem('api_mode')
    };
    
    const info = {
      apiServiceType: apiService.constructor.name || 'Unknown',
      localStorage: localStorage_info,
      isCompatibleApi: apiService.toString().includes('compatibleApiService'),
      availableMethods: Object.getOwnPropertyNames(apiService).filter(prop => typeof (apiService as any)[prop] === 'function'),
      hasUpdateDailyTask: typeof (apiService as any).updateDailyTask === 'function'
    };
    
    setDebugInfo(info);
    console.log('🔍 API Debug Info:', info);
  };
  
  const testApiCall = async () => {
    try {
      const apiService = detectNetworkAndGetApiServiceSync();
      console.log('🔍 Testing API call...');
      
      if (typeof (apiService as any).getDailyTasks === 'function') {
        const result = await (apiService as any).getDailyTasks({ date: '2025-08-27' });
        console.log('✅ getDailyTasks result:', result);
        setDebugInfo((prev: any) => ({ ...prev, testResult: result }));
      } else {
        console.log('❌ getDailyTasks method not available');
        setDebugInfo((prev: any) => ({ ...prev, testResult: 'getDailyTasks method not available' }));
      }
    } catch (error) {
      console.error('❌ API test failed:', error);
      setDebugInfo((prev: any) => ({ ...prev, testError: error }));
    }
  };

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-300 rounded-lg p-4 shadow-lg max-w-md z-50">
      <h3 className="font-bold text-sm mb-2">🔧 API Debug Panel</h3>
      
      <div className="space-y-2 text-xs">
        <button 
          onClick={checkApiService}
          className="bg-blue-500 text-white px-2 py-1 rounded text-xs"
        >
          Check API Service
        </button>
        
        <button 
          onClick={testApiCall}
          className="bg-green-500 text-white px-2 py-1 rounded text-xs ml-2"
        >
          Test API Call
        </button>
        
        {debugInfo.apiServiceType && (
          <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
            <p><strong>API Service:</strong> {debugInfo.isCompatibleApi ? '🔴 Mock/Compatible' : '🟢 Real API'}</p>
            <p><strong>updateDailyTask:</strong> {debugInfo.hasUpdateDailyTask ? '✅' : '❌'}</p>
            
            <details className="mt-2">
              <summary className="cursor-pointer">LocalStorage Values</summary>
              <pre className="text-xs mt-1 overflow-auto">
                {JSON.stringify(debugInfo.localStorage, null, 2)}
              </pre>
            </details>
            
            {debugInfo.testResult && (
              <details className="mt-2">
                <summary className="cursor-pointer">Test Result</summary>
                <pre className="text-xs mt-1 overflow-auto max-h-20">
                  {JSON.stringify(debugInfo.testResult, null, 2)}
                </pre>
              </details>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApiDebugPanel;