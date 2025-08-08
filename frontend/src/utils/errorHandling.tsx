/**
 * Comprehensive Error Handling and Loading State Utilities
 * Provides consistent error handling, loading states, and user feedback
 * across all statistics components.
 */

import React from 'react';

export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string;
  progress?: number; // 0-100 for progress indicators
}

export interface ErrorState {
  hasError: boolean;
  error?: Error | string;
  errorCode?: string;
  canRetry?: boolean;
  retryAction?: () => void;
  context?: string; // Component or operation context
}

export interface DataState<T = any> {
  data: T | null;
  loading: LoadingState;
  error: ErrorState;
  lastUpdated?: Date;
  isStale?: boolean; // For cache invalidation
}

export enum ErrorType {
  NETWORK = 'NETWORK',
  VALIDATION = 'VALIDATION',
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  NOT_FOUND = 'NOT_FOUND',
  SERVER = 'SERVER',
  TIMEOUT = 'TIMEOUT',
  RATE_LIMIT = 'RATE_LIMIT',
  UNKNOWN = 'UNKNOWN'
}

export const createInitialDataState = <T = any>(initialData: T | null = null): DataState<T> => ({
  data: initialData,
  loading: {
    isLoading: false,
    loadingMessage: undefined,
    progress: undefined
  },
  error: {
    hasError: false,
    error: undefined,
    errorCode: undefined,
    canRetry: false,
    retryAction: undefined,
    context: undefined
  },
  lastUpdated: initialData ? new Date() : undefined,
  isStale: false
});

/**
 * Loading spinner component with customizable messages
 */
export const LoadingSpinner: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  message?: string;
  progress?: number;
  className?: string;
}> = ({ size = 'md', message, progress, className = '' }) => {
  const sizeClasses = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`flex flex-col items-center justify-center p-4 ${className}`}>
      <div className={`animate-spin rounded-full border-b-2 border-primary-600 ${sizeClasses[size]}`}></div>
      {message && (
        <p className="mt-2 text-sm text-gray-600 text-center">{message}</p>
      )}
      {typeof progress === 'number' && (
        <div className="w-full max-w-xs mt-2">
          <div className="bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 text-center mt-1">{Math.round(progress)}%</p>
        </div>
      )}
    </div>
  );
};

/**
 * Error display component with retry functionality
 */
export const ErrorDisplay: React.FC<{
  error: ErrorState;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}> = ({ error, className = '', size = 'md' }) => {
  if (!error.hasError) return null;

  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-6'
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="flex-1">
          <h3 className="text-red-800 font-medium">Error</h3>
          <p className="text-red-700 mt-1">
            {typeof error.error === 'string' ? error.error : error.error?.message || 'An unexpected error occurred'}
          </p>
          {error.context && (
            <p className="text-red-600 text-sm mt-1">Context: {error.context}</p>
          )}
          {error.canRetry && error.retryAction && (
            <button
              onClick={error.retryAction}
              className="mt-3 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Custom hook for managing data state with loading and error handling
 */
export const useDataState = <T = any>(initialData?: T) => {
  const [state, setState] = React.useState<DataState<T>>(() => 
    createInitialDataState<T>(initialData || null)
  );

  const setLoading = React.useCallback((loadingState: boolean | LoadingState, message?: string, progress?: number) => {
    setState(prev => ({
      ...prev,
      loading: typeof loadingState === 'boolean' 
        ? { isLoading: loadingState, loadingMessage: message, progress }
        : loadingState
    }));
  }, []);

  const setError = React.useCallback((error: any, context?: string, retryAction?: () => void) => {
    setState(prev => ({
      ...prev,
      error: {
        hasError: true,
        error,
        context,
        canRetry: !!retryAction,
        retryAction
      },
      loading: { isLoading: false }
    }));
  }, []);

  const setData = React.useCallback((data: T) => {
    setState(prev => ({
      ...prev,
      data,
      loading: { isLoading: false },
      error: { hasError: false },
      lastUpdated: new Date(),
      isStale: false
    }));
  }, []);

  const clearError = React.useCallback(() => {
    setState(prev => ({
      ...prev,
      error: { hasError: false }
    }));
  }, []);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    clearError
  };
};

/**
 * Retry wrapper function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    onRetry
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      if (attempt === maxRetries) {
        throw error;
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
      
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}