const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'antigravity_key'), 'utf8');

const localFile = 'C:\\Users\\mario\\.gemini\\antigravity\\brain\\e564b8c8-5116-4c78-9597-fbc4f9635d0d\\docker_compose_demo.yml';
const remoteFile = '/opt/app/docker-compose.yml';

conn.on('ready', () => {
    console.log('✅ Connected. Uploading file...');
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const readStream = fs.createReadStream(localFile);
        const writeStream = sftp.createWriteStream(remoteFile);

        writeStream.on('close', () => {
            console.log('✅ File uploaded. Restarting docker...');
            conn.exec('cd /opt/app && docker compose up -d', (err, stream) => {
                if (err) throw err;
                stream.on('close', () => {
                    console.log('✅ Docker restarted.');
                    conn.end();
                }).on('data', (data) => {
                    process.stdout.write(data);
                });
            });
        });

        readStream.pipe(writeStream);
    });
}).on('error', (err) => {
    console.error('❌ SSH Error:', err.message);
}).connect({
    host: '46.62.208.181',
    port: 22,
    username: 'root',
    privateKey: privateKey
});
