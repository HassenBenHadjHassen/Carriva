const fs = require('fs');

let port = 3000;
try {
  const envFile = fs.readFileSync('.env', 'utf8');
  const match = envFile.match(/^PORT=(\d+)/m);
  if (match) {
    port = parseInt(match[1], 10);
  }
} catch (e) {
  console.warn('Could not read PORT from .env, defaulting to 3000');
}

module.exports = {
  apps: [
    {
      name: "carriva",
      script: "node_modules/next/dist/bin/next",
      args: `start -p ${port}`,
      instances: "1",
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
      }
    }
  ]
};
