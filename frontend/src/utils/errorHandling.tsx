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
  context?: string; // Where the error occurred
}

export interface DataState<T = any> {
  data: T | null;
  loading: LoadingState;
  error: ErrorState;
  lastUpdated?: Date;
}

/**
 * Error types for better categorization and handling
 */
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  PERMISSION_ERROR = 'PERMISSION_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

/**
 * Create initial data state
 */
export const createInitialDataState = function<T = any>(initialData: T | null = null): DataState<T> {
  return {
    data: initialData,
    loading: {
      isLoading: false,
    },
    error: {
      hasError: false,
      canRetry: true,
    },
  };
};

/**
 * Update loading state
 */
export const setLoadingState = function<T>(
  currentState: DataState<T>,
  loading: Partial<LoadingState>
): DataState<T> {
  return {
    ...currentState,
    loading: {
      ...currentState.loading,
      ...loading,
    },
    error: {
      ...currentState.error,
      hasError: false, // Clear errors when starting new loading
    },
  };
};

/**
 * Update error state
 */
export const setErrorState = function<T>(
  currentState: DataState<T>,
  error: Partial<ErrorState>
): DataState<T> {
  return {
    ...currentState,
    loading: {
      ...currentState.loading,
      isLoading: false, // Stop loading when error occurs
    },
    error: {
      ...currentState.error,
      hasError: true,
      ...error,
    },
  };
};

/**
 * Update data state on success
 */
export const setDataState = function<T>(
  currentState: DataState<T>,
  data: T
): DataState<T> {
  return {
    ...currentState,
    data,
    loading: {
      ...currentState.loading,
      isLoading: false,
    },
    error: {
      ...currentState.error,
      hasError: false,
    },
    lastUpdated: new Date(),
  };
};

/**
 * Categorize error based on error object or message
 */
export const categorizeError = (error: any): ErrorType => {
  if (!error) return ErrorType.UNKNOWN_ERROR;

  const errorMessage = typeof error === 'string' ? error : error.message || '';
  const errorName = error.name || '';

  // Network-related errors
  if (errorName === 'TypeError' && errorMessage.includes('fetch')) {
    return ErrorType.NETWORK_ERROR;
  }
  if (errorName === 'AbortError' || errorMessage.includes('timeout')) {
    return ErrorType.TIMEOUT_ERROR;
  }
  if (errorMessage.includes('Network') || errorMessage.includes('网络')) {
    return ErrorType.NETWORK_ERROR;
  }

  // API errors
  if (error.status === 401 || errorMessage.includes('Unauthorized') || errorMessage.includes('认证')) {
    return ErrorType.AUTHENTICATION_ERROR;
  }
  if (error.status === 403 || errorMessage.includes('Forbidden') || errorMessage.includes('权限')) {
    return ErrorType.PERMISSION_ERROR;
  }
  if (error.status >= 400 && error.status < 500) {
    return ErrorType.VALIDATION_ERROR;
  }
  if (error.status >= 500) {
    return ErrorType.API_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
};

/**
 * Get user-friendly error message
 */
export const getErrorMessage = (error: any, context?: string): string => {
  const errorType = categorizeError(error);
  const contextStr = context ? `[${context}] ` : '';

  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
      return `${contextStr}网络连接失败，请检查网络连接后重试`;
    case ErrorType.TIMEOUT_ERROR:
      return `${contextStr}请求超时，请稍后重试`;
    case ErrorType.AUTHENTICATION_ERROR:
      return `${contextStr}身份验证失败，请重新登录`;
    case ErrorType.PERMISSION_ERROR:
      return `${contextStr}权限不足，无法访问此数据`;
    case ErrorType.VALIDATION_ERROR:
      return `${contextStr}数据验证失败，请检查输入参数`;
    case ErrorType.API_ERROR:
      return `${contextStr}服务器暂时不可用，请稍后重试`;
    default:
      const message = typeof error === 'string' ? error : error?.message;
      return `${contextStr}${message || '发生未知错误，请稍后重试'}`;
  }
};

/**
 * Determine if error is retryable
 */
export const isRetryableError = (error: any): boolean => {
  const errorType = categorizeError(error);
  
  switch (errorType) {
    case ErrorType.NETWORK_ERROR:
    case ErrorType.TIMEOUT_ERROR:
    case ErrorType.API_ERROR:
      return true;
    case ErrorType.AUTHENTICATION_ERROR:
    case ErrorType.PERMISSION_ERROR:
    case ErrorType.VALIDATION_ERROR:
      return false;
    default:
      return true; // Default to retryable for unknown errors
  }
};

/**
 * Create error state from error object
 */
export const createErrorState = (
  error: any,
  context?: string,
  retryAction?: () => void
): ErrorState => ({
  hasError: true,
  error: typeof error === 'string' ? error : error?.message || 'Unknown error',
  errorCode: categorizeError(error),
  canRetry: isRetryableError(error),
  retryAction,
  context,
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
              style={{ width: `${Math.min(progress, 100)}%` }}
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
  showRetryButton?: boolean;
  size?: 'sm' | 'md' | 'lg';
}> = ({ error, className = '', showRetryButton = true, size = 'md' }) => {
  if (!error.hasError) return null;

  const errorMessage = getErrorMessage(error.error, error.context);
  
  const sizeClasses = {
    sm: 'text-sm p-3',
    md: 'text-base p-4',
    lg: 'text-lg p-6'
  };

  const iconSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl'
  };

  return (
    <div className={`bg-red-50 border border-red-200 rounded-cartoon-lg ${sizeClasses[size]} ${className}`}>
      <div className="flex items-start space-x-3">
        <div className={`text-red-500 ${iconSizes[size]} flex-shrink-0`}>
          ⚠️
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-red-800 mb-1">
            {error.context ? `${error.context} 错误` : '出现错误'}
          </h3>
          <p className="text-red-700 mb-3">{errorMessage}</p>
          
          {showRetryButton && error.canRetry && error.retryAction && (
            <button
              onClick={error.retryAction}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-cartoon text-sm font-medium transition-colors duration-200"
            >
              重试
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Empty state component for when no data is available
 */
export const EmptyState: React.FC<{
  icon?: string;
  title: string;
  description?: string;
  actionButton?: React.ReactNode;
  className?: string;
}> = ({ icon = '📊', title, description, actionButton, className = '' }) => {
  return (
    <div className={`text-center py-12 ${className}`}>
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-xl font-semibold text-gray-800 mb-2">{title}</h3>
      {description && (
        <p className="text-gray-600 mb-4 max-w-md mx-auto">{description}</p>
      )}
      {actionButton}
    </div>
  );
};

/**
 * Custom hook for managing data state with error handling
 */
export const useDataState = function<T = any>(initialData?: T) {
  const [state, setState] = React.useState<DataState<T>>(createInitialDataState(initialData));

  const setLoading = React.useCallback((loading: Partial<LoadingState>) => {
    setState(currentState => setLoadingState(currentState, loading));
  }, []);

  const setError = React.useCallback((error: any, context?: string, retryAction?: () => void) => {
    const errorState = createErrorState(error, context, retryAction);
    setState(currentState => setErrorState(currentState, errorState));
  }, []);

  const setData = React.useCallback((data: T) => {
    setState(currentState => setDataState(currentState, data));
  }, []);

  const reset = React.useCallback(() => {
    setState(createInitialDataState(initialData));
  }, [initialData]);

  return {
    ...state,
    setLoading,
    setError,
    setData,
    reset,
  };
};

/**
 * Retry logic with exponential backoff
 */
export const withRetry = async function<T>(
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

      if (attempt === maxRetries || !isRetryableError(error)) {
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
};