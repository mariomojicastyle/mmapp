const { Client } = require('ssh2');
const conn = new Client();

conn.on('ready', () => {
    console.log('✅ Success! Connection established.');
    conn.end();
}).on('error', (err) => {
    console.error('❌ Connection Error:', err.message);
    console.error('Context:', err.level);
}).on('keyboard-interactive', (name, instructions, lang, prompts, finish) => {
    console.log('ℹ️ Keyboard interactive requested');
    finish(['enchufeamarillo123']);
}).connect({
    host: '46.62.208.181',
    port: 22,
    username: 'root',
    password: 'enchufeamarillo123',
    tryKeyboard: true
});
