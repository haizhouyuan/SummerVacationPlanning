import { ApiResponse, PointsRule, GameTimeConfig } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

export const pointsConfigService = {
  // Get all points rules
  async getPointsRules(): Promise<ApiResponse<{ pointsRules: PointsRule[] }>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/points-config/rules`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  // Create a new points rule
  async createPointsRule(rule: Omit<PointsRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<{ pointsRule: PointsRule }>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/points-config/rules`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rule),
    });
    return response.json();
  },

  // Update a points rule
  async updatePointsRule(ruleId: string, updates: Partial<PointsRule>): Promise<ApiResponse<{ pointsRule: PointsRule }>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/points-config/rules/${ruleId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  // Get game time configuration
  async getGameTimeConfig(): Promise<ApiResponse<{ gameTimeConfig: GameTimeConfig }>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/points-config/game-time-config`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },

  // Update game time configuration
  async updateGameTimeConfig(config: Partial<GameTimeConfig>): Promise<ApiResponse<{ gameTimeConfig: GameTimeConfig }>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/points-config/game-time-config`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    return response.json();
  },

  // Initialize default points rules
  async initializeDefaultRules(): Promise<ApiResponse<any>> {
    const token = localStorage.getItem('auth_token');
    const response = await fetch(`${API_BASE_URL}/points-config/initialize-defaults`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  },
};