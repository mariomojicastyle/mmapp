const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();

const publicKey = fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'antigravity_key.pub'), 'utf8');

const config = {
    host: '46.62.208.181',
    port: 22,
    username: 'root',
    password: 'bEMMbhhA444X'
};

const commands = [
    // 1. Install Public Key
    `mkdir -p /root/.ssh && echo "${publicKey.trim()}" >> /root/.ssh/authorized_keys && chmod 600 /root/.ssh/authorized_keys`,

    // 2. Firewall rules
    'sudo apt update && sudo apt install ufw -y',
    'sudo ufw default deny incoming',
    'sudo ufw default allow outgoing',
    'sudo ufw allow 80/tcp',
    'sudo ufw allow 443/tcp',
    'sudo ufw allow 22/tcp',
    'echo "y" | sudo ufw enable',

    // 3. Prepare app directory
    'mkdir -p /opt/app'
];

conn.on('ready', () => {
    console.log('✅ Connected to VPS');
    let i = 0;

    const executeNext = () => {
        if (i >= commands.length) {
            console.log('✅ All Phase 1 commands executed successfully');
            conn.end();
            return;
        }

        const cmd = commands[i++];
        console.log(`🚀 Executing: ${cmd.substring(0, 50)}...`);
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code, signal) => {
                console.log(`Stream :: close :: code: ${code}`);
                executeNext();
            }).on('data', (data) => {
                console.log('STDOUT: ' + data);
            }).stderr.on('data', (data) => {
                console.log('STDERR: ' + data);
            });
        });
    };

    executeNext();
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect(config);
