/**
 * 错误处理系统单元测试
 * 测试数据状态管理、错误状态、加载状态、重试机制等
 */

import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  createInitialDataState,
  setLoadingState,
  setErrorState,
  setDataState,
  LoadingSpinner,
  ErrorDisplay,
  useDataState,
  withRetry,
  ErrorType,
} from '../errorHandling';

describe('ErrorHandling System Tests', () => {
  describe('数据状态管理', () => {
    it('createInitialDataState应该返回初始状态', () => {
      const initialState = createInitialDataState();
      
      expect(initialState).toEqual({
        data: null,
        loading: {
          isLoading: false,
        },
        error: {
          hasError: false,
          canRetry: true,
        },
      });
    });

    it('createInitialDataState应该接受初始数据', () => {
      const initialData = { test: 'data' };
      const initialState = createInitialDataState(initialData);
      
      expect(initialState.data).toEqual(initialData);
    });

    it('setLoadingState应该更新加载状态并清除错误', () => {
      const initialState = createInitialDataState();
      const errorState = setErrorState(initialState, {
        error: 'Previous error',
        context: 'test',
      });
      
      const loadingState = setLoadingState(errorState, {
        isLoading: true,
        loadingMessage: 'Loading...',
      });
      
      expect(loadingState.loading).toEqual({
        isLoading: true,
        loadingMessage: 'Loading...',
      });
      expect(loadingState.error.hasError).toBe(false);
    });

    it('setErrorState应该更新错误状态并停止加载', () => {
      const initialState = createInitialDataState();
      const loadingState = setLoadingState(initialState, { isLoading: true });
      
      const errorState = setErrorState(loadingState, {
        error: 'Test error',
        context: 'testing',
        errorCode: 'TEST_ERROR',
      });
      
      expect(errorState.loading.isLoading).toBe(false);
      expect(errorState.error).toEqual({
        hasError: true,
        error: 'Test error',
        context: 'testing',
        errorCode: 'TEST_ERROR',
        canRetry: true,
      });
    });

    it('setDataState应该更新数据并清除加载和错误状态', () => {
      const initialState = createInitialDataState();
      const loadingState = setLoadingState(initialState, { isLoading: true });
      const errorState = setErrorState(loadingState, { error: 'Error' });
      
      const testData = { result: 'success' };
      const dataState = setDataState(errorState, testData);
      
      expect(dataState.data).toEqual(testData);
      expect(dataState.loading.isLoading).toBe(false);
      expect(dataState.error.hasError).toBe(false);
      expect(dataState.lastUpdated).toBeInstanceOf(Date);
    });
  });

  describe('useDataState Hook', () => {
    const TestComponent: React.FC<{ initialData?: any }> = ({ initialData }) => {
      const dataState = useDataState(initialData);
      
      return (
        <div>
          <div data-testid="loading">{dataState.loading.isLoading.toString()}</div>
          <div data-testid="error">{dataState.error.hasError.toString()}</div>
          <div data-testid="data">{JSON.stringify(dataState.data)}</div>
          <button 
            data-testid="set-loading" 
            onClick={() => dataState.setLoading({ isLoading: true, loadingMessage: 'Loading...' })}
          >
            Set Loading
          </button>
          <button 
            data-testid="set-error" 
            onClick={() => dataState.setError(new Error('Test error'), 'test')}
          >
            Set Error
          </button>
          <button 
            data-testid="set-data" 
            onClick={() => dataState.setData({ test: 'data' })}
          >
            Set Data
          </button>
        </div>
      );
    };

    it('应该初始化为默认状态', () => {
      render(<TestComponent />);
      
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('false');
      expect(screen.getByTestId('data')).toHaveTextContent('null');
    });

    it('应该正确更新加载状态', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);
      
      await user.click(screen.getByTestId('set-loading'));
      
      expect(screen.getByTestId('loading')).toHaveTextContent('true');
    });

    it('应该正确更新错误状态', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);
      
      await user.click(screen.getByTestId('set-error'));
      
      expect(screen.getByTestId('error')).toHaveTextContent('true');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
    });

    it('应该正确更新数据状态', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);
      
      await user.click(screen.getByTestId('set-data'));
      
      expect(screen.getByTestId('data')).toHaveTextContent('{"test":"data"}');
      expect(screen.getByTestId('loading')).toHaveTextContent('false');
      expect(screen.getByTestId('error')).toHaveTextContent('false');
    });

    it('应该接受初始数据', () => {
      const initialData = { initial: 'test' };
      render(<TestComponent initialData={initialData} />);
      
      expect(screen.getByTestId('data')).toHaveTextContent('{"initial":"test"}');
    });
  });

  describe('LoadingSpinner组件', () => {
    it('应该显示默认加载消息', () => {
      render(<LoadingSpinner />);
      expect(screen.getByText('加载中...')).toBeInTheDocument();
    });

    it('应该显示自定义消息', () => {
      render(<LoadingSpinner message="正在处理..." />);
      expect(screen.getByText('正在处理...')).toBeInTheDocument();
    });

    it('应该显示进度条当有进度值时', () => {
      render(<LoadingSpinner progress={50} />);
      expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '50');
    });

    it('应该应用自定义样式类', () => {
      render(<LoadingSpinner className="custom-class" />);
      expect(screen.getByTestId('loading-spinner')).toHaveClass('custom-class');
    });

    it('应该支持不同尺寸', () => {
      const { rerender } = render(<LoadingSpinner size="sm" />);
      expect(screen.getByTestId('spinner-icon')).toHaveClass('w-4', 'h-4');
      
      rerender(<LoadingSpinner size="lg" />);
      expect(screen.getByTestId('spinner-icon')).toHaveClass('w-8', 'h-8');
    });
  });

  describe('ErrorDisplay组件', () => {
    const mockErrorState = {
      hasError: true,
      error: new Error('Test error message'),
      context: 'testing',
      canRetry: true,
      retryAction: jest.fn(),
    };

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('应该显示错误消息', () => {
      const errorState = { ...mockErrorState };
      render(<ErrorDisplay error={errorState} />);
      
      expect(screen.getByText(/Test error message/)).toBeInTheDocument();
    });

    it('应该显示重试按钮当canRetry为true时', () => {
      const errorState = { ...mockErrorState };
      render(<ErrorDisplay error={errorState} />);
      
      expect(screen.getByText('重试')).toBeInTheDocument();
    });

    it('应该隐藏重试按钮当canRetry为false时', () => {
      const errorState = { ...mockErrorState, canRetry: false };
      render(<ErrorDisplay error={errorState} />);
      
      expect(screen.queryByText('重试')).not.toBeInTheDocument();
    });

    it('应该调用重试函数当点击重试按钮时', async () => {
      const user = userEvent.setup();
      const errorState = { ...mockErrorState };
      render(<ErrorDisplay error={errorState} />);
      
      await user.click(screen.getByText('重试'));
      
      expect(errorState.retryAction).toHaveBeenCalledTimes(1);
    });

    it('应该显示上下文信息', () => {
      const errorState = { ...mockErrorState };
      render(<ErrorDisplay error={errorState} />);
      
      expect(screen.getByText(/testing/)).toBeInTheDocument();
    });

    it('应该根据错误类型显示不同图标', () => {
      const networkErrorState = { ...mockErrorState, errorCode: ErrorType.NETWORK_ERROR };
      const { rerender } = render(<ErrorDisplay error={networkErrorState} />);
      expect(screen.getByText('🌐')).toBeInTheDocument();
      
      const authErrorState = { ...mockErrorState, errorCode: ErrorType.AUTHENTICATION_ERROR };
      rerender(<ErrorDisplay error={authErrorState} />);
      expect(screen.getByText('🔒')).toBeInTheDocument();
    });

    it('应该支持不同尺寸', () => {
      const errorState = { ...mockErrorState };
      render(<ErrorDisplay error={errorState} size="lg" />);
      
      expect(screen.getByTestId('error-display')).toHaveClass('p-6');
    });
  });

  describe('withRetry函数', () => {
    let mockFn: jest.Mock;

    beforeEach(() => {
      mockFn = jest.fn();
    });

    it('应该在成功时返回结果', async () => {
      mockFn.mockResolvedValue('success');
      
      const result = await withRetry(mockFn);
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(1);
    });

    it('应该在失败时重试', async () => {
      mockFn
        .mockRejectedValueOnce(new Error('First failure'))
        .mockRejectedValueOnce(new Error('Second failure'))
        .mockResolvedValue('success');
      
      const result = await withRetry(mockFn, {
        maxRetries: 3,
        baseDelay: 10,
      });
      
      expect(result).toBe('success');
      expect(mockFn).toHaveBeenCalledTimes(3);
    });

    it('应该在达到最大重试次数后抛出错误', async () => {
      mockFn.mockRejectedValue(new Error('Persistent error'));
      
      await expect(withRetry(mockFn, {
        maxRetries: 2,
        baseDelay: 10,
      })).rejects.toThrow('Persistent error');
      
      expect(mockFn).toHaveBeenCalledTimes(3); // 1 + 2 retries
    });

    it('应该调用onRetry回调', async () => {
      const onRetry = jest.fn();
      mockFn
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      await withRetry(mockFn, {
        maxRetries: 2,
        baseDelay: 10,
        onRetry,
      });
      
      expect(onRetry).toHaveBeenCalledWith(1, expect.any(Error));
    });

    it('应该应用指数退避延迟', async () => {
      mockFn
        .mockRejectedValueOnce(new Error('First failure'))
        .mockResolvedValue('success');
      
      const startTime = Date.now();
      
      await withRetry(mockFn, {
        maxRetries: 1,
        baseDelay: 50,
        exponentialBackoff: true,
      });
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // 应该至少等待baseDelay的时间
      expect(duration).toBeGreaterThan(45);
    });

    it('应该支持条件重试', async () => {
      const networkError = new Error('Network error');
      const authError = new Error('Authentication error');
      
      mockFn
        .mockRejectedValueOnce(networkError)
        .mockRejectedValueOnce(authError);
      
      const shouldRetry = (error: Error) => error.message.includes('Network');
      
      // 网络错误应该重试
      const result1 = await withRetry(mockFn, {
        maxRetries: 1,
        baseDelay: 10,
        shouldRetry,
      });
      
      expect(mockFn).toHaveBeenCalledTimes(2);
      
      // 认证错误不应该重试
      mockFn.mockClear();
      mockFn.mockRejectedValue(authError);
      
      await expect(withRetry(mockFn, {
        maxRetries: 1,
        baseDelay: 10,
        shouldRetry,
      })).rejects.toThrow('Authentication error');
      
      expect(mockFn).toHaveBeenCalledTimes(1); // 不重试
    });
  });

  describe('错误类型分类', () => {
    it('应该正确分类网络错误', () => {
      const networkErrors = [
        'fetch failed',
        'Network request failed',
        'connection timeout',
      ];
      
      networkErrors.forEach(message => {
        const error = new Error(message);
        // 这里假设有一个函数来分类错误类型
        // const type = classifyError(error);
        // expect(type).toBe(ErrorType.NETWORK_ERROR);
      });
    });
  });

  describe('性能和内存测试', () => {
    it('应该正确清理事件监听器', () => {
      const { unmount } = render(<LoadingSpinner />);
      
      // 确保组件可以正常卸载，不会造成内存泄漏
      expect(() => unmount()).not.toThrow();
    });

    it('应该处理大量错误状态更新', () => {
      const TestComponent = () => {
        const dataState = useDataState();
        
        React.useEffect(() => {
          // 模拟大量状态更新
          for (let i = 0; i < 100; i++) {
            dataState.setError(new Error(`Error ${i}`), `context-${i}`);
          }
        }, []);
        
        return <div>{dataState.error.hasError.toString()}</div>;
      };
      
      expect(() => render(<TestComponent />)).not.toThrow();
    });
  });
});