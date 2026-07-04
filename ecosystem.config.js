module.exports = {
  apps: [
    {
      name: 'buzz-backend',
      script: './dist/src/main.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 3000,
        watch: true,
        ignore_watch: ['node_modules', 'dist', 'logs'],
      },
      // Auto-restart on crash
      autorestart: true,
      // Don't restart if crashing too fast
      exp_backoff_restart_delay: 100,
      // Log files
      log_file: './logs/combined.log',
      out_file: './logs/out.log',
      error_file: './logs/error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Kill timeout
      kill_timeout: 5000,
      // Listen timeout for cluster mode
      listen_timeout: 10000,
    },
  ],
};
