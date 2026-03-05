const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'antigravity_key'), 'utf8');

const command = process.argv[2] || 'uptime';

conn.on('ready', () => {
    console.log(`🚀 Executing: ${command}`);
    conn.exec(command, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            conn.end();
        }).on('data', (data) => {
            process.stdout.write(data);
        }).stderr.on('data', (data) => {
            process.stderr.write(data);
        });
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect({
    host: '46.62.208.181',
    port: 22,
    username: 'root',
    privateKey: privateKey
});
