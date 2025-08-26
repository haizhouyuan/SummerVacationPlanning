const API_BASE_URL = process.env.REACT_APP_API_URL || process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

class ApiService {
  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAuthToken();
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Task management
  async getTasks(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/tasks${queryParams ? `?${queryParams}` : ''}`);
  }

  async getTaskById(taskId: string) {
    return this.request(`/tasks/${taskId}`);
  }

  async createTask(taskData: any) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(taskId: string, updates: any) {
    return this.request(`/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteTask(taskId: string) {
    return this.request(`/tasks/${taskId}`, {
      method: 'DELETE',
    });
  }

  // Daily tasks
  async getDailyTasks(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/daily-tasks${queryParams ? `?${queryParams}` : ''}`);
  }

  async getWeeklySchedule(weekStart: string) {
    return this.request(`/daily-tasks/weekly/${weekStart}`);
  }

  async createDailyTask(dailyTaskData: any) {
    return this.request('/daily-tasks', {
      method: 'POST',
      body: JSON.stringify(dailyTaskData),
    });
  }

  async updateDailyTaskStatus(dailyTaskId: string, updates: any) {
    return this.request(`/daily-tasks/${dailyTaskId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async updateDailyTask(dailyTaskId: string, updates: any) {
    return this.updateDailyTaskStatus(dailyTaskId, updates);
  }

  async checkSchedulingConflicts(params: {
    date: string;
    plannedTime: string;
    estimatedTime: string;
    excludeTaskId?: string;
  }) {
    const queryParams = new URLSearchParams({
      date: params.date,
      plannedTime: params.plannedTime,
      estimatedTime: params.estimatedTime,
      ...(params.excludeTaskId && { excludeTaskId: params.excludeTaskId }),
    }).toString();
    return this.request(`/daily-tasks/check-conflicts?${queryParams}`);
  }

  async deleteDailyTask(dailyTaskId: string) {
    return this.request(`/daily-tasks/${dailyTaskId}`, {
      method: 'DELETE',
    });
  }

  // Recurring tasks
  async generateRecurringTasks(daysAhead?: number) {
    return this.request(`/recurring-tasks/generate${daysAhead ? `?daysAhead=${daysAhead}` : ''}`);
  }

  async getRecurringPatterns() {
    return this.request('/recurring-tasks/patterns');
  }

  async getRecurringTaskStats(days?: number) {
    return this.request(`/recurring-tasks/stats${days ? `?days=${days}` : ''}`);
  }

  async updateRecurringPattern(taskId: string, updates: any, applyToFuture: boolean = false) {
    return this.request(`/recurring-tasks/patterns/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify({ updates, applyToFuture }),
    });
  }

  async getWeeklyStats(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/daily-tasks/stats/weekly${queryParams ? `?${queryParams}` : ''}`);
  }

  // Rewards and gaming time
  async calculateGameTime(data: any) {
    return this.request('/rewards/game-time/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getTodayGameTime(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/rewards/game-time/today${queryParams ? `?${queryParams}` : ''}`);
  }

  async useGameTime(data: any) {
    return this.request('/rewards/game-time/use', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Game time exchange
  async exchangeGameTime(data: { gameType: 'normal' | 'educational'; points: number }) {
    return this.request('/rewards/game-time/exchange', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getGameTimeExchanges(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/rewards/game-time/exchanges${queryParams ? `?${queryParams}` : ''}`);
  }

  async getSpecialRewards() {
    return this.request('/rewards/special');
  }

  // Redemptions
  async getRedemptions(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/redemptions${queryParams ? `?${queryParams}` : ''}`);
  }

  async createRedemption(redemptionData: any) {
    return this.request('/redemptions', {
      method: 'POST',
      body: JSON.stringify(redemptionData),
    });
  }

  async updateRedemptionStatus(redemptionId: string, updates: any) {
    return this.request(`/redemptions/${redemptionId}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async getRedemptionStats(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/redemptions/stats${queryParams ? `?${queryParams}` : ''}`);
  }

  async getPublicDailyTasks(filters?: any) {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/daily-tasks/public${queryParams ? `?${queryParams}` : ''}`);
  }

  // Dashboard statistics
  async getDashboardStats(): Promise<any> {
    return this.request('/auth/dashboard-stats');
  }

  // Points history
  async getPointsHistory(filters?: { startDate?: string; endDate?: string; type?: string; limit?: number; offset?: number }): Promise<any> {
    const queryParams = new URLSearchParams(filters as any).toString();
    return this.request(`/auth/points-history${queryParams ? `?${queryParams}` : ''}`);
  }

  // Family management (parent only)
  async getChildren(): Promise<any> {
    return this.request('/auth/children');
  }

  async getChildStats(childId: string): Promise<any> {
    return this.request(`/auth/children/${childId}/stats`);
  }

  async getFamilyLeaderboard(): Promise<any> {
    return this.request('/auth/family-leaderboard');
  }

  // Task approval workflow (parent only)
  async getPendingApprovalTasks(): Promise<any> {
    return this.request('/daily-tasks/pending-approval');
  }

  async approveTask(dailyTaskId: string, data: { action: 'approve' | 'reject'; approvalNotes?: string; bonusPoints?: number }): Promise<any> {
    return this.request(`/daily-tasks/${dailyTaskId}/approve`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Task recommendations
  async getRecommendedTasks(filters?: any): Promise<any> {
    const queryParams = new URLSearchParams(filters).toString();
    return this.request(`/tasks/recommended${queryParams ? `?${queryParams}` : ''}`);
  }

  // Special rewards API endpoints
  async requestSpecialReward(data: {
    rewardTitle: string;
    rewardDescription?: string;
    pointsCost: number;
    notes?: string;
  }): Promise<any> {
    return this.request("/rewards/special/request", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async getSpecialRewardRequests(filters?: { status?: string; studentId?: string }): Promise<any> {
    const queryParams = filters ? new URLSearchParams(filters as any).toString() : "";
    return this.request(`/rewards/special/requests${queryParams ? `?${queryParams}` : ""}`);
  }

  async approveSpecialRedemption(requestId: string, data: { approvalNotes?: string }): Promise<any> {
    return this.request(`/rewards/special/${requestId}/approve`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async rejectSpecialRedemption(requestId: string, data: { rejectionReason: string }): Promise<any> {
    return this.request(`/rewards/special/${requestId}/reject`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  // Points Balance API endpoints
  async checkPointsLimits(data: {
    date: string;
    pointsToAdd: number;
    activityType?: string;
  }): Promise<any> {
    return this.request('/points-balance/check-limits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async addPointsWithLimits(data: {
    date: string;
    pointsToAdd: number;
    activityType: string;
    reason: string;
    dailyTaskId?: string;
  }): Promise<any> {
    return this.request('/points-balance/add-points', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getUserPointsSummary(date?: string): Promise<any> {
    const queryParams = date ? new URLSearchParams({ date }).toString() : '';
    return this.request(`/points-balance/summary${queryParams ? `?${queryParams}` : ''}`);
  }

  async getDailyPointsStatus(date?: string, activityType?: string): Promise<any> {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (activityType) params.append('activityType', activityType);
    const queryParams = params.toString();
    return this.request(`/points-balance/daily-status${queryParams ? `?${queryParams}` : ''}`);
  }

  async getWeeklyPointsStatus(date?: string): Promise<any> {
    const queryParams = date ? new URLSearchParams({ date }).toString() : '';
    return this.request(`/points-balance/weekly-status${queryParams ? `?${queryParams}` : ''}`);
  }

  async resetUserPointsLimits(data: {
    date: string;
    targetUserId?: string;
  }): Promise<any> {
    return this.request('/points-balance/reset-limits', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Points Calibration API endpoints
  async calculateCalibratedPoints(data: {
    activityType: string;
    basePoints: number;
    difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
    quality?: 'poor' | 'average' | 'good' | 'excellent';
    duration?: number;
    wordCount?: number;
    accuracy?: number;
    completedAheadOfSchedule?: boolean;
    extraEffort?: boolean;
  }): Promise<any> {
    return this.request('/points-calibration/calculate', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async autoAdjustPointsRule(activityType: string): Promise<any> {
    return this.request('/points-calibration/auto-adjust', {
      method: 'POST',
      body: JSON.stringify({ activityType }),
    });
  }

  async applySuggestedAdjustments(data: {
    activityType: string;
    adjustments: {
      basePoints?: number;
      dailyLimit?: number;
      multipliers?: any;
    };
  }): Promise<any> {
    return this.request('/points-calibration/apply-adjustments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getPointsSystemBalance(): Promise<any> {
    return this.request('/points-calibration/system-balance');
  }

  async getActivityEffectivenessAnalysis(): Promise<any> {
    return this.request('/points-calibration/activity-analysis');
  }

  async batchAdjustPointsRules(data: {
    adjustmentType: 'basePoints' | 'dailyLimit' | 'difficulty';
    adjustmentValue: number | { multiplier?: number; difficulty?: any };
  }): Promise<any> {
    return this.request('/points-calibration/batch-adjust', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }
}

export const apiService = new ApiService();