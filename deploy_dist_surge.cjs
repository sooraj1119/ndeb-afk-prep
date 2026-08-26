const { spawn } = require('child_process');
const surge = spawn('npx.cmd', ['surge', './dist', 'ndeb-afk-prep.surge.sh'], { shell: true });
surge.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('STDOUT:', output);
  if (output.includes('email:')) {
    surge.stdin.write('sooraj.demo.bot.2026@gmail.com\n');
  } else if (output.includes('password:')) {
    surge.stdin.write('SecureBotPass123!\n');
  }
});
surge.stderr.on('data', (data) => {
  console.error('STDERR:', data.toString());
});
surge.on('close', (code) => {
  console.log('Surge process exited with code ' + code);
});
