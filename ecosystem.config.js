module.exports = {
  apps: [
    {
      name: 'summer-vacation-backend',
      script: 'dist/server.js',
      cwd: '/root/projects/SummerVacationPlanning/backend',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/root/projects/SummerVacationPlanning/logs/backend-error.log',
      out_file: '/root/projects/SummerVacationPlanning/logs/backend-out.log',
      log_file: '/root/projects/SummerVacationPlanning/logs/backend-combined.log',
      merge_logs: true,
      max_memory_restart: '1G',
      restart_delay: 4000,
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads']
    }
  ]
};