const { Client } = require('ssh2');
const fs = require('fs');
const path = require('path');

const conn = new Client();
const privateKey = fs.readFileSync(path.join(process.env.USERPROFILE || process.env.HOME, '.ssh', 'antigravity_key'), 'utf8');

const remoteCmd = `docker cp n8n_app:/home/node/.n8n/database.sqlite /tmp/n8n_db.sqlite && python3 -c "import sqlite3; conn=sqlite3.connect('/tmp/n8n_db.sqlite'); print(conn.execute('SELECT id, email, firstName, lastName FROM user').fetchall())"`;

conn.on('ready', () => {
    conn.exec(remoteCmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', () => conn.end())
              .on('data', (d) => process.stdout.write(d))
              .stderr.on('data', (d) => process.stderr.write(d));
    });
}).on('error', (err) => console.error(err)).connect({
    host: '46.62.208.181',
    port: 22,
    username: 'root',
    privateKey: privateKey
});
