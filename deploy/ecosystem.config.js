// deploy/ecosystem.config.js
// PM2 process manager — jalankan: pm2 start deploy/ecosystem.config.js
module.exports = {
  apps: [
    {
      name: "pickleball",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      cwd: __dirname + "/..",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
      },
      time: true,
    },
  ],
};