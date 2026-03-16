
async function testWebhook() {
  const url = 'https://n8n.mariomojica.com/webhook-test/portfolio-leads';
  const data = {
    nombre: 'Antigravity',
    apellido: 'AI',
    correo: 'antigravity@test.com',
    interes: 'Automatización Premium'
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const text = await response.text();
    console.log('Status:', response.status);
    console.log('Response:', text);
  } catch (error) {
    console.error('Error:', error);
  }
}

testWebhook();
