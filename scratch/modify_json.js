const fs = require('fs');

const inputFile = 'C:\\Users\\mario\\.gemini\\antigravity\\brain\\3e15900e-c00e-4b1a-b06f-e5cf0678e8d2\\.system_generated\\steps\\35\\output.txt';
const outputFile = 'c:\\Desarrollo\\mmapp\\scratch\\modified_workflow.json';

try {
  const rawData = fs.readFileSync(inputFile, 'utf8');
  const parsed = JSON.parse(rawData);
  
  if (!parsed.success || !parsed.data) {
    throw new Error('Invalid structure in output.txt');
  }

  const workflow = parsed.data;

  // Modificar los nodos en workflow.nodes y workflow.activeVersion.nodes
  const modifyNodes = (nodes) => {
    return nodes.map(node => {
      if (node.name === 'Baserow: Guardar Lead' && node.type === 'n8n-nodes-base.baserow') {
        const fieldValues = node.parameters.fieldsUi.fieldValues;
        
        // Verificar si ya existe el campo 9457
        const exists = fieldValues.some(f => f.fieldId === 9457);
        if (!exists) {
          fieldValues.push({
            fieldId: 9457,
            fieldValue: '3952' // ID de la opción "Prospecto"
          });
          console.log('Modificado nodo ' + node.name);
        }
      }
      return node;
    });
  };

  workflow.nodes = modifyNodes(workflow.nodes);
  if (workflow.activeVersion && workflow.activeVersion.nodes) {
    workflow.activeVersion.nodes = modifyNodes(workflow.activeVersion.nodes);
  }

  fs.writeFileSync(outputFile, JSON.stringify(workflow, null, 2), 'utf8');
  console.log('Archivo modificado escrito con éxito en ' + outputFile);
} catch (error) {
  console.error('Error:', error.message);
}
