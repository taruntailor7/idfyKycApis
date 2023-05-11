module.exports = {
  apps: [{
    name: 'my-app',
    script: 'index.js',
    instances: 'max',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
  }],
};
