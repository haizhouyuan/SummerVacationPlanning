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
    if (!user || user.role !== 'parent') {
      setPendingCount(0);
      setError(null);
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
        setError('Failed to fetch pending approval count');
      }
    } catch (error: any) {
      console.error('Error fetching pending approval count:', error);
      setError(error.message || 'Network error');
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch count on mount and when user changes
  useEffect(() => {
    fetchPendingCount();
  }, [fetchPendingCount]);

  // Auto-refresh every 30 seconds for real-time updates
  useEffect(() => {
    if (user?.role === 'parent') {
      const interval = setInterval(fetchPendingCount, 30000);
      return () => clearInterval(interval);
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