const { Client } = require('ssh2');
const conn = new Client();
conn.on('ready', () => {
  const cmd = process.argv.slice(2).join(' ') || 'docker ps -a';
  console.log(`Running on VPS: ${cmd}\n`);
  conn.exec(cmd, (err, stream) => {
    if (err) {
      console.error(err);
      conn.end();
      return;
    }
    stream.on('data', (data) => process.stdout.write(data.toString()));
    stream.stderr.on('data', (data) => process.stderr.write(data.toString()));
    stream.on('close', (code) => {
      console.log(`\nCommand exited with code: ${code}`);
      conn.end();
    });
  });
}).on('error', (err) => {
  console.error('Connection error:', err);
}).connect({
  host: '2.24.104.9',
  port: 22,
  username: 'root',
  password: '--Vhfpabq23821@/Mega1321@--'
});