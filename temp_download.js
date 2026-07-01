const https = require('https');
const fs = require('fs');
const path = require('path');

const tempDir = path.join('c:', 'Desarrollo', 'mmapp', 'temporal');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

https.get('https://www.politorno.com.br/', (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        const match = data.match(/<link[^>]*rel=["'](?:shortcut )?icon["'][^>]*href=["']([^"']+)["']/i);
        if (match) {
            let iconUrl = match[1];
            if (!iconUrl.startsWith('http')) {
                iconUrl = 'https://www.politorno.com.br' + (iconUrl.startsWith('/') ? '' : '/') + iconUrl;
            }
            console.log('Downloading icon from:', iconUrl);
            const outFile = path.join(tempDir, 'politorno_favicon.ico');
            https.get(iconUrl, (iconRes) => {
                const file = fs.createWriteStream(outFile);
                iconRes.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log('Downloaded to:', outFile);
                });
            });
        } else {
            console.log('No icon found in HTML');
        }
    });
}).on('error', (err) => {
    console.error('Error fetching page:', err.message);
});
