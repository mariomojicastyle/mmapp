async function run() {
  const text = `¡Hola! ¡Comencemos a armar tu mueble!
Pero antes, te mostraré lo fácil que funciona nuestra herramienta interactiva tridimensional.
Al presionar con el clic izquierdo,  o con el dedo si estás en un celular, el mueble girará sobre su propio eje. 
Incluso es posible realizar acercamientos con la rueda del ratón, o con los 2 dedos en la pantalla como lo harías con una fotografía.
Puedes practicarlo en este momento........`;
  
  try {
    const res = await fetch("http://localhost:3003/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });
    
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Response data:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}

run();
