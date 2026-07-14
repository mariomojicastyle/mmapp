const fs = require('fs');
const path = require('path');

const filePath = path.join('C:', 'Users', 'mario', '.gemini', 'antigravity', 'brain', '527a8f43-af06-4ead-be6d-fd7a36c87682', '.system_generated', 'steps', '273', 'output.txt');

try {
  const content = fs.readFileSync(filePath, 'utf8');
  const response = JSON.parse(content);
  const workflow = response.data;

  // Modificar los parámetros del nodo de Baserow
  const baserowNode = workflow.nodes.find(n => n.name === 'Baserow: Guardar Lead');
  if (baserowNode) {
    console.log('Encontrado el nodo de Baserow. Modificando...');
    
    // Cambiar ID de tabla
    baserowNode.parameters.tableId = 994;

    // Cambiar IDs de campo
    const fieldMapping = {
      5557: 9527, // Apellido
      5558: 9528, // Email
      5563: 9533, // Interes
      5559: 9529, // Empresa
      5554: 9524, // Nombre
      5560: 9530, // Pais
      5561: 9531, // Telefono
      5562: 9532, // Rol
      9455: 9536, // Descripcion de la idea
      9457: 9537  // Estado CRM
    };

    const fieldValues = baserowNode.parameters.fieldsUi.fieldValues;
    fieldValues.forEach(fv => {
      const oldFieldId = fv.fieldId;
      const newFieldId = fieldMapping[oldFieldId];
      if (newFieldId) {
        fv.fieldId = newFieldId;
        console.log(`   Modificado campo ID: ${oldFieldId} ➔ ${newFieldId}`);
      } else {
        console.log(`   Advertencia: No se encontró mapeo para campo ID: ${oldFieldId}`);
      }
    });
  } else {
    console.log('ERROR: No se encontró el nodo de Baserow.');
  }

  // Guardar el payload actualizado
  const payloadPath = path.join('c:', 'Desarrollo', 'mmapp', 'scratch', 'updated_workflow_payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify(workflow, null, 2), 'utf8');
  console.log(`Payload actualizado guardado en: ${payloadPath}`);

} catch (err) {
  console.error('Error:', err.message);
}
