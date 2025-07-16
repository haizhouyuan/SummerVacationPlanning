const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

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

  async deleteDailyTask(dailyTaskId: string) {
    return this.request(`/daily-tasks/${dailyTaskId}`, {
      method: 'DELETE',
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
}

export const apiService = new ApiService();