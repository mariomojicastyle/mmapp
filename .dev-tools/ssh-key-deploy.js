const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'antigravity_key'), 'utf8');

const config = {
    host: '46.62.208.181',
    port: 22,
    username: 'root',
    privateKey: privateKey
};

conn.on('ready', () => {
    console.log('✅ Success! Connected to VPS using SSH KEY.');

    // Now that we confirmed the key works, let's deploy the docker-compose
    const dockerComposeContent = fs.readFileSync('C:\\Users\\mario\\.gemini\\antigravity\\brain\\e564b8c8-5116-4c78-9597-fbc4f9635d0d\\docker_compose_optimized.yml', 'utf8');

    // Escaping the content for echo
    const escapedContent = dockerComposeContent.replace(/'/g, "'\\''");

    const commands = [
        // 1. Write the new docker-compose
        `echo '${escapedContent}' > /opt/app/docker-compose.yml`,

        // 2. Restart services
        'cd /opt/app && docker compose pull && docker compose up -d --remove-orphans',

        // 3. Disable password auth last (extra safe)
        'sudo sed -i "s/PasswordAuthentication yes/PasswordAuthentication no/" /etc/ssh/sshd_config',
        'sudo sed -i "s/#PasswordAuthentication no/PasswordAuthentication no/" /etc/ssh/sshd_config',
        'sudo systemctl reload ssh'
    ];

    let i = 0;
    const executeNext = () => {
        if (i >= commands.length) {
            console.log('✅ Phase 2 (Hardening) and Phase 3 (Deployment) complete.');
            conn.end();
            return;
        }
        const cmd = commands[i++];
        console.log(`🚀 Executing: ${cmd.substring(0, 50)}...`);
        conn.exec(cmd, (err, stream) => {
            if (err) throw err;
            stream.on('close', (code) => {
                console.log(`Stream :: close :: code: ${code}`);
                executeNext();
            }).on('data', (data) => {
                process.stdout.write(data);
            });
        });
    };
    executeNext();
}).on('error', (err) => {
    console.error('❌ KEY SSH Error:', err.message);
}).connect(config);
