module.exports = {
    apps: [{
      name: 'Student Application',
      script: 'index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      time: true,
      env: {
        NODE_ENV: 'production',
      },
      env_dev: {
        NODE_ENV: 'development',
      },
    }],
  };