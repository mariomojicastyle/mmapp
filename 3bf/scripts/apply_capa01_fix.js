const fs = require('fs');

const paths = [
  'G:/Mi unidad/Manuales/RTA Design/Manuales 3D/manual_1_comoda_ravenna.3bm.json',
  'G:/Mi unidad/Manuales/Henn/CÔMODA/manual_1_comoda_ravenna.3bm.json',
  'C:/Desarrollo/mmapp/3bf/storage/manuales/RTA Design/Manuales 3D/manual_1_comoda_ravenna.3bm.json'
];

for (const p of paths) {
  if (!fs.existsSync(p)) continue;
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const p03 = data.pasos.find(x => x.id === 'P03');
  if (p03 && p03.multiplePlus?.capas) {
    const c01 = p03.multiplePlus.capas.find(c => c.nombre === '01');
    if (c01) {
      // 1. Asignar los herrajes correctos que pertenecen a Peça 4
      c01.herrajes = [
        { id: "Porca (5)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false },
        { id: "Porca (6)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false },
        { id: "Cavilha (87)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false },
        { id: "Cavilha (88)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false }
      ];

      // 2. Colocar Peça 4 en el suelo enfrente (offset local [0, 35, 2] cm)
      if (c01.tableros && c01.tableros[0]) {
        c01.tableros[0].offsetXCm = 0;
        c01.tableros[0].offsetYCm = 35; // Hacia adelante en el banco
        c01.tableros[0].offsetZCm = 2;  // Cota de apoyo en piso
      }
    }

    // Corregir Capa 07 si tenía Porca (5) o (6)
    const c07 = p03.multiplePlus.capas.find(c => c.nombre === '07');
    if (c07) {
      c07.herrajes = [
        { id: "Porca (7)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false },
        { id: "Porca (8)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false },
        { id: "Cavilha (79)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false },
        { id: "Cavilha (80)", ejeAproximacion: "-X", tiempoAparicion: 0, congelado: false }
      ];
    }
  }

  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
  console.log('Actualizado exitosamente:', p);
}
