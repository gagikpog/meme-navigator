module.exports = {
  apps: [
    {
      name: "meme-navigator",
      script: "./server.js",
      interpreter: "/run/user/0/fnm_multishells/2726_1757519885572/bin/node",
      cwd: "/root/www/meme-navigator/backend",
      watch: true,
      ignore_watch: [
        "node_modules",
        "logs",
        ".git"
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