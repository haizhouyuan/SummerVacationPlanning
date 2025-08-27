import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';

interface UsePendingApprovalCountReturn {
  pendingCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export const usePendingApprovalCount = (): UsePendingApprovalCountReturn => {
  const { user } = useAuth();
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingCount = useCallback(async () => {
    // Early return if user is not a parent or not authenticated
    if (!user || user.role !== 'parent') {
      setPendingCount(0);
      setError(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await apiService.getPendingApprovalTasks() as any;
      if (response.success) {
        const tasks = response.data.tasks || [];
        const pendingTasks = tasks.filter((task: any) => task.status === 'pending');
        setPendingCount(pendingTasks.length);
      } else {
        // Don't set error for expected failures (like authentication issues)
        console.warn('Failed to fetch pending approval count:', response);
        setPendingCount(0);
      }
    } catch (error: any) {
      console.error('Error fetching pending approval count:', error);
      
      // Handle specific error types without showing errors to user
      if (error.message?.includes('403') || error.message?.includes('Forbidden')) {
        console.warn('Parent access denied - may be authentication timing issue');
        setPendingCount(0);
        setError(null); // Don't show 403 errors to user
      } else if (error.message?.includes('Network') || error.message?.includes('fetch')) {
        console.warn('Network error fetching pending approvals');
        setPendingCount(0);
        setError(null); // Don't show network errors in hook
      } else {
        setError('Unable to load pending approvals');
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch count on mount and when user changes
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Auto-refresh every 60 seconds for real-time updates (reduced frequency)
  useEffect(() => {
    if (user?.role === 'parent') {
      // Add initial delay to avoid immediate call after mount
      const timeout = setTimeout(() => {
        const interval = setInterval(fetchPendingCount, 60000); // Increased from 30s to 60s
        return () => clearInterval(interval);
      }, 5000); // Wait 5 seconds before starting auto-refresh
      
      return () => {
        clearTimeout(timeout);
      };
    }
  }, [fetchPendingCount, user?.role]);

  const refetch = useCallback(async () => {
    await fetchPendingCount();
  }, [fetchPendingCount]);

  return {
    pendingCount,
    loading,
    error,
    refetch,
  };
};