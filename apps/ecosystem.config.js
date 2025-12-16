module.exports = {
  apps: [
    {
      name: "twitter-api",
      cwd: "./apps/server",
      script: "npm",
      args: "run start", // Uses the compiled 'dist' folder in production
      env: {
        NODE_ENV: "production",
        PORT: 3001
      }
    },
    {
      name: "twitter-web",
      cwd: "./apps/web",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};