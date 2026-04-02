const { execSync } = require('child_process');
try {
  const isWindows = process.platform === 'win32';
  if (isWindows) {
    execSync('FOR /F "tokens=5" %T IN (\'netstat -aon ^| findstr :5000\') DO TaskKill /F /PID %T');
    console.log("Killed port 5000");
  } else {
    execSync('lsof -t -i:5000 | xargs kill -9');
    console.log("Killed port 5000");
  }
} catch (e) {
  console.log("Port 5000 is clean.");
}
