const fs = require('fs');
const path = 'C:/Users/Usuario/Desktop/8vo/API II/CEISH-ESPOCH/src/modules/protocols/infrastructure/repositories/protocol.typeorm.repository.ts';

let content = fs.readFileSync(path, 'utf8');

// We want to add relations: ['checklist'] to findById
content = content.replace(
  /where: \{ id \} as any,/g,
  "where: { id } as any, relations: ['checklist'],"
);

fs.writeFileSync(path, content, 'utf8');
console.log('Backend patched successfully');
