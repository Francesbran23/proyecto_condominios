const { spawn } = require('child_process');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiPort = process.env.API_PORT || '4001';
const clientPort = process.env.CLIENT_PORT || '3000';
const api = spawn(process.execPath, [path.join(root, 'back', 'conexionDataBase.js')], {
  cwd: root,
  env: {
    ...process.env,
    PORT: apiPort,
    FRONTEND_URL: process.env.FRONTEND_URL || `http://localhost:${clientPort}`,
  },
  stdio: 'inherit',
});
const frontend = spawn(process.execPath, [path.join(root, 'node_modules', 'react-scripts', 'scripts', 'start.js')], {
  cwd: root,
  env: {
    ...process.env,
    PORT: clientPort,
    BROWSER: 'none',
    REACT_APP_API_URL: process.env.REACT_APP_API_URL || `http://localhost:${apiPort}`,
  },
  stdio: 'inherit',
});

let stopping = false;

function stop(exitCode = 0) {
  if (stopping) return;
  stopping = true;
  api.kill();
  frontend.kill();
  process.exitCode = exitCode;
}

api.on('error', error => {
  console.error('Could not start the API:', error.message);
  stop(1);
});
frontend.on('error', error => {
  console.error('Could not start the React client:', error.message);
  stop(1);
});
api.on('exit', code => {
  if (!stopping) {
    console.error(`The API exited with code ${code}.`);
    stop(code || 1);
  }
});
frontend.on('exit', code => {
  if (!stopping) {
    console.error(`The React client exited with code ${code}.`);
    stop(code || 1);
  }
});

process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
