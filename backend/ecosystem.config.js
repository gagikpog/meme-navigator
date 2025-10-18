module.exports = {
  apps: [
    {
      name: "meme-navigator",
      script: "./dist/server.js",
      interpreter: "/root/.local/share/fnm/node-versions/v18.20.5/installation/bin/node",
      cwd: "/root/www/meme-navigator/backend",
      watch: true,
      disabele_pm2_monitoring: true,
      ignore_watch: [
        "node_modules",
        "logs",
        ".git",
        "public/*",
        // Ignore SQLite database and its journaling files to prevent restart loops
        "*.db",
        "*.db-wal",
        "*.db-shm",
        "*.sqlite",
        "*.sqlite-wal",
        "*.sqlite-shm"
      ],
      watch_options: {
        followSymlinks: false
      },
      env: {
        NODE_ENV: "development"
      },
      env_production: {
        NODE_ENV: "production"
      }
    }
  ]
}