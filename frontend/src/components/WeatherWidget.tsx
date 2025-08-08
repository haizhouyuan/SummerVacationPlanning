import React, { useState, useEffect } from 'react';

interface WeatherData {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  icon: string;
  location: string;
  suggestion: string;
}

interface WeatherWidgetProps {
  className?: string;
}

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className = '' }) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadWeatherData();
  }, []);

  const loadWeatherData = async () => {
    try {
      setLoading(true);
      
      // Get user's location
      const getLocation = (): Promise<GeolocationPosition> => {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported'));
            return;
          }
          
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 10000,
            enableHighAccuracy: false,
            maximumAge: 300000 // 5 minutes
          });
        });
      };

      try {
        // For demo purposes, we'll use mock weather data
        // In a real app, you would use a weather API like OpenWeatherMap
        setWeather(getMockWeatherData());
      } catch (locationError) {
        // If location fails, use default city weather
        setWeather(getMockWeatherData());
      }
      
    } catch (error: any) {
      console.error('Error loading weather:', error);
      setError('无法获取天气信息');
    } finally {
      setLoading(false);
    }
  };

  const getMockWeatherData = (): WeatherData => {
    const conditions = [
      { condition: '晴天', icon: '☀️', temp: 28, suggestion: '完美的户外运动天气！适合跑步、骑行或户外游戏。' },
      { condition: '多云', icon: '⛅', temp: 25, suggestion: '适合户外活动，但也是阅读和室内学习的好时光。' },
      { condition: '小雨', icon: '🌦️', temp: 22, suggestion: '在家看书、画画或做手工是不错的选择。' },
      { condition: '雷雨', icon: '⛈️', temp: 20, suggestion: '待在室内最安全，可以做室内运动或学习新技能。' },
      { condition: '阴天', icon: '☁️', temp: 24, suggestion: '散步或轻松的户外活动都很不错。' }
    ];
    
    const randomWeather = conditions[Math.floor(Math.random() * conditions.length)];
    
    return {
      temperature: randomWeather.temp,
      condition: randomWeather.condition,
      humidity: Math.floor(Math.random() * 40) + 40, // 40-80%
      windSpeed: Math.floor(Math.random() * 15) + 5, // 5-20 km/h
      icon: randomWeather.icon,
      location: '当前位置',
      suggestion: randomWeather.suggestion
    };
  };

  const getActivitySuggestions = () => {
    if (!weather) return [];
    
    const { condition, temperature } = weather;
    
    if (condition.includes('晴') && temperature > 25) {
      return [
        { activity: '🏃‍♂️ 晨跑', emoji: '🏃‍♂️' },
        { activity: '🚴‍♀️ 骑自行车', emoji: '🚴‍♀️' },
        { activity: '🏐 户外球类运动', emoji: '🏐' },
        { activity: '🌳 公园散步', emoji: '🌳' }
      ];
    } else if (condition.includes('雨')) {
      return [
        { activity: '📚 室内阅读', emoji: '📚' },
        { activity: '🎨 绘画创作', emoji: '🎨' },
        { activity: '🧩 拼图游戏', emoji: '🧩' },
        { activity: '🎵 音乐练习', emoji: '🎵' }
      ];
    } else {
      return [
        { activity: '🚶‍♀️ 户外散步', emoji: '🚶‍♀️' },
        { activity: '📖 户外阅读', emoji: '📖' },
        { activity: '📸 摄影探索', emoji: '📸' },
        { activity: '🧘‍♀️ 瑜伽运动', emoji: '🧘‍♀️' }
      ];
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-4 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !weather) {
    return (
      <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-4 ${className}`}>
        <div className="text-center py-4">
          <div className="text-2xl mb-2">🌤️</div>
          <p className="text-sm text-cartoon-gray">{error || '天气信息不可用'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-cartoon-lg shadow-cartoon p-4 ${className}`}>
      <div className="text-center mb-4">
        <h3 className="text-lg font-semibold text-cartoon-dark font-fun mb-1">
          🌤️ 今日天气
        </h3>
        <p className="text-xs text-cartoon-gray">{weather.location}</p>
      </div>

      {/* Weather Display */}
      <div className="flex items-center justify-center space-x-4 mb-4">
        <div className="text-4xl animate-float">
          {weather.icon}
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-cartoon-dark">
            {weather.temperature}°C
          </div>
          <div className="text-sm text-cartoon-gray">
            {weather.condition}
          </div>
        </div>
      </div>

      {/* Weather Details */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="text-center p-2 bg-cartoon-light rounded">
          <div className="text-xs text-cartoon-gray">湿度</div>
          <div className="font-semibold text-cartoon-blue">
            {weather.humidity}%
          </div>
        </div>
        <div className="text-center p-2 bg-cartoon-light rounded">
          <div className="text-xs text-cartoon-gray">风速</div>
          <div className="font-semibold text-cartoon-green">
            {weather.windSpeed} km/h
          </div>
        </div>
      </div>

      {/* Activity Suggestion */}
      <div className="p-3 bg-gradient-to-r from-cartoon-blue/10 to-cartoon-green/10 rounded-cartoon mb-4">
        <h4 className="text-sm font-medium text-cartoon-dark mb-2">
          💡 今日建议
        </h4>
        <p className="text-xs text-cartoon-gray">
          {weather.suggestion}
        </p>
      </div>

      {/* Activity Options */}
      <div>
        <h4 className="text-sm font-medium text-cartoon-dark mb-2">
          🎯 推荐活动
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {getActivitySuggestions().slice(0, 4).map((activity, index) => (
            <div 
              key={index}
              className="text-xs p-2 bg-cartoon-light rounded text-center hover:bg-cartoon-blue/10 transition-colors cursor-pointer"
            >
              <div className="text-lg mb-1">{activity.emoji}</div>
              <div className="text-cartoon-gray">
                {activity.activity.replace(activity.emoji, '').trim()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Refresh Button */}
      <button
        onClick={loadWeatherData}
        className="w-full mt-3 text-xs py-2 px-3 bg-cartoon-blue/10 text-cartoon-blue rounded hover:bg-cartoon-blue/20 transition-colors"
      >
        🔄 刷新天气
      </button>
    </div>
  );
};

export default WeatherWidget;